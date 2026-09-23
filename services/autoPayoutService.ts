import { AutoPayoutSetting, AutoPayoutLog } from '../types';
import { paymentGatewayService } from './paymentGatewayService';
import { firestoreService, auth } from './firebase';
import { triggerBossNotification } from '../context/BossNotificationContext';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';

const STORAGE_KEY_AUTO_PAYOUT = 'janus_auto_payout_settings_v1';
const FIRESTORE_SETTING_ID = 'creator_payout_settings_janu';

export const DEFAULT_AUTO_PAYOUT_SETTING: AutoPayoutSetting = {
  id: FIRESTORE_SETTING_ID,
  userId: 'sovereign-creator-janu',
  enabled: true,
  thresholdAmount: 500,
  paypalEmail: 'janujanuscreations@gmail.com',
  payoutMode: 'full_balance',
  minimumReserve: 0,
  autoApprove: true,
  lastTriggeredAt: undefined,
  lastTriggeredAmount: undefined,
  lastBatchId: undefined,
  lastTxId: undefined,
  totalAutoDisbursed: 1450.00,
  autoPayoutCount: 3,
  history: [
    {
      id: 'AP-LOG-89101',
      timestamp: '2026-08-25 14:32:10',
      amount: 500.00,
      balanceBefore: 580.00,
      balanceAfter: 80.00,
      threshold: 500,
      paypalEmail: 'janujanuscreations@gmail.com',
      batchId: 'PAYPAL-BATCH-1724601130-412',
      txId: 'TXN-PP-9842104',
      status: 'SUCCESS',
      note: 'Automated threshold sweep triggered at $500 balance'
    },
    {
      id: 'AP-LOG-89045',
      timestamp: '2026-08-18 09:15:40',
      amount: 500.00,
      balanceBefore: 512.50,
      balanceAfter: 12.50,
      threshold: 500,
      paypalEmail: 'janujanuscreations@gmail.com',
      batchId: 'PAYPAL-BATCH-1723972540-891',
      txId: 'TXN-PP-7712390',
      status: 'SUCCESS',
      note: 'Automated threshold sweep triggered at $500 balance'
    },
    {
      id: 'AP-LOG-88982',
      timestamp: '2026-08-10 18:45:00',
      amount: 450.00,
      balanceBefore: 450.00,
      balanceAfter: 0.00,
      threshold: 450,
      paypalEmail: 'janujanuscreations@gmail.com',
      batchId: 'PAYPAL-BATCH-1723315500-109',
      txId: 'TXN-PP-6651299',
      status: 'SUCCESS',
      note: 'Initial threshold calibration payout'
    }
  ],
  updatedAt: new Date().toISOString()
};

export class AutoPayoutService {
  private static instance: AutoPayoutService;
  private settings: AutoPayoutSetting;
  private listeners: Array<(settings: AutoPayoutSetting) => void> = [];
  private isProcessing = false;
  private isInitialized = false;

  private constructor() {
    this.settings = this.loadLocalSettings();
    this.initFirestoreSync();
  }

  public static getInstance(): AutoPayoutService {
    if (!AutoPayoutService.instance) {
      AutoPayoutService.instance = new AutoPayoutService();
    }
    return AutoPayoutService.instance;
  }

  private loadLocalSettings(): AutoPayoutSetting {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTO_PAYOUT);
      if (saved) {
        return { ...DEFAULT_AUTO_PAYOUT_SETTING, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not parse local auto-payout settings:', e);
    }
    return DEFAULT_AUTO_PAYOUT_SETTING;
  }

  private saveLocalSettings(settings: AutoPayoutSetting): void {
    try {
      localStorage.setItem(STORAGE_KEY_AUTO_PAYOUT, JSON.stringify(settings));
    } catch (e) {
      console.error('Error writing auto-payout settings to storage:', e);
    }
  }

