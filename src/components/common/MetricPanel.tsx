import React from 'react';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';
import { DataMeta } from '../../types';

interface MetricPanelProps {
  title: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  icon: LucideIcon;
  progressPercent?: number;
  status?: 'normal' | 'warning' | 'critical' | 'cyan';
  meta?: DataMeta;
  className?: string;
}

export const MetricPanel: React.FC<MetricPanelProps> = ({
  title,
  value,
  unit,
  subValue,
  icon: Icon,
  progressPercent,
  status = 'normal',
  meta,
  className,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'warning':
        return 'text-amber-400 border-amber-500/30';
      case 'critical':
        return 'text-rose-400 border-rose-500/30';
      case 'cyan':
        return 'text-cyan-300 border-cyan-500/30';
      default:
        return 'text-slate-200 border-slate-800/80';
    }
  };

  const getProgressColor = () => {
    if (progressPercent === undefined) return 'bg-cyan-500';
    if (progressPercent > 85) return 'bg-rose-500';
    if (progressPercent > 70) return 'bg-amber-400';
    return 'bg-cyan-400';
  };

  return (
    <div
      className={clsx(
        'bg-[#071124]/90 border rounded-lg p-4 flex flex-col justify-between transition-colors shadow-xs font-sans',
        getStatusColor(),
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-300 truncate">
          {title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {meta && (
            <span
              className={clsx(
                'text-[9px] font-mono px-1.5 py-0.2 rounded-xs border uppercase',
                meta.state === 'live'
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40'
                  : meta.state === 'stale'
                  ? 'text-amber-400 border-amber-500/30 bg-amber-950/40'
                  : meta.state === 'loading'
                  ? 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40'
                  : 'text-slate-400 border-slate-800'
              )}
            >
              {meta.state}
            </span>
          )}
          <Icon className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-xl font-medium font-mono text-white tracking-tight tabular-nums">
          {value}
        </span>
        {unit && <span className="text-xs font-mono text-slate-400">{unit}</span>}
      </div>

      {subValue && (
        <div className="text-xs text-slate-400 truncate mt-0.5">
          {subValue}
        </div>
      )}

      {progressPercent !== undefined && (
        <div className="w-full bg-[#040915] h-1.5 mt-3 overflow-hidden rounded-full border border-slate-800">
          <div
            className={clsx('h-full transition-all duration-300 rounded-full', getProgressColor())}
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      )}

      {meta?.source && (
        <div className="text-[10px] font-mono text-slate-400 mt-2 flex justify-between items-center pt-1.5 border-t border-slate-800/80">
          <span>SRC: {meta.source}</span>
          {meta.collectedAt && (
            <span className="tabular-nums">{new Date(meta.collectedAt).toLocaleTimeString([], { hour12: false })}</span>
          )}
        </div>
      )}
    </div>
  );
};
