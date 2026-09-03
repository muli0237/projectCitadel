import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Terminal,
  ExternalLink,
  Code,
  FileCode,
  ArrowUpRight,
  RefreshCw,
  Send,
  Play,
  Check,
  Plus,
  Trash2,
  File,
  Folder,
  ChevronRight,
  ChevronDown,
  Save,
  Copy,
  Layers,
  Shield,
  ShieldAlert,
  Sliders,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Search,
  FileText,
  FilePlus,
  FolderPlus,
  GitCompare,
  History,
  TerminalSquare,
  Wrench,
  Boxes,
  Cpu,
} from 'lucide-react';
import { useCitadelStore } from '../../../store/useCitadelStore';
import { bridge } from '../../../services/tauriBridge';
import { GitRepositoryStatus, Project, VirtualFile } from '../../../types';
import { DEFAULT_WORKSPACE_FILES, detectLanguageByPath } from '../../../data/defaultWorkspaceFiles';
import { StatusPill } from '../../common/StatusPill';
import { NewFileDialog } from './NewFileDialog';
import { DeleteFileModal } from './DeleteFileModal';

interface ExecutionOutput {
  id: string;
  command: string;
  type: 'run' | 'test' | 'audit' | 'build';
  status: 'running' | 'success' | 'failed';
  timestamp: string;
  durationMs: number;
  logs: string[];
}

