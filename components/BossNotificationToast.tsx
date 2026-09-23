import React, { useState } from 'react';
import { BossNotification, BossNotificationType } from '../types';
import { useBossNotifications } from '../context/BossNotificationContext';
import { revenueMilestoneService } from '../services/revenueMilestoneService';

interface BossNotificationToastProps {
  onNavigateToTab?: (tab: string) => void;
  onOpenBossModal?: () => void;
  onOpenFounderVault?: () => void;
}

export const BossNotificationToast: React.FC<BossNotificationToastProps> = ({
  onNavigateToTab,
  onOpenBossModal,
  onOpenFounderVault
}) => {
  const {
    notifications,
    removeNotification,
    soundEnabled,
    setSoundEnabled,
    simulateAlert
  } = useBossNotifications();

  const [showSimControls, setShowSimControls] = useState(false);

  const handleActionClick = (notif: BossNotification) => {
    if (notif.onAction) {
      notif.onAction();
    } else if (notif.type === 'revenue_milestone') {
      if (onOpenFounderVault) {
        onOpenFounderVault();
      } else if (onOpenBossModal) {
        onOpenBossModal();
      }
    } else if (notif.type === 'tip' && onOpenBossModal) {
      onOpenBossModal();
    } else if (notif.type === 'rank_up' && onNavigateToTab) {
      onNavigateToTab('leaderboard');
    } else if (notif.type === 'contest_win' && onNavigateToTab) {
      onNavigateToTab('contests');
    }
    removeNotification(notif.id);
  };

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-3 max-w-[400px] w-[calc(100vw-2rem)] pointer-events-none">
      {/* Top Floating Mini Simulator / Sound Bar */}
      <div className="self-end pointer-events-auto flex items-center gap-2 mb-1">
        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all border flex items-center gap-1.5 backdrop-blur-xl ${
            soundEnabled
              ? 'bg-[#00F5D4]/10 border-[#00F5D4]/40 text-[#00F5D4] shadow-[0_0_10px_rgba(0,245,212,0.2)]'
              : 'bg-black/60 border-white/10 text-gray-400 hover:text-white'
          }`}
          title={soundEnabled ? 'Boss Chimes Active' : 'Boss Chimes Muted'}
        >
          <i className={`fa-solid ${soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'} text-[10px]`}></i>
          <span className="hidden sm:inline">{soundEnabled ? 'Chimes ON' : 'Muted'}</span>
        </button>

        {/* Quick Simulator Toggle Button */}
        <button
          onClick={() => setShowSimControls(!showSimControls)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all border flex items-center gap-1.5 backdrop-blur-xl ${
            showSimControls
              ? 'bg-[#FF007F]/20 border-[#FF007F] text-white shadow-[0_0_12px_rgba(255,0,127,0.3)]'
              : 'bg-black/60 border-white/15 text-gray-300 hover:border-[#00F5D4]/50 hover:text-white'
          }`}
          title="Toggle Boss Alert Simulator"
        >
          <i className="fa-solid fa-bolt text-[#00F5D4] text-[9px] animate-pulse"></i>
          <span>Alert Sim</span>
          <i className={`fa-solid fa-chevron-down text-[8px] transform transition-transform ${showSimControls ? 'rotate-180' : ''}`}></i>
        </button>
      </div>

      {/* Simulator Control Drawer */}
      {showSimControls && (
        <div className="pointer-events-auto p-3 rounded-2xl bg-black/95 backdrop-blur-2xl border border-[#00F5D4]/40 shadow-[0_0_30px_rgba(0,245,212,0.25)] space-y-2 mb-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00F5D4] flex items-center gap-1.5">
              <i className="fa-solid fa-tower-broadcast"></i> Test Boss Alert Engine
            </span>
            <span className="text-[9px] font-mono text-gray-400">Live WebAudio</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button
              onClick={() => simulateAlert('tip')}
              className="px-2 py-1.5 rounded-xl bg-[#00FFE0]/10 hover:bg-[#00FFE0]/25 border border-[#00FFE0]/30 text-[#00FFE0] text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1 hover:scale-105"
            >
              <i className="fa-solid fa-coins text-xs"></i>
              <span>Tip</span>
            </button>
            <button
              onClick={() => simulateAlert('rank_up')}
              className="px-2 py-1.5 rounded-xl bg-[#E056FD]/10 hover:bg-[#E056FD]/25 border border-[#E056FD]/30 text-[#E056FD] text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1 hover:scale-105"
            >
              <i className="fa-solid fa-crown text-xs"></i>
              <span>Rank</span>
            </button>
            <button
              onClick={() => simulateAlert('contest_win')}
              className="px-2 py-1.5 rounded-xl bg-[#FF007F]/10 hover:bg-[#FF007F]/25 border border-[#FF007F]/30 text-[#FF007F] text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1 hover:scale-105"
            >
              <i className="fa-solid fa-trophy text-xs"></i>
              <span>Win</span>
            </button>
            <button
              onClick={() => revenueMilestoneService.simulateMilestoneAlert()}
              className="px-2 py-1.5 rounded-xl bg-gradient-to-r from-[#00FFE0]/20 to-[#FF007F]/20 hover:from-[#00FFE0]/35 hover:to-[#FF007F]/35 border border-[#00FFE0]/50 text-white text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1 hover:scale-105"
            >
              <i className="fa-solid fa-gem text-xs text-[#00FFE0] animate-pulse"></i>
              <span>Milestone</span>
            </button>
          </div>
        </div>
      )}

      {/* Notifications Toast Stack */}
      <div className="flex flex-col gap-3">
        {notifications.map((notif) => {
          // Dynamic theme configuration based on type
          const isMilestone = notif.type === 'revenue_milestone';
          const isTip = notif.type === 'tip';
          const isRank = notif.type === 'rank_up';
          const isContest = notif.type === 'contest_win';

          const borderColor = isMilestone
            ? 'border-[#00FFE0] shadow-[0_0_40px_rgba(0,255,224,0.45)]'
            : isTip
            ? 'border-[#00FFE0]/60 shadow-[0_0_35px_rgba(0,255,224,0.35)]'
            : isRank
            ? 'border-[#E056FD]/60 shadow-[0_0_35px_rgba(224,86,253,0.35)]'
            : 'border-[#FF007F]/60 shadow-[0_0_35px_rgba(255,0,127,0.35)]';

          const iconBg = isMilestone
            ? 'from-[#00FFE0]/40 via-[#E056FD]/30 to-[#FF007F]/40 text-[#00FFE0] border-[#00FFE0]/60'
            : isTip
            ? 'from-[#00FFE0]/30 to-[#00FFE0]/10 text-[#00FFE0] border-[#00FFE0]/50'
            : isRank
            ? 'from-[#E056FD]/30 to-[#FFB800]/20 text-[#FFB800] border-[#E056FD]/50'
            : 'from-[#FF007F]/30 to-[#FF007F]/10 text-[#FF007F] border-[#FF007F]/50';

          const iconClass = isMilestone
            ? 'fa-gem'
            : isTip
            ? 'fa-coins'
            : isRank
            ? 'fa-crown'
            : 'fa-trophy-star';

          const progressGradient = isMilestone
            ? 'from-[#00FFE0] via-[#E056FD] to-[#FF007F]'
            : isTip
            ? 'from-[#00FFE0] to-[#38BDF8]'
            : isRank
            ? 'from-[#E056FD] to-[#FFB800]'
            : 'from-[#FF007F] to-[#E056FD]';

          return (
            <div
              key={notif.id}
              className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-black/95 backdrop-blur-2xl border ${borderColor} p-4 text-white transition-all transform animate-in slide-in-from-right duration-300 hover:scale-[1.02]`}
            >
              {/* Background Atmospheric Glow */}
              <div
                className={`absolute -top-10 -right-10 w-28 h-28 rounded-full blur-[40px] opacity-35 pointer-events-none ${
                  isMilestone
                    ? 'bg-[#00FFE0]'
                    : isTip
                    ? 'bg-[#00FFE0]'
                    : isRank
                    ? 'bg-[#E056FD]'
                    : 'bg-[#FF007F]'
                }`}
              ></div>

              {/* Toast Header */}
              <div className="flex items-start justify-between gap-3 mb-2 relative z-10">
                <div className="flex items-center gap-3">
                  {/* Glowing Icon Badge */}
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconBg} border flex items-center justify-center shrink-0 shadow-inner`}
                  >
                    <i className={`fa-solid ${iconClass} text-sm animate-bounce`}></i>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
                          isMilestone
                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#00FFE0] via-[#E056FD] to-[#FF007F]'
                            : isTip
                            ? 'text-[#00FFE0]'
                            : isRank
                            ? 'text-[#E056FD]'
                            : 'text-[#FF007F]'
                        }`}
                      >
                        {isMilestone
                          ? '🌟 REVENUE MILESTONE'
                          : isTip
                          ? 'Creator Tip Inflow'
                          : isRank
                          ? 'Leaderboard Rank-Up'
                          : 'Contest Victory'}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
                      <span className="text-[9px] font-mono text-gray-400">FOUNDER ALERT</span>
                    </div>
                    <h4 className="text-sm font-serif font-black italic text-white leading-tight">
                      {notif.title}
                    </h4>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => removeNotification(notif.id)}
                  className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <i className="fa-solid fa-xmark text-[10px]"></i>
                </button>
              </div>

              {/* Toast Body */}
              <div className="space-y-2 relative z-10 pl-12 pr-1">
                <p className="text-xs text-gray-300 font-light leading-relaxed">
                  {notif.message}
                </p>

                {/* Revenue Milestone Breakdown */}
                {isMilestone && notif.milestoneInfo && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-[#00FFE0]/30 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <i className="fa-brands fa-paypal text-[#00FFE0]"></i>
                      <span>Threshold: <strong className="text-white">${notif.milestoneInfo.threshold.toLocaleString()}</strong></span>
                    </div>
                    <div className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#00FFE0]/20 to-[#FF007F]/20 border border-[#00FFE0]/40 text-[#00FFE0] font-bold">
                      Surpassed: ${notif.milestoneInfo.totalAggregated.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                    </div>
                  </div>
                )}

                {/* Tip Metrics Breakdown */}
                {isTip && notif.amount && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/10 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <i className="fa-solid fa-wallet text-[#00FFE0]"></i>
                      <span>Gross Tip: <strong className="text-white">${notif.amount.toFixed(2)}</strong></span>
                    </div>
                    <div className="px-2 py-0.5 rounded-md bg-[#00FFE0]/15 border border-[#00FFE0]/30 text-[#00FFE0] font-bold">
                      +${(notif.platformCut || notif.amount * 0.15).toFixed(2)} (15% Boss Cut)
                    </div>
                  </div>
                )}

                {/* Rank Transition Badge */}
                {isRank && notif.rankInfo && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/10 text-[10px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Previous: #{notif.rankInfo.oldRank}</span>
                      <i className="fa-solid fa-arrow-right text-[#E056FD] text-[8px]"></i>
                      <span className="text-[#FFB800] font-bold">New Rank: #{notif.rankInfo.newRank}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-[#E056FD]/15 border border-[#E056FD]/30 text-[#E056FD] font-bold">
                      {notif.rankInfo.tier}
                    </span>
                  </div>
                )}

                {/* Contest Prize Badge */}
                {isContest && notif.contestInfo && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/10 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <i className="fa-solid fa-award text-[#FF007F]"></i>
                      <span>1st Place Champion</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-[#FF007F]/15 border border-[#FF007F]/30 text-[#FF007F] font-bold">
                      +${notif.contestInfo.prize.toLocaleString()} USD
                    </span>
                  </div>
                )}

                {/* Action CTA Button */}
                {notif.actionLabel && (
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      onClick={() => handleActionClick(notif)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md hover:scale-105 cursor-pointer ${
                        isMilestone
                          ? 'bg-gradient-to-r from-[#00FFE0] to-[#E056FD] text-black font-black hover:bg-white'
                          : isTip
                          ? 'bg-[#00FFE0] text-black hover:bg-white'
                          : isRank
                          ? 'bg-[#E056FD] text-black hover:bg-white'
                          : 'bg-[#FF007F] text-white hover:bg-white hover:text-black'
                      }`}
                    >
                      <span>{notif.actionLabel}</span>
                      <i className="fa-solid fa-arrow-right text-[8px]"></i>
                    </button>
                  </div>
                )}
              </div>

              {/* Dynamic Auto-Dismiss Countdown Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${progressGradient} origin-left`}
                  style={{
                    animation: `toastCountdown ${notif.duration || 5500}ms linear forwards`
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BossNotificationToast;
