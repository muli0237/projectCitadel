/**
 * Error normalization and classification for Citadel Desktop
 */

export interface NormalizedError {
  code: string;
  message: string;
  details?: string;
  isFatal: boolean;
  canRetry: boolean;
}

export function normalizeError(err: unknown): NormalizedError {
  if (typeof err === 'string') {
    const isPathError = err.includes('PathOutsideWorkspace') || err.includes('traversal');
    return {
      code: isPathError ? 'ERR_SECURITY_PATH_ESCAPE' : 'ERR_HOST_INVOCATION',
      message: err,
      isFatal: false,
      canRetry: true,
    };
  }

  if (err && typeof err === 'object') {
    const anyErr = err as Record<string, any>;
    return {
      code: anyErr.code || 'ERR_GENERAL',
      message: anyErr.message || String(err),
      details: anyErr.details,
      isFatal: Boolean(anyErr.isFatal),
      canRetry: anyErr.canRetry !== false,
    };
  }

  return {
    code: 'ERR_UNKNOWN',
    message: 'An unknown host or IPC error occurred',
    isFatal: false,
    canRetry: true,
  };
}

export const normalizeCitadelError = normalizeError;
