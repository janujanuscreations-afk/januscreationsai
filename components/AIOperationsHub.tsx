import React, { useState, useEffect } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';

interface AIOperationsHubProps {
  onOpenFounderDashboard: () => void;
}

interface LogEntry {
  id: string;
  time: string;
  module: 'Moderator' | 'Judge' | 'Revenue' | 'AudioAlchemist' | 'CoHost';
  action: string;
  status: 'SUCCESS' | 'OPTIMIZED' | 'ESCROW_HELD' | 'FLAGGED';
}

export const AIOperationsHub: React.FC<AIOperationsHubProps> = ({
  onOpenFounderDashboard
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', time: '12:24:02', module: 'Judge', action: 'AI Scored Contest Entry #142 "Neon Odyssey" (Score: 98.4/100)', status: 'SUCCESS' },
    { id: '2', time: '12:23:55', module: 'Revenue', action: 'Auto-siphoned 20% Contest Fee ($3.00) -> Credited to January Rebl Founder Vault', status: 'SUCCESS' },
    { id: '3', time: '12:23:40', module: 'Moderator', action: 'Live Stream chat scanned: 240 messages verified, 0 toxic leaks', status: 'SUCCESS' },
    { id: '4', time: '12:23:15', module: 'Revenue', action: 'Creator payout request ($450.00 from @DesignNexus) held in escrow awaiting January Rebl approval', status: 'ESCROW_HELD' },
    { id: '5', time: '12:22:48', module: 'AudioAlchemist', action: 'Auto-mastered 4-stem Gospel Audio track + AI Video Storyboard', status: 'OPTIMIZED' },
    { id: '6', time: '12:22:10', module: 'CoHost', action: 'AI Autopilot pinned contest announcement in Live Broadcast Studio', status: 'SUCCESS' }
  ]);

  // Autopilot Settings
  const [autoJudgeEnabled, setAutoJudgeEnabled] = useState(true);
  const [autoModSensitivity, setAutoModSensitivity] = useState<'Standard' | 'Strict' | 'Sovereign Strict'>('Sovereign Strict');
  const [autoSoundMastering, setAutoSoundMastering] = useState(true);
  const [autoBossSiphon, setAutoBossSiphon] = useState(true);
  const [autoQuestsActive, setAutoQuestsActive] = useState(true);

  // Live log simulator
  useEffect(() => {
    const modules: ('Moderator' | 'Judge' | 'Revenue' | 'AudioAlchemist' | 'CoHost')[] = [
      'Moderator', 'Judge', 'Revenue', 'AudioAlchemist', 'CoHost'
    ];

    const actions = [
      'Auto-synced 9:16 vertical reel beat cuts for @CreativeSoul',
      'AI Scored Artwork submission: 96.2% composition fidelity',
      'Collected 15% Live Gift Fee ($15.00) -> Deposited to Founder Reserve',
      'Scanned 8K photo upscale: certified sovereign watermark stamped',
      'Escrow Lock: $800 contest prize queued for January Rebl final sign-off',
      'Auto-moderator welcomed 14 new VIP viewers to live stream'
    ];

    const interval = setInterval(() => {
      const randomMod = modules[Math.floor(Math.random() * modules.length)];
      const randomAct = actions[Math.floor(Math.random() * actions.length)];
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const newLog: LogEntry = {
        id: Date.now().toString(),
        time: timeStr,
        module: randomMod,
        action: randomAct,
        status: randomAct.includes('Escrow') ? 'ESCROW_HELD' : 'SUCCESS'
      };

      setLogs(prev => [newLog, ...prev.slice(0, 19)]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleTestAiOptimization = () => {
    triggerNeonExplosion({
      particleCount: 60,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'grand'
    });
  };

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#FF007F]/15 via-[#C084FC]/15 to-[#00F5D4]/15 border border-white/20 text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-ping"></span>
              <span className="text-neon-trio font-black">Autonomous AI Engine Active</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-mono font-bold">
              24/7 Zero-Overhead Ops
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif font-black italic text-white tracking-tight">
            AI Runs The Machine. <span className="text-neon-trio-animated font-serif italic">You Hold The Keys.</span>
          </h2>
          <p className="text-xs sm:text-sm font-mono text-gray-300 max-w-2xl font-light">
            Autonomous neural sub-agents handle 100% of the editing, judging, moderating, and fee collection. Every sensitive payout requires founder authorization.
          </p>
        </div>

        <button
          onClick={onOpenFounderDashboard}
          className="px-6 py-4 rounded-3xl bg-black/80 border border-[#00F5D4]/40 hover:border-[#00F5D4] text-left transition-all group cursor-pointer shadow-[0_0_25px_rgba(0,245,212,0.2)] shrink-0"
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-crown text-[#00F5D4] group-hover:scale-125 transition-transform"></i>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#00F5D4]">
              Executive Boss Gate
            </span>
          </div>
          <p className="text-[10px] font-mono text-gray-400 mt-1">
            Authorize Pending Payouts & Wire Out
          </p>
        </button>
      </div>

      {/* 5 Core Autonomous Systems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* System 1: Auto-Moderator */}
        <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-4 hover:border-[#00F5D4]/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#00F5D4]/10 border border-[#00F5D4]/30 flex items-center justify-center text-[#00F5D4]">
              <i className="fa-solid fa-shield-halved text-xl"></i>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#00F5D4]/10 text-[#00F5D4] text-[9px] font-mono font-bold uppercase">
              100% Autonomous
            </span>
          </div>
          <div>
            <h3 className="text-base font-serif font-black italic text-white">
              AI Sentinel & Auto-Mod
            </h3>
            <p className="text-xs font-mono text-gray-400 mt-1">
              Scans every video frame, chat message, and live stream for toxic content and brand safety in real-time.
            </p>
          </div>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">Items Scanned:</span>
            <span className="text-white font-bold">14,280 (99.98% Clean)</span>
          </div>
        </div>

        {/* System 2: Contest Judge */}
        <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-4 hover:border-[#FF007F]/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#FF007F]/10 border border-[#FF007F]/30 flex items-center justify-center text-[#FF007F]">
              <i className="fa-solid fa-scale-balanced text-xl"></i>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#FF007F]/10 text-[#FF007F] text-[9px] font-mono font-bold uppercase">
              Instant Scoring
            </span>
          </div>
          <div>
            <h3 className="text-base font-serif font-black italic text-white">
              AI Contest Auto-Judge
            </h3>
            <p className="text-xs font-mono text-gray-400 mt-1">
              Evaluates audio pacing, visual grading, and hook strength (0-100), updating live tournament leaderboards.
            </p>
          </div>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">Submissions Scored:</span>
            <span className="text-white font-bold">539 Entries</span>
          </div>
        </div>

        {/* System 3: Revenue Siphon */}
        <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-4 hover:border-[#FCD34D]/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#FCD34D]/10 border border-[#FCD34D]/30 flex items-center justify-center text-[#FCD34D]">
              <i className="fa-solid fa-vault text-xl"></i>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#FCD34D]/10 text-[#FCD34D] text-[9px] font-mono font-bold uppercase">
              Auto-Routing
            </span>
          </div>
          <div>
            <h3 className="text-base font-serif font-black italic text-white">
              Automated Founder Revenue
            </h3>
            <p className="text-xs font-mono text-gray-400 mt-1">
              Deducts 15-20% on all tips, live gifts, subscriptions, and contest entries directly to January Rebl's vault.
            </p>
          </div>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">Founder Treasury:</span>
            <span className="text-[#00F5D4] font-black">$14,580.00+</span>
          </div>
        </div>

        {/* System 4: Video/Audio Alchemist */}
        <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-4 hover:border-[#C084FC]/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#C084FC]/10 border border-[#C084FC]/30 flex items-center justify-center text-[#C084FC]">
              <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#C084FC]/10 text-[#C084FC] text-[9px] font-mono font-bold uppercase">
              Neural Grade
            </span>
          </div>
          <div>
            <h3 className="text-base font-serif font-black italic text-white">
              AI Production Alchemist
            </h3>
            <p className="text-xs font-mono text-gray-400 mt-1">
              One-click background removal, beat-synced cuts, glowing captions, and acoustic stem mastering.
            </p>
          </div>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">Files Processed:</span>
            <span className="text-white font-bold">5,060 Projects</span>
          </div>
        </div>

        {/* System 5: Live Co-Host */}
        <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-4 hover:border-[#38BDF8]/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
              <i className="fa-solid fa-tower-broadcast text-xl"></i>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] text-[9px] font-mono font-bold uppercase">
              Always Live
            </span>
          </div>
          <div>
            <h3 className="text-base font-serif font-black italic text-white">
              AI Broadcast Co-Host
            </h3>
            <p className="text-xs font-mono text-gray-400 mt-1">
              Auto-answers viewers, pins announcements, encourages gifting, and protects chat while creators stream.
            </p>
          </div>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">Live Interactions:</span>
            <span className="text-white font-bold">12,400+ Chats</span>
          </div>
        </div>

        {/* System 6: Escrow Vault & Gate */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-[#00F5D4]/40 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#00F5D4]/20 border border-[#00F5D4]/50 flex items-center justify-center text-[#00F5D4]">
              <i className="fa-solid fa-key text-xl"></i>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#00F5D4] text-black text-[9px] font-mono font-black uppercase">
              Founder Gate
            </span>
          </div>
          <div>
            <h3 className="text-base font-serif font-black italic text-white">
              Payout Escrow Gate
            </h3>
            <p className="text-xs font-mono text-gray-400 mt-1">
              All withdrawals and contest prizes require January Rebl's physical sign-off before funds are transferred.
            </p>
          </div>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">Pending Approvals:</span>
            <span className="text-[#FCD34D] font-bold">5 Requests Queued</span>
          </div>
        </div>

      </div>

      {/* Real-Time AI Telemetry Stream Terminal */}
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-black border border-white/15 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#00F5D4] animate-ping"></div>
            <h3 className="text-lg font-serif font-black italic text-white tracking-tight">
              Live AI Operations Telemetry Log
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
            <span>Latency: <strong className="text-[#00F5D4]">12ms</strong></span>
            <span>•</span>
            <span>Uptime: <strong className="text-white">99.99%</strong></span>
          </div>
        </div>

        {/* Console Box */}
        <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar font-mono text-xs pr-2">
          {logs.map(log => (
            <div 
              key={log.id} 
              className="p-3 rounded-xl bg-zinc-950 border border-white/5 flex items-center justify-between gap-4 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-gray-500 text-[10px] shrink-0">[{log.time}]</span>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase shrink-0 ${
                  log.module === 'Judge' ? 'bg-[#FF007F]/10 text-[#FF007F] border border-[#FF007F]/30' :
                  log.module === 'Revenue' ? 'bg-[#FCD34D]/10 text-[#FCD34D] border border-[#FCD34D]/30' :
                  log.module === 'Moderator' ? 'bg-[#00F5D4]/10 text-[#00F5D4] border border-[#00F5D4]/30' :
                  log.module === 'AudioAlchemist' ? 'bg-[#C084FC]/10 text-[#C084FC] border border-[#C084FC]/30' :
                  'bg-white/10 text-white'
                }`}>
                  {log.module}
                </span>
                <span className="text-gray-200 truncate text-[11px]">{log.action}</span>
              </div>

              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                log.status === 'ESCROW_HELD' ? 'bg-[#FCD34D]/20 text-[#FCD34D] border border-[#FCD34D]/40' :
                log.status === 'OPTIMIZED' ? 'bg-[#C084FC]/20 text-[#C084FC]' :
                'bg-[#00F5D4]/20 text-[#00F5D4]'
              }`}>
                {log.status}
              </span>
            </div>
          ))}
        </div>

        {/* Autopilot Toggles Bar */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoJudgeEnabled} 
                onChange={(e) => setAutoJudgeEnabled(e.target.checked)}
                className="accent-[#00F5D4]" 
              />
              <span>Auto-Judge Contests</span>
            </label>

            <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoSoundMastering} 
                onChange={(e) => setAutoSoundMastering(e.target.checked)}
                className="accent-[#00F5D4]" 
              />
              <span>Auto-Master Audio Stems</span>
            </label>

            <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoBossSiphon} 
                onChange={(e) => setAutoBossSiphon(e.target.checked)}
                className="accent-[#00F5D4]" 
              />
              <span>Auto-Siphon 15-20% Boss Cuts</span>
            </label>
          </div>

          <button
            onClick={handleTestAiOptimization}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer flex items-center gap-2"
          >
            <i className="fa-solid fa-bolt text-[#00F5D4]"></i>
            <span>Trigger System Pulse</span>
          </button>
        </div>

      </div>

    </div>
  );
};

export default AIOperationsHub;
