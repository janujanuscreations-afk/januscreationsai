// Real-Time Web Audio API Music & Beat Synthesizer Engine for Janu's Creations
// Generates live multi-stem music (Drums, 808 Bass, Chords, Lead Melody, FX) across multiple genres with real-time stem mixing & visualizer analysis

export interface MusicGenreTrack {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  bpm: number;
  description: string;
  key: string;
  vibe: string;
  // Musical chords representation in Hz
  chords: number[][];
  bassline: number[];
  drumPattern: {
    kick: boolean[];
    snare: boolean[];
    hihat: boolean[];
  };
  melodyNotes: number[];
}

export const MUSIC_GENRES: MusicGenreTrack[] = [
  {
    id: 'rap',
    name: 'Hip-Hop & Trap',
    category: 'Urban & Beats',
    icon: 'fa-microphone-lines',
    color: '#818CF8',
    bpm: 140,
    key: 'F Minor',
    vibe: 'Heavy 808 glides, fast rolling hi-hats, dark minor synth stabs',
    description: 'Crisp trap drums, deep distorted 808 sub-bass, and punchy snares.',
    chords: [
      [174.61, 207.65, 261.63], // Fm
      [138.59, 174.61, 207.65], // Db
      [155.56, 196.00, 233.08], // Eb
      [130.81, 164.81, 196.00]  // C
    ],
    bassline: [43.65, 34.65, 38.89, 32.70], // F1, Db1, Eb1, C1
    drumPattern: {
      kick:  [true, false, false, false, false, false, true, false, false, true, false, false, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
    },
    melodyNotes: [349.23, 415.30, 523.25, 466.16, 415.30, 349.23, 311.13, 261.63]
  },
  {
    id: 'gospel',
    name: 'Gospel & Soul',
    category: 'Soul & Uplifting',
    icon: 'fa-dove',
    color: '#00F5D4',
    bpm: 95,
    key: 'Ab Major',
    vibe: 'Lush Hammond organs, warm soulful choir chords, moving walking bass',
    description: 'Inspirational chord progressions with Hammond organ harmonics and rhythmic swing.',
    chords: [
      [207.65, 261.63, 311.13, 392.00], // Abmaj7
      [233.08, 277.18, 349.23, 415.30], // Bbm7
      [261.63, 311.13, 392.00, 466.16], // Cm7
      [155.56, 196.00, 233.08, 277.18]  // Eb7
    ],
    bassline: [51.91, 58.27, 65.41, 38.89], // Ab1, Bb1, C2, Eb1
    drumPattern: {
      kick:  [true, false, false, false, false, false, false, true, false, false, true, false, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false]
    },
    melodyNotes: [415.30, 523.25, 622.25, 783.99, 622.25, 523.25, 466.16, 415.30]
  },
  {
    id: 'hits',
    name: "Today's Hits & Pop",
    category: 'Commercial Pop',
    icon: 'fa-fire',
    color: '#C084FC',
    bpm: 128,
    key: 'C Major',
    vibe: 'Catchy 4-on-the-floor kick, uplifting piano drops, sidechained synth leads',
    description: 'High-energy billboard radio beat with driving percussion and euphoric synth drops.',
    chords: [
      [261.63, 329.63, 392.00], // C
      [196.00, 246.94, 293.66], // G
      [220.00, 261.63, 329.63], // Am
      [174.61, 220.00, 261.63]  // F
    ],
    bassline: [65.41, 49.00, 55.00, 43.65], // C2, G1, A1, F1
    drumPattern: {
      kick:  [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false]
    },
    melodyNotes: [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 392.00]
  },
  {
    id: 'synthwave',
    name: 'Synthwave & Cyber',
    category: 'Electronic / Retro',
    icon: 'fa-microchip',
    color: '#FF007F',
    bpm: 120,
    key: 'D Minor',
    vibe: '80s analog saw arpeggios, gated reverb snare, resonant tape warmth',
    description: 'Retro-futuristic cyber synth lines layered with driving bass pulses.',
    chords: [
      [146.83, 220.00, 261.63, 349.23], // Dm7
      [116.54, 174.61, 233.08, 293.66], // Bbmaj7
      [130.81, 196.00, 261.63, 329.63], // C
      [146.83, 220.00, 293.66, 369.99]  // D
    ],
    bassline: [73.42, 58.27, 65.41, 73.42], // D2, Bb1, C2, D2
    drumPattern: {
      kick:  [true, false, false, false, false, false, true, false, true, false, false, false, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
    },
    melodyNotes: [587.33, 440.00, 523.25, 698.46, 587.33, 440.00, 392.00, 293.66]
  },
  {
    id: 'lofi',
    name: 'Lo-Fi Chill & R&B',
    category: 'Chill & Relaxed',
    icon: 'fa-mug-hot',
    color: '#38BDF8',
    bpm: 85,
    key: 'Eb Major',
    vibe: 'Jazzy major 9th chords, gentle vinyl dust crackle, lazy swung drums',
    description: 'Cozy study beats with lush jazz chord extensions and warm electric piano tones.',
    chords: [
      [155.56, 196.00, 233.08, 293.66, 349.23], // Ebmaj9
      [130.81, 155.56, 196.00, 246.94, 293.66], // Cm9
      [174.61, 207.65, 261.63, 311.13, 392.00], // Fm9
      [116.54, 146.83, 174.61, 207.65, 261.63]  // Bb13
    ],
    bassline: [38.89, 32.70, 43.65, 29.14], // Eb1, C1, F1, Bb0
    drumPattern: {
      kick:  [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, false, true, true, false, true, true, false, true, true, false, true, true, false, true, false]
    },
    melodyNotes: [311.13, 392.00, 466.16, 587.33, 466.16, 392.00, 349.23, 293.66]
  },
  {
    id: 'country',
    name: 'Neon Country & Folk',
    category: 'Acoustic & Roots',
    icon: 'fa-guitar',
    color: '#FCD34D',
    bpm: 112,
    key: 'G Major',
    vibe: 'Acoustic strum cadence, clean finger-picking, warm bass walkdowns',
    description: 'Organic warmth mixed with modern sonic brilliance and steady acoustic stomp rhythm.',
    chords: [
      [196.00, 246.94, 293.66, 392.00], // G
      [164.81, 196.00, 246.94, 329.63], // Em
      [261.63, 329.63, 392.00, 523.25], // C
      [146.83, 220.00, 293.66, 369.99]  // D
    ],
    bassline: [49.00, 41.20, 65.41, 73.42], // G1, E1, C2, D2
    drumPattern: {
      kick:  [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false]
    },
    melodyNotes: [392.00, 493.88, 587.33, 783.99, 587.33, 493.88, 440.00, 392.00]
  },
  {
    id: 'rock',
    name: 'Rock & Heavy Metal',
    category: 'Alternative & Rock',
    icon: 'fa-hand-rock',
    color: '#D8B4FE',
    bpm: 165,
    key: 'E Minor',
    vibe: 'Overdriven power chords, galloping double-kick drum patterns, high energy',
    description: 'Raw high-gain sonic power with fast-paced rhythmic driving force.',
    chords: [
      [164.81, 246.94, 329.63], // E5
      [130.81, 196.00, 261.63], // C5
      [146.83, 220.00, 293.66], // D5
      [123.47, 185.00, 246.94]  // B5
    ],
    bassline: [41.20, 32.70, 36.71, 30.87], // E1, C1, D1, B0
    drumPattern: {
      kick:  [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
    },
    melodyNotes: [659.25, 587.33, 493.88, 392.00, 329.63, 392.00, 493.88, 659.25]
  },
  {
    id: 'edm',
    name: 'EDM & Festival Trap',
    category: 'Club & Electronic',
    icon: 'fa-bolt',
    color: '#00F5D4',
    bpm: 135,
    key: 'A Minor',
    vibe: 'Festival build-ups, energetic saw supersaws, laser sweeps, heavy bass drops',
    description: 'Peak-time mainstage dance beat with pulse-pounding drops and rhythmic energy.',
    chords: [
      [220.00, 261.63, 329.63, 440.00], // Am
      [174.61, 220.00, 261.63, 349.23], // F
      [130.81, 164.81, 196.00, 261.63], // C
      [196.00, 246.94, 293.66, 392.00]  // G
    ],
    bassline: [55.00, 43.65, 65.41, 49.00], // A1, F1, C2, G1
    drumPattern: {
      kick:  [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
    },
    melodyNotes: [880.00, 659.25, 523.25, 659.25, 880.00, 1046.50, 880.00, 659.25]
  },
  {
    id: 'afrobeat',
    name: 'Afrobeat & Reggaeton',
    category: 'Tropical & Dancehall',
    icon: 'fa-drum',
    color: '#F97316',
    bpm: 105,
    key: 'D Minor',
    vibe: 'Syncopated dembow rhythm, warm kalimba / marimba leads, infectious groove',
    description: 'Vibrant tropical groove with syncopated dembow percussions and melodic warmth.',
    chords: [
      [146.83, 174.61, 220.00], // Dm
      [196.00, 233.08, 293.66], // Gm
      [130.81, 164.81, 196.00], // C
      [174.61, 220.00, 261.63]  // F
    ],
    bassline: [73.42, 49.00, 65.41, 43.65], // D2, G1, C2, F1
    drumPattern: {
      kick:  [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, true, false, false, true, false, false, false, false, true, false, false, true, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
    },
    melodyNotes: [587.33, 698.46, 783.99, 880.00, 783.99, 698.46, 587.33, 523.25]
  },
  {
    id: 'cinematic',
    name: 'Cinematic Orchestral',
    category: 'Soundtrack & Film',
    icon: 'fa-film',
    color: '#E879F9',
    bpm: 75,
    key: 'C Minor',
    vibe: 'Sub-bass braam, cinematic strings swell, slow emotional build',
    description: 'Dramatic soundtrack atmosphere suitable for film trailers and high-emotion visual reels.',
    chords: [
      [130.81, 155.56, 196.00, 261.63], // Cm
      [103.83, 130.81, 155.56, 207.65], // Ab
      [116.54, 146.83, 174.61, 233.08], // Bb
      [98.00,  123.47, 146.83, 196.00]  // Gm
    ],
    bassline: [32.70, 25.96, 29.14, 24.50], // C1, Ab0, Bb0, G0
    drumPattern: {
      kick:  [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      snare: [false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false]
    },
    melodyNotes: [523.25, 622.25, 783.99, 622.25, 523.25, 466.16, 392.00, 311.13]
  }
];

class MusicAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentGenre: MusicGenreTrack = MUSIC_GENRES[0];
  
  // Stem Volume Gain levels (0.0 to 1.0)
  private vocalGainVal: number = 0.85;
  private bassGainVal: number = 0.90;
  private drumGainVal: number = 0.80;
  private synthGainVal: number = 0.95;
  private masterGainVal: number = 0.80;

  // Master and Stem Gain Nodes
  private masterGain: GainNode | null = null;
  private vocalGainNode: GainNode | null = null;
  private bassGainNode: GainNode | null = null;
  private drumGainNode: GainNode | null = null;
  private synthGainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Clock / Step Sequencer
  private timerId: any = null;
  private currentStep: number = 0; // 0 to 15 (16 steps = 1 bar)
  private currentChordIndex: number = 0;
  private bpm: number = 140;

  // Listeners for UI state synchronizations
  private listeners: Set<(state: { isPlaying: boolean; step: number; bpm: number; genreId: string }) => void> = new Set();

  constructor() {
    this.bpm = this.currentGenre.bpm;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.setupAudioGraph();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private setupAudioGraph() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterGainVal, ctx.currentTime);

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.smoothingTimeConstant = 0.8;

    this.vocalGainNode = ctx.createGain();
    this.vocalGainNode.gain.setValueAtTime(this.vocalGainVal, ctx.currentTime);

    this.bassGainNode = ctx.createGain();
    this.bassGainNode.gain.setValueAtTime(this.bassGainVal, ctx.currentTime);

    this.drumGainNode = ctx.createGain();
    this.drumGainNode.gain.setValueAtTime(this.drumGainVal, ctx.currentTime);

    this.synthGainNode = ctx.createGain();
    this.synthGainNode.gain.setValueAtTime(this.synthGainVal, ctx.currentTime);

    // Connect Stems to Master -> Analyser -> Destination
    this.vocalGainNode.connect(this.masterGain);
    this.bassGainNode.connect(this.masterGain);
    this.drumGainNode.connect(this.masterGain);
    this.synthGainNode.connect(this.masterGain);

    this.masterGain.connect(this.analyser);
    this.analyser.connect(ctx.destination);
  }

  public subscribe(fn: (state: { isPlaying: boolean; step: number; bpm: number; genreId: string }) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    const state = {
      isPlaying: this.isPlaying,
      step: this.currentStep,
      bpm: this.bpm,
      genreId: this.currentGenre.id
    };
    this.listeners.forEach(fn => fn(state));
  }

  // --- Sound Generation Methods ---

  // 1. Kick Drum (Punchy sub pitch envelope)
  public triggerKick(time?: number) {
    const ctx = this.getContext();
    if (!ctx || !this.drumGainNode) return;
    const t = time ?? ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Pitch drops rapidly from 150Hz to 35Hz for punch
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);

    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.drumGainNode);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  // 2. Snare / Clap (White noise burst + body tone)
  public triggerSnare(time?: number) {
    const ctx = this.getContext();
    if (!ctx || !this.drumGainNode) return;
    const t = time ?? ctx.currentTime;

    // Noise buffer
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.drumGainNode);

    // Body Oscillator
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

    oscGain.gain.setValueAtTime(0.4, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.drumGainNode);

    noise.start(t);
    osc.start(t);
    noise.stop(t + 0.16);
    osc.stop(t + 0.16);
  }

  // 3. Hi-Hat (Filtered metallic click)
  public triggerHiHat(time?: number, open: boolean = false) {
    const ctx = this.getContext();
    if (!ctx || !this.drumGainNode) return;
    const t = time ?? ctx.currentTime;

    const duration = open ? 0.2 : 0.04;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(open ? 0.35 : 0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumGainNode);

    noise.start(t);
    noise.stop(t + duration);
  }

  // 4. 808 Bass Note
  public triggerBass(freq: number, time?: number, duration: number = 0.4) {
    const ctx = this.getContext();
    if (!ctx || !this.bassGainNode) return;
    const t = time ?? ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.8, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bassGainNode);

    osc.start(t);
    osc.stop(t + duration);
  }

  // 5. Synth Polyphonic Chord
  public triggerChord(chordFreqs: number[], time?: number, duration: number = 0.5) {
    const ctx = this.getContext();
    if (!ctx || !this.synthGainNode) return;
    const t = time ?? ctx.currentTime;

    const chordGain = ctx.createGain();
    chordGain.gain.setValueAtTime(0.001, t);
    chordGain.gain.linearRampToValueAtTime(0.4 / Math.sqrt(chordFreqs.length), t + 0.04);
    chordGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    chordGain.connect(this.synthGainNode);

    chordFreqs.forEach(freq => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();

      osc.type = this.currentGenre.id === 'synthwave' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.Q.setValueAtTime(2, t);

      osc.connect(filter);
      filter.connect(chordGain);

      osc.start(t);
      osc.stop(t + duration);
    });
  }

  // 6. Vocal / Lead Melody Note
  public triggerMelody(freq: number, time?: number, duration: number = 0.25) {
    const ctx = this.getContext();
    if (!ctx || !this.vocalGainNode) return;
    const t = time ?? ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.5, t);
    filter.Q.setValueAtTime(3, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.vocalGainNode);

    osc.start(t);
    osc.stop(t + duration);
  }

  // --- Step Sequencer Loop Step ---
  private tick() {
    if (!this.isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    const step = this.currentStep;

    const pattern = this.currentGenre.drumPattern;
    const chords = this.currentGenre.chords;
    const bass = this.currentGenre.bassline;
    const melody = this.currentGenre.melodyNotes;

    // Trigger Drums for this step
    if (pattern.kick[step]) {
      this.triggerKick(now);
    }
    if (pattern.snare[step]) {
      this.triggerSnare(now);
    }
    if (pattern.hihat[step]) {
      const isOpen = step % 4 === 2;
      this.triggerHiHat(now, isOpen);
    }

    // Every 4 steps (quarter note) trigger Chord & Bass or on beat 0
    if (step % 4 === 0) {
      const chordIdx = Math.floor(step / 4) % chords.length;
      this.currentChordIndex = chordIdx;
      this.triggerChord(chords[chordIdx], now, (60 / this.bpm) * 0.9);
      this.triggerBass(bass[chordIdx] || bass[0], now, (60 / this.bpm) * 0.85);
    }

    // Trigger Melodic Arp note on every even 16th note
    if (step % 2 === 0 && melody.length > 0) {
      const noteIdx = (step + this.currentChordIndex * 2) % melody.length;
      this.triggerMelody(melody[noteIdx], now, (60 / this.bpm) * 0.4);
    }

    this.currentStep = (this.currentStep + 1) % 16;
    this.notify();
  }

  // --- Playback Controls ---
  public play() {
    const ctx = this.getContext();
    if (!ctx) return;

    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;

    // Calculate step interval based on 16th notes (4 steps per beat)
    const stepTimeMs = (60000 / this.bpm) / 4;
    this.timerId = setInterval(() => {
      this.tick();
    }, stepTimeMs);

    this.notify();
  }

  public pause() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public setGenre(genre: MusicGenreTrack) {
    this.currentGenre = genre;
    this.bpm = genre.bpm;
    if (this.isPlaying) {
      this.pause();
      this.play();
    } else {
      this.notify();
    }
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(60, Math.min(200, newBpm));
    if (this.isPlaying) {
      this.pause();
      this.play();
    } else {
      this.notify();
    }
  }

  // Stem Mixers (0 to 100)
  public setVocalLevel(level: number) {
    this.vocalGainVal = Math.max(0, Math.min(100, level)) / 100;
    if (this.vocalGainNode && this.ctx) {
      this.vocalGainNode.gain.setValueAtTime(this.vocalGainVal, this.ctx.currentTime);
    }
  }

  public setBassLevel(level: number) {
    this.bassGainVal = Math.max(0, Math.min(100, level)) / 100;
    if (this.bassGainNode && this.ctx) {
      this.bassGainNode.gain.setValueAtTime(this.bassGainVal, this.ctx.currentTime);
    }
  }

  public setDrumLevel(level: number) {
    this.drumGainVal = Math.max(0, Math.min(100, level)) / 100;
    if (this.drumGainNode && this.ctx) {
      this.drumGainNode.gain.setValueAtTime(this.drumGainVal, this.ctx.currentTime);
    }
  }

  public setSynthLevel(level: number) {
    this.synthGainVal = Math.max(0, Math.min(100, level)) / 100;
    if (this.synthGainNode && this.ctx) {
      this.synthGainNode.gain.setValueAtTime(this.synthGainVal, this.ctx.currentTime);
    }
  }

  public setMasterVolume(level: number) {
    this.masterGainVal = Math.max(0, Math.min(100, level)) / 100;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.masterGainVal, this.ctx.currentTime);
    }
  }

  public getFrequencyData(array: Uint8Array) {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array);
    }
  }

  public getState() {
    return {
      isPlaying: this.isPlaying,
      step: this.currentStep,
      bpm: this.bpm,
      genre: this.currentGenre,
      vocalLevel: Math.round(this.vocalGainVal * 100),
      bassLevel: Math.round(this.bassGainVal * 100),
      drumLevel: Math.round(this.drumGainVal * 100),
      synthLevel: Math.round(this.synthGainVal * 100)
    };
  }
}

export const musicAudioEngine = new MusicAudioEngine();
