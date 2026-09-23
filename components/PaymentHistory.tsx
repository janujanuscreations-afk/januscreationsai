import React, { useState, useEffect, useMemo } from 'react';
import { RevenueRecord, TransactionStatus } from '../types';
import { firestoreService } from '../services/firebase';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';

interface PaymentHistoryProps {
  creatorHandle?: string;
  creatorEmail?: string;
  onRefreshWalletBalance?: () => void;
  className?: string;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  creatorHandle = '@JanuaryRebl',
  creatorEmail = 'janujanuscreations@gmail.com',
  onRefreshWalletBalance,
  className = ''
}) => {
  const [transactions, setTransactions] = useState<RevenueRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'refunded' | 'failed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<RevenueRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'all' | '24h' | '7d' | '30d'>('all');

  // Real-time Firestore subscription to transaction logs
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = firestoreService.subscribeTransactionLogs((records) => {
      const seen = new Set<string>();
      const uniqueRecords = (records || []).map((r, idx) => {
        const rawId = r.id || `tx-${Date.now()}-${idx}`;
        if (seen.has(rawId)) {
          const uniqueId = `${rawId}-${idx}`;
          seen.add(uniqueId);
          return { ...r, id: uniqueId };
        }
        seen.add(rawId);
        return { ...r, id: rawId };
      });
      setTransactions(uniqueRecords);
      setIsLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Helper to format currency
  const formatCurrency = (val: number | undefined) => {
    const num = typeof val === 'number' ? val : 0;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper for status visual metadata & icons
  const getStatusMeta = (statusStr: string | undefined) => {
    const s = (statusStr || 'completed').toLowerCase();
    
    if (s === 'completed' || s === 'settled' || s === 'success') {
      return {
        label: 'Completed',
        bg: 'bg-emerald-500/15',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        dot: 'bg-emerald-400 shadow-[0_0_8px_#10B981]',
        icon: 'fa-solid fa-circle-check text-emerald-400',
        badgeIcon: 'fa-solid fa-check',
        description: 'Funds cleared & credited to wallet'
      };
    }
    if (s === 'pending' || s === 'processing') {
      return {
        label: 'Pending',
        bg: 'bg-amber-500/15',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        dot: 'bg-amber-400 shadow-[0_0_8px_#F59E0B] animate-pulse',
        icon: 'fa-solid fa-clock-rotate-left text-amber-400 animate-spin-slow',
        badgeIcon: 'fa-solid fa-hourglass-half',
        description: 'Clearing through settlement rail'
      };
    }
    if (s === 'refunded' || s === 'reversed') {
      return {
        label: 'Refunded',
        bg: 'bg-purple-500/15',
        border: 'border-purple-500/30',
        text: 'text-purple-300',
        dot: 'bg-purple-400 shadow-[0_0_8px_#A855F7]',
        icon: 'fa-solid fa-rotate-left text-purple-400',
        badgeIcon: 'fa-solid fa-arrow-rotate-left',
        description: 'Reversed back to original payment method'
      };
    }
    return {
      label: 'Failed',
      bg: 'bg-rose-500/15',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      dot: 'bg-rose-400 shadow-[0_0_8px_#F43F5E]',
      icon: 'fa-solid fa-circle-xmark text-rose-400',
      badgeIcon: 'fa-solid fa-xmark',
      description: 'Transaction declined or canceled'
    };
  };

  // Helper for source & rail category icons
  const getCategoryMeta = (category: string | undefined, source: string | undefined) => {
    const cat = (category || '').toLowerCase();
    const src = (source || '').toLowerCase();

    if (src.includes('paypal') || cat === 'gateway') {
      return {
        name: 'PayPal REST Gateway',
        icon: 'fa-brands fa-paypal text-[#38BDF8]',
        color: '#38BDF8',
        tag: 'PAYPAL-REST'
      };
    }
    if (cat === 'tips' || src.includes('stream') || src.includes('superchat')) {
      return {
        name: 'Live Stream Tip',
        icon: 'fa-solid fa-heart-pulse text-[#EC4899]',
        color: '#EC4899',
        tag: 'FAN-TIP'
      };
    }
    if (cat === 'royalties' || src.includes('music') || src.includes('reel')) {
      return {
        name: 'Media & Stem Royalty',
        icon: 'fa-solid fa-compact-disc text-[#C084FC]',
        color: '#C084FC',
        tag: 'ROYALTY'
      };
    }
    if (cat === 'contests' || src.includes('tournament') || src.includes('prize')) {
      return {
        name: 'Contest Prize Escrow',
        icon: 'fa-solid fa-trophy text-[#FCD34D]',
        color: '#FCD34D',
        tag: 'BOUNTY'
      };
    }
    if (cat === 'payouts' || src.includes('withdrawal')) {
      return {
        name: 'Creator Withdrawal',
        icon: 'fa-solid fa-money-bill-transfer text-[#00F5D4]',
        color: '#00F5D4',
        tag: 'PAYOUT'
      };
    }
    return {
      name: source || 'Direct Settlement',
      icon: 'fa-solid fa-bolt text-[#00F5D4]',
      color: '#00F5D4',
      tag: 'DIRECT'
    };
  };

  // Aggregate summary metrics
  const summaryMetrics = useMemo(() => {
    let totalGross = 0;
    let completedGross = 0;
    let completedNet = 0;
    let pendingGross = 0;
    let refundedGross = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let refundedCount = 0;

    transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      const net = Number(t.netAmount) || +(amt * 0.85).toFixed(2);
      const status = (t.status || 'completed').toLowerCase();

      totalGross += amt;

      if (status === 'completed' || status === 'settled' || status === 'success') {
        completedGross += amt;
        completedNet += net;
        completedCount++;
      } else if (status === 'pending' || status === 'processing') {
        pendingGross += amt;
        pendingCount++;
      } else if (status === 'refunded' || status === 'reversed') {
        refundedGross += amt;
        refundedCount++;
      }
    });

    return {
      totalGross,
      completedGross,
      completedNet,
      pendingGross,
      refundedGross,
      totalCount: transactions.length,
      completedCount,
      pendingCount,
      refundedCount
    };
  }, [transactions]);

  // Filtered & Searched transactions
  const filteredTransactions = useMemo(() => {
    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    return transactions.filter(t => {
      const status = (t.status || 'completed').toLowerCase();
      
      // Status filtering
      if (statusFilter === 'completed' && !(status === 'completed' || status === 'settled' || status === 'success')) {
        return false;
      }
      if (statusFilter === 'pending' && !(status === 'pending' || status === 'processing')) {
        return false;
      }
      if (statusFilter === 'refunded' && !(status === 'refunded' || status === 'reversed')) {
        return false;
      }
      if (statusFilter === 'failed' && !(status === 'failed' || status === 'denied')) {
        return false;
      }

      // Category filtering
      if (categoryFilter !== 'all' && (t.category || 'tips').toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // Time range filtering
      if (timeRange !== 'all') {
        const txTime = new Date(t.timestamp || t.date || '').getTime();
        if (timeRange === '24h' && now - txTime > ONE_DAY_MS) return false;
        if (timeRange === '7d' && now - txTime > 7 * ONE_DAY_MS) return false;
        if (timeRange === '30d' && now - txTime > 30 * ONE_DAY_MS) return false;
      }

      // Search query filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = (t.id || '').toLowerCase().includes(q);
        const matchRef = (t.clientRef || '').toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchPayer = (t.payerName || '').toLowerCase().includes(q);
        const matchHandle = (t.payerHandle || '').toLowerCase().includes(q);
        const matchEmail = (t.payerEmail || '').toLowerCase().includes(q);
        const matchSource = (t.source || '').toLowerCase().includes(q);
        if (!matchId && !matchRef && !matchDesc && !matchPayer && !matchHandle && !matchEmail && !matchSource) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, statusFilter, categoryFilter, timeRange, searchQuery]);

  // Handle status update in Firestore
  const handleUpdateStatus = async (recordId: string, newStatus: 'completed' | 'settled' | 'pending' | 'refunded' | 'failed') => {
    setIsUpdatingStatus(recordId);
    try {
      const success = await firestoreService.updateTransactionStatus(recordId, newStatus, `Manual status transition to ${newStatus}`);
      if (success) {
        if (newStatus === 'completed') {
          bossAudio.playLevelUp();
          triggerNeonExplosion({ particleCount: 40 });
        } else {
          bossAudio.playSubtlePing();
        }
        showToast(`Transaction ${recordId} updated to '${newStatus.toUpperCase()}' in Firestore!`);
        if (selectedTransaction?.id === recordId) {
          setSelectedTransaction(prev => prev ? { ...prev, status: newStatus } : null);
        }
        if (onRefreshWalletBalance) {
          onRefreshWalletBalance();
        }
      } else {
        showToast(`Failed to update status for ${recordId}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Status update failed'}`);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Simulate new live test transaction
  const handleSimulateNewTransaction = async (type: 'completed' | 'pending' | 'refunded') => {
    const mockAmounts = {
      completed: 120.00,
      pending: 250.00,
      refunded: 45.00
    };
    const amt = mockAmounts[type];
    const platformCut = +(amt * 0.15).toFixed(2);
    const netAmount = +(amt - platformCut).toFixed(2);
    const mockId = `rev-manual-${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();

    const descriptions = {
      completed: 'Live Superchat Diamond Cheer from @CyberPatron (Cleared)',
      pending: 'Direct Commercial Sponsorship Retainer (Clearing)',
      refunded: 'Accidental Duplicate Fan Tip (Auto-Reversed)'
    };

    const payload: Partial<RevenueRecord> = {
      id: mockId,
      amount: amt,
      netAmount,
      platformCut,
      source: type === 'completed' ? 'Live Stream Tip' : 'Direct PayPal Gateway',
      category: type === 'completed' ? 'tips' : 'gateway',
      description: descriptions[type],
      creatorName: 'January Rebl',
      creatorHandle: '@JanuaryRebl',
      payerName: type === 'completed' ? 'Alex Sterling' : 'Vanguard Cyber Arts',
      payerHandle: type === 'completed' ? '@sterling_art' : '@vanguard_nyc',
      payerEmail: 'patron@example.com',
      status: type,
      currency: 'USD',
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0],
      clientRef: `TXN-SIM-${Math.floor(100000 + Math.random() * 900000)}`
    };

    const resId = await firestoreService.recordRevenue(payload);
    if (resId) {
      if (type === 'completed') {
        bossAudio.playLevelUp();
        triggerNeonExplosion({ particleCount: 50 });
      } else {
        bossAudio.playTipChime(amt);
      }
      showToast(`⚡ New ${type.toUpperCase()} transaction recorded in Firestore! (${formatCurrency(amt)})`);
      if (onRefreshWalletBalance) {
        onRefreshWalletBalance();
      }
    }
  };

  // Export filtered transactions to CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      showToast('No transactions to export.');
      return;
    }

    const headers = ['Transaction ID', 'Status', 'Date', 'Time', 'Gross ($)', 'Net Creator ($)', 'Platform Cut ($)', 'Source', 'Category', 'Payer', 'Payer Email', 'Client Ref', 'Description'];
    const rows = filteredTransactions.map(t => [
      `"${t.id}"`,
      `"${t.status || 'completed'}"`,
      `"${t.date || ''}"`,
      `"${t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : ''}"`,
      Number(t.amount || 0).toFixed(2),
      Number(t.netAmount || 0).toFixed(2),
      Number(t.platformCut || 0).toFixed(2),
      `"${t.source || ''}"`,
      `"${t.category || ''}"`,
      `"${t.payerName || t.payerHandle || ''}"`,
      `"${t.payerEmail || ''}"`,
      `"${t.clientRef || ''}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `janu_payment_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    bossAudio.playSubtlePing();
    showToast(`Exported ${filteredTransactions.length} transaction logs to CSV.`);
  };

  return (
    <div id="payment-history-container" className={`space-y-6 ${className}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] bg-black/95 border border-[#00F5D4] text-[#00F5D4] px-6 py-3 rounded-full text-xs font-mono font-bold shadow-[0_0_30px_rgba(0,245,212,0.4)] flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <i className="fa-solid fa-receipt text-[#00F5D4] text-sm animate-pulse"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Payment History Card */}
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-zinc-950/90 border border-white/10 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl">
        {/* Glow ambient background accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00F5D4]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#C084FC]/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header Ribbon & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00F5D4] animate-ping"></span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-[#00F5D4]">
                Firestore Real-Time Ledger
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[10px] font-mono flex items-center gap-1.5">
                <i className="fa-solid fa-database text-green-400 text-[9px]"></i>
                <span>Live Synced</span>
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif font-black italic text-white tracking-tight flex items-center gap-3">
              <span>Payment History & Transaction Logs</span>
            </h3>
            <p className="text-xs font-mono text-gray-400 max-w-2xl font-light">
              Real-time audit trail of all patron superchats, stem licensing royalties, contest prizes, and PayPal REST payouts with visual status verification.
            </p>
          </div>

          {/* Quick Simulation & Export Toolbar */}
          <div className="flex items-center gap-2 flex-wrap relative z-10">
            <div className="flex items-center bg-black/60 border border-white/10 rounded-2xl p-1">
              <button
                id="btn-simulate-completed-tx"
                type="button"
                onClick={() => handleSimulateNewTransaction('completed')}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Simulate incoming Completed transaction"
              >
                <i className="fa-solid fa-circle-check text-xs"></i>
                <span className="hidden sm:inline">+ Completed</span>
              </button>
              <button
                id="btn-simulate-pending-tx"
                type="button"
                onClick={() => handleSimulateNewTransaction('pending')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Simulate incoming Pending transaction"
              >
                <i className="fa-solid fa-clock-rotate-left text-xs"></i>
                <span className="hidden sm:inline">+ Pending</span>
              </button>
              <button
                id="btn-simulate-refunded-tx"
                type="button"
                onClick={() => handleSimulateNewTransaction('refunded')}
                className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Simulate incoming Refunded transaction"
              >
                <i className="fa-solid fa-rotate-left text-xs"></i>
                <span className="hidden sm:inline">+ Refunded</span>
              </button>
            </div>

            <button
              id="btn-export-payment-history-csv"
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/15 text-white font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-file-csv text-[#00F5D4] text-xs"></i>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* KPI Status Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Completed Metric Card */}
          <div 
            onClick={() => setStatusFilter('completed')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'completed' 
                ? 'bg-emerald-500/15 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                : 'bg-black/40 border-white/5 hover:border-emerald-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                <i className="fa-solid fa-circle-check text-xs"></i>
                <span>Completed</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                {summaryMetrics.completedCount} tx
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-serif font-black italic text-white">
              {formatCurrency(summaryMetrics.completedGross)}
            </div>
            <p className="text-[10px] font-mono text-gray-400 mt-1">
              Net Creator (85%): <strong className="text-emerald-400">{formatCurrency(summaryMetrics.completedNet)}</strong>
            </p>
          </div>

          {/* Pending Metric Card */}
          <div 
            onClick={() => setStatusFilter('pending')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'pending' 
                ? 'bg-amber-500/15 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
                : 'bg-black/40 border-white/5 hover:border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <i className="fa-solid fa-clock-rotate-left text-xs"></i>
                <span>Pending Clearance</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                {summaryMetrics.pendingCount} tx
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-serif font-black italic text-white">
              {formatCurrency(summaryMetrics.pendingGross)}
            </div>
            <p className="text-[10px] font-mono text-gray-400 mt-1">
              Awaiting settlement pipeline clearing
            </p>
          </div>

          {/* Refunded Metric Card */}
          <div 
            onClick={() => setStatusFilter('refunded')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'refunded' 
                ? 'bg-purple-500/15 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
                : 'bg-black/40 border-white/5 hover:border-purple-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold flex items-center gap-1.5">
                <i className="fa-solid fa-rotate-left text-xs"></i>
                <span>Refunded & Reversed</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-[10px] font-mono font-bold">
                {summaryMetrics.refundedCount} tx
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-serif font-black italic text-white">
              {formatCurrency(summaryMetrics.refundedGross)}
            </div>
            <p className="text-[10px] font-mono text-gray-400 mt-1">
              Reversals & customer refunds
            </p>
          </div>

          {/* Total Processed Metric Card */}
          <div 
            onClick={() => setStatusFilter('all')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'all' 
                ? 'bg-[#00F5D4]/15 border-[#00F5D4]/40 shadow-[0_0_20px_rgba(0,245,212,0.2)]' 
                : 'bg-black/40 border-white/5 hover:border-[#00F5D4]/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#00F5D4] font-bold flex items-center gap-1.5">
                <i className="fa-solid fa-layer-group text-xs"></i>
                <span>Total Processed</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/20 text-[#00F5D4] text-[10px] font-mono font-bold">
                {summaryMetrics.totalCount} total
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-serif font-black italic text-white">
              {formatCurrency(summaryMetrics.totalGross)}
            </div>
            <p className="text-[10px] font-mono text-gray-400 mt-1">
              Aggregated lifetime volume
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              id="filter-status-all"
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-gradient-to-r from-[#00F5D4] to-[#38BDF8] text-black shadow-md'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <span>All Statuses</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">{summaryMetrics.totalCount}</span>
            </button>

            <button
              id="filter-status-completed"
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'completed'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-circle-check text-xs"></i>
              <span>Completed</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-950/40 text-[10px] text-emerald-300">{summaryMetrics.completedCount}</span>
            </button>

            <button
              id="filter-status-pending"
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-clock-rotate-left text-xs"></i>
              <span>Pending</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-950/40 text-[10px] text-amber-300">{summaryMetrics.pendingCount}</span>
            </button>

            <button
              id="filter-status-refunded"
              type="button"
              onClick={() => setStatusFilter('refunded')}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'refunded'
                  ? 'bg-purple-500 text-black shadow-md shadow-purple-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-rotate-left text-xs"></i>
              <span>Refunded</span>
              <span className="px-1.5 py-0.2 rounded-full bg-purple-950/40 text-[10px] text-purple-200">{summaryMetrics.refundedCount}</span>
            </button>
          </div>

          {/* Search Box & Category Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
              <input
                id="input-search-transactions"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference, patron, item..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/80 border border-white/10 text-white font-mono text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#00F5D4]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              )}
            </div>

            <select
              id="select-category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-black/80 border border-white/10 text-gray-300 font-mono text-xs focus:outline-none focus:border-[#00F5D4]"
            >
              <option value="all">All Categories</option>
              <option value="tips">Tips & Superchats</option>
              <option value="royalties">Stem & Media Royalties</option>
              <option value="contests">Contest Prize Pools</option>
              <option value="gateway">PayPal REST Gateways</option>
              <option value="payouts">Disbursements & Payouts</option>
            </select>
          </div>
        </div>

        {/* Transaction History List & Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <i className="fa-solid fa-circle-notch text-2xl text-[#00F5D4] animate-spin"></i>
              <p className="text-xs font-mono text-gray-400">Loading live Firestore transaction logs...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-16 text-center space-y-4 rounded-2xl bg-black/40 border border-white/5">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-500 text-xl">
                <i className="fa-solid fa-receipt"></i>
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-serif font-black italic text-white">No transactions found</h4>
                <p className="text-xs font-mono text-gray-400">
                  {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'Try clearing your active filters or search terms.'
                    : 'Your transaction history from Firestore is currently empty.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setCategoryFilter('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
                <button
                  onClick={() => handleSimulateNewTransaction('completed')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#38BDF8] text-black font-mono text-xs font-bold cursor-pointer"
                >
                  + Simulate Sample Transaction
                </button>
              </div>
            </div>
          ) : (
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-[10px] uppercase tracking-wider">
                  <th className="pb-3 pl-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Reference & Rail</th>
                  <th className="pb-3 font-semibold">Patron / Client</th>
                  <th className="pb-3 font-semibold">Item & Description</th>
                  <th className="pb-3 font-semibold">Date & Time</th>
                  <th className="pb-3 font-semibold text-right pr-3">Gross & Net</th>
                  <th className="pb-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.map((tx, idx) => {
                  const statusMeta = getStatusMeta(tx.status);
                  const catMeta = getCategoryMeta(tx.category, tx.source);
                  const formattedDate = tx.date || (tx.timestamp ? tx.timestamp.split('T')[0] : 'Today');
                  const timeFormatted = tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                  const amount = Number(tx.amount || 0);
                  const netAmount = Number(tx.netAmount || (amount * 0.85).toFixed(2));
                  const isRefund = (tx.status || '').toLowerCase() === 'refunded';

                  return (
                    <tr 
                      key={`${tx.id || 'tx'}-${idx}`} 
                      className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                      onClick={() => setSelectedTransaction(tx)}
                    >
                      {/* Visual Status Icon & Badge */}
                      <td className="py-4 pl-3 whitespace-nowrap">
                        <span 
                          className={`px-3 py-1 rounded-full ${statusMeta.bg} border ${statusMeta.border} ${statusMeta.text} text-[10px] font-bold uppercase inline-flex items-center gap-1.5 shadow-sm`}
                          title={statusMeta.description}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`}></span>
                          <i className={`${statusMeta.icon} text-[10px]`}></i>
                          <span>{statusMeta.label}</span>
                        </span>
                      </td>

                      {/* Reference ID & Payment Rail */}
                      <td className="py-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-bold">{tx.clientRef || tx.id.slice(0, 16)}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(tx.clientRef || tx.id);
                                showToast(`Copied Ref: ${tx.clientRef || tx.id}`);
                              }}
                              className="text-gray-500 hover:text-white transition-colors"
                              title="Copy Reference"
                            >
                              <i className="fa-solid fa-copy text-[10px]"></i>
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                            <i className={catMeta.icon}></i>
                            <span>{catMeta.name}</span>
                          </div>
                        </div>
                      </td>

                      {/* Patron / Payer Info */}
                      <td className="py-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="text-gray-200 font-semibold">{tx.payerName || tx.payerHandle || 'Fan Patron'}</div>
                          <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                            {tx.payerHandle && <span className="text-[#38BDF8]">{tx.payerHandle}</span>}
                            {tx.payerEmail && <span className="text-gray-500">• {tx.payerEmail}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Item Description */}
                      <td className="py-4 max-w-xs truncate pr-4">
                        <div className="text-gray-300 truncate" title={tx.description}>
                          {tx.description || 'Creator Inflow / Tip Settlement'}
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                          {catMeta.tag}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-4 whitespace-nowrap text-gray-400">
                        <div>{formattedDate}</div>
                        <div className="text-[10px] text-gray-500">{timeFormatted}</div>
                      </td>

                      {/* Gross and Net Amount */}
                      <td className="py-4 text-right pr-3 whitespace-nowrap">
                        <div className={`font-black text-sm ${isRefund ? 'text-purple-300' : 'text-[#00F5D4]'}`}>
                          {isRefund ? `-${formatCurrency(amount)}` : `+${formatCurrency(amount)}`}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Net: <strong className="text-gray-200">{formatCurrency(netAmount)}</strong>
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="py-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTransaction(tx);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white text-[10px] font-mono transition-all inline-flex items-center gap-1"
                        >
                          <i className="fa-solid fa-receipt text-xs text-[#00F5D4]"></i>
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Transaction Detail & Receipt Modal / Drawer */}
      {selectedTransaction && (
        <div 
          className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedTransaction(null)}
        >
          <div 
            className="w-full max-w-xl rounded-[2.5rem] bg-zinc-950 border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#00F5D4]/10 border border-[#00F5D4]/30 flex items-center justify-center text-[#00F5D4]">
                  <i className="fa-solid fa-file-invoice-dollar text-base"></i>
                </div>
                <div>
                  <h4 className="text-lg font-serif font-black italic text-white">
                    Verified Transaction Receipt
                  </h4>
                  <p className="text-[10px] font-mono text-gray-400">
                    Firestore Ref: {selectedTransaction.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTransaction(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Status Hero Badge */}
            {(() => {
              const meta = getStatusMeta(selectedTransaction.status);
              const amount = Number(selectedTransaction.amount || 0);
              const netAmount = Number(selectedTransaction.netAmount || (amount * 0.85).toFixed(2));
              const platformCut = Number(selectedTransaction.platformCut || (amount * 0.15).toFixed(2));

              return (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-2xl ${meta.bg} border ${meta.border} flex items-center justify-between gap-4`}>
                    <div className="flex items-center gap-3">
                      <i className={`${meta.icon} text-xl`}></i>
                      <div>
                        <div className={`text-xs font-mono font-black uppercase ${meta.text}`}>
                          Status: {meta.label}
                        </div>
                        <div className="text-[11px] font-mono text-gray-300">
                          {meta.description}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono text-gray-400">Gross Total</div>
                      <div className="text-xl font-serif font-black italic text-white">
                        {formatCurrency(amount)}
                      </div>
                    </div>
                  </div>

                  {/* 85/15 Revenue Split Breakdown Card */}
                  <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between text-gray-400 text-[10px] uppercase font-bold border-b border-white/5 pb-2">
                      <span>Accounting Breakdown</span>
                      <span>85 / 15 Sovereign Split</span>
                    </div>

                    <div className="flex items-center justify-between text-gray-300">
                      <span>Gross Customer Amount:</span>
                      <span className="text-white font-bold">{formatCurrency(amount)}</span>
                    </div>

                    <div className="flex items-center justify-between text-gray-400 text-[11px]">
                      <span>Platform Infrastructure Cut (15%):</span>
                      <span className="text-rose-400 font-mono">-{formatCurrency(platformCut)}</span>
                    </div>

                    <div className="flex items-center justify-between text-[#00F5D4] font-bold pt-2 border-t border-white/10 text-sm">
                      <span>Net Creator Take-Home (85%):</span>
                      <span className="text-base font-black">+{formatCurrency(netAmount)}</span>
                    </div>
                  </div>

                  {/* Payer & Client Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                      <div className="text-[10px] text-gray-500 uppercase">Payer / Patron</div>
                      <div className="text-white font-bold truncate">
                        {selectedTransaction.payerName || selectedTransaction.payerHandle || 'Fan Supporter'}
                      </div>
                      <div className="text-[10px] text-[#38BDF8] truncate">
                        {selectedTransaction.payerEmail || selectedTransaction.payerHandle || 'patron@example.com'}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                      <div className="text-[10px] text-gray-500 uppercase">Settlement Rail</div>
                      <div className="text-white font-bold truncate">
                        {selectedTransaction.source || 'Direct Gateway'}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        Category: {selectedTransaction.category || 'tips'}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                      <div className="text-[10px] text-gray-500 uppercase">Client Reference</div>
                      <div className="text-white font-bold font-mono text-[11px] truncate">
                        {selectedTransaction.clientRef || selectedTransaction.id}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                      <div className="text-[10px] text-gray-500 uppercase">Timestamp</div>
                      <div className="text-white font-bold text-[11px] truncate">
                        {selectedTransaction.date || selectedTransaction.timestamp?.split('T')[0] || 'Today'}
                      </div>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">Memo / Description</div>
                    <p className="text-xs font-mono text-gray-200">
                      {selectedTransaction.description || 'Live stream patron tip settlement.'}
                    </p>
                  </div>

                  {/* Status Change Simulator Tool */}
                  <div className="p-4 rounded-2xl bg-black/80 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">
                        Firestore Status Override Tool
                      </span>
                      {isUpdatingStatus === selectedTransaction.id && (
                        <span className="text-[10px] font-mono text-[#00F5D4] animate-pulse">Syncing...</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        disabled={isUpdatingStatus === selectedTransaction.id}
                        onClick={() => handleUpdateStatus(selectedTransaction.id, 'completed')}
                        className={`py-2 rounded-xl text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          selectedTransaction.status === 'completed' || selectedTransaction.status === 'settled'
                            ? 'bg-emerald-500 text-black shadow-md'
                            : 'bg-white/5 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        <i className="fa-solid fa-circle-check"></i>
                        <span>Completed</span>
                      </button>

                      <button
                        type="button"
                        disabled={isUpdatingStatus === selectedTransaction.id}
                        onClick={() => handleUpdateStatus(selectedTransaction.id, 'pending')}
                        className={`py-2 rounded-xl text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          selectedTransaction.status === 'pending'
                            ? 'bg-amber-500 text-black shadow-md'
                            : 'bg-white/5 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        <i className="fa-solid fa-clock-rotate-left"></i>
                        <span>Pending</span>
                      </button>

                      <button
                        type="button"
                        disabled={isUpdatingStatus === selectedTransaction.id}
                        onClick={() => handleUpdateStatus(selectedTransaction.id, 'refunded')}
                        className={`py-2 rounded-xl text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          selectedTransaction.status === 'refunded'
                            ? 'bg-purple-500 text-black shadow-md'
                            : 'bg-white/5 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20'
                        }`}
                      >
                        <i className="fa-solid fa-rotate-left"></i>
                        <span>Refunded</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedTransaction, null, 2));
                  showToast('Copied full JSON receipt to clipboard!');
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-code text-[#00F5D4] text-xs"></i>
                <span>Copy JSON</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
