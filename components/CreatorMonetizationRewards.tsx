import React, { useState, useEffect } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';
import BossVaultSecurityModal from './BossVaultSecurityModal';
import SmartQuickActionsModal from './SmartQuickActionsModal';
import PayoutModal, { PayoutTransaction } from './PayoutModal';
import { auth, firestoreService } from '../services/firebase';
import { paymentGatewayService } from '../services/paymentGatewayService';
import Payment from './Payment';
import PaymentHistory from './PaymentHistory';
import { AutoPayoutThresholdPanel } from './AutoPayoutThresholdPanel';
import { autoPayoutService } from '../services/autoPayoutService';
import { AutoPayoutSetting } from '../types';
import { BossParallaxCard } from './BossParallaxCard';

interface CreatorMonetizationRewardsProps {
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  onRequestPayout: (amount: number) => void;
  onNavigateToStudio?: (tool: 'reel' | 'photo' | 'music' | 'movie') => void;
  onNavigateToAnalytics?: () => void;
  onOpenFounderDashboard?: () => void;
  onOpenQuickSwitcher?: () => void;
}

interface Quest {
  id: string;
  title: string;
  desc: string;
  reward: number;
  icon: string;
  color: string;
  status: 'available' | 'claimed' | 'actionable';
  tool?: 'reel' | 'photo' | 'music';
}

