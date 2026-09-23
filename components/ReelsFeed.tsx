import React, { useState, useEffect } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import { musicAudioEngine, MUSIC_GENRES } from '../utils/musicAudioEngine';

export interface FeedItem {
  id: string;
  type: 'reel' | 'photo' | 'music';
  title: string;
  desc: string;
  mediaUrl: string;
  author: string;
  avatar: string;
  likes: number;
  commentsCount: number;
  tipsEarned: number;
  soundTitle?: string;
  duration?: string;
  timestamp: string;
  isLiked?: boolean;
}

interface ReelsFeedProps {
  items: FeedItem[];
  onTipCreator: (author: string, amount: number) => void;
  onOpenStudio?: (tool: 'reel' | 'photo' | 'music') => void;
  onRemixSound?: (soundTitle: string) => void;
}

export const ReelsFeed: React.FC<ReelsFeedProps> = ({
  items,
  onTipCreator,
  onOpenStudio,
  onRemixSound
}) => {
  const [feedList, setFeedList] = useState<FeedItem[]>(items);
  const [feedMode, setFeedMode] = useState<'immersive' | 'grid'>('immersive');
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  
  // Tipping Modal
  const [selectedTipCreator, setSelectedTipCreator] = useState<FeedItem | null>(null);
  const [tipAmount, setTipAmount] = useState('20');
  
  // Comment drawer state
  const [activeCommentItemId, setActiveCommentItemId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    return () => {
      musicAudioEngine.pause();
    };
  }, []);

  const handleToggleFeedSound = (soundTitle?: string) => {
    if (isPlayingAudio) {
      musicAudioEngine.pause();
      setIsPlayingAudio(false);
    } else {
      // Find matching genre or use first
      const matchedGenre = MUSIC_GENRES.find(g => 
        soundTitle?.toLowerCase().includes(g.id) || soundTitle?.toLowerCase().includes(g.name.toLowerCase())
      ) || MUSIC_GENRES[0];
      musicAudioEngine.setGenre(matchedGenre);
      musicAudioEngine.play();
      setIsPlayingAudio(true);
      triggerNeonExplosion({
        particleCount: 20,
        origin: { x: 0.5, y: 0.7 },
        intensity: 'subtle'
      });
    }
  };
  const [commentsMap, setCommentsMap] = useState<{ [id: string]: { user: string; text: string; time: string }[] }>({
    '1': [
      { user: 'CreativeQueen', text: 'The neon lighting grade is incredible 🔥', time: '10m ago' },
      { user: 'MasterBeats', text: 'This bass sync is insane!', time: '2m ago' }
    ]
  });

  const handleLike = (id: string) => {
    setFeedList(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.isLiked;
        if (nextState) {
          triggerNeonExplosion({
            particleCount: 35,
            origin: { x: 0.5, y: 0.5 },
            intensity: 'subtle'
          });
        }
        return {
          ...item,
          isLiked: nextState,
          likes: nextState ? item.likes + 1 : item.likes - 1
        };
      }
      return item;
    }));
  };

  const handleSendTip = () => {
    if (!selectedTipCreator) return;
    const amt = Number(tipAmount) || 10;
    
    onTipCreator(selectedTipCreator.author, amt);
    
    // Update local tips count for that item
    setFeedList(prev => prev.map(item => item.id === selectedTipCreator.id ? {
      ...item,
      tipsEarned: item.tipsEarned + amt
    } : item));

    triggerNeonExplosion({
      particleCount: 70,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'grand'
    });

    setSelectedTipCreator(null);
  };

  const handleAddComment = (itemId: string) => {
    if (!commentInput.trim()) return;
    setCommentsMap(prev => ({
      ...prev,
      [itemId]: [
        ...(prev[itemId] || []),
        { user: 'You', text: commentInput.trim(), time: 'Just now' }
      ]
    }));
    setFeedList(prev => prev.map(item => item.id === itemId ? {
      ...item,
      commentsCount: item.commentsCount + 1
    } : item));
    setCommentInput('');
    triggerNeonExplosion({
      particleCount: 20,
      origin: { x: 0.5, y: 0.6 },
      intensity: 'subtle'
    });
  };

  const currentReel = feedList[currentReelIndex] || feedList[0];

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F5D4] shadow-[0_0_10px_#00F5D4] animate-pulse"></span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#00F5D4]">
              Janu's Live Community Feed
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black italic text-white">
            Explore Creator Reels, Art & Music
          </h2>
        </div>

        {/* View Toggle & Quick Create */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setFeedMode('immersive')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                feedMode === 'immersive' ? 'bg-[#00F5D4] text-black font-black shadow-[0_0_10px_#00F5D4]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-mobile-screen mr-1.5"></i> 9:16 Reel Player
            </button>
            <button
              onClick={() => setFeedMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                feedMode === 'grid' ? 'bg-[#C084FC] text-black font-black shadow-[0_0_10px_#C084FC]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-table-cells mr-1.5"></i> Grid View
            </button>
          </div>

          {onOpenStudio && (
            <button
              onClick={() => onOpenStudio('reel')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black text-xs font-mono font-black uppercase tracking-wider hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,245,212,0.4)] flex items-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Create Reel</span>
            </button>
          )}
        </div>
      </div>

      {/* MODE 1: IMMERSIVE 9:16 REEL PLAYER */}
      {feedMode === 'immersive' && currentReel && (
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 py-4">
          
          {/* Main Reel Phone Frame */}
          <div className="relative w-full max-w-[360px] aspect-[9/16] rounded-[2.5rem] overflow-hidden border-2 border-white/20 bg-zinc-950 shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col justify-between p-6">
            
            {/* Background Media */}
            <div className="absolute inset-0 bg-black">
              <img 
                src={currentReel.mediaUrl} 
                alt={currentReel.title} 
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90 pointer-events-none"></div>
            </div>

            {/* Top Bar on Reel */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-ping"></span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#00F5D4] bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-md border border-[#00F5D4]/30">
                  {currentReel.type.toUpperCase()}
                </span>
              </div>
              <span className="text-[9px] font-mono text-gray-300 bg-black/60 px-2 py-1 rounded-full backdrop-blur-md">
                {currentReel.timestamp}
              </span>
            </div>

            {/* Right-hand Interaction Column */}
            <div className="absolute right-4 bottom-24 z-20 flex flex-col items-center gap-5">
              
              {/* Creator Avatar & Follow */}
              <div className="relative">
                <img 
                  src={currentReel.avatar} 
                  alt={currentReel.author} 
                  className="w-11 h-11 rounded-full border-2 border-[#00F5D4] object-cover shadow-lg"
                />
                <button 
                  onClick={() => triggerNeonExplosion({ particleCount: 20, origin: { x: 0.8, y: 0.6 }, intensity: 'subtle' })}
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#C084FC] text-black text-[10px] font-black flex items-center justify-center shadow-md cursor-pointer hover:scale-110"
                >
                  +
                </button>
              </div>

              {/* Heart / Like */}
              <button 
                onClick={() => handleLike(currentReel.id)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                  currentReel.isLiked ? 'bg-[#FF007F] text-white shadow-[0_0_15px_#FF007F]' : 'bg-black/60 text-white hover:bg-black/80'
                }`}>
                  <i className="fa-solid fa-heart text-base"></i>
                </div>
                <span className="text-[10px] font-mono text-white font-bold">{currentReel.likes}</span>
              </button>

              {/* Comment */}
              <button 
                onClick={() => setActiveCommentItemId(activeCommentItemId === currentReel.id ? null : currentReel.id)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-all">
                  <i className="fa-solid fa-comment-dots text-base text-[#00F5D4]"></i>
                </div>
                <span className="text-[10px] font-mono text-white font-bold">{currentReel.commentsCount}</span>
              </button>

              {/* Tip Creator Button */}
              <button 
                onClick={() => setSelectedTipCreator(currentReel)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#FCD34D] to-[#00F5D4] text-black flex items-center justify-center shadow-[0_0_15px_rgba(252,211,77,0.5)] transition-all hover:scale-110">
                  <i className="fa-solid fa-dollar-sign text-base font-black"></i>
                </div>
                <span className="text-[10px] font-mono text-[#FCD34D] font-bold">${currentReel.tipsEarned}</span>
              </button>

              {/* Remix Sound */}
              {currentReel.soundTitle && onRemixSound && (
                <button 
                  onClick={() => onRemixSound(currentReel.soundTitle!)}
                  title="Remix this Sound"
                  className="w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-[#C084FC]/50 text-[#C084FC] flex items-center justify-center cursor-pointer animate-spin"
                  style={{ animationDuration: '8s' }}
                >
                  <i className="fa-solid fa-compact-disc text-base"></i>
                </button>
              )}
            </div>

            {/* Bottom Caption & Track Info */}
            <div className="relative z-10 space-y-2 max-w-[78%]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-white">{currentReel.author}</span>
                <span className="px-2 py-0.5 rounded-full bg-[#C084FC]/30 text-[#C084FC] text-[8px] font-mono font-bold uppercase">
                  Verified
                </span>
              </div>
              <p className="text-xs font-sans text-gray-200 line-clamp-3 leading-snug">
                {currentReel.desc}
              </p>

              {/* Sound Tag / Audio Play Pill */}
              {currentReel.soundTitle && (
                <button 
                  onClick={() => handleToggleFeedSound(currentReel.soundTitle)}
                  className={`flex items-center gap-2 text-[10px] font-mono truncate px-3 py-1 rounded-full border transition-all cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-[#FF007F]/20 border-[#FF007F] text-white shadow-[0_0_12px_rgba(255,0,127,0.5)]'
                      : 'bg-black/60 border-[#00F5D4]/40 text-[#00F5D4] hover:border-[#00F5D4]'
                  }`}
                  title="Click to play audio beat"
                >
                  <i className={`fa-solid ${isPlayingAudio ? 'fa-volume-high animate-bounce text-[#FF007F]' : 'fa-music text-[9px]'}`}></i>
                  <span className="truncate">{currentReel.soundTitle}</span>
                  <span className="text-[8px] uppercase tracking-wider font-bold opacity-80">
                    ({isPlayingAudio ? 'Playing' : 'Listen'})
                  </span>
                </button>
              )}
            </div>

          </div>

          {/* Navigation Controls & Queue (Right Sidebar) */}
          <div className="flex flex-col items-center lg:items-start gap-4">
            
            {/* Next / Prev Reel Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentReelIndex(prev => (prev > 0 ? prev - 1 : feedList.length - 1))}
                className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors border border-white/10"
                title="Previous Reel"
              >
                <i className="fa-solid fa-arrow-up"></i>
              </button>
              <button
                onClick={() => setCurrentReelIndex(prev => (prev + 1) % feedList.length)}
                className="w-12 h-12 rounded-2xl bg-[#00F5D4] hover:bg-[#00F5D4]/80 text-black flex items-center justify-center cursor-pointer transition-colors font-black shadow-[0_0_15px_rgba(0,245,212,0.4)]"
                title="Next Reel"
              >
                <i className="fa-solid fa-arrow-down text-lg"></i>
              </button>
            </div>

            <span className="text-xs font-mono text-gray-400">
              Reel {currentReelIndex + 1} of {feedList.length}
            </span>

            {/* Quick Reel Queue Thumbnails */}
            <div className="flex lg:flex-col gap-2 overflow-x-auto max-w-xs p-1">
              {feedList.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentReelIndex(idx)}
                  className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    idx === currentReelIndex
                      ? 'border-[#00F5D4] bg-[#00F5D4]/10'
                      : 'border-white/10 bg-white/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={item.mediaUrl} alt={item.title} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="hidden sm:block overflow-hidden">
                    <p className="text-xs font-mono font-bold text-white truncate">{item.title}</p>
                    <p className="text-[9px] font-mono text-gray-400 truncate">by {item.author}</p>
                  </div>
                </button>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* MODE 2: GRID VIEW OF ALL POSTS */}
      {feedMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {feedList.map(item => (
            <div 
              key={item.id}
              className="glass rounded-3xl border border-white/10 overflow-hidden bg-black/40 hover:border-[#00F5D4]/50 transition-all flex flex-col justify-between group shadow-lg"
            >
              <div className="relative aspect-video overflow-hidden bg-black">
                <img 
                  src={item.mediaUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] font-mono font-bold uppercase tracking-wider text-[#00F5D4] border border-[#00F5D4]/30">
                  {item.type}
                </span>
                <span className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] font-mono text-white">
                  ${item.tipsEarned} Tipped
                </span>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <img src={item.avatar} alt={item.author} className="w-9 h-9 rounded-full border border-[#C084FC] object-cover" />
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white">{item.author}</h4>
                    <p className="text-[9px] font-mono text-gray-400">{item.timestamp}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-serif font-black italic text-white mb-1">{item.title}</h3>
                  <p className="text-xs font-sans text-gray-300 line-clamp-2">{item.desc}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-mono">
                  <button 
                    onClick={() => handleLike(item.id)}
                    className={`flex items-center gap-1.5 cursor-pointer ${item.isLiked ? 'text-[#FF007F]' : 'text-gray-400 hover:text-white'}`}
                  >
                    <i className="fa-solid fa-heart"></i>
                    <span>{item.likes}</span>
                  </button>

                  <button 
                    onClick={() => setSelectedTipCreator(item)}
                    className="px-3 py-1 rounded-full bg-[#00F5D4]/10 text-[#00F5D4] hover:bg-[#00F5D4] hover:text-black transition-all cursor-pointer font-bold flex items-center gap-1"
                  >
                    <i className="fa-solid fa-dollar-sign text-[10px]"></i>
                    <span>Tip</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COMMENT MODAL DRAWER */}
      {activeCommentItemId && (
        <div className="glass p-6 rounded-3xl border border-white/10 bg-black/90 max-w-xl mx-auto space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#00F5D4]">
              Community Discussion
            </h4>
            <button 
              onClick={() => setActiveCommentItemId(null)}
              className="text-gray-400 hover:text-white text-xs font-mono cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
            {(commentsMap[activeCommentItemId] || []).map((c, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-white/5 text-xs font-mono space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#C084FC] font-bold">{c.user}</span>
                  <span className="text-gray-400">{c.time}</span>
                </div>
                <p className="text-gray-200">{c.text}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Add a sovereign comment..."
              className="flex-1 bg-black/70 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-[#00F5D4] outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment(activeCommentItemId)}
            />
            <button 
              onClick={() => handleAddComment(activeCommentItemId)}
              className="px-4 py-2 rounded-xl bg-[#00F5D4] text-black font-mono text-xs font-bold uppercase cursor-pointer"
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* TIPPING MODAL */}
      {selectedTipCreator && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass p-8 rounded-[2.5rem] border border-[#00F5D4]/40 bg-zinc-950 max-w-md w-full space-y-6 shadow-[0_0_60px_rgba(0,245,212,0.3)] animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-coins text-[#00F5D4]"></i>
                <h3 className="text-lg font-serif font-black italic text-white">
                  Tip {selectedTipCreator.author}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedTipCreator(null)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs font-mono text-gray-300">
              Support this creator directly with instant rewards. 
            </p>

            <div className="grid grid-cols-4 gap-2">
              {['5', '10', '25', '100'].map(amt => (
                <button
                  key={amt}
                  onClick={() => setTipAmount(amt)}
                  className={`py-3 rounded-xl border text-xs font-mono font-bold cursor-pointer transition-all ${
                    tipAmount === amt 
                      ? 'border-[#00F5D4] bg-[#00F5D4] text-black font-black' 
                      : 'border-white/10 bg-white/5 text-white hover:border-white/30'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Platform Cut Calculation Note */}
            <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 text-[10px] font-mono space-y-1">
              <div className="flex justify-between text-gray-300">
                <span>Creator Direct Receive (85%):</span>
                <span className="text-[#00F5D4] font-bold">${((Number(tipAmount) || 0) * 0.85).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>January Rebl Platform Cut (15%):</span>
                <span className="text-[#C084FC]">${((Number(tipAmount) || 0) * 0.15).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleSendTip}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-mono text-xs font-black uppercase tracking-wider hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,245,212,0.4)] cursor-pointer"
            >
              Authorize ${tipAmount} Tip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReelsFeed;
