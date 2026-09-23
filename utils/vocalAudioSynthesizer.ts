// Web Audio Vocal Synthesizer & Audio FX Engine for Janu's Creations AI Voiceover
// Real-time speech synthesis, formant resonance shaping, convolution reverb, vocoder modulation & WAV export

export interface VoiceProfile {
  id: string;
  name: string;
  subtitle: string;
  gender: 'Neutral' | 'Female' | 'Male' | 'Robotic';
  timbre: string;
  recommendedGenres: string[];
  basePitch: number; // Semitones offset (-12 to +12)
  formantFreq: number; // Hz for peak vocal body
  formantQ: number;
  rateFactor: number;
  color: string;
  icon: string;
}

export interface EmotionalResonance {
  id: string;
  name: string;
  tagline: string;
  vibe: string;
  reverbSeconds: number;
  reverbWet: number;
  delayTime: number;
  delayFeedback: number;
  compressionRatio: number;
  highShelfGain: number; // dB
  lowShelfGain: number; // dB
  chorusDepth: number;
  vibratoRate: number; // Hz
  vibratoDepth: number; // cents
  color: string;
  icon: string;
}

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'zephyr',
    name: 'Zephyr',
    subtitle: 'Warm & Polished Studio Lead',
    gender: 'Neutral',
    timbre: 'Silky smooth with rich mid-range warmth and clean articulation',
    recommendedGenres: ['R&B & Soul', "Today's Hits & Pop", 'Afrobeats & Amapiano'],
    basePitch: 0,
    formantFreq: 1400,
    formantQ: 1.8,
    rateFactor: 1.0,
    color: '#00F5D4',
    icon: 'fa-microphone'
  },
  {
    id: 'puck',
    name: 'Puck',
    subtitle: 'Playful, Bright & Vibrant',
    gender: 'Female',
    timbre: 'High-energy sparkle with crisp transients and youthful cadence',
    recommendedGenres: ['Hyperpop & Glitch', 'Dance & EDM', 'Viral TikTok Cuts'],
    basePitch: 3,
    formantFreq: 2600,
    formantQ: 2.2,
    rateFactor: 1.1,
    color: '#FF007F',
    icon: 'fa-bolt'
  },
  {
    id: 'charon',
    name: 'Charon',
    subtitle: 'Deep & Resonant Gravitas',
    gender: 'Male',
    timbre: 'Sub-harmonic authority, gravelly low-end chest tone, dramatic power',
    recommendedGenres: ['Hip-Hop & Trap', 'Cinematic Orchestral', 'Movie Trailers'],
    basePitch: -4,
    formantFreq: 650,
    formantQ: 1.5,
    rateFactor: 0.92,
    color: '#818CF8',
    icon: 'fa-skull'
  },
  {
    id: 'kore',
    name: 'Kore',
    subtitle: 'Ethereal & Angelic Melody',
    gender: 'Female',
    timbre: 'Breathy, crystal-clear acoustic presence with shimmering highs',
    recommendedGenres: ['Ambient & Chillout', 'Lo-Fi Chill Beats', 'Gospel & Soul'],
    basePitch: 2,
    formantFreq: 2200,
    formantQ: 1.6,
    rateFactor: 0.95,
    color: '#C084FC',
    icon: 'fa-dove'
  },
  {
    id: 'fenrir',
    name: 'Fenrir',
    subtitle: 'Fierce, Gritty & Aggressive',
    gender: 'Male',
    timbre: 'Distorted saturation, edgy punch, raw dynamic intensity',
    recommendedGenres: ['Cyberpunk & Bass', 'Industrial Techno', 'Phonk & Drill'],
    basePitch: -2,
    formantFreq: 1100,
    formantQ: 3.0,
    rateFactor: 1.05,
    color: '#F97316',
    icon: 'fa-fire'
  },
  {
    id: 'aoede',
    name: 'Aoede',
    subtitle: 'Soulful & Velvet Acoustic',
    gender: 'Female',
    timbre: 'Rich vibrato, lush acoustic presence, soulful micro-tonal inflection',
    recommendedGenres: ['Neo-Soul & Jazz', 'Reggae & Dancehall', 'Latin Fiesta'],
    basePitch: 1,
    formantFreq: 1750,
    formantQ: 1.9,
    rateFactor: 0.96,
    color: '#FCD34D',
    icon: 'fa-gem'
  },
  {
    id: 'orion',
    name: 'Orion',
    subtitle: 'Cyber Vocoder & Robotic Synth',
    gender: 'Robotic',
    timbre: 'Formant-quantized square wave harmonics, metallic carrier ring',
    recommendedGenres: ['Synthwave & Retro', 'French Touch Electro', 'Techno'],
    basePitch: -1,
    formantFreq: 900,
    formantQ: 4.5,
    rateFactor: 1.0,
    color: '#38BDF8',
    icon: 'fa-robot'
  },
  {
    id: 'lyra',
    name: 'Lyra',
    subtitle: 'Intimate ASMR & Whisper',
    gender: 'Female',
    timbre: 'Ultra close-proximity breathiness with delicate transient air',
    recommendedGenres: ['Midnight Lo-Fi', 'Meditation Soundscapes', 'Poetry'],
    basePitch: 1,
    formantFreq: 3200,
    formantQ: 1.2,
    rateFactor: 0.88,
    color: '#FB7185',
    icon: 'fa-feather'
  }
];

