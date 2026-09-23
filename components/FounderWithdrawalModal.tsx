import React, { useState, useEffect } from 'react';
import { paymentGatewayService, PayPalGatewayConfig, AccountVerificationResult } from '../services/paymentGatewayService';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';
import { firestoreService, FUNCTIONS_BASE, auth, executeFirebasePayoutToPayPal } from '../services/firebase';

interface FounderWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableAllocation: number;
  onWithdrawalSuccess: (newPayout: {
    id: string;
    recipient: string;
    amount: number;
    type: 'Founder' | 'Contest' | 'Monetization';
    status: 'Approved' | 'Pending';
    date: string;
    approvedAt: string;
    notes: string;
    transactionHash: string;
    paypalBatchId: string;
    gateway: string;
  }) => void;
  onOpenGatewayConfig?: () => void;
}

export const FounderWithdrawalModal: React.FC<FounderWithdrawalModalProps> = ({
  isOpen,
  onClose,
  availableAllocation,
  onWithdrawalSuccess,
  onOpenGatewayConfig
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [config, setConfig] = useState<PayPalGatewayConfig>(() => paymentGatewayService.getConfig());
  const [balance, setBalance] = useState<number>(availableAllocation);

  useEffect(() => {
    setBalance(availableAllocation);
  }, [availableAllocation]);
  
  // Step 1: Account Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [accountEmailInput, setAccountEmailInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<AccountVerificationResult | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Step 2: Withdrawal Configuration State
  const [withdrawAmount, setWithdrawAmount] = useState<string>('2500');
  const [withdrawalType, setWithdrawalType] = useState<'Founder' | 'Monetization' | 'Contest'>('Founder');
  const [recipientName, setRecipientName] = useState('Janu (Founder Draw)');
  const [internalNote, setInternalNote] = useState('Executive Sovereign Equity Distribution');

  // Step 3: Execution State
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<{
    batchId: string;
    txId: string;
    amount: number;
    recipient: string;
    timestamp: string;
  } | null>(null);

  // Sync config & initialize email in Live Mode
  useEffect(() => {
    if (isOpen) {
      // Set to Live mode for real-time funds withdrawal
      const activeCfg = paymentGatewayService.saveConfig({ mode: 'live' });
      setConfig(activeCfg);
      setAccountEmailInput(activeCfg.sandboxAccountEmail || 'janujanuscreations@gmail.com');
      // Reset state on open
      setCurrentStep(1);
      setVerificationResult(null);
      setVerificationError(null);
      setExecutionError(null);
      setExecutionResult(null);
      
      // Auto-populate default withdrawal amount
      if (availableAllocation > 0) {
        setWithdrawAmount(Math.min(availableAllocation, 2500).toString());
      } else {
        setWithdrawAmount('1000');
      }
    }
  }, [isOpen, availableAllocation]);

  if (!isOpen) return null;

  // Step 1: Run Account Verification
  const handleVerifyAccount = async () => {
    setIsVerifying(true);
    setVerificationError(null);
    setVerificationResult(null);

    try {
      const result = await paymentGatewayService.verifyConnectedAccount(accountEmailInput);
      setVerificationResult(result);

      if (result.isActive) {
        bossAudio.playSubtlePing();
        triggerNeonExplosion({
          particleCount: 35,
          origin: { x: 0.5, y: 0.4 },
          intensity: 'subtle'
        });
      } else {
        setVerificationError(result.message);
      }
    } catch (err: any) {
      setVerificationError(err?.message || 'Network error verifying PayPal account status.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 3: Execute Withdrawal via PayPal
  const handleExecuteWithdrawal = async () => {
    const numAmount = parseFloat(withdrawAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setExecutionError('Please enter a valid withdrawal amount greater than $0.');
      return;
    }

    if (!accountEmailInput || !accountEmailInput.includes('@')) {
      setExecutionError('Please enter a valid PayPal account email address.');
      return;
    }

    if (!auth.currentUser && typeof (auth as any).authStateReady === 'function') {
      await (auth as any).authStateReady();
    }

    if (!auth.currentUser) {
      setExecutionError('⚠️ Please sign in with your founder account to withdraw.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
      }
      return;
    }

    setIsExecuting(true);
    setExecutionError(null);
    setVerificationError(null);

    const targetEmail = (accountEmailInput?.includes('January Rebl') || !accountEmailInput)
      ? 'janujanuscreations@gmail.com'
      : accountEmailInput;

    try {
      const res = await executeFirebasePayoutToPayPal({
        recipientEmail: targetEmail,
        amount: numAmount,
        currency: 'USD',
        note: `Janu's Creations Founder Funds Withdrawal: ${internalNote}`
      });

      if (!res || !res.batchId) {
        throw new Error('Payout request failed: No batchId returned from PayPal backend.');
      }

      const batchId = res.batchId;
      const status = res.status || 'SUCCESS';
      const now = new Date().toISOString();
      const payoutId = res.payoutId || `DRAW-${Date.now().toString().slice(-6)}`;

      // 1. Only if it succeeds: subtract the payout amount from the user's balance
      setBalance(prev => Math.max(0, +(prev - numAmount).toFixed(2)));

      setExecutionResult({
        batchId,
        txId: batchId,
        amount: numAmount,
        recipient: targetEmail,
        timestamp: now.replace('T', ' ').substring(0, 19)
      });

      bossAudio.playBigWin();
      triggerNeonExplosion({
        particleCount: 80,
        origin: { x: 0.5, y: 0.45 },
        intensity: 'grand'
      });

      // Notify parent dashboard to update pool & log
      onWithdrawalSuccess({
        id: payoutId,
        recipient: recipientName,
        amount: numAmount,
        type: withdrawalType,
        status: status as any,
        date: now.substring(0, 10),
        approvedAt: now.replace('T', ' ').substring(0, 19),
        notes: `${internalNote} (Dispersed in real-time to ${accountEmailInput})`,
        transactionHash: batchId,
        paypalBatchId: batchId,
        gateway: 'PayPal Live Production REST API'
      });
    } catch (e: any) {
      console.error('Founder withdrawal execution error:', e);
      // On error, show the error message and do not touch the balance
      setExecutionError(e?.message || 'Error executing PayPal funds withdrawal. Transaction rejected.');
    } finally {
      setIsExecuting(false);
    }
  };

  const parsedAmount = parseFloat(withdrawAmount) || 0;
  const isAmountValid = parsedAmount > 0 && (balance <= 0 || parsedAmount <= balance * 2);

  return (
    <div className="fixed inset-0 z-[140] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto selection:bg-[#FF007F]">
      <div 
        className="max-w-2xl w-full glass rounded-[2.5rem] border border-[#00FFE0]/30 p-6 sm:p-10 relative overflow-hidden bg-black/95 shadow-[0_20px_70px_rgba(0,0,0,0.9)] my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Neon Accent Top Line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#00FFE0] via-[#C084FC] to-[#FF007F]"></div>

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-6 border-b border-white/10 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-[#00FFE0]/20 border border-[#00FFE0]/40 text-[#00FFE0] text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,224,0.2)]">
                <i className="fa-brands fa-paypal text-xs"></i>
                <span>PayPal Treasury Settlement</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>LIVE PRODUCTION (Real-Time Payouts)</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-black italic text-white">
              Initiate Real-Time Withdrawal
            </h2>
            <p className="text-gray-400 text-xs font-mono">
              Sovereign funds real-time withdrawal via Live PayPal REST Payouts with connected account verification.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-white/10 cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Multi-Step Flow Indicator */}
        {!executionResult && (
          <div className="grid grid-cols-3 gap-2 my-6">
            {/* Step 1 Pill */}
            <div 
              className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                currentStep === 1
                  ? 'bg-[#00FFE0]/15 border-[#00FFE0] text-white shadow-[0_0_15px_rgba(0,255,224,0.2)]'
                  : verificationResult?.isActive
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-gray-500'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                verificationResult?.isActive
                  ? 'bg-emerald-500 text-black'
                  : currentStep === 1
                  ? 'bg-[#00FFE0] text-black'
                  : 'bg-white/10 text-gray-400'
              }`}>
                {verificationResult?.isActive ? <i className="fa-solid fa-check text-[10px]"></i> : '1'}
              </div>
              <div className="truncate">
                <span className="text-[10px] font-mono uppercase font-bold block">Step 1</span>
                <span className="text-xs font-mono font-bold truncate block">Verify Account</span>
              </div>
            </div>

            {/* Step 2 Pill */}
            <div 
              className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                currentStep === 2
                  ? 'bg-[#C084FC]/15 border-[#C084FC] text-white shadow-[0_0_15px_rgba(192,132,252,0.2)]'
                  : currentStep > 2
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-gray-500'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                currentStep > 2
                  ? 'bg-emerald-500 text-black'
                  : currentStep === 2
                  ? 'bg-[#C084FC] text-black'
                  : 'bg-white/10 text-gray-400'
              }`}>
                {currentStep > 2 ? <i className="fa-solid fa-check text-[10px]"></i> : '2'}
              </div>
              <div className="truncate">
                <span className="text-[10px] font-mono uppercase font-bold block">Step 2</span>
                <span className="text-xs font-mono font-bold truncate block">Set Allocation</span>
              </div>
            </div>

            {/* Step 3 Pill */}
            <div 
              className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                currentStep === 3
                  ? 'bg-[#FF007F]/15 border-[#FF007F] text-white shadow-[0_0_15px_rgba(255,0,127,0.2)]'
                  : 'bg-white/5 border-white/10 text-gray-500'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                currentStep === 3
                  ? 'bg-[#FF007F] text-black'
                  : 'bg-white/10 text-gray-400'
              }`}>
                3
              </div>
              <div className="truncate">
                <span className="text-[10px] font-mono uppercase font-bold block">Step 3</span>
                <span className="text-xs font-mono font-bold truncate block">Authorize & Pay</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: VERIFY CONNECTED PAYPAL ACCOUNT */}
        {currentStep === 1 && !executionResult && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase text-gray-300 font-bold flex items-center gap-2">
                  <i className="fa-solid fa-shield-check text-[#00FFE0]"></i>
                  <span>Connected PayPal Account Check (Live Production)</span>
                </label>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                  verificationResult?.isActive
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-zinc-800 border-white/20 text-gray-400'
                }`}>
                  {verificationResult?.isActive ? '✓ Verified Live Account' : 'Action Required: Verify Account'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-400 block mb-1.5">
                  Target PayPal Live Receiver Email:
                </span>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={accountEmailInput}
                    onChange={e => {
                      setAccountEmailInput(e.target.value);
                      setVerificationResult(null);
                      setVerificationError(null);
                    }}
                    placeholder="janujanuscreations@gmail.com"
                    className="flex-1 bg-black border border-white/15 focus:border-[#00FFE0] rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:shadow-[0_0_15px_rgba(0,255,224,0.2)]"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyAccount}
                    disabled={isVerifying || !accountEmailInput}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#00FFE0] via-[#38BDF8] to-[#C084FC] text-black font-mono font-black text-xs uppercase tracking-wider hover:scale-105 transition-all shadow-md shadow-[#00FFE0]/20 cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0"
                  >
                    {isVerifying ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Checking Account...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-badge-check"></i>
                        <span>Verify Account</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-gray-500">
                  <span>Validates receiver address formatting and real-time connectivity with PayPal Live Production.</span>
                </div>
              </div>
            </div>

            {/* Error Banner if Verification Failed */}
            {verificationError && (
              <div className="p-4 rounded-2xl bg-[#FF007F]/15 border border-[#FF007F]/40 text-[#FF007F] font-mono text-xs shadow-[0_0_20px_rgba(255,0,127,0.2)] space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold">
                  <i className="fa-solid fa-triangle-exclamation text-base"></i>
                  <span>Account Verification Failed</span>
                </div>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  {verificationError}
                </p>
                {onOpenGatewayConfig && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenGatewayConfig();
                    }}
                    className="text-[#00FFE0] underline text-[10px] font-bold block pt-1 hover:text-white cursor-pointer"
                  >
                    Open PayPal Gateway Configuration to re-map credentials →
                  </button>
                )}
              </div>
            )}

            {/* Success Account Verification Detail Card */}
            {verificationResult?.isActive && (
              <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-500/10 via-black to-black border border-emerald-500/40 font-mono text-xs shadow-[0_0_25px_rgba(16,185,129,0.15)] space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <i className="fa-solid fa-circle-check text-base"></i>
                    <span>Connected PayPal Live Account Ready</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    LIVE PRODUCTION (Real-Time)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                  <div className="p-2 rounded-lg bg-zinc-950 border border-white/10">
                    <span className="text-gray-500 block">Environment:</span>
                    <span className="text-emerald-300 font-bold truncate block">PayPal Live</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-white/10">
                    <span className="text-gray-500 block">Account Status:</span>
                    <span className="text-[#00FFE0] font-bold">Ready</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-white/10">
                    <span className="text-gray-500 block">Payouts Backend:</span>
                    <span className="text-emerald-200 font-bold">PayPal Live REST API</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-white/10">
                    <span className="text-gray-500 block">Recipient:</span>
                    <span className="text-white font-bold truncate block">{accountEmailInput}</span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                  Account is verified for real-time live PayPal production disbursements.
                </p>
              </div>
            )}

            {/* Step 1 Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-[10px] font-mono text-gray-400">
                {verificationResult?.isActive
                  ? '✓ Account active. Ready to configure withdrawal.'
                  : '⚠️ Must verify account status before proceeding.'}
              </span>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!verificationResult?.isActive}
                className={`px-8 py-3.5 rounded-2xl font-mono font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${
                  verificationResult?.isActive
                    ? 'bg-gradient-to-r from-[#00FFE0] via-[#38BDF8] to-[#C084FC] text-black shadow-[0_0_25px_rgba(0,255,224,0.4)] hover:scale-105'
                    : 'bg-white/10 text-gray-500 border border-white/10 cursor-not-allowed opacity-50'
                }`}
              >
                <span>Proceed to Set Allocation</span>
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: WITHDRAWAL CONFIGURATION */}
        {currentStep === 2 && !executionResult && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Allocation Source Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-[#00FFE0]/30">
                <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block mb-1">
                  Executive Allocation Pool
                </span>
                <span className="text-2xl font-mono font-black text-white">
                  ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] font-mono text-[#00FFE0] block mt-1">
                  Sovereign Founder Treasury
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10">
                <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block mb-1">
                  Verified Destination
                </span>
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-shield-check text-[#00FFE0] text-xs"></i>
                  <span className="text-xs font-mono font-bold text-white truncate block">
                    {accountEmailInput}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-emerald-300 block mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Active PayPal Live Recipient</span>
                </span>
              </div>
            </div>

            {/* Withdrawal Type */}
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-300 font-bold block mb-2">
                Withdrawal Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Founder', 'Monetization', 'Contest'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setWithdrawalType(type);
                      if (type === 'Founder') setRecipientName('Janu (Founder Draw)');
                      else if (type === 'Monetization') setRecipientName('Creator Revenue Share Pool');
                      else setRecipientName('Contest Winner Settlement');
                    }}
                    className={`p-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                      withdrawalType === type
                        ? 'bg-[#C084FC]/20 border-[#C084FC] text-white shadow-[0_0_15px_rgba(192,132,252,0.3)]'
                        : 'bg-black/60 border-white/15 text-gray-400 hover:text-white'
                    }`}
                  >
                    {type === 'Founder' ? '👑 Founder Draw' : type === 'Monetization' ? '💎 Monetization' : '🏆 Contest Pool'}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Field + Quick Presets */}
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-300 font-bold block mb-2 flex items-center justify-between">
                <span>Withdrawal Amount ($ USD)</span>
                <span className="text-emerald-300/80 font-mono text-[9px]">LIVE PRODUCTION (Real-Time Payout)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-base font-bold">$</span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/15 focus:border-[#C084FC] rounded-2xl pl-9 pr-4 py-3.5 text-base font-mono font-bold text-white focus:outline-none focus:shadow-[0_0_20px_rgba(192,132,252,0.25)]"
                />
              </div>

              {/* Quick % and Amount Chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { label: '25%', val: Math.round(balance * 0.25) },
                  { label: '50%', val: Math.round(balance * 0.5) },
                  { label: '75%', val: Math.round(balance * 0.75) },
                  { label: '100% Pool', val: Math.round(balance) },
                  { label: '$500', val: 500 },
                  { label: '$1,000', val: 1000 },
                  { label: '$2,500', val: 2500 },
                  { label: '$5,000', val: 5000 }
                ].filter(p => p.val > 0).slice(0, 6).map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setWithdrawAmount(preset.val.toString())}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#C084FC]/20 text-gray-300 hover:text-white border border-white/10 hover:border-[#C084FC]/40 text-[10px] font-mono transition-all cursor-pointer"
                  >
                    {preset.label} (${preset.val.toLocaleString()})
                  </button>
                ))}
              </div>
            </div>

            {/* Treasury Memo Note */}
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-300 font-bold block mb-2">
                Treasury Internal Note / Memo
              </label>
              <input
                type="text"
                value={internalNote}
                onChange={e => setInternalNote(e.target.value)}
                placeholder="Executive sovereign equity distribution"
                className="w-full bg-zinc-950 border border-white/15 focus:border-[#C084FC] rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none"
              />
            </div>

            {/* Step 2 Action Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-mono text-xs uppercase cursor-pointer"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                Back to Account Check
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={!isAmountValid}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#C084FC] via-[#FF007F] to-[#00FFE0] text-black font-mono font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#C084FC]/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <span>Review & Authorize (${parsedAmount.toLocaleString()})</span>
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW & AUTHORIZE EXECUTION */}
        {currentStep === 3 && !executionResult && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-6 rounded-2xl bg-zinc-950/90 border border-emerald-500/40 space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-300 font-bold flex items-center gap-1.5 block">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Pre-Disbursement Audit • LIVE PRODUCTION</span>
                  </span>
                  <h4 className="text-xl font-serif font-bold text-white italic">
                    Executive Authorization Manifest
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-mono font-black text-emerald-300">
                    ${parsedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] font-mono text-gray-400 block uppercase">Net Transfer (Real-Time)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-gray-500 block">Verified Recipient:</span>
                  <span className="text-white font-bold">{accountEmailInput}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Gateway & Network:</span>
                  <span className="text-emerald-300 font-bold">✓ PayPal Live Production REST API</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Category:</span>
                  <span className="text-white font-bold">{withdrawalType} Equity Draw</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Environment:</span>
                  <span className="text-emerald-300 font-bold">LIVE PRODUCTION (Real-Time)</span>
                </div>
              </div>

              <div className="p-3 bg-black/80 rounded-xl border border-white/10 text-[11px] font-mono text-gray-300">
                <span className="text-gray-500 block text-[9px] uppercase font-bold">Treasury Memo:</span>
                "{internalNote}"
              </div>
            </div>

            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs font-mono text-gray-400">
              <i className="fa-solid fa-lock text-[#00FFE0]"></i>
              <span>Signed by Sovereign Authority: January Rebl • PayPal Live Real-Time settlement</span>
            </div>

            {/* Error Banner if Execution Failed */}
            {executionError && (
              <div className="p-4 rounded-2xl bg-[#FF007F]/15 border border-[#FF007F]/50 text-[#FF007F] font-mono text-xs shadow-[0_0_25px_rgba(255,0,127,0.3)] space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <span>Withdrawal Execution Failed</span>
                </div>
                <p className="text-gray-200 text-xs font-sans leading-relaxed">
                  {executionError}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-gray-400">
                    No funds were deducted from your allocation balance.
                  </span>
                  <button
                    type="button"
                    onClick={() => setExecutionError(null)}
                    className="text-[#00FFE0] underline text-[11px] font-bold hover:text-white cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={isExecuting}
                className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-mono text-xs uppercase cursor-pointer"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                Edit Amount
              </button>

              <button
                type="button"
                onClick={handleExecuteWithdrawal}
                disabled={isExecuting}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-[#00FFE0] to-[#38BDF8] text-black font-mono font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_35px_rgba(16,185,129,0.4)] cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin text-sm"></i>
                    <span>Dispersing via PayPal Live REST API in Real-Time...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-bolt-lightning text-sm"></i>
                    <span>AUTHORIZE & DISPERSE (${parsedAmount.toLocaleString()})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* EXECUTION SUCCESS VIEW */}
        {executionResult && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300 py-4">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 text-2xl mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <i className="fa-solid fa-check-double"></i>
              </div>
              <h3 className="text-2xl font-serif font-black italic text-white">
                Withdrawal Dispatched (Live Production)!
              </h3>
              <p className="text-gray-300 text-xs font-mono max-w-md mx-auto">
                ${executionResult.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} has been dispatched in real-time to recipient ({executionResult.recipient}) via PayPal Live Payouts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-950 border border-emerald-500/40 font-mono text-xs space-y-3">
              <div className="flex justify-between pb-2 border-b border-white/10">
                <span className="text-gray-500">Processing Mode:</span>
                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE PRODUCTION (Real-Time)
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-white/10">
                <span className="text-gray-500">PayPal Batch ID:</span>
                <span className="text-[#00FFE0] font-bold">{executionResult.batchId}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-white/10">
                <span className="text-gray-500">Transaction ID:</span>
                <span className="text-white font-bold">{executionResult.txId}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-white/10">
                <span className="text-gray-500">Recipient Account:</span>
                <span className="text-white">{executionResult.recipient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Timestamp:</span>
                <span className="text-gray-400">{executionResult.timestamp}</span>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#00FFE0] to-[#38BDF8] text-black font-mono font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#00FFE0]/20 cursor-pointer"
              >
                Return to Founder Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
