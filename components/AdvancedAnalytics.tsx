import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart
} from 'recharts';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';
import PredictiveRevenueForecasting from './PredictiveRevenueForecasting';
import PredictiveRevenueGrowth from './PredictiveRevenueGrowth';
import RealtimeRevenueVelocityChart from './RealtimeRevenueVelocityChart';

export interface AdvancedAnalyticsProps {
  walletBalance?: number;
  onNavigateToStudio?: (tool: 'reel' | 'photo' | 'music') => void;
  onOpenQuickActions?: () => void;
}

// Timeframe options
type Timeframe = '24h' | '7d' | '30d' | '90d' | 'all';
type ContentType = 'all' | 'reels' | 'live' | 'music' | 'photos';

// Mock granular video retention datasets
const RETENTION_DATASETS: Record<string, {
  title: string;
  type: string;
  duration: string;
  views: number;
  avd: string;
  apv: string;
  hookRate: string;
  loopRate: string;
  curve: {
    second: number;
    pctTime: number;
    retention: number;
    benchmark: number;
    event?: string;
    sentiment?: string;
    dropoffReason?: string;
  }[];
}> = {
  'reel-1': {
    title: 'Neon Cyber Drift 2026',
    type: '9:16 Reel Video',
    duration: '24s',
    views: 84200,
    avd: '21.2s',
    apv: '88.3%',
    hookRate: '94.2%',
    loopRate: '2.8x',
    curve: [
      { second: 0, pctTime: 0, retention: 100, benchmark: 100, event: 'Start / Kinetic Neon Title', sentiment: 'High Excitement' },
      { second: 2, pctTime: 8, retention: 96, benchmark: 88, event: 'Hook Delivered', sentiment: 'Peak Attention' },
      { second: 4, pctTime: 16, retention: 93, benchmark: 76, event: 'Bass Transition', sentiment: 'Engaged' },
      { second: 6, pctTime: 25, retention: 91, benchmark: 68, event: 'Speed Acceleration Cut', sentiment: 'High Pace' },
      { second: 8, pctTime: 33, retention: 89, benchmark: 62 },
      { second: 10, pctTime: 41, retention: 88, benchmark: 58, event: 'Viral Strobe Flash', sentiment: 'Spike In Loops' },
      { second: 12, pctTime: 50, retention: 94, benchmark: 54, event: 'Rewind Spike (+6% Loops)', sentiment: 'Viral Climax' },
      { second: 14, pctTime: 58, retention: 90, benchmark: 50 },
      { second: 16, pctTime: 66, retention: 87, benchmark: 46 },
      { second: 18, pctTime: 75, retention: 85, benchmark: 43, event: 'Lore Reveal', sentiment: 'Deep Focus' },
      { second: 20, pctTime: 83, retention: 82, benchmark: 39, dropoffReason: 'Pacing stabilized before climax' },
      { second: 22, pctTime: 91, retention: 79, benchmark: 35, event: 'Call to Creator Action', sentiment: 'Tip Conversion' },
      { second: 24, pctTime: 100, retention: 76, benchmark: 32, event: 'Seamless Infinite Loop Point', sentiment: 'Replay Trigger' }
    ]
  },
  'reel-2': {
    title: 'Midnight Heavy Metal Flame Stage',
    type: '9:16 Reel Video',
    duration: '18s',
    views: 62400,
    avd: '15.8s',
    apv: '87.7%',
    hookRate: '91.8%',
    loopRate: '2.5x',
    curve: [
      { second: 0, pctTime: 0, retention: 100, benchmark: 100, event: 'Pyrotechnic Explosion', sentiment: 'Shock & Awe' },
      { second: 2, pctTime: 11, retention: 95, benchmark: 85 },
      { second: 4, pctTime: 22, retention: 92, benchmark: 73, event: 'Guitar Solo Drop', sentiment: 'Hyper Kinetic' },
      { second: 6, pctTime: 33, retention: 89, benchmark: 65 },
      { second: 8, pctTime: 44, retention: 88, benchmark: 59, event: 'Crowd Dive Drone Angle', sentiment: 'High Immersion' },
      { second: 10, pctTime: 55, retention: 92, benchmark: 52, event: 'Loop Rewind Moment', sentiment: 'Spike' },
      { second: 12, pctTime: 66, retention: 86, benchmark: 47 },
      { second: 14, pctTime: 77, retention: 83, benchmark: 42 },
      { second: 16, pctTime: 88, retention: 80, benchmark: 38, event: 'Outro Fireworks', sentiment: 'Conversion' },
      { second: 18, pctTime: 100, retention: 74, benchmark: 33, event: 'Loop Trigger', sentiment: 'Replay' }
    ]
  },
  'live-1': {
    title: 'Executive Boss Live Stream #14',
    type: 'Live Broadcast',
    duration: '45m',
    views: 31900,
    avd: '26.4m',
    apv: '58.6%',
    hookRate: '88.4%',
    loopRate: '1.2x',
    curve: [
      { second: 0, pctTime: 0, retention: 100, benchmark: 100, event: 'Broadcast Warmup', sentiment: 'Lobby Inflow' },
      { second: 5, pctTime: 11, retention: 85, benchmark: 72, event: 'Host Intro & Bounty Reveal', sentiment: 'Excitement' },
      { second: 10, pctTime: 22, retention: 82, benchmark: 60 },
      { second: 15, pctTime: 33, retention: 86, benchmark: 55, event: 'Live Battle Arena Tournament', sentiment: 'Peak Audience' },
      { second: 20, pctTime: 44, retention: 89, benchmark: 52, event: 'Superchat Tipping Storm', sentiment: 'High Engagement' },
      { second: 25, pctTime: 55, retention: 84, benchmark: 48 },
      { second: 30, pctTime: 66, retention: 79, benchmark: 42, event: 'AI Co-Pilot Live Remix', sentiment: 'Curiosity' },
      { second: 35, pctTime: 77, retention: 74, benchmark: 38 },
      { second: 40, pctTime: 88, retention: 71, benchmark: 34, event: 'Winner Payouts Dispatched', sentiment: 'Grand Finale' },
      { second: 45, pctTime: 100, retention: 65, benchmark: 28, event: 'Raid to Fellow Creator', sentiment: 'Community Transfer' }
    ]
  },
  'music-1': {
    title: 'Divine Gospel Soul Symphony',
    type: 'Audio Stem / Music',
    duration: '32s',
    views: 48700,
    avd: '29.1s',
    apv: '90.9%',
    hookRate: '96.5%',
    loopRate: '3.1x',
    curve: [
      { second: 0, pctTime: 0, retention: 100, benchmark: 100, event: 'Acapella Harmony', sentiment: 'Ethereal Soul' },
      { second: 4, pctTime: 12, retention: 98, benchmark: 86 },
      { second: 8, pctTime: 25, retention: 95, benchmark: 75, event: 'Sub-Bass Drop & Organ', sentiment: 'Chills / Peak' },
      { second: 12, pctTime: 37, retention: 94, benchmark: 66 },
      { second: 16, pctTime: 50, retention: 93, benchmark: 60, event: 'Choral Crescendo', sentiment: 'Emotional Peak' },
      { second: 20, pctTime: 62, retention: 97, benchmark: 55, event: 'Instant Rewind Surge', sentiment: 'Audio Replay' },
      { second: 24, pctTime: 75, retention: 92, benchmark: 49 },
      { second: 28, pctTime: 87, retention: 89, benchmark: 44, event: 'Stem Equalizer Solo', sentiment: 'Production Craft' },
      { second: 32, pctTime: 100, retention: 84, benchmark: 38, event: 'Harmonic Loop Bridge', sentiment: 'Perpetual Loop' }
    ]
  }
};

