import React, { useState, useEffect, useRef } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import { generateSonicManifest, generateMusicVideoStoryboard, generateLyricsAndHook } from '../services/geminiService';
import { musicAudioEngine, MUSIC_GENRES, MusicGenreTrack } from '../utils/musicAudioEngine';
import { CategorizedMusicBrowser, MusicTrackItem } from './CategorizedMusicBrowser';
import { AIVoiceoverStudio } from './AIVoiceoverStudio';
import { LyriaMusicGenerator } from './LyriaMusicGenerator';

interface MusicVideoCreatorProps {
  onPublishMusicVideo?: (mvData: {
    title: string;
    artist: string;
    genre: string;
    storyboard: string;
    audioUrl?: string;
  }) => void;
  onPublishToLiveFeed?: (mvData: {
    title: string;
    artist: string;
    genre: string;
    desc: string;
  }) => void;
  onNavigateToReelStudio?: (trackData?: {
    title: string;
    genre: string;
    bpm: number;
    storyboard?: string;
  }) => void;
}

const CATEGORIES = [
  'All Genres',
  'Urban & Beats',
  'Commercial Pop',
  'Electronic / Retro',
  'Soul & Uplifting',
  'Chill & Relaxed',
  'Acoustic & Roots',
  'Alternative & Rock',
  'Club & Electronic',
  'Tropical & Dancehall',
  'Soundtrack & Film'
];

const VIDEO_SHADERS = [
  { id: 'cyberpunk', name: 'Cyberpunk Neon', filter: 'hue-rotate-15 saturate-200 contrast-125', glow: 'rgba(0, 245, 212, 0.5)' },
  { id: 'hologram', name: 'Holographic Aurora', filter: 'hue-rotate-90 saturate-150 brightness-110', glow: 'rgba(192, 132, 252, 0.6)' },
  { id: 'flame', name: 'Stage Flame Flare', filter: 'hue-rotate-320 saturate-200 contrast-140', glow: 'rgba(255, 0, 127, 0.6)' },
  { id: 'gold', name: 'Gospel Golden Aura', filter: 'sepia contrast-120 saturate-180 brightness-105', glow: 'rgba(252, 211, 77, 0.5)' },
  { id: 'noir', name: 'Executive 4K Noir', filter: 'grayscale contrast-160 brightness-90', glow: 'rgba(255, 255, 255, 0.3)' },
  { id: 'synthwave', name: 'Retro Synthwave 80s', filter: 'hue-rotate-270 saturate-180 contrast-130', glow: 'rgba(129, 140, 248, 0.6)' }
];

const CAMERA_ANGLES = [
  { id: 'drone', name: 'Drone Sweeping Angle', icon: 'fa-paper-plane' },
  { id: 'macro-orbit', name: 'Orbital 360 Spin', icon: 'fa-arrows-spin' },
  { id: 'vertigo', name: 'Vertigo Bass Pulse', icon: 'fa-maximize' },
  { id: 'hero-low', name: 'Sovereign Low-Angle', icon: 'fa-crown' }
];

