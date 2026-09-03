import React, { useState } from 'react';
import {
  FileText,
  Search,
  Shield,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';
import { AuditEntry } from '../../../../types';
import { useCitadelStore } from '../../../../store/useCitadelStore';

interface LogsPanelProps {
  logs: AuditEntry[];
}

export const LogsPanel: React.FC<LogsPanelProps> = ({ logs }) => {
  const { showToast } = useCitadelStore();
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const severities = ['ALL', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];

  const filteredLogs = logs.filter((log) => {
    const matchesSeverity =
      filterSeverity === 'ALL' ||
      log.severity.toUpperCase() === filterSeverity.toUpperCase();
    const matchesSearch =
      search === '' ||
      log.actionType.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      (log.targetPath && log.targetPath.toLowerCase().includes(search.toLowerCase()));
    return matchesSeverity && matchesSearch;
  });

  const handleExportLogs = () => {
    const jsonBlob = new Blob([JSON.stringify(logs, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citadel_enclave_audit_log_${Date.now()}.json`;
    a.click();
    showToast({
      type: 'success',
      title: 'Audit Logs Exported',
      message: `${logs.length} audit entries saved to JSON`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Severity Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#040915] p-3 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2 bg-[#060e1d] border border-slate-700/60 rounded-md px-3 py-1.5 flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search audit events by keyword or path..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-hidden w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-mono">
            {severities.map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  filterSeverity === sev
                    ? 'bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#060e1d] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white rounded-md transition-colors cursor-pointer shrink-0"
            title="Export JSON audit logs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Log Entries Table */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((entry) => {
            const isError = entry.severity === 'ERROR' || entry.severity === 'CRITICAL';
            const isWarn = entry.severity === 'WARN';

            return (
              <div
                key={entry.id}
                className="p-3 bg-[#040915] border border-slate-800/80 hover:border-slate-700 rounded-lg text-xs font-mono transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false })}
                  </span>

                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-xs border font-bold uppercase shrink-0 ${
                      isError
                        ? 'text-rose-400 border-rose-500/40 bg-rose-950/40'
                        : isWarn
                        ? 'text-amber-400 border-amber-500/40 bg-amber-950/40'
                        : 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40'
                    }`}
                  >
                    {entry.actionType}
                  </span>

                  <span className="text-slate-200 truncate">{entry.details}</span>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-slate-400 shrink-0 self-end sm:self-auto">
                  {entry.targetPath && (
                    <span className="truncate max-w-[140px] text-slate-500">
                      {entry.targetPath}
                    </span>
                  )}
                  {entry.durationMs !== undefined && (
                    <span className="text-cyan-400/90 font-medium tabular-nums">
                      {entry.durationMs}ms
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 bg-[#040915] border border-slate-800 rounded-lg text-center text-slate-400 text-xs font-mono">
            No audit records found matching the active filter.
          </div>
        )}
      </div>
    </div>
  );
};
