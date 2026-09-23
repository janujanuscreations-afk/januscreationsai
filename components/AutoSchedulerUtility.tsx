import React, { useState, useEffect } from 'react';
import { 
  autoSchedulerService, 
  ContentType, 
  AudienceNiche, 
  HourlyEngagementPoint, 
  DayTrendPoint, 
  OptimalSlotRecommendation, 
  ScheduledPost 
} from '../services/autoSchedulerService';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';

interface AutoSchedulerUtilityProps {
  isOpen?: boolean;
  onClose?: () => void;
  contentType: ContentType;
  mediaTitle?: string;
  mediaUrl?: string;
  caption?: string;
  audioTrack?: string;
  aspectRatio?: string;
  duration?: string;
  onScheduledSuccess?: (queuedPost: ScheduledPost) => void;
  onInstantPublish?: (postData: any) => void;
  isInlineTab?: boolean;
}

export const AutoSchedulerUtility: React.FC<AutoSchedulerUtilityProps> = ({
  isOpen = true,
  onClose,
  contentType = 'reel',
  mediaTitle = 'Untitled Creation',
  mediaUrl = 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
  caption = '',
  audioTrack = 'Creator Bass Drop',
  aspectRatio = '9:16',
  duration = '15s',
  onScheduledSuccess,
  onInstantPublish,
  isInlineTab = false
}) => {
  // State
  const [selectedType, setSelectedType] = useState<ContentType>(contentType);
  const [selectedNiche, setSelectedNiche] = useState<AudienceNiche>('all');
  const [activeTab, setActiveTab] = useState<'recommendations' | 'heatmap' | 'queue'>('recommendations');
  
  // Data
  const [hourlyData, setHourlyData] = useState<HourlyEngagementPoint[]>([]);
  const [dayTrends, setDayTrends] = useState<DayTrendPoint[]>([]);
  const [recommendations, setRecommendations] = useState<OptimalSlotRecommendation[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<OptimalSlotRecommendation | null>(null);
  const [hoveredHour, setHoveredHour] = useState<HourlyEngagementPoint | null>(null);

  // Queue State
  const [queue, setQueue] = useState<ScheduledPost[]>([]);
  const [justQueuedPost, setJustQueuedPost] = useState<ScheduledPost | null>(null);
  const [isQueueing, setIsQueueing] = useState(false);
  const [autoBoost, setAutoBoost] = useState(true);
  const [customTime, setCustomTime] = useState('18:45');

  // Load Data on Type / Niche change
  useEffect(() => {
    setSelectedType(contentType);
  }, [contentType]);

  useEffect(() => {
    const hours = autoSchedulerService.getHourlyEngagementCurve(selectedType, selectedNiche);
    const days = autoSchedulerService.getDayOfWeekTrends(selectedNiche);
    const recs = autoSchedulerService.getOptimalSlotRecommendations(selectedType, selectedNiche);

    setHourlyData(hours);
    setDayTrends(days);
    setRecommendations(recs);
    setSelectedSlot(recs.find(r => r.isTopRecommendation) || recs[0]);
    setQueue(autoSchedulerService.getQueue());
  }, [selectedType, selectedNiche]);

  // Live countdown update interval
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen && !isInlineTab) return null;

  // Handle One-Click Queue
  const handleOneClickQueue = (slotToUse?: OptimalSlotRecommendation) => {
    const targetSlot = slotToUse || selectedSlot;
    if (!targetSlot) return;

    setIsQueueing(true);

    setTimeout(() => {
      const queued = autoSchedulerService.queuePost({
        type: selectedType,
        title: mediaTitle || (selectedType === 'reel' ? 'Viral Reel' : 'Luxury Artwork'),
        caption: caption || 'Created with Janu Studio',
        mediaUrl: mediaUrl,
        audioTrack: audioTrack,
        aspectRatio: aspectRatio,
        duration: duration,
        slot: targetSlot,
        niche: selectedNiche
      });

      setJustQueuedPost(queued);
      setQueue(autoSchedulerService.getQueue());
      setIsQueueing(false);

      // Play Sound & Confetti
      bossAudio.playAutoSchedulerQueue();
      triggerNeonExplosion({
        particleCount: 75,
        origin: { x: 0.5, y: 0.45 },
        intensity: 'grand'
      });

      if (onScheduledSuccess) {
        onScheduledSuccess(queued);
      }
    }, 450);
  };

  const handleCancelPost = (id: string) => {
    autoSchedulerService.cancelQueuedPost(id);
    setQueue(autoSchedulerService.getQueue());
    if (justQueuedPost?.id === id) {
      setJustQueuedPost(null);
    }
  };

  const handlePublishNow = (id: string) => {
    const post = autoSchedulerService.publishQueuedPostNow(id);
    setQueue(autoSchedulerService.getQueue());
    if (post && onInstantPublish) {
      onInstantPublish({
        title: post.title,
        desc: post.caption,
        videoUrl: post.mediaUrl,
        imageUrl: post.mediaUrl,
        author: post.author,
        soundTitle: post.audioTrack || 'Original Sound'
      });
    }
  };

  const contentContainer = (
    <div className="space-y-6">
      {/* Top Banner & Sub-Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#00FFE0]/20 border border-[#00FFE0]/40 text-[#00FFE0] text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,255,224,0.3)]">
              <i className="fa-solid fa-clock-rotate-left animate-spin-slow"></i>
              <span>AI Auto-Scheduler Engine</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-[9px] font-mono">
              HISTORICAL TREND ANALYSIS
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white flex items-center gap-2">
            <span>Optimal Publishing Chrono-Optimizer</span>
          </h3>
          <p className="text-xs text-gray-400 font-mono">
            Analyzes 30-day audience activity curves to maximize first-hour viral velocity.
          </p>
        </div>

        {/* Content Type & Niche Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Reel vs Photo Toggle */}
          <div className="flex items-center p-1 bg-black/60 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setSelectedType('reel')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'reel'
                  ? 'bg-[#C084FC] text-black shadow-[0_0_12px_#C084FC]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-film"></i>
              <span>Reel / Video</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('photo')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'photo'
                  ? 'bg-[#00FFE0] text-black shadow-[0_0_12px_#00FFE0]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-image"></i>
              <span>Photo / Art</span>
            </button>
          </div>

          {/* Niche selector */}
          <select
            value={selectedNiche}
            onChange={(e) => setSelectedNiche(e.target.value as AudienceNiche)}
            className="bg-black/80 border border-white/15 rounded-xl px-3 py-2 text-[10px] font-mono text-gray-300 focus:border-[#00FFE0] outline-none cursor-pointer"
          >
            <option value="all">Global Niche (Cross-Feed)</option>
            <option value="music_beats">Music, Beats & Stems</option>
            <option value="luxury_fashion">Luxury & High Fashion</option>
            <option value="entertainment">Viral Entertainment & Skits</option>
            <option value="cyber_tech">Cyberpunk & 3D Tech</option>
            <option value="gospel_soul">Gospel & Soul Frequency</option>
          </select>
        </div>
      </div>

      {/* Mode Sub-Tabs (Recommendations, Engagement Heatmap, Scheduled Queue) */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'recommendations'
                ? 'bg-white/15 border border-[#00FFE0] text-white shadow-[0_0_15px_rgba(0,255,224,0.25)]'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-wand-magic-sparkles text-[#00FFE0]"></i>
            <span>Optimal Slots ({recommendations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('heatmap')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'heatmap'
                ? 'bg-white/15 border border-[#C084FC] text-white shadow-[0_0_15px_rgba(192,132,252,0.25)]'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-chart-line text-[#C084FC]"></i>
            <span>24h Audience Heatmap</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'queue'
                ? 'bg-white/15 border border-[#FF007F] text-white shadow-[0_0_15px_rgba(255,0,127,0.25)]'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-list-check text-[#FF007F]"></i>
            <span>Live Queue ({queue.length})</span>
          </button>
        </div>

        {/* Global Peak Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Next Golden Peak: {recommendations[0]?.dayName} @ {recommendations[0]?.targetTime}</span>
        </div>
      </div>

      {/* CONFIRMATION BANNER IF JUST QUEUED */}
      {justQueuedPost && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-black to-[#00FFE0]/20 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-in zoom-in-95 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 text-xl shrink-0 shadow-[0_0_15px_rgba(52,211,153,0.4)]">
                <i className="fa-solid fa-bolt-lightning animate-bounce"></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-mono font-black uppercase">
                    Queue Locked
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {justQueuedPost.title}
                  </span>
                </div>
                <p className="text-xs text-emerald-300 font-mono mt-0.5">
                  Scheduled for <strong className="text-white">{justQueuedPost.dayName} at {justQueuedPost.targetTime}</strong> • Expected <span className="text-[#00FFE0] font-bold">+{justQueuedPost.viralLift}% Viral Lift</span>
                </p>
                <span className="text-[10px] font-mono text-gray-400 block mt-0.5">
                  Countdown: <span className="text-white font-bold">{autoSchedulerService.formatCountdown(justQueuedPost.targetTimestamp)}</span> • Auto-disperse enabled across community feed
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold transition-all cursor-pointer"
              >
                View Full Queue
              </button>
              <button
                type="button"
                onClick={() => handlePublishNow(justQueuedPost.id)}
                className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-mono font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                Post Instantly
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: OPTIMAL RECOMMENDATIONS & ONE-CLICK QUEUE */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          {/* HERO #1 OPTIMAL SLOT CARD */}
          {selectedSlot && (
            <div className="p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br from-[#00FFE0]/15 via-zinc-950 to-black border-2 border-[#00FFE0] relative overflow-hidden shadow-[0_0_40px_rgba(0,255,224,0.25)]">
              {/* Background accent */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#00FFE0]/10 rounded-full blur-[100px] pointer-events-none"></div>

              <div className="relative z-10 space-y-6">
                {/* Top status bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#00FFE0] text-black text-[10px] font-mono font-black uppercase tracking-widest shadow-[0_0_15px_#00FFE0]">
                      ★ #1 AI-OPTIMAL POSTING TIME
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-black/60 border border-white/20 text-gray-300 text-[10px] font-mono">
                      {selectedSlot.algorithmBoostTier}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-gray-400">Confidence Score:</span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
                      {selectedSlot.confidenceScore}% ACCURACY
                    </span>
                  </div>
                </div>

                {/* Main Time Display & Impact Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-7 space-y-2">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-3xl sm:text-5xl font-mono font-black text-white tracking-tight">
                        {selectedSlot.targetTime}
                      </span>
                      <span className="text-xl sm:text-2xl font-serif italic text-[#00FFE0] font-bold">
                        ({selectedSlot.dayName}, {selectedSlot.dateFormatted})
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans pt-1">
                      {selectedSlot.reasoning}
                    </p>

                    {/* Algorithmic Projection Pills */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
                        <span className="text-gray-400">Estimated Reach: </span>
                        <span className="text-[#00FFE0] font-bold">{selectedSlot.estimatedReachMultiplier}</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
                        <span className="text-gray-400">Viral Velocity Lift: </span>
                        <span className="text-emerald-400 font-bold">+{selectedSlot.viralLift}%</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
                        <span className="text-gray-400">Audience Concurrency: </span>
                        <span className="text-white font-bold">{selectedSlot.concurrencyScore}%</span>
                      </div>
                    </div>
                  </div>

                  {/* ONE-CLICK QUEUE HERO ACTION */}
                  <div className="lg:col-span-5 p-5 rounded-2xl bg-black/80 border border-[#00FFE0]/40 space-y-4 shadow-xl">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#00FFE0] font-bold block mb-1">
                        One-Click Release Pipeline
                      </span>
                      <h4 className="text-sm font-mono font-bold text-white truncate">
                        {mediaTitle || 'Current Video / Artwork'}
                      </h4>
                      <p className="text-[10px] font-mono text-gray-400 truncate">
                        Format: {selectedType.toUpperCase()} ({aspectRatio}) • {duration}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleOneClickQueue(selectedSlot)}
                        disabled={isQueueing}
                        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#00FFE0] via-[#38BDF8] to-[#C084FC] text-black font-mono text-xs sm:text-sm font-black uppercase tracking-widest hover:scale-[1.03] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(0,255,224,0.4)] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                      >
                        {isQueueing ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin text-base"></i>
                            <span>Locking Chrono Slot...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-bolt-lightning text-base"></i>
                            <span>One-Click Queue ({selectedSlot.targetTime})</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 px-1 pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoBoost}
                            onChange={(e) => setAutoBoost(e.target.checked)}
                            className="accent-[#00FFE0]"
                          />
                          <span>Auto-Boost Discovery</span>
                        </label>
                        <span className="text-emerald-400">Zero Latency Dispatch</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ALTERNATIVE OPTIMAL WINDOWS GRID */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-300 flex items-center gap-2">
                <i className="fa-solid fa-arrows-split-up-and-left text-[#C084FC]"></i>
                <span>Alternative High-Velocity Release Slots</span>
              </span>
              <span className="text-[10px] font-mono text-gray-500">Tap slot to inspect or queue</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recommendations.slice(1).map((rec) => {
                const isCurrent = selectedSlot?.id === rec.id;
                return (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedSlot(rec)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-[#C084FC]/15 border-[#C084FC] shadow-[0_0_20px_rgba(192,132,252,0.25)]'
                        : 'bg-zinc-950/70 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-[9px] font-mono uppercase font-bold">
                          {rec.categoryLabel}
                        </span>
                        <span className="text-emerald-400 font-mono text-xs font-bold">
                          +{rec.viralLift}% Lift
                        </span>
                      </div>

                      <div>
                        <h5 className="text-lg font-mono font-bold text-white">
                          {rec.targetTime}
                        </h5>
                        <p className="text-xs font-serif italic text-gray-300">
                          {rec.dayName} ({rec.dateFormatted})
                        </p>
                      </div>

                      <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 font-sans">
                        {rec.reasoning}
                      </p>
                    </div>

                    <div className="pt-4 mt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-gray-500">
                        {rec.estimatedReachMultiplier}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOneClickQueue(rec);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#C084FC] hover:text-black text-white text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <i className="fa-solid fa-bolt text-[9px]"></i>
                        <span>Queue This</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE 24H AUDIENCE HEATMAP & DAY TRENDS */}
      {activeTab === 'heatmap' && (
        <div className="space-y-6">
          {/* 24H Hourly Visual Curve */}
          <div className="p-6 rounded-2xl bg-zinc-950/90 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00FFE0] font-bold block">
                  30-Day Historical Velocity Curve
                </span>
                <h4 className="text-lg font-mono font-bold text-white">
                  24-Hour Audience Concurrency & Share Index
                </h4>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#00FFE0]"></span>
                  <span>Optimal Surge ({'>'}85%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#C084FC]"></span>
                  <span>Moderate ({'>'}60%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-white/20"></span>
                  <span>Off-Peak ({'<'}60%)</span>
                </div>
              </div>
            </div>

            {/* Visual Heatmap Bar Chart */}
            <div className="h-44 flex items-end gap-1 sm:gap-1.5 pt-4 pb-2 px-1 overflow-x-auto custom-scrollbar">
              {hourlyData.map((point) => {
                const heightPct = Math.max(8, point.engagementScore);
                const isPeak = point.engagementScore >= 85;
                const isModerate = point.engagementScore >= 60 && point.engagementScore < 85;
                const isSelected = selectedSlot?.targetTime24.startsWith(point.hour.toString().padStart(2, '0'));

                return (
                  <div
                    key={point.hour}
                    onMouseEnter={() => setHoveredHour(point)}
                    onMouseLeave={() => setHoveredHour(null)}
                    onClick={() => {
                      // Custom target time selection
                      const targetPeriod = point.hour >= 12 ? 'PM' : 'AM';
                      const dispH = point.hour === 0 ? 12 : point.hour > 12 ? point.hour - 12 : point.hour;
                      const customRec: OptimalSlotRecommendation = {
                        id: `custom-slot-${point.hour}`,
                        categoryLabel: isPeak ? 'PRIMARY GOLDEN PEAK' : 'MIDDAY VELOCITY SURGE',
                        targetDate: new Date().toISOString().substring(0, 10),
                        targetTime: `${dispH}:00 ${targetPeriod} EST`,
                        targetTime24: `${point.hour.toString().padStart(2, '0')}:00`,
                        dayName: 'Today',
                        dateFormatted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        viralLift: Math.round(point.velocityMultiplier * 65),
                        confidenceScore: Math.round(85 + (point.engagementScore / 100) * 12),
                        estimatedReachMultiplier: `${point.velocityMultiplier}x Reach`,
                        projectedViews: `${Math.round(point.activeAudiencePct * 800)} – ${Math.round(point.activeAudiencePct * 1500)} Views`,
                        reasoning: `Historical analysis reveals ${point.activeAudiencePct}% concurrent audience active at ${point.label}. Save/Share velocity index at ${point.saveShareRate}%.`,
                        algorithmBoostTier: isPeak ? 'TIER-1 ULTRA' : 'TIER-1 HIGH',
                        isTopRecommendation: false,
                        concurrencyScore: point.activeAudiencePct
                      };
                      setSelectedSlot(customRec);
                      setActiveTab('recommendations');
                    }}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer min-w-[20px]"
                  >
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-300 relative ${
                        isSelected
                          ? 'bg-gradient-to-t from-[#00FFE0] to-white shadow-[0_0_15px_#00FFE0] scale-105'
                          : isPeak
                          ? 'bg-gradient-to-t from-[#00FFE0]/40 to-[#00FFE0] group-hover:from-[#00FFE0]/60 group-hover:to-white'
                          : isModerate
                          ? 'bg-gradient-to-t from-[#C084FC]/30 to-[#C084FC] group-hover:brightness-125'
                          : 'bg-white/10 group-hover:bg-white/20'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    >
                      {/* Peak pin */}
                      {point.isOptimal && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#00FFE0] text-black text-[9px] flex items-center justify-center font-bold shadow-[0_0_10px_#00FFE0] animate-bounce">
                          ★
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-mono text-gray-500 mt-2 truncate group-hover:text-white">
                      {point.hour % 3 === 0 ? point.label : '•'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Hovered Hour Metric Card */}
            {hoveredHour && (
              <div className="p-3 rounded-xl bg-black/90 border border-[#00FFE0]/50 flex items-center justify-between text-xs font-mono animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="text-[#00FFE0] font-bold text-sm">{hoveredHour.label} EST</span>
                  <span className="text-gray-300">Audience Active: <strong className="text-white">{hoveredHour.activeAudiencePct}%</strong></span>
                  <span className="text-gray-300">Velocity Multiplier: <strong className="text-emerald-400">{hoveredHour.velocityMultiplier}x</strong></span>
                </div>
                <span className="text-[10px] text-[#00FFE0] uppercase font-bold">
                  Click bar to select as target slot →
                </span>
              </div>
            )}
          </div>

          {/* Day of Week Benchmark Comparison Grid */}
          <div className="p-6 rounded-2xl bg-zinc-950/90 border border-white/10 space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C084FC] font-bold block">
              Day-Of-Week Format Benchmarks
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
              {dayTrends.map((d) => (
                <div 
                  key={d.day}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    d.isBestDayForReels && selectedType === 'reel'
                      ? 'bg-[#C084FC]/20 border-[#C084FC] shadow-[0_0_15px_rgba(192,132,252,0.3)]'
                      : d.isBestDayForPhotos && selectedType === 'photo'
                      ? 'bg-[#00FFE0]/20 border-[#00FFE0] shadow-[0_0_15px_rgba(0,255,224,0.3)]'
                      : 'bg-black/60 border-white/5'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase font-bold text-gray-400 block">{d.shortDay}</span>
                  <span className="text-sm font-mono font-bold text-white block mt-0.5">
                    {selectedType === 'reel' ? d.reelScore : d.photoScore}%
                  </span>
                  <span className="text-[9px] font-mono text-[#00FFE0] truncate block mt-1">
                    {d.peakHourLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEDULED QUEUE MANAGER */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-layer-group text-[#00FFE0]"></i>
              <span>Active Automated Publishing Queue ({queue.length})</span>
            </h4>
            <span className="text-[10px] font-mono text-gray-400">Auto-Disperse Activated</span>
          </div>

          {queue.length === 0 ? (
            <div className="p-8 rounded-2xl bg-black/40 border border-white/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mx-auto text-lg">
                <i className="fa-solid fa-inbox"></i>
              </div>
              <h5 className="text-sm font-mono font-bold text-white">Your Publishing Queue is Empty</h5>
              <p className="text-xs font-mono text-gray-400 max-w-sm mx-auto">
                Use the One-Click Queue button above to automatically schedule your reels and artwork at peak engagement windows.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('recommendations')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00FFE0] to-[#38BDF8] text-black font-mono font-bold text-xs uppercase"
              >
                Schedule Current Creation
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${
                          item.type === 'reel' ? 'bg-[#C084FC]/20 text-[#C084FC]' : 'bg-[#00FFE0]/20 text-[#00FFE0]'
                        }`}>
                          {item.type.toUpperCase()}
                        </span>
                        <h5 className="text-xs font-mono font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                          {item.title}
                        </h5>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400 mt-1">
                        <span>{item.dayName} @ <strong className="text-white">{item.targetTime}</strong></span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">+{item.viralLift}% Lift</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 mt-0.5">
                        <i className="fa-solid fa-hourglass-start text-[#00FFE0]"></i>
                        <span>Countdown: <strong className="text-gray-300">{autoSchedulerService.formatCountdown(item.targetTimestamp)}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handlePublishNow(item.id)}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-emerald-500 hover:text-black text-gray-200 text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Post Instantly Now"
                    >
                      <i className="fa-solid fa-paper-plane"></i>
                      <span>Post Now</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCancelPost(item.id)}
                      className="w-8 h-8 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 flex items-center justify-center text-xs transition-colors cursor-pointer"
                      title="Remove from Queue"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // If rendered as inline editor tab
  if (isInlineTab) {
    return (
      <div className="p-6 rounded-3xl bg-zinc-950/80 border border-white/10 space-y-6">
        {contentContainer}
      </div>
    );
  }

  // Render as Overlay Modal
  return (
    <div className="fixed inset-0 z-[130] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto selection:bg-[#00FFE0]">
      <div 
        className="max-w-4xl w-full glass rounded-[2.5rem] border border-[#00FFE0]/30 p-6 sm:p-8 relative overflow-hidden bg-black/95 shadow-[0_20px_70px_rgba(0,0,0,0.9)] my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#00FFE0] via-[#C084FC] to-[#FF007F]"></div>

        {/* Modal Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-white/10 cursor-pointer z-20"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}

        {contentContainer}
      </div>
    </div>
  );
};

export default AutoSchedulerUtility;
