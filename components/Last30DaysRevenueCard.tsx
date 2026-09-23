import React, { useState, useEffect } from 'react';
import { firestoreService, ensureAuth, auth } from '../services/firebase';
import { Last30DaysRevenueSummary, RevenueRecord } from '../types';
import { bossAudio } from '../utils/soundEffects';
import { triggerNeonExplosion } from '../utils/confetti';

interface Last30DaysRevenueCardProps {
  onOpenFounderVault?: () => void;
  onOpenAnalytics?: () => void;
  onOpenMonetize?: () => void;
  className?: string;
  compact?: boolean;
  externalSummary?: Last30DaysRevenueSummary | null;
  onSummaryChange?: (summary: Last30DaysRevenueSummary) => void;
}

export const Last30DaysRevenueCard: React.FC<Last30DaysRevenueCardProps> = ({
  onOpenFounderVault,
  onOpenAnalytics,
  onOpenMonetize,
  className = '',
  compact = false,
  externalSummary,
  onSummaryChange
}) => {
  const [summary, setSummary] = useState<Last30DaysRevenueSummary | null>(externalSummary || null);
  const [isLoading, setIsLoading] = useState<boolean>(!externalSummary);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showLedgerDrawer, setShowLedgerDrawer] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'tips' | 'royalties' | 'contests' | 'gateway'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<{ date: string; amount: number; label: string } | null>(null);

  // Sync when external summary updates
  useEffect(() => {
    if (externalSummary) {
      setSummary(externalSummary);
      setIsLoading(false);
    }
  }, [externalSummary]);

  // New Revenue Form State
  const [newAmount, setNewAmount] = useState<string>('250.00');
  const [newSource, setNewSource] = useState<string>('Live Stream Tip');
  const [newCategory, setNewCategory] = useState<'tips' | 'royalties' | 'contests' | 'gateway'>('tips');
  const [newDescription, setNewDescription] = useState<string>('Superchat Diamond Tip during live beat session');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Subscribe to real-time Firestore updates
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        await ensureAuth();
        unsubscribe = firestoreService.subscribeLast30DaysRevenue((liveSummary) => {
          setSummary(liveSummary);
          setIsLoading(false);
          if (onSummaryChange) onSummaryChange(liveSummary);
        });
      } catch (err) {
        console.warn('Firestore live subscription fallback:', err);
        const fallback = await firestoreService.getLast30DaysRevenue();
        setSummary(fallback);
        setIsLoading(false);
        if (onSummaryChange) onSummaryChange(fallback);
      }
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [onSummaryChange]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    bossAudio.playSubtlePing();
    try {
      const data = await firestoreService.getLast30DaysRevenue();
      setSummary(data);
      if (onSummaryChange) onSummaryChange(data);
      showToast('⚡ Firestore database synchronized!');
    } catch (e) {
      console.error('Manual sync error:', e);
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  const [isCashoutProcessing, setIsCashoutProcessing] = useState(false);

  const handleResetToLiveCashout = async () => {
    setIsSyncing(true);
    bossAudio.playSubtlePing();
    try {
      const res = await firestoreService.resetRevenueToLiveCashoutMode('janujanuscreations@gmail.com');
      setSummary(res.summary);
      if (onSummaryChange) onSummaryChange(res.summary);
      bossAudio.playTipChime(100);
      triggerNeonExplosion({ particleCount: 50 });
      showToast('🚀 Revenue & PayPal reset to Live Direct Cashout Mode!');
    } catch (e: any) {
      showToast('Reset failed: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleInstantLiveCashout = async () => {
    const cashoutAmount = summary?.netCreatorEarnings || summary?.totalRevenue || 0;
    if (cashoutAmount <= 0) {
      showToast('No available revenue balance for cashout.');
      return;
    }

    if (!auth.currentUser && typeof (auth as any).authStateReady === 'function') {
      await (auth as any).authStateReady();
    }

    if (!auth.currentUser) {
      showToast('⚠️ Please sign in to your creator account to cash out.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
      }
      return;
    }

    setIsCashoutProcessing(true);
    bossAudio.playCashRegister();

    try {
      const payoutRes = await firestoreService.executeFirebasePayoutToPayPal({
        recipientEmail: 'janujanuscreations@gmail.com',
        amount: cashoutAmount,
        note: `Live Revenue Direct Cashout to Sovereign Founder/Creator (${new Date().toLocaleDateString()})`
      });

      if (!payoutRes || !payoutRes.batchId) {
        throw new Error('Payout failed: No batchId returned from PayPal backend.');
      }

      // Create ONE ledger entry with the returned batchId and status
      await firestoreService.recordPayout({
        id: `CASHOUT-${Date.now()}`,
        amount: cashoutAmount,
        method: 'PayPal Real Direct Payout',
        destination: 'janujanuscreations@gmail.com',
        status: payoutRes.status || 'SUCCESS',
        txHash: payoutRes.batchId,
        payoutBatchId: payoutRes.batchId,
        paypalTxId: payoutRes.batchId,
        creatorHandle: '@januaryrebl',
        timestamp: new Date().toISOString(),
        fee: 0.00,
        netPayout: cashoutAmount,
        isLivePayout: true
      });

      bossAudio.playBigWin();
      triggerNeonExplosion({
        particleCount: 100,
        intensity: 'grand'
      });

      showToast(`✅ Disbursed $${cashoutAmount.toFixed(2)} direct to PayPal: janujanuscreations@gmail.com [Batch: ${payoutRes.batchId}]`);
      // Refresh summary
      const updated = await firestoreService.getLast30DaysRevenue();
      setSummary(updated);
      if (onSummaryChange) onSummaryChange(updated);
    } catch (err: any) {
      console.error('Instant live cashout error:', err);
      showToast('Cashout error: ' + (err?.message || 'PayPal transfer rejected'));
    } finally {
      setIsCashoutProcessing(false);
    }
  };

  const handleRecordNewRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(newAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    bossAudio.playCashRegister();

    const recordId = await firestoreService.recordRevenue({
      amount: parsedAmount,
      source: newSource,
      category: newCategory,
      description: newDescription || `${newSource} inflow`,
      creatorName: 'January Rebl',
      creatorHandle: '@januaryrebl',
      status: 'settled',
      currency: 'USD'
    });

    setIsSubmitting(false);
    if (recordId) {
      triggerNeonExplosion();
      showToast(`✨ $${parsedAmount.toFixed(2)} recorded to Firestore!`);
      setShowAddModal(false);
      setNewDescription('');
    } else {
      showToast('Failed to record transaction to Firestore.');
    }
  };

  const filteredTransactions = (summary?.recentTransactions || []).filter((tx) => {
    if (selectedFilter === 'all') return true;
    return tx.category === selectedFilter;
  });

  if (isLoading && !summary) {
    return (
      <div className={`p-6 rounded-3xl bg-zinc-950/80 border border-white/10 relative overflow-hidden animate-pulse ${className}`}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="h-4 w-40 bg-white/10 rounded-full"></div>
          <div className="h-4 w-24 bg-[#00F5D4]/20 rounded-full"></div>
        </div>
        <div className="h-10 w-56 bg-white/15 rounded-2xl mb-4"></div>
        <div className="h-16 w-full bg-white/5 rounded-2xl"></div>
      </div>
    );
  }

  const total = summary?.totalRevenue ?? 0;
  const netEarnings = summary?.netCreatorEarnings ?? total * 0.85;
  const platformCut = summary?.platformCutTotal ?? total * 0.15;
  const growth = summary?.growthPercentage ?? 24.8;
  const txCount = summary?.totalTransactions ?? 0;
  const dailyPoints = summary?.dailyBreakdown || [];

  // Calculate max daily point for sparkline scaling
  const maxDayAmount = Math.max(...dailyPoints.map((d) => d.amount), 100);

  return (
    <div
      id="last-30-days-revenue-card"
      className={`relative group rounded-3xl bg-gradient-to-br from-zinc-950/95 via-zinc-900/90 to-black/95 border border-[#00F5D4]/30 hover:border-[#00F5D4]/60 p-6 md:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300 ${className}`}
    >
      {/* Ambient Top Glow Highlight */}
      <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-[#00F5D4] to-transparent opacity-50 pointer-events-none"></div>

      {/* Toast */}
      {toastMsg && (
        <div className="absolute top-3 right-6 z-50 px-3 py-1.5 rounded-xl bg-black/90 border border-[#00F5D4] text-[#00F5D4] text-[11px] font-mono font-bold shadow-lg animate-in fade-in slide-in-from-top-2">
          {toastMsg}
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#00F5D4]/15 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.25)]">
            <i className="fa-solid fa-chart-line text-sm"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-300">
                Last 30 Days Revenue
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[#00F5D4] text-[9px] font-mono font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4] animate-pulse"></span>
                <span>Firestore Live</span>
              </span>
            </div>
            <p className="text-[10px] font-mono text-gray-500">
              Aggregated from verified creator inflows & settlements
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleResetToLiveCashout}
            disabled={isSyncing || isCashoutProcessing}
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            title="Reset revenue & PayPal to Live Mode Direct Cashout"
          >
            <i className="fa-solid fa-arrows-rotate text-[10px]"></i>
            <span>Reset to Live Cashout</span>
          </button>

          <button
            onClick={handleInstantLiveCashout}
            disabled={isCashoutProcessing || isSyncing || total <= 0}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
              total <= 0
                ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#00F5D4] via-[#38BDF8] to-[#C084FC] text-black hover:scale-105 shadow-[0_0_15px_rgba(0,245,212,0.4)]'
            }`}
            title="Execute immediate live direct cashout to janujanuscreations@gmail.com"
          >
            <i className={`fa-brands fa-paypal text-xs ${isCashoutProcessing ? 'animate-spin' : ''}`}></i>
            <span>{isCashoutProcessing ? 'Disbursing...' : `Cashout $${netEarnings.toFixed(2)}`}</span>
          </button>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00F5D4]/50 text-gray-300 hover:text-white text-[10px] font-mono transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh from Firestore Database"
          >
            <i className={`fa-solid fa-rotate text-[10px] ${isSyncing ? 'animate-spin text-[#00F5D4]' : ''}`}></i>
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#00F5D4]/15 hover:bg-[#00F5D4]/25 border border-[#00F5D4]/40 text-[#00F5D4] text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Record a test or live revenue transaction to Firestore"
          >
            <i className="fa-solid fa-plus text-[9px]"></i>
            <span>Log Inflow</span>
          </button>

          {onOpenAnalytics && (
            <button
              onClick={onOpenAnalytics}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00F5D4]/15 via-[#C084FC]/15 to-[#FF007F]/15 hover:from-[#00F5D4]/25 hover:to-[#FF007F]/25 border border-[#00F5D4]/40 text-[#00F5D4] text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Open Advanced Analytics & Real-Time Velocity Flow"
            >
              <i className="fa-solid fa-bolt text-[9px] text-[#FF007F]"></i>
              <span className="hidden sm:inline">Velocity (85/15)</span>
            </button>
          )}

          <button
            onClick={() => setShowLedgerDrawer(!showLedgerDrawer)}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              showLedgerDrawer
                ? 'bg-[#C084FC]/20 border-[#C084FC] text-[#C084FC]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
            }`}
          >
            <i className="fa-solid fa-receipt text-[10px]"></i>
            <span className="hidden sm:inline">Ledger</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[9px] font-bold">
              {txCount}
            </span>
          </button>
        </div>
      </div>

      {/* Main Stat & Growth Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left Col: Big Currency Figure & Sub-metrics */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-white tracking-tight">
              ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-mono font-bold text-gray-400">USD</span>
            
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold">
              <i className="fa-solid fa-arrow-trend-up text-[10px]"></i>
              <span>+{growth}%</span>
              <span className="text-gray-500 text-[9px] font-normal">vs prior 30d</span>
            </div>
          </div>

          {/* Sub-Metric Badges: Net Creator Share & Platform Cut */}
          <div className="flex items-center gap-3 flex-wrap text-[11px] font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-white/10 flex items-center gap-2">
              <span className="text-gray-400">Net Creator (85%):</span>
              <span className="text-[#00F5D4] font-bold">
                ${netEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-white/10 flex items-center gap-2">
              <span className="text-gray-400">Boss Split (15%):</span>
              <span className="text-[#C084FC] font-bold">
                ${platformCut.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-white/10 flex items-center gap-2 text-gray-400">
              <span>Avg Daily:</span>
              <span className="text-white font-semibold">
                ${(summary?.averageDailyRevenue ?? total / 30).toFixed(2)}/day
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: 30-Day Dynamic Interactive Sparkline */}
        <div className="lg:col-span-6 bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-2">
            <span>30-Day Revenue Inflow Velocity</span>
            <span className="text-[#00F5D4]">
              Peak: ${summary?.highestDayRevenue.toFixed(2)} ({summary?.highestDayDate})
            </span>
          </div>

          {/* Micro SVG Sparkline Chart */}
          <div className="h-16 flex items-end gap-1 relative pt-2">
            {dailyPoints.map((dp, idx) => {
              const heightPct = Math.max(8, Math.min(100, (dp.amount / maxDayAmount) * 100));
              const isHovered = hoveredPoint?.date === dp.date;
              const hasRevenue = dp.amount > 0;

              return (
                <div
                  key={dp.date}
                  onMouseEnter={() => setHoveredPoint(dp)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="flex-1 h-full flex items-end group/bar cursor-pointer relative"
                >
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-sm transition-all duration-200 ${
                      isHovered
                        ? 'bg-[#00F5D4] shadow-[0_0_12px_#00F5D4]'
                        : hasRevenue
                        ? 'bg-gradient-to-t from-[#00F5D4]/40 to-[#00F5D4]'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  ></div>
                </div>
              );
            })}
          </div>

          {/* Hover Tooltip display */}
          <div className="h-5 flex items-center justify-between text-[10px] font-mono mt-1 text-gray-400">
            {hoveredPoint ? (
              <span className="text-white font-bold animate-in fade-in">
                {hoveredPoint.label}: <span className="text-[#00F5D4]">${hoveredPoint.amount.toFixed(2)}</span> ({hoveredPoint.count} transactions)
              </span>
            ) : (
              <span>Hover bars for daily transaction detail</span>
            )}
            <span className="text-gray-600 font-light">30 Days Timeline</span>
          </div>
        </div>

      </div>

      {/* Revenue Stream Category Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10">
        
        {/* Tips & Superchats */}
        <div 
          onClick={() => setSelectedFilter(selectedFilter === 'tips' ? 'all' : 'tips')}
          className={`p-3 rounded-2xl bg-zinc-900/60 border transition-all cursor-pointer ${
            selectedFilter === 'tips' ? 'border-[#00F5D4] bg-[#00F5D4]/10' : 'border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-heart text-[#00F5D4]"></i>
              <span>Live Tips</span>
            </span>
            <span className="text-[#00F5D4] font-bold">
              {total > 0 ? ((summary?.categoryTotals.tips || 0) / total * 100).toFixed(0) : 0}%
            </span>
          </div>
          <p className="text-sm sm:text-base font-mono font-bold text-white">
            ${(summary?.categoryTotals.tips || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Royalties & Reel Views */}
        <div 
          onClick={() => setSelectedFilter(selectedFilter === 'royalties' ? 'all' : 'royalties')}
          className={`p-3 rounded-2xl bg-zinc-900/60 border transition-all cursor-pointer ${
            selectedFilter === 'royalties' ? 'border-[#C084FC] bg-[#C084FC]/10' : 'border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-compact-disc text-[#C084FC]"></i>
              <span>Royalties</span>
            </span>
            <span className="text-[#C084FC] font-bold">
              {total > 0 ? ((summary?.categoryTotals.royalties || 0) / total * 100).toFixed(0) : 0}%
            </span>
          </div>
          <p className="text-sm sm:text-base font-mono font-bold text-white">
            ${(summary?.categoryTotals.royalties || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Contests & Bounties */}
        <div 
          onClick={() => setSelectedFilter(selectedFilter === 'contests' ? 'all' : 'contests')}
          className={`p-3 rounded-2xl bg-zinc-900/60 border transition-all cursor-pointer ${
            selectedFilter === 'contests' ? 'border-[#FCD34D] bg-[#FCD34D]/10' : 'border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-trophy text-[#FCD34D]"></i>
              <span>Contests</span>
            </span>
            <span className="text-[#FCD34D] font-bold">
              {total > 0 ? ((summary?.categoryTotals.contests || 0) / total * 100).toFixed(0) : 0}%
            </span>
          </div>
          <p className="text-sm sm:text-base font-mono font-bold text-white">
            ${(summary?.categoryTotals.contests || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Direct Gateway / PayPal Sandbox */}
        <div 
          onClick={() => setSelectedFilter(selectedFilter === 'gateway' ? 'all' : 'gateway')}
          className={`p-3 rounded-2xl bg-zinc-900/60 border transition-all cursor-pointer ${
            selectedFilter === 'gateway' ? 'border-[#38BDF8] bg-[#38BDF8]/10' : 'border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1">
            <span className="flex items-center gap-1.5">
              <i className="fa-brands fa-paypal text-[#38BDF8]"></i>
              <span>Gateway</span>
            </span>
            <span className="text-[#38BDF8] font-bold">
              {total > 0 ? ((summary?.categoryTotals.gateway || 0) / total * 100).toFixed(0) : 0}%
            </span>
          </div>
          <p className="text-sm sm:text-base font-mono font-bold text-white">
            ${(summary?.categoryTotals.gateway || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

      </div>

      {/* Expandable Firestore Transactions Drawer */}
      {showLedgerDrawer && (
        <div className="mt-5 pt-5 border-t border-white/10 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Recent Firestore Revenue Inflows
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-gray-300">
                {filteredTransactions.length} records
              </span>
            </div>

            {selectedFilter !== 'all' && (
              <button
                onClick={() => setSelectedFilter('all')}
                className="text-[10px] font-mono text-[#00F5D4] hover:underline cursor-pointer"
              >
                Clear filter (Show all)
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 no-scrollbar">
            {filteredTransactions.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/5 text-center text-xs font-mono text-gray-400">
                No transactions recorded for this category in the last 30 days.
              </div>
            ) : (
              filteredTransactions.map((tx, idx) => (
                <div
                  key={`${tx.id || 'tx'}-${idx}`}
                  className="p-3 rounded-xl bg-zinc-900/80 border border-white/5 hover:border-[#00F5D4]/40 flex items-center justify-between gap-3 transition-colors text-xs font-mono"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-gray-300 shrink-0">
                      <i
                        className={`fa-solid text-xs ${
                          tx.category === 'tips'
                            ? 'fa-heart text-[#00F5D4]'
                            : tx.category === 'royalties'
                            ? 'fa-compact-disc text-[#C084FC]'
                            : tx.category === 'contests'
                            ? 'fa-trophy text-[#FCD34D]'
                            : 'fa-wallet text-[#38BDF8]'
                        }`}
                      ></i>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{tx.description}</p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {tx.source} • {new Date(tx.timestamp || tx.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-[#00F5D4]">
                      +${Number(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-[9px] text-gray-400">
                      Net: ${(Number(tx.netAmount) || Number(tx.amount) * 0.85).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Record Inflow Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-[#00F5D4]/40 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#00F5D4]/15 flex items-center justify-center text-[#00F5D4]">
                  <i className="fa-solid fa-money-bill-wave"></i>
                </div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                  Log Revenue Transaction to Firestore
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            <form onSubmit={handleRecordNewRevenue} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Gross Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    required
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 focus:border-[#00F5D4] text-white font-bold outline-none"
                    placeholder="250.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Revenue Channel / Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { cat: 'tips', label: 'Live Stream Tip', icon: 'fa-heart' },
                    { cat: 'royalties', label: 'Reel & Stem Royalty', icon: 'fa-compact-disc' },
                    { cat: 'contests', label: 'Contest Prize', icon: 'fa-trophy' },
                    { cat: 'gateway', label: 'PayPal / Sponsor', icon: 'fa-brands fa-paypal' }
                  ].map((item) => (
                    <button
                      key={item.cat}
                      type="button"
                      onClick={() => {
                        setNewCategory(item.cat as any);
                        setNewSource(item.label);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                        newCategory === item.cat
                          ? 'bg-[#00F5D4]/15 border-[#00F5D4] text-white'
                          : 'bg-zinc-900 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <i className={`fa-solid ${item.icon} text-xs text-[#00F5D4]`}></i>
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Transaction Memo / Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 focus:border-[#00F5D4] text-white outline-none"
                  placeholder="e.g. VIP diamond superchat from sponsor"
                />
              </div>

              {/* Fee Breakdown Preview */}
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/5 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-gray-400">
                  <span>Gross Amount:</span>
                  <span className="text-white">${parseFloat(newAmount || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Net Creator Take-Home (85%):</span>
                  <span className="text-[#00F5D4] font-bold">
                    ${(parseFloat(newAmount || '0') * 0.85).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Founder Platform Cut (15%):</span>
                  <span className="text-[#C084FC] font-bold">
                    ${(parseFloat(newAmount || '0') * 0.15).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-black hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      <span>Writing to DB...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                      <span>Commit to Firestore</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Last30DaysRevenueCard;
