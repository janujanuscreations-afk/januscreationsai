// High-End Neon Particle Confetti System for Janu's Creations
// Features subtle, luminous particle physics with neon glow, diamonds, sparks, and stars

export interface ConfettiOptions {
  particleCount?: number;
  origin?: { x: number; y: number }; // 0 to 1 range (e.g. { x: 0.5, y: 0.5 })
  spread?: number;
  speed?: number;
  colors?: string[];
  intensity?: 'subtle' | 'medium' | 'grand' | 'high' | 'low' | 'small';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'diamond' | 'spark' | 'star' | 'ring';
  glowColor: string;
  glowBlur: number;
  flutter: number;
  flutterSpeed: number;
}

const LUXURY_NEON_PALETTE = [
  { color: '#FF007F', glow: 'rgba(255, 0, 127, 0.8)' },  // Neon Pink
  { color: '#FF5EA7', glow: 'rgba(255, 94, 167, 0.8)' }, // Vivid Rose
  { color: '#C084FC', glow: 'rgba(192, 132, 252, 0.8)' },// Light Purple
  { color: '#A855F7', glow: 'rgba(168, 85, 247, 0.8)' }, // Royal Violet
  { color: '#00F5D4', glow: 'rgba(0, 245, 212, 0.85)' }, // Neon Teal
  { color: '#38BDF8', glow: 'rgba(56, 189, 248, 0.8)' }, // Cyan Sky
  { color: '#FBBF24', glow: 'rgba(251, 191, 36, 0.75)' },// Stardust Gold
  { color: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.9)' },// Diamond White
];

class NeonConfettiEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  constructor() {
    // Lazy initialized when DOM is ready
  }

  private initCanvas() {
    if (typeof window === 'undefined') return;
    if (this.canvas && document.body.contains(this.canvas)) return;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'neon-confetti-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '999999';
    this.canvas.style.background = 'transparent';

    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.handleResize();

    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  };

  public trigger(options: ConfettiOptions = {}) {
    this.initCanvas();
    if (!this.canvas || !this.ctx) return;

    const count = options.particleCount ?? (options.intensity === 'grand' ? 120 : options.intensity === 'subtle' ? 45 : 75);
    const originX = (options.origin?.x ?? 0.5) * window.innerWidth;
    const originY = (options.origin?.y ?? 0.45) * window.innerHeight;
    const spread = (options.spread ?? 70) * (Math.PI / 180);
    const baseSpeed = options.speed ?? (options.intensity === 'subtle' ? 7 : 10);

    const shapes: ('circle' | 'diamond' | 'spark' | 'star' | 'ring')[] = [
      'diamond', 'spark', 'star', 'circle', 'ring'
    ];

    for (let i = 0; i < count; i++) {
      const paletteItem = LUXURY_NEON_PALETTE[Math.floor(Math.random() * LUXURY_NEON_PALETTE.length)];
      
      // Angle calculation with radial explosion distribution
      const angle = (Math.random() - 0.5) * spread - Math.PI / 2;
      const velocity = (Math.random() * 0.75 + 0.5) * baseSpeed * (Math.random() > 0.8 ? 1.35 : 1);

      this.particles.push({
        x: originX + (Math.random() - 0.5) * 20,
        y: originY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * velocity + (Math.random() - 0.5) * 2,
        vy: Math.sin(angle) * velocity - Math.random() * 2,
        size: Math.random() * 4.5 + 2.5,
        color: paletteItem.color,
        glowColor: paletteItem.glow,
        glowBlur: Math.random() * 12 + 8,
        alpha: 1,
        decay: Math.random() * 0.008 + 0.007, // Smooth 2.5-3.5s lifetime
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        flutter: Math.random() * Math.PI * 2,
        flutterSpeed: Math.random() * 0.08 + 0.03,
      });
    }

    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  private animate = () => {
    if (!this.canvas || !this.ctx) {
      this.isRunning = false;
      return;
    }

    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Physics & Flutter Updates
      p.x += p.vx + Math.sin(p.flutter) * 0.6;
      p.y += p.vy;
      p.vy += 0.16; // Gentle gravity
      p.vx *= 0.985; // Air resistance
      p.rotation += p.rotationSpeed;
      p.flutter += p.flutterSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);

      // Neon Bloom Shadow
      this.ctx.shadowColor = p.glowColor;
      this.ctx.shadowBlur = p.glowBlur;
      this.ctx.fillStyle = p.color;
      this.ctx.strokeStyle = p.color;

      if (p.shape === 'diamond') {
        this.ctx.beginPath();
        this.ctx.moveTo(0, -p.size * 1.4);
        this.ctx.lineTo(p.size, 0);
        this.ctx.lineTo(0, p.size * 1.4);
        this.ctx.lineTo(-p.size, 0);
        this.ctx.closePath();
        this.ctx.fill();
      } else if (p.shape === 'spark') {
        this.ctx.lineWidth = 1.8;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -p.size * 2);
        this.ctx.lineTo(0, p.size * 2);
        this.ctx.moveTo(-p.size * 0.7, 0);
        this.ctx.lineTo(p.size * 0.7, 0);
        this.ctx.stroke();
      } else if (p.shape === 'star') {
        const spikes = 4;
        const outerRadius = p.size * 1.3;
        const innerRadius = p.size * 0.45;
        this.ctx.beginPath();
        let rot = (Math.PI / 2) * 3;
        const step = Math.PI / spikes;

        for (let j = 0; j < spikes; j++) {
          this.ctx.lineTo(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius);
          rot += step;
          this.ctx.lineTo(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius);
          rot += step;
        }
        this.ctx.closePath();
        this.ctx.fill();
      } else if (p.shape === 'ring') {
        this.ctx.lineWidth = 1.4;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size * 0.85, 0, Math.PI * 2);
        this.ctx.stroke();
      } else {
        // Circle particle
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size * 0.75, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animationFrameId = requestAnimationFrame(this.animate);
    } else {
      this.isRunning = false;
      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
  };
}

export const neonConfetti = new NeonConfettiEngine();

/**
 * Convenient helper to launch subtle neon confetti from any trigger
 */
export const triggerNeonExplosion = (options?: ConfettiOptions) => {
  neonConfetti.trigger(options);
};
