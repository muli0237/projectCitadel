import { create } from 'zustand';
import {
  AppSettings,
  DriveHealth,
  ModuleId,
  Project,
  SystemMetrics,
  TerminalSession,
  ToolDefinition,
  WorkspaceStatus,
} from '../types';
import { bridge } from '../services/tauriBridge';
import { sound } from '../services/soundService';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  timestamp: number;
}

export interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface CommandPreviewState {
  isOpen: boolean;
  tool?: ToolDefinition;
  commandString: string;
  args: string[];
  requiresElevation: boolean;
  workingDirectory: string;
  targetDescription?: string;
  onExecute: (runInTerminal: boolean) => void;
}

interface CitadelState {
  // Navigation & UI
  activeModule: ModuleId;
  commandPaletteOpen: boolean;
  launchSequenceComplete: boolean;
  isFirstLaunch: boolean;
  authorizationAcknowledged: boolean;

  // System & Workspace Data
  workspace: WorkspaceStatus | null;
  driveHealth: DriveHealth | null;
  systemMetrics: SystemMetrics | null;
  activeProject: Project | null;
  projectsList: Project[];
  settings: AppSettings;

  // Modals & Notifications
  toasts: ToastMessage[];
  confirmation: ConfirmationState | null;
  commandPreview: CommandPreviewState | null;
  emergencyDriveModalOpen: boolean;

  // Active Terminal Tabs
  terminalTabs: TerminalSession[];
  activeTerminalId: string;

  // Actions
  setActiveModule: (module: ModuleId) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  completeLaunchSequence: () => void;
  replayLaunchSequence: () => void;
  acknowledgeAuthorization: () => void;
  showToast: (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => void;
  dismissToast: (id: string) => void;
  showConfirmation: (config: Omit<ConfirmationState, 'isOpen'>) => void;
  closeConfirmation: () => void;
  showCommandPreview: (config: Omit<CommandPreviewState, 'isOpen'>) => void;
  closeCommandPreview: () => void;

  // Data Fetching & Sync
  refreshWorkspace: () => Promise<void>;
  refreshDriveHealth: () => Promise<void>;
  refreshSystemMetrics: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  setActiveProject: (projectId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;

  // Terminal Tab Management
  createTerminalTab: (profile?: TerminalSession['profile']) => Promise<string | null>;
  closeTerminalTab: (id: string) => Promise<void>;
  setActiveTerminalId: (id: string) => void;

  // Ejection & Drive handling
  triggerSafeEject: () => Promise<void>;
  simulateDriveDisconnect: () => Promise<void>;
  simulateDriveReconnect: () => Promise<void>;
}

export const useCitadelStore = create<CitadelState>((set, get) => ({
  activeModule: 'command-center',
  commandPaletteOpen: false,
  launchSequenceComplete: false,
  isFirstLaunch: true,
  authorizationAcknowledged: true,

  workspace: null,
  driveHealth: null,
  systemMetrics: null,
  activeProject: null,
  projectsList: [],
  settings: {
    workspaceRoot: '/media/kali/CITADEL_DRIVE/Citadel/workspace',
    theme: 'graphite-cyan',
    enableMotion: true,
    fontScale: 'standard',
    terminalFontSize: 13,
    terminalFontFamily: "'JetBrains Mono', monospace",
    preferredEditorCommand: 'code',
    containerRuntimePreference: 'docker',
    auditLogRetentionDays: 90,
    safeEjectAutoFlush: true,
    autoAcknowledgeAuthorizedScope: false,
    showScanlines: false,
    playTacticalAudio: true,
  },

  toasts: [],
  confirmation: null,
  commandPreview: null,
  emergencyDriveModalOpen: false,

  terminalTabs: [],
  activeTerminalId: '',

  setActiveModule: (module) => {
    sound.playClick();
    set({ activeModule: module });
  },

  setCommandPaletteOpen: (open) => {
    if (open) sound.playClick();
    set({ commandPaletteOpen: open });
  },

  completeLaunchSequence: () => {
    sound.playReadyTone();
    set({ launchSequenceComplete: true, isFirstLaunch: false });
  },

  replayLaunchSequence: () => {
    sound.playClick();
    set({ launchSequenceComplete: false });
  },

  acknowledgeAuthorization: () => {
    sound.playClick();
    set({ authorizationAcknowledged: true });
    get().showToast({
      type: 'info',
      title: 'Rules of Engagement Acknowledged',
      message: 'Tool execution unlocked for authorized scopes.',
    });
  },

  showToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { ...toast, id, timestamp: Date.now() };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    setTimeout(() => {
      get().dismissToast(id);
    }, 4500);
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  showConfirmation: (config) => {
    sound.playWarning();
    set({ confirmation: { ...config, isOpen: true } });
  },

  closeConfirmation: () => {
    set({ confirmation: null });
  },

  showCommandPreview: (config) => {
    sound.playClick();
    set({ commandPreview: { ...config, isOpen: true } });
  },

  closeCommandPreview: () => {
    set({ commandPreview: null });
  },

  refreshWorkspace: async () => {
    try {
      const ws = await bridge.getWorkspaceStatus();
      set({ workspace: ws, activeProject: ws.activeProject || null });
    } catch (e) {
      console.error(e);
    }
  },

  refreshDriveHealth: async () => {
    try {
      const dh = await bridge.getDriveHealth();
      set({ driveHealth: dh });
    } catch (e) {
      console.error(e);
    }
  },

  refreshSystemMetrics: async () => {
    try {
      const sm = await bridge.getSystemMetrics();
      set({ systemMetrics: sm });
    } catch (e) {
      console.error(e);
    }
  },

  refreshProjects: async () => {
    try {
      const list = await bridge.listProjects();
      set({ projectsList: list });
    } catch (e) {
      console.error(e);
    }
  },

  setActiveProject: async (projectId) => {
    try {
      const proj = await bridge.setActiveProject(projectId);
      if (proj) {
        set({ activeProject: proj });
        get().showToast({
          type: 'info',
          title: 'Active Project Switched',
          message: `${proj.name} is now loaded in workspace.`,
        });
      }
    } catch (e) {
      console.error(e);
    }
  },

  updateSettings: async (newSettings) => {
    try {
      const updated = await bridge.updateSettings(newSettings);
      set({ settings: updated });
      sound.setEnabled(updated.playTacticalAudio);
      get().showToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Portable preferences updated in workspace config.',
      });
    } catch (e) {
      console.error(e);
    }
  },

  createTerminalTab: async (profile = 'Kali Shell') => {
    sound.playClick();
    const id = `term-${Date.now()}`;
    const workingDir = get().activeProject?.path || get().settings.workspaceRoot;
    
    try {
      // Invoke Rust backend or simulated bridge to get the actual running session
      const sessionResult = await bridge.createTerminalSession({
        id,
        profile,
        workingDirectory: workingDir,
        cols: 80,
        rows: 24,
      });

      if (!sessionResult) {
        throw new Error('Rust PTY process spawn failed');
      }

      const newTab: TerminalSession = {
        id,
        title: `${profile} #${get().terminalTabs.length + 1}`,
        profile,
        workingDirectory: workingDir,
        activePid: sessionResult.pid,
        isElevated: sessionResult.isElevated ?? (profile === 'Kali Shell'),
        status: 'running',
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        terminalTabs: [...state.terminalTabs, newTab],
        activeTerminalId: id,
      }));

      return id;
    } catch (e: any) {
      console.error('Failed to create terminal session:', e);
      get().showToast({
        type: 'error',
        title: 'SHELL LAUNCH FAILED',
        message: 'The Rust PTY session could not be created.',
      });
      return null;
    }
  },

