import React from 'react';

interface BootRingSegmentProps {
  cx: number;
  cy: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  strokeWidth?: number;
  color?: string;
  opacity?: number;
  dashed?: boolean;
}

export const BootRingSegment: React.FC<BootRingSegmentProps> = ({
  cx,
  cy,
  radius,
  startAngle,
  endAngle,
  strokeWidth = 1,
  color = '#39d9ff',
  opacity = 0.5,
  dashed = false,
}) => {
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;

  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);

  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeOpacity={opacity}
      strokeDasharray={dashed ? '4 3' : undefined}
      strokeLinecap="round"
    />
  );
};