export const MusicVideoCreator: React.FC<MusicVideoCreatorProps> = ({ 
  onPublishMusicVideo,
  onPublishToLiveFeed,
  onNavigateToReelStudio
}) => {
  // Studio View Mode: 'browser' for Categorized Browser, 'synthesizer' for Live Creation Suite
  const [studioViewMode, setStudioViewMode] = useState<'browser' | 'synthesizer'>('synthesizer');

  // Sub-Navigation within Synthesizer Suite
  const [activeTab, setActiveTab] = useState<'stage' | 'lyria' | 'voiceover' | 'mixer' | 'lyrics' | 'storyboard' | 'instruments'>('stage');

  const [selectedCategory, setSelectedCategory] = useState('All Genres');
  const [selectedGenre, setSelectedGenre] = useState<MusicGenreTrack>(MUSIC_GENRES[0]);
  const [trackTitle, setTrackTitle] = useState('Sovereign Frequency #108');
  const [trackConcept, setTrackConcept] = useState('Cyberpunk neon light dispersion with soulful choir harmonies and 808 bass drops');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(MUSIC_GENRES[0].bpm);

  // Stem Volume Mixers (0 - 100)
  const [vocalLevel, setVocalLevel] = useState(85);
  const [bassLevel, setBassLevel] = useState(90);
  const [drumLevel, setDrumLevel] = useState(80);
  const [synthLevel, setSynthLevel] = useState(95);
  const [masterVolume, setMasterVolume] = useState(85);

  // Video Visualizer Options
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [selectedShader, setSelectedShader] = useState(VIDEO_SHADERS[0]);
  const [selectedCameraAngle, setSelectedCameraAngle] = useState(CAMERA_ANGLES[0]);
  const [strobeFX, setStrobeFX] = useState(false);
  const [showLyricsOverlay, setShowLyricsOverlay] = useState(true);

  // AI Storyboard, Sonic Roadmap & Lyrics
  const [storyboard, setStoryboard] = useState<string | null>(null);
  const [sonicRoadmap, setSonicRoadmap] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Video Scene Index for Visualizer
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [audioFreqData, setAudioFreqData] = useState<number[]>(new Array(16).fill(15));
  const animFrameRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const scenes = [
    { title: 'Act I: The Neon Awakening', desc: 'Anamorphic flare cuts into obsidian skyline at midnight', color: '#C084FC', lyricCue: 'In the obsidian city, sparks begin to fly...' },
    { title: 'Act II: Bassline Oscillation', desc: 'Synthesizer oscillations surge with heavy vocal swells', color: '#00F5D4', lyricCue: 'Feel the 808 frequency pulsing through the wire...' },
    { title: 'Act III: Quantum Bass Drop', desc: 'Strobe light particle bursts synched to sub-bass rumble', color: '#FF007F', lyricCue: 'We shatter the ceiling, sovereign and untamed!' },
    { title: 'Act IV: Sovereign Outro', desc: 'Slow cinematic orbit resolving into Janu’s radiant sigil', color: '#D8B4FE', lyricCue: 'Rising above the noise, forever in the light.' }
  ];

  // Subscribe to audio engine events
  useEffect(() => {
    const unsubscribe = musicAudioEngine.subscribe((state) => {
      setIsPlayingAudio(state.isPlaying);
      setCurrentStep(state.step);
      setBpm(state.bpm);
    });

    return () => {
      unsubscribe();
      musicAudioEngine.pause();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Visualizer frequency update loop
  useEffect(() => {
    const freqArray = new Uint8Array(32);
    const updateFreqs = () => {
      if (isPlayingAudio) {
        musicAudioEngine.getFrequencyData(freqArray);
        const sampled = [];
        for (let i = 0; i < 16; i++) {
          const val = (freqArray[i * 2] / 255) * 60 + 10;
          sampled.push(val);
        }
        setAudioFreqData(sampled);
      } else {
        setAudioFreqData(new Array(16).fill(8));
      }
      animFrameRef.current = requestAnimationFrame(updateFreqs);
    };

    animFrameRef.current = requestAnimationFrame(updateFreqs);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlayingAudio]);

  // Rotate video scenes periodically while playing
  useEffect(() => {
    let interval: any;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setCurrentSceneIndex(prev => (prev + 1) % scenes.length);
      }, (60000 / bpm) * 4);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio, bpm]);

  const handleSelectGenre = (genre: MusicGenreTrack) => {
    setSelectedGenre(genre);
    setBpm(genre.bpm);
    musicAudioEngine.setGenre(genre);
    triggerNeonExplosion({
      particleCount: 30,
      origin: { x: 0.5, y: 0.4 },
      intensity: 'subtle'
    });
    showToast(`Loaded sound palette: ${genre.name} (${genre.bpm} BPM)`);
  };

  const handleTogglePlayAudio = () => {
    musicAudioEngine.togglePlay();
  };

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    musicAudioEngine.setBpm(newBpm);
  };

  const handleStemChange = (stem: 'vocal' | 'bass' | 'drum' | 'synth' | 'master', val: number) => {
    if (stem === 'vocal') {
      setVocalLevel(val);
      musicAudioEngine.setVocalLevel(val);
    } else if (stem === 'bass') {
      setBassLevel(val);
      musicAudioEngine.setBassLevel(val);
    } else if (stem === 'drum') {
      setDrumLevel(val);
      musicAudioEngine.setDrumLevel(val);
    } else if (stem === 'synth') {
      setSynthLevel(val);
      musicAudioEngine.setSynthLevel(val);
    } else if (stem === 'master') {
      setMasterVolume(val);
      musicAudioEngine.setMasterVolume(val);
    }
  };

  // Solo instrument preview sounds
  const handleAuditionSound = (instrument: 'kick' | 'snare' | 'hihat' | 'bass' | 'chord' | 'melody') => {
    if (instrument === 'kick') musicAudioEngine.triggerKick();
    else if (instrument === 'snare') musicAudioEngine.triggerSnare();
    else if (instrument === 'hihat') musicAudioEngine.triggerHiHat(undefined, true);
    else if (instrument === 'bass') musicAudioEngine.triggerBass(selectedGenre.bassline[0]);
    else if (instrument === 'chord') musicAudioEngine.triggerChord(selectedGenre.chords[0]);
    else if (instrument === 'melody') musicAudioEngine.triggerMelody(selectedGenre.melodyNotes[0]);
  };

  const handleGenerateFullMusicVideo = async () => {
    setIsGenerating(true);
    try {
      const [storyboardRes, sonicRes] = await Promise.all([
        generateMusicVideoStoryboard(trackTitle, selectedGenre.name, trackConcept),
        generateSonicManifest(`${selectedGenre.name}: ${trackConcept}`)
      ]);
      setStoryboard(storyboardRes);
      setSonicRoadmap(sonicRes);
      setActiveTab('storyboard');
      triggerNeonExplosion({
        particleCount: 80,
        origin: { x: 0.5, y: 0.4 },
        intensity: 'grand'
      });
      showToast('AI Music Video Storyboard synthesized!');
    } catch (err) {
      console.error(err);
      setStoryboard(`🎬 ACT I (The Awakening): Intro kicks off at ${bpm} BPM in key of ${selectedGenre.key} with anamorphic neon lighting.\n🎬 ACT II (The Build): Bass buildup surges with synchronized ${selectedGenre.vibe} vocal sweeps.\n🎬 ACT III (The Quantum Drop): 808 sub-bass drops with multi-colored particle bursts.\n🎬 ACT IV (The Sovereign Outro): Cinematic camera orbit resolving with glowing signature sigil.`);
      setActiveTab('storyboard');
      showToast('Storyboard generated from studio presets!');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateLyrics = async () => {
    setIsGeneratingLyrics(true);
    try {
      const lyricsRes = await generateLyricsAndHook(trackTitle, selectedGenre.name, trackConcept, selectedGenre.vibe);
      setLyrics(lyricsRes);
      setActiveTab('lyrics');
      triggerNeonExplosion({
        particleCount: 65,
        origin: { x: 0.5, y: 0.5 },
        intensity: 'medium'
      });
      showToast('AI Lyrics and Catchy Hook generated!');
    } catch (err) {
      console.error(err);
      setLyrics(`[HOOK - ${selectedGenre.name} Anthemic Hook]\nWe light the fire in the midnight glow\nFeel the sub-bass rumble as the rhythm flows\nJanu's frequency breaking through the sound\nWe wear the sovereign crown!\n\n[VERSE 1]\nNeon reflections across the floor\nPushing every limit, always wanting more\nKey of ${selectedGenre.key} at ${bpm} BPM pace\nWe take our rightful place!`);
      setActiveTab('lyrics');
      showToast('Song lyrics generated!');
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  const handlePublish = () => {
    if (onPublishMusicVideo) {
      onPublishMusicVideo({
        title: trackTitle,
        artist: 'You (Janu Master Producer)',
        genre: selectedGenre.name,
        storyboard: storyboard || `Mastered ${selectedGenre.name} at ${bpm} BPM in ${selectedGenre.key}.`
      });
    }
    triggerNeonExplosion({
      particleCount: 75,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'grand'
    });
    showToast('Saved to your Sovereign Sound & Video Vault!');
  };

  const handlePublishLive = () => {
    if (onPublishToLiveFeed) {
      onPublishToLiveFeed({
        title: trackTitle,
        artist: 'You (Janu Master Producer)',
        genre: selectedGenre.name,
        desc: `${selectedGenre.name} • ${bpm} BPM (${selectedGenre.key}). Live audio stem & video synthesized in Janu's Music Studio!`
      });
    }
    triggerNeonExplosion({
      particleCount: 85,
      origin: { x: 0.5, y: 0.4 },
      intensity: 'grand'
    });
    showToast('Broadcasted live to Janu Feed!');
  };

  const handleExportToReel = () => {
    if (onNavigateToReelStudio) {
      onNavigateToReelStudio({
        title: trackTitle,
        genre: selectedGenre.name,
        bpm: bpm,
        storyboard: storyboard || undefined
      });
    }
    triggerNeonExplosion({
      particleCount: 60,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'medium'
    });
    showToast(`Master track exported to Reel Studio!`);
  };

  const handleDownloadProjectPackage = () => {
    const projectData = {
      project: "Janu's Creations - AI Music Video Project",
      timestamp: new Date().toISOString(),
      track: {
        title: trackTitle,
        concept: trackConcept,
        genre: selectedGenre.name,
        key: selectedGenre.key,
        bpm: bpm,
        stems: {
          vocals: `${vocalLevel}%`,
          subBass: `${bassLevel}%`,
          drums: `${drumLevel}%`,
          synths: `${synthLevel}%`,
          master: `${masterVolume}%`
        }
      },
      visuals: {
        shader: selectedShader.name,
        cameraAngle: selectedCameraAngle.name,
        aspectRatio: videoAspectRatio
      },
      lyrics: lyrics || 'No custom lyrics generated yet.',
      storyboard: storyboard || 'No storyboard generated yet.'
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trackTitle.replace(/\s+/g, '_').toLowerCase()}_master_project.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Project Manifest & Stems downloaded!');
  };

  const handleDownloadLyricsAndScript = () => {
    const content = `========================================================
JANU'S CREATIONS • AI MUSIC VIDEO SCRIPT & LYRICS
========================================================
Title: ${trackTitle}
Genre: ${selectedGenre.name} | Key: ${selectedGenre.key} | BPM: ${bpm}
Concept: ${trackConcept}
Shader Mode: ${selectedShader.name} | Camera: ${selectedCameraAngle.name}
Generated: ${new Date().toLocaleString()}

--------------------------------------------------------
LYRICS & VOCAL ARRANGEMENT
--------------------------------------------------------
${lyrics || 'No lyrics generated yet. Use the "Generate AI Lyrics" button.'}

--------------------------------------------------------
DIRECTOR'S STORYBOARD BLUEPRINT
--------------------------------------------------------
${storyboard || 'No storyboard generated yet. Use the "Generate Music Video Blueprint" button.'}

========================================================
© ${new Date().getFullYear()} Janu's Creations. All Rights Reserved.
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trackTitle.replace(/\s+/g, '_').toLowerCase()}_lyrics_script.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Script & Lyrics downloaded as text file!');
  };

  const handleLoadTrackFromBrowser = (track: MusicTrackItem) => {
    const matchedGenre = MUSIC_GENRES.find(g => g.id === track.engineGenreId) || MUSIC_GENRES[0];
    setSelectedGenre(matchedGenre);
    setBpm(track.bpm);
    setTrackTitle(track.title);
    setTrackConcept(track.vibe);
    musicAudioEngine.setGenre(matchedGenre);
    musicAudioEngine.setBpm(track.bpm);
    setStudioViewMode('synthesizer');
    triggerNeonExplosion({
      particleCount: 60,
      origin: { x: 0.5, y: 0.4 },
      intensity: 'grand'
    });
    showToast(`Loaded track: "${track.title}"`);
  };

  const handleBroadcastFromBrowser = (track: MusicTrackItem) => {
    if (onPublishToLiveFeed) {
      onPublishToLiveFeed({
        title: track.title,
        artist: track.artist,
        genre: track.genre,
        desc: `${track.genre} • ${track.bpm} BPM (${track.key}). ${track.vibe}`
      });
    }
    showToast(`Broadcasted "${track.title}" to Live Feed!`);
  };

  const filteredGenres = selectedCategory === 'All Genres'
    ? MUSIC_GENRES
    : MUSIC_GENRES.filter(g => g.category === selectedCategory);

  return (
    <div className="glass rounded-[2.5rem] border border-white/10 p-6 md:p-8 bg-black/70 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#00F5D4]/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#C084FC]/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl bg-black/90 border border-[#00F5D4] text-[#00F5D4] font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_25px_rgba(0,245,212,0.4)] flex items-center gap-2 animate-bounce">
          <i className="fa-solid fa-circle-check"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F5D4] shadow-[0_0_10px_#00F5D4] animate-pulse"></span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#00F5D4]">
              Janu’s AI Music Video Studio
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-mono text-gray-300 font-bold">
              Web Audio Synthesizer & Video Stage
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black italic text-white">
            AI Music Video Creation Studio
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Audition / Hear It Button */}
          <button
            onClick={handleTogglePlayAudio}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              isPlayingAudio 
                ? 'bg-[#FF007F] text-white shadow-[0_0_20px_#FF007F] animate-pulse' 
                : 'bg-[#00F5D4] text-black shadow-[0_0_20px_rgba(0,245,212,0.4)] hover:scale-105'
            }`}
          >
            <i className={`fa-solid ${isPlayingAudio ? 'fa-pause' : 'fa-play'}`}></i>
            <span>{isPlayingAudio ? 'Pause Song' : 'Hear How It Sounds'}</span>
          </button>

          {/* Export to Reel Studio */}
          <button
            onClick={handleExportToReel}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00F5D4] via-[#818CF8] to-[#C084FC] text-black font-mono text-xs font-black uppercase tracking-wider hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,245,212,0.3)] flex items-center gap-2 cursor-pointer"
            title="Export master track to Reel Video Studio"
          >
            <i className="fa-solid fa-film"></i>
            <span>Reel Studio</span>
          </button>

          {/* Publish to Live Feed Button */}
          <button 
            onClick={handlePublishLive}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF007F] to-[#C084FC] text-white font-mono text-xs font-black uppercase tracking-wider hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,0,127,0.4)] flex items-center gap-2 cursor-pointer"
            title="Broadcast song to Janu Live Feed"
          >
            <i className="fa-solid fa-tower-broadcast animate-pulse"></i>
            <span>Live Feed</span>
          </button>

          {/* Publish to Sound Vault */}
          <button 
            onClick={handlePublish}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-cloud-arrow-up text-[#00F5D4]"></i>
            <span>Save Vault</span>
          </button>
        </div>
      </div>

      {/* Main Studio Mode Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10">
          <button
            onClick={() => setStudioViewMode('synthesizer')}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              studioViewMode === 'synthesizer'
                ? 'bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F] text-black shadow-[0_0_20px_rgba(0,245,212,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <i className="fa-solid fa-sliders"></i>
            <span>Studio Production Suite</span>
          </button>

          <button
            onClick={() => setStudioViewMode('browser')}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              studioViewMode === 'browser'
                ? 'bg-white text-black font-black shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <i className="fa-solid fa-compact-disc"></i>
            <span>30+ Genre Music Browser</span>
          </button>
        </div>

        {/* Quick Download Utilities */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadProjectPackage}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download Master JSON Project Manifest"
          >
            <i className="fa-solid fa-file-code text-[#00F5D4]"></i>
            <span>Download Project JSON</span>
          </button>

          <button
            onClick={handleDownloadLyricsAndScript}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download Lyrics & Storyboard Text File"
          >
            <i className="fa-solid fa-file-lines text-[#C084FC]"></i>
            <span>Download Script TXT</span>
          </button>
        </div>
      </div>

      {studioViewMode === 'browser' ? (
        <CategorizedMusicBrowser
          onSelectTrack={handleLoadTrackFromBrowser}
          onBroadcastTrack={handleBroadcastFromBrowser}
        />
      ) : (
        <>
          {/* Sub-Tabs: Stage, Lyria AI Music, Voiceover, Mixer, Lyrics, Storyboard, Instruments */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-white/5 no-scrollbar">
            <button
              onClick={() => setActiveTab('stage')}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'stage'
                  ? 'bg-[#00F5D4] text-black font-black shadow-[0_0_15px_rgba(0,245,212,0.4)]'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-film"></i>
              <span>Live Video Stage</span>
            </button>

            <button
              onClick={() => setActiveTab('lyria')}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'lyria'
                  ? 'bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F] text-black font-black shadow-[0_0_18px_rgba(0,245,212,0.5)]'
                  : 'bg-white/5 text-[#00F5D4] hover:text-white hover:bg-white/10'
              }`}
            >
              <i className="fa-solid fa-music text-inherit animate-pulse"></i>
              <span>Lyria 3 AI Music</span>
              <span className="px-1.5 py-0.2 rounded bg-black/40 text-[9px] text-white font-bold ml-0.5">PRO</span>
            </button>

            <button
              onClick={() => setActiveTab('voiceover')}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'voiceover'
                  ? 'bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F] text-black font-black shadow-[0_0_18px_rgba(0,245,212,0.5)]'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-microphone-lines text-inherit"></i>
              <span>AI Voiceover & Vocals</span>
              <span className="px-1.5 py-0.2 rounded bg-black/40 text-[9px] text-white font-bold ml-0.5">NEW</span>
            </button>

            <button
              onClick={() => setActiveTab('mixer')}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'mixer'
                  ? 'bg-[#C084FC] text-black font-black shadow-[0_0_15px_rgba(192,132,252,0.4)]'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-sliders"></i>
              <span>Multi-Track Stem Equalizer</span>
            </button>

            <button
              onClick={() => setActiveTab('lyrics')}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'lyrics'
                  ? 'bg-[#FF007F] text-white font-black shadow-[0_0_15px_rgba(255,0,127,0.4)]'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-pen-nib"></i>
              <span>AI Lyrics & Catchy Hooks</span>
            </button>

            <button
              onClick={() => setActiveTab('storyboard')}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'storyboard'
                  ? 'bg-[#818CF8] text-white font-black shadow-[0_0_15px_rgba(129,140,248,0.4)]'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-clapperboard"></i>
              <span>Gemini AI Director Storyboard</span>
            </button>

            <button
              onClick={() => setActiveTab('instruments')}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'instruments'
                  ? 'bg-[#FCD34D] text-black font-black shadow-[0_0_15px_rgba(252,211,77,0.4)]'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-drum"></i>
              <span>Solo Instrument Audition Pads</span>
            </button>
          </div>

          {activeTab === 'lyria' ? (
            <div className="space-y-6">
              <LyriaMusicGenerator 
                onSongSaved={() => {
                  showToast('Lyria 3 track saved to library!');
                }}
              />
            </div>
          ) : activeTab === 'voiceover' ? (
            <div className="space-y-6">
              <AIVoiceoverStudio 
                onInjectVocalToTrack={(vocalData) => {
                  setTrackConcept(prev => `${prev} | AI Lead Vocal (${vocalData.profile} / ${vocalData.resonance}): "${vocalData.text}"`);
                  setVocalLevel(95);
                  setActiveTab('stage');
                  showToast(`Injected "${vocalData.profile}" vocal track into Music Engine!`);
                }}
                onNavigateToReelStudio={onNavigateToReelStudio}
                onPublishToLiveFeed={onPublishToLiveFeed}
              />
            </div>
          ) : (
            <>
              {/* Genre Selection Chips */}
              <div className="mb-6">
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                  <i className="fa-solid fa-layer-group text-[#C084FC]"></i>
                  <span>Select Music Genre & Harmonic Architecture</span>
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-white text-black font-black shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Production Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (7 Cols): Dynamic Video Stage & Synthesizer Controls */}
            <div className="lg:col-span-7 flex flex-col space-y-6">
              
              {/* Dynamic Video Stage */}
              <div 
                className={`relative w-full rounded-[2rem] overflow-hidden border-2 border-white/20 bg-zinc-950 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center p-6 transition-all ${
                  videoAspectRatio === '9:16' ? 'aspect-[9/16] max-h-[580px] mx-auto max-w-[340px]' : 'aspect-video'
                }`}
                style={{
                  boxShadow: `0 0 40px ${selectedShader.glow}`
                }}
              >
                {/* Background Shader & Pulsating Atmosphere */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black ${selectedShader.filter}`}
                ></div>

                {/* Strobe Effect Layer */}
                {strobeFX && isPlayingAudio && (
                  <div className="absolute inset-0 bg-white/15 animate-ping pointer-events-none"></div>
                )}
                
                {/* Animated Pulsating Neon Frequency Rings */}
                <div 
                  className="absolute w-64 h-64 rounded-full border border-[#00F5D4]/30 pointer-events-none"
                  style={{ 
                    animation: isPlayingAudio ? 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none'
                  }}
                ></div>
                
                <div 
                  className="absolute w-96 h-96 rounded-full border border-[#C084FC]/30 pointer-events-none"
                  style={{ 
                    animation: isPlayingAudio ? 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                  }}
                ></div>

                {/* Top Overlay Controls on Video Stage */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[9px] font-mono text-white">
                    <i className={`fa-solid ${selectedGenre.icon}`} style={{ color: selectedGenre.color }}></i>
                    <span>{selectedGenre.name} &bull; {bpm} BPM</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Aspect Ratio Toggle */}
                    <button
                      onClick={() => setVideoAspectRatio(prev => prev === '16:9' ? '9:16' : '16:9')}
                      className="px-2.5 py-1 rounded-full bg-black/70 hover:bg-black border border-white/10 text-[9px] font-mono text-gray-300 hover:text-white transition-all cursor-pointer"
                      title="Toggle 16:9 Widescreen vs 9:16 Vertical Reel"
                    >
                      <i className="fa-solid fa-mobile-screen mr-1 text-[#00F5D4]"></i>
                      <span>{videoAspectRatio}</span>
                    </button>

                    {/* Strobe Toggle */}
                    <button
                      onClick={() => setStrobeFX(prev => !prev)}
                      className={`px-2.5 py-1 rounded-full border text-[9px] font-mono transition-all cursor-pointer ${
                        strobeFX ? 'bg-[#FF007F]/30 border-[#FF007F] text-[#FF007F]' : 'bg-black/70 border-white/10 text-gray-400'
                      }`}
                      title="Toggle Strobe Party Lights"
                    >
                      <i className="fa-solid fa-bolt mr-1"></i>
                      <span>Strobe</span>
                    </button>
                  </div>
                </div>

                {/* Center Track Information & Dynamic Visualizer Waveform */}
                <div className="relative z-10 text-center max-w-md w-full px-4">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-[9px] font-mono font-bold uppercase tracking-widest text-[#00F5D4] border border-[#00F5D4]/30 mb-3 inline-block">
                    {scenes[currentSceneIndex].title}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white mb-1 truncate">
                    {trackTitle}
                  </h3>
                  <p className="text-xs font-mono text-[#C084FC] mb-1 font-bold">
                    {selectedGenre.name} &bull; Key of {selectedGenre.key} &bull; {bpm} BPM
                  </p>
                  
                  {/* Scene Description / Lyric Subtitle */}
                  {showLyricsOverlay && (
                    <div className="my-3 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
                      <p className="text-[11px] font-serif italic text-[#00F5D4] animate-pulse">
                        "{scenes[currentSceneIndex].lyricCue}"
                      </p>
                    </div>
                  )}

                  {/* Dynamic Waveform Bars Connected to Live Synthesizer Output */}
                  <div className="flex items-end justify-center gap-1.5 h-16 sm:h-20 mb-3">
                    {audioFreqData.map((height, i) => (
                      <div
                        key={i}
                        className={`w-2 rounded-full transition-all duration-75 ${
                          i % 4 === 0 
                            ? 'bg-gradient-to-t from-[#00F5D4] to-[#818CF8]' 
                            : i % 4 === 1 
                            ? 'bg-gradient-to-t from-[#C084FC] to-[#FF007F]'
                            : 'bg-gradient-to-t from-[#818CF8] to-[#00F5D4]'
                        }`}
                        style={{
                          height: `${height}px`,
                          opacity: isPlayingAudio ? 1 : 0.4
                        }}
                      ></div>
                    ))}
                  </div>

                  {/* 16-Step Beat Grid Progress Indicator */}
                  <div className="flex items-center justify-center gap-1">
                    {[...Array(16)].map((_, stepIdx) => (
                      <div
                        key={stepIdx}
                        className={`h-1.5 rounded-full transition-all ${
                          stepIdx === currentStep && isPlayingAudio
                            ? 'w-4 bg-[#00F5D4] shadow-[0_0_8px_#00F5D4]'
                            : stepIdx % 4 === 0
                            ? 'w-2 bg-white/40'
                            : 'w-1.5 bg-white/15'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Bottom Bar on Stage: Visual Shader & Camera Mode Selectors */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20 flex-wrap gap-2">
                  <div className="flex items-center gap-1 overflow-x-auto max-w-[260px] no-scrollbar">
                    {VIDEO_SHADERS.map(shader => (
                      <button
                        key={shader.id}
                        onClick={() => setSelectedShader(shader)}
                        className={`px-2 py-0.5 rounded-md text-[8px] font-mono font-bold uppercase transition-all cursor-pointer ${
                          selectedShader.id === shader.id
                            ? 'bg-white text-black font-black'
                            : 'bg-black/60 text-gray-400 hover:text-white border border-white/5'
                        }`}
                      >
                        {shader.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleTogglePlayAudio}
                    className="px-3.5 py-1.5 rounded-full bg-[#00F5D4] hover:bg-[#00F5D4]/80 text-black font-mono text-[9px] font-black uppercase cursor-pointer flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,245,212,0.4)]"
                  >
                    <i className={`fa-solid ${isPlayingAudio ? 'fa-pause' : 'fa-play'}`}></i>
                    <span>{isPlayingAudio ? 'Mute' : 'Play Live'}</span>
                  </button>
                </div>
              </div>

              {/* Sub-Tab Content Area */}
              {activeTab === 'stage' && (
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <i className="fa-solid fa-video text-[#00F5D4]"></i>
                      <span>Cinematic Video Stage Settings</span>
                    </h4>
                    <span className="text-[10px] font-mono text-gray-400">
                      Camera: {selectedCameraAngle.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CAMERA_ANGLES.map(angle => (
                      <button
                        key={angle.id}
                        onClick={() => setSelectedCameraAngle(angle)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-mono transition-all cursor-pointer flex items-center gap-2 ${
                          selectedCameraAngle.id === angle.id
                            ? 'bg-[#00F5D4]/10 border-[#00F5D4] text-[#00F5D4]'
                            : 'bg-black/40 border-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        <i className={`fa-solid ${angle.icon}`}></i>
                        <span className="truncate text-[10px]">{angle.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'instruments' && (
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <i className="fa-solid fa-volume-high text-[#FCD34D]"></i>
                      <span>Solo Instrument Audition Pads</span>
                    </h4>
                    <span className="text-[10px] font-mono text-[#FCD34D]">Instant Web Audio Trigger</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    <button
                      onClick={() => handleAuditionSound('kick')}
                      className="p-3 rounded-xl bg-black/60 hover:bg-[#00F5D4]/20 border border-white/10 hover:border-[#00F5D4] text-xs font-mono text-gray-200 hover:text-[#00F5D4] text-center transition-all cursor-pointer"
                    >
                      <span className="text-lg block mb-1">🥁</span>
                      <span className="text-[10px] font-bold block">Kick</span>
                    </button>
                    <button
                      onClick={() => handleAuditionSound('snare')}
                      className="p-3 rounded-xl bg-black/60 hover:bg-[#C084FC]/20 border border-white/10 hover:border-[#C084FC] text-xs font-mono text-gray-200 hover:text-[#C084FC] text-center transition-all cursor-pointer"
                    >
                      <span className="text-lg block mb-1">💥</span>
                      <span className="text-[10px] font-bold block">Snare</span>
                    </button>
                    <button
                      onClick={() => handleAuditionSound('hihat')}
                      className="p-3 rounded-xl bg-black/60 hover:bg-[#FF007F]/20 border border-white/10 hover:border-[#FF007F] text-xs font-mono text-gray-200 hover:text-[#FF007F] text-center transition-all cursor-pointer"
                    >
                      <span className="text-lg block mb-1">⚡</span>
                      <span className="text-[10px] font-bold block">Hi-Hat</span>
                    </button>
                    <button
                      onClick={() => handleAuditionSound('bass')}
                      className="p-3 rounded-xl bg-black/60 hover:bg-[#818CF8]/20 border border-white/10 hover:border-[#818CF8] text-xs font-mono text-gray-200 hover:text-[#818CF8] text-center transition-all cursor-pointer"
                    >
                      <span className="text-lg block mb-1">🔊</span>
                      <span className="text-[10px] font-bold block">808 Bass</span>
                    </button>
                    <button
                      onClick={() => handleAuditionSound('chord')}
                      className="p-3 rounded-xl bg-black/60 hover:bg-[#FCD34D]/20 border border-white/10 hover:border-[#FCD34D] text-xs font-mono text-gray-200 hover:text-[#FCD34D] text-center transition-all cursor-pointer"
                    >
                      <span className="text-lg block mb-1">🎹</span>
                      <span className="text-[10px] font-bold block">Chords</span>
                    </button>
                    <button
                      onClick={() => handleAuditionSound('melody')}
                      className="p-3 rounded-xl bg-black/60 hover:bg-[#38BDF8]/20 border border-white/10 hover:border-[#38BDF8] text-xs font-mono text-gray-200 hover:text-[#38BDF8] text-center transition-all cursor-pointer"
                    >
                      <span className="text-lg block mb-1">✨</span>
                      <span className="text-[10px] font-bold block">Lead Synth</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Stem Equalizer Controls */}
              <div className="w-full p-6 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-white/5">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Multi-Track Stem Equalizer</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/20 border border-[#00F5D4]/40 text-[#00F5D4] text-[9px] font-mono font-bold">
                        LIVE ENGINE
                      </span>
                    </h4>
                    <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                      Real-time audio frequency mixing and tempo control.
                    </p>
                  </div>

                  {/* Tempo BPM Adjuster */}
                  <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10">
                    <span className="text-[10px] font-mono text-gray-400 pl-2">BPM:</span>
                    <button
                      onClick={() => handleBpmChange(Math.max(60, bpm - 4))}
                      className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-black text-[#00F5D4] w-8 text-center">{bpm}</span>
                    <button
                      onClick={() => handleBpmChange(Math.min(190, bpm + 4))}
                      className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Vocals / Lead */}
                  <div className="bg-black/50 p-3.5 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] font-mono text-gray-400 block mb-1">Lead & Vocals</span>
                    <span className="text-xs font-mono font-bold text-[#00F5D4] block mb-2">{vocalLevel}%</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={vocalLevel} 
                      onChange={(e) => handleStemChange('vocal', Number(e.target.value))}
                      className="w-full accent-[#00F5D4] cursor-pointer"
                    />
                  </div>

                  {/* 808 Bass */}
                  <div className="bg-black/50 p-3.5 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] font-mono text-gray-400 block mb-1">808 Sub-Bass</span>
                    <span className="text-xs font-mono font-bold text-[#C084FC] block mb-2">{bassLevel}%</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={bassLevel} 
                      onChange={(e) => handleStemChange('bass', Number(e.target.value))}
                      className="w-full accent-[#C084FC] cursor-pointer"
                    />
                  </div>

                  {/* Drums */}
                  <div className="bg-black/50 p-3.5 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] font-mono text-gray-400 block mb-1">Drums & Snares</span>
                    <span className="text-xs font-mono font-bold text-[#818CF8] block mb-2">{drumLevel}%</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={drumLevel} 
                      onChange={(e) => handleStemChange('drum', Number(e.target.value))}
                      className="w-full accent-[#818CF8] cursor-pointer"
                    />
                  </div>

                  {/* Synths */}
                  <div className="bg-black/50 p-3.5 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] font-mono text-gray-400 block mb-1">Synths & Chords</span>
                    <span className="text-xs font-mono font-bold text-[#D8B4FE] block mb-2">{synthLevel}%</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={synthLevel} 
                      onChange={(e) => handleStemChange('synth', Number(e.target.value))}
                      className="w-full accent-[#D8B4FE] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (5 Cols): Genre Selector, AI Director & Lyrics Generator */}
            <div className="lg:col-span-5 bg-white/[0.03] p-6 rounded-3xl border border-white/10 space-y-6">
              
              {/* Genre Selection Cards */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                    Choose Sound Palette ({filteredGenres.length})
                  </p>
                  <span className="text-[9px] font-mono text-[#00F5D4]">
                    Click to Audition
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredGenres.map(genre => {
                    const isSelected = selectedGenre.id === genre.id;
                    return (
                      <button
                        key={genre.id}
                        onClick={() => handleSelectGenre(genre)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 group relative ${
                          isSelected 
                            ? 'border-[#00F5D4] bg-[#00F5D4]/10 shadow-[0_0_20px_rgba(0,245,212,0.25)]' 
                            : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div 
                          className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" 
                          style={{ color: genre.color }}
                        >
                          <i className={`fa-solid ${genre.icon} text-base`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-mono font-bold text-white truncate">{genre.name}</h5>
                            {isSelected && isPlayingAudio && (
                              <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-ping"></span>
                            )}
                          </div>
                          <p className="text-[9px] font-mono text-[#C084FC] mt-0.5 font-bold">
                            {genre.bpm} BPM &bull; {genre.key}
                          </p>
                          <p className="text-[8px] font-mono text-gray-400 line-clamp-1 mt-0.5">
                            {genre.vibe}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Track Details Input & AI Director Studio */}
              <div className="space-y-3 p-4 rounded-2xl bg-black/40 border border-white/10">
                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Track Title</label>
                  <input 
                    type="text" 
                    value={trackTitle}
                    onChange={(e) => setTrackTitle(e.target.value)}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:border-[#00F5D4] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Song Storyboard / Concept Prompt</label>
                  <textarea 
                    value={trackConcept}
                    onChange={(e) => setTrackConcept(e.target.value)}
                    rows={2}
                    placeholder="Describe visuals, lyrics, mood, choir drops..."
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:border-[#00F5D4] outline-none"
                  />
                </div>

                {/* Action Buttons: Generate Blueprint & Generate Lyrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button 
                    onClick={handleGenerateFullMusicVideo}
                    disabled={isGenerating}
                    className="py-3 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#818CF8] text-black font-mono text-xs font-black uppercase tracking-wider hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(0,245,212,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Composing AI Storyboard...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                        <span>AI Video Blueprint</span>
                      </>
                    )}
                  </button>

                  <button 
                    onClick={handleGenerateLyrics}
                    disabled={isGeneratingLyrics}
                    className="py-3 rounded-xl bg-gradient-to-r from-[#FF007F] to-[#C084FC] text-white font-mono text-xs font-black uppercase tracking-wider hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(255,0,127,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingLyrics ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Writing Lyrics...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-microphone-lines"></i>
                        <span>AI Lyrics & Hooks</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Generated Storyboard View */}
              {storyboard && (
                <div className="p-4 rounded-2xl bg-black/80 border border-[#00F5D4]/40 max-h-[220px] overflow-y-auto custom-scrollbar space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#00F5D4] uppercase">
                    <span>🎬 Gemini AI Storyboard Blueprint</span>
                    <span>{selectedGenre.name}</span>
                  </div>
                  <div className="text-[11px] font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {storyboard}
                  </div>
                </div>
              )}

              {/* Generated Lyrics View */}
              {lyrics && (
                <div className="p-4 rounded-2xl bg-black/80 border border-[#FF007F]/40 max-h-[220px] overflow-y-auto custom-scrollbar space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#FF007F] uppercase">
                    <span>🎙️ AI Lyrics & Catchy Hook</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(lyrics);
                        showToast('Lyrics copied to clipboard!');
                      }}
                      className="text-[9px] text-[#FF007F] hover:underline"
                    >
                      <i className="fa-solid fa-copy mr-1"></i> Copy
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {lyrics}
                  </div>
                </div>
              )}

            </div>

          </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MusicVideoCreator;
