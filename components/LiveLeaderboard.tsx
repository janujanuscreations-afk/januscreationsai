import React, { useState, useEffect } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import { useBossNotifications } from '../context/BossNotificationContext';
import { USER_OFFICIAL_FACE_AVATAR } from '../utils/userProfileState';

export interface LeaderboardCreator {
  id: string;
  rank: number;
  name: string;
  handle: string;
  avatar: string;
  specialty: string;
  totalEarnings: number;
  contestWins: number;
  liveViewersPeak: string;
  viralScore: number; // 0-100
  aiRank: 'Grand Sovereign' | 'Diamond Master' | 'Platinum Alchemist' | 'Gold Creator';
  recentWorkTitle: string;
  recentWorkThumb: string;
  isLiveNow?: boolean;
  cheersCount: number;
}

interface LiveLeaderboardProps {
  onTipCreator?: (handle: string, amount: number) => void;
  onOpenLiveStream?: (creatorName: string) => void;
  onOpenContests?: () => void;
}

const INITIAL_CREATORS: LeaderboardCreator[] = [
  {
    id: 'c1',
    rank: 1,
    name: 'January Rebl',
    handle: '@JanuaryRebl',
    avatar: USER_OFFICIAL_FACE_AVATAR,
    specialty: 'Founder & AI Creative Director',
    totalEarnings: 24850.00,
    contestWins: 18,
    liveViewersPeak: '12.4K',
    viralScore: 99.8,
    aiRank: 'Grand Sovereign',
    recentWorkTitle: 'Cyber Couture 2026 Anthem',
    recentWorkThumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
    isLiveNow: true,
    cheersCount: 4230
  },
  {
    id: 'c2',
    rank: 2,
    name: 'Elena Vance',
    handle: '@VanceVisuals',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
    specialty: 'Cinematic Reel Alchemist',
    totalEarnings: 16420.50,
    contestWins: 9,
    liveViewersPeak: '8.1K',
    viralScore: 97.4,
    aiRank: 'Diamond Master',
    recentWorkTitle: 'Neo-Tokyo 8K Time-Warp',
    recentWorkThumb: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&q=80',
    cheersCount: 2890
  },
  {
    id: 'c3',
    rank: 3,
    name: 'Marcus Kincaid',
    handle: '@AudioGodMarcus',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    specialty: 'Gospel & Trap Beat Master',
    totalEarnings: 13910.00,
    contestWins: 7,
    liveViewersPeak: '6.5K',
    viralScore: 95.1,
    aiRank: 'Diamond Master',
    recentWorkTitle: 'Holy Fire 808 Symphony',
    recentWorkThumb: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
    isLiveNow: true,
    cheersCount: 2150
  },
  {
    id: 'c4',
    rank: 4,
    name: 'Aria Thorne',
    handle: '@AriaCyberArt',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
    specialty: 'Neural Generative 3D',
    totalEarnings: 9840.00,
    contestWins: 5,
    liveViewersPeak: '4.9K',
    viralScore: 92.8,
    aiRank: 'Platinum Alchemist',
    recentWorkTitle: 'Holographic Eden Render',
    recentWorkThumb: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=600&q=80',
    cheersCount: 1740
  },
  {
    id: 'c5',
    rank: 5,
    name: 'Devon Cruz',
    handle: '@CruzFilmmaker',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    specialty: 'High-Speed Drone & FX',
    totalEarnings: 7650.00,
    contestWins: 4,
    liveViewersPeak: '3.8K',
    viralScore: 89.6,
    aiRank: 'Platinum Alchemist',
    recentWorkTitle: 'Midnight Drift Drift Beat',
    recentWorkThumb: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
    cheersCount: 1320
  },
  {
    id: 'c6',
    rank: 6,
    name: 'Serena Lin',
    handle: '@SerenaSoundz',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
    specialty: 'Acoustic Guitar & Vocal Stems',
    totalEarnings: 6120.00,
    contestWins: 3,
    liveViewersPeak: '2.9K',
    viralScore: 88.2,
    aiRank: 'Gold Creator',
    recentWorkTitle: 'Acoustic Rain Harmony',
    recentWorkThumb: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&q=80',
    cheersCount: 980
  },
  {
    id: 'c7',
    rank: 7,
    name: 'Zane Maverick',
    handle: '@ZaneHeavyMetal',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
    specialty: 'Heavy Metal & Guitar Solos',
    totalEarnings: 5340.00,
    contestWins: 3,
    liveViewersPeak: '2.4K',
    viralScore: 86.9,
    aiRank: 'Gold Creator',
    recentWorkTitle: 'Thunder Forge Solo Battle',
    recentWorkThumb: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
    cheersCount: 840
  }
];

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({
  onTipCreator,
  onOpenLiveStream,
  onOpenContests
}) => {
  const { notifyBoss } = useBossNotifications();
  const [creators, setCreators] = useState<LeaderboardCreator[]>(INITIAL_CREATORS);
  const [activeCategory, setActiveCategory] = useState<'all' | 'earnings' | 'contests' | 'live' | 'viral'>('all');
  const [timeframe, setTimeframe] = useState<'all-time' | 'weekly' | '24h'>('all-time');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreator, setSelectedCreator] = useState<LeaderboardCreator | null>(null);
  const [tipModalCreator, setTipModalCreator] = useState<LeaderboardCreator | null>(null);
  const [tipAmount, setTipAmount] = useState<number>(25);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Real-time live score updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCreators(prev => {
        const copy = [...prev];
        const randomIdx = Math.floor(Math.random() * copy.length);
        const bump = Math.floor(Math.random() * 5) + 1;
        copy[randomIdx] = {
          ...copy[randomIdx],
          cheersCount: copy[randomIdx].cheersCount + bump
        };
        return copy;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleCheer = (creatorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetCreator = creators.find(c => c.id === creatorId);
    
    setCreators(prev =>
      prev.map(c => {
        if (c.id === creatorId) {
          const newCheers = c.cheersCount + 1;
          // Check for rank-up milestone trigger
          if (newCheers % 5 === 0 && c.rank > 1) {
            const oldR = c.rank;
            const newR = Math.max(1, c.rank - 1);
            notifyBoss({
              type: 'rank_up',
              title: 'Leaderboard Rank Surged!',
              subtitle: `Rank #${newR} Milestone Unlocked`,
              message: `${c.name} surged from #${oldR} to #${newR} after receiving enthusiastic live community cheers!`,
              rankInfo: { oldRank: oldR, newRank: newR, tier: c.aiRank },
              creator: { name: c.name, handle: c.handle, avatar: c.avatar },
              actionLabel: 'View Leaderboard'
            });
          }
          return { ...c, cheersCount: newCheers };
        }
        return c;
      })
    );

    triggerNeonExplosion({
      particleCount: 25,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'small'
    });
    showToast(`Sent Live Cheer to ${targetCreator?.name || 'Creator'}! 🔥`);
  };

  const handleExecuteTip = () => {
    if (!tipModalCreator) return;
    triggerNeonExplosion({
      particleCount: 50,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'grand'
    });
    const fee = tipAmount * 0.15;
    const net = tipAmount - fee;
    if (onTipCreator) {
      onTipCreator(tipModalCreator.handle, tipAmount);
    }
    
    notifyBoss({
      type: 'tip',
      title: 'Leaderboard Tip Sent!',
      subtitle: `+$${tipAmount.toFixed(2)} USD`,
      message: `You tipped $${tipAmount.toFixed(2)} to ${tipModalCreator.name}. $${fee.toFixed(2)} (15% Boss cut) auto-settled to January Rebl's Vault.`,
      amount: tipAmount,
      platformCut: fee,
      creator: { name: tipModalCreator.name, handle: tipModalCreator.handle, avatar: tipModalCreator.avatar },
      actionLabel: 'View Ledger'
    });

    showToast(`Tipped $${tipAmount.toFixed(2)} to ${tipModalCreator.name}! ($${fee.toFixed(2)} Platform Fee to January Rebl)`);
    setTipModalCreator(null);
  };

  // Filter and sort creators
  const filteredCreators = creators
    .filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (activeCategory === 'earnings') return b.totalEarnings - a.totalEarnings;
      if (activeCategory === 'contests') return b.contestWins - a.contestWins;
      if (activeCategory === 'viral') return b.viralScore - a.viralScore;
      if (activeCategory === 'live') return b.cheersCount - a.cheersCount;
      return a.rank - b.rank;
    });

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl bg-zinc-950/95 border border-[#00F5D4] text-white font-mono text-xs shadow-[0_0_30px_rgba(0,245,212,0.4)] flex items-center gap-3 animate-bounce">
          <i className="fa-solid fa-bolt text-[#00F5D4]"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner - Balanced Tri-Neon Gradient Typography */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#FF007F]/15 via-[#C084FC]/15 to-[#00F5D4]/15 blur-[90px] pointer-events-none"></div>

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#FF007F]/15 via-[#C084FC]/15 to-[#00F5D4]/15 border border-white/20 text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-ping"></span>
              <span className="text-neon-trio font-black">Live Real-Time Sovereign Ticker</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[10px] font-mono font-bold">
              Autonomous AI Verified
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif font-black italic text-white tracking-tight">
            Creator <span className="text-neon-trio-animated font-serif italic">Live Leaderboard</span>
          </h2>
          <p className="text-xs sm:text-sm font-mono text-gray-300 max-w-2xl font-light">
            Live rankings across all streams, contests, viral reels, and audio battles. Top creators earn platform bounties and sovereign badges.
          </p>
        </div>

        {/* Quick Action Top Buttons */}
        <div className="flex items-center gap-3 relative z-10 flex-wrap">
          <button
            onClick={() => {
              triggerNeonExplosion({
                particleCount: 50,
                origin: { x: 0.5, y: 0.5 },
                intensity: 'medium'
              });
              showToast("Your Creator Profile has been registered into the Sovereign Leaderboard queue!");
            }}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-mono font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_25px_rgba(192,132,252,0.4)] cursor-pointer flex items-center gap-2"
          >
            <i className="fa-solid fa-crown"></i>
            <span>Register My Rank</span>
          </button>
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* #2 Rank */}
        {creators[1] && (
          <div 
            onClick={() => setSelectedCreator(creators[1])}
            className="p-6 rounded-[2.5rem] bg-zinc-950/80 border border-[#C084FC]/40 hover:border-[#C084FC] transition-all relative group cursor-pointer order-2 md:order-1 flex flex-col justify-between shadow-lg"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-[#C084FC]/20 text-[#C084FC] font-serif font-black text-lg flex items-center justify-center border border-[#C084FC]/40">
                  #2
                </span>
                <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
                  {creators[1].aiRank}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <img 
                  src={creators[1].avatar} 
                  alt={creators[1].name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#C084FC]/50 shadow-md group-hover:scale-105 transition-transform"
                />
                <div>
                  <h4 className="text-base font-serif font-bold text-white group-hover:text-[#C084FC] transition-colors">
                    {creators[1].name}
                  </h4>
                  <p className="text-xs font-mono text-gray-400">{creators[1].handle}</p>
                  <p className="text-[10px] font-mono text-[#00F5D4] mt-0.5">{creators[1].specialty}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs font-mono">
                <div>
                  <span className="text-gray-400 text-[10px] block">Total Vault</span>
                  <span className="text-white font-bold">${creators[1].totalEarnings.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Contest Wins</span>
                  <span className="text-[#FCD34D] font-bold">{creators[1].contestWins} Trophies</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={(e) => handleCheer(creators[1].id, e)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-fire text-[#FF007F]"></i>
                <span>{creators[1].cheersCount}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTipModalCreator(creators[1]);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#C084FC]/20 text-[#C084FC] hover:bg-[#C084FC] hover:text-black font-mono text-xs font-bold transition-all cursor-pointer"
              >
                Send Tip
              </button>
            </div>
          </div>
        )}

        {/* #1 Champion Grand Sovereign */}
        {creators[0] && (
          <div 
            onClick={() => setSelectedCreator(creators[0])}
            className="p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-[#00F5D4] hover:border-[#FF007F] transition-all relative group cursor-pointer order-1 md:order-2 flex flex-col justify-between shadow-[0_0_40px_rgba(0,245,212,0.25)] -translate-y-2 md:-translate-y-4"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-11 h-11 rounded-2xl bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-serif font-black text-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,245,212,0.6)]">
                    #1
                  </span>
                  <i className="fa-solid fa-crown text-[#FCD34D] text-lg animate-bounce"></i>
                </div>
                <span className="text-[10px] font-mono font-black uppercase px-3 py-1 rounded-full bg-gradient-to-r from-[#FF007F]/20 via-[#C084FC]/20 to-[#00F5D4]/20 text-neon-trio border border-white/20">
                  {creators[0].aiRank}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={creators[0].avatar} 
                    alt={creators[0].name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.4)] group-hover:scale-105 transition-transform"
                  />
                  {creators[0].isLiveNow && (
                    <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#FF007F] text-white text-[8px] font-mono font-black uppercase tracking-wider animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-serif font-black text-white group-hover:text-neon-trio transition-colors">
                    {creators[0].name}
                  </h4>
                  <p className="text-xs font-mono text-gray-300">{creators[0].handle}</p>
                  <p className="text-xs font-mono text-[#00F5D4] font-bold mt-0.5">{creators[0].specialty}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-xs font-mono">
                <div>
                  <span className="text-gray-400 text-[10px] block">Vault Earned</span>
                  <span className="text-[#00F5D4] font-black">${creators[0].totalEarnings.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Contest Wins</span>
                  <span className="text-[#FCD34D] font-black">{creators[0].contestWins} Gold</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Viral Score</span>
                  <span className="text-[#C084FC] font-black">{creators[0].viralScore}%</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={(e) => handleCheer(creators[0].id, e)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-fire text-[#FF007F] text-sm"></i>
                <span>{creators[0].cheersCount} Cheers</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTipModalCreator(creators[0]);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-mono text-xs font-black uppercase tracking-wider hover:scale-105 transition-all cursor-pointer shadow-md"
              >
                Send Super Tip
              </button>
            </div>
          </div>
        )}

        {/* #3 Rank */}
        {creators[2] && (
          <div 
            onClick={() => setSelectedCreator(creators[2])}
            className="p-6 rounded-[2.5rem] bg-zinc-950/80 border border-[#00F5D4]/40 hover:border-[#00F5D4] transition-all relative group cursor-pointer order-3 flex flex-col justify-between shadow-lg"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-[#00F5D4]/20 text-[#00F5D4] font-serif font-black text-lg flex items-center justify-center border border-[#00F5D4]/40">
                  #3
                </span>
                <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
                  {creators[2].aiRank}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={creators[2].avatar} 
                    alt={creators[2].name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#00F5D4]/50 shadow-md group-hover:scale-105 transition-transform"
                  />
                  {creators[2].isLiveNow && (
                    <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#FF007F] text-white text-[8px] font-mono font-bold animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-base font-serif font-bold text-white group-hover:text-[#00F5D4] transition-colors">
                    {creators[2].name}
                  </h4>
                  <p className="text-xs font-mono text-gray-400">{creators[2].handle}</p>
                  <p className="text-[10px] font-mono text-[#C084FC] mt-0.5">{creators[2].specialty}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs font-mono">
                <div>
                  <span className="text-gray-400 text-[10px] block">Total Vault</span>
                  <span className="text-white font-bold">${creators[2].totalEarnings.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Contest Wins</span>
                  <span className="text-[#FCD34D] font-bold">{creators[2].contestWins} Trophies</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={(e) => handleCheer(creators[2].id, e)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-fire text-[#FF007F]"></i>
                <span>{creators[2].cheersCount}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTipModalCreator(creators[2]);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#00F5D4]/20 text-[#00F5D4] hover:bg-[#00F5D4] hover:text-black font-mono text-xs font-bold transition-all cursor-pointer"
              >
                Send Tip
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-zinc-950 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
          {[
            { id: 'all', label: 'All-Around', icon: 'fa-globe' },
            { id: 'earnings', label: 'Top Earners', icon: 'fa-vault' },
            { id: 'contests', label: 'Contest Victors', icon: 'fa-trophy' },
            { id: 'viral', label: 'Viral Reels', icon: 'fa-fire' },
            { id: 'live', label: 'Live Streamers', icon: 'fa-tower-broadcast' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-black shadow-md scale-105'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <i className={`fa-solid ${cat.icon}`}></i>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Search & Timeframe */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative flex-1 md:w-56">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
            <input
              type="text"
              placeholder="Search creator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-black border border-white/10 text-white placeholder-gray-500 text-xs font-mono focus:border-[#00F5D4] focus:outline-none"
            />
          </div>

          <div className="flex bg-black rounded-xl border border-white/10 p-1">
            {(['all-time', 'weekly', '24h'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  timeframe === tf ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Full Leaderboard Table */}
      <div className="p-6 rounded-[2.5rem] bg-zinc-950 border border-white/10 space-y-4 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs font-mono text-gray-400 px-4">
          <span className="w-12">Rank</span>
          <span className="flex-1">Creator</span>
          <span className="w-28 text-center hidden sm:block">Specialty</span>
          <span className="w-28 text-center hidden md:block">Contests</span>
          <span className="w-32 text-right">Vault Earnings</span>
          <span className="w-36 text-right">Actions</span>
        </div>

        <div className="space-y-3">
          {filteredCreators.map((creator, idx) => (
            <div
              key={creator.id}
              onClick={() => setSelectedCreator(creator)}
              className="p-4 rounded-2xl bg-black/60 border border-white/5 hover:border-[#00F5D4]/40 flex items-center justify-between gap-4 transition-all hover:bg-white/[0.02] cursor-pointer group"
            >
              {/* Rank */}
              <div className="w-12 flex items-center">
                <span className={`w-8 h-8 rounded-xl font-serif font-black text-sm flex items-center justify-center ${
                  creator.rank === 1 ? 'bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black shadow-md' :
                  creator.rank === 2 ? 'bg-[#C084FC]/20 text-[#C084FC] border border-[#C084FC]/30' :
                  creator.rank === 3 ? 'bg-[#00F5D4]/20 text-[#00F5D4] border border-[#00F5D4]/30' :
                  'bg-white/5 text-gray-400'
                }`}>
                  #{creator.rank}
                </span>
              </div>

              {/* Creator Info */}
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="w-11 h-11 rounded-xl object-cover border border-white/10"
                  />
                  {creator.isLiveNow && (
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#FF007F] border-2 border-black animate-ping"></span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm text-white group-hover:text-[#00F5D4] transition-colors truncate">
                      {creator.name}
                    </span>
                    {creator.rank <= 3 && (
                      <i className="fa-solid fa-circle-check text-[#00F5D4] text-[11px]"></i>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-gray-400 block truncate">
                    {creator.handle}
                  </span>
                </div>
              </div>

              {/* Specialty */}
              <div className="w-28 text-center hidden sm:block">
                <span className="px-2 py-0.5 rounded-lg bg-white/5 text-gray-300 text-[10px] font-mono truncate inline-block max-w-full">
                  {creator.specialty}
                </span>
              </div>

              {/* Contests */}
              <div className="w-28 text-center hidden md:block text-xs font-mono">
                <span className="text-[#FCD34D] font-bold">{creator.contestWins}</span>
                <span className="text-gray-500 text-[10px] ml-1">Wins</span>
              </div>

              {/* Vault Earnings */}
              <div className="w-32 text-right font-mono">
                <span className="text-sm font-bold text-[#00F5D4] block">
                  ${creator.totalEarnings.toLocaleString()}
                </span>
                <span className="text-[9px] text-gray-500">
                  {creator.viralScore}% AI score
                </span>
              </div>

              {/* Actions */}
              <div className="w-36 flex items-center justify-end gap-2 shrink-0">
                <button
                  onClick={(e) => handleCheer(creator.id, e)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-[#FF007F]/20 text-gray-400 hover:text-[#FF007F] transition-colors text-xs font-mono flex items-center gap-1 cursor-pointer"
                  title="Cheer Creator"
                >
                  <i className="fa-solid fa-fire text-xs"></i>
                  <span className="text-[10px]">{creator.cheersCount}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTipModalCreator(creator);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF007F]/20 via-[#C084FC]/20 to-[#00F5D4]/20 hover:from-[#FF007F] hover:via-[#C084FC] hover:to-[#00F5D4] text-white hover:text-black font-mono text-xs font-bold transition-all cursor-pointer border border-white/10 hover:border-transparent"
                >
                  Tip
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Creator Detail Showcase Modal */}
      {selectedCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl bg-zinc-950 border border-white/15 rounded-[2.5rem] p-6 sm:p-8 space-y-6 relative shadow-2xl overflow-hidden">
            <button
              onClick={() => setSelectedCreator(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="flex items-center gap-5">
              <img
                src={selectedCreator.avatar}
                alt={selectedCreator.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#00F5D4] shadow-lg"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-serif font-black text-white">{selectedCreator.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00F5D4]/20 text-[#00F5D4] text-[10px] font-mono font-bold">
                    Rank #{selectedCreator.rank}
                  </span>
                </div>
                <p className="text-xs font-mono text-gray-400">{selectedCreator.handle}</p>
                <p className="text-xs font-mono text-[#C084FC] font-bold mt-1">{selectedCreator.specialty}</p>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-black border border-white/10 text-center font-mono">
              <div>
                <span className="text-[10px] text-gray-400 uppercase block">Total Vault</span>
                <span className="text-base font-black text-[#00F5D4]">${selectedCreator.totalEarnings.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase block">Contest Trophies</span>
                <span className="text-base font-black text-[#FCD34D]">{selectedCreator.contestWins}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase block">AI Rating</span>
                <span className="text-base font-black text-[#C084FC]">{selectedCreator.viralScore}%</span>
              </div>
            </div>

            {/* Featured Work */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-gray-400 font-bold block">Featured Sovereign Masterpiece</span>
              <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video group">
                <img
                  src={selectedCreator.recentWorkThumb}
                  alt={selectedCreator.recentWorkTitle}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 flex flex-col justify-end">
                  <h4 className="text-sm font-serif font-bold text-white">{selectedCreator.recentWorkTitle}</h4>
                  <span className="text-[10px] font-mono text-gray-300">Certified by Janu's Autonomous Engine</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setTipModalCreator(selectedCreator);
                  setSelectedCreator(null);
                }}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-mono font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-gift"></i>
                <span>Tip Creator</span>
              </button>

              <button
                onClick={() => {
                  triggerNeonExplosion({ particleCount: 30, origin: { x: 0.5, y: 0.5 }, intensity: 'small' });
                  showToast(`Followed ${selectedCreator.name}! Updates will appear in your feed.`);
                  setSelectedCreator(null);
                }}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Follow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tip Modal */}
      {tipModalCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-zinc-950 border border-white/15 rounded-[2.5rem] p-6 sm:p-8 space-y-6 relative shadow-2xl">
            <button
              onClick={() => setTipModalCreator(null)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] p-1 mx-auto shadow-lg">
                <img
                  src={tipModalCreator.avatar}
                  alt={tipModalCreator.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <h3 className="text-xl font-serif font-black text-white">
                Tip {tipModalCreator.name}
              </h3>
              <p className="text-xs font-mono text-gray-400">
                15% Platform cut automatically credited to Founder January Rebl
              </p>
            </div>

            {/* Quick Amounts */}
            <div className="grid grid-cols-4 gap-2">
              {[5, 15, 25, 100].map(amt => (
                <button
                  key={amt}
                  onClick={() => setTipAmount(amt)}
                  className={`py-3 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    tipAmount === amt
                      ? 'bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-black scale-105 shadow-md'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Fee Breakdown */}
            <div className="p-4 rounded-2xl bg-black border border-white/10 text-xs font-mono space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>Creator Net (85%):</span>
                <span className="text-white font-bold">${(tipAmount * 0.85).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Founder Vault Siphon (15%):</span>
                <span className="text-[#00F5D4] font-bold">${(tipAmount * 0.15).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleExecuteTip}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-mono font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_25px_rgba(0,245,212,0.4)] cursor-pointer"
            >
              Authorize ${tipAmount.toFixed(2)} Tip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveLeaderboard;
