import React, { useState, useEffect, useRef } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';
import { getSavedUserProfile, USER_OFFICIAL_FACE_AVATAR } from '../utils/userProfileState';

export interface ActiveLiveSession {
  id: string;
  creatorName: string;
  creatorHandle: string;
  avatar: string;
  isVerified: boolean;
  streamTitle: string;
  category: 'AI Production' | 'Live Music & Stems' | 'Digital Art' | 'AMA & Battles' | 'Vocal Symphony';
  previewThumbnail: string;
  videoSampleUrl?: string;
  currentViewers: number;
  likesCount: number;
  uptime: string;
  featuredTags: string[];
  recentTipsEarned: number;
  recentChatMessages: {
    id: string;
    user: string;
    avatar: string;
    text: string;
    badge?: 'VIP' | 'Top Tipper' | 'Mod' | 'Boss' | 'Pioneer';
    timestamp: string;
  }[];
}

interface RealtimeLiveStreamFeedProps {
  onJoinStream?: (session: ActiveLiveSession) => void;
  onTipCreator?: (creatorHandle: string, amount: number) => void;
  onOpenBroadcasterStudio?: () => void;
}

const INITIAL_LIVE_SESSIONS: ActiveLiveSession[] = [
  {
    id: 'stream-1',
    creatorName: 'JanuVision AI',
    creatorHandle: '@januvision_master',
    avatar: USER_OFFICIAL_FACE_AVATAR,
    isVerified: true,
    streamTitle: '⚡ Sovereign Cyber Drift: Live AI 808 Bass Stem Production & Visual Grading',
    category: 'Live Music & Stems',
    previewThumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
    currentViewers: 3420,
    likesCount: 18450,
    uptime: '42m',
    featuredTags: ['#StemMastering', '#LiveBass', '#NeonCyber', '#15BossCut'],
    recentTipsEarned: 620,
    recentChatMessages: [
      {
        id: 'msg-1',
        user: 'VentureBoss_X',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        text: 'That 140 BPM drop is pure gold! Sent $50 tip 🔥',
        badge: 'Top Tipper',
        timestamp: '12s ago'
      },
      {
        id: 'msg-2',
        user: 'CyberQueen_99',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
        text: 'How did you layer that crystal arpeggio so smoothly?',
        badge: 'VIP',
        timestamp: '8s ago'
      },
      {
        id: 'msg-3',
        user: 'BeatAlchemist',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
        text: 'Masterclass in real-time creative orchestration 👑',
        badge: 'Pioneer',
        timestamp: 'Just now'
      }
    ]
  },
  {
    id: 'stream-2',
    creatorName: 'GospelSovereign',
    creatorHandle: '@gospel_divine',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    isVerified: true,
    streamTitle: '🕊️ Divine Gospel Soul Chords: Multi-Harmonic Choral Jam & Praise Session',
    category: 'Vocal Symphony',
    previewThumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    currentViewers: 2180,
    likesCount: 14200,
    uptime: '1h 15m',
    featuredTags: ['#GospelSoul', '#ChoralHarmonies', '#DivineKeys', '#AcousticAI'],
    recentTipsEarned: 480,
    recentChatMessages: [
      {
        id: 'msg-4',
        user: 'PraiseMaster',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        text: 'The G-major progression touches the soul! ✨',
        badge: 'VIP',
        timestamp: '15s ago'
      },
      {
        id: 'msg-5',
        user: 'HarmonyQueen',
        avatar: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=200&auto=format&fit=crop',
        text: 'Can we request the 95 BPM gospel bridge?',
        badge: 'Mod',
        timestamp: '3s ago'
      }
    ]
  },
  {
    id: 'stream-3',
    creatorName: 'VentureQueen',
    creatorHandle: '@venture_queen',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
    isVerified: true,
    streamTitle: '👑 Executive Holographic Art Speedrun & NFT Royalty Structuring Live',
    category: 'Digital Art',
    previewThumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
    currentViewers: 1750,
    likesCount: 9800,
    uptime: '28m',
    featuredTags: ['#ArtAlchemist', '#HoloGrading', '#SovereignDesign'],
    recentTipsEarned: 390,
    recentChatMessages: [
      {
        id: 'msg-6',
        user: 'DesignTitan',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
        text: 'The color depth on that hologram shader is unmatched 💎',
        badge: 'Top Tipper',
        timestamp: '5s ago'
      },
      {
        id: 'msg-7',
        user: 'AestheticGod',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        text: 'Tipped $25! Keep dropping sovereign gems!',
        badge: 'VIP',
        timestamp: 'Just now'
      }
    ]
  },
  {
    id: 'stream-4',
    creatorName: 'IronAlchemist',
    creatorHandle: '@iron_heavy_metal',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    isVerified: true,
    streamTitle: '🔥 Midnight Metal Stage: Double-Bass Strobe Riffs & Synth Arp Battles',
    category: 'AMA & Battles',
    previewThumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
    currentViewers: 2940,
    likesCount: 22100,
    uptime: '56m',
    featuredTags: ['#HeavyMetal', '#165BPM', '#StageFury', '#BattleArena'],
    recentTipsEarned: 740,
    recentChatMessages: [
      {
        id: 'msg-8',
        user: 'RiffRider_88',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        text: 'THE DISTORTION PEDAL IS ON FIRE! ⚡⚡',
        badge: 'Top Tipper',
        timestamp: '18s ago'
      },
      {
        id: 'msg-9',
        user: 'MetalHead_Boss',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
        text: 'Join the battle arena queue! Who is next?',
        badge: 'VIP',
        timestamp: 'Just now'
      }
    ]
  }
];

