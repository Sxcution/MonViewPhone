/**
 * visualAlertEngine.ts
 * Pure logic module for Visual Alert red-dot detection.
 * No React dependencies — easy to test and isolate.
 *
 * localStorage key: visualAlertGlobalSettingsV1
 */

/* ── Types ──────────────────────────────────────────────────────── */

export type VisualAlertROI = {
  x: number;  // 0-1
  y: number;  // 0-1
  w: number;  // 0-1
  h: number;  // 0-1
};

export type RedThreshold = {
  rMin: number;
  gMax: number;
  bMax: number;
  minPixels: number;
};

export type VisualAlertConfig = {
  enabled: boolean;
  roi: VisualAlertROI;
  scanIntervalSec: number;
  confirmCount: number;
  cooldownSec: number;
  redThreshold: RedThreshold;
};

export type ScanResult = {
  scanned: boolean;
  redPixelCount: number;
};

/* ── Constants ──────────────────────────────────────────────────── */

export const VISUAL_ALERT_STORAGE_KEY = 'visualAlertGlobalSettingsV1';

export const DEFAULT_VISUAL_ALERT_CONFIG: VisualAlertConfig = {
  enabled: false,
  roi: { x: 0, y: 0, w: 0.1, h: 0.1 },
  scanIntervalSec: 3,
  confirmCount: 2,
  cooldownSec: 60,
  redThreshold: {
    rMin: 180,
    gMax: 100,
    bMax: 100,
    minPixels: 12,
  },
};

/* ── Persistence ────────────────────────────────────────────────── */

export function loadVisualAlertConfig(): VisualAlertConfig {
  try {
    const raw = localStorage.getItem(VISUAL_ALERT_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_VISUAL_ALERT_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : false,
      roi: normalizeROI(parsed.roi),
      scanIntervalSec: clampInt(parsed.scanIntervalSec, 1, 30, 3),
      confirmCount: clampInt(parsed.confirmCount, 1, 10, 2),
      cooldownSec: clampInt(parsed.cooldownSec, 10, 600, 60),
      redThreshold: normalizeThreshold(parsed.redThreshold),
    };
  } catch {
    return { ...DEFAULT_VISUAL_ALERT_CONFIG };
  }
}

export function saveVisualAlertConfig(config: VisualAlertConfig): void {
  try {
    localStorage.setItem(VISUAL_ALERT_STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

/* ── ROI Scanning ───────────────────────────────────────────────── */

/**
 * Scan a canvas region defined by ROI (0-1 ratios) and count red pixels.
 * Uses getImageData only on the ROI region — NOT full canvas.
 * Does NOT save any image to disk.
 */
export function scanCanvasROI(
  canvas: HTMLCanvasElement,
  roi: VisualAlertROI,
  threshold: RedThreshold,
): ScanResult {
  const cw = canvas.width;
  const ch = canvas.height;
  if (cw === 0 || ch === 0) return { scanned: false, redPixelCount: 0 };

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { scanned: false, redPixelCount: 0 };

  // Convert ROI ratios to pixel coordinates, clamped to canvas bounds
  const px = Math.max(0, Math.floor(roi.x * cw));
  const py = Math.max(0, Math.floor(roi.y * ch));
  const pw = Math.max(1, Math.min(Math.ceil(roi.w * cw), cw - px));
  const ph = Math.max(1, Math.min(Math.ceil(roi.h * ch), ch - py));

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(px, py, pw, ph);
  } catch {
    return { scanned: false, redPixelCount: 0 };
  }

  const data = imageData.data;
  let redPixelCount = 0;
  // Iterate every pixel (RGBA, 4 bytes each)
  for (let i = 0, len = data.length; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > threshold.rMin && g < threshold.gMax && b < threshold.bMax) {
      redPixelCount++;
    }
  }

  return { scanned: true, redPixelCount };
}

/* ── Audio Alert ────────────────────────────────────────────────── */

let _audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return _audioCtx;
  } catch {
    return null;
  }
}

/**
 * Play a short beep sound (880Hz, 300ms) using AudioContext oscillator.
 * No external audio file required.
 */
export function playAlertSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, ctx.currentTime);
  gain.gain.setValueAtTime(0.35, ctx.currentTime);
  // Fade out for smoother sound
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.3);
}

/* ── Desktop / Toast Notification ───────────────────────────────── */

/**
 * Show a notification when red dot detected.
 * Uses browser Notification API if permitted, otherwise falls back to console.
 */
export function showAlertNotification(deviceNumber: number): void {
  const title = 'Visual Alert';
  const body = `Máy ${String(deviceNumber).padStart(2, '0')} phát hiện chấm đỏ`;

  // Try browser Notification API
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/favicon.ico', tag: `va-${deviceNumber}` });
    } catch {
      /* fallback below */
    }
  }

  // Always dispatch a custom event so the React toast can pick it up
  window.dispatchEvent(
    new CustomEvent('visualAlertDetected', {
      detail: { deviceNumber, message: body, timestamp: Date.now() },
    }),
  );
}

/**
 * Request notification permission if not already granted.
 */
export function requestNotificationPermission(): void {
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function normalizeROI(raw: unknown): VisualAlertROI {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_VISUAL_ALERT_CONFIG.roi };
  const o = raw as Record<string, unknown>;
  return {
    x: clamp01(o.x),
    y: clamp01(o.y),
    w: clamp01(o.w, 0.01),
    h: clamp01(o.h, 0.01),
  };
}

function normalizeThreshold(raw: unknown): RedThreshold {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_VISUAL_ALERT_CONFIG.redThreshold };
  const o = raw as Record<string, unknown>;
  return {
    rMin: clampInt(o.rMin, 0, 255, 180),
    gMax: clampInt(o.gMax, 0, 255, 100),
    bMax: clampInt(o.bMax, 0, 255, 100),
    minPixels: clampInt(o.minPixels, 1, 10000, 12),
  };
}

function clamp01(value: unknown, min = 0): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(1, n));
}
