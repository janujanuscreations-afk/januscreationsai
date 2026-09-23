
import React, { useState, useEffect } from 'react';
import Navbar, { AppViewType } from './components/Navbar';
import AIStudio from './components/AIStudio';
import Reveal from './components/Reveal';
import FounderDashboard from './components/FounderDashboard';
import CreatorPortal, { CreatorTabType } from './components/CreatorPortal';
import CreatorProfilePage from './components/CreatorProfilePage';
import JCLogo from './components/Logo';
import { triggerNeonExplosion } from './utils/confetti';
import { bossAudio } from './utils/soundEffects';
import { BossNotificationProvider, useBossNotifications } from './context/BossNotificationContext';
import { FirebaseAuthProvider } from './context/FirebaseAuthContext';
import BossNotificationToast from './components/BossNotificationToast';
import SettingsModal from './components/SettingsModal';
import ThreeStudioRoomBackground from './components/ThreeStudioRoomBackground';
import { QuickSwitcherCommandPalette } from './components/QuickSwitcherCommandPalette';
import { ScrollProgress } from './components/ScrollProgress';
import SintraEmbedModal from './components/SintraEmbedModal';

const AppContent: React.FC = () => {
  const [showFounderDashboard, setShowFounderDashboard] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSintraEmbedModal, setShowSintraEmbedModal] = useState(false);
  const [view, setView] = useState<AppViewType>('home');
  const [creatorTab, setCreatorTab] = useState<CreatorTabType>('feed');
  const [emailCopied, setEmailCopied] = useState(false);
  const [isLiveStudioOnline, setIsLiveStudioOnline] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('janu_live_broadcast_online');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [isAvailabilityAnimating, setIsAvailabilityAnimating] = useState<boolean>(false);

  const { notifyBoss } = useBossNotifications();

  const handleToggleLiveStudioStatus = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const nextStatus = !isLiveStudioOnline;
    setIsLiveStudioOnline(nextStatus);
    try {
      localStorage.setItem('janu_live_broadcast_online', String(nextStatus));
    } catch {
      // ignore
    }

    // Acoustic tactical feedback
    bossAudio.playSubtlePing();

    // Trigger subtle availability transition animation
    setIsAvailabilityAnimating(true);
    setTimeout(() => {
      setIsAvailabilityAnimating(false);
    }, 900);

    // Subtle boss status notification
    notifyBoss({
      type: 'system',
      title: nextStatus ? 'Broadcast Studio: Online' : 'Broadcast Studio: Offline',
      subtitle: nextStatus ? 'Status: Available for Streaming' : 'Status: Standby / Idle Mode',
      message: nextStatus
        ? 'Real-time broadcast pipelines, low-latency audio/video feeds, and superchat processors are armed.'
        : 'Broadcast pipelines switched to offline standby mode. Ready to activate on demand.'
    });
  };

  // Global Keyboard Shortcuts: Cmd/Ctrl + K (Command Palette), Cmd/Ctrl + , (Settings)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      // Check for Cmd+, (Mac) or Ctrl+, (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setShowSettingsModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (newView: AppViewType, initialTab: CreatorTabType = 'feed') => {
    setView(newView);
    setCreatorTab(initialTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTipFromProfile = (handle: string, amount: number) => {
    const creatorCut = amount * 0.85;
    const januCut = amount * 0.15;
    
    notifyBoss({
      type: 'tip',
      title: 'Profile Tip Inflow!',
      subtitle: `+$${amount.toFixed(2)} USD`,
      message: `You tipped $${amount.toFixed(2)} to ${handle}. $${januCut.toFixed(2)} (15% Boss cut) auto-settled to January Rebl.`,
      amount,
      platformCut: januCut,
      creator: { name: handle, handle },
      sender: 'You',
      actionLabel: 'View Boss Ledger'
    });
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('janujanuscreations@gmail.com');
      setEmailCopied(true);
      triggerNeonExplosion({
        particleCount: 40,
        origin: { x: 0.5, y: 0.75 },
        intensity: 'medium'
      });
      setTimeout(() => setEmailCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy email', err);
    }
  };

  const handleScrollToStudio = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (view !== 'home') {
      setView('home');
      setTimeout(() => {
        const studioEl = document.getElementById('studio');
        if (studioEl) studioEl.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const studioEl = document.getElementById('studio');
      if (studioEl) studioEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#C084FC] selection:text-black relative">
      {/* 3D WebGL Virtual Creator Studio Room Background */}
      <ThreeStudioRoomBackground initialTheme="cyber-studio" interactive={true} />

      {/* Executive Background Watermark */}
      <div className="bg-watermark-container pointer-events-none">
        <div className="watermark-text">Janu's Creations • Janu's Creations • Janu's Creations</div>
        <div className="watermark-text" style={{ animationDirection: 'reverse', marginTop: '-5vh', opacity: 0.03 }}>Janu's Creations • Janu's Creations</div>
      </div>

      <Navbar 
        onNavigate={(v, tab) => handleNavigate(v, (tab as any) || 'feed')} 
        currentView={view} 
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        onOpenSintraEmbed={() => setShowSintraEmbedModal(true)}
        onScrollToStudio={handleScrollToStudio}
      />
      
      {view === 'home' ? (
        <>
          {/* Top Edge Neon Scroll Progress Bar */}
          <ScrollProgress height={3} />

          {/* Hero Section - The "Executive Boss" Look */}
          <section className="relative min-h-[110vh] flex flex-col items-center justify-center px-6 overflow-hidden pt-20">
            <div className="absolute inset-0 z-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85rem] h-[85rem] bg-gradient-to-tr from-[#C084FC]/20 via-[#818CF8]/15 to-[#00F5D4]/20 rounded-full blur-[220px] animate-pulse"></div>
            </div>

            <div className="relative z-10 max-w-7xl w-full text-center flex flex-col items-center">
              <Reveal>
                <div className="mb-10 inline-flex items-center gap-4 px-8 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-3xl shadow-[0_0_25px_rgba(0,245,212,0.15)]">
                   <div className="w-2.5 h-2.5 rounded-full bg-[#00F5D4] shadow-[0_0_12px_#00F5D4] animate-pulse"></div>
                   <h2 className="text-[#00F5D4] text-[11px] font-mono font-bold uppercase tracking-[0.5em]">
                    The Executive AI Creator Ecosystem
                  </h2>
                </div>
              </Reveal>

              {/* Centerpiece Hero Big Top Logo with background Janu's Creations */}
              <Reveal delayClass="reveal-delay-100">
                <div className="relative flex flex-col items-center mb-6">
                  <JCLogo size="xl" showText={false} className="mb-4" />
                </div>
              </Reveal>
              
              <Reveal delayClass="reveal-delay-100">
                <div className="relative flex flex-col items-center">
                  {/* Energy Thread Weave - Centered around the title with Radiant Purple & Neon Teal */}
                  <svg viewBox="0 0 1000 400" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] pointer-events-none z-0 overflow-visible opacity-70">
                    <path 
                      d="M -50,200 C 150,50 450,350 650,200 C 850,50 1050,200 1150,200" 
                      fill="none" 
                      stroke="url(#luxury-thread-gradient)" 
                      strokeWidth="6" 
                      className="energy-thread"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="luxury-thread-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#D8B4FE" />
                        <stop offset="50%" stopColor="#C084FC" />
                        <stop offset="100%" stopColor="#00F5D4" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* MASSIVE 3D JANU'S CREATIONS - FLASHING NEON TEAL, NEON PURPLE, AND NEON PINK */}
                  <div className="flex flex-col items-center relative z-10 select-none">
                    {/* Flashing Tri-Color Ambient Glow Aura */}
                    <div className="absolute -inset-10 sm:-inset-20 animate-tri-color-aura blur-[100px] sm:blur-[140px] rounded-full -z-10 pointer-events-none"></div>

                    {/* Janu's Creations AI Studio Monogram Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/85 border border-[#00FFE0]/30 backdrop-blur-xl mb-4 shadow-[0_0_25px_rgba(0,255,224,0.3)]">
                      <span className="w-2 h-2 rounded-full bg-[#00FFE0] animate-ping shadow-[0_0_8px_#00FFE0]"></span>
                      <span className="text-[10px] font-mono font-black tracking-[0.35em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#00FFE0] via-[#E056FD] to-[#FF007F]">
                        Janu's Creations AI Studio
                      </span>
                    </div>

                    <h1 className="text-[6.5rem] sm:text-[10.5rem] md:text-[16rem] lg:text-[20rem] font-serif font-black leading-none tracking-tight italic flex items-center justify-center cursor-pointer">
                      <span 
                        className="neon-flashing-letter neon-flash-delay-0"
                        onClick={() => triggerNeonExplosion({ origin: { x: 0.45, y: 0.35 }, intensity: 'high' })}
                        title="Janu • Fluorescent Flashing Letter"
                      >
                        J
                      </span>
                      <span 
                        className="neon-flashing-letter neon-flash-delay-1"
                        onClick={() => triggerNeonExplosion({ origin: { x: 0.48, y: 0.35 }, intensity: 'high' })}
                        title="Janu • Fluorescent Flashing Letter"
                      >
                        a
                      </span>
                      <span 
                        className="neon-flashing-letter neon-flash-delay-2"
                        onClick={() => triggerNeonExplosion({ origin: { x: 0.51, y: 0.35 }, intensity: 'high' })}
                        title="Janu • Fluorescent Flashing Letter"
                      >
                        n
                      </span>
                      <span 
                        className="neon-flashing-letter neon-flash-delay-3"
                        onClick={() => triggerNeonExplosion({ origin: { x: 0.54, y: 0.35 }, intensity: 'high' })}
                        title="Janu • Fluorescent Flashing Letter"
                      >
                        u
                      </span>
                      <span 
                        className="neon-flashing-letter neon-flash-delay-4 text-[0.8em]"
                        onClick={() => triggerNeonExplosion({ origin: { x: 0.56, y: 0.35 }, intensity: 'high' })}
                        title="Janu's • Fluorescent Flashing Letter"
                      >
                        '
                      </span>
                      <span 
                        className="neon-flashing-letter neon-flash-delay-5"
                        onClick={() => triggerNeonExplosion({ origin: { x: 0.58, y: 0.35 }, intensity: 'high' })}
                        title="Janu's • Fluorescent Flashing Letter"
                      >
                        s
                      </span>
                    </h1>
                    <h1 className="text-6xl sm:text-8xl md:text-[11rem] lg:text-[13rem] creations-script -mt-6 sm:-mt-10 md:-mt-20 select-none">
                      Creations
                    </h1>
                  </div>
                </div>
              </Reveal>

              <Reveal delayClass="reveal-delay-200">
                <p className="text-gray-200 text-base sm:text-xl md:text-2xl max-w-2xl mx-auto mt-12 mb-16 font-mono font-medium leading-relaxed uppercase tracking-[0.2em]">
                  Monetize. Edit. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007F] via-[#E056FD] to-[#00FFE0] font-bold drop-shadow-[0_0_12px_rgba(0,255,224,0.6)]">Dominate.</span> <br/>
                  <span className="text-xs text-gray-400 mt-4 block tracking-[0.4em] font-sans">Empowering All Creators and Founders</span>
                </p>
              </Reveal>
              
              <Reveal delayClass="reveal-delay-300">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-md mx-auto">
                  <button 
                    onClick={() => handleNavigate('creator', 'feed')}
                    className="w-full sm:w-auto px-12 py-5 bg-gradient-to-r from-[#FF007F] via-[#E056FD] to-[#00FFE0] text-black font-black uppercase tracking-[0.3em] text-xs rounded-full hover:shadow-[0_0_35px_rgba(255,0,127,0.7)] hover:scale-105 transition-all active:scale-95 group flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    Enter Creators Hub <i className="fa-solid fa-arrow-right ml-3 group-hover:translate-x-1.5 transition-transform text-black"></i>
                  </button>
                  <button 
                    onClick={handleScrollToStudio} 
                    className="w-full sm:w-auto px-12 py-5 border border-[#00FFE0]/40 hover:border-[#00FFE0] text-white hover:text-[#00FFE0] rounded-full font-black uppercase tracking-[0.3em] text-xs transition-all backdrop-blur-md hover:bg-white/5 hover:shadow-[0_0_25px_rgba(0,255,224,0.35)] flex items-center justify-center cursor-pointer"
                  >
                    Access AI Studio
                  </button>
                </div>
              </Reveal>
            </div>
          </section>

          {/* Feature Grid - PRO BOSS CARDS (Interactive Action Buttons) */}
          <section className="py-40 px-8 bg-black relative border-y border-white/5">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-28">
                <Reveal>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007F] via-[#E056FD] to-[#00FFE0] text-xs font-mono font-bold uppercase tracking-[0.6em] mb-4 block drop-shadow-[0_0_8px_rgba(0,255,224,0.5)]">Executive Arsenal</span>
                  <h2 className="text-4xl md:text-7xl font-serif font-black mb-6 italic">The Boss <span className="text-gray-500 font-sans">Suite</span></h2>
                </Reveal>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    title: 'Live Broadcast Studio',
                    icon: 'fa-tower-broadcast',
                    desc: 'Real-time video/audio streaming, superchats, AI co-host & live gifting.',
                    color: isLiveStudioOnline ? '#00FFE0' : '#71717A',
                    glow: isLiveStudioOnline ? 'hover:border-[#00FFE0]' : 'hover:border-zinc-700',
                    action: () => handleNavigate('creator', 'live'),
                    badge: isLiveStudioOnline ? 'Go Live' : 'Offline'
                  },
                  { title: 'Contests & Battles', icon: 'fa-trophy', desc: 'Compete in creator tournaments with instant AI scoring & cash prize pools.', color: '#00FFE0', glow: 'hover:border-[#00FFE0]', action: () => handleNavigate('creator', 'contests'), badge: 'Enter Arena' },
                  { title: 'Live Leaderboard', icon: 'fa-ranking-star', desc: 'Live creator rankings, trophies, earnings ticker & top creator tipping.', color: '#E056FD', glow: 'hover:border-[#E056FD]', action: () => handleNavigate('creator', 'leaderboard'), badge: 'View Ranks' },
                  { title: 'Advanced Analytics', icon: 'fa-chart-line', desc: 'Granular audience retention curves, traffic attribution & loop diagnostics.', color: '#00FFE0', glow: 'hover:border-[#00FFE0]', action: () => handleNavigate('creator', 'analytics'), badge: 'View Metrics' },
                  { title: 'Reels & Videos', icon: 'fa-video', desc: 'Edit 9:16 reels, trim, speed, AI captions, filters & beat sync.', color: '#FF007F', glow: 'hover:border-[#FF007F]', action: () => handleNavigate('creator', 'reel-studio'), badge: 'Open Studio' },
                  { title: 'Photos & Art', icon: 'fa-wand-magic-sparkles', desc: 'Neural AI lighting grade, background remove & 8K upscale.', color: '#E056FD', glow: 'hover:border-[#E056FD]', action: () => handleNavigate('creator', 'photo-studio'), badge: 'Alchemize' },
                  { title: 'Music & Audio', icon: 'fa-music', desc: 'Equalizer stems, sonic beats & AI music video storyboards.', color: '#00FFE0', glow: 'hover:border-[#00FFE0]', action: () => handleNavigate('creator', 'music-studio'), badge: 'Produce' },
                  { title: 'AI Autonomous Ops', icon: 'fa-microchip', desc: '24/7 AI Sentinel moderation, contest auto-judge & revenue routing.', color: '#E056FD', glow: 'hover:border-[#E056FD]', action: () => handleNavigate('creator', 'ai-ops'), badge: 'AI Engine' },
                  { title: 'Monetize & Quests', icon: 'fa-dollar-sign', desc: 'Daily bounty quests, direct tips & instant boss payout vaults.', color: '#FF007F', glow: 'hover:border-[#FF007F]', action: () => handleNavigate('creator', 'wallet'), badge: 'Claim Rewards' }
                ].map((item, i) => {
                  const isLiveStudioCard = item.title === 'Live Broadcast Studio';
                  return (
                    <Reveal key={i} delayClass={`reveal-delay-${i * 100}`}>
                      <div 
                        id={isLiveStudioCard ? 'live-broadcast-studio-card' : undefined}
                        onClick={item.action}
                        className={`boss-card p-10 rounded-[2.5rem] text-left relative overflow-hidden group h-full cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] ${item.glow} ${
                          isLiveStudioCard && isLiveStudioOnline
                            ? 'live-broadcast-card-pulse border-emerald-400/50'
                            : ''
                        } ${
                          isLiveStudioCard && isAvailabilityAnimating
                            ? isLiveStudioOnline
                              ? 'ring-2 ring-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.4)] scale-[1.01]'
                              : 'ring-2 ring-zinc-600 shadow-[0_0_20px_rgba(113,113,122,0.3)]'
                            : ''
                        }`}
                      >
                        {/* Urgent Pulse Energy Aura when Broadcast is Live/Online */}
                        {isLiveStudioCard && isLiveStudioOnline && (
                          <div className="absolute inset-0 pointer-events-none rounded-[2.5rem] overflow-hidden">
                            <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/10 via-[#00FFE0]/15 to-emerald-400/10 rounded-[2.5rem] blur-xl animate-pulse pointer-events-none" />
                            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00FFE0] to-transparent animate-pulse" />
                          </div>
                        )}

                        {/* Subtle availability background glow wave when status transitions */}
                        {isLiveStudioCard && isAvailabilityAnimating && (
                          <div
                            className={`absolute inset-0 pointer-events-none transition-opacity duration-700 animate-pulse ${
                              isLiveStudioOnline
                                ? 'bg-gradient-to-br from-emerald-500/10 via-transparent to-[#00FFE0]/10'
                                : 'bg-gradient-to-br from-zinc-700/10 via-transparent to-transparent'
                            }`}
                          />
                        )}

                        <div className="flex items-center justify-between mb-8 relative z-10">
                          {/* Card Icon Box */}
                          <div
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] relative ${
                              isLiveStudioCard
                                ? isLiveStudioOnline
                                  ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.35)] animate-pulse'
                                  : 'bg-white/5 border-white/10 text-zinc-500'
                                : 'bg-white/5 border-white/10 group-hover:border-white/30'
                            }`}
                          >
                            <i
                              className={`fa-solid ${item.icon} text-2xl transition-all duration-300 ${
                                isLiveStudioCard && isLiveStudioOnline ? 'text-emerald-400' : ''
                              }`}
                              style={isLiveStudioCard ? undefined : { color: item.color }}
                            ></i>
                            {/* Subtle broadcasting beacon dot when online */}
                            {isLiveStudioCard && isLiveStudioOnline && (
                              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-black shadow-[0_0_8px_#34d399]"></span>
                              </span>
                            )}
                          </div>

                          {/* Clickable Status Indicator on Live Broadcast Studio Card */}
                          {isLiveStudioCard ? (
                            <button
                              type="button"
                              id="live-broadcast-status-indicator"
                              onClick={handleToggleLiveStudioStatus}
                              className={`relative z-20 px-3.5 py-1.5 rounded-full font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all duration-300 cursor-pointer select-none border backdrop-blur-md ${
                                isLiveStudioOnline
                                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/70 hover:border-emerald-300 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse'
                                  : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-700/80 text-zinc-400 hover:text-zinc-200'
                              } ${
                                isAvailabilityAnimating
                                  ? 'scale-110 ring-2 ring-emerald-400/50 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                                  : 'hover:scale-105 active:scale-95'
                              }`}
                              title={`Broadcast Studio is currently ${isLiveStudioOnline ? 'Online (Available to Stream)' : 'Offline (Standby)'}. Click to toggle status.`}
                              aria-label={`Toggle Live Broadcast Studio status between Online and Offline`}
                            >
                              {/* Animated Radar Pulse Dot */}
                              <span className="relative flex h-2.5 w-2.5">
                                {isLiveStudioOnline && (
                                  <>
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90"></span>
                                    <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-[#00FFE0] opacity-50 scale-125"></span>
                                  </>
                                )}
                                <span
                                  className={`relative inline-flex rounded-full h-2.5 w-2.5 transition-colors duration-300 ${
                                    isLiveStudioOnline ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-zinc-500'
                                  }`}
                                ></span>
                              </span>
                              <span className="tracking-widest font-black">{isLiveStudioOnline ? 'Online' : 'Offline'}</span>
                              <span className="text-[8px] opacity-70 hover:opacity-100 transition-opacity">
                                <i className={`fa-solid fa-power-off text-[8px] ${isAvailabilityAnimating ? 'text-emerald-300 animate-spin' : ''}`}></i>
                              </span>
                            </button>
                          ) : (
                            <span className="text-[9px] font-mono uppercase font-bold tracking-widest text-gray-500 group-hover:text-white transition-colors flex items-center gap-1.5 opacity-0 group-hover:opacity-100">
                              {item.badge} <i className="fa-solid fa-arrow-right text-[8px]"></i>
                            </span>
                          )}
                        </div>

                        <div className="relative z-10">
                          <h3 className="text-lg font-black uppercase tracking-widest mb-2 text-white group-hover:text-[#00FFE0] transition-colors flex items-center justify-between">
                            <span>{item.title}</span>
                          </h3>

                          {/* Subtle Availability Status Pill for Live Broadcast Studio */}
                          {isLiveStudioCard && (
                            <div className="mb-3">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase transition-all duration-500 border ${
                                  isLiveStudioOnline
                                    ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)] animate-pulse'
                                    : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400'
                                } ${isAvailabilityAnimating ? 'scale-105' : ''}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isLiveStudioOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-ping' : 'bg-zinc-500'
                                  }`}
                                ></span>
                                <span>
                                  {isLiveStudioOnline
                                    ? 'Broadcaster Live • Streaming Active'
                                    : 'Broadcaster Standby • Offline'}
                                </span>
                              </span>
                            </div>
                          )}

                          <p className="text-gray-400 text-xs font-medium leading-relaxed mb-4">{item.desc}</p>
                          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[#E056FD]">
                            <span>{isLiveStudioCard ? (isLiveStudioOnline ? 'Launch Live Studio' : 'Enter Studio (Standby)') : 'Enter Feature'}</span>
                            <i className="fa-solid fa-chevron-right text-[8px] transform group-hover:translate-x-1 transition-transform"></i>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Janu's Live Studio Feed Spotlight */}
          <section className="py-24 px-6 md:px-12 bg-zinc-950/80 border-b border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#FF007F]/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF007F]/10 border border-[#FF007F]/30 text-[#FF007F] text-[10px] font-mono font-bold uppercase tracking-widest mb-3">
                    <span className="w-2 h-2 rounded-full bg-[#FF007F] animate-ping"></span>
                    <span>Live Studio Broadcast & Sound Stream</span>
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-serif font-black italic text-white">
                    Live Feed & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFE0] via-[#E056FD] to-[#FF007F]">Music Streams</span>
                  </h2>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleNavigate('creator', 'live')}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF007F] to-[#E056FD] text-white font-mono text-xs font-black uppercase tracking-wider hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,0,127,0.4)] flex items-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-tower-broadcast animate-pulse"></i>
                    <span>Go Live Now</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('creator', 'feed')}
                    className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>View All Live Reels</span>
                    <i className="fa-solid fa-arrow-right text-xs text-[#00FFE0]"></i>
                  </button>
                </div>
              </div>

              {/* 3-Column Live Highlights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Cyber Fluorescent Drift 2026',
                    type: '9:16 Viral Reel',
                    author: 'JanuVision_AI',
                    sound: 'Studio Bass Drop #1 (140 BPM)',
                    views: '124.5K',
                    badge: '🔴 LIVE STREAM',
                    badgeColor: 'bg-[#FF007F]',
                    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
                    action: () => handleNavigate('creator', 'feed')
                  },
                  {
                    title: 'Divine Gospel Soul Symphony',
                    type: 'Synthesized Beat & Chords',
                    author: 'GospelVision',
                    sound: 'Divine Chords in G-Major (95 BPM)',
                    views: '98.2K',
                    badge: '🎹 NEW MUSIC',
                    badgeColor: 'bg-[#00FFE0] text-black',
                    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
                    action: () => handleNavigate('creator', 'music-studio')
                  },
                  {
                    title: 'Executive Hologram Alchemist',
                    type: '8K Neural Portrait',
                    author: 'VentureQueen',
                    sound: 'Executive Ambient Harmony',
                    views: '76.1K',
                    badge: '✨ ART SPOTLIGHT',
                    badgeColor: 'bg-[#E056FD] text-black',
                    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
                    action: () => handleNavigate('creator', 'photo-studio')
                  }
                ].map((card, idx) => (
                  <div
                    key={idx}
                    onClick={card.action}
                    className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 group cursor-pointer hover:border-[#00FFE0] transition-all hover:scale-[1.02] shadow-2xl"
                  >
                    <img
                      src={card.image}
                      alt={card.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

                    {/* Top Pill */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-mono font-black uppercase tracking-wider ${card.badgeColor}`}>
                        {card.badge}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[9px] font-mono text-gray-300">
                        <i className="fa-solid fa-eye text-[#00FFE0] mr-1"></i> {card.views}
                      </span>
                    </div>

                    {/* Bottom Info */}
                    <div className="absolute bottom-4 left-4 right-4 z-10 space-y-1.5">
                      <p className="text-[10px] font-mono text-[#00FFE0] uppercase tracking-wider">{card.author}</p>
                      <h4 className="text-lg font-serif font-black italic text-white truncate">{card.title}</h4>
                      <p className="text-xs font-mono text-gray-300 flex items-center gap-1.5 truncate">
                        <i className="fa-solid fa-music text-[10px] text-[#E056FD]"></i>
                        <span className="truncate">{card.sound}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* AI Oracle Studio Component */}
          <AIStudio />

          {/* Contact - CLEAN EXECUTIVE LOOK WITH FUNCTIONAL ACTIONS */}
          <section id="contact" className="py-40 px-8 relative overflow-hidden flex flex-col items-center bg-[#050505]">
            <Reveal className="text-center z-10 max-w-4xl w-full">
              <span className="text-[#00FFE0] text-xs font-mono font-bold uppercase tracking-[0.8em] mb-6 block drop-shadow-[0_0_8px_rgba(0,255,224,0.6)]">Executive Correspondence</span>
              <h2 className="text-4xl sm:text-6xl md:text-8xl font-serif font-black mb-16 italic text-3d-luxury">
                Contact <span className="creations-script">Janu's Creations.</span>
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
                <a 
                  href="mailto:janujanuscreations@gmail.com" 
                  className="flex-1 w-full px-8 py-5 rounded-2xl glass border border-white/15 hover:border-[#00FFE0] text-sm sm:text-base font-mono font-bold text-white hover:text-[#00FFE0] transition-all tracking-tight flex items-center justify-center gap-3 group shadow-lg"
                >
                  <i className="fa-solid fa-envelope text-[#E056FD] group-hover:text-[#00FFE0] transition-colors"></i> 
                  <span>janujanuscreations@gmail.com</span>
                </a>
                <button
                  onClick={handleCopyEmail}
                  className="w-full sm:w-auto px-6 py-5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/15 hover:border-[#00FFE0]/50 text-xs font-mono font-bold uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                  title="Copy Email Address"
                >
                  <i className={`fa-solid ${emailCopied ? 'fa-check text-[#00FFE0]' : 'fa-copy'}`}></i>
                  <span>{emailCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </Reveal>
          </section>
        </>
      ) : view === 'creator' ? (
        <CreatorPortal 
          initialTab={creatorTab} 
          onBack={() => handleNavigate('home')} 
          onViewPublicProfile={() => handleNavigate('profile')}
        />
      ) : (
        <CreatorProfilePage
          initialCreatorId="january-rebl"
          onOpenShowcaseTab={() => handleNavigate('creator', 'showcase')}
          onTipCreator={handleTipFromProfile}
          onNavigateToStudio={(type) => {
            handleNavigate('home');
            setTimeout(() => {
              const studioEl = document.getElementById('studio');
              if (studioEl) studioEl.scrollIntoView({ behavior: 'smooth' });
            }, 150);
          }}
          onBackToHome={() => handleNavigate('home')}
        />
      )}

      {/* Footer with High-End JC Logo in Radiant Fluorescent Purple, Pink & Teal */}
      <footer className="py-28 border-t border-white/10 px-8 md:px-12 bg-black relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#FF007F] via-[#E056FD] to-[#00FFE0] opacity-85 shadow-[0_0_20px_#00FFE0]"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-16">
          <div className="flex items-center gap-6">
            <JCLogo size="lg" onClick={() => handleNavigate('home')} />
          </div>
          <div className="flex flex-col items-center md:items-end gap-6">
            <div className="flex gap-10 text-[11px] font-mono uppercase tracking-[0.4em] font-bold">
              <button onClick={() => setShowFounderDashboard(true)} className="text-[#E056FD] hover:text-white transition-colors flex items-center gap-2">
                <i className="fa-solid fa-key text-xs"></i> Founder Access
              </button>
              <a href="https://januscreations.sintra.site" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#00FFE0] transition-colors">
                Official Portal
              </a>
            </div>
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-gray-400 font-medium text-center md:text-right">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007F] via-[#E056FD] to-[#00FFE0] font-bold">Janu's Creations</span> &bull; Owned & Designed by January Rebl &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>

      {showFounderDashboard && (
        <FounderDashboard onClose={() => setShowFounderDashboard(false)} />
      )}

      {/* Studio Settings & Ambient Soundscape Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onNavigateToStudio={(tool) => {
          setView('creator');
          setCreatorTab(tool === 'movie' ? 'movie-studio' : tool === 'reel' ? 'reel-studio' : tool === 'photo' ? 'photo-studio' : 'music-studio');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenFounderVault={() => setShowFounderDashboard(true)}
      />

      {/* Global Quick Switcher Command Palette (Cmd/Ctrl + K) */}
      <QuickSwitcherCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectTab={(tab) => {
          handleNavigate('creator', tab);
        }}
        onOpenBossModal={() => setShowFounderDashboard(true)}
        onViewPublicProfile={() => handleNavigate('profile')}
        onBackToHome={() => handleNavigate('home')}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Global Sintra Website Embed Modal */}
      <SintraEmbedModal
        isOpen={showSintraEmbedModal}
        onClose={() => setShowSintraEmbedModal(false)}
      />

      {/* Global Boss Notification Toast Overlay */}
      <BossNotificationToast 
        onNavigateToTab={(tab) => handleNavigate('creator', tab as any)}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <FirebaseAuthProvider>
      <BossNotificationProvider>
        <AppContent />
      </BossNotificationProvider>
    </FirebaseAuthProvider>
  );
};

export default App;
