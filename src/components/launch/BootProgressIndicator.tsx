import React from 'react';

interface BootProgressIndicatorProps {
  progressPercentage: number;
  stageName: string;
  totalTimeSeconds?: number;
  elapsedSeconds?: number;
}

export const BootProgressIndicator: React.FC<BootProgressIndicatorProps> = ({
  progressPercentage,
  stageName,
  totalTimeSeconds = 60,
  elapsedSeconds = 0,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progressPercentage)));
  const totalSegments = 24;
  const filledSegments = Math.round((clampedProgress / 100) * totalSegments);

  return (
    <div className="w-full max-w-xl flex flex-col gap-1.5 select-none font-hud">
      {/* Metrics Row */}
      <div className="flex items-center justify-between text-[10px] text-[#7890a5]">
        <div className="flex items-center gap-2">
          <span className="text-[#39d9ff] font-semibold tracking-wider">[{stageName}]</span>
          <span className="font-terminal text-[10px] tracking-normal">T+{elapsedSeconds.toFixed(1)}s / {totalTimeSeconds}s</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="citadel-diag-value text-[#d8f5ff] font-medium text-xs font-terminal">{clampedProgress}%</span>
          <span className="text-[#7890a5]/60 text-[9px] tracking-wider uppercase">SYNCHRONIZED</span>
        </div>
      </div>

      {/* Segmented Tactical Bar */}
      <div className="flex items-center gap-1 w-full bg-[#05070b] p-1 border border-[#1F1F21] rounded-xs">
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isFilled = i < filledSegments;
          const isCurrent = i === filledSegments - 1;
          return (
            <div
              key={i}
              className={`h-2 flex-1 transition-all duration-200 rounded-xs ${
                isFilled
                  ? isCurrent
                    ? 'bg-[#39d9ff] shadow-[0_0_8px_#39d9ff]'
                    : 'bg-[#39d9ff]/70'
                  : 'bg-[#161618]'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