const POOL_OF_LIVE_CHATS = [
  { user: 'NeonPhantom', text: 'This stream visualizer is insanely crisp!', badge: 'VIP' as const },
  { user: 'MasterProducer', text: 'Sending support from Tokyo! 🇯🇵', badge: 'Pioneer' as const },
  { user: 'SoundArchitect', text: 'That low-end resonance is rattling my speakers 🔊', badge: undefined },
  { user: 'ReblChampion', text: 'Just sent $40 tip to the creator pool! 💎', badge: 'Top Tipper' as const },
  { user: 'QuantumVibes', text: 'The Janu suite makes multitasking effortless ✨', badge: 'VIP' as const },
  { user: 'ApexCreator', text: 'Subscribed for exclusive stem stems downloads ⚡', badge: 'Pioneer' as const }
];

export const RealtimeLiveStreamFeed: React.FC<RealtimeLiveStreamFeedProps> = ({
  onJoinStream,
  onTipCreator,
  onOpenBroadcasterStudio
}) => {
  const [sessions, setSessions] = useState<ActiveLiveSession[]>(INITIAL_LIVE_SESSIONS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeWatchingSession, setActiveWatchingSession] = useState<ActiveLiveSession | null>(null);
  
  // Interactive full viewer state
  const [liveChatInput, setLiveChatInput] = useState('');
  const [activeSessionMessages, setActiveSessionMessages] = useState<ActiveLiveSession['recentChatMessages']>([]);
  const [activeSessionLikes, setActiveSessionLikes] = useState<number>(0);
  const [activeSessionViewers, setActiveSessionViewers] = useState<number>(0);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipCustomAmount, setTipCustomAmount] = useState<number>(25);
  const [copiedStreamLink, setCopiedStreamLink] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Periodic random live viewer fluctuation & chat updates
  useEffect(() => {
    const viewerInterval = setInterval(() => {
      setSessions(prev =>
        prev.map(s => {
          const delta = Math.floor(Math.random() * 21) - 9;
          const nextViewers = Math.max(800, s.currentViewers + delta);
          
          // Randomly inject a live incoming chat to one session
          if (Math.random() > 0.4) {
            const randomChat = POOL_OF_LIVE_CHATS[Math.floor(Math.random() * POOL_OF_LIVE_CHATS.length)];
            const newMsg = {
              id: Date.now().toString() + Math.random().toString(),
              user: randomChat.user,
              avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 50000000)}?q=80&w=200&auto=format&fit=crop`,
              text: randomChat.text,
              badge: randomChat.badge,
              timestamp: 'Just now'
            };
            const updatedChats = [...s.recentChatMessages.slice(-3), newMsg];
            return {
              ...s,
              currentViewers: nextViewers,
              likesCount: s.likesCount + Math.floor(Math.random() * 4) + 1,
              recentChatMessages: updatedChats
            };
          }

          return { ...s, currentViewers: nextViewers };
        })
      );
    }, 3500);

    return () => clearInterval(viewerInterval);
  }, []);

  // Update active watching session when selected or background updates
  useEffect(() => {
    if (activeWatchingSession) {
      const current = sessions.find(s => s.id === activeWatchingSession.id);
      if (current) {
        setActiveSessionMessages(current.recentChatMessages);
        setActiveSessionViewers(current.currentViewers);
        setActiveSessionLikes(current.likesCount);
      }
    }
  }, [sessions, activeWatchingSession]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeSessionMessages]);

  const categories = ['All', 'Live Music & Stems', 'AI Production', 'Digital Art', 'Vocal Symphony', 'AMA & Battles'];

  const filteredSessions = selectedCategory === 'All'
    ? sessions
    : sessions.filter(s => s.category === selectedCategory);

  const totalActiveViewers = sessions.reduce((acc, curr) => acc + curr.currentViewers, 0);

  const handleOpenJoinSession = (session: ActiveLiveSession) => {
    bossAudio.playSubtlePing();
    triggerNeonExplosion({
      particleCount: 40,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'subtle'
    });
    setActiveWatchingSession(session);
    setActiveSessionMessages(session.recentChatMessages);
    setActiveSessionViewers(session.currentViewers);
    setActiveSessionLikes(session.likesCount);
    if (onJoinStream) {
      onJoinStream(session);
    }
  };

  const handleSendLiveChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveChatInput.trim() || !activeWatchingSession) return;

    const newMsg = {
      id: Date.now().toString(),
      user: 'You (Janu VIP)',
      avatar: getSavedUserProfile().avatar || USER_OFFICIAL_FACE_AVATAR,
      text: liveChatInput.trim(),
      badge: 'VIP' as const,
      timestamp: 'Just now'
    };

    setActiveSessionMessages(prev => [...prev, newMsg]);
    setLiveChatInput('');
    bossAudio.playSubtlePing();

    // Trigger slight confetti burst
    triggerNeonExplosion({
      particleCount: 15,
      origin: { x: 0.8, y: 0.8 },
      intensity: 'subtle'
    });
  };

  const handleSendTip = (amount: number) => {
    if (!activeWatchingSession) return;
    bossAudio.playTipChime(amount);
    
    if (onTipCreator) {
      onTipCreator(activeWatchingSession.creatorHandle, amount);
    }

    const tipMsg = {
      id: Date.now().toString(),
      user: 'You (Janu Patron)',
      avatar: getSavedUserProfile().avatar || USER_OFFICIAL_FACE_AVATAR,
      text: `💎 Sent a $${amount} Instant Tip to ${activeWatchingSession.creatorName}! (15% Boss cut credited)`,
      badge: 'Top Tipper' as const,
      timestamp: 'Just now'
    };

    setActiveSessionMessages(prev => [...prev, tipMsg]);
    setShowTipModal(false);
    triggerNeonExplosion({
      particleCount: 80,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'grand'
    });
  };

  const handleSendHeartReaction = () => {
    setActiveSessionLikes(prev => prev + 1);
    bossAudio.playSubtlePing();
    triggerNeonExplosion({
      particleCount: 20,
      origin: { x: 0.85, y: 0.7 },
      intensity: 'subtle'
    });
  };

  return (
    <div className="space-y-6 w-full">
      {/* Real-time Live Stream Feed Header Banner */}
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Fluorescent Ambient Neon Flares */}
        <div className="absolute top-0 right-1/4 w-96 h-40 bg-gradient-to-br from-[#FF007F]/20 via-[#00F5D4]/15 to-transparent blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-72 h-32 bg-[#C084FC]/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3.5 py-1 rounded-full bg-[#FF007F]/20 border border-[#FF007F]/40 text-[#FF007F] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-[#FF007F]/20">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF007F] animate-ping"></span>
                <span>Live Broadcast Network</span>
              </span>

              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-mono flex items-center gap-1.5">
                <i className="fa-solid fa-users text-[#00F5D4] text-xs"></i>
                <strong className="text-white font-bold">{totalActiveViewers.toLocaleString()}</strong> Tuning In Live
              </span>

              <span className="px-3 py-1 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[#00F5D4] text-xs font-mono font-bold">
                {sessions.length} Streams Active
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-black italic text-white tracking-tight">
              Real-Time <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4]">Live Stream Feed</span>
            </h2>
            <p className="text-xs sm:text-sm font-mono text-gray-400 font-light leading-relaxed">
              Experience zero-latency live broadcasts from top platform pioneers. Jump directly into sessions, engage with dynamic chat overlays, and tip creators in real-time.
            </p>
          </div>

          {/* Quick Go-Live CTA */}
          <div className="flex items-center gap-3 shrink-0">
            {onOpenBroadcasterStudio && (
              <button
                type="button"
                onClick={onOpenBroadcasterStudio}
                className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF007F] to-[#C084FC] hover:from-[#FF007F]/90 hover:to-[#C084FC]/90 text-white font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-[#FF007F]/30 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-tower-broadcast animate-pulse"></i>
                <span>Launch Your Stream</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                bossAudio.playSubtlePing();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-black shadow-md shadow-[#00F5D4]/30 scale-105'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {cat === 'All' && <i className="fa-solid fa-globe text-[10px]"></i>}
              {cat === 'Live Music & Stems' && <i className="fa-solid fa-music text-[10px]"></i>}
              {cat === 'AI Production' && <i className="fa-solid fa-microchip text-[10px]"></i>}
              {cat === 'Digital Art' && <i className="fa-solid fa-wand-magic-sparkles text-[10px]"></i>}
              {cat === 'Vocal Symphony' && <i className="fa-solid fa-microphone-lines text-[10px]"></i>}
              {cat === 'AMA & Battles' && <i className="fa-solid fa-trophy text-[10px]"></i>}
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Active Live Streams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSessions.map((session) => (
          <div
            key={session.id}
            className="group relative rounded-[2rem] bg-zinc-950/90 border border-white/10 hover:border-[#00F5D4]/60 transition-all duration-300 overflow-hidden shadow-xl flex flex-col justify-between"
          >
            {/* Stream Video / Thumbnail Stage with Live Chat Overlay Preview */}
            <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
              <img
                src={session.previewThumbnail}
                alt={session.streamTitle}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90 group-hover:brightness-100"
              />

              {/* Dynamic Scanline & Gradient Tint Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

              {/* Top Controls: Live Viewer Count Badge & Category */}
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  {/* Fluorescent Live Viewer Badge */}
                  <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#FF007F]/50 text-white text-[11px] font-mono font-bold flex items-center gap-2 shadow-lg shadow-[#FF007F]/20">
                    <span className="w-2 h-2 rounded-full bg-[#FF007F] animate-pulse"></span>
                    <span className="text-[#FF007F] uppercase tracking-wider text-[10px]">LIVE</span>
                    <span className="text-gray-400">•</span>
                    <i className="fa-solid fa-eye text-[#00F5D4] text-[10px]"></i>
                    <span className="text-white font-mono">{session.currentViewers.toLocaleString()}</span>
                  </span>

                  <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-gray-300 text-[10px] font-mono">
                    {session.uptime} live
                  </span>
                </div>

                <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#00F5D4]/40 text-[#00F5D4] text-[10px] font-mono font-bold uppercase tracking-wider">
                  {session.category}
                </span>
              </div>

              {/* Dynamic Live Chat Overlay Preview (Streaming Comments) */}
              <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
                <div className="space-y-1.5 max-h-28 overflow-hidden flex flex-col justify-end">
                  {session.recentChatMessages.slice(-2).map((chat) => (
                    <div
                      key={chat.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 text-white max-w-[90%] shadow-lg animate-fadeIn"
                    >
                      <img
                        src={chat.avatar}
                        alt={chat.user}
                        className="w-4 h-4 rounded-full object-cover border border-white/20 shrink-0"
                      />
                      <span className="text-[10px] font-mono font-bold text-[#00F5D4] truncate">
                        {chat.user}:
                      </span>
                      <span className="text-[10px] font-mono text-gray-200 truncate">
                        {chat.text}
                      </span>
                      {chat.badge && (
                        <span className={`text-[8px] font-mono px-1 py-0.2 rounded font-bold uppercase shrink-0 ${
                          chat.badge === 'Top Tipper' ? 'bg-[#FCD34D]/20 text-[#FCD34D] border border-[#FCD34D]/40' :
                          chat.badge === 'VIP' ? 'bg-[#FF007F]/20 text-[#FF007F] border border-[#FF007F]/40' :
                          'bg-[#C084FC]/20 text-[#C084FC] border border-[#C084FC]/40'
                        }`}>
                          {chat.badge}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stream Info & Fluorescent Action Bar */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Creator Metadata */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={session.avatar}
                      alt={session.creatorName}
                      className="w-11 h-11 rounded-2xl object-cover border-2 border-[#00F5D4]/40"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#FF007F] border-2 border-black flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-white font-mono">{session.creatorName}</h4>
                      {session.isVerified && (
                        <i className="fa-solid fa-circle-check text-[11px] text-[#00F5D4]"></i>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-gray-400">{session.creatorHandle}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-mono text-gray-500 uppercase block">Tips Earned</span>
                  <span className="text-xs font-mono font-bold text-[#00F5D4]">${session.recentTipsEarned}</span>
                </div>
              </div>

              {/* Stream Title */}
              <h3 className="text-sm font-bold text-white font-mono line-clamp-2 leading-snug group-hover:text-[#00F5D4] transition-colors">
                {session.streamTitle}
              </h3>

              {/* Tags */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {session.featuredTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons: Fluorescent Join Button & Quick Tip */}
              <div className="pt-2 border-t border-white/10 flex items-center gap-3">
                {/* Fluorescent 'Join' Button */}
                <button
                  type="button"
                  onClick={() => handleOpenJoinSession(session)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#00F5D4] via-[#38BDF8] to-[#C084FC] hover:from-[#00F5D4]/90 hover:via-[#38BDF8]/90 hover:to-[#C084FC]/90 text-black font-mono font-black text-xs uppercase tracking-wider shadow-lg shadow-[#00F5D4]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-play text-xs"></i>
                  <span>Join Stream</span>
                </button>

                {/* Quick Interactive Preview Trigger */}
                <button
                  type="button"
                  onClick={() => handleOpenJoinSession(session)}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white font-mono text-xs transition-all flex items-center justify-center cursor-pointer"
                  title="Open Live Chat & Interactive Viewer"
                >
                  <i className="fa-solid fa-comments text-[#00F5D4]"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* INTERACTIVE FULL-SCREEN / MODAL LIVE STREAM VIEWER */}
      {activeWatchingSession && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="w-full max-w-5xl max-h-[95vh] bg-zinc-950 border border-white/15 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,245,212,0.25)] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-zinc-900/80">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={activeWatchingSession.avatar}
                    alt={activeWatchingSession.creatorName}
                    className="w-10 h-10 rounded-xl object-cover border border-[#00F5D4]"
                  />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#FF007F] border-2 border-black animate-ping"></span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-mono font-bold text-white">{activeWatchingSession.creatorName}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#FF007F]/20 text-[#FF007F] text-[9px] font-mono font-bold uppercase border border-[#FF007F]/40">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-gray-400">{activeWatchingSession.streamTitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopiedStreamLink(true);
                    bossAudio.playSubtlePing();
                    setTimeout(() => setCopiedStreamLink(false), 3000);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <i className={`fa-solid ${copiedStreamLink ? 'fa-check text-[#00F5D4]' : 'fa-share-nodes'}`}></i>
                  <span>{copiedStreamLink ? 'Copied' : 'Share'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveWatchingSession(null)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
            </div>

            {/* Modal Body: Split Live Video Stage and Live Chat Stream */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
              
              {/* Left 2 Cols: Video Stream Viewport */}
              <div className="lg:col-span-2 bg-black relative flex flex-col justify-between overflow-hidden min-h-[300px] lg:min-h-[460px]">
                <img
                  src={activeWatchingSession.previewThumbnail}
                  alt="Live Broadcast Viewport"
                  className="absolute inset-0 w-full h-full object-cover brightness-90"
                />

                {/* Ambient Video Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none"></div>

                {/* Top Overlay Stats */}
                <div className="relative z-10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#FF007F]/40 text-[#FF007F] text-xs font-mono font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#FF007F] animate-ping"></span>
                      <span>{activeSessionViewers.toLocaleString()} Viewers</span>
                    </span>
                    <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[#00F5D4] text-xs font-mono">
                      HD 60 FPS
                    </span>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-gray-300 text-xs font-mono">
                    Uptime: {activeWatchingSession.uptime}
                  </span>
                </div>

                {/* Bottom Overlay Controls */}
                <div className="relative z-10 p-4 flex items-center justify-between gap-3 bg-gradient-to-t from-black via-black/70 to-transparent">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTipModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FCD34D] to-[#FF007F] text-black font-mono font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-[#FCD34D]/20 hover:scale-105 transition-all cursor-pointer"
                    >
                      <i className="fa-solid fa-gift"></i>
                      <span>Send Tip</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSendHeartReaction}
                      className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-[#FF007F] font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <i className="fa-solid fa-heart animate-bounce text-sm"></i>
                      <span className="text-white font-bold">{activeSessionLikes.toLocaleString()}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href="https://www.paypal.com/ncp/payment/Z6PDFZBTSUBAG"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-[#0079C1]/40 hover:bg-[#0079C1]/80 border border-[#0079C1] text-white font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all"
                    >
                      <i className="fa-brands fa-paypal text-[#38BDF8]"></i>
                      <span className="hidden sm:inline">PayPal Instant Checkout</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Right 1 Col: Dynamic Live Chat Overlay Stream */}
              <div className="bg-zinc-950 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-between h-[300px] lg:h-full">
                
                {/* Chat Title */}
                <div className="p-3.5 border-b border-white/10 bg-zinc-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-comments text-[#00F5D4] text-xs"></i>
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Live Chat Stream</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/10 text-[#00F5D4] text-[9px] font-mono font-bold">
                    Connected
                  </span>
                </div>

                {/* Messages List */}
                <div
                  ref={chatScrollRef}
                  className="flex-1 p-4 space-y-3 overflow-y-auto no-scrollbar"
                >
                  {activeSessionMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex items-start gap-2.5 text-xs font-mono bg-white/[0.02] p-2 rounded-xl border border-white/5"
                    >
                      <img
                        src={msg.avatar}
                        alt={msg.user}
                        className="w-6 h-6 rounded-full object-cover border border-white/15 shrink-0 mt-0.5"
                      />
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold text-[#00F5D4] truncate">{msg.user}</span>
                            {msg.badge && (
                              <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                                msg.badge === 'Top Tipper' ? 'bg-[#FCD34D]/20 text-[#FCD34D] border border-[#FCD34D]/40' :
                                msg.badge === 'VIP' ? 'bg-[#FF007F]/20 text-[#FF007F] border border-[#FF007F]/40' :
                                'bg-[#C084FC]/20 text-[#C084FC] border border-[#C084FC]/40'
                              }`}>
                                {msg.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-gray-500 shrink-0">{msg.timestamp}</span>
                        </div>
                        <p className="text-gray-200 text-[11px] leading-relaxed break-words">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <form
                  onSubmit={handleSendLiveChatMessage}
                  className="p-3 border-t border-white/10 bg-zinc-900/80 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={liveChatInput}
                    onChange={(e) => setLiveChatInput(e.target.value)}
                    placeholder="Send a live message..."
                    className="flex-1 bg-black/70 border border-white/15 focus:border-[#00F5D4] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none placeholder:text-gray-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2.5 rounded-xl bg-[#00F5D4] hover:bg-[#00F5D4]/80 text-black font-mono font-bold text-xs flex items-center justify-center transition-all cursor-pointer shadow-md shadow-[#00F5D4]/20"
                  >
                    <i className="fa-solid fa-paper-plane"></i>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tip Modal Inside Stream View */}
      {showTipModal && activeWatchingSession && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-white/15 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <i className="fa-solid fa-gift text-[#FCD34D] text-lg"></i>
                <h3 className="text-base font-mono font-bold text-white">
                  Tip {activeWatchingSession.creatorName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTipModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-4 gap-2">
              {[10, 25, 50, 100].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTipCustomAmount(amt)}
                  className={`py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
                    tipCustomAmount === amt
                      ? 'bg-[#00F5D4] text-black font-black shadow-md shadow-[#00F5D4]/30'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Commission Split Transparency */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-[10px] font-mono space-y-1 text-gray-400">
              <div className="flex justify-between">
                <span>Creator Earnings (85%):</span>
                <span className="text-emerald-400 font-bold">${(tipCustomAmount * 0.85).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Boss Platform Fee (15% January Rebl):</span>
                <span className="text-[#00F5D4] font-bold">${(tipCustomAmount * 0.15).toFixed(2)}</span>
              </div>
            </div>

            {/* Direct PayPal Checkout */}
            <a
              href="https://www.paypal.com/ncp/payment/Z6PDFZBTSUBAG"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-[#0079C1] hover:bg-[#0079C1]/80 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <i className="fa-brands fa-paypal"></i>
              <span>Pay with PayPal Direct Portal</span>
            </a>

            <button
              type="button"
              onClick={() => handleSendTip(tipCustomAmount)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-mono font-black text-xs uppercase tracking-wider shadow-lg shadow-[#00F5D4]/30 hover:scale-[1.02] transition-all cursor-pointer"
            >
              Confirm & Send ${tipCustomAmount} Tip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeLiveStreamFeed;
