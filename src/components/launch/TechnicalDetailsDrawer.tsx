import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, Terminal } from 'lucide-react';
import { BootReport } from '../../types/boot';

interface TechnicalDetailsDrawerProps {
  report: BootReport | null;
  errorLog: string[];
}

export const TechnicalDetailsDrawer: React.FC<TechnicalDetailsDrawerProps> = ({
  report,
  errorLog,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedLog = [
    `=== CITADEL RECOVERY DIAGNOSTIC REPORT ===`,
    `Generated at: ${new Date().toISOString()}`,
    `Current Boot Stage: ${report?.currentStage || 'UNKNOWN'}`,
    `Workspace Root: ${report?.workspaceRoot || '/media/kali/CITADEL_DRIVE'}`,
    `Drive Health: ${report?.driveHealth ? `${report.driveHealth.filesystem}, ReadOnly: ${report.driveHealth.isReadOnly}` : 'N/A'}`,
    ``,
    `--- FATAL / RECOVERABLE ISSUES ---`,
    ...(report?.fatalErrors || []).map((e, i) => `[FATAL ${i + 1}] ${e}`),
    ...(report?.recoverableErrors || []).map((e, i) => `[WARN ${i + 1}] ${e}`),
    ...errorLog.map((e) => `[LOG] ${e}`),
    ``,
    `--- BOOT CHECK MATRIX ---`,
    ...(report?.checks || []).map(
      (c) => `[${c.status.toUpperCase()}] ${c.name} (${c.category}) - ${c.details || 'OK'}`
    ),
    `==========================================`,
  ].join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedLog);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl bg-[#08111c]/90 border border-[#ff5468]/30 select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-[#05070b]/80 hover:bg-[#08111c] text-xs font-mono text-[#ffbd59] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#ffbd59]" />
          <span className="font-bold uppercase tracking-wider">
            {isOpen ? 'Hide Technical Diagnostics Log' : 'Inspect Technical Diagnostics Log'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#7890a5]">
            {report?.fatalErrors.length || 1} Fatal Issue(s)
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-[#1F1F21] space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#7890a5]">
            <span>DIAGNOSTIC RAW DUMP (POSIX / TAURI BACKEND)</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[#39d9ff] hover:text-[#d8f5ff] transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied to clipboard' : 'Copy log'}</span>
            </button>
          </div>

          <pre className="bg-[#05070b] border border-[#1F1F21] p-3 text-[10px] font-mono text-[#ffbd59] overflow-x-auto max-h-48 whitespace-pre-wrap select-all leading-relaxed">
            {formattedLog}
          </pre>
        </div>
      )}
    </div>
  );
};
