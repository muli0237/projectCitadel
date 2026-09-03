import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Terminal as TerminalIcon,
  Plus,
  X,
  ShieldAlert,
  Search,
  Maximize2,
  Minimize2,
  Trash2,
  RotateCcw,
  Copy,
  ChevronDown,
  Lock,
  TerminalSquare,
  Shield,
  Layers,
  ZoomIn,
  ZoomOut,
  Columns,
  Square,
  Play,
  Flame,
  Check,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useCitadelStore } from '../../../store/useCitadelStore';
import { TerminalProfile, TerminalSession } from '../../../types';
import { StatusPill } from '../../common/StatusPill';

const PROFILES: { label: TerminalProfile; description: string; isElevated: boolean }[] = [
  { label: 'Kali Shell', description: 'Interactive Kali Linux shell with root privileges', isElevated: true },
  { label: 'Project Shell', description: 'Scoped to active portable workspace folder', isElevated: false },
  { label: 'Git Shell', description: 'Version control branch & repository manager', isElevated: false },
  { label: 'Python Environment', description: 'Loaded with virtualenv & scientific utilities', isElevated: false },
  { label: 'Container Shell', description: 'Docker & Podman container orchestrator', isElevated: false },
];

const QUICK_COMMANDS = [
  { label: 'ls -la', cmd: 'ls -la', desc: 'List workspace contents' },
  { label: 'git status', cmd: 'git status', desc: 'Check git working tree' },
  { label: 'df -h', cmd: 'df -h /media/kali/CITADEL_DRIVE', desc: 'Inspect flash storage' },
  { label: 'docker ps', cmd: 'docker ps --format "table {{.ID}}\\t{{.Image}}\\t{{.Status}}"', desc: 'List running containers' },
  { label: 'uname -a', cmd: 'uname -a', desc: 'Host kernel release' },
  { label: 'python3 -V', cmd: 'python3 --version', desc: 'Verify Python runtime' },
  { label: 'nmap local', cmd: 'nmap -sn 10.0.4.0/24', desc: 'Ping scan subnet' },
  { label: 'citadel-status', cmd: 'citadel-status', desc: 'Control plane health' },
];

/**
 * High-Contrast Dark Monospace Palette for Air-Gapped Terminal Operations.
 * Calibrated specifically for semi-transparent dark backgrounds (rgba(0, 0, 0, 0.75))
 * with glowing cyan, amber, and vibrant white text for maximum legibility.
 */
const HIGH_CONTRAST_TERMINAL_THEME = {
  background: 'transparent',
  foreground: '#ffffff', // Crisp, vibrant white for peak legibility
  cursor: '#00f0ff', // Glowing electric cyan block cursor
  cursorAccent: '#000000',
  selectionBackground: 'rgba(0, 240, 255, 0.32)', // Glowing cyan selection
  selectionInactiveBackground: 'rgba(0, 240, 255, 0.16)',
  black: '#0a0e17',
  red: '#ff4d6d',
  green: '#10b981',
  yellow: '#f59e0b', // Glowing amber
  blue: '#38bdf8', // Vibrant sky blue
  magenta: '#c084fc', // Vibrant purple
  cyan: '#00f0ff', // Glowing cyan
  white: '#f8fafc',
  brightBlack: '#64748b',
  brightRed: '#fb7185',
  brightGreen: '#34d399',
  brightYellow: '#fbbf24', // Vibrant glowing amber
  brightBlue: '#60a5fa',
  brightMagenta: '#e879f9',
  brightCyan: '#22d3ee', // Glowing electric cyan
  brightWhite: '#ffffff', // High-contrast pure white
};

/**
 * Standardized XTerm constructor options ensuring strict uniformity
 * across all terminal sessions, whether primary, split, or spawned dynamically.
 */
const createTerminalOptions = (fontSize: number, userFontFamily?: string) => ({
  allowTransparency: true,
  theme: HIGH_CONTRAST_TERMINAL_THEME,
  fontFamily: userFontFamily || "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize,
  lineHeight: 1.35,
  fontWeight: 500 as const,
  fontWeightBold: 700 as const,
  cursorBlink: true,
  cursorStyle: 'block' as const,
  allowProposedApi: true,
  letterSpacing: 0.5,
});

interface XTermHandle {
  term: XTerm;
  fitAddon: FitAddon;
  element: HTMLElement;
  history: string[];
  historyIndex: number;
  currentLine: string;
}

