import React from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Container,
  Cpu,
  Database,
  Download,
  ExternalLink,
  FileText,
  FolderGit2,
  HardDrive,
  Layers,
  LayoutDashboard,
  LogOut,
  Network,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  Sliders,
  Sparkles,
  Square,
  Terminal,
  Trash2,
  Wifi,
  Zap,
  type LucideProps,
} from 'lucide-react';
import { clsx } from 'clsx';

export const APP_ICONS = {
  activity: Activity,
  alert: AlertCircle,
  warning: AlertTriangle,
  arrowRight: ArrowRight,
  check: Check,
  success: CheckCircle2,
  chevronRight: ChevronRight,
  container: Container,
  cpu: Cpu,
  database: Database,
  download: Download,
  externalLink: ExternalLink,
  file: FileText,
  projects: FolderGit2,
  storage: HardDrive,
  layers: Layers,
  overview: LayoutDashboard,
  logout: LogOut,
  network: Network,
  play: Play,
  plus: Plus,
  radio: Radio,
  refresh: RefreshCw,
  search: Search,
  server: Server,
  settings: Settings,
  shield: Shield,
  sliders: Sliders,
  sparkles: Sparkles,
  stop: Square,
  terminal: Terminal,
  trash: Trash2,
  wifi: Wifi,
  zap: Zap,
} as const;

export type AppIconName = keyof typeof APP_ICONS;

export interface AppIconProps extends LucideProps {
  name: AppIconName;
}

export const AppIcon = React.forwardRef<SVGSVGElement, AppIconProps>(
  ({ name, className, ...props }, ref) => {
    const Icon = APP_ICONS[name];
    return <Icon ref={ref} className={clsx('shrink-0', className)} {...props} />;
  },
);
AppIcon.displayName = 'AppIcon';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: AppIconName;
  label: string;
  iconClassName?: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, iconClassName, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex size-8 shrink-0 items-center justify-center rounded transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <AppIcon name={icon} aria-hidden="true" className={clsx('size-4', iconClassName)} />
    </button>
  ),
);
IconButton.displayName = 'IconButton';
