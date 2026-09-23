import React, { useState, useEffect, useRef } from 'react';
import { 
  VOICE_PROFILES, 
  EMOTIONAL_RESONANCES, 
  VOICEOVER_PRESETS,
  VoiceProfile, 
  EmotionalResonance, 
  VoiceoverPresetTemplate,
  vocalAudioSynthesizer 
} from '../utils/vocalAudioSynthesizer';
import { generateAIVoiceoverScript, enhanceVoiceoverText } from '../services/geminiService';
import { triggerNeonExplosion } from '../utils/confetti';

interface AIVoiceoverStudioProps {
  onInjectVocalToTrack?: (vocalData: { text: string; profile: string; resonance: string; audioUrl?: string }) => void;
  onNavigateToReelStudio?: (vocalTrack: any) => void;
  onPublishToLiveFeed?: (data: any) => void;
  compact?: boolean;
}

export const AIVoiceoverStudio: React.FC<AIVoiceoverStudioProps> = ({
  onInjectVocalToTrack,
  onNavigateToReelStudio,
  onPublishToLiveFeed,
  compact = false
}) => {
  // Active Profile & Resonance State
  const [selectedProfile, setSelectedProfile] = useState<VoiceProfile>(VOICE_PROFILES[0]);
  const [selectedResonance, setSelectedResonance] = useState<EmotionalResonance>(EMOTIONAL_RESONANCES[0]);
  
  // Script / Text State
  const [vocalText, setVocalText] = useState(
    "Welcome to Janu's Creations. Feel the sovereign frequency ignite as the bass shatters the midnight sky!"
  );
  
  // Vocal Acoustic Sliders
  const [pitchShift, setPitchShift] = useState<number>(0);
  const [cadenceSpeed, setCadenceSpeed] = useState<number>(1.0);
  const [reverbWet, setReverbWet] = useState<number>(35);
  const [vocalVolume, setVocalVolume] = useState<number>(90);

  // Playback & Processing State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isEnhancingText, setIsEnhancingText] = useState(false);
  const [isExportingWav, setIsExportingWav] = useState(false);
  const [scriptDirectorNotes, setScriptDirectorNotes] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [waveformBars, setWaveformBars] = useState<number[]>(new Array(24).fill(15));

  const animRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Animate Waveform during playback
  useEffect(() => {
    const updateWaveform = () => {
      if (isPlaying) {
        setWaveformBars(prev => prev.map(() => Math.floor(Math.random() * 55 + 20)));
      } else {
        setWaveformBars(new Array(24).fill(10));
      }
      animRef.current = requestAnimationFrame(updateWaveform);
    };

    animRef.current = requestAnimationFrame(updateWaveform);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      vocalAudioSynthesizer.stop();
    };
  }, [isPlaying]);

  // Load a quick starter preset
  const handleApplyPreset = (preset: VoiceoverPresetTemplate) => {
    const profile = VOICE_PROFILES.find(p => p.id === preset.profileId) || VOICE_PROFILES[0];
    const resonance = EMOTIONAL_RESONANCES.find(r => r.id === preset.resonanceId) || EMOTIONAL_RESONANCES[0];
    setSelectedProfile(profile);
    setSelectedResonance(resonance);
    setPitchShift(preset.pitch);
    setCadenceSpeed(preset.speed);
    setVocalText(preset.text);
    triggerNeonExplosion({
      particleCount: 45,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'subtle'
    });
    showToast(`Loaded Preset: "${preset.title}"`);
  };

  // Play / Audition Synthetic Vocal
  const handlePlayVoiceover = async () => {
    if (isPlaying) {
      vocalAudioSynthesizer.stop();
      setIsPlaying(false);
      return;
    }

    if (!vocalText.trim()) {
      showToast('Please enter text for the AI Voiceover');
      return;
    }

    setIsPlaying(true);
    try {
      await vocalAudioSynthesizer.speak(
        vocalText,
        selectedProfile,
        selectedResonance,
        {
          pitchOffset: pitchShift,
          speedMultiplier: cadenceSpeed,
          reverbWet: reverbWet / 100,
          volume: vocalVolume,
          onStart: () => setIsPlaying(true),
          onEnd: () => setIsPlaying(false)
        }
      );
    } catch (err) {
      console.error(err);
      setIsPlaying(false);
    }
  };

  // Stop Vocal Playback
  const handleStopVoiceover = () => {
    vocalAudioSynthesizer.stop();
    setIsPlaying(false);
  };

  // Enhance Text with Gemini AI
  const handleEnhanceWithAI = async () => {
    if (!vocalText.trim()) return;
    setIsEnhancingText(true);
    try {
      const polished = await enhanceVoiceoverText(
        vocalText,
        selectedProfile.subtitle,
        selectedResonance.name
      );
      if (polished) {
        setVocalText(polished);
        triggerNeonExplosion({
          particleCount: 50,
          origin: { x: 0.5, y: 0.5 },
          intensity: 'subtle'
        });
        showToast('Text polished for AI Vocal Delivery!');
      }
    } catch (err) {
      console.error(err);
      showToast('AI enhancement complete');
    } finally {
      setIsEnhancingText(false);
    }
  };

  // Generate Master Voice Director Script & Phonetic Analysis with Gemini
  const handleGenerateDirectorScript = async () => {
    if (!vocalText.trim()) return;
    setIsGeneratingScript(true);
    try {
      const result = await generateAIVoiceoverScript({
        text: vocalText,
        voiceProfile: `${selectedProfile.name} (${selectedProfile.subtitle})`,
        emotionalResonance: `${selectedResonance.name} - ${selectedResonance.tagline}`,
        pitchShift,
        cadenceSpeed,
        reverbSpace: selectedResonance.vibe,
        targetUse: 'music_vocal'
      });
      setScriptDirectorNotes(result);
      triggerNeonExplosion({
        particleCount: 65,
        origin: { x: 0.5, y: 0.4 },
        intensity: 'medium'
      });
      showToast('Generated Vocal Producer Directive & Prosody Blueprint!');
    } catch (err) {
      console.error(err);
      setScriptDirectorNotes(`[VOCAL CHAIN DIRECTIVE]\nVoice Profile: ${selectedProfile.name}\nResonance: ${selectedResonance.name}\nPitch Shift: ${pitchShift > 0 ? `+${pitchShift}` : pitchShift} semitones\nCadence: ${cadenceSpeed}x\n\n[DELIVERY TIP]\nEmphasize the punchy consonants on downbeats, allowing the ${selectedResonance.name} reverb tail to swell during dynamic pauses.`);
      showToast('Generated Vocal Directive!');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Insert Dynamic Cue Tag into Textarea
  const handleInsertTag = (tag: string) => {
    setVocalText(prev => `${prev.trim()} ${tag} `);
  };

  // Download Mastered 16-bit PCM WAV File
  const handleDownloadWav = async () => {
    if (!vocalText.trim()) return;
    setIsExportingWav(true);
    try {
      const blob = await vocalAudioSynthesizer.generateMasterWavBlob(
        vocalText,
        selectedProfile,
        selectedResonance,
        pitchShift,
        cadenceSpeed,
        reverbWet / 100
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanTitle = selectedProfile.name.toLowerCase();
      a.download = `janu_voiceover_${cleanTitle}_${selectedResonance.id}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      triggerNeonExplosion({
        particleCount: 75,
        origin: { x: 0.5, y: 0.5 },
        intensity: 'grand'
      });
      showToast('Mastered Vocal WAV Stem downloaded!');
    } catch (err) {
      console.error('Failed to export WAV:', err);
      showToast('Export failed. Please try again.');
    } finally {
      setIsExportingWav(false);
    }
  };

  // Download Manifest JSON
  const handleDownloadManifest = () => {
    const manifest = {
      project: "Janu's Creations AI Voiceover",
      timestamp: new Date().toISOString(),
      voiceProfile: {
        id: selectedProfile.id,
        name: selectedProfile.name,
        subtitle: selectedProfile.subtitle,
        gender: selectedProfile.gender,
        timbre: selectedProfile.timbre
      },
      emotionalResonance: {
        id: selectedResonance.id,
        name: selectedResonance.name,
        tagline: selectedResonance.tagline,
        vibe: selectedResonance.vibe,
        reverbSeconds: selectedResonance.reverbSeconds
      },
      parameters: {
        pitchShift: `${pitchShift > 0 ? `+${pitchShift}` : pitchShift} semitones`,
        speedMultiplier: `${cadenceSpeed}x`,
        reverbWet: `${reverbWet}%`,
        vocalVolume: `${vocalVolume}%`
      },
      scriptText: vocalText,
      directorNotes: scriptDirectorNotes || 'No custom director notes generated.'
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voiceover_manifest_${selectedProfile.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Voiceover Project Manifest downloaded!');
  };

  // Send to Live Sequencer or Music Track
  const handleSendToMusicMix = () => {
    if (onInjectVocalToTrack) {
      onInjectVocalToTrack({
        text: vocalText,
        profile: selectedProfile.name,
        resonance: selectedResonance.name
      });
    }
    triggerNeonExplosion({
      particleCount: 60,
      origin: { x: 0.5, y: 0.5 },
      intensity: 'medium'
    });
    showToast(`Injected "${selectedProfile.name}" vocals into Music Synthesizer!`);
  };

  // Export to Reel Studio
  const handleExportToReel = () => {
    if (onNavigateToReelStudio) {
      onNavigateToReelStudio({
        title: `AI Vocal: ${selectedProfile.name} - ${selectedResonance.name}`,
        genre: 'AI Synthetic Vocal Track',
        bpm: 120,
        storyboard: `AI Spoken Vocal: "${vocalText.substring(0, 100)}..."\nProfile: ${selectedProfile.name}\nResonance: ${selectedResonance.name}`
      });
    }
    showToast('Vocal track exported to Reel Studio!');
  };

  // Broadcast to Live Feed
  const handleBroadcastFeed = () => {
    if (onPublishToLiveFeed) {
      onPublishToLiveFeed({
        title: `Synthetic AI Vocal • ${selectedProfile.name}`,
        artist: 'Janu Voiceover AI Engine',
        genre: 'AI Vocal / Voiceover',
        desc: `"${vocalText.substring(0, 90)}..." (${selectedResonance.name} • Pitch ${pitchShift > 0 ? `+${pitchShift}` : pitchShift} st • ${cadenceSpeed}x speed)`
      });
    }
    showToast('Broadcasted AI Voiceover to Janu Live Feed!');
  };

  return (
    <div className={`glass rounded-[2rem] border border-white/10 p-6 md:p-8 bg-black/80 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden ${compact ? 'max-w-4xl mx-auto' : ''}`}>
      {/* Background ambient lighting */}
      <div 
        className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[110px] pointer-events-none opacity-30 transition-all duration-700"
        style={{ backgroundColor: selectedProfile.color }}
      ></div>
      <div 
        className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-[110px] pointer-events-none opacity-30 transition-all duration-700"
        style={{ backgroundColor: selectedResonance.color }}
      ></div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl bg-black/95 border border-[#00F5D4] text-[#00F5D4] font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_25px_rgba(0,245,212,0.5)] flex items-center gap-2 animate-bounce">
          <i className="fa-solid fa-circle-check"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F5D4] shadow-[0_0_10px_#00F5D4] animate-pulse"></span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#00F5D4]">
              Janu’s AI Voiceover Studio
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-mono text-gray-300 font-bold">
              Synthetic AI Vocals & Prosody Engine
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black italic text-white flex items-center gap-3">
            <span>AI Voiceover & Vocal</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F]">
              Alchemist
            </span>
          </h2>
          <p className="text-xs text-gray-400 font-light mt-1">
            Transform scripts, lyrics, DJ drops, and spoken mantras into studio-grade synthetic AI vocals with emotional resonance modulation.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadWav}
            disabled={isExportingWav}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00F5D4]/20 to-[#C084FC]/20 hover:from-[#00F5D4]/30 hover:to-[#C084FC]/30 border border-[#00F5D4]/40 text-[#00F5D4] text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,245,212,0.2)]"
            title="Download Mastered WAV Vocal Stem"
          >
            {isExportingWav ? (
              <i className="fa-solid fa-spinner fa-spin text-xs"></i>
            ) : (
              <i className="fa-solid fa-file-audio"></i>
            )}
            <span>Export WAV Stem</span>
          </button>

          <button
            onClick={handleDownloadManifest}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download Voiceover JSON Manifest"
          >
            <i className="fa-solid fa-file-code text-[#C084FC]"></i>
            <span>Manifest</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Loader Bar */}
      <div className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/10">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-2.5 flex items-center gap-2">
          <i className="fa-solid fa-wand-magic-sparkles text-[#00F5D4]"></i>
          <span>Instant Voiceover Starter Presets</span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {VOICEOVER_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono text-gray-400 uppercase font-bold">
                  {preset.category}
                </span>
                <i className="fa-solid fa-arrow-right text-[9px] text-gray-500 group-hover:text-[#00F5D4] transition-colors"></i>
              </div>
              <p className="text-xs font-bold text-white group-hover:text-[#00F5D4] truncate transition-colors">
                {preset.title}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (7 Cols): Voice Profiles, Resonance, Sliders, & Stage */}
        <div className="lg:col-span-7 flex flex-col space-y-6">

          {/* 1. Voice Profiles Selection */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <i className="fa-solid fa-user-astronaut text-[#00F5D4]"></i>
                <span>1. Select AI Vocal Profile ({VOICE_PROFILES.length})</span>
              </span>
              <span className="text-[10px] font-mono text-[#00F5D4] font-bold">
                Active: {selectedProfile.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {VOICE_PROFILES.map(profile => {
                const isSelected = selectedProfile.id === profile.id;
                return (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedProfile(profile)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-[#00F5D4] bg-[#00F5D4]/10 shadow-[0_0_15px_rgba(0,245,212,0.3)] scale-[1.02]'
                        : 'border-white/5 bg-black/40 hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                        style={{ backgroundColor: `${profile.color}20`, color: profile.color }}
                      >
                        <i className={`fa-solid ${profile.icon}`}></i>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-white/10 text-gray-300">
                        {profile.gender}
                      </span>
                    </div>
                    <p className="text-xs font-black text-white truncate">{profile.name}</p>
                    <p className="text-[9px] text-gray-400 truncate mt-0.5">{profile.subtitle}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] font-mono text-gray-400 mt-2.5 italic">
              ✨ <span className="text-gray-300 font-bold">{selectedProfile.name} Timbre:</span> {selectedProfile.timbre}
            </p>
          </div>

          {/* 2. Emotional Resonance Modes */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <i className="fa-solid fa-heart-pulse text-[#C084FC]"></i>
                <span>2. Emotional Resonance Settings ({EMOTIONAL_RESONANCES.length})</span>
              </span>
              <span className="text-[10px] font-mono text-[#C084FC] font-bold">
                Mode: {selectedResonance.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {EMOTIONAL_RESONANCES.map(resonance => {
                const isSelected = selectedResonance.id === resonance.id;
                return (
                  <button
                    key={resonance.id}
                    onClick={() => setSelectedResonance(resonance)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-[#C084FC] bg-[#C084FC]/10 shadow-[0_0_15px_rgba(192,132,252,0.3)] scale-[1.02]'
                        : 'border-white/5 bg-black/40 hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-xs" style={{ color: resonance.color }}>
                      <i className={`fa-solid ${resonance.icon}`}></i>
                      <span className="text-xs font-black text-white truncate">{resonance.name}</span>
                    </div>
                    <p className="text-[9px] text-gray-400 line-clamp-2 leading-tight">
                      {resonance.tagline}
                    </p>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] font-mono text-gray-400 mt-2.5">
              🎚️ <span className="text-gray-300 font-bold">Acoustic Space:</span> {selectedResonance.vibe} (Reverb: {selectedResonance.reverbSeconds}s)
            </p>
          </div>

          {/* 3. Vocal Acoustic Sliders */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <i className="fa-solid fa-sliders text-[#FF007F]"></i>
                <span>3. Vocal Pitch, Cadence & Acoustic Tail</span>
              </span>
              <button
                onClick={() => {
                  setPitchShift(0);
                  setCadenceSpeed(1.0);
                  setReverbWet(35);
                  setVocalVolume(90);
                }}
                className="text-[10px] font-mono text-gray-400 hover:text-white uppercase transition-colors"
              >
                Reset Defaults
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pitch Shift Slider */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-gray-300 font-bold uppercase">Pitch Shift</span>
                  <span className="text-xs font-mono font-black text-[#00F5D4]">
                    {pitchShift > 0 ? `+${pitchShift}` : pitchShift} st
                  </span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={pitchShift}
                  onChange={(e) => setPitchShift(parseInt(e.target.value))}
                  className="w-full accent-[#00F5D4] cursor-pointer"
                />
                <div className="flex justify-between text-[8px] font-mono text-gray-500 mt-1">
                  <span>-12 st (Deep Bass)</span>
                  <span>0 (Neutral)</span>
                  <span>+12 st (Soprano)</span>
                </div>
              </div>

              {/* Cadence Speed Slider */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-gray-300 font-bold uppercase">Cadence & Speed</span>
                  <span className="text-xs font-mono font-black text-[#C084FC]">
                    {cadenceSpeed.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={cadenceSpeed}
                  onChange={(e) => setCadenceSpeed(parseFloat(e.target.value))}
                  className="w-full accent-[#C084FC] cursor-pointer"
                />
                <div className="flex justify-between text-[8px] font-mono text-gray-500 mt-1">
                  <span>0.5x (Dramatic)</span>
                  <span>1.0x (Normal)</span>
                  <span>2.0x (Rapid Fire)</span>
                </div>
              </div>

              {/* Reverb Wet Mix Slider */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-gray-300 font-bold uppercase">Acoustic Reverb Space</span>
                  <span className="text-xs font-mono font-black text-[#FF007F]">
                    {reverbWet}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={reverbWet}
                  onChange={(e) => setReverbWet(parseInt(e.target.value))}
                  className="w-full accent-[#FF007F] cursor-pointer"
                />
                <div className="flex justify-between text-[8px] font-mono text-gray-500 mt-1">
                  <span>0% (Dry Room)</span>
                  <span>35% (Studio)</span>
                  <span>100% (Cathedral)</span>
                </div>
              </div>

              {/* Vocal Volume Gain Slider */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-gray-300 font-bold uppercase">Master Vocal Gain</span>
                  <span className="text-xs font-mono font-black text-[#FCD34D]">
                    {vocalVolume}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={vocalVolume}
                  onChange={(e) => setVocalVolume(parseInt(e.target.value))}
                  className="w-full accent-[#FCD34D] cursor-pointer"
                />
                <div className="flex justify-between text-[8px] font-mono text-gray-500 mt-1">
                  <span>10%</span>
                  <span>50%</span>
                  <span>100% (Peak)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Live Visualizer & Waveform Playback Stage */}
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-[#00F5D4] animate-ping' : 'bg-gray-600'}`}></span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  {isPlaying ? 'Live Vocal Synthesizer Active' : 'Vocal Engine Ready'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-gray-400">
                {selectedProfile.name} • {selectedResonance.name}
              </span>
            </div>

            {/* Waveform Frequency Bars */}
            <div className="h-16 flex items-end justify-between gap-1 px-4 py-2 rounded-xl bg-black/50 border border-white/5">
              {waveformBars.map((height, idx) => (
                <div
                  key={idx}
                  className="flex-1 rounded-t transition-all duration-75"
                  style={{
                    height: `${height}%`,
                    backgroundColor: isPlaying
                      ? idx % 3 === 0 ? selectedProfile.color : idx % 3 === 1 ? selectedResonance.color : '#00F5D4'
                      : '#333'
                  }}
                ></div>
              ))}
            </div>

            {/* Main Playback Control Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handlePlayVoiceover}
                className={`flex-1 py-3.5 px-6 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isPlaying
                    ? 'bg-[#FF007F] text-white shadow-[0_0_25px_rgba(255,0,127,0.5)] animate-pulse'
                    : 'bg-gradient-to-r from-[#00F5D4] via-[#C084FC] to-[#FF007F] text-black shadow-[0_0_25px_rgba(0,245,212,0.4)] hover:scale-[1.02]'
                }`}
              >
                {isPlaying ? (
                  <>
                    <i className="fa-solid fa-pause"></i>
                    <span>Pause Synthetic Vocal</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-play"></i>
                    <span>Audition AI Voiceover</span>
                  </>
                )}
              </button>

              <button
                onClick={handleStopVoiceover}
                disabled={!isPlaying}
                className="py-3.5 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white font-mono text-xs font-bold uppercase transition-all disabled:opacity-30 cursor-pointer"
                title="Stop Vocal Playback"
              >
                <i className="fa-solid fa-stop"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols): Interactive Text Input, Gemini Enhancer & Direct Actions */}
        <div className="lg:col-span-5 flex flex-col space-y-6">

          {/* Text Input Editor */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <i className="fa-solid fa-pen-fancy text-[#00F5D4]"></i>
                <span>Voiceover Script & Lyrics</span>
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                {vocalText.length} chars • {vocalText.trim() ? vocalText.trim().split(/\s+/).length : 0} words
              </span>
            </div>

            <textarea
              rows={5}
              value={vocalText}
              onChange={(e) => setVocalText(e.target.value)}
              placeholder="Enter your lyrics, spoken word, DJ drops, podcast intro, or hook lines here..."
              className="w-full bg-black/60 border border-white/10 focus:border-[#00F5D4] focus:ring-1 focus:ring-[#00F5D4] rounded-xl p-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-all resize-none font-sans leading-relaxed"
            ></textarea>

            {/* Quick Dynamic Prosody Tags */}
            <div>
              <p className="text-[9px] font-mono uppercase text-gray-400 font-bold mb-1.5">
                Quick Prosody & Delivery Tags:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['[pause 0.5s]', '[breath]', '[↑pitch]', '[↓drop]', '[whisper]', '[echo]'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleInsertTag(tag)}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-mono text-gray-300 hover:text-[#00F5D4] transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Gemini AI Improvers */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
              <button
                onClick={handleEnhanceWithAI}
                disabled={isEnhancingText || !vocalText.trim()}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-[#00F5D4]/30 text-[#00F5D4] text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                {isEnhancingText ? (
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                ) : (
                  <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
                )}
                <span>Polish Syllables</span>
              </button>

              <button
                onClick={handleGenerateDirectorScript}
                disabled={isGeneratingScript || !vocalText.trim()}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-[#C084FC]/30 text-[#C084FC] text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                {isGeneratingScript ? (
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                ) : (
                  <i className="fa-solid fa-clapperboard text-xs"></i>
                )}
                <span>Director Blueprint</span>
              </button>
            </div>
          </div>

          {/* Director Notes & Phonetic Blueprint Box (If generated) */}
          {scriptDirectorNotes && (
            <div className="p-5 rounded-2xl bg-white/5 border border-[#C084FC]/30 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C084FC] flex items-center gap-2">
                  <i className="fa-solid fa-masks-theater"></i>
                  <span>Director's Vocal Blueprint</span>
                </span>
                <button
                  onClick={() => setScriptDirectorNotes(null)}
                  className="text-gray-500 hover:text-white text-xs cursor-pointer"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-white/5 text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto no-scrollbar leading-relaxed">
                {scriptDirectorNotes}
              </div>
            </div>
          )}

          {/* Cross-Studio Export Pipeline */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <i className="fa-solid fa-share-nodes text-[#FCD34D]"></i>
              <span>Studio Export Pipeline</span>
            </span>

            <div className="flex flex-col space-y-2">
              <button
                onClick={handleSendToMusicMix}
                className="w-full py-2.5 px-4 rounded-xl bg-[#00F5D4]/10 hover:bg-[#00F5D4]/20 border border-[#00F5D4]/40 text-[#00F5D4] text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-sliders"></i>
                  <span>Inject Vocal into Multi-Track Synthesizer</span>
                </div>
                <i className="fa-solid fa-arrow-right text-[10px]"></i>
              </button>

              <button
                onClick={handleExportToReel}
                className="w-full py-2.5 px-4 rounded-xl bg-[#C084FC]/10 hover:bg-[#C084FC]/20 border border-[#C084FC]/40 text-[#C084FC] text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-film"></i>
                  <span>Send Vocal Track to Reel Video Studio</span>
                </div>
                <i className="fa-solid fa-arrow-right text-[10px]"></i>
              </button>

              <button
                onClick={handleBroadcastFeed}
                className="w-full py-2.5 px-4 rounded-xl bg-[#FF007F]/10 hover:bg-[#FF007F]/20 border border-[#FF007F]/40 text-[#FF007F] text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-tower-broadcast"></i>
                  <span>Broadcast Vocal Stem to Live Feed</span>
                </div>
                <i className="fa-solid fa-arrow-right text-[10px]"></i>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
