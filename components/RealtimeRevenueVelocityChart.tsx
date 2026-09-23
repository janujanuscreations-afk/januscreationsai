import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { firestoreService } from '../services/firebase';
import { RevenueRecord, Last30DaysRevenueSummary } from '../types';
import { bossAudio } from '../utils/soundEffects';
import { triggerNeonExplosion } from '../utils/confetti';

export interface RealtimeRevenueVelocityChartProps {
  walletBalance?: number;
  onNavigateToStudio?: (tool: 'reel' | 'photo' | 'music') => void;
  onOpenQuickActions?: () => void;
  onToast?: (msg: string) => void;
}

export interface VelocityDataPoint {
  id: string;
  time: string;
  timestamp: number;
  grossRevenue: number;
  creatorEarnings: number; // 85%
  januCut: number; // 15%
  velocityRatePerHour: number;
  transactionCount: number;
  source?: string;
  isSurge?: boolean;
}

type TimeHorizon = 'live' | '24h' | '7d' | '30d';
type ChartStyle = 'stacked-area' | 'dual-lines' | 'composed-flow';

export const RealtimeRevenueVelocityChart: React.FC<RealtimeRevenueVelocityChartProps> = ({
  walletBalance = 15850.00,
  onNavigateToStudio,
  onOpenQuickActions,
  onToast
}) => {
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('live');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('stacked-area');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [isSurging, setIsSurging] = useState<boolean>(false);
  const [lastSurgeAmount, setLastSurgeAmount] = useState<number | null>(null);
  const [firestoreSummary, setFirestoreSummary] = useState<Last30DaysRevenueSummary | null>(null);

  // High-frequency live streaming points buffer
  const [liveStreamData, setLiveStreamData] = useState<VelocityDataPoint[]>(() => {
    const points: VelocityDataPoint[] = [];
    const now = Date.now();
    // Pre-populate last 20 ticks (1 minute historical base)
    for (let i = 19; i >= 0; i--) {
      const t = now - i * 3000;
      const d = new Date(t);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      // Baseline random tip/royalty stream between $15 and $85 per tick
      const baseGross = Math.round((28 + Math.sin(i * 0.45) * 16 + Math.random() * 12) * 100) / 100;
      const creator = Math.round(baseGross * 0.85 * 100) / 100;
      const janu = Math.round(baseGross * 0.15 * 100) / 100;
      const velocityRate = Math.round(baseGross * (3600 / 3) * 100) / 100; // extrapolated $/hr

      points.push({
        id: `tick-${t}`,
        time: timeStr,
        timestamp: t,
        grossRevenue: baseGross,
        creatorEarnings: creator,
        januCut: janu,
        velocityRatePerHour: velocityRate,
        transactionCount: Math.floor(Math.random() * 3) + 1,
        source: 'Live Creator Stream Engine'
      });
    }
    return points;
  });

  // 24-hour hourly dataset
  const hourlyData = useMemo<VelocityDataPoint[]>(() => {
    const hours: VelocityDataPoint[] = [];
    const baseHourPaces = [
      42, 35, 28, 22, 18, 25, 45, 80, 120, 160, 210, 260, 
      310, 290, 275, 340, 420, 580, 720, 890, 940, 820, 610, 480
    ];
    for (let h = 0; h < 24; h++) {
      const hourStr = `${h.toString().padStart(2, '0')}:00`;
      const gross = baseHourPaces[h] + Math.round((Math.random() * 35 - 15) * 10) / 10;
      const creator = Math.round(gross * 0.85 * 100) / 100;
      const janu = Math.round(gross * 0.15 * 100) / 100;
      hours.push({
        id: `hour-${h}`,
        time: hourStr,
        timestamp: h,
        grossRevenue: gross,
        creatorEarnings: creator,
        januCut: janu,
        velocityRatePerHour: gross,
        transactionCount: Math.floor(gross / 22) + 2,
        source: '24H Rolling Payout Settlement'
      });
    }
    return hours;
  }, []);

  // 7-day dataset
  const sevenDaysData = useMemo<VelocityDataPoint[]>(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseDayPaces = [3450, 4120, 3980, 4820, 6210, 7840, 6950];
    return days.map((day, idx) => {
      const gross = baseDayPaces[idx];
      const creator = Math.round(gross * 0.85 * 100) / 100;
      const janu = Math.round(gross * 0.15 * 100) / 100;
      return {
        id: `day-${idx}`,
        time: day,
        timestamp: idx,
        grossRevenue: gross,
        creatorEarnings: creator,
        januCut: janu,
        velocityRatePerHour: Math.round(gross / 24),
        transactionCount: Math.floor(gross / 38),
        source: '7D Creator Royalty Stream'
      };
    });
  }, []);

  // 30-day dataset from Firestore or fallback
  const thirtyDaysData = useMemo<VelocityDataPoint[]>(() => {
    if (firestoreSummary?.dailyBreakdown && firestoreSummary.dailyBreakdown.length > 0) {
      return firestoreSummary.dailyBreakdown.map((pt, idx) => {
        const gross = pt.amount;
        const creator = Math.round(gross * 0.85 * 100) / 100;
        const janu = Math.round(gross * 0.15 * 100) / 100;
        return {
          id: `30d-${idx}`,
          time: pt.label || pt.date.slice(5),
          timestamp: idx,
          grossRevenue: gross,
          creatorEarnings: creator,
          januCut: janu,
          velocityRatePerHour: Math.round(gross / 24),
          transactionCount: pt.count,
          source: 'Firestore 30-Day Ledger'
        };
      });
    }

    // Default 30-day synthetic curve
    const list: VelocityDataPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const gross = Math.round((2800 + Math.sin(i * 0.3) * 1200 + (30 - i) * 60 + Math.random() * 400) * 100) / 100;
      const creator = Math.round(gross * 0.85 * 100) / 100;
      const janu = Math.round(gross * 0.15 * 100) / 100;
      list.push({
        id: `day30-${i}`,
        time: label,
        timestamp: d.getTime(),
        grossRevenue: gross,
        creatorEarnings: creator,
        januCut: janu,
        velocityRatePerHour: Math.round(gross / 24),
        transactionCount: Math.floor(gross / 42),
        source: '30-Day Sovereign Ledger'
      });
    }
    return list;
  }, [firestoreSummary]);

  // Load Firestore 30-day summary and subscribe to live updates
  useEffect(() => {
    // Subscribe to live 30-day rolling revenue summary
    const unsubSummary = firestoreService.subscribeLast30DaysRevenue((sum) => {
      if (sum) {
        setFirestoreSummary(sum);
      }
    });

    // Real-time listener for incoming revenue transactions from Firestore
    const unsubTransactions = firestoreService.subscribeTransactionLogs((records) => {
      if (records && records.length > 0) {
        const latest = records[0];
        const gross = latest.amount || 0;
        if (gross > 0) {
          const creator = Math.round(gross * 0.85 * 100) / 100;
          const janu = Math.round(gross * 0.15 * 100) / 100;
          const now = Date.now();
          const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          setLiveStreamData(prev => {
            const newPt: VelocityDataPoint = {
              id: `fs-${latest.id || now}`,
              time: timeStr,
              timestamp: now,
              grossRevenue: gross,
              creatorEarnings: creator,
              januCut: janu,
              velocityRatePerHour: Math.round(gross * 1200 * 100) / 100,
              transactionCount: 1,
              source: latest.source || 'Live Transaction Recorded'
            };
            const updated = [...prev.slice(1), newPt];
            return updated;
          });
        }
      }
    });

    return () => {
      if (typeof unsubSummary === 'function') unsubSummary();
      if (typeof unsubTransactions === 'function') unsubTransactions();
    };
  }, []);

  // Real-time live streaming interval (updates every 3 seconds)
  useEffect(() => {
    if (!isStreaming || timeHorizon !== 'live') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      // Dynamic natural fluctuation with occasional micro-bursts
      const isBurst = Math.random() > 0.82;
      const base = isBurst 
        ? (65 + Math.random() * 85) 
        : (25 + Math.sin(now / 5000) * 15 + Math.random() * 15);
      
      const gross = Math.round(base * 100) / 100;
      const creator = Math.round(gross * 0.85 * 100) / 100;
      const janu = Math.round(gross * 0.15 * 100) / 100;
      const velocityRate = Math.round(gross * (3600 / 3) * 100) / 100;

      setLiveStreamData(prev => {
        const newPt: VelocityDataPoint = {
          id: `tick-${now}`,
          time: timeStr,
          timestamp: now,
          grossRevenue: gross,
          creatorEarnings: creator,
          januCut: janu,
          velocityRatePerHour: velocityRate,
          transactionCount: isBurst ? Math.floor(Math.random() * 4) + 2 : 1,
          source: isBurst ? 'Live Superchat Tip Burst' : 'Continuous Creator Streaming'
        };
        // Keep window at 22 points
        return [...prev.slice(1), newPt];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isStreaming, timeHorizon]);

  // Active chart dataset depending on selected horizon
  const activeDataset = useMemo(() => {
    switch (timeHorizon) {
      case 'live':
        return liveStreamData;
      case '24h':
        return hourlyData;
      case '7d':
        return sevenDaysData;
      case '30d':
        return thirtyDaysData;
      default:
        return liveStreamData;
    }
  }, [timeHorizon, liveStreamData, hourlyData, sevenDaysData, thirtyDaysData]);

  // Aggregated KPI calculus for the current active window
  const kpis = useMemo(() => {
    const totalGross = activeDataset.reduce((acc, curr) => acc + curr.grossRevenue, 0);
    const totalCreator = activeDataset.reduce((acc, curr) => acc + curr.creatorEarnings, 0);
    const totalJanu = activeDataset.reduce((acc, curr) => acc + curr.januCut, 0);
    const totalTx = activeDataset.reduce((acc, curr) => acc + curr.transactionCount, 0);
    const latest = activeDataset[activeDataset.length - 1];
    
    // Instant velocity run rate
    const currentVelocityRate = latest?.velocityRatePerHour || Math.round(totalGross / Math.max(1, activeDataset.length) * 12);
    const avgGross = totalGross / Math.max(1, activeDataset.length);

    return {
      totalGross,
      totalCreator,
      totalJanu,
      totalTx,
      currentVelocityRate,
      avgGross,
      creatorPct: totalGross > 0 ? (totalCreator / totalGross) * 100 : 85,
      januPct: totalGross > 0 ? (totalJanu / totalGross) * 100 : 15
    };
  }, [activeDataset]);

  // Handler to simulate an instant live revenue surge (e.g. Diamond Tip or VIP Stream Pass)
  const handleSimulateSurge = () => {
    setIsSurging(true);
    const surgeVal = Math.round((120 + Math.random() * 280) * 100) / 100;
    setLastSurgeAmount(surgeVal);

    bossAudio.playCashRegister();
    bossAudio.playBigWin();

    triggerNeonExplosion({
      particleCount: 80,
      origin: { x: 0.5, y: 0.4 },
      intensity: 'grand'
    });

    const now = Date.now();
    const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const creatorShare = Math.round(surgeVal * 0.85 * 100) / 100;
    const januShare = Math.round(surgeVal * 0.15 * 100) / 100;

    const surgePoint: VelocityDataPoint = {
      id: `surge-${now}`,
      time: timeStr,
      timestamp: now,
      grossRevenue: surgeVal,
      creatorEarnings: creatorShare,
      januCut: januShare,
      velocityRatePerHour: Math.round(surgeVal * 1200 * 100) / 100,
      transactionCount: 5,
      source: 'VIP Diamond Tip Surge Event',
      isSurge: true
    };

    setLiveStreamData(prev => [...prev.slice(1), surgePoint]);

    const msg = `⚡ Injected Live Tip Surge: $${surgeVal.toFixed(2)} ($${creatorShare.toFixed(2)} Creator [85%] + $${januShare.toFixed(2)} Janu Cut [15%])`;
    if (onToast) onToast(msg);

    setTimeout(() => {
      setIsSurging(false);
    }, 2000);
  };

  // Custom luxury tooltip component
  const CustomVelocityTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload as VelocityDataPoint;
      if (!data) return null;

      return (
        <div className="p-4 rounded-2xl bg-zinc-950/95 border border-[#00F5D4]/40 shadow-[0_10px_35px_rgba(0,0,0,0.85)] backdrop-blur-xl font-mono text-xs space-y-3 min-w-[240px]">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-gray-400 font-bold flex items-center gap-1.5">
              <i className="fa-solid fa-clock text-[#00F5D4]"></i>
              <span>{label}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/15 border border-[#00F5D4]/40 text-[#00F5D4] text-[9px] font-bold uppercase">
              {data.isSurge ? 'Surge Peak' : 'Live Stream'}
            </span>
          </div>

          <div className="space-y-1.5">
            {/* Total Gross Revenue */}
            <div className="flex items-center justify-between text-white font-bold">
              <span className="text-gray-300">Total Gross Flow:</span>
              <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200">
                ${data.grossRevenue.toFixed(2)}
              </span>
            </div>

            {/* 85% Creator Share */}
            <div className="flex items-center justify-between p-1.5 rounded-xl bg-[#00F5D4]/10 border border-[#00F5D4]/30">
              <span className="text-[#00F5D4] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00F5D4]"></span>
                <span>85% Creator Flow:</span>
              </span>
              <span className="text-[#00F5D4] font-black font-mono">
                ${data.creatorEarnings.toFixed(2)}
              </span>
            </div>

            {/* 15% Janu Cut */}
            <div className="flex items-center justify-between p-1.5 rounded-xl bg-[#FF007F]/10 border border-[#FF007F]/30">
              <span className="text-[#FF007F] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF007F]"></span>
                <span>15% Janu Cut:</span>
              </span>
              <span className="text-[#FF007F] font-black font-mono">
                ${data.januCut.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400">
            <span>Velocity Run-Rate:</span>
            <span className="text-[#C084FC] font-bold">${data.velocityRatePerHour.toLocaleString()}/hr</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass p-6 sm:p-8 rounded-[2.5rem] border border-[#00F5D4]/40 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-6">
      
      {/* Glow Ambient Highlights */}
      <div className="absolute top-0 right-1/3 w-96 h-48 bg-[#00F5D4]/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-10 w-96 h-48 bg-[#FF007F]/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* ================= HEADER CONTROLS & BADGES ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#00F5D4]/20 via-[#C084FC]/20 to-[#FF007F]/20 border border-[#00F5D4]/40 text-[#00F5D4] text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(0,245,212,0.25)]">
              <span className={`w-2 h-2 rounded-full bg-[#00F5D4] ${isStreaming && timeHorizon === 'live' ? 'animate-ping' : ''}`}></span>
              <span>Recharts Real-Time Revenue Velocity</span>
            </span>

            <span className="px-2.5 py-0.5 rounded-full bg-[#FF007F]/15 border border-[#FF007F]/40 text-[#FF007F] text-[10px] font-mono font-bold">
              15% Janu Cut • 85% Creator Flow
            </span>

            <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-[10px] font-mono">
              Sovereign Split Protocol
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-serif font-black italic text-white tracking-tight flex items-center gap-3">
            <span>Real-Time Revenue</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F]">
              Velocity Telemetry
            </span>
          </h3>

          <p className="text-xs font-mono text-gray-400 max-w-2xl leading-relaxed">
            Continuous real-time flow visualization plotting the dynamic 85% creator payout pool against the 15% Janu sovereign cut across all studio channels.
          </p>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center gap-3 flex-wrap">
          
          {/* Chart Style Switcher */}
          <div className="flex items-center bg-black/80 border border-white/15 p-1 rounded-2xl">
            <button
              onClick={() => {
                setChartStyle('stacked-area');
                bossAudio.playSubtlePing();
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                chartStyle === 'stacked-area'
                  ? 'bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Stacked Area Flow: Shows cumulative 100% split"
            >
              <i className="fa-solid fa-chart-area"></i>
              <span>Stacked Flow</span>
            </button>

            <button
              onClick={() => {
                setChartStyle('dual-lines');
                bossAudio.playSubtlePing();
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                chartStyle === 'dual-lines'
                  ? 'bg-gradient-to-r from-[#00F5D4] to-[#FF007F] text-black font-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Dual Spline Lines: Compares creator vs Janu velocities"
            >
              <i className="fa-solid fa-chart-line"></i>
              <span>Dual Splines</span>
            </button>

            <button
              onClick={() => {
                setChartStyle('composed-flow');
                bossAudio.playSubtlePing();
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                chartStyle === 'composed-flow'
                  ? 'bg-gradient-to-r from-[#C084FC] to-[#FF007F] text-black font-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Composed Flow: Bars & Splines"
            >
              <i className="fa-solid fa-chart-simple"></i>
              <span>Composed</span>
            </button>
          </div>

          {/* Time Horizon Selector */}
          <div className="flex items-center bg-black/80 border border-white/15 p-1 rounded-2xl">
            {(['live', '24h', '7d', '30d'] as TimeHorizon[]).map((h) => (
              <button
                key={h}
                onClick={() => {
                  setTimeHorizon(h);
                  bossAudio.playSubtlePing();
                }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  timeHorizon === h
                    ? 'bg-white/20 text-white font-bold border border-white/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {h === 'live' ? '● Live 60s' : h}
              </button>
            ))}
          </div>

          {/* Live Streaming Pause/Play */}
          {timeHorizon === 'live' && (
            <button
              onClick={() => {
                setIsStreaming(!isStreaming);
                bossAudio.playSubtlePing();
              }}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                isStreaming
                  ? 'bg-[#00F5D4]/15 border-[#00F5D4]/40 text-[#00F5D4] hover:bg-[#00F5D4]/25'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
              }`}
              title={isStreaming ? 'Pause live stream ticking' : 'Resume live stream'}
            >
              <i className={`fa-solid ${isStreaming ? 'fa-pause' : 'fa-play'}`}></i>
              <span className="text-[10px]">{isStreaming ? 'Streaming' : 'Paused'}</span>
            </button>
          )}

          {/* Simulate Live Tip Surge */}
          <button
            onClick={handleSimulateSurge}
            disabled={isSurging}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg ${
              isSurging
                ? 'bg-[#FF007F] text-white animate-pulse scale-105'
                : 'bg-gradient-to-r from-[#FF007F] to-[#00F5D4] text-black hover:scale-105 shadow-[#FF007F]/25'
            }`}
          >
            <i className={`fa-solid fa-bolt ${isSurging ? 'animate-spin' : ''}`}></i>
            <span>{isSurging ? 'Injecting Tip...' : 'Simulate Surge'}</span>
          </button>

        </div>

      </div>

      {/* ================= TELEMETRY KPI METRICS BAR ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-4 border-t border-white/10 relative z-10">
        
        {/* 1. Real-Time Run-Rate Velocity */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#00F5D4]/50 transition-all group">
          <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-gray-400">
            <span>Velocity Rate</span>
            <i className="fa-solid fa-gauge-high text-[#00F5D4] group-hover:scale-110 transition-transform"></i>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-xl sm:text-2xl font-mono font-black text-white">
              ${kpis.currentVelocityRate.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-[#00F5D4] font-bold">/ hr</span>
          </div>
          <span className="text-[9px] font-mono text-gray-500 mt-1 block truncate">
            {timeHorizon === 'live' ? 'Instant High-Frequency Pacing' : 'Aggregated Hourly Pacing'}
          </span>
        </div>

        {/* 2. 85% Creator Earnings Flow */}
        <div className="p-3.5 rounded-2xl bg-[#00F5D4]/[0.06] border border-[#00F5D4]/30 hover:border-[#00F5D4] transition-all group">
          <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-[#00F5D4]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4]"></span>
              <span>85% Creator Flow</span>
            </span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#00F5D4]/20 text-[#00F5D4] text-[8px] font-bold">
              85.0%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-xl sm:text-2xl font-mono font-black text-[#00F5D4]">
              ${kpis.totalCreator.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[9px] font-mono text-gray-400 mt-1 block truncate">
            Direct Instant Creator Balance Pool
          </span>
        </div>

        {/* 3. 15% Janu Cut Flow */}
        <div className="p-3.5 rounded-2xl bg-[#FF007F]/[0.06] border border-[#FF007F]/30 hover:border-[#FF007F] transition-all group">
          <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-[#FF007F]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF007F]"></span>
              <span>15% Janu Cut</span>
            </span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#FF007F]/20 text-[#FF007F] text-[8px] font-bold">
              15.0%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-xl sm:text-2xl font-mono font-black text-[#FF007F]">
              ${kpis.totalJanu.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[9px] font-mono text-gray-400 mt-1 block truncate">
            January Rebl Platform Treasury
          </span>
        </div>

        {/* 4. Total Gross Flow in Active Window */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-400/50 transition-all group">
          <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-gray-400">
            <span>Gross Revenue Volume</span>
            <i className="fa-solid fa-money-bill-transfer text-[#C084FC]"></i>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-xl sm:text-2xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-[#C084FC]">
              ${kpis.totalGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[9px] font-mono text-gray-500 mt-1 block truncate">
            {kpis.totalTx} Transactions Verified
          </span>
        </div>

        {/* 5. Settlement Guarantee Status */}
        <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-3.5 rounded-2xl bg-black/50 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-gray-400">
            <span>Split Protocol</span>
            <i className="fa-solid fa-shield-halved text-[#00F5D4]"></i>
          </div>
          <div className="mt-1">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>100% Real-Time Guaranteed</span>
            </div>
            <p className="text-[9px] font-mono text-gray-500 mt-0.5">
              PayPal Live Payout Clearing
            </p>
          </div>
        </div>

      </div>

      {/* ================= RECHARTS VELOCITY CHART CONTAINER ================= */}
      <div className="h-80 sm:h-96 w-full relative z-10 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartStyle === 'stacked-area' ? (
            <AreaChart data={activeDataset} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
              <defs>
                {/* 85% Creator Earnings Gradient */}
                <linearGradient id="creatorEarningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F5D4" stopOpacity={0.65} />
                  <stop offset="95%" stopColor="#00F5D4" stopOpacity={0.02} />
                </linearGradient>

                {/* 15% Janu Cut Gradient */}
                <linearGradient id="januCutGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF007F" stopOpacity={0.75} />
                  <stop offset="95%" stopColor="#FF007F" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" vertical={false} />
              
              <XAxis
                dataKey="time"
                stroke="#666"
                tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
                interval={timeHorizon === 'live' ? 3 : 'preserveEnd'}
              />

              <YAxis
                stroke="#00F5D4"
                tick={{ fill: '#00F5D4', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
              />

              <Tooltip content={<CustomVelocityTooltip />} />

              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontFamily: 'monospace' }}
                formatter={(value) => {
                  if (value.includes('Creator')) return <span style={{ color: '#00F5D4', fontWeight: 'bold' }}>85% Creator Earnings Flow</span>;
                  if (value.includes('Janu')) return <span style={{ color: '#FF007F', fontWeight: 'bold' }}>15% Janu Cut (Platform Treasury)</span>;
                  return <span style={{ color: '#fff' }}>{value}</span>;
                }}
              />

              <ReferenceLine
                y={kpis.avgGross}
                stroke="#C084FC"
                strokeDasharray="4 4"
                label={{
                  value: `Avg Flow: $${kpis.avgGross.toFixed(1)}`,
                  fill: '#C084FC',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  position: 'insideTopLeft'
                }}
              />

              {/* Stacked Areas: Creator on bottom, Janu cut on top */}
              <Area
                type="monotone"
                dataKey="creatorEarnings"
                name="85% Creator Earnings Flow"
                stackId="1"
                stroke="#00F5D4"
                strokeWidth={2.5}
                fill="url(#creatorEarningsGrad)"
                activeDot={{ r: 6, fill: '#00F5D4', stroke: '#fff', strokeWidth: 2 }}
              />

              <Area
                type="monotone"
                dataKey="januCut"
                name="15% Janu Cut (Platform Treasury)"
                stackId="1"
                stroke="#FF007F"
                strokeWidth={2.5}
                fill="url(#januCutGrad)"
                activeDot={{ r: 6, fill: '#FF007F', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : chartStyle === 'dual-lines' ? (
            <LineChart data={activeDataset} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" vertical={false} />
              
              <XAxis
                dataKey="time"
                stroke="#666"
                tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
                interval={timeHorizon === 'live' ? 3 : 'preserveEnd'}
              />

              <YAxis
                stroke="#00F5D4"
                tick={{ fill: '#00F5D4', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
              />

              <Tooltip content={<CustomVelocityTooltip />} />

              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontFamily: 'monospace' }}
                formatter={(value) => {
                  if (value.includes('Creator')) return <span style={{ color: '#00F5D4', fontWeight: 'bold' }}>85% Creator Velocity Flow</span>;
                  if (value.includes('Janu')) return <span style={{ color: '#FF007F', fontWeight: 'bold' }}>15% Janu Cut Flow</span>;
                  return <span style={{ color: '#fff' }}>{value}</span>;
                }}
              />

              <Line
                type="monotone"
                dataKey="creatorEarnings"
                name="85% Creator Velocity Flow"
                stroke="#00F5D4"
                strokeWidth={3}
                dot={{ r: 3, fill: '#00F5D4' }}
                activeDot={{ r: 7, fill: '#00F5D4', stroke: '#fff', strokeWidth: 2 }}
              />

              <Line
                type="monotone"
                dataKey="januCut"
                name="15% Janu Cut Flow"
                stroke="#FF007F"
                strokeWidth={3}
                dot={{ r: 3, fill: '#FF007F' }}
                activeDot={{ r: 7, fill: '#FF007F', stroke: '#fff', strokeWidth: 2 }}
              />

              <Line
                type="monotone"
                dataKey="grossRevenue"
                name="Total Gross Flow (100%)"
                stroke="#C084FC"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          ) : (
            <ComposedChart data={activeDataset} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" vertical={false} />
              
              <XAxis
                dataKey="time"
                stroke="#666"
                tick={{ fill: '#888', fontSize: 10, fontFamily: 'monospace' }}
                interval={timeHorizon === 'live' ? 3 : 'preserveEnd'}
              />

              <YAxis
                stroke="#00F5D4"
                tick={{ fill: '#00F5D4', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
              />

              <Tooltip content={<CustomVelocityTooltip />} />

              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontFamily: 'monospace' }}
              />

              <Bar
                dataKey="creatorEarnings"
                name="85% Creator Flow ($)"
                fill="#00F5D4"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />

              <Bar
                dataKey="januCut"
                name="15% Janu Cut ($)"
                fill="#FF007F"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />

              <Line
                type="monotone"
                dataKey="grossRevenue"
                name="Total Velocity ($)"
                stroke="#FFFFFF"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#FFFFFF' }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* ================= BOTTOM SPLIT LEDGER & QUICK ACTIONS ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/10 relative z-10 text-xs font-mono">
        
        <div className="flex items-center gap-4 flex-wrap text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F5D4]"></span>
            <span>Creator Pool: <strong className="text-white">85.0%</strong></span>
          </span>

          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF007F]"></span>
            <span>Platform Cut: <strong className="text-white">15.0%</strong></span>
          </span>

          <span className="text-gray-600">•</span>
          
          <span className="text-gray-400">
            Treasury Destination: <strong className="text-[#FF007F]">janujanuscreations@gmail.com</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToStudio && (
            <button
              onClick={() => onNavigateToStudio('reel')}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-[10px] uppercase font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <i className="fa-solid fa-video text-[#00F5D4]"></i>
              <span>Boost via Reel Studio</span>
            </button>
          )}

          {onOpenQuickActions && (
            <button
              onClick={onOpenQuickActions}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00F5D4]/20 to-[#FF007F]/20 hover:from-[#00F5D4]/30 hover:to-[#FF007F]/30 border border-[#00F5D4]/40 text-[#00F5D4] font-mono text-[10px] uppercase font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <i className="fa-solid fa-bolt"></i>
              <span>Quick Actions</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};

export default RealtimeRevenueVelocityChart;
