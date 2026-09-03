import React from 'react';
import { FastForward } from 'lucide-react';

interface SkipSequenceButtonProps {
  onSkip: () => void;
  disabled?: boolean;
}

export const SkipSequenceButton: React.FC<SkipSequenceButtonProps> = ({
  onSkip,
  disabled = false,
}) => {
  return (
    <button
      onClick={onSkip}
      disabled={disabled}
      type="button"
      className="citadel-btn-text group flex items-center gap-2 px-3 py-1.5 bg-[#08111c]/90 hover:bg-[#161618] active:bg-[#1f2937] border border-[#39d9ff]/30 hover:border-[#39d9ff] text-[#7890a5] hover:text-[#d8f5ff] text-[10px] font-display uppercase tracking-[0.14em] font-semibold transition-all duration-150 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#39d9ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070b] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none shadow-sm rounded-xs"
      aria-label="Skip launch sequence and enter Command Center directly"
    >
      <FastForward className="w-3.5 h-3.5 text-[#39d9ff] group-hover:translate-x-0.5 transition-transform" />
      <span>SKIP SEQUENCE</span>
      <kbd className="px-1.5 py-0.2 bg-[#05070b] border border-[#1F1F21] text-[9px] text-[#39d9ff]/80 font-terminal">
        ESC
      </kbd>
    </button>
  );
};
