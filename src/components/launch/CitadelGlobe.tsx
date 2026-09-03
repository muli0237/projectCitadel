import React, { useEffect, useRef, useState } from 'react';
import { GlobeArc } from './GlobeArc';
import { OrbitalNode } from './OrbitalNode';

interface CitadelGlobeProps {
  size?: number;
  reducedMotion?: boolean;
  isActivated?: boolean;
  statusColor?: string;
  showScanSweep?: boolean;
  buildProgress?: number; // 0 to 1: controls line-by-line wireframe emergence
  isRotating?: boolean;
  isPaused?: boolean;
  isDissolving?: boolean;
  pulseTrigger?: boolean;
}

export const CitadelGlobe: React.FC<CitadelGlobeProps> = ({
  size = 380,
  reducedMotion = false,
  isActivated = true,
  statusColor = '#39d9ff',
  showScanSweep = true,
  buildProgress = 1.0,
  isRotating = true,
  isPaused = false,
  isDissolving = false,
  pulseTrigger = false,
}) => {
  const [rotationAngle, setRotationAngle] = useState(0);
  const [sweepAngle, setSweepAngle] = useState(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    if (reducedMotion) return;

    const animate = (time: number) => {
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (isRotating && !isPaused) {
        setRotationAngle((prev) => (prev + delta * 9) % 360);
      }
      if (showScanSweep && !isPaused) {
        setSweepAngle((prev) => (prev + delta * 32) % 360);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [reducedMotion, isRotating, isPaused, showScanSweep]);

  // Compute 3D longitude lines projected onto 2D
  const numLongitudes = 8;
  const longitudes = Array.from({ length: numLongitudes }, (_, i) => {
    const baseAngle = (i * 180) / numLongitudes;
    const currentAngle = (baseAngle + rotationAngle) % 180;
    const rad = (currentAngle * Math.PI) / 180;
    const rx = Math.abs(Math.cos(rad)) * 120;
    const isFront = Math.sin(rad) >= 0;
    // Sequential appearance based on buildProgress (21-28s)
    const lineThreshold = (i + 1) / (numLongitudes + 2);
    const visible = buildProgress >= lineThreshold || reducedMotion;
    const lineOpacity = visible ? (isFront ? 0.65 : 0.25) : 0;

    return { 
      id: i, 
      rx: Math.max(rx, 2), 
      isFront, 
      opacity: lineOpacity,
      visible,
    };
  });

  // Abstract geometric tactical landmasses
  const landmasses = [
    { d: 'M 160 140 Q 180 130 210 135 T 240 150 Q 230 170 200 165 T 160 140 Z', opacity: 0.35, order: 0.2 },
    { d: 'M 145 185 Q 165 175 190 180 T 215 200 Q 195 215 165 210 T 145 185 Z', opacity: 0.25, order: 0.4 },
    { d: 'M 170 230 Q 190 225 215 235 T 235 250 Q 210 260 185 255 T 170 230 Z', opacity: 0.3, order: 0.6 },
    { d: 'M 210 170 Q 235 160 250 175 T 255 195 Q 235 205 215 195 T 210 170 Z', opacity: 0.2, order: 0.8 },
  ];

  return (
    <div 
      className={`relative flex items-center justify-center select-none pointer-events-none transition-all duration-700 ease-out ${
        isDissolving ? 'scale-75 opacity-0 blur-[1px]' : 'scale-100 opacity-100'
      }`}
      style={{ width: size, height: size }}
    >
      {/* Restrained Cyan Pulse Ring when triggered (50-55s) */}
      {pulseTrigger && (
        <div 
          className="absolute inset-0 rounded-full border-2 border-[#39d9ff] animate-ping pointer-events-none opacity-40"
          style={{ animationDuration: '1.4s' }}
        />
      )}

      <svg
        viewBox="0 0 400 400"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Holographic Radial Glow */}
          <radialGradient id="globe-glow-v2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={statusColor} stopOpacity={buildProgress * 0.15} />
            <stop offset="65%" stopColor={statusColor} stopOpacity={buildProgress * 0.04} />
            <stop offset="100%" stopColor={statusColor} stopOpacity="0" />
          </radialGradient>

          {/* Sweeping Radar Gradient */}
          <linearGradient id="sweep-gradient-v2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={statusColor} stopOpacity="0.45" />
            <stop offset="50%" stopColor={statusColor} stopOpacity="0.1" />
            <stop offset="100%" stopColor={statusColor} stopOpacity="0" />
          </linearGradient>

          {/* Core Depth Shade */}
          <radialGradient id="sphere-shade-v2" cx="38%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#d8f5ff" stopOpacity={0.12 * buildProgress} />
            <stop offset="60%" stopColor="#08111c" stopOpacity={0.45 * buildProgress} />
            <stop offset="100%" stopColor="#05070b" stopOpacity={0.9 * buildProgress} />
          </radialGradient>
        </defs>

        {/* Ambient Atmosphere Sphere */}
        <circle cx="200" cy="200" r="135" fill="url(#globe-glow-v2)" />

        {/* Sphere Base Depth Fill */}
        <circle cx="200" cy="200" r="120" fill="url(#sphere-shade-v2)" />

        {/* Outer Globe Border Boundary */}
        <circle
          cx="200"
          cy="200"
          r="120"
          fill="none"
          stroke={statusColor}
          strokeWidth="1.2"
          strokeOpacity={Math.min(0.85, buildProgress * 0.85)}
          strokeDasharray={buildProgress < 1 && !reducedMotion ? `${buildProgress * 754} 754` : 'none'}
          className="transition-all duration-500 ease-out"
        />

        {/* Equatorial & Latitude Parallels (Line-by-line build) */}
        {buildProgress >= 0.3 && (
          <ellipse
            cx="200"
            cy="200"
            rx="120"
            ry="24"
            fill="none"
            stroke={statusColor}
            strokeWidth="1"
            strokeOpacity={0.65}
            strokeDasharray="4 3"
          />
        )}

        {buildProgress >= 0.5 && (
          <>
            <ellipse cx="200" cy="155" rx="108" ry="18" fill="none" stroke={statusColor} strokeWidth="0.8" strokeOpacity="0.45" strokeDasharray="2 3" />
            <ellipse cx="200" cy="245" rx="108" ry="18" fill="none" stroke={statusColor} strokeWidth="0.8" strokeOpacity="0.45" strokeDasharray="2 3" />
          </>
        )}

        {buildProgress >= 0.75 && (
          <>
            <ellipse cx="200" cy="120" rx="80" ry="12" fill="none" stroke={statusColor} strokeWidth="0.6" strokeOpacity="0.3" />
            <ellipse cx="200" cy="280" rx="80" ry="12" fill="none" stroke={statusColor} strokeWidth="0.6" strokeOpacity="0.3" />
          </>
        )}

        {/* Prime Meridians & Rotating Longitudes */}
        {longitudes.map((long) =>
          long.visible ? (
            <ellipse
              key={long.id}
              cx="200"
              cy="200"
              rx={long.rx}
              ry="120"
              fill="none"
              stroke={statusColor}
              strokeWidth={long.isFront ? '0.9' : '0.5'}
              strokeOpacity={long.opacity}
              strokeDasharray={long.isFront ? 'none' : '3 3'}
            />
          ) : null
        )}

        {/* Abstract Continent Landmass Silhouette Geometry */}
        {buildProgress >= 0.6 && (
          <g 
            className="transition-opacity duration-700" 
            style={{ opacity: isActivated ? 1 : 0.2 }}
          >
            {landmasses.map((land, idx) =>
              buildProgress >= land.order || reducedMotion ? (
                <path
                  key={idx}
                  d={land.d}
                  fill={statusColor}
                  fillOpacity={land.opacity * 0.4}
                  stroke={statusColor}
                  strokeWidth="0.75"
                  strokeOpacity={land.opacity}
                />
              ) : null
            )}
          </g>
        )}

        {/* Central Core Polar Axis */}
        {buildProgress >= 0.2 && (
          <>
            <line x1="200" y1="65" x2="200" y2="335" stroke={statusColor} strokeWidth="0.8" strokeOpacity="0.55" strokeDasharray="6 4" />
            <circle cx="200" cy="80" r="2.5" fill={statusColor} />
            <circle cx="200" cy="320" r="2.5" fill={statusColor} />
          </>
        )}

        {/* Orbital Trajectory Arcs (Revealed during 28s+) */}
        {buildProgress >= 0.8 && (
          <>
            <GlobeArc rx={150} ry={48} rotation={-25} dashArray="16 12 4 12" opacity={0.4} color={statusColor} speed={55} />
            <GlobeArc rx={165} ry={52} rotation={42} dashArray="24 16 6 16" opacity={0.35} color="#367cff" speed={70} reverse />
            <GlobeArc rx={180} ry={60} rotation={-65} dashArray="8 6" opacity={0.25} color={statusColor} speed={45} />
            <GlobeArc rx={195} ry={75} rotation={15} dashArray="30 20 8 20" opacity={0.3} color="#d8f5ff" speed={85} />
            <GlobeArc rx={210} ry={90} rotation={-45} dashArray="4 8" opacity={0.2} color={statusColor} speed={60} reverse />

            {/* Pulsing Telemetry Nodes Orbiting on Arcs */}
            <OrbitalNode radius={150} angle={rotationAngle * 1.5 + 40} size={2.5} color={statusColor} label="NODE-1" />
            <OrbitalNode radius={165} angle={-rotationAngle * 1.2 + 190} size={3} color="#367cff" label="CORE-SYNC" />
            <OrbitalNode radius={180} angle={rotationAngle * 0.9 + 110} size={2} color="#d8f5ff" />
            <OrbitalNode radius={195} angle={-rotationAngle * 1.4 + 300} size={2.5} color={statusColor} label="PORTABLE" />
          </>
        )}

        {/* Sweeping Radar Scan Sector */}
        {showScanSweep && !isPaused && !reducedMotion && buildProgress >= 0.5 && (
          <g transform={`rotate(${sweepAngle} 200 200)`} style={{ transformOrigin: '200px 200px' }}>
            <path
              d="M 200 200 L 320 200 A 120 120 0 0 0 284 116 Z"
              fill="url(#sweep-gradient-v2)"
            />
            <line x1="200" y1="200" x2="320" y2="200" stroke={statusColor} strokeWidth="1.2" strokeOpacity="0.75" />
          </g>
        )}

        {/* Center Reticle Focus Target */}
        <circle cx="200" cy="200" r="6" fill="none" stroke={statusColor} strokeWidth="0.8" strokeOpacity="0.7" />
        <circle cx="200" cy="200" r="1.8" fill={statusColor} className={pulseTrigger ? 'animate-ping' : ''} />
      </svg>
    </div>
  );
};
