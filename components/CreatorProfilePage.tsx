import React, { useState, useEffect } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';
import ShareModal from './ShareModal';
import { ShowcaseItem } from './CreatorShowcase';
import ChangeFaceAvatarModal from './ChangeFaceAvatarModal';
import { getSavedUserProfile, saveUserProfile, subscribeUserProfile, USER_OFFICIAL_FACE_AVATAR } from '../utils/userProfileState';

export interface SocialLinkItem {
  id: string;
  platform: 'instagram' | 'tiktok' | 'x' | 'youtube' | 'spotify' | 'discord' | 'website' | 'paypal';
  name: string;
  handle: string;
  url: string;
  followers: string;
  description: string;
  icon: string;
  badgeColor: string;
  hoverBorder: string;
  glowColor: string;
  isVerified?: boolean;
}

export interface CreatorProfileData {
  id: string;
  name: string;
  handle: string;
  role: string;
  tagline: string;
  bio: string;
  manifesto: string;
  avatar: string;
  coverImage: string;
  location: string;
  timezone: string;
  rank: string;
  reputationScore: number;
  followersCount: number;
  isFollowing?: boolean;
  totalEarnings: number;
  totalReach: string;
  worksCount: number;
  collabStatus: 'accepting' | 'busy' | 'selective';
  socialLinks: SocialLinkItem[];
  portfolioItems: ShowcaseItem[];
  badges: Array<{ label: string; icon: string; color: string; desc: string }>;
  aiSpecialties: string[];
}