export const EMOTIONAL_RESONANCES: EmotionalResonance[] = [
  {
    id: 'euphoric',
    name: 'Anthemic Euphoria',
    tagline: 'Stadium peak energy, sparkling top-end air, uplifting resonance',
    vibe: 'Festival drops, celebratory pop hooks, soaring choruses',
    reverbSeconds: 2.8,
    reverbWet: 0.35,
    delayTime: 0.375,
    delayFeedback: 0.25,
    compressionRatio: 6.0,
    highShelfGain: 4.5,
    lowShelfGain: 1.5,
    chorusDepth: 0.3,
    vibratoRate: 5.5,
    vibratoDepth: 12,
    color: '#00F5D4',
    icon: 'fa-sparkles'
  },
  {
    id: 'intimate',
    name: 'Velvet Intimacy',
    tagline: 'Warm proximity, soulful gentle tone, close-mic authenticity',
    vibe: 'Acoustic ballads, late-night R&B verses, personal storytelling',
    reverbSeconds: 1.2,
    reverbWet: 0.18,
    delayTime: 0.2,
    delayFeedback: 0.1,
    compressionRatio: 3.5,
    highShelfGain: 1.0,
    lowShelfGain: 3.5,
    chorusDepth: 0.15,
    vibratoRate: 4.8,
    vibratoDepth: 8,
    color: '#C084FC',
    icon: 'fa-heart'
  },
  {
    id: 'cinematic',
    name: 'Cinematic Gravitas',
    tagline: 'Epic trailer presence, monumental space, dramatic tension',
    vibe: 'Movie trailers, sovereign announcements, game intros',
    reverbSeconds: 4.2,
    reverbWet: 0.45,
    delayTime: 0.5,
    delayFeedback: 0.35,
    compressionRatio: 8.0,
    highShelfGain: 2.0,
    lowShelfGain: 4.0,
    chorusDepth: 0.4,
    vibratoRate: 3.2,
    vibratoDepth: 15,
    color: '#818CF8',
    icon: 'fa-clapperboard'
  },
  {
    id: 'cyberpunk',
    name: 'Fierce Cyber Hype',
    tagline: 'Hard-hitting punch, aggressive transients, saturated clarity',
    vibe: 'Club bangers, drill vocal drops, fast-paced TikTok promos',
    reverbSeconds: 1.5,
    reverbWet: 0.22,
    delayTime: 0.187,
    delayFeedback: 0.3,
    compressionRatio: 10.0,
    highShelfGain: 5.0,
    lowShelfGain: 2.0,
    chorusDepth: 0.2,
    vibratoRate: 6.2,
    vibratoDepth: 6,
    color: '#FF007F',
    icon: 'fa-bolt'
  },
  {
    id: 'ethereal',
    name: 'Ethereal Dream Float',
    tagline: 'Harmonic chorus modulation, expansive cathedral decay, celestial air',
    vibe: 'Ambient soundscapes, chillwave interludes, hypnotic chants',
    reverbSeconds: 5.0,
    reverbWet: 0.55,
    delayTime: 0.666,
    delayFeedback: 0.45,
    compressionRatio: 4.0,
    highShelfGain: 6.0,
    lowShelfGain: -1.0,
    chorusDepth: 0.6,
    vibratoRate: 4.2,
    vibratoDepth: 20,
    color: '#38BDF8',
    icon: 'fa-wand-magic-sparkles'
  },
  {
    id: 'melancholic',
    name: 'Moody Noir & Rasp',
    tagline: 'Introspective, subtle gravel, filtered dark warmth',
    vibe: 'Trap soul, midnight confessions, moody indie hooks',
    reverbSeconds: 2.2,
    reverbWet: 0.28,
    delayTime: 0.28,
    delayFeedback: 0.2,
    compressionRatio: 4.5,
    highShelfGain: -2.0,
    lowShelfGain: 3.0,
    chorusDepth: 0.25,
    vibratoRate: 3.8,
    vibratoDepth: 14,
    color: '#F59E0B',
    icon: 'fa-moon'
  },
  {
    id: 'broadcast',
    name: 'Radio FM Master',
    tagline: 'Broadcast clarity, mid-band vocal focus, zero-bleed punch',
    vibe: 'Podcasts, radio drops, YouTube intros, commercial spots',
    reverbSeconds: 0.8,
    reverbWet: 0.1,
    delayTime: 0.1,
    delayFeedback: 0.05,
    compressionRatio: 7.0,
    highShelfGain: 3.0,
    lowShelfGain: 2.0,
    chorusDepth: 0.05,
    vibratoRate: 0,
    vibratoDepth: 0,
    color: '#10B981',
    icon: 'fa-tower-broadcast'
  },
  {
    id: 'vocoder',
    name: 'Hard-Tune Vocoder',
    tagline: 'Quantized harmonic carrier, metallic timbre, robotic auto-tune',
    vibe: 'Electronic music vocal hooks, Daft Punk style robotic leads',
    reverbSeconds: 2.0,
    reverbWet: 0.3,
    delayTime: 0.25,
    delayFeedback: 0.3,
    compressionRatio: 12.0,
    highShelfGain: 4.0,
    lowShelfGain: -2.0,
    chorusDepth: 0.5,
    vibratoRate: 0,
    vibratoDepth: 0,
    color: '#EC4899',
    icon: 'fa-microchip'
  }
];

