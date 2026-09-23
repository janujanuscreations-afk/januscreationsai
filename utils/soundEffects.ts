// Luxury Web Audio API Sound Synthesizer for Janu's Creations Boss Notifications
// Generates pristine, crystal-clear neon audio alerts without requiring external MP3 assets

class BossAudioEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user interaction
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

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  // High-frequency crystal coin chime for tips
  public playTipChime(amount: number = 50) {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      
      // Dual oscillator for rich metallic sparkle
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      // Pitch scales slightly with tip value
      const baseFreq = amount >= 100 ? 1046.50 : 880; // C6 or A5
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.18);

      osc2.frequency.setValueAtTime(baseFreq * 1.25, now);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, now + 0.25);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.65);
      osc2.stop(now + 0.65);
    } catch (e) {
      console.warn('Audio feedback skipped:', e);
    }
  }

  // Ascending royal arpeggio for leaderboard rank upgrades
  public playRankUpSound() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + (idx * 0.07);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch (e) {
      console.warn('Audio feedback skipped:', e);
    }
  }

  // Celebratory victory fanfare for contest triumphs
  public playContestWinSound() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const chords = [
        { freqs: [440, 554.37, 659.25], start: 0, duration: 0.2 },      // A Major
        { freqs: [554.37, 659.25, 830.61], start: 0.22, duration: 0.2 }, // C#m
        { freqs: [659.25, 830.61, 987.77, 1318.51], start: 0.45, duration: 0.7 } // E Major Grand
      ];

      chords.forEach((chord) => {
        chord.freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + chord.start;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(0.12, startTime + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + chord.duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + chord.duration + 0.1);
        });
      });
    } catch (e) {
      console.warn('Audio feedback skipped:', e);
    }
  }

  // Grand Revenue Milestone Fanfare (Crescendo chords with sparkling shimmer)
  public playRevenueMilestoneSound() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Majestic ascending progression: F Major9 -> G Major -> C Major (Grand Resolution)
      const layers = [
        { freqs: [349.23, 440.00, 523.25, 659.25], start: 0, duration: 0.28 },     // Fmaj7
        { freqs: [392.00, 493.88, 587.33, 783.99], start: 0.25, duration: 0.32 },   // Gsus4 -> G
        { freqs: [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98], start: 0.55, duration: 1.1 } // High C Grand Chime
      ];

      layers.forEach((layer) => {
        layer.freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + layer.start + (i * 0.015);

          osc.type = i % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.0001, startTime);
          gain.gain.linearRampToValueAtTime(0.14, startTime + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + layer.duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + layer.duration + 0.1);
        });
      });
    } catch (e) {
      console.warn('Milestone audio feedback skipped:', e);
    }
  }

  // Subtle clean neon UI ping
  public playSubtlePing() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  // Futuristic AI Co-Pilot activation chime
  public playAICoPilotActivation() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.22);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(6000, now + 0.2);
      filter.Q.value = 4;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  // Audio Leveling & Mastering sweep simulation
  public playAudioLevelingSweep(mode: 'before' | 'after' = 'after') {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      if (mode === 'before') {
        // Muddy, unfiltered, slightly quiet
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      } else {
        // Mastered -14 LUFS, crisp highs, sub-bass fullness
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now); // Sub bass
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.2);
        
        filter.type = 'highshelf';
        filter.frequency.value = 3000;
        filter.gain.value = 6;

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      }

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {}
  }

  // Workspace Invite Link Generated Chime
  public playInviteGenerated() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc1.frequency.setValueAtTime(1046.50, now + 0.24); // C6

      osc2.frequency.setValueAtTime(1046.50, now + 0.24);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.24);
      osc1.stop(now + 0.55);
      osc2.stop(now + 0.55);
    } catch (e) {}
  }

  // Co-Editor Joined Presence Chime
  public playCollaboratorJoined() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, now); // E4
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.3); // B5

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(4000, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {}
  }

  // Boss Vault Biometric Scanning Pulse Laser
  public playBiometricScan() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  // Boss Vault Biometric / Passcode Authentication Granted Chime
  public playBiometricSuccess() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.setValueAtTime(880.00, now + 0.08); // A5
      osc1.frequency.setValueAtTime(1318.51, now + 0.16); // E6

      osc2.frequency.setValueAtTime(1318.51, now + 0.16);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.16);
      osc1.stop(now + 0.7);
      osc2.stop(now + 0.7);
    } catch (e) {}
  }

  // Boss Vault Authentication Denied Alert Buzz
  public playBiometricDenied() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      osc1.frequency.setValueAtTime(140, now);
      osc1.frequency.setValueAtTime(110, now + 0.12);

      osc2.frequency.setValueAtTime(145, now);
      osc2.frequency.setValueAtTime(115, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } catch (e) {}
  }

  // Boss Vault Heavy Titanium Hydraulic Unlock
  public playVaultUnlock() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.4);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {}
  }

  // Quick Switcher Command Palette Cyber Glass Open
  public playCommandPaletteOpen() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.08); // D6
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.16); // A6

      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.16);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.38);
      osc2.stop(now + 0.38);
    } catch (e) {}
  }

  // Command Palette Item Selection / Hover Tick
  public playPaletteNavigate() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.035);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  // Command Palette Action Execution Quantum Warp Tone
  public playPaletteExecute() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.06);
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.18);

      osc2.frequency.setValueAtTime(220, now);
      osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(6000, now + 0.15);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.48);
      osc2.stop(now + 0.48);
    } catch (e) {}
  }

  // Auto-Scheduler One-Click Queue Futuristic Chrono-Chime
  public playAutoSchedulerQueue() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [587.33, 739.99, 880.00, 1174.66, 1760.00]; // D5, F#5, A5, D6, A6 (Major 9th shimmer)

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + (idx * 0.05);

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.02, startTime + 0.2);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.14, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.6);
      });
    } catch (e) {}
  }

  // Classic Cash Register "Cha-Ching" (Mechanical latch click + high metallic bell shimmer)
  public playCashRegister() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // 1. Mechanical lever/latch spring click ("Cha-")
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(3200, now);
      noiseFilter.Q.setValueAtTime(3, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now);

      // 2. High crisp bell resonance ("-Ching!")
      const bellTime = now + 0.04;
      const bellFreqs = [1864.66, 2349.32, 2793.83, 3729.31]; // Bb6, D7, F7, Bb7 bell harmonics

      bellFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, bellTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.99, bellTime + 0.5);

        gain.gain.setValueAtTime(0.001, bellTime);
        gain.gain.linearRampToValueAtTime(0.16 / (idx + 1), bellTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, bellTime + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(bellTime);
        osc.stop(bellTime + 0.7);
      });
    } catch (e) {
      console.warn('Cash register audio feedback skipped:', e);
    }
  }

  // Crisp Positive Success Chime
  public playSuccess() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [587.33, 880.00]; // D5 -> A5

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + (idx * 0.08);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch (e) {}
  }

  // Level Up / Tier Ascension Synth Flourish
  public playLevelUp() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73]; // A4, C#5, E5, A5, C#6

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + (idx * 0.06);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startTime + 0.15);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.16, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.55);
      });
    } catch (e) {}
  }

  // Laser Beep / Holographic UI Confirmation
  public playLaserBeep() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  // Cash Register / Chime Sound
  public playCashChime(amount?: number) {
    this.playTipChime(amount || 50);
  }

  // Error / Warning Alert Sound
  public playError() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(180, now);
      osc2.frequency.setValueAtTime(120, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {}
  }

  // Big Win / Grand Withdrawal Triumphant Celebration Fanfare
  public playBigWin() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const chords = [
        { freqs: [523.25, 659.25, 783.99], start: 0, dur: 0.18 },       // C Major
        { freqs: [587.33, 739.99, 880.00], start: 0.18, dur: 0.18 },    // D Major
        { freqs: [659.25, 830.61, 987.77], start: 0.36, dur: 0.18 },    // E Major
        { freqs: [783.99, 987.77, 1174.66, 1567.98], start: 0.56, dur: 0.8 } // High G Major Grand Resolution
      ];

      chords.forEach((chord) => {
        chord.freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + chord.start + (i * 0.01);

          osc.type = i === 0 ? 'sawtooth' : 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.001, startTime);
          gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + chord.dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + chord.dur + 0.05);
        });
      });
    } catch (e) {}
  }
}

export const bossAudio = new BossAudioEngine();
