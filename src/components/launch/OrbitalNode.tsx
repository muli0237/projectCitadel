import React from 'react';

interface OrbitalNodeProps {
  radius: number;
  angle: number; // in degrees
  size?: number;
  color?: string;
  label?: string;
}

export const OrbitalNode: React.FC<OrbitalNodeProps> = ({
  radius,
  angle,
  size = 3,
  color = '#39d9ff',
  label,
}) => {
  const rad = (angle * Math.PI) / 180;
  const x = 200 + radius * Math.cos(rad);
  const y = 200 + radius * Math.sin(rad);

  return (
    <g>
      {/* Outer Halo */}
      <circle cx={x} cy={y} r={size * 2} fill={color} fillOpacity="0.15" />
      {/* Core Node Point */}
      <circle cx={x} cy={y} r={size} fill={color} />
      {/* Micro Marker Cross */}
      <line x1={x - size - 1} y1={y} x2={x + size + 1} y2={y} stroke={color} strokeWidth="0.5" strokeOpacity="0.6" />
      <line x1={x} y1={y - size - 1} x2={x} y2={y + size + 1} stroke={color} strokeWidth="0.5" strokeOpacity="0.6" />
      {label && (
        <text
          x={x + size + 3}
          y={y + 3}
          fill="#d8f5ff"
          fontSize="6"
          fontFamily="monospace"
          opacity="0.75"
        >
          {label}
        </text>
      )}
    </g>
  );
};
