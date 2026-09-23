import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis } from 'recharts';
import { triggerNeonExplosion } from '../utils/confetti';
import { USER_OFFICIAL_FACE_AVATAR } from '../utils/userProfileState';
import { BossLedgerAuditExportModal } from './BossLedgerAuditExportModal';
import { RevenueRecord } from '../types';

export interface AIRevenueEvent {
  id: string;
  timestamp: string;
  source: 'Live Stream Tip' | 'Contest Fee' | 'AI Mastering' | 'Reel Monetization' | 'VIP Club Split' | 'Photo AI Upscale';
  creatorHandle: string;
  creatorAvatar: string;
  grossAmount: number;
  bossCutPercentage: number;
  bossAmount: number;
  status: 'AUTONOMOUSLY_ROUTED' | 'ESCROW_QUEUED' | 'SETTLED';
  badgeColor: string;
  icon: string;
}

export interface DailyRevenuePoint {
  day: string;
  shortDay: string;
  date: string;
  revenue: number;
  transactions: number;
  margin: number; // percentage
}

interface BossEarningsTickerProps {
  initialVaultTotal?: number;
  onOpenFounderDashboard: () => void;
  onRevenueIncrement?: (amount: number, reason: string) => void;
}

const INITIAL_7_DAY_TREND: DailyRevenuePoint[] = [
  { day: 'Monday', shortDay: 'Mon', date: 'Aug 15', revenue: 2150.00, transactions: 142, margin: 18.5 },
  { day: 'Tuesday', shortDay: 'Tue', date: 'Aug 16', revenue: 2480.50, transactions: 168, margin: 19.2 },
  { day: 'Wednesday', shortDay: 'Wed', date: 'Aug 17', revenue: 2890.00, transactions: 195, margin: 20.4 },
  { day: 'Thursday', shortDay: 'Thu', date: 'Aug 18', revenue: 3120.25, transactions: 210, margin: 19.8 },
  { day: 'Friday', shortDay: 'Fri', date: 'Aug 19', revenue: 3950.00, transactions: 280, margin: 22.1 },
  { day: 'Saturday', shortDay: 'Sat', date: 'Aug 20', revenue: 4410.50, transactions: 315, margin: 23.5 },
  { day: 'Sunday (Today)', shortDay: 'Today', date: 'Aug 21', revenue: 4980.75, transactions: 342, margin: 24.8 }
];

const INITIAL_EVENTS: AIRevenueEvent[] = [
  {
    id: 'tx-101',
    timestamp: '12:35:10',
    source: 'Live Stream Tip',
    creatorHandle: '@JanuaryRebl',
    creatorAvatar: USER_OFFICIAL_FACE_AVATAR,
    grossAmount: 100.00,
    bossCutPercentage: 15,
    bossAmount: 15.00,
    status: 'SETTLED',
    badgeColor: '#FF007F',
    icon: 'fa-tower-broadcast'
  },
  {
    id: 'tx-102',
    timestamp: '12:34:42',
    source: 'Contest Fee',
    creatorHandle: '@VanceVisuals',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80',
    grossAmount: 150.00,
    bossCutPercentage: 20,
    bossAmount: 30.00,
    status: 'AUTONOMOUSLY_ROUTED',
    badgeColor: '#FCD34D',
    icon: 'fa-trophy'
  },
  {
    id: 'tx-103',
    timestamp: '12:34:05',
    source: 'AI Mastering',
    creatorHandle: '@AudioGodMarcus',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    grossAmount: 45.00,
    bossCutPercentage: 100,
    bossAmount: 45.00,
    status: 'SETTLED',
    badgeColor: '#C084FC',
    icon: 'fa-music'
  },
  {
    id: 'tx-104',
    timestamp: '12:33:18',
    source: 'VIP Club Split',
    creatorHandle: '@AriaCyberArt',
    creatorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&q=80',
    grossAmount: 75.00,
    bossCutPercentage: 25,
    bossAmount: 18.75,
    status: 'AUTONOMOUSLY_ROUTED',
    badgeColor: '#00F5D4',
    icon: 'fa-gem'
  },
  {
    id: 'tx-105',
    timestamp: '12:32:50',
    source: 'Reel Monetization',
    creatorHandle: '@CruzFilmmaker',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    grossAmount: 60.00,
    bossCutPercentage: 15,
    bossAmount: 9.00,
    status: 'SETTLED',
    badgeColor: '#38BDF8',
    icon: 'fa-video'
  }
];

