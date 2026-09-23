import React, { useState, useRef, useEffect } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import { generateViralReelScript } from '../services/geminiService';
import { AutoSchedulerUtility } from './AutoSchedulerUtility';
import { autoSchedulerService } from '../services/autoSchedulerService';
import { bossAudio } from '../utils/soundEffects';
import { songService } from '../services/songService';
import { UploadedSong } from '../types';
import SongUploadModal from './SongUploadModal';
import { VeoVideoGenerator } from './VeoVideoGenerator';
import { safeStringify } from '../utils/safeJson';

interface ReelVideoEditorProps {
  onPublishToFeed?: (reelData: {
    title: string;
    desc: string;
    videoUrl: string;
    author: string;
    soundTitle: string;
    duration: string;
  }) => void;
  initialAudio?: string;
}

const sampleClips = [
  {
    id: 'clip1',
    title: 'Neon Cyber Drift',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
    previewColor: '#C084FC',
    vibe: 'Cyberpunk & Fast Transitions',
    duration: 15
  },
  {
    id: 'clip2',
    title: 'Luxury Fashion Runway',
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
    previewColor: '#00F5D4',
    vibe: 'High-End Editorial Slow-Mo',
    duration: 20
  },
  {
    id: 'clip3',
    title: 'Gospel Sunset Frequency',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    previewColor: '#D8B4FE',
    vibe: 'Soulful Acoustic Warmth',
    duration: 30
  },
  {
    id: 'clip4',
    title: 'Heavy Metal Flame Stage',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
    previewColor: '#818CF8',
    vibe: 'Intense Bass Drop & Strobe',
    duration: 12
  }
];

const videoFilters = [
  { id: 'none', name: 'Raw Master', style: 'none' },
  { id: 'neon', name: 'Janu Neon Glow', style: 'hue-rotate-15 contrast-125 saturate-150 drop-shadow-[0_0_15px_rgba(192,132,252,0.6)]' },
  { id: 'teal', name: 'Cyber Teal', style: 'hue-rotate-180 contrast-130 saturate-200' },
  { id: 'noir', name: 'Executive Noir', style: 'grayscale contrast-150 brightness-90' },
  { id: 'golden', name: 'Golden Luxury', style: 'sepia contrast-110 saturate-140 brightness-105' },
  { id: 'vibrant', name: '4K Ultra Vivid', style: 'saturate-200 contrast-115 brightness-110' }
];

const audioTracks = [
  { id: 'track1', name: 'Billboard Manifest #1', artist: 'Top 40 AI', bpm: 128 },
  { id: 'track2', name: 'Studio Bass Drop', artist: 'Janu Flow', bpm: 140 },
  { id: 'track3', name: 'Divine Gospel Chords', artist: 'Gospel Souls', bpm: 95 },
  { id: 'track4', name: 'Fluorescent Fury Stems', artist: 'Iron Alchemist', bpm: 160 },
  { id: 'track5', name: 'Neon Honky Tonk Guitar', artist: 'Outlaw AI', bpm: 110 }
];

