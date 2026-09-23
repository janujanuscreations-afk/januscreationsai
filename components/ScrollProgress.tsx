import React, { useEffect, useState, useRef } from 'react';

interface ScrollProgressProps {
  height?: number; // Height in px, defaults to 3px
  className?: string;
}

// Brand signature neon color stops in hex
const NEON_PALETTE = [
  { stop: 0, hex: '#00F5D4', label: 'Cyber Teal' },     // Top / 0%
  { stop: 0.25, hex: '#818CF8', label: 'Neon Indigo' }, // 25%
  { stop: 0.50, hex: '#C084FC', label: 'Hyper Lavender' },// 50%
  { stop: 0.75, hex: '#FF007F', label: 'Hot Magenta' },  // 75%
  { stop: 1.00, hex: '#FFB800', label: 'Solar Amber' },  // 100% Bottom
];

// Helper to convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

// Linear interpolation between two RGB colors
function interpolateColor(color1: string, color2: string, factor: number): string {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);

  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  return `rgb(${r}, ${g}, ${b})`;
}

// Calculates dynamic color based on scroll percentage (0 - 1)
function getInterpolatedNeonColor(progress: number): { currentColor: string; prevColor: string; nextColor: string } {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  // Find surrounding stops
  for (let i = 0; i < NEON_PALETTE.length - 1; i++) {
    const currentStop = NEON_PALETTE[i];
    const nextStop = NEON_PALETTE[i + 1];

    if (clampedProgress >= currentStop.stop && clampedProgress <= nextStop.stop) {
      const range = nextStop.stop - currentStop.stop;
      const factor = (clampedProgress - currentStop.stop) / range;
      const interpolated = interpolateColor(currentStop.hex, nextStop.hex, factor);
      return {
        currentColor: interpolated,
        prevColor: currentStop.hex,
        nextColor: nextStop.hex,
      };
    }
  }

  return {
    currentColor: NEON_PALETTE[NEON_PALETTE.length - 1].hex,
    prevColor: NEON_PALETTE[NEON_PALETTE.length - 2].hex,
    nextColor: NEON_PALETTE[NEON_PALETTE.length - 1].hex,
  };
}

export const ScrollProgress: React.FC<ScrollProgressProps> = ({
  height = 3,
  className = '',
}) => {
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [activeColor, setActiveColor] = useState('#00F5D4');
  const [gradientColors, setGradientColors] = useState({ start: '#00F5D4', end: '#818CF8' });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollFraction = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
      
      const { currentColor, prevColor, nextColor } = getInterpolatedNeonColor(scrollFraction);

      setProgress(scrollFraction * 100);
      setActiveColor(currentColor);
      setGradientColors({ start: prevColor, end: nextColor });
    };

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateScrollProgress);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[70] pointer-events-none ${className}`}
      style={{ height: `${height}px` }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Background Track Subtle Shimmer */}
      <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-sm" />

      {/* Dynamic Animated Gradient Progress Bar */}
      <div
        className="h-full relative transition-[width] duration-75 ease-out rounded-r-full"
        style={{
          width: `${progress}%`,
          background: `linear-gradient(90deg, #00F5D4 0%, ${gradientColors.start} 50%, ${activeColor} 100%)`,
          boxShadow: `0 0 10px ${activeColor}, 0 0 20px ${activeColor}80, 0 1px 3px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Leading Tip Glowing Orb */}
        {progress > 1 && (
          <div
            className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-2 h-2 rounded-full blur-[1px] animate-pulse"
            style={{
              backgroundColor: activeColor,
              boxShadow: `0 0 12px ${activeColor}, 0 0 24px #FFF, 0 0 30px ${activeColor}`,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ScrollProgress;