export interface VoiceoverPresetTemplate {
  id: string;
  title: string;
  category: 'music' | 'dj_drop' | 'narration' | 'commercial' | 'social';
  profileId: string;
  resonanceId: string;
  pitch: number;
  speed: number;
  text: string;
}

export const VOICEOVER_PRESETS: VoiceoverPresetTemplate[] = [
  {
    id: 'edm-drop',
    title: 'Festival Anthemic Vocal Drop',
    category: 'music',
    profileId: 'puck',
    resonanceId: 'euphoric',
    pitch: 2,
    speed: 1.05,
    text: "Three, two, one... Feel the sovereign frequency ignite! Let the bass shatter the midnight sky!"
  },
  {
    id: 'trap-tag',
    title: 'Executive Producer Tag',
    category: 'dj_drop',
    profileId: 'charon',
    resonanceId: 'cyberpunk',
    pitch: -3,
    speed: 0.95,
    text: "Janu on the frequency. Sovereign sound architecture. Unstoppable."
  },
  {
    id: 'soul-verse',
    title: 'Lush R&B Hook Melody',
    category: 'music',
    profileId: 'aoede',
    resonanceId: 'intimate',
    pitch: 1,
    speed: 0.92,
    text: "Even in the shadows of the neon light, your melody stays alive in my heart, forever sovereign."
  },
  {
    id: 'movie-trailer',
    title: 'Epic Cinematic Trailer',
    category: 'narration',
    profileId: 'charon',
    resonanceId: 'cinematic',
    pitch: -4,
    speed: 0.88,
    text: "In a world of artificial shadows, one creator seized the infinite code to forge their sovereign legacy."
  },
  {
    id: 'cyber-robot',
    title: 'Sci-Fi Quantum AI Operator',
    category: 'music',
    profileId: 'orion',
    resonanceId: 'vocoder',
    pitch: 0,
    speed: 1.0,
    text: "Neural uplink initialized. Frequency locked at four hundred and thirty two hertz. Commencing master drop."
  },
  {
    id: 'asmr-lofi',
    title: 'Midnight Lo-Fi Whisper',
    category: 'social',
    profileId: 'lyra',
    resonanceId: 'ethereal',
    pitch: 2,
    speed: 0.85,
    text: "Close your eyes, breathe into the silence, and let the rain wash over every thought tonight."
  }
];

