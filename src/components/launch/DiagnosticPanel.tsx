import React from 'react';

interface DiagnosticPanelProps {
  title: string;
  badge?: string;
  position: 'left' | 'right';
  visible: boolean;
  children: React.ReactNode;
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({
  title,
  badge,
  position,
  visible,
  children,
}) => {
  return (
    <div
      className={`w-full max-w-[340px] xl:max-w-[380px] bg-[#08111c]/80 backdrop-blur-md border border-[#39d9ff]/25 p-4 relative overflow-hidden transition-all duration-700 select-none ${
        visible
          ? 'opacity-100 translate-x-0'
          : `opacity-0 ${position === 'left' ? '-translate-x-8' : 'translate-x-8'} pointer-events-none`
      }`}
    >
      {/* Precision Corner Accent Marks */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#39d9ff]" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#39d9ff]" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#39d9ff]" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#39d9ff]" />

      {/* Panel Top Header Bar */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#1F1F21]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-[#39d9ff] animate-pulse" />
          <h3 className="citadel-heading font-display text-xs font-semibold text-[#d8f5ff] uppercase tracking-[0.12em]">
            {title}
          </h3>
        </div>
        {badge && (
          <span className="text-[9px] font-hud px-1.5 py-0.5 bg-[#39d9ff]/10 border border-[#39d9ff]/30 text-[#39d9ff] uppercase tracking-wider rounded-xs">
            {badge}
          </span>
        )}
      </div>

      {/* Row Contents */}
      <div className="space-y-1">
        {children}
      </div>

      {/* Panel Bottom Footer Micro Coordinates */}
      <div className="pt-2.5 mt-2 border-t border-[#1F1F21]/60 flex items-center justify-between text-[8px] font-hud text-[#7890a5]/50">
        <span>CHANNEL // {position === 'left' ? 'PORT.01' : 'STBD.02'}</span>
        <span>AUTH.CHECK_OK</span>
      </div>
    </div>
  );
};
