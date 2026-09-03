import React, { useRef, useEffect } from 'react';
import { useLaunchAudio } from '../../hooks/useLaunchAudio';

interface InitializeCitadelButtonProps {
  onInitialize: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
  isEngaged?: boolean;
  className?: string;
}

export const InitializeCitadelButton: React.FC<InitializeCitadelButtonProps> = ({
  onInitialize,
  autoFocus = true,
  disabled = false,
  isEngaged = false,
  className = '',
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { playHover } = useLaunchAudio();

  useEffect(() => {
    if (autoFocus && buttonRef.current && !disabled && !isEngaged) {
      buttonRef.current.focus();
    }
  }, [autoFocus, disabled, isEngaged]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled && !isEngaged) {
        onInitialize();
      }
    }
  };

  return (
    <div className="relative inline-flex flex-col items-center">
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={() => {
          if (!disabled && !isEngaged) {
            playHover();
          }
        }}
        onClick={() => {
          if (!disabled && !isEngaged) {
            onInitialize();
          }
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled || isEngaged}
        aria-label="Initialize Citadel Local Control Plane"
        className={`
          group relative inline-flex items-center gap-3 px-8 py-3.5
          ${isEngaged 
            ? 'bg-[#0a2336] border-[#39d9ff] text-[#39d9ff] shadow-[0_0_30px_rgba(57,217,255,0.45)]' 
            : 'bg-[#08111c]/85 hover:bg-[#0c1a2c]/95 active:bg-[#071320] border-[#39d9ff]/40 hover:border-[#39d9ff]/90 text-[#d8f5ff] hover:text-[#39d9ff] shadow-[0_0_15px_rgba(57,217,255,0.12)] hover:shadow-[0_0_24px_rgba(57,217,255,0.28)]'
          }
          border rounded-sm backdrop-blur-md transition-all duration-300 ease-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39d9ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070b]
          cursor-pointer select-none overflow-hidden
          ${disabled && !isEngaged ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
          ${className}
        `}
      >
        {/* Corner Brackets */}
        <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#39d9ff]/70" />
        <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#39d9ff]/70" />
        <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[#39d9ff]/70" />
        <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#39d9ff]/70" />

        {/* Engaged Glow Pulse */}
        {isEngaged && (
          <span className="absolute inset-0 bg-[#39d9ff]/10 animate-pulse pointer-events-none" />
        )}

        {/* Hover Light Sweep Effect */}
        {!isEngaged && (
          <span
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-700 bg-gradient-to-r from-transparent via-[#39d9ff]/15 to-transparent pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Original Geometric Ignition Icon */}
        <div className="relative flex items-center justify-center w-5 h-5 shrink-0" aria-hidden="true">
          <svg className={`w-5 h-5 text-[#39d9ff] transition-transform duration-300 ${isEngaged ? 'rotate-45 scale-110' : 'group-hover:rotate-45'}`} viewBox="0 0 24 24" fill="none">
            <polygon
              points="12,2 22,12 12,22 2,12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              className="opacity-70 group-hover:opacity-100"
            />
            <circle cx="12" cy="12" r="3" fill="currentColor" className={`opacity-90 transition-transform origin-center ${isEngaged ? 'scale-125' : 'group-hover:scale-125'}`} />
          </svg>
        </div>

        {/* Button Text formatted with Oxanium font hierarchy */}
        <span className="citadel-btn-text font-display text-sm font-semibold tracking-[0.14em] uppercase text-center whitespace-nowrap">
          {isEngaged ? 'CONTROL PLANE ENGAGED' : 'INITIALIZE CITADEL'}
        </span>

        {/* Trailing status pip */}
        <span className={`w-1.5 h-1.5 rounded-full ${isEngaged ? 'bg-[#d8f5ff] animate-ping' : 'bg-[#39d9ff] group-hover:bg-[#d8f5ff]'} shadow-[0_0_6px_#39d9ff] transition-colors`} />
      </button>
    </div>
  );
};
