/**
 * Format raw bytes into human-readable binary units (B, KiB, MiB, GiB, TiB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  if (isNaN(bytes) || bytes < 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeIndex = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, safeIndex)).toFixed(dm))} ${sizes[safeIndex]}`;
}

/**
 * Format uptime seconds into human-readable duration (e.g. "3d 4h 12m" or "42m 18s")
 */
export function formatUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0 || (days === 0 && hours === 0)) parts.push(`${secs}s`);

  return parts.slice(0, 3).join(' ');
}

/**
 * Format ISO timestamp into local short date & time
 */
export function formatTimestamp(isoString?: string | null): string {
  if (!isoString) return '--:--:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch {
    return '--:--:--';
  }
}

/**
 * Format percentage with controlled decimals
 */
export function formatPercent(value: number, decimals: number = 1): string {
  if (isNaN(value)) return '0.0%';
  return `${value.toFixed(decimals)}%`;
}
