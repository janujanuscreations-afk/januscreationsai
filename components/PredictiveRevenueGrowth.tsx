import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';

export type TimeHorizon = '24h' | '7d' | '30d' | '90d' | '6m' | '1y';
export type ForecastCadence = 'Daily' | 'Weekly' | 'Monthly';
export type VelocityPreset = 'organic' | 'viral_surge' | 'boss_broadcast' | 'conservative' | 'custom';

export interface PredictiveRevenueGrowthProps {
  currentWalletBalance?: number;
  initialTipVelocityPerHour?: number;
  onNavigateToStudio?: (tool: 'reel' | 'photo' | 'music') => void;
  onOpenQuickActions?: () => void;
  onToast?: (message: string) => void;
}

interface DataPoint {
  date: Date;
  label: string;
  cumulativeRevenue: number;
  instantVelocity: number; // $/hour
  periodVelocity: number; // $/period based on active cadence (Daily: $/day, Weekly: $/wk, Monthly: $/mo)
  confidenceUpper: number;
  confidenceLower: number;
  tipsCount: number;
  isHistorical: boolean;
}

interface MilestoneMarker {
  target: number;
  label: string;
  date?: Date;
  reached: boolean;
  color: string;
}

export const PredictiveRevenueGrowth: React.FC<PredictiveRevenueGrowthProps> = ({
  currentWalletBalance = 3840.50,
  initialTipVelocityPerHour = 48.50,
  onNavigateToStudio,
  onOpenQuickActions,
  onToast
}) => {
  // Cadence projection state (Daily | Weekly | Monthly)
  const [forecastCadence, setForecastCadence] = useState<ForecastCadence>('Daily');

  // Horizon and scenario state
  const [horizon, setHorizon] = useState<TimeHorizon>('30d');
  const [activePreset, setActivePreset] = useState<VelocityPreset>('organic');
  
  // Velocity parameters
  const [tipVelocityPerHour, setTipVelocityPerHour] = useState<number>(initialTipVelocityPerHour);
  const [tipsPerMinute, setTipsPerMinute] = useState<number>(2.4);
  const [avgTipAmount, setAvgTipAmount] = useState<number>(12.50);
  const [accelerationRate, setAccelerationRate] = useState<number>(14.5); // % weekly compounding
  const [liveStreamBoostMultiplier, setLiveStreamBoostMultiplier] = useState<number>(1.65);
  const [includeDiurnalCycles, setIncludeDiurnalCycles] = useState<boolean>(true);
  
  // Real-time live simulation state
  const [isSimulatingLiveStream, setIsSimulatingLiveStream] = useState<boolean>(false);
  const [simulatedRecentTips, setSimulatedRecentTips] = useState<Array<{ id: string; amount: number; sender: string; time: string }>>([
    { id: 'tip-1', amount: 25.00, sender: '@CyberBeats_Pro', time: '1m ago' },
    { id: 'tip-2', amount: 50.00, sender: '@NeonDiva', time: '3m ago' },
    { id: 'tip-3', amount: 10.00, sender: '@AetherVibe', time: '6m ago' },
  ]);
  const [liveTipPulse, setLiveTipPulse] = useState<number>(0);

  // Active hover tooltip data
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Milestone targets
  const [targetMilestone, setTargetMilestone] = useState<number>(25000);

  // SVG and Container Refs for D3
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Presets mapping
  const applyPreset = (preset: VelocityPreset) => {
    setActivePreset(preset);
    bossAudio.playSubtlePing();
    if (preset === 'organic') {
      setTipVelocityPerHour(48.50);
      setTipsPerMinute(2.4);
      setAvgTipAmount(12.50);
      setAccelerationRate(12.0);
      setLiveStreamBoostMultiplier(1.5);
    } else if (preset === 'viral_surge') {
      setTipVelocityPerHour(185.00);
      setTipsPerMinute(6.8);
      setAvgTipAmount(22.00);
      setAccelerationRate(28.0);
      setLiveStreamBoostMultiplier(2.4);
      triggerNeonExplosion({ particleCount: 40, origin: { x: 0.5, y: 0.3 } });
    } else if (preset === 'boss_broadcast') {
      setTipVelocityPerHour(420.00);
      setTipsPerMinute(14.5);
      setAvgTipAmount(35.00);
      setAccelerationRate(35.0);
      setLiveStreamBoostMultiplier(3.2);
      triggerNeonExplosion({ particleCount: 70, origin: { x: 0.5, y: 0.3 }, intensity: 'grand' });
    } else if (preset === 'conservative') {
      setTipVelocityPerHour(18.00);
      setTipsPerMinute(0.9);
      setAvgTipAmount(8.00);
      setAccelerationRate(4.5);
      setLiveStreamBoostMultiplier(1.1);
    }
  };

  // Switch forecast projection cadence (Daily | Weekly | Monthly)
  const handleCadenceChange = (cadence: ForecastCadence) => {
    setForecastCadence(cadence);
    bossAudio.playSubtlePing();
    
    // Auto-harmonize time horizon when appropriate for optimal visual resolution
    if (cadence === 'Daily' && (horizon === '6m' || horizon === '1y')) {
      setHorizon('30d');
    } else if (cadence === 'Weekly' && horizon === '24h') {
      setHorizon('30d');
    } else if (cadence === 'Monthly' && (horizon === '24h' || horizon === '7d')) {
      setHorizon('90d');
    }

    if (onToast) {
      onToast(`⚡ Switched to ${cadence} Forecast Projection Projection`);
    }
  };

  // Generate continuous forecast curve data based on velocity calculus & cadence
  const curveData: DataPoint[] = useMemo(() => {
    const points: DataPoint[] = [];
    const now = new Date();

    // Determine steps and duration based on horizon and active cadence
    let totalHours = 24;
    let stepHours = 1;

    if (horizon === '24h') {
      totalHours = 24;
      stepHours = 0.5; // Every 30 mins
    } else if (horizon === '7d') {
      totalHours = 7 * 24;
      stepHours = forecastCadence === 'Daily' ? 2 : 4;
    } else if (horizon === '30d') {
      totalHours = 30 * 24;
      stepHours = forecastCadence === 'Daily' ? 6 : (forecastCadence === 'Weekly' ? 12 : 24);
    } else if (horizon === '90d') {
      totalHours = 90 * 24;
      stepHours = forecastCadence === 'Monthly' ? 24 : 18;
    } else if (horizon === '6m') {
      totalHours = 180 * 24;
      stepHours = 36;
    } else if (horizon === '1y') {
      totalHours = 365 * 24;
      stepHours = 48;
    }

    // Historical starting baseline
    let cumulative = currentWalletBalance;
    const baseHourlyRate = tipVelocityPerHour + (liveTipPulse * 5);
    const hourlyGrowthFactor = Math.pow(1 + (accelerationRate / 100), 1 / (7 * 24)); // Compound hourly rate

    const steps = Math.floor(totalHours / stepHours);

    for (let i = 0; i <= steps; i++) {
      const hoursElapsed = i * stepHours;
      const pointDate = new Date(now.getTime() + hoursElapsed * 3600 * 1000);

      // Hourly compounding velocity
      const compoundedVelocity = baseHourlyRate * Math.pow(hourlyGrowthFactor, hoursElapsed) * liveStreamBoostMultiplier;
      
      // Circadian / diurnal oscillation (peak evenings around 8pm UTC)
      const hourOfDay = pointDate.getUTCHours();
      const diurnalOscillation = includeDiurnalCycles ? (0.75 + 0.35 * Math.sin(((hourOfDay - 6) / 24) * 2 * Math.PI)) : 1.0;
      const currentHourlyRate = Math.max(2, compoundedVelocity * diurnalOscillation);

      // Incremental revenue step
      const stepRevenue = currentHourlyRate * stepHours;
      cumulative += stepRevenue;

      // Confidence intervals expand over forecast distance
      const distanceRatio = hoursElapsed / totalHours;
      const uncertaintySpread = 0.04 + (distanceRatio * 0.22);
      const upper = cumulative * (1 + uncertaintySpread);
      const lower = Math.max(currentWalletBalance, cumulative * (1 - uncertaintySpread));

      // Estimated total tips count in step
      const tipsStep = Math.round((stepRevenue / avgTipAmount));

      // Cadence-specific projected velocity
      let cadenceVelocity = currentHourlyRate * 24; // Daily default
      if (forecastCadence === 'Weekly') {
        cadenceVelocity = currentHourlyRate * 24 * 7;
      } else if (forecastCadence === 'Monthly') {
        cadenceVelocity = currentHourlyRate * 24 * 30.416;
      }

      // Format label tailored to cadence & horizon
      let label = '';
      if (forecastCadence === 'Daily') {
        if (horizon === '24h') {
          label = pointDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          label = pointDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
      } else if (forecastCadence === 'Weekly') {
        const weekNum = Math.floor(hoursElapsed / (24 * 7)) + 1;
        label = `Wk ${weekNum} (${pointDate.toLocaleDateString([], { month: 'short', day: 'numeric' })})`;
      } else {
        label = pointDate.toLocaleDateString([], { month: 'short', year: '2-digit' });
      }

      points.push({
        date: pointDate,
        label,
        cumulativeRevenue: Math.round(cumulative * 100) / 100,
        instantVelocity: Math.round(currentHourlyRate * 100) / 100,
        periodVelocity: Math.round(cadenceVelocity * 100) / 100,
        confidenceUpper: Math.round(upper * 100) / 100,
        confidenceLower: Math.round(lower * 100) / 100,
        tipsCount: tipsStep,
        isHistorical: i === 0
      });
    }

    return points;
  }, [
    horizon,
    forecastCadence,
    currentWalletBalance,
    tipVelocityPerHour,
    accelerationRate,
    liveStreamBoostMultiplier,
    includeDiurnalCycles,
    avgTipAmount,
    liveTipPulse
  ]);

  // Milestone projections calculation
  const milestoneProjections: MilestoneMarker[] = useMemo(() => {
    const milestones = [
      { target: 10000, label: '$10k Milestone', color: '#00F5D4' },
      { target: 25000, label: '$25k Sovereign Scale', color: '#C084FC' },
      { target: 50000, label: '$50k Elite Creator Tier', color: '#FF007F' },
      { target: 100000, label: '$100k Boss Grandmaster', color: '#FCD34D' },
    ];

    return milestones.map(m => {
      const match = curveData.find(p => p.cumulativeRevenue >= m.target);
      return {
        ...m,
        date: match?.date,
        reached: Boolean(match)
      };
    });
  }, [curveData]);

  // Summary Metrics
  const finalPoint = curveData[curveData.length - 1];
  const initialPoint = curveData[0];
  const projectedNetGain = (finalPoint?.cumulativeRevenue || 0) - (initialPoint?.cumulativeRevenue || 0);
  const peakHourlyVelocity = Math.max(...curveData.map(d => d.instantVelocity));
  const finalDailyRunRate = (finalPoint?.instantVelocity || 0) * 24;
  const finalWeeklyRunRate = (finalPoint?.instantVelocity || 0) * 24 * 7;
  const finalMonthlyRunRate = (finalPoint?.instantVelocity || 0) * 24 * 30.416;
  const creatorPayoutCut = projectedNetGain * 0.85;
  const bossTreasuryCut = projectedNetGain * 0.15;

  // D3 Chart Render Hook
  const renderD3Chart = useCallback(() => {
    if (!svgRef.current || !containerRef.current || curveData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous drawing

    const containerWidth = containerRef.current.clientWidth || 800;
    const height = 360;
    const margin = { top: 30, right: 35, bottom: 40, left: 65 };
    const width = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg
      .attr('width', containerWidth)
      .attr('height', height)
      .attr('viewBox', `0 0 ${containerWidth} ${height}`);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Definitions (Gradients & Glow Filters)
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'neon-glow').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Area fill gradient based on cadence
    const areaGradient = defs.append('linearGradient').attr('id', 'd3RevenueAreaGrad').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    const primaryNeonColor = forecastCadence === 'Daily' ? '#00F5D4' : (forecastCadence === 'Weekly' ? '#C084FC' : '#FF007F');
    const secondaryNeonColor = forecastCadence === 'Daily' ? '#C084FC' : (forecastCadence === 'Weekly' ? '#FF007F' : '#00F5D4');

    areaGradient.append('stop').attr('offset', '0%').attr('stop-color', primaryNeonColor).attr('stop-opacity', 0.45);
    areaGradient.append('stop').attr('offset', '50%').attr('stop-color', secondaryNeonColor).attr('stop-opacity', 0.15);
    areaGradient.append('stop').attr('offset', '100%').attr('stop-color', primaryNeonColor).attr('stop-opacity', 0.0);

    // Confidence interval gradient
    const confGradient = defs.append('linearGradient').attr('id', 'd3ConfidenceGrad').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    confGradient.append('stop').attr('offset', '0%').attr('stop-color', '#C084FC').attr('stop-opacity', 0.20);
    confGradient.append('stop').attr('offset', '100%').attr('stop-color', '#C084FC').attr('stop-opacity', 0.03);

    // Scales
    const xExtent = d3.extent(curveData, d => d.date) as [Date, Date];
    const xScale = d3.scaleTime().domain(xExtent).range([0, width]);

    const yMax = d3.max(curveData, d => d.confidenceUpper) || 10000;
    const yMin = Math.max(0, (d3.min(curveData, d => d.confidenceLower) || 0) * 0.9);
    const yScale = d3.scaleLinear().domain([yMin, yMax * 1.08]).range([innerHeight, 0]);

    // Gridlines
    const yAxisGrid = d3.axisLeft(yScale).tickSize(-width).tickFormat(() => '').ticks(6);
    g.append('g')
      .attr('class', 'grid')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', '#ffffff10')
      .attr('stroke-dasharray', '3,3');

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(width < 500 ? 4 : 7)
      .tickFormat(d => {
        const date = d as Date;
        if (forecastCadence === 'Daily') {
          if (horizon === '24h') {
            return d3.timeFormat('%H:%M')(date);
          }
          return d3.timeFormat('%b %d')(date);
        } else if (forecastCadence === 'Weekly') {
          return d3.timeFormat('%b %d')(date);
        } else {
          return d3.timeFormat('%b %y')(date);
        }
      });

    const yAxis = d3.axisLeft(yScale)
      .ticks(6)
      .tickFormat(d => {
        const val = Number(d);
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
        return `$${val}`;
      });

    // Append X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#9ca3af')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    g.select('.domain').attr('stroke', '#ffffff20');

    // Append Y Axis
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#9ca3af')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Draw Confidence Interval Band
    const confidenceArea = d3.area<DataPoint>()
      .x(d => xScale(d.date))
      .y0(d => yScale(d.confidenceLower))
      .y1(d => yScale(d.confidenceUpper))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(curveData)
      .attr('fill', 'url(#d3ConfidenceGrad)')
      .attr('stroke', '#C084FC')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('stroke-opacity', 0.6)
      .attr('d', confidenceArea);

    // Draw Cumulative Revenue Area Fill
    const revenueArea = d3.area<DataPoint>()
      .x(d => xScale(d.date))
      .y0(innerHeight)
      .y1(d => yScale(d.cumulativeRevenue))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(curveData)
      .attr('fill', 'url(#d3RevenueAreaGrad)')
      .attr('d', revenueArea);

    // Draw Main Forecast Trajectory Line
    const revenueLine = d3.line<DataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.cumulativeRevenue))
      .curve(d3.curveMonotoneX);

    const path = g.append('path')
      .datum(curveData)
      .attr('fill', 'none')
      .attr('stroke', primaryNeonColor)
      .attr('stroke-width', 3.5)
      .attr('filter', 'url(#neon-glow)')
      .attr('d', revenueLine);

    // Animated Path Entrance Transition
    const pathLength = (path.node() as SVGPathElement)?.getTotalLength() || 1000;
    path
      .attr('stroke-dasharray', `${pathLength} ${pathLength}`)
      .attr('stroke-dashoffset', pathLength)
      .transition()
      .duration(900)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // Milestone Target Intersect Lines
    milestoneProjections.forEach(m => {
      if (m.reached && m.date && m.target >= yMin && m.target <= yMax) {
        const yPos = yScale(m.target);
        const xPos = xScale(m.date);

        // Horizontal dashed threshold
        g.append('line')
          .attr('x1', 0)
          .attr('y1', yPos)
          .attr('x2', width)
          .attr('y2', yPos)
          .attr('stroke', m.color)
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '6,6')
          .attr('stroke-opacity', 0.4);

        // Marker Point
        g.append('circle')
          .attr('cx', xPos)
          .attr('cy', yPos)
          .attr('r', 5)
          .attr('fill', m.color)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2)
          .attr('filter', 'url(#neon-glow)');

        // Milestone Pill Text
        g.append('text')
          .attr('x', xPos + 8)
          .attr('y', yPos - 6)
          .attr('fill', m.color)
          .attr('font-size', '9px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .text(`${m.label} (${d3.timeFormat('%b %d')(m.date)})`);
      }
    });

    // Start / Now Current Wallet Balance Dot
    if (curveData[0]) {
      g.append('circle')
        .attr('cx', xScale(curveData[0].date))
        .attr('cy', yScale(curveData[0].cumulativeRevenue))
        .attr('r', 6)
        .attr('fill', '#FF007F')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .attr('filter', 'url(#neon-glow)');
    }

    // Interactive Hover Elements
    const focusGroup = g.append('g').style('display', 'none');

    // Vertical cursor line
    const focusLine = focusGroup.append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', primaryNeonColor)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3');

    // Focus dots for main point, upper, and lower
    const focusDot = focusGroup.append('circle')
      .attr('r', 6)
      .attr('fill', primaryNeonColor)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#neon-glow)');

    const focusUpperDot = focusGroup.append('circle')
      .attr('r', 4)
      .attr('fill', '#C084FC')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1);

    const focusLowerDot = focusGroup.append('circle')
      .attr('r', 4)
      .attr('fill', '#6b7280')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1);

    // Bisector for tracking mouse to nearest data point
    const bisectDate = d3.bisector<DataPoint, Date>(d => d.date).left;

    // Mouse Overlay Rect
    g.append('rect')
      .attr('class', 'overlay')
      .attr('width', width)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseover', () => focusGroup.style('display', null))
      .on('mouseout', () => {
        focusGroup.style('display', 'none');
        setHoveredPoint(null);
        setTooltipPos(null);
      })
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const x0 = xScale.invert(mx);
        const index = bisectDate(curveData, x0, 1);
        const d0 = curveData[index - 1];
        const d1 = curveData[index];
        let d = d0;
        if (d1 && d0) {
          d = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;
        }

        if (d) {
          const cx = xScale(d.date);
          const cy = yScale(d.cumulativeRevenue);
          const cyUpper = yScale(d.confidenceUpper);
          const cyLower = yScale(d.confidenceLower);

          focusLine.attr('x1', cx).attr('x2', cx);
          focusDot.attr('cx', cx).attr('cy', cy);
          focusUpperDot.attr('cx', cx).attr('cy', cyUpper);
          focusLowerDot.attr('cx', cx).attr('cy', cyLower);

          setHoveredPoint(d);
          setTooltipPos({
            x: cx + margin.left,
            y: cy + margin.top
          });
        }
      });

  }, [curveData, horizon, forecastCadence, milestoneProjections]);

  // ResizeObserver and effect to re-render D3
  useEffect(() => {
    renderD3Chart();

    const handleResize = () => {
      renderD3Chart();
    };

    const ro = new ResizeObserver(() => {
      handleResize();
    });

    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
    };
  }, [renderD3Chart]);

  // Handle Simulate Instant Live Tip Surge
  const handleSimulateTipSurge = () => {
    setIsSimulatingLiveStream(true);
    setLiveTipPulse(prev => prev + 1);
    bossAudio.playTipChime(150);

    const creators = ['@SynthWiz', '@BossJanu', '@NeonQueen', '@CyberVibe', '@SonicAlchemist', '@VocalGoddess'];
    const randomCreator = creators[Math.floor(Math.random() * creators.length)];
    const randomAmount = [10, 25, 50, 100, 250][Math.floor(Math.random() * 5)];

    const newTip = {
      id: `tip-${Date.now()}`,
      amount: randomAmount,
      sender: randomCreator,
      time: 'Just now'
    };

    setSimulatedRecentTips(prev => [newTip, ...prev.slice(0, 4)]);

    triggerNeonExplosion({
      particleCount: 50,
      origin: { x: 0.5, y: 0.4 },
      intensity: 'high'
    });

    if (onToast) {
      onToast(`🔥 Live Tip Velocity Spike! +$${randomAmount.toFixed(2)} from ${randomCreator}`);
    }

    setTimeout(() => {
      setIsSimulatingLiveStream(false);
    }, 1200);
  };

  return (
    <div className="glass p-6 sm:p-8 rounded-[2.5rem] border border-[#00F5D4]/40 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 space-y-6 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
      
      {/* Background Cyber Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-64 bg-[#00F5D4]/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-64 bg-[#C084FC]/15 rounded-full blur-[120px] pointer-events-none"></div>

      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10 relative z-10">
        
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-[#00F5D4]/15 border border-[#00F5D4]/40 text-[#00F5D4] text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,245,212,0.25)]">
              <i className="fa-solid fa-bolt animate-pulse text-[#00F5D4]"></i>
              <span>D3.js Dynamic Velocity Engine</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#C084FC]/10 border border-[#C084FC]/30 text-[#C084FC] text-[10px] font-mono">
              Continuous Calculus Modeling
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[10px] font-mono">
              Live Tip Speed: <strong className="text-white">${tipVelocityPerHour.toFixed(2)}/hr</strong>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#00F5D4]/10 to-[#C084FC]/10 border border-[#00F5D4]/30 text-white text-[10px] font-mono font-bold">
              Cadence: <span className="text-[#00F5D4]">{forecastCadence}</span>
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-serif font-black italic text-white tracking-tight">
            Predictive Revenue Growth & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F]">Tip Velocity Forecast</span>
          </h3>

          <p className="text-xs sm:text-sm font-mono text-gray-400 max-w-2xl leading-relaxed">
            Real-time D3.js vector engine projecting cumulative earnings trajectories based on micro-tip frequency, live broadcast surges, and viral compounding velocity across daily, weekly, and monthly forecast horizons.
          </p>
        </div>

        {/* Action Toolbar: Daily/Weekly/Monthly Cadence Toggle, Horizon Switcher & Velocity Injector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          
          {/* ================= PROJECTION CADENCE TOGGLE INTERFACE (Daily / Weekly / Monthly) ================= */}
          <div className="flex items-center bg-black/90 border border-white/20 p-1 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            {[
              { id: 'Daily', label: 'Daily', icon: 'fa-sun', color: '#00F5D4', sub: '24h / day pace' },
              { id: 'Weekly', label: 'Weekly', icon: 'fa-calendar-week', color: '#C084FC', sub: '7-day compounding' },
              { id: 'Monthly', label: 'Monthly', icon: 'fa-calendar-days', color: '#FF007F', sub: '30-day sovereign tier' }
            ].map((cad) => {
              const isSelected = forecastCadence === cad.id;
              return (
                <button
                  key={cad.id}
                  onClick={() => handleCadenceChange(cad.id as ForecastCadence)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-white/15 text-white border border-white/40 shadow-lg'
                      : 'text-gray-400 hover:text-white border border-transparent'
                  }`}
                  style={{
                    boxShadow: isSelected ? `0 0 16px ${cad.color}45` : undefined,
                    borderColor: isSelected ? `${cad.color}90` : undefined
                  }}
                  title={`Switch to ${cad.label} forecast projections (${cad.sub})`}
                >
                  <i
                    className={`fa-solid ${cad.icon} text-xs`}
                    style={{ color: isSelected ? cad.color : '#9ca3af' }}
                  ></i>
                  <span className={isSelected ? 'text-white font-black' : ''}>{cad.label}</span>
                </button>
              );
            })}
          </div>

          {/* Horizon Pills */}
          <div className="flex items-center bg-black/80 border border-white/15 p-1 rounded-2xl">
            {(['24h', '7d', '30d', '90d', '6m', '1y'] as TimeHorizon[]).map((hz) => (
              <button
                key={hz}
                onClick={() => {
                  setHorizon(hz);
                  bossAudio.playSubtlePing();
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  horizon === hz
                    ? 'bg-[#00F5D4] text-black font-black shadow-[0_0_12px_rgba(0,245,212,0.4)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {hz}
              </button>
            ))}
          </div>

          {/* Simulate Live Tip Spike Button */}
          <button
            onClick={handleSimulateTipSurge}
            disabled={isSimulatingLiveStream}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-mono font-black text-xs uppercase tracking-wider transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,0,127,0.4)] cursor-pointer flex items-center gap-2"
          >
            <i className={`fa-solid fa-bolt ${isSimulatingLiveStream ? 'animate-spin' : ''}`}></i>
            <span>{isSimulatingLiveStream ? 'Tipping Spike...' : 'Simulate Live Tip'}</span>
          </button>

        </div>

      </div>

      {/* ================= VELOCITY PRESET BUTTONS ================= */}
      <div className="flex items-center justify-between flex-wrap gap-3 relative z-10">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold mr-1 shrink-0">
            Presets:
          </span>
          {[
            { id: 'organic', label: 'Organic Velocity ($48/hr)', icon: 'fa-seedling', color: '#00F5D4' },
            { id: 'viral_surge', label: 'Viral Reel Surge ($185/hr)', icon: 'fa-fire-flame-curved', color: '#FF007F' },
            { id: 'boss_broadcast', label: 'Boss Live Mega-Stream ($420/hr)', icon: 'fa-tower-broadcast', color: '#FCD34D' },
            { id: 'conservative', label: 'Conservative Floor ($18/hr)', icon: 'fa-shield-halved', color: '#94A3B8' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id as VelocityPreset)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                activePreset === p.id
                  ? 'bg-white/15 border-white/40 text-white shadow-lg'
                  : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <i className={`fa-solid ${p.icon}`} style={{ color: p.color }}></i>
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Diurnal Cycles Toggle */}
        <label className="flex items-center gap-2 text-xs font-mono text-gray-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeDiurnalCycles}
            onChange={e => {
              setIncludeDiurnalCycles(e.target.checked);
              bossAudio.playSubtlePing();
            }}
            className="accent-[#00F5D4] rounded"
          />
          <span>Diurnal Day/Night Cyclical Oscillations</span>
        </label>
      </div>

      {/* ================= KEY FORECAST KPI METRICS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 relative z-10">
        
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#00F5D4]/40 transition-all">
          <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
            Projected End Balance
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-mono font-black text-[#00F5D4]">
              ${(finalPoint?.cumulativeRevenue || 0).toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] font-mono text-green-400 block mt-0.5">
            +${Math.round(projectedNetGain).toLocaleString()} in {horizon}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#C084FC]/40 transition-all">
          <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
            {forecastCadence} Tip Inflow
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-mono font-black text-[#C084FC]">
              ${forecastCadence === 'Daily'
                ? (tipVelocityPerHour * 24).toLocaleString(undefined, { maximumFractionDigits: 0 })
                : (forecastCadence === 'Weekly'
                  ? Math.round(tipVelocityPerHour * 24 * 7).toLocaleString()
                  : Math.round(tipVelocityPerHour * 24 * 30.416).toLocaleString())}
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              /{forecastCadence === 'Daily' ? 'day' : (forecastCadence === 'Weekly' ? 'wk' : 'mo')}
            </span>
          </div>
          <span className="text-[10px] font-mono text-gray-300 block mt-0.5">
            ${tipVelocityPerHour.toFixed(2)}/hr base
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#FF007F]/40 transition-all">
          <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
            Peak {forecastCadence} Velocity
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-mono font-black text-white">
              ${forecastCadence === 'Daily'
                ? Math.round(finalDailyRunRate).toLocaleString()
                : (forecastCadence === 'Weekly'
                  ? Math.round(finalWeeklyRunRate).toLocaleString()
                  : Math.round(finalMonthlyRunRate).toLocaleString())}
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              /{forecastCadence === 'Daily' ? 'day' : (forecastCadence === 'Weekly' ? 'wk' : 'mo')}
            </span>
          </div>
          <span className="text-[10px] font-mono text-green-400 block mt-0.5">
            ${peakHourlyVelocity.toFixed(0)}/hr peak instantaneous
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#FCD34D]/40 transition-all">
          <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
            Creator Net Take-Home (85%)
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-mono font-black text-[#FCD34D]">
              ${Math.round(creatorPayoutCut).toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] font-mono text-gray-400 block mt-0.5">
            Direct instant disbursement
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#818CF8]/40 transition-all">
          <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
            Boss Multi-Sig Cut (15%)
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-mono font-black text-[#818CF8]">
              ${Math.round(bossTreasuryCut).toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] font-mono text-gray-400 block mt-0.5">
            January Rebl Reserve
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#00F5D4]/40 transition-all">
          <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
            $25k Target ETA
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-sm sm:text-base font-mono font-black text-white truncate">
              {milestoneProjections.find(m => m.target === 25000)?.reached && milestoneProjections.find(m => m.target === 25000)?.date
                ? milestoneProjections.find(m => m.target === 25000)?.date?.toLocaleDateString([], { month: 'short', day: 'numeric' })
                : 'Projected > Horizon'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#00F5D4] block mt-0.5">
            Sovereign Milestone
          </span>
        </div>

      </div>

      {/* ================= D3.JS INTERACTIVE SVG CHART CONTAINER ================= */}
      <div className="space-y-2 relative">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-gray-400">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className={`w-3 h-1 rounded ${forecastCadence === 'Daily' ? 'bg-[#00F5D4]' : (forecastCadence === 'Weekly' ? 'bg-[#C084FC]' : 'bg-[#FF007F]')}`}></span>
              <span className="text-white font-bold">D3 {forecastCadence} Forecast Curve</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-[#C084FC]/20 border border-[#C084FC]/40"></span>
              <span>Velocity Confidence Cone</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF007F]"></span>
              <span>Current Balance (${currentWalletBalance.toFixed(2)})</span>
            </span>
          </div>

          <span className="text-[10px] text-gray-400">
            Viewing <strong className="text-white uppercase">{forecastCadence} Projection</strong> • Hover curve for {forecastCadence.toLowerCase()} interval velocity
          </span>
        </div>

        {/* D3 Canvas Holder */}
        <div ref={containerRef} className="w-full bg-black/70 rounded-3xl border border-white/10 p-2 sm:p-4 relative overflow-hidden">
          <svg ref={svgRef} className="w-full block overflow-visible"></svg>

          {/* Floating HTML Hover Tooltip */}
          {hoveredPoint && tooltipPos && (
            <div
              className="absolute z-30 pointer-events-none p-3.5 rounded-2xl bg-zinc-950/95 border text-white shadow-[0_0_30px_rgba(0,0,0,0.9)] backdrop-blur-md space-y-1.5 font-mono text-xs animate-in fade-in zoom-in-95"
              style={{
                borderColor: forecastCadence === 'Daily' ? '#00F5D4' : (forecastCadence === 'Weekly' ? '#C084FC' : '#FF007F'),
                left: `${Math.min(Math.max(tooltipPos.x - 110, 10), (containerRef.current?.clientWidth || 600) - 260)}px`,
                top: `${Math.max(tooltipPos.y - 135, 10)}px`,
                width: '250px'
              }}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1">
                <span className="text-[10px] text-gray-400 uppercase font-bold">{hoveredPoint.label}</span>
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                  style={{
                    backgroundColor: forecastCadence === 'Daily' ? 'rgba(0,245,212,0.2)' : (forecastCadence === 'Weekly' ? 'rgba(192,132,252,0.2)' : 'rgba(255,0,127,0.2)'),
                    color: forecastCadence === 'Daily' ? '#00F5D4' : (forecastCadence === 'Weekly' ? '#C084FC' : '#FF007F')
                  }}
                >
                  {hoveredPoint.isHistorical ? 'Baseline' : `${forecastCadence} Forecast`}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Cumulative Total:</span>
                <span className="text-sm font-black text-[#00F5D4]">${hoveredPoint.cumulativeRevenue.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400">{forecastCadence} Run-Rate:</span>
                <span className="text-xs font-bold text-[#C084FC]">
                  ${hoveredPoint.periodVelocity.toLocaleString()}/{forecastCadence === 'Daily' ? 'day' : (forecastCadence === 'Weekly' ? 'wk' : 'mo')}
                </span>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500">Instant Speed:</span>
                <span className="text-gray-300 font-bold">${hoveredPoint.instantVelocity}/hr (~{hoveredPoint.tipsCount} tips)</span>
              </div>

              <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1 border-t border-white/5">
                <span>Confidence Range:</span>
                <span>${hoveredPoint.confidenceLower.toLocaleString()} – ${hoveredPoint.confidenceUpper.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ================= INTERACTIVE VELOCITY CONTROLS & RECENT TIPS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 relative z-10">
        
        {/* Left Column: Interactive Parametric Sliders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-sliders text-[#00F5D4]"></i>
              <span>Live Tip Velocity & Acceleration Sliders</span>
            </h4>
            <span className="text-[10px] font-mono text-gray-400">
              Drag to re-project curve instantaneously
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Slider 1: Base Tip Velocity */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-300">Base Tip Velocity</span>
                <span className="text-sm font-mono font-black text-[#00F5D4]">${tipVelocityPerHour.toFixed(2)}/hr</span>
              </div>
              <input
                type="range"
                min={5}
                max={500}
                step={2.5}
                value={tipVelocityPerHour}
                onChange={e => {
                  setActivePreset('custom');
                  setTipVelocityPerHour(Number(e.target.value));
                  bossAudio.playSubtlePing();
                }}
                className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#00F5D4]"
              />
              <div className="flex justify-between text-[9px] font-mono text-gray-500">
                <span>$5.00/hr</span>
                <span>$500.00/hr (Viral Mega-Tier)</span>
              </div>
            </div>

            {/* Slider 2: Weekly Acceleration Rate */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-300">Compounding Acceleration</span>
                <span className="text-sm font-mono font-black text-[#C084FC]">+{accelerationRate}% / week</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                step={0.5}
                value={accelerationRate}
                onChange={e => {
                  setActivePreset('custom');
                  setAccelerationRate(Number(e.target.value));
                  bossAudio.playSubtlePing();
                }}
                className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#C084FC]"
              />
              <div className="flex justify-between text-[9px] font-mono text-gray-500">
                <span>Flat (0%)</span>
                <span>Viral Spike (+40%/wk)</span>
              </div>
            </div>

            {/* Slider 3: Average Micro-Tip Size */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-300">Average Tip Size</span>
                <span className="text-sm font-mono font-black text-[#FF007F]">${avgTipAmount.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                step={0.5}
                value={avgTipAmount}
                onChange={e => {
                  setActivePreset('custom');
                  setAvgTipAmount(Number(e.target.value));
                  bossAudio.playSubtlePing();
                }}
                className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#FF007F]"
              />
              <div className="flex justify-between text-[9px] font-mono text-gray-500">
                <span>Micro ($1.00)</span>
                <span>High-Tier Superchat ($50.00)</span>
              </div>
            </div>

            {/* Slider 4: Live Broadcast Boost Multiplier */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-300">Live Broadcast Boost</span>
                <span className="text-sm font-mono font-black text-[#FCD34D]">{liveStreamBoostMultiplier.toFixed(2)}x Velocity</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={4.0}
                step={0.05}
                value={liveStreamBoostMultiplier}
                onChange={e => {
                  setActivePreset('custom');
                  setLiveStreamBoostMultiplier(Number(e.target.value));
                  bossAudio.playSubtlePing();
                }}
                className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#FCD34D]"
              />
              <div className="flex justify-between text-[9px] font-mono text-gray-500">
                <span>1.0x (Standard)</span>
                <span>4.0x (Arena Super-Stream)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Live Inflow Feed & Velocity Equation */}
        <div className="space-y-4">
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
              <span>Live Inflow Velocity Stream</span>
            </span>
            <span className="text-[10px] text-[#00F5D4]">Active Feed</span>
          </h4>

          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2.5">
            {simulatedRecentTips.map((tip) => (
              <div key={tip.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#00F5D4]/20 text-[#00F5D4] flex items-center justify-center text-[10px]">
                    <i className="fa-solid fa-heart"></i>
                  </div>
                  <div>
                    <span className="text-white font-bold block">{tip.sender}</span>
                    <span className="text-[9px] text-gray-500">{tip.time}</span>
                  </div>
                </div>
                <span className="text-[#00F5D4] font-black">+${tip.amount.toFixed(2)}</span>
              </div>
            ))}

            <div className="pt-2 border-t border-white/10 text-[10px] font-mono text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Velocity Differential Equation:</span>
                <span className="text-[#C084FC]">v(t) = v₀ · (1 + α)ᵗ</span>
              </div>
              <p className="text-gray-500 text-[9px] leading-relaxed">
                Integrated curve mathematically compounds organic viewer inflow with live superchat burst distribution.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ================= FOOTER ACTIONS & CLIPBOARD EXPORT ================= */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-2.5 text-gray-400">
          <span className="text-[#00F5D4] flex items-center gap-1">
            <i className="fa-solid fa-check"></i>
            <span>D3.js Vector Renderer v5.2</span>
          </span>
          <span>•</span>
          <span>Projection Cadence: <strong className="text-[#00F5D4] uppercase">{forecastCadence}</strong></span>
          <span>•</span>
          <span>Horizon: <strong className="text-white uppercase">{horizon}</strong></span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const summaryText = `Janu's Creations Predictive Revenue Growth (D3 Forecast):\n- Projection Cadence: ${forecastCadence}\n- Time Horizon: ${horizon}\n- Current Tip Velocity: $${tipVelocityPerHour.toFixed(2)}/hr ($${Math.round(forecastCadence === 'Daily' ? tipVelocityPerHour * 24 : (forecastCadence === 'Weekly' ? tipVelocityPerHour * 24 * 7 : tipVelocityPerHour * 24 * 30.416)).toLocaleString()}/${forecastCadence === 'Daily' ? 'day' : (forecastCadence === 'Weekly' ? 'wk' : 'mo')})\n- Projected Total Revenue: $${(finalPoint?.cumulativeRevenue || 0).toLocaleString()}\n- Net Inflow: +$${Math.round(projectedNetGain).toLocaleString()}\n- Creator Payout (85%): $${Math.round(creatorPayoutCut).toLocaleString()}\n- Boss Vault Allocation (15%): $${Math.round(bossTreasuryCut).toLocaleString()}`;
              navigator.clipboard?.writeText?.(summaryText);
              bossAudio.playSubtlePing();
              triggerNeonExplosion({ particleCount: 35, origin: { x: 0.8, y: 0.8 } });
              if (onToast) {
                onToast(`📋 Copied D3.js ${forecastCadence} Predictive Revenue Growth Data to Clipboard!`);
              }
            }}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 hover:text-white font-bold transition-all cursor-pointer flex items-center gap-2"
          >
            <i className="fa-solid fa-copy text-[#00F5D4]"></i>
            <span>Export D3 {forecastCadence} Curve</span>
          </button>

          {onNavigateToStudio && (
            <button
              onClick={() => onNavigateToStudio('reel')}
              className="px-4 py-2 rounded-xl bg-[#00F5D4] hover:bg-[#00F5D4]/80 text-black font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-2"
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <span>Boost Tip Velocity in Studio →</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default PredictiveRevenueGrowth;
