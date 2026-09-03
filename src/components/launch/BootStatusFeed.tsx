import React from 'react';
import { Terminal } from 'lucide-react';

interface BootStatusFeedProps {
  messages: string[];
  currentStage: string;
}

export const BootStatusFeed: React.FC<BootStatusFeedProps> = ({
  messages,
  currentStage,
}) => {
  // Show up to the last 4 messages
  const displayMessages = messages.slice(-4);

  return (
    <div 
      className="w-full max-w-xl bg-[#08111c]/80 backdrop-blur-sm border border-[#39d9ff]/20 p-3 select-none rounded-xs"
      aria-live="polite"
    >
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#1F1F21] text-[9px] font-hud text-[#7890a5]">
        <div className="flex items-center gap-1.5 text-[#39d9ff]">
          <Terminal className="w-3 h-3" />
          <span className="font-semibold uppercase tracking-[0.12em]">BOOT CONSOLE STREAM</span>
        </div>
        <span className="uppercase tracking-widest text-[#39d9ff] font-medium">{currentStage}</span>
      </div>

      <div className="space-y-1 font-hud text-[11px] min-h-[72px] flex flex-col justify-end">
        {displayMessages.map((msg, idx) => {
          const isLatest = idx === displayMessages.length - 1;
          return (
            <div
              key={idx}
              className={`flex items-center gap-2 tracking-[0.08em] uppercase transition-all ${
                isLatest ? 'text-[#d8f5ff] font-medium' : 'text-[#7890a5]/80'
              }`}
            >
              <span className="text-[#39d9ff]/60 select-none text-[10px]">›</span>
              <span className="truncate">{msg}</span>
              {isLatest && (
                <span className="w-1.5 h-3 bg-[#39d9ff] animate-pulse shrink-0 inline-block" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
