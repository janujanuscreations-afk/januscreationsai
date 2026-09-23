import React, { useState, useEffect } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import ShareModal from './ShareModal';
import { getSavedUserProfile, subscribeUserProfile, USER_OFFICIAL_FACE_AVATAR } from '../utils/userProfileState';

export interface ShowcaseItem {
  id: string;
  type: 'reel' | 'photo' | 'music';
  title: string;
  description: string;
  mediaUrl: string;
  category: string;
  tags: string[];
  metrics: {
    views: number;
    likes: number;
    tips: number;
    shares: number;
  };
  audioMeta?: {
    soundTitle: string;
    bpm?: number;
    key?: string;
  };
  duration?: string;
  isPinned?: boolean;
  featuredQuote?: string;
  createdAt: string;
}

export interface CreatorProfile {
  name: string;
  handle: string;
  title: string;
  bio: string;
  avatar: string;
  coverImage: string;
  badge: string;
  reputationScore: number;
  totalEarnings: number;
  stats: {
    portfolioItems: number;
    totalReach: string;
    avgTip: string;
    topRanking: string;
  };
  socialLinks: {
    x?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    spotify?: string;
    portfolioUrl?: string;
  };
}

const DEFAULT_PROFILE: CreatorProfile = {
  name: 'January Rebl',
  handle: '@januaryrebl',
  title: 'Lead AI Creative Director & Sound Alchemist',
  bio: 'Building the next paradigm of autonomous multi-modal creative production. 100% created, produced, and governed on Janu’s Creations Studio.',
  avatar: USER_OFFICIAL_FACE_AVATAR,
  coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop',
  badge: 'Grand Master Pioneer',
  reputationScore: 99.4,
  totalEarnings: 24890.0,
  stats: {
    portfolioItems: 8,
    totalReach: '2.4M',
    avgTip: '$48.50',
    topRanking: '#1 All-Time'
  },
  socialLinks: {
    x: 'https://twitter.com',
    instagram: 'https://instagram.com',
    tiktok: 'https://tiktok.com',
    spotify: 'https://spotify.com',
    portfolioUrl: 'https://januscreations.ai/showcase/@januaryrebl'
  }
};