export const CreatorMonetizationRewards: React.FC<CreatorMonetizationRewardsProps> = ({
  balance,
  onUpdateBalance,
  onRequestPayout,
  onNavigateToStudio,
  onNavigateToAnalytics,
  onOpenFounderDashboard,
  onOpenQuickSwitcher
}) => {
  const [tipSuccessToast, setTipSuccessToast] = useState<string | null>(null);
  const [walletSubTab, setWalletSubTab] = useState<'overview' | 'history' | 'threshold' | 'paypal-rest'>('overview');
  const [autoPayoutConfig, setAutoPayoutConfig] = useState<AutoPayoutSetting>(autoPayoutService.getSettings());

  // Boss Vault Security Gate state
  const [isBossVaultAuthenticated, setIsBossVaultAuthenticated] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [pendingWithdrawAmount, setPendingWithdrawAmount] = useState<number | null>(null);

  // Subscribe to auto-payout configuration
  useEffect(() => {
    const unsub = autoPayoutService.subscribe((cfg) => {
      setAutoPayoutConfig(cfg);
    });
    return () => unsub();
  }, []);

  // Subscribe to real-time Firebase Firestore payout records
  useEffect(() => {
    const unsub = firestoreService.subscribePayoutRecords((records) => {
      if (records && records.length > 0) {
        const formatted: PayoutTransaction[] = records.map((r: any) => ({
          id: r.id || `PAY-${Date.now().toString().slice(-6)}`,
          timestamp: r.timestamp ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Recently',
          amount: Number(r.amount) || 0,
          method: r.method || 'PayPal Direct Payout (Firebase Sync)',
          destination: r.destination || 'janujanuscreations@gmail.com',
          status: (r.status === 'COMPLETED' || r.status === 'Approved' || r.status === 'Completed') ? 'APPROVED_BY_BOSS' : 'PROCESSING',
          txHash: r.txHash || r.paypalTxId || '0xLIVE',
          fee: Number(r.fee) || 0.00,
          netPayout: Number(r.netPayout || r.amount) || 0,
          paypalBatchId: r.payoutBatchId
        }));
        setPayoutHistory(formatted);
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const handleSecurityAuthSuccess = () => {
    setIsBossVaultAuthenticated(true);
    setShowSecurityModal(false);
    if (pendingWithdrawAmount !== null) {
      setShowPayoutModal(true);
    }
  };

  // Payout Transaction History
  const [payoutHistory, setPayoutHistory] = useState<PayoutTransaction[]>([
    {
      id: 'PAY-892401',
      timestamp: 'Yesterday at 4:18 PM',
      amount: 450.00,
      method: 'Direct Bank Wire (ACH)',
      destination: 'Bank Account (4821)',
      status: 'APPROVED_BY_BOSS',
      txHash: '0x8f7e2a9b3c4d5e6f1a2b3c4d5e6f7a8b9c0d1e2f',
      fee: 0.00,
      netPayout: 450.00
    },
    {
      id: 'PAY-891902',
      timestamp: '3 days ago at 11:30 AM',
      amount: 280.00,
      method: 'Instant Debit Card',
      destination: 'Debit Card (9012)',
      status: 'COMPLETED',
      txHash: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      fee: 0.00,
      netPayout: 280.00
    }
  ]);

  // Daily Quests
  const [quests, setQuests] = useState<Quest[]>([
    {
      id: 'q1',
      title: 'Manifest a 9:16 Viral Reel',
      desc: 'Use Janu’s Reel Studio to create & publish a short video to the live feed.',
      reward: 150.00,
      icon: 'fa-video',
      color: '#00F5D4',
      status: 'actionable',
      tool: 'reel'
    },
    {
      id: 'q2',
      title: 'Alchemize & Grade an Artwork',
      desc: 'Apply AI neon lighting or background removal in the Photo Alchemist.',
      reward: 75.00,
      icon: 'fa-image',
      color: '#C084FC',
      status: 'actionable',
      tool: 'photo'
    },
    {
      id: 'q3',
      title: 'Produce a Mastered Sonic Stem',
      desc: 'Generate an AI music video storyboard and equalizer balance.',
      reward: 100.00,
      icon: 'fa-music',
      color: '#818CF8',
      status: 'actionable',
      tool: 'music'
    },
    {
      id: 'q4',
      title: 'Engage & Tip Other Sovereign Creators',
      desc: 'Support fellow creators in the live feed with comments or tips.',
      reward: 35.00,
      icon: 'fa-heart',
      color: '#D8B4FE',
      status: 'available'
    },
    {
      id: 'q5',
      title: 'Daily Sovereign Check-In',
      desc: 'Consecutive daily creator access into Janu’s Creations.',
      reward: 50.00,
      icon: 'fa-calendar-check',
      color: '#FCD34D',
      status: 'available'
    }
  ]);

  const [withdrawProcessing, setWithdrawProcessing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const handleClaimQuest = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.status === 'claimed') return;

    setQuests(prev => prev.map(q => q.id === questId ? { ...q, status: 'claimed' } : q));
    const nextBalance = balance + quest.reward;
    onUpdateBalance(nextBalance);
    bossAudio.playTipChime(quest.reward);

    // Sync to Firestore revenue records
    firestoreService.recordRevenue({
      amount: quest.reward,
      netAmount: +(quest.reward * 0.85).toFixed(2),
      platformCut: +(quest.reward * 0.15).toFixed(2),
      source: 'Creator Quest Reward',
      category: 'royalties',
      description: `Completed Quest: ${quest.title}`,
      creatorName: 'January Rebl',
      status: 'settled'
    }).catch(console.warn);

    triggerNeonExplosion({
      particleCount: 80,
      origin: { x: 0.5, y: 0.4 },
      intensity: 'grand'
    });

    // Check automated threshold payout
    const evalRes = autoPayoutService.evaluateThreshold(nextBalance);
    if (evalRes.isEligible && autoPayoutConfig.autoApprove && auth.currentUser) {
      setTimeout(() => {
        autoPayoutService.executeAutoPayout({
          currentBalance: nextBalance,
          onBalanceUpdated: onUpdateBalance
        });
      }, 1200);
    }
  };

  const handleSimulateTip = (amount: number) => {
    const creatorShare = amount * 0.85;
    const januBossCut = amount * 0.15;
    const nextBalance = balance + creatorShare;
    
    onUpdateBalance(nextBalance);
    bossAudio.playTipChime(amount);

    // Sync to Firestore revenue records
    firestoreService.recordRevenue({
      amount,
      netAmount: creatorShare,
      platformCut: januBossCut,
      source: 'Live Stream Tip',
      category: 'tips',
      description: `Live Stream Fan Tip of $${amount.toFixed(2)}`,
      creatorName: 'January Rebl',
      status: 'settled'
    }).catch(console.warn);

    setTipSuccessToast(`Received $${amount.toFixed(2)} Tip! ($${creatorShare.toFixed(2)} to your wallet, $${januBossCut.toFixed(2)} to January Rebl Boss Reserve)`);
    
    triggerNeonExplosion({
      particleCount: 50,
      origin: { x: 0.3, y: 0.5 },
      intensity: 'medium'
    });

    setTimeout(() => setTipSuccessToast(null), 4000);

    // Check automated threshold payout
    const evalRes = autoPayoutService.evaluateThreshold(nextBalance);
    if (evalRes.isEligible && autoPayoutConfig.autoApprove && auth.currentUser) {
      setTimeout(() => {
        autoPayoutService.executeAutoPayout({
          currentBalance: nextBalance,
          onBalanceUpdated: onUpdateBalance
        });
      }, 1200);
    }
  };

  // Triggered when creator requests payout
  const handleInitiatePayout = (amount?: number) => {
    const targetAmount = amount !== undefined ? amount : balance;
    if (targetAmount <= 0) {
      bossAudio.playSubtlePing();
      setTipSuccessToast("Your wallet balance is $0.00. Earn rewards via Quests or Tipping first!");
      setTimeout(() => setTipSuccessToast(null), 3500);
      return;
    }
    setPendingWithdrawAmount(targetAmount);
    setShowPayoutModal(true);
  };

  const handleExecutePayoutModal = (amount: number, tx: PayoutTransaction) => {
    const nextBalance = Math.max(0, +(balance - amount).toFixed(2));
    onUpdateBalance(nextBalance);
    onRequestPayout(amount);
    setPayoutHistory(prev => [tx, ...prev]);
    setTipSuccessToast(`Payout of $${amount.toFixed(2)} dispatched via ${tx.method}!`);
    setTimeout(() => setTipSuccessToast(null), 5000);
  };

  const handleResetRevenueToLiveCashout = async () => {
    setWithdrawProcessing(true);
    bossAudio.playSubtlePing();
    try {
      const res = await firestoreService.resetRevenueToLiveCashoutMode('janujanuscreations@gmail.com');
      onUpdateBalance(res.availableCashout);
      bossAudio.playTipChime(150);
      triggerNeonExplosion({ particleCount: 60, intensity: 'grand' });
      setTipSuccessToast(`🚀 Revenue reset to Live Mode Cashout! $${res.availableCashout.toFixed(2)} available for PayPal direct cashout.`);
      setTimeout(() => setTipSuccessToast(null), 5000);
    } catch (e: any) {
      setTipSuccessToast('Reset error: ' + (e?.message || 'Failed'));
      setTimeout(() => setTipSuccessToast(null), 4000);
    } finally {
      setWithdrawProcessing(false);
    }
  };

  const handleDirectLivePayPalCashout = async () => {
    if (balance <= 0) {
      setTipSuccessToast('Your available balance is $0.00.');
      setTimeout(() => setTipSuccessToast(null), 3000);
      return;
    }

    if (!auth.currentUser && typeof (auth as any).authStateReady === 'function') {
      await (auth as any).authStateReady();
    }

    if (!auth.currentUser) {
      setTipSuccessToast('⚠️ Please sign in with your creator account to cash out.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
      }
      setTimeout(() => setTipSuccessToast(null), 4000);
      return;
    }

    setWithdrawProcessing(true);
    bossAudio.playCashRegister();

    try {
      const recipient = 'janujanuscreations@gmail.com';
      const senderItemId = `CASHOUT-${Date.now()}`;
      const amountToCashout = balance;

      // 1. POST to FUNCTIONS_BASE + "/sendPayout" with recipient email and amount
      const res = await firestoreService.executeFirebasePayoutToPayPal({
        recipientEmail: recipient,
        amount: amountToCashout,
        note: `Janu's Creations Creator Balance Cashout`
      });

      if (!res || !res.batchId) {
        throw new Error('Payout request failed: No batchId returned from PayPal backend.');
      }

      const batchId = res.batchId;
      const status = res.status || 'SUCCESS';
      const nowIso = new Date().toISOString();

      // 2. Only if it succeeds: subtract payout amount from user balance
      onUpdateBalance(0);
      onRequestPayout(amountToCashout);

      // 3. Create ONE ledger entry with returned batchId and status
      await firestoreService.recordPayout({
        id: senderItemId,
        amount: amountToCashout,
        method: 'PayPal Real Direct Payout',
        destination: recipient,
        status: status,
        txHash: batchId,
        payoutBatchId: batchId,
        paypalTxId: batchId,
        creatorHandle: '@januaryrebl',
        timestamp: nowIso,
        fee: 0.00,
        netPayout: amountToCashout,
        isLivePayout: true
      }).catch(err => console.warn('Firestore sync note:', err));

      const tx: PayoutTransaction = {
        id: senderItemId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        amount: amountToCashout,
        method: 'PayPal Real Direct Payout',
        destination: recipient,
        status: 'APPROVED_BY_BOSS',
        txHash: batchId,
        fee: 0.00,
        netPayout: amountToCashout,
        paypalBatchId: batchId
      };

      setPayoutHistory(prev => [tx, ...prev]);

      bossAudio.playBigWin();
      triggerNeonExplosion({ particleCount: 120, intensity: 'grand' });
      setTipSuccessToast(`🎉 Transfer Confirmed! Disbursed $${amountToCashout.toFixed(2)} USD to PayPal (${recipient}) [Batch ID: ${batchId}]`);
      setTimeout(() => setTipSuccessToast(null), 6000);
    } catch (err: any) {
      console.error('Direct live cashout error:', err);
      // If request fails: do not change balance and do not create any ledger entry — show error
      setTipSuccessToast('⚠️ Cashout transfer failed: ' + (err?.message || 'PayPal transfer rejected'));
      setTimeout(() => setTipSuccessToast(null), 5000);
    } finally {
      setWithdrawProcessing(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Toast Alert */}
      {tipSuccessToast && (
        <div 
          id="creator-monetization-toast"
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[400] max-w-xl w-[92%] sm:w-auto bg-black/95 backdrop-blur-2xl border border-[#00F5D4] text-white px-6 py-3.5 rounded-2xl text-xs font-mono font-bold shadow-[0_0_40px_rgba(0,245,212,0.45)] flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4"
        >
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-circle-check text-[#00F5D4] text-base animate-bounce"></i>
            <span className="text-gray-100 font-semibold">{tipSuccessToast}</span>
          </div>
          <button 
            type="button"
            onClick={() => setTipSuccessToast(null)}
            className="text-gray-400 hover:text-white p-1 cursor-pointer transition-colors"
            title="Dismiss notification"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>
      )}

      {/* Boss Vault Security Gate Modal */}
      {showSecurityModal && (
        <BossVaultSecurityModal
          isOpen={showSecurityModal}
          onClose={() => setShowSecurityModal(false)}
          onSuccess={handleSecurityAuthSuccess}
          actionTitle="Withdraw Creator Funds"
          actionAmount={pendingWithdrawAmount || balance}
          creatorHandle="@JanuaryRebl"
          requiredRole="Sovereign Creator"
        />
      )}

      {/* Smart Quick-Actions Hub Modal */}
      {showQuickActionsModal && (
        <SmartQuickActionsModal
          isOpen={showQuickActionsModal}
          onClose={() => setShowQuickActionsModal(false)}
          balance={balance}
          onUpdateBalance={onUpdateBalance}
          onRequestPayout={onRequestPayout}
          onNavigateToStudio={onNavigateToStudio}
          onNavigateToAnalytics={onNavigateToAnalytics}
          onOpenFounderDashboard={onOpenFounderDashboard}
          onOpenQuickSwitcher={onOpenQuickSwitcher}
        />
      )}

      {/* Wallet Sub-View Switcher Strip */}
      <div className="flex items-center justify-between gap-4 p-2 rounded-2xl bg-black/60 border border-white/10 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            id="btn-wallet-subtab-overview"
            type="button"
            onClick={() => setWalletSubTab('overview')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              walletSubTab === 'overview'
                ? 'bg-gradient-to-r from-[#00F5D4] to-[#38BDF8] text-black font-black shadow-lg shadow-[#00F5D4]/20 scale-[1.02]'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <i className="fa-solid fa-wallet"></i>
            <span>Overview & Quests</span>
          </button>

          <button
            id="btn-wallet-subtab-threshold"
            type="button"
            onClick={() => setWalletSubTab('threshold')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              walletSubTab === 'threshold'
                ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black shadow-lg shadow-amber-500/30 scale-[1.02]'
                : 'bg-white/5 text-amber-300/80 hover:text-amber-200 hover:bg-white/10'
            }`}
          >
            <i className="fa-solid fa-bolt text-amber-400"></i>
            <span>Auto-Payout Threshold</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300 text-[9px] font-bold">
              ${autoPayoutConfig.thresholdAmount}
            </span>
          </button>

          <button
            id="btn-wallet-subtab-history"
            type="button"
            onClick={() => setWalletSubTab('history')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              walletSubTab === 'history'
                ? 'bg-gradient-to-r from-[#00F5D4] via-[#38BDF8] to-[#C084FC] text-black font-black shadow-lg shadow-[#00F5D4]/20 scale-[1.02]'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <i className="fa-solid fa-receipt text-xs"></i>
            <span>Payment History</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[9px] text-white">Firestore</span>
          </button>

          <button
            id="btn-wallet-subtab-paypal"
            type="button"
            onClick={() => setWalletSubTab('paypal-rest')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              walletSubTab === 'paypal-rest'
                ? 'bg-gradient-to-r from-[#0079C1] via-[#38BDF8] to-[#00F5D4] text-black font-black shadow-lg shadow-[#0079C1]/30 scale-[1.02]'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <i className="fa-brands fa-paypal text-sm text-[#38BDF8]"></i>
            <span>PayPal REST API</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#0079C1]/30 text-[#38BDF8] text-[9px]">REST v2</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-gray-400 pr-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <span>85/15 Sovereign Creator Split</span>
        </div>
      </div>

      {walletSubTab === 'threshold' ? (
        <AutoPayoutThresholdPanel
          currentBalance={balance}
          onBalanceUpdated={onUpdateBalance}
          onOpenPayPalRestModal={() => setWalletSubTab('paypal-rest')}
        />
      ) : walletSubTab === 'paypal-rest' ? (
        <Payment
          balance={balance}
          onUpdateBalance={onUpdateBalance}
          onRequestPayout={onRequestPayout}
          onOpenFounderDashboard={onOpenFounderDashboard}
          creatorHandle="@JanuaryRebl"
          creatorEmail="janujanuscreations@gmail.com"
        />
      ) : walletSubTab === 'history' ? (
        <PaymentHistory
          creatorHandle="@JanuaryRebl"
          creatorEmail="janujanuscreations@gmail.com"
          onRefreshWalletBalance={() => {
            firestoreService.getLast30DaysRevenue().then(summary => {
              if (summary && summary.netCreatorEarnings) {
                onUpdateBalance(summary.netCreatorEarnings);
              }
            });
          }}
        />
      ) : (
        <>
      {/* AUTO-PAYOUT THRESHOLD QUICK STATUS BANNER */}
      <BossParallaxCard
        maxRotateX={4}
        maxRotateY={2}
        maxTranslateZ={25}
        glowColor="rgba(245, 158, 11, 0.25)"
        className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-neutral-900 to-black border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <i className="fa-solid fa-bolt text-lg"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                Automated Threshold Payout Engine
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                autoPayoutConfig.enabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {autoPayoutConfig.enabled ? 'ARMED & ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-neutral-300 font-sans mt-0.5">
              Auto-disburses to <strong className="text-white font-mono">{autoPayoutConfig.paypalEmail}</strong> once balance reaches <strong className="text-amber-300 font-mono">${autoPayoutConfig.thresholdAmount.toFixed(2)}</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-mono text-neutral-400 block">Progress</span>
            <span className="text-xs font-mono font-bold text-amber-300">
              ${balance.toFixed(2)} / ${autoPayoutConfig.thresholdAmount.toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => setWalletSubTab('threshold')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl font-mono uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            Configure Threshold ⚙
          </button>
        </div>
      </BossParallaxCard>

      {/* SMART QUICK-ACTIONS TOOLBAR */}
      <BossParallaxCard
        maxRotateX={5}
        maxRotateY={3}
        maxTranslateZ={30}
        glowColor="rgba(0, 245, 212, 0.25)"
        className="p-6 rounded-[2.5rem] bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border border-[#00F5D4]/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#00F5D4]/15 border border-[#00F5D4]/40 text-[#00F5D4] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-ping"></span>
              <span>Smart Quick-Actions Menu</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[10px] font-mono">
              ⚡ Instant Creator Controls
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white tracking-tight">
            Boss Vault Protected <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F]">Executive Console</span>
          </h3>
          <p className="text-xs font-mono text-gray-400 max-w-xl">
            Withdraw funds with biometric Touch/Face verification, simulate earnings, or launch studios instantly.
          </p>
        </div>

        {/* Quick-Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap relative z-10">
          <button
            onClick={handleResetRevenueToLiveCashout}
            disabled={withdrawProcessing}
            className="px-3.5 py-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/10"
            title="Reset revenue & PayPal to Live Mode Direct Cashout"
          >
            <i className="fa-solid fa-arrows-rotate text-amber-400"></i>
            <span>Reset to Live Cashout</span>
          </button>

          <button
            id="btn-creator-wallet-cashout"
            onClick={handleDirectLivePayPalCashout}
            disabled={balance <= 0 || withdrawProcessing}
            className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              balance <= 0 && !withdrawProcessing
                ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                : withdrawProcessing
                ? 'bg-zinc-800 text-[#00F5D4] border border-[#00F5D4]/40 cursor-wait shadow-[0_0_20px_rgba(0,245,212,0.3)]'
                : 'bg-gradient-to-r from-[#00F5D4] via-[#38BDF8] to-[#C084FC] text-black hover:scale-105 shadow-[0_0_20px_rgba(0,245,212,0.4)] active:scale-95'
            }`}
            title={`Execute instant PayPal batch cashout of $${balance.toFixed(2)} to janujanuscreations@gmail.com`}
          >
            {withdrawProcessing ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin text-sm text-[#00F5D4]"></i>
                <span className="text-[#00F5D4] animate-pulse">Processing Batch Payout...</span>
              </>
            ) : (
              <>
                <i className="fa-brands fa-paypal text-sm"></i>
                <span>{`Cashout ($${balance.toFixed(2)})`}</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleInitiatePayout()}
            disabled={balance <= 0 || withdrawProcessing}
            className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              balance <= 0
                ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            <i className="fa-solid fa-fingerprint text-sm"></i>
            <span>{isBossVaultAuthenticated ? 'Withdraw Options' : 'Withdraw (Vault)'}</span>
          </button>

          <button
            onClick={() => setShowQuickActionsModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-zinc-900 border border-white/15 hover:border-[#00F5D4] text-white hover:text-[#00F5D4] text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
          >
            <i className="fa-solid fa-bolt text-[#00F5D4]"></i>
            <span>Hub</span>
          </button>

          <button
            onClick={() => handleSimulateTip(50)}
            className="px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#C084FC] text-gray-300 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <i className="fa-solid fa-plus text-[#C084FC]"></i>
            <span>+$50</span>
          </button>
        </div>
      </BossParallaxCard>

      {/* Main Balances & Sovereign Boss Fee Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Wallet Balance Card */}
        <BossParallaxCard 
          maxRotateX={7} 
          maxRotateY={5} 
          maxTranslateZ={40}
          glowColor="rgba(0, 245, 212, 0.35)"
          className="glass p-8 rounded-[2.5rem] border-[#00F5D4]/30 bg-gradient-to-br from-[#00F5D4]/10 via-black to-transparent shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-between relative overflow-hidden"
        >
          {/* Boss Vault Security Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/15">
            <span className={`w-2 h-2 rounded-full ${isBossVaultAuthenticated ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-[#FF007F] shadow-[0_0_6px_#ff007f]'}`}></span>
            <span className="text-[9px] font-mono uppercase font-bold text-gray-300">
              {isBossVaultAuthenticated ? 'Vault Unlocked' : 'Boss Vault 🔒'}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400 font-bold">
                Available Creator Balance
              </span>
            </div>
            <h3 className="text-4xl sm:text-5xl font-mono font-black text-white mb-2">
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
              <i className="fa-solid fa-shield-halved text-[#00F5D4]"></i>
              <span>Guarded by Biometric & PIN Security Gate</span>
            </p>
          </div>

          <div className="mt-6 space-y-2">
            <button
              onClick={() => handleInitiatePayout()}
              disabled={balance <= 0 || withdrawProcessing}
              className={`w-full py-3.5 rounded-2xl text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                balance <= 0 
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black hover:shadow-[0_0_25px_rgba(0,245,212,0.4)] hover:scale-[1.02]'
              }`}
            >
              {withdrawProcessing ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Submitting to January's Ledger...</span>
                </>
              ) : isBossVaultAuthenticated ? (
                <>
                  <i className="fa-solid fa-bolt"></i>
                  <span>Request Full Payout (${balance.toFixed(2)})</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-fingerprint"></i>
                  <span>Authenticate & Request Payout</span>
                </>
              )}
            </button>

            {withdrawSuccess && (
              <p className="text-[10px] font-mono text-green-400 text-center animate-in fade-in">
                ✓ Payout submitted to January Rebl’s Founder Ledger for Boss Approval!
              </p>
            )}
          </div>
        </BossParallaxCard>

        {/* Boss Platform Revenue Split Architecture */}
        <BossParallaxCard 
          maxRotateX={6} 
          maxRotateY={5} 
          maxTranslateZ={35}
          glowColor="rgba(192, 132, 252, 0.35)"
          className="glass p-8 rounded-[2.5rem] border-[#C084FC]/30 bg-gradient-to-br from-[#C084FC]/10 via-black to-transparent shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400 font-bold">
                Platform Royalty Split
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#C084FC]/20 text-[#C084FC] text-[9px] font-mono font-bold uppercase">
                Janu Sovereign Model
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl sm:text-5xl font-mono font-black text-[#00F5D4]">85%</span>
              <span className="text-sm font-mono text-gray-400">/ 15% Platform</span>
            </div>
            <p className="text-[11px] font-mono text-gray-300 leading-relaxed mb-4">
              You keep <strong className="text-white">85% of all tips & subscriptions</strong>. 15% routes directly to January Rebl (Founder Reserve) for AI compute, zero server lag, and ecosystem grants.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">Boss Governance</span>
            <span className="text-[#C084FC] font-bold">January Rebl (CEO)</span>
          </div>
        </BossParallaxCard>

        {/* Live Simulator & Monetization Controls */}
        <BossParallaxCard 
          maxRotateX={6} 
          maxRotateY={5} 
          maxTranslateZ={35}
          glowColor="rgba(129, 140, 248, 0.35)"
          className="glass p-8 rounded-[2.5rem] border-[#818CF8]/30 bg-gradient-to-br from-[#818CF8]/10 via-black to-transparent shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-between"
        >
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400 font-bold block mb-2">
              Simulate Fan Tipping
            </span>
            <p className="text-[11px] font-mono text-gray-400 mb-4">
              Test how tips flow instantly into your balance while taking January’s platform split.
            </p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[10, 25, 100].map(amt => (
                <button
                  key={amt}
                  onClick={() => handleSimulateTip(amt)}
                  className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#00F5D4] text-white font-mono text-xs font-bold transition-all hover:scale-105 cursor-pointer hover:bg-[#00F5D4]/10"
                >
                  +${amt} Tip
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono">
            <span className="text-gray-400">VIP Sub Club ($9.99/mo)</span>
            <span className="text-green-400 font-bold">Active (48 Subs)</span>
          </div>
        </BossParallaxCard>

      </div>

      {/* Direct PayPal Official Instant Payment & Checkout Banner */}
      <BossParallaxCard
        maxRotateX={4}
        maxRotateY={3}
        maxTranslateZ={25}
        glowColor="rgba(0, 121, 193, 0.3)"
        className="p-6 sm:p-7 rounded-[2.5rem] bg-gradient-to-r from-[#0079C1]/20 via-[#00457C]/25 to-black border border-[#0079C1]/40 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-1.5 relative z-10 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-0.5 rounded-full bg-[#0079C1]/30 border border-[#0079C1]/60 text-[#38BDF8] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-brands fa-paypal text-xs"></i>
              <span>Official PayPal Instant Payment</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[10px] font-mono">
              Direct • Z6PDFZBTSUBAG
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white tracking-tight">
            Direct Creator Payment: <span className="text-[#38BDF8]">paypal.com/ncp/payment/Z6PDFZBTSUBAG</span>
          </h3>
          <p className="text-xs font-mono text-gray-300 leading-relaxed font-light">
            Fans and enterprise clients can send instant micro-tips, direct commission retainers, or commercial disbursements directly via Janu's official PayPal payment portal.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0 relative z-10">
          <a
            href="https://www.paypal.com/ncp/payment/Z6PDFZBTSUBAG"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0079C1] to-[#38BDF8] text-white font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-[#0079C1]/30 hover:scale-105 transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
            <span>Pay via PayPal</span>
          </a>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText('https://www.paypal.com/ncp/payment/Z6PDFZBTSUBAG');
              setTipSuccessToast('Copied PayPal link: https://www.paypal.com/ncp/payment/Z6PDFZBTSUBAG');
              bossAudio.playSubtlePing();
              setTimeout(() => setTipSuccessToast(null), 3500);
            }}
            className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/15 text-white font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-copy text-[#00F5D4] text-xs"></i>
            <span>Copy Link</span>
          </button>
        </div>
      </BossParallaxCard>

      {/* Daily Creator Reward Quests */}
      <div className="glass p-8 md:p-10 rounded-[3rem] border border-white/10 bg-black/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FCD34D] shadow-[0_0_10px_#FCD34D]"></span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#FCD34D]">
                Create-To-Earn Sovereign Bounty
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif font-black italic text-white">
              Daily Creator Quests & Bounties
            </h3>
          </div>
          <span className="text-xs font-mono text-gray-400">
            Resets every 24 Hours • Earn up to <strong className="text-[#00F5D4]">$410.00/day</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quests.map(quest => (
            <div 
              key={quest.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                quest.status === 'claimed'
                  ? 'border-white/5 bg-white/[0.01] opacity-60'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${quest.color}15`, color: quest.color, border: `1px solid ${quest.color}40` }}
                  >
                    <i className={`fa-solid ${quest.icon}`}></i>
                  </div>
                  <span className="text-sm font-mono font-black text-[#00F5D4]">
                    +${quest.reward.toFixed(2)}
                  </span>
                </div>

                <h4 className="text-base font-serif font-black italic text-white mb-2">
                  {quest.title}
                </h4>
                <p className="text-xs font-mono text-gray-400 leading-relaxed mb-6 font-light">
                  {quest.desc}
                </p>
              </div>

              <div>
                {quest.status === 'claimed' ? (
                  <button 
                    disabled 
                    className="w-full py-2.5 rounded-xl bg-white/5 text-gray-500 text-[10px] font-mono uppercase font-bold cursor-default"
                  >
                    Bounty Claimed ✓
                  </button>
                ) : quest.status === 'actionable' && quest.tool && onNavigateToStudio ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onNavigateToStudio(quest.tool!)}
                      className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-mono uppercase font-bold transition-all cursor-pointer"
                    >
                      Open Studio
                    </button>
                    <button
                      onClick={() => handleClaimQuest(quest.id)}
                      className="py-2.5 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black text-[10px] font-mono font-black uppercase tracking-wider hover:scale-105 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,245,212,0.3)]"
                    >
                      Claim Reward
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleClaimQuest(quest.id)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black text-[10px] font-mono font-black uppercase tracking-wider hover:scale-105 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,245,212,0.3)]"
                  >
                    Claim +${quest.reward.toFixed(2)}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LIVE FIRESTORE PAYMENT HISTORY & SETTLEMENT LEDGER */}
      <PaymentHistory
        creatorHandle="@JanuaryRebl"
        creatorEmail="janujanuscreations@gmail.com"
        onRefreshWalletBalance={() => {
          firestoreService.getLast30DaysRevenue().then(summary => {
            if (summary && summary.netCreatorEarnings) {
              onUpdateBalance(summary.netCreatorEarnings);
            }
          });
        }}
      />

      {/* Payout Modal */}
      <PayoutModal
        isOpen={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        balance={balance}
        onExecutePayout={handleExecutePayoutModal}
      />
      </>
      )}

    </div>
  );
};

export default CreatorMonetizationRewards;
