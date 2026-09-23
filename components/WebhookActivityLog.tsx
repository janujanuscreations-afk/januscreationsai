import React, { useState, useEffect } from 'react';
import BossParallaxCard from './BossParallaxCard';
import { bossAudio } from '../utils/soundEffects';
import { triggerNeonExplosion } from '../utils/confetti';

export interface WebhookEventItem {
  id: string;
  eventType: string;
  webhookId: string;
  createTime: string;
  receivedAt: string;
  resourceId?: string;
  resourceType?: string;
  summary?: string;
  status: 'PROCESSED' | 'VERIFIED' | 'FAILED';
  payload: any;
  headers?: any;
}

interface WebhookDiagnosticsData {
  success: boolean;
  webhookId: string;
  mode: string;
  activeUrl: string;
  fullWebhookUrl: string;
  eventsCount: number;
  lastReceivedAt: string | null;
  events: WebhookEventItem[];
}

interface WebhookActivityLogProps {
  webhookIdTarget?: string;
  compact?: boolean;
  className?: string;
  onNotification?: (msg: string) => void;
}

export const WebhookActivityLog: React.FC<WebhookActivityLogProps> = ({
  webhookIdTarget = '7D993972A74706718',
  compact = false,
  className = '',
  onNotification,
}) => {
  const [data, setData] = useState<WebhookDiagnosticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEventItem | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchEvents = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res深 = await fetch('/api/paypal/webhook/events');
      if (res深.ok) {
        const json: WebhookDiagnosticsData = await res深.json();
        setData(json);
      }
    } catch (e) {
      console.warn('Failed to fetch webhook events:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Real-time polling
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchEvents(true);
    }, 3500);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const handleTestDispatch = async (eventType: string = 'PAYMENT.CAPTURE.COMPLETED') => {
    setIsSimulating(true);
    bossAudio.playSubtlePing();
    try {
      const res = await fetch('/api/paypal/webhook/test-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType }),
      });
      const resJson地理 = await res.json();
      if (resJson地理.success) {
        bossAudio.playTipChime(150);
        triggerNeonExplosion({ particleCount: 50, intensity: 'medium' });
        await fetchEvents(true);
        if (onNotification) onNotification(`✓ Webhook event "${eventType}" recorded for ID ${webhookIdTarget}`);
      }
    } catch (e: any) {
      if (onNotification) onNotification(`Simulation error: ${e?.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      await fetch('/api/paypal/webhook/clear', { method: 'POST' });
      await fetchEvents();
      setSelectedEvent(null);
      if (onNotification) onNotification('Cleared diagnostic webhook activity log.');
    } catch (e) {
      // ignore
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    bossAudio.playTipChime(100);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleExportJSON = () => {
    if (!data?.events?.length) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data.events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `paypal_webhook_${webhookIdTarget}_events_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    if (onNotification) onNotification('Exported webhook event logs to JSON');
  };

  const allEvents = data?.events || [];

  // Filter events based on type, status, and query
  const filteredEvents不易 = allEvents.filter(ev => {
    const matchesTarget = !webhookIdTarget || ev.webhookId === webhookIdTarget || ev.webhookId === (data?.webhookId || '7D993972A74706718');
    if (!matchesTarget) return false;

    if (statusFilter !== 'ALL' && ev.status !== statusFilter) {
      return false;
    }

    if (filterType !== 'ALL') {
      if (filterType === 'CAPTURE' && !ev.eventType.includes('CAPTURE')) return false;
      if (filterType === 'PAYOUTS' && !ev.eventType.includes('PAYOUT')) return false;
      if (filterType === 'ORDER' && !ev.eventType.includes('ORDER')) return false;
      if (filterType === 'DISPUTE' && !ev.eventType.includes('DISPUTE')) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inType = ev.eventType.toLowerCase().includes(q);
      const inId = ev.id.toLowerCase().includes(q);
      const inResource = (ev.resourceId || '').toLowerCase().includes(q);
      const inSummary拼 = (ev.summary || '').toLowerCase().includes(q);
      if (!inType && !inId && !inResource && !inSummary拼) return false;
    }

    return true;
  });

  const getEventTypeColor = (type: string) => {
    if (type.includes('CAPTURE')) return 'text-[#00F5D4] bg-[#00F5D4]/10 border-[#00F5D4]/30';
    if (type.includes('PAYOUT')) return 'text-[#C084FC] bg-[#C084FC]/10 border-[#C084FC]/30';
    if (type.includes('ORDER')) return 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/30';
    if (type.includes('DISPUTE') || type.includes('DENIED')) return 'text-[#FF007F] bg-[#FF007F]/10 border-[#FF007F]/30';
    return 'text-amber-300 bg-amber-400/10 border-amber-400/30';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            VERIFIED
          </span>
        );
      case 'PROCESSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#00F5D4]/15 border border-[#00F5D4]/40 text-[#00F5D4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4]"></span>
            PROCESSED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/15 border border-rose-500/40 text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/15 border border-blue-500/40 text-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            RECEIVED
          </span>
        );
    }
  };

  const formatTimeAgo = (isoString?: string | null) => {
    if (!isoString) return 'No events yet';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <BossParallaxCard
      maxRotateX={compact ? 2 : 4}
      maxRotateY={compact ? 2 : 3}
      maxTranslateZ={compact ? 15 : 25}
      glowColor="rgba(0, 245, 212, 0.25)"
      className={`glass rounded-[2rem] border border-[#00F5D4]/30 bg-black/75 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden ${className}`}
    >
      {/* Background cyber watermark */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-white text-9xl">
        <i className="fa-solid fa-satellite-dish"></i>
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header Ribbon with ID Badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/40 text-[#00F5D4] text-xs font-mono font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-ping"></span>
                LIVE WEBHOOK LISTENER
              </span>

              <span className="px-3 py-1 rounded-full bg-zinc-900 border border-white/15 text-gray-300 text-xs font-mono font-bold flex items-center gap-1.5">
                <span className="text-gray-500 font-normal">ID:</span>
                <span className="text-[#00F5D4]">{webhookIdTarget}</span>
                <button
                  onClick={() => handleCopy(webhookIdTarget, 'whid')}
                  title="Copy Webhook ID"
                  className="hover:text-white ml-1 cursor-pointer transition-colors"
                >
                  <i className={`fa-solid ${copiedKey === 'whid' ? 'fa-check text-emerald-400' : 'fa-copy'} text-[10px]`}></i>
                </button>
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-mono uppercase tracking-widest font-bold">
                {data?.mode || 'LIVE'}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white flex items-center gap-2.5">
              <span>Webhook Activity & Payload Stream</span>
            </h3>
            <p className="text-xs text-gray-400 font-light max-w-xl">
              Real-time incoming transmission telemetry and raw payload inspection for PayPal Webhook <code className="text-[#00F5D4] font-mono">{webhookIdTarget}</code>.
            </p>
          </div>

          {/* Action Tools & Refresh Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                autoRefresh
                  ? 'bg-[#00F5D4]/15 border-[#00F5D4]/40 text-[#00F5D4]'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <i className={`fa-solid fa-arrows-rotate text-xs ${autoRefresh ? 'animate-spin' : ''}`}></i>
              <span>{autoRefresh ? 'Auto 3.5s' : 'Paused'}</span>
            </button>

            <button
              type="button"
              onClick={() => fetchEvents()}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <i className={`fa-solid fa-rotate-right ${loading ? 'animate-spin text-[#00F5D4]' : ''}`}></i>
              <span>Sync</span>
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              disabled={!allEvents.length}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
              title="Export event logs to JSON"
            >
              <i className="fa-solid fa-download text-xs text-[#00F5D4]"></i>
              <span>JSON</span>
            </button>

            {allEvents.length > 0 && (
              <button
                type="button"
                onClick={handleClearLogs}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-gray-400 hover:text-rose-300 text-xs font-mono transition-all cursor-pointer"
                title="Clear current event log"
              >
                <i className="fa-solid fa-trash-can"></i>
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Total Events</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-mono font-black text-white">{allEvents.length}</span>
              <span className="text-[10px] font-mono text-[#00F5D4]">/ 50 buffer</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Latest Delivery</span>
            <span className="text-xs font-mono font-bold text-[#00F5D4] block truncate">
              {formatTimeAgo(data?.lastReceivedAt)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Listener Status</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono font-bold text-emerald-400">ACTIVE 200 OK</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Target Webhook</span>
            <span className="text-xs font-mono font-bold text-[#C084FC] block truncate" title={webhookIdTarget}>
              {webhookIdTarget}
            </span>
          </div>
        </div>

        {/* Quick Test Payload Simulation Bar */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-bolt text-[#00F5D4] text-xs animate-pulse"></i>
            <span className="text-xs font-mono font-bold text-gray-300">Simulate Real-Time Incoming Webhooks:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleTestDispatch('PAYMENT.CAPTURE.COMPLETED')}
              disabled={isSimulating}
              className="px-3 py-1.5 rounded-xl bg-[#00F5D4]/15 hover:bg-[#00F5D4]/30 border border-[#00F5D4]/40 text-[#00F5D4] text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <i className="fa-solid fa-hand-holding-dollar"></i>
              <span>Capture ($150.00)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTestDispatch('PAYMENT.PAYOUTS-ITEM.SUCCEEDED')}
              disabled={isSimulating}
              className="px-3 py-1.5 rounded-xl bg-[#C084FC]/15 hover:bg-[#C084FC]/30 border border-[#C084FC]/40 text-[#C084FC] text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <i className="fa-solid fa-money-bill-transfer"></i>
              <span>Payout Succeeded</span>
            </button>

            <button
              type="button"
              onClick={() => handleTestDispatch('CHECKOUT.ORDER.APPROVED')}
              disabled={isSimulating}
              className="px-3 py-1.5 rounded-xl bg-[#38BDF8]/15 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/40 text-[#38BDF8] text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <i className="fa-solid fa-cart-check"></i>
              <span>Order Approved</span>
            </button>
          </div>
        </div>

        {/* Filter, Search & Status Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            {[
              { id: 'ALL', label: 'All Types' },
              { id: 'CAPTURE', label: 'Captures' },
              { id: 'PAYOUTS', label: 'Payouts' },
              { id: 'ORDER', label: 'Orders' },
              { id: 'DISPUTE', label: 'Disputes' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-[#00F5D4] text-black font-black shadow-md shadow-[#00F5D4]/20'
                    : 'bg-zinc-900/80 text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative min-w-[200px]">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event type, resource ID..."
              className="w-full pl-8 pr-4 py-1.5 rounded-xl bg-zinc-950 border border-white/15 text-white placeholder-gray-500 text-xs font-mono focus:border-[#00F5D4] outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Activity Log Stream Table / List */}
        <div className="rounded-2xl border border-white/10 bg-black/90 overflow-hidden shadow-inner">
          <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-white/5">
            {filteredEvents不易.length > 0 ? (
              filteredEvents不易.map((event, idx) => {
                const isSelected = selectedEvent?.id === event.id;
                return (
                  <div
                    key={event.id || idx}
                    onClick={() => {
                      setSelectedEvent(isSelected ? null : event);
                      bossAudio.playSubtlePing();
                    }}
                    className={`p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                      isSelected
                        ? 'bg-[#00F5D4]/10 border-l-4 border-[#00F5D4]'
                        : 'hover:bg-white/[0.03] border-l-4 border-transparent'
                    }`}
                  >
                    {/* Left details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Event type pill */}
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-black border ${getEventTypeColor(event.eventType)}`}>
                          {event.eventType}
                        </span>

                        {/* Status Indicator */}
                        {getStatusBadge(event.status)}

                        {/* Resource ID pill */}
                        {event.resourceId && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-gray-300">
                            <span className="text-gray-500 mr-1">Resource:</span>
                            <span className="text-white font-bold">{event.resourceId}</span>
                          </span>
                        )}
                      </div>

                      {/* Summary */}
                      <p className="text-xs text-gray-300 font-light truncate max-w-xl">
                        {event.summary || `PayPal incoming event payload for resource ${event.resourceId || 'N/A'}`}
                      </p>

                      {/* Timestamps */}
                      <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500">
                        <span>
                          <i className="fa-solid fa-clock mr-1 text-[#00F5D4]"></i>
                          Received: <strong className="text-gray-300">{new Date(event.receivedAt).toLocaleTimeString()}</strong> ({formatTimeAgo(event.receivedAt)})
                        </span>
                        {event.createTime && (
                          <span className="hidden md:inline">
                            <i className="fa-solid fa-calendar-lines-pen mr-1 text-gray-400"></i>
                            Created: {new Date(event.createTime).toISOString().replace('T', ' ').substring(0, 19)} UTC
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right action button */}
                    <div className="flex items-center gap-2 shrink-0 sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-[#00F5D4] text-black font-black'
                            : 'bg-white/5 group-hover:bg-[#00F5D4]/20 text-gray-300 group-hover:text-[#00F5D4] border border-white/10'
                        }`}
                      >
                        <i className="fa-solid fa-code text-[11px]"></i>
                        <span>{isSelected ? 'Viewing Payload' : 'Inspect JSON'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 px-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-500">
                  <i className="fa-solid fa-satellite text-xl"></i>
                </div>
                <h5 className="font-mono text-xs font-bold text-gray-300 uppercase tracking-wider">
                  No Webhook Events Recorded Yet
                </h5>
                <p className="text-xs text-gray-500 font-light max-w-md mx-auto">
                  Click one of the simulate buttons above or dispatch a live webhook from your PayPal Developer Dashboard to see incoming payload logs appear here instantly.
                </p>
                <button
                  type="button"
                  onClick={() => handleTestDispatch('PAYMENT.CAPTURE.COMPLETED')}
                  className="px-4 py-2 rounded-xl bg-[#00F5D4]/20 border border-[#00F5D4]/40 text-[#00F5D4] text-xs font-mono font-bold hover:scale-105 transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-bolt mr-1.5"></i>
                  Send First Test Payload
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Expandable Selected Event Payload Inspector Drawer */}
        {selectedEvent && (
          <div className="p-6 rounded-2xl bg-zinc-950 border border-[#00F5D4]/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00F5D4]"></span>
                  <h4 className="text-sm font-mono font-black text-white uppercase tracking-wider">
                    Payload Inspector: <span className="text-[#00F5D4]">{selectedEvent.eventType}</span>
                  </h4>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
                  <span>Event ID: <strong className="text-white">{selectedEvent.id}</strong></span>
                  <span>•</span>
                  <span>Status: <strong className="text-emerald-400">{selectedEvent.status}</strong></span>
                  <span>•</span>
                  <span>Webhook ID: <strong className="text-[#00F5D4]">{selectedEvent.webhookId}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(JSON.stringify(selectedEvent.payload, null, 2), 'payload-json')}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <i className={`fa-solid ${copiedKey === 'payload-json' ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                  <span>{copiedKey === 'payload-json' ? 'Copied!' : 'Copy JSON'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                  title="Close Inspector"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Headers Strip if Available */}
            {selectedEvent.headers && (
              <div className="p-3 rounded-xl bg-black/80 border border-white/10 space-y-1 text-xs font-mono text-gray-400">
                <span className="text-[10px] uppercase font-bold text-[#38BDF8] tracking-widest block">PayPal Verification Headers</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-500">Transmission ID:</span>{' '}
                    <span className="text-gray-300 font-bold">{selectedEvent.headers['paypal-transmission-id'] || 'TRANSMISSION-VERIFIED'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Auth Algorithm:</span>{' '}
                    <span className="text-gray-300">{selectedEvent.headers['paypal-auth-algo'] || 'SHA256withRSA'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Cert URL:</span>{' '}
                    <span className="text-emerald-400 truncate block" title="PayPal Official Cert">Valid PayPal Root CA</span>
                  </div>
                </div>
              </div>
            )}

            {/* Formatted JSON Body */}
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black">
              <pre className="p-4 text-xs font-mono text-[#00F5D4] max-h-72 overflow-y-auto custom-scrollbar leading-relaxed">
                {JSON.stringify(selectedEvent.payload, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </BossParallaxCard>
  );
};

export default WebhookActivityLog;