const INITIAL_SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: 'sc-1',
    type: 'reel',
    title: 'Neon Cyber Drift 2026: Cinematic Motion',
    description: 'High-speed volumetric cybernetic reel generated in 9:16 safe-zone framing with beat-synced optical flares.',
    mediaUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
    category: 'Cyberpunk Motion',
    tags: ['#AIReels', '#Cyberpunk', '#CreatorMotion', '#JanusCreations'],
    metrics: {
      views: 245000,
      likes: 18400,
      tips: 3420,
      shares: 1240
    },
    duration: '0:18',
    isPinned: true,
    featuredQuote: 'Winner: Best 9:16 Visual Flow 2026',
    createdAt: '2 days ago'
  },
  {
    id: 'sc-2',
    type: 'photo',
    title: 'Executive Hologram Studio Portrait',
    description: 'Ultra-high-definition studio composition featuring AI neural lighting, glassmorphic refraction, and chromatic mastery.',
    mediaUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
    category: 'Editorial Portrait',
    tags: ['#HoloArt', '#LuxuryAI', '#PhotoAlchemist', '#FashionVanguard'],
    metrics: {
      views: 189000,
      likes: 14200,
      tips: 2150,
      shares: 890
    },
    isPinned: true,
    featuredQuote: 'Featured in AI Haute Couture Gallery',
    createdAt: '4 days ago'
  },
  {
    id: 'sc-3',
    type: 'music',
    title: 'Divine Gospel Soul Symphony (G-Major)',
    description: 'A deeply emotive blend of acoustic gospel choirs, sub-bass harmonics, and 95 BPM dynamic organ riffs.',
    mediaUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    category: 'Gospel & Soul',
    tags: ['#SoulAlchemist', '#GospelSymphony', '#StemMastering', '#AudioNFT'],
    metrics: {
      views: 312000,
      likes: 29500,
      tips: 5200,
      shares: 2450
    },
    audioMeta: {
      soundTitle: 'Divine Gospel Symphony - Master Stem 24-bit',
      bpm: 95,
      key: 'G Major'
    },
    duration: '3:45',
    isPinned: false,
    featuredQuote: '#1 Top Tipped Audio on Live Leaderboard',
    createdAt: '1 week ago'
  },
  {
    id: 'sc-4',
    type: 'reel',
    title: 'Midnight Heavy Metal Flame Stage',
    description: 'Strobe-reactive electric guitar solo visuals synced to fluorescent fire simulation particles.',
    mediaUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
    category: 'Heavy Metal Visuals',
    tags: ['#MetalSynth', '#StageVisuals', '#FireParticle', '#ReelDrop'],
    metrics: {
      views: 165000,
      likes: 11200,
      tips: 1840,
      shares: 670
    },
    duration: '0:24',
    isPinned: false,
    createdAt: '2 weeks ago'
  },
  {
    id: 'sc-5',
    type: 'photo',
    title: 'Chromatic Crystal Nebula Sculpture',
    description: 'Multi-layered 3D render with simulated diamond caustics and fluid iridescent surface tension.',
    mediaUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop',
    category: 'Abstract 3D',
    tags: ['#CrystalArt', '#Caustics', '#ColorGrading', '#SovereignDesign'],
    metrics: {
      views: 142000,
      likes: 9800,
      tips: 1250,
      shares: 430
    },
    isPinned: false,
    createdAt: '3 weeks ago'
  },
  {
    id: 'sc-6',
    type: 'music',
    title: 'Midnight Cyber Synthwave 140 BPM',
    description: 'Analog synth leads over pounding gated reverb drums designed for high-adrenaline driving sequences.',
    mediaUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800&auto=format&fit=crop',
    category: 'Synthwave & Electro',
    tags: ['#Synthwave', '#140BPM', '#AnalogWarmth', '#NightDrive'],
    metrics: {
      views: 220000,
      likes: 19800,
      tips: 2900,
      shares: 1100
    },
    audioMeta: {
      soundTitle: 'Neon Highway 140 BPM Original Mix',
      bpm: 140,
      key: 'D Minor'
    },
    duration: '2:50',
    isPinned: false,
    createdAt: '1 month ago'
  }
];

interface CreatorShowcaseProps {
  onTipCreator?: (handle: string, amount: number) => void;
  onNavigateToStudio?: (tool: 'reel' | 'photo' | 'music') => void;
  onViewPublicProfile?: () => void;
}

