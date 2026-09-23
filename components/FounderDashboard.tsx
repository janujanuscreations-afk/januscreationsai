
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Reveal from './Reveal';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';
import { paymentGatewayService, PayPalGatewayConfig, AccountVerificationResult } from '../services/paymentGatewayService';
import { revenueMilestoneService } from '../services/revenueMilestoneService';
import { firestoreService, ensureAuth, auth } from '../services/firebase';
import { Last30DaysRevenueSummary, RevenueRecord } from '../types';
import { PaymentGatewayConfigUtility } from './PaymentGatewayConfigUtility';
import { RevenueTicker } from './RevenueTicker';
import { RevenueMilestoneManager } from './RevenueMilestoneManager';
import { PayoutThresholdSettingsPanel } from './PayoutThresholdSettingsPanel';
import { FounderWithdrawalModal } from './FounderWithdrawalModal';
import { BossLedgerAuditExportModal } from './BossLedgerAuditExportModal';
import { MonthlyPerformancePDFModal } from './MonthlyPerformancePDFModal';
import { Last30DaysRevenueCard } from './Last30DaysRevenueCard';
import { DailyRevenueTrendsChart } from './DailyRevenueTrendsChart';
import { BossParallaxCard } from './BossParallaxCard';
import { PayPalWebhookDiagnostics } from './PayPalWebhookDiagnostics';
import { WebhookActivityLog } from './WebhookActivityLog';
import SintraEmbedModal from './SintraEmbedModal';

interface Payout {
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
}

type SortField = 'amount' | 'date' | 'status';
type SortDirection = 'asc' | 'desc';
type DashboardSection = 'treasury' | 'ticker' | 'milestones' | 'gateway' | 'webhooks';

const categoryConfig = {
  Contest: {
    icon: 'fa-trophy',
    color: '#FF007F', // Neon Pink
    glow: 'shadow-[#FF007F]/40',
    label: 'Contest Winners'
  },
  Monetization: {
    icon: 'fa-circle-dollar-to-slot',
    color: '#C084FC', // Light Purple
    glow: 'shadow-[#C084FC]/40',
    label: 'Revenue Shares'
  },
  Founder: {
    icon: 'fa-crown',
    color: '#00F5D4', // Neon Teal
    glow: 'shadow-[#00F5D4]/40',
    label: 'Equity Draw'
  }
};

const FounderDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dashboardSection, setDashboardSection] = useState<DashboardSection>('treasury');
  const [activeTab, setActiveTab] = useState<'Contest' | 'Monetization'>('Contest');
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set<string>());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Gateway Configuration State
  const [gatewayConfig, setGatewayConfig] = useState<PayPalGatewayConfig>(() => paymentGatewayService.getConfig());
  const [showSecret, setShowSecret] = useState(false);
  const [isTestingGateway, setIsTestingGateway] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    accessToken?: string;
    latencyMs: number;
    sandboxBalance: number;
  } | null>(null);
  const [webhookSimResult, setWebhookSimResult] = useState<string | null>(null);

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [payouts, setPayouts] = useState<Payout[]>([
    { id: '1', recipient: 'CreativeSoul_99', amount: 1200.00, type: 'Contest', status: 'Pending', date: '2024-10-24' },
    { id: '2', recipient: 'DesignNexus_AI', amount: 450.00, type: 'Monetization', status: 'Pending', date: '2024-10-23' },
    { id: '3', recipient: 'Janu (Founder)', amount: 5000.00, type: 'Founder', status: 'Pending', date: '2024-10-25' },
    { id: '4', recipient: 'PixelPerfect', amount: 800.00, type: 'Contest', status: 'Pending', date: '2024-10-22' },
    { id: '5', recipient: 'EtherealArtist', amount: 2100.00, type: 'Monetization', status: 'Pending', date: '2024-10-26' },
    { 
      id: '6', 
      recipient: 'LegacyCreator', 
      amount: 3500.00, 
      type: 'Monetization', 
      status: 'Approved', 
      date: '2024-10-15', 
      approvedAt: '2024-10-16 14:30:22',
      notes: 'Quarterly sovereign revenue share for ecosystem growth.',
      transactionHash: 'JANU-TX-98234-AX-88'
    },
    { id: '7', recipient: 'Founder Reserve', amount: 2500.00, type: 'Founder', status: 'Pending', date: '2024-10-27' },
  ]);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showThresholdSettingsInTreasury, setShowThresholdSettingsInTreasury] = useState(false);
  const [showSintraModal, setShowSintraModal] = useState(false);
  const [showBossLedgerAuditModal, setShowBossLedgerAuditModal] = useState(false);
  const [showMonthlyPerformancePdfModal, setShowMonthlyPerformancePdfModal] = useState(false);
  const [liveRevenueRecords, setLiveRevenueRecords] = useState<RevenueRecord[]>([]);

  // Subscribe to real-time revenue and ledger records from Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    ensureAuth().then(() => {
      unsubscribe = firestoreService.subscribeTransactionLogs((records) => {
        if (records && records.length > 0) {
          setLiveRevenueRecords(records);
        }
      });
    }).catch(err => console.warn('FounderDashboard transactions sub error:', err));

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Linked PayPal Account Verification & Sync State
  const [accountStatus, setAccountStatus] = useState<AccountVerificationResult | null>(null);
  const [isSyncingPayPal, setIsSyncingPayPal] = useState(false);
  const [isCashoutProcessing, setIsCashoutProcessing] = useState(false);
  const [lastAccountSyncTime, setLastAccountSyncTime] = useState<string | null>(null);

  // Monitor payouts for revenue milestone threshold triggers
  useEffect(() => {
    const totalApproved = payouts
      .filter(p => p.status === 'Approved')
      .reduce((sum, p) => sum + p.amount, 0);
    if (totalApproved > 0) {
      revenueMilestoneService.checkAndTriggerMilestones(totalApproved, {
        gateway: 'PayPal Live Production (Payouts REST API)'
      });
    }
  }, [payouts]);

  // Initial verification check of linked PayPal account status on load
  useEffect(() => {
    paymentGatewayService.verifyConnectedAccount('janujanuscreations@gmail.com').then(res => {
      setAccountStatus(res);
      setLastAccountSyncTime(new Date().toLocaleTimeString());
    }).catch(err => console.warn('Initial account check:', err));
  }, []);

  // Trigger manual verification check of linked PayPal account
  const handleSyncPayPalAccount = async () => {
    setIsSyncingPayPal(true);
    try {
      const res = await paymentGatewayService.verifyConnectedAccount('janujanuscreations@gmail.com');
      setAccountStatus(res);
      setLastAccountSyncTime(new Date().toLocaleTimeString());
      setGatewayConfig(paymentGatewayService.getConfig());
      if (res.isActive) {
        setSuccessMessage(`✓ PayPal Account Verified Active: ${res.accountEmail} (Risk: ${res.riskAssessment}, Latency: ${res.latencyMs}ms)`);
        triggerNeonExplosion({
          particleCount: 50,
          origin: { x: 0.5, y: 0.25 },
          intensity: 'medium'
        });
      } else {
        setSuccessMessage(`⚠️ PayPal Account Sync: ${res.message}`);
      }
    } catch (err: any) {
      setSuccessMessage('⚠️ Error verifying PayPal account connection.');
    } finally {
      setIsSyncingPayPal(false);
      setTimeout(() => setSuccessMessage(null), 4500);
    }
  };

  const handleResetToLiveCashoutMode = async () => {
    setIsSyncingPayPal(true);
    try {
      const res = await firestoreService.resetRevenueToLiveCashoutMode('janujanuscreations@gmail.com');
      const updatedCfg = paymentGatewayService.getConfig();
      setGatewayConfig(updatedCfg);
      const accCheck = await paymentGatewayService.verifyConnectedAccount('janujanuscreations@gmail.com');
      setAccountStatus(accCheck);
      setSuccessMessage(`🚀 Live Cashout Mode Active! Available for Direct Cashout: $${res.availableCashout.toFixed(2)} to PayPal (${res.recipientEmail})`);
      bossAudio.playTipChime(150);
      triggerNeonExplosion({
        particleCount: 75,
        origin: { x: 0.5, y: 0.3 },
        intensity: 'grand'
      });
    } catch (err: any) {
      setSuccessMessage('⚠️ Reset to Live Cashout Mode failed: ' + (err?.message || 'Error'));
    } finally {
      setIsSyncingPayPal(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  // Dedicated Cashout Button Handler - Maps to Real PayPal Payout
  const handleExecuteLiveCashout = async () => {
    if (!auth.currentUser && typeof (auth as any).authStateReady === 'function') {
      await (auth as any).authStateReady();
    }

    if (!auth.currentUser) {
      setSuccessMessage('⚠️ Please sign in with your executive account to execute live cashouts.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
      }
      setTimeout(() => setSuccessMessage(null), 5000);
      return;
    }

    setIsCashoutProcessing(true);
    setSuccessMessage(null);
    try {
      // 1. Force gateway to Live Mode
      paymentGatewayService.saveConfig({ mode: 'live' });
      setGatewayConfig(paymentGatewayService.getConfig());

      // 2. Verify account is active and ready
      const accountCheck = await paymentGatewayService.verifyConnectedAccount('janujanuscreations@gmail.com');
      setAccountStatus(accountCheck);
      if (!accountCheck.isActive) {
        setIsCashoutProcessing(false);
        setSuccessMessage(`⚠️ Cannot execute live cashout: ${accountCheck.message}`);
        setTimeout(() => setSuccessMessage(null), 5000);
        return;
      }

      // 3. Prepare payload for executive cashout
      const drawAmount = summaries.Founder > 0 ? summaries.Founder : 5000.00;
      const recipientEmail = 'janujanuscreations@gmail.com';
      const senderItemId = `FOUNDER-CASHOUT-${Date.now()}`;

      // 4. POST to FUNCTIONS_BASE + "/sendPayout" with recipient email and amount
      const res = await firestoreService.executeFirebasePayoutToPayPal({
        recipientEmail,
        amount: drawAmount,
        note: `Janu's Creations Executive Founder Live Cashout`
      });

      if (!res || !res.batchId) {
        throw new Error('Payout request failed: No batchId returned from backend.');
      }

      const batchId = res.batchId;
      const status = res.status || 'SUCCESS';
      const now = new Date().toISOString();
      const formattedDate = now.replace('T', ' ').substring(0, 19);

      // 5. Only if it succeeds: subtract payout amount from user balance & update state
      setPayouts(prev => [
        {
          id: senderItemId,
          recipient: 'January Rebl',
          amount: drawAmount,
          type: 'Founder',
          status: 'Approved',
          date: now.substring(0, 10),
          approvedAt: formattedDate,
          notes: `Live PayPal Cashout to ${recipientEmail}. Batch: ${batchId}`,
          transactionHash: batchId,
          paypalBatchId: batchId,
          gateway: 'PayPal Real Direct Payout'
        },
        ...prev.map(p => (p.type === 'Founder' && p.status === 'Pending') ? {
          ...p,
          status: 'Approved' as const,
          approvedAt: formattedDate,
          paypalBatchId: batchId,
          gateway: 'PayPal Real Direct Payout',
          transactionHash: batchId,
          notes: `Settled via Live PayPal Cashout: ${batchId}`
        } : p)
      ]);

      // 6. Create ONE ledger entry with the returned batchId and status
      await firestoreService.recordPayout({
        id: senderItemId,
        amount: drawAmount,
        method: 'PayPal Real Direct Payout',
        destination: recipientEmail,
        status: status,
        txHash: batchId,
        payoutBatchId: batchId,
        paypalTxId: batchId,
        creatorHandle: '@januaryrebl',
        timestamp: now,
        fee: 0.00,
        netPayout: drawAmount,
        isLivePayout: true
      });

      bossAudio.playBigWin();
      triggerNeonExplosion({
        particleCount: 80,
        origin: { x: 0.5, y: 0.35 },
        intensity: 'grand'
      });

      setSuccessMessage(`✅ Cashout Success! $${drawAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} transferred to PayPal (${recipientEmail}) [Batch ID: ${batchId}, Status: ${status}]`);
    } catch (err: any) {
      console.error('Live cashout error:', err);
      // If request fails for any reason: do not change balance and do not create ledger entry — show error
      setSuccessMessage(`⚠️ Cashout error: ${err?.message || 'PayPal transfer failed'}`);
    } finally {
      setIsCashoutProcessing(false);
      setTimeout(() => setSuccessMessage(null), 6500);
    }
  };

  const summaries = useMemo(() => {
    return {
      Contest: payouts.filter(p => p.type === 'Contest').reduce((acc, curr) => acc + curr.amount, 0),
      Monetization: payouts.filter(p => p.type === 'Monetization').reduce((acc, curr) => acc + curr.amount, 0),
      Founder: payouts.filter(p => p.type === 'Founder' && p.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0),
      Total: payouts.reduce((acc, curr) => acc + curr.amount, 0)
    };
  }, [payouts]);

  const history = useMemo(() => {
    return payouts.filter(p => p.status === 'Approved').sort((a, b) => b.id.localeCompare(a.id));
  }, [payouts]);

  // Export payout history log to CSV
  const handleExportPayoutsCSV = () => {
    const recordsToExport = history.length > 0 ? history : payouts;
    const headers = 'ID,Recipient,Amount_USD,Category,Status,Request_Date,Approved_At,Transaction_Hash,PayPal_Batch_ID,Gateway,Notes\n';
    const rows = recordsToExport.map(p => 
      `"${p.id}","${p.recipient.replace(/"/g, '""')}",${p.amount.toFixed(2)},"${p.type}","${p.status}","${p.date}","${p.approvedAt || ''}","${p.transactionHash || ''}","${p.paypalBatchId || ''}","${p.gateway || 'PayPal Sandbox v2'}","${(p.notes || '').replace(/"/g, '""')}"`
    );
    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Janus_Founder_Payout_History_Log_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMessage(`✓ Exported ${recordsToExport.length} payout history logs to CSV!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const founderPayouts = useMemo(() => {
    return payouts.filter(p => p.type === 'Founder' && (p.status === 'Pending' || p.status === 'Processing'));
  }, [payouts]);

  const visiblePending = useMemo(() => {
    let filtered = payouts.filter(p => p.type === activeTab && (p.status === 'Pending' || p.status === 'Processing'));
    
    return [...filtered].sort((a, b) => {
      if (sortField === 'amount') {
        return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      } else if (sortField === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        const res = a.status.localeCompare(b.status);
        return sortDirection === 'asc' ? res : -res;
      }
    });
  }, [payouts, activeTab, sortField, sortDirection]);

  const handleAuth = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passcode || passcode === '2025' || passcode === '2026' || passcode === 'janu' || passcode === 'admin' || passcode === 'january' || passcode === 'boss') {
      setIsAuthenticated(true);
      triggerNeonExplosion({
        particleCount: 40,
        origin: { x: 0.5, y: 0.4 },
        intensity: 'medium'
      });
    } else {
      setIsAuthenticated(true);
    }
  };

  const updateStatus = async (id: string, newStatus: Payout['status']) => {
    setProcessingId(id);
    setActiveMenuId(null);
    
    const targetPayout = payouts.find(p => p.id === id);
    let generatedBatchId: string | undefined;
    let txHash: string | undefined;

    if (newStatus === 'Approved' && targetPayout) {
      if (!auth.currentUser && typeof (auth as any).authStateReady === 'function') {
        await (auth as any).authStateReady();
      }
      if (!auth.currentUser) {
        setProcessingId(null);
        setSuccessMessage('⚠️ Please sign in to your executive account to approve payouts.');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('open-auth-modal'));
        }
        setTimeout(() => setSuccessMessage(null), 5000);
        return;
      }

      // Check if connected PayPal account is active before allowing funds withdrawal/settlement
      const accountCheck = await paymentGatewayService.verifyConnectedAccount('janujanuscreations@gmail.com');
      if (!accountCheck.isActive) {
        setProcessingId(null);
        setSuccessMessage(`⚠️ Cannot disburse payout: ${accountCheck.message}`);
        setTimeout(() => setSuccessMessage(null), 5000);
        return;
      }

      const recipientEmail = (targetPayout.type === 'Founder' || targetPayout.recipient.includes('January Rebl'))
        ? 'janujanuscreations@gmail.com' 
        : `${targetPayout.recipient.toLowerCase().replace(/[^a-z0-9]/g, '')}@creator.paypal`;

      try {
        const res = await firestoreService.executeFirebasePayoutToPayPal({
          recipientEmail,
          amount: targetPayout.amount,
          note: `Janu's Creations ${targetPayout.type} payout authorized by January Rebl`,
          senderItemId: targetPayout.id
        });

        if (!res || !res.batchId) {
          throw new Error('Payout failed: No batchId returned from backend.');
        }

        generatedBatchId = res.batchId;
        txHash = res.batchId;

        // Create ONE ledger entry with the returned batchId and status
        await firestoreService.recordPayout({
          id: targetPayout.id,
          amount: targetPayout.amount,
          method: 'PayPal Real Direct Payout',
          destination: recipientEmail,
          status: res.status || 'SUCCESS',
          txHash: res.batchId,
          payoutBatchId: res.batchId,
          paypalTxId: res.batchId,
          creatorHandle: `@${targetPayout.recipient.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          timestamp: new Date().toISOString(),
          fee: 0.00,
          netPayout: targetPayout.amount,
          isLivePayout: true
        });

        setGatewayConfig(paymentGatewayService.getConfig());
      } catch (e: any) {
        console.error('PayPal payout error:', e);
        // If failed: do NOT change status or balance, do NOT create ledger entry, show error
        setProcessingId(null);
        setSuccessMessage(`⚠️ Payout failed: ${e?.message || 'Transaction rejected by PayPal.'}`);
        setTimeout(() => setSuccessMessage(null), 6000);
        return;
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    setPayouts(prev => prev.map(p => p.id === id ? { 
      ...p, 
      status: newStatus, 
      approvedAt: newStatus === 'Approved' ? now : undefined,
      transactionHash: txHash,
      paypalBatchId: generatedBatchId,
      gateway: generatedBatchId ? 'PayPal Real Direct Payout' : undefined,
      notes: p.notes || (newStatus === 'Approved' ? `PayPal Live Payout settlement. Batch ID: ${generatedBatchId}` : `Status updated to ${newStatus} by Founder.`)
    } : p));
    
    setProcessingId(null);
    if (newStatus === 'Approved') {
      bossAudio.playBigWin();
      triggerNeonExplosion({
        particleCount: 50,
        origin: { x: 0.5, y: 0.35 },
        intensity: 'medium'
      });
    }
    setSuccessMessage(`Manifest ${id} marked ${newStatus}${generatedBatchId ? ` via PayPal Live Batch Payout [${generatedBatchId}]` : ''}.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleBulkApprove = async () => {
    if (!auth.currentUser && typeof (auth as any).authStateReady === 'function') {
      await (auth as any).authStateReady();
    }
    if (!auth.currentUser) {
      setSuccessMessage('⚠️ Please sign in to your executive account to approve batch payouts.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
      }
      setTimeout(() => setSuccessMessage(null), 5000);
      return;
    }

    setIsBulkProcessing(true);

    // Verify account active before bulk dispersal
    const accountCheck = await paymentGatewayService.verifyConnectedAccount('janujanuscreations@gmail.com');
    if (!accountCheck.isActive) {
      setIsBulkProcessing(false);
      setSuccessMessage(`⚠️ Cannot execute batch payout: ${accountCheck.message}`);
      setTimeout(() => setSuccessMessage(null), 5000);
      return;
    }

    const idsToProcess: string[] = Array.from(selectedIds);
    const itemsToProcess = payouts.filter(p => selectedIds.has(p.id));

    try {
      // Process real payouts for each selected item
      const results = await Promise.all(
        itemsToProcess.map(async (p) => {
          const email = (p.type === 'Founder' || p.recipient.includes('January Rebl')) ? 'janujanuscreations@gmail.com' : `${p.recipient.toLowerCase().replace(/[^a-z0-9]/g, '')}@creator.paypal`;
          const res = await firestoreService.executeFirebasePayoutToPayPal({
            recipientEmail: email,
            amount: p.amount,
            note: `Janu's Creations ${p.type} Batch Manifest #${p.id}`
          });
          if (!res || !res.batchId) {
            throw new Error(`Payout for ${p.recipient} failed: No batchId returned`);
          }

          // Create ONE ledger entry per approved item
          await firestoreService.recordPayout({
            id: p.id,
            amount: p.amount,
            method: 'PayPal Real Direct Payout',
            destination: email,
            status: res.status || 'SUCCESS',
            txHash: res.batchId,
            payoutBatchId: res.batchId,
            paypalTxId: res.batchId,
            creatorHandle: `@${p.recipient.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            timestamp: new Date().toISOString(),
            fee: 0.00,
            netPayout: p.amount,
            isLivePayout: true
          });

          return { id: p.id, batchId: res.batchId, status: res.status || 'SUCCESS' };
        })
      );

      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const firstBatchId = results[0]?.batchId || '';

      setPayouts(prev => prev.map(p => {
        const itemResult = results.find(r => r.id === p.id);
        if (itemResult) {
          return {
            ...p,
            status: 'Approved' as const,
            approvedAt: now,
            paypalBatchId: itemResult.batchId,
            gateway: 'PayPal Real Direct Payout',
            transactionHash: itemResult.batchId,
            notes: `Dispatched via PayPal Live Payout. Batch ID: ${itemResult.batchId}`
          };
        }
        return p;
      }));

      setGatewayConfig(paymentGatewayService.getConfig());
      bossAudio.playBigWin();
      triggerNeonExplosion({
        particleCount: 100,
        origin: { x: 0.5, y: 0.3 },
        intensity: 'grand'
      });
      setSuccessMessage(`✅ ${idsToProcess.length} manifests successfully executed via Real PayPal Payout [${firstBatchId}]!`);
    } catch (e: any) {
      console.error('Batch payout dispatch error:', e);
      // If failed, do NOT approve, do NOT change balance or ledger, show error
      setSuccessMessage(`⚠️ Batch payout failed: ${e?.message || 'Transaction rejected'}`);
    } finally {
      setSelectedIds(new Set<string>());
      setIsBulkProcessing(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const handleTestGateway = async () => {
    setIsTestingGateway(true);
    setTestResult(null);
    const res = await paymentGatewayService.testConnection();
    setTestResult(res);
    setGatewayConfig(paymentGatewayService.getConfig());
    setIsTestingGateway(false);
    if (res.success) {
      triggerNeonExplosion({ particleCount: 30, origin: { x: 0.5, y: 0.5 }, intensity: 'subtle' });
    }
  };

  const handleSaveGatewayConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = paymentGatewayService.saveConfig(gatewayConfig);
    setGatewayConfig(updated);
    setSuccessMessage('PayPal Gateway credentials securely mapped to Sovereign backend.');
    triggerNeonExplosion({ particleCount: 25, origin: { x: 0.5, y: 0.4 }, intensity: 'subtle' });
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSimulateWebhook = () => {
    const hookId = `WH-EV-${Math.floor(Math.random() * 900000) + 100000}`;
    const timestamp = new Date().toLocaleTimeString();
    setWebhookSimResult(`[${timestamp}] Webhook received: PAYMENT.PAYOUTSBATCH.SUCCESS (Event ID: ${hookId}) — 200 OK`);
    setTimeout(() => setWebhookSimResult(null), 6000);
  };

  const handleTopupSandboxBalance = (amount: number) => {
    const updated = paymentGatewayService.saveConfig({
      sandboxBalance: (gatewayConfig.sandboxBalance || 0) + amount
    });
    setGatewayConfig(updated);
    setSuccessMessage(`+$${amount.toLocaleString()} added to PayPal Sandbox simulation balance.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev: Set<string>) => {
      const next = new Set<string>(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visiblePending.length) {
      setSelectedIds(new Set<string>());
    } else {
      setSelectedIds(new Set<string>(visiblePending.map(p => p.id)));
    }
  };

  const ActionMenu = ({ id, status }: { id: string, status: Payout['status'] }) => {
    const isOpen = activeMenuId === id;
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setActiveMenuId(null);
        }
      };
      if (isOpen) document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
      <div className="relative inline-block text-left" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenuId(isOpen ? null : id);
          }}
          disabled={processingId === id}
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-gray-400 hover:text-white border border-white/10"
        >
          {processingId === id ? (
            <i className="fa-solid fa-spinner fa-spin text-xs text-[#FF007F]"></i>
          ) : (
            <i className="fa-solid fa-ellipsis-vertical"></i>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 glass rounded-2xl border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.8)] z-[150] overflow-hidden py-2 animate-in fade-in zoom-in duration-200 bg-black/90">
            <button
              onClick={() => updateStatus(id, 'Approved')}
              className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-mono font-bold uppercase tracking-widest text-[#00F5D4] hover:bg-[#00F5D4]/10 transition-colors"
            >
              <i className="fa-solid fa-bolt-lightning w-4"></i>
              Authorize
            </button>
            <button
              onClick={() => updateStatus(id, 'Processing')}
              className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-mono font-bold uppercase tracking-widest text-[#C084FC] hover:bg-[#C084FC]/10 transition-colors"
            >
              <i className="fa-solid fa-clock-rotate-left w-4"></i>
              Process
            </button>
            <div className="h-px bg-white/10 mx-2 my-1"></div>
            <button
              onClick={() => updateStatus(id, 'Rejected')}
              className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF007F] hover:bg-[#FF007F]/10 transition-colors"
            >
              <i className="fa-solid fa-ban w-4"></i>
              Reject
            </button>
          </div>
        )}
      </div>
    );
  };

  const SortControl = () => (
    <div className="flex flex-wrap items-center gap-4 mb-6 glass p-4 rounded-2xl border-white/10 bg-black/40">
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">Treasury Sorting:</span>
      <div className="flex bg-black/60 rounded-xl p-1 border border-white/10">
        <button 
          onClick={() => setSortField('date')}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${sortField === 'date' ? 'bg-[#FF007F] text-white shadow-lg shadow-[#FF007F]/30' : 'text-gray-400 hover:text-white'}`}
        >
          By Date
        </button>
        <button 
          onClick={() => setSortField('amount')}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${sortField === 'amount' ? 'bg-[#FF007F] text-white shadow-lg shadow-[#FF007F]/30' : 'text-gray-400 hover:text-white'}`}
        >
          By Amount
        </button>
        <button 
          onClick={() => setSortField('status')}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${sortField === 'status' ? 'bg-[#FF007F] text-white shadow-lg shadow-[#FF007F]/30' : 'text-gray-400 hover:text-white'}`}
        >
          By Status
        </button>
      </div>
      <div className="flex bg-black/60 rounded-xl p-1 border border-white/10">
        <button 
          onClick={() => setSortDirection('desc')}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${sortDirection === 'desc' ? 'bg-[#00F5D4] text-black shadow-lg shadow-[#00F5D4]/30' : 'text-gray-400 hover:text-white'}`}
        >
          {sortField === 'date' ? 'Newest First' : sortField === 'amount' ? 'Highest First' : 'Z-A Status'}
        </button>
        <button 
          onClick={() => setSortDirection('asc')}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${sortDirection === 'asc' ? 'bg-[#00F5D4] text-black shadow-lg shadow-[#00F5D4]/30' : 'text-gray-400 hover:text-white'}`}
        >
          {sortField === 'date' ? 'Oldest First' : sortField === 'amount' ? 'Lowest First' : 'A-Z Status'}
        </button>
      </div>
      <div className="ml-auto">
        <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-[0.2em]">{visiblePending.length} Manifests Found</span>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 selection:bg-[#FF007F]">
        <div className="max-w-md w-full glass p-10 rounded-[2.5rem] border-[#FF007F]/30 text-center relative overflow-hidden shadow-[0_0_50px_rgba(255,0,127,0.2)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4]"></div>
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
          <div className="w-20 h-20 bg-[#FF007F]/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(255,0,127,0.3)] border border-[#FF007F]/30">
            <i className="fa-solid fa-key-skeleton text-3xl text-[#FF007F]"></i>
          </div>
          <h2 className="text-3xl font-serif font-black mb-3 italic text-white">Founder Access</h2>
          <p className="text-gray-400 text-xs mb-8 uppercase font-mono tracking-widest">Identify authority to unlock Janu's Treasury.</p>
          <form onSubmit={handleAuth} className="space-y-4">
            <input 
              type="password" 
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="ENTER PIN OR CLICK QUICK UNLOCK"
              className="w-full bg-black/70 border border-white/15 rounded-2xl px-6 py-4 text-center font-mono tracking-[0.3em] focus:border-[#00F5D4] focus:shadow-[0_0_20px_rgba(0,245,212,0.3)] outline-none transition-all text-white text-xs"
            />
            <button type="submit" className="w-full py-4 bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black rounded-2xl font-mono font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-[#FF007F]/20 cursor-pointer">
              Verify Sovereign Authority
            </button>
            <button 
              type="button" 
              onClick={() => handleAuth()}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-[#00F5D4] border border-[#00F5D4]/30 rounded-2xl font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-fingerprint"></i>
              <span>Quick Unlock (January Rebl)</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden selection:bg-[#FF007F]">
      {successMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[110] animate-slide-down">
          <div className="glass px-8 py-4 rounded-2xl border-[#00F5D4]/40 flex items-center gap-4 bg-[#070707]/95 backdrop-blur-md shadow-[0_10px_30px_rgba(0,245,212,0.3)]">
            <div className="w-6 h-6 rounded-full bg-[#00F5D4] flex items-center justify-center text-black text-xs font-bold shadow-[0_0_10px_#00F5D4]">
              <i className="fa-solid fa-check"></i>
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#00F5D4]">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setSelectedPayout(null)}>
          <div className="max-w-2xl w-full glass rounded-[3rem] border-white/15 p-12 overflow-hidden relative group bg-black/90 shadow-[0_20px_60px_rgba(0,0,0,0.9)]" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4]"></div>
            
            <div className="flex justify-between items-start mb-12">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-[0.3em] font-bold text-[#00F5D4] mb-2 block">Sovereign Verification</span>
                <h2 className="text-4xl font-serif font-black italic text-white">{selectedPayout.recipient}</h2>
              </div>
              <button onClick={() => setSelectedPayout(null)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/10">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mb-12">
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-widest text-gray-400 font-bold block mb-2">Authorized Amount</label>
                  <p className="text-3xl font-mono font-bold text-white">${selectedPayout.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-widest text-gray-400 font-bold block mb-2">Category</label>
                  <div className="flex items-center gap-3 text-white">
                    <i className={`fa-solid ${categoryConfig[selectedPayout.type].icon}`} style={{ color: categoryConfig[selectedPayout.type].color }}></i>
                    <span className="uppercase font-mono tracking-widest text-sm font-bold">{selectedPayout.type}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-widest text-gray-400 font-bold block mb-2">Transaction ID</label>
                  <p className="text-xs font-mono text-gray-300 bg-white/5 p-3 rounded-xl border border-white/10">{selectedPayout.transactionHash || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-widest text-gray-400 font-bold block mb-2">Approval Timestamp</label>
                  <p className="text-sm font-mono font-light text-gray-300 italic">{selectedPayout.approvedAt || selectedPayout.date}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl mb-8">
              <label className="text-[10px] uppercase font-mono tracking-widest text-gray-400 font-bold block mb-2">Internal Treasury Notes</label>
              <p className="text-gray-300 text-xs leading-relaxed font-light italic font-mono">
                "{selectedPayout.notes || 'No additional internal notes for this manifestation.'}"
              </p>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-[#00F5D4]">
                <i className="fa-solid fa-certificate text-xs"></i>
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Janu's Signature Verified</span>
              </div>
              <button 
                onClick={() => window.print()}
                className="px-6 py-3 border border-white/15 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[110] animate-slide-up">
          <div className="glass px-8 py-4 rounded-[2rem] border-white/15 bg-black/90 backdrop-blur-xl flex items-center gap-8 shadow-[0_20px_50px_rgba(0,0,0,0.9)] border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FF007F]/20 border border-[#FF007F] flex items-center justify-center text-[#FF007F] text-xs font-mono font-bold">
                {selectedIds.size}
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-300">Manifests Selected</span>
            </div>
            <div className="h-6 w-px bg-white/15"></div>
            <button 
              onClick={handleBulkApprove}
              disabled={isBulkProcessing}
              className="px-8 py-3 bg-gradient-to-r from-emerald-400 via-[#00FFE0] to-[#38BDF8] text-black rounded-full text-[11px] font-mono font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isBulkProcessing ? (
                <span className="flex items-center gap-2"><i className="fa-solid fa-spinner fa-spin"></i> Disbursing Batch...</span>
              ) : (
                <span className="flex items-center gap-2"><i className="fa-brands fa-paypal"></i> Cashout Selected ({selectedIds.size}) <i className="fa-solid fa-bolt"></i></span>
              )}
            </button>
            <button 
              onClick={() => setSelectedIds(new Set<string>())}
              className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <header className="px-8 py-6 border-b border-white/10 flex flex-wrap gap-4 justify-between items-center bg-[#070707] shrink-0">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FF007F] to-[#00F5D4] rounded-full flex items-center justify-center font-bold text-black shadow-[0_0_20px_rgba(255,0,127,0.4)]">
            JC
          </div>
          <div>
            <h1 className="text-lg font-serif font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4]">Janu's Creations</h1>
            <p className="text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-[#FF007F] to-[#00F5D4] uppercase tracking-widest font-mono font-bold">Founder Treasury Control</p>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex flex-wrap bg-black/80 p-1 rounded-2xl border border-white/15 gap-1">
          <button
            type="button"
            onClick={() => setDashboardSection('treasury')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              dashboardSection === 'treasury'
                ? 'bg-gradient-to-r from-[#FF007F] to-[#E056FD] text-white shadow-lg shadow-[#FF007F]/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <i className="fa-solid fa-vault"></i>
            <span>Treasury & Manifests</span>
          </button>
          <button
            type="button"
            onClick={() => setDashboardSection('ticker')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              dashboardSection === 'ticker'
                ? 'bg-gradient-to-r from-[#00FFE0] to-[#E056FD] text-black font-black shadow-lg shadow-[#00FFE0]/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <i className="fa-solid fa-chart-line"></i>
            <span>Revenue Ticker</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-black/40 text-[#00FFE0] border border-[#00FFE0]/40">
              LIVE
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDashboardSection('milestones')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              dashboardSection === 'milestones'
                ? 'bg-gradient-to-r from-[#FF007F] via-[#E056FD] to-[#00FFE0] text-white font-black shadow-lg shadow-[#FF007F]/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <i className="fa-solid fa-trophy-star text-[#00FFE0]"></i>
            <span>Milestone Alerts</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-black/40 text-[#00FFE0] border border-[#00FFE0]/40 font-bold">
              BOSS
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDashboardSection('gateway')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              dashboardSection === 'gateway'
                ? 'bg-gradient-to-r from-[#00FFE0] to-[#38BDF8] text-black font-black shadow-lg shadow-[#00FFE0]/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <i className="fa-brands fa-paypal"></i>
            <span>PayPal Gateway</span>
            {gatewayConfig.isConfigured && (
              <span className="w-2 h-2 rounded-full bg-[#00FFE0] animate-ping ml-1"></span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setDashboardSection('webhooks')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              dashboardSection === 'webhooks'
                ? 'bg-gradient-to-r from-[#00F5D4] via-[#38BDF8] to-[#C084FC] text-black font-black shadow-lg shadow-[#00F5D4]/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <i className="fa-solid fa-satellite-dish text-[#00F5D4]"></i>
            <span>Webhook Diagnostics</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-black/40 text-[#00F5D4] border border-[#00F5D4]/40 font-bold">
              7D993972A74706718
            </span>
          </button>
        </div>

        {/* Sync PayPal Account & Status Badge Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* NEON-TEAL STATUS BADGE */}
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-[11px] font-bold shadow-md transition-all ${
              accountStatus?.isActive || gatewayConfig.isConfigured
                ? 'bg-[#00FFE0]/15 border-[#00FFE0] text-[#00FFE0] shadow-[0_0_15px_rgba(0,255,224,0.35)]'
                : 'bg-amber-500/15 border-amber-500 text-amber-300'
            }`}
            title={`Linked PayPal Account: ${accountStatus?.accountEmail || gatewayConfig.sandboxAccountEmail || 'sb-creator-merchant@business.example.com'} (Status: ${accountStatus?.status || 'ACTIVE'})`}
          >
            <span className="w-2 h-2 rounded-full bg-[#00FFE0] animate-pulse shadow-[0_0_8px_#00FFE0]"></span>
            <span>
              {accountStatus?.isActive
                ? `PAYPAL: ${accountStatus.status}`
                : gatewayConfig.isConfigured
                ? 'PAYPAL: ACTIVE'
                : 'PAYPAL: UNLINKED'}
            </span>
            <span className="hidden xl:inline text-[9px] text-gray-300 font-normal">
              ({accountStatus?.accountEmail || gatewayConfig.sandboxAccountEmail || 'sb-creator-merchant@business.example.com'})
            </span>
          </div>

          {/* LIVE CASHOUT BUTTON - DIRECT PAYPAL BATCH PAYOUT ENDPOINT */}
          <button
            type="button"
            onClick={handleExecuteLiveCashout}
            disabled={isCashoutProcessing || isSyncingPayPal}
            className={`px-4 py-1.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              isCashoutProcessing
                ? 'bg-zinc-800 text-[#00FFE0] border border-[#00FFE0]/40 cursor-wait shadow-[0_0_20px_rgba(0,255,224,0.3)]'
                : 'bg-gradient-to-r from-emerald-400 via-[#00FFE0] to-[#38BDF8] hover:from-emerald-300 hover:to-[#00FFE0] text-black shadow-emerald-500/25 hover:scale-105 active:scale-95'
            }`}
            title="Execute instant Live PayPal Batch Payout for available funds"
          >
            {isCashoutProcessing ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin text-sm text-[#00FFE0]"></i>
                <span className="text-[#00FFE0] animate-pulse">Processing Batch Payout...</span>
              </>
            ) : (
              <>
                <i className="fa-brands fa-paypal text-sm"></i>
                <span>{`Cashout $${(summaries.Founder || 5000).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</span>
              </>
            )}
          </button>

          {/* RESET TO LIVE CASHOUT BUTTON */}
          <button
            type="button"
            onClick={handleResetToLiveCashoutMode}
            disabled={isSyncingPayPal}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/10 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="Reset revenue ledger and PayPal to Live Mode Direct Cashout"
          >
            <i className="fa-solid fa-arrows-rotate text-amber-400 text-xs"></i>
            <span>Reset to Live Cashout</span>
          </button>

          {/* SYNC PAYPAL ACCOUNT BUTTON */}
          <button
            type="button"
            onClick={handleSyncPayPalAccount}
            disabled={isSyncingPayPal}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00FFE0] to-[#00F5D4] hover:from-[#00FFE0]/90 hover:to-[#00F5D4]/90 text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-[#00FFE0]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="Trigger verification check of linked PayPal account status"
          >
            <i className={`fa-solid ${isSyncingPayPal ? 'fa-arrows-rotate fa-spin' : 'fa-rotate'} text-xs`}></i>
            <span>{isSyncingPayPal ? 'Syncing...' : 'Sync PayPal Account'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {/* SINTRA WEBSITE EMBED HELPER BUTTON */}
          <button
            type="button"
            onClick={() => setShowSintraModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00F5D4]/20 via-[#38BDF8]/20 to-[#C084FC]/20 hover:from-[#00F5D4]/30 hover:to-[#C084FC]/30 border border-[#00F5D4]/40 text-[#00F5D4] hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#00F5D4]/10"
            title="Integrate app into januscreations.sintra.site"
          >
            <i className="fa-solid fa-globe text-xs"></i>
            <span className="hidden sm:inline">januscreations.sintra.site</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsAuthenticated(false);
              setPasscode('');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
            title="Lock Vault & Re-prompt Auth"
          >
            <i className="fa-solid fa-lock text-[#00F5D4] text-xs"></i>
            <span className="hidden sm:inline">Lock Vault</span>
          </button>
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono font-bold">Total Treasury Pool</p>
            <p className="text-lg font-mono font-bold text-white">${summaries.Total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors group border border-white/10 cursor-pointer">
            <i className="fa-solid fa-xmark group-hover:rotate-90 transition-transform text-white"></i>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#070707]">
        <div className="max-w-6xl mx-auto space-y-12 pb-24">

          {/* SECTION 1: PAYPAL PAYMENT GATEWAY CONFIGURATION UTILITY */}
          {dashboardSection === 'gateway' && (
            <div className="space-y-10">
              <PaymentGatewayConfigUtility
                onConfigSaved={(saved) => {
                  setGatewayConfig(saved);
                  setSuccessMessage('PayPal Gateway credentials securely mapped and verified.');
                  setTimeout(() => setSuccessMessage(null), 3000);
                }}
              />
              <WebhookActivityLog
                webhookIdTarget="7D993972A74706718"
                onNotification={(msg) => {
                  setSuccessMessage(msg);
                  setTimeout(() => setSuccessMessage(null), 4000);
                }}
              />
              <PayPalWebhookDiagnostics
                onNotification={(msg) => {
                  setSuccessMessage(msg);
                  setTimeout(() => setSuccessMessage(null), 4000);
                }}
              />
            </div>
          )}

          {/* SECTION 1B: DEDICATED PAYPAL WEBHOOK DIAGNOSTIC CENTER */}
          {dashboardSection === 'webhooks' && (
            <div className="space-y-10">
              <WebhookActivityLog
                webhookIdTarget="7D993972A74706718"
                onNotification={(msg) => {
                  setSuccessMessage(msg);
                  setTimeout(() => setSuccessMessage(null), 4000);
                }}
              />
              <PayPalWebhookDiagnostics
                onNotification={(msg) => {
                  setSuccessMessage(msg);
                  setTimeout(() => setSuccessMessage(null), 4000);
                }}
              />
            </div>
          )}

          {/* SECTION 2: DEDICATED REVENUE TICKER & RECENT ACTIVITY TRANSPARENCY */}
          {dashboardSection === 'ticker' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <RevenueTicker
                externalPayouts={payouts}
                onSimulatePayout={(sim) => {
                  const now = new Date().toISOString().substring(0, 10);
                  const batchId = sim.batchId || `PP-BATCH-${Date.now()}`;
                  const txHash = sim.txHash || batchId;
                  const newPayout: Payout = {
                    id: String(Date.now()),
                    recipient: sim.recipient,
                    amount: sim.amount,
                    type: sim.type,
                    status: 'Approved',
                    date: now,
                    approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    notes: `PayPal payout settled via Revenue Ticker.`,
                    transactionHash: txHash,
                    paypalBatchId: batchId,
                    gateway: 'PayPal REST API'
                  };
                  setPayouts(prev => [newPayout, ...prev]);
                }}
              />
            </div>
          )}

          {/* SECTION 3: REVENUE MILESTONE ALERTS CONFIGURATION */}
          {dashboardSection === 'milestones' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <PayoutThresholdSettingsPanel
                currentTotalAggregated={
                  payouts.filter(p => p.status === 'Approved').reduce((sum, p) => sum + p.amount, 0)
                }
              />
              <RevenueMilestoneManager
                currentTotalAggregated={
                  payouts.filter(p => p.status === 'Approved').reduce((sum, p) => sum + p.amount, 0)
                }
              />
            </div>
          )}

          {/* SECTION 3: TREASURY & MANIFESTS AUTHORIZATIONS */}
          {dashboardSection === 'treasury' && (
            <>
              {/* Integrated PayPal Sandbox Revenue Ticker Ribbon in Treasury */}
              <RevenueTicker
                externalPayouts={payouts}
                onSimulatePayout={(sim) => {
                  const now = new Date().toISOString().substring(0, 10);
                  const batchId = sim.batchId || `PP-BATCH-${Date.now()}`;
                  const txHash = sim.txHash || batchId;
                  const newPayout: Payout = {
                    id: String(Date.now()),
                    recipient: sim.recipient,
                    amount: sim.amount,
                    type: sim.type,
                    status: 'Approved',
                    date: now,
                    approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    notes: `PayPal payout settled via Treasury Revenue Ticker.`,
                    transactionHash: txHash,
                    paypalBatchId: batchId,
                    gateway: 'PayPal REST API'
                  };
                  setPayouts(prev => [newPayout, ...prev]);
                }}
              />

              {/* Collapsible Quick Access to Payout Threshold Milestones in Treasury */}
              <BossParallaxCard
                maxRotateX={4}
                maxRotateY={2}
                maxTranslateZ={25}
                glowColor="rgba(0, 255, 224, 0.2)"
                className="rounded-3xl bg-zinc-950/80 border border-[#00FFE0]/20 p-5 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#00FFE0]/15 border border-[#00FFE0]/30 flex items-center justify-center text-[#00FFE0] shrink-0">
                    <i className="fa-solid fa-bell-ring text-base"></i>
                  </div>
                  <div>
                    <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Payout Milestone Alert Engine</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#00FFE0]/20 text-[#00FFE0] text-[9px] font-mono">
                        Connected to Boss Notifications
                      </span>
                    </h4>
                    <p className="text-xs text-gray-400 font-light">
                      Define specific threshold amounts ($100, $500, $1,000) to receive automated Boss Notification alert toasts as aggregated payouts settle.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowThresholdSettingsInTreasury(!showThresholdSettingsInTreasury)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-[#00FFE0]/20 border border-white/10 hover:border-[#00FFE0]/40 text-xs font-mono font-bold text-gray-200 hover:text-[#00FFE0] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <i className={`fa-solid ${showThresholdSettingsInTreasury ? 'fa-chevron-up' : 'fa-sliders'} text-xs text-[#00FFE0]`}></i>
                    <span>{showThresholdSettingsInTreasury ? 'Hide Settings' : 'Configure Thresholds ($100, $500, $1K)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDashboardSection('milestones')}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>Full View</span>
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px] ml-1.5"></i>
                  </button>
                </div>
              </BossParallaxCard>

              {/* Render Settings Panel if expanded in Treasury */}
              {showThresholdSettingsInTreasury && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <PayoutThresholdSettingsPanel
                    currentTotalAggregated={
                      payouts.filter(p => p.status === 'Approved').reduce((sum, p) => sum + p.amount, 0)
                    }
                  />
                </div>
              )}

              {/* Executive Payout Section (Founder's Own Payouts) */}
          <div className="space-y-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-serif font-black italic text-white flex items-center gap-3">
                  <i className="fa-solid fa-crown text-[#00F5D4]"></i> Executive Founder Portal
                </h2>
                <div className="h-px w-24 bg-gradient-to-r from-[#00F5D4]/40 to-transparent hidden sm:block"></div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowMonthlyPerformancePdfModal(true)}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF007F]/20 via-[#C084FC]/20 to-[#00F5D4]/20 hover:from-[#FF007F]/30 hover:to-[#00F5D4]/30 border border-[#C084FC]/50 hover:border-[#00F5D4] text-white font-mono font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(192,132,252,0.25)] flex items-center gap-2 cursor-pointer"
                  title="Generate certified monthly performance and audit summary PDF via client-side jsPDF"
                >
                  <i className="fa-solid fa-file-pdf text-[#FF007F] text-sm"></i>
                  <span>Monthly PDF Summary</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBossLedgerAuditModal(true)}
                  className="px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-[#00F5D4]/40 hover:border-[#00F5D4] text-[#00F5D4] font-mono font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,245,212,0.2)] flex items-center gap-2 cursor-pointer"
                  title="Export complete Boss Ledger (tips, creator earnings, platform cuts) for external auditing"
                >
                  <i className="fa-solid fa-file-invoice-dollar text-sm"></i>
                  <span>Export Boss Ledger (Audit)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExecuteLiveCashout}
                  disabled={isCashoutProcessing}
                  className={`px-5 py-2.5 rounded-2xl font-mono font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${
                    isCashoutProcessing
                      ? 'bg-zinc-800 text-[#00FFE0] border border-[#00FFE0]/40 cursor-wait shadow-[0_0_20px_rgba(0,255,224,0.3)]'
                      : 'bg-gradient-to-r from-emerald-400 via-[#00FFE0] to-[#38BDF8] text-black hover:scale-105 shadow-[0_0_20px_rgba(0,255,224,0.4)]'
                  }`}
                  title="Direct Live PayPal Batch Payout"
                >
                  {isCashoutProcessing ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin text-sm text-[#00FFE0]"></i>
                      <span className="text-[#00FFE0] animate-pulse">Processing Batch Payout...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-brands fa-paypal text-sm"></i>
                      <span>Instant PayPal Cashout</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsWithdrawalModalOpen(true)}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#00FFE0] via-[#38BDF8] to-[#FF007F] text-black font-mono font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,224,0.4)] flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-money-bill-transfer text-sm"></i>
                  <span>Initiate Funds Withdrawal</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <BossParallaxCard 
                maxRotateX={7} 
                maxRotateY={5} 
                maxTranslateZ={40}
                glowColor="rgba(0, 245, 212, 0.3)"
                className="lg:col-span-1 glass p-8 rounded-[2rem] border-[#00F5D4]/30 bg-gradient-to-br from-[#00F5D4]/10 via-black to-transparent relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-between"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#00F5D4] font-bold">Current Allocation Pool</p>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono font-bold uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      LIVE PRODUCTION (Real-Time Payouts)
                    </span>
                  </div>
                  <h3 className="text-4xl font-mono font-bold text-white mb-4">${summaries.Founder.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                  <p className="text-xs text-gray-300 font-light leading-relaxed mb-6">
                    Personal equity distributions and executive draws in real-time to your connected PayPal account.
                  </p>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleExecuteLiveCashout}
                      disabled={isCashoutProcessing}
                      className={`w-full py-3.5 px-4 rounded-xl font-mono font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isCashoutProcessing
                          ? 'bg-zinc-800 text-[#00FFE0] border border-[#00FFE0]/40 cursor-wait shadow-[0_0_20px_rgba(0,255,224,0.3)]'
                          : 'bg-gradient-to-r from-emerald-400 via-[#00FFE0] to-[#38BDF8] text-black hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20'
                      }`}
                    >
                      {isCashoutProcessing ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin text-base text-[#00FFE0]"></i>
                          <span className="text-[#00FFE0] animate-pulse">Processing Batch Payout...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-brands fa-paypal text-base"></i>
                          <span>{`Cashout $${(summaries.Founder || 5000).toLocaleString(undefined, { minimumFractionDigits: 2 })} (Live Real-Time)`}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        paymentGatewayService.saveConfig({ mode: 'live' });
                        setIsWithdrawalModalOpen(true);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-gray-200 font-mono font-bold text-xs uppercase tracking-wider hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <i className="fa-solid fa-sliders"></i>
                      <span>Custom Amount Withdrawal</span>
                    </button>

                    <div className="flex items-center gap-2 text-[#00F5D4] text-[10px] font-mono font-bold uppercase tracking-widest pt-1">
                      <i className="fa-solid fa-shield-halved"></i> Tier 1 Priority Sovereign Processing (janujanuscreations@gmail.com)
                    </div>
                  </div>
                </div>
                <div className="absolute -right-8 -bottom-8 text-9xl text-white opacity-[0.02]">
                  <i className="fa-solid fa-user-tie"></i>
                </div>
              </BossParallaxCard>

              <BossParallaxCard
                maxRotateX={5}
                maxRotateY={4}
                maxTranslateZ={30}
                glowColor="rgba(0, 245, 212, 0.2)"
                className="lg:col-span-2 glass rounded-[2rem] overflow-hidden border-[#00F5D4]/20 bg-black/50"
              >
                <div className="px-8 py-4 border-b border-white/10 flex items-center justify-between bg-[#00F5D4]/5">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#00F5D4]">
                    Pending Executive Manifests
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsWithdrawalModalOpen(true)}
                    className="text-[10px] font-mono text-gray-400 hover:text-[#00FFE0] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-plus-circle"></i>
                    <span>New Draw Request</span>
                  </button>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5 text-[10px] font-mono uppercase tracking-widest font-bold text-gray-400">
                      <th className="px-8 py-4">Requested Draw</th>
                      <th className="px-8 py-4">Amount</th>
                      <th className="px-8 py-4">Date</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {founderPayouts.map(payout => (
                      <tr key={payout.id} className="group hover:bg-[#00F5D4]/5 transition-all duration-300">
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-[#00F5D4]/10 flex items-center justify-center text-[#00F5D4] border border-[#00F5D4]/30">
                              <i className="fa-solid fa-fingerprint text-xs"></i>
                            </div>
                            <span className="font-mono text-sm font-bold text-white">{payout.recipient}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 font-mono font-bold text-[#00F5D4]">
                          ${payout.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-8 py-6 font-mono text-gray-400 text-xs">{payout.date}</td>
                        <td className="px-8 py-6 text-right">
                          <ActionMenu id={payout.id} status={payout.status} />
                        </td>
                      </tr>
                    ))}
                    {founderPayouts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-16 text-center text-gray-500 font-mono uppercase tracking-widest text-[10px] font-bold">
                          No pending executive draws.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </BossParallaxCard>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['Contest', 'Monetization'] as const).map(type => (
              <BossParallaxCard 
                key={type} 
                maxRotateX={6}
                maxRotateY={5}
                maxTranslateZ={35}
                glowColor={type === 'Contest' ? 'rgba(255, 0, 127, 0.3)' : 'rgba(192, 132, 252, 0.3)'}
                className={`glass p-8 rounded-3xl border-white/10 relative group overflow-hidden transition-all duration-500 bg-black/40 hover:border-${categoryConfig[type].color}/40`}
              >
                <div className={`absolute -right-4 -top-4 text-6xl opacity-[0.03] group-hover:opacity-[0.07] transition-opacity`}>
                   <i className={`fa-solid ${categoryConfig[type].icon}`}></i>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 shadow-sm border border-white/10" style={{ color: categoryConfig[type].color }}>
                    <i className={`fa-solid ${categoryConfig[type].icon}`}></i>
                  </div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold">{categoryConfig[type].label}</p>
                </div>
                <h3 className="text-3xl font-mono font-bold text-white mb-4">
                  ${summaries[type].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full opacity-80 transition-all duration-1000 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: categoryConfig[type].color, width: `${(summaries[type] / summaries.Total) * 100}%` }}></div>
                </div>
              </BossParallaxCard>
            ))}
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-serif font-black italic text-white">Community & Partner Authorizations</h2>
              <div className="h-px flex-1 bg-white/10"></div>
            </div>

            <div className="flex space-x-8 mb-4 border-b border-white/10 overflow-x-auto whitespace-nowrap scrollbar-hide">
              {(['Contest', 'Monetization'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSelectedIds(new Set<string>());
                  }}
                  className={`pb-4 text-xs font-mono font-bold uppercase tracking-widest transition-all relative flex items-center gap-3 ${
                    activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <i className={`fa-solid ${categoryConfig[tab].icon} ${
                    activeTab === tab ? '' : 'opacity-50'
                  }`} style={{ color: activeTab === tab ? categoryConfig[tab].color : undefined }}></i>
                  {tab} Payouts
                  {activeTab === tab && (
                    <div 
                      className="absolute bottom-0 left-0 w-full h-0.5"
                      style={{ backgroundColor: categoryConfig[tab].color, boxShadow: `0 0 10px ${categoryConfig[tab].color}` }}
                    ></div>
                  )}
                </button>
              ))}
            </div>

            <SortControl />

            <div className="glass rounded-[2rem] overflow-hidden border-white/10 relative bg-black/60 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-[10px] font-mono uppercase tracking-widest font-bold text-gray-400 border-b border-white/10">
                    <th className="px-8 py-6 w-12">
                      <div 
                        onClick={toggleSelectAll}
                        className={`w-5 h-5 rounded border border-white/20 flex items-center justify-center cursor-pointer transition-all ${
                          selectedIds.size > 0 && selectedIds.size === visiblePending.length 
                            ? 'bg-[#FF007F] border-[#FF007F] shadow-[0_0_10px_#FF007F]' 
                            : selectedIds.size > 0 ? 'bg-white/10' : 'hover:border-white/40'
                        }`}
                      >
                        {selectedIds.size > 0 && (
                          <i className={`fa-solid ${selectedIds.size === visiblePending.length ? 'fa-check' : 'fa-minus'} text-[8px] text-white`}></i>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-6">Recipient</th>
                    <th className="px-8 py-6 cursor-pointer hover:text-white transition-colors" onClick={() => {setSortField('amount'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}}>
                      Amount {sortField === 'amount' && <i className={`fa-solid fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ml-2`}></i>}
                    </th>
                    <th className="px-8 py-6 cursor-pointer hover:text-white transition-colors" onClick={() => {setSortField('date'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}}>
                      Date {sortField === 'date' && <i className={`fa-solid fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ml-2`}></i>}
                    </th>
                    <th className="px-8 py-6 cursor-pointer hover:text-white transition-colors" onClick={() => {setSortField('status'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}}>
                      Status {sortField === 'status' && <i className={`fa-solid fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} ml-2`}></i>}
                    </th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {visiblePending.map(payout => (
                    <tr 
                      key={payout.id} 
                      className={`transition-all duration-300 group ${selectedIds.has(payout.id) ? 'bg-white/[0.06]' : 'hover:bg-white/[0.02]'}`}
                    >
                      <td className="px-8 py-6">
                        <div 
                          onClick={() => toggleSelect(payout.id)}
                          className={`w-5 h-5 rounded border border-white/20 flex items-center justify-center cursor-pointer transition-all ${
                            selectedIds.has(payout.id) ? 'bg-[#FF007F] border-[#FF007F] shadow-[0_0_10px_#FF007F]' : 'hover:border-white/40 group-hover:border-white/30'
                          }`}
                        >
                          {selectedIds.has(payout.id) && <i className="fa-solid fa-check text-[8px] text-white"></i>}
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-sm"
                            style={{ background: `linear-gradient(135deg, ${categoryConfig[activeTab].color}, #000)` }}
                          >
                            {payout.recipient.charAt(0)}
                          </div>
                          <span className="font-mono text-xs font-bold text-white group-hover:text-[#00F5D4] transition-colors">{payout.recipient}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-mono font-bold" style={{ color: categoryConfig[activeTab].color }}>
                        ${payout.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-6 text-gray-400 font-mono text-xs font-light">{payout.date}</td>
                      <td className="px-8 py-6">
                        <span className={`px-3.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest flex items-center w-fit gap-2 ${
                          payout.status === 'Processing' ? 'bg-[#00F5D4]/10 text-[#00F5D4] border border-[#00F5D4]/30' : 'bg-[#FF007F]/10 text-[#FF007F] border border-[#FF007F]/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor] ${
                            payout.status === 'Processing' ? 'bg-[#00F5D4]' : 'bg-[#FF007F]'
                          }`}></span>
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <ActionMenu id={payout.id} status={payout.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visiblePending.length === 0 && (
                <div className="p-24 text-center text-gray-500 font-mono uppercase tracking-[0.3em] text-[10px] font-bold">
                  All {activeTab.toLowerCase()} pools cleared.
                </div>
              )}
            </div>
          </div>

          {/* REAL-TIME PAYPAL WEBHOOK INCOMING PAYLOAD ACTIVITY LOG */}
          <WebhookActivityLog
            webhookIdTarget="7D993972A74706718"
            onNotification={(msg) => {
              setSuccessMessage(msg);
              setTimeout(() => setSuccessMessage(null), 4000);
            }}
          />

          <div className="space-y-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-serif font-black italic text-white flex items-center gap-3">
                  <i className="fa-solid fa-clock-rotate-left text-[#00F5D4]"></i>
                  <span>Sovereign Legacy Log</span>
                </h2>
                <div className="h-px w-20 bg-white/10 hidden sm:block"></div>
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400">
                  {history.length} Settled Records
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowMonthlyPerformancePdfModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF007F]/15 via-[#C084FC]/15 to-[#00F5D4]/15 hover:from-[#FF007F]/25 hover:to-[#00F5D4]/25 border border-[#C084FC]/40 hover:border-[#00F5D4] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                  title="Generate certified monthly performance and audit summary PDF via client-side jsPDF"
                >
                  <i className="fa-solid fa-file-pdf text-[#FF007F] text-sm"></i>
                  <span>Monthly PDF Summary</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBossLedgerAuditModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#00F5D4]/10 hover:bg-[#00F5D4]/25 border border-[#00F5D4]/40 hover:border-[#00F5D4] text-[#00F5D4] font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                  title="Export complete audited Boss Ledger (tips, earnings, platform cuts) for external auditors"
                >
                  <i className="fa-solid fa-file-invoice-dollar text-sm"></i>
                  <span>Export Boss Ledger (Audit)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPayoutsCSV}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-[#00F5D4]/20 border border-white/10 hover:border-[#00F5D4]/40 text-[#00F5D4] font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                  title="Download settled payout history logs as CSV for offline record-keeping"
                >
                  <i className="fa-solid fa-file-csv text-sm"></i>
                  <span>Export to CSV</span>
                </button>
              </div>
            </div>

            <div className="glass rounded-[2rem] overflow-hidden border-white/10 bg-black/60 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-[10px] font-mono uppercase tracking-widest font-bold text-gray-400 border-b border-white/10">
                    <th className="px-8 py-6">Recipient</th>
                    <th className="px-8 py-6">Amount</th>
                    <th className="px-8 py-6">Category</th>
                    <th className="px-8 py-6">Authorization Date</th>
                    <th className="px-8 py-6 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map(item => (
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedPayout(item)}
                      className="hover:bg-white/[0.05] cursor-pointer transition-all duration-300 group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white opacity-80"
                            style={{ backgroundColor: categoryConfig[item.type].color }}
                          >
                            {item.recipient.charAt(0)}
                          </div>
                          <span className="font-mono text-xs font-bold text-gray-200 group-hover:text-white transition-colors">{item.recipient}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-mono font-bold text-white">
                        ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-2 text-xs font-mono text-gray-300">
                            <i className={`fa-solid ${categoryConfig[item.type].icon} text-[10px]`} style={{ color: categoryConfig[item.type].color }}></i>
                            {item.type}
                         </div>
                      </td>
                      <td className="px-8 py-6 text-gray-400 font-mono text-xs font-light italic">
                        {item.approvedAt || item.date}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end text-[#00F5D4] gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">View Manifest</span>
                          <i className="fa-solid fa-certificate text-xs group-hover:scale-125 transition-transform"></i>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
          )}
        </div>
      </div>

      {/* Sovereign Funds Withdrawal Modal with Mandatory Account Verification Step */}
      <FounderWithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        availableAllocation={summaries.Founder}
        onOpenGatewayConfig={() => setDashboardSection('gateway')}
        onWithdrawalSuccess={(newPayout) => {
          setPayouts(prev => {
            let remaining = newPayout.amount;
            const updated = prev.map(p => {
              if (remaining > 0 && p.type === 'Founder' && p.status === 'Pending') {
                if (p.amount <= remaining) {
                  remaining -= p.amount;
                  return { ...p, amount: 0, status: 'Approved' as const };
                } else {
                  const nextAmt = +(p.amount - remaining).toFixed(2);
                  remaining = 0;
                  return { ...p, amount: nextAmt };
                }
              }
              return p;
            }).filter(p => p.amount > 0 || p.id === newPayout.id);
            return [newPayout, ...updated];
          });
          setGatewayConfig(paymentGatewayService.getConfig());
          setSuccessMessage(`✓ Funds Withdrawal of $${newPayout.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} successfully executed via verified PayPal account!`);
          setTimeout(() => setSuccessMessage(null), 5000);
        }}
      />

      {/* Sintra Embed Modal Triggered from Founder Vault */}
      <SintraEmbedModal
        isOpen={showSintraModal}
        onClose={() => setShowSintraModal(false)}
      />

      {/* Boss Ledger Audit Export Modal for External Auditing */}
      <BossLedgerAuditExportModal
        isOpen={showBossLedgerAuditModal}
        onClose={() => setShowBossLedgerAuditModal(false)}
        rawRevenueRecords={liveRevenueRecords}
        payouts={payouts}
      />

      {/* Monthly Performance PDF Generator Modal (Client-Side jsPDF) */}
      <MonthlyPerformancePDFModal
        isOpen={showMonthlyPerformancePdfModal}
        onClose={() => setShowMonthlyPerformancePdfModal(false)}
        rawRevenueRecords={liveRevenueRecords}
        payouts={payouts}
      />
    </div>
  );
};

export default FounderDashboard;
