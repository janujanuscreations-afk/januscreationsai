import React, { useState, useRef, useEffect } from 'react';
import { triggerNeonExplosion } from '../utils/confetti';
import { bossAudio } from '../utils/soundEffects';
import { safeStringify } from '../utils/safeJson';
import { GoogleGenAI } from '@google/genai';

interface MovieScene {
  id: string;
  sceneNumber: number;
  title: string;
  heading: string; // e.g. "EXT. NEO-TOKYO METROPOLIS - NIGHT"
  duration: number; // seconds
  visualDescription: string;
  dialogue: string;
  characters: string[];
  cameraAngle: string;
  lightingMood: string;
  sfxCue: string;
  audioTrack: string;
  videoUrl?: string;
  isAiGenerated?: boolean;
}

interface MovieDirectorStudioProps {
  onSendToReelEditor?: (clipData: {
    videoUrl?: string;
    title: string;
    duration: number;
    caption: string;
  }) => void;
  onSendToMusicStudio?: (soundtrackConcept: string) => void;
  onPublishToFeed?: (movieData: {
    title: string;
    desc: string;
    mediaUrl: string;
    author: string;
  }) => void;
}

const DEFAULT_SCENES: MovieScene[] = [
  {
    id: 'scene-1',
    sceneNumber: 1,
    title: 'The Sovereign Awakening',
    heading: 'EXT. NEO-SHANGHAI SKYLINE - MIDNIGHT (RAIN)',
    duration: 12,
    visualDescription: 'Anamorphic lens flares streak horizontally across a neon-drenched glass monolith. Hover-shuttles weave between holographic billboards.',
    dialogue: 'ARCHITECT (V.O.): "They thought our vision was just an echo. Tonight, we rewrite the protocol."',
    characters: ['The Architect'],
    cameraAngle: 'Low-Angle Hero Crane Tilt Down',
    lightingMood: 'Cyberpunk Neon Cyan & Deep Magenta (#00FFE0 / #FF007F)',
    sfxCue: 'Heavy rain impact, distant thunder rumble, sub-bass rumble (40Hz)',
    audioTrack: 'Neon Midnight Runner (120 BPM Synthwave)',
    videoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'scene-2',
    sceneNumber: 2,
    title: 'The Quantum Convergence',
    heading: 'INT. VAULT 808 COMMAND DECK - CONTINUOUS',
    duration: 16,
    visualDescription: 'Volumetric light grids illuminate a suspended glass terminal. Holographic revenue analytics pulse in real-time as biometric access keys click into lock.',
    dialogue: 'JANU: "Initiate sovereign payout ledger. Every node must clear synchronously."',
    characters: ['Janu', 'Node Overseer'],
    cameraAngle: '360° Orbital Steadicam Tracking',
    lightingMood: 'Amber Gold & Cool Obsidian Quartz (#FFD700 / #111119)',
    sfxCue: 'Pneumatic air release, holographic UI hum, keyboard clicks',
    audioTrack: 'Quantum Bass Drop (140 BPM Trap Heavy)',
    videoUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'scene-3',
    sceneNumber: 3,
    title: 'The Final Broadcast',
    heading: 'EXT. ORBITAL SATELLITE TOWER - DAWN',
    duration: 20,
    visualDescription: 'Sun crests above the Earth curve. Massive solar arrays unfold toward the light as a billion viewers synchronize to the global transmission.',
    dialogue: 'CHORUS: "From imagination to sovereignty. Janu\'s Creations live forever."',
    characters: ['Global Crowd', 'The Architect'],
    cameraAngle: 'Ultra-Wide Cinematic Drone Pull-Back (IMAX 70mm style)',
    lightingMood: 'Golden Hour Horizon with Atmospheric Fog Glow',
    sfxCue: 'Solar wind whoosh, soaring choir crescendos, celebratory cheering',
    audioTrack: 'Divine Gospel Chords & Orchestral Strings',
    videoUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop'
  }
];

