import React, { useState, useEffect, useRef } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import ShareModal from './ShareModal';
import { getSavedUserProfile, USER_OFFICIAL_FACE_AVATAR } from '../utils/userProfileState';

interface LiveBroadcastStudioProps {
  onTipBossAndCreator?: (author: string, amount: number) => void;
  onSaveAsReel?: (streamData: { title: string; desc: string; videoUrl: string }) => void;
}

interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  text: string;
  badge?: 'VIP' | 'Boss' | 'Mod' | 'Top Tipper' | 'AI Co-Host';
  gift?: { name: string; amount: number; icon: string };
  time: string;
}

const mockFanMessages = [
  { user: 'CyberQueen_99', text: 'This stream quality is crisp! Loving the vibes 🔥', badge: 'VIP' as const },
  { user: 'BassWizard', text: 'Drop that new stem we made in Music Studio!', badge: 'Top Tipper' as const },
  { user: 'AlchemistGod', text: 'Janu Creations is taking over the entire game 👑', badge: 'VIP' as const },
  { user: 'NeonDrifter', text: 'Can you show how the AI auto-moderator works in real-time?', badge: undefined },
  { user: 'GospelVoice', text: 'Praise and harmony! The audio clarity is immaculate.', badge: 'VIP' as const },
  { user: 'VentureBoss_X', text: 'Sending gifts right now! Keep building!', badge: 'Top Tipper' as const }
];

