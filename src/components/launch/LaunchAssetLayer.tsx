import React from 'react';
import entryScreenAsset from '../../assets/images/tactical_cyber_operations_vault_1788364481127.jpg';
import bootBackgroundAsset from '../../assets/images/citadel_launch_background_1787230120909.jpg';

export type LaunchAssetType = 'entry' | 'boot';
export type LaunchOverlayPreset = 'cinematic-vignette' | 'deep-space' | 'dimmed-recovery' | 'none';

interface LaunchAssetLayerProps {
  assetType: LaunchAssetType;
  opacity?: number;
  overlayPreset?: LaunchOverlayPreset;
  animated?: boolean;
  reducedMotion?: boolean;
  className?: string;
  crossfadeProgress?: number; // 0 (entry) to 1 (boot) for smooth blending
}

export const LaunchAssetLayer: React.FC<LaunchAssetLayerProps> = ({
  assetType,
  opacity,
  overlayPreset = 'cinematic-vignette',
  animated = true,
  reducedMotion = false,
  className = '',
  crossfadeProgress,
}) => {
  // Preset default opacity calibrations - clear, crisp visibility
  const resolvedOpacity = opacity !== undefined
    ? opacity
    : assetType === 'entry'
      ? 1.0
      : 0.90;

  const currentSrc = assetType === 'entry' ? entryScreenAsset : bootBackgroundAsset;

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}>
      {/* If dual crossfade mode is specified, render smoothly stacked layers */}
      {crossfadeProgress !== undefined ? (
        <>
          {/* Entry Layer */}
          <div
            className="absolute inset-0 transition-opacity duration-300 ease-out"
            style={{
              opacity: Math.max(0, 1 - crossfadeProgress),
              transform: !reducedMotion && animated ? `scale(${1 + crossfadeProgress * 0.03})` : 'none',
            }}
          >
            <img
              src={entryScreenAsset}
              alt="Citadel Tactical Reaper Entry Screen"
              className="w-full h-full object-cover object-center filter saturate-[1.08] contrast-[1.05]"
              draggable={false}
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Boot Background Layer */}
          <div
            className="absolute inset-0 transition-opacity duration-300 ease-out"
            style={{
              opacity: crossfadeProgress * resolvedOpacity,
              transform: !reducedMotion && animated ? `scale(${1 + (1 - crossfadeProgress) * 0.02})` : 'none',
            }}
          >
            <img
              src={bootBackgroundAsset}
              alt="Citadel Launch Background"
              className="w-full h-full object-cover object-center filter saturate-[1.05] brightness-[0.95]"
              draggable={false}
              referrerPolicy="no-referrer"
            />
          </div>
        </>
      ) : (
        /* Single Asset Mode */
        <div
          className="w-full h-full transition-all duration-700 ease-out"
          style={{
            opacity: resolvedOpacity,
            transform: !reducedMotion && animated && assetType === 'boot' ? 'scale(1.015)' : 'none',
          }}
        >
          <img
            src={currentSrc}
            alt={assetType === 'entry' ? 'Citadel Tactical Reaper Entry Gateway' : 'Citadel Operations Horizon'}
            className={`w-full h-full object-cover object-center ${
              assetType === 'entry'
                ? 'filter saturate-[1.1] contrast-[1.05]'
                : 'filter saturate-[1.0] brightness-[0.95]'
            }`}
            draggable={false}
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Cinematic Overlays & Darkening according to preset - lightened to keep image clearly visible */}
      {overlayPreset === 'cinematic-vignette' && (
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(5, 7, 11, 0.35) 65%, rgba(5, 7, 11, 0.75) 100%),
              linear-gradient(to bottom, rgba(5, 7, 11, 0.3) 0%, transparent 15%, transparent 75%, rgba(5, 7, 11, 0.6) 100%)
            `,
          }}
        />
      )}

      {overlayPreset === 'deep-space' && (
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 50% 45%, transparent 25%, rgba(5, 7, 11, 0.4) 60%, rgba(5, 7, 11, 0.8) 100%),
              linear-gradient(180deg, rgba(5, 7, 11, 0.35) 0%, transparent 35%, rgba(5, 7, 11, 0.65) 100%)
            `,
          }}
        />
      )}

      {overlayPreset === 'dimmed-recovery' && (
        <div
          className="absolute inset-0 bg-[#05070b]/80 backdrop-grayscale-[30%]"
          style={{
            background: `radial-gradient(ellipse at 50% 50%, rgba(255, 84, 104, 0.05) 0%, rgba(5, 7, 11, 0.85) 70%, #05070b 100%)`,
          }}
        />
      )}

      {/* Subtle Scanline Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(57, 217, 255, 0.3) 1px, transparent 1px)',
          backgroundSize: '100% 4px',
        }}
      />
    </div>
  );
};
