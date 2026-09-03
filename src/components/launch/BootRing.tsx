import React from 'react';
import { BootRingSegment } from './BootRingSegment';

interface BootRingProps {
  size?: number;
  stageProgress?: number; // 0 to 1
  reducedMotion?: boolean;
  statusColor?: string;
  assembledRingCount?: number; // 1 to 4 rings active
  isOuterRingComplete?: boolean; // When true, outer ring becomes full solid/continuous ring
  counterRotateSpeed?: number; // Speed multiplier for counter-rotation phase (44-50s)
  isPaused?: boolean;
}

export const BootRing: React.FC<BootRingProps> = ({
  size = 520,
  stageProgress = 1,
  reducedMotion = false,
  statusColor = '#39d9ff',
  assembledRingCount = 4,
  isOuterRingComplete = false,
  counterRotateSpeed = 1,
  isPaused = false,
}) => {
  // Radial calibration tick marks
  const ticks = Array.from({ length: 48 }, (_, i) => {
    const angle = (i * 360) / 48;
    const isMajor = i % 6 === 0;
    const rad = ((angle - 90) * Math.PI) / 180;
    const rInner = isMajor ? 218 : 222;
    const rOuter = 226;
    return {
      id: i,
      x1: 250 + rInner * Math.cos(rad),
      y1: 250 + rInner * Math.sin(rad),
      x2: 250 + rOuter * Math.cos(rad),
      y2: 250 + rOuter * Math.sin(rad),
      isMajor,
    };
  });

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none transition-opacity duration-700"
      style={{ opacity: Math.min(1, stageProgress * 1.2) }}
    >
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full max-w-[560px] max-h-[560px] overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ring 1: Inner Segmented Mechanical Dial (Clockwise) */}
        {assembledRingCount >= 1 && (
          <g
            className={reducedMotion || isPaused ? '' : 'origin-center'}
            style={{
              transformOrigin: '250px 250px',
              animation: reducedMotion || isPaused ? 'none' : `spin ${70 / counterRotateSpeed}s linear infinite`,
            }}
          >
            <BootRingSegment cx={250} cy={250} radius={175} startAngle={15} endAngle={75} strokeWidth={1.5} color={statusColor} opacity={0.65} />
            <BootRingSegment cx={250} cy={250} radius={175} startAngle={105} endAngle={165} strokeWidth={1.5} color={statusColor} opacity={0.65} />
            <BootRingSegment cx={250} cy={250} radius={175} startAngle={195} endAngle={255} strokeWidth={1.5} color={statusColor} opacity={0.65} />
            <BootRingSegment cx={250} cy={250} radius={175} startAngle={285} endAngle={345} strokeWidth={1.5} color={statusColor} opacity={0.65} />
            
            {/* Inner Corner Brackets */}
            <path d="M 240 72 L 250 72 L 250 82" fill="none" stroke={statusColor} strokeWidth="1" strokeOpacity="0.8" />
            <path d="M 260 72 L 250 72 L 250 82" fill="none" stroke={statusColor} strokeWidth="1" strokeOpacity="0.8" />
            <path d="M 240 428 L 250 428 L 250 418" fill="none" stroke={statusColor} strokeWidth="1" strokeOpacity="0.8" />
            <path d="M 260 428 L 250 428 L 250 418" fill="none" stroke={statusColor} strokeWidth="1" strokeOpacity="0.8" />
          </g>
        )}

        {/* Ring 2: Intermediate Tactical Ring */}
        {assembledRingCount >= 2 && (
          <g
            className={reducedMotion || isPaused ? '' : 'origin-center'}
            style={{
              transformOrigin: '250px 250px',
              animation: reducedMotion || isPaused ? 'none' : `spin ${55 / counterRotateSpeed}s linear infinite reverse`,
            }}
          >
            <BootRingSegment cx={250} cy={250} radius={195} startAngle={30} endAngle={60} strokeWidth={1.2} color="#367cff" opacity={0.4} />
            <BootRingSegment cx={250} cy={250} radius={195} startAngle={120} endAngle={150} strokeWidth={1.2} color="#367cff" opacity={0.4} />
            <BootRingSegment cx={250} cy={250} radius={195} startAngle={210} endAngle={240} strokeWidth={1.2} color="#367cff" opacity={0.4} />
            <BootRingSegment cx={250} cy={250} radius={195} startAngle={300} endAngle={330} strokeWidth={1.2} color="#367cff" opacity={0.4} />
          </g>
        )}

        {/* Ring 3: Precision Calibration Ticks Ring (Counter-Clockwise) */}
        {assembledRingCount >= 3 && (
          <g
            className={reducedMotion || isPaused ? '' : 'origin-center'}
            style={{
              transformOrigin: '250px 250px',
              animation: reducedMotion || isPaused ? 'none' : `spin ${90 / counterRotateSpeed}s linear infinite reverse`,
            }}
          >
            {ticks.map((tick) => (
              <line
                key={tick.id}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke={statusColor}
                strokeWidth={tick.isMajor ? '1.2' : '0.6'}
                strokeOpacity={tick.isMajor ? '0.7' : '0.25'}
              />
            ))}

            {/* Calibration Degree Labels */}
            <text x="250" y="32" fill={statusColor} fontSize="7" fontFamily="monospace" textAnchor="middle" opacity="0.65">
              CAL 000°
            </text>
            <text x="468" y="252" fill={statusColor} fontSize="7" fontFamily="monospace" textAnchor="middle" opacity="0.65">
              090°
            </text>
            <text x="250" y="474" fill={statusColor} fontSize="7" fontFamily="monospace" textAnchor="middle" opacity="0.65">
              180°
            </text>
            <text x="32" y="252" fill={statusColor} fontSize="7" fontFamily="monospace" textAnchor="middle" opacity="0.65">
              270°
            </text>
          </g>
        )}

        {/* Ring 4: Outer Modular Brackets Ring (Clockwise / Locks when complete) */}
        {assembledRingCount >= 4 && (
          <g
            className={reducedMotion || isPaused || isOuterRingComplete ? '' : 'origin-center'}
            style={{
              transformOrigin: '250px 250px',
              animation: reducedMotion || isPaused || isOuterRingComplete ? 'none' : `spin ${140 / counterRotateSpeed}s linear infinite`,
            }}
          >
            {isOuterRingComplete ? (
              /* Completed Outer Ring at 50-55s */
              <circle
                cx={250}
                cy={250}
                r={240}
                fill="none"
                stroke={statusColor}
                strokeWidth="1.6"
                strokeOpacity="0.9"
                className="transition-all duration-700 ease-out"
              />
            ) : (
              /* Segmented Outer Brackets */
              <>
                <BootRingSegment cx={250} cy={250} radius={240} startAngle={5} endAngle={40} strokeWidth={1} color="#367cff" opacity={0.45} />
                <BootRingSegment cx={250} cy={250} radius={240} startAngle={95} endAngle={130} strokeWidth={1} color="#367cff" opacity={0.45} />
                <BootRingSegment cx={250} cy={250} radius={240} startAngle={185} endAngle={220} strokeWidth={1} color="#367cff" opacity={0.45} />
                <BootRingSegment cx={250} cy={250} radius={240} startAngle={275} endAngle={310} strokeWidth={1} color="#367cff" opacity={0.45} />
              </>
            )}

            {/* Precision Outer Corner Reticles */}
            <rect x="246" y="8" width="8" height="2" fill={statusColor} opacity="0.7" />
            <rect x="246" y="490" width="8" height="2" fill={statusColor} opacity="0.7" />
            <rect x="8" y="246" width="2" height="8" fill={statusColor} opacity="0.7" />
            <rect x="490" y="246" width="2" height="8" fill={statusColor} opacity="0.7" />
          </g>
        )}
      </svg>
    </div>
  );
};
