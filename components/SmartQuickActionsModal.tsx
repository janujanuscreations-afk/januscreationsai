import React, { useState } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';
import BossVaultSecurityModal from './BossVaultSecurityModal';

interface SmartQuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRequestPayout: (amount: number) => void;
  onNavigateToStudio?: (tool: 'reel' | 'photo' | 'music') => void;
  onNavigateToAnalytics?: () => void;
  onOpenFounderDashboard?: () => void;
  onOpenQuickSwitcher?: () => void;
}

export const SmartQuickActionsModal: React.FC<SmartQuickActionsModalProps> = ({
  isOpen,
  onClose,
  balance,
  onUpdateBalance,
  onRequestPayout,
  onNavigateToStudio,
  onNavigateToAnalytics,
  onOpenFounderDashboard,
  onOpenQuickSwitcher
}) => {
  const [isBossVaultAuthenticated, setIsBossVaultAuthenticated] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showWithdrawConsole, setShowWithdrawConsole] = useState(false);

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState(balance > 0 ? balance.toString() : '500');
  const [payoutMethod, setPayoutMethod] = useState<'bank' | 'crypto' | 'stripe' | 'escrow'>('bank');
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle clicking "Withdraw Funds"
  const handleInitiateWithdraw = () => {
    if (!isBossVaultAuthenticated) {
      // Force biometrics / passcode authentication check
      setShowSecurityModal(true);
    } else {
      // Already authenticated in current session
      setShowWithdrawConsole(true);
      bossAudio.playSubtlePing();
    }
  };

  const handleSecuritySuccess = () => {
    setIsBossVaultAuthenticated(true);
    setShowSecurityModal(false);
    setShowWithdrawConsole(true);
    bossAudio.playTipChime(100);
  };

  const handleExecuteWithdrawal = () => {
    const amount = Number(withdrawAmount) || balance;
    if (amount <= 0 || amount > balance) return;

    setIsProcessingWithdraw(true);
    bossAudio.playSubtlePing();

    setTimeout(() => {
      setIsProcessingWithdraw(false);
      onRequestPayout(amount);
      setWithdrawSuccessMsg(`✓ Successfully authorized $${amount.toFixed(2)} payout via Boss Vault!`);

      triggerNeonExplosion({
        particleCount: 80,
        origin: { x: 0.5, y: 0.4 },
        intensity: 'grand'
      });

      bossAudio.playTipChime(100);

      setTimeout(() => {
        setWithdrawSuccessMsg(null);
        setShowWithdrawConsole(false);
        onClose();
      }, 2500);
    }, 1200);
  };

  const handleSimulateTipInflow = () => {
    const boostAmount = 50.00;
    const creatorCut = boostAmount * 0.85;
    onUpdateBalance(balance + creatorCut);
    bossAudio.playTipChime(50);
    triggerNeonExplosion({
      particleCount: 40,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'medium'
    });
  };

  return (
    <>
      {/* Boss Vault Security Biometric / Passcode Modal */}
      {showSecurityModal && (
        <BossVaultSecurityModal
          isOpen={showSecurityModal}
          onClose={() => setShowSecurityModal(false)}
          onSuccess={handleSecuritySuccess}
          actionTitle="Withdraw Creator Funds"
          actionAmount={balance}
          creatorHandle="@JanuaryRebl"
          requiredRole="Master Creator"
        />
      )}

      {/* Main Smart Quick-Actions Modal */}
      <div className="fixed inset-0 z-[450] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-gradient-to-tr from-[#FF007F]/15 via-[#C084FC]/15 to-[#00F5D4]/20 rounded-full blur-[140px] pointer-events-none animate-pulse"></div>

        <div className="w-full max-w-2xl bg-zinc-950/95 border border-[#00F5D4]/40 rounded-[2.5rem] p-6 sm:p-8 space-y-6 relative shadow-[0_0_60px_rgba(0,245,212,0.25)] overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF007F] via-[#C084FC] to-[#00F5D4] p-0.5 shadow-lg">
                <div className="w-full h-full rounded-[14px] bg-black flex items-center justify-center text-white">
                  <i className="fa-solid fa-bolt text-lg text-[#00F5D4] animate-pulse"></i>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white tracking-tight">
                    Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F]">Quick-Actions</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00F5D4]/15 border border-[#00F5D4]/40 text-[#00F5D4] font-mono text-[9px] font-bold uppercase">
                    Creator Hub
                  </span>
                </div>
                <p className="text-xs font-mono text-gray-400">
                  Instant executive commands, secured payouts & creative shortcuts
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Current Creator Balance Strip */}
          <div className="p-4 sm:p-5 rounded-2xl bg-black/80 border border-white/10 flex items-center justify-between gap-4 relative z-10 shadow-inner">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold block">
                Available Creator Balance
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-mono font-black text-white">
                  ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-mono text-green-400 font-bold">
                  85% Net Share
                </span>
              </div>
            </div>

            {/* Boss Vault Security Status Indicator */}
            <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 px-3.5 py-2 rounded-2xl">
              <span className={`w-2.5 h-2.5 rounded-full ${isBossVaultAuthenticated ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-[#FF007F] shadow-[0_0_8px_#ff007f]'}`}></span>
              <div className="text-right">
                <span className="text-[9px] font-mono uppercase text-gray-400 block font-bold">Boss Vault</span>
                <span className={`text-[10px] font-mono font-bold ${isBossVaultAuthenticated ? 'text-green-400' : 'text-[#FF007F]'}`}>
                  {isBossVaultAuthenticated ? 'Unlocked (Active)' : 'Locked (Biometric)'}
                </span>
              </div>
            </div>
          </div>

          {/* ================= WITHDRAWAL CONSOLE (Unlocked after Auth) ================= */}
          {showWithdrawConsole ? (
            <div className="space-y-4 p-5 rounded-2xl bg-black/90 border border-[#00F5D4]/50 relative z-10 animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00F5D4]">
                  <i className="fa-solid fa-lock-open"></i>
                  <span className="uppercase tracking-wider">Boss Vault Authorized: Execute Payout</span>
                </div>
                <button
                  onClick={() => setShowWithdrawConsole(false)}
                  className="text-xs font-mono text-gray-400 hover:text-white"
                >
                  ← Back to Menu
                </button>
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-300 block">
                  Withdrawal Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">$</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={balance}
                    min={1}
                    className="w-full bg-zinc-900 border border-white/20 rounded-2xl py-3 pl-8 pr-24 text-lg font-mono font-bold text-white focus:border-[#00F5D4] focus:outline-none"
                  />
                  <button
                    onClick={() => setWithdrawAmount(balance.toString())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#00F5D4] hover:text-black text-[10px] font-mono font-bold uppercase transition-colors"
                  >
                    Max (${balance.toFixed(0)})
                  </button>
                </div>
              </div>

              {/* Payout Destination Selector */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-300 block">
                  Payout Destination Routing
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'bank', label: 'Bank ACH', icon: 'fa-building-columns' },
                    { id: 'stripe', label: 'Stripe Express', icon: 'fa-stripe' },
                    { id: 'crypto', label: 'USDC / Solana', icon: 'fa-coins' },
                    { id: 'escrow', label: 'Boss Escrow', icon: 'fa-vault' }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPayoutMethod(m.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        payoutMethod === m.id
                          ? 'bg-[#00F5D4]/15 border-[#00F5D4] text-[#00F5D4] font-bold shadow-md'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <i className={`fa-solid ${m.icon} block text-sm mb-1`}></i>
                      <span className="text-[10px] font-mono">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 text-xs font-mono space-y-1 text-gray-300">
                <div className="flex justify-between">
                  <span>Gross Withdrawal:</span>
                  <strong className="text-white">${Number(withdrawAmount || 0).toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-gray-400 text-[11px]">
                  <span>January Rebl Boss Governance (15% included):</span>
                  <span className="text-[#C084FC]">Zero Additional Fee</span>
                </div>
                <div className="flex justify-between text-green-400 font-bold border-t border-white/10 pt-1 mt-1">
                  <span>Net Dispatched to Your Wallet:</span>
                  <span>${Number(withdrawAmount || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  onClick={handleExecuteWithdrawal}
                  disabled={isProcessingWithdraw || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > balance}
                  className={`w-full py-3.5 rounded-2xl font-mono font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    Number(withdrawAmount) <= 0 || Number(withdrawAmount) > balance
                      ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F] text-black hover:scale-[1.02] shadow-[0_0_25px_rgba(0,245,212,0.4)]'
                  }`}
                >
                  {isProcessingWithdraw ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Dispatched via Boss Vault Protocol...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-bolt"></i>
                      <span>Confirm & Disperse ${Number(withdrawAmount || 0).toFixed(2)}</span>
                    </>
                  )}
                </button>

                {withdrawSuccessMsg && (
                  <p className="text-xs font-mono text-green-400 text-center mt-2 animate-in fade-in">
                    {withdrawSuccessMsg}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* ================= SMART QUICK-ACTIONS GRID ================= */
            <div className="space-y-4 relative z-10">
              
              {/* PRIMARY FEATURED ACTION: WITHDRAW FUNDS WITH BOSS VAULT LOCK */}
              <div
                onClick={handleInitiateWithdraw}
                className="p-5 rounded-3xl bg-gradient-to-r from-zinc-900 via-black to-zinc-900 border-2 border-[#00F5D4]/40 hover:border-[#00F5D4] hover:shadow-[0_0_30px_rgba(0,245,212,0.3)] transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 px-3 py-1 bg-[#FF007F]/20 border-b border-l border-[#FF007F]/40 text-[#FF007F] text-[9px] font-mono font-bold uppercase rounded-bl-2xl flex items-center gap-1">
                  <i className="fa-solid fa-shield-halved"></i>
                  <span>Biometric Protected</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#00F5D4]/10 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4] text-2xl group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-money-bill-transfer"></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-serif font-black italic text-white group-hover:text-[#00F5D4] transition-colors">
                          Withdraw Creator Funds
                        </h4>
                        <i className="fa-solid fa-fingerprint text-[#00F5D4] text-xs animate-pulse"></i>
                      </div>
                      <p className="text-xs font-mono text-gray-400">
                        {isBossVaultAuthenticated 
                          ? '✓ Boss Vault Unlocked • Tap to open instant payout console' 
                          : 'Requires quick Biometric (Touch/Face) or Passcode check'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-block px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-mono font-bold text-xs uppercase tracking-wider">
                      {isBossVaultAuthenticated ? 'Open Console' : 'Authenticate & Withdraw'}
                    </span>
                    <i className="fa-solid fa-arrow-right text-[#00F5D4] group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </div>
              </div>

              {/* SECONDARY QUICK ACTIONS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* 2. Boost Revenue Stream */}
                <button
                  onClick={handleSimulateTipInflow}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#C084FC] hover:bg-white/[0.06] text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C084FC]/15 text-[#C084FC] flex items-center justify-center text-base">
                      <i className="fa-solid fa-bolt"></i>
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold text-white block group-hover:text-[#C084FC]">
                        Simulate Fan Tip Inflow
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">+$50.00 Micro-Transaction</span>
                    </div>
                  </div>
                  <i className="fa-solid fa-plus text-xs text-gray-500 group-hover:text-[#C084FC]"></i>
                </button>

                {/* 3. Launch 9:16 Reel Studio */}
                <button
                  onClick={() => {
                    onClose();
                    if (onNavigateToStudio) onNavigateToStudio('reel');
                  }}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#FF007F] hover:bg-white/[0.06] text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FF007F]/15 text-[#FF007F] flex items-center justify-center text-base">
                      <i className="fa-solid fa-clapperboard"></i>
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold text-white block group-hover:text-[#FF007F]">
                        Quick Launch Reel Studio
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">9:16 Viral Video Editor</span>
                    </div>
                  </div>
                  <i className="fa-solid fa-arrow-up-right text-xs text-gray-500 group-hover:text-[#FF007F]"></i>
                </button>

                {/* 4. Launch Photo Alchemist */}
                <button
                  onClick={() => {
                    onClose();
                    if (onNavigateToStudio) onNavigateToStudio('photo');
                  }}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#00F5D4] hover:bg-white/[0.06] text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00F5D4]/15 text-[#00F5D4] flex items-center justify-center text-base">
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold text-white block group-hover:text-[#00F5D4]">
                        Photo & Art Alchemist
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">AI Lighting & 8K Upscale</span>
                    </div>
                  </div>
                  <i className="fa-solid fa-arrow-up-right text-xs text-gray-500 group-hover:text-[#00F5D4]"></i>
                </button>

                {/* 5. Advanced Analytics Hub */}
                <button
                  onClick={() => {
                    onClose();
                    if (onNavigateToAnalytics) onNavigateToAnalytics();
                  }}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#00F5D4] hover:bg-white/[0.06] text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00F5D4]/15 text-[#00F5D4] flex items-center justify-center text-base">
                      <i className="fa-solid fa-chart-line"></i>
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold text-white block group-hover:text-[#00F5D4]">
                        Advanced Analytics
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">Retention Curves & Traffic</span>
                    </div>
                  </div>
                  <i className="fa-solid fa-arrow-up-right text-xs text-gray-500 group-hover:text-[#00F5D4]"></i>
                </button>

                {/* 6. Founder Boss Governance Oversight */}
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenFounderDashboard) onOpenFounderDashboard();
                  }}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#FCD34D] hover:bg-white/[0.06] text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FCD34D]/15 text-[#FCD34D] flex items-center justify-center text-base">
                      <i className="fa-solid fa-crown"></i>
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold text-white block group-hover:text-[#FCD34D]">
                        Boss Governance Ledger
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">January Rebl Vault Audit</span>
                    </div>
                  </div>
                  <i className="fa-solid fa-arrow-up-right text-xs text-gray-500 group-hover:text-[#FCD34D]"></i>
                </button>

                {/* 7. Quick Switcher Command Palette (Cmd+K) */}
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenQuickSwitcher) onOpenQuickSwitcher();
                  }}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#00F5D4] hover:bg-white/[0.06] text-left transition-all cursor-pointer flex items-center justify-between group sm:col-span-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00F5D4]/15 text-[#00F5D4] flex items-center justify-center text-base">
                      <i className="fa-solid fa-magnifying-glass"></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white block group-hover:text-[#00F5D4]">
                          Quick Switcher Command Palette
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300 text-[9px] font-mono font-bold">
                          ⌘K
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">Search studios, metrics, and jump anywhere</span>
                    </div>
                  </div>
                  <i className="fa-solid fa-arrow-up-right text-xs text-gray-500 group-hover:text-[#00F5D4]"></i>
                </button>

              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-gray-500 relative z-10">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4]"></span>
              <span>256-Bit Boss Vault Protocol</span>
            </span>
            <span>All withdrawals routed with zero latency</span>
          </div>

        </div>
      </div>
    </>
  );
};

export default SmartQuickActionsModal;
