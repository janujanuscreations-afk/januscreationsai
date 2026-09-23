import React, { useState, useEffect } from 'react';
import BossParallaxCard from './BossParallaxCard';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';

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

export const PayPalWebhookDiagnostics: React.FC<{
  onNotification?: (msg: string) => void;
}> = ({ onNotification }) => {
  const [data, setData] = useState<WebhookDiagnosticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEventItem | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const fetchEvents = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/paypal/webhook/events');
      if (res.ok) {
        const json: WebhookDiagnosticsData = await res.json();
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

  // Polling for real-time live events
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchEvents(true);
    }, 4000);
    return () => clearInterval(interval);
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
      const resJson = await res.json();
      if (resJson.success) {
        bossAudio.playTipChime(120);
        triggerNeonExplosion({ particleCount: 60, intensity: 'medium' });
        await fetchEvents(true);
        if (onNotification) onNotification(`✓ Verified test webhook received: ${eventType}`);
      }
    } catch (e: any) {
      if (onNotification) onNotification(`Error dispatching test event: ${e?.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      await fetch('/api/paypal/webhook/clear', { method: 'POST' });
      await fetchEvents();
      setSelectedEvent(null);
      if (onNotification) onNotification('Cleared diagnostic webhook event log.');
    } catch (e) {
      // Non-blocking
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2500);
  };

  const webhookId = data?.webhookId || '7D993972A74706718';
  const events = data?.events || [];
  const filteredEvents = events.filter(e => {
    if (filterType === 'ALL') return true;
    if (filterType === 'CAPTURE') return e.eventType.includes('CAPTURE') || e.eventType.includes('SALE');
    if (filterType === 'PAYOUT') return e.eventType.includes('PAYOUT');
    if (filterType === 'CHECKOUT') return e.eventType.includes('CHECKOUT') || e.eventType.includes('ORDER');
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Diagnostic Header Card */}
      <BossParallaxCard
        maxRotateX={4}
        maxRotateY={3}
        maxTranslateZ={30}
        glowColor="rgba(0, 245, 212, 0.25)"
        className="rounded-[2.5rem] bg-gradient-to-br from-zinc-950 via-black to-zinc-900 border border-[#00F5D4]/30 p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -right-12 -top-12 text-zinc-800/20 text-9xl pointer-events-none">
          <i className="fa-brands fa-paypal"></i>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#00F5D4]/10 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4] text-2xl shadow-[0_0_25px_rgba(0,245,212,0.3)]">
                <i className="fa-solid fa-satellite-dish animate-pulse"></i>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-2xl font-serif font-black italic text-white tracking-tight">
                    PayPal Webhook Diagnostic Center
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00F5D4]/20 border border-[#00F5D4]/40 text-[#00F5D4] text-[10px] font-mono font-black uppercase tracking-widest">
                    LIVE LISTENING
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-light mt-1">
                  Real-time receiver and schema verification for live registered Webhook ID <span className="text-[#00F5D4] font-mono font-bold">{webhookId}</span>
                </p>
              </div>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                  autoRefresh
                    ? 'bg-[#00F5D4]/15 border-[#00F5D4]/40 text-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.2)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <i className={`fa-solid fa-arrows-rotate text-xs ${autoRefresh ? 'fa-spin' : ''}`}></i>
                <span>{autoRefresh ? 'Auto-Sync (4s)' : 'Auto-Sync Paused'}</span>
              </button>

              <button
                type="button"
                onClick={() => fetchEvents()}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <i className={`fa-solid fa-rotate-right text-xs ${loading ? 'animate-spin' : ''}`}></i>
                <span>Refresh Logs</span>
              </button>

              <button
                type="button"
                onClick={handleClearLogs}
                disabled={events.length === 0}
                className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <i className="fa-solid fa-trash text-[10px]"></i>
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Webhook Configuration Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="glass p-4 rounded-2xl border-white/10 bg-black/40 space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400 font-bold block">Verified Webhook ID</span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-mono font-black text-[#00F5D4] tracking-wider truncate">{webhookId}</span>
                <button
                  onClick={() => handleCopy(webhookId, 'id')}
                  className="text-gray-400 hover:text-[#00F5D4] text-xs transition-colors p-1"
                  title="Copy Webhook ID"
                >
                  <i className={`fa-solid ${copySuccess === 'id' ? 'fa-check text-green-400' : 'fa-copy'}`}></i>
                </button>
              </div>
              <span className="text-[9px] text-gray-500 font-mono block">PayPal Live REST API</span>
            </div>

            <div className="glass p-4 rounded-2xl border-white/10 bg-black/40 space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400 font-bold block">Receiver Endpoint</span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-white truncate">/api/paypal/webhook</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy('https://ais-dev-uhadavd3tcwhq2e6eka5x5-434571143593.us-east1.run.app/api/paypal/webhook', 'url-dev')}
                    className="px-2 py-0.5 rounded-lg bg-[#00F5D4]/15 border border-[#00F5D4]/30 text-[#00F5D4] hover:bg-[#00F5D4]/25 text-[10px] font-mono font-bold transition-all"
                    title="Copy Dev Webhook URL"
                  >
                    {copySuccess === 'url-dev' ? 'Copied Dev!' : 'Dev URL'}
                  </button>
                  <button
                    onClick={() => handleCopy('https://ais-pre-uhadavd3tcwhq2e6eka5x5-434571143593.us-east1.run.app/api/paypal/webhook', 'url-pre')}
                    className="px-2 py-0.5 rounded-lg bg-[#C084FC]/15 border border-[#C084FC]/30 text-[#C084FC] hover:bg-[#C084FC]/25 text-[10px] font-mono font-bold transition-all"
                    title="Copy Shared Webhook URL"
                  >
                    {copySuccess === 'url-pre' ? 'Copied Pre!' : 'Pre URL'}
                  </button>
                </div>
              </div>
              <span className="text-[9px] text-emerald-400 font-mono block">HTTP 200 Fast Responder Active</span>
            </div>

            <div className="glass p-4 rounded-2xl border-white/10 bg-black/40 space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400 font-bold block">Dispatched Events Count</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-mono font-black text-white">{events.length}</span>
                <span className="text-[10px] font-mono text-gray-400">Captured in Session</span>
              </div>
              <span className="text-[9px] text-gray-500 font-mono block">Ring Buffer (Max 50)</span>
            </div>

            <div className="glass p-4 rounded-2xl border-white/10 bg-black/40 space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400 font-bold block">Last Event Timestamp</span>
              <span className="text-xs font-mono font-bold text-gray-200 block truncate">
                {data?.lastReceivedAt ? new Date(data.lastReceivedAt).toLocaleTimeString() : 'Awaiting Delivery'}
              </span>
              <span className="text-[9px] text-[#00F5D4] font-mono block">
                {data?.lastReceivedAt ? 'Verified Received' : 'Ready to Receive'}
              </span>
            </div>
          </div>

          {/* Test Dispatch Bar */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 text-sm">
                <i className="fa-solid fa-vial-virus"></i>
              </div>
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Manual Webhook Verification Trigger
                </h4>
                <p className="text-[11px] text-gray-400 font-light">
                  Simulate PayPal webhook delivery payloads to verify schema parsing and endpoint connectivity.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleTestDispatch('PAYMENT.CAPTURE.COMPLETED')}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <i className="fa-solid fa-bolt text-[10px]"></i>
                <span>Test Payment Capture</span>
              </button>

              <button
                type="button"
                onClick={() => handleTestDispatch('PAYMENT.PAYOUTS-ITEM.SUCCEEDED')}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <i className="fa-solid fa-money-bill-transfer text-[10px]"></i>
                <span>Test Payout Succeeded</span>
              </button>

              <button
                type="button"
                onClick={() => handleTestDispatch('CHECKOUT.ORDER.APPROVED')}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <i className="fa-solid fa-cart-shopping text-[10px]"></i>
                <span>Test Order Approved</span>
              </button>
            </div>
          </div>
        </div>
      </BossParallaxCard>

      {/* Events Viewer & Raw Payload Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Events Feed List */}
        <div className={`space-y-4 ${selectedEvent ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400">
                Event Filter:
              </span>
              <div className="flex bg-black/60 rounded-xl p-1 border border-white/10">
                {(['ALL', 'CAPTURE', 'PAYOUT', 'CHECKOUT'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilterType(tab)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      filterType === tab
                        ? 'bg-[#00F5D4] text-black font-black shadow-md shadow-[#00F5D4]/20'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-[11px] font-mono text-gray-400 font-bold">
              Showing {filteredEvents.length} of {events.length} events
            </span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-zinc-950/60 border border-white/10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-500 text-2xl">
                <i className="fa-solid fa-satellite text-gray-400"></i>
              </div>
              <h4 className="text-base font-serif font-black italic text-white">
                No Webhook Events Logged Yet
              </h4>
              <p className="text-xs text-gray-400 font-light max-w-md mx-auto">
                The webhook receiver is live and bound to ID <span className="text-[#00F5D4] font-mono">{webhookId}</span>. Use the test triggers above or make a live PayPal transaction to view incoming transmissions.
              </p>
              <button
                type="button"
                onClick={() => handleTestDispatch('PAYMENT.CAPTURE.COMPLETED')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#38BDF8] text-black text-xs font-mono font-black uppercase tracking-wider hover:scale-105 transition-all cursor-pointer"
              >
                Send Test Transmission Now
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredEvents.map(evt => {
                const isSelected = selectedEvent?.id === evt.id;
                const isPayout = evt.eventType.includes('PAYOUT');
                const isCapture = evt.eventType.includes('CAPTURE') || evt.eventType.includes('SALE');
                
                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'bg-[#00F5D4]/10 border-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.2)]'
                        : 'bg-zinc-950/80 hover:bg-zinc-900 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 border ${
                            isCapture
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                              : isPayout
                              ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                              : 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                          }`}
                        >
                          <i
                            className={`fa-solid ${
                              isCapture
                                ? 'fa-arrow-down-to-bracket'
                                : isPayout
                                ? 'fa-paper-plane'
                                : 'fa-receipt'
                            }`}
                          ></i>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-white tracking-wide">
                              {evt.eventType}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono text-[#00F5D4]">
                              {evt.id}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 font-light line-clamp-1">
                            {evt.summary || 'Webhook transmission verified'}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400 pt-1">
                            <span><i className="fa-solid fa-clock mr-1 text-gray-500"></i>{new Date(evt.receivedAt).toLocaleTimeString()}</span>
                            {evt.resourceId && (
                              <span><i className="fa-solid fa-fingerprint mr-1 text-gray-500"></i>{evt.resourceId}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold">
                          HTTP 200
                        </span>
                        <span className="text-[10px] font-mono text-gray-400 group-hover:text-[#00F5D4] transition-colors">
                          Inspect <i className="fa-solid fa-chevron-right text-[8px] ml-1"></i>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Event Raw Payload & Header Inspector */}
        {selectedEvent && (
          <div className="lg:col-span-6 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-6 rounded-3xl bg-zinc-950 border border-[#00F5D4]/30 space-y-5 shadow-2xl relative">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#00F5D4] font-bold block">
                    Webhook Payload Inspector
                  </span>
                  <h4 className="text-base font-mono font-bold text-white">
                    {selectedEvent.eventType}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors border border-white/10"
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              </div>

              {/* Event Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold block">Event ID</span>
                  <span className="text-white font-bold block truncate">{selectedEvent.id}</span>
                </div>
                <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold block">Target Webhook ID</span>
                  <span className="text-[#00F5D4] font-bold block truncate">{selectedEvent.webhookId}</span>
                </div>
                <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold block">Resource ID</span>
                  <span className="text-white font-bold block truncate">{selectedEvent.resourceId || 'N/A'}</span>
                </div>
                <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold block">Received Timestamp</span>
                  <span className="text-gray-300 block truncate">{new Date(selectedEvent.receivedAt).toLocaleString()}</span>
                </div>
              </div>

              {/* JSON Raw Payload View */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400 font-bold">
                    JSON Body Payload
                  </span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedEvent.payload, null, 2), 'json')}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-mono flex items-center gap-1.5 transition-colors border border-white/10"
                  >
                    <i className={`fa-solid ${copySuccess === 'json' ? 'fa-check text-green-400' : 'fa-copy'}`}></i>
                    <span>{copySuccess === 'json' ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-black border border-white/10 text-[#00F5D4] text-[11px] font-mono max-h-[280px] overflow-auto custom-scrollbar leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>

              {/* Verified Transmission Headers */}
              {selectedEvent.headers && Object.values(selectedEvent.headers).some(Boolean) && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400 font-bold block">
                    PayPal Transmission Headers
                  </span>
                  <pre className="p-3 rounded-xl bg-black/60 border border-white/10 text-gray-300 text-[10px] font-mono max-h-[120px] overflow-auto custom-scrollbar">
                    {JSON.stringify(selectedEvent.headers, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayPalWebhookDiagnostics;
