import React from 'react';

interface GlobeArcProps {
  rx: number;
  ry: number;
  rotation: number;
  dashArray?: string;
  opacity?: number;
  strokeWidth?: number;
  color?: string;
  speed?: number; // seconds for full spin
  reverse?: boolean;
}

export const GlobeArc: React.FC<GlobeArcProps> = ({
  rx,
  ry,
  rotation,
  dashArray = '12 8 4 8',
  opacity = 0.45,
  strokeWidth = 1,
  color = '#39d9ff',
  speed = 40,
  reverse = false,
}) => {
  return (
    <g 
      transform={`rotate(${rotation} 200 200)`}
      style={{
        transformOrigin: '200px 200px',
        animation: `spin ${speed}s linear infinite ${reverse ? 'reverse' : 'normal'}`,
      }}
    >
      <ellipse
        cx="200"
        cy="200"
        rx={rx}
        ry={ry}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        strokeOpacity={opacity}
      />
    </g>
  );
};
