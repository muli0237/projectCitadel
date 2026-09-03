import React from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { useLaunchAudio } from '../../hooks/useLaunchAudio';

interface LaunchAudioToggleProps {
  className?: string;
  showVolumePercent?: boolean;
}

export const LaunchAudioToggle: React.FC<LaunchAudioToggleProps> = ({
  className = '',
  showVolumePercent = true,
}) => {
  const { audioMode, masterVolume, toggleAudioMute, setAudioMode, playHover } = useLaunchAudio();

  const isMuted = audioMode === 'muted' || masterVolume === 0;
  const isReduced = audioMode === 'reduced';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioMode === 'standard') {
      setAudioMode('reduced');
    } else if (audioMode === 'reduced') {
      setAudioMode('muted');
    } else {
      setAudioMode('standard');
    }
  };

  const currentPercent = isMuted ? 0 : Math.round(masterVolume * 100);

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={playHover}
        className={`
          group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xs border
          ${isMuted 
            ? 'bg-[#08111c]/60 border-[#1F1F21] text-[#7890a5] hover:text-[#d8f5ff] hover:border-[#39d9ff]/30' 
            : isReduced
            ? 'bg-[#08111c]/80 border-[#367cff]/40 text-[#367cff] hover:text-[#d8f5ff] hover:border-[#367cff]'
            : 'bg-[#08111c]/90 border-[#39d9ff]/40 text-[#39d9ff] hover:text-[#d8f5ff] hover:border-[#39d9ff] shadow-[0_0_10px_rgba(57,217,255,0.15)]'
          }
          font-hud text-xs tracking-wider transition-all duration-200 cursor-pointer
          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#39d9ff]
        `}
        aria-label={`Launch Audio: ${audioMode.toUpperCase()} (${currentPercent}%)`}
        title={`Audio Mode: ${audioMode.toUpperCase()} (${currentPercent}%) - Click to switch`}
      >
        {isMuted ? (
          <VolumeX className="w-3.5 h-3.5 shrink-0 text-[#7890a5] group-hover:text-[#ff5468]" />
        ) : isReduced ? (
          <Volume1 className="w-3.5 h-3.5 shrink-0 text-[#367cff]" />
        ) : (
          <Volume2 className="w-3.5 h-3.5 shrink-0 text-[#39d9ff]" />
        )}

        <span className="font-hud uppercase text-[11px] font-medium">
          {isMuted ? 'MUTED' : isReduced ? 'REDUCED' : 'AUDIO'}
        </span>

        {showVolumePercent && (
          <span className="font-tech text-[10px] text-[#7890a5] tabular-nums">
            {currentPercent}%
          </span>
        )}

        {/* Small Active Dot */}
        <span
          className={`w-1 h-1 rounded-full ${
            isMuted ? 'bg-[#7890a5]' : isReduced ? 'bg-[#367cff]' : 'bg-[#39d9ff] shadow-[0_0_4px_#39d9ff]'
          }`}
        />
      </button>
    </div>
  );
};
