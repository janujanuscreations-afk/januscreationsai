import { BossNotification } from '../types';
import { triggerBossNotification } from '../context/BossNotificationContext';

export interface RevenueMilestoneThreshold {
  id: string;
  threshold: number;
  label: string;
  description: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'SOVEREIGN_DIAMOND' | 'CUSTOM';
  enabled: boolean;
  triggered: boolean;
  triggeredAt?: string;
  triggeredAmount?: number;
  bonusTitle?: string;
  customMemo?: string;
}

export interface RevenueMilestoneLog {
  id: string;
  milestoneId: string;
  threshold: number;
  totalAggregated: number;
  timestamp: string;
  triggeredBy?: string;
  gateway: string;
}

const STORAGE_KEY_MILESTONES = 'janus_revenue_milestones_config_v1';
const STORAGE_KEY_LOGS = 'janus_revenue_milestones_logs_v1';

const DEFAULT_MILESTONES: RevenueMilestoneThreshold[] = [
  {
    id: 'ms-100',
    threshold: 100,
    label: '$100 Ignition Spark Milestone',
    description: 'Initial payout verification threshold processed via PayPal sandbox.',
    tier: 'BRONZE',
    enabled: true,
    triggered: false,
    bonusTitle: 'Ignition Spark Badge'
  },
  {
    id: 'ms-500',
    threshold: 500,
    label: '$500 Creator Surge Threshold',
    description: 'Processing half-thousand dollar payout velocity across verified creator manifests.',
    tier: 'SILVER',
    enabled: true,
    triggered: false,
    bonusTitle: 'Velocity Catalyst'
  },
  {
    id: 'ms-1k',
    threshold: 1000,
    label: '$1,000 Founder Millennial Milestone',
    description: 'First 4-figure aggregate milestone reached with 0.00% creator transaction fee deduction.',
    tier: 'GOLD',
    enabled: true,
    triggered: false,
    bonusTitle: 'Gold Creator Vanguard'
  },
  {
    id: 'ms-5k',
    threshold: 5000,
    label: '$5,000 Platinum Seed Milestone',
    description: 'Foundation milestone for high-volume ecosystem disbursements.',
    tier: 'PLATINUM',
    enabled: true,
    triggered: false,
    bonusTitle: 'Platinum Mastermind'
  },
  {
    id: 'ms-10k',
    threshold: 10000,
    label: '$10,000 Diamond Acceleration',
    description: 'Significant 5-digit payout threshold milestone reached via PayPal REST Sandbox.',
    tier: 'DIAMOND',
    enabled: true,
    triggered: false,
    bonusTitle: 'Diamond Crown Creator'
  },
  {
    id: 'ms-25k',
    threshold: 25000,
    label: '$25,000 Grand Master Milestone',
    description: 'Quarter-century thousand dollar threshold processed with verified ledger hashes.',
    tier: 'DIAMOND',
    enabled: true,
    triggered: false,
    bonusTitle: 'Eternal Creator Luminary'
  }
];

export class RevenueMilestoneService {
  private static instance: RevenueMilestoneService;
  private milestones: RevenueMilestoneThreshold[];
  private logs: RevenueMilestoneLog[];

  private constructor() {
    this.milestones = this.loadMilestones();
    this.logs = this.loadLogs();
  }

  public static getInstance(): RevenueMilestoneService {
    if (!RevenueMilestoneService.instance) {
      RevenueMilestoneService.instance = new RevenueMilestoneService();
    }
    return RevenueMilestoneService.instance;
  }

