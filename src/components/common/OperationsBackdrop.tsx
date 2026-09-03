import React from 'react';
import tacticalVaultBg from '../../assets/images/tactical_cyber_operations_vault_1788364481127.jpg';
import citadelHeroBg from '../../assets/images/citadel_hero_backdrop_1788363286699.jpg';
import heroBgSvg from '../../assets/images/hero_control_plane_grid.svg';

interface OperationsBackdropProps {
  variant?: 'hero' | 'vault';
  opacity?: number;
  className?: string;
  gridOpacity?: number;
}

export const OperationsBackdrop: React.FC<OperationsBackdropProps> = ({
  variant = 'hero',
  opacity = 0.54,
  className = '',
  gridOpacity = 0.10,
}) => {
  const bgImage = variant === 'vault' ? tacticalVaultBg : citadelHeroBg;

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* 1. Photorealistic Tactical Command Center Operations Backdrop */}
      <img
        src={bgImage}
        alt="Citadel Operations Nexus"
        referrerPolicy="no-referrer"
        style={{ opacity }}
        className="w-full h-full object-cover object-center scale-100 filter saturate-[1.20] contrast-[1.10] brightness-[1.03]"
      />

      {/* 2. Vector Grid Accent Pattern */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage: `url(${heroBgSvg})`,
          opacity: gridOpacity,
        }}
      />

      {/* 3. Dark Navy Readability Gradients (Preserves command center visibility while guaranteeing WCAG AA text contrast) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/50 via-[#050b18]/40 to-[#030712]/70 pointer-events-none" />

      {/* 4. Subtle Radial Atmospheric Lighting for Depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 65% at 50% 32%, rgba(6, 182, 212, 0.08), rgba(3, 7, 18, 0.28) 55%, rgba(3, 7, 18, 0.8) 100%)',
        }}
      />
    </div>
  );
};
