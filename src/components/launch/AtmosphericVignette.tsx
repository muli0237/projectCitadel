import React from 'react';

export const AtmosphericVignette: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-1">
      {/* Radial Vignette: Clear Center with Heavy Dark Peripheral Shadow */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 65% 65% at 50% 50%, rgba(5, 7, 11, 0.2) 0%, rgba(5, 7, 11, 0.75) 60%, rgba(5, 7, 11, 0.98) 100%)'
        }}
      />

      {/* Top-to-Bottom Contrast Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(5, 7, 11, 0.85) 0%, rgba(5, 7, 11, 0.1) 25%, rgba(5, 7, 11, 0.1) 75%, rgba(5, 7, 11, 0.92) 100%)'
        }}
      />

      {/* Left/Right Edge Shadow to frame Diagnostics */}
      <div 
        className="absolute inset-0 hidden md:block"
        style={{
          background: 'linear-gradient(90deg, rgba(5, 7, 11, 0.75) 0%, transparent 20%, transparent 80%, rgba(5, 7, 11, 0.75) 100%)'
        }}
      />
    </div>
  );
};
