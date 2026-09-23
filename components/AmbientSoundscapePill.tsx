import React, { useState, useEffect } from 'react';
import { ambientSoundscape, SoundscapeTrack } from '../utils/ambientSoundscape';
import { bossAudio } from '../utils/soundEffects';

interface AmbientSoundscapePillProps {
  onOpenSettings: () => void;
  className?: string;
}

export const AmbientSoundscapePill: React.FC<AmbientSoundscapePillProps> = ({
  onOpenSettings,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(ambientSoundscape.isPlaying());
  const [currentTrack, setCurrentTrack] = useState<SoundscapeTrack>(ambientSoundscape.getCurrentTrack());
  const [volume, setVolume] = useState(ambientSoundscape.getVolume());

  useEffect(() => {
    const unsubscribe = ambientSoundscape.subscribe(() => {
      setIsPlaying(ambientSoundscape.isPlaying());
      setCurrentTrack(ambientSoundscape.getCurrentTrack());
      setVolume(ambientSoundscape.getVolume());
    });
    return () => unsubscribe();
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    bossAudio.playSubtlePing();
    ambientSoundscape.togglePlay();
  };

  return (
    <div 
      onClick={onOpenSettings}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer group shadow-lg ${
        isPlaying
          ? 'bg-zinc-900/90 border-[#00F5D4]/40 shadow-[0_0_15px_rgba(0,245,212,0.2)] text-white'
          : 'bg-zinc-900/50 border-white/10 hover:border-white/20 text-gray-400 hover:text-white'
      } ${className}`}
      title="Ambient Focus Soundscape (Click to Open Settings)"
    >
      {/* Animated Equalizer or Music Icon */}
      <div className="flex items-center gap-0.5 h-3">
        {isPlaying ? (
          <>
            <span className="w-0.5 bg-[#00F5D4] rounded-full animate-[bounce_0.8s_infinite] h-2.5"></span>
            <span className="w-0.5 bg-[#C084FC] rounded-full animate-[bounce_1.1s_infinite] h-3.5"></span>
            <span className="w-0.5 bg-[#FF007F] rounded-full animate-[bounce_0.9s_infinite] h-2"></span>
          </>
        ) : (
          <i className="fa-solid fa-headphones text-[10px] text-gray-400 group-hover:text-[#00F5D4] transition-colors"></i>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold">
        <span className={isPlaying ? 'text-[#00F5D4]' : 'text-gray-300'}>
          {isPlaying ? currentTrack.name : 'Focus Soundscape'}
        </span>
        {isPlaying && (
          <span className="text-gray-500 hidden sm:inline">
            • {Math.round(volume * 100)}%
          </span>
        )}
      </div>

      {/* Quick Play/Pause Mini Button */}
      <button
        onClick={handleToggle}
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] transition-transform group-hover:scale-110 ${
          isPlaying
            ? 'bg-[#00F5D4] text-black font-black'
            : 'bg-white/10 text-gray-300 hover:bg-white/20'
        }`}
        title={isPlaying ? 'Pause Soundscape' : 'Start Focus Soundscape'}
      >
        <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play ml-0.5'}`}></i>
      </button>
    </div>
  );
};

export default AmbientSoundscapePill;
