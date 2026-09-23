import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { DailyRevenuePoint, Last30DaysRevenueSummary } from '../types';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';

interface DailyRevenueTrendsChartProps {
  summary?: Last30DaysRevenueSummary | null;
  className?: string;
  onRefresh?: () => void;
  isSyncing?: boolean;
}

type ChartViewType = 'area' | 'categories' | 'split' | 'bars';
type TimeRangeType = '7d' | '14d' | '30d';

interface ProcessedDataPoint extends DailyRevenuePoint {
  netCreator: number;
  platformCut: number;
  movingAverage: number;
  formattedAmount: string;
}

export const DailyRevenueTrendsChart: React.FC<DailyRevenueTrendsChartProps> = ({
  summary,
  className = '',
  onRefresh,
  isSyncing = false
}) => {
  const [viewType, setViewType] = useState<ChartViewType>('area');
  const [timeRange, setTimeRange] = useState<TimeRangeType>('30d');
  const [showMovingAvg, setShowMovingAvg] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const rawDailyPoints = useMemo(() => {
    return summary?.dailyBreakdown || [];
  }, [summary]);

  // Compute moving averages and derived fields
  const processedData = useMemo<ProcessedDataPoint[]>(() => {
    if (rawDailyPoints.length === 0) return [];

    let sliceCount = 30;
    if (timeRange === '7d') sliceCount = 7;
    else if (timeRange === '14d') sliceCount = 14;

    const sliced = rawDailyPoints.slice(-sliceCount);

    return sliced.map((dp, idx, arr) => {
      // 7-day rolling window for moving average
      const windowStart = Math.max(0, idx - 6);
      const windowPoints = arr.slice(windowStart, idx + 1);
      const windowSum = windowPoints.reduce((acc, curr) => acc + curr.amount, 0);
      const movingAverage = +(windowSum / windowPoints.length).toFixed(2);

      const netCreator = +(dp.amount * 0.85).toFixed(2);
      const platformCut = +(dp.amount * 0.15).toFixed(2);

      return {
        ...dp,
        netCreator,
        platformCut,
        movingAverage,
        formattedAmount: `$${dp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      };
    });
  }, [rawDailyPoints, timeRange]);

  // Key KPI calculations for chart header
  const totalPeriodRevenue = useMemo(() => {
    return processedData.reduce((acc, curr) => acc + curr.amount, 0);
  }, [processedData]);

  const peakDayPoint = useMemo(() => {
    if (processedData.length === 0) return null;
    return processedData.reduce((max, curr) => (curr.amount > (max?.amount || 0) ? curr : max), processedData[0]);
  }, [processedData]);

  const averageDaily = useMemo(() => {
    if (processedData.length === 0) return 0;
    return +(totalPeriodRevenue / processedData.length).toFixed(2);
  }, [processedData, totalPeriodRevenue]);

  const totalPeriodTxCount = useMemo(() => {
    return processedData.reduce((acc, curr) => acc + curr.count, 0);
  }, [processedData]);

  const handleExportCSV = () => {
    if (processedData.length === 0) return;
    bossAudio.playSubtlePing();
    const headers = 'Date,Label,Total_Inflow_USD,Net_Creator_85_USD,Platform_Cut_15_USD,Live_Tips_USD,Royalties_USD,Contests_USD,Gateway_USD,Transactions_Count\n';
    const rows = processedData.map(p =>
      `"${p.date}","${p.label}",${p.amount.toFixed(2)},${p.netCreator.toFixed(2)},${p.platformCut.toFixed(2)},${p.tips.toFixed(2)},${p.royalties.toFixed(2)},${p.contests.toFixed(2)},${p.gateway.toFixed(2)},${p.count}`
    );
    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Janus_Daily_Revenue_Trends_${timeRange}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNeonExplosion({
      particleCount: 35,
      origin: { x: 0.5, y: 0.4 },
      intensity: 'low'
    });
  };

  // Custom Glassmorphic Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: ProcessedDataPoint = payload[0].payload;
      return (
        <div className="p-4 rounded-2xl bg-[#09090b]/95 border border-[#00F5D4]/40 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-xs font-mono min-w-[240px]">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10">
            <span className="font-bold text-white text-sm flex items-center gap-1.5">
              <i className="fa-solid fa-calendar-day text-[#00F5D4]"></i>
              <span>{data.label}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-gray-300 text-[10px]">
              {data.count} txns
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Daily Inflow:</span>
              <span className="text-[#00F5D4] font-bold text-sm">
                ${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4]"></span>
                Net Creator (85%):
              </span>
              <span className="text-gray-200 font-semibold">
                ${data.netCreator.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC]"></span>
                Boss Cut (15%):
              </span>
              <span className="text-[#C084FC] font-semibold">
                ${data.platformCut.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {showMovingAvg && (
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5 text-amber-300">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  7-Day Trendline:
                </span>
                <span>${data.movingAverage.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Stream Breakdown Sub-pills */}
          <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2.5 border-t border-white/10 text-[10px]">
            <div className="p-1.5 rounded-lg bg-white/5 flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1">
                <i className="fa-solid fa-heart text-[#00F5D4] text-[9px]"></i> Tips:
              </span>
              <span className="text-white font-bold">${data.tips.toFixed(0)}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-white/5 flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1">
                <i className="fa-solid fa-compact-disc text-[#C084FC] text-[9px]"></i> Royalty:
              </span>
              <span className="text-white font-bold">${data.royalties.toFixed(0)}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-white/5 flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1">
                <i className="fa-solid fa-trophy text-[#FCD34D] text-[9px]"></i> Contest:
              </span>
              <span className="text-white font-bold">${data.contests.toFixed(0)}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-white/5 flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1">
                <i className="fa-brands fa-paypal text-[#38BDF8] text-[9px]"></i> Gateway:
              </span>
              <span className="text-white font-bold">${data.gateway.toFixed(0)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="daily-revenue-trends-recharts"
      className={`glass rounded-3xl border border-[#00F5D4]/30 bg-gradient-to-br from-zinc-950/95 via-black to-zinc-950/90 p-6 md:p-8 shadow-[0_12px_45px_rgba(0,0,0,0.7)] backdrop-blur-2xl transition-all duration-300 relative overflow-hidden ${className}`}
    >
      {/* Radiant Top Glow Accent */}
      <div className="absolute top-0 left-8 right-8 h-[1.5px] bg-gradient-to-r from-transparent via-[#00F5D4] to-transparent opacity-60 pointer-events-none"></div>

      {/* Header Controls & Telemetry */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-9 h-9 rounded-2xl bg-[#00F5D4]/15 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.3)]">
              <i className="fa-solid fa-chart-area text-base"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg md:text-xl font-serif font-black italic text-white flex items-center gap-2">
                  <span>30-Day Daily Revenue Trends</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#00F5D4]/15 border border-[#00F5D4]/40 text-[#00F5D4] text-[10px] font-mono font-bold tracking-wider uppercase">
                  Recharts Engine
                </span>
              </div>
              <p className="text-xs font-mono text-gray-400">
                Interactive time-series visualization of verified sovereign inflows & payment settlements
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switches & Range Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Selector */}
          <div className="p-1 rounded-xl bg-black/60 border border-white/10 flex items-center text-xs font-mono">
            {(['7d', '14d', '30d'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => {
                  setTimeRange(range);
                  bossAudio.playSubtlePing();
                }}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-[#00F5D4] text-black shadow-[0_0_12px_rgba(0,245,212,0.4)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Chart Type Switches */}
          <div className="p-1 rounded-xl bg-black/60 border border-white/10 flex items-center text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewType('area')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewType === 'area' ? 'bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4]' : 'text-gray-400 hover:text-white'
              }`}
              title="Smooth Radiant Gradient Curve"
            >
              <i className="fa-solid fa-chart-area text-[11px]"></i>
              <span className="hidden sm:inline font-bold">Area</span>
            </button>
            <button
              type="button"
              onClick={() => setViewType('categories')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewType === 'categories' ? 'bg-[#C084FC]/20 border border-[#C084FC] text-[#C084FC]' : 'text-gray-400 hover:text-white'
              }`}
              title="Stacked Category Streams"
            >
              <i className="fa-solid fa-layer-group text-[11px]"></i>
              <span className="hidden sm:inline font-bold">Streams</span>
            </button>
            <button
              type="button"
              onClick={() => setViewType('split')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewType === 'split' ? 'bg-[#FF007F]/20 border border-[#FF007F] text-[#FF007F]' : 'text-gray-400 hover:text-white'
              }`}
              title="Gross Inflows vs 85% Creator Net vs 15% Platform"
            >
              <i className="fa-solid fa-code-compare text-[11px]"></i>
              <span className="hidden sm:inline font-bold">Split</span>
            </button>
            <button
              type="button"
              onClick={() => setViewType('bars')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewType === 'bars' ? 'bg-[#38BDF8]/20 border border-[#38BDF8] text-[#38BDF8]' : 'text-gray-400 hover:text-white'
              }`}
              title="Daily Inflow Volume Bars"
            >
              <i className="fa-solid fa-chart-simple text-[11px]"></i>
              <span className="hidden sm:inline font-bold">Bars</span>
            </button>
          </div>

          {/* Quick Actions (CSV Export, Moving Average Toggle, Grid Toggle) */}
          <button
            type="button"
            onClick={() => setShowMovingAvg(!showMovingAvg)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all flex items-center gap-1 cursor-pointer ${
              showMovingAvg ? 'bg-amber-400/15 border-amber-400/50 text-amber-300' : 'bg-white/5 border-white/10 text-gray-400'
            }`}
            title="Toggle 7-Day Rolling Trendline"
          >
            <i className="fa-solid fa-bezier-curve text-[10px]"></i>
            <span className="hidden md:inline">7D Avg</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#00F5D4]/15 border border-white/10 hover:border-[#00F5D4]/40 text-gray-300 hover:text-[#00F5D4] text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download daily revenue dataset as CSV"
          >
            <i className="fa-solid fa-download text-[11px]"></i>
            <span className="hidden sm:inline">Export</span>
          </button>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isSyncing}
              className="p-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-mono transition-all cursor-pointer disabled:opacity-50"
              title="Refresh Firestore records"
            >
              <i className={`fa-solid fa-rotate ${isSyncing ? 'animate-spin text-[#00F5D4]' : ''}`}></i>
            </button>
          )}
        </div>
      </div>

      {/* Key Metric Highlights Header Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 relative overflow-hidden">
          <span className="text-[10px] font-mono text-gray-400 uppercase font-bold block mb-0.5">
            {timeRange.toUpperCase()} Selected Revenue
          </span>
          <p className="text-xl sm:text-2xl font-serif font-black text-white">
            ${totalPeriodRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[9px] font-mono text-[#00F5D4] flex items-center gap-1 mt-0.5">
            <i className="fa-solid fa-arrow-trend-up text-[8px]"></i>
            <span>Active Settlement Inflows</span>
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 relative overflow-hidden">
          <span className="text-[10px] font-mono text-gray-400 uppercase font-bold block mb-0.5">
            Peak Inflow Day
          </span>
          <p className="text-xl sm:text-2xl font-serif font-black text-[#00F5D4]">
            ${(peakDayPoint?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[9px] font-mono text-gray-400 block mt-0.5 truncate">
            {peakDayPoint?.label || 'N/A'} ({peakDayPoint?.count || 0} txns)
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 relative overflow-hidden">
          <span className="text-[10px] font-mono text-gray-400 uppercase font-bold block mb-0.5">
            Daily Run-Rate Avg
          </span>
          <p className="text-xl sm:text-2xl font-serif font-black text-white">
            ${averageDaily.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[9px] font-mono text-[#C084FC] block mt-0.5">
            ${(averageDaily * 0.15).toFixed(2)}/day Platform Cut
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 relative overflow-hidden">
          <span className="text-[10px] font-mono text-gray-400 uppercase font-bold block mb-0.5">
            Transaction Velocity
          </span>
          <p className="text-xl sm:text-2xl font-serif font-black text-white">
            {totalPeriodTxCount}
          </p>
          <span className="text-[9px] font-mono text-gray-400 block mt-0.5">
            Avg: ${totalPeriodTxCount > 0 ? (totalPeriodRevenue / totalPeriodTxCount).toFixed(2) : '0.00'} / txn
          </span>
        </div>
      </div>

      {/* Main Recharts Visual Canvas Container */}
      <div className="w-full h-80 sm:h-96 relative pt-2">
        {processedData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 text-gray-500 font-mono text-xs">
            <i className="fa-solid fa-chart-line text-3xl mb-2 opacity-30 text-[#00F5D4]"></i>
            <span>No daily revenue data points available for this period.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {viewType === 'area' ? (
              <AreaChart data={processedData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="areaRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F5D4" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#00F5D4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="areaNetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C084FC" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#C084FC" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />}
                
                <XAxis
                  dataKey="label"
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#ffffff15' }}
                />
                <YAxis
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#ffffff15' }}
                  tickFormatter={(val) => `$${val}`}
                />
                
                <Tooltip content={<CustomTooltip />} />

                {peakDayPoint && (
                  <ReferenceLine
                    y={peakDayPoint.amount}
                    stroke="#00F5D4"
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    label={{
                      value: `Peak: $${peakDayPoint.amount.toFixed(0)}`,
                      fill: '#00F5D4',
                      fontSize: 10,
                      position: 'top',
                      fontFamily: 'monospace'
                    }}
                  />
                )}

                <Area
                  type="monotone"
                  dataKey="amount"
                  name="Total Daily Revenue"
                  stroke="#00F5D4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaRevenueGradient)"
                  activeDot={{ r: 6, fill: '#00F5D4', stroke: '#ffffff', strokeWidth: 2 }}
                />

                {showMovingAvg && (
                  <Line
                    type="monotone"
                    dataKey="movingAverage"
                    name="7-Day Rolling Trend"
                    stroke="#FBBF24"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                )}
              </AreaChart>
            ) : viewType === 'categories' ? (
              <AreaChart data={processedData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradTips" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F5D4" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#00F5D4" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradRoyalties" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C084FC" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#C084FC" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradContests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FCD34D" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#FCD34D" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradGateway" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />}
                
                <XAxis
                  dataKey="label"
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#ffffff15' }}
                />
                <YAxis
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#ffffff15' }}
                  tickFormatter={(val) => `$${val}`}
                />
                
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontFamily: 'monospace' }}
                />

                <Area type="monotone" dataKey="tips" stackId="1" name="Live Tips" stroke="#00F5D4" fill="url(#gradTips)" />
                <Area type="monotone" dataKey="royalties" stackId="1" name="Royalties" stroke="#C084FC" fill="url(#gradRoyalties)" />
                <Area type="monotone" dataKey="contests" stackId="1" name="Contests" stroke="#FCD34D" fill="url(#gradContests)" />
                <Area type="monotone" dataKey="gateway" stackId="1" name="Gateway" stroke="#38BDF8" fill="url(#gradGateway)" />
              </AreaChart>
            ) : viewType === 'split' ? (
              <LineChart data={processedData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />}
                
                <XAxis
                  dataKey="label"
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#ffffff15' }}
                />
                <YAxis
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#ffffff15' }}
                  tickFormatter={(val) => `$${val}`}
                />
                
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontFamily: 'monospace' }}
                />

                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Gross Inflow (100%)"
                  stroke="#00F5D4"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#00F5D4' }}
                />
                <Line
                  type="monotone"
                  dataKey="netCreator"
                  name="Net Creator (85%)"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                  dot={{ r: 2, fill: '#38BDF8' }}
                />
                <Line
                  type="monotone"
                  dataKey="platformCut"
                  name="Boss Split (15%)"
                  stroke="#FF007F"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#FF007F' }}
                />
              </LineChart>
            ) : (
              <BarChart data={processedData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00F5D4" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#00F5D4" stopOpacity={0.2} />
                  </linearGradient>
                </defs>

                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />}
                
                <XAxis
                  dataKey="label"
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#ffffff15' }}
                />
                <YAxis
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#ffffff15' }}
                  tickFormatter={(val) => `$${val}`}
                />
                
                <Tooltip content={<CustomTooltip />} />

                <Bar
                  dataKey="amount"
                  name="Daily Inflow ($)"
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                />

                {showMovingAvg && (
                  <Line
                    type="monotone"
                    dataKey="movingAverage"
                    name="7-Day Rolling Trend"
                    stroke="#FBBF24"
                    strokeWidth={2.5}
                    dot={false}
                  />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Category Legend & Stream Distribution Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-white/10 text-xs font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-gray-500 font-bold uppercase text-[10px]">Streams:</span>
          <div className="flex items-center gap-1.5 text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F5D4] shadow-[0_0_6px_#00F5D4]"></span>
            <span>Live Tips</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C084FC] shadow-[0_0_6px_#C084FC]"></span>
            <span>Royalties</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FCD34D] shadow-[0_0_6px_#FCD34D]"></span>
            <span>Contests</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] shadow-[0_0_6px_#38BDF8]"></span>
            <span>Gateway Inflows</span>
          </div>
        </div>

        <div className="text-[10px] text-gray-400 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Synced with Firestore `revenue_records`</span>
        </div>
      </div>
    </div>
  );
};

export default DailyRevenueTrendsChart;