export const ReelVideoEditor: React.FC<ReelVideoEditorProps> = ({ onPublishToFeed, initialAudio }) => {
  // State
  const [selectedClip, setSelectedClip] = useState(sampleClips[0]);
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [clipDuration, setClipDuration] = useState(15);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = Math.round(ratio * clipDuration);
    setCurrentTime(newTime);
  };
  const [selectedFilter, setSelectedFilter] = useState('neon');
  const [selectedAudio, setSelectedAudio] = useState(audioTracks[0]);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [beatSyncEnabled, setBeatSyncEnabled] = useState(true);
  
  // Caption & Text Overlay
  const [captionText, setCaptionText] = useState('POV: You run your entire creator empire inside Janu’s Creations 🔥');
  const [captionStyle, setCaptionStyle] = useState<'neon' | 'clean' | 'yellow' | 'boxed'>('neon');
  const [showCaptions, setShowCaptions] = useState(true);
  
  // AI Script Generation
  const [aiTopic, setAiTopic] = useState('');
  const [aiStyle, setAiStyle] = useState('High-energy viral hook with bass drop');
  const [aiScriptResult, setAiScriptResult] = useState<string | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'edit' | 'audio' | 'ai' | 'veo' | 'schedule' | 'export'>('edit');
  const [isAutoSchedulerModalOpen, setIsAutoSchedulerModalOpen] = useState(false);
  const [scheduledConfirmation, setScheduledConfirmation] = useState<string | null>(null);

  // Export status
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSuccess, setExportSuccess] = useState(false);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save & Draft State
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Songs & Audio Tracks
  const [isSongUploadModalOpen, setIsSongUploadModalOpen] = useState(false);
  const [customSongsList, setCustomSongsList] = useState<UploadedSong[]>([]);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [previewAudioSrc, setPreviewAudioSrc] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load songs on mount
  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      const songs = await songService.getAllSongs();
      setCustomSongsList(songs);
      if (initialAudio) {
        const found = songs.find(s => s.id === initialAudio || s.title.toLowerCase() === initialAudio.toLowerCase());
        if (found) {
          setSelectedAudio({
            id: found.id,
            name: found.title,
            artist: found.artist,
            bpm: found.bpm || 120
          });
        }
      }
    } catch (e) {
      console.warn('Could not load songs for reel editor:', e);
    }
  };

  const handleToggleAudioPreview = (trackId: string, audioUrl?: string) => {
    if (playingPreviewId === trackId) {
      if (previewAudioRef.current) previewAudioRef.current.pause();
      setPlayingPreviewId(null);
      setPreviewAudioSrc(null);
    } else {
      const src = audioUrl || 'https://actions.google.com/sounds/v1/ambiences/outdoor_ambience.ogg';
      setPreviewAudioSrc(src);
      setPlayingPreviewId(trackId);
    }
  };

  // Restore draft on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('janu_reel_editor_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.captionText !== undefined) setCaptionText(parsed.captionText);
        if (parsed.captionStyle) setCaptionStyle(parsed.captionStyle);
        if (parsed.selectedFilter) setSelectedFilter(parsed.selectedFilter);
        if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio);
        if (parsed.includeWatermark !== undefined) setIncludeWatermark(parsed.includeWatermark);
        if (parsed.beatSyncEnabled !== undefined) setBeatSyncEnabled(parsed.beatSyncEnabled);
        if (parsed.clipDuration) setClipDuration(parsed.clipDuration);
        if (parsed.playbackSpeed) setPlaybackSpeed(parsed.playbackSpeed);
        if (parsed.lastSavedTime) setLastSavedTime(parsed.lastSavedTime);
        setSaveStatus('saved');
      }
    } catch (e) {
      console.warn('Could not load reel editor draft:', e);
    }
  }, []);

  // Periodic and change-triggered auto-save
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        const now = new Date();
        const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const draftPayload = {
          captionText,
          captionStyle,
          selectedFilter,
          aspectRatio,
          includeWatermark,
          beatSyncEnabled,
          clipDuration,
          playbackSpeed,
          selectedClipId: selectedClip.id,
          selectedAudioId: selectedAudio.id,
          lastSavedTime: timeFormatted
        };
        localStorage.setItem('janu_reel_editor_draft', safeStringify(draftPayload));
        setLastSavedTime(timeFormatted);
        setSaveStatus('saved');
      } catch (e) {
        console.warn('Auto-save failed:', e);
        setSaveStatus('saved');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [captionText, captionStyle, selectedFilter, aspectRatio, includeWatermark, beatSyncEnabled, clipDuration, playbackSpeed, selectedClip, selectedAudio]);

  // Progress ticker for video playback simulation
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= clipDuration) {
            return 0;
          }
          return Math.min(clipDuration, +(prev + 0.1 * playbackSpeed).toFixed(1));
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, clipDuration, playbackSpeed]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomVideoUrl(url);
      setSelectedClip({
        id: 'custom',
        title: file.name.replace(/\.[^/.]+$/, ''),
        thumbnail: url,
        previewColor: '#00F5D4',
        vibe: 'User Uploaded Media',
        duration: 30
      });
      triggerNeonExplosion({
        particleCount: 30,
        origin: { x: 0.5, y: 0.5 },
        intensity: 'subtle'
      });
    }
  };

  const handleGenerateScript = async () => {
    if (!aiTopic.trim()) return;
    setIsGeneratingScript(true);
    try {
      const script = await generateViralReelScript(aiTopic, aiStyle, `${clipDuration}s`);
      setAiScriptResult(script);
      triggerNeonExplosion({
        particleCount: 50,
        origin: { x: 0.7, y: 0.5 },
        intensity: 'medium'
      });
    } catch (err) {
      console.error(err);
      setAiScriptResult("⚡ 3-SECOND HOOK: Stop using 5 different editing apps!\n🎬 SCENE 1: Show Janu's all-in-one studio\n🎵 AUDIO: High-voltage bass drop at 0:04\n💰 CTA: Tap follow & earn creator royalties on Janu's Creations\n🏷️ #CreatorBoss #JanusCreations #ViralReel #CreatorEconomy");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleExportReel = (publishDirect: boolean = false) => {
    setIsExporting(true);
    setExportProgress(10);
    
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          setTimeout(() => {
            setIsExporting(false);
            setExportSuccess(true);
            triggerNeonExplosion({
              particleCount: 90,
              origin: { x: 0.5, y: 0.4 },
              intensity: 'grand'
            });

            if (publishDirect && onPublishToFeed) {
              onPublishToFeed({
                title: selectedClip.title,
                desc: captionText,
                videoUrl: customVideoUrl || selectedClip.thumbnail,
                author: 'You (Creator)',
                soundTitle: selectedAudio.name,
                duration: `${clipDuration}s`
              });
            }
          }, 400);
          return 100;
        }
        return prev + 18;
      });
    }, 200);
  };

  return (
    <div className="glass rounded-[2.5rem] border border-white/10 p-6 md:p-8 bg-black/60 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#C084FC]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#00F5D4]/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F5D4] shadow-[0_0_10px_#00F5D4] animate-pulse"></span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#00F5D4]">
              Janu’s All-In-One Reel & Video Engine
            </span>

            {/* Top-Corner Drafts Saved Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-[#00F5D4]/30 text-[10px] font-mono text-gray-300 shadow-inner">
              {saveStatus === 'saving' ? (
                <>
                  <i className="fa-solid fa-arrows-rotate fa-spin text-[#C084FC] text-[9px]"></i>
                  <span className="text-[#C084FC] font-semibold">Saving Draft...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-check text-[#00F5D4] text-[9px]"></i>
                  <span className="text-gray-300 font-medium">
                    Drafts Saved {lastSavedTime ? `• ${lastSavedTime}` : ''}
                  </span>
                </>
              )}
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black italic text-white">
            Short-Form & Video Master Suite
          </h2>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="video/*,image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl border border-white/20 hover:border-[#00F5D4] text-xs font-mono font-bold uppercase tracking-wider text-white hover:text-[#00F5D4] transition-all flex items-center gap-2 cursor-pointer bg-white/5"
          >
            <i className="fa-solid fa-cloud-arrow-up text-xs text-[#00F5D4]"></i>
            <span>Upload Media</span>
          </button>

          <button 
            onClick={() => setIsAutoSchedulerModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00FFE0]/20 to-[#C084FC]/20 border border-[#00FFE0]/50 hover:border-[#00FFE0] text-xs font-mono font-bold uppercase tracking-wider text-[#00FFE0] hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,255,224,0.2)]"
            title="Analyze audience trends and find optimal posting time"
          >
            <i className="fa-solid fa-clock-rotate-left text-xs animate-spin-slow"></i>
            <span>Auto-Scheduler</span>
          </button>
          
          <button 
            onClick={() => handleExportReel(true)}
            disabled={isExporting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C084FC] via-[#818CF8] to-[#00F5D4] text-black font-mono text-xs font-black uppercase tracking-wider hover:scale-105 transition-all shadow-[0_0_20px_rgba(192,132,252,0.4)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Rendering {exportProgress}%</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane"></i>
                <span>Publish to Feed</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left / Center: Interactive Reel Video Player Canvas (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          
          {/* Aspect Ratio Selector Bar */}
          <div className="flex items-center gap-2 mb-4 bg-white/5 p-1.5 rounded-2xl border border-white/10">
            <button 
              onClick={() => setAspectRatio('9:16')} 
              className={`px-4 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer ${aspectRatio === '9:16' ? 'bg-[#C084FC] text-black font-black shadow-[0_0_12px_#C084FC]' : 'text-gray-400 hover:text-white'}`}
            >
              <i className="fa-solid fa-mobile-screen mr-1.5"></i> 9:16 Reel
            </button>
            <button 
              onClick={() => setAspectRatio('1:1')} 
              className={`px-4 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer ${aspectRatio === '1:1' ? 'bg-[#C084FC] text-black font-black shadow-[0_0_12px_#C084FC]' : 'text-gray-400 hover:text-white'}`}
            >
              <i className="fa-solid fa-square mr-1.5"></i> 1:1 Post
            </button>
            <button 
              onClick={() => setAspectRatio('16:9')} 
              className={`px-4 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer ${aspectRatio === '16:9' ? 'bg-[#C084FC] text-black font-black shadow-[0_0_12px_#C084FC]' : 'text-gray-400 hover:text-white'}`}
            >
              <i className="fa-solid fa-film mr-1.5"></i> 16:9 Cinema
            </button>
          </div>

          {/* Video Preview Frame */}
          <div 
            className={`relative rounded-[2rem] overflow-hidden border-2 border-white/20 bg-zinc-950 shadow-[0_0_40px_rgba(0,0,0,0.9)] transition-all duration-300 ${
              aspectRatio === '9:16' ? 'w-full max-w-[340px] aspect-[9/16]' : aspectRatio === '1:1' ? 'w-full max-w-[420px] aspect-square' : 'w-full max-w-[540px] aspect-video'
            }`}
          >
            {/* Visual media */}
            {customVideoUrl && customVideoUrl.startsWith('blob:') && (
              <video 
                src={customVideoUrl} 
                autoPlay 
                loop 
                muted 
                playsInline 
                onError={(e) => console.warn('Video preview playback notice:', e)}
                className={`w-full h-full object-cover transition-all duration-300 ${videoFilters.find(f => f.id === selectedFilter)?.style || ''}`}
              />
            )}
            {(!customVideoUrl || !customVideoUrl.startsWith('blob:')) && (
              <div className="w-full h-full relative overflow-hidden bg-black">
                <img 
                  src={customVideoUrl || selectedClip.thumbnail} 
                  alt={selectedClip.title}
                  className={`w-full h-full object-cover transition-all duration-300 scale-105 ${
                    isPlaying ? 'animate-pulse' : ''
                  } ${videoFilters.find(f => f.id === selectedFilter)?.style || ''}`}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none"></div>
              </div>
            )}

            {/* Beat drop visualizer wave overlay when playing */}
            {isPlaying && beatSyncEnabled && (
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#00F5D4]/40 text-[#00F5D4] text-[9px] font-mono font-bold">
                  <i className="fa-solid fa-wave-square animate-bounce text-[8px]"></i>
                  <span>BEAT-SYNC: {selectedAudio.bpm} BPM</span>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[9px] font-mono">
                  {playbackSpeed}x
                </div>
              </div>
            )}

            {/* Captions Overlay on Video */}
            {showCaptions && captionText && (
              <div className="absolute bottom-20 left-4 right-4 z-20 pointer-events-none text-center">
                <div className={`inline-block px-4 py-2 rounded-xl text-xs sm:text-sm font-sans font-black leading-tight ${
                  captionStyle === 'neon' 
                    ? 'bg-black/80 text-[#00F5D4] border border-[#00F5D4]/60 shadow-[0_0_20px_rgba(0,245,212,0.4)]'
                    : captionStyle === 'yellow'
                    ? 'bg-yellow-400 text-black shadow-lg font-black'
                    : captionStyle === 'clean'
                    ? 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,1)]'
                    : 'bg-black/90 text-white border border-white/20'
                }`}>
                  {captionText}
                </div>
              </div>
            )}

            {/* Studio Brand Watermark */}
            {includeWatermark && (
              <div className="absolute bottom-4 right-4 z-20 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-[#C084FC]/40 text-[#C084FC] text-[8px] font-mono font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(192,132,252,0.4)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4]"></span>
                <span>Janu's Creations</span>
              </div>
            )}

            {/* Audio Track Tag on Video */}
            <div className="absolute bottom-4 left-4 z-20 pointer-events-none flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white text-[9px] font-mono max-w-[65%] truncate">
              <i className="fa-solid fa-music text-[#C084FC] animate-spin text-[8px]"></i>
              <span className="truncate">{selectedAudio.name}</span>
            </div>

            {/* Center Play / Pause Indicator */}
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors group cursor-pointer"
            >
              <div className={`w-14 h-14 rounded-full bg-black/70 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all transform group-hover:scale-110 ${!isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-80'}`}>
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-lg`}></i>
              </div>
            </button>
          </div>

          {/* Timeline & Scrubber Controls */}
          <div className="w-full max-w-[540px] mt-6 bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 mb-2">
              <span className="text-white font-bold">{currentTime}s</span>
              <span className="text-[#00F5D4] font-bold">{clipDuration}s Master Cut</span>
            </div>
            
            {/* Scrubber bar */}
            <div 
              onClick={handleScrubberClick}
              title="Click or scrub to seek video"
              className="relative w-full h-3 bg-black/80 rounded-full overflow-hidden border border-white/10 cursor-pointer mb-4 hover:border-[#00F5D4]/60 transition-colors"
            >
              <div 
                className="h-full bg-gradient-to-r from-[#C084FC] via-[#818CF8] to-[#00F5D4] transition-all"
                style={{ width: `${(currentTime / clipDuration) * 100}%` }}
              ></div>
            </div>

            {/* Playback Button Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-xs`}></i>
                </button>
                <button 
                  onClick={() => setCurrentTime(0)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                  title="Rewind to Start"
                >
                  <i className="fa-solid fa-backward-step text-xs"></i>
                </button>
              </div>

              {/* Speed Buttons */}
              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
                {[0.5, 1, 1.5, 2].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      playbackSpeed === speed ? 'bg-[#00F5D4] text-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              {/* Duration Slider */}
              <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
                <span>Trim:</span>
                <input 
                  type="range" 
                  min="5" 
                  max="60" 
                  step="5"
                  value={clipDuration}
                  onChange={(e) => setClipDuration(Number(e.target.value))}
                  className="w-20 accent-[#00F5D4] cursor-pointer"
                />
                <span className="text-white font-bold">{clipDuration}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Creator Toolset Inspector Tabs (5 Cols) */}
        <div className="lg:col-span-5 bg-white/[0.03] p-6 rounded-3xl border border-white/10 flex flex-col h-full">
          
          {/* Toolset Tabs */}
          <div className="grid grid-cols-6 gap-1 p-1 bg-black/60 rounded-2xl border border-white/10 mb-6">
            <button
              onClick={() => setActiveSidebarTab('edit')}
              className={`py-2 text-[9px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeSidebarTab === 'edit' ? 'bg-[#C084FC] text-black font-black shadow-[0_0_12px_#C084FC]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-sliders text-xs"></i>
              <span>Filters</span>
            </button>
            <button
              onClick={() => setActiveSidebarTab('audio')}
              className={`py-2 text-[9px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeSidebarTab === 'audio' ? 'bg-[#C084FC] text-black font-black shadow-[0_0_12px_#C084FC]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-music text-xs"></i>
              <span>Audio</span>
            </button>
            <button
              onClick={() => setActiveSidebarTab('ai')}
              className={`py-2 text-[9px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeSidebarTab === 'ai' ? 'bg-[#00F5D4] text-black font-black shadow-[0_0_12px_#00F5D4]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
              <span>Script</span>
            </button>
            <button
              onClick={() => setActiveSidebarTab('veo')}
              className={`py-2 text-[9px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeSidebarTab === 'veo' ? 'bg-gradient-to-r from-[#C084FC] to-[#FF007F] text-white font-black shadow-[0_0_15px_rgba(255,0,127,0.5)]' : 'text-gray-400 hover:text-white'
              }`}
              title="Veo 3 AI Video Generator (Text-to-Video & Image-to-Video)"
            >
              <i className="fa-solid fa-video text-xs text-[#FF007F]"></i>
              <span>Veo 3 AI</span>
            </button>
            <button
              onClick={() => setActiveSidebarTab('schedule')}
              className={`py-2 text-[9px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeSidebarTab === 'schedule' ? 'bg-gradient-to-r from-[#00FFE0] to-[#38BDF8] text-black font-black shadow-[0_0_12px_#00FFE0]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-clock-rotate-left text-xs"></i>
              <span>Schedule</span>
            </button>
            <button
              onClick={() => setActiveSidebarTab('export')}
              className={`py-2 text-[9px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeSidebarTab === 'export' ? 'bg-white text-black font-black shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-download text-xs"></i>
              <span>Export</span>
            </button>
          </div>

          {/* TAB 1: FILTERS & CAPTIONS */}
          {activeSidebarTab === 'edit' && (
            <div className="space-y-6 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
              {/* Presets Grid */}
              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Sample Clip Library
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {sampleClips.map(clip => (
                    <button
                      key={clip.id}
                      onClick={() => {
                        setSelectedClip(clip);
                        setCustomVideoUrl(null);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        selectedClip.id === clip.id && !customVideoUrl
                          ? 'border-[#C084FC] bg-[#C084FC]/10 shadow-[0_0_15px_rgba(192,132,252,0.2)]' 
                          : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      <img src={clip.thumbnail} alt={clip.title} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-mono font-bold text-white truncate">{clip.title}</h4>
                        <p className="text-[9px] font-mono text-gray-400 truncate">{clip.duration}s • {clip.vibe}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Video Color Grading Filters */}
              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Visual Color Filters
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {videoFilters.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedFilter === filter.id 
                          ? 'border-[#00F5D4] bg-[#00F5D4]/10 text-[#00F5D4] font-bold shadow-[0_0_12px_rgba(0,245,212,0.3)]' 
                          : 'border-white/10 text-gray-300 hover:border-white/20'
                      }`}
                    >
                      <span className="text-[10px] font-mono">{filter.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption Overlay Controls */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white">
                    Text / Subtitle Overlay
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showCaptions} 
                      onChange={(e) => setShowCaptions(e.target.checked)}
                      className="accent-[#00F5D4]"
                    />
                    <span className="text-[9px] font-mono text-gray-400">Show</span>
                  </label>
                </div>
                
                <textarea
                  value={captionText}
                  onChange={(e) => setCaptionText(e.target.value)}
                  placeholder="Enter hook text overlay..."
                  rows={2}
                  className="w-full bg-black/70 border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:border-[#C084FC] outline-none"
                />

                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-gray-400">Style:</span>
                  {(['neon', 'yellow', 'clean', 'boxed'] as const).map(style => (
                    <button
                      key={style}
                      onClick={() => setCaptionStyle(style)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-mono uppercase font-bold cursor-pointer ${
                        captionStyle === style ? 'bg-[#C084FC] text-black font-black' : 'bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand Watermark Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/40 border border-white/10">
                <div className="flex items-center gap-2.5">
                  <i className="fa-solid fa-shield-halved text-sm text-[#C084FC]"></i>
                  <div>
                    <h5 className="text-xs font-mono font-bold text-white">Janu Studio Watermark</h5>
                    <p className="text-[9px] font-mono text-gray-400">Certify authorship & prevent piracy</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={includeWatermark} 
                  onChange={(e) => setIncludeWatermark(e.target.checked)}
                  className="accent-[#C084FC] w-4 h-4 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 2: AUDIO SYNC & SOUND VAULT */}
          {activeSidebarTab === 'audio' && (
            <div className="space-y-6 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
              {previewAudioSrc && (
                <audio 
                  ref={previewAudioRef} 
                  src={previewAudioSrc}
                  autoPlay
                  onEnded={() => {
                    setPlayingPreviewId(null);
                    setPreviewAudioSrc(null);
                  }}
                  onError={() => {
                    console.warn('Reel preview audio playback notice');
                    setPlayingPreviewId(null);
                    setPreviewAudioSrc(null);
                  }}
                />
              )}
              
              <SongUploadModal
                isOpen={isSongUploadModalOpen}
                onClose={() => setIsSongUploadModalOpen(false)}
                onSongUploaded={(newSong) => {
                  loadSongs();
                  setSelectedAudio({
                    id: newSong.id,
                    name: newSong.title,
                    artist: newSong.artist,
                    bpm: newSong.bpm || 120
                  });
                }}
              />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Janu Sound Vault & Songs</h4>
                  <p className="text-[10px] font-mono text-gray-400">Full vocal songs, master tracks & beats</p>
                </div>
                <button 
                  onClick={() => setBeatSyncEnabled(!beatSyncEnabled)}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    beatSyncEnabled ? 'bg-[#00F5D4] text-black' : 'bg-white/10 text-gray-400'
                  }`}
                >
                  <i className="fa-solid fa-bolt mr-1"></i> Beat Sync Auto-Cut
                </button>
              </div>

              {/* Upload Custom Song Button */}
              <button
                type="button"
                onClick={() => setIsSongUploadModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#00F5D4]/20 via-[#C084FC]/20 to-[#38BDF8]/20 hover:from-[#00F5D4]/30 hover:to-[#C084FC]/30 border border-[#00F5D4]/40 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-cloud-arrow-up text-[#00F5D4]"></i>
                <span>Upload My Own Song (MP3 / WAV)</span>
              </button>

              {/* Uploaded Songs Section */}
              {customSongsList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-mono font-bold uppercase text-[#00F5D4] tracking-wider block">
                    My Uploaded Songs ({customSongsList.length})
                  </span>
                  {customSongsList.map(song => (
                    <div
                      key={song.id}
                      onClick={() => setSelectedAudio({
                        id: song.id,
                        name: song.title,
                        artist: song.artist,
                        bpm: song.bpm || 120
                      })}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedAudio.id === song.id
                          ? 'border-[#00F5D4] bg-[#00F5D4]/10 shadow-[0_0_15px_rgba(0,245,212,0.2)]'
                          : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {song.coverArtUrl ? (
                          <img src={song.coverArtUrl} alt={song.title} className="w-8 h-8 rounded-xl object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-[#00F5D4]/10 border border-[#00F5D4]/30 flex items-center justify-center text-[#00F5D4] shrink-0">
                            <i className="fa-solid fa-file-audio text-xs"></i>
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <h5 className="text-xs font-mono font-bold text-white truncate">{song.title}</h5>
                          <p className="text-[9px] font-mono text-gray-400 truncate">{song.artist} • {song.bpm} BPM</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAudioPreview(song.id, song.audioUrl);
                          }}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-[10px]"
                          title="Audition song"
                        >
                          <i className={`fa-solid ${playingPreviewId === song.id ? 'fa-pause text-[#00F5D4]' : 'fa-play'}`}></i>
                        </button>
                        {selectedAudio.id === song.id && (
                          <span className="text-[9px] font-mono font-bold text-[#00F5D4] uppercase">Active</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Default Studio Tracks Section */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono font-bold uppercase text-gray-400 tracking-wider block">
                  Studio Sound Catalog
                </span>
                {audioTracks.map(track => (
                  <div
                    key={track.id}
                    onClick={() => setSelectedAudio(track)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedAudio.id === track.id
                        ? 'border-[#00F5D4] bg-[#00F5D4]/10 shadow-[0_0_15px_rgba(0,245,212,0.2)]'
                        : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#00F5D4]">
                        <i className="fa-solid fa-music text-xs"></i>
                      </div>
                      <div>
                        <h5 className="text-xs font-mono font-bold text-white">{track.name}</h5>
                        <p className="text-[9px] font-mono text-gray-400">{track.artist} • {track.bpm} BPM</p>
                      </div>
                    </div>
                    {selectedAudio.id === track.id && (
                      <span className="text-[9px] font-mono font-bold text-[#00F5D4] uppercase">Active</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: GEMINI AI SCRIPT & VIRAL HOOK GENERATOR */}
          {activeSidebarTab === 'ai' && (
            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <i className="fa-solid fa-sparkles text-xs text-[#00F5D4]"></i>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">AI Reel Scriptwriter</h4>
                </div>
                <p className="text-[10px] font-mono text-gray-400">Generate high-converting 3-second hooks & scene maps</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Reel Topic / Niche</label>
                  <input 
                    type="text" 
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g. How to edit luxury reels inside Janu's Creations..."
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:border-[#00F5D4] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Vibe & Style</label>
                  <select 
                    value={aiStyle}
                    onChange={(e) => setAiStyle(e.target.value)}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:border-[#00F5D4] outline-none cursor-pointer"
                  >
                    <option value="High-energy viral hook with bass drop">High-energy viral hook with bass drop</option>
                    <option value="Sophisticated luxury aesthetic & slow storytelling">Sophisticated luxury aesthetic</option>
                    <option value="Direct-to-camera educational monetization tips">Educational monetization tips</option>
                    <option value="Cinematic hype trailer">Cinematic hype trailer</option>
                  </select>
                </div>

                <button 
                  onClick={handleGenerateScript}
                  disabled={isGeneratingScript || !aiTopic.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black font-mono text-xs font-black uppercase tracking-wider hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(0,245,212,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingScript ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Synthesizing Script...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      <span>Generate Viral Script</span>
                    </>
                  )}
                </button>
              </div>

              {aiScriptResult && (
                <div className="p-4 rounded-2xl bg-black/80 border border-[#00F5D4]/40 text-xs font-mono text-gray-200 whitespace-pre-wrap leading-relaxed shadow-lg">
                  {aiScriptResult}
                </div>
              )}
            </div>
          )}

          {/* TAB: VEO 3 VIDEO GENERATOR (Text-to-Video & Image-to-Video) */}
          {activeSidebarTab === 'veo' && (
            <div className="space-y-4 overflow-y-auto max-h-[520px] pr-1 custom-scrollbar">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-[#C084FC]/20 to-[#FF007F]/20 border border-[#C084FC]/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-video text-xs text-[#FF007F] animate-pulse"></i>
                  <div>
                    <h5 className="text-[11px] font-mono font-bold text-white uppercase">Veo 3 Neural Video Suite</h5>
                    <p className="text-[9px] font-mono text-gray-400">Model: veo-3.1-lite-generate-preview</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#FF007F]/20 border border-[#FF007F]/40 text-[#FF007F] text-[8px] font-mono font-bold">
                  16:9 & 9:16
                </span>
              </div>

              <VeoVideoGenerator
                onVideoExportedToReel={(generatedVideoUrl) => {
                  setCustomVideoUrl(generatedVideoUrl);
                  setSelectedClip({
                    id: 'veo-' + Date.now(),
                    title: 'Veo 3 AI Motion Master',
                    thumbnail: generatedVideoUrl,
                    previewColor: '#FF007F',
                    vibe: 'Veo 3 Neural Cinematic Render',
                    duration: 15
                  });
                  setActiveSidebarTab('edit');
                  bossAudio.playSubtlePing();
                  triggerNeonExplosion({ particleCount: 50, intensity: 'grand' });
                }}
              />
            </div>
          )}

          {/* TAB 4: AUTO-SCHEDULER AUDIENCE ENGAGEMENT OPTIMIZER */}
          {activeSidebarTab === 'schedule' && (
            <div className="space-y-4 overflow-y-auto max-h-[520px] pr-1 custom-scrollbar">
              <AutoSchedulerUtility 
                isInlineTab={true}
                contentType="reel"
                mediaTitle={captionText || selectedClip.title}
                mediaPreviewUrl={customVideoUrl || selectedClip.thumbnail}
                onScheduleSuccess={(item) => {
                  setScheduledConfirmation(`Reel queued for ${item.scheduledDay} at ${item.scheduledTime}!`);
                  setTimeout(() => setScheduledConfirmation(null), 6000);
                }}
              />
            </div>
          )}

          {/* TAB 5: EXPORT & PUBLISH */}
          {activeSidebarTab === 'export' && (
            <div className="space-y-6 flex flex-col justify-between h-full">
              <div className="space-y-4">
                {/* Auto-Queue Peak Recommendation Banner */}
                {(() => {
                  const topSlot = autoSchedulerService.getOptimalSlotRecommendations('reel')[0];
                  return (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#00FFE0]/15 via-[#C084FC]/15 to-transparent border border-[#00FFE0]/40 space-y-2.5 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#00FFE0] animate-pulse"></span>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00FFE0]">
                            Peak Viral Window Detected
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-[#00FFE0]/20 text-[#00FFE0] text-[9px] font-mono font-bold">
                          +{topSlot ? topSlot.viralMultiplier : '184%'} Boost
                        </span>
                      </div>

                      <p className="text-xs text-gray-300 font-mono">
                        Optimal Time: <strong className="text-white">{topSlot ? `${topSlot.dayName} at ${topSlot.timeSlotFormatted}` : 'Today at 6:45 PM EST'}</strong>
                      </p>

                      <button
                        onClick={() => {
                          if (topSlot) {
                            autoSchedulerService.scheduleMedia({
                              contentType: 'reel',
                              title: captionText || selectedClip.title,
                              previewUrl: customVideoUrl || selectedClip.thumbnail,
                              scheduledDay: topSlot.dayName,
                              scheduledTime: topSlot.timeSlotFormatted,
                              reason: topSlot.reason,
                              engagementScore: topSlot.score
                            });
                            bossAudio.playAutoSchedulerQueue();
                            triggerNeonExplosion();
                            setScheduledConfirmation(`Queued for ${topSlot.dayName} at ${topSlot.timeSlotFormatted} (+${topSlot.viralMultiplier})!`);
                            setTimeout(() => setScheduledConfirmation(null), 6000);
                          }
                        }}
                        className="w-full py-2.5 rounded-xl bg-[#00FFE0] hover:bg-[#38BDF8] text-black font-mono text-[11px] font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,255,224,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <i className="fa-solid fa-bolt text-xs"></i>
                        <span>One-Click Queue for Peak Time</span>
                      </button>
                    </div>
                  );
                })()}

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">Output Resolution</span>
                    <span className="text-white font-bold">4K 60FPS Studio HDR</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">Aspect Ratio</span>
                    <span className="text-[#00F5D4] font-bold">{aspectRatio}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">Audio Sync</span>
                    <span className="text-white font-bold">{selectedAudio.name}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">Platform Split</span>
                    <span className="text-[#C084FC] font-bold">85% Creator / 15% Janu Cut</span>
                  </div>
                </div>

                {scheduledConfirmation && (
                  <div className="p-4 rounded-2xl bg-[#00FFE0]/10 border border-[#00FFE0]/40 text-[#00FFE0] text-xs font-mono text-center flex items-center justify-center gap-2 animate-in fade-in">
                    <i className="fa-solid fa-clock-rotate-left"></i>
                    <span>{scheduledConfirmation}</span>
                  </div>
                )}

                {exportSuccess && (
                  <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-mono text-center flex items-center justify-center gap-2">
                    <i className="fa-solid fa-circle-check text-green-400"></i>
                    <span>Reel rendered and saved to Studio Library!</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => handleExportReel(true)}
                  disabled={isExporting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#C084FC] via-[#818CF8] to-[#00F5D4] text-black font-mono text-xs font-black uppercase tracking-wider hover:scale-105 transition-all shadow-[0_0_20px_rgba(192,132,252,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <i className="fa-solid fa-paper-plane"></i>
                  <span>Publish Directly to Creator Feed</span>
                </button>

                <button 
                  onClick={() => handleExportReel(false)}
                  disabled={isExporting}
                  className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-download"></i>
                  <span>Download 4K Video File</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Auto-Scheduler Modal Window */}
      <AutoSchedulerUtility 
        isOpen={isAutoSchedulerModalOpen}
        onClose={() => setIsAutoSchedulerModalOpen(false)}
        contentType="reel"
        mediaTitle={captionText || selectedClip.title}
        mediaPreviewUrl={customVideoUrl || selectedClip.thumbnail}
        onScheduleSuccess={(item) => {
          setScheduledConfirmation(`Reel successfully queued for ${item.scheduledDay} at ${item.scheduledTime}!`);
          setTimeout(() => setScheduledConfirmation(null), 6000);
        }}
      />
    </div>
  );
};

export default ReelVideoEditor;