export const LiveBroadcastStudio: React.FC<LiveBroadcastStudioProps> = ({
  onTipBossAndCreator,
  onSaveAsReel
}) => {
  const [isLive, setIsLive] = useState(true);
  const [streamTitle, setStreamTitle] = useState('🔥 Creator Late Night Live: AI Masterclass & Beat Drops');
  const [streamCategory, setStreamCategory] = useState<'Reels & Production' | 'Live Music & Stems' | 'AI Art Creation' | 'Open AMA & Battles'>('Reels & Production');
  const [sourceMode, setSourceMode] = useState<'camera' | 'hologram' | 'screen' | 'dj-stage'>('camera');
  const [arFilter, setArFilter] = useState<'neon-glow' | 'cyber-noir' | 'matrix-green' | 'ultra-vivid' | 'none'>('neon-glow');
  
  // Stream metrics
  const [viewerCount, setViewerCount] = useState(1842);
  const [streamSeconds, setStreamSeconds] = useState(548); // ~9 mins
  const [likesCount, setLikesCount] = useState(4920);
  const [liveTipsTotal, setLiveTipsTotal] = useState(380.00);

  // Audio/Video toggles
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [aiCoHostActive, setAiCoHostActive] = useState(true);

  // Chat system
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      user: 'Janu AI Autopilot',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop',
      text: '🤖 Autonomous AI Co-Host active: Monitoring live safety, welcoming VIPs, and calculating 15% Founder cuts for January Rebl.',
      badge: 'AI Co-Host',
      time: '9m ago'
    },
    {
      id: 'init-2',
      user: 'VentureBoss_X',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      text: 'Sent a VIP Crown! Let’s go!',
      badge: 'Top Tipper',
      gift: { name: 'VIP Crown', amount: 20.00, icon: 'fa-crown' },
      time: '4m ago'
    },
    {
      id: 'init-3',
      user: 'CreativeSoul_99',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
      text: 'The AI background grading on this stream is unbelievable! 🔥',
      badge: 'VIP',
      time: '1m ago'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Modals
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Timer & Real-time viewer fluctuation effect
  useEffect(() => {
    if (!isLive) return;

    const timer = setInterval(() => {
      setStreamSeconds(prev => prev + 1);
      // Random subtle viewer fluctuations
      if (Math.random() > 0.6) {
        setViewerCount(prev => Math.max(1200, prev + Math.floor(Math.random() * 15) - 6));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isLive]);

  // Periodic incoming mock chats
  useEffect(() => {
    if (!isLive) return;

    const chatInterval = setInterval(() => {
      const randomFan = mockFanMessages[Math.floor(Math.random() * mockFanMessages.length)];
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        user: randomFan.user,
        avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 50000000)}?q=80&w=200&auto=format&fit=crop`,
        text: randomFan.text,
        badge: randomFan.badge,
        time: 'Just now'
      };

      setMessages(prev => [...prev.slice(-25), newMsg]);
      setLikesCount(l => l + Math.floor(Math.random() * 3) + 1);
    }, 4500);

    return () => clearInterval(chatInterval);
  }, [isLive]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatUptime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs > 0 ? `${hrs.toString().padStart(2, '0')}:` : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;

    const myMsg: ChatMessage = {
      id: Date.now().toString(),
      user: 'You (Broadcaster)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      text: chatInput.trim(),
      badge: 'Boss',
      time: 'Just now'
    };

    setMessages(prev => [...prev, myMsg]);
    setChatInput('');

    // If AI co-host is active, occasionally reply with an automated assist
    if (aiCoHostActive && Math.random() > 0.5) {
      setTimeout(() => {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          user: 'Janu AI Autopilot',
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop',
          text: `🤖 Pinned announcement: Check out the new Contest Arena to win prize pools and claim daily bounties!`,
          badge: 'AI Co-Host',
          time: 'Just now'
        };
        setMessages(prev => [...prev, aiMsg]);
      }, 1200);
    }
  };

  const handleSendGift = (giftName: string, amount: number, icon: string) => {
    const giftMsg: ChatMessage = {
      id: Date.now().toString(),
      user: 'You (Fan / Tipper)',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
      text: `Sent a ${giftName} ($${amount.toFixed(2)})!`,
      badge: 'Top Tipper',
      gift: { name: giftName, amount, icon },
      time: 'Just now'
    };

    setMessages(prev => [...prev, giftMsg]);
    setLiveTipsTotal(prev => prev + amount);

    if (onTipBossAndCreator) {
      onTipBossAndCreator('Live Broadcaster', amount);
    }

    triggerNeonExplosion({
      particleCount: 80,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'grand'
    });

    setShowGiftModal(false);
  };

  const gifts = [
    { name: '⚡ Neon Bolt', amount: 2.00, icon: 'fa-bolt', color: 'from-[#00F5D4] to-[#38BDF8]' },
    { name: '💎 Cyber Diamond', amount: 5.00, icon: 'fa-gem', color: 'from-[#38BDF8] to-[#818CF8]' },
    { name: '👑 VIP Crown', amount: 20.00, icon: 'fa-crown', color: 'from-[#C084FC] to-[#F472B6]' },
    { name: '🏆 Janu Golden Trophy', amount: 50.00, icon: 'fa-trophy', color: 'from-[#FCD34D] to-[#F59E0B]' },
    { name: '🌟 Grand Boss Star', amount: 100.00, icon: 'fa-star', color: 'from-[#FF007F] to-[#00F5D4]' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Stream Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-zinc-950/90 border border-white/10 glass shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-black ${
              isLive ? 'bg-gradient-to-br from-[#00F5D4] to-[#C084FC] animate-pulse shadow-[0_0_20px_rgba(0,245,212,0.4)]' : 'bg-zinc-800 text-gray-400'
            }`}>
              <i className="fa-solid fa-tower-broadcast text-xl"></i>
            </div>
            {isLive && (
              <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-red-500 text-white font-mono text-[9px] font-black uppercase tracking-wider animate-bounce shadow-md">
                LIVE
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-serif font-black italic text-white tracking-tight">
                Janu Live Broadcast Studio
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[#00F5D4] text-[9px] font-mono font-bold uppercase">
                1080p 60FPS
              </span>
            </div>
            <p className="text-xs font-mono text-gray-400">
              Uptime: <span className="text-[#00F5D4] font-bold">{formatUptime(streamSeconds)}</span> • {streamCategory}
            </p>
          </div>
        </div>

        {/* Live Metrics & Quick Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono flex items-center gap-2">
            <i className="fa-solid fa-eye text-[#00F5D4] animate-pulse"></i>
            <span className="font-bold text-white">{viewerCount.toLocaleString()}</span>
            <span className="text-gray-400 text-[10px]">watching</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono flex items-center gap-2">
            <i className="fa-solid fa-coins text-[#FCD34D]"></i>
            <span className="font-bold text-[#FCD34D]">${liveTipsTotal.toFixed(2)}</span>
            <span className="text-gray-400 text-[10px]">(15% Founder Cut)</span>
          </div>

          <button
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border border-white/10 hover:border-[#00F5D4]"
          >
            <i className="fa-solid fa-share-nodes text-[#00F5D4]"></i>
            <span>Share Stream</span>
          </button>

          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-5 py-2 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center gap-2 ${
              isLive 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' 
                : 'bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black shadow-[#00F5D4]/30'
            }`}
          >
            <i className={`fa-solid ${isLive ? 'fa-stop' : 'fa-play'}`}></i>
            <span>{isLive ? 'End Stream' : 'Go Live Now'}</span>
          </button>
        </div>
      </div>

      {/* Main Broadcast Stage + Live Chat Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Video Stage & Controls */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Main Video Viewport */}
          <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/15 bg-zinc-950 shadow-2xl group">
            
            {/* Visual Stream Simulation Canvas */}
            <div className={`w-full h-full relative flex items-center justify-center transition-all ${
              arFilter === 'neon-glow' ? 'shadow-[inset_0_0_80px_rgba(0,245,212,0.3)]' :
              arFilter === 'cyber-noir' ? 'contrast-125 brightness-90 grayscale' :
              arFilter === 'matrix-green' ? 'hue-rotate-90 saturate-200' :
              arFilter === 'ultra-vivid' ? 'saturate-200 contrast-110' : ''
            }`}>
              
              {sourceMode === 'camera' && (
                <img 
                  src={getSavedUserProfile().avatar || USER_OFFICIAL_FACE_AVATAR} 
                  alt="Live Camera Feed"
                  className={`w-full h-full object-cover ${isCamOff ? 'hidden' : 'block'}`}
                />
              )}

              {sourceMode === 'hologram' && (
                <img 
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop" 
                  alt="AI Hologram Avatar"
                  className="w-full h-full object-cover animate-pulse"
                />
              )}

              {sourceMode === 'screen' && (
                <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center p-6 text-center">
                  <i className="fa-solid fa-display text-5xl text-[#00F5D4] mb-3 animate-bounce"></i>
                  <h4 className="text-lg font-mono font-bold text-white">Sharing Studio AI Workstation</h4>
                  <p className="text-xs font-mono text-gray-400">Showing Reel Video Studio & Music Stem Equalizer</p>
                </div>
              )}

              {sourceMode === 'dj-stage' && (
                <img 
                  src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop" 
                  alt="Live DJ Sound Stage"
                  className="w-full h-full object-cover"
                />
              )}

              {isCamOff && sourceMode === 'camera' && (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <i className="fa-solid fa-video-slash text-4xl mb-2 text-red-400"></i>
                  <span className="text-xs font-mono font-bold">Camera is Switched Off</span>
                </div>
              )}

              {/* Dynamic Overlays: Watermark & Certified Stamp */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-[#00F5D4]/40 text-[#00F5D4] text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  <span>Janu Live Network</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white text-[10px] font-mono">
                  {viewerCount} Viewers
                </span>
              </div>

              {/* Floating Certified Watermark Bottom Right */}
              <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-2xl flex items-center gap-2">
                <i className="fa-solid fa-certificate text-[#00F5D4] text-xs"></i>
                <span className="text-[10px] font-mono font-bold text-white tracking-widest uppercase">
                  Janu’s Creations Verified
                </span>
              </div>

              {/* AI Co-Host Active Pill */}
              {aiCoHostActive && (
                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-[#C084FC]/40 px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-mono text-[#C084FC]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC] animate-ping"></span>
                  <span>AI Autopilot Active</span>
                </div>
              )}

            </div>

            {/* In-Video Quick Controls Overlay */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/15 p-1.5 rounded-2xl">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs transition-colors cursor-pointer ${
                  isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
              </button>

              <button 
                onClick={() => setIsCamOff(!isCamOff)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs transition-colors cursor-pointer ${
                  isCamOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title={isCamOff ? 'Turn Cam On' : 'Turn Cam Off'}
              >
                <i className={`fa-solid ${isCamOff ? 'fa-video-slash' : 'fa-video'}`}></i>
              </button>

              <div className="h-4 w-px bg-white/20"></div>

              <button 
                onClick={() => setShowGiftModal(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FCD34D] to-[#00F5D4] text-black font-mono text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform"
              >
                <i className="fa-solid fa-gift"></i>
                <span>Send Gift</span>
              </button>
            </div>

          </div>

          {/* Broadcast Studio Customization Panel */}
          <div className="p-5 rounded-3xl bg-zinc-950 border border-white/10 space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stream Title Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                  Broadcast Title
                </label>
                <input 
                  type="text" 
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#00F5D4] outline-none"
                />
              </div>

              {/* Source Mode Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                  Video Source Mode
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'camera', label: 'Camera', icon: 'fa-camera' },
                    { id: 'hologram', label: 'AI Avatar', icon: 'fa-robot' },
                    { id: 'screen', label: 'Screen', icon: 'fa-display' },
                    { id: 'dj-stage', label: 'DJ Stage', icon: 'fa-music' }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSourceMode(m.id as any)}
                      className={`p-2 rounded-xl border text-[10px] font-mono font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        sourceMode === m.id 
                          ? 'border-[#00F5D4] bg-[#00F5D4]/10 text-[#00F5D4]' 
                          : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      <i className={`fa-solid ${m.icon}`}></i>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AR Filters & AI Co-Host Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/10">
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                  AR Neural FX:
                </span>
                <div className="flex gap-1.5">
                  {[
                    { id: 'neon-glow', label: 'Neon Aura' },
                    { id: 'cyber-noir', label: 'Noir' },
                    { id: 'matrix-green', label: 'Matrix' },
                    { id: 'ultra-vivid', label: '4K Vivid' },
                    { id: 'none', label: 'Clean' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setArFilter(f.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono cursor-pointer transition-all ${
                        arFilter === f.id 
                          ? 'bg-[#C084FC] text-black font-black' 
                          : 'bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Co-Host Switch */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-wand-magic-sparkles text-xs text-[#C084FC]"></i>
                  <span className="text-xs font-mono text-gray-300">AI Co-Host & Auto-Mod</span>
                </div>
                <button
                  onClick={() => setAiCoHostActive(!aiCoHostActive)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    aiCoHostActive ? 'bg-[#00F5D4]' : 'bg-zinc-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-black transition-transform ${
                    aiCoHostActive ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* Right 4 Cols: Live Interactive Chat & Super Chats */}
        <div className="lg:col-span-4 flex flex-col h-[640px] rounded-3xl bg-zinc-950 border border-white/15 p-4 shadow-2xl">
          
          {/* Chat Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-comments text-[#00F5D4]"></i>
              <h3 className="text-sm font-serif font-black italic text-white">
                Live Creator Stream Chat
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono text-gray-400">
              Slow Mode: Off
            </span>
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 custom-scrollbar text-xs font-mono">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`p-2.5 rounded-2xl transition-all ${
                  m.gift 
                    ? 'bg-gradient-to-r from-[#FCD34D]/20 to-[#00F5D4]/20 border border-[#FCD34D]/50 shadow-[0_0_15px_rgba(252,211,77,0.2)]' 
                    : m.badge === 'AI Co-Host'
                    ? 'bg-[#C084FC]/10 border border-[#C084FC]/30'
                    : 'bg-white/5 border border-white/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <img src={m.avatar} alt={m.user} className="w-4 h-4 rounded-full object-cover shrink-0" />
                    <span className="font-bold text-white truncate text-[11px]">{m.user}</span>
                    {m.badge && (
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                        m.badge === 'Boss' ? 'bg-[#00F5D4] text-black' :
                        m.badge === 'AI Co-Host' ? 'bg-[#C084FC] text-black' :
                        m.badge === 'Top Tipper' ? 'bg-[#FCD34D] text-black' :
                        'bg-white/10 text-white'
                      }`}>
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-500 shrink-0">{m.time}</span>
                </div>

                {/* Gift Callout banner */}
                {m.gift && (
                  <div className="my-1 py-1 px-2 rounded-xl bg-black/60 border border-[#FCD34D]/30 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 text-[#FCD34D] font-bold">
                      <i className={`fa-solid ${m.gift.icon}`}></i>
                      <span>{m.gift.name}</span>
                    </div>
                    <span className="font-bold text-[#00F5D4]">+${m.gift.amount.toFixed(2)}</span>
                  </div>
                )}

                <p className="text-gray-200 text-[11px] leading-relaxed break-words">{m.text}</p>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input & Gift Action */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGiftModal(true)}
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FCD34D] to-[#00F5D4] text-black flex items-center justify-center shrink-0 hover:scale-105 transition-transform cursor-pointer shadow-md"
                title="Send Live Super Chat / Gift"
              >
                <i className="fa-solid fa-gift text-sm"></i>
              </button>

              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                placeholder="Send a live message..."
                className="flex-1 bg-black/70 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#00F5D4] outline-none"
              />

              <button
                onClick={handleSendChatMessage}
                className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-paper-plane text-xs text-[#00F5D4]"></i>
              </button>
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 px-1">
              <span>Auto-moderated by Janu AI</span>
              <span>15% platform cut to Founder</span>
            </div>
          </div>

        </div>

      </div>

      {/* GIFT / SUPER CHAT MODAL */}
      {showGiftModal && (
        <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass p-6 sm:p-8 rounded-[2.5rem] border border-[#FCD34D]/40 bg-zinc-950 max-w-md w-full space-y-6 shadow-[0_0_60px_rgba(252,211,77,0.3)] animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-crown text-[#FCD34D]"></i>
                <h3 className="text-lg font-serif font-black italic text-white">
                  Send Live Super Gift
                </h3>
              </div>
              <button 
                onClick={() => setShowGiftModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs font-mono text-gray-300">
              Celebrate the stream with custom animated badges and direct creator rewards.
            </p>

            <div className="space-y-2.5">
              {gifts.map((g, i) => (
                <button
                  key={i}
                  onClick={() => handleSendGift(g.name, g.amount, g.icon)}
                  className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FCD34D] flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center text-black font-bold text-sm shadow-md group-hover:scale-110 transition-transform`}>
                      <i className={`fa-solid ${g.icon}`}></i>
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-mono font-bold text-white group-hover:text-[#FCD34D] transition-colors">{g.name}</h4>
                      <p className="text-[10px] font-mono text-gray-400">85% Creator • 15% January Rebl</p>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-black text-[#00F5D4]">
                    ${g.amount.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* SHARE BROADCAST MODAL */}
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={streamTitle}
        type="live"
        author="Janu's Creations Live Studio"
      />

    </div>
  );
};

export default LiveBroadcastStudio;