// Traffic sources dataset
const TRAFFIC_SOURCES_DATA = [
  { name: 'For You Feed (AI Algorithm)', value: 43.5, color: '#00F5D4', impressions: 142800, convRate: '4.8%', icon: 'fa-compass' },
  { name: 'Creator Showcase & Profile', value: 24.2, color: '#C084FC', impressions: 79400, convRate: '8.6%', icon: 'fa-id-card-clip' },
  { name: 'External (IG, X, TikTok, YouTube)', value: 16.8, color: '#FF007F', impressions: 55100, convRate: '6.2%', icon: 'fa-share-nodes' },
  { name: 'Leaderboard & Contests Arena', value: 9.5, color: '#FCD34D', impressions: 31200, convRate: '9.4%', icon: 'fa-trophy' },
  { name: 'AI Autonomous Ops Sentinel', value: 6.0, color: '#818CF8', impressions: 19700, convRate: '5.1%', icon: 'fa-microchip' }
];

// External referrers breakdown
const EXTERNAL_REFERRALS = [
  { platform: 'Instagram Stories & Bio', visits: 24300, share: '44.1%', tips: '$1,420.00', growth: '+28%', color: '#FF007F' },
  { platform: 'X / Twitter Threads', visits: 14800, share: '26.8%', tips: '$980.50', growth: '+19%', color: '#38BDF8' },
  { platform: 'TikTok Viral Sounds', visits: 8900, share: '16.1%', tips: '$640.00', growth: '+45%', color: '#00F5D4' },
  { platform: 'YouTube Shorts Linkouts', visits: 4800, share: '8.7%', tips: '$350.00', growth: '+12%', color: '#EF4444' },
  { platform: 'Sintra Creator Portal', visits: 2300, share: '4.3%', tips: '$450.00', growth: '+31%', color: '#C084FC' }
];

