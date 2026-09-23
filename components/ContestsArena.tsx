import React, { useState } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import ShareModal from './ShareModal';
import { useBossNotifications } from '../context/BossNotificationContext';
import { USER_OFFICIAL_FACE_AVATAR } from '../utils/userProfileState';

interface ContestItem {
  id: string;
  title: string;
  category: 'Reels & Video' | 'Music & Beats' | 'Photo & Art' | 'Freestyle & Vocal';
  prizePool: number;
  entryFee: number;
  entriesCount: number;
  daysRemaining: number;
  sponsor: string;
  coverImage: string;
  description: string;
  rules: string[];
}

interface ContestSubmission {
  id: string;
  contestId: string;
  title: string;
  creator: string;
  avatar: string;
  mediaUrl: string;
  aiScore: number;
  aiBreakdown: {
    visualQuality: number;
    audioPacing: number;
    hookRetention: number;
    originality: number;
  };
  votes: number;
  rank: number;
  hasVoted?: boolean;
}

const initialContests: ContestItem[] = [
  {
    id: 'c1',
    title: 'Viral 9:16 Cyber Reel Battle',
    category: 'Reels & Video',
    prizePool: 5000,
    entryFee: 15,
    entriesCount: 142,
    daysRemaining: 2,
    sponsor: "Janu's Creations Global Treasury",
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
    description: 'Create the most energetic 9:16 vertical reel using Janu Neon Glow filters and synchronized beat cuts.',
    rules: [
      'Must be between 10s and 30s in length.',
      'Must utilize at least one Janu Creations audio stem or certified watermark.',
      'Auto-judged by AI Neural Scorer + Community Upvotes.'
    ]
  },
  {
    id: 'c2',
    title: 'AI Gospel & Soul Beat Championship',
    category: 'Music & Beats',
    prizePool: 3500,
    entryFee: 10,
    entriesCount: 98,
    daysRemaining: 4,
    sponsor: "Janu's Creator Sound Vault",
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    description: 'Compose a soul-stirring Gospel or melodic anthem using the multi-track stem equalizer.',
    rules: [
      'Include 4 stems (Vocals, Bass, Drums, Melody).',
      'Harmonic depth and dynamic mastering will be scored by AI Sound Engine.',
      'Winners earn direct studio feature + cash prize.'
    ]
  },
  {
    id: 'c3',
    title: 'Janu Master 8K Art & Photo Quest',
    category: 'Photo & Art',
    prizePool: 2500,
    entryFee: 10,
    entriesCount: 215,
    daysRemaining: 5,
    sponsor: "Janu's Visual Alchemist Guild",
    coverImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
    description: 'Grade and upscale high-fashion, cyberpunk, or executive artwork with neural neon aura lighting.',
    rules: [
      'Must achieve at least 90/100 AI Visual Composition Score.',
      'Minimum resolution 4K/8K export.'
    ]
  },
  {
    id: 'c4',
    title: 'Midnight Freestyle & Hook Showcase',
    category: 'Freestyle & Vocal',
    prizePool: 4000,
    entryFee: 20,
    entriesCount: 84,
    daysRemaining: 1,
    sponsor: "January Rebl Executive Foundation",
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
    description: 'Drop your hardest 3-second hook and 20-second cadence over heavy 808 basslines.',
    rules: [
      'High cadence, sharp punchlines, zero AI toxicity.',
      'Top 3 winners receive automatic boss-approved wire payouts.'
    ]
  }
];

const initialSubmissions: ContestSubmission[] = [
  {
    id: 'sub-1',
    contestId: 'c1',
    title: 'Neon Odyssey 2026',
    creator: 'JanuVision_AI',
    avatar: USER_OFFICIAL_FACE_AVATAR,
    mediaUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
    aiScore: 98.4,
    aiBreakdown: { visualQuality: 99, audioPacing: 98, hookRetention: 98, originality: 99 },
    votes: 842,
    rank: 1
  },
  {
    id: 'sub-2',
    contestId: 'c1',
    title: 'Executive Cyber Drive',
    creator: 'VentureQueen',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
    mediaUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
    aiScore: 96.2,
    aiBreakdown: { visualQuality: 97, audioPacing: 95, hookRetention: 96, originality: 97 },
    votes: 619,
    rank: 2
  },
  {
    id: 'sub-3',
    contestId: 'c1',
    title: 'HyperSpeed Strobe Cut',
    creator: 'IronAlchemist',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    mediaUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
    aiScore: 94.8,
    aiBreakdown: { visualQuality: 94, audioPacing: 96, hookRetention: 95, originality: 94 },
    votes: 495,
    rank: 3
  }
];

