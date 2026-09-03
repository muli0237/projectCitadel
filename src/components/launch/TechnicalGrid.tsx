import React from 'react';

interface TechnicalGridProps {
  gridSize?: number;
  opacity?: number;
  showCoordinates?: boolean;
}

export const TechnicalGrid: React.FC<TechnicalGridProps> = ({
  gridSize = 72,
  opacity = 0.12,
  showCoordinates = true,
}) => {
  return (
    <div 
      className="absolute inset-0 pointer-events-none select-none z-2 overflow-hidden transition-opacity duration-1000"
      style={{ opacity }}
    >
      {/* Precision Vector Grid */}
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="citadel-tech-grid"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            {/* Fine Grid Lines */}
            <path
              d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
              fill="none"
              stroke="#39d9ff"
              strokeWidth="0.75"
              strokeOpacity="0.7"
            />
            {/* Center Intersection Crosshairs */}
            <circle cx={gridSize / 2} cy={gridSize / 2} r="0.8" fill="#39d9ff" fillOpacity="0.6" />
            <path
              d={`M ${gridSize / 2 - 3} ${gridSize / 2} L ${gridSize / 2 + 3} ${gridSize / 2} M ${gridSize / 2} ${gridSize / 2 - 3} L ${gridSize / 2} ${gridSize / 2 + 3}`}
              stroke="#39d9ff"
              strokeWidth="0.5"
              strokeOpacity="0.4"
            />
          </pattern>

          {/* Radial Fade Mask for Grid */}
          <radialGradient id="grid-fade-mask" cx="50%" cy="50%" r="55%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#fff" stopOpacity="0.4" />
            <stop offset="95%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>

          <mask id="grid-mask">
            <rect width="100%" height="100%" fill="url(#grid-fade-mask)" />
          </mask>
        </defs>

        <rect width="100%" height="100%" fill="url(#citadel-tech-grid)" mask="url(#grid-mask)" />
      </svg>

      {/* Decorative Peripheral Coordinate Marks */}
      {showCoordinates && (
        <div className="absolute inset-x-8 top-4 flex justify-between text-[8px] font-mono text-[#39d9ff]/30 tracking-widest pointer-events-none">
          <span>SEC // 001.44.A</span>
          <span>LAT 00°00&apos;00&quot;N</span>
          <span>GRID SYNC // NOMINAL</span>
          <span>LON 00°00&apos;00&quot;E</span>
          <span>SEC // 004.88.C</span>
        </div>
      )}
    </div>
  );
};
