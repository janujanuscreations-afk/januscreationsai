import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const JCLogo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  onClick
}) => {
  const sizeMap = {
    sm: { container: 'w-10 h-10', jcText: 'text-xl', bgText: 'text-[7px]', textScale: 'scale-90', ringSize: 'w-12 h-12' },
    md: { container: 'w-16 h-16', jcText: 'text-3xl', bgText: 'text-[9px]', textScale: 'scale-100', ringSize: 'w-20 h-20' },
    lg: { container: 'w-24 h-24', jcText: 'text-5xl', bgText: 'text-[11px]', textScale: 'scale-110', ringSize: 'w-28 h-28' },
    xl: { container: 'w-36 h-36', jcText: 'text-7xl', bgText: 'text-[14px]', textScale: 'scale-125', ringSize: 'w-44 h-44' },
  };

  const currentSize = sizeMap[size];

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center gap-4 group select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className={`relative ${currentSize.container} flex items-center justify-center`}>
        {/* Ambient Fluorescent Purple, Pink & Teal Glow Aura */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FF007F]/40 via-[#E056FD]/35 to-[#00FFE0]/40 blur-xl group-hover:scale-125 group-hover:opacity-100 transition-all duration-700 opacity-80 pointer-events-none"></div>

        {/* Circular Orbiting "Janu's Creations" Text in background of JC */}
        <svg 
          viewBox="0 0 200 200" 
          className="absolute inset-[-20%] w-[140%] h-[140%] pointer-events-none animate-spin-slow group-hover:scale-105 transition-transform duration-700 opacity-80"
        >
          <defs>
            <path
              id={`circlePath-${size}`}
              d="M 100, 100 m -68, 0 a 68,68 0 1,1 136,0 a 68,68 0 1,1 -136,0"
            />
            <linearGradient id={`orbitGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF007F" />
              <stop offset="50%" stopColor="#E056FD" />
              <stop offset="100%" stopColor="#00FFE0" />
            </linearGradient>
          </defs>
          <text className="font-mono text-[10.5px] uppercase tracking-[0.24em] font-bold" fill={`url(#orbitGrad-${size})`}>
            <textPath href={`#circlePath-${size}`} startOffset="0%">
              • JANU'S CREATIONS • JANU'S CREATIONS • JANU'S CREATIONS
            </textPath>
          </text>
        </svg>

        {/* Fluorescent Light Filament Rings */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          <circle 
            cx="50" 
            cy="50" 
            r="44" 
            fill="none" 
            stroke="url(#jc-ring-gradient)" 
            strokeWidth="1.5" 
            strokeDasharray="4 6"
            className="animate-spin-reverse opacity-50"
          />
          <path 
            d="M 15,50 C 30,15 70,85 85,50" 
            fill="none" 
            stroke="url(#jc-ring-gradient)" 
            strokeWidth="2.5" 
            className="energy-thread opacity-90"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="jc-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF007F" />
              <stop offset="50%" stopColor="#E056FD" />
              <stop offset="100%" stopColor="#00FFE0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Background "Janu's Creations" Watermark Script right behind the JC letters */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1] overflow-visible">
          <span 
            className="creations-script text-white/25 whitespace-nowrap transform -rotate-12 group-hover:rotate-0 transition-transform duration-700 select-none text-[1.6em]"
            style={{ filter: 'drop-shadow(0 0 14px rgba(224, 86, 253, 0.8))' }}
          >
            Janu's Creations
          </span>
        </div>

        {/* Foreground Monogram "JC" in High-End Radiant Fluorescent Pink, Purple & Teal Typography */}
        <div className="relative z-10 flex items-center justify-center font-serif font-black italic tracking-tighter">
          <span className={`${currentSize.jcText} text-transparent bg-clip-text bg-gradient-to-br from-[#FF007F] via-[#FF2A85] to-[#E056FD] drop-shadow-[0_0_20px_rgba(255,0,127,0.85)] group-hover:drop-shadow-[0_0_30px_rgba(255,0,127,1)] transition-all duration-500`}>
            J
          </span>
          <span className={`${currentSize.jcText} text-transparent bg-clip-text bg-gradient-to-br from-[#E056FD] via-[#38BDF8] to-[#00FFE0] -ml-1 drop-shadow-[0_0_20px_rgba(0,255,224,0.9)] group-hover:drop-shadow-[0_0_30px_rgba(0,255,224,1)] transition-all duration-500`}>
            C
          </span>
        </div>
      </div>

      {/* Typography Label */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-serif font-black uppercase tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-[#FF007F] via-[#E056FD] to-[#00FFE0] text-base leading-none transition-all duration-500 drop-shadow-[0_0_14px_rgba(224,86,253,0.7)]">
              Janu's
            </span>
            <span className="creations-script text-xl leading-none transform translate-y-[2px] text-transparent bg-clip-text bg-gradient-to-r from-[#FF007F] to-[#E056FD] drop-shadow-[0_0_12px_rgba(255,0,127,0.7)]">
              Creations
            </span>
          </div>
          <span className="text-[7.5px] font-mono font-bold tracking-[0.6em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#FF007F] via-[#E056FD] to-[#00FFE0] mt-1 drop-shadow-[0_0_8px_rgba(0,255,224,0.6)]">
            Executive AI Suite
          </span>
        </div>
      )}
    </div>
  );
};

export default JCLogo;
