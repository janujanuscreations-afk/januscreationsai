import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CreatorTabType } from './CreatorPortal';
import { bossAudio } from '../utils/soundEffects';
import { ambientSoundscape, SOUNDSCAPE_TRACKS } from '../utils/ambientSoundscape';
import { triggerNeonExplosion } from '../utils/confetti';

export interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'studios' | 'dashboards' | 'executive' | 'actions';
  icon: string;
  color: string;
  badge?: string;
  shortcut?: string;
  keywords: string[];
  action: () => void;
}

interface QuickSwitcherCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: CreatorTabType) => void;
  onOpenBossModal?: () => void;
  onViewPublicProfile?: () => void;
  onBackToHome?: () => void;
  onSimulateTip?: () => void;
  onOpenSettings?: () => void;
  walletBalance?: number;
  bossLedgerTotal?: number;
}

type CategoryFilter = 'all' | 'studios' | 'dashboards' | 'executive' | 'actions';

export const QuickSwitcherCommandPalette: React.FC<QuickSwitcherCommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenBossModal,
  onViewPublicProfile,
  onBackToHome,
  onSimulateTip,
  onOpenSettings,
  walletBalance = 3840.50,
  bossLedgerTotal = 14580.00
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Command Registry
  const commands: CommandItem[] = useMemo(() => [
    // 🎨 CREATIVE STUDIOS
    {
      id: 'studio-reel',
      title: 'Reel & Video Editor',
      subtitle: '9:16 vertical reels, trim, speed curve, AI captions, filters & beat sync',
      category: 'studios',
      icon: 'fa-video',
      color: '#00F5D4',
      badge: 'STUDIO',
      shortcut: '⌘1',
      keywords: ['reel', 'video', 'editor', 'trim', 'captions', 'cut', 'short', 'tiktok', 'vertical', '9:16', 'clip'],
      action: () => onSelectTab('reel-studio')
    },
    {
      id: 'studio-movie',
      title: 'Movie & Cinema Director Studio',
      subtitle: '2.39:1 Hollywood Anamorphic cinema, screenplay drafting, 3-scene storyboards & LUT grades',
      category: 'studios',
      icon: 'fa-clapperboard',
      color: '#FF007F',
      badge: '4K CINEMA',
      shortcut: '⌘M',
      keywords: ['movie', 'cinema', 'film', 'director', 'screenplay', 'hollywood', 'anamorphic', 'lut', 'storyboard', 'scenes'],
      action: () => onSelectTab('movie-studio' as any)
    },
    {
      id: 'studio-photo',
      title: 'Photo & Art Alchemist',
      subtitle: 'Neural AI lighting grade, background remove, 8K upscale & cyber filters',
      category: 'studios',
      icon: 'fa-wand-magic-sparkles',
      color: '#C084FC',
      badge: 'STUDIO',
      shortcut: '⌘2',
      keywords: ['photo', 'art', 'alchemist', 'image', 'picture', 'lighting', 'grade', 'upscale', 'background', '8k'],
      action: () => onSelectTab('photo-studio')
    },
    {
      id: 'studio-music',
      title: 'Music & Audio Studio',
      subtitle: 'Multi-stem equalizer, synthesizer beats, vocal mastering & video storyboards',
      category: 'studios',
      icon: 'fa-music',
      color: '#818CF8',
      badge: 'STUDIO',
      shortcut: '⌘3',
      keywords: ['music', 'audio', 'studio', 'stem', 'equalizer', 'beat', 'synth', 'sound', 'song', 'track', 'master'],
      action: () => onSelectTab('music-studio')
    },
    {
      id: 'studio-voiceover',
      title: 'AI Voiceover & Vocal Alchemist',
      subtitle: 'Generate synthetic vocals, 8 voice profiles, emotional resonance & prosody blueprints',
      category: 'studios',
      icon: 'fa-microphone-lines',
      color: '#00F5D4',
      badge: 'AI VOCAL',
      keywords: ['voiceover', 'vocal', 'speech', 'ai voice', 'synthetic', 'tts', 'resonance', 'prosody', 'lyrics', 'vocals', 'dj drop', 'script'],
      action: () => onSelectTab('music-studio')
    },
    {
      id: 'studio-ai',
      title: 'AI Multi-Modal Super-Studio',
      subtitle: 'Chatbot, Lyria Music, Veo 3 Video, Image Alchemist, Live Voice, Grounding & Transcribe',
      category: 'studios',
      icon: 'fa-wand-magic-sparkles',
      color: '#00F5D4',
      badge: 'GEMINI 3',
      shortcut: '⌘4',
      keywords: ['ai', 'gemini', 'lyria', 'veo', 'chat', 'chatbot', 'voice', 'live', 'transcribe', 'grounding', 'superstudio', 'music generation', 'video generation'],
      action: () => onSelectTab('ai-studio')
    },
    {
      id: 'studio-live',
      title: 'Live Streams & Studio',
      subtitle: 'Real-time live stream feed, viewer count badges, chat overlay & broadcast studio',
      category: 'studios',
      icon: 'fa-tower-broadcast',
      color: '#FF007F',
      badge: 'LIVE',
      shortcut: '⌘5',
      keywords: ['live', 'broadcast', 'stream', 'streaming', 'feed', 'chat', 'sessions', 'join', 'viewers', 'superchat', 'obs', 'audience', 'gifting', 'camera'],
      action: () => onSelectTab('live')
    },

    // 📊 DASHBOARDS & INTELLIGENCE
    {
      id: 'dash-analytics',
      title: 'Advanced Analytics',
      subtitle: 'Granular second-by-second audience retention curves & traffic attribution',
      category: 'dashboards',
      icon: 'fa-chart-line',
      color: '#00F5D4',
      badge: 'PRO',
      shortcut: '⌘5',
      keywords: ['analytics', 'retention', 'traffic', 'charts', 'audience', 'dropoff', 'duration', 'pacing', 'metrics', 'data'],
      action: () => onSelectTab('analytics')
    },
    {
      id: 'dash-revenue-forecast',
      title: 'Predictive Revenue Forecasting',
      subtitle: 'Monte Carlo ML projections, growth sensitivity models & tip trajectory forecasting',
      category: 'dashboards',
      icon: 'fa-chart-mixed',
      color: '#C084FC',
      badge: 'FORECAST',
      keywords: ['predictive', 'revenue', 'forecast', 'monte carlo', 'tipping', 'projection', 'earnings', 'future', 'growth', 'superchat', 'bounty', 'simulator', 'model'],
      action: () => onSelectTab('analytics')
    },
    {
      id: 'dash-contests',
      title: 'Contests & Battles Arena',
      subtitle: 'Tournament brackets with instant AI benchmark scoring & cash prize pools',
      category: 'dashboards',
      icon: 'fa-trophy',
      color: '#FCD34D',
      badge: 'ARENA',
      shortcut: '⌘6',
      keywords: ['contests', 'battles', 'arena', 'tournament', 'prize', 'trophy', 'compete', 'judging', 'bounty'],
      action: () => onSelectTab('contests')
    },
    {
      id: 'dash-leaderboard',
      title: 'Live Leaderboard & Ranks',
      subtitle: 'Live sovereign rankings, trophies, earnings ticker & top creator tipping',
      category: 'dashboards',
      icon: 'fa-ranking-star',
      color: '#FF007F',
      badge: 'RANKS',
      shortcut: '⌘7',
      keywords: ['leaderboard', 'ranks', 'ranking', 'trophy', 'top', 'creator', 'earnings', 'ticker', 'score'],
      action: () => onSelectTab('leaderboard')
    },
    {
      id: 'dash-feed',
      title: 'Viral Reels & Feed Hub',
      subtitle: 'Explore trending reels, AI creations, community likes, and audio remixes',
      category: 'dashboards',
      icon: 'fa-compass',
      color: '#00F5D4',
      badge: 'FEED',
      keywords: ['feed', 'reels', 'explore', 'viral', 'posts', 'discovery', 'timeline', 'trending'],
      action: () => onSelectTab('feed')
    },
    {
      id: 'dash-showcase',
      title: 'Creator Showcase Portfolio',
      subtitle: 'Curated digital masterpiece portfolio with social link drops & tipping',
      category: 'dashboards',
      icon: 'fa-sparkles',
      color: '#C084FC',
      badge: 'PORTFOLIO',
      keywords: ['showcase', 'portfolio', 'curated', 'gallery', 'digital', 'art', 'nft', 'showcase'],
      action: () => onSelectTab('showcase')
    },
    {
      id: 'dash-ai-ops',
      title: 'AI Autonomous Operations',
      subtitle: '24/7 AI Sentinel auto-moderation, dispute judge & treasury settlement',
      category: 'dashboards',
      icon: 'fa-microchip',
      color: '#818CF8',
      badge: 'AI OPS',
      keywords: ['ai', 'ops', 'operations', 'sentinel', 'autonomous', 'moderation', 'engine', 'bot', 'security'],
      action: () => onSelectTab('ai-ops')
    },
    {
      id: 'dash-wallet',
      title: `Monetization & Quest Vault ($${walletBalance.toFixed(0)})`,
      subtitle: 'Daily creator bounty quests, tip transactions, and payout requests',
      category: 'dashboards',
      icon: 'fa-wallet',
      color: '#FCD34D',
      badge: 'WALLET',
      keywords: ['wallet', 'monetize', 'earnings', 'payout', 'money', 'cash', 'reward', 'bounty', 'quest', 'balance'],
      action: () => onSelectTab('wallet')
    },

    // 👑 EXECUTIVE & SOVEREIGN
    {
      id: 'exec-boss',
      title: `Boss Payout Gate & Vault ($${bossLedgerTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })})`,
      subtitle: 'Founder January Rebl governance, biometric vault approval & multi-sig ledger',
      category: 'executive',
      icon: 'fa-crown',
      color: '#00F5D4',
      badge: 'FOUNDER',
      shortcut: '⌘B',
      keywords: ['boss', 'founder', 'january', 'rebl', 'vault', 'treasury', 'gate', 'governance', 'ledger', 'audit', 'payout'],
      action: () => {
        if (onOpenBossModal) onOpenBossModal();
      }
    },
    {
      id: 'exec-profile',
      title: 'Public Creator Profile View',
      subtitle: 'Open public-facing creator profile, social links hub & digital showcase',
      category: 'executive',
      icon: 'fa-id-card-clip',
      color: '#C084FC',
      badge: 'PUBLIC',
      shortcut: '⌘P',
      keywords: ['profile', 'public', 'page', 'social', 'bio', 'link', 'creator', 'hub'],
      action: () => {
        if (onViewPublicProfile) onViewPublicProfile();
      }
    },
    {
      id: 'exec-home',
      title: 'Return to Studio Home',
      subtitle: 'Exit Creator Suite and return to Janu’s Creations studio home page',
      category: 'executive',
      icon: 'fa-house',
      color: '#818CF8',
      badge: 'HOME',
      shortcut: '⌘H',
      keywords: ['home', 'studio', 'exit', 'back', 'return', 'landing', 'welcome'],
      action: () => {
        if (onBackToHome) onBackToHome();
      }
    },

    // ⚡ QUICK ACTIONS & UTILITIES
    {
      id: 'act-settings-soundscape',
      title: 'Studio Settings & Ambient Soundscape',
      subtitle: 'Configure ambient synth-wave audio, 10Hz binaural focus, tape warmth & studio parameters',
      category: 'actions',
      icon: 'fa-sliders',
      color: '#00F5D4',
      badge: 'SETTINGS',
      shortcut: '⌘,',
      keywords: ['settings', 'ambient', 'soundscape', 'synthwave', 'focus', 'audio', 'music', 'binaural', 'volume', 'lo-fi', 'sound', 'preferences', 'chimes', 'fx'],
      action: () => {
        if (onOpenSettings) onOpenSettings();
      }
    },
    {
      id: 'act-toggle-soundscape',
      title: ambientSoundscape.isPlaying() ? 'Pause Ambient Soundscape' : 'Play Ambient Soundscape',
      subtitle: ambientSoundscape.isPlaying() ? 'Mute background synth-wave audio stream' : 'Start generative analog synth-wave focus audio (432Hz)',
      category: 'actions',
      icon: ambientSoundscape.isPlaying() ? 'fa-pause' : 'fa-play',
      color: '#C084FC',
      badge: 'AUDIO',
      keywords: ['play', 'pause', 'toggle', 'soundscape', 'synth', 'music', 'ambient', 'focus', 'background', 'audio', 'mute'],
      action: () => {
        ambientSoundscape.togglePlay();
        bossAudio.playSubtlePing();
      }
    },
    {
      id: 'act-soundscape-midnight',
      title: 'Ambient: Midnight Cyberpulse',
      subtitle: '432Hz Retro Synthwave with slow resonant lowpass filter sweeps',
      category: 'actions',
      icon: 'fa-waveform-lines',
      color: '#00F5D4',
      badge: '432Hz',
      keywords: ['midnight', 'cyberpulse', 'synthwave', 'soundscape', 'ambient', 'pad', 'flow'],
      action: () => {
        ambientSoundscape.setTrack('cyber-midnight');
        if (!ambientSoundscape.isPlaying()) ambientSoundscape.start('cyber-midnight');
      }
    },
    {
      id: 'act-soundscape-alpha',
      title: 'Ambient: Neon Alpha Focus',
      subtitle: '10Hz binaural differential with soft poly-chords for hyper-focus',
      category: 'actions',
      icon: 'fa-brain',
      color: '#C084FC',
      badge: 'ALPHA',
      keywords: ['neon', 'alpha', 'binaural', 'focus', 'concentration', 'brain', 'ambient'],
      action: () => {
        ambientSoundscape.setTrack('neon-alpha');
        if (!ambientSoundscape.isPlaying()) ambientSoundscape.start('neon-alpha');
      }
    },
    {
      id: 'act-soundscape-starlight',
      title: 'Ambient: Starlight Dreamscape',
      subtitle: 'Lush Lo-Fi ambient chords with analog tape saturation',
      category: 'actions',
      icon: 'fa-sparkles',
      color: '#FF007F',
      badge: 'LO-FI',
      keywords: ['starlight', 'dreamscape', 'lo-fi', 'ambient', 'chords', 'tape', 'relax'],
      action: () => {
        ambientSoundscape.setTrack('starlight-chords');
        if (!ambientSoundscape.isPlaying()) ambientSoundscape.start('starlight-chords');
      }
    },
    {
      id: 'act-simulate-tip',
      title: 'Simulate Live Tipping Storm',
      subtitle: 'Simulate an instant +$150 fan tip with neon confetti & sound chime',
      category: 'actions',
      icon: 'fa-bolt',
      color: '#FF007F',
      badge: 'SIMULATE',
      shortcut: '⌘T',
      keywords: ['simulate', 'tip', 'storm', 'confetti', 'cash', 'cheer', 'test', 'micro-tip', 'money'],
      action: () => {
        if (onSimulateTip) {
          onSimulateTip();
        } else {
          bossAudio.playTipChime(150);
          triggerNeonExplosion({ particleCount: 70, origin: { x: 0.5, y: 0.4 } });
        }
      }
    },
    {
      id: 'act-copy-link',
      title: 'Copy Sovereign Showcase Link',
      subtitle: 'Copy smart UTM-tagged link for social bio linkouts (IG, X, TikTok)',
      category: 'actions',
      icon: 'fa-copy',
      color: '#00F5D4',
      badge: 'SHARE',
      shortcut: '⌘S',
      keywords: ['copy', 'share', 'link', 'utm', 'url', 'invite', 'social'],
      action: () => {
        navigator.clipboard?.writeText?.(window.location.origin + '/?ref=janus_sovereign_cmd');
        bossAudio.playSubtlePing();
        triggerNeonExplosion({ particleCount: 30, origin: { x: 0.5, y: 0.5 } });
      }
    }
  ], [onSelectTab, onOpenBossModal, onViewPublicProfile, onBackToHome, onSimulateTip, onOpenSettings, walletBalance, bossLedgerTotal]);

  // Filter commands by active category and search query
  const filteredCommands = useMemo(() => {
    let list = commands;
    
    if (activeCategory !== 'all') {
      list = list.filter(cmd => cmd.category === activeCategory);
    }

    if (!query.trim()) return list;

    const lowerQuery = query.toLowerCase().trim();
    return list.filter(cmd => {
      const matchTitle = cmd.title.toLowerCase().includes(lowerQuery);
      const matchSubtitle = cmd.subtitle.toLowerCase().includes(lowerQuery);
      const matchCategory = cmd.category.toLowerCase().includes(lowerQuery);
      const matchKeywords = cmd.keywords.some(k => k.toLowerCase().includes(lowerQuery));
      return matchTitle || matchSubtitle || matchCategory || matchKeywords;
    });
  }, [commands, activeCategory, query]);

  // Ensure selectedIndex stays within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  // Focus input and play open sound when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setActiveCategory('all');
      bossAudio.playCommandPaletteOpen();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current && filteredCommands.length > 0) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, filteredCommands]);

  // Execute selected command
  const executeCommand = (cmd: CommandItem) => {
    bossAudio.playPaletteExecute();
    onClose();
    cmd.action();
  };

  // Keyboard navigation within the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      bossAudio.playPaletteNavigate();
      setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      bossAudio.playPaletteNavigate();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        executeCommand(filteredCommands[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      bossAudio.playSubtlePing();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="quick-switcher-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          bossAudio.playSubtlePing();
          onClose();
        }
      }}
      className="fixed inset-0 z-[500] bg-black/85 backdrop-blur-2xl flex items-start justify-center pt-16 sm:pt-24 px-4 pb-6 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Ambient background glow behind modal */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-gradient-to-r from-[#00F5D4]/15 via-[#C084FC]/15 to-[#FF007F]/15 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Command Palette Dialog Container */}
      <div
        id="quick-switcher-modal"
        className="w-full max-w-2xl bg-gradient-to-b from-zinc-950 via-black to-zinc-950 border border-white/20 rounded-[2rem] shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(0,245,212,0.15)] overflow-hidden relative z-10 animate-in zoom-in-95 duration-200"
        onKeyDown={handleKeyDown}
      >
        {/* Top Header & Search Input */}
        <div className="p-5 sm:p-6 border-b border-white/10 relative">
          
          {/* Subtle Top Cyber Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F]"></div>

          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#00F5D4]/15 border border-[#00F5D4]/40 text-[#00F5D4] flex items-center justify-center text-sm shadow-[0_0_15px_rgba(0,245,212,0.3)] shrink-0">
              <i className="fa-solid fa-bolt animate-pulse"></i>
            </div>

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                id="quick-switcher-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a studio name, metric, or command (e.g. 'Reel', 'Analytics', 'Music')..."
                className="w-full bg-transparent text-white placeholder-gray-500 font-mono text-sm sm:text-base font-medium focus:outline-none pr-8 tracking-wide"
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 text-xs transition-colors"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            {/* Close / ESC key indicator */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                ESC
              </span>
              <button
                id="quick-switcher-close-btn"
                onClick={() => {
                  bossAudio.playSubtlePing();
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors text-xs cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 mt-4 overflow-x-auto no-scrollbar pt-1">
            {[
              { id: 'all', label: 'All Commands', count: commands.length, icon: 'fa-asterisk' },
              { id: 'studios', label: 'Studios', count: commands.filter(c => c.category === 'studios').length, icon: 'fa-wand-magic-sparkles' },
              { id: 'dashboards', label: 'Dashboards & Metrics', count: commands.filter(c => c.category === 'dashboards').length, icon: 'fa-chart-line' },
              { id: 'executive', label: 'Executive & Sovereign', count: commands.filter(c => c.category === 'executive').length, icon: 'fa-crown' },
              { id: 'actions', label: 'Quick Utilities', count: commands.filter(c => c.category === 'actions').length, icon: 'fa-bolt' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id as CategoryFilter);
                  bossAudio.playSubtlePing();
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeCategory === cat.id
                    ? 'bg-[#00F5D4]/20 border border-[#00F5D4] text-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.25)]'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <i className={`fa-solid ${cat.icon} text-[9px]`}></i>
                <span>{cat.label}</span>
                <span className="text-[9px] opacity-70">({cat.count})</span>
              </button>
            ))}
          </div>

        </div>

        {/* Results Command List */}
        <div
          ref={listRef}
          id="quick-switcher-results"
          className="max-h-[380px] overflow-y-auto p-3 sm:p-4 space-y-2 no-scrollbar"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-gray-500 flex items-center justify-center mx-auto text-lg">
                <i className="fa-solid fa-magnifying-glass"></i>
              </div>
              <p className="text-xs font-mono text-gray-400">
                No matching studios or commands found for &quot;<span className="text-[#00F5D4]">{query}</span>&quot;
              </p>
              <button
                onClick={() => {
                  setQuery('');
                  setActiveCategory('all');
                }}
                className="text-[11px] font-mono text-[#C084FC] hover:underline cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  id={`command-item-${cmd.id}`}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => {
                    if (selectedIndex !== idx) {
                      setSelectedIndex(idx);
                      bossAudio.playPaletteNavigate();
                    }
                  }}
                  className={`p-3 sm:p-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 group border ${
                    isSelected
                      ? 'bg-gradient-to-r from-white/[0.08] via-[#00F5D4]/10 to-white/[0.04] border-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.2)] scale-[1.01]'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Icon container */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: `${cmd.color}15`,
                        border: `1px solid ${cmd.color}40`,
                        color: cmd.color
                      }}
                    >
                      <i className={`fa-solid ${cmd.icon}`}></i>
                    </div>

                    {/* Text info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs sm:text-sm font-mono font-bold tracking-tight truncate ${
                          isSelected ? 'text-[#00F5D4]' : 'text-white group-hover:text-white'
                        }`}>
                          {cmd.title}
                        </span>

                        {cmd.badge && (
                          <span
                            className="px-2 py-0.5 rounded-md text-[8px] font-mono font-black uppercase tracking-wider"
                            style={{
                              backgroundColor: `${cmd.color}20`,
                              border: `1px solid ${cmd.color}40`,
                              color: cmd.color
                            }}
                          >
                            {cmd.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] font-mono text-gray-400 truncate mt-0.5 leading-snug">
                        {cmd.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Right shortcut or jump icon */}
                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.shortcut && (
                      <span className="hidden sm:inline-block px-2 py-1 rounded-lg bg-black/60 border border-white/10 text-gray-400 text-[10px] font-mono font-bold">
                        {cmd.shortcut}
                      </span>
                    )}

                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#00F5D4] text-black shadow-md translate-x-0.5'
                        : 'bg-white/5 text-gray-500 group-hover:text-white'
                    }`}>
                      <i className="fa-solid fa-arrow-right text-[10px]"></i>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="p-3.5 sm:p-4 bg-zinc-950/90 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-gray-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-gray-300 font-bold">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-gray-300 font-bold">↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[#00F5D4] font-bold">↵</kbd>
              <span>Jump</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-gray-300 font-bold">ESC</kbd>
              <span>Dismiss</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4] animate-pulse"></span>
            <span>Janu&apos;s Quick Switcher Engine</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QuickSwitcherCommandPalette;
