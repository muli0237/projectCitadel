import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  FolderGit2,
  Terminal,
  Wrench,
  Container,
  GitBranch,
  BarChart3,
  Cpu,
  FileText,
  Settings,
  Plus,
  Play,
  HardDrive,
  X,
  Sparkles,
} from 'lucide-react';
import { useCitadelStore } from '../../store/useCitadelStore';
import { ModuleId } from '../../types';

interface PaletteCommand {
  id: string;
  title: string;
  category: 'Navigation' | 'Quick Actions' | 'Tools' | 'Projects';
  icon: React.ComponentType<{ className?: string }>;
  action: () => void | Promise<void>;
  shortcut?: string;
}

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActiveModule,
    projectsList,
    setActiveProject,
    createTerminalTab,
    triggerSafeEject,
  } = useCitadelStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      } else if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const commands: PaletteCommand[] = [
    {
      id: 'nav-hq',
      title: 'Command Center (Dashboard)',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => { setActiveModule('command-center'); setCommandPaletteOpen(false); },
      shortcut: 'G H',
    },
    {
      id: 'nav-term',
      title: 'Terminal Deck',
      category: 'Navigation',
      icon: Terminal,
      action: () => { setActiveModule('terminal-deck'); setCommandPaletteOpen(false); },
      shortcut: 'G T',
    },
    {
      id: 'nav-tools',
      title: 'Toolbox Registry',
      category: 'Navigation',
      icon: Wrench,
      action: () => { setActiveModule('toolbox'); setCommandPaletteOpen(false); },
      shortcut: 'G X',
    },
    {
      id: 'nav-devops',
      title: 'DevOps Bay (Containers)',
      category: 'Navigation',
      icon: Container,
      action: () => { setActiveModule('devops-bay'); setCommandPaletteOpen(false); },
      shortcut: 'G D',
    },
    {
      id: 'nav-git',
      title: 'Code Lab (Git Operations)',
      category: 'Navigation',
      icon: GitBranch,
      action: () => { setActiveModule('code-lab'); setCommandPaletteOpen(false); },
      shortcut: 'G C',
    },
    {
      id: 'nav-data',
      title: 'Data Lab (Python & Datasets)',
      category: 'Navigation',
      icon: BarChart3,
      action: () => { setActiveModule('data-lab'); setCommandPaletteOpen(false); },
      shortcut: 'G L',
    },
    {
      id: 'nav-sysmon',
      title: 'System Monitor & Drive Health',
      category: 'Navigation',
      icon: Cpu,
      action: () => { setActiveModule('system-monitor'); setCommandPaletteOpen(false); },
      shortcut: 'G M',
    },
    {
      id: 'nav-notes',
      title: 'Notes & Runbooks',
      category: 'Navigation',
      icon: FileText,
      action: () => { setActiveModule('notes-runbooks'); setCommandPaletteOpen(false); },
      shortcut: 'G N',
    },
    {
      id: 'act-new-term',
      title: 'Spawn New Kali Shell',
      category: 'Quick Actions',
      icon: Terminal,
      action: async () => {
        const tabId = await createTerminalTab('Kali Shell');
        if (tabId) {
          setActiveModule('terminal-deck');
          setCommandPaletteOpen(false);
        }
      },
    },
    {
      id: 'act-safe-eject',
      title: 'Prepare Flash Drive for Safe Ejection',
      category: 'Quick Actions',
      icon: HardDrive,
      action: () => {
        triggerSafeEject();
        setCommandPaletteOpen(false);
      },
    },
    ...projectsList.map((p) => ({
      id: `proj-${p.id}`,
      title: `Open Project: ${p.name}`,
      category: 'Projects' as const,
      icon: FolderGit2,
      action: () => {
        setActiveProject(p.id);
        setActiveModule('workspace');
        setCommandPaletteOpen(false);
      },
    })),
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-[#0D0D0F] border border-[#1F1F21] max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1F1F21] bg-[#0A0A0B]">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, project, or tool... (e.g. 'nmap', 'terminal', 'eject')"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none text-white placeholder-[#4F4F52] text-xs font-mono focus:outline-hidden"
          />
          <kbd className="px-2 py-0.5 bg-[#161618] border border-[#1F1F21] text-[9px] text-[#4F4F52] font-mono">
            ESC
          </kbd>
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#1A1A1C]">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-[#4F4F52]">
              No matching commands or actions found.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left text-xs font-mono transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1A1A1C] border-l-2 border-cyan-400 text-cyan-400'
                      : 'text-[#6B6B6D] hover:bg-[#161618] hover:text-white border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-[#6B6B6D]'}`} />
                    <span className="truncate">{cmd.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] px-1.5 py-0.5 bg-[#161618] text-[#4F4F52] border border-[#1F1F21]">
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <kbd className="text-[9px] font-mono text-[#4F4F52]">{cmd.shortcut}</kbd>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-[#0A0A0B] border-t border-[#1F1F21] flex items-center justify-between text-[10px] font-mono text-[#4F4F52]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>CITADEL COMMAND PLANE // v2.4.0</span>
        </div>
      </div>
    </div>
  );
};