  closeTerminalTab: async (id) => {
    sound.playClick();
    try {
      await bridge.closeTerminal(id);
    } catch (e) {
      console.warn('Failed to close PTY session cleanly:', e);
    }
    set((state) => {
      const filtered = state.terminalTabs.filter((t) => t.id !== id);
      let nextActive = state.activeTerminalId;
      if (state.activeTerminalId === id) {
        nextActive = filtered[filtered.length - 1]?.id || '';
      }
      return {
        terminalTabs: filtered,
        activeTerminalId: nextActive,
      };
    });
  },

  setActiveTerminalId: (id) => {
    sound.playClick();
    set({ activeTerminalId: id });
  },

  triggerSafeEject: async () => {
    try {
      const res = await bridge.prepareSafeEject();
      if (res.success) {
        sound.playReadyTone();
        await get().refreshDriveHealth();
        get().showToast({
          type: 'success',
          title: 'Safe to Eject',
          message: res.message,
        });
      }
    } catch (e) {
      console.error(e);
    }
  },

  simulateDriveDisconnect: async () => {
    await bridge.simulateDriveDisconnect();
    sound.playWarning();
    set({ emergencyDriveModalOpen: true });
    await get().refreshDriveHealth();
    await get().refreshWorkspace();
  },

  simulateDriveReconnect: async () => {
    await bridge.simulateDriveReconnect();
    sound.playReadyTone();
    set({ emergencyDriveModalOpen: false });
    await get().refreshDriveHealth();
    await get().refreshWorkspace();
    get().showToast({
      type: 'success',
      title: 'Portable Drive Reconnected',
      message: 'Workspace locks validated. Normal operations resumed.',
    });
  },
}));
