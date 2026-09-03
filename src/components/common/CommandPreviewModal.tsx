import React, { useState } from 'react';
import { Terminal, ShieldAlert, Play, Check, X, Copy, ExternalLink, ArrowRight } from 'lucide-react';
import { useCitadelStore } from '../../store/useCitadelStore';

export const CommandPreviewModal: React.FC = () => {
  const { commandPreview, closeCommandPreview, showToast } = useCitadelStore();
  const [runInTerminal, setRunInTerminal] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!commandPreview || !commandPreview.isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(commandPreview.commandString);
    setCopied(true);
    showToast({ type: 'info', title: 'Command Copied', message: 'Command string copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecute = () => {
    commandPreview.onExecute(runInTerminal);
    closeCommandPreview();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#0D0D0F] border border-[#1F1F21] max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1F1F21]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#161618] border border-[#1F1F21] text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  Command Execution Authorization
                </h3>
                {commandPreview.requiresElevation && (
                  <span className="px-1.5 py-0.5 bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[9px] font-mono font-bold">
                    ROOT PRIVILEGES REQUIRED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#6B6B6D] font-mono mt-0.5">
                Review binary parameters and target sandbox context before execution.
              </p>
            </div>
          </div>

          <button
            onClick={closeCommandPreview}
            className="text-[#6B6B6D] hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command Display Terminal Preview */}
        <div className="my-4">
          <div className="flex items-center justify-between text-xs font-mono text-[#6B6B6D] mb-1.5 px-1">
            <span className="text-[10px] uppercase text-[#4F4F52]">EXECUTABLE INVOCATION STRING:</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors text-[10px]"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy string'}</span>
            </button>
          </div>

          <div className="bg-[#080809] border border-[#1F1F21] p-3 font-mono text-xs text-cyan-400 select-all overflow-x-auto leading-relaxed">
            <span className="text-[#4F4F52] select-none">$ </span>
            {commandPreview.commandString}
          </div>
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-xs font-mono">
          <div className="bg-[#161618] border border-[#1F1F21] p-2.5">
            <span className="text-[#4F4F52] uppercase text-[9px] block">Target Working Directory</span>
            <span className="text-white font-mono truncate block mt-0.5 text-[11px]">
              {commandPreview.workingDirectory}
            </span>
          </div>

          <div className="bg-[#161618] border border-[#1F1F21] p-2.5">
            <span className="text-[#4F4F52] uppercase text-[9px] block">Target Scope</span>
            <span className="text-cyan-400 font-mono truncate block mt-0.5 text-[11px]">
              {commandPreview.targetDescription || 'Local Workspace Sandbox'}
            </span>
          </div>
        </div>

        {/* Scope Confirmation Notice */}
        <div className="flex items-start gap-2.5 p-3 bg-[#161618] border border-amber-500/30 mb-5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-[#6B6B6D] font-mono leading-relaxed">
            Citadel will record this command execution into the local portable audit database with timestamp, user context, and exit code.
          </div>
        </div>

        {/* Execution Mode & Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#1F1F21]">
          <label className="flex items-center gap-2.5 text-xs font-mono text-[#6B6B6D] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={runInTerminal}
              onChange={(e) => setRunInTerminal(e.target.checked)}
              className="bg-[#080809] border-[#1F1F21] text-cyan-500 w-4 h-4"
            />
            <span>Attach to interactive Terminal Deck</span>
          </label>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={closeCommandPreview}
              className="flex-1 sm:flex-none px-4 py-2 bg-[#161618] hover:bg-[#1A1A1C] border border-[#1F1F21] text-xs font-mono text-[#6B6B6D] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExecute}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-[#1A1A1C] border border-cyan-500 text-cyan-400 hover:bg-cyan-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Confirm & Launch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
