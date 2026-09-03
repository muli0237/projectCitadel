import React from 'react';
import bgImage from '../../assets/images/citadel_orbit_bg_1787229317461.jpg';

interface LaunchBackgroundProps {
  opacity?: number;
}

export const LaunchBackground: React.FC<LaunchBackgroundProps> = ({ opacity = 0.85 }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Base Space Backdrop */}
      <div className="absolute inset-0 bg-[#05070b]" />

      {/* Orbit Background Image */}
      <img
        src={bgImage}
        alt="Citadel Orbital Command Environment"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover object-center filter saturate-75 contrast-125 brightness-75 transition-opacity duration-1000"
        style={{ opacity }}
      />

      {/* Color Grade & Navy-Teal Tint Layer */}
      <div 
        className="absolute inset-0 mix-blend-multiply opacity-80 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(5,7,11,0.92) 0%, rgba(8,17,28,0.7) 50%, rgba(5,7,11,0.95) 100%)'
        }}
      />

      {/* Subtle Scan Lines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.4) 3px, rgba(0, 0, 0, 0.4) 4px)',
          backgroundSize: '100% 4px'
        }}
      />
    </div>
  );
};
