import React, { useState, useEffect } from 'react';
import { autoPayoutService } from '../services/autoPayoutService';
import { auth } from '../services/firebase';
import { AutoPayoutSetting, AutoPayoutLog } from '../types';

interface AutoPayoutThresholdPanelProps {
  currentBalance: number;
  onBalanceUpdated: (newBalance: number) => void;
  onOpenPayPalRestModal?: () => void;
}

const PRESET_THRESHOLDS = [50, 100, 250, 500, 1000, 2500];

export const AutoPayoutThresholdPanel: React.FC<AutoPayoutThresholdPanelProps> = ({
  currentBalance,
  onBalanceUpdated,
  onOpenPayPalRestModal
}) => {
  const [settings, setSettings] = useState<AutoPayoutSetting>(autoPayoutService.getSettings());
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [inputEmail, setInputEmail] = useState(settings.paypalEmail);
  const [customThreshold, setCustomThreshold] = useState(settings.thresholdAmount.toString());
  const [customReserve, setCustomReserve] = useState(settings.minimumReserve.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTriggeringSweep, setIsTriggeringSweep] = useState(false);
  const [sweepResult, setSweepResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'audit'>('config');

  // Subscribe to live settings
  useEffect(() => {
    const unsub = autoPayoutService.subscribe((updated) => {
      setSettings(updated);
      setInputEmail(updated.paypalEmail);
      setCustomThreshold(updated.thresholdAmount.toString());
      setCustomReserve(updated.minimumReserve.toString());
    });
    return () => unsub();
  }, []);

  const evaluation = autoPayoutService.evaluateThreshold(currentBalance);

  const handleToggleEnabled = async () => {
    setIsSaving(true);
    await autoPayoutService.updateSettings({ enabled: !settings.enabled });
    setIsSaving(false);
    showSaveIndicator();
  };

  const handleSelectPreset = async (val: number) => {
    setCustomThreshold(val.toString());
    setIsSaving(true);
    await autoPayoutService.updateSettings({ thresholdAmount: val });
    setIsSaving(false);
    showSaveIndicator();
  };

  const handleSaveCustomThreshold = async () => {
    const parsed = parseFloat(customThreshold);
    if (!isNaN(parsed) && parsed >= 10) {
      setIsSaving(true);
      await autoPayoutService.updateSettings({ thresholdAmount: parsed });
      setIsSaving(false);
      showSaveIndicator();
    }
  };

  const handleSaveEmail = async () => {
    if (inputEmail.trim() && inputEmail.includes('@')) {
      setIsSaving(true);
      await autoPayoutService.updateSettings({ paypalEmail: inputEmail.trim() });
      setIsSaving(false);
      setIsEditingEmail(false);
      showSaveIndicator();
    }
  };

  const handleModeChange = async (mode: 'full_balance' | 'threshold_amount' | 'custom_reserve') => {
    setIsSaving(true);
    await autoPayoutService.updateSettings({ payoutMode: mode });
    setIsSaving(false);
    showSaveIndicator();
  };

  const handleSaveReserve = async () => {
    const parsed = parseFloat(customReserve);
    if (!isNaN(parsed) && parsed >= 0) {
      setIsSaving(true);
      await autoPayoutService.updateSettings({ minimumReserve: parsed });
      setIsSaving(false);
      showSaveIndicator();
    }
  };

  const showSaveIndicator = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExecuteSweepNow = async () => {
    if (!auth.currentUser && typeof (auth as any).authStateReady === 'function') {
      await (auth as any).authStateReady();
    }

    if (!auth.currentUser) {
      setSweepResult({ success: false, message: '⚠️ Please sign in to your creator account before running payouts.' });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
      }
      return;
    }

    setIsTriggeringSweep(true);
    setSweepResult(null);
    try {
      const res = await autoPayoutService.executeAutoPayout({
        currentBalance,
        onBalanceUpdated,
        force: true
      });
      setSweepResult(res);
    } catch (err: any) {
      setSweepResult({ success: false, message: err.message || 'Sweep failed' });
    } finally {
      setIsTriggeringSweep(false);
    }
  };

  const handleSimulateAutoPayout = async () => {
    if (!auth.currentUser && typeof (auth as any).authStateReady === 'function') {
      await (auth as any).authStateReady();
    }

    if (!auth.currentUser) {
      setSweepResult({ success: false, message: '⚠️ Please sign in to your creator account before running payouts.' });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
      }
      return;
    }

    setIsTriggeringSweep(true);
    setSweepResult(null);
    try {
      const res = await autoPayoutService.simulateAutoPayoutTrigger({
        currentBalance,
        onBalanceUpdated
      });
      setSweepResult(res);
    } catch (err: any) {
      setSweepResult({ success: false, message: err.message || 'Simulation failed' });
    } finally {
      setIsTriggeringSweep(false);
    }
  };

  return (
    <div id="auto-payout-threshold-panel" className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Status Card */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-black border border-amber-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner flex items-center justify-center">
                <i className="fa-solid fa-bolt text-2xl text-amber-300 animate-pulse"></i>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white tracking-wide flex items-center gap-2">
                  Automated PayPal Payout Threshold
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest">
                    Sovereign Engine
                  </span>
                </h3>
                <p className="text-xs font-mono text-neutral-400 mt-0.5 leading-relaxed">
                  Automatically dispatches PayPal payouts to your registered account as soon as your pending balance crosses your set threshold limit.
                </p>
              </div>
            </div>
          </div>

          {/* Master Enable/Disable Toggle */}
          <div className="flex items-center gap-4 bg-neutral-950/80 backdrop-blur border border-neutral-800 p-3 px-5 rounded-2xl shrink-0">
            <div className="text-right">
              <span className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-400">
                Trigger Status
              </span>
              <span className={`text-xs font-mono font-bold ${settings.enabled ? 'text-emerald-400' : 'text-neutral-400'}`}>
                {settings.enabled ? '● ARMED & ACTIVE' : '○ PAUSED'}
              </span>
            </div>
            <button
              id="toggle-auto-payout-btn"
              type="button"
              onClick={handleToggleEnabled}
              disabled={isSaving}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.enabled ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                  settings.enabled ? 'translate-x-6 text-emerald-600' : 'translate-x-0 text-neutral-600'
                }`}
              >
                <i className={`fa-solid ${settings.enabled ? 'fa-play text-[10px] ml-0.5' : 'fa-pause text-[10px]'}`}></i>
              </span>
            </button>
          </div>
        </div>

        {/* Live Balance vs Threshold Visual Gauge */}
        <div className="mt-8 pt-6 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4">
            <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider block mb-1">
              Current Available Balance
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline gap-1.5">
              ${currentBalance.toFixed(2)}
              <span className="text-xs text-neutral-500 font-normal">USD</span>
            </div>
            <span className="text-[11px] font-mono text-neutral-500 mt-1 block">Live creator pending balance</span>
          </div>

          <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4">
            <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider block mb-1">
              Active Trigger Threshold
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono flex items-baseline gap-1.5">
              ${settings.thresholdAmount.toFixed(2)}
              <span className="text-xs text-amber-500/80 font-normal">USD</span>
            </div>
            <span className="text-[11px] font-mono text-neutral-500 mt-1 block">Auto-disburses when reached</span>
          </div>

          <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4">
            <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider block mb-1">
              Total Auto-Disbursed
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono flex items-baseline gap-1.5">
              ${settings.totalAutoDisbursed.toFixed(2)}
              <span className="text-xs text-emerald-500/80 font-normal">({settings.autoPayoutCount} sweeps)</span>
            </div>
            <span className="text-[11px] font-mono text-neutral-500 mt-1 block">Lifetime automated payouts</span>
          </div>
        </div>

        {/* Threshold Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400 font-medium flex items-center gap-1.5">
              {evaluation.isEligible ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <i className="fa-solid fa-circle-check text-emerald-400"></i>
                  <span>Threshold Reached! Automated Trigger Armed</span>
                </span>
              ) : (
                <span>Progress to Next Auto-Disbursement</span>
              )}
            </span>
            <span className="font-mono font-bold text-neutral-200">
              {evaluation.progressPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 w-full bg-neutral-950 rounded-full overflow-hidden p-0.5 border border-neutral-800">
            <div
              style={{ width: `${evaluation.progressPercentage}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                evaluation.isEligible
                  ? 'bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.8)]'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-400'
              }`}
            />
          </div>
          <p className="text-xs font-mono text-neutral-400 flex items-center gap-2 pt-1">
            <i className="fa-solid fa-circle-info text-neutral-500"></i>
            <span>{evaluation.reason}</span>
          </p>
        </div>
      </div>

      {/* Save Success Indicator */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold rounded-2xl flex items-center gap-2.5 shadow-lg animate-in fade-in">
          <i className="fa-solid fa-circle-check text-emerald-400 text-base"></i>
          <span>Auto-Payout threshold settings saved and synced securely to Firestore!</span>
        </div>
      )}

      {/* Sweep Execution Result Alert */}
      {sweepResult && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 shadow-xl animate-in fade-in ${
            sweepResult.success
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500 text-rose-200'
          }`}
        >
          <i className={`fa-solid ${sweepResult.success ? 'fa-circle-check text-emerald-400' : 'fa-triangle-exclamation text-rose-400'} text-lg shrink-0 mt-0.5`}></i>
          <div className="space-y-1">
            <span className="font-mono font-bold text-sm block">
              {sweepResult.success ? '⚡ Auto-Payout Sweep Executed' : 'Execution Error'}
            </span>
            <p className="text-xs font-mono opacity-90">{sweepResult.message}</p>
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs: Configuration vs Audit History */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'config'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <i className="fa-solid fa-sliders text-xs"></i>
          <span>Threshold Configuration</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
          }`}
        >
          <i className="fa-solid fa-clock-rotate-left text-xs"></i>
          <span>Sweep Audit Logs ({settings.history?.length || 0})</span>
        </button>
      </div>

      {activeTab === 'config' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Threshold & Mode Settings (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Threshold Amount Selection */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                    <i className="fa-solid fa-dollar-sign text-amber-400"></i>
                    Target Payout Threshold Limit
                  </h4>
                  <p className="text-xs font-mono text-neutral-400">
                    When pending balance reaches or crosses this number, auto-payout activates.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-500/30">
                  ${settings.thresholdAmount.toFixed(2)} USD
                </span>
              </div>

              {/* Preset Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_THRESHOLDS.map((amount) => {
                  const isSelected = settings.thresholdAmount === amount;
                  return (
                    <button
                      key={amount}
                      id={`preset-threshold-${amount}`}
                      type="button"
                      onClick={() => handleSelectPreset(amount)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20 scale-[1.02]'
                          : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800'
                      }`}
                    >
                      ${amount}
                    </button>
                  );
                })}
              </div>

              {/* Custom Threshold Input */}
              <div className="flex items-center gap-2 pt-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-500 font-mono">$</span>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={customThreshold}
                    onChange={(e) => setCustomThreshold(e.target.value)}
                    placeholder="Custom amount (e.g. 750)"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-7 pr-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  id="save-custom-threshold-btn"
                  type="button"
                  onClick={handleSaveCustomThreshold}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-mono font-bold rounded-xl border border-neutral-600 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Set Custom Limit
                </button>
              </div>
            </div>

            {/* 2. Payout Mode Selection */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <i className="fa-solid fa-layer-group text-amber-400"></i>
                  Disbursement Strategy & Safety Cushion
                </h4>
                <p className="text-xs font-mono text-neutral-400">
                  Choose how much of your balance is transferred when the threshold triggers.
                </p>
              </div>

              <div className="space-y-3">
                {/* Full Balance Sweep */}
                <label
                  onClick={() => handleModeChange('full_balance')}
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    settings.payoutMode === 'full_balance'
                      ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-inner'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:bg-neutral-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payoutMode"
                    checked={settings.payoutMode === 'full_balance'}
                    onChange={() => {}}
                    className="mt-1 text-amber-500 focus:ring-amber-500"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white font-mono block">
                      Sweep Entire Available Balance
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400 block leading-relaxed">
                      Transfers 100% of pending creator funds directly to PayPal, resetting your wallet balance to $0.00.
                    </span>
                  </div>
                </label>

                {/* Exact Threshold Amount */}
                <label
                  onClick={() => handleModeChange('threshold_amount')}
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    settings.payoutMode === 'threshold_amount'
                      ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-inner'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:bg-neutral-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payoutMode"
                    checked={settings.payoutMode === 'threshold_amount'}
                    onChange={() => {}}
                    className="mt-1 text-amber-500 focus:ring-amber-500"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white font-mono block">
                      Disburse Exact Threshold Increment (${settings.thresholdAmount.toFixed(2)})
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400 block leading-relaxed">
                      Only sends the exact threshold sum (${settings.thresholdAmount.toFixed(2)}), keeping any excess earnings in your sovereign wallet.
                    </span>
                  </div>
                </label>

                {/* Custom Minimum Reserve */}
                <label
                  onClick={() => handleModeChange('custom_reserve')}
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                    settings.payoutMode === 'custom_reserve'
                      ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-inner'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:bg-neutral-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payoutMode"
                    checked={settings.payoutMode === 'custom_reserve'}
                    onChange={() => {}}
                    className="mt-1 text-amber-500 focus:ring-amber-500"
                  />
                  <div className="space-y-2 flex-1">
                    <div>
                      <span className="text-xs font-bold text-white font-mono block">
                        Retain Custom Minimum Safety Cushion
                      </span>
                      <span className="text-[11px] font-mono text-neutral-400 block leading-relaxed">
                        Sweeps all balance above a defined reserve amount.
                      </span>
                    </div>
                    {settings.payoutMode === 'custom_reserve' && (
                      <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs font-mono text-neutral-400">Keep reserve:</span>
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1.5 text-xs text-neutral-500 font-mono">$</span>
                          <input
                            type="number"
                            min="0"
                            value={customReserve}
                            onChange={(e) => setCustomReserve(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg pl-6 pr-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveReserve}
                          className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-bold cursor-pointer"
                        >
                          Save Reserve
                        </button>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Destination Account & Quick Triggers (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Registered PayPal Destination Account */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <i className="fa-brands fa-paypal text-amber-400 text-base"></i>
                  Registered PayPal Account
                </h4>
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  <i className="fa-solid fa-shield-halved text-xs"></i> Verified Merchant
                </span>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase tracking-wider block">
                  Connected Payout Destination:
                </span>
                {isEditingEmail ? (
                  <div className="space-y-2">
                    <input
                      type="email"
                      value={inputEmail}
                      onChange={(e) => setInputEmail(e.target.value)}
                      placeholder="paypal@example.com"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsEditingEmail(false)}
                        className="px-3 py-1.5 text-xs font-mono text-neutral-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEmail}
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Save Email
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-neutral-200 truncate max-w-[200px]">
                      {settings.paypalEmail}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingEmail(true)}
                      className="text-xs font-mono text-amber-400 hover:text-amber-300 font-bold underline underline-offset-2 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-[11px] font-mono text-neutral-400">
                <div className="flex items-center justify-between py-1.5 border-b border-neutral-800">
                  <span>Routing Protocol:</span>
                  <span className="text-neutral-200 font-bold">PayPal REST v1 Payouts</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-neutral-800">
                  <span>Platform Fee:</span>
                  <span className="text-emerald-400 font-bold">0.00% (Creator Keeps 100%)</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>Disbursement Speed:</span>
                  <span className="text-amber-300 font-bold">Instant / Real-Time</span>
                </div>
              </div>
            </div>

            {/* Interactive Sweep Triggers & Sandbox Testing */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-sm">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                <i className="fa-solid fa-wand-magic-sparkles text-amber-400"></i>
                Actions & Immediate Sweep
              </h4>

              <div className="space-y-3">
                {/* Execute Sweep Now */}
                <button
                  id="execute-threshold-sweep-btn"
                  type="button"
                  onClick={handleExecuteSweepNow}
                  disabled={isTriggeringSweep || currentBalance <= 0}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-mono font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isTriggeringSweep ? (
                    <i className="fa-solid fa-spinner fa-spin text-sm"></i>
                  ) : (
                    <i className="fa-solid fa-bolt text-sm"></i>
                  )}
                  {evaluation.isEligible
                    ? `Trigger Threshold Sweep ($${evaluation.triggerAmount.toFixed(2)})`
                    : `Disburse Available Balance ($${currentBalance.toFixed(2)})`}
                </button>

                {/* Simulate Trigger */}
                <button
                  id="simulate-auto-payout-btn"
                  type="button"
                  onClick={handleSimulateAutoPayout}
                  disabled={isTriggeringSweep}
                  className="w-full py-3 px-4 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-mono font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-arrows-rotate text-amber-400"></i>
                  Simulate Threshold Cross & Payout
                </button>

                {onOpenPayPalRestModal && (
                  <button
                    type="button"
                    onClick={onOpenPayPalRestModal}
                    className="w-full py-2 px-3 text-[11px] font-mono text-neutral-400 hover:text-neutral-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square text-neutral-500 text-[10px]"></i>
                    Inspect PayPal REST API Sandbox Credentials
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Audit History View */
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                <i className="fa-solid fa-clock-rotate-left text-amber-400"></i>
                Automated Payout Audit Trail
              </h4>
              <p className="text-xs font-mono text-neutral-400 mt-0.5">
                Immutable record of every threshold-triggered PayPal payout batch.
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              {settings.history?.length || 0} Total Logged Events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-[10px] tracking-wider font-mono">
                  <th className="py-3 px-3">Date / Time</th>
                  <th className="py-3 px-3">Batch & Tx ID</th>
                  <th className="py-3 px-3">Recipient PayPal</th>
                  <th className="py-3 px-3">Threshold</th>
                  <th className="py-3 px-3">Amount Disbursed</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono">
                {settings.history && settings.history.length > 0 ? (
                  settings.history.map((item: AutoPayoutLog, idx: number) => (
                    <tr key={`${item.id || 'auto-payout'}-${idx}`} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3.5 px-3 text-neutral-300">
                        <div className="flex items-center gap-1.5">
                          <i className="fa-regular fa-clock text-neutral-500"></i>
                          <span>{item.timestamp}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-amber-400 block font-bold">{item.batchId}</span>
                        <span className="text-[10px] text-neutral-500">{item.txId}</span>
                      </td>
                      <td className="py-3.5 px-3 text-neutral-300">
                        {item.paypalEmail}
                      </td>
                      <td className="py-3.5 px-3 text-neutral-400">
                        ${item.threshold.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-emerald-400">
                        +${item.amount.toFixed(2)} USD
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                          <i className="fa-solid fa-circle-check text-[9px]"></i> SUCCESS
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-500 font-mono">
                      No automated payouts triggered yet. Set your threshold above to arm the automatic engine.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