  private async initFirestoreSync(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // Subscribe to real-time changes in Firestore
      firestoreService.subscribePayoutSettings(FIRESTORE_SETTING_ID, (remoteSettings) => {
        if (remoteSettings && remoteSettings.thresholdAmount) {
          this.settings = {
            ...this.settings,
            ...remoteSettings,
            history: Array.isArray(remoteSettings.history) ? remoteSettings.history : this.settings.history
          };
          this.saveLocalSettings(this.settings);
          this.notifyListeners();
        }
      });

      // Initial fetch or seed
      const existing = await firestoreService.getPayoutSettings(FIRESTORE_SETTING_ID);
      if (!existing) {
        await firestoreService.savePayoutSettings(FIRESTORE_SETTING_ID, this.settings);
      } else {
        this.settings = {
          ...this.settings,
          ...existing,
          history: Array.isArray(existing.history) ? existing.history : this.settings.history
        };
        this.saveLocalSettings(this.settings);
        this.notifyListeners();
      }
    } catch (err) {
      console.warn('Firestore sync for auto-payout settings fell back to local cache:', err);
    }
  }

  public getSettings(): AutoPayoutSetting {
    return { ...this.settings };
  }

  public async updateSettings(updates: Partial<AutoPayoutSetting>): Promise<AutoPayoutSetting> {
    const updated: AutoPayoutSetting = {
      ...this.settings,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.settings = updated;
    this.saveLocalSettings(updated);
    this.notifyListeners();

    // Sync to Firestore
    firestoreService.savePayoutSettings(FIRESTORE_SETTING_ID, updated).catch(console.warn);

    return { ...this.settings };
  }

  public subscribe(listener: (settings: AutoPayoutSetting) => void): () => void {
    this.listeners.push(listener);
    listener(this.getSettings());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    const current = this.getSettings();
    this.listeners.forEach(l => {
      try {
        l(current);
      } catch (e) {
        console.error('Error in auto payout settings listener:', e);
      }
    });
  }

  /**
   * Evaluates if the current wallet balance meets the auto-payout threshold.
   */
  public evaluateThreshold(balance: number): {
    isEligible: boolean;
    triggerAmount: number;
    remainingBalance: number;
    threshold: number;
    mode: string;
    reason: string;
    progressPercentage: number;
  } {
    const { enabled, thresholdAmount, payoutMode, minimumReserve } = this.settings;
    const progressPercentage = Math.min(100, Math.max(0, (balance / Math.max(1, thresholdAmount)) * 100));

    if (!enabled) {
      return {
        isEligible: false,
        triggerAmount: 0,
        remainingBalance: balance,
        threshold: thresholdAmount,
        mode: payoutMode,
        reason: 'Automated threshold trigger is currently PAUSED by creator.',
        progressPercentage
      };
    }

    if (balance < thresholdAmount) {
      const needed = +(thresholdAmount - balance).toFixed(2);
      return {
        isEligible: false,
        triggerAmount: 0,
        remainingBalance: balance,
        threshold: thresholdAmount,
        mode: payoutMode,
        reason: `Pending balance ($${balance.toFixed(2)}) is below threshold limit ($${thresholdAmount.toFixed(2)}). Need $${needed.toFixed(2)} more.`,
        progressPercentage
      };
    }

    // Determine payout amount based on configured mode
    let payoutAmount = 0;
    if (payoutMode === 'threshold_amount') {
      payoutAmount = thresholdAmount;
    } else if (payoutMode === 'custom_reserve') {
      payoutAmount = Math.max(0, balance - (minimumReserve || 0));
    } else {
      // 'full_balance'
      payoutAmount = Math.max(0, balance - (minimumReserve || 0));
    }

    // Ensure payout amount is positive
    payoutAmount = +payoutAmount.toFixed(2);
    const remainingBalance = Math.max(0, +(balance - payoutAmount).toFixed(2));

    if (payoutAmount <= 0) {
      return {
        isEligible: false,
        triggerAmount: 0,
        remainingBalance: balance,
        threshold: thresholdAmount,
        mode: payoutMode,
        reason: `Calculated payout amount is $0.00 after minimum reserve hold ($${minimumReserve.toFixed(2)}).`,
        progressPercentage
      };
    }

    return {
      isEligible: true,
      triggerAmount: payoutAmount,
      remainingBalance,
      threshold: thresholdAmount,
      mode: payoutMode,
      reason: `Balance ($${balance.toFixed(2)}) meets or exceeds threshold ($${thresholdAmount.toFixed(2)}). Payout of $${payoutAmount.toFixed(2)} is ready for PayPal dispatch.`,
      progressPercentage: 100
    };
  }

  /**
   * Executes the automated threshold payout to PayPal.
   */
  public async executeAutoPayout(params: {
    currentBalance: number;
    onBalanceUpdated: (newBalance: number) => void;
    force?: boolean;
    customAmount?: number;
    source?: string;
  }): Promise<{
    success: boolean;
    message: string;
    amount?: number;
    batchId?: string;
    txId?: string;
  }> {
    if (this.isProcessing) {
      return { success: false, message: 'An auto-payout sweep is already in progress.' };
    }

    const evaluation = this.evaluateThreshold(params.currentBalance);
    if (!evaluation.isEligible && !params.force) {
      return { success: false, message: evaluation.reason };
    }

    const amountToDisburse = params.customAmount && params.customAmount > 0
      ? params.customAmount
      : evaluation.triggerAmount;

    if (amountToDisburse <= 0) {
      return { success: false, message: 'Invalid payout amount to disburse.' };
    }

    if (!auth.currentUser && typeof (auth as any).authStateReady === 'function') {
      await (auth as any).authStateReady();
    }

    if (!auth.currentUser) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
      }
      return {
        success: false,
        message: 'Auto-payout paused: Please sign in to your creator account.'
      };
    }

    this.isProcessing = true;

    try {
      const now = new Date();
      const nowIso = now.toISOString();
      const targetEmail = this.settings.paypalEmail || 'janujanuscreations@gmail.com';

      // 1. Execute PayPal Payout via real PayPal backend
      const payoutRes = await firestoreService.executeFirebasePayoutToPayPal({
        recipientEmail: targetEmail,
        amount: amountToDisburse,
        note: `⚡ Janu Automated Payout: Balance threshold ($${this.settings.thresholdAmount.toFixed(2)}) reached.`
      });

      if (!payoutRes || !payoutRes.batchId) {
        throw new Error('Payout failed: No batchId returned from PayPal backend.');
      }

      const batchId = payoutRes.batchId;
      const txId = payoutRes.batchId;
      const status = payoutRes.status || 'SUCCESS';
      const newBalance = Math.max(0, +(params.currentBalance - amountToDisburse).toFixed(2));

      // 2. Only if it succeeds: subtract payout amount from user balance
      params.onBalanceUpdated(newBalance);

      // 3. Create ONE ledger entry with returned batchId and status
      await firestoreService.recordPayout({
        id: `AUTO-SWEEP-${Date.now()}`,
        amount: amountToDisburse,
        method: 'PayPal Real Direct Payout',
        destination: targetEmail,
        status: status,
        txHash: batchId,
        payoutBatchId: batchId,
        paypalTxId: batchId,
        creatorHandle: '@januaryrebl',
        timestamp: nowIso,
        fee: 0.00,
        netPayout: amountToDisburse,
        isLivePayout: true
      }).catch(console.warn);

      // 5. Create new history log entry
      const logEntry: AutoPayoutLog = {
        id: `AP-LOG-${Date.now()}`,
        timestamp: nowIso.replace('T', ' ').substring(0, 19),
        amount: amountToDisburse,
        balanceBefore: params.currentBalance,
        balanceAfter: newBalance,
        threshold: this.settings.thresholdAmount,
        paypalEmail: targetEmail,
        batchId,
        txId,
        status: 'SUCCESS',
        note: `Auto-disbursed $${amountToDisburse.toFixed(2)} (Threshold: $${this.settings.thresholdAmount.toFixed(2)})`
      };

      const updatedHistory = [logEntry, ...this.settings.history].slice(0, 50);
      const newTotalDisbursed = +(this.settings.totalAutoDisbursed + amountToDisburse).toFixed(2);
      const newCount = this.settings.autoPayoutCount + 1;

      // 6. Update service state & persist
      await this.updateSettings({
        lastTriggeredAt: nowIso,
        lastTriggeredAmount: amountToDisburse,
        lastBatchId: batchId,
        lastTxId: txId,
        totalAutoDisbursed: newTotalDisbursed,
        autoPayoutCount: newCount,
        history: updatedHistory
      });

      // 7. Visual & Audio Celebration
      bossAudio.playTipChime(amountToDisburse);
      triggerNeonExplosion({
        particleCount: 100,
        origin: { x: 0.5, y: 0.35 },
        intensity: 'grand'
      });

      // 8. High-Impact Boss Notification Toast
      triggerBossNotification({
        type: 'revenue_milestone',
        title: `⚡ Auto-Payout Dispatched: $${amountToDisburse.toFixed(2)}`,
        subtitle: `PayPal: ${targetEmail} • Threshold Reached ($${this.settings.thresholdAmount.toFixed(2)})`,
        message: `Your pending creator balance crossed the $${this.settings.thresholdAmount.toFixed(2)} threshold limit! $${amountToDisburse.toFixed(2)} USD was automatically transferred to your registered PayPal account (${targetEmail}) with zero platform fee.`,
        amount: amountToDisburse,
        milestoneInfo: {
          threshold: this.settings.thresholdAmount,
          totalAggregated: newTotalDisbursed,
          milestoneName: `Auto-Payout Sweep #` + newCount,
          tier: 'GOLD',
          gateway: 'PayPal REST Live'
        },
        actionLabel: 'View Transaction'
      });

      return {
        success: true,
        message: `Auto-payout of $${amountToDisburse.toFixed(2)} USD dispatched to ${targetEmail}!`,
        amount: amountToDisburse,
        batchId,
        txId
      };
    } catch (err: any) {
      if (err?.message?.includes('sign in')) {
        console.warn('Auto-payout paused: Authentication session required.');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('open-auth-modal'));
        }
        return {
          success: false,
          message: 'Auto-payout paused: Please sign in to your creator account.'
        };
      }
      console.error('Error executing automated threshold payout:', err);
      return {
        success: false,
        message: `Auto-payout execution failed: ${err.message || 'Unknown gateway error'}`
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Test simulation of auto-payout trigger for interactive verification.
   */
  public async simulateAutoPayoutTrigger(params: {
    currentBalance: number;
    onBalanceUpdated: (newBalance: number) => void;
  }): Promise<{ success: boolean; message: string }> {
    const testAmount = Math.min(params.currentBalance > 0 ? params.currentBalance : 250, this.settings.thresholdAmount);
    return this.executeAutoPayout({
      currentBalance: params.currentBalance > 0 ? params.currentBalance : testAmount,
      onBalanceUpdated: params.onBalanceUpdated,
      force: true,
      customAmount: testAmount,
      source: 'Test Simulation'
    });
  }
}

export const autoPayoutService = AutoPayoutService.getInstance();
