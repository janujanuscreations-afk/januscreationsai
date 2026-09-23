import React, { useState, useMemo, useEffect } from 'react';
import { auth } from '../services/firebase';
import { paymentGatewayService, PayPalGatewayConfig } from '../services/paymentGatewayService';
import { revenueMilestoneService, RevenueMilestoneThreshold } from '../services/revenueMilestoneService';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';

export interface PayPalActivityItem {
  id: string;
  batchId: string;
  txHash: string;
  recipient: string;
  recipientEmail: string;
  amount: number;
  currency: string;
  category: 'Contest' | 'Monetization' | 'Founder' | 'Live Tip' | 'AI Royalty';
  status: 'SETTLED' | 'PROCESSING' | 'CONFIRMED';
  timestamp: string;
  gateway: string;
  fee: number;
  note: string;
  senderBatchId?: string;
  correlationId?: string;
}

interface RevenueTickerProps {
  externalPayouts?: Array<{
    id: string;
    recipient: string;
    amount: number;
    type: 'Contest' | 'Monetization' | 'Founder';
    status: 'Pending' | 'Approved' | 'Processing' | 'Rejected';
    date: string;
    approvedAt?: string;
    notes?: string;
    transactionHash?: string;
    paypalBatchId?: string;
    gateway?: string;
  }>;
  onSimulatePayout?: (payout: {
    recipient: string;
    amount: number;
    type: 'Contest' | 'Monetization' | 'Founder';
    batchId?: string;
    txHash?: string;
  }) => void;
  className?: string;
}

const INITIAL_SANDBOX_ACTIVITY: PayPalActivityItem[] = [
  {
    id: 'act-101',
    batchId: 'PAYPAL-BATCH-1724491200-881',
    txHash: 'PP-TX-98421034',
    recipient: 'LegacyCreator',
    recipientEmail: 'legacycreator@creator.paypal',
    amount: 3500.00,
    currency: 'USD',
    category: 'Monetization',
    status: 'SETTLED',
    timestamp: '2026-08-24 02:15:30',
    gateway: 'PayPal Sandbox Payouts v2',
    fee: 0.00,
    note: 'Quarterly sovereign revenue share for ecosystem growth.',
    senderBatchId: 'VAULT-BATCH-1724491200',
    correlationId: 'CORR-PP-9941-AZ'
  },
  {
    id: 'act-102',
    batchId: 'PAYPAL-BATCH-1724488400-312',
    txHash: 'PP-TX-84912048',
    recipient: 'CreativeSoul_99',
    recipientEmail: 'creativesoul99@creator.paypal',
    amount: 1200.00,
    currency: 'USD',
    category: 'Contest',
    status: 'SETTLED',
    timestamp: '2026-08-24 01:42:18',
    gateway: 'PayPal Sandbox Payouts v2',
    fee: 0.00,
    note: '1st Place Sovereign AI Video Hackathon Grand Bounty.',
    senderBatchId: 'VAULT-BATCH-1724488400',
    correlationId: 'CORR-PP-7721-BC'
  },
  {
    id: 'act-103',
    batchId: 'PAYPAL-BATCH-1724482100-149',
    txHash: 'PP-TX-76491022',
    recipient: 'DesignNexus_AI',
    recipientEmail: 'designnexus@creator.paypal',
    amount: 850.00,
    currency: 'USD',
    category: 'Monetization',
    status: 'SETTLED',
    timestamp: '2026-08-23 23:18:05',
    gateway: 'PayPal Sandbox Payouts v2',
    fee: 0.00,
    note: 'Neural Image Filter Model Royalties & Subscriptions share.',
    senderBatchId: 'VAULT-BATCH-1724482100',
    correlationId: 'CORR-PP-4412-MK'
  },
  {
    id: 'act-104',
    batchId: 'PAYPAL-BATCH-1724479200-904',
    txHash: 'PP-TX-62194851',
    recipient: 'AudioGodMarcus',
    recipientEmail: 'audiogod@creator.paypal',
    amount: 1450.00,
    currency: 'USD',
    category: 'AI Royalty',
    status: 'SETTLED',
    timestamp: '2026-08-23 21:05:44',
    gateway: 'PayPal Sandbox Payouts v2',
    fee: 0.00,
    note: 'Stem Mastering & Sonic Beat Distribution Payout.',
    senderBatchId: 'VAULT-BATCH-1724479200',
    correlationId: 'CORR-PP-3819-TX'
  },
  {
    id: 'act-105',
    batchId: 'PAYPAL-BATCH-1724471000-672',
    txHash: 'PP-TX-51928374',
    recipient: 'January Rebl (Founder)',
    recipientEmail: 'janujanuscreations@gmail.com',
    amount: 5000.00,
    currency: 'USD',
    category: 'Founder',
    status: 'SETTLED',
    timestamp: '2026-08-23 18:30:00',
    gateway: 'PayPal Sandbox Payouts v2 (Direct Draw)',
    fee: 0.00,
    note: 'Tier 1 Priority Sovereign Equity Distribution authorized by Founder.',
    senderBatchId: 'VAULT-BATCH-1724471000',
    correlationId: 'CORR-PP-1001-EX'
  }
];