const CREATOR_PRESETS: CreatorProfileData[] = [
  {
    id: 'january-rebl',
    name: 'January Rebl',
    handle: '@januaryrebl',
    role: 'Founder & Sovereign AI Creative Director',
    tagline: 'Pioneering autonomous multi-modal creative production & sovereign creator monetization.',
    bio: 'Multi-disciplinary artist, sound alchemist, and architect of Janu’s Creations. Directing neural cinematic reels, mastering dynamic gospel and cyber synthwave stems, and governing sovereign digital rights on-chain.',
    manifesto: 'I believe the future of creator independence lies in owning 100% of your production pipelines and monetization vaults. Every artwork in this showcase was synthesized, edited, mastered, and monetized directly inside Janu’s Creations ecosystem.',
    avatar: USER_OFFICIAL_FACE_AVATAR,
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop',
    location: 'Los Angeles & Metaverse',
    timezone: 'PST (UTC-8) • Active Now',
    rank: '#1 Grand Sovereign Pioneer',
    reputationScore: 99.8,
    followersCount: 142500,
    isFollowing: false,
    totalEarnings: 24890.0,
    totalReach: '2.4M',
    worksCount: 6,
    collabStatus: 'accepting',
    aiSpecialties: ['Volumetric 9:16 Cyber Reels', 'Neural Lighting & Caustics', 'Multi-Stem Audio Mastering', 'Autonomous AI Operations'],
    badges: [
      { label: 'Grand Sovereign Pioneer', icon: 'fa-crown', color: '#FFB800', desc: 'Rank #1 on Sovereign Leaderboard' },
      { label: 'Verified Creator', icon: 'fa-badge-check', color: '#00F5D4', desc: 'Official Verified Janu’s Creations Creator' },
      { label: 'Contest Master', icon: 'fa-trophy', color: '#FF007F', desc: '18 Tournament Victories' },
      { label: 'Vault Sovereign', icon: 'fa-shield-halved', color: '#C084FC', desc: 'Direct Sovereign Treasury Approved' }
    ],
    socialLinks: [
      {
        id: 'soc-ig',
        platform: 'instagram',
        name: 'Instagram',
        handle: '@januaryrebl',
        url: 'https://instagram.com/januaryrebl',
        followers: '420K Followers',
        description: 'Daily AI lighting grades, haute couture renders & studio stories.',
        icon: 'fa-brands fa-instagram',
        badgeColor: 'text-[#FF007F] bg-[#FF007F]/10 border-[#FF007F]/30',
        hoverBorder: 'hover:border-[#FF007F]',
        glowColor: 'rgba(255,0,127,0.3)',
        isVerified: true
      },
      {
        id: 'soc-tt',
        platform: 'tiktok',
        name: 'TikTok',
        handle: '@januaryrebl',
        url: 'https://tiktok.com/@januaryrebl',
        followers: '890K Followers',
        description: 'Viral 9:16 cyber motion reels, speed edits & beat sync breakdowns.',
        icon: 'fa-brands fa-tiktok',
        badgeColor: 'text-[#00F5D4] bg-[#00F5D4]/10 border-[#00F5D4]/30',
        hoverBorder: 'hover:border-[#00F5D4]',
        glowColor: 'rgba(0,245,212,0.3)',
        isVerified: true
      },
      {
        id: 'soc-x',
        platform: 'x',
        name: 'X (Twitter)',
        handle: '@januaryrebl',
        url: 'https://twitter.com/januaryrebl',
        followers: '165K Followers',
        description: 'AI prompt blueprints, creative strategy & ecosystem governance.',
        icon: 'fa-brands fa-x-twitter',
        badgeColor: 'text-white bg-white/10 border-white/30',
        hoverBorder: 'hover:border-white',
        glowColor: 'rgba(255,255,255,0.2)',
        isVerified: true
      },
      {
        id: 'soc-yt',
        platform: 'youtube',
        name: 'YouTube',
        handle: 'January Rebl Studio',
        url: 'https://youtube.com/@januaryrebl',
        followers: '310K Subscribers',
        description: 'Full 4K music video masterclasses, workflow tutorials & live streams.',
        icon: 'fa-brands fa-youtube',
        badgeColor: 'text-[#FF0000] bg-[#FF0000]/10 border-[#FF0000]/30',
        hoverBorder: 'hover:border-[#FF0000]',
        glowColor: 'rgba(255,0,0,0.3)',
        isVerified: true
      },
      {
        id: 'soc-spot',
        platform: 'spotify',
        name: 'Spotify & SoundVault',
        handle: 'January Rebl',
        url: 'https://spotify.com/artist/januaryrebl',
        followers: '95K Monthly Listeners',
        description: 'Original stem compositions, synthwave anthems & gospel harmonies.',
        icon: 'fa-brands fa-spotify',
        badgeColor: 'text-[#1DB954] bg-[#1DB954]/10 border-[#1DB954]/30',
        hoverBorder: 'hover:border-[#1DB954]',
        glowColor: 'rgba(29,185,84,0.3)',
        isVerified: true
      },
      {
        id: 'soc-disc',
        platform: 'discord',
        name: 'VIP Creator Guild',
        handle: 'Janu’s Inner Circle',
        url: 'https://discord.gg/januscreations',
        followers: '14.2K VIP Members',
        description: 'Exclusive early access, prompt drops & co-creative jams.',
        icon: 'fa-brands fa-discord',
        badgeColor: 'text-[#5865F2] bg-[#5865F2]/10 border-[#5865F2]/30',
        hoverBorder: 'hover:border-[#5865F2]',
        glowColor: 'rgba(88,101,242,0.3)',
        isVerified: false
      },
      {
        id: 'soc-web',
        platform: 'website',
        name: 'Official Web Portal',
        handle: 'januscreations.sintra.site',
        url: 'https://januscreations.sintra.site',
        followers: 'Global Domain',
        description: 'Official enterprise creative hub & direct contact booking.',
        icon: 'fa-solid fa-globe',
        badgeColor: 'text-[#C084FC] bg-[#C084FC]/10 border-[#C084FC]/30',
        hoverBorder: 'hover:border-[#C084FC]',
        glowColor: 'rgba(192,132,252,0.3)',
        isVerified: true
      },
      {
        id: 'soc-paypal',
        platform: 'paypal',
        name: 'PayPal Direct Instant Payment & Tip',
        handle: 'paypal.com/ncp/payment/Z6PDFZBTSUBAG',
        url: 'https://www.paypal.com/ncp/payment/Z6PDFZBTSUBAG',
        followers: 'Verified Instant Checkout',
        description: 'Direct patron support, creator micro-tips & instant 1-click PayPal payment.',
        icon: 'fa-brands fa-paypal',
        badgeColor: 'text-[#38BDF8] bg-[#0079C1]/15 border-[#0079C1]/40',
        hoverBorder: 'hover:border-[#38BDF8]',
        glowColor: 'rgba(0,121,193,0.35)',
        isVerified: true
      }
    ],
    portfolioItems: [
      {
        id: 'sc-1',
        type: 'reel',
        title: 'Neon Cyber Drift 2026: Sovereign Motion',
        description: 'High-speed volumetric cybernetic reel generated in 9:16 safe-zone framing with beat-synced optical flares.',
        mediaUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
        category: 'Cyberpunk Motion',
        tags: ['#AIReels', '#Cyberpunk', '#SovereignMotion', '#JanusCreations'],
        metrics: { views: 245000, likes: 18400, tips: 3420, shares: 1240 },
        duration: '0:18',
        isPinned: true,
        featuredQuote: 'Winner: Best 9:16 Visual Flow 2026',
        createdAt: '2 days ago'
      },
      {
        id: 'sc-2',
        type: 'photo',
        title: 'Executive Hologram Sovereign Portrait',
        description: 'Ultra-high-definition studio composition featuring AI neural lighting, glassmorphic refraction, and chromatic mastery.',
        mediaUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
        category: 'Editorial Portrait',
        tags: ['#HoloArt', '#LuxuryAI', '#PhotoAlchemist', '#FashionVanguard'],
        metrics: { views: 189000, likes: 14200, tips: 2150, shares: 890 },
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
        metrics: { views: 312000, likes: 29500, tips: 5200, shares: 2450 },
        audioMeta: { soundTitle: 'Divine Gospel Symphony - Master Stem 24-bit', bpm: 95, key: 'G Major' },
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
        metrics: { views: 165000, likes: 11200, tips: 1840, shares: 670 },
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
        tags: ['#CrystalArt', '#Caustics', '#ColorGrading', '#StudioDesign'],
        metrics: { views: 142000, likes: 9800, tips: 1250, shares: 430 },
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
        metrics: { views: 220000, likes: 19800, tips: 2900, shares: 1100 },
        audioMeta: { soundTitle: 'Neon Highway 140 BPM Original Mix', bpm: 140, key: 'D Minor' },
        duration: '2:50',
        isPinned: false,
        createdAt: '1 month ago'
      }
    ]
  },
  {
    id: 'elena-vance',
    name: 'Elena Vance',
    handle: '@VanceVisuals',
    role: 'Cinematic Reel Alchemist & Motion Director',
    tagline: 'Translating surreal sci-fi architecture into high-octane 9:16 mobile cinema.',
    bio: 'Visual effects pioneer creating photorealistic dystopian futures and cyberpunk world-building. Directing short-form AI films that have amassed over 15M impressions across TikTok and Instagram.',
    manifesto: 'Every frame should evoke awe. Janu’s Studio allows me to build complex virtual sets in seconds and share them with the world immediately.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80',
    coverImage: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1600&auto=format&fit=crop',
    location: 'Berlin & Tokyo',
    timezone: 'CET (UTC+1)',
    rank: '#2 Diamond Master',
    reputationScore: 98.6,
    followersCount: 98200,
    isFollowing: false,
    totalEarnings: 16420.5,
    totalReach: '1.8M',
    worksCount: 4,
    collabStatus: 'accepting',
    aiSpecialties: ['9:16 Cinematic Storyboarding', 'Fluid Camera Motion', 'Color Space Remapping'],
    badges: [
      { label: 'Diamond Master', icon: 'fa-gem', color: '#00F5D4', desc: 'Rank #2 on Sovereign Leaderboard' },
      { label: 'Viral Reel Award', icon: 'fa-fire', color: '#FF007F', desc: 'Over 1M Views on 3 Distinct Drops' }
    ],
    socialLinks: [
      {
        id: 'ev-tt',
        platform: 'tiktok',
        name: 'TikTok',
        handle: '@VanceVisuals',
        url: 'https://tiktok.com/@vancevisuals',
        followers: '620K Followers',
        description: 'Cyberpunk short-film drops & prompt breakdowns.',
        icon: 'fa-brands fa-tiktok',
        badgeColor: 'text-[#00F5D4] bg-[#00F5D4]/10 border-[#00F5D4]/30',
        hoverBorder: 'hover:border-[#00F5D4]',
        glowColor: 'rgba(0,245,212,0.3)',
        isVerified: true
      },
      {
        id: 'ev-ig',
        platform: 'instagram',
        name: 'Instagram',
        handle: '@vancevisuals',
        url: 'https://instagram.com/vancevisuals',
        followers: '280K Followers',
        description: 'Stills, lighting moodboards & camera rigs.',
        icon: 'fa-brands fa-instagram',
        badgeColor: 'text-[#FF007F] bg-[#FF007F]/10 border-[#FF007F]/30',
        hoverBorder: 'hover:border-[#FF007F]',
        glowColor: 'rgba(255,0,127,0.3)',
        isVerified: true
      },
      {
        id: 'ev-x',
        platform: 'x',
        name: 'X (Twitter)',
        handle: '@VanceVisuals',
        url: 'https://twitter.com/vancevisuals',
        followers: '85K Followers',
        description: 'VFX techniques, ComfyUI nodes & Sora prompting.',
        icon: 'fa-brands fa-x-twitter',
        badgeColor: 'text-white bg-white/10 border-white/30',
        hoverBorder: 'hover:border-white',
        glowColor: 'rgba(255,255,255,0.2)',
        isVerified: false
      }
    ],
    portfolioItems: [
      {
        id: 'ev-sc-1',
        type: 'reel',
        title: 'Neo-Tokyo 8K Time-Warp Cinema',
        description: 'Dynamic parallax camera drift through rain-slicked neon alleys of 2088.',
        mediaUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
        category: 'Sci-Fi Cinema',
        tags: ['#NeoTokyo', '#8KMotion', '#CyberCinematics'],
        metrics: { views: 320000, likes: 24500, tips: 2800, shares: 1900 },
        duration: '0:22',
        isPinned: true,
        createdAt: '3 days ago'
      },
      {
        id: 'ev-sc-2',
        type: 'photo',
        title: 'Monolith in the Acid Dunes',
        description: 'Volumetric atmospheric scattering on extraterrestrial basalt structures.',
        mediaUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
        category: 'Concept Art',
        tags: ['#AcidDunes', '#SciFiArt', '#VolumetricAtmosphere'],
        metrics: { views: 110000, likes: 9400, tips: 950, shares: 420 },
        isPinned: true,
        createdAt: '1 week ago'
      }
    ]
  }
];

