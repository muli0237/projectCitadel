import React from 'react';
import { clsx } from 'clsx';

interface StatusPillProps {
  status: 'active' | 'healthy' | 'warning' | 'critical' | 'idle' | 'elevated' | 'locked';
  label: string;
  subLabel?: string;
  pulse?: boolean;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  label,
  subLabel,
  pulse = false,
  className,
}) => {
  const getStyles = () => {
    switch (status) {
      case 'active':
      case 'healthy':
        return {
          bg: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300',
          dot: 'bg-emerald-400',
          pulseClass: 'status-indicator-emerald',
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/40 border-amber-500/30 text-amber-300',
          dot: 'bg-amber-400',
          pulseClass: 'status-indicator-amber',
        };
      case 'critical':
        return {
          bg: 'bg-rose-950/40 border-rose-500/30 text-rose-300',
          dot: 'bg-rose-400',
          pulseClass: 'status-indicator-red',
        };
      case 'elevated':
        return {
          bg: 'bg-rose-950/40 border-rose-500/30 text-rose-300',
          dot: 'bg-rose-400',
          pulseClass: 'status-indicator-red',
        };
      case 'locked':
        return {
          bg: 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300',
          dot: 'bg-cyan-400',
          pulseClass: 'status-indicator-pulse',
        };
      case 'idle':
      default:
        return {
          bg: 'bg-[#040915] border-slate-800 text-slate-400',
          dot: 'bg-slate-500',
          pulseClass: '',
        };
    }
  };

  const style = getStyles();

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-full text-[10px] font-mono font-medium select-none whitespace-nowrap',
        style.bg,
        className
      )}
    >
      <span
        className={clsx(
          'w-1.5 h-1.5 rounded-full shrink-0',
          style.dot,
          pulse && 'animate-pulse'
        )}
      />
      <span>{label}</span>
      {subLabel && <span className="text-slate-400 text-[9px] ml-0.5">[{subLabel}]</span>}
    </div>
  );
};
