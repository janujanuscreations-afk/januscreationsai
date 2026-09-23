import React, { useState, useEffect } from 'react';
import {
  revenueMilestoneService,
  RevenueMilestoneThreshold,
  RevenueMilestoneLog
} from '../services/revenueMilestoneService';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';

interface RevenueMilestoneManagerProps {
  currentTotalAggregated: number;
  onMilestoneTriggered?: (milestone: RevenueMilestoneThreshold) => void;
  className?: string;
}

export const RevenueMilestoneManager: React.FC<RevenueMilestoneManagerProps> = ({
  currentTotalAggregated,
  className = ''
}) => {
  const [milestones, setMilestones] = useState<RevenueMilestoneThreshold[]>([]);
  const [logs, setLogs] = useState<RevenueMilestoneLog[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLogsDrawer, setShowLogsDrawer] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<RevenueMilestoneThreshold | null>(null);

  // Form State (New / Edit)
  const [customAmount, setCustomAmount] = useState<string>('100');
  const [customLabel, setCustomLabel] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [customTier, setCustomTier] = useState<RevenueMilestoneThreshold['tier']>('BRONZE');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load from service
  const refreshData = () => {
    setMilestones(revenueMilestoneService.getMilestones());
    setLogs(revenueMilestoneService.getLogs());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Show temporary feedback toast
  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleToggle = (id: string) => {
    revenueMilestoneService.toggleMilestone(id);
    refreshData();
    bossAudio.playSubtlePing();
  };

  const handleDelete = (id: string, label: string) => {
    if (confirm(`Remove milestone "${label}"?`)) {
      revenueMilestoneService.deleteMilestone(id);
      refreshData();
      showFeedback(`Milestone "${label}" removed.`);
    }
  };

  const handleResetTrigger = (id: string, label: string) => {
    revenueMilestoneService.resetMilestone(id);
    refreshData();
    showFeedback(`"${label}" re-armed for future alerts!`);
    bossAudio.playSubtlePing();
  };

  const handleResetAll = () => {
    if (confirm('Re-arm all milestone thresholds so they can trigger alerts again when payouts occur?')) {
      revenueMilestoneService.resetAllMilestones();
      refreshData();
      showFeedback('All revenue milestone alerts have been re-armed.');
      bossAudio.playSubtlePing();
    }
  };

  const handleRestoreDefaults = () => {
    if (confirm('Restore default threshold presets ($100, $500, $1K, $5K, $10K, $25K)?')) {
      revenueMilestoneService.restoreDefaults();
      refreshData();
      showFeedback('Default milestone thresholds ($100, $500, $1,000, $5,000, $10,000, $25,000) restored.');
      bossAudio.playSubtlePing();
    }
  };

  const handleSimulateTest = (milestone: RevenueMilestoneThreshold) => {
    revenueMilestoneService.simulateMilestoneAlert(milestone.id);
  };

  const handleOpenEdit = (ms: RevenueMilestoneThreshold) => {
    setEditingMilestone(ms);
    setCustomAmount(ms.threshold.toString());
    setCustomLabel(ms.label);
    setCustomDescription(ms.description);
    setCustomTier(ms.tier);
    setShowAddForm(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone) return;

    const amount = parseFloat(customAmount.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) {
      showFeedback('Please enter a valid threshold amount.', 'error');
      return;
    }

    revenueMilestoneService.updateMilestone(editingMilestone.id, {
      threshold: amount,
      label: customLabel || `$${amount.toLocaleString()} Payout Threshold`,
      description: customDescription || `Threshold of $${amount.toLocaleString()} USD reached.`,
      tier: customTier
    });

    refreshData();
    setEditingMilestone(null);
    showFeedback(`Updated milestone to $${amount.toLocaleString()} USD!`);
    bossAudio.playSubtlePing();

    if (currentTotalAggregated >= amount) {
      revenueMilestoneService.checkAndTriggerMilestones(currentTotalAggregated);
      refreshData();
    }
  };

  const handleAddCustomMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(customAmount.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) {
      showFeedback('Please enter a valid milestone payout amount.', 'error');
      return;
    }

    const newMs = revenueMilestoneService.addMilestone(
      amount,
      customLabel || undefined,
      customTier,
      customDescription || undefined
    );

    refreshData();
    setShowAddForm(false);
    setCustomAmount('100');
    setCustomLabel('');
    setCustomDescription('');
    showFeedback(`Added new milestone for $${amount.toLocaleString()} USD!`);
    bossAudio.playSubtlePing();

    // Check if current aggregated total already triggers it
    if (currentTotalAggregated >= amount) {
      revenueMilestoneService.checkAndTriggerMilestones(currentTotalAggregated);
      refreshData();
    }
  };

  const handleQuickAddPreset = (amount: number, label: string, tier: RevenueMilestoneThreshold['tier']) => {
    revenueMilestoneService.addMilestone(amount, label, tier);
    refreshData();
    showFeedback(`Added ${label} threshold!`);
    bossAudio.playSubtlePing();

    if (currentTotalAggregated >= amount) {
      revenueMilestoneService.checkAndTriggerMilestones(currentTotalAggregated);
      refreshData();
    }
  };

  const handleIncrementAmount = (delta: number) => {
    const current = parseFloat(customAmount.replace(/,/g, '')) || 0;
    const next = Math.max(10, current + delta);
    setCustomAmount(next.toString());
  };

  // Find next target milestone
  const nextTargetMilestone = milestones
    .filter(m => m.enabled && !m.triggered && m.threshold > currentTotalAggregated)
    .sort((a, b) => a.threshold - b.threshold)[0];

  const highestPassedMilestone = [...milestones]
    .filter(m => currentTotalAggregated >= m.threshold)
    .sort((a, b) => b.threshold - a.threshold)[0];

  return (
    <div className={`p-6 sm:p-8 rounded-3xl bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden ${className}`}>
      {/* Background Neon Ambient Halo */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-[#00FFE0]/15 via-[#E056FD]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00FFE0]/20 to-[#E056FD]/20 border border-[#00FFE0]/40 flex items-center justify-center text-[#00FFE0] shadow-inner">
              <i className="fa-solid fa-trophy-star text-sm animate-pulse"></i>
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#00FFE0] uppercase">
                Founder Alert Subsystem & Settings
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-black italic text-white flex items-center gap-2">
                Payout Milestone Thresholds
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-[#00FFE0]/10 text-[#00FFE0] border border-[#00FFE0]/30 font-bold not-italic">
                  BOSS ENGINE
                </span>
              </h2>
            </div>
          </div>
          <p className="text-xs text-gray-400 font-light max-w-2xl">
            Define specific payout threshold targets (<strong className="text-[#00FFE0]">$100</strong>, <strong className="text-[#00FFE0]">$500</strong>, <strong className="text-[#00FFE0]">$1,000</strong>, etc.). Connected directly to the <strong className="text-white">Boss Notification system</strong> to trigger automated toast alerts, synthesized audio fanfares, and neon explosions whenever aggregated PayPal Sandbox payouts cross each milestone.
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingMilestone(null);
              setShowAddForm(!showAddForm);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00FFE0] to-[#E056FD] text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#00FFE0]/20 hover:scale-105 transition-all cursor-pointer"
          >
            <i className={`fa-solid ${showAddForm ? 'fa-xmark' : 'fa-plus'}`}></i>
            <span>{showAddForm ? 'Close Form' : 'Add Threshold'}</span>
          </button>
          
          <button
            type="button"
            onClick={() => setShowLogsDrawer(!showLogsDrawer)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-mono text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-list-check text-[#00FFE0]"></i>
            <span>Trigger Audit Log ({logs.length})</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className={`mt-4 p-3 rounded-xl border text-xs font-mono flex items-center justify-between animate-in fade-in duration-200 ${
          feedbackMsg.type === 'success'
            ? 'bg-[#00FFE0]/10 border-[#00FFE0]/40 text-[#00FFE0]'
            : 'bg-[#FF007F]/10 border-[#FF007F]/40 text-[#FF007F]'
        }`}>
          <div className="flex items-center gap-2">
            <i className={`fa-solid ${feedbackMsg.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-gray-400 hover:text-white">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* Next Target / Current Status Highlight Ribbon */}
      <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-white/[0.03] via-white/[0.06] to-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Current Aggregated Sandbox Payouts</span>
          <div className="text-2xl font-mono font-black text-white flex items-baseline gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFE0] via-[#E056FD] to-[#FF007F]">
              ${currentTotalAggregated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-gray-400 font-normal">USD Disbursed</span>
          </div>
        </div>

        {nextTargetMilestone ? (
          <div className="w-full sm:w-auto flex-1 max-w-md sm:ml-4 space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-gray-300 flex items-center gap-1.5">
                <i className="fa-solid fa-flag-checkered text-[#00FFE0]"></i>
                <span>Next Target: <strong className="text-white">{nextTargetMilestone.label} (${nextTargetMilestone.threshold.toLocaleString()})</strong></span>
              </span>
              <span className="text-[#00FFE0] font-bold">
                ${Math.max(0, nextTargetMilestone.threshold - currentTotalAggregated).toLocaleString(undefined, { minimumFractionDigits: 2 })} remaining
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-[#00FFE0] via-[#E056FD] to-[#FF007F] rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, (currentTotalAggregated / nextTargetMilestone.threshold) * 100))}%`
                }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-mono text-[#00FFE0] bg-[#00FFE0]/10 border border-[#00FFE0]/30 px-3 py-1.5 rounded-xl">
            <i className="fa-solid fa-crown text-sm"></i>
            <span>All configured thresholds achieved! Add higher milestones below.</span>
          </div>
        )}
      </div>

      {/* Quick Threshold Preset Bar */}
      <div className="mt-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-bolt text-[#00FFE0] text-xs"></i>
          <span className="text-[11px] font-mono uppercase tracking-wider text-gray-300 font-bold">
            1-Click Preset Amounts:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickAddPreset(100, '$100 Sovereign Spark', 'BRONZE')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00FFE0]/20 border border-white/10 hover:border-[#00FFE0]/40 text-xs font-mono text-gray-200 hover:text-[#00FFE0] transition-all cursor-pointer"
          >
            + $100
          </button>
          <button
            type="button"
            onClick={() => handleQuickAddPreset(500, '$500 Creator Surge', 'SILVER')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00FFE0]/20 border border-white/10 hover:border-[#00FFE0]/40 text-xs font-mono text-gray-200 hover:text-[#00FFE0] transition-all cursor-pointer"
          >
            + $500
          </button>
          <button
            type="button"
            onClick={() => handleQuickAddPreset(1000, '$1,000 Grand Millennial', 'GOLD')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00FFE0]/20 border border-white/10 hover:border-[#00FFE0]/40 text-xs font-mono text-[#00FFE0] font-bold transition-all cursor-pointer shadow-sm"
          >
            + $1,000
          </button>
          <button
            type="button"
            onClick={() => handleQuickAddPreset(2500, '$2,500 Vault Velocity', 'GOLD')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-mono text-gray-300 hover:text-white transition-colors"
          >
            + $2.5K
          </button>
          <button
            type="button"
            onClick={() => handleQuickAddPreset(5000, '$5,000 Platinum Seed Milestone', 'PLATINUM')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-mono text-gray-300 hover:text-white transition-colors"
          >
            + $5K
          </button>
          <button
            type="button"
            onClick={() => handleQuickAddPreset(10000, '$10,000 Diamond Accelerator', 'DIAMOND')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-mono text-gray-300 hover:text-white transition-colors"
          >
            + $10K
          </button>
        </div>
      </div>

      {/* Edit Milestone Modal / Drawer */}
      {editingMilestone && (
        <form onSubmit={handleSaveEdit} className="mt-6 p-5 rounded-2xl bg-black/95 border border-[#E056FD]/60 shadow-[0_0_30px_rgba(224,86,253,0.2)] space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#E056FD] flex items-center gap-2">
              <i className="fa-solid fa-pen-to-square"></i>
              <span>Edit Payout Milestone Threshold</span>
            </h3>
            <button
              type="button"
              onClick={() => setEditingMilestone(null)}
              className="text-gray-400 hover:text-white"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-gray-300 font-bold uppercase flex items-center gap-1">
                Threshold Amount (USD) <span className="text-[#FF007F]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono font-bold">$</span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-[#E056FD]/50 text-white font-mono text-sm focus:border-[#E056FD] focus:ring-1 focus:ring-[#E056FD] outline-none transition-all"
                  required
                />
              </div>
              <div className="flex gap-1 pt-1">
                <button type="button" onClick={() => handleIncrementAmount(50)} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[10px] font-mono text-gray-300">+50</button>
                <button type="button" onClick={() => handleIncrementAmount(100)} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[10px] font-mono text-gray-300">+100</button>
                <button type="button" onClick={() => handleIncrementAmount(500)} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[10px] font-mono text-gray-300">+500</button>
                <button type="button" onClick={() => handleIncrementAmount(1000)} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[10px] font-mono text-gray-300">+1K</button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-gray-300 font-bold uppercase">
                Milestone Title
              </label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:border-[#E056FD] outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-gray-300 font-bold uppercase">
                Prestige Tier
              </label>
              <select
                value={customTier}
                onChange={(e) => setCustomTier(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white text-xs font-mono focus:border-[#E056FD] outline-none cursor-pointer"
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

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-gray-300 font-bold uppercase">
              Custom Alert Memo / Note
            </label>
            <input
              type="text"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:border-[#E056FD] outline-none transition-all"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setEditingMilestone(null)}
              className="px-4 py-2 rounded-xl text-xs font-mono text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#E056FD] text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-white transition-all shadow-md cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Add Milestone Form Drawer */}
      {showAddForm && !editingMilestone && (
        <form onSubmit={handleAddCustomMilestone} className="mt-6 p-5 rounded-2xl bg-black/80 border border-[#00FFE0]/40 shadow-[0_0_30px_rgba(0,255,224,0.15)] space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#00FFE0] flex items-center gap-2">
              <i className="fa-solid fa-bullseye-arrow"></i>
              <span>Define Specific Payout Threshold Amount</span>
            </h3>
            <span className="text-[10px] font-mono text-gray-400">Triggers Boss Notification Toast</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-gray-300 font-bold uppercase flex items-center gap-1">
                Threshold Amount (USD) <span className="text-[#FF007F]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono font-bold">$</span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  placeholder="e.g. 100, 500, 1000"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono text-sm focus:border-[#00FFE0] focus:ring-1 focus:ring-[#00FFE0] outline-none transition-all"
                  required
                />
              </div>
              <div className="flex gap-1 pt-1">
                <button type="button" onClick={() => handleIncrementAmount(50)} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[10px] font-mono text-gray-300">+50</button>
                <button type="button" onClick={() => handleIncrementAmount(100)} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[10px] font-mono text-gray-300">+100</button>
                <button type="button" onClick={() => handleIncrementAmount(500)} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[10px] font-mono text-gray-300">+500</button>
                <button type="button" onClick={() => handleIncrementAmount(1000)} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[10px] font-mono text-gray-300">+1K</button>
              </div>
            </div>

            {/* Label / Title */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-gray-300 font-bold uppercase">
                Milestone Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. $500 Creator Surge Barrier"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:border-[#00FFE0] focus:ring-1 focus:ring-[#00FFE0] outline-none transition-all"
              />
            </div>

            {/* Tier */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-gray-300 font-bold uppercase">
                Prestige Tier
              </label>
              <select
                value={customTier}
                onChange={(e) => setCustomTier(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-white text-xs font-mono focus:border-[#00FFE0] outline-none cursor-pointer"
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

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-gray-300 font-bold uppercase">
              Custom Alert Memo / Note
            </label>
            <input
              type="text"
              placeholder="e.g. Milestone alert dispatched upon aggregated PayPal payout settlement."
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:border-[#00FFE0] outline-none transition-all"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-mono text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#00FFE0] text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-white transition-all shadow-md cursor-pointer"
            >
              Save Milestone Threshold
            </button>
          </div>
        </form>
      )}

      {/* Threshold Cards Grid */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <i className="fa-solid fa-sliders text-[#00FFE0]"></i>
            <span>Active Milestone Thresholds ({milestones.length})</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAll}
              className="text-[11px] font-mono text-gray-400 hover:text-[#00FFE0] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Re-arm all milestones so they can trigger again"
            >
              <i className="fa-solid fa-arrows-rotate text-[10px]"></i>
              <span>Re-arm All</span>
            </button>
            <span className="text-gray-600">•</span>
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="text-[11px] font-mono text-gray-400 hover:text-[#FF007F] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset back to standard preset milestones ($100, $500, $1K, $5K, $10K, $25K)"
            >
              <i className="fa-solid fa-clock-rotate-left text-[10px]"></i>
              <span>Defaults ($100, $500, $1K)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {milestones.map((ms) => {
            const isSurpassed = currentTotalAggregated >= ms.threshold;
            const progress = Math.min(100, Math.max(0, (currentTotalAggregated / ms.threshold) * 100));

            return (
              <div
                key={ms.id}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden group ${
                  ms.triggered
                    ? 'bg-black/90 border-[#00FFE0]/40 shadow-[0_0_20px_rgba(0,255,224,0.15)]'
                    : ms.enabled
                    ? 'bg-black/70 border-white/15 hover:border-white/30'
                    : 'bg-black/40 border-white/5 opacity-60'
                }`}
              >
                {/* Status indicator bar */}
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
                          {ms.tier === 'SOVEREIGN_DIAMOND' ? 'DIAMOND' : ms.tier}
                        </span>

                        {ms.triggered && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00FFE0]/20 text-[#00FFE0] border border-[#00FFE0]/40 font-bold flex items-center gap-1">
                            <i className="fa-solid fa-check text-[8px]"></i> TRIGGERED
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-gray-200">
                        {ms.label}
                      </h4>
                    </div>

                    {/* Quick Action Toggle, Edit & Test Button */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(ms)}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                        title="Edit threshold amount or label"
                      >
                        <i className="fa-solid fa-pen text-[9px]"></i>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSimulateTest(ms)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00FFE0]/20 border border-white/10 hover:border-[#00FFE0]/40 text-[#00FFE0] text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                        title="Simulate Boss Alert toast for this milestone"
                      >
                        <i className="fa-solid fa-bell text-[9px]"></i>
                        <span>Test Alert</span>
                      </button>

                      {/* Enable Switch */}
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

                  <p className="text-[11px] text-gray-400 font-light line-clamp-1">
                    {ms.description}
                  </p>

                  {/* Progress Bar & Metric */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>{progress >= 100 ? 'Target Surpassed' : `${progress.toFixed(1)}% Achieved`}</span>
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

                  {/* Footer Controls */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono text-gray-400">
                    <div>
                      {ms.triggeredAt ? (
                        <span className="text-[#00FFE0] text-[9px] flex items-center gap-1">
                          <i className="fa-solid fa-clock text-[8px]"></i>
                          Triggered: {ms.triggeredAt.substring(0, 10)}
                        </span>
                      ) : (
                        <span className="text-gray-500">Armed & Waiting</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {ms.triggered && (
                        <button
                          type="button"
                          onClick={() => handleResetTrigger(ms.id, ms.label)}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="Re-arm this milestone"
                        >
                          <i className="fa-solid fa-arrows-rotate text-[9px]"></i> Re-arm
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(ms.id, ms.label)}
                        className="text-gray-500 hover:text-[#FF007F] transition-colors"
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

      {/* Logs Drawer Modal */}
      {showLogsDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0d0d0d] border border-[#00FFE0]/30 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <i className="fa-solid fa-scroll text-[#00FFE0]"></i>
                <h3 className="text-base font-mono font-bold text-white uppercase tracking-wider">
                  Revenue Milestone Trigger Audit Trail
                </h3>
              </div>
              <button
                onClick={() => setShowLogsDrawer(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-gray-500 font-mono text-xs">
                  <i className="fa-solid fa-inbox text-3xl mb-2 opacity-40 block"></i>
                  No milestone alerts triggered yet. Approve payouts or test alerts to generate logs.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-mono">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[#00FFE0] font-bold">Threshold: ${log.threshold.toLocaleString()} USD</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-300">Surpassed at: ${log.totalAggregated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-2">
                        <span>{log.timestamp}</span>
                        <span>•</span>
                        <span>Gateway: {log.gateway}</span>
                        {log.triggeredBy && <span>• Target: {log.triggeredBy}</span>}
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-[#00FFE0]/15 text-[#00FFE0] border border-[#00FFE0]/30 text-[10px] font-bold">
                      DELIVERED
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLogsDrawer(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold"
              >
                Close Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