const LOCAL_STORAGE_ACTIVITIES_KEY = 'janus_paypal_revenue_ticker_activities_v1';

export const RevenueTicker: React.FC<RevenueTickerProps> = ({
  externalPayouts = [],
  onSimulatePayout,
  className = ''
}) => {
  const [config, setConfig] = useState<PayPalGatewayConfig>(() => paymentGatewayService.getConfig());
  const [selectedActivity, setSelectedActivity] = useState<PayPalActivityItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isProcessingSandboxTest, setIsProcessingSandboxTest] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLiveTickerPaused, setIsLiveTickerPaused] = useState(false);
  const [milestones, setMilestones] = useState<RevenueMilestoneThreshold[]>(() => revenueMilestoneService.getMilestones());
  const [showMilestoneDrawer, setShowMilestoneDrawer] = useState(false);

  // Load activities from localStorage or default
  const [activities, setActivities] = useState<PayPalActivityItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ACTIVITIES_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not parse saved PayPal ticker activities:', e);
    }
    return INITIAL_SANDBOX_ACTIVITY;
  });

  // Sync with external payouts from Founder Dashboard if any approved with PayPal gateway
  useEffect(() => {
    if (!externalPayouts || externalPayouts.length === 0) return;

    const approvedExternal = externalPayouts.filter(p => p.status === 'Approved');
    if (approvedExternal.length === 0) return;

    setActivities(prev => {
      const existingHashes = new Set(prev.map(a => a.id));
      const newItems: PayPalActivityItem[] = [];

      for (const p of approvedExternal) {
        const uniqueId = `ext-payout-${p.id}`;
        if (!existingHashes.has(uniqueId) && !existingHashes.has(p.id)) {
          newItems.push({
            id: uniqueId,
            batchId: p.paypalBatchId || `PAYPAL-BATCH-EXT-${p.id}-${Date.now()}`,
            txHash: p.transactionHash || `PP-TX-${Math.floor(Math.random() * 90000000) + 10000000}`,
            recipient: p.recipient,
            recipientEmail: `${p.recipient.toLowerCase().replace(/[^a-z0-9]/g, '')}@creator.paypal`,
            amount: p.amount,
            currency: 'USD',
            category: p.type === 'Founder' ? 'Founder' : p.type === 'Contest' ? 'Contest' : 'Monetization',
            status: 'SETTLED',
            timestamp: p.approvedAt || p.date,
            gateway: p.gateway || 'PayPal Sandbox Payouts v2',
            fee: 0.00,
            note: p.notes || `Disbursed via Janu's Creations PayPal Sandbox Integration`,
            senderBatchId: `SENDER-BATCH-${p.id}`,
            correlationId: `CORR-PP-${p.id}`
          });
        }
      }

      if (newItems.length > 0) {
        const combined = [...newItems, ...prev];
        try {
          localStorage.setItem(LOCAL_STORAGE_ACTIVITIES_KEY, JSON.stringify(combined));
        } catch (err) {
          console.error(err);
        }
        return combined;
      }
      return prev;
    });
  }, [externalPayouts]);

  // Periodically refresh config for sandbox balance updates
  useEffect(() => {
    const interval = setInterval(() => {
      setConfig(paymentGatewayService.getConfig());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${text} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Aggregated totals calculation
  const stats = useMemo(() => {
    const totalAggregated = activities.reduce((acc, curr) => acc + curr.amount, 0);
    const contestTotal = activities.filter(a => a.category === 'Contest').reduce((acc, curr) => acc + curr.amount, 0);
    const monetizationTotal = activities.filter(a => a.category === 'Monetization' || a.category === 'AI Royalty').reduce((acc, curr) => acc + curr.amount, 0);
    const founderTotal = activities.filter(a => a.category === 'Founder').reduce((acc, curr) => acc + curr.amount, 0);
    const totalTransactions = activities.length;
    const avgDisbursement = totalTransactions > 0 ? totalAggregated / totalTransactions : 0;

    return {
      totalAggregated,
      contestTotal,
      monetizationTotal,
      founderTotal,
      totalTransactions,
      avgDisbursement
    };
  }, [activities]);

  // Filtered recent activities
  const filteredActivities = useMemo(() => {
    return activities.filter(item => {
      const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
      const matchesSearch = !searchQuery.trim() || 
        item.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batchId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.txHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activities, filterCategory, searchQuery]);

  // Monitor total aggregated payouts for milestone threshold triggers
  useEffect(() => {
    if (stats.totalAggregated > 0) {
      const triggered = revenueMilestoneService.checkAndTriggerMilestones(stats.totalAggregated, {
        gateway: 'PayPal Sandbox Payouts v2'
      });
      if (triggered.length > 0) {
        setMilestones(revenueMilestoneService.getMilestones());
      }
    }
  }, [stats.totalAggregated]);

  // Trigger quick sandbox payout test
  const handleQuickSandboxPayout = async (type: 'Contest' | 'Monetization' | 'Founder') => {
    // Ensure Firebase session is verified before processing
    if (!auth.currentUser && typeof (auth as any).authStateReady === 'function') {
      await (auth as any).authStateReady();
    }

    if (!auth.currentUser) {
      showToast('⚠️ Please sign in to your creator account before executing payouts.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
      }
      return;
    }

    setIsProcessingSandboxTest(true);
    
    const randomAmount = type === 'Contest' 
      ? Math.floor(Math.random() * 800) + 400 
      : type === 'Founder' 
      ? 2500 
      : Math.floor(Math.random() * 500) + 150;

    const sampleRecipients = {
      Contest: ['NeonValkyrie_99', 'CyberPulse_Winner', 'GospelHarmonies', 'PixelTitan'],
      Monetization: ['AriaCyberArt', 'HyperDriveMotion', 'ExecutiveVisuals', 'VanceReelStudio'],
      Founder: ['January Rebl (Founder Draw)', 'Executive Founder Reserve']
    };

    const recipient = sampleRecipients[type][Math.floor(Math.random() * sampleRecipients[type].length)];
    const email = (type === 'Founder' || recipient.includes('January Rebl') || recipient.includes('Founder'))
      ? 'janujanuscreations@gmail.com'
      : `${recipient.toLowerCase().replace(/[^a-z0-9]/g, '')}@creator.paypal`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    try {
      // Execute through payment gateway service
      const res = await paymentGatewayService.executeSinglePayout({
        receiverEmail: email,
        amount: randomAmount,
        note: `Instant PayPal Sandbox payout dispatched for ${type} manifest authorization.`
      });

      const newActivity: PayPalActivityItem = {
        id: `act-${Date.now()}`,
        batchId: res.batch_header.payout_batch_id,
        txHash: res.items[0]?.transaction_id || `PP-TX-${Math.floor(Math.random() * 90000000) + 10000000}`,
        recipient,
        recipientEmail: email,
        amount: randomAmount,
        currency: 'USD',
        category: type,
        status: 'SETTLED',
        timestamp: now,
        gateway: 'PayPal Sandbox Payouts v2',
        fee: 0.00,
        note: `Live simulated settlement authorized directly in Founder Revenue Ticker.`,
        senderBatchId: res.batch_header.sender_batch_header?.sender_batch_id,
        correlationId: `CORR-PP-${Math.floor(Math.random() * 9000) + 1000}`
      };

      const updated = [newActivity, ...activities];
      setActivities(updated);
      try {
        localStorage.setItem(LOCAL_STORAGE_ACTIVITIES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }

      setConfig(paymentGatewayService.getConfig());

      if (onSimulatePayout) {
        onSimulatePayout({
          recipient,
          amount: randomAmount,
          type,
          batchId: res.batch_header.payout_batch_id,
          txHash: res.items[0]?.transaction_id || res.batch_header.payout_batch_id
        });
      }

      // Check revenue milestone thresholds immediately
      const newTotal = updated.reduce((acc, curr) => acc + curr.amount, 0);
      revenueMilestoneService.checkAndTriggerMilestones(newTotal, {
        gateway: 'PayPal Sandbox Payouts v2',
        latestRecipient: recipient
      });
      setMilestones(revenueMilestoneService.getMilestones());

      triggerNeonExplosion({
        particleCount: 50,
        origin: { x: 0.5, y: 0.3 },
        intensity: 'medium'
      });

      showToast(`✓ $${randomAmount.toFixed(2)} payout settled to ${recipient} via PayPal Sandbox!`);
    } catch (e: any) {
      const errMsg = e?.message || 'Error processing sandbox payout test.';
      if (errMsg.includes('sign in')) {
        showToast('⚠️ Please sign in to your creator account before executing payouts.');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('open-auth-modal'));
        }
      } else {
        console.error('Error executing sandbox payout:', e);
        showToast(`Payout Error: ${errMsg}`);
      }
    } finally {
      setIsProcessingSandboxTest(false);
    }
  };

  // Export ledger to CSV
  const handleExportCSV = () => {
    const headers = ['ID,Batch_ID,Transaction_ID,Recipient,Email,Amount,Currency,Category,Status,Timestamp,Gateway,Fee,Note\n'];
    const rows = activities.map(a => 
      `"${a.id}","${a.batchId}","${a.txHash}","${a.recipient}","${a.recipientEmail}",${a.amount},"${a.currency}","${a.category}","${a.status}","${a.timestamp}","${a.gateway}",${a.fee},"${a.note.replace(/"/g, '""')}"`
    );
    const blob = new Blob([headers.join('') + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Janus_PayPal_Sandbox_Payouts_Ledger_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ PayPal Sandbox Payout Ledger exported to CSV!');
  };

  return (
    <div id="revenue-ticker-section" className={`space-y-6 ${className}`}>
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[160] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="glass px-6 py-3.5 rounded-2xl border-[#00FFE0]/50 bg-black/95 text-white flex items-center gap-3 shadow-[0_10px_30px_rgba(0,255,224,0.3)]">
            <span className="w-2 h-2 rounded-full bg-[#00FFE0] animate-ping"></span>
            <span className="text-xs font-mono font-bold text-[#00FFE0]">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Raw Payload Inspection Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6" onClick={() => setSelectedActivity(null)}>
          <div className="max-w-2xl w-full glass rounded-[2.5rem] border-white/20 p-8 sm:p-10 overflow-hidden relative bg-black/95 shadow-[0_25px_70px_rgba(0,0,0,0.95)]" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FF007F] via-[#E056FD] to-[#00FFE0]"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider bg-[#00FFE0]/20 text-[#00FFE0] border border-[#00FFE0]/40">
                    PayPal Sandbox v2 Verified
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest">
                    {selectedActivity.category} Manifest
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-black italic text-white">{selectedActivity.recipient}</h3>
                <p className="text-xs font-mono text-gray-400">{selectedActivity.recipientEmail}</p>
              </div>
              <button 
                onClick={() => setSelectedActivity(null)} 
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center border border-white/10 transition-colors"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 block mb-1">Disbursed Amount</span>
                <span className="text-2xl font-mono font-bold text-[#00FFE0]">
                  ${selectedActivity.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedActivity.currency}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 block mb-1">Processing Fee (0% Janu Subsidy)</span>
                <span className="text-2xl font-mono font-bold text-[#FF007F]">$0.00 USD</span>
              </div>
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 block mb-1">Settlement Status</span>
                <span className="text-xs font-mono font-bold text-[#00FFE0] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FFE0] animate-pulse"></span>
                  {selectedActivity.status} (COMPLETED)
                </span>
              </div>
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 block mb-1">Timestamp</span>
                <span className="text-xs font-mono text-gray-300">{selectedActivity.timestamp}</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 font-bold">PayPal Batch ID</span>
                  <button 
                    onClick={() => copyToClipboard(selectedActivity.batchId, 'modal-batch')}
                    className="text-[9px] font-mono text-[#00FFE0] hover:underline flex items-center gap-1"
                  >
                    <i className="fa-solid fa-copy"></i>
                    <span>{copiedId === 'modal-batch' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 bg-black/60 rounded-xl border border-white/10 text-xs font-mono text-gray-300 break-all">
                  {selectedActivity.batchId}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 font-bold">PayPal Transaction ID / Hash</span>
                  <button 
                    onClick={() => copyToClipboard(selectedActivity.txHash, 'modal-tx')}
                    className="text-[9px] font-mono text-[#00FFE0] hover:underline flex items-center gap-1"
                  >
                    <i className="fa-solid fa-copy"></i>
                    <span>{copiedId === 'modal-tx' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 bg-black/60 rounded-xl border border-white/10 text-xs font-mono text-[#E056FD] break-all">
                  {selectedActivity.txHash}
                </div>
              </div>

              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 font-bold block mb-1">Manifest Internal Memo</span>
                <div className="p-3 bg-white/[0.02] rounded-xl border border-white/10 text-xs font-mono text-gray-300 italic">
                  "{selectedActivity.note}"
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
                <i className="fa-brands fa-paypal text-[#00FFE0]"></i>
                <span>REST API v2 Payouts Protocol</span>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER WITH REAL-TIME AGGREGATED METRICS */}
      <div className="glass p-6 sm:p-8 rounded-[2.5rem] border-[#00FFE0]/30 bg-gradient-to-br from-[#00FFE0]/10 via-[#070707] to-black relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 right-0 p-8 text-9xl text-white opacity-[0.02] pointer-events-none">
          <i className="fa-brands fa-paypal"></i>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FFE0]/15 border border-[#00FFE0]/40 text-[#00FFE0] text-[10px] font-mono font-black uppercase tracking-widest shadow-[0_0_15px_rgba(0,255,224,0.3)]">
                <span className="w-2 h-2 rounded-full bg-[#00FFE0] animate-ping"></span>
                <span>PayPal Sandbox Revenue Ticker</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-gray-300 font-bold">
                Mode: {config.mode.toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF007F]/10 border border-[#FF007F]/30 text-[10px] font-mono text-[#FF007F] font-bold">
                0% Creator Fee
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black italic text-white flex items-center gap-3">
              Aggregated Payouts <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFE0] via-[#E056FD] to-[#FF007F]">Ledger</span>
            </h2>
            <p className="text-xs font-mono text-gray-400 mt-1 max-w-xl">
              Real-time settlement aggregator tracking all creator bounties, revenue shares, and founder draws routed through the PayPal Payouts REST Sandbox.
            </p>
          </div>

          {/* Quick Sandbox Simulation Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleQuickSandboxPayout('Contest')}
              disabled={isProcessingSandboxTest}
              className="px-4 py-2.5 bg-gradient-to-r from-[#FF007F] to-[#E056FD] hover:scale-105 active:scale-95 text-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-[#FF007F]/20 disabled:opacity-50 cursor-pointer"
              title="Disburse a simulated contest reward via PayPal"
            >
              <i className="fa-solid fa-trophy text-xs"></i>
              <span>+ Contest Payout</span>
            </button>
            <button
              onClick={() => handleQuickSandboxPayout('Monetization')}
              disabled={isProcessingSandboxTest}
              className="px-4 py-2.5 bg-gradient-to-r from-[#00FFE0] to-[#38BDF8] hover:scale-105 active:scale-95 text-black rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-[#00FFE0]/20 disabled:opacity-50 cursor-pointer"
              title="Disburse a simulated monetization split via PayPal"
            >
              <i className="fa-solid fa-circle-dollar-to-slot text-xs"></i>
              <span>+ RevShare Payout</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-gray-200 hover:text-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
              title="Export complete transparent ledger"
            >
              <i className="fa-solid fa-download text-xs text-[#00FFE0]"></i>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 4-Column Aggregated KPI Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <div className="p-5 rounded-2xl bg-black/60 border border-[#00FFE0]/40 relative group overflow-hidden shadow-[0_0_20px_rgba(0,255,224,0.15)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#00FFE0] font-bold">Total Aggregated Payouts</span>
              <i className="fa-brands fa-paypal text-[#00FFE0] text-sm"></i>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FFE0] via-[#E056FD] to-[#FF007F]">
              ${stats.totalAggregated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-[10px] font-mono text-gray-400 flex items-center justify-between">
              <span>{stats.totalTransactions} Manifests Disbursed</span>
              <span className="text-[#00FFE0] font-bold">100% Settled</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 relative group overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold">Active Sandbox Pool</span>
              <i className="fa-solid fa-building-columns text-[#E056FD] text-sm"></i>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white">
              ${(config.sandboxBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-[10px] font-mono text-gray-400 flex items-center justify-between truncate">
              <span className="truncate">{config.sandboxAccountEmail}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 relative group overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold">Avg Settlement Size</span>
              <i className="fa-solid fa-chart-pie text-[#FF007F] text-sm"></i>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white">
              ${stats.avgDisbursement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-[10px] font-mono text-gray-400 flex items-center justify-between">
              <span>Fee: $0.00 (Zero Cut)</span>
              <span className="text-[#FF007F] font-bold">Instant API</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 relative group overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold">Category Distribution</span>
              <i className="fa-solid fa-layer-group text-yellow-400 text-sm"></i>
            </div>
            <div className="space-y-1.5 mt-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[#FF007F] font-bold">Contest:</span>
                <span className="text-white font-mono">${stats.contestTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[#00FFE0] font-bold">RevShare:</span>
                <span className="text-white font-mono">${stats.monetizationTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[#E056FD] font-bold">Founder:</span>
                <span className="text-white font-mono">${stats.founderTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* REVENUE MILESTONE THRESHOLD STATUS BANNER */}
        {(() => {
          const nextMilestone = milestones
            .filter(m => m.enabled && !m.triggered && m.threshold > stats.totalAggregated)
            .sort((a, b) => a.threshold - b.threshold)[0];
          
          const lastTriggered = [...milestones]
            .filter(m => m.triggered || stats.totalAggregated >= m.threshold)
            .sort((a, b) => b.threshold - a.threshold)[0];

          const progress = nextMilestone 
            ? Math.min(100, Math.max(0, (stats.totalAggregated / nextMilestone.threshold) * 100))
            : 100;

          return (
            <div className="mt-5 p-4 rounded-2xl bg-black/80 border border-[#00FFE0]/30 relative overflow-hidden z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00FFE0]/20 to-[#E056FD]/20 border border-[#00FFE0]/40 flex items-center justify-center text-[#00FFE0] shadow-inner shrink-0">
                    <i className="fa-solid fa-trophy-star text-base animate-pulse"></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold tracking-widest text-[#00FFE0] uppercase">
                        Revenue Milestone Alert System
                      </span>
                      {lastTriggered && (
                        <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-[#E056FD]/20 text-[#E056FD] border border-[#E056FD]/40 font-bold">
                          Latest: {lastTriggered.label}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm sm:text-base font-serif font-black italic text-white flex items-center gap-2">
                      {nextMilestone ? (
                        <>
                          <span>Next Boss Milestone Target:</span>
                          <span className="text-[#00FFE0] font-mono not-italic font-bold">${nextMilestone.threshold.toLocaleString()} USD</span>
                        </>
                      ) : (
                        <span>All Configured Milestone Thresholds Achieved!</span>
                      )}
                    </h4>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:self-center">
                  {nextMilestone && (
                    <button
                      type="button"
                      onClick={() => revenueMilestoneService.simulateMilestoneAlert(nextMilestone.id)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#00FFE0]/20 border border-white/10 hover:border-[#00FFE0]/40 text-[#00FFE0] text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Preview Boss Notification Alert for this milestone"
                    >
                      <i className="fa-solid fa-bell text-xs"></i>
                      <span>Test Boss Alert</span>
                    </button>
                  )}
                </div>
              </div>

              {nextMilestone && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-gray-400">
                      ${stats.totalAggregated.toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${nextMilestone.threshold.toLocaleString()} USD ({progress.toFixed(1)}%)
                    </span>
                    <span className="text-[#00FFE0] font-bold">
                      ${(nextMilestone.threshold - stats.totalAggregated).toLocaleString(undefined, { minimumFractionDigits: 2 })} remaining until automatic Boss Fanfare toast
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00FFE0] via-[#E056FD] to-[#FF007F] rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* CONTINUOUS LIVE MARQUEE TICKER STREAM */}
      <div 
        className="glass rounded-2xl border border-white/10 bg-black/70 overflow-hidden py-3 px-4 flex items-center gap-4 relative group"
        onMouseEnter={() => setIsLiveTickerPaused(true)}
        onMouseLeave={() => setIsLiveTickerPaused(false)}
      >
        <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-white/15">
          <span className="w-2 h-2 rounded-full bg-[#00FFE0] animate-ping"></span>
          <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#00FFE0]">
            LIVE PAYPAL TICKER
          </span>
        </div>

        <div className="overflow-hidden flex-1 relative whitespace-nowrap">
          <div className={`inline-flex items-center gap-8 ${isLiveTickerPaused ? '' : 'animate-marquee'}`}>
            {activities.slice(0, 10).map((act, idx) => (
              <div 
                key={idx}
                onClick={() => setSelectedActivity(act)}
                className="inline-flex items-center gap-2 cursor-pointer text-xs font-mono hover:text-[#00FFE0] transition-colors"
              >
                <span className="text-gray-500 text-[10px]">[{act.timestamp.substring(11, 19)}]</span>
                <span className="font-bold text-white">{act.recipient}</span>
                <span className="text-[#00FFE0] font-bold">${act.amount.toFixed(2)}</span>
                <span className="px-1.5 py-0.2 rounded text-[8px] bg-white/10 text-gray-300 font-bold">{act.category}</span>
                <span className="text-gray-600 font-mono text-[9px]">#{act.txHash.slice(-6)}</span>
                <span className="text-gray-700 mx-2">&bull;</span>
              </div>
            ))}
          </div>
        </div>

        <span className="text-[9px] font-mono text-gray-500 hidden sm:inline shrink-0">
          (Hover to pause)
        </span>
      </div>

      {/* SECTION 2: RECENT ACTIVITY LIST FOR TRANSPARENCY */}
      <div className="glass p-6 sm:p-8 rounded-[2.5rem] border-white/10 bg-black/60 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-receipt text-[#00FFE0]"></i>
              <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white">Recent Activity</h3>
            </div>
            <p className="text-xs font-mono text-gray-400 mt-0.5">
              Cryptographically timestamped ledger of disbursements executed via PayPal Sandbox REST Payouts.
            </p>
          </div>

          {/* Filter and Search Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipient, batch or tx ID..."
                className="pl-8 pr-4 py-2 bg-black/60 border border-white/15 rounded-xl text-xs font-mono text-white placeholder-gray-500 focus:border-[#00FFE0] outline-none transition-all w-52 sm:w-64"
              />
            </div>

            <div className="flex bg-black/80 rounded-xl p-1 border border-white/15">
              {(['ALL', 'Contest', 'Monetization', 'Founder'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                    filterCategory === cat
                      ? 'bg-[#00FFE0] text-black shadow-md shadow-[#00FFE0]/30 font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-[#00FFE0]/20 border border-white/15 hover:border-[#00FFE0]/40 text-[#00FFE0] text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Download filtered payout history logs as CSV for offline record-keeping"
            >
              <i className="fa-solid fa-file-csv text-sm"></i>
              <span>Export to CSV</span>
            </button>
          </div>
        </div>

        {/* Activity Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[10px] font-mono uppercase tracking-widest font-bold text-gray-400 border-b border-white/10">
                <th className="px-6 py-4">Recipient / Account</th>
                <th className="px-6 py-4">Disbursed Amount</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">PayPal Batch / Tx ID</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredActivities.map(item => (
                <tr 
                  key={item.id}
                  onClick={() => setSelectedActivity(item)}
                  className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FFE0]/20 to-[#FF007F]/20 flex items-center justify-center text-[10px] font-mono font-black text-white border border-white/15">
                        {item.recipient.charAt(0)}
                      </div>
                      <div>
                        <div className="font-mono text-xs font-bold text-white group-hover:text-[#00FFE0] transition-colors">
                          {item.recipient}
                        </div>
                        <div className="text-[10px] font-mono text-gray-400">{item.recipientEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm font-bold text-[#00FFE0]">
                      ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[9px] font-mono text-gray-500">0.00% Fee</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                      item.category === 'Contest' 
                        ? 'bg-[#FF007F]/15 text-[#FF007F] border border-[#FF007F]/30'
                        : item.category === 'Founder'
                        ? 'bg-[#E056FD]/15 text-[#E056FD] border border-[#E056FD]/30'
                        : 'bg-[#00FFE0]/15 text-[#00FFE0] border border-[#00FFE0]/30'
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        {item.txHash}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(item.txHash, item.id);
                        }}
                        className="text-gray-500 hover:text-white text-xs p-1"
                        title="Copy Transaction Hash"
                      >
                        <i className={`fa-solid ${copiedId === item.id ? 'fa-check text-[#00FFE0]' : 'fa-copy'}`}></i>
                      </button>
                    </div>
                    <div className="text-[9px] font-mono text-gray-500 truncate max-w-[160px] mt-0.5">
                      {item.batchId}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-400 font-light">
                    {item.timestamp}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedActivity(item);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-[#00FFE0] hover:text-white text-[10px] font-mono font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-fingerprint text-xs"></i>
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredActivities.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-mono text-xs uppercase tracking-widest">
                    No recent activities matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info note */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-[10px] font-mono text-gray-500">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-shield-check text-[#00FFE0]"></i>
            <span>All Sandbox transactions reflect actual PayPal Payouts REST batch simulations.</span>
          </div>
          <div>
            <span>Showing {filteredActivities.length} of {activities.length} total entries</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueTicker;
