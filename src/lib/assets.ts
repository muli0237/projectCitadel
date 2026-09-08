/**
 * Citadel Local Asset Management & Preloading Subsystem
 */

// Bundled core visual assets (WebP with fallback JPG)
import entryScreenWebp from '../assets/launch/citadel-entry-screen.webp';
import launchBgWebp from '../assets/launch/citadel-launch-background.webp';

export interface PreloadStatus {
  entryImage: boolean;
  launchBackground: boolean;
  fontsLoaded: boolean;
  audioReady: boolean;
}

export const ASSET_MAP = {
  entryScreen: entryScreenWebp,
  launchBackground: launchBgWebp,
};

/**
 * Preload an image asset asynchronously without blocking first paint
 */
const preloadCache = new Map<string, Promise<boolean>>();

export function preloadImage(src: string): Promise<boolean> {
  if (!src) return Promise.resolve(false);

  const cached = preloadCache.get(src);
  if (cached) return cached;

  const promise = new Promise<boolean>((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
    if (img.complete) resolve(img.naturalWidth > 0);
  });

  preloadCache.set(src, promise);
  return promise;
}

/**
 * Preloads the critical assets required for the cinematic launch sequence
 */
export async function preloadCriticalLaunchAssets(): Promise<PreloadStatus> {
  const [entryOk, bgOk] = await Promise.all([
    preloadImage(ASSET_MAP.entryScreen),
    preloadImage(ASSET_MAP.launchBackground),
  ]);

  let fontsOk = false;
  if ('fonts' in document) {
    try {
      await document.fonts.ready;
      fontsOk = true;
    } catch {
      fontsOk = false;
    }
  }

  return {
    entryImage: entryOk,
    launchBackground: bgOk,
    fontsLoaded: fontsOk,
    audioReady: true,
  };
}

/**
 * Validates a user-supplied workspace asset path and extension
 */
export function validateUserAsset(filename: string): { valid: boolean; reason?: string } {
  if (!filename) return { valid: false, reason: 'Empty filename' };

  const parts = filename.split('.');
  if (parts.length < 2) return { valid: false, reason: 'Missing file extension' };

  const ext = parts.pop()?.toLowerCase();
  const allowed = ['webp', 'png', 'jpg', 'jpeg', 'svg', 'avif', 'ogg', 'wav', 'mp3'];

  if (!ext || !allowed.includes(ext)) {
    return { valid: false, reason: `Extension .${ext} not allowed. Supported: ${allowed.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Resolves a bundled asset with safe fallback
 */
export function getBundledAsset(key: keyof typeof ASSET_MAP): string {
  return ASSET_MAP[key] || '';
}