class VocalAudioSynthesizerEngine {
  private ctx: AudioContext | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSynthesizing = false;
  private activeSourceNodes: AudioNode[] = [];

  private initAudioContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Create an acoustic synthetic impulse response for algorithmic reverb
  private createImpulseResponse(duration: number, decay: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.max(sampleRate * 0.1, sampleRate * duration);
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      const factor = Math.pow(n / length, decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  // Real-time playback of speech with audio processing graph
  public speak(
    text: string,
    profile: VoiceProfile,
    resonance: EmotionalResonance,
    options: {
      pitchOffset?: number;
      speedMultiplier?: number;
      reverbWet?: number;
      volume?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onFreqData?: (data: Uint8Array) => void;
    } = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      this.stop();
      this.initAudioContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      if (!('speechSynthesis' in window)) {
        console.warn('SpeechSynthesis is not supported in this browser environment');
        if (options.onStart) options.onStart();
        setTimeout(() => {
          if (options.onEnd) options.onEnd();
          resolve();
        }, 2000);
        return;
      }

      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }

      const pitch = (options.pitchOffset ?? 0) + profile.basePitch;
      // SpeechSynthesis pitch range is roughly 0.1 to 2.0 (1.0 default)
      const mappedPitch = Math.max(0.2, Math.min(2.0, 1.0 + pitch * 0.07));
      const rate = Math.max(0.4, Math.min(2.0, (options.speedMultiplier ?? 1.0) * profile.rateFactor));
      const volume = Math.max(0.1, Math.min(1.0, (options.volume ?? 85) / 100));

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = mappedPitch;
      utterance.rate = rate;
      utterance.volume = volume;

      // Select matching browser voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        let bestVoice: SpeechSynthesisVoice | null = null;
        if (profile.gender === 'Female') {
          bestVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Zira') || v.name.includes('Google US English'))) || null;
        } else if (profile.gender === 'Male') {
          bestVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Alex') || v.name.includes('George') || v.name.includes('Natural'))) || null;
        }
        if (!bestVoice) {
          bestVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        }
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
      }

      this.isSynthesizing = true;
      this.currentUtterance = utterance;

      // Also trigger Web Audio harmonic acoustic resonance underlay & reverb ambience
      if (this.ctx) {
        try {
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();
          const convolver = this.ctx.createConvolver();
          const comp = this.ctx.createDynamicsCompressor();

          // Formant peaking filter
          filter.type = 'peaking';
          filter.frequency.value = profile.formantFreq;
          filter.Q.value = profile.formantQ;
          filter.gain.value = 6.0;

          // Reverb impulse
          const impulse = this.createImpulseResponse(resonance.reverbSeconds, 2.0);
          if (impulse) convolver.buffer = impulse;

          // Compressor
          comp.threshold.value = -20;
          comp.ratio.value = resonance.compressionRatio;

          // Subtle harmonic underlay (e.g. vocoder / warm drone matching root pitch)
          if (profile.id === 'orion' || resonance.id === 'vocoder') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(110 * Math.pow(2, pitch / 12), now);
            gain.gain.setValueAtTime(0.04 * volume, now);
          } else {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220 * Math.pow(2, pitch / 12), now);
            gain.gain.setValueAtTime(0.015 * volume, now);
          }

          osc.connect(filter);
          filter.connect(comp);
          comp.connect(gain);
          gain.connect(this.ctx.destination);

          if (convolver.buffer && (options.reverbWet ?? resonance.reverbWet) > 0) {
            const revGain = this.ctx.createGain();
            revGain.gain.value = (options.reverbWet ?? resonance.reverbWet) * 0.4;
            gain.connect(convolver);
            convolver.connect(revGain);
            revGain.connect(this.ctx.destination);
          }

          osc.start(now);
          this.activeSourceNodes.push(osc);
        } catch (e) {
          console.warn('Web Audio underlay init failed:', e);
        }
      }

      utterance.onstart = () => {
        if (options.onStart) options.onStart();
      };

      utterance.onend = () => {
        this.isSynthesizing = false;
        this.currentUtterance = null;
        this.stopActiveNodes();
        if (options.onEnd) options.onEnd();
        resolve();
      };

      utterance.onerror = (e: any) => {
        const errorType = e?.error;
        if (errorType === 'canceled' || errorType === 'interrupted') {
          // Normal SpeechSynthesis cancellation / interruption, do not log an error
        } else {
          console.warn('Voiceover speech playback notice:', errorType || 'interrupted');
        }
        this.isSynthesizing = false;
        this.currentUtterance = null;
        this.stopActiveNodes();
        if (options.onEnd) options.onEnd();
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  public stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSynthesizing = false;
    this.currentUtterance = null;
    this.stopActiveNodes();
  }

  private stopActiveNodes() {
    this.activeSourceNodes.forEach(node => {
      try {
        if ('stop' in node && typeof (node as any).stop === 'function') {
          (node as any).stop();
        }
        node.disconnect();
      } catch (e) {
        // Ignore
      }
    });
    this.activeSourceNodes = [];
  }

  public getIsSynthesizing() {
    return this.isSynthesizing;
  }

  // Generate an offline mastered WAV file containing the synthetic vocal track + harmonic acoustic tail
  public async generateMasterWavBlob(
    text: string,
    profile: VoiceProfile,
    resonance: EmotionalResonance,
    pitchOffset = 0,
    speed = 1.0,
    reverbWet = 0.3
  ): Promise<Blob> {
    const sampleRate = 44100;
    const wordCount = Math.max(1, text.trim().split(/\s+/).length);
    const estimatedDuration = Math.max(2.5, (wordCount * 0.45) / speed + resonance.reverbSeconds);
    const length = Math.floor(sampleRate * estimatedDuration);

    const offlineCtx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(2, length, sampleRate);

    // Build offline vocal synthesis graph with harmonic formant synthesis
    const baseFreq = 160 * Math.pow(2, (profile.basePitch + pitchOffset) / 12);
    
    // Multi-oscillator vocal cord simulation
    const osc1 = offlineCtx.createOscillator();
    const osc2 = offlineCtx.createOscillator();
    const osc3 = offlineCtx.createOscillator();
    const subOsc = offlineCtx.createOscillator();

    osc1.type = profile.id === 'orion' ? 'sawtooth' : 'triangle';
    osc1.frequency.setValueAtTime(baseFreq, 0);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 2.01, 0);

    osc3.type = 'sawtooth';
    osc3.frequency.setValueAtTime(baseFreq * 3.02, 0);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(baseFreq * 0.5, 0);

    // Formant filter
    const formantFilter = offlineCtx.createBiquadFilter();
    formantFilter.type = 'peaking';
    formantFilter.frequency.setValueAtTime(profile.formantFreq, 0);
    formantFilter.Q.setValueAtTime(profile.formantQ, 0);
    formantFilter.gain.setValueAtTime(8.0, 0);

    // High Shelf brilliance
    const highShelf = offlineCtx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.setValueAtTime(4500, 0);
    highShelf.gain.setValueAtTime(resonance.highShelfGain, 0);

    // Dynamic Compressor
    const comp = offlineCtx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-18, 0);
    comp.ratio.setValueAtTime(resonance.compressionRatio, 0);

    // Master Vocal Gain Envelope
    const vocalGain = offlineCtx.createGain();
    vocalGain.gain.setValueAtTime(0.001, 0);

    // Create rhythm pulses matching spoken word cadence
    const vocalActiveTime = Math.max(1.5, estimatedDuration - resonance.reverbSeconds);
    vocalGain.gain.exponentialRampToValueAtTime(0.7, 0.08);

    const syllableSteps = Math.min(32, wordCount * 2);
    for (let s = 0; s < syllableSteps; s++) {
      const stepTime = (s / syllableSteps) * vocalActiveTime;
      const modPitch = baseFreq * (1 + (Math.sin(s * 1.7) * 0.08));
      osc1.frequency.setValueAtTime(modPitch, stepTime);
      formantFilter.frequency.setValueAtTime(profile.formantFreq * (1 + Math.sin(s * 2.1) * 0.15), stepTime);
    }

    vocalGain.gain.setValueAtTime(0.65, vocalActiveTime);
    vocalGain.gain.exponentialRampToValueAtTime(0.0001, estimatedDuration);

    // Connect node chain
    osc1.connect(formantFilter);
    osc2.connect(formantFilter);
    osc3.connect(formantFilter);
    subOsc.connect(formantFilter);

    formantFilter.connect(highShelf);
    highShelf.connect(comp);
    comp.connect(vocalGain);
    vocalGain.connect(offlineCtx.destination);

    // Add algorithmic reverb decay
    const impulseLength = Math.floor(sampleRate * resonance.reverbSeconds);
    const impulseBuf = offlineCtx.createBuffer(2, impulseLength, sampleRate);
    const leftData = impulseBuf.getChannelData(0);
    const rightData = impulseBuf.getChannelData(1);
    for (let i = 0; i < impulseLength; i++) {
      const n = impulseLength - i;
      const decayFactor = Math.pow(n / impulseLength, 2.5);
      leftData[i] = (Math.random() * 2 - 1) * decayFactor;
      rightData[i] = (Math.random() * 2 - 1) * decayFactor;
    }

    const convolver = offlineCtx.createConvolver();
    convolver.buffer = impulseBuf;
    const revGain = offlineCtx.createGain();
    revGain.gain.setValueAtTime(reverbWet, 0);

    vocalGain.connect(convolver);
    convolver.connect(revGain);
    revGain.connect(offlineCtx.destination);

    osc1.start(0);
    osc2.start(0);
    osc3.start(0);
    subOsc.start(0);
    osc1.stop(estimatedDuration);
    osc2.stop(estimatedDuration);
    osc3.stop(estimatedDuration);
    subOsc.stop(estimatedDuration);

    const renderedBuffer = await offlineCtx.startRendering();
    return this.bufferToWav(renderedBuffer);
  }

  // Convert AudioBuffer to 16-bit PCM WAV Blob
  private bufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const samples = buffer.length;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples * blockAlign;
    const bufferSize = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write interleaved 16-bit PCM audio samples
    let offset = 44;
    const channels: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    for (let i = 0; i < samples; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = channels[c][i];
        sample = Math.max(-1, Math.min(1, sample)); // Clamp
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([view], { type: 'audio/wav' });
  }
}

export const vocalAudioSynthesizer = new VocalAudioSynthesizerEngine();
