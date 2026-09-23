// High-End Ambient Synth-Wave Soundscape Synthesizer for Janu's Creations
// Generates subtle, generative analog synth-wave chords, warm pads, and binaural focus drones in real-time

export interface SoundscapeTrack {
  id: string;
  name: string;
  genre: string;
  description: string;
  baseFreq: number; // Hz
  tempo: number; // BPM for chord shift
  chordProgression: number[][]; // Multi-oscillator frequencies
  color: string;
  badge: string;
}

export const SOUNDSCAPE_TRACKS: SoundscapeTrack[] = [
  {
    id: 'cyber-midnight',
    name: 'Midnight Cyberpulse',
    genre: '432Hz Retro Synthwave',
    description: 'Warm analog minor-9th pads with slow resonant lowpass filter sweeps and tape chorus.',
    baseFreq: 432,
    tempo: 45,
    chordProgression: [
      [144, 216, 256.87, 324, 432],    // Dm9 (432Hz tuned)
      [114.67, 172, 229.34, 288, 384], // Bbmaj7
      [172, 229.34, 256.87, 344, 432], // Fmaj9
      [216, 271.3, 324, 432, 542.6]    // Am7
    ],
    color: '#00F5D4',
    badge: 'DEEP FLOW'
  },
  {
    id: 'neon-alpha',
    name: 'Neon Alpha Focus',
    genre: '10Hz Binaural Concentration',
    description: 'Subtle 10Hz alpha wave differential with soft poly-chords for hyper-focused creative editing.',
    baseFreq: 220,
    tempo: 30,
    chordProgression: [
      [110, 164.81, 220, 261.63, 329.63], // Am7
      [130.81, 196, 261.63, 329.63, 392],  // Cmaj7
      [87.31, 130.81, 174.61, 220, 261.63], // Fmaj7
      [98, 146.83, 196, 246.94, 293.66]     // Gsus4
    ],
    color: '#C084FC',
    badge: 'ALPHA BINAURAL'
  },
  {
    id: 'starlight-chords',
    name: 'Starlight Dreamscape',
    genre: 'Lush Lo-Fi Ambient',
    description: 'Gentle dreamy arpeggiated synth pads with airy analog saturation and celestial overtones.',
    baseFreq: 261.63,
    tempo: 40,
    chordProgression: [
      [130.81, 196, 246.94, 293.66, 392],   // Cmaj9
      [146.83, 220, 261.63, 329.63, 440],   // Dm9
      [164.81, 246.94, 293.66, 392, 493.88], // Em7
      [174.61, 261.63, 329.63, 392, 523.25]  // Fmaj9
    ],
    color: '#FF007F',
    badge: 'DREAMY CHORDS'
  },
  {
    id: 'quantum-void',
    name: 'Quantum Void Drone',
    genre: 'Deep Space Meditation',
    description: '55Hz grounding sub-bass fundamental with resonant crystalline upper harmonic sweeps.',
    baseFreq: 110,
    tempo: 20,
    chordProgression: [
      [55, 110, 165, 220, 330, 440], // A fundamental harmonic series
      [65.41, 130.81, 196.22, 261.63, 392], // C grounded harmonics
      [73.42, 146.83, 220.25, 293.66, 440], // D resonant space
      [55, 82.41, 110, 164.81, 220] // Deep A sub stack
    ],
    color: '#FCD34D',
    badge: 'SUB-BASS VOID'
  }
];

class AmbientSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private isPlayingState: boolean = false;
  private volume: number = 0.35; // 0.0 to 1.0 (default 35% gentle focus volume)
  private currentTrackId: string = 'cyber-midnight';
  private focusAutoPlayEnabled: boolean = true;
  private binauralBoostEnabled: boolean = true;
  private tapeWarmthEnabled: boolean = true;
  
  // Audio Nodes
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private activeVoices: { oscs: OscillatorNode[]; gains: GainNode[] }[] = [];
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private subBassOsc: OscillatorNode | null = null;
  private subBassGain: GainNode | null = null;
  private progressionInterval: any = null;
  private currentChordIndex: number = 0;

  // Listeners for UI state reactivity
  private stateChangeListeners: Set<() => void> = new Set();

  constructor() {
    // Restore persistent preferences
    if (typeof window !== 'undefined') {
      try {
        const savedVol = localStorage.getItem('jc_soundscape_volume');
        if (savedVol !== null) this.volume = parseFloat(savedVol);
        
        const savedTrack = localStorage.getItem('jc_soundscape_track');
        if (savedTrack && SOUNDSCAPE_TRACKS.some(t => t.id === savedTrack)) {
          this.currentTrackId = savedTrack;
        }

        const savedAuto = localStorage.getItem('jc_soundscape_focus_auto');
        if (savedAuto !== null) this.focusAutoPlayEnabled = savedAuto === 'true';

        const savedBinaural = localStorage.getItem('jc_soundscape_binaural');
        if (savedBinaural !== null) this.binauralBoostEnabled = savedBinaural === 'true';

        const savedTape = localStorage.getItem('jc_soundscape_tape');
        if (savedTape !== null) this.tapeWarmthEnabled = savedTape === 'true';
      } catch (e) {}
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public subscribe(listener: () => void) {
    this.stateChangeListeners.add(listener);
    return () => this.stateChangeListeners.delete(listener);
  }

  private notify() {
    this.stateChangeListeners.forEach(fn => fn());
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentTrack(): SoundscapeTrack {
    return SOUNDSCAPE_TRACKS.find(t => t.id === this.currentTrackId) || SOUNDSCAPE_TRACKS[0];
  }

  public isFocusAutoPlay(): boolean {
    return this.focusAutoPlayEnabled;
  }

  public isBinauralBoost(): boolean {
    return this.binauralBoostEnabled;
  }

  public isTapeWarmth(): boolean {
    return this.tapeWarmthEnabled;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('jc_soundscape_volume', this.volume.toString());
      } catch (e) {}
    }

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume * 0.18, now + 0.05);
    }
    this.notify();
  }

  public setFocusAutoPlay(enabled: boolean) {
    this.focusAutoPlayEnabled = enabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('jc_soundscape_focus_auto', enabled.toString());
      } catch (e) {}
    }
    this.notify();
  }

  public setBinauralBoost(enabled: boolean) {
    this.binauralBoostEnabled = enabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('jc_soundscape_binaural', enabled.toString());
      } catch (e) {}
    }
    if (this.isPlayingState) {
      // Re-trigger current chord to update binaural detune
      this.playChord(this.currentChordIndex);
    }
    this.notify();
  }

  public setTapeWarmth(enabled: boolean) {
    this.tapeWarmthEnabled = enabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('jc_soundscape_tape', enabled.toString());
      } catch (e) {}
    }
    if (this.noiseGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.noiseGain.gain.linearRampToValueAtTime(enabled ? 0.015 : 0.00001, now + 0.5);
    }
    this.notify();
  }

  public setTrack(trackId: string) {
    if (!SOUNDSCAPE_TRACKS.some(t => t.id === trackId)) return;
    this.currentTrackId = trackId;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('jc_soundscape_track', trackId);
      } catch (e) {}
    }
    this.currentChordIndex = 0;

    if (this.isPlayingState) {
      this.playChord(0);
    }
    this.notify();
  }

  public togglePlay() {
    if (this.isPlayingState) {
      this.stop();
    } else {
      this.start();
    }
  }

  // Starts the synthwave soundscape
  public start(trackId?: string) {
    if (trackId) {
      this.currentTrackId = trackId;
    }

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      if (this.isPlayingState) {
        this.stop();
      }

      const now = ctx.currentTime;

      // Master output stage with Analyser
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.85;

      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume * 0.18, now + 1.2); // Smooth fade in

      // Resonant Lowpass Filter with slow LFO modulation
      this.filterNode = ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(650, now);
      this.filterNode.Q.setValueAtTime(3.2, now); // Gentle warm resonance

      // LFO for slow ambient filter sweep
      this.lfoOsc = ctx.createOscillator();
      this.lfoOsc.type = 'sine';
      this.lfoOsc.frequency.setValueAtTime(0.08, now); // 0.08Hz slow breathing cycle

      this.lfoGain = ctx.createGain();
      this.lfoGain.gain.setValueAtTime(280, now); // Sweeps cutoff between 370Hz and 930Hz

      this.lfoOsc.connect(this.lfoGain);
      this.lfoGain.connect(this.filterNode.frequency);
      this.lfoOsc.start(now);

      // Connect Filter -> Master Gain -> Analyser -> Destination
      this.filterNode.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(ctx.destination);

      // Generate subtle analog tape noise (pink/brownian filtered)
      this.startTapeWarmth(ctx);

      // Start sub-bass grounding drone
      this.startSubBass(ctx);

      // Start chord progression loop
      this.currentChordIndex = 0;
      this.playChord(this.currentChordIndex);

      const track = this.getCurrentTrack();
      const intervalMs = (60 / track.tempo) * 4 * 1000; // 4 bars per chord

      if (this.progressionInterval) clearInterval(this.progressionInterval);
      this.progressionInterval = setInterval(() => {
        if (!this.isPlayingState) return;
        const currentT = this.getCurrentTrack();
        this.currentChordIndex = (this.currentChordIndex + 1) % currentT.chordProgression.length;
        this.playChord(this.currentChordIndex);
      }, intervalMs);

      this.isPlayingState = true;
      this.notify();
    } catch (e) {
      console.warn('Ambient soundscape start failed:', e);
    }
  }

  // Plays a polyphonic chord voice with crossfades
  private playChord(chordIdx: number) {
    const ctx = this.ctx;
    if (!ctx || !this.filterNode) return;

    const track = this.getCurrentTrack();
    const chord = track.chordProgression[chordIdx] || track.chordProgression[0];
    const now = ctx.currentTime;

    // Fade out previous active voices
    this.activeVoices.forEach(voice => {
      voice.gains.forEach(g => {
        try {
          g.gain.cancelScheduledValues(now);
          g.gain.setValueAtTime(g.gain.value, now);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
        } catch (e) {}
      });
      setTimeout(() => {
        voice.oscs.forEach(o => {
          try {
            o.stop();
            o.disconnect();
          } catch (e) {}
        });
      }, 2000);
    });
    this.activeVoices = [];

    const newOscs: OscillatorNode[] = [];
    const newGains: GainNode[] = [];

    // Synthesize each note of the chord with dual detuned oscillators (warm analog chorus)
    chord.forEach((freq, noteIdx) => {
      // Primary Oscillator (warm triangle/sine blend)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator(); // Detuned sister oscillator
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();

      osc1.type = noteIdx === 0 ? 'sine' : 'triangle';
      osc2.type = 'sine';

      // Binaural & tape chorus detuning
      const detuneCents = this.binauralBoostEnabled ? (noteIdx % 2 === 0 ? 6 : -6) : 3;
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * (1 + (detuneCents / 1200)), now);

      // Harmonic amplitude balance (lower notes richer, upper notes subtle air)
      const noteGainTarget = Math.max(0.03, 0.12 - (noteIdx * 0.018));

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(noteGainTarget, now + 1.4); // Smooth attack

      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.linearRampToValueAtTime(noteGainTarget * 0.7, now + 1.6);

      osc1.connect(gain1);
      osc2.connect(gain2);

      gain1.connect(this.filterNode!);
      gain2.connect(this.filterNode!);

      osc1.start(now);
      osc2.start(now);

      newOscs.push(osc1, osc2);
      newGains.push(gain1, gain2);
    });

    this.activeVoices.push({ oscs: newOscs, gains: newGains });
  }

  // Generates soothing analog vinyl/tape air
  private startTapeWarmth(ctx: AudioContext) {
    try {
      const bufferSize = ctx.sampleRate * 2; // 2 sec noise loop
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;

      // Pink / Brownian noise algorithm
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }

      this.noiseSource = ctx.createBufferSource();
      this.noiseSource.buffer = noiseBuffer;
      this.noiseSource.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(320, ctx.currentTime);

      this.noiseGain = ctx.createGain();
      const targetGain = this.tapeWarmthEnabled ? 0.018 : 0.00001;
      this.noiseGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.noiseGain.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 2.0);

      this.noiseSource.connect(noiseFilter);
      noiseFilter.connect(this.noiseGain);
      if (this.masterGain) {
        this.noiseGain.connect(this.masterGain);
      }

      this.noiseSource.start();
    } catch (e) {}
  }

  // Deep grounding sub-bass drone
  private startSubBass(ctx: AudioContext) {
    try {
      const now = ctx.currentTime;
      this.subBassOsc = ctx.createOscillator();
      this.subBassGain = ctx.createGain();

      this.subBassOsc.type = 'sine';
      this.subBassOsc.frequency.setValueAtTime(55, now); // 55Hz (A1) or 65.4Hz

      this.subBassGain.gain.setValueAtTime(0.0001, now);
      this.subBassGain.gain.linearRampToValueAtTime(0.06, now + 2.5);

      this.subBassOsc.connect(this.subBassGain);
      if (this.masterGain) {
        this.subBassGain.connect(this.masterGain);
      }

      this.subBassOsc.start(now);
    } catch (e) {}
  }

  // Stops and cleans up all audio oscillators smoothly
  public stop() {
    if (!this.isPlayingState) return;

    if (this.progressionInterval) {
      clearInterval(this.progressionInterval);
      this.progressionInterval = null;
    }

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    }

    setTimeout(() => {
      this.activeVoices.forEach(voice => {
        voice.oscs.forEach(o => {
          try {
            o.stop();
            o.disconnect();
          } catch (e) {}
        });
      });
      this.activeVoices = [];

      if (this.lfoOsc) {
        try {
          this.lfoOsc.stop();
          this.lfoOsc.disconnect();
        } catch (e) {}
        this.lfoOsc = null;
      }

      if (this.noiseSource) {
        try {
          this.noiseSource.stop();
          this.noiseSource.disconnect();
        } catch (e) {}
        this.noiseSource = null;
      }

      if (this.subBassOsc) {
        try {
          this.subBassOsc.stop();
          this.subBassOsc.disconnect();
        } catch (e) {}
        this.subBassOsc = null;
      }

      this.isPlayingState = false;
      this.notify();
    }, 850);
  }

  // Focus mode hook: triggered when entering creative studios
  public handleFocusStudioEnter() {
    if (this.focusAutoPlayEnabled && !this.isPlayingState) {
      this.start();
    }
  }
}

export const ambientSoundscape = new AmbientSoundscapeEngine();