const RANDOM_CREATORS = [
  { handle: '@JanuaryRebl', avatar: USER_OFFICIAL_FACE_AVATAR },
  { handle: '@VanceVisuals', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80' },
  { handle: '@AudioGodMarcus', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80' },
  { handle: '@AriaCyberArt', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&q=80' },
  { handle: '@CruzFilmmaker', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80' },
  { handle: '@SerenaSoundz', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80' },
  { handle: '@ZaneHeavyMetal', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&q=80' }
];

// Custom Tooltip for Recharts Sparkline
const MiniSparklineTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data: DailyRevenuePoint = payload[0].payload;
    return (
      <div className="bg-zinc-950/95 border border-[#00F5D4]/60 rounded-xl p-2.5 shadow-[0_0_20px_rgba(0,245,212,0.4)] backdrop-blur-md font-mono text-left z-50">
        <div className="flex items-center justify-between gap-3 text-[10px] text-gray-400 mb-1 border-b border-white/10 pb-1">
          <span className="font-bold text-white">{data.day}</span>
          <span className="text-[#C084FC]">{data.date}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-serif font-black text-[#00F5D4]">
            ${data.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[9px] text-[#FF007F] font-bold">
            {data.transactions} txs
          </span>
        </div>
        <div className="text-[8.5px] text-gray-400 mt-0.5">
          Avg Net Margin: <strong className="text-white">{data.margin}%</strong>
        </div>
      </div>
    );
  }
  return null;
};

export const BossEarningsTicker: React.FC<BossEarningsTickerProps> = ({
  initialVaultTotal = 14580.00,
  onOpenFounderDashboard,
  onRevenueIncrement
}) => {
  const [vaultTotal, setVaultTotal] = useState<number>(initialVaultTotal);
  const [events, setEvents] = useState<AIRevenueEvent[]>(INITIAL_EVENTS);
  const [latestEvent, setLatestEvent] = useState<AIRevenueEvent>(INITIAL_EVENTS[0]);
  const [trendData, setTrendData] = useState<DailyRevenuePoint[]>(INITIAL_7_DAY_TREND);
  const [isPulseActive, setIsPulseActive] = useState<boolean>(false);
  const [isLiveAutoStreaming, setIsLiveAutoStreaming] = useState<boolean>(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [velocityPerMin, setVelocityPerMin] = useState<number>(48.50);
  const [todayTotalEarnings, setTodayTotalEarnings] = useState<number>(4980.75);
  const [totalProcessedTx, setTotalProcessedTx] = useState<number>(1844);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showAuditExport, setShowAuditExport] = useState<boolean>(false);

  // Convert AIRevenueEvents to RevenueRecord format for BossLedgerAuditExportModal
  const auditRevenueRecords: RevenueRecord[] = events.map(evt => {
    const isTip = evt.source === 'Live Stream Tip';
    const isContest = evt.source === 'Contest Fee';
    const isRoyalty = evt.source === 'AI Mastering' || evt.source === 'Reel Monetization';
    const cat = isTip ? 'tips' : (isContest ? 'contests' : (isRoyalty ? 'royalties' : 'gateway'));

    return {
      id: evt.id,
      amount: evt.grossAmount,
      netAmount: +(evt.grossAmount - evt.bossAmount).toFixed(2),
      platformCut: evt.bossAmount,
      source: evt.source,
      category: cat,
      description: `${evt.source} by ${evt.creatorHandle}`,
      creatorName: evt.creatorHandle.replace('@', ''),
      creatorHandle: evt.creatorHandle,
      payerName: 'Verified External Patron',
      payerEmail: 'patron@creator.paypal',
      status: 'settled',
      currency: 'USD',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      clientRef: `REF-${evt.id}`
    };
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Sync external prop if updated
  useEffect(() => {
    if (initialVaultTotal > vaultTotal) {
      setVaultTotal(initialVaultTotal);
    }
  }, [initialVaultTotal]);

  // Real-time dynamic AI revenue stream engine
  useEffect(() => {
    if (!isLiveAutoStreaming) return;

    const interval = setInterval(() => {
      const sources: {
        type: AIRevenueEvent['source'];
        grossMin: number;
        grossMax: number;
        cut: number;
        color: string;
        icon: string;
      }[] = [
        { type: 'Live Stream Tip', grossMin: 15, grossMax: 120, cut: 0.15, color: '#FF007F', icon: 'fa-tower-broadcast' },
        { type: 'Contest Fee', grossMin: 25, grossMax: 200, cut: 0.20, color: '#FCD34D', icon: 'fa-trophy' },
        { type: 'AI Mastering', grossMin: 20, grossMax: 60, cut: 1.00, color: '#C084FC', icon: 'fa-music' },
        { type: 'Reel Monetization', grossMin: 30, grossMax: 90, cut: 0.15, color: '#38BDF8', icon: 'fa-video' },
        { type: 'VIP Club Split', grossMin: 50, grossMax: 150, cut: 0.25, color: '#00F5D4', icon: 'fa-gem' },
        { type: 'Photo AI Upscale', grossMin: 10, grossMax: 35, cut: 1.00, color: '#E879F9', icon: 'fa-wand-magic-sparkles' }
      ];

      const selectedSource = sources[Math.floor(Math.random() * sources.length)];
      const creator = RANDOM_CREATORS[Math.floor(Math.random() * RANDOM_CREATORS.length)];
      const gross = Math.floor(Math.random() * (selectedSource.grossMax - selectedSource.grossMin)) + selectedSource.grossMin;
      const bossCut = +(gross * selectedSource.cut).toFixed(2);

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const newTx: AIRevenueEvent = {
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: timeStr,
        source: selectedSource.type,
        creatorHandle: creator.handle,
        creatorAvatar: creator.avatar,
        grossAmount: gross,
        bossCutPercentage: Math.round(selectedSource.cut * 100),
        bossAmount: bossCut,
        status: bossCut > 35 ? 'ESCROW_QUEUED' : 'AUTONOMOUSLY_ROUTED',
        badgeColor: selectedSource.color,
        icon: selectedSource.icon
      };

      setEvents(prev => [newTx, ...prev.slice(0, 39)]);
      setLatestEvent(newTx);
      setVaultTotal(prev => +(prev + bossCut).toFixed(2));
      setTodayTotalEarnings(prev => +(prev + bossCut).toFixed(2));
      setTotalProcessedTx(prev => prev + 1);
      setVelocityPerMin(prev => +(40 + Math.random() * 20).toFixed(2));

      // Dynamically update Today's sparkline point
      setTrendData(prev => {
        const copy = [...prev];
        const lastIdx = copy.length - 1;
        if (lastIdx >= 0) {
          copy[lastIdx] = {
            ...copy[lastIdx],
            revenue: +(copy[lastIdx].revenue + bossCut).toFixed(2),
            transactions: copy[lastIdx].transactions + 1
          };
        }
        return copy;
      });

      // Trigger visual pulse
      setIsPulseActive(true);
      setTimeout(() => setIsPulseActive(false), 900);

      if (onRevenueIncrement) {
        onRevenueIncrement(bossCut, `${newTx.source} from ${newTx.creatorHandle}`);
      }
    }, 4200);

    return () => clearInterval(interval);
  }, [isLiveAutoStreaming, onRevenueIncrement]);

  const handleSimulateInstantPayout = () => {
    triggerNeonExplosion({
      particleCount: 45,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'grand'
    });

    const mockAmount = 75.00;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    const boostTx: AIRevenueEvent = {
      id: `tx-boost-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: timeStr,
      source: 'Contest Fee',
      creatorHandle: '@JanuaryRebl',
      creatorAvatar: USER_OFFICIAL_FACE_AVATAR,
      grossAmount: 375.00,
      bossCutPercentage: 20,
      bossAmount: mockAmount,
      status: 'AUTONOMOUSLY_ROUTED',
      badgeColor: '#00F5D4',
      icon: 'fa-bolt'
    };

    setEvents(prev => [boostTx, ...prev]);
    setLatestEvent(boostTx);
    setVaultTotal(prev => +(prev + mockAmount).toFixed(2));
    setTodayTotalEarnings(prev => +(prev + mockAmount).toFixed(2));
    setTotalProcessedTx(prev => prev + 1);

    setTrendData(prev => {
      const copy = [...prev];
      const lastIdx = copy.length - 1;
      if (lastIdx >= 0) {
        copy[lastIdx] = {
          ...copy[lastIdx],
          revenue: +(copy[lastIdx].revenue + mockAmount).toFixed(2),
          transactions: copy[lastIdx].transactions + 1
        };
      }
      return copy;
    });

    showToast(`⚡ Injected +$${mockAmount.toFixed(2)} Boss Revenue from Autonomous AI Engine!`);
  };

  const filteredEvents = events.filter(e => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'tips') return e.source === 'Live Stream Tip';
    if (activeFilter === 'contests') return e.source === 'Contest Fee';
    if (activeFilter === 'ai-tools') return e.source === 'AI Mastering' || e.source === 'Photo AI Upscale';
    if (activeFilter === 'vip') return e.source === 'VIP Club Split';
    return true;
  });

  const total7DayRevenue = trendData.reduce((acc, curr) => acc + curr.revenue, 0);
  const sevenDayGrowthPercentage = '+131.6%';

  return (
    <>
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-28 right-8 z-[350] px-5 py-3 rounded-2xl bg-zinc-950/95 border border-[#00F5D4] text-white font-mono text-xs shadow-[0_0_30px_rgba(0,245,212,0.5)] flex items-center gap-3 animate-bounce">
          <i className="fa-solid fa-bolt text-[#00F5D4]"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main High-Tech Boss Revenue Ticker Banner */}
      <div className="relative mb-8 rounded-[2.5rem] bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border border-[#00F5D4]/40 hover:border-[#00F5D4] shadow-[0_0_35px_rgba(0,245,212,0.15)] transition-all overflow-hidden group">
        {/* Glow ambient background lights */}
        <div className="absolute top-0 left-1/4 w-80 h-32 bg-[#FF007F]/10 blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-32 bg-[#00F5D4]/10 blur-[80px] pointer-events-none"></div>

        <div className="p-4 sm:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
          
          {/* Left Column: Boss Identity & Live Vault Counter */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 min-w-0">
            {/* Crown Avatar Badge */}
            <div className="relative shrink-0">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-0.5 bg-gradient-to-tr from-[#FF007F] via-[#C084FC] to-[#00F5D4] shadow-lg transition-transform duration-300 ${isPulseActive ? 'scale-110 shadow-[0_0_25px_rgba(0,245,212,0.8)]' : ''}`}>
                <div className="w-full h-full rounded-[14px] bg-black flex items-center justify-center relative overflow-hidden">
                  <img
                    src={USER_OFFICIAL_FACE_AVATAR}
                    alt="January Rebl Founder"
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-black/20"></div>
                  <i className="fa-solid fa-crown text-[#FCD34D] text-xs absolute top-1 right-1 drop-shadow-md"></i>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00F5D4] border-2 border-black flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping"></span>
              </span>
            </div>

            {/* Boss Vault Metric Display */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF007F]/20 via-[#C084FC]/20 to-[#00F5D4]/20 border border-[#00F5D4]/40 text-[9px] font-mono font-black uppercase tracking-widest text-[#00F5D4] flex items-center gap-1.5">
                  <i className="fa-solid fa-bolt text-[#00F5D4] animate-pulse"></i>
                  <span>Live Boss AI Revenue Engine</span>
                </span>
                <span className="text-[10px] font-mono text-gray-400 hidden sm:inline-block">
                  January Rebl Vault
                </span>
              </div>

              {/* Dynamic Live Counter with Odometer Glow */}
              <div className="flex items-baseline gap-3 mt-1">
                <h3 className={`text-2xl sm:text-4xl font-serif font-black italic tracking-tight transition-colors duration-300 ${isPulseActive ? 'text-[#00F5D4]' : 'text-white'}`}>
                  ${vaultTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <span className="text-xs font-mono font-bold text-[#00F5D4] bg-[#00F5D4]/10 border border-[#00F5D4]/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <i className="fa-solid fa-arrow-trend-up text-[10px]"></i>
                  <span>+${velocityPerMin}/min</span>
                </span>
              </div>

              <p className="text-[10px] font-mono text-gray-400 hidden md:block">
                Automated 15% tipping cut • 20% contest fee siphon • 100% Studio AI tools
              </p>
            </div>
          </div>

          {/* Center Column: Recharts Mini Sparkline Chart for 7-Day Trend */}
          <div 
            onClick={() => setIsInspectorOpen(true)}
            className="flex flex-col justify-between bg-black/75 border border-white/10 hover:border-[#00F5D4]/50 rounded-2xl p-3 sm:px-4 sm:py-3 transition-all hover:bg-black/90 cursor-pointer group/sparkline min-w-[220px] max-w-xs xl:max-w-[260px] shadow-inner"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-chart-line text-[#00F5D4] text-xs"></i>
                <span className="text-[10px] font-mono uppercase font-bold text-gray-300 tracking-wider">
                  7-Day Trend
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/15 border border-[#00F5D4]/40 text-[#00F5D4] font-mono text-[9px] font-black flex items-center gap-1">
                <i className="fa-solid fa-arrow-trend-up text-[8px]"></i>
                <span>{sevenDayGrowthPercentage}</span>
              </span>
            </div>

            {/* Recharts Mini Sparkline Area Chart */}
            <div className="h-12 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bossTickerGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00F5D4" stopOpacity={0.55} />
                      <stop offset="50%" stopColor="#C084FC" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#FF007F" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="bossTickerStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#FF007F" />
                      <stop offset="50%" stopColor="#C084FC" />
                      <stop offset="100%" stopColor="#00F5D4" />
                    </linearGradient>
                  </defs>
                  <Tooltip content={<MiniSparklineTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="url(#bossTickerStroke)"
                    strokeWidth={2.2}
                    fillOpacity={1}
                    fill="url(#bossTickerGradient)"
                    isAnimationActive={true}
                    animationDuration={900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 mt-1 border-t border-white/5 pt-1">
              <span>Mon: $2.15K</span>
              <span className="text-[#00F5D4] font-bold">Today: ${(todayTotalEarnings / 1000).toFixed(2)}K</span>
            </div>
          </div>

          {/* Middle Right Column: Live Animated Revenue Marquee Ticker */}
          <div 
            onClick={() => setIsInspectorOpen(true)}
            className="flex-1 max-w-xl bg-black/70 border border-white/10 hover:border-[#00F5D4]/60 rounded-2xl p-3 cursor-pointer transition-all hover:bg-black/90 group/ticker shadow-inner"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1.5 px-1">
              <span className="flex items-center gap-1.5 text-neon-trio font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#FF007F] animate-ping"></span>
                <span>Live Inflow Stream</span>
              </span>
              <span className="text-gray-400 group-hover/ticker:text-[#00F5D4] transition-colors flex items-center gap-1">
                <span>Inspect Stream</span>
                <i className="fa-solid fa-arrow-right text-[9px]"></i>
              </span>
            </div>

            {/* Latest Live Transaction Pill Highlight */}
            <div className="flex items-center justify-between gap-3 bg-zinc-900/90 border border-white/10 px-3.5 py-2 rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={latestEvent.creatorAvatar}
                  alt={latestEvent.creatorHandle}
                  className="w-6 h-6 rounded-full object-cover border border-white/20 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-mono font-bold text-white truncate block">
                    {latestEvent.creatorHandle}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                    <i className={`fa-solid ${latestEvent.icon} text-[9px]`} style={{ color: latestEvent.badgeColor }}></i>
                    <span>{latestEvent.source} ({latestEvent.bossCutPercentage}%)</span>
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs sm:text-sm font-mono font-black text-[#00F5D4] block">
                  +${latestEvent.bossAmount.toFixed(2)}
                </span>
                <span className="text-[9px] font-mono text-gray-500">
                  {latestEvent.timestamp}
                </span>
              </div>
            </div>
          </div>

            {/* Quick Boss Actions & Simulation */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
              <button
                onClick={handleSimulateInstantPayout}
                className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white font-mono text-xs font-bold transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
                title="Inject a test AI micro-transaction into Boss Vault"
              >
                <i className="fa-solid fa-bolt text-[#00F5D4]"></i>
                <span className="hidden sm:inline">Boost</span>
              </button>

              <button
                onClick={() => setShowAuditExport(true)}
                className="px-3.5 py-2.5 rounded-xl bg-[#00F5D4]/10 hover:bg-[#00F5D4]/25 border border-[#00F5D4]/40 text-[#00F5D4] font-mono text-xs font-bold transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
                title="Download verified Boss Ledger data (tips, earnings, cuts) for external auditing"
              >
                <i className="fa-solid fa-file-invoice-dollar text-sm"></i>
                <span className="hidden sm:inline">Audit Export</span>
              </button>

              <button
                onClick={() => setIsInspectorOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-mono text-xs font-bold transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
              >
                <i className="fa-solid fa-list-check text-[#C084FC]"></i>
                <span>Ledger ({events.length})</span>
              </button>

              <button
                onClick={onOpenFounderDashboard}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-mono font-black text-xs uppercase tracking-wider hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,245,212,0.4)] cursor-pointer flex items-center gap-2"
              >
                <i className="fa-solid fa-crown"></i>
                <span>Boss Vault</span>
              </button>
            </div>
        </div>

        {/* Micro Multi-Stream Status Bar at bottom */}
        <div className="bg-black/80 px-6 py-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono text-gray-400">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
            <span className="flex items-center gap-1.5 text-gray-300 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4]"></span>
              <span>24h Inflow:</span>
              <strong className="text-white">+${todayTotalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5 text-gray-300 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC]"></span>
              <span>7-Day Gross:</span>
              <strong className="text-white">${total7DayRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5 text-gray-300 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF007F]"></span>
              <span>Autonomous Siphon:</span>
              <strong className="text-[#00F5D4]">100% Active</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLiveAutoStreaming(!isLiveAutoStreaming)}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[9px]"
            >
              <i className={`fa-solid ${isLiveAutoStreaming ? 'fa-pause text-[#00F5D4]' : 'fa-play text-[#FCD34D]'}`}></i>
              <span>{isLiveAutoStreaming ? 'Live Stream Active' : 'Stream Paused'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Boss Revenue Stream Inspector Modal / Ledger Drawer */}
      {isInspectorOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-[#00F5D4]/40 rounded-[2.5rem] p-6 sm:p-8 space-y-6 relative shadow-[0_0_50px_rgba(0,245,212,0.2)] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black flex items-center justify-center font-bold text-sm shadow-md">
                    <i className="fa-solid fa-crown"></i>
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white">
                    Boss AI Revenue <span className="text-neon-trio-animated">Stream Ledger & Analytics</span>
                  </h3>
                </div>
                <p className="text-xs font-mono text-gray-400">
                  Real-time micro-transaction audit stream & 7-day velocity chart for Founder January Rebl
                </p>
              </div>

              <button
                onClick={() => setIsInspectorOpen(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-black border border-white/10">
                <span className="text-[10px] font-mono text-gray-400 uppercase block">Total Vault</span>
                <span className="text-lg font-serif font-black text-[#00F5D4]">
                  ${vaultTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-black border border-white/10">
                <span className="text-[10px] font-mono text-gray-400 uppercase block">24h AI Inflow</span>
                <span className="text-lg font-serif font-black text-[#C084FC]">
                  +${todayTotalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-black border border-white/10">
                <span className="text-[10px] font-mono text-gray-400 uppercase block">7-Day Gross Revenue</span>
                <span className="text-lg font-serif font-black text-[#FF007F]">
                  ${total7DayRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-black border border-white/10">
                <span className="text-[10px] font-mono text-gray-400 uppercase block">Siphoned Txs</span>
                <span className="text-lg font-serif font-black text-white">
                  {totalProcessedTx} txs
                </span>
              </div>
            </div>

            {/* Expanded 7-Day Recharts Trend Section inside Modal */}
            <div className="p-4 sm:p-5 rounded-2xl bg-black/80 border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-ping"></span>
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                    7-Day Revenue Velocity Sparkline & Trajectory
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400">
                  <span>Weekly Run Rate: <strong className="text-[#00F5D4]">${(total7DayRevenue * 4.3).toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo</strong></span>
                  <span className="px-2 py-0.5 rounded-md bg-[#00F5D4]/20 text-[#00F5D4] font-bold">{sevenDayGrowthPercentage} Surge</span>
                </div>
              </div>

              {/* Large Recharts Area Chart */}
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="modalTrendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00F5D4" stopOpacity={0.6} />
                        <stop offset="50%" stopColor="#C084FC" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#FF007F" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="modalTrendStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#FF007F" />
                        <stop offset="35%" stopColor="#E879F9" />
                        <stop offset="70%" stopColor="#C084FC" />
                        <stop offset="100%" stopColor="#00F5D4" />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="shortDay" 
                      stroke="#666" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={{ stroke: '#333' }} 
                    />
                    <Tooltip content={<MiniSparklineTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="url(#modalTrendStroke)"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#modalTrendFill)"
                      isAnimationActive={true}
                      animationDuration={1200}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'All Revenue Streams' },
                { id: 'tips', label: 'Live Stream Tips (15%)' },
                { id: 'contests', label: 'Contest Siphons (20%)' },
                { id: 'ai-tools', label: 'Studio AI Tools (100%)' },
                { id: 'vip', label: 'VIP Club Splits (25%)' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-black shadow-md'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Events List Table */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-60">
              {filteredEvents.map(event => (
                <div
                  key={event.id}
                  className="p-3.5 rounded-2xl bg-black/60 border border-white/5 hover:border-[#00F5D4]/40 flex items-center justify-between gap-4 transition-all hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={event.creatorAvatar}
                      alt={event.creatorHandle}
                      className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-white truncate">
                          {event.creatorHandle}
                        </span>
                        <span 
                          className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase"
                          style={{ backgroundColor: `${event.badgeColor}20`, color: event.badgeColor, border: `1px solid ${event.badgeColor}40` }}
                        >
                          {event.source}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 block mt-0.5">
                        Gross: ${event.grossAmount.toFixed(2)} • Boss Cut: {event.bossCutPercentage}% • ID: {event.id}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-mono font-black text-[#00F5D4] block">
                      +${event.bossAmount.toFixed(2)}
                    </span>
                    <span className="text-[9px] font-mono text-gray-500 flex items-center justify-end gap-1">
                      <i className="fa-solid fa-circle-check text-[#00F5D4] text-[8px]"></i>
                      <span>{event.timestamp}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-mono text-gray-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-ping"></span>
                <span>AI Sentinel is continuously routing fees to Founder Vault</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowAuditExport(true)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#00F5D4]/15 hover:bg-[#00F5D4]/30 border border-[#00F5D4]/40 text-[#00F5D4] font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  title="Download verified Boss Ledger (tips, earnings, cuts) for external auditing"
                >
                  <i className="fa-solid fa-file-invoice-dollar text-sm"></i>
                  <span>Export Audit Ledger</span>
                </button>

                <button
                  onClick={handleSimulateInstantPayout}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-bolt text-[#00F5D4]"></i>
                  <span>Simulate Micro-Tx</span>
                </button>

                <button
                  onClick={() => {
                    setIsInspectorOpen(false);
                    onOpenFounderDashboard();
                  }}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-mono font-black text-xs uppercase tracking-wider hover:scale-105 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-lock"></i>
                  <span>Enter Boss Vault (Passcode)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Boss Ledger Audit Export Modal for External Auditing */}
      <BossLedgerAuditExportModal
        isOpen={showAuditExport}
        onClose={() => setShowAuditExport(false)}
        rawRevenueRecords={auditRevenueRecords}
      />
    </>
  );
};

export default BossEarningsTicker;