interface ContestsArenaProps {
  onCreditBossTreasury?: (amount: number, reason: string) => void;
  onNavigateToStudio?: (tool: 'reel' | 'photo' | 'music') => void;
}

export const ContestsArena: React.FC<ContestsArenaProps> = ({
  onCreditBossTreasury,
  onNavigateToStudio
}) => {
  const { notifyBoss } = useBossNotifications();
  const [contests, setContests] = useState<ContestItem[]>(initialContests);
  const [selectedContest, setSelectedContest] = useState<ContestItem>(initialContests[0]);
  const [submissions, setSubmissions] = useState<ContestSubmission[]>(initialSubmissions);
  
  // Submission flow
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryMediaUrl, setEntryMediaUrl] = useState('https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop');
  const [isAiScoring, setIsAiScoring] = useState(false);
  const [aiScoreResult, setAiScoreResult] = useState<ContestSubmission['aiBreakdown'] | null>(null);
  
  // Share Contest
  const [shareContest, setShareContest] = useState<ContestItem | null>(null);

  // Voting
  const handleVote = (subId: string) => {
    setSubmissions(prev => prev.map(s => {
      if (s.id === subId) {
        const nextVoteState = !s.hasVoted;
        if (nextVoteState) {
          triggerNeonExplosion({
            particleCount: 40,
            origin: { x: 0.5, y: 0.5 },
            intensity: 'subtle'
          });
        }
        return {
          ...s,
          votes: nextVoteState ? s.votes + 1 : s.votes - 1,
          hasVoted: nextVoteState
        };
      }
      return s;
    }));
  };

  const handleSimulateAiJudgeAndSubmit = () => {
    if (!entryTitle.trim()) return;

    setIsAiScoring(true);

    setTimeout(() => {
      // Generate realistic high AI scores
      const visualQuality = Math.floor(Math.random() * 8) + 92; // 92-99
      const audioPacing = Math.floor(Math.random() * 8) + 92;
      const hookRetention = Math.floor(Math.random() * 8) + 91;
      const originality = Math.floor(Math.random() * 8) + 93;
      const overall = parseFloat(((visualQuality + audioPacing + hookRetention + originality) / 4).toFixed(1));

      const newSubmission: ContestSubmission = {
        id: `sub-${Date.now()}`,
        contestId: selectedContest.id,
        title: entryTitle,
        creator: 'You (Creator)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        mediaUrl: entryMediaUrl,
        aiScore: overall,
        aiBreakdown: { visualQuality, audioPacing, hookRetention, originality },
        votes: 1,
        rank: 1,
        hasVoted: true
      };

      // 20% Boss Cut on entry fee
      const bossCut = selectedContest.entryFee * 0.20;
      if (onCreditBossTreasury) {
        onCreditBossTreasury(bossCut, `Contest Entry Fee (${selectedContest.title})`);
      }

      setSubmissions(prev => [newSubmission, ...prev]);
      setContests(prev => prev.map(c => c.id === selectedContest.id ? {
        ...c,
        entriesCount: c.entriesCount + 1,
        prizePool: c.prizePool + Math.round(selectedContest.entryFee * 0.80)
      } : c));

      setIsAiScoring(false);
      setShowSubmitModal(false);
      setEntryTitle('');

      // Boss Victory Notification
      notifyBoss({
        type: 'contest_win',
        title: 'Contest Entry Victory! 🏆',
        subtitle: `Prize Pool: $${selectedContest.prizePool.toLocaleString()} USD`,
        message: `Your entry "${entryTitle}" scored ${overall}/100 and vaulted straight into 1st Place!`,
        contestInfo: { contestTitle: selectedContest.title, prize: selectedContest.prizePool, rank: 1 },
        amount: selectedContest.prizePool,
        creator: { name: 'You (Creator)' },
        actionLabel: 'View Contest Standings'
      });

      triggerNeonExplosion({
        particleCount: 100,
        origin: { x: 0.5, y: 0.5 },
        intensity: 'grand'
      });
    }, 2000);
  };

  // Filter submissions by active contest
  const activeSubmissions = submissions.filter(s => s.contestId === selectedContest.id);

  // Total boss revenue calculated from all contests
  const totalBossContestCut = contests.reduce((acc, c) => acc + (c.entriesCount * c.entryFee * 0.20), 0);

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#FF007F]/15 via-[#C084FC]/15 to-[#00F5D4]/15 border border-white/20 text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
              <i className="fa-solid fa-trophy text-[#FCD34D] animate-bounce"></i>
              <span className="text-neon-trio font-black">Live Creator Arena & Battles</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[#00F5D4] text-[10px] font-mono font-bold">
              Autonomous AI Judged
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif font-black italic text-white tracking-tight">
            High-Stakes <span className="text-neon-trio-animated font-serif italic">Creator Tournaments</span>
          </h2>
          <p className="text-xs sm:text-sm font-mono text-gray-300 max-w-2xl font-light">
            Enter your reels, art, and beats. Compete for major cash prize pools while automated AI scoring ranks the best creators hands-free.
          </p>
        </div>

        {/* Boss Platform Monetization Metrics Pill */}
        <div className="p-4 rounded-3xl bg-black/80 border border-[#00F5D4]/30 text-right space-y-1 relative z-10 shrink-0 shadow-lg">
          <div className="flex items-center justify-end gap-2 text-[10px] font-mono uppercase tracking-widest text-[#00F5D4]">
            <i className="fa-solid fa-crown"></i>
            <span>Boss Entry Fee Revenue</span>
          </div>
          <p className="text-2xl font-serif font-black italic text-white">
            ${totalBossContestCut.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[9px] font-mono text-gray-400">
            20% Platform Cut on 539+ entries → January Rebl
          </p>
        </div>
      </div>

      {/* Contests Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {contests.map((c) => {
          const isSelected = selectedContest.id === c.id;
          return (
            <div
              key={c.id}
              onClick={() => setSelectedContest(c)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                isSelected
                  ? 'bg-zinc-900 border-[#00F5D4] shadow-[0_0_30px_rgba(0,245,212,0.25)] scale-[1.02]'
                  : 'bg-zinc-950/80 border-white/10 hover:border-white/30 hover:bg-zinc-900/60'
              }`}
            >
              {/* Cover mini thumbnail */}
              <div className="relative h-32 rounded-2xl overflow-hidden mb-4 border border-white/10">
                <img 
                  src={c.coverImage} 
                  alt={c.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-[#00F5D4] font-mono text-[9px] font-bold border border-[#00F5D4]/30 uppercase">
                  {c.category}
                </span>
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-red-500/80 text-white font-mono text-[9px] font-bold">
                  ⏳ {c.daysRemaining}d left
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <h3 className="text-sm font-serif font-black italic text-white line-clamp-2">
                  {c.title}
                </h3>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-400">Prize Pool:</span>
                  <span className="text-[#00F5D4] font-black text-sm">${c.prizePool.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-400">Entry Fee:</span>
                  <span className="text-white font-bold">${c.entryFee} (20% to Boss)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-gray-400">
                <span>{c.entriesCount} Entrants</span>
                <span className={`font-bold ${isSelected ? 'text-[#00F5D4]' : 'text-gray-500'}`}>
                  {isSelected ? 'Viewing Arena →' : 'Select'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ACTIVE CONTEST DETAILS & LIVE SUBMISSION LEADERBOARD */}
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-zinc-950 border border-white/15 space-y-8 shadow-2xl">
        
        {/* Contest Header Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#00F5D4] font-bold uppercase tracking-wider">
                {selectedContest.category}
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-xs font-mono text-gray-400">
                Sponsor: {selectedContest.sponsor}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-serif font-black italic text-white">
              {selectedContest.title}
            </h3>

            <p className="text-xs font-mono text-gray-300 max-w-2xl">
              {selectedContest.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShareContest(selectedContest)}
              className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-share-nodes text-[#00F5D4]"></i>
              <span>Share Battle</span>
            </button>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black font-mono text-xs font-black uppercase tracking-wider hover:scale-105 transition-all shadow-[0_0_25px_rgba(255,0,127,0.4)] cursor-pointer flex items-center gap-2"
            >
              <i className="fa-solid fa-bolt"></i>
              <span>Enter Contest (${selectedContest.entryFee})</span>
            </button>
          </div>
        </div>

        {/* Prize Distribution & AI Scoring Criteria */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-black/60 border border-[#FCD34D]/30 space-y-1">
            <div className="flex items-center gap-2 text-[#FCD34D] text-xs font-mono font-bold">
              <i className="fa-solid fa-crown"></i>
              <span>1st Place Grand Winner</span>
            </div>
            <p className="text-xl font-serif font-black italic text-white">
              ${(selectedContest.prizePool * 0.60).toLocaleString()} Cash
            </p>
            <p className="text-[10px] font-mono text-gray-400">Direct Boss Wire + Certified Verification</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-[#C084FC]/30 space-y-1">
            <div className="flex items-center gap-2 text-[#C084FC] text-xs font-mono font-bold">
              <i className="fa-solid fa-medal"></i>
              <span>2nd Place Runner-Up</span>
            </div>
            <p className="text-xl font-serif font-black italic text-white">
              ${(selectedContest.prizePool * 0.25).toLocaleString()} Cash
            </p>
            <p className="text-[10px] font-mono text-gray-400">Studio Promotion + Sound Library Access</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-[#00F5D4]/30 space-y-1">
            <div className="flex items-center gap-2 text-[#00F5D4] text-xs font-mono font-bold">
              <i className="fa-solid fa-award"></i>
              <span>3rd Place Spotlight</span>
            </div>
            <p className="text-xl font-serif font-black italic text-white">
              ${(selectedContest.prizePool * 0.15).toLocaleString()} Cash
            </p>
            <p className="text-[10px] font-mono text-gray-400">Janu Feed Feature</p>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-ranking-star text-[#00F5D4]"></i>
              <h4 className="text-base font-serif font-black italic text-white">
                Live Submissions & AI Scorecards
              </h4>
            </div>
            <span className="text-xs font-mono text-gray-400">
              Ranked dynamically by AI & Upvotes
            </span>
          </div>

          <div className="space-y-3">
            {activeSubmissions.map((sub, index) => (
              <div
                key={sub.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  index === 0 
                    ? 'bg-gradient-to-r from-zinc-900 via-zinc-900 to-black border-[#FCD34D]/50 shadow-[0_0_20px_rgba(252,211,77,0.15)]' 
                    : 'bg-black/60 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Entrant Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                    index === 0 ? 'bg-[#FCD34D] text-black shadow-md' :
                    index === 1 ? 'bg-zinc-300 text-black' :
                    index === 2 ? 'bg-amber-600 text-white' : 'bg-white/10 text-gray-400'
                  }`}>
                    #{index + 1}
                  </div>

                  <img 
                    src={sub.mediaUrl} 
                    alt={sub.title} 
                    className="w-14 h-14 rounded-2xl object-cover border border-white/10 shrink-0"
                  />

                  <div className="min-w-0">
                    <h5 className="text-sm font-mono font-bold text-white truncate">{sub.title}</h5>
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-400 mt-0.5">
                      <img src={sub.avatar} alt={sub.creator} className="w-3.5 h-3.5 rounded-full" />
                      <span className="text-gray-300 truncate">{sub.creator}</span>
                    </div>
                  </div>
                </div>

                {/* AI Scorecard Mini Visualizer */}
                <div className="flex items-center gap-4 bg-zinc-950 p-2.5 px-4 rounded-2xl border border-white/10 shrink-0">
                  <div className="text-left">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-[#00F5D4]">
                      AI Overall Score
                    </div>
                    <span className="text-lg font-serif font-black italic text-white">
                      {sub.aiScore} / 100
                    </span>
                  </div>

                  <div className="hidden sm:grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] font-mono text-gray-400 border-l border-white/10 pl-3">
                    <span>Visual: <strong className="text-white">{sub.aiBreakdown.visualQuality}%</strong></span>
                    <span>Audio: <strong className="text-white">{sub.aiBreakdown.audioPacing}%</strong></span>
                    <span>Hook: <strong className="text-white">{sub.aiBreakdown.hookRetention}%</strong></span>
                    <span>Origin: <strong className="text-white">{sub.aiBreakdown.originality}%</strong></span>
                  </div>
                </div>

                {/* Upvote & Action Button */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleVote(sub.id)}
                    className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      sub.hasVoted
                        ? 'bg-[#00F5D4] text-black shadow-[0_0_15px_rgba(0,245,212,0.4)]'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    }`}
                  >
                    <i className={`fa-solid fa-heart ${sub.hasVoted ? 'text-black' : 'text-[#FF007F]'}`}></i>
                    <span>{sub.votes} Votes</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SUBMIT CONTEST MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass p-6 sm:p-8 rounded-[2.5rem] border border-[#FF007F]/40 bg-zinc-950 max-w-lg w-full space-y-6 shadow-[0_0_60px_rgba(255,0,127,0.3)] animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-bolt text-[#FF007F]"></i>
                <h3 className="text-lg font-serif font-black italic text-white">
                  Enter {selectedContest.title}
                </h3>
              </div>
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs font-mono text-gray-300">
              Submit your masterpiece. Janu AI Judge will scan the audio, visual pacing, and hooks to give you an instant score.
            </p>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                  Submission Title
                </label>
                <input 
                  type="text" 
                  value={entryTitle}
                  onChange={(e) => setEntryTitle(e.target.value)}
                  placeholder="e.g. Master Neon Symphony 2026"
                  className="w-full bg-black/70 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-white focus:border-[#00F5D4] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                  Select Media from Studio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Reel Studio', img: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop' },
                    { label: 'Photo Alchemist', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop' },
                    { label: 'Music Vault', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop' }
                  ].map((m, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEntryMediaUrl(m.img)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        entryMediaUrl === m.img ? 'border-[#00F5D4] bg-[#00F5D4]/10' : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <img src={m.img} alt={m.label} className="w-full h-14 rounded-lg object-cover" />
                      <span className="text-[10px] font-mono font-bold text-white">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee breakdown */}
              <div className="p-3 rounded-2xl bg-black/60 border border-white/10 text-[10px] font-mono space-y-1">
                <div className="flex justify-between text-gray-300">
                  <span>Contest Entry Fee:</span>
                  <span className="font-bold text-white">${selectedContest.entryFee}.00</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>To Prize Pool (80%):</span>
                  <span className="text-[#00F5D4]">${(selectedContest.entryFee * 0.80).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>January Rebl Boss Platform Fee (20%):</span>
                  <span className="text-[#FF007F] font-bold">${(selectedContest.entryFee * 0.20).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleSimulateAiJudgeAndSubmit}
                disabled={!entryTitle.trim() || isAiScoring}
                className={`w-full py-4 rounded-2xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isAiScoring 
                    ? 'bg-zinc-800 text-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-[#FF007F] via-[#C084FC] to-[#00F5D4] text-black shadow-[0_0_25px_rgba(255,0,127,0.4)] hover:scale-105'
                }`}
              >
                {isAiScoring ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>AI Judge Scanning Audio & Visual Hooks...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-shield-check"></i>
                    <span>Pay ${selectedContest.entryFee} & Run AI Scoring</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SHARE CONTEST MODAL */}
      {shareContest && (
        <ShareModal 
          isOpen={!!shareContest}
          onClose={() => setShareContest(null)}
          title={shareContest.title}
          type="contest"
          author="Janu's Global Arena"
        />
      )}

    </div>
  );
};

export default ContestsArena;