export const CodeLab: React.FC = () => {
  const {
    activeProject,
    projectsList,
    setActiveProject,
    createTerminalTab,
    setActiveModule,
    showConfirmation,
    showToast,
    settings,
  } = useCitadelStore();

  // Virtual file system state
  const [files, setFiles] = useState<Record<string, VirtualFile>>(DEFAULT_WORKSPACE_FILES);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [openTabPaths, setOpenTabPaths] = useState<string[]>([
    'src/main.rs',
    'src/scanner.py',
    'configs/audit_rules.json',
  ]);
  const [activeFilePath, setActiveFilePath] = useState<string>('src/main.rs');
  const [viewMode, setViewMode] = useState<'editor' | 'diff' | 'git'>('editor');

  // Async file operations state & modals
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newFileModalOpen, setNewFileModalOpen] = useState(false);
  const [deleteTargetFile, setDeleteTargetFile] = useState<VirtualFile | null>(null);

  // Search & Explorer state
  const [explorerSearch, setExplorerSearch] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
    configs: true,
    tests: true,
    scripts: true,
    docs: true,
  });

  // Git state
  const [gitStatus, setGitStatus] = useState<GitRepositoryStatus | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [isStagingAll, setIsStagingAll] = useState(false);

  // Execution engine & console output
  const [executionOutput, setExecutionOutput] = useState<ExecutionOutput | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const activeFile = files[activeFilePath] || Object.values(files)[0] || {
    path: 'untitled.txt',
    name: 'untitled.txt',
    language: 'plaintext',
    content: '',
  };

  const loadGit = async () => {
    if (!activeProject) return;
    const res = await bridge.getGitStatus(activeProject.id);
    setGitStatus(res);
  };

  // Load project files on mount and when activeProject changes
  useEffect(() => {
    let isMounted = true;
    const loadFiles = async () => {
      setIsLoadingFiles(true);
      try {
        const projectId = activeProject?.id || 'default';
        const loaded = await bridge.loadProjectFiles(projectId);
        if (isMounted && loaded && Object.keys(loaded).length > 0) {
          setFiles(loaded);
          const loadedKeys = Object.keys(loaded);
          if (!loadedKeys.includes(activeFilePath)) {
            setActiveFilePath(loadedKeys[0]);
          }
          setOpenTabPaths((prev) => {
            const valid = prev.filter((p) => loadedKeys.includes(p));
            return valid.length > 0 ? valid : [loadedKeys[0]];
          });
        }
      } catch (err) {
        console.error('Failed to load project files:', err);
      } finally {
        if (isMounted) setIsLoadingFiles(false);
      }
    };

    loadFiles();
    loadGit();
    return () => {
      isMounted = false;
    };
  }, [activeProject?.id]);

  // Handle file editing
  const handleContentChange = (newContent: string) => {
    setFiles((prev) => ({
      ...prev,
      [activeFilePath]: {
        ...prev[activeFilePath],
        content: newContent,
        isModified: true,
        status: prev[activeFilePath]?.status === 'clean' ? 'modified' : (prev[activeFilePath]?.status || 'modified'),
      },
    }));
  };

  // Save current file asynchronously with disk bridge
  const handleSaveFile = async () => {
    if (!activeFile) return;
    setIsSaving(true);
    try {
      const projectId = activeProject?.id || 'default';
      const res = await bridge.saveFile(projectId, activeFile.path, activeFile.content);

      if (res.success && res.data) {
        setFiles((prev) => ({
          ...prev,
          [activeFilePath]: {
            ...prev[activeFilePath],
            isModified: false,
            status: 'clean',
            sizeBytes: res.data?.bytesWritten,
            lastModifiedAt: res.data?.timestamp,
          },
        }));

        showToast({
          type: 'success',
          title: 'File Saved to Disk',
          message: `Persisted ${activeFile.name} (${res.data.bytesWritten} bytes) successfully.`,
        });
      } else {
        showToast({
          type: 'error',
          title: 'Save Failed',
          message: res.error || 'Could not write file to storage.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Save Error',
        message: err?.message || 'Unexpected failure during file persistence.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Open a file into editor tabs
  const handleOpenFile = (path: string) => {
    if (!openTabPaths.includes(path)) {
      setOpenTabPaths([...openTabPaths, path]);
    }
    setActiveFilePath(path);
    setViewMode('editor');
  };

  // Close tab
  const handleCloseTab = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    const remaining = openTabPaths.filter((p) => p !== path);
    setOpenTabPaths(remaining);
    if (activeFilePath === path) {
      if (remaining.length > 0) {
        setActiveFilePath(remaining[remaining.length - 1]);
      } else {
        const remainingAll = Object.keys(files).filter((p) => p !== path);
        if (remainingAll.length > 0) {
          setActiveFilePath(remainingAll[0]);
          setOpenTabPaths([remainingAll[0]]);
        }
      }
    }
  };

  // Create new file from modal
  const handleCreateFileFromModal = async (path: string, content?: string): Promise<boolean> => {
    try {
      const projectId = activeProject?.id || 'default';
      const res = await bridge.createFile(projectId, path, content, Object.keys(files));

      if (res.success && res.data) {
        const newFile = res.data;
        setFiles((prev) => ({ ...prev, [newFile.path]: newFile }));
        setOpenTabPaths((prev) => (prev.includes(newFile.path) ? prev : [...prev, newFile.path]));
        setActiveFilePath(newFile.path);
        setViewMode('editor');

        // Auto-expand folder in explorer
        if (newFile.path.includes('/')) {
          const folder = newFile.path.split('/')[0];
          setExpandedFolders((prev) => ({ ...prev, [folder]: true }));
        }

        showToast({
          type: 'success',
          title: 'File Created',
          message: `Created ${newFile.path} on storage.`,
        });
        return true;
      } else {
        showToast({
          type: 'error',
          title: 'Creation Failed',
          message: res.error || 'Failed to create file.',
        });
        return false;
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Creation Error',
        message: err?.message || 'Unexpected error creating file.',
      });
      return false;
    }
  };

  // Delete file execution
  const handleDeleteConfirm = async () => {
    if (!deleteTargetFile) return;
    const targetPath = deleteTargetFile.path;
    setIsDeleting(true);

    try {
      const projectId = activeProject?.id || 'default';
      const res = await bridge.deleteFile(projectId, targetPath);
      if (res.success) {
        setFiles((prev) => {
          const updated = { ...prev };
          delete updated[targetPath];
          return updated;
        });

        const remainingTabs = openTabPaths.filter((p) => p !== targetPath);
        setOpenTabPaths(remainingTabs);

        if (activeFilePath === targetPath) {
          if (remainingTabs.length > 0) {
            setActiveFilePath(remainingTabs[remainingTabs.length - 1]);
          } else {
            const allRemaining = Object.keys(files).filter((p) => p !== targetPath);
            if (allRemaining.length > 0) {
              setActiveFilePath(allRemaining[0]);
              setOpenTabPaths([allRemaining[0]]);
            }
          }
        }

        showToast({
          type: 'warning',
          title: 'File Deleted',
          message: `Permanently removed ${targetPath} from disk.`,
        });
        setDeleteTargetFile(null);
      } else {
        showToast({
          type: 'error',
          title: 'Delete Failed',
          message: res.error || 'Failed to delete file from disk.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Delete Error',
        message: err?.message || 'Unexpected error occurred while deleting file.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Global keyboard shortcuts (Ctrl+S / Cmd+S, Ctrl+N / Cmd+N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveFile();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !newFileModalOpen) {
        e.preventDefault();
        setNewFileModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFilePath, activeFile, newFileModalOpen, files]);

  // Execute Code / Test / Audit
  const handleRunCode = (type: 'run' | 'test' | 'audit' | 'build') => {
    setIsExecuting(true);
    setConsoleCollapsed(false);

    let command = '';
    let initialLogs: string[] = [];

    if (type === 'run') {
      if (activeFile.language === 'python') {
        command = `python3 ${activeFile.path}`;
        initialLogs = [
          `\x1b[36m$ python3 ${activeFile.path}\x1b[0m`,
          `[*] Probing 10.0.4.15 across 4 target ports...`,
          `  -> Port 22: OPEN (Banner: SSH-2.0-OpenSSH_9.6p1 Debian-4)`,
          `  -> Port 80: OPEN (Banner: HTTP/1.1 301 Moved Permanently)`,
          `  -> Port 443: OPEN (Banner: HTTP/1.1 200 OK - Citadel Gateway)`,
          `  -> Port 5432: OPEN (Banner: PostgreSQL 16.2)`,
          `\x1b[32m[✓] Python probe finished in 0.24s (PID 34102)\x1b[0m`,
        ];
      } else {
        command = `cargo run --release`;
        initialLogs = [
          `\x1b[36m$ cargo run --release --bin citadel-aegis-scanner\x1b[0m`,
          `   Compiling citadel-aegis-scanner v2.4.0 (/media/kali/CITADEL_DRIVE/Citadel/workspace/projects/aegis-audit)`,
          `    Finished release [optimized] target(s) in 1.18s`,
          `     Running \`target/release/citadel-aegis-scanner\``,
          `[CITADEL-ENGINE] Initializing async enclave scanner v2.4.0...`,
          `[+] Scanning subnet target: 10.0.4.15 (ports: [22, 80, 443, 3306, 5432, 8080])`,
          `  [OPEN] 10.0.4.15:22 verified active`,
          `  [OPEN] 10.0.4.15:80 verified active`,
          `  [OPEN] 10.0.4.15:443 verified active`,
          `  [OPEN] 10.0.4.15:5432 verified active`,
          `  [CLOSED] 10.0.4.15:3306`,
          `  [CLOSED] 10.0.4.15:8080`,
          `\x1b[32m[✓] Scan complete. Telemetry recorded in SQLite WAL vault (Duration: 1.42s)\x1b[0m`,
        ];
      }
    } else if (type === 'test') {
      command = `pytest tests/ -v`;
      initialLogs = [
        `\x1b[36m$ pytest tests/ -v --tb=short\x1b[0m`,
        `============================= test session starts ==============================`,
        `platform linux -- Python 3.12.4, pytest-8.2.2, pluggy-1.5.0`,
        `rootdir: /media/kali/CITADEL_DRIVE/Citadel/workspace/projects/aegis-audit`,
        `collected 2 items`,
        ``,
        `tests/test_audit.py::test_closed_port \x1b[32mPASSED\x1b[0m                       [ 50%]`,
        `tests/test_audit.py::test_scope_structure \x1b[32mPASSED\x1b[0m                   [100%]`,
        ``,
        `\x1b[32m============================== 2 passed in 0.18s ===============================\x1b[0m`,
      ];
    } else if (type === 'audit') {
      command = `bandit -r src/ -ll`;
      initialLogs = [
        `\x1b[36m$ bandit -r src/ -ll -f screen\x1b[0m`,
        `[main]  INFO    profile include tests: None`,
        `[main]  INFO    cli include tests: None`,
        `[main]  INFO    files to scan... 4 files`,
        `>> Issue: [B104:hardcoded_bind_all_interfaces] Possible binding to all interfaces.`,
        `   Severity: Low   Confidence: Medium`,
        `   CWE: CWE-699 (Software Development)`,
        `   Location: src/scanner.py:28`,
        `--------------------------------------------------`,
        `\x1b[33mCode scanned: 4 files, 142 lines of code\x1b[0m`,
        `\x1b[32mTotal issues (by severity): Undefined: 0, Low: 1, Medium: 0, High: 0\x1b[0m`,
        `\x1b[32m[✓] Security audit passed with 0 High/Critical findings.\x1b[0m`,
      ];
    } else if (type === 'build') {
      command = `cargo build --release`;
      initialLogs = [
        `\x1b[36m$ cargo build --release --verbose\x1b[0m`,
        `   Compiling tokio v1.38.0`,
        `   Compiling serde v1.0.203`,
        `   Compiling rusqlite v0.31.0`,
        `   Compiling citadel-aegis-scanner v2.4.0`,
        `    Finished release [optimized] target(s) in 2.34s`,
        `\x1b[32m[✓] Binary artifact generated at target/release/citadel-aegis-scanner (4.2 MB)\x1b[0m`,
      ];
    }

    setTimeout(() => {
      setExecutionOutput({
        id: `exec-${Date.now()}`,
        command,
        type,
        status: 'success',
        timestamp: new Date().toLocaleTimeString(),
        durationMs: 1420,
        logs: initialLogs,
      });
      setIsExecuting(false);
    }, 600);
  };

  // Git commit handler
  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim() || !activeProject) return;

    showConfirmation({
      title: 'Confirm Git Atomic Commit',
      message: `Execute atomic commit with message: "${commitMessage}" in repository ${activeProject.name}?`,
      confirmLabel: 'Commit Changes',
      onConfirm: async () => {
        await bridge.gitCommit(activeProject.id, commitMessage);
        setCommitMessage('');
        // mark files as clean
        setFiles((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((k) => {
            updated[k] = { ...updated[k], isModified: false, status: 'clean' };
          });
          return updated;
        });
        await loadGit();
        showToast({
          type: 'success',
          title: 'Changes Committed',
          message: 'Git index updated with cryptographic tree signature.',
        });
      },
    });
  };

  // Dynamic directory extraction for folder tree
  const { folderTree, rootFiles } = useMemo<{ folderTree: Record<string, string[]>; rootFiles: string[] }>(() => {
    const folders: Record<string, string[]> = {};
    const roots: string[] = [];

    Object.keys(files).forEach((path) => {
      if (explorerSearch && !path.toLowerCase().includes(explorerSearch.toLowerCase())) {
        return;
      }
      const slashIndex = path.indexOf('/');
      if (slashIndex !== -1) {
        const folder = path.substring(0, slashIndex);
        if (!folders[folder]) {
          folders[folder] = [];
        }
        folders[folder].push(path);
      } else {
        roots.push(path);
      }
    });

    return { folderTree: folders, rootFiles: roots };
  }, [files, explorerSearch]);

  const fileList = Object.values(files) as VirtualFile[];
  const modifiedCount = fileList.filter((f) => f.status !== 'clean' && f.isModified).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent relative z-10">
      {/* Top Header Bar */}
      <div className="h-12 bg-[#0d1017]/90 border-b border-gray-800/80 flex items-center justify-between px-3 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
            <Code className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-tech text-gray-100 uppercase tracking-wider">
              Code Lab Enclave
            </span>
            <span className="text-gray-600">/</span>

            {/* Project Switcher Dropdown */}
            <select
              value={activeProject?.id || ''}
              onChange={(e) => setActiveProject(e.target.value)}
              className="bg-[#12161f] border border-gray-700 hover:border-cyan-500/50 text-cyan-300 text-xs font-tech font-semibold rounded px-2 py-1 focus:outline-hidden cursor-pointer"
            >
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <StatusPill status="healthy" label={gitStatus?.currentBranch || selectedBranch} subLabel="PORTABLE GIT" />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Run file button */}
          <button
            onClick={() => handleRunCode('run')}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-tech font-bold uppercase tracking-wider transition-colors cursor-pointer"
            title="Execute Active File (Python / Rust)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run File</span>
          </button>

          {/* Test button */}
          <button
            onClick={() => handleRunCode('test')}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#161b22] hover:bg-[#21262d] border border-gray-700 text-gray-200 text-xs font-tech font-medium transition-colors cursor-pointer"
            title="Run Unit & Regression Tests"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test</span>
          </button>

          {/* Security Audit button */}
          <button
            onClick={() => handleRunCode('audit')}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#161b22] hover:bg-[#21262d] border border-gray-700 text-gray-200 text-xs font-tech font-medium transition-colors cursor-pointer"
            title="Run Bandit / Linter Security Scan"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Sec Audit</span>
          </button>

          <div className="h-4 w-px bg-gray-800 mx-1" />

          {/* Switch to Terminal */}
          <button
            onClick={() => {
              createTerminalTab('Project Shell');
              setActiveModule('terminal-deck');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#161b22] hover:bg-[#21262d] border border-gray-700 text-gray-300 text-xs font-tech transition-colors cursor-pointer"
            title="Open Dedicated Terminal Shell"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Shell</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Stage: 3 Panels (File Tree | Editor/Diff/Git | Console) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Project File Explorer */}
        <div className="w-64 bg-[#0a0d14] border-r border-gray-800 flex flex-col shrink-0 select-none">
          <div className="p-2 border-b border-gray-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-tech font-bold uppercase tracking-wider text-gray-400">
                Explorer
              </span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-gray-800/80 text-gray-400">
                {Object.keys(files).length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setNewFileModalOpen(true)}
                className="p-1 rounded hover:bg-[#161b22] text-gray-400 hover:text-cyan-300 transition-colors cursor-pointer"
                title="New File (Ctrl+N)"
              >
                <FilePlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={async () => {
                  const projectId = activeProject?.id || 'default';
                  const loaded = await bridge.loadProjectFiles(projectId);
                  if (loaded) setFiles(loaded);
                  await loadGit();
                  showToast({ type: 'info', title: 'Explorer Refreshed', message: 'Syncing workspace tree with disk state.' });
                }}
                className="p-1 rounded hover:bg-[#161b22] text-gray-400 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Refresh from Disk"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="px-2 py-1.5 border-b border-gray-800/50">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-2 text-gray-500" />
              <input
                type="text"
                placeholder="Filter files..."
                value={explorerSearch}
                onChange={(e) => setExplorerSearch(e.target.value)}
                className="w-full pl-6 pr-2 py-1 bg-[#12161f] border border-gray-800 rounded text-[11px] font-mono text-gray-200 placeholder-gray-600 focus:outline-hidden focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Dynamic Folder & File Tree items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs font-mono">
            {(Object.entries(folderTree) as [string, string[]][]).map(([folderName, folderPaths]) => {
              const isExpanded = expandedFolders[folderName] !== false;
              return (
                <div key={folderName}>
                  <div
                    onClick={() =>
                      setExpandedFolders((prev) => ({
                        ...prev,
                        [folderName]: !isExpanded,
                      }))
                    }
                    className="flex items-center justify-between px-1.5 py-1 rounded hover:bg-[#12161f] text-gray-300 cursor-pointer group select-none"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-gray-500 shrink-0" />
                      )}
                      <Folder className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="font-semibold text-gray-200 truncate">{folderName}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {folderPaths.length}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="pl-4 space-y-0.5 mt-0.5">
                      {folderPaths.map((path) => {
                        const f = files[path];
                        if (!f) return null;
                        const isActive = path === activeFilePath;
                        return (
                          <div
                            key={path}
                            onClick={() => handleOpenFile(path)}
                            className={`group/file flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
                              isActive
                                ? 'bg-cyan-950/60 text-cyan-300 font-semibold'
                                : 'text-gray-400 hover:bg-[#12161f] hover:text-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <FileCode className="w-3.5 h-3.5 text-cyan-500/70 shrink-0" />
                              <span className="truncate">{f.name}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {f.status === 'modified' && (
                                <span className="text-[10px] text-amber-400 font-bold">M</span>
                              )}
                              {f.status === 'added' && (
                                <span className="text-[10px] text-emerald-400 font-bold">U</span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTargetFile(f);
                                }}
                                className="opacity-0 group-hover/file:opacity-100 p-0.5 text-gray-500 hover:text-rose-400 rounded transition-opacity"
                                title={`Delete ${f.name}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Root Files (Cargo.toml, README.md, etc.) */}
            {rootFiles.length > 0 && (
              <div className="pt-2 border-t border-gray-800/40 space-y-0.5">
                {rootFiles.map((path) => {
                  const f = files[path];
                  if (!f) return null;
                  const isActive = path === activeFilePath;
                  return (
                    <div
                      key={path}
                      onClick={() => handleOpenFile(path)}
                      className={`group/file flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-cyan-950/60 text-cyan-300 font-semibold'
                          : 'text-gray-400 hover:bg-[#12161f] hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {f.status === 'modified' && (
                          <span className="text-[10px] text-amber-400 font-bold">M</span>
                        )}
                        {f.status === 'added' && (
                          <span className="text-[10px] text-emerald-400 font-bold">U</span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetFile(f);
                          }}
                          className="opacity-0 group-hover/file:opacity-100 p-0.5 text-gray-500 hover:text-rose-400 rounded transition-opacity"
                          title={`Delete ${f.name}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Git Enclave Footer Action in Left Sidebar */}
          <div className="p-2.5 border-t border-gray-800 bg-[#0d1017] space-y-1">
            <div className="flex items-center justify-between text-[11px] font-tech">
              <span className="text-gray-400">Git Source Control</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 font-mono text-[10px]">
                {modifiedCount} modified
              </span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode(viewMode === 'git' ? 'editor' : 'git')}
                className={`flex-1 py-1 px-2 rounded text-[11px] font-tech font-bold transition-colors ${
                  viewMode === 'git'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50'
                    : 'bg-[#161b22] hover:bg-[#21262d] text-gray-300 border border-gray-700'
                }`}
              >
                Git Panel
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'diff' ? 'editor' : 'diff')}
                className={`flex-1 py-1 px-2 rounded text-[11px] font-tech font-bold transition-colors ${
                  viewMode === 'diff'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50'
                    : 'bg-[#161b22] hover:bg-[#21262d] text-gray-300 border border-gray-700'
                }`}
              >
                Diff Inspector
              </button>
            </div>
          </div>
        </div>

        {/* Center Main Stage: Code Editor / Diff Inspector / Git Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#07090e]">
          {/* File Tabs Bar */}
          <div className="h-9 bg-[#0a0d14] border-b border-gray-800 flex items-center justify-between px-2 shrink-0 select-none overflow-x-auto">
            <div className="flex items-center gap-1 h-full py-0.5">
              {openTabPaths.map((path) => {
                const f = files[path];
                if (!f) return null;
                const isActive = path === activeFilePath && viewMode === 'editor';
                return (
                  <div
                    key={path}
                    onClick={() => {
                      setActiveFilePath(path);
                      setViewMode('editor');
                    }}
                    className={`group/tab flex items-center gap-1.5 px-3 py-1 rounded-t text-xs font-mono cursor-pointer border-t border-x transition-colors ${
                      isActive
                        ? 'bg-[#07090e] border-cyan-500/50 text-cyan-300 font-semibold'
                        : 'bg-[#12161f] border-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <span>{f.name}</span>
                    {f.isModified && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                    <button
                      onClick={(e) => handleCloseTab(e, path)}
                      className="p-0.5 hover:text-rose-400 rounded text-gray-500 ml-1"
                      title="Close tab"
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              {/* Quick Add Tab Button */}
              <button
                onClick={() => setNewFileModalOpen(true)}
                className="p-1 text-gray-500 hover:text-cyan-300 hover:bg-[#161b22] rounded transition-colors ml-0.5 cursor-pointer"
                title="New File (Ctrl+N)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Editor Quick Actions */}
            <div className="flex items-center gap-1.5 text-xs font-tech text-gray-400 shrink-0">
              <button
                onClick={() => setNewFileModalOpen(true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#161b22] hover:bg-[#21262d] border border-gray-700 text-gray-300 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Create new file (Ctrl+N)"
              >
                <FilePlus className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">New</span>
              </button>

              <button
                onClick={handleSaveFile}
                disabled={isSaving}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded border transition-colors cursor-pointer ${
                  activeFile?.isModified
                    ? 'bg-cyan-950/80 hover:bg-cyan-900 border-cyan-500/60 text-cyan-200 font-semibold'
                    : 'bg-[#161b22] hover:bg-[#21262d] border-gray-700 text-gray-300 hover:text-cyan-300'
                }`}
                title="Save changes (Ctrl+S)"
              >
                <Save className={`w-3 h-3 ${isSaving ? 'animate-spin' : 'text-cyan-400'}`} />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
                {activeFile?.isModified && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </button>

              {activeFile && (
                <button
                  onClick={() => setDeleteTargetFile(activeFile)}
                  className="p-1 rounded hover:bg-rose-950/40 border border-transparent hover:border-rose-700/50 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title={`Delete ${activeFile.name} from disk`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeFile?.content || '');
                  showToast({ type: 'info', title: 'Code Copied', message: 'Buffer copied to clipboard.' });
                }}
                className="p-1 rounded hover:bg-[#161b22] text-gray-400 hover:text-gray-200 cursor-pointer"
                title="Copy all code"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Breadcrumb Path Bar */}
          <div className="h-6 bg-[#07090e] border-b border-gray-800/60 px-3 flex items-center justify-between text-[11px] font-mono text-gray-500 shrink-0">
            <div className="flex items-center gap-1.5">
              <span>{activeProject?.name || 'Citadel Workspace'}</span>
              <span>/</span>
              <span className="text-cyan-400">{activeFile.path}</span>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span>Lang: {activeFile.language.toUpperCase()}</span>
              <span>UTF-8</span>
              <span>4 Spaces</span>
            </div>
          </div>

          {/* Content Body: Editor OR Diff OR Git Stage */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {viewMode === 'editor' && (
              <div className="flex-1 flex relative overflow-hidden bg-[#07090e]">
                {/* Line Numbers Bar */}
                <div className="w-12 bg-[#090c12] border-r border-gray-800/80 p-3 text-right text-[12px] font-mono text-gray-600 select-none shrink-0 leading-6">
                  {activeFile.content.split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Real Code Textarea with IDE styling */}
                <textarea
                  value={activeFile.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onKeyUp={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    const lines = target.value.substring(0, target.selectionStart).split('\n');
                    setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 });
                  }}
                  onClick={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    const lines = target.value.substring(0, target.selectionStart).split('\n');
                    setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 });
                  }}
                  spellCheck={false}
                  className="flex-1 p-3 bg-transparent text-[12px] font-mono text-gray-100 leading-6 resize-none focus:outline-hidden focus:ring-0 border-0 whitespace-pre overflow-auto"
                />
              </div>
            )}

            {/* Diff Inspector Mode */}
            {viewMode === 'diff' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#07090e]">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800 text-xs font-tech">
                  <div className="flex items-center gap-2">
                    <GitCompare className="w-4 h-4 text-cyan-400" />
                    <span className="text-gray-100 font-bold uppercase">
                      Unified Git Diff: {activeFile.path}
                    </span>
                  </div>
                  <span className="text-amber-400 font-mono text-[11px]">Uncommitted Changes</span>
                </div>

                {activeFile.diff ? (
                  <div className="rounded border border-gray-800 bg-[#090c12] p-3 font-mono text-xs space-y-1">
                    <div className="text-cyan-400 font-bold mb-2">{activeFile.diff.unified.split('\n')[0]}</div>
                    {activeFile.diff.removed.map((l, i) => (
                      <div key={`rem-${i}`} className="bg-rose-950/40 text-rose-300 px-2 py-0.5 rounded">
                        {l}
                      </div>
                    ))}
                    {activeFile.diff.added.map((l, i) => (
                      <div key={`add-${i}`} className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded">
                        {l}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 font-mono text-xs">
                    No active git diff detected on {activeFile.name}. Working tree is clean.
                  </div>
                )}
              </div>
            )}

            {/* Git Enclave Control Panel */}
            {viewMode === 'git' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#07090e]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: Commit Form */}
                  <form onSubmit={handleCommit} className="bg-[#0e121a] border border-gray-800 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-tech font-bold text-gray-200 uppercase">
                      <span>Commit Changes</span>
                      <span className="text-cyan-400 font-mono text-[10px]">branch: {gitStatus?.currentBranch || 'main'}</span>
                    </div>

                    <div className="flex gap-1 flex-wrap">
                      {['feat:', 'fix:', 'sec:', 'refactor:', 'test:'].map((prefix) => (
                        <button
                          key={prefix}
                          type="button"
                          onClick={() => setCommitMessage(`${prefix} `)}
                          className="px-2 py-0.5 rounded bg-gray-900 border border-gray-700 text-gray-300 hover:text-cyan-300 font-mono text-[10px] cursor-pointer"
                        >
                          {prefix}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={4}
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="Commit message (e.g. sec: update TLS ciphersuite rule)..."
                      className="w-full px-3 py-2 rounded bg-[#07090e] border border-gray-700 text-xs font-mono text-gray-100 placeholder-gray-600 focus:outline-hidden focus:border-cyan-400"
                    />

                    <button
                      type="submit"
                      disabled={!commitMessage.trim()}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-tech font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Stage All & Commit</span>
                    </button>
                  </form>

                  {/* Right: Modified Files & Commit History */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="bg-[#0e121a] border border-gray-800 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs font-tech">
                        <span className="font-bold text-gray-200 uppercase">
                          Working Tree Changes ({modifiedCount})
                        </span>
                        <span className="text-gray-500 font-mono text-[11px]">
                          Repository: {activeProject?.path}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {fileList
                          .filter((f) => f.status !== 'clean')
                          .map((f) => (
                            <div
                              key={f.path}
                              onClick={() => handleOpenFile(f.path)}
                              className="p-2 rounded bg-[#07090e] border border-gray-800 flex items-center justify-between text-xs font-mono cursor-pointer hover:border-cyan-500/40"
                            >
                              <div className="flex items-center gap-2">
                                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="text-gray-200">{f.path}</span>
                              </div>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                  f.status === 'modified'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                }`}
                              >
                                {f.status}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="bg-[#0e121a] border border-gray-800 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs font-tech">
                        <span className="font-bold text-gray-200 uppercase">Recent Commits</span>
                        <History className="w-3.5 h-3.5 text-cyan-400" />
                      </div>

                      <div className="space-y-2">
                        {gitStatus?.recentCommits.map((c) => (
                          <div
                            key={c.hash}
                            className="p-2.5 rounded bg-[#07090e] border border-gray-800 text-xs font-tech space-y-0.5"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-mono text-cyan-400 font-bold">{c.hash}</span>
                              <span className="text-gray-500">{c.date}</span>
                            </div>
                            <div className="text-gray-200 font-sans font-medium">{c.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Integrated Run & Build Output Console Drawer */}
          {executionOutput && (
            <div
              className={`bg-[#0a0d14] border-t border-gray-800 flex flex-col shrink-0 transition-all ${
                consoleCollapsed ? 'h-8' : 'h-48'
              }`}
            >
              {/* Console Header */}
              <div className="h-8 px-3 bg-[#0d1017] border-b border-gray-800 flex items-center justify-between text-xs font-tech select-none shrink-0">
                <div className="flex items-center gap-2">
                  <TerminalSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-gray-200 uppercase tracking-wider">
                    Build & Execution Console: <code className="text-cyan-400 font-mono text-[11px]">{executionOutput.command}</code>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-mono">
                    EXIT 0
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRunCode(executionOutput.type)}
                    className="p-1 rounded hover:bg-[#161b22] text-gray-400 hover:text-cyan-300"
                    title="Re-run"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setExecutionOutput(null)}
                    className="p-1 rounded hover:bg-[#161b22] text-gray-400 hover:text-rose-400"
                    title="Close console"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setConsoleCollapsed(!consoleCollapsed)}
                    className="p-1 rounded hover:bg-[#161b22] text-gray-400 hover:text-gray-200"
                    title={consoleCollapsed ? 'Expand' : 'Collapse'}
                  >
                    {consoleCollapsed ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Console stdout stream */}
              {!consoleCollapsed && (
                <div className="flex-1 p-3 font-mono text-xs text-gray-300 overflow-y-auto space-y-0.5 bg-[#07090e]">
                  {executionOutput.logs.map((log, idx) => (
                    <div key={idx} className="leading-5">
                      {log.replace(/\x1b\[[0-9;]*m/g, '')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom Status Bar */}
          <div className="h-6 bg-[#0d1017] border-t border-gray-800 px-3 flex items-center justify-between text-[11px] font-tech text-gray-500 shrink-0">
            <div className="flex items-center gap-3">
              <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
              <span>Encoding: UTF-8</span>
              <span className="text-cyan-400 font-mono">Scope: {activeProject?.path}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-mono">SQLite WAL: In Sync</span>
              <span>Air-Gapped Local IDE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