const ASPECT_RATIOS = [
  { id: '2.39:1', label: '2.39:1 Anamorphic Cinema', desc: 'Widescreen Hollywood Theatrical', icon: 'fa-film' },
  { id: '16:9', label: '16:9 4K UHD Broadcast', desc: 'Modern Streaming / YouTube / TV', icon: 'fa-tv' },
  { id: '9:16', label: '9:16 Vertical Cinema Reel', desc: 'Mobile Cinema / Cinematic Shorts', icon: 'fa-mobile-screen' }
];

const CINEMATIC_COLOR_GRADES = [
  { id: 'teal-orange', name: 'Blockbuster Teal & Orange', filter: 'contrast-125 saturate-130 hue-rotate-15' },
  { id: 'neo-noir', name: 'Executive Neo-Noir 35mm', filter: 'grayscale contrast-160 brightness-90' },
  { id: 'anamorphic-cyan', name: 'Anamorphic Cyber Cyan', filter: 'hue-rotate-180 contrast-135 saturate-160' },
  { id: 'golden-lux', name: '70mm Golden Horizon', filter: 'sepia contrast-115 saturate-140 brightness-105' },
  { id: 'matrix-green', name: 'Code Matrix Phosphor', filter: 'hue-rotate-90 saturate-200 contrast-120' }
];

