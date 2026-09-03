import React from 'react';

interface LaunchWordmarkProps {
  isReady?: boolean;
  subTitle?: string;
}

export const LaunchWordmark: React.FC<LaunchWordmarkProps> = ({
  isReady = false,
  subTitle = 'PORTABLE OPERATIONS WORKSPACE',
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center select-none z-10 pointer-events-none">
      {/* Geometric Citadel Monogram */}
      <div className="mb-3 relative flex items-center justify-center">
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer Shield Hexagon */}
          <polygon
            points="22,2 40,12 40,32 22,42 4,32 4,12"
            stroke={isReady ? '#39d9ff' : '#7890a5'}
            strokeWidth="1.5"
            strokeOpacity="0.8"
            fill="#08111c"
            fillOpacity="0.8"
          />
          {/* Inner Citadel Bastion Geometric Core */}
          <polygon
            points="22,8 34,15 34,29 22,36 10,29 10,15"
            stroke={isReady ? '#39d9ff' : '#367cff'}
            strokeWidth="1.2"
            fill="none"
            strokeDasharray="4 2"
          />
          {/* Center Command Core */}
          <circle cx="22" cy="22" r="3.5" fill={isReady ? '#39d9ff' : '#367cff'} />
          <line x1="22" y1="12" x2="22" y2="16" stroke="#39d9ff" strokeWidth="1.5" />
          <line x1="22" y1="28" x2="22" y2="32" stroke="#39d9ff" strokeWidth="1.5" />
          <line x1="12" y1="22" x2="16" y2="22" stroke="#39d9ff" strokeWidth="1.5" />
          <line x1="28" y1="22" x2="32" y2="22" stroke="#39d9ff" strokeWidth="1.5" />
        </svg>

        {/* Glow Halo if Ready */}
        {isReady && (
          <div className="absolute inset-0 bg-[#39d9ff]/20 blur-md rounded-full pointer-events-none" />
        )}
      </div>

      {/* Main Title Wordmark */}
      <h1 className="citadel-wordmark text-xl sm:text-2xl md:text-3xl font-display font-bold tracking-[0.18em] text-[#d8f5ff] uppercase drop-shadow-[0_0_15px_rgba(57,217,255,0.4)]">
        {isReady ? 'CITADEL ONLINE' : 'CITADEL'}
      </h1>

      {/* Subtitle / Status */}
      <div className="mt-1 flex items-center gap-2">
        <span className="h-[1px] w-6 bg-[#39d9ff]/40" />
        <p className="citadel-heading text-[10px] sm:text-xs font-display tracking-[0.12em] text-[#39d9ff] uppercase font-semibold">
          {isReady ? 'CONTROL PLANE READY' : subTitle}
        </p>
        <span className="h-[1px] w-6 bg-[#39d9ff]/40" />
      </div>
    </div>
  );
};
