import React from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useCitadelStore } from '../../store/useCitadelStore';

export const AuthorizationBanner: React.FC = () => {
  const { authorizationAcknowledged, acknowledgeAuthorization } = useCitadelStore();

  if (authorizationAcknowledged) return null;

  return (
    <div className="bg-[#0b101c] border-b border-amber-500/30 px-4 md:px-6 py-2.5 flex items-center justify-between gap-4 select-none z-20 shrink-0 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-md bg-amber-950/60 border border-amber-500/30 text-amber-400 shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-amber-300 tracking-wide">
            Mandatory Rules of Engagement (RoE) Notice
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
            Assess only explicitly authorized targets and networks. Unauthorized actions are strictly prohibited.
          </p>
        </div>
      </div>

      <button
        onClick={acknowledgeAuthorization}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 text-xs font-medium rounded-md transition-colors shrink-0 cursor-pointer"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Acknowledge Scope</span>
      </button>
    </div>
  );
};