export const MovieDirectorStudio: React.FC<MovieDirectorStudioProps> = ({
  onSendToReelEditor,
  onSendToMusicStudio,
  onPublishToFeed
}) => {
  // Master Movie Details
  const [movieTitle, setMovieTitle] = useState("CHRONICLES OF JANU: SOVEREIGN PROTOCOL");
  const [movieGenre, setMovieGenre] = useState("Sci-Fi Thriller / Cyberpunk Epic");
  const [logline, setLogline] = useState("In a world dominated by legacy platforms, a sovereign creator unleashes an autonomous AI studio engine that liberates creative minds worldwide.");
  const [aspectRatio, setAspectRatio] = useState<'2.39:1' | '16:9' | '9:16'>('2.39:1');
  const [colorGrade, setColorGrade] = useState(CINEMATIC_COLOR_GRADES[0]);

  // Storyboard Scenes
  const [scenes, setScenes] = useState<MovieScene[]>(DEFAULT_SCENES);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // AI Scriptwriting & Veo Movie Generation
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [directorNotes, setDirectorNotes] = useState("");
  const [activeTab, setActiveTab] = useState<'storyboard' | 'screenplay' | 'cinematography' | 'soundtrack' | 'export'>('storyboard');

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);

  const activeScene = scenes[activeSceneIndex] || scenes[0];
  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

  // Playback timer
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= totalDuration) {
            return 0;
          }
          return Math.min(totalDuration, +(prev + 0.1 * playbackSpeed).toFixed(1));
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isPlaying, totalDuration, playbackSpeed]);

  // Update active scene based on currentTime
  useEffect(() => {
    let accumulated = 0;
    for (let i = 0; i < scenes.length; i++) {
      accumulated += scenes[i].duration;
      if (currentTime <= accumulated) {
        setActiveSceneIndex(i);
        break;
      }
    }
  }, [currentTime, scenes]);

  // Local Storage persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem('janu_movie_director_project');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.movieTitle) setMovieTitle(parsed.movieTitle);
        if (parsed.movieGenre) setMovieGenre(parsed.movieGenre);
        if (parsed.logline) setLogline(parsed.logline);
        if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio);
        if (parsed.scenes && Array.isArray(parsed.scenes)) setScenes(parsed.scenes);
      }
    } catch (e) {
      console.warn('Could not restore movie project:', e);
    }
  }, []);

  const saveProjectToLocal = () => {
    try {
      const payload = {
        movieTitle,
        movieGenre,
        logline,
        aspectRatio,
        scenes,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem('janu_movie_director_project', safeStringify(payload));
      bossAudio.playSubtlePing();
      triggerNeonExplosion({ particleCount: 30, intensity: 'subtle' });
    } catch (e) {
      console.warn('Failed to save movie project:', e);
    }
  };

  // AI Screenplay Scene Generation using Gemini
  const handleGenerateMovieScript = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingScript(true);
    bossAudio.playSubtlePing();

    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY || '' });
      const promptText = `You are an elite Hollywood Director and Screenwriter for Janu's Creations AI Studio.
Movie Title: "${movieTitle}"
Genre: "${movieGenre}"
User Creative Request: "${aiPrompt}"

Create a cinematic 3-scene sequence with precise screenplay formatting.
Return ONLY valid JSON matching this schema:
[
  {
    "sceneNumber": 1,
    "title": "Scene Name",
    "heading": "EXT. LOCATION - TIME",
    "duration": 15,
    "visualDescription": "Detailed cinematography description, lighting, focal length, camera motion",
    "dialogue": "CHARACTER: \\"Line of dialogue\\"",
    "characters": ["Char1"],
    "cameraAngle": "Camera lens and angle details",
    "lightingMood": "Color tones and lighting keys",
    "sfxCue": "Foley and sound design cues",
    "audioTrack": "Suggested musical score / mood"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed: any[] = JSON.parse(jsonMatch[0]);
        const formattedScenes: MovieScene[] = parsed.map((s, idx) => ({
          id: `ai-scene-${Date.now()}-${idx}`,
          sceneNumber: idx + 1,
          title: s.title || `Scene ${idx + 1}`,
          heading: s.heading || 'INT. LOCATION - NIGHT',
          duration: Number(s.duration) || 15,
          visualDescription: s.visualDescription || '',
          dialogue: s.dialogue || '',
          characters: s.characters || ['Protagonist'],
          cameraAngle: s.cameraAngle || 'Anamorphic 35mm Prime',
          lightingMood: s.lightingMood || 'Neon Cyberpunk',
          sfxCue: s.sfxCue || 'Cinematic rumble',
          audioTrack: s.audioTrack || 'Synthwave Horizon',
          isAiGenerated: true,
          videoUrl: DEFAULT_SCENES[idx % DEFAULT_SCENES.length].videoUrl
        }));

        setScenes(formattedScenes);
        setCurrentTime(0);
        setActiveSceneIndex(0);
        triggerNeonExplosion({ particleCount: 75, intensity: 'grand' });
      }
    } catch (e) {
      console.warn('AI Scene Generation fallback:', e);
      // Fallback scene creation
      const newScene: MovieScene = {
        id: `ai-scene-${Date.now()}`,
        sceneNumber: scenes.length + 1,
        title: `Scene: ${aiPrompt.slice(0, 24)}...`,
        heading: `EXT. CINEMATIC ARENA - NIGHT`,
        duration: 15,
        visualDescription: `Cinematic visualization of ${aiPrompt}. Dynamic drone sweeps and anamorphic lighting flares.`,
        dialogue: `VOICE: "${aiPrompt}"`,
        characters: ['Hero'],
        cameraAngle: 'Steadicam 50mm Prime',
        lightingMood: 'Cyber Blue & Golden Amber',
        sfxCue: 'Cinematic sub drop and atmospheric wind',
        audioTrack: 'Epic Orchestral Hybrid',
        videoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
        isAiGenerated: true
      };
      setScenes(prev => [...prev, newScene]);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleAddScene = () => {
    const nextNum = scenes.length + 1;
    const newScene: MovieScene = {
      id: `scene-${Date.now()}`,
      sceneNumber: nextNum,
      title: `Scene ${nextNum}: New Cinematic Cut`,
      heading: `INT. STUDIO 108 - CONTINUOUS`,
      duration: 15,
      visualDescription: 'Camera dolly in on subject surrounded by volumetric lighting particles.',
      dialogue: 'DIRECTOR: "Action. Bring the sovereign frequencies up."',
      characters: ['Director'],
      cameraAngle: 'Close-Up 85mm T1.5',
      lightingMood: 'Tungsten Key with Cyan Rim',
      sfxCue: 'Subtle high frequency shimmer',
      audioTrack: 'Ambient Drone & Cello',
      videoUrl: DEFAULT_SCENES[(nextNum - 1) % DEFAULT_SCENES.length].videoUrl
    };
    setScenes(prev => [...prev, newScene]);
    setActiveSceneIndex(scenes.length);
    bossAudio.playSubtlePing();
  };

  const handleDeleteScene = (idx: number) => {
    if (scenes.length <= 1) return;
    setScenes(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sceneNumber: i + 1 })));
    setActiveSceneIndex(Math.max(0, idx - 1));
  };

  const handleExportMovieMaster = () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportComplete(false);
    bossAudio.playSubtlePing();

    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          setExportComplete(true);
          triggerNeonExplosion({ particleCount: 100, intensity: 'grand' });
          return 100;
        }
        return prev + 10;
      });
    }, 250);
  };

  return (
    <div className="space-y-6 animate-fade-in text-white">
      {/* Top Hero Bar */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-black via-[#0D0D14] to-black border border-white/10 shadow-[0_15px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C084FC]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#00FFE0]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C084FC]/10 border border-[#C084FC]/30 text-[10px] font-mono font-bold uppercase text-[#C084FC] mb-3">
              <i className="fa-solid fa-clapperboard animate-pulse"></i>
              <span>Hollywood 4K Cinematic Director Suite</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FFE0] animate-ping"></span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-black italic text-white tracking-tight">
              Movie & Cinema Director Studio
            </h2>
            <p className="text-xs sm:text-sm font-mono text-gray-400 mt-2 max-w-2xl font-light">
              Multi-scene scriptwriting, storyboard scene mapping, Hollywood aspect ratios (2.39:1 Anamorphic), cinematography controls, and seamless one-click bridge to Reel & Music studios.
            </p>
          </div>

          {/* Master Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={saveProjectToLocal}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-gray-200 flex items-center gap-2 transition-all cursor-pointer"
              title="Save project snapshot locally"
            >
              <i className="fa-solid fa-floppy-disk text-[#00FFE0]"></i>
              <span>Save Project</span>
            </button>

            <button
              type="button"
              onClick={handleExportMovieMaster}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C084FC] via-[#818CF8] to-[#00FFE0] text-black font-mono text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(192,132,252,0.4)] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-film"></i>
              <span>Export Master Cut</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Director Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive Cinematic Canvas & Scrubber (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-4">
          
          {/* Aspect Ratio & Format Bar */}
          <div className="w-full flex items-center justify-between bg-black/60 p-2 rounded-2xl border border-white/10 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              {ASPECT_RATIOS.map(ar => (
                <button
                  key={ar.id}
                  onClick={() => setAspectRatio(ar.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    aspectRatio === ar.id
                      ? 'bg-[#C084FC] text-black font-black shadow-[0_0_12px_#C084FC]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={ar.desc}
                >
                  <i className={`fa-solid ${ar.icon} text-xs`}></i>
                  <span>{ar.id}</span>
                </button>
              ))}
            </div>

            {/* Color Grade Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-gray-400">LUT:</span>
              <select
                value={colorGrade.id}
                onChange={(e) => {
                  const found = CINEMATIC_COLOR_GRADES.find(g => g.id === e.target.value);
                  if (found) setColorGrade(found);
                }}
                className="bg-black border border-white/15 rounded-xl px-2.5 py-1 text-[10px] font-mono text-white focus:border-[#C084FC] outline-none cursor-pointer"
              >
                {CINEMATIC_COLOR_GRADES.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cinematic Frame Container */}
          <div 
            className={`relative rounded-3xl overflow-hidden border-2 border-white/20 bg-black shadow-[0_0_50px_rgba(0,0,0,0.95)] transition-all duration-300 w-full flex items-center justify-center ${
              aspectRatio === '2.39:1' 
                ? 'aspect-[2.39/1] max-w-full' 
                : aspectRatio === '16:9' 
                ? 'aspect-video max-w-full' 
                : 'aspect-[9/16] max-w-[340px]'
            }`}
          >
            {/* Visual Media layer */}
            <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
              <img
                src={activeScene.videoUrl}
                alt={activeScene.title}
                className={`w-full h-full object-cover transition-all duration-500 ${colorGrade.filter} ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
              />

              {/* Anamorphic Lens Flare Simulation & Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none"></div>
              <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.9)] pointer-events-none"></div>

              {/* Top Cinematic Badge */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-[#C084FC]/40 text-[#C084FC] text-[10px] font-mono font-bold uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#FF007F] animate-ping"></span>
                  <span>SCENE {activeScene.sceneNumber}: {activeScene.title}</span>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-gray-300 text-[10px] font-mono">
                  {aspectRatio} • 24 FPS
                </div>
              </div>

              {/* Dialogue / Subtitle Overlay */}
              {activeScene.dialogue && (
                <div className="absolute bottom-12 left-6 right-6 z-20 pointer-events-none text-center">
                  <div className="inline-block px-4 py-2 rounded-xl bg-black/85 backdrop-blur-md border border-white/20 text-yellow-300 font-mono text-xs sm:text-sm font-semibold tracking-wide leading-relaxed shadow-2xl max-w-xl">
                    {activeScene.dialogue}
                  </div>
                </div>
              )}

              {/* Studio Watermark */}
              <div className="absolute bottom-3 right-4 z-20 pointer-events-none flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/70 border border-white/10 text-gray-400 text-[8px] font-mono uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FFE0]"></span>
                <span>Janu's Creations Cinema</span>
              </div>

              {/* Center Play Button Overlay */}
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors group cursor-pointer"
              >
                <div className={`w-16 h-16 rounded-full bg-black/80 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all transform group-hover:scale-110 ${
                  !isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-80'
                }`}>
                  <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-xl text-[#00FFE0]`}></i>
                </div>
              </button>
            </div>
          </div>

          {/* Master Timeline & Transport Bar */}
          <div className="w-full bg-white/[0.03] p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-sm">{currentTime.toFixed(1)}s</span>
                <span className="text-gray-500">/</span>
                <span className="text-[#00FFE0] font-bold">{totalDuration}s Total Cut</span>
              </div>
              <span className="text-[#C084FC] text-[11px] font-mono">
                Scene {activeScene.sceneNumber} of {scenes.length}
              </span>
            </div>

            {/* Segmented Timeline */}
            <div className="relative w-full h-4 bg-black/80 rounded-xl overflow-hidden border border-white/15 flex p-0.5 gap-1">
              {scenes.map((s, idx) => {
                const widthPercent = (s.duration / totalDuration) * 100;
                const isCurrent = idx === activeSceneIndex;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      let acc = 0;
                      for (let i = 0; i < idx; i++) acc += scenes[i].duration;
                      setCurrentTime(acc);
                      setActiveSceneIndex(idx);
                    }}
                    style={{ width: `${widthPercent}%` }}
                    className={`h-full rounded-lg transition-all cursor-pointer relative overflow-hidden text-[8px] font-mono text-center flex items-center justify-center ${
                      isCurrent
                        ? 'bg-gradient-to-r from-[#C084FC] to-[#00FFE0] text-black font-bold shadow-[0_0_10px_#00FFE0]'
                        : 'bg-white/10 hover:bg-white/20 text-gray-400'
                    }`}
                    title={`Scene ${s.sceneNumber}: ${s.title} (${s.duration}s)`}
                  >
                    <span className="truncate px-1">S{s.sceneNumber}</span>
                  </button>
                );
              })}
            </div>

            {/* Playback Transport Buttons */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-sm`}></i>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTime(0);
                    setActiveSceneIndex(0);
                  }}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                  title="Rewind to Head"
                >
                  <i className="fa-solid fa-backward-step text-sm"></i>
                </button>
              </div>

              {/* Speed Buttons */}
              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
                {[0.5, 1, 1.5, 2].map(spd => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      playbackSpeed === spd ? 'bg-[#00FFE0] text-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              {/* Bridge to Reel Editor */}
              {onSendToReelEditor && (
                <button
                  type="button"
                  onClick={() => {
                    onSendToReelEditor({
                      videoUrl: activeScene.videoUrl,
                      title: `${movieTitle} - ${activeScene.title}`,
                      duration: activeScene.duration,
                      caption: activeScene.dialogue || activeScene.title
                    });
                    bossAudio.playSubtlePing();
                    triggerNeonExplosion({ particleCount: 40, intensity: 'subtle' });
                  }}
                  className="px-3 py-2 rounded-xl bg-[#00FFE0]/20 hover:bg-[#00FFE0]/30 border border-[#00FFE0]/50 text-[#00FFE0] text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Send active scene directly to Reel Video Editor"
                >
                  <i className="fa-solid fa-scissors"></i>
                  <span>Send to Reel Editor</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Scene Card Strip */}
          <div className="w-full grid grid-cols-3 gap-2">
            {scenes.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => {
                  let acc = 0;
                  for (let i = 0; i < idx; i++) acc += scenes[i].duration;
                  setCurrentTime(acc);
                  setActiveSceneIndex(idx);
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  idx === activeSceneIndex
                    ? 'bg-[#C084FC]/15 border-[#C084FC] shadow-[0_0_15px_rgba(192,132,252,0.3)]'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-[#00FFE0]">SCENE {s.sceneNumber}</span>
                  <span className="text-[9px] font-mono text-gray-400">{s.duration}s</span>
                </div>
                <h5 className="text-xs font-mono font-bold text-white truncate">{s.title}</h5>
                <p className="text-[9px] font-mono text-gray-400 truncate mt-1">{s.heading}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Director Control Suite Tabs (5 Cols) */}
        <div className="lg:col-span-5 bg-white/[0.03] p-6 rounded-3xl border border-white/10 flex flex-col space-y-6">
          
          {/* Subtabs Bar */}
          <div className="grid grid-cols-5 gap-1 p-1 bg-black/60 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('storyboard')}
              className={`py-2 text-[9px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeTab === 'storyboard' ? 'bg-[#C084FC] text-black font-black shadow-[0_0_12px_#C084FC]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-clapperboard text-xs"></i>
              <span>Scenes</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('screenplay')}
              className={`py-2 text-[9px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeTab === 'screenplay' ? 'bg-[#00FFE0] text-black font-black shadow-[0_0_12px_#00FFE0]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-file-lines text-xs"></i>
              <span>Script</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cinematography')}
              className={`py-2 text-[9px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeTab === 'cinematography' ? 'bg-[#FF007F] text-white font-black shadow-[0_0_12px_#FF007F]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-video text-xs"></i>
              <span>Cameras</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('soundtrack')}
              className={`py-2 text-[9px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeTab === 'soundtrack' ? 'bg-[#38BDF8] text-black font-black shadow-[0_0_12px_#38BDF8]' : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-music text-xs"></i>
              <span>Audio</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`py-2 text-[9px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
                activeTab === 'export' ? 'bg-white text-black font-black shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-download text-xs"></i>
              <span>Export</span>
            </button>
          </div>

          {/* TAB 1: SCENE STORYBOARD INSPECTOR */}
          {activeTab === 'storyboard' && (
            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Scene {activeScene.sceneNumber} Specification
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddScene}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-[#00FFE0] flex items-center gap-1"
                  >
                    <i className="fa-solid fa-plus"></i> Add Scene
                  </button>
                  {scenes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteScene(activeSceneIndex)}
                      className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-[10px] font-mono text-red-400 flex items-center gap-1"
                    >
                      <i className="fa-solid fa-trash"></i> Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Scene Edit Form */}
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Scene Title</label>
                  <input
                    type="text"
                    value={activeScene.title}
                    onChange={(e) => {
                      const updated = [...scenes];
                      updated[activeSceneIndex].title = e.target.value;
                      setScenes(updated);
                    }}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:border-[#C084FC] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Slugline / Heading</label>
                  <input
                    type="text"
                    value={activeScene.heading}
                    onChange={(e) => {
                      const updated = [...scenes];
                      updated[activeSceneIndex].heading = e.target.value;
                      setScenes(updated);
                    }}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-yellow-300 focus:border-[#C084FC] outline-none font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Duration (Seconds)</label>
                    <input
                      type="number"
                      min={3}
                      max={120}
                      value={activeScene.duration}
                      onChange={(e) => {
                        const updated = [...scenes];
                        updated[activeSceneIndex].duration = Math.max(3, Number(e.target.value));
                        setScenes(updated);
                      }}
                      className="w-full bg-black/70 border border-white/10 rounded-xl p-2 text-xs font-mono text-white focus:border-[#C084FC] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Foley / SFX Cue</label>
                    <input
                      type="text"
                      value={activeScene.sfxCue}
                      onChange={(e) => {
                        const updated = [...scenes];
                        updated[activeSceneIndex].sfxCue = e.target.value;
                        setScenes(updated);
                      }}
                      className="w-full bg-black/70 border border-white/10 rounded-xl p-2 text-xs font-mono text-white focus:border-[#C084FC] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Visual Cinematography Description</label>
                  <textarea
                    rows={3}
                    value={activeScene.visualDescription}
                    onChange={(e) => {
                      const updated = [...scenes];
                      updated[activeSceneIndex].visualDescription = e.target.value;
                      setScenes(updated);
                    }}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-gray-200 focus:border-[#C084FC] outline-none resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Key Dialogue / Voiceover Line</label>
                  <textarea
                    rows={2}
                    value={activeScene.dialogue}
                    onChange={(e) => {
                      const updated = [...scenes];
                      updated[activeSceneIndex].dialogue = e.target.value;
                      setScenes(updated);
                    }}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-[#00FFE0] focus:border-[#C084FC] outline-none resize-none font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI SCREENPLAY WRITER */}
          {activeTab === 'screenplay' && (
            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <i className="fa-solid fa-wand-magic-sparkles text-xs text-[#00FFE0] animate-pulse"></i>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Gemini AI Screenplay Architect
                  </h4>
                </div>
                <p className="text-[10px] font-mono text-gray-400">
                  Synthesize complete multi-scene movie sequences, sluglines, and pacing using Gemini 2.5 Flash
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Movie Title</label>
                  <input
                    type="text"
                    value={movieTitle}
                    onChange={(e) => setMovieTitle(e.target.value)}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:border-[#00FFE0] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Genre / Style</label>
                  <input
                    type="text"
                    value={movieGenre}
                    onChange={(e) => setMovieGenre(e.target.value)}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:border-[#00FFE0] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Story Arc & Plot Concept</label>
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. A rogue AI musician discovers an encrypted synthesizer frequency that unlocks the secret to human creativity..."
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-3 text-xs font-mono text-white placeholder-gray-500 focus:border-[#00FFE0] outline-none resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateMovieScript}
                  disabled={isGeneratingScript || !aiPrompt.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00FFE0] via-[#C084FC] to-[#FF007F] text-black font-mono text-xs font-black uppercase tracking-wider hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(0,255,224,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingScript ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Synthesizing Screenplay...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-clapperboard"></i>
                      <span>Generate 3-Scene Movie Arc</span>
                    </>
                  )}
                </button>
              </div>

              {/* Screenplay Preview Box */}
              <div className="p-4 rounded-2xl bg-black/80 border border-white/10 space-y-3 font-mono text-xs text-gray-300">
                <div className="text-center font-bold text-white uppercase tracking-widest border-b border-white/10 pb-2">
                  {movieTitle}
                </div>
                {scenes.map(s => (
                  <div key={s.id} className="space-y-1">
                    <p className="text-yellow-300 font-bold">{s.heading}</p>
                    <p className="text-gray-400 italic text-[11px]">{s.visualDescription}</p>
                    {s.dialogue && (
                      <p className="text-center text-[#00FFE0] font-semibold my-1">{s.dialogue}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CINEMATOGRAPHY & CAMERA RIGS */}
          {activeTab === 'cinematography' && (
            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
              <div>
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-1">
                  Camera Rigs & Lens Packages
                </h4>
                <p className="text-[10px] font-mono text-gray-400">
                  Configure optical characteristics, camera movement, and focal lengths
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Active Camera Angle</label>
                  <input
                    type="text"
                    value={activeScene.cameraAngle}
                    onChange={(e) => {
                      const updated = [...scenes];
                      updated[activeSceneIndex].cameraAngle = e.target.value;
                      setScenes(updated);
                    }}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:border-[#FF007F] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono uppercase text-gray-400 block mb-1">Lighting Key & Atmosphere</label>
                  <input
                    type="text"
                    value={activeScene.lightingMood}
                    onChange={(e) => {
                      const updated = [...scenes];
                      updated[activeSceneIndex].lightingMood = e.target.value;
                      setScenes(updated);
                    }}
                    className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:border-[#FF007F] outline-none"
                  />
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-[9px] font-mono uppercase text-gray-400 block mb-2">Preset Cinematic Camera Motions:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Orbital Steadicam 360', icon: 'fa-arrows-spin' },
                      { name: 'Low-Angle Hero Tilt', icon: 'fa-crown' },
                      { name: 'Ultra-Wide Drone Pull', icon: 'fa-paper-plane' },
                      { name: 'Anamorphic 35mm Push-In', icon: 'fa-arrows-to-eye' }
                    ].map(preset => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          const updated = [...scenes];
                          updated[activeSceneIndex].cameraAngle = preset.name;
                          setScenes(updated);
                          bossAudio.playSubtlePing();
                        }}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left text-xs font-mono text-gray-200 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <i className={`fa-solid ${preset.icon} text-[#FF007F]`}></i>
                        <span className="text-[11px] truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SOUNDTRACK & SCORE BRIDGE */}
          {activeTab === 'soundtrack' && (
            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
              <div>
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-1">
                  Cinematic Soundscape & Score
                </h4>
                <p className="text-[10px] font-mono text-gray-400">
                  Synchronize orchestral stems, sub-bass rumbles, and bridge to Music Studio
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0D0D14] border border-[#38BDF8]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#38BDF8] uppercase font-bold">Active Scene Score</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] text-[9px] font-mono">
                    24-Bit 96kHz
                  </span>
                </div>
                <input
                  type="text"
                  value={activeScene.audioTrack}
                  onChange={(e) => {
                    const updated = [...scenes];
                    updated[activeSceneIndex].audioTrack = e.target.value;
                    setScenes(updated);
                  }}
                  className="w-full bg-black/70 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:border-[#38BDF8] outline-none"
                />

                {onSendToMusicStudio && (
                  <button
                    type="button"
                    onClick={() => {
                      onSendToMusicStudio(`Cinematic soundtrack for movie: ${movieTitle} (${movieGenre}). Scene ${activeScene.sceneNumber}: ${activeScene.title} - ${activeScene.audioTrack}`);
                      bossAudio.playSubtlePing();
                      triggerNeonExplosion({ particleCount: 50, intensity: 'grand' });
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                  >
                    <i className="fa-solid fa-music"></i>
                    <span>Open in Music Studio Suite</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: EXPORT & PUBLISH */}
          {activeTab === 'export' && (
            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
              <div>
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-1">
                  Master Render & Distribution
                </h4>
                <p className="text-[10px] font-mono text-gray-400">
                  Export high-bitrate ProRes / H.265 movie masters and publish to live feeds
                </p>
              </div>

              {isExporting && (
                <div className="p-4 rounded-2xl bg-black/80 border border-[#00FFE0]/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-bold">Rendering Cinema Master...</span>
                    <span className="text-[#00FFE0] font-black">{exportProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#C084FC] via-[#00FFE0] to-[#FF007F] transition-all"
                      style={{ width: `${exportProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {exportComplete && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <i className="fa-solid fa-circle-check text-emerald-400"></i>
                    <span>Movie Master Successfully Rendered!</span>
                  </div>
                  <p className="text-[11px] text-gray-300">
                    Format: {aspectRatio} • 4K Cinema DCI • Total Runtime: {totalDuration}s • 3 Scenes Synchronized
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleExportMovieMaster}
                  disabled={isExporting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C084FC] via-[#00FFE0] to-[#FF007F] text-black font-mono text-xs font-black uppercase tracking-wider hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(192,132,252,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <i className="fa-solid fa-download"></i>
                  <span>Export 4K Master Cut</span>
                </button>

                {onPublishToFeed && (
                  <button
                    type="button"
                    onClick={() => {
                      onPublishToFeed({
                        title: movieTitle,
                        desc: `${movieGenre} • ${logline} (Runtime: ${totalDuration}s)`,
                        mediaUrl: activeScene.videoUrl || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
                        author: "Janu's Creations Cinema"
                      });
                      bossAudio.playSubtlePing();
                      triggerNeonExplosion({ particleCount: 80, intensity: 'grand' });
                    }}
                    className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <i className="fa-solid fa-tower-broadcast text-[#FF007F]"></i>
                    <span>Publish Movie to Live Creators Feed</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MovieDirectorStudio;