// Hourly retention / traffic timeline data
const HOURLY_PERFORMANCE = [
  { time: '00:00', views: 1840, retentionAvg: 82, tipInflow: 45, newSubs: 2 },
  { time: '03:00', views: 980, retentionAvg: 80, tipInflow: 20, newSubs: 1 },
  { time: '06:00', views: 2400, retentionAvg: 84, tipInflow: 85, newSubs: 4 },
  { time: '09:00', views: 6100, retentionAvg: 88, tipInflow: 210, newSubs: 9 },
  { time: '12:00', views: 8900, retentionAvg: 89, tipInflow: 340, newSubs: 16 },
  { time: '15:00', views: 11200, retentionAvg: 87, tipInflow: 490, newSubs: 22 },
  { time: '18:00', views: 15400, retentionAvg: 92, tipInflow: 780, newSubs: 35 },
  { time: '21:00', views: 13800, retentionAvg: 91, tipInflow: 640, newSubs: 28 }
];

// Regional audience demographics
const REGIONAL_METRICS = [
  { country: 'United States', flag: '🇺🇸', share: 44.5, viewers: 145900, avgDuration: '24.2s', avgTip: '$18.40', color: '#00F5D4' },
  { country: 'United Kingdom', flag: '🇬🇧', share: 18.2, viewers: 59700, avgDuration: '22.8s', avgTip: '$14.90', color: '#C084FC' },
  { country: 'Japan & East Asia', flag: '🇯🇵', share: 14.8, viewers: 48500, avgDuration: '26.1s', avgTip: '$22.50', color: '#FF007F' },
  { country: 'Germany & EU', flag: '🇩🇪', share: 12.5, viewers: 41000, avgDuration: '21.4s', avgTip: '$16.20', color: '#FCD34D' },
  { country: 'Brazil & LATAM', flag: '🇧🇷', share: 10.0, viewers: 32800, avgDuration: '23.6s', avgTip: '$11.80', color: '#818CF8' }
];

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  walletBalance = 3840.50,
  onNavigateToStudio,
  onOpenQuickActions
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('7d');
  const [contentType, setContentType] = useState<ContentType>('all');
  const [selectedPieceId, setSelectedPieceId] = useState<string>('reel-1');
  const [activeCurveTab, setActiveCurveTab] = useState<'retention' | 'dropoff' | 'events'>('retention');
  const [scrubberIndex, setScrubberIndex] = useState<number>(0);
  const [isSimulatingTraffic, setIsSimulatingTraffic] = useState(false);
  const [surgeMetric, setSurgeMetric] = useState<number>(0);
  const [aiReportGenerated, setAiReportGenerated] = useState(false);
  const [toastAlert, setToastAlert] = useState<string | null>(null);
  const [activeAnalyticsSection, setActiveAnalyticsSection] = useState<'all' | 'velocity' | 'forecast' | 'predictive-growth' | 'retention' | 'traffic' | 'hourly' | 'geo'>('all');

  const selectedPiece = useMemo(() => {
    return RETENTION_DATASETS[selectedPieceId] || RETENTION_DATASETS['reel-1'];
  }, [selectedPieceId]);

  const activePoint = useMemo(() => {
    return selectedPiece.curve[scrubberIndex] || selectedPiece.curve[0];
  }, [selectedPiece, scrubberIndex]);

  const showToast = (msg: string) => {
    setToastAlert(msg);
    setTimeout(() => setToastAlert(null), 3500);
  };

  // Simulate viral surge traffic in real-time
  const handleSimulateSurge = () => {
    setIsSimulatingTraffic(true);
    bossAudio.playTipChime(150);
    bossAudio.playVaultUnlock();

    triggerNeonExplosion({
      particleCount: 75,
      origin: { x: 0.5, y: 0.4 },
      intensity: 'grand'
    });

    let count = 0;
    const interval = setInterval(() => {
      count += 120;
      setSurgeMetric(prev => prev + 120);
      if (count >= 1200) {
        clearInterval(interval);
        setIsSimulatingTraffic(false);
        showToast('🔥 Live Traffic Surge Simulated! +1,200 Viewers & +$180 in Micro-Tips');
      }
    }, 100);
  };

  // Generate instant AI Creator Analytics Report
  const handleGenerateAIReport = () => {
    bossAudio.playBiometricScan();
    setAiReportGenerated(true);

    triggerNeonExplosion({
      particleCount: 50,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'medium'
    });

    showToast('✓ AI Intelligence Analytics Report compiled & ready for review!');
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Toast Notification */}
      {toastAlert && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-black/90 border border-[#00F5D4] text-[#00F5D4] px-6 py-3 rounded-full text-xs font-mono font-bold shadow-[0_0_30px_rgba(0,245,212,0.4)] flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <i className="fa-solid fa-chart-line text-[#00F5D4] text-sm animate-pulse"></i>
          <span>{toastAlert}</span>
        </div>
      )}

      {/* ================= EXECUTIVE ANALYTICS HEADER & CONTROLS ================= */}
      <div className="glass p-6 sm:p-8 rounded-[2.5rem] border border-[#00F5D4]/30 bg-gradient-to-r from-zinc-950 via-black to-zinc-950 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
        
        {/* Glow Ambient Blobs */}
        <div className="absolute top-0 right-1/4 w-96 h-48 bg-[#00F5D4]/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-48 bg-[#C084FC]/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-[#00F5D4]/15 border border-[#00F5D4]/40 text-[#00F5D4] text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,245,212,0.2)]">
                <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-ping"></span>
                <span>Creator Analytics Engine</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[10px] font-mono">
                Real-Time Granular Telemetry
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-serif font-black italic text-white tracking-tight">
              Audience Retention & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F]">Traffic Intelligence</span>
            </h2>

            <p className="text-xs sm:text-sm font-mono text-gray-400 max-w-2xl leading-relaxed">
              Granular frame-by-frame audience engagement drops, multi-channel acquisition funnels, and creator monetization conversions.
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            
            {/* Timeframe Selector */}
            <div className="flex items-center bg-black/80 border border-white/15 p-1 rounded-2xl">
              {(['24h', '7d', '30d', '90d', 'all'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    setTimeframe(tf);
                    bossAudio.playSubtlePing();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    timeframe === tf
                      ? 'bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Live Traffic Simulation Button */}
            <button
              onClick={handleSimulateSurge}
              disabled={isSimulatingTraffic}
              className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-[#FF007F]/40 hover:border-[#FF007F] text-white hover:text-[#FF007F] text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg hover:scale-105"
            >
              <i className={`fa-solid fa-bolt text-[#FF007F] ${isSimulatingTraffic ? 'animate-spin' : ''}`}></i>
              <span>{isSimulatingTraffic ? 'Injecting Surge...' : 'Simulate Surge'}</span>
            </button>

            {/* AI Report Generator */}
            <button
              onClick={handleGenerateAIReport}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F] text-black font-mono font-black text-xs uppercase tracking-wider transition-all hover:scale-105 shadow-[0_0_25px_rgba(0,245,212,0.35)] cursor-pointer flex items-center gap-2"
            >
              <i className="fa-solid fa-brain text-xs"></i>
              <span>AI Boss Briefing</span>
            </button>

          </div>
        </div>

        {/* Global Summary KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6 mt-6 border-t border-white/10 relative z-10">
          
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
              Total Impressions
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-mono font-black text-white">
                {(328000 + surgeMetric).toLocaleString()}
              </span>
              <span className="text-[10px] font-mono text-green-400 font-bold">+24.8%</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
              Avg View Duration
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-mono font-black text-[#00F5D4]">
                24.8s
              </span>
              <span className="text-[10px] font-mono text-green-400 font-bold">+18.2%</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
              Avg % Viewed (APV)
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-mono font-black text-[#C084FC]">
                86.4%
              </span>
              <span className="text-[10px] font-mono text-[#00F5D4] font-bold">Top 2%</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
              3s Hook Hold Rate
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-mono font-black text-[#FF007F]">
                92.1%
              </span>
              <span className="text-[10px] font-mono text-green-400 font-bold">+6.4%</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
              Loop / Replay Multiplier
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-mono font-black text-[#FCD34D]">
                2.4x
              </span>
              <span className="text-[10px] font-mono text-green-400 font-bold">Viral Pacing</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
              Monetization Yield
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-mono font-black text-white">
                $11.72
              </span>
              <span className="text-[10px] font-mono text-gray-400 font-bold">/ 1k Views</span>
            </div>
          </div>

        </div>

        {/* Analytics Sub-Module Filter Chips */}
        <div className="flex items-center gap-2 pt-5 mt-5 border-t border-white/10 overflow-x-auto no-scrollbar relative z-10">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-bold mr-1 shrink-0">
            Modules:
          </span>
          {[
            { id: 'all', label: 'All Telemetry', icon: 'fa-cubes' },
            { id: 'velocity', label: 'Revenue Velocity (Recharts 85/15)', icon: 'fa-bolt', highlight: true },
            { id: 'predictive-growth', label: 'Predictive Revenue Growth (D3.js)', icon: 'fa-chart-line' },
            { id: 'forecast', label: 'ML Scenario Simulator', icon: 'fa-sliders' },
            { id: 'retention', label: 'Audience Retention Curve', icon: 'fa-waveform-lines' },
            { id: 'traffic', label: 'Traffic & Funnels', icon: 'fa-compass' },
            { id: 'hourly', label: 'Hourly Dynamics', icon: 'fa-clock' },
            { id: 'geo', label: 'Global Audience Geo', icon: 'fa-globe' }
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => {
                setActiveAnalyticsSection(sec.id as any);
                bossAudio.playSubtlePing();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeAnalyticsSection === sec.id
                  ? sec.highlight
                    ? 'bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F] text-black font-black shadow-[0_0_15px_rgba(0,245,212,0.4)]'
                    : 'bg-white/15 border border-white/30 text-white shadow-md'
                  : 'bg-black/40 border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              <i className={`fa-solid ${sec.icon}`}></i>
              <span>{sec.label}</span>
              {sec.highlight && (
                <span className="px-1.5 py-0.2 rounded bg-black/40 text-[9px] font-mono font-black text-[#00F5D4]">
                  LIVE
                </span>
              )}
            </button>
          ))}
        </div>

      </div>

      {/* ================= RECHARTS REAL-TIME REVENUE VELOCITY CHART (85% CREATOR FLOW / 15% JANU CUT) ================= */}
      {(activeAnalyticsSection === 'all' || activeAnalyticsSection === 'velocity') && (
        <RealtimeRevenueVelocityChart
          walletBalance={walletBalance}
          onNavigateToStudio={onNavigateToStudio}
          onOpenQuickActions={onOpenQuickActions}
          onToast={showToast}
        />
      )}

      {/* ================= PREDICTIVE REVENUE GROWTH (D3.JS TIP VELOCITY ENGINE) ================= */}
      {(activeAnalyticsSection === 'all' || activeAnalyticsSection === 'predictive-growth' || activeAnalyticsSection === 'forecast') && (
        <PredictiveRevenueGrowth
          currentWalletBalance={walletBalance}
          initialTipVelocityPerHour={48.50}
          onNavigateToStudio={onNavigateToStudio}
          onOpenQuickActions={onOpenQuickActions}
          onToast={showToast}
        />
      )}

      {/* ================= PREDICTIVE REVENUE FORECASTING MODULE ================= */}
      {(activeAnalyticsSection === 'all' || activeAnalyticsSection === 'forecast') && (
        <PredictiveRevenueForecasting
          currentWalletBalance={walletBalance}
          historicalMonthlyAverage={5161.66}
          onNavigateToStudio={onNavigateToStudio}
          onOpenQuickActions={onOpenQuickActions}
          onToast={showToast}
        />
      )}

      {/* ================= SECTION 1: GRANULAR AUDIENCE RETENTION CURVE ================= */}
      {(activeAnalyticsSection === 'all' || activeAnalyticsSection === 'retention') && (
      <div className="glass p-6 sm:p-8 rounded-[2.5rem] border border-white/10 bg-black/60 space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00F5D4] shadow-[0_0_8px_#00F5D4]"></span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#00F5D4]">
                Granular Audience Retention Curve
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white mt-1">
              Second-by-Second Engagement & Loop Diagnostics
            </h3>
          </div>

          {/* Piece Selector Dropdown / Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {Object.entries(RETENTION_DATASETS).map(([id, data]) => (
              <button
                key={id}
                onClick={() => {
                  setSelectedPieceId(id);
                  setScrubberIndex(0);
                  bossAudio.playSubtlePing();
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  selectedPieceId === id
                    ? 'bg-[#00F5D4]/15 border border-[#00F5D4] text-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.3)]'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <i className="fa-solid fa-play text-[10px]"></i>
                <span>{data.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Highlight Stats of Selected Work */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-zinc-950/80 p-4 rounded-2xl border border-white/10">
          <div>
            <span className="text-[9px] font-mono text-gray-400 uppercase block">Content Type</span>
            <span className="text-xs font-mono font-bold text-white">{selectedPiece.type} ({selectedPiece.duration})</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-gray-400 uppercase block">Total Plays</span>
            <span className="text-xs font-mono font-bold text-white">{selectedPiece.views.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-gray-400 uppercase block">Avg View Duration</span>
            <span className="text-xs font-mono font-bold text-[#00F5D4]">{selectedPiece.avd}</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-gray-400 uppercase block">Completion %</span>
            <span className="text-xs font-mono font-bold text-[#C084FC]">{selectedPiece.apv}</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-gray-400 uppercase block">Rewind Multiplier</span>
            <span className="text-xs font-mono font-bold text-[#FCD34D]">{selectedPiece.loopRate} Loops</span>
          </div>
        </div>

        {/* Interactive Retention Chart */}
        <div className="h-80 w-full relative pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={selectedPiece.curve} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F5D4" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#00F5D4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C084FC" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#C084FC" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="second"
                stroke="#666"
                tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(val) => `${val}s`}
              />
              <YAxis
                stroke="#666"
                tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  border: '1px solid rgba(0,245,212,0.4)',
                  borderRadius: '16px',
                  boxShadow: '0 0 25px rgba(0,0,0,0.8)',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  padding: '12px'
                }}
                formatter={(value: any, name: any) => [
                  `${value}%`,
                  name === 'retention' ? 'Janu Creator Retention' : 'Platform Benchmark'
                ]}
                labelFormatter={(label) => `Timestamp: ${label}s (${Math.round((Number(label) / (selectedPiece.curve[selectedPiece.curve.length - 1].second || 1)) * 100)}% through)`}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontFamily: 'monospace' }}
              />
              <Area
                type="monotone"
                dataKey="retention"
                name="Janu Creator Retention"
                stroke="#00F5D4"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#retentionGradient)"
              />
              <Area
                type="monotone"
                dataKey="benchmark"
                name="Platform Standard Benchmark"
                stroke="#6b7280"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#benchmarkGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Second-by-Second Scrubber & Diagnostic Inspector */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono text-gray-300">
              <i className="fa-solid fa-sliders text-[#00F5D4]"></i>
              <span className="font-bold uppercase tracking-wider">Granular Timeline Scrubber:</span>
              <strong className="text-white">{activePoint.second}s / {selectedPiece.duration}</strong>
            </div>

            <span className="text-[10px] font-mono text-gray-400">
              Hover/drag slider to inspect pacing & audience sentiment
            </span>
          </div>

          {/* Interactive Range Scrubber */}
          <input
            type="range"
            min={0}
            max={selectedPiece.curve.length - 1}
            value={scrubberIndex}
            onChange={(e) => {
              setScrubberIndex(Number(e.target.value));
              bossAudio.playSubtlePing();
            }}
            className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#00F5D4]"
          />

          {/* Diagnostic Inspector Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10">
              <span className="text-[9px] font-mono text-gray-400 uppercase block font-bold">Retained Audience</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-mono font-black text-[#00F5D4]">{activePoint.retention}%</span>
                <span className="text-xs font-mono text-green-400 font-bold">
                  +{(activePoint.retention - activePoint.benchmark).toFixed(0)}% vs Avg
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10">
              <span className="text-[9px] font-mono text-gray-400 uppercase block font-bold">Timeline Event & Hook</span>
              <span className="text-xs font-mono font-bold text-white block mt-1">
                {activePoint.event || 'Steady Engagement Transition'}
              </span>
              <span className="text-[10px] font-mono text-[#C084FC]">
                Sentiment: {activePoint.sentiment || 'Continuous Viewing'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10">
              <span className="text-[9px] font-mono text-gray-400 uppercase block font-bold">AI Pacing Optimization</span>
              <span className="text-[11px] font-mono text-gray-300 block mt-1 leading-relaxed">
                {activePoint.dropoffReason 
                  ? `💡 Note: ${activePoint.dropoffReason}` 
                  : '✓ High retention velocity — audio transition perfectly timed with visual cut.'}
              </span>
            </div>

          </div>
        </div>

      </div>
      )}

      {/* ================= SECTION 2: TRAFFIC SOURCES & CONVERSION FUNNELS ================= */}
      {(activeAnalyticsSection === 'all' || activeAnalyticsSection === 'traffic') && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Traffic Channels Donut & Pie Chart */}
        <div className="glass p-6 sm:p-8 rounded-[2.5rem] border border-white/10 bg-black/60 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#C084FC]"></span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#C084FC]">
                Acquisition Channels
              </span>
            </div>
            <h3 className="text-xl font-serif font-black italic text-white">
              Traffic Source Breakdown
            </h3>
            <p className="text-xs font-mono text-gray-400">
              Where viewers discover your reels & live studio
            </p>
          </div>

          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={TRAFFIC_SOURCES_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {TRAFFIC_SOURCES_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090b',
                    border: '1px solid rgba(192,132,252,0.4)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontFamily: 'monospace',
                    fontSize: '11px'
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val}% (${item.payload.impressions.toLocaleString()} views)`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label in Donut */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-[9px] font-mono text-gray-400 uppercase block">Top Source</span>
              <span className="text-lg font-mono font-black text-[#00F5D4]">43.5%</span>
              <span className="text-[8px] font-mono text-gray-400 block">FYP Algorithm</span>
            </div>
          </div>

          {/* Mini Legend List */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            {TRAFFIC_SOURCES_DATA.map((src) => (
              <div key={src.name} className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: src.color }}></span>
                  <span className="text-gray-300 truncate max-w-[160px]">{src.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{src.value}%</span>
                  <span className="text-[10px] text-gray-500">({src.convRate} conv)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* External Referrers & Platform Linkouts */}
        <div className="glass p-6 sm:p-8 rounded-[2.5rem] border border-white/10 bg-black/60 flex flex-col justify-between space-y-4 lg:col-span-2">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#FF007F]"></span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF007F]">
                  Multi-Platform Virality
                </span>
              </div>
              <span className="text-[10px] font-mono text-green-400 font-bold bg-green-500/10 px-2.5 py-0.5 rounded-full border border-green-500/20">
                +34.2% External Lift
              </span>
            </div>
            <h3 className="text-xl font-serif font-black italic text-white">
              External Referrers & Direct Conversions
            </h3>
            <p className="text-xs font-mono text-gray-400">
              Traffic driven into Janu’s Creations from social link drops
            </p>
          </div>

          {/* External Referral Cards */}
          <div className="space-y-3">
            {EXTERNAL_REFERRALS.map((ref) => (
              <div
                key={ref.platform}
                className="p-4 rounded-2xl bg-zinc-950/80 border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-inner"
                    style={{ backgroundColor: `${ref.color}15`, color: ref.color, border: `1px solid ${ref.color}40` }}
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white">{ref.platform}</h4>
                    <span className="text-[10px] font-mono text-gray-400">
                      {ref.visits.toLocaleString()} Visitors • {ref.share} Share
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-[#00F5D4] block">{ref.tips}</span>
                  <span className="text-[10px] font-mono text-green-400">{ref.growth} vs prev</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick External Share Push Action */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#00F5D4]/10 via-black to-[#C084FC]/10 border border-[#00F5D4]/30 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-white block">
                Boost External Traffic
              </span>
              <p className="text-[10px] font-mono text-gray-400">
                Auto-generate smart tracking links with UTM tags for your Showcase.
              </p>
            </div>

            <button
              onClick={() => {
                bossAudio.playSubtlePing();
                triggerNeonExplosion({ particleCount: 35, origin: { x: 0.8, y: 0.8 } });
                showToast('📋 Copied UTM-Tagged Smart Link to Clipboard!');
              }}
              className="px-4 py-2 rounded-xl bg-[#00F5D4] hover:bg-[#00F5D4]/80 text-black font-mono font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shrink-0"
            >
              Copy UTM Link
            </button>
          </div>
        </div>

      </div>
      )}

      {/* ================= SECTION 3: 24-HOUR HOURLY TRAFFIC & RETENTION HEATMAP ================= */}
      {(activeAnalyticsSection === 'all' || activeAnalyticsSection === 'hourly') && (
      <div className="glass p-6 sm:p-8 rounded-[2.5rem] border border-white/10 bg-black/60 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#818CF8]"></span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#818CF8]">
                Hourly Activity Dynamics
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white mt-1">
              Viewer Velocity & Peak Conversion Windows
            </h3>
          </div>

          <span className="text-xs font-mono text-gray-400">
            Optimal broadcast window: <strong className="text-[#00F5D4]">18:00 – 22:00 EST</strong>
          </span>
        </div>

        {/* Hourly Dual Axis Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={HOURLY_PERFORMANCE} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="time" stroke="#666" tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis
                yAxisId="left"
                stroke="#00F5D4"
                tick={{ fill: '#00F5D4', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#FF007F"
                tick={{ fill: '#FF007F', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  border: '1px solid rgba(0,245,212,0.4)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '11px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <Bar yAxisId="left" dataKey="views" name="Hourly Active Viewers" fill="#00F5D4" radius={[6, 6, 0, 0]} opacity={0.8} />
              <Line yAxisId="right" type="monotone" dataKey="tipInflow" name="Tip Revenue Inflow ($)" stroke="#FF007F" strokeWidth={3} dot={{ r: 4, fill: '#FF007F' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

      </div>
      )}

      {/* ================= SECTION 4: REGIONAL AUDIENCE & GLOBAL REACH ================= */}
      {(activeAnalyticsSection === 'all' || activeAnalyticsSection === 'geo') && (
      <div className="glass p-6 sm:p-8 rounded-[2.5rem] border border-white/10 bg-black/60 space-y-6">
        
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FCD34D]"></span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FCD34D]">
                Global Audience Geography
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white mt-1">
              Top Geographic Creator Audiences
            </h3>
          </div>
          <span className="text-xs font-mono text-gray-400">Across 84 Global Nations</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {REGIONAL_METRICS.map((reg) => (
            <div key={reg.country} className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{reg.flag}</span>
                <span className="text-xs font-mono font-black text-white">{reg.share}%</span>
              </div>
              <div>
                <h4 className="text-xs font-mono font-bold text-white">{reg.country}</h4>
                <span className="text-[10px] font-mono text-gray-400">{reg.viewers.toLocaleString()} Viewers</span>
              </div>
              <div className="pt-2 border-t border-white/10 space-y-1 text-[10px] font-mono">
                <div className="flex justify-between text-gray-400">
                  <span>Avg Watch:</span>
                  <strong className="text-white">{reg.avgDuration}</strong>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Tip Velocity:</span>
                  <strong className="text-[#00F5D4]">{reg.avgTip}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
      )}

      {/* ================= AI CREATOR INTELLIGENCE BRIEFING MODAL / CARD ================= */}
      {aiReportGenerated && (
        <div className="p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-r from-zinc-950 via-purple-950/40 to-black border-2 border-[#C084FC] shadow-[0_0_50px_rgba(192,132,252,0.3)] space-y-5 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-white/15 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C084FC]/20 border border-[#C084FC] text-[#C084FC] flex items-center justify-center text-lg shadow-lg">
                <i className="fa-solid fa-brain"></i>
              </div>
              <div>
                <h4 className="text-lg font-serif font-black italic text-white">
                  Janu AI Executive Retention Intelligence Briefing
                </h4>
                <span className="text-[10px] font-mono text-gray-400">
                  Algorithmic Pacing Recommendations for January Rebl Creator Portal
                </span>
              </div>
            </div>

            <button
              onClick={() => setAiReportGenerated(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="p-4 rounded-2xl bg-black/80 border border-white/10 space-y-2">
              <span className="text-xs font-mono font-bold text-[#00F5D4] flex items-center gap-1.5">
                <i className="fa-solid fa-bolt"></i>
                <span>1. Hook Pacing (0-3s)</span>
              </span>
              <p className="text-xs font-mono text-gray-300 leading-relaxed">
                Your 3-second hold rate is <strong className="text-white">92.1%</strong>. Maintain kinetic motion in the first 1.5 seconds rather than static title cards to boost conversion by +4.2%.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/80 border border-white/10 space-y-2">
              <span className="text-xs font-mono font-bold text-[#C084FC] flex items-center gap-1.5">
                <i className="fa-solid fa-arrows-rotate"></i>
                <span>2. Rewind & Loop Triggers</span>
              </span>
              <p className="text-xs font-mono text-gray-300 leading-relaxed">
                Second 12 contains a <strong className="text-white">+6% loop spike</strong>. Seamlessly connecting the final 2 seconds to the first frame will amplify algorithm distribution by 2.8x.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/80 border border-white/10 space-y-2">
              <span className="text-xs font-mono font-bold text-[#FCD34D] flex items-center gap-1.5">
                <i className="fa-solid fa-coins"></i>
                <span>3. Monetization Routing</span>
              </span>
              <p className="text-xs font-mono text-gray-300 leading-relaxed">
                External traffic from Instagram Stories yields <strong className="text-white">$18.40 per 1k views</strong>. Position the Boss Vault tipping link prominently at the 75% video mark.
              </p>
            </div>

          </div>

          <div className="flex items-center justify-between pt-2 text-xs font-mono">
            <span className="text-gray-400">Confidence Score: <strong className="text-green-400">99.4%</strong></span>
            {onNavigateToStudio && (
              <button
                onClick={() => onNavigateToStudio('reel')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-[#00F5D4] hover:text-black text-white font-mono font-bold text-[10px] uppercase transition-all cursor-pointer"
              >
                Apply In Reel Studio →
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdvancedAnalytics;