interface CreatorProfilePageProps {
  initialCreatorId?: string;
  onOpenShowcaseTab?: () => void;
  onTipCreator?: (handle: string, amount: number) => void;
  onNavigateToStudio?: (tool: 'reel' | 'photo' | 'music') => void;
  onBackToHome?: () => void;
}

export const CreatorProfilePage: React.FC<CreatorProfilePageProps> = ({
  initialCreatorId = 'january-rebl',
  onOpenShowcaseTab,
  onTipCreator,
  onNavigateToStudio,
  onBackToHome
}) => {
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>(initialCreatorId);
  const [profile, setProfile] = useState<CreatorProfileData>(() => {
    const saved = getSavedUserProfile();
    const preset = CREATOR_PRESETS.find((c) => c.id === initialCreatorId) || CREATOR_PRESETS[0];
    if (initialCreatorId === 'january-rebl') {
      return {
        ...preset,
        name: saved.name || preset.name,
        handle: saved.handle || preset.handle,
        role: saved.role || preset.role,
        tagline: saved.tagline || preset.tagline,
        bio: saved.bio || preset.bio,
        manifesto: saved.manifesto || preset.manifesto,
        avatar: saved.avatar || preset.avatar,
        coverImage: saved.coverImage || preset.coverImage,
        location: saved.location || preset.location,
        timezone: saved.timezone || preset.timezone
      };
    }
    return preset;
  });

  const [showChangeFaceModal, setShowChangeFaceModal] = useState(false);

  // Subscribe to changes in global user profile
  useEffect(() => {
    const unsubscribe = subscribeUserProfile((updated) => {
      if (selectedCreatorId === 'january-rebl') {
        setProfile((prev) => ({
          ...prev,
          name: updated.name || prev.name,
          handle: updated.handle || prev.handle,
          role: updated.role || prev.role,
          tagline: updated.tagline || prev.tagline,
          bio: updated.bio || prev.bio,
          avatar: updated.avatar || prev.avatar,
          coverImage: updated.coverImage || prev.coverImage,
          location: updated.location || prev.location
        }));
      }
    });
    return unsubscribe;
  }, [selectedCreatorId]);
  
  // Showcase Portfolio Filter
  const [portfolioFilter, setPortfolioFilter] = useState<'all' | 'pinned' | 'reel' | 'photo' | 'music'>('all');
  const [activeItemModal, setActiveItemModal] = useState<ShowcaseItem | null>(null);
  const [shareModalData, setShareModalData] = useState<{ title: string; url: string; type: any } | null>(null);
  
  // Modals & Drawers
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState<number>(50);
  const [customTip, setCustomTip] = useState<string>('');
  const [tipNote, setTipNote] = useState<string>('Love your incredible sovereign vision! ⚡');
  
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [collabType, setCollabType] = useState('Brand Campaign Reel');
  const [collabBudget, setCollabBudget] = useState('$2,500 - $5,000');
  const [collabMessage, setCollabMessage] = useState('');
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editTagline, setEditTagline] = useState(profile.tagline);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editLocation, setEditLocation] = useState(profile.location);
  
  const [showManifestoExpanded, setShowManifestoExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectCreator = (id: string) => {
    const found = CREATOR_PRESETS.find((c) => c.id === id);
    if (found) {
      setSelectedCreatorId(id);
      setProfile(found);
      setEditName(found.name);
      setEditTagline(found.tagline);
      setEditBio(found.bio);
      setEditLocation(found.location);
      bossAudio.playSubtlePing();
      showToast(`Viewing ${found.name}'s Public Creator Profile`);
    }
  };

  const handleToggleFollow = () => {
    const nextState = !profile.isFollowing;
    setProfile((prev) => ({
      ...prev,
      isFollowing: nextState,
      followersCount: nextState ? prev.followersCount + 1 : prev.followersCount - 1
    }));

    if (nextState) {
      bossAudio.playTipChime(25);
      triggerNeonExplosion({
        particleCount: 35,
        origin: { x: 0.5, y: 0.4 },
        intensity: 'medium'
      });
      showToast(`You are now following ${profile.name}! ⚡`);
    } else {
      showToast(`Unfollowed ${profile.name}`);
    }
  };

  const handleCopyProfileUrl = () => {
    const url = `${window.location.origin}/@${profile.handle.replace('@', '')}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    bossAudio.playInviteGenerated();
    triggerNeonExplosion({
      particleCount: 25,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'subtle'
    });
    showToast(`Copied public profile link: ${url}`);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCopySocialHandle = (social: SocialLinkItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(social.url);
    bossAudio.playSubtlePing();
    triggerNeonExplosion({
      particleCount: 20,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'subtle'
    });
    showToast(`Copied ${social.name} link to clipboard!`);
  };

  const handleSendTip = () => {
    const finalAmt = customTip ? parseFloat(customTip) : tipAmount;
    if (isNaN(finalAmt) || finalAmt <= 0) return;

    if (onTipCreator) {
      onTipCreator(profile.handle, finalAmt);
    }

    setProfile((prev) => ({
      ...prev,
      totalEarnings: prev.totalEarnings + finalAmt
    }));

    bossAudio.playTipChime(finalAmt);
    triggerNeonExplosion({
      particleCount: 60,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'grand'
    });

    setShowTipModal(false);
    showToast(`Sent $${finalAmt.toFixed(2)} Tip to ${profile.name}! (15% Boss cut credited to January Rebl)`);
  };

  const handleSendCollab = (e: React.FormEvent) => {
    e.preventDefault();
    bossAudio.playCollaboratorJoined();
    triggerNeonExplosion({
      particleCount: 40,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'medium'
    });
    setShowCollabModal(false);
    setCollabMessage('');
    showToast(`Collaboration inquiry sent to ${profile.name}'s Executive Priority Inbox! ✨`);
  };

  const handleSaveProfileEdits = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile((prev) => ({
      ...prev,
      name: editName,
      tagline: editTagline,
      bio: editBio,
      location: editLocation
    }));
    setShowEditModal(false);
    bossAudio.playSubtlePing();
    triggerNeonExplosion({
      particleCount: 30,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'subtle'
    });
    showToast('Public profile updated successfully! ⚡');
  };

  const filteredPortfolio = profile.portfolioItems.filter((it) => {
    if (portfolioFilter === 'all') return true;
    if (portfolioFilter === 'pinned') return it.isPinned;
    return it.type === portfolioFilter;
  });

  return (
    <div className="min-h-screen bg-[#050505]/80 backdrop-blur-sm text-white selection:bg-[#C084FC] selection:text-black pt-20 pb-28 relative overflow-hidden">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[350] bg-black/95 border border-[#00F5D4] text-[#00F5D4] px-6 py-3 rounded-full text-xs font-mono font-bold shadow-[0_0_30px_rgba(0,245,212,0.4)] flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <i className="fa-solid fa-bolt text-[#00F5D4] text-sm animate-bounce"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80rem] h-[35rem] bg-gradient-to-b from-[#C084FC]/15 via-[#00F5D4]/10 to-transparent blur-[160px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 space-y-10">

        {/* TOP BAR / NAVIGATION BREADCRUMB & PRESET SWITCHER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-arrow-left text-[11px]"></i>
                <span>Home</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs font-mono">/</span>
              <span className="text-[11px] font-mono uppercase font-bold tracking-widest text-[#00F5D4] flex items-center gap-1.5">
                <i className="fa-solid fa-id-card-clip"></i>
                <span>Public Creator Profile</span>
              </span>
            </div>
          </div>

          {/* Quick Creator Profile Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 hidden md:inline">
              View Profile:
            </span>
            <div className="flex items-center gap-1.5 p-1 bg-black/60 border border-white/15 rounded-2xl">
              {CREATOR_PRESETS.map((cr) => (
                <button
                  key={cr.id}
                  onClick={() => handleSelectCreator(cr.id)}
                  className={`px-3 py-1 rounded-xl text-[10px] font-mono uppercase font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCreatorId === cr.id
                      ? 'bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <img src={cr.avatar} alt={cr.name} className="w-4 h-4 rounded-full object-cover" />
                  <span>{cr.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* HERO BANNER & PROFILE IDENTITY CARD */}
        <div className="relative rounded-[2.5rem] overflow-hidden border border-white/15 bg-zinc-950 shadow-[0_0_80px_rgba(0,0,0,0.85)]">
          {/* Dynamic Cover Artwork */}
          <div className="relative h-56 sm:h-72 md:h-80 w-full overflow-hidden bg-black">
            <img
              src={profile.coverImage}
              alt="Profile Cover"
              className="w-full h-full object-cover object-center filter brightness-90 contrast-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
            
            {/* Ambient Energy Grid Flare */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#C084FC]/25 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Overlay Badges */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 z-20">
              <span className="px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-xl border border-[#00F5D4]/40 text-[#00F5D4] text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-ping"></span>
                <span>Verified Sovereign Creator</span>
              </span>
              
              {profile.collabStatus === 'accepting' && (
                <span className="hidden sm:inline-flex px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-xl border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest items-center gap-1.5">
                  <i className="fa-solid fa-circle-check text-xs"></i>
                  <span>Open For Commissions</span>
                </span>
              )}
            </div>

            {/* Top Right Action Pills */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-20">
              <button
                onClick={() => setShowQRCodeModal(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-black/70 hover:bg-black backdrop-blur-xl border border-white/20 hover:border-[#00F5D4] text-white hover:text-[#00F5D4] flex items-center justify-center text-xs transition-all shadow-md cursor-pointer"
                title="View QR Code & Public Card"
              >
                <i className="fa-solid fa-qrcode text-sm"></i>
              </button>

              <button
                onClick={handleCopyProfileUrl}
                className={`px-3.5 sm:px-4 py-2 rounded-2xl font-mono text-xs font-bold uppercase transition-all backdrop-blur-xl border flex items-center gap-2 cursor-pointer shadow-md ${
                  copiedLink
                    ? 'bg-[#00F5D4] text-black border-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.4)]'
                    : 'bg-black/70 hover:bg-black/90 text-white border-white/20 hover:border-[#00F5D4]'
                }`}
              >
                <i className={`fa-solid ${copiedLink ? 'fa-check text-black' : 'fa-link text-[#00F5D4]'}`}></i>
                <span className="hidden sm:inline">{copiedLink ? 'Link Copied' : 'Copy Profile Link'}</span>
              </button>

              <button
                onClick={() => setShareModalData({
                  title: `${profile.name} — Public Sovereign Creator Profile`,
                  url: `${window.location.origin}/@${profile.handle.replace('@', '')}`,
                  type: 'photo'
                })}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-mono font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(255,0,127,0.5)] hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-share-nodes text-xs"></i>
                <span className="hidden sm:inline">Share</span>
              </button>

              <button
                onClick={() => setShowEditModal(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-black/70 hover:bg-black backdrop-blur-xl border border-white/20 hover:border-[#C084FC] text-white hover:text-[#C084FC] flex items-center justify-center text-xs transition-all shadow-md cursor-pointer"
                title="Edit Public Bio & Info"
              >
                <i className="fa-solid fa-pen-to-square text-xs"></i>
              </button>
            </div>
          </div>

          {/* Identity Info Strip */}
          <div className="px-6 sm:px-10 pb-8 pt-0 relative z-10 -mt-16 sm:-mt-24">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              
              {/* Avatar + Main Title Group */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
                
                {/* Glowing Hexagonal/Rounded Avatar with interactive face changer */}
                <div 
                  onClick={() => setShowChangeFaceModal(true)}
                  className="relative group cursor-pointer"
                  title="Click to take a selfie or upload your face for your bio"
                >
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl p-1 bg-gradient-to-tr from-[#FF007F] via-[#C084FC] to-[#00F5D4] shadow-[0_0_35px_rgba(0,245,212,0.45)] shrink-0 overflow-hidden relative">
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-full h-full object-cover rounded-[1.4rem] transition-transform group-hover:scale-105 duration-300"
                    />
                    
                    {/* Hover Camera Snapshot Badge */}
                    <div className="absolute inset-1 rounded-[1.4rem] bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 text-center p-2">
                      <div className="w-8 h-8 rounded-full bg-[#00F5D4] text-black flex items-center justify-center text-xs mb-1 shadow-lg">
                        <i className="fa-solid fa-camera"></i>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                        Set My Face
                      </span>
                    </div>
                  </div>

                  {/* PRO Badge + Camera Quick Action Pill */}
                  <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-[#00F5D4] text-black font-mono font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center gap-1">
                    <i className="fa-solid fa-camera text-[8px]"></i>
                    <span>BIO FACE</span>
                  </div>
                </div>

                {/* Name, Handle, Badges & Tagline */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl sm:text-4xl font-serif font-black italic text-white tracking-tight">
                      {profile.name}
                    </h1>
                    <span className="text-sm font-mono text-[#00F5D4] font-bold">
                      {profile.handle}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#FFB800]/15 border border-[#FFB800]/40 text-[#FFB800] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                      <i className="fa-solid fa-crown text-[10px]"></i>
                      <span>{profile.rank}</span>
                    </span>
                  </div>

                  <p className="text-sm sm:text-base font-mono text-gray-300 font-medium max-w-2xl">
                    {profile.role}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-mono text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1.5 text-gray-300">
                      <i className="fa-solid fa-location-dot text-[#FF007F]"></i>
                      <span>{profile.location}</span>
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="flex items-center gap-1.5 text-[#00F5D4]">
                      <i className="fa-solid fa-clock"></i>
                      <span>{profile.timezone}</span>
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="flex items-center gap-1.5 text-[#C084FC]">
                      <i className="fa-solid fa-users"></i>
                      <span><strong className="text-white font-bold">{profile.followersCount.toLocaleString()}</strong> Followers</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Follow, Tip & Inquire */}
              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0">
                <button
                  onClick={handleToggleFollow}
                  className={`px-5 py-3 rounded-2xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                    profile.isFollowing
                      ? 'bg-white/10 text-white border border-white/20 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40'
                      : 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105'
                  }`}
                >
                  <i className={`fa-solid ${profile.isFollowing ? 'fa-user-check text-[#00F5D4]' : 'fa-user-plus'}`}></i>
                  <span>{profile.isFollowing ? 'Following' : 'Follow Creator'}</span>
                </button>

                <button
                  onClick={() => setShowTipModal(true)}
                  className="px-5 py-3 rounded-2xl bg-[#00F5D4] hover:bg-[#00F5D4]/90 text-black font-mono text-xs font-black uppercase tracking-wider shadow-[0_0_25px_rgba(0,245,212,0.4)] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-bolt text-xs"></i>
                  <span>Send Tip</span>
                </button>

                <button
                  onClick={() => setShowCollabModal(true)}
                  className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/20 hover:border-[#C084FC] text-white hover:text-[#C084FC] font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-handshake-angle text-xs"></i>
                  <span>Hire / Collab</span>
                </button>
              </div>
            </div>

            {/* Key Metrics Strip */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3 bg-black/70 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
              <div className="text-center px-2">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Total Reach</span>
                <span className="text-lg sm:text-xl font-mono font-black text-[#00F5D4]">{profile.totalReach}</span>
              </div>
              <div className="text-center px-2 border-l border-white/10">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">AI Rep Score</span>
                <span className="text-lg sm:text-xl font-mono font-black text-[#C084FC]">{profile.reputationScore}%</span>
              </div>
              <div className="text-center px-2 border-l border-white/10">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Showcase Works</span>
                <span className="text-lg sm:text-xl font-mono font-black text-white">{profile.portfolioItems.length} Masterpieces</span>
              </div>
              <div className="text-center px-2 border-l border-white/10">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Total Tips Inflow</span>
                <span className="text-lg sm:text-xl font-mono font-black text-[#FF007F]">${profile.totalEarnings.toLocaleString()}</span>
              </div>
              <div className="text-center px-2 border-l border-white/10 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Tournament Rank</span>
                <span className="text-lg sm:text-xl font-mono font-black text-[#FFB800]">#1 Sovereign</span>
              </div>
            </div>

            {/* BIO & EXPANDABLE MANIFESTO */}
            <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
              <p className="text-sm sm:text-base font-sans text-gray-200 font-light leading-relaxed max-w-5xl">
                {profile.bio}
              </p>

              {/* AI Specialties Tag Cloud */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mr-2">
                  Specialties:
                </span>
                {profile.aiSpecialties.map((spec, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#00F5D4] flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-sparkles text-[9px] text-[#C084FC]"></i>
                    <span>{spec}</span>
                  </span>
                ))}
              </div>

              {/* Expandable Philosophy & Synthesis Stack */}
              <div className="pt-2">
                <button
                  onClick={() => setShowManifestoExpanded(!showManifestoExpanded)}
                  className="text-xs font-mono font-bold text-[#C084FC] hover:text-[#00F5D4] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <i className={`fa-solid ${showManifestoExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-[10px]`}></i>
                  <span>{showManifestoExpanded ? 'Hide Creator Philosophy & Synthesis Stack' : 'Read Creator Philosophy & Synthesis Stack'}</span>
                </button>

                {showManifestoExpanded && (
                  <div className="mt-4 p-5 rounded-2xl bg-black/80 border border-[#C084FC]/30 space-y-3 animate-in fade-in duration-300">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#00F5D4] flex items-center gap-2">
                      <i className="fa-solid fa-quote-left text-[#FF007F]"></i>
                      <span>Creator Philosophy & Manifesto</span>
                    </h4>
                    <p className="text-xs sm:text-sm font-sans text-gray-300 italic leading-relaxed">
                      "{profile.manifesto}"
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <span className="text-[#00F5D4] block font-bold mb-1">Production Pipeline</span>
                        <span className="text-gray-400 text-[11px]">100% Studio Powered on Janu’s Creations</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <span className="text-[#C084FC] block font-bold mb-1">Monetization Split</span>
                        <span className="text-gray-400 text-[11px]">85% Creator Direct / 15% Platform Vault</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <span className="text-[#FF007F] block font-bold mb-1">AI Governance</span>
                        <span className="text-gray-400 text-[11px]">Autonomous Sentinel + Founder January Rebl</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: CONNECT SOCIALS & DIRECT CHANNELS */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-pulse"></span>
                <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#00F5D4]">
                  Omni-Channel Distribution
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-black italic text-white tracking-tight">
                Connect & Follow Socials
              </h2>
              <p className="text-xs font-mono text-gray-400 mt-0.5">
                Direct access to {profile.name}’s official channels, masterclasses, and music streaming.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyProfileUrl}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-white transition-all flex items-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-copy text-[#00F5D4]"></i>
                <span>Copy Social Bio Link</span>
              </button>
            </div>
          </div>

          {/* Socials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.socialLinks.map((social) => (
              <div
                key={social.id}
                onClick={() => window.open(social.url, '_blank')}
                className={`p-5 rounded-2xl bg-zinc-950 border border-white/10 transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-4 hover:-translate-y-1 shadow-lg ${social.hoverBorder}`}
              >
                {/* Top Row: Icon + Follower Pill + Copy Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl border transition-all ${social.badgeColor}`}>
                      <i className={social.icon}></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-mono font-bold text-white group-hover:text-[#00F5D4] transition-colors">
                          {social.name}
                        </h3>
                        {social.isVerified && (
                          <i className="fa-solid fa-badge-check text-[#00F5D4] text-xs"></i>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-gray-400">
                        {social.handle}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleCopySocialHandle(social, e)}
                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center text-xs transition-colors"
                    title={`Copy ${social.name} Link`}
                  >
                    <i className="fa-solid fa-copy text-[11px]"></i>
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs font-sans text-gray-300 font-light leading-relaxed">
                  {social.description}
                </p>

                {/* Bottom Row: Followers & Direct Link Indicator */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                  <span className="text-[11px] font-bold text-gray-300">
                    {social.followers}
                  </span>
                  <span className="text-[10px] text-[#00F5D4] uppercase font-bold tracking-wider flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Visit Channel</span>
                    <i className="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: PUBLIC DIGITAL PORTFOLIO (GENERATED IN CREATOR SHOWCASE) */}
        <div id="showcase-portfolio" className="space-y-6 pt-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#FF007F]/20 via-[#C084FC]/20 to-[#00F5D4]/20 border border-[#00F5D4]/40 text-[#00F5D4] text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <i className="fa-solid fa-sparkles text-[#C084FC]"></i>
                  <span>Generated In Creator Showcase</span>
                </span>
                <span className="text-xs font-mono text-gray-400">• High Fidelity Digital Portfolio</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-black italic text-white tracking-tight">
                Public Digital Portfolio
              </h2>
              <p className="text-xs sm:text-sm font-mono text-gray-400 mt-1 max-w-3xl">
                Masterpieces synthesized, edited, and curated inside Janu’s Creator Showcase. Click any artwork to inspect the neural directives, play audio stems, or remix in studio.
              </p>
            </div>

            {/* Showcase Studio Link & Share Portfolio */}
            <div className="flex items-center gap-3 shrink-0">
              {onOpenShowcaseTab && (
                <button
                  onClick={onOpenShowcaseTab}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-mono font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(255,0,127,0.4)] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-sparkles text-xs"></i>
                  <span>Open Creator Showcase Studio</span>
                </button>
              )}

              <button
                onClick={() => setShareModalData({
                  title: `${profile.name} — Public Digital Portfolio`,
                  url: `${window.location.origin}/@${profile.handle.replace('@', '')}#portfolio`,
                  type: 'reel'
                })}
                className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-share-nodes text-xs text-[#00F5D4]"></i>
                <span>Share Portfolio</span>
              </button>
            </div>
          </div>

          {/* Portfolio Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setPortfolioFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                portfolioFilter === 'all'
                  ? 'bg-[#00F5D4] text-black shadow-[0_0_15px_rgba(0,245,212,0.4)]'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-grid-2"></i>
              <span>All Works ({profile.portfolioItems.length})</span>
            </button>

            <button
              onClick={() => setPortfolioFilter('pinned')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                portfolioFilter === 'pinned'
                  ? 'bg-[#FFB800] text-black shadow-[0_0_15px_rgba(255,184,0,0.4)]'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-crown"></i>
              <span>Pinned Highlights</span>
            </button>

            <button
              onClick={() => setPortfolioFilter('reel')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                portfolioFilter === 'reel'
                  ? 'bg-[#FF007F] text-white shadow-[0_0_15px_rgba(255,0,127,0.4)]'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-clapperboard"></i>
              <span>Cyber Reels</span>
            </button>

            <button
              onClick={() => setPortfolioFilter('photo')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                portfolioFilter === 'photo'
                  ? 'bg-[#C084FC] text-black shadow-[0_0_15px_rgba(192,132,252,0.4)]'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <span>Photos & Art</span>
            </button>

            <button
              onClick={() => setPortfolioFilter('music')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                portfolioFilter === 'music'
                  ? 'bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black shadow-[0_0_15px_rgba(0,245,212,0.4)]'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-music"></i>
              <span>Music Stems</span>
            </button>
          </div>

          {/* Portfolio Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPortfolio.map((item) => {
              const isReel = item.type === 'reel';
              const isPhoto = item.type === 'photo';
              const isMusic = item.type === 'music';

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveItemModal(item)}
                  className="group relative rounded-[2rem] overflow-hidden bg-zinc-950 border border-white/10 hover:border-[#00F5D4]/60 transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.7)] hover:shadow-[0_0_40px_rgba(0,245,212,0.25)] flex flex-col cursor-pointer"
                >
                  {/* Media Thumbnail Container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>

                    {/* Pinned Tag */}
                    {item.isPinned && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#FFB800] text-black font-mono font-black text-[9px] uppercase tracking-widest shadow-md flex items-center gap-1 z-20">
                        <i className="fa-solid fa-crown text-[8px]"></i>
                        <span>Featured</span>
                      </div>
                    )}

                    {/* Media Type & Duration */}
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

                    {/* Audio Player Strip */}
                    {isMusic && (
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-2 rounded-xl bg-black/75 backdrop-blur-md border border-white/10">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsPlayingAudio(isPlayingAudio === item.id ? null : item.id);
                              bossAudio.playTipChime(10);
                            }}
                            className="w-7 h-7 rounded-lg bg-[#00F5D4] text-black flex items-center justify-center text-xs cursor-pointer hover:scale-105"
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

                  {/* Card Description */}
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

                      {/* Featured Quote / Accolade */}
                      {item.featuredQuote && (
                        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 text-[10px] font-mono text-[#FFB800] flex items-center gap-1.5">
                          <i className="fa-solid fa-crown text-[10px]"></i>
                          <span className="truncate">{item.featuredQuote}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action / Metrics Bar */}
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShareModalData({
                              title: item.title,
                              url: `${window.location.origin}/@${profile.handle.replace('@', '')}/${item.id}`,
                              type: item.type
                            });
                          }}
                          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-[#00F5D4]/20 border border-white/15 hover:border-[#00F5D4] text-gray-300 hover:text-[#00F5D4] flex items-center justify-center transition-all cursor-pointer"
                          title="Share Artwork Directly"
                        >
                          <i className="fa-solid fa-share-nodes text-xs"></i>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowTipModal(true);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-[#00F5D4]/10 hover:bg-[#00F5D4] border border-[#00F5D4]/40 text-[#00F5D4] hover:text-black font-mono font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <i className="fa-solid fa-bolt"></i>
                          <span>Tip</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* MODAL 1: ARTWORK DOSSIER & SHOWCASE INSPECTOR */}
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
                    By <span className="text-[#00F5D4]">{profile.name}</span> • {activeItemModal.category}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveItemModal(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {/* Media Preview */}
              <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black max-h-96 flex items-center justify-center">
                <img
                  src={activeItemModal.mediaUrl}
                  alt={activeItemModal.title}
                  className="w-full h-full object-cover max-h-96"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-widest text-[#00F5D4]">
                  Creative Statement & Synthesis Directives
                </h4>
                <p className="text-sm text-gray-300 font-light leading-relaxed">
                  {activeItemModal.description}
                </p>
              </div>

              {/* Tags */}
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

              {/* Performance Metrics */}
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
                  <span className="text-[9px] font-mono text-gray-400 uppercase block">Tips Earned</span>
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
                  setShareModalData({
                    title: activeItemModal.title,
                    url: `${window.location.origin}/@${profile.handle.replace('@', '')}/${activeItemModal.id}`,
                    type: activeItemModal.type
                  });
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF007F] to-[#C084FC] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
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
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles text-[#00F5D4]"></i>
                    <span>Remix in Studio</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowTipModal(true);
                    setActiveItemModal(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#00F5D4] text-black font-mono font-bold text-xs uppercase tracking-wider hover:scale-105 transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-bolt mr-1.5"></i>
                  <span>Tip Artist</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: TIP CREATOR (WITH 15% BOSS CUT MECHANISM) */}
      {showTipModal && (
        <div className="fixed inset-0 z-[330] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass max-w-md w-full rounded-[2.5rem] border border-[#00F5D4]/50 bg-zinc-950 p-6 sm:p-8 space-y-6 shadow-[0_0_70px_rgba(0,245,212,0.3)] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#00F5D4]/10 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4]">
                  <i className="fa-solid fa-bolt text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-serif font-black italic text-white">
                    Send Creator Tip
                  </h3>
                  <p className="text-[10px] font-mono text-gray-400">
                    To <span className="text-[#00F5D4]">{profile.name}</span> ({profile.handle})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTipModal(false)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Tip Presets */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-gray-400 block tracking-wider">
                Select Tip Amount (USD)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      setTipAmount(amt);
                      setCustomTip('');
                    }}
                    className={`py-3 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer ${
                      tipAmount === amt && !customTip
                        ? 'bg-[#00F5D4] text-black shadow-[0_0_15px_rgba(0,245,212,0.4)] scale-105'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <input
                type="number"
                placeholder="Or custom amount ($)"
                value={customTip}
                onChange={(e) => setCustomTip(e.target.value)}
                className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#00F5D4] focus:outline-none mt-2"
              />
            </div>

            {/* Note */}
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1 tracking-wider">
                Attached Creator Note
              </label>
              <textarea
                rows={2}
                value={tipNote}
                onChange={(e) => setTipNote(e.target.value)}
                className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#00F5D4] focus:outline-none"
              />
            </div>

            {/* Breakdown */}
            <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-1.5 text-[11px] font-mono">
              <div className="flex justify-between text-gray-300">
                <span>Creator Payout (85%):</span>
                <span className="text-[#00F5D4] font-bold">
                  ${((customTip ? parseFloat(customTip) || 0 : tipAmount) * 0.85).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Platform Governance Cut (15%):</span>
                <span className="text-[#C084FC]">
                  ${((customTip ? parseFloat(customTip) || 0 : tipAmount) * 0.15).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Direct PayPal Business Link & Tip Option */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#0079C1]/15 to-[#00457C]/15 border border-[#0079C1]/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fa-brands fa-paypal text-base text-[#38BDF8]"></i>
                  <span className="text-xs font-mono font-bold text-white">Direct PayPal Instant Payment & Tip</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#0079C1]/20 border border-[#0079C1]/40 text-[9px] font-mono text-[#38BDF8] font-bold">
                  Verified
                </span>
              </div>
              <p className="text-[10px] font-mono text-gray-300">
                Prefer to tip or pay instantly via PayPal 1-Click Checkout portal?
              </p>
              <div className="flex items-center gap-2">
                <a
                  href="https://www.paypal.com/ncp/payment/Z6PDFZBTSUBAG"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#0079C1] to-[#38BDF8] hover:from-[#0079C1]/90 hover:to-[#38BDF8]/90 text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#0079C1]/30"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                  <span className="truncate">Pay via PayPal Checkout (Z6PDFZBTSUBAG)</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('https://www.paypal.com/ncp/payment/Z6PDFZBTSUBAG');
                    showToast('Copied: https://www.paypal.com/ncp/payment/Z6PDFZBTSUBAG');
                  }}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-mono text-xs flex items-center gap-1 cursor-pointer transition-all shrink-0"
                  title="Copy PayPal Payment Link"
                >
                  <i className="fa-solid fa-copy text-xs text-[#00F5D4]"></i>
                  <span>Copy</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowTipModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-mono text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTip}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-mono font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-all cursor-pointer"
              >
                Authorize & Send Tip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: COLLABORATE / HIRE INQUIRY */}
      {showCollabModal && (
        <div className="fixed inset-0 z-[330] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass max-w-lg w-full rounded-[2.5rem] border border-[#C084FC]/50 bg-zinc-950 p-6 sm:p-8 space-y-5 shadow-[0_0_70px_rgba(192,132,252,0.3)] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C084FC]/10 border border-[#C084FC]/40 flex items-center justify-center text-[#C084FC]">
                  <i className="fa-solid fa-handshake-angle text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-serif font-black italic text-white">
                    Direct Creative Inquiry
                  </h3>
                  <p className="text-[10px] font-mono text-gray-400">
                    Collaborate with <span className="text-[#C084FC]">{profile.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCollabModal(false)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendCollab} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Project Scope</label>
                <select
                  value={collabType}
                  onChange={(e) => setCollabType(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#C084FC] focus:outline-none"
                >
                  <option value="Brand Campaign Reel">9:16 Brand Campaign Reel</option>
                  <option value="Audio Stem Mastering">Audio Stem Mastering & Spatial Mix</option>
                  <option value="Haute Couture AI Art">Haute Couture 8K Artwork Series</option>
                  <option value="Autonomous AI Pipeline">Custom Autonomous Studio Integration</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Estimated Budget Range</label>
                <select
                  value={collabBudget}
                  onChange={(e) => setCollabBudget(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#C084FC] focus:outline-none"
                >
                  <option value="$1,000 - $2,500">$1,000 - $2,500 USD</option>
                  <option value="$2,500 - $5,000">$2,500 - $5,000 USD</option>
                  <option value="$5,000 - $15,000">$5,000 - $15,000 USD</option>
                  <option value="$15,000+ Enterprise">$15,000+ Enterprise Partnership</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Creative Brief / Objectives</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Outline the aesthetic vision, deliverables, and timeline..."
                  value={collabMessage}
                  onChange={(e) => setCollabMessage(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#C084FC] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCollabModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-mono font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-all cursor-pointer"
                >
                  Dispatch Priority Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-[330] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass max-w-lg w-full rounded-[2.5rem] border border-[#00F5D4]/50 bg-zinc-950 p-6 sm:p-8 space-y-4 shadow-[0_0_70px_rgba(0,245,212,0.3)] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-serif font-black italic text-white flex items-center gap-2">
                <i className="fa-solid fa-pen-to-square text-[#00F5D4]"></i>
                Edit Public Creator Profile
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfileEdits} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#00F5D4] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Role / Tagline</label>
                <input
                  type="text"
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#00F5D4] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Public Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#00F5D4] focus:outline-none"
                  required
                />
              </div>

              {/* Quick Face / Avatar Changer in Modal */}
              <div className="p-3 bg-black/50 border border-white/10 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={profile.avatar} alt="Current Face" className="w-10 h-10 rounded-xl object-cover border border-[#00F5D4]/40" />
                  <div>
                    <span className="text-[11px] font-mono font-bold text-white block">Profile & Bio Face</span>
                    <span className="text-[9px] font-mono text-gray-400">Live Camera or Photo File</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChangeFaceModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[#00F5D4] text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-camera text-xs"></i>
                  <span>Change Face</span>
                </button>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1">Location & Base</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#00F5D4] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#00F5D4] text-black font-mono font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: QR CODE & PUBLIC CARD */}
      {showQRCodeModal && (
        <div className="fixed inset-0 z-[330] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass max-w-sm w-full rounded-[2.5rem] border border-[#00F5D4]/50 bg-zinc-950 p-6 sm:p-8 space-y-5 text-center shadow-[0_0_70px_rgba(0,245,212,0.3)] animate-in fade-in zoom-in-95">
            <div className="flex justify-end">
              <button
                onClick={() => setShowQRCodeModal(false)}
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#FF007F] via-[#C084FC] to-[#00F5D4] p-1 shadow-lg">
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover rounded-[0.9rem]" />
            </div>

            <div>
              <h3 className="text-lg font-serif font-black italic text-white">{profile.name}</h3>
              <p className="text-xs font-mono text-[#00F5D4]">{profile.handle}</p>
            </div>

            {/* Clean Stylized SVG QR Code */}
            <div className="p-4 bg-white rounded-2xl mx-auto w-48 h-48 flex items-center justify-center shadow-inner">
              <svg viewBox="0 0 100 100" className="w-full h-full text-black fill-current">
                {/* Corner Markers */}
                <rect x="10" y="10" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="4" rx="2" />
                <rect x="16" y="16" width="12" height="12" fill="currentColor" />
                
                <rect x="66" y="10" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="4" rx="2" />
                <rect x="72" y="16" width="12" height="12" fill="currentColor" />

                <rect x="10" y="66" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="4" rx="2" />
                <rect x="16" y="72" width="12" height="12" fill="currentColor" />

                {/* Simulated Data Matrix Dots */}
                <rect x="42" y="14" width="6" height="6" />
                <rect x="52" y="14" width="6" height="6" />
                <rect x="42" y="24" width="6" height="6" />
                <rect x="42" y="42" width="16" height="16" rx="2" fill="#FF007F" />
                <rect x="14" y="42" width="6" height="6" />
                <rect x="24" y="52" width="6" height="6" />
                <rect x="66" y="42" width="8" height="8" />
                <rect x="78" y="52" width="6" height="6" />
                <rect x="42" y="66" width="6" height="6" />
                <rect x="52" y="76" width="8" height="8" />
                <rect x="66" y="66" width="8" height="8" />
                <rect x="78" y="78" width="6" height="6" />
              </svg>
            </div>

            <p className="text-[10px] font-mono text-gray-400">
              Scan to open {profile.name}’s public portfolio & social hub on any mobile device.
            </p>

            <button
              onClick={handleCopyProfileUrl}
              className="w-full py-3 rounded-2xl bg-[#00F5D4] text-black font-mono font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer"
            >
              Copy Profile URL
            </button>
          </div>
        </div>
      )}

      {/* SHARE MODAL INTEGRATION */}
      {shareModalData && (
        <ShareModal
          isOpen={true}
          onClose={() => setShareModalData(null)}
          title={shareModalData.title}
          url={shareModalData.url}
          type={shareModalData.type}
          author={profile.name}
        />
      )}

      {/* CHANGE FACE / BIO AVATAR MODAL */}
      <ChangeFaceAvatarModal
        isOpen={showChangeFaceModal}
        onClose={() => setShowChangeFaceModal(false)}
        currentAvatar={profile.avatar}
        onAvatarUpdated={(newAvatar) => {
          setProfile((prev) => ({ ...prev, avatar: newAvatar }));
          showToast('Face avatar updated successfully! ⚡');
        }}
      />

    </div>
  );
};

export default CreatorProfilePage;