  private loadMilestones(): RevenueMilestoneThreshold[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MILESTONES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not parse saved revenue milestones:', e);
    }
    return DEFAULT_MILESTONES;
  }

  private loadLogs(): RevenueMilestoneLog[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not parse revenue milestone logs:', e);
    }
    return [];
  }

  public saveMilestones(milestones: RevenueMilestoneThreshold[]): void {
    this.milestones = milestones;
    try {
      localStorage.setItem(STORAGE_KEY_MILESTONES, JSON.stringify(milestones));
    } catch (e) {
      console.error('Error saving revenue milestones:', e);
    }
  }

  public getMilestones(): RevenueMilestoneThreshold[] {
    return [...this.milestones].sort((a, b) => a.threshold - b.threshold);
  }

  public getLogs(): RevenueMilestoneLog[] {
    return [...this.logs];
  }

  public addMilestone(threshold: number, label?: string, tier?: RevenueMilestoneThreshold['tier'], description?: string): RevenueMilestoneThreshold {
    const formattedAmount = threshold.toLocaleString();
    const newMilestone: RevenueMilestoneThreshold = {
      id: `ms-custom-${Date.now()}`,
      threshold: Math.max(1, threshold),
      label: label?.trim() || `$${formattedAmount} Custom Milestone`,
      description: description?.trim() || `User-defined payout threshold of $${formattedAmount} USD reached.`,
      tier: tier || 'CUSTOM',
      enabled: true,
      triggered: false,
      bonusTitle: `Tier Milestone ${formattedAmount}`
    };

    const updated = [...this.milestones, newMilestone];
    this.saveMilestones(updated);
    return newMilestone;
  }

  public updateMilestone(id: string, updates: Partial<RevenueMilestoneThreshold>): void {
    const updated = this.milestones.map(m => (m.id === id ? { ...m, ...updates } : m));
    this.saveMilestones(updated);
  }

  public deleteMilestone(id: string): void {
    const updated = this.milestones.filter(m => m.id !== id);
    this.saveMilestones(updated);
  }

  public toggleMilestone(id: string): void {
    const updated = this.milestones.map(m => (m.id === id ? { ...m, enabled: !m.enabled } : m));
    this.saveMilestones(updated);
  }

  public resetMilestone(id: string): void {
    const updated = this.milestones.map(m => (m.id === id ? { ...m, triggered: false, triggeredAt: undefined, triggeredAmount: undefined } : m));
    this.saveMilestones(updated);
  }

  public resetAllMilestones(): void {
    const updated = this.milestones.map(m => ({ ...m, triggered: false, triggeredAt: undefined, triggeredAmount: undefined }));
    this.saveMilestones(updated);
  }

  public restoreDefaults(): RevenueMilestoneThreshold[] {
    this.saveMilestones(DEFAULT_MILESTONES);
    return DEFAULT_MILESTONES;
  }

  /**
   * Evaluates current total aggregated payouts against all enabled milestone thresholds.
   * If any threshold is met or exceeded and has not yet triggered, it fires a Boss Notification.
   */
  public checkAndTriggerMilestones(
    currentTotalAggregated: number,
    options?: {
      gateway?: string;
      latestRecipient?: string;
      onActionClick?: () => void;
    }
  ): RevenueMilestoneThreshold[] {
    const newlyTriggered: RevenueMilestoneThreshold[] = [];
    const updatedMilestones = [...this.milestones];
    let changed = false;

    for (let i = 0; i < updatedMilestones.length; i++) {
      const ms = updatedMilestones[i];
      if (ms.enabled && !ms.triggered && currentTotalAggregated >= ms.threshold) {
        // Milestone reached!
        const nowIso = new Date().toISOString();
        updatedMilestones[i] = {
          ...ms,
          triggered: true,
          triggeredAt: nowIso,
          triggeredAmount: currentTotalAggregated
        };
        changed = true;
        newlyTriggered.push(updatedMilestones[i]);

        // Record log
        const logEntry: RevenueMilestoneLog = {
          id: `log-${Date.now()}-${i}`,
          milestoneId: ms.id,
          threshold: ms.threshold,
          totalAggregated: currentTotalAggregated,
          timestamp: nowIso.replace('T', ' ').substring(0, 19),
          triggeredBy: options?.latestRecipient,
          gateway: options?.gateway || 'PayPal Sandbox REST v2'
        };
        this.logs = [logEntry, ...this.logs];
        try {
          localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.logs));
        } catch (e) {}

        // Dispatch high-impact Boss Notification Toast
        triggerBossNotification({
          type: 'revenue_milestone',
          title: `🎉 ${ms.label} Hit!`,
          subtitle: `Aggregated: $${currentTotalAggregated.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD`,
          message: `Aggregated PayPal Sandbox disbursements surged past the $${ms.threshold.toLocaleString()} milestone threshold! Total processed: $${currentTotalAggregated.toLocaleString(undefined, { minimumFractionDigits: 2 })} across verified batch manifests.`,
          amount: currentTotalAggregated,
          milestoneInfo: {
            threshold: ms.threshold,
            totalAggregated: currentTotalAggregated,
            milestoneName: ms.label,
            tier: ms.tier,
            gateway: options?.gateway || 'PayPal Sandbox REST v2'
          },
          actionLabel: 'View Revenue Ticker',
          onAction: options?.onActionClick
        });
      }
    }

    if (changed) {
      this.saveMilestones(updatedMilestones);
    }

    return newlyTriggered;
  }

  /**
   * On-demand simulation of a specific milestone alert for testing.
   */
  public simulateMilestoneAlert(milestoneId?: string): void {
    const milestone = milestoneId
      ? this.milestones.find(m => m.id === milestoneId) || this.milestones[0]
      : this.milestones[0] || DEFAULT_MILESTONES[0];

    const sampleTotal = milestone ? milestone.threshold + 2450.75 : 12450.75;
    const thresholdAmount = milestone ? milestone.threshold : 10000;
    const name = milestone ? milestone.label : '$10,000 Acceleration Milestone';

    triggerBossNotification({
      type: 'revenue_milestone',
      title: `🎉 ${name} Exceeded!`,
      subtitle: `Aggregated: $${sampleTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD`,
      message: `Simulated Alert: Aggregated payouts processed via PayPal Sandbox reached $${sampleTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} (Threshold: $${thresholdAmount.toLocaleString()} USD).`,
      amount: sampleTotal,
      milestoneInfo: {
        threshold: thresholdAmount,
        totalAggregated: sampleTotal,
        milestoneName: name,
        tier: milestone?.tier || 'GOLD',
        gateway: 'PayPal Sandbox REST v2'
      },
      actionLabel: 'Inspect Ledger'
    });
  }
}

export const revenueMilestoneService = RevenueMilestoneService.getInstance();
