import React, { useState, useEffect } from 'react';
import Reveal from './Reveal';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';
import { ambientSoundscape } from '../utils/ambientSoundscape';
import ReelVideoEditor from './ReelVideoEditor';
import PhotoArtworkEditor from './PhotoArtworkEditor';
import MusicVideoCreator from './MusicVideoCreator';
import CreatorMonetizationRewards from './CreatorMonetizationRewards';
import ReelsFeed, { FeedItem } from './ReelsFeed';
import LiveBroadcastStudio from './LiveBroadcastStudio';
import ContestsArena from './ContestsArena';
import LiveLeaderboard from './LiveLeaderboard';
import AIOperationsHub from './AIOperationsHub';
import FounderDashboard from './FounderDashboard';
import BossEarningsTicker from './BossEarningsTicker';
import RealtimeLiveStreamFeed, { ActiveLiveSession } from './RealtimeLiveStreamFeed';
import { useBossNotifications } from '../context/BossNotificationContext';
import CreatorShowcase from './CreatorShowcase';
import AICoPilot from './AICoPilot';
import AdvancedAnalytics from './AdvancedAnalytics';
import QuickSwitcherCommandPalette from './QuickSwitcherCommandPalette';
import SettingsModal from './SettingsModal';
import AmbientSoundscapePill from './AmbientSoundscapePill';
import { getSavedUserProfile, USER_OFFICIAL_FACE_AVATAR } from '../utils/userProfileState';
import Last30DaysRevenueCard from './Last30DaysRevenueCard';
import { firestoreService } from '../services/firebase';
import AISuperStudio from './AISuperStudio';
import MovieDirectorStudio from './MovieDirectorStudio';

export type CreatorTabType = 
  | 'feed' 
  | 'showcase'
  | 'analytics'
  | 'ai-studio'
  | 'live' 
  | 'contests' 
  | 'leaderboard'
  | 'reel-studio' 
  | 'movie-studio'
  | 'photo-studio' 
  | 'music-studio' 
  | 'ai-ops' 
  | 'wallet' 
  | 'boss';

interface CreatorPortalProps {
  initialTab?: CreatorTabType;
  onBack: () => void;
  onViewPublicProfile?: () => void;
}

const initialFeedItems: FeedItem[] = [
  {
    id: '1',
    type: 'reel',
    title: 'Neon Cyber Drift 2026',
    desc: 'POV: You run your entire creator empire inside Janu’s Creations. Zero switching apps. ⚡',
    mediaUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
    author: 'JanuVision_AI',
    avatar: USER_OFFICIAL_FACE_AVATAR,
    likes: 3420,
    commentsCount: 284,
    tipsEarned: 850,
    soundTitle: 'Sovereign Bass Drop #1 (140 BPM)',
    duration: '15s',
    timestamp: '12m ago',
    isLiked: false
  },
  {
    id: '2',
    type: 'photo',
    title: 'Executive Hologram Portrait',
    desc: 'Color graded and AI background removed inside Janu’s Photo Alchemist. 👑',
    mediaUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
    author: 'VentureQueen',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
    likes: 1980,
    commentsCount: 142,
    tipsEarned: 420,
    timestamp: '1h ago',
    isLiked: true
  },
  {
    id: '3',
    type: 'music',
    title: 'Divine Gospel Soul Symphony',
    desc: 'Multi-track stem mastered with AI Video Storyboard synchronization.',
    mediaUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    author: 'GospelSovereign',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    likes: 4210,
    commentsCount: 512,
    tipsEarned: 1250,
    soundTitle: 'Divine Chords in G-Major (95 BPM)',
    duration: '30s',
    timestamp: '3h ago',
    isLiked: false
  },
  {
    id: '4',
    type: 'reel',
    title: 'Midnight Heavy Metal Flame Stage',
    desc: 'Beat-synced cuts and fluorescent particle shaders generated on mobile in 30 seconds.',
    mediaUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
    author: 'IronAlchemist',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    likes: 2890,
    commentsCount: 310,
    tipsEarned: 690,
    soundTitle: 'Heavy Strobe Fury (165 BPM)',
    duration: '12s',
    timestamp: '5h ago',
    isLiked: false
  }
];

