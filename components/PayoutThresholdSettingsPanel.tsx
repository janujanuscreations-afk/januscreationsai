import React, { useState, useEffect } from 'react';
import {
  revenueMilestoneService,
  RevenueMilestoneThreshold,
  RevenueMilestoneLog
} from '../services/revenueMilestoneService';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';

interface PayoutThresholdSettingsPanelProps {
  currentTotalAggregated: number;
  onThresholdUpdated?: () => void;
  compact?: boolean;
  className?: string;
}

export const PayoutThresholdSettingsPanel: React.FC<PayoutThresholdSettingsPanelProps> = ({
  currentTotalAggregated,
  onThresholdUpdated,
  compact = false,
  className = ''
}) => {
  const [milestones, setMilestones] = useState<RevenueMilestoneThreshold[]>([]);
  const [logs, setLogs] = useState<RevenueMilestoneLog[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [thresholdAmount, setThresholdAmount] = useState<string>('500');
  const [thresholdLabel, setThresholdLabel] = useState<string>('');
  const [thresholdTier, setThresholdTier] = useState<RevenueMilestoneThreshold['tier']>('SILVER');
  const [thresholdMemo, setThresholdMemo] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const refreshData = () => {
    setMilestones(revenueMilestoneService.getMilestones());
    setLogs(revenueMilestoneService.getLogs());
    if (onThresholdUpdated) onThresholdUpdated();
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleToggle = (id: string) => {
    revenueMilestoneService.toggleMilestone(id);
    refreshData();
    bossAudio.playSubtlePing();
  };

  const handleDelete = (id: string, label: string) => {
    revenueMilestoneService.deleteMilestone(id);
    refreshData();
    showToast(`Threshold "${label}" removed.`);
    bossAudio.playSubtlePing();
  };

  const handleResetTrigger = (id: string, label: string) => {
    revenueMilestoneService.resetMilestone(id);
    refreshData();
    showToast(`Threshold "${label}" re-armed!`);
    bossAudio.playSubtlePing();
  };

  const handleResetAll = () => {
    revenueMilestoneService.resetAllMilestones();
    refreshData();
    showToast('All payout milestone alerts re-armed.');
    bossAudio.playSubtlePing();
  };

  const handleRestoreDefaults = () => {
    revenueMilestoneService.restoreDefaults();
    refreshData();
    showToast('Default thresholds ($100, $500, $1K, $5K, $10K, $25K) restored.');
    bossAudio.playSubtlePing();
  };

  const handleTestAlert = (ms: RevenueMilestoneThreshold) => {
    revenueMilestoneService.simulateMilestoneAlert(ms.id);
  };

  const handleQuickAddPreset = (amount: number, label: string, tier: RevenueMilestoneThreshold['tier']) => {
    revenueMilestoneService.addMilestone(amount, label, tier);
    refreshData();
    showToast(`Added $${amount.toLocaleString()} milestone threshold!`);
    bossAudio.playSubtlePing();

    if (currentTotalAggregated >= amount) {
      revenueMilestoneService.checkAndTriggerMilestones(currentTotalAggregated);
      refreshData();
    }
  };

  const handleSaveThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(thresholdAmount.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid positive number.');
      return;
    }

    if (editingId) {
      revenueMilestoneService.updateMilestone(editingId, {
        threshold: amount,
        label: thresholdLabel.trim() || `$${amount.toLocaleString()} Payout Milestone`,
        description: thresholdMemo.trim() || `Configured threshold of $${amount.toLocaleString()} USD reached.`,
        tier: thresholdTier
      });
      showToast(`Updated threshold to $${amount.toLocaleString()} USD!`);
    } else {
      revenueMilestoneService.addMilestone(
        amount,
        thresholdLabel.trim() || undefined,
        thresholdTier,
        thresholdMemo.trim() || undefined
      );
      showToast(`Added new $${amount.toLocaleString()} USD payout threshold!`);
    }

    refreshData();
    setIsFormOpen(false);
    setEditingId(null);
    setThresholdAmount('500');
    setThresholdLabel('');
    setThresholdMemo('');
    bossAudio.playSubtlePing();

    if (currentTotalAggregated >= amount) {
      revenueMilestoneService.checkAndTriggerMilestones(currentTotalAggregated);
      refreshData();
    }
  };

  const startEdit = (ms: RevenueMilestoneThreshold) => {
    setEditingId(ms.id);
    setThresholdAmount(ms.threshold.toString());
    setThresholdLabel(ms.label);
    setThresholdTier(ms.tier);
    setThresholdMemo(ms.description);
    setIsFormOpen(true);
  };

  const nextUpcoming = milestones
    .filter(m => m.enabled && !m.triggered && m.threshold > currentTotalAggregated)
    .sort((a, b) => a.threshold - b.threshold)[0];

  return (
    <div
      id="payout-threshold-settings-panel"
      className={`rounded-3xl bg-zinc-950/90 border border-white/10 p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl ${className}`}
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#00FFE0]/10 via-[#E056FD]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="absolute top-4 right-6 z-50 px-3.5 py-2 rounded-xl bg-black/90 border border-[#00FFE0] text-[#00FFE0] text-xs font-mono font-bold shadow-lg animate-in fade-in slide-in-from-top-2">
          {toastMsg}
        </div>
      )}

      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00FFE0]/20 to-[#E056FD]/20 border border-[#00FFE0]/40 flex items-center justify-center text-[#00FFE0] shadow-[0_0_15px_rgba(0,255,224,0.2)]">
            <i className="fa-solid fa-sliders text-base"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-serif font-black italic text-white">
                Payout Threshold Settings & Boss Alert Engine
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#00FFE0]/15 border border-[#00FFE0]/30 text-[#00FFE0] text-[9px] font-mono font-bold uppercase">
                Active Listener
              </span>
            </div>
            <p className="text-xs text-gray-400 font-light font-mono">
              Define milestone amounts (<strong className="text-[#00FFE0]">$100</strong>, <strong className="text-[#00FFE0]">$500</strong>, <strong className="text-[#00FFE0]">$1,000</strong>) to trigger Boss alert toasts upon PayPal sandbox settlements.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (isFormOpen && !editingId) {
                setIsFormOpen(false);
              } else {
                setEditingId(null);
                setThresholdAmount('500');
                setThresholdLabel('');
                setThresholdMemo('');
                setIsFormOpen(true);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00FFE0] to-[#E056FD] text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-[#00FFE0]/20 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <i className={`fa-solid ${isFormOpen && !editingId ? 'fa-xmark' : 'fa-plus'} text-xs`}></i>
            <span>{isFormOpen && !editingId ? 'Close' : 'Add Threshold'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLogsModal(true)}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="View triggered alert log history"
          >
            <i className="fa-solid fa-clock-rotate-left text-[#00FFE0] text-xs"></i>
            <span>Audit Log ({logs.length})</span>
          </button>
        </div>
      </div>

      {/* Real-Time Aggregated Progress Ribbon */}
      <div className="mt-6 p-4 rounded-2xl bg-zinc-900/80 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1.5">
            <i className="fa-brands fa-paypal text-[#38BDF8]"></i>
            <span>Aggregated PayPal Sandbox Payouts</span>
          </span>
          <div className="text-2xl sm:text-3xl font-mono font-black text-white flex items-baseline gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFE0] via-[#E056FD] to-[#FF007F]">
              ${currentTotalAggregated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-gray-400 font-mono">USD Processed</span>
          </div>
        </div>

        {nextUpcoming ? (
          <div className="flex-1 max-w-md space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-300 flex items-center gap-1.5 truncate">
                <i className="fa-solid fa-flag-checkered text-[#00FFE0]"></i>
                <span>Next Milestone: <strong className="text-white">${nextUpcoming.threshold.toLocaleString()}</strong> ({nextUpcoming.label})</span>
              </span>
              <span className="text-[#00FFE0] font-bold shrink-0 ml-2">
                ${Math.max(0, nextUpcoming.threshold - currentTotalAggregated).toLocaleString(undefined, { minimumFractionDigits: 2 })} left
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00FFE0] via-[#E056FD] to-[#FF007F] rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, (currentTotalAggregated / nextUpcoming.threshold) * 100))}%`
                }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="px-3.5 py-2 rounded-xl bg-[#00FFE0]/10 border border-[#00FFE0]/30 text-[#00FFE0] text-xs font-mono flex items-center gap-2">
            <i className="fa-solid fa-crown text-sm"></i>
            <span>All configured thresholds achieved! Add higher milestones below.</span>
          </div>
        )}
      </div>

      {/* 1-Click Quick Preset Chips */}
      <div className="mt-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-bolt text-[#00FFE0] text-xs"></i>
          <span className="text-[11px] font-mono uppercase tracking-wider text-gray-300 font-bold">
            1-Click Preset Amounts:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickAddPreset(100, '$100 Ignition Milestone', 'BRONZE')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00FFE0]/20 border border-white/10 hover:border-[#00FFE0]/40 text-xs font-mono text-gray-200 hover:text-[#00FFE0] transition-all cursor-pointer"
          >
            + $100
          </button>
          <button
            type="button"
            onClick={() => handleQuickAddPreset(500, '$500 Creator Surge Barrier', 'SILVER')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00FFE0]/20 border border-white/10 hover:border-[#00FFE0]/40 text-xs font-mono text-gray-200 hover:text-[#00FFE0] transition-all cursor-pointer"
          >
            + $500
          </button>
          <button
            type="button"
            onClick={() => handleQuickAddPreset(1000, '$1,000 Grand Millennial Threshold', 'GOLD')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00FFE0]/20 border border-white/10 hover:border-[#00FFE0]/40 text-xs font-mono text-[#00FFE0] font-bold transition-all cursor-pointer shadow-sm"
          >
            + $1,000
          </button>
          <button
            type="button"
            onClick={() => handleQuickAddPreset(2500, '$2,500 Vault Velocity', 'GOLD')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-mono text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            + $2.5K
          </button>
          <button
            type="button"
            onClick={() => handleQuickAddPreset(5000, '$5,000 Platinum Sovereign', 'PLATINUM')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-mono text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            + $5K
          </button>
          <button
            type="button"
            onClick={() => handleQuickAddPreset(10000, '$10,000 Diamond Accelerator', 'DIAMOND')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-mono text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            + $10K
          </button>
        </div>
      </div>

      {/* Define / Edit Threshold Form */}
      {isFormOpen && (
        <form onSubmit={handleSaveThreshold} className="mt-5 p-5 rounded-2xl bg-black/90 border border-[#00FFE0]/40 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#00FFE0] flex items-center gap-2">
              <i className="fa-solid fa-bullseye-arrow"></i>
              <span>{editingId ? 'Edit Payout Threshold Amount' : 'Define Specific Payout Threshold Amount'}</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingId(null);
              }}
              className="text-gray-400 hover:text-white"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Threshold Amount Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-gray-300 font-bold uppercase flex items-center gap-1">
                Threshold Amount (USD) <span className="text-[#FF007F]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono font-bold">$</span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  placeholder="100, 500, 1000"
                  value={thresholdAmount}
                  onChange={(e) => setThresholdAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-sm focus:border-[#00FFE0] outline-none"
                  required
                />
              </div>
              <div className="flex gap-1 pt-1">
                <button type="button" onClick={() => setThresholdAmount((prev) => (Math.max(1, (parseFloat(prev) || 0) + 50)).toString())} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[10px] font-mono text-gray-300 cursor-pointer">+50</button>
                <button type="button" onClick={() => setThresholdAmount((prev) => (Math.max(1, (parseFloat(prev) || 0) + 100)).toString())} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[10px] font-mono text-gray-300 cursor-pointer">+100</button>
                <button type="button" onClick={() => setThresholdAmount((prev) => (Math.max(1, (parseFloat(prev) || 0) + 500)).toString())} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[10px] font-mono text-gray-300 cursor-pointer">+500</button>
                <button type="button" onClick={() => setThresholdAmount((prev) => (Math.max(1, (parseFloat(prev) || 0) + 1000)).toString())} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[10px] font-mono text-gray-300 cursor-pointer">+1K</button>
              </div>
            </div>

            {/* Label / Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-gray-300 font-bold uppercase">
                Milestone Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. $500 Creator Surge"
                value={thresholdLabel}
                onChange={(e) => setThresholdLabel(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs focus:border-[#00FFE0] outline-none"
              />
            </div>

            {/* Prestige Tier */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-gray-300 font-bold uppercase">
                Milestone Tier
              </label>
              <select
                value={thresholdTier}
                onChange={(e) => setThresholdTier(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-black border border-white/20 text-white text-xs font-mono focus:border-[#00FFE0] outline-none cursor-pointer"
              >
                <option value="BRONZE">Bronze Tier ($100+)</option>
                <option value="SILVER">Silver Tier ($500+)</option>
                <option value="GOLD">Gold Tier ($1,000+)</option>
                <option value="PLATINUM">Platinum Tier ($5,000+)</option>
                <option value="DIAMOND">Diamond Tier ($10,000+)</option>
                <option value="CUSTOM">Custom Tier</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-gray-300 font-bold uppercase">
              Custom Boss Alert Message / Note
            </label>
            <input
              type="text"
              placeholder="e.g. Milestone alert toast dispatched automatically upon PayPal sandbox payout settlement."
              value={thresholdMemo}
              onChange={(e) => setThresholdMemo(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs focus:border-[#00FFE0] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingId(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-mono text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#00FFE0] text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-white transition-all shadow-md cursor-pointer"
            >
              {editingId ? 'Save Changes' : 'Save & Arm Threshold'}
            </button>
          </div>
        </form>
      )}

      {/* Configured Thresholds Grid */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <i className="fa-solid fa-list-check text-[#00FFE0]"></i>
            <span>Active Threshold Targets ({milestones.length})</span>
          </span>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <button
              type="button"
              onClick={handleResetAll}
              className="text-gray-400 hover:text-[#00FFE0] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-arrows-rotate text-[10px]"></i>
              <span>Re-arm All</span>
            </button>
            <span className="text-gray-600">•</span>
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="text-gray-400 hover:text-[#FF007F] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-rotate-left text-[10px]"></i>
              <span>Reset Defaults ($100, $500, $1K)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {milestones.map((ms) => {
            const isSurpassed = currentTotalAggregated >= ms.threshold;
            const progress = Math.min(100, Math.max(0, (currentTotalAggregated / ms.threshold) * 100));

            return (
              <div
                key={ms.id}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden group ${
                  ms.triggered
                    ? 'bg-zinc-900/90 border-[#00FFE0]/40 shadow-[0_0_20px_rgba(0,255,224,0.1)]'
                    : ms.enabled
                    ? 'bg-zinc-900/60 border-white/10 hover:border-white/25'
                    : 'bg-zinc-950/40 border-white/5 opacity-50'
                }`}
              >
                {/* Status indicator edge */}
                <div
                  className={`absolute top-0 left-0 bottom-0 w-1 ${
                    ms.triggered
                      ? 'bg-gradient-to-b from-[#00FFE0] to-[#E056FD]'
                      : isSurpassed
                      ? 'bg-[#00FFE0]'
                      : 'bg-white/20'
                  }`}
                ></div>

                <div className="pl-2 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-mono font-black text-white">
                          ${ms.threshold.toLocaleString()}
                        </span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${
                          ms.tier === 'DIAMOND' || ms.tier === 'SOVEREIGN_DIAMOND'
                            ? 'bg-[#E056FD]/20 border-[#E056FD]/50 text-[#E056FD]'
                            : ms.tier === 'PLATINUM'
                            ? 'bg-[#00FFE0]/20 border-[#00FFE0]/50 text-[#00FFE0]'
                            : ms.tier === 'GOLD'
                            ? 'bg-[#FFB800]/20 border-[#FFB800]/50 text-[#FFB800]'
                            : 'bg-white/10 border-white/20 text-gray-300'
                        }`}>
                          {ms.tier}
                        </span>

                        {ms.triggered && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00FFE0]/20 text-[#00FFE0] border border-[#00FFE0]/40 font-bold flex items-center gap-1">
                            <i className="fa-solid fa-check text-[8px]"></i> TRIGGERED
                          </span>
                        )}
                      </div>
                      <h5 className="text-xs font-bold text-gray-200 truncate">
                        {ms.label}
                      </h5>
                    </div>

                    {/* Actions: Edit, Test Alert, Toggle */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(ms)}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white text-xs flex items-center justify-center cursor-pointer"
                        title="Edit threshold"
                      >
                        <i className="fa-solid fa-pen text-[10px]"></i>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTestAlert(ms)}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-[#00FFE0]/20 border border-white/10 hover:border-[#00FFE0]/40 text-[#00FFE0] text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                        title="Test Boss Notification Alert Toast"
                      >
                        <i className="fa-solid fa-bell text-[9px]"></i>
                        <span className="hidden sm:inline">Test</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggle(ms.id)}
                        className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer ${
                          ms.enabled ? 'bg-[#00FFE0]' : 'bg-white/20'
                        }`}
                        title={ms.enabled ? 'Enabled' : 'Disabled'}
                      >
                        <span
                          className={`absolute top-0.5 w-3 h-3 rounded-full bg-black transition-transform ${
                            ms.enabled ? 'right-0.5' : 'left-0.5'
                          }`}
                        ></span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 font-light truncate">
                    {ms.description}
                  </p>

                  {/* Progress towards threshold */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>{progress >= 100 ? 'Surpassed' : `${progress.toFixed(0)}% Disbursed`}</span>
                      <span>${currentTotalAggregated.toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${ms.threshold.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          progress >= 100
                            ? 'bg-gradient-to-r from-[#00FFE0] to-[#E056FD]'
                            : 'bg-[#00FFE0]'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono text-gray-400">
                    <div>
                      {ms.triggeredAt ? (
                        <span className="text-[#00FFE0] text-[9px] flex items-center gap-1">
                          <i className="fa-solid fa-check text-[8px]"></i>
                          Fired: {ms.triggeredAt.substring(0, 10)}
                        </span>
                      ) : (
                        <span className="text-gray-500">Armed for Alert</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {ms.triggered && (
                        <button
                          type="button"
                          onClick={() => handleResetTrigger(ms.id, ms.label)}
                          className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                          title="Re-arm threshold"
                        >
                          <i className="fa-solid fa-arrows-rotate text-[9px]"></i> Re-arm
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(ms.id, ms.label)}
                        className="text-gray-500 hover:text-[#FF007F] transition-colors cursor-pointer"
                        title="Delete milestone"
                      >
                        <i className="fa-solid fa-trash text-[9px]"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Log Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-clock-rotate-left text-[#00FFE0]"></i>
                <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                  Milestone Trigger Audit Log
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowLogsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {logs.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-gray-500 bg-white/5 rounded-2xl">
                  No milestone alerts triggered yet. As PayPal Sandbox payouts cross thresholds ($100, $500, $1000), events will be audited here.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-zinc-900 border border-white/5 text-xs font-mono flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#00FFE0]">
                          ${log.threshold.toLocaleString()} Milestone Hit
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {log.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Aggregated: ${log.totalAggregated.toLocaleString(undefined, { minimumFractionDigits: 2 })} • {log.gateway}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#00FFE0]/15 text-[#00FFE0] text-[9px] font-bold">
                      SUCCESS
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowLogsModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-white font-bold transition-colors cursor-pointer"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutThresholdSettingsPanel;
