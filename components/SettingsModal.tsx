import React, { useState, useEffect, useRef } from 'react';
import { ambientSoundscape, SOUNDSCAPE_TRACKS, SoundscapeTrack } from '../utils/ambientSoundscape';
import { bossAudio } from '../utils/soundEffects';
import { triggerNeonExplosion } from '../utils/confetti';
import { useBossNotifications } from '../context/BossNotificationContext';
import { auth, signInWithGoogle, logoutUser, firebaseConfig, firestoreService } from '../services/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { getSavedUserProfile } from '../utils/userProfileState';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToStudio?: (tool: 'reel' | 'photo' | 'music' | 'movie') => void;
  onOpenFounderVault?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToStudio,
  onOpenFounderVault
}) => {
  const { soundEnabled, setSoundEnabled } = useBossNotifications();

  // Active Settings Tab
  const [activeTab, setActiveTab] = useState<'soundscape' | 'alerts' | 'visuals' | 'shortcuts' | 'cloud' | 'bundle'>('soundscape');

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<string | null>(null);

  // Ambient Soundscape State
  const [isPlaying, setIsPlaying] = useState(ambientSoundscape.isPlaying());
  const [volume, setVolume] = useState(ambientSoundscape.getVolume());
  const [currentTrack, setCurrentTrack] = useState<SoundscapeTrack>(ambientSoundscape.getCurrentTrack());
  const [focusAutoPlay, setFocusAutoPlay] = useState(ambientSoundscape.isFocusAutoPlay());
  const [binauralBoost, setBinauralBoost] = useState(ambientSoundscape.isBinauralBoost());
  const [tapeWarmth, setTapeWarmth] = useState(ambientSoundscape.isTapeWarmth());

  // Additional System Settings
  const [glowIntensity, setGlowIntensity] = useState<'ultra' | 'balanced' | 'low'>('ultra');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState(15);
  const [copiedShortcut, setCopiedShortcut] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Subscribe to ambient soundscape state changes
  useEffect(() => {
    const unsubscribe = ambientSoundscape.subscribe(() => {
      setIsPlaying(ambientSoundscape.isPlaying());
      setVolume(ambientSoundscape.getVolume());
      setCurrentTrack(ambientSoundscape.getCurrentTrack());
      setFocusAutoPlay(ambientSoundscape.isFocusAutoPlay());
      setBinauralBoost(ambientSoundscape.isBinauralBoost());
      setTapeWarmth(ambientSoundscape.isTapeWarmth());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubAuth();
  }, []);

  // Handle Manual Cloud Sync
  const handleManualCloudSync = async () => {
    setIsSyncingCloud(true);
    setCloudSyncMsg('Syncing profile and creative state to Firebase Firestore...');
    bossAudio.playBiometricScan();
    try {
      if (auth.currentUser) {
        const profile = getSavedUserProfile();
        await firestoreService.saveUserProfile(auth.currentUser.uid, profile);
        setCloudSyncMsg('✓ Successfully synced with Firestore cloud database!');
        bossAudio.playSuccess();
        triggerNeonExplosion();
      } else {
        setCloudSyncMsg('✓ Database connected (Ready for user authentication)');
      }
    } catch (err: any) {
      setCloudSyncMsg(`Sync error: ${err.message || 'Check network'}`);
    } finally {
      setIsSyncingCloud(false);
      setTimeout(() => setCloudSyncMsg(null), 5000);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      bossAudio.playSubtlePing();
      await signInWithGoogle();
      bossAudio.playSuccess();
      triggerNeonExplosion();
    } catch (err) {
      console.error('Google sign-in error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      bossAudio.playSubtlePing();
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  // Keyboard shortcut ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Real-time Canvas Equalizer Visualizer
  useEffect(() => {
    if (!isOpen || activeTab !== 'soundscape') {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      const analyser = ambientSoundscape.getAnalyser();

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      const bufferLength = analyser ? analyser.frequencyBinCount : 32;
      const dataArray = new Uint8Array(bufferLength);
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      }

      const barCount = 28;
      const barWidth = (width / barCount) - 3;
      phase += 0.05;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;
        if (isPlaying) {
          const val = dataArray[i % dataArray.length] || 0;
          const simulatedDynamic = Math.sin(phase + i * 0.3) * 6 + 10;
          barHeight = Math.max(4, (val / 255) * (height - 12) + (val > 10 ? simulatedDynamic : 2));
        } else {
          barHeight = 4 + Math.sin(phase * 0.5 + i * 0.2) * 2;
        }

        const x = i * (barWidth + 3);
        const y = height - barHeight;

        // Gradient color for each bar
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#00F5D4');
        gradient.addColorStop(0.5, '#C084FC');
        gradient.addColorStop(1, '#FF007F');

        ctx.fillStyle = isPlaying ? gradient : 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
        ctx.fill();

        // Glow tip on active high bars
        if (isPlaying && barHeight > 18) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#00F5D4';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(x + 1, y, barWidth - 2, 2);
          ctx.shadowBlur = 0;
        }
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, activeTab, isPlaying]);

  if (!isOpen) return null;

  const handleToggleSoundscape = () => {
    bossAudio.playSubtlePing();
    ambientSoundscape.togglePlay();
    if (!isPlaying) {
      triggerNeonExplosion({
        particleCount: 25,
        origin: { x: 0.5, y: 0.4 },
        intensity: 'subtle'
      });
    }
  };

  const handleSelectTrack = (track: SoundscapeTrack) => {
    bossAudio.playPaletteNavigate();
    ambientSoundscape.setTrack(track.id);
    if (!isPlaying) {
      ambientSoundscape.start(track.id);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    ambientSoundscape.setVolume(val);
  };

  const handlePresetVolume = (targetVol: number) => {
    bossAudio.playSubtlePing();
    setVolume(targetVol);
    ambientSoundscape.setVolume(targetVol);
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
      
      {/* Click outside backdrop to close */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose}
      />

      {/* Main Settings Modal Card */}
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0A0A0C] border border-white/15 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,245,212,0.15)] overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF007F] via-[#C084FC] to-[#00F5D4] p-[1px] shadow-[0_0_20px_rgba(0,245,212,0.3)]">
              <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center text-white text-base">
                <i className="fa-solid fa-sliders text-[#00F5D4]"></i>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-serif font-black italic text-white tracking-tight">
                  Studio Settings & Atmosphere
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#00F5D4]/15 border border-[#00F5D4]/30 text-[#00F5D4] text-[9px] font-mono font-bold uppercase tracking-widest">
                  PRO
                </span>
              </div>
              <p className="text-[11px] font-mono text-gray-400">
                Configure ambient synth-wave audio, focus-mode soundscapes, audio FX, and AI studio parameters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Playing Status Pill */}
            {isPlaying && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[#00F5D4] text-[10px] font-mono font-bold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4]"></span>
                <span>Soundscape Active</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-all cursor-pointer"
              title="Close (Esc)"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex items-center gap-2 px-6 sm:px-8 pt-4 pb-3 border-b border-white/10 bg-black/20 overflow-x-auto no-scrollbar">
          {[
            { id: 'soundscape', label: 'Ambient Soundscape', icon: 'fa-waveform-lines', highlight: true },
            { id: 'bundle', label: 'App Bundle & Export', icon: 'fa-box-archive' },
            { id: 'alerts', label: 'Audio & Alert FX', icon: 'fa-bell' },
            { id: 'visuals', label: 'Visuals & Atmosphere', icon: 'fa-sparkles' },
            { id: 'shortcuts', label: 'Shortcuts & Security', icon: 'fa-keyboard' },
            { id: 'cloud', label: 'Firebase Cloud DB', icon: 'fa-cloud' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                bossAudio.playSubtlePing();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F] text-black font-black shadow-[0_0_15px_rgba(0,245,212,0.4)]'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              <span>{tab.label}</span>
              {tab.highlight && isPlaying && (
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping"></span>
              )}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">

          {/* ================= TAB 1: AMBIENT SOUNDSCAPE (HERO FOCUS AUDIO) ================= */}
          {activeTab === 'soundscape' && (
            <div className="space-y-6">

              {/* Master Soundscape Player Banner */}
              <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-black border border-white/15 relative overflow-hidden shadow-2xl">
                <div 
                  className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20"
                  style={{ backgroundColor: currentTrack.color }}
                ></div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                  
                  {/* Left: Track Info & Play/Pause */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleToggleSoundscape}
                      className="w-16 h-16 rounded-2xl p-[2px] transition-all transform hover:scale-105 active:scale-95 shadow-xl group cursor-pointer shrink-0"
                      style={{
                        background: isPlaying 
                          ? 'linear-gradient(135deg, #00F5D4, #C084FC, #FF007F)' 
                          : 'rgba(255, 255, 255, 0.1)'
                      }}
                      title={isPlaying ? 'Pause Ambient Soundscape' : 'Play Ambient Soundscape'}
                    >
                      <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center transition-colors group-hover:bg-zinc-900">
                        <i className={`fa-solid ${isPlaying ? 'fa-pause text-[#00F5D4]' : 'fa-play text-white ml-0.5'} text-xl transition-transform`}></i>
                      </div>
                    </button>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider"
                          style={{
                            backgroundColor: `${currentTrack.color}20`,
                            color: currentTrack.color,
                            border: `1px solid ${currentTrack.color}40`
                          }}
                        >
                          {currentTrack.badge}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {currentTrack.genre}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-serif font-black italic text-white">
                        {currentTrack.name}
                      </h3>
                      <p className="text-xs font-mono text-gray-400 mt-0.5 line-clamp-1 max-w-md">
                        {currentTrack.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Live Canvas Audio Spectrum Visualizer */}
                  <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                        Real-Time Synth Spectrum:
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#00F5D4]">
                        {isPlaying ? 'ACTIVE 432Hz' : 'STANDBY'}
                      </span>
                    </div>

                    <div className="w-full sm:w-64 h-14 bg-black/60 border border-white/10 rounded-2xl p-2 flex items-center justify-center shadow-inner overflow-hidden">
                      <canvas 
                        ref={canvasRef} 
                        width={250} 
                        height={48} 
                        className="w-full h-full"
                      />
                    </div>
                  </div>

                </div>

                {/* Volume & Master Gain Slider */}
                <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-3 flex-1 max-w-md">
                    <button
                      onClick={() => handlePresetVolume(volume > 0 ? 0 : 0.35)}
                      className="text-gray-400 hover:text-white transition-colors cursor-pointer text-sm"
                      title={volume === 0 ? 'Unmute' : 'Mute'}
                    >
                      <i className={`fa-solid ${volume === 0 ? 'fa-volume-xmark text-red-400' : volume < 0.3 ? 'fa-volume-low text-[#00F5D4]' : 'fa-volume-high text-[#00F5D4]'}`}></i>
                    </button>

                    <div className="flex-1 flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#00F5D4]"
                      />
                      <span className="text-xs font-mono font-bold text-white w-10 text-right">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Quick Volume Preset Chips */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-gray-500 uppercase mr-1">
                      Presets:
                    </span>
                    {[
                      { label: 'Subtle', val: 0.15 },
                      { label: 'Focus', val: 0.35 },
                      { label: 'Deep', val: 0.65 },
                      { label: 'Max', val: 1.0 }
                    ].map((p) => (
                      <button
                        key={p.label}
                        onClick={() => handlePresetVolume(p.val)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                          Math.abs(volume - p.val) < 0.05
                            ? 'bg-[#00F5D4]/20 border border-[#00F5D4]/40 text-[#00F5D4]'
                            : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Soundscape Track Selection Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400">
                    Select Curated Soundscape
                  </h4>
                  <span className="text-[10px] font-mono text-[#C084FC]">
                    Generative Web Audio Synthesizer
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {SOUNDSCAPE_TRACKS.map((track) => {
                    const isSelected = currentTrack.id === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => handleSelectTrack(track)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                          isSelected
                            ? 'bg-zinc-900/90 border-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.2)]'
                            : 'bg-zinc-900/40 border-white/10 hover:border-white/20 hover:bg-zinc-900/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                              style={{
                                backgroundColor: `${track.color}20`,
                                color: track.color,
                                border: `1px solid ${track.color}40`
                              }}
                            >
                              <i className={`fa-solid ${isSelected && isPlaying ? 'fa-waveform-lines animate-pulse' : 'fa-music'}`}></i>
                            </div>
                            <div>
                              <h5 className="text-sm font-serif font-black italic text-white group-hover:text-[#00F5D4] transition-colors">
                                {track.name}
                              </h5>
                              <span className="text-[10px] font-mono text-gray-400">
                                {track.genre}
                              </span>
                            </div>
                          </div>

                          <span 
                            className="px-2 py-0.5 rounded text-[8px] font-mono font-bold"
                            style={{
                              backgroundColor: `${track.color}15`,
                              color: track.color
                            }}
                          >
                            {track.badge}
                          </span>
                        </div>

                        <p className="text-[11px] font-mono text-gray-400 line-clamp-2 leading-relaxed">
                          {track.description}
                        </p>

                        {isSelected && (
                          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                            <span className="text-[#00F5D4] font-bold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4] animate-ping"></span>
                              <span>Selected Channel</span>
                            </span>
                            <span className="text-gray-500">
                              {track.baseFreq}Hz Harmonic Base
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Focus-Mode Audio Enhancements & Toggles */}
              <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/10 space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <i className="fa-solid fa-wand-magic-sparkles text-[#C084FC]"></i>
                  <span>Focus-Mode Synthesis Filters & Logic</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Focus Auto-Play Toggle */}
                  <div 
                    onClick={() => {
                      bossAudio.playSubtlePing();
                      ambientSoundscape.setFocusAutoPlay(!focusAutoPlay);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      focusAutoPlay 
                        ? 'bg-[#00F5D4]/10 border-[#00F5D4]/40 text-white' 
                        : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <i className={`fa-solid fa-sparkles text-sm ${focusAutoPlay ? 'text-[#00F5D4]' : 'text-gray-500'}`}></i>
                      <div className={`w-8 h-4 rounded-full transition-colors relative ${focusAutoPlay ? 'bg-[#00F5D4]' : 'bg-zinc-700'}`}>
                        <div className={`w-3.5 h-3.5 rounded-full bg-black absolute top-0.25 transition-transform ${focusAutoPlay ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                      </div>
                    </div>
                    <div>
                      <h6 className="text-xs font-mono font-bold text-white mb-0.5">
                        Studio Auto-Play
                      </h6>
                      <p className="text-[10px] font-mono text-gray-400 leading-tight">
                        Auto-fades in synthwave when opening Reel, Photo, or Music Studio.
                      </p>
                    </div>
                  </div>

                  {/* Binaural 10Hz Alpha Differential Toggle */}
                  <div 
                    onClick={() => {
                      bossAudio.playSubtlePing();
                      ambientSoundscape.setBinauralBoost(!binauralBoost);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      binauralBoost 
                        ? 'bg-[#C084FC]/10 border-[#C084FC]/40 text-white' 
                        : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <i className={`fa-solid fa-brain text-sm ${binauralBoost ? 'text-[#C084FC]' : 'text-gray-500'}`}></i>
                      <div className={`w-8 h-4 rounded-full transition-colors relative ${binauralBoost ? 'bg-[#C084FC]' : 'bg-zinc-700'}`}>
                        <div className={`w-3.5 h-3.5 rounded-full bg-black absolute top-0.25 transition-transform ${binauralBoost ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                      </div>
                    </div>
                    <div>
                      <h6 className="text-xs font-mono font-bold text-white mb-0.5">
                        10Hz Alpha Detune
                      </h6>
                      <p className="text-[10px] font-mono text-gray-400 leading-tight">
                        Stereo pitch detuning for hemispheric synchronization and flow.
                      </p>
                    </div>
                  </div>

                  {/* Analog Vinyl & Tape Warmth */}
                  <div 
                    onClick={() => {
                      bossAudio.playSubtlePing();
                      ambientSoundscape.setTapeWarmth(!tapeWarmth);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      tapeWarmth 
                        ? 'bg-[#FF007F]/10 border-[#FF007F]/40 text-white' 
                        : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <i className={`fa-solid fa-record-vinyl text-sm ${tapeWarmth ? 'text-[#FF007F]' : 'text-gray-500'}`}></i>
                      <div className={`w-8 h-4 rounded-full transition-colors relative ${tapeWarmth ? 'bg-[#FF007F]' : 'bg-zinc-700'}`}>
                        <div className={`w-3.5 h-3.5 rounded-full bg-black absolute top-0.25 transition-transform ${tapeWarmth ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                      </div>
                    </div>
                    <div>
                      <h6 className="text-xs font-mono font-bold text-white mb-0.5">
                        Tape & Vinyl Air
                      </h6>
                      <p className="text-[10px] font-mono text-gray-400 leading-tight">
                        Filtered pink-noise texture mimicking vintage studio hardware.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 2: AUDIO & ALERT FX ================= */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              
              <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00F5D4]/15 border border-[#00F5D4]/30 flex items-center justify-center text-[#00F5D4]">
                      <i className="fa-solid fa-volume-high text-base"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-mono font-bold text-white">
                        System Sound FX & Chimes
                      </h4>
                      <p className="text-xs font-mono text-gray-400">
                        Plays Web Audio metallic chimes for tips, rank upgrades, and contest wins
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const next = !soundEnabled;
                      setSoundEnabled(next);
                      if (next) bossAudio.playTipChime(100);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      soundEnabled
                        ? 'bg-[#00F5D4] text-black font-black shadow-[0_0_15px_rgba(0,245,212,0.4)]'
                        : 'bg-white/10 text-gray-400 border border-white/10'
                    }`}
                  >
                    {soundEnabled ? 'ENABLED' : 'MUTED'}
                  </button>
                </div>

                <div className="pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => bossAudio.playTipChime(50)}
                    className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-[#00F5D4] text-gray-300 hover:text-white text-xs font-mono text-center transition-colors cursor-pointer"
                  >
                    <i className="fa-solid fa-bell text-[#00F5D4] mb-1 block"></i>
                    Test Tip Chime
                  </button>
                  <button
                    onClick={() => bossAudio.playRankUpSound()}
                    className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-[#C084FC] text-gray-300 hover:text-white text-xs font-mono text-center transition-colors cursor-pointer"
                  >
                    <i className="fa-solid fa-ranking-star text-[#C084FC] mb-1 block"></i>
                    Test Rank Arpeggio
                  </button>
                  <button
                    onClick={() => bossAudio.playContestWinSound()}
                    className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-[#FF007F] text-gray-300 hover:text-white text-xs font-mono text-center transition-colors cursor-pointer"
                  >
                    <i className="fa-solid fa-trophy text-[#FF007F] mb-1 block"></i>
                    Test Victory Fanfare
                  </button>
                  <button
                    onClick={() => bossAudio.playPaletteExecute()}
                    className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-[#FCD34D] text-gray-300 hover:text-white text-xs font-mono text-center transition-colors cursor-pointer"
                  >
                    <i className="fa-solid fa-bolt text-[#FCD34D] mb-1 block"></i>
                    Test Warp Action
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/10 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-mono font-bold text-white">
                    Command Palette Audio Ticks
                  </h5>
                  <p className="text-[11px] font-mono text-gray-400">
                    Provides subtle haptic audio feedback while navigating Quick Switcher (⌘K)
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#00F5D4]">
                  Active
                </span>
              </div>

            </div>
          )}

          {/* ================= TAB 3: VISUALS & ATMOSPHERE ================= */}
          {activeTab === 'visuals' && (
            <div className="space-y-6">

              {/* 3D Virtual Studio Room Atmosphere */}
              <div className="p-6 rounded-3xl bg-zinc-900/60 border border-[#00F5D4]/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <i className="fa-solid fa-cube text-[#00F5D4] text-base"></i>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                      3D Virtual Studio Room Background
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00F5D4]/10 text-[#00F5D4] text-[9px] font-mono font-bold uppercase border border-[#00F5D4]/30">
                    WebGL Real-Time
                  </span>
                </div>
                <p className="text-[11px] font-mono text-gray-400">
                  Interactive perspective 3D chamber with dynamic mouse parallax, neon floor grids, floating hologram HUDs, and architectural columns.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400">
                  Neon Glow Intensity
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'ultra', label: 'Ultra Cyberpunk', desc: 'Maximum bloom & shadow' },
                    { id: 'balanced', label: 'Executive Balanced', desc: 'Sleek luxury glow' },
                    { id: 'low', label: 'Minimal Studio', desc: 'Reduced eye-strain' }
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => {
                        setGlowIntensity(lvl.id as any);
                        bossAudio.playSubtlePing();
                      }}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        glowIntensity === lvl.id
                          ? 'bg-[#00F5D4]/15 border-[#00F5D4] text-white shadow-[0_0_15px_rgba(0,245,212,0.2)]'
                          : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold text-white mb-0.5">{lvl.label}</div>
                      <div className="text-[10px] font-mono text-gray-400">{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/10 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-mono font-bold text-white">
                    Reduced Motion
                  </h5>
                  <p className="text-[11px] font-mono text-gray-400">
                    Disables rapid confetti explosions and high-speed watermark scrolling
                  </p>
                </div>
                <button
                  onClick={() => {
                    setReducedMotion(!reducedMotion);
                    bossAudio.playSubtlePing();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    reducedMotion ? 'bg-[#FF007F] text-white' : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {reducedMotion ? 'ON' : 'OFF'}
                </button>
              </div>

            </div>
          )}

          {/* ================= TAB 4: SHORTCUTS & SECURITY ================= */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-6">

              {/* Founder Vault Auto-Lock */}
              <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FCD34D]/15 border border-[#FCD34D]/30 flex items-center justify-center text-[#FCD34D]">
                      <i className="fa-solid fa-shield-halved text-base"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-mono font-bold text-white">
                        Boss Vault Biometric Auto-Lock
                      </h4>
                      <p className="text-xs font-mono text-gray-400">
                        Automatically closes authorized founder session upon inactivity
                      </p>
                    </div>
                  </div>

                  {onOpenFounderVault && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenFounderVault();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#00F5D4]/15 border border-[#00F5D4]/40 text-[#00F5D4] text-xs font-mono font-bold hover:bg-[#00F5D4]/25 transition-colors cursor-pointer"
                    >
                      Open Boss Vault
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <span className="text-xs font-mono text-gray-400 mr-2">Timeout:</span>
                  {[5, 15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        setAutoLockMinutes(mins);
                        bossAudio.playSubtlePing();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        autoLockMinutes === mins
                          ? 'bg-[#FCD34D] text-black font-black'
                          : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Keyboard Shortcuts Reference */}
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/10 space-y-3">
                <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
                  Global Studio Hotkeys
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  {[
                    { key: '⌘K / Ctrl+K', label: 'Open Quick Switcher Palette' },
                    { key: 'Esc', label: 'Close Modals / Cancel Operations' },
                    { key: 'Space', label: 'Play / Pause Soundscape (in Settings)' },
                    { key: '⌘B / Ctrl+B', label: 'Open Boss Vault Authentication' }
                  ].map((s) => (
                    <div key={s.key} className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-gray-400">{s.label}</span>
                      <kbd className="px-2 py-0.5 rounded bg-white/10 text-[#00F5D4] font-bold text-[10px]">
                        {s.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 5: FIREBASE CLOUD DB & AUTH ================= */}
          {activeTab === 'cloud' && (
            <div className="space-y-6">
              {/* Header Status Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-[#00F5D4]/10 via-[#C084FC]/10 to-[#FF007F]/10 border border-[#00F5D4]/30 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#00F5D4]/20 border border-[#00F5D4]/50 flex items-center justify-center text-xl text-[#00F5D4] shadow-[0_0_20px_rgba(0,245,212,0.4)]">
                      <i className="fa-solid fa-cloud-bolt"></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-serif font-black italic text-white">
                          Firebase Cloud Storage & Firestore
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Connected
                        </span>
                      </div>
                      <p className="text-xs font-mono text-gray-400 mt-0.5">
                        Project: <span className="text-[#00F5D4] font-bold">{firebaseConfig.projectId}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleManualCloudSync}
                    disabled={isSyncingCloud}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#C084FC] text-black text-xs font-mono font-black uppercase tracking-wider hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,245,212,0.3)] disabled:opacity-50 cursor-pointer flex items-center gap-2 self-start sm:self-auto"
                  >
                    <i className={`fa-solid fa-arrows-rotate ${isSyncingCloud ? 'animate-spin' : ''}`}></i>
                    <span>{isSyncingCloud ? 'Syncing...' : 'Sync Cloud Now'}</span>
                  </button>
                </div>

                {cloudSyncMsg && (
                  <div className="mt-4 p-3 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-[#00F5D4]">
                    {cloudSyncMsg}
                  </div>
                )}
              </div>

              {/* Cloud Database Schemas & Collections */}
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
                    Active Firestore Collections
                  </h5>
                  <span className="text-[10px] font-mono text-[#00F5D4]">Multi-Modal Vault Active</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  {[
                    { name: 'users', desc: 'Creator profile, face avatar, bio, earnings, and rank', icon: 'fa-user' },
                    { name: 'creations', desc: 'Synthesized reels, 8K artwork, and music stems', icon: 'fa-sparkles' },
                    { name: 'scheduled_posts', desc: 'Autonomous social scheduling & viral queue', icon: 'fa-calendar-clock' },
                    { name: 'contest_submissions', desc: 'Contest entries, AI judging scores, and ranks', icon: 'fa-trophy' },
                    { name: 'live_messages', desc: 'Live studio broadcast chats, tips, and superchats', icon: 'fa-comments' },
                    { name: 'payout_records', desc: 'Founder withdrawals and verified ledger receipts', icon: 'fa-money-bill-transfer' }
                  ].map((col) => (
                    <div key={col.name} className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#00F5D4] shrink-0">
                        <i className={`fa-solid ${col.icon} text-xs`}></i>
                      </div>
                      <div>
                        <div className="text-white font-bold">{col.name}</div>
                        <div className="text-[11px] text-gray-400 leading-tight mt-0.5">{col.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Authentication & User Session */}
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/10 space-y-4">
                <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
                  Firebase Authentication Session
                </h5>

                <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border border-[#00F5D4]" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-gray-300">
                        <i className="fa-solid fa-user"></i>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-mono font-bold text-white">
                        {currentUser?.displayName || (currentUser?.isAnonymous ? 'Creator (Anonymous Session)' : 'Active Creator')}
                      </div>
                      <div className="text-[11px] font-mono text-gray-400">
                        UID: <span className="text-gray-300">{currentUser ? currentUser.uid.substring(0, 14) + '...' : 'Not authenticated'}</span>
                        {currentUser?.email && <span className="ml-2 text-[#00F5D4]">({currentUser.email})</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentUser && !currentUser.isAnonymous ? (
                      <button
                        onClick={handleSignOut}
                        className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-mono font-bold transition-all cursor-pointer"
                      >
                        Sign Out
                      </button>
                    ) : (
                      <button
                        onClick={handleGoogleSignIn}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <i className="fa-brands fa-google text-[#00F5D4]"></i>
                        <span>Sign In with Google</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Security & Config Details */}
              <div className="p-4 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs font-mono text-gray-400">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-shield-halved text-emerald-400"></i>
                  <span>Firestore Rules: Version 2 (Authenticated Role-Based Access Control Deployed)</span>
                </div>
                <span className="text-gray-400">Auth Domain: {firebaseConfig.authDomain}</span>
              </div>

              {/* Active Cloud Run App URLs & Deployment Endpoints */}
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <i className="fa-solid fa-server text-[#00F5D4]"></i>
                    <span>Cloud Run Endpoints & App URLs</span>
                  </h5>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Port 3000 Ingress Ready
                  </span>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  {/* Dev URL */}
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">Development App URL</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FF007F]/20 text-[#FF007F] border border-[#FF007F]/30">DEV INSTANCE</span>
                      </div>
                      <div className="text-[11px] text-[#00F5D4] break-all mt-0.5">https://ais-dev-uhadavd3tcwhq2e6eka5x5-434571143593.us-east1.run.app</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('https://ais-dev-uhadavd3tcwhq2e6eka5x5-434571143593.us-east1.run.app');
                          bossAudio.playTipChime(150);
                          setCloudSyncMsg('Copied Development App URL to clipboard!');
                          setTimeout(() => setCloudSyncMsg(''), 3000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Copy Dev URL"
                      >
                        <i className="fa-solid fa-copy"></i>
                        <span>Copy</span>
                      </button>
                      <a
                        href="https://ais-dev-uhadavd3tcwhq2e6eka5x5-434571143593.us-east1.run.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-[#00F5D4] hover:bg-[#00F5D4]/90 text-black text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        <span>Launch</span>
                      </a>
                    </div>
                  </div>

                  {/* Shared / Pre URL */}
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">Shared / Preview App URL</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30">SHARED PREVIEW</span>
                      </div>
                      <div className="text-[11px] text-[#38BDF8] break-all mt-0.5">https://ais-pre-uhadavd3tcwhq2e6eka5x5-434571143593.us-east1.run.app</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('https://ais-pre-uhadavd3tcwhq2e6eka5x5-434571143593.us-east1.run.app');
                          bossAudio.playTipChime(150);
                          setCloudSyncMsg('Copied Shared Preview App URL to clipboard!');
                          setTimeout(() => setCloudSyncMsg(''), 3000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Copy Shared URL"
                      >
                        <i className="fa-solid fa-copy"></i>
                        <span>Copy</span>
                      </button>
                      <a
                        href="https://ais-pre-uhadavd3tcwhq2e6eka5x5-434571143593.us-east1.run.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-black text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        <span>Launch</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 6: APP BUNDLE & EXPORT ================= */}
          {activeTab === 'bundle' && (
            <div className="space-y-6">

              {/* Special Spotlight: Google Play Console (.aab) Direct Release Guide */}
              <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-black to-zinc-950 border-2 border-emerald-500/40 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                        <i className="fa-brands fa-google-play text-emerald-400"></i> Google Play Console Ready
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">Requires .AAB (Not .ZIP)</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                      Publishing to Google Play Internal Testing
                    </h3>
                    <p className="text-gray-300 text-xs leading-relaxed max-w-2xl">
                      Google Play Console requires an <strong className="text-emerald-300">Android App Bundle (.aab)</strong>. We have armed your app with complete PWA compliance (Web App Manifest, Service Worker, 512px icons, and Digital Asset Links).
                    </p>
                  </div>

                  <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <a
                      href="https://www.pwabuilder.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-[#00FFE0] hover:scale-105 active:scale-95 text-black font-mono font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <i className="fa-solid fa-bolt text-sm"></i>
                      <span>Generate .AAB on PWABuilder</span>
                      <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                    </a>
                  </div>
                </div>

                {/* 3-step rapid instructions */}
                <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="font-mono text-emerald-400 font-black text-[11px] mb-1">STEP 1 • ENTER URL</div>
                    <p className="text-gray-300 text-[11px]">Paste your live app URL on PWABuilder.com:</p>
                    <div className="mt-1.5 p-1.5 rounded bg-black/60 font-mono text-[10px] text-emerald-300 select-all break-all border border-emerald-500/20">
                      https://ais-pre-uhadavd3tcwhq2e6eka5x5-434571143593.us-east1.run.app
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="font-mono text-emerald-400 font-black text-[11px] mb-1">STEP 2 • PACKAGE FOR ANDROID</div>
                    <p className="text-gray-300 text-[11px]">
                      Click <strong>Package for Store</strong> under Android. PWABuilder builds your signed, production-ready <code className="text-emerald-300">.aab</code> bundle in ~30 seconds.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="font-mono text-emerald-400 font-black text-[11px] mb-1">STEP 3 • UPLOAD TO PLAY CONSOLE</div>
                    <p className="text-gray-300 text-[11px]">
                      Drop the downloaded <code className="text-emerald-300">.aab</code> directly into your Google Play Console release window!
                    </p>
                  </div>
                </div>
              </div>

              {/* Hero Banner */}
              <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-black border border-white/15 relative overflow-hidden shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div>
                    <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-[#00F5D4] bg-[#00F5D4]/10 px-3 py-1 rounded-full border border-[#00F5D4]/30 inline-block mb-3">
                      Production Bundles & Source Archives
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                      <i className="fa-solid fa-box-archive text-[#00F5D4]"></i>
                      App Bundle Downloads
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm font-light mt-1 max-w-xl">
                      Download complete, standalone copies of Janu's Creations. Choose between the compiled production distribution or the full project source code.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      BUILDS READY
                    </span>
                  </div>
                </div>
              </div>

              {/* Package 1: Compiled Production App Bundle */}
              <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-[#00F5D4]/40 transition-all space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[#00F5D4] flex items-center justify-center text-xl shrink-0">
                      <i className="fa-solid fa-rocket"></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-bold text-base">Production Distribution Bundle (`dist`)</h4>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#00F5D4]/20 text-[#00F5D4] border border-[#00F5D4]/30">
                          COMPILED SPA + SERVER
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mt-1">
                        Pre-built production assets ready for deployment on Cloud Run, VPS, Docker, or static hosting. Contains minified React 19 SPA, bundled styles, audio/image assets, and <code className="text-[#00F5D4]">server.cjs</code>.
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-[11px] font-mono text-gray-500">
                        <span><i className="fa-solid fa-file-zipper text-[#00F5D4] mr-1"></i> janus-creations-app-bundle.zip</span>
                        <span><i className="fa-solid fa-hard-drive text-[#00F5D4] mr-1"></i> ~2.5 MB</span>
                        <span><i className="fa-solid fa-check text-emerald-400 mr-1"></i> Production Verified</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <a
                      href="/api/download-bundle"
                      download="janus-creations-app-bundle.zip"
                      onClick={() => {
                        bossAudio.playSuccess();
                        triggerNeonExplosion();
                      }}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#00F5D4] via-[#38BDF8] to-[#00FFE0] hover:scale-105 active:scale-95 text-black font-mono font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,245,212,0.3)] flex items-center gap-2 cursor-pointer"
                    >
                      <i className="fa-solid fa-download text-sm"></i>
                      <span>Download App Bundle (.zip)</span>
                    </a>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px] text-gray-300">
                  <div className="text-gray-500 mb-1"># Run the production bundle with Node:</div>
                  <div className="text-[#00F5D4]">unzip janus-creations-app-bundle.zip -d app && cd app && node server.cjs</div>
                </div>
              </div>

              {/* Package 2: Full Source Code Archive */}
              <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-[#C084FC]/40 transition-all space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#C084FC]/10 border border-[#C084FC]/30 text-[#C084FC] flex items-center justify-center text-xl shrink-0">
                      <i className="fa-solid fa-code"></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-bold text-base">Full Project Source Archive</h4>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#C084FC]/20 text-[#C084FC] border border-[#C084FC]/30">
                          TYPESCRIPT SOURCE
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mt-1">
                        Complete codebase with all React components, hooks, sound engines, D3 visualizations, Three.js backgrounds, backend API handlers, Firebase configs, and build manifests.
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-[11px] font-mono text-gray-500">
                        <span><i className="fa-solid fa-file-zipper text-[#C084FC] mr-1"></i> janus-creations-full-project.zip</span>
                        <span><i className="fa-solid fa-hard-drive text-[#C084FC] mr-1"></i> ~2.6 MB</span>
                        <span><i className="fa-solid fa-shield-halved text-emerald-400 mr-1"></i> Clean (.git & node_modules excluded)</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <a
                      href="/api/download-source"
                      download="janus-creations-full-project.zip"
                      onClick={() => {
                        bossAudio.playSuccess();
                        triggerNeonExplosion();
                      }}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#C084FC] via-[#E056FD] to-[#FF007F] hover:scale-105 active:scale-95 text-white font-mono font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(192,132,252,0.3)] flex items-center gap-2 cursor-pointer"
                    >
                      <i className="fa-solid fa-download text-sm"></i>
                      <span>Download Full Source (.zip)</span>
                    </a>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px] text-gray-300">
                  <div className="text-gray-500 mb-1"># Unpack and start local dev server:</div>
                  <div className="text-[#C084FC]">unzip janus-creations-full-project.zip && npm install && npm run dev</div>
                </div>
              </div>

              {/* AI Studio Platform Export Guidelines */}
              <div className="p-6 rounded-3xl bg-zinc-950/80 border border-white/10 space-y-3">
                <h4 className="text-white font-bold text-sm flex items-center gap-2">
                  <i className="fa-brands fa-github text-[#00F5D4]"></i>
                  Exporting Directly via Google AI Studio
                </h4>
                <p className="text-gray-400 text-xs leading-relaxed">
                  You can also export your application directly through Google AI Studio's native export menu:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white font-mono font-bold text-xs">
                      1
                    </div>
                    <div>
                      <div className="font-bold text-white mb-0.5">Settings Menu &gt; Export to GitHub</div>
                      <div className="text-gray-400 text-[11px]">Connect your GitHub account to push this entire repository directly into a new or existing repo.</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white font-mono font-bold text-xs">
                      2
                    </div>
                    <div>
                      <div className="font-bold text-white mb-0.5">Settings Menu &gt; Download ZIP</div>
                      <div className="text-gray-400 text-[11px]">Download an instant snapshot archive directly to your computer from AI Studio.</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-white/10 bg-black/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400">
            <i className="fa-solid fa-check text-[#00F5D4]"></i>
            <span>Preferences saved automatically to local storage</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSoundscape}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                isPlaying
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                  : 'bg-[#00F5D4]/20 border border-[#00F5D4]/40 text-[#00F5D4] hover:bg-[#00F5D4]/30'
              }`}
            >
              <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
              <span>{isPlaying ? 'Pause Soundscape' : 'Play Soundscape'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