export const CreatorPortal: React.FC<CreatorPortalProps> = ({
  initialTab = 'feed',
  onBack,
  onViewPublicProfile
}) => {
  const [activeTab, setActiveTab] = useState<CreatorTabType>(initialTab);
  const [walletBalance, setWalletBalance] = useState(3840.50);
  const [feedItems, setFeedItems] = useState<FeedItem[]>(initialFeedItems);
  const [bossLedgerTotal, setBossLedgerTotal] = useState(14580.00);
  const [showBossModal, setShowBossModal] = useState(false);
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAICoPilot, setShowAICoPilot] = useState(false);
  const [liveSectionMode, setLiveSectionMode] = useState<'feed' | 'studio'>('feed');

  const { notifyBoss } = useBossNotifications();

  // Auto-play ambient synth-wave focus soundscape when entering creative editing studios
  useEffect(() => {
    if (activeTab === 'reel-studio' || activeTab === 'movie-studio' || activeTab === 'photo-studio' || activeTab === 'music-studio') {
      ambientSoundscape.handleFocusStudioEnter();
    }
  }, [activeTab]);

  // Global Keyboard Shortcuts: Cmd/Ctrl + K (Quick Switcher), Cmd/Ctrl + , (Settings), Cmd/Ctrl + J (AI Co-Pilot)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowQuickSwitcher(prev => !prev);
      }
      // Check for Cmd+, (Mac) or Ctrl+, (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && (e.key === ',')) {
        e.preventDefault();
        setShowSettingsModal(prev => !prev);
      }
      // Check for Cmd+J (Mac) or Ctrl+J (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        setShowAICoPilot(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTipCreator = (author: string, amount: number) => {
    const creatorCut = amount * 0.85;
    const januCut = amount * 0.15;
    
    // Increment boss treasury
    setBossLedgerTotal(prev => prev + januCut);

    // Record dynamic revenue transaction to Firestore
    firestoreService.recordRevenue({
      amount,
      netAmount: creatorCut,
      platformCut: januCut,
      source: 'Live Stream Tip',
      category: 'tips',
      description: `Tipped $${amount.toFixed(2)} to ${author}`,
      creatorName: author,
      status: 'settled'
    }).catch(console.warn);

    notifyBoss({
      type: 'tip',
      title: 'Creator Tip Inflow!',
      subtitle: `+$${amount.toFixed(2)} USD`,
      message: `You tipped $${amount.toFixed(2)} to ${author}. $${januCut.toFixed(2)} (15% Boss cut) auto-settled to January Rebl.`,
      amount,
      platformCut: januCut,
      creator: { name: author, handle: author.startsWith('@') ? author : `@${author.replace(/\s+/g, '')}` },
      sender: 'You',
      actionLabel: 'View Boss Ledger',
      onAction: () => setShowBossModal(true)
    });

    showToast(`Sent $${amount.toFixed(2)} Tip to ${author}! (15% Boss platform cut credited to January Rebl)`);
  };

  const handleCreditBossTreasury = (amount: number, reason: string) => {
    setBossLedgerTotal(prev => prev + amount);

    // Record dynamic revenue transaction to Firestore
    firestoreService.recordRevenue({
      amount,
      netAmount: +(amount * 0.85).toFixed(2),
      platformCut: amount,
      source: 'Boss Treasury Credit',
      category: 'gateway',
      description: `+$${amount.toFixed(2)} platform inflow (${reason})`,
      creatorName: 'January Rebl',
      status: 'settled'
    }).catch(console.warn);

    notifyBoss({
      type: 'tip',
      title: 'Boss Treasury Credited!',
      subtitle: `+$${amount.toFixed(2)} Platform Cut`,
      message: `+$${amount.toFixed(2)} auto-routed to January Rebl's Vault (${reason}).`,
      amount,
      platformCut: amount,
      actionLabel: 'Open Ledger',
      onAction: () => setShowBossModal(true)
    });
    showToast(`+$${amount.toFixed(2)} Platform Cut auto-routed to January Rebl's Vault (${reason})`);
  };

  const handlePublishReel = (reelData: {
    title: string;
    desc: string;
    videoUrl: string;
    author: string;
    soundTitle: string;
    duration: string;
  }) => {
    const newItem: FeedItem = {
      id: Date.now().toString(),
      type: 'reel',
      title: reelData.title,
      desc: reelData.desc,
      mediaUrl: reelData.videoUrl,
      author: reelData.author,
      avatar: getSavedUserProfile().avatar || USER_OFFICIAL_FACE_AVATAR,
      likes: 1,
      commentsCount: 0,
      tipsEarned: 0,
      soundTitle: reelData.soundTitle,
      duration: reelData.duration,
      timestamp: 'Just now',
      isLiked: true
    };

    setFeedItems([newItem, ...feedItems]);
    setActiveTab('feed');
    showToast('Reel published to Janu’s Sovereign Feed!');
  };

  const handlePublishArtwork = (artData: {
    title: string;
    desc: string;
    imageUrl: string;
    author: string;
  }) => {
    const newItem: FeedItem = {
      id: Date.now().toString(),
      type: 'photo',
      title: artData.title,
      desc: artData.desc,
      mediaUrl: artData.imageUrl,
      author: artData.author,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
      likes: 1,
      commentsCount: 0,
      tipsEarned: 0,
      timestamp: 'Just now',
      isLiked: true
    };

    setFeedItems([newItem, ...feedItems]);
    setActiveTab('feed');
    showToast('Artwork published to Janu’s Sovereign Feed!');
  };

  const handlePublishMusicVideo = (mvData: {
    title: string;
    artist: string;
    genre: string;
    storyboard: string;
  }) => {
    const newItem: FeedItem = {
      id: Date.now().toString(),
      type: 'music',
      title: mvData.title,
      desc: `Mastered ${mvData.genre} track and visual storyboard.`,
      mediaUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
      author: mvData.artist,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
      likes: 1,
      commentsCount: 0,
      tipsEarned: 0,
      soundTitle: `${mvData.title} (${mvData.genre})`,
      timestamp: 'Just now',
      isLiked: true
    };

    setFeedItems([newItem, ...feedItems]);
    setActiveTab('feed');
    showToast('Music & MV published to Sound Vault & Feed!');
  };

  const handlePublishToLiveFeed = (data: {
    title: string;
    artist: string;
    genre: string;
    desc: string;
  }) => {
    const newItem: FeedItem = {
      id: Date.now().toString(),
      type: 'music',
      title: data.title,
      desc: data.desc,
      mediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
      author: data.artist,
      avatar: getSavedUserProfile().avatar || USER_OFFICIAL_FACE_AVATAR,
      likes: 5,
      commentsCount: 1,
      tipsEarned: 0,
      soundTitle: `${data.title} • ${data.genre}`,
      timestamp: 'Live now',
      isLiked: true
    };

    setFeedItems([newItem, ...feedItems]);
    setActiveTab('feed');
    showToast('🔴 Song broadcasted to Janu’s Live Feed!');
  };

  const handleRequestPayout = (amount: number) => {
    setWalletBalance(prev => Math.max(0, prev - amount));
    showToast(`$${amount.toFixed(2)} Payout Request dispatched to January Rebl’s Boss Approval Queue.`);
  };

  return (
    <div className="min-h-screen bg-[#050505]/80 backdrop-blur-sm text-white pt-24 pb-20 relative overflow-hidden selection:bg-[#C084FC] selection:text-black">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-black/90 border border-[#00F5D4] text-[#00F5D4] px-6 py-3 rounded-full text-xs font-mono font-bold shadow-[0_0_30px_rgba(0,245,212,0.4)] flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <i className="fa-solid fa-bolt text-[#00F5D4] text-sm animate-bounce"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Top Header & Navigation Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button 
                onClick={onBack}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Back to Home</span>
              </button>
              <span className="px-3 py-1 rounded-full bg-[#C084FC]/10 text-[#C084FC] text-[10px] font-mono font-bold uppercase tracking-widest border border-[#C084FC]/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4] animate-ping"></span>
                <span>Autonomous AI Operations Active</span>
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black italic text-white tracking-tight">
              Janu’s All-In-One Creator Suite
            </h1>
            <p className="text-xs sm:text-sm font-mono text-gray-400 mt-1 max-w-2xl font-light">
              Go live, edit reels & art, drop beats, enter contests, and earn rewards. AI runs 100% of the operations while founder January Rebl approves all payouts.
            </p>
          </div>

          {/* Boss / Founder Quick Oversight, Settings & Public Profile Button */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Ambient Soundscape Live Pill */}
            <AmbientSoundscapePill onOpenSettings={() => setShowSettingsModal(true)} />

            {/* Quick Switcher (Cmd/Ctrl + K) Button */}
            <button
              id="quick-switcher-nav-trigger"
              onClick={() => setShowQuickSwitcher(true)}
              className="px-4 py-3 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-[#00F5D4] text-gray-300 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-2.5 shadow-lg group cursor-pointer"
              title="Quick Switcher Command Palette (⌘K / Ctrl+K)"
            >
              <div className="w-5 h-5 rounded-lg bg-[#00F5D4]/15 text-[#00F5D4] flex items-center justify-center text-[10px] group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-magnifying-glass"></i>
              </div>
              <span className="hidden sm:inline">Quick Switcher</span>
              <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-gray-300 text-[10px] font-mono font-bold group-hover:bg-[#00F5D4]/20 group-hover:text-[#00F5D4] transition-colors">
                ⌘K
              </span>
            </button>

            {/* AI Co-Pilot Button */}
            <button
              onClick={() => setShowAICoPilot(true)}
              className="px-4 py-3 rounded-2xl bg-zinc-900/90 border border-[#00F5D4]/40 hover:border-[#00F5D4] text-gray-300 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-lg group cursor-pointer"
              title="Open Janu AI Co-Pilot (⌘J / Ctrl+J)"
            >
              <div className="w-5 h-5 rounded-lg bg-[#00F5D4]/15 text-[#00F5D4] flex items-center justify-center text-[10px] group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-brain-circuit"></i>
              </div>
              <span className="hidden sm:inline">AI Co-Pilot</span>
              <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-gray-300 text-[10px] font-mono font-bold group-hover:bg-[#00F5D4]/20 group-hover:text-[#00F5D4] transition-colors">
                ⌘J
              </span>
            </button>

            {/* Studio Settings Gear Button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-[#00F5D4] text-gray-300 hover:text-[#00F5D4] transition-all cursor-pointer shadow-lg group"
              title="Studio Settings & Ambient Soundscape (⌘, / Ctrl+,)"
            >
              <i className="fa-solid fa-sliders text-sm group-hover:rotate-45 transition-transform"></i>
            </button>

            {onViewPublicProfile && (
              <button
                onClick={onViewPublicProfile}
                className="px-4 py-3 rounded-2xl bg-zinc-900 border border-[#C084FC]/40 hover:border-[#C084FC] text-white hover:text-[#C084FC] text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <i className="fa-solid fa-id-card-clip text-sm text-[#C084FC]"></i>
                <span className="hidden sm:inline">Public Profile</span>
              </button>
            )}

            <button
              onClick={() => setShowBossModal(true)}
              className="px-5 py-3 rounded-2xl bg-black/80 border border-[#00F5D4]/40 hover:border-[#00F5D4] text-left transition-all group cursor-pointer shadow-[0_0_20px_rgba(0,245,212,0.2)]"
            >
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-crown text-[#00F5D4] text-xs group-hover:scale-125 transition-transform"></i>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00F5D4]">
                  Boss Command (January Rebl)
                </span>
              </div>
              <p className="text-[9px] font-mono text-gray-400 mt-0.5">
                Vault: ${bossLedgerTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} • Authorize Payouts
              </p>
            </button>
          </div>
        </div>

        {/* Real-Time Boss Earnings Ticker Ribbon */}
        <BossEarningsTicker
          initialVaultTotal={bossLedgerTotal}
          onOpenFounderDashboard={() => setShowBossModal(true)}
          onRevenueIncrement={(amount, reason) => {
            setBossLedgerTotal(prev => +(prev + amount).toFixed(2));
          }}
        />

        {/* Dynamic Last 30 Days Revenue Summary Card from Firestore */}
        <div className="mb-8">
          <Last30DaysRevenueCard
            onOpenFounderVault={() => setShowBossModal(true)}
            onOpenAnalytics={() => setActiveTab('analytics')}
            onOpenMonetize={() => setActiveTab('wallet')}
          />
        </div>

        {/* Master Tab Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 border-b border-white/10 no-scrollbar">
          
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 sm:px-5 py-3 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'feed'
                ? 'bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-black shadow-[0_0_20px_rgba(0,245,212,0.4)] scale-105'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <i className="fa-solid fa-compass"></i>
            <span>Reels & Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('showcase')}
            className={`px-4 sm:px-5 py-3 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'showcase'
                ? 'bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-black shadow-[0_0_20px_rgba(255,0,127,0.4)] scale-105'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <i className="fa-solid fa-sparkles"></i>
            <span>Creator Showcase</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 sm:px-5 py-3 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-[#00F5D4] via-[#818CF8] to-[#C084FC] text-black font-black shadow-[0_0_20px_rgba(0,245,212,0.4)] scale-105'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <i className="fa-solid fa-chart-line"></i>
            <span>Advanced Analytics</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#00F5D4]/20 border border-[#00F5D4]/40 text-[#00F5D4] text-[8px] font-mono font-bold">
              PRO
            </span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 sm:px-5 py-3 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'live'
                ? 'bg-gradient-to-r from-[#FF007F] to-[#00F5D4] text-black font-black shadow-[0_0_20px_rgba(255,0,127,0.4)] scale-105'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <i className="fa-solid fa-tower-broadcast animate-pulse text-[#FF007F]"></i>
            <span>Live Streams & Studio</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#FF007F]/20 border border-[#FF007F]/40 text-[#FF007F] text-[8px] font-mono font-bold">
              4 LIVE
            </span>
          </button>

          <button
            onClick={() => setActiveTab('contests')}
            className={`px-4 sm:px-5 py-3 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'contests'
                ? 'bg-gradient-to-r from-[#FCD34D] to-[#FF007F] text-black font-black shadow-[0_0_20px_rgba(252,211,77,0.4)] scale-105'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <i className="fa-solid fa-trophy"></i>
            <span>Contests & Battles</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 sm:px-5 py-3 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-black shadow-[0_0_20px_rgba(0,245,212,0.4)] scale-105'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <i className="fa-solid fa-ranking-star"></i>
            <span>Live Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab('reel-studio')}
            className={`px-4 sm:px-5 py-3 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'reel-studio'
                ? 'bg-gradient-to-r from-[#C084FC] to-[#818CF8] text-black font-black shadow-[0_0_20px_rgba(192,132,252,0.4)] scale-105'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <i className="fa-solid fa-video"></i>
            <span>Reel Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('movie-studio')}
            className={`px-4 sm:px-5 py-3 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'movie-studio'
                ? 'bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00FFE0] text-black font-black shadow-[0_0_20px_rgba(255,0,127,0.4)] scale-105'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-[#C084FC]/30'
            }`}
          >
            <i className="fa-solid fa-clapperboard text-[#00FFE0]"></i>
            <span>Movie Studio</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#00FFE0]/20 text-[#00FFE0] text-[8px] font-mono font-bold">4K</span>
          </button>

          <button
            onClick={() => setActiveTab('photo-studio')}
            className={`px-4 sm:px-5 py-3 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'photo-studio'
                ? 'bg-gradient-to-r from-[#818CF8] to-[#00F5D4] text-black font-black shadow-[0_0_20px_rgba(129,140,248,0.4)] scale-105'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>Photo Alchemist</span>
          </button>

          <button
            onClick={() => setActiveTab('music-studio')}
            className={`px-4 sm:px-5 py-3 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'music-studio'
                ? 'bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-black shadow-[0_0_20px_rgba(0,245,212,0.4)] scale-105'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <i className="fa-solid fa-music"></i>
            <span>Music Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-studio')}
            className={`px-4 sm:px-5 py-3 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'ai-studio'
                ? 'bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F] text-black font-black shadow-[0_0_25px_rgba(0,245,212,0.5)] scale-105'
                : 'bg-white/5 text-[#00F5D4] hover:text-white hover:bg-white/10 border border-[#00F5D4]/30'
            }`}
          >
            <i className="fa-solid fa-wand-magic-sparkles animate-pulse text-[#00F5D4]"></i>
            <span>AI Studio Suite</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#00F5D4]/20 border border-[#00F5D4]/50 text-[#00F5D4] text-[8px] font-mono font-bold">
              GEMINI 3
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ai-ops')}
            className={`px-4 sm:px-5 py-3 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'ai-ops'
                ? 'bg-gradient-to-r from-[#C084FC] to-[#00F5D4] text-black font-black shadow-[0_0_20px_rgba(192,132,252,0.4)] scale-105'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <i className="fa-solid fa-microchip"></i>
            <span>AI Operations</span>
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-4 sm:px-5 py-3 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'wallet'
                ? 'bg-gradient-to-r from-[#FCD34D] to-[#00F5D4] text-black font-black shadow-[0_0_20px_rgba(252,211,77,0.4)] scale-105'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <i className="fa-solid fa-wallet"></i>
            <span>Monetize (${walletBalance.toFixed(0)})</span>
          </button>

          <button
            onClick={() => setShowBossModal(true)}
            className="px-4 sm:px-5 py-3 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider bg-black/60 border border-[#00F5D4]/40 text-[#00F5D4] hover:bg-[#00F5D4]/10 transition-all whitespace-nowrap cursor-pointer flex items-center gap-2"
          >
            <i className="fa-solid fa-crown"></i>
            <span>Boss Payout Gate</span>
          </button>

        </div>

        {/* ACTIVE TAB CONTENT WITH SUBTLE NEON-FADING ENTRANCE ANIMATION */}
        <div key={activeTab} className="neon-tab-entrance relative">
          {/* Subtle Dynamic Neon Light Sweep on Entrance */}
          <div className="absolute -top-3 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C084FC] via-[#00F5D4] to-transparent opacity-80 blur-[1px] neon-tab-flare pointer-events-none"></div>

          {activeTab === 'feed' && (
            <ReelsFeed 
              items={feedItems}
              onTipCreator={handleTipCreator}
              onOpenStudio={(tool) => {
                if (tool === 'reel') setActiveTab('reel-studio');
                else if (tool === 'photo') setActiveTab('photo-studio');
                else if (tool === 'music') setActiveTab('music-studio');
              }}
              onRemixSound={(soundTitle) => {
                setActiveTab('reel-studio');
                showToast(`Loaded sound "${soundTitle}" into Reel Studio!`);
              }}
            />
          )}

          {activeTab === 'showcase' && (
            <CreatorShowcase
              onTipCreator={handleTipCreator}
              onViewPublicProfile={onViewPublicProfile}
              onNavigateToStudio={(tool) => {
                if (tool === 'reel') setActiveTab('reel-studio');
                else if (tool === 'photo') setActiveTab('photo-studio');
                else if (tool === 'music') setActiveTab('music-studio');
              }}
            />
          )}

          {activeTab === 'analytics' && (
            <AdvancedAnalytics
              walletBalance={walletBalance}
              onNavigateToStudio={(tool) => {
                if (tool === 'reel') setActiveTab('reel-studio');
                else if (tool === 'photo') setActiveTab('photo-studio');
                else if (tool === 'music') setActiveTab('music-studio');
              }}
            />
          )}

          {activeTab === 'live' && (
            <div className="space-y-6">
              {/* Sub-navigation Switcher between Real-time Live Streams Feed and Broadcaster Studio */}
              <div className="flex items-center justify-between flex-wrap gap-4 p-2 rounded-2xl bg-zinc-950/80 border border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLiveSectionMode('feed');
                      bossAudio.playSubtlePing();
                    }}
                    className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                      liveSectionMode === 'feed'
                        ? 'bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-black shadow-lg shadow-[#FF007F]/30 scale-105'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <i className="fa-solid fa-satellite-dish animate-pulse"></i>
                    <span>Live Streams Feed</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-white text-[9px] font-mono">
                      4 Active
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLiveSectionMode('studio');
                      bossAudio.playSubtlePing();
                    }}
                    className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                      liveSectionMode === 'studio'
                        ? 'bg-gradient-to-r from-[#00F5D4] to-[#38BDF8] text-black font-black shadow-lg shadow-[#00F5D4]/30 scale-105'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <i className="fa-solid fa-tower-broadcast"></i>
                    <span>Broadcaster Studio</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-gray-400 px-3">
                  <span className="flex items-center gap-1.5 text-[#00F5D4]">
                    <i className="fa-solid fa-bolt text-[10px]"></i>
                    <span>Real-time Stream Engine</span>
                  </span>
                  <span className="text-gray-600">•</span>
                  <span>15% Founder Split (January Rebl)</span>
                </div>
              </div>

              {/* View Render */}
              {liveSectionMode === 'feed' ? (
                <RealtimeLiveStreamFeed
                  onJoinStream={(session) => {
                    showToast(`Connected to ${session.creatorName}'s live broadcast!`);
                  }}
                  onTipCreator={handleTipCreator}
                  onOpenBroadcasterStudio={() => setLiveSectionMode('studio')}
                />
              ) : (
                <LiveBroadcastStudio 
                  onTipBossAndCreator={(author, amt) => handleTipCreator(author, amt)}
                  onSaveAsReel={(streamData) => {
                    handlePublishReel({
                      title: streamData.title,
                      desc: streamData.desc,
                      videoUrl: streamData.videoUrl,
                      author: 'Live Broadcaster',
                      soundTitle: 'Live Studio Master Audio',
                      duration: '30s'
                    });
                    setLiveSectionMode('feed');
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'contests' && (
            <ContestsArena 
              onCreditBossTreasury={handleCreditBossTreasury}
              onNavigateToStudio={(tool) => {
                if (tool === 'reel') setActiveTab('reel-studio');
                else if (tool === 'photo') setActiveTab('photo-studio');
                else if (tool === 'music') setActiveTab('music-studio');
              }}
            />
          )}

          {activeTab === 'leaderboard' && (
            <LiveLeaderboard 
              onTipCreator={handleTipCreator}
              onOpenLiveStream={() => setActiveTab('live')}
              onOpenContests={() => setActiveTab('contests')}
            />
          )}

          {activeTab === 'reel-studio' && (
            <ReelVideoEditor 
              onPublishToFeed={handlePublishReel}
            />
          )}

          {activeTab === 'movie-studio' && (
            <MovieDirectorStudio
              onSendToReelEditor={(clipData) => {
                setActiveTab('reel-studio');
                showToast(`Sent "${clipData.title}" to Reel Studio!`);
              }}
              onSendToMusicStudio={(concept) => {
                setActiveTab('music-studio');
                showToast('Loaded soundtrack concept into Music Studio!');
              }}
              onPublishToFeed={(movieData) => {
                handlePublishReel({
                  title: movieData.title,
                  desc: movieData.desc,
                  videoUrl: movieData.mediaUrl,
                  author: movieData.author,
                  soundTitle: 'Cinematic Movie Score',
                  duration: '45s'
                });
                showToast(`Published "${movieData.title}" to Creators Feed!`);
              }}
            />
          )}

          {activeTab === 'photo-studio' && (
            <PhotoArtworkEditor 
              onPublishToFeed={handlePublishArtwork}
            />
          )}

          {activeTab === 'music-studio' && (
            <MusicVideoCreator 
              onPublishMusicVideo={handlePublishMusicVideo}
              onPublishToLiveFeed={handlePublishToLiveFeed}
              onNavigateToReelStudio={(trackData) => {
                setActiveTab('reel-studio');
                showToast(`Loaded "${trackData?.title || 'Master Track'}" into Reel Studio!`);
              }}
            />
          )}

          {activeTab === 'ai-studio' && (
            <AISuperStudio 
              onNavigateToStudio={(tool) => {
                if (tool === 'reel') setActiveTab('reel-studio');
                else if (tool === 'movie') setActiveTab('movie-studio');
                else if (tool === 'photo') setActiveTab('photo-studio');
                else if (tool === 'music') setActiveTab('music-studio');
              }}
            />
          )}

          {activeTab === 'ai-ops' && (
            <AIOperationsHub 
              onOpenFounderDashboard={() => setShowBossModal(true)}
            />
          )}

          {activeTab === 'wallet' && (
            <CreatorMonetizationRewards 
              balance={walletBalance}
              onUpdateBalance={setWalletBalance}
              onRequestPayout={handleRequestPayout}
              onNavigateToStudio={(tool) => {
                if (tool === 'reel') setActiveTab('reel-studio');
                else if (tool === 'movie') setActiveTab('movie-studio');
                else if (tool === 'photo') setActiveTab('photo-studio');
                else if (tool === 'music') setActiveTab('music-studio');
              }}
              onNavigateToAnalytics={() => setActiveTab('analytics')}
              onOpenFounderDashboard={() => setShowBossModal(true)}
              onOpenQuickSwitcher={() => setShowQuickSwitcher(true)}
            />
          )}
        </div>

      </div>

      {/* BOSS OVERLAY MODAL */}
      {showBossModal && (
        <FounderDashboard onClose={() => setShowBossModal(false)} />
      )}

      {/* QUICK SWITCHER COMMAND PALETTE (Cmd/Ctrl + K) */}
      <QuickSwitcherCommandPalette
        isOpen={showQuickSwitcher}
        onClose={() => setShowQuickSwitcher(false)}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          showToast(`Switched to ${tab.replace('-', ' ').toUpperCase()}`);
        }}
        onOpenBossModal={() => setShowBossModal(true)}
        onViewPublicProfile={onViewPublicProfile}
        onBackToHome={onBack}
        onSimulateTip={() => {
          handleTipCreator('JanuVision_AI', 150);
        }}
        onOpenSettings={() => setShowSettingsModal(true)}
        walletBalance={walletBalance}
        bossLedgerTotal={bossLedgerTotal}
      />

      {/* STUDIO SETTINGS & AMBIENT SOUNDSCAPE MODAL */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onNavigateToStudio={(tool) => {
          if (tool === 'reel') setActiveTab('reel-studio');
          else if (tool === 'photo') setActiveTab('photo-studio');
          else if (tool === 'music') setActiveTab('music-studio');
        }}
        onOpenFounderVault={() => setShowBossModal(true)}
      />

      {/* AI CO-PILOT MODAL UTILITY */}
      <AICoPilot 
        activeTab={activeTab}
        isOpen={showAICoPilot}
        onOpen={() => setShowAICoPilot(true)}
        onClose={() => setShowAICoPilot(false)}
        onNavigateToTab={(tab) => {
          setActiveTab(tab);
          setShowAICoPilot(false);
        }}
      />
    </div>
  );
};

export default CreatorPortal;