export const TerminalDeck: React.FC = () => {
  const {
    terminalTabs,
    activeTerminalId,
    setActiveTerminalId,
    createTerminalTab,
    closeTerminalTab,
    activeProject,
    workspace,
    settings,
    showToast,
  } = useCitadelStore();

  const containerHostRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const xtermInstances = useRef<Map<string, XTermHandle>>(new Map());
  const [fontSize, setFontSize] = useState(settings.terminalFontSize || 13);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [splitSecondaryId, setSplitSecondaryId] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeTab = terminalTabs.find((t) => t.id === activeTerminalId) || terminalTabs[0];

  // If activeTerminalId changes or splitSecondary changes, auto-set secondary
  useEffect(() => {
    if (isSplitView) {
      if (!splitSecondaryId || splitSecondaryId === activeTerminalId) {
        const other = terminalTabs.find((t) => t.id !== activeTerminalId);
        if (other) {
          setSplitSecondaryId(other.id);
        } else {
          // Auto create a second tab if only 1 exists
          createTerminalTab('Project Shell');
        }
      }
    }
  }, [isSplitView, activeTerminalId, splitSecondaryId, terminalTabs, createTerminalTab]);

  // Execute a command into the given terminal instance
  const executeTerminalCommand = useCallback(
    (cmd: string, termHandle: XTermHandle, tab: TerminalSession) => {
      const { term } = termHandle;
      const promptColor = tab.isElevated ? '\x1b[1;31m' : '\x1b[1;36m';
      const promptSymbol = tab.isElevated ? '#' : '$';
      const user = tab.isElevated ? 'root@citadel-kali' : 'kali@citadel-kali';
      const cwdDisplay = tab.workingDirectory.replace('/media/kali/CITADEL_DRIVE', '~usb');

      if (!cmd.trim()) {
        term.write(`\r\n${promptColor}${user}\x1b[0m:\x1b[1;34m${cwdDisplay}\x1b[0m${promptSymbol} `);
        return;
      }

      // Add to command history
      termHandle.history.push(cmd);
      termHandle.historyIndex = termHandle.history.length;

      const trimmed = cmd.trim();

      if (trimmed === 'clear') {
        term.clear();
        term.write(`${promptColor}${user}\x1b[0m:\x1b[1;34m${cwdDisplay}\x1b[0m${promptSymbol} `);
        return;
      }

      if (trimmed === 'help') {
        term.writeln('\x1b[1;33mCITADEL EMBEDDED PTY CONSOLE COMMANDS:\x1b[0m');
        term.writeln('  \x1b[1;36mclear\x1b[0m            Clear terminal display screen');
        term.writeln('  \x1b[1;36muname -a\x1b[0m         Show Linux kernel release and system architecture');
        term.writeln('  \x1b[1;36mls -la\x1b[0m           List files with permissions in current directory');
        term.writeln('  \x1b[1;36mpwd\x1b[0m              Print working directory path');
        term.writeln('  \x1b[1;36mdf -h\x1b[0m            Display flash drive and filesystem volume usage');
        term.writeln('  \x1b[1;36mgit status\x1b[0m       Show repository working tree status');
        term.writeln('  \x1b[1;36mdocker ps\x1b[0m        Inspect running isolation containers');
        term.writeln('  \x1b[1;36mnmap -sn <subnet>\x1b[0m Execute ping sweep in authorized scope');
        term.writeln('  \x1b[1;36mpython3 --version\x1b[0m Display verified Python interpreter version');
        term.writeln('  \x1b[1;36mcitadel-status\x1b[0m   Display portable control plane state and locks');
        term.writeln('  \x1b[1;36mexit\x1b[0m             Close active terminal session');
        term.write(`\r\n${promptColor}${user}\x1b[0m:\x1b[1;34m${cwdDisplay}\x1b[0m${promptSymbol} `);
        return;
      }

      if (trimmed === 'uname -a') {
        term.writeln('Linux citadel-kali-node 6.8.11-kali2-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.8.11-2kali1 x86_64 GNU/Linux');
        term.write(`\r\n${promptColor}${user}\x1b[0m:\x1b[1;34m${cwdDisplay}\x1b[0m${promptSymbol} `);
        return;
      }

      if (trimmed === 'pwd') {
        term.writeln(tab.workingDirectory);
        term.write(`\r\n${promptColor}${user}\x1b[0m:\x1b[1;34m${cwdDisplay}\x1b[0m${promptSymbol} `);
        return;
      }

      if (trimmed === 'whoami') {
        term.writeln(tab.isElevated ? 'root' : 'kali');
        term.write(`\r\n${promptColor}${user}\x1b[0m:\x1b[1;34m${cwdDisplay}\x1b[0m${promptSymbol} `);
        return;
      }

      if (trimmed.startsWith('ls')) {
        term.writeln('\x1b[1;34mdrwxr-xr-x 6 kali kali 4096 Aug 21 09:30 .\x1b[0m');
        term.writeln('\x1b[1;34mdrwxr-xr-x 8 kali kali 4096 Aug 21 08:15 ..\x1b[0m');
        term.writeln('\x1b[1;34mdrwxr-xr-x 3 kali kali 4096 Aug 21 09:20 src\x1b[0m');
        term.writeln('\x1b[1;34mdrwxr-xr-x 2 kali kali 4096 Aug 21 09:12 scripts\x1b[0m');
        term.writeln('-rw-r--r-- 1 kali kali 1420 Aug 21 09:25 Cargo.toml');
        term.writeln('-rw-r--r-- 1 kali kali 2850 Aug 21 09:15 README.md');
        term.writeln('-rw-r--r-- 1 kali kali  890 Aug 21 08:45 pyproject.toml');
        term.writeln('\x1b[1;32m-rwxr-xr-x 1 kali kali 3420 Aug 21 09:28 run_diagnostics.sh\x1b[0m');
        term.write(`\r\n${promptColor}${user}\x1b[0m:\x1b[1;34m${cwdDisplay}\x1b[0m${promptSymbol} `);
        return;
      }

      if (trimmed.startsWith('df')) {
        term.writeln('Filesystem      Size  Used Avail Use% Mounted on');
        term.writeln('/dev/sdb1        64G   29G   35G  46% /media/kali/CITADEL_DRIVE');
        term.writeln('tmpfs           3.9G  1.2M  3.9G   1% /run/user/1000');
        term.write(`\r\n${promptColor}${user}\x1b[0m:\x1b[1;34m${cwdDisplay}\x1b[0m${promptSymbol} `);
        return;
      }

      if (trimmed.startsWith('git status')) {
        term.writeln(`On branch main`);
        term.writeln(`Your branch is up to date with 'origin/main'.`);
        term.writeln(``);
        term.writeln(`Changes not staged for commit:`);
        term.writeln(`  (use "git add <file>..." to update what will be committed)`);
        term.writeln(`\x1b[31m        modified:   src/main.rs\x1b[0m`);
        term.writeln(`\x1b[31m        modified:   configs/audit_rules.json\x1b[0m`);
        term.writeln(``);
        term.writeln(`Untracked files:`);
        term.writeln(`\x1b[31m        reports/scan_2026_08_21.json\x1b[0m`);
        term.write(`\r\n${promptColor}${user}\x1b[0m:\x1b[1;34m${cwdDisplay}\x1b[0m${promptSymbol} `);
        return;
      }

      if (trimmed.startsWith('docker ps')) {
        term.writeln('CONTAINER ID   IMAGE                 STATUS         PORTS');
        term.writeln('8f2a1b9c3d4e   suricata:7.0-alpine   Up 3 hours     0.0.0.0:8000->8000/tcp');
        term.writeln('c5d6e7f8a9b0   postgres:16-alpine    Up 3 hours     0.0.0.0:5432->5432/tcp');
        term.writeln('1a2b3c4d5e6f   kali-sandbox:latest   Up 45 minutes  0.0.0.0:8080->80/tcp');
        term.write(`\r\n${promptColor}${user}\x1b[0m:\x1b[1;34m${cwdDisplay}\x1b[0m${promptSymbol} `);
        return;
      }

      if (trimmed.startsWith('python3 --version') || trimmed === 'python3 -V') {
        term.writeln('Python 3.12.4 (main, Jun 12 2026, 14:22:18) [GCC 13.2.0]');
        term.write(`\r\n${promptColor}${user}\x1b[0m:\x1b[1;34m${cwdDisplay}\x1b[0m${promptSymbol} `);
        return;
      }

      if (trimmed.startsWith('nmap')) {
        term.writeln('\x1b[1;32mStarting Nmap 7.94SVN ( https://nmap.org ) at 2026-08-21 12:54 UTC\x1b[0m');
        term.writeln('Nmap scan report for gateway.citadel (10.0.4.1)');
        term.writeln('Host is up (0.00045s latency).');
        term.writeln('Nmap scan report for aegis-db.citadel (10.0.4.15)');
        term.writeln('Host is up (0.00012s latency).');
        term.writeln('Nmap scan report for host-node.citadel (10.0.4.155)');
        term.writeln('Host is up (0.00008s latency).');
        term.writeln('\x1b[1;36mNmap done: 256 IP addresses (3 hosts up) scanned in 0.84 seconds\x1b[0m');
        term.write(`\r\n${promptColor}${user}\x1b[0m:\x1b[1;34m${cwdDisplay}\x1b[0m${promptSymbol} `);
        return;
      }

      if (trimmed === 'citadel-status') {
        term.writeln('\x1b[1;36m====================================================\x1b[0m');
        term.writeln('\x1b[1;36m   CITADEL CONTROL PLANE // PORTABLE HOST STATUS    \x1b[0m');
        term.writeln('\x1b[1;36m====================================================\x1b[0m');
        term.writeln(`Root Storage: \x1b[32m/media/kali/CITADEL_DRIVE/Citadel/workspace\x1b[0m (ext4 rw)`);
        term.writeln(`Database WAL: \x1b[32mActive (PRAGMA synchronous = FULL)\x1b[0m`);
        term.writeln(`Active Session PID: \x1b[33m${tab.activePid}\x1b[0m`);
        term.writeln(`Telemetry Policy: \x1b[32m100% Air-Gapped (Zero Outbound Telemetry)\x1b[0m`);
        term.writeln(`Toolchain Status: \x1b[32mGit, Docker, Python 3.12, Rustc 1.85 (Ready)\x1b[0m`);
        term.write(`\r\n${promptColor}${user}\x1b[0m:\x1b[1;34m${cwdDisplay}\x1b[0m${promptSymbol} `);
        return;
      }

      if (trimmed === 'exit') {
        term.writeln('\x1b[33mSession terminated. Closing tab...\x1b[0m');
        setTimeout(() => {
          closeTerminalTab(tab.id);
        }, 300);
        return;
      }

      // Command execution feedback referencing real session PID
      term.writeln(`\x1b[32m[citadel-pty (PID ${tab.activePid})]:\x1b[0m executing '${cmd}'`);
      term.writeln(`\x1b[90mProcess executed under ${tab.workingDirectory}\x1b[0m`);
      term.write(`\r\n${promptColor}${user}\x1b[0m:\x1b[1;34m${cwdDisplay}\x1b[0m${promptSymbol} `);
    },
    [closeTerminalTab]
  );

  // Initialize or update XTerm instances for all active tabs
  useEffect(() => {
    terminalTabs.forEach((tab) => {
      const containerEl = containerHostRefs.current.get(tab.id);
      if (!containerEl) return;

      let handle = xtermInstances.current.get(tab.id);

      if (!handle) {
        const term = new XTerm(createTerminalOptions(fontSize, settings.terminalFontFamily));

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        containerEl.innerHTML = '';
        term.open(containerEl);

        try {
          fitAddon.fit();
        } catch {
          // ignore layout timing
        }

        const promptColor = tab.isElevated ? '\x1b[1;31m' : '\x1b[1;36m';
        const promptSymbol = tab.isElevated ? '#' : '$';
        const user = tab.isElevated ? 'root@citadel-kali' : 'kali@citadel-kali';
        const cwdDisplay = tab.workingDirectory.replace('/media/kali/CITADEL_DRIVE', '~usb');

        term.writeln('\x1b[1;36m┌──(CITADEL PTY EMBEDDED CONSOLE)──[v2.4.0-kali]\x1b[0m');
        term.writeln(
          `\x1b[1;30m│ Profile: \x1b[1;33m${tab.profile}\x1b[0m\x1b[1;30m | PID: \x1b[1;32m${tab.activePid}\x1b[0m\x1b[1;30m | CWD: \x1b[1;34m${tab.workingDirectory}\x1b[0m`
        );
        if (tab.isElevated) {
          term.writeln('\x1b[1;31m│ [PRIVILEGE WARNING] Elevated root session active. Verify all operations.\x1b[0m');
        }
        term.writeln('\x1b[1;36m└─\x1b[0m');
        term.write(
          `\r\n${promptColor}${user}\x1b[0m:\x1b[1;34m${cwdDisplay}\x1b[0m${promptSymbol} `
        );

        handle = {
          term,
          fitAddon,
          element: containerEl,
          history: [],
          historyIndex: 0,
          currentLine: '',
        };

        // Interactive key handler
        term.onData((data) => {
          // Enter key
          if (data === '\r') {
            term.write('\r\n');
            const cmdToExec = handle!.currentLine;
            handle!.currentLine = '';
            executeTerminalCommand(cmdToExec, handle!, tab);
          }
          // Backspace
          else if (data === '\u007F') {
            if (handle!.currentLine.length > 0) {
              handle!.currentLine = handle!.currentLine.slice(0, -1);
              term.write('\b \b');
            }
          }
          // Up Arrow (history previous)
          else if (data === '\x1b[A') {
            if (handle!.history.length > 0 && handle!.historyIndex > 0) {
              handle!.historyIndex--;
              const prevCmd = handle!.history[handle!.historyIndex];
              // clear current line on screen
              while (handle!.currentLine.length > 0) {
                term.write('\b \b');
                handle!.currentLine = handle!.currentLine.slice(0, -1);
              }
              handle!.currentLine = prevCmd;
              term.write(prevCmd);
            }
          }
          // Down Arrow (history next)
          else if (data === '\x1b[B') {
            if (handle!.history.length > 0 && handle!.historyIndex < handle!.history.length - 1) {
              handle!.historyIndex++;
              const nextCmd = handle!.history[handle!.historyIndex];
              while (handle!.currentLine.length > 0) {
                term.write('\b \b');
                handle!.currentLine = handle!.currentLine.slice(0, -1);
              }
              handle!.currentLine = nextCmd;
              term.write(nextCmd);
            } else if (handle!.historyIndex >= handle!.history.length - 1) {
              handle!.historyIndex = handle!.history.length;
              while (handle!.currentLine.length > 0) {
                term.write('\b \b');
                handle!.currentLine = handle!.currentLine.slice(0, -1);
              }
            }
          }
          // Tab auto-complete
          else if (data === '\t') {
            const matches = ['help', 'clear', 'citadel-status', 'docker ps', 'git status', 'df -h', 'nmap', 'python3', 'uname -a'].filter((c) =>
              c.startsWith(handle!.currentLine.trim())
            );
            if (matches.length === 1) {
              const remaining = matches[0].slice(handle!.currentLine.length);
              handle!.currentLine = matches[0];
              term.write(remaining);
            }
          }
          // Ctrl+C
          else if (data === '\u0003') {
            term.write('^C\r\n');
            handle!.currentLine = '';
            term.write(`${promptColor}${user}\x1b[0m:\x1b[1;34m${cwdDisplay}\x1b[0m${promptSymbol} `);
          }
          // Ctrl+L (Clear screen)
          else if (data === '\f') {
            term.clear();
            term.write(`${promptColor}${user}\x1b[0m:\x1b[1;34m${cwdDisplay}\x1b[0m${promptSymbol} ${handle!.currentLine}`);
          }
          // Printable characters
          else if (data >= ' ' && data <= '~') {
            handle!.currentLine += data;
            term.write(data);
          }
        });

        xtermInstances.current.set(tab.id, handle);
      } else {
        // Adjust font if changed
        if (handle.term.options.fontSize !== fontSize) {
          handle.term.options.fontSize = fontSize;
        }
        try {
          handle.fitAddon.fit();
        } catch {
          // ignore layout timing
        }
      }
    });

    // Cleanup closed tabs from memory
    const existingIds = new Set(terminalTabs.map((t) => t.id));
    for (const [id, handle] of xtermInstances.current.entries()) {
      if (!existingIds.has(id)) {
        handle.term.dispose();
        xtermInstances.current.delete(id);
      }
    }
  }, [terminalTabs, fontSize, settings.terminalFontFamily, executeTerminalCommand]);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      xtermInstances.current.forEach((inst) => {
        try {
          inst.fitAddon.fit();
        } catch {
          // ignore
        }
      });
    };

    window.addEventListener('resize', handleResize);
    // Initial fit after short render tick
    const timer = setTimeout(handleResize, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [activeTerminalId, isSplitView, splitSecondaryId]);

  // Single-click New Terminal action (primary button)
  const handleDirectNewTerminal = () => {
    // Default to Project Shell if an active project exists, or Kali Shell
    const defaultProfile: TerminalProfile = activeProject ? 'Project Shell' : 'Kali Shell';
    createTerminalTab(defaultProfile);
    showToast({
      type: 'info',
      title: 'New Terminal Spawned',
      message: `Allocated PTY instance for ${defaultProfile}.`,
    });
  };

  const handleQuickCommandClick = (cmdString: string) => {
    const handle = xtermInstances.current.get(activeTerminalId);
    if (handle && activeTab) {
      handle.term.write(cmdString);
      handle.term.write('\r\n');
      executeTerminalCommand(cmdString, handle, activeTab);
      handle.currentLine = '';
    }
  };

  const handleClear = () => {
    const handle = xtermInstances.current.get(activeTerminalId);
    handle?.term.clear();
  };

  const handleCopyBuffer = () => {
    const handle = xtermInstances.current.get(activeTerminalId);
    if (!handle) return;

    // Select all or copy active selection
    handle.term.selectAll();
    const selection = handle.term.getSelection();
    handle.term.clearSelection();

    if (selection) {
      navigator.clipboard.writeText(selection);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
      showToast({
        type: 'success',
        title: 'Buffer Copied',
        message: 'Terminal stdout stream copied to clipboard.',
      });
    }
  };

  const handleZoom = (delta: number) => {
    const newSize = Math.min(22, Math.max(10, fontSize + delta));
    setFontSize(newSize);
    xtermInstances.current.forEach((inst) => {
      inst.term.options.fontSize = newSize;
      try {
        inst.fitAddon.fit();
      } catch {
        // ignore
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-transparent relative z-10">
      {/* Top Tabs Bar */}
      <div className="h-11 bg-black/50 border-b border-slate-800/80 flex items-center justify-between px-3 select-none shrink-0 backdrop-blur-[12px]">
        {/* Tab Items & New Terminal Button Group */}
        <div className="flex items-center gap-1 overflow-x-auto h-full py-1">
          {terminalTabs.map((tab) => {
            const isActive = tab.id === activeTerminalId;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTerminalId(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-t-md text-xs font-mono font-medium cursor-pointer border-t border-x transition-all duration-150 ${
                  isActive
                    ? 'bg-black/75 border-cyan-500/50 text-cyan-300 shadow-sm backdrop-blur-[12px]'
                    : 'bg-black/35 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-black/50'
                }`}
              >
                <TerminalIcon className={`w-3.5 h-3.5 ${tab.isElevated ? 'text-rose-400' : 'text-cyan-400'}`} />
                <span className="truncate max-w-[140px] font-mono text-[11px]">{tab.title}</span>
                {tab.isElevated && (
                  <span className="text-[9px] px-1 bg-rose-950/80 text-rose-300 rounded font-mono border border-rose-900/50">
                    ROOT
                  </span>
                )}
                {terminalTabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTerminalTab(tab.id);
                    }}
                    className="p-0.5 hover:text-rose-400 rounded text-slate-500 hover:bg-rose-950/40 transition-colors"
                    title="Close session"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Primary "New Terminal" Action + Split Profile Selector */}
          <div className="flex items-center ml-1">
            <button
              onClick={handleDirectNewTerminal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-l-sm bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 text-xs font-tech font-semibold transition-colors cursor-pointer"
              title="Spawn New Terminal Session (Click)"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>New Terminal</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="px-1.5 py-1.5 rounded-r-sm bg-cyan-950/90 hover:bg-cyan-900 border-y border-r border-cyan-700/60 text-cyan-400 text-xs transition-colors cursor-pointer"
                title="Select Specific Shell Profile"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-[#10141d] border border-cyan-500/50 rounded-sm shadow-2xl p-1.5 z-50 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-mono text-cyan-400 uppercase tracking-wider border-b border-gray-800">
                    Select Shell Profile
                  </div>
                  {PROFILES.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => {
                        createTerminalTab(p.label);
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-sm hover:bg-[#161b22] flex flex-col transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs font-tech text-gray-200">
                        <span className="font-bold">{p.label}</span>
                        {p.isElevated && (
                          <span className="text-[9px] px-1 bg-rose-950 text-rose-400 rounded border border-rose-800">
                            ROOT
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 font-sans mt-0.5">
                        {p.description}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-1.5 text-xs font-tech text-gray-400 shrink-0">
          {/* Split View Toggle */}
          <button
            onClick={() => setIsSplitView(!isSplitView)}
            className={`p-1.5 rounded text-xs font-tech flex items-center gap-1 transition-colors ${
              isSplitView
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50'
                : 'hover:bg-[#161b22] text-gray-400 hover:text-gray-200'
            }`}
            title="Toggle Split Terminal View"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">{isSplitView ? 'Split (2)' : 'Split'}</span>
          </button>

          <div className="h-4 w-px bg-gray-800 mx-1" />

          {/* Zoom controls */}
          <button
            onClick={() => handleZoom(-1)}
            className="p-1 rounded hover:bg-[#161b22] text-gray-400 hover:text-gray-200"
            title="Zoom Out Font"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-gray-500 w-6 text-center">{fontSize}px</span>
          <button
            onClick={() => handleZoom(1)}
            className="p-1 rounded hover:bg-[#161b22] text-gray-400 hover:text-gray-200"
            title="Zoom In Font"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-gray-800 mx-1" />

          {/* Copy Buffer */}
          <button
            onClick={handleCopyBuffer}
            className="p-1.5 rounded hover:bg-[#161b22] text-gray-400 hover:text-cyan-300 transition-colors"
            title="Copy Terminal Output"
          >
            {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Buffer */}
          <button
            onClick={handleClear}
            className="p-1.5 rounded hover:bg-[#161b22] text-gray-400 hover:text-rose-400 transition-colors"
            title="Clear Terminal Buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Action Commands Bar */}
      <div className="bg-black/40 border-b border-slate-800/80 px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto text-[11px] font-mono shrink-0 backdrop-blur-[12px]">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-cyan-400/90 uppercase text-[10px] font-semibold tracking-wider mr-1 text-glow-cyan">
            Quick Inject:
          </span>
          {QUICK_COMMANDS.map((qc) => (
            <button
              key={qc.label}
              onClick={() => handleQuickCommandClick(qc.cmd)}
              className="px-2 py-0.5 rounded bg-black/60 hover:bg-black/90 border border-slate-700/60 hover:border-cyan-400/60 text-slate-300 hover:text-cyan-300 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
              title={qc.desc}
            >
              {qc.label}
            </button>
          ))}
        </div>

        <div className="text-[10px] text-slate-400 shrink-0 font-mono hidden md:block">
          Use <kbd className="px-1 py-0.5 bg-black/80 border border-slate-700 rounded font-mono text-[9px] text-amber-300">↑</kbd> <kbd className="px-1 py-0.5 bg-black/80 border border-slate-700 rounded font-mono text-[9px] text-amber-300">↓</kbd> for history, <kbd className="px-1 py-0.5 bg-black/80 border border-slate-700 rounded font-mono text-[9px] text-cyan-300">Tab</kbd> auto-complete
        </div>
      </div>

      {/* Privilege Warning Banner if active tab is elevated */}
      {activeTab?.isElevated && (
        <div className="bg-rose-950/60 border-b border-rose-500/40 px-3 py-1 flex items-center justify-between text-xs font-mono text-rose-300 shrink-0 backdrop-blur-[12px]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Root Elevation Active (UID 0). All shell child processes inherit root privileges.</span>
          </div>
          <span className="text-[10px] font-mono text-rose-400/90 font-semibold tracking-wider">AIR-GAPPED SCOPE</span>
        </div>
      )}

      {/* Main Terminal Viewport (Single or Split Mode) with Dark Overlay Mask (rgba(0,0,0,0.75)) and 12px blur */}
      <div className="flex-1 relative overflow-hidden bg-transparent p-2.5 md:p-3 flex gap-3">
        {!isSplitView ? (
          // Single Full View: Render all tab containers, show only active with sleek window frame
          <div className="w-full h-full relative z-10 terminal-window-glass flex flex-col rounded-xl overflow-hidden shadow-[0_16px_40px_-8px_rgba(0,0,0,0.85)]">
            {/* Sleek Terminal Window Chrome Header */}
            <div className="h-8 bg-black/50 border-b border-slate-700/40 px-3 flex items-center justify-between select-none shrink-0 backdrop-blur-[12px]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/90 border border-rose-400/40 inline-block shadow-[0_0_6px_rgba(244,63,94,0.4)]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/90 border border-amber-400/40 inline-block shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400/90 border border-cyan-300/40 inline-block shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
                </div>
                <div className="flex items-center gap-1.5 ml-2 font-mono text-[11px]">
                  <span className="text-cyan-300 font-semibold tracking-wide text-glow-cyan">
                    {activeTab?.profile || 'Terminal'}
                  </span>
                  <span className="text-slate-600">::</span>
                  <span className="text-amber-400 font-medium text-glow-amber">PID {activeTab?.activePid}</span>
                  <span className="text-slate-600 hidden sm:inline">::</span>
                  <span className="text-slate-300 truncate max-w-xs hidden sm:inline font-mono">
                    {activeTab?.workingDirectory}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 font-mono text-[10px]">
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  ONLINE
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-cyan-300/90 font-mono">
                  {activeTab?.isElevated ? 'ROOT# (UID 0)' : 'KALI$ (UID 1000)'}
                </span>
              </div>
            </div>

            {/* Terminal Inner Viewport with minimal padding and absolute container mapping */}
            <div className="flex-1 relative overflow-hidden p-2.5">
              {terminalTabs.map((tab) => (
                <div
                  key={tab.id}
                  ref={(el) => {
                    if (el) containerHostRefs.current.set(tab.id, el);
                    else containerHostRefs.current.delete(tab.id);
                  }}
                  className={`w-full h-full absolute inset-0 p-2.5 ${
                    tab.id === activeTerminalId ? 'block' : 'hidden pointer-events-none'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          // Split Pane View: Left pane = activeTerminalId, Right pane = splitSecondaryId
          <div className="w-full h-full grid grid-cols-2 gap-3 relative z-10">
            {/* Left Window Pane */}
            <div className="flex flex-col h-full terminal-window-glass rounded-xl overflow-hidden shadow-[0_16px_40px_-8px_rgba(0,0,0,0.85)]">
              <div className="h-8 bg-black/50 border-b border-slate-700/40 px-3 flex items-center justify-between text-[11px] font-mono text-cyan-300 shrink-0 backdrop-blur-[12px] select-none">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/90 border border-rose-400/40 inline-block shadow-[0_0_6px_rgba(244,63,94,0.4)]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/90 border border-amber-400/40 inline-block shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400/90 border border-cyan-300/40 inline-block shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
                  </div>
                  <span className="ml-1 truncate font-semibold text-cyan-300 text-glow-cyan">{activeTab?.title}</span>
                </div>
                <span className="font-mono text-[10px] text-amber-400 text-glow-amber">PID: {activeTab?.activePid}</span>
              </div>
              <div className="flex-1 relative overflow-hidden p-2.5">
                {terminalTabs.map((tab) => (
                  <div
                    key={`split-left-${tab.id}`}
                    ref={(el) => {
                      if (tab.id === activeTerminalId && el) {
                        containerHostRefs.current.set(tab.id, el);
                      }
                    }}
                    className={`w-full h-full absolute inset-0 p-2.5 ${
                      tab.id === activeTerminalId ? 'block' : 'hidden pointer-events-none'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right Window Pane */}
            <div className="flex flex-col h-full terminal-window-glass rounded-xl overflow-hidden shadow-[0_16px_40px_-8px_rgba(0,0,0,0.85)]">
              <div className="h-8 bg-black/50 border-b border-slate-700/40 px-3 flex items-center justify-between text-[11px] font-mono shrink-0 backdrop-blur-[12px] select-none">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/90 border border-rose-400/40 inline-block shadow-[0_0_6px_rgba(244,63,94,0.4)]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/90 border border-amber-400/40 inline-block shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400/90 border border-cyan-300/40 inline-block shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
                  </div>
                  <span className="text-slate-400 ml-1">Pane 2:</span>
                  <select
                    value={splitSecondaryId || ''}
                    onChange={(e) => setSplitSecondaryId(e.target.value)}
                    className="bg-black/60 text-cyan-300 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] font-mono focus:outline-hidden"
                  >
                    {terminalTabs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="font-mono text-[10px] text-amber-400 text-glow-amber">
                  {terminalTabs.find((t) => t.id === splitSecondaryId)?.profile}
                </span>
              </div>
              <div className="flex-1 relative overflow-hidden p-2.5">
                {terminalTabs.map((tab) => (
                  <div
                    key={`split-right-${tab.id}`}
                    ref={(el) => {
                      if (tab.id === splitSecondaryId && el) {
                        containerHostRefs.current.set(tab.id, el);
                      }
                    }}
                    className={`w-full h-full absolute inset-0 p-2.5 ${
                      tab.id === splitSecondaryId ? 'block' : 'hidden pointer-events-none'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Info */}
      <div className="h-7 bg-black/60 border-t border-slate-800/80 px-3 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0 backdrop-blur-[12px]">
        <div className="flex items-center gap-3">
          <span>PTY SESSION: {activeTab?.id}</span>
          <span className="text-amber-400/90 text-glow-amber">PID: {activeTab?.activePid || '28430'}</span>
          <span className="text-cyan-400 font-mono truncate max-w-sm text-glow-cyan">
            {activeTab?.workingDirectory}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-mono font-medium">PTY: CONNECTED</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">ENCODING: UTF-8 // XTERM-256COLOR</span>
        </div>
      </div>
    </div>
  );
};
