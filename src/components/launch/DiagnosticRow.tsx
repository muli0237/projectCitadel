import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Loader2, 
  MinusCircle 
} from 'lucide-react';
import { BootCheckStatus } from '../../types/boot';

interface DiagnosticRowProps {
  label: string;
  value: string;
  status: BootCheckStatus;
  subValue?: string;
}

export const DiagnosticRow: React.FC<DiagnosticRowProps> = ({
  label,
  value,
  status,
  subValue,
}) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#39d9ff]" />,
          textClass: 'text-[#d8f5ff]',
          badgeClass: 'bg-[#39d9ff]/10 text-[#39d9ff] border-[#39d9ff]/40 shadow-[0_0_8px_rgba(57,217,255,0.2)]',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-[#ffbd59]" />,
          textClass: 'text-[#ffbd59]',
          badgeClass: 'bg-[#ffbd59]/10 text-[#ffbd59] border-[#ffbd59]/40',
        };
      case 'error':
        return {
          icon: <XCircle className="w-3.5 h-3.5 text-[#ff5468]" />,
          textClass: 'text-[#ff5468]',
          badgeClass: 'bg-[#ff5468]/10 text-[#ff5468] border-[#ff5468]/40',
        };
      case 'running':
        return {
          icon: <Loader2 className="w-3.5 h-3.5 text-[#39d9ff] animate-spin" />,
          textClass: 'text-[#39d9ff]',
          badgeClass: 'bg-[#39d9ff]/10 text-[#39d9ff] border-[#39d9ff]/30',
        };
      case 'skipped':
        return {
          icon: <MinusCircle className="w-3.5 h-3.5 text-[#7890a5]" />,
          textClass: 'text-[#7890a5]',
          badgeClass: 'bg-[#7890a5]/10 text-[#7890a5] border-[#7890a5]/30',
        };
      case 'pending':
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5 text-[#7890a5]/60" />,
          textClass: 'text-[#7890a5]/80',
          badgeClass: 'bg-[#7890a5]/10 text-[#7890a5]/70 border-[#7890a5]/20',
        };
    }
  };

  const currentStatus = getStatusDisplay();

  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1F1F21]/80 last:border-b-0 gap-3 group">
      <div className="flex items-center gap-2 min-w-0">
        <div className="shrink-0">{currentStatus.icon}</div>
        <div className="truncate">
          {/* Diagnostic Label: Share Tech Mono 400, uppercase, letter spacing 0.12em */}
          <div className="citadel-diag-label text-[10px] font-hud tracking-[0.12em] text-[#7890a5] uppercase font-normal truncate">
            {label}
          </div>
          {subValue && (
            <div className="text-[9px] font-terminal text-[#4F4F52] truncate">
              {subValue}
            </div>
          )}
        </div>
      </div>

      {/* Diagnostic Value: JetBrains Mono 500 */}
      <div className={`citadel-diag-value px-2 py-0.5 border text-[10px] font-terminal uppercase font-medium shrink-0 truncate max-w-[140px] text-right rounded-xs ${currentStatus.badgeClass}`}>
        {value}
      </div>
    </div>
  );
};