export const CreatorShowcase: React.FC<CreatorShowcaseProps> = ({
  onTipCreator,
  onNavigateToStudio,
  onViewPublicProfile
}) => {
  const [profile, setProfile] = useState<CreatorProfile>(() => {
    const saved = getSavedUserProfile();
    return {
      ...DEFAULT_PROFILE,
      name: saved.name || DEFAULT_PROFILE.name,
      handle: saved.handle || DEFAULT_PROFILE.handle,
      title: saved.role || DEFAULT_PROFILE.title,
      bio: saved.bio || DEFAULT_PROFILE.bio,
      avatar: saved.avatar || USER_OFFICIAL_FACE_AVATAR,
      coverImage: saved.coverImage || DEFAULT_PROFILE.coverImage
    };
  });

  useEffect(() => {
    const unsubscribe = subscribeUserProfile((saved) => {
      setProfile((prev) => ({
        ...prev,
        name: saved.name || prev.name,
        handle: saved.handle || prev.handle,
        title: saved.role || prev.title,
        bio: saved.bio || prev.bio,
        avatar: saved.avatar || USER_OFFICIAL_FACE_AVATAR,
        coverImage: saved.coverImage || prev.coverImage
      }));
    });
    return unsubscribe;
  }, []);

  const [items, setItems] = useState<ShowcaseItem[]>(INITIAL_SHOWCASE_ITEMS);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'reel' | 'photo' | 'music' | 'pinned'>('all');
  const [activeItemModal, setActiveItemModal] = useState<ShowcaseItem | null>(null);
  const [shareModalItem, setShareModalItem] = useState<{ title: string; type: any; url: string } | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editTitle, setEditTitle] = useState(profile.title);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [isCuratingItem, setIsCuratingItem] = useState(false);

  // New Item State
  const [newItemType, setNewItemType] = useState<'reel' | 'photo' | 'music'>('reel');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Cyberpunk Motion');
  const [newItemMediaUrl, setNewItemMediaUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop');
  const [newItemTags, setNewItemTags] = useState('#JanusShowcase, #AIArt, #Creator');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredItems = items.filter((item) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pinned') return item.isPinned;
    return item.type === selectedFilter;
  });

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isPinned: !it.isPinned } : it))
    );
    triggerNeonExplosion({
      particleCount: 20,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'subtle'
    });
    showToast('Updated pinned portfolio status!');
  };

  const handleSaveProfile = () => {
    setProfile((prev) => ({
      ...prev,
      bio: editBio,
      title: editTitle
    }));
    setIsEditingProfile(false);
    triggerNeonExplosion({
      particleCount: 30,
      origin: { x: 0.5, y: 0.3 },
      intensity: 'medium'
    });
    showToast('Showcase profile updated successfully! ⚡');
  };

  const handleAddCuratedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const newItem: ShowcaseItem = {
      id: 'sc-' + Date.now(),
      type: newItemType,
      title: newItemTitle,
      description: newItemDesc || 'Curated into Studio Portfolio.',
      mediaUrl: newItemMediaUrl,
      category: newItemCategory,
      tags: newItemTags.split(',').map((t) => t.trim()).filter(Boolean),
      metrics: {
        views: 1200,
        likes: 180,
        tips: 50,
        shares: 24
      },
      duration: newItemType === 'reel' ? '0:15' : newItemType === 'music' ? '2:30' : undefined,
      isPinned: false,
      createdAt: 'Just now'
    };

    setItems([newItem, ...items]);
    setIsCuratingItem(false);
    setNewItemTitle('');
    setNewItemDesc('');
    
    triggerNeonExplosion({
      particleCount: 50,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'grand'
    });
    showToast(`Added "${newItemTitle}" to your Creator Showcase! ✨`);
  };

  const handleSharePortfolio = () => {
    setShareModalItem({
      title: `${profile.name} — AI Creator Portfolio`,
      type: 'reel',
      url: `https://januscreations.ai/showcase/${profile.handle.replace('@', '')}`
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-10 right-10 z-[350] bg-black/95 border border-[#00F5D4] text-[#00F5D4] px-6 py-3 rounded-2xl shadow-[0_0_30px_rgba(0,245,212,0.4)] flex items-center gap-3 text-xs font-mono font-bold animate-in slide-in-from-bottom-5">
          <i className="fa-solid fa-sparkles text-sm animate-spin"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PORTFOLIO COVER & IDENTITY HERO BANNER */}
      <div className="relative rounded-[2.5rem] overflow-hidden border border-white/15 bg-zinc-950 shadow-[0_0_60px_rgba(0,0,0,0.8)]">
        {/* Cover Photo */}
        <div className="relative h-48 sm:h-64 md:h-72 w-full overflow-hidden">
          <img
            src={profile.coverImage}
            alt="Showcase Cover"
            className="w-full h-full object-cover object-center filter brightness-75 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>

          {/* Top Actions on Banner */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 sm:gap-2.5 z-20 flex-wrap justify-end">
            {onViewPublicProfile && (
              <button
                onClick={onViewPublicProfile}
                className="px-3.5 sm:px-4 py-2 rounded-2xl bg-black/80 hover:bg-black backdrop-blur-xl border border-[#00F5D4]/40 hover:border-[#00F5D4] text-[#00F5D4] font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,245,212,0.3)] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-id-card-clip text-sm"></i>
                <span className="hidden sm:inline">View Public Profile</span>
              </button>
            )}

            <button
              onClick={handleSharePortfolio}
              className="px-3.5 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-mono font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(255,0,127,0.5)] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-share-nodes text-sm"></i>
              <span className="hidden sm:inline">Share Showcase</span>
            </button>

            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="px-3.5 py-2 rounded-2xl bg-black/60 hover:bg-black/90 backdrop-blur-xl border border-white/20 text-white font-mono text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-pen-to-square text-[10px] text-[#00F5D4]"></i>
              <span className="hidden sm:inline">Edit Bio</span>
            </button>
          </div>
        </div>

        {/* Profile Details Bar */}
        <div className="px-6 sm:px-10 pb-8 pt-0 relative z-10 -mt-16 sm:-mt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            {/* Avatar & Main Titles */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              {/* Glowing Avatar */}
              <div className="relative group">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-br from-[#FF007F] via-[#C084FC] to-[#00F5D4] shadow-[0_0_30px_rgba(0,245,212,0.4)] shrink-0 overflow-hidden">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full object-cover rounded-[1.4rem]"
                  />
                </div>
                <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-[#00F5D4] text-black font-mono font-black text-[9px] uppercase tracking-widest shadow-md">
                  Verified
                </span>
              </div>

              {/* Title Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-serif font-black italic text-white tracking-tight">
                    {profile.name}
                  </h2>
                  <span className="text-xs font-mono text-[#00F5D4] font-bold">
                    {profile.handle}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#C084FC]/15 border border-[#C084FC]/40 text-[#C084FC] text-[10px] font-mono font-bold uppercase tracking-wider">
                    {profile.badge}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-mono text-gray-300">
                  {profile.title}
                </p>

                {/* Social Badges */}
                <div className="flex items-center gap-3 pt-2 text-gray-400 text-xs">
                  <a href={profile.socialLinks.x} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                    <i className="fa-brands fa-x-twitter"></i>
                  </a>
                  <a href={profile.socialLinks.instagram} target="_blank" rel="noreferrer" className="hover:text-[#FF007F] transition-colors">
                    <i className="fa-brands fa-instagram"></i>
                  </a>
                  <a href={profile.socialLinks.tiktok} target="_blank" rel="noreferrer" className="hover:text-[#00F5D4] transition-colors">
                    <i className="fa-brands fa-tiktok"></i>
                  </a>
                  <a href={profile.socialLinks.spotify} target="_blank" rel="noreferrer" className="hover:text-[#1DB954] transition-colors">
                    <i className="fa-brands fa-spotify"></i>
                  </a>
                  <span className="text-white/20">•</span>
                  <span className="text-[11px] font-mono text-gray-400">
                    <strong className="text-white">{items.length}</strong> Works Curated
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/60 border border-white/10 p-3 sm:p-4 rounded-2xl backdrop-blur-xl">
              <div className="text-center px-2">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Total Reach</span>
                <span className="text-base sm:text-lg font-mono font-black text-[#00F5D4]">{profile.stats.totalReach}</span>
              </div>
              <div className="text-center px-2 border-l border-white/10">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">AI Rep Score</span>
                <span className="text-base sm:text-lg font-mono font-black text-[#C084FC]">{profile.reputationScore}%</span>
              </div>
              <div className="text-center px-2 border-l border-white/10">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Total Tips</span>
                <span className="text-base sm:text-lg font-mono font-black text-[#FF007F]">${profile.totalEarnings.toLocaleString()}</span>
              </div>
              <div className="text-center px-2 border-l border-white/10">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Leaderboard</span>
                <span className="text-base sm:text-lg font-mono font-black text-[#FFB800]">{profile.stats.topRanking}</span>
              </div>
            </div>
          </div>

          {/* Bio Description / Editable Area */}
          <div className="mt-6 pt-5 border-t border-white/10">
            {isEditingProfile ? (
              <div className="space-y-3 p-4 rounded-2xl bg-black/80 border border-[#00F5D4]/40">
                <div>
                  <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Headline Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#00F5D4] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Showcase Bio & Artist Statement</label>
                  <textarea
                    rows={3}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#00F5D4] focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-mono text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-1.5 rounded-xl bg-[#00F5D4] text-black font-mono font-bold text-xs uppercase"
                  >
                    Save Profile
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm font-sans text-gray-300 font-light leading-relaxed max-w-4xl">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* FILTER & CURATION ACTION BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'all'
                ? 'bg-[#00F5D4] text-black shadow-[0_0_15px_rgba(0,245,212,0.4)]'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-grid-2"></i>
            <span>All Works ({items.length})</span>
          </button>

          <button
            onClick={() => setSelectedFilter('pinned')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'pinned'
                ? 'bg-[#FFB800] text-black shadow-[0_0_15px_rgba(255,184,0,0.4)]'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-thumbtack"></i>
            <span>Pinned Masterpieces</span>
          </button>

          <button
            onClick={() => setSelectedFilter('reel')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'reel'
                ? 'bg-[#FF007F] text-white shadow-[0_0_15px_rgba(255,0,127,0.4)]'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-clapperboard"></i>
            <span>Reels</span>
          </button>

          <button
            onClick={() => setSelectedFilter('photo')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'photo'
                ? 'bg-[#C084FC] text-black shadow-[0_0_15px_rgba(192,132,252,0.4)]'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>Photos & Art</span>
          </button>

          <button
            onClick={() => setSelectedFilter('music')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'music'
                ? 'bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black shadow-[0_0_15px_rgba(0,245,212,0.4)]'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-music"></i>
            <span>Music Stems</span>
          </button>
        </div>

        {/* Add Work Button */}
        <button
          onClick={() => setIsCuratingItem(true)}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md hover:scale-105 shrink-0"
        >
          <i className="fa-solid fa-plus text-[#00F5D4]"></i>
          <span>Curate New Work</span>
        </button>
      </div>

      {/* CURATION MODAL */}
      {isCuratingItem && (
        <div className="p-6 rounded-3xl bg-zinc-950 border border-[#00F5D4]/50 shadow-[0_0_40px_rgba(0,245,212,0.2)] animate-in fade-in zoom-in-95 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-lg font-serif font-black italic text-white flex items-center gap-2">
              <i className="fa-solid fa-sparkles text-[#00F5D4]"></i>
              Curate Item Into Public Showcase
            </h3>
            <button
              onClick={() => setIsCuratingItem(false)}
              className="text-gray-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleAddCuratedItem} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Media Type</label>
                <select
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#00F5D4] focus:outline-none"
                >
                  <option value="reel">9:16 Cyber Reel</option>
                  <option value="photo">Photo & Fine Art</option>
                  <option value="music">Music & Stem Track</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g., Solitude in Obsidian"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#00F5D4] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g., Cyberpunk Cinema"
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#00F5D4] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Description / Creative Directive</label>
              <textarea
                rows={2}
                placeholder="Explain the AI synthesis technique, prompt strategy, or audio stems..."
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#00F5D4] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Image / Preview URL</label>
                <input
                  type="url"
                  value={newItemMediaUrl}
                  onChange={(e) => setNewItemMediaUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#00F5D4] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Hashtags / Tags (Comma separated)</label>
                <input
                  type="text"
                  value={newItemTags}
                  onChange={(e) => setNewItemTags(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#00F5D4] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCuratingItem(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-mono font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-all"
              >
                Publish To Showcase
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SHOWCASE GALLERY MESH GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const isReel = item.type === 'reel';
          const isPhoto = item.type === 'photo';
          const isMusic = item.type === 'music';

          return (
            <div
              key={item.id}
              onClick={() => setActiveItemModal(item)}
              className="group relative rounded-[2rem] overflow-hidden bg-zinc-950 border border-white/10 hover:border-[#00F5D4]/60 transition-all duration-300 shadow-[0_0_25px_rgba(0,0,0,0.6)] hover:shadow-[0_0_35px_rgba(0,245,212,0.25)] flex flex-col cursor-pointer"
            >
              {/* Media Container */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
                <img
                  src={item.mediaUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>

                {/* Pin Badge / Toggle */}
                <button
                  onClick={(e) => togglePin(item.id, e)}
                  className={`absolute top-3 left-3 w-8 h-8 rounded-full backdrop-blur-xl border flex items-center justify-center text-xs transition-all z-20 ${
                    item.isPinned
                      ? 'bg-[#FFB800] border-[#FFB800] text-black shadow-[0_0_15px_rgba(255,184,0,0.5)]'
                      : 'bg-black/50 border-white/20 text-gray-400 hover:text-white'
                  }`}
                  title={item.isPinned ? 'Unpin Masterpiece' : 'Pin to Top of Showcase'}
                >
                  <i className="fa-solid fa-thumbtack"></i>
                </button>

                {/* Media Type Icon & Duration Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-xl border flex items-center gap-1.5 ${
                      isReel
                        ? 'bg-[#FF007F]/20 border-[#FF007F]/50 text-[#FF007F]'
                        : isPhoto
                        ? 'bg-[#C084FC]/20 border-[#C084FC]/50 text-[#C084FC]'
                        : 'bg-[#00F5D4]/20 border-[#00F5D4]/50 text-[#00F5D4]'
                    }`}
                  >
                    <i
                      className={`fa-solid ${
                        isReel
                          ? 'fa-clapperboard'
                          : isPhoto
                          ? 'fa-wand-magic-sparkles'
                          : 'fa-music'
                      }`}
                    ></i>
                    <span>{item.type}</span>
                  </span>

                  {item.duration && (
                    <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-[10px] font-mono text-gray-300">
                      {item.duration}
                    </span>
                  )}
                </div>

                {/* Audio Playing Ripple Simulator */}
                {isMusic && (
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/10">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPlayingAudio(isPlayingAudio === item.id ? null : item.id);
                        }}
                        className="w-7 h-7 rounded-lg bg-[#00F5D4] text-black flex items-center justify-center text-xs"
                      >
                        <i className={`fa-solid ${isPlayingAudio === item.id ? 'fa-pause' : 'fa-play'}`}></i>
                      </button>
                      <span className="text-[10px] font-mono text-white truncate max-w-[150px]">
                        {item.audioMeta?.soundTitle || 'Master Stem Track'}
                      </span>
                    </div>
                    {item.audioMeta?.bpm && (
                      <span className="text-[9px] font-mono text-[#00F5D4]">
                        {item.audioMeta.bpm} BPM
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Meta Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span className="text-[#00F5D4] font-bold uppercase tracking-wider">{item.category}</span>
                    <span>{item.createdAt}</span>
                  </div>

                  <h3 className="text-base font-serif font-black italic text-white group-hover:text-[#00F5D4] transition-colors leading-tight">
                    {item.title}
                  </h3>

                  <p className="text-xs text-gray-400 font-light line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Featured accolade quote */}
                  {item.featuredQuote && (
                    <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 text-[10px] font-mono text-[#FFB800] flex items-center gap-1.5">
                      <i className="fa-solid fa-crown text-[10px]"></i>
                      <span className="truncate">{item.featuredQuote}</span>
                    </div>
                  )}
                </div>

                {/* Metrics and Action Bar */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3 text-gray-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <i className="fa-solid fa-eye text-gray-500"></i>
                      <span>{(item.metrics.views / 1000).toFixed(0)}k</span>
                    </span>
                    <span className="flex items-center gap-1 text-[#FF007F]">
                      <i className="fa-solid fa-heart"></i>
                      <span>{(item.metrics.likes / 1000).toFixed(1)}k</span>
                    </span>
                    <span className="flex items-center gap-1 text-[#00F5D4]">
                      <i className="fa-solid fa-coins"></i>
                      <span>${item.metrics.tips}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Direct Item Share Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareModalItem({
                          title: item.title,
                          type: item.type,
                          url: `https://januscreations.ai/showcase/${profile.handle.replace('@', '')}/${item.id}`
                        });
                      }}
                      className="w-8 h-8 rounded-xl bg-white/5 hover:bg-[#00F5D4]/20 border border-white/15 hover:border-[#00F5D4] text-gray-300 hover:text-[#00F5D4] flex items-center justify-center transition-all cursor-pointer"
                      title="Share this artwork directly to social media"
                    >
                      <i className="fa-solid fa-share-nodes text-xs"></i>
                    </button>

                    {/* Quick Tip Button */}
                    {onTipCreator && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTipCreator(profile.handle, 50);
                          triggerNeonExplosion({
                            particleCount: 30,
                            origin: { x: 0.5, y: 0.5 },
                            intensity: 'subtle'
                          });
                        }}
                        className="px-2.5 py-1 rounded-xl bg-[#00F5D4]/10 hover:bg-[#00F5D4] border border-[#00F5D4]/40 text-[#00F5D4] hover:text-black font-mono font-bold text-[10px] transition-all flex items-center gap-1"
                      >
                        <i className="fa-solid fa-bolt"></i>
                        <span>Tip $50</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAIL MODAL FOR SELECTED WORK */}
      {activeItemModal && (
        <div className="fixed inset-0 z-[320] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="glass max-w-3xl w-full rounded-[2.5rem] border border-[#00F5D4]/40 bg-zinc-950 overflow-hidden shadow-[0_0_80px_rgba(0,245,212,0.3)] animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#00F5D4]/10 border border-[#00F5D4]/30 flex items-center justify-center text-[#00F5D4]">
                  <i
                    className={`fa-solid ${
                      activeItemModal.type === 'reel'
                        ? 'fa-clapperboard'
                        : activeItemModal.type === 'photo'
                        ? 'fa-wand-magic-sparkles'
                        : 'fa-music'
                    }`}
                  ></i>
                </div>
                <div>
                  <h3 className="text-lg font-serif font-black italic text-white tracking-tight">
                    {activeItemModal.title}
                  </h3>
                  <p className="text-[10px] font-mono text-gray-400">
                    Curated by <span className="text-[#00F5D4]">{profile.name}</span> • {activeItemModal.category}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveItemModal(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {/* Media Frame */}
              <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black max-h-96 flex items-center justify-center">
                <img
                  src={activeItemModal.mediaUrl}
                  alt={activeItemModal.title}
                  className="w-full h-full object-cover max-h-96"
                />
              </div>

              {/* Description & Technical Directives */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-widest text-[#00F5D4]">
                  Creative Statement & Synthesis Blueprint
                </h4>
                <p className="text-sm text-gray-300 font-light leading-relaxed">
                  {activeItemModal.description}
                </p>
              </div>

              {/* Tag Cloud */}
              <div className="flex flex-wrap gap-2">
                {activeItemModal.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-4 gap-3 bg-black/60 border border-white/10 p-3.5 rounded-2xl">
                <div className="text-center">
                  <span className="text-[9px] font-mono text-gray-400 uppercase block">Total Views</span>
                  <span className="text-sm font-mono font-bold text-white">
                    {activeItemModal.metrics.views.toLocaleString()}
                  </span>
                </div>
                <div className="text-center border-l border-white/10">
                  <span className="text-[9px] font-mono text-gray-400 uppercase block">Likes</span>
                  <span className="text-sm font-mono font-bold text-[#FF007F]">
                    {activeItemModal.metrics.likes.toLocaleString()}
                  </span>
                </div>
                <div className="text-center border-l border-white/10">
                  <span className="text-[9px] font-mono text-gray-400 uppercase block">Tips</span>
                  <span className="text-sm font-mono font-bold text-[#00F5D4]">
                    ${activeItemModal.metrics.tips}
                  </span>
                </div>
                <div className="text-center border-l border-white/10">
                  <span className="text-[9px] font-mono text-gray-400 uppercase block">Shares</span>
                  <span className="text-sm font-mono font-bold text-[#C084FC]">
                    {activeItemModal.metrics.shares}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-5 border-t border-white/10 bg-black/80 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  setShareModalItem({
                    title: activeItemModal.title,
                    type: activeItemModal.type,
                    url: `https://januscreations.ai/showcase/${profile.handle.replace('@', '')}/${activeItemModal.id}`
                  });
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF007F] to-[#C084FC] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:scale-105 transition-all"
              >
                <i className="fa-solid fa-share-nodes"></i>
                <span>Share To Socials</span>
              </button>

              <div className="flex items-center gap-2">
                {onNavigateToStudio && (
                  <button
                    onClick={() => {
                      onNavigateToStudio(activeItemModal.type);
                      setActiveItemModal(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-all flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles text-[#00F5D4]"></i>
                    <span>Remix in Studio</span>
                  </button>
                )}

                {onTipCreator && (
                  <button
                    onClick={() => {
                      onTipCreator(profile.handle, 100);
                      triggerNeonExplosion({
                        particleCount: 50,
                        origin: { x: 0.5, y: 0.5 },
                        intensity: 'medium'
                      });
                      setActiveItemModal(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#00F5D4] text-black font-mono font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,245,212,0.4)] hover:scale-105 transition-all flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-bolt"></i>
                    <span>Tip Creator $100</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL INTEGRATION */}
      {shareModalItem && (
        <ShareModal
          isOpen={true}
          onClose={() => setShareModalItem(null)}
          title={shareModalItem.title}
          type={shareModalItem.type}
          url={shareModalItem.url}
          author={profile.name}
        />
      )}
    </div>
  );
};

export default CreatorShowcase;
