/**
 * visualAlertEngine.ts
 * Pure logic module for Visual Alert red-dot detection.
 * No React dependencies — easy to test and isolate.
 *
 * Supports Multi-ROI: multiple small scan regions per config.
 * localStorage key: visualAlertGlobalSettingsV1
 */

import { saveVisualAlertSettingToBackend } from './backendSettings';

/* ── Types ──────────────────────────────────────────────────────── */

export type VisualAlertROI = {
  id: string;    // unique identifier
  name: string;  // user-friendly label, e.g. "Badge Chat"
  x: number;     // 0-1
  y: number;     // 0-1
  w: number;     // 0-1
  h: number;     // 0-1
};

export type RedThreshold = {
  rMin: number;
  gMax: number;
  bMax: number;
  minPixels: number;
  dominanceMin?: number;
  saturationMin?: number;
};

export type VisualAlertConfig = {
  enabled: boolean;
  rois: VisualAlertROI[];
  scanIntervalSec: number;
  confirmCount: number;
  cooldownSec: number;
  redThreshold: RedThreshold;
};

export type ScanResult = {
  scanned: boolean;
  redPixelCount: number;
};

/** Per-ROI hit detail within a MultiROIResult */
export type ROIHit = {
  roiId: string;
  roiName: string;
  redPixelCount: number;
  detected: boolean;
};

/** Result of scanning multiple ROIs on a single canvas */
export type MultiROIResult = {
  scanned: boolean;
  detected: boolean;
  totalRedPixelCount: number;
  hits: ROIHit[];
};

/* ── Constants ──────────────────────────────────────────────────── */

export const VISUAL_ALERT_STORAGE_KEY = 'visualAlertGlobalSettingsV1';

export const DEFAULT_VISUAL_ALERT_CONFIG: VisualAlertConfig = {
  enabled: false,
  rois: [],
  scanIntervalSec: 3,
  confirmCount: 2,
  cooldownSec: 60,
  redThreshold: {
    rMin: 180,
    gMax: 100,
    bMax: 100,
    minPixels: 12,
    dominanceMin: 45,
    saturationMin: 0.28,
  },
};

/* ── Helpers ─────────────────────────────────────────────────────── */

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function clamp01(value: unknown, min = 0): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(1, n));
}

function normalizeThreshold(raw: unknown): RedThreshold {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_VISUAL_ALERT_CONFIG.redThreshold };
  const o = raw as Record<string, unknown>;
  return {
    rMin: clampInt(o.rMin, 0, 255, 180),
    gMax: clampInt(o.gMax, 0, 255, 100),
    bMax: clampInt(o.bMax, 0, 255, 100),
    minPixels: clampInt(o.minPixels, 1, 10000, 12),
    dominanceMin: clampInt(o.dominanceMin, 0, 255, 45),
    saturationMin: clampNumber(o.saturationMin, 0, 1, 0.28),
  };
}

function hueFromRGB(r: number, g: number, b: number, max: number, delta: number): number {
  if (delta <= 0) return 0;
  let hue = 0;
  if (max === r) {
    hue = 60 * (((g - b) / delta) % 6);
  } else if (max === g) {
    hue = 60 * ((b - r) / delta + 2);
  } else {
    hue = 60 * ((r - g) / delta + 4);
  }
  return hue < 0 ? hue + 360 : hue;
}

function isRedPixel(r: number, g: number, b: number, threshold: RedThreshold): boolean {
  // Preserve the old strict rule for strong pure red pixels.
  if (r > threshold.rMin && g < threshold.gMax && b < threshold.bMax) {
    return true;
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (max <= 0 || delta <= 0 || max !== r) return false;

  const dominanceMin = threshold.dominanceMin ?? 45;
  const saturationMin = threshold.saturationMin ?? 0.28;
  const redDominance = r - Math.max(g, b);
  const saturation = delta / max;
  const hue = hueFromRGB(r, g, b, max, delta);
  const hueIsRed = hue <= 18 || hue >= 342;
  const brightEnough = r >= Math.max(120, threshold.rMin - 45);

  return brightEnough && hueIsRed && redDominance >= dominanceMin && saturation >= saturationMin;
}

/** Normalize a single ROI object (with id/name) */
function normalizeROI(raw: unknown, fallbackId: string, fallbackName: string): VisualAlertROI {
  if (!raw || typeof raw !== 'object') {
    return { id: fallbackId, name: fallbackName, x: 0, y: 0, w: 0.06, h: 0.04 };
  }
  const o = raw as Record<string, unknown>;
  return {
    id: typeof o.id === 'string' && o.id ? o.id : fallbackId,
    name: typeof o.name === 'string' && o.name ? o.name : fallbackName,
    x: clamp01(o.x),
    y: clamp01(o.y),
    w: clamp01(o.w, 0.01),
    h: clamp01(o.h, 0.01),
  };
}

/** Normalize an array of ROIs */
function normalizeROIs(raw: unknown): VisualAlertROI[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) =>
    normalizeROI(item, `roi-${i + 1}`, `Badge ${i + 1}`),
  );
}

/** Generate a unique ROI id */
export function generateROIId(): string {
  return `roi-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ── Persistence ────────────────────────────────────────────────── */

export function loadVisualAlertConfig(): VisualAlertConfig {
  try {
    const raw = localStorage.getItem(VISUAL_ALERT_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_VISUAL_ALERT_CONFIG };
    const parsed = JSON.parse(raw);

    // Migration: old single-ROI config had `roi` key instead of `rois`
    let rois: VisualAlertROI[];
    if (Array.isArray(parsed.rois)) {
      rois = normalizeROIs(parsed.rois);
    } else if (parsed.roi && typeof parsed.roi === 'object') {
      // Migrate old single ROI → rois array
      const oldRoi = parsed.roi as Record<string, unknown>;
      rois = [normalizeROI(oldRoi, 'roi-1', 'ROI 1')];
    } else {
      rois = [];
    }

    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : false,
      rois,
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
    const value = JSON.stringify(config);
    localStorage.setItem(VISUAL_ALERT_STORAGE_KEY, value);
    saveVisualAlertSettingToBackend(VISUAL_ALERT_STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

/* ── ROI Scanning ───────────────────────────────────────────────── */

/**
 * Scan a canvas region defined by a single ROI (0-1 ratios) and count red pixels.
 * Uses getImageData only on the ROI region — NOT full canvas.
 * Does NOT save any image to disk.
 * Kept for single-ROI test in the modal preview.
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
  for (let i = 0, len = data.length; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isRedPixel(r, g, b, threshold)) {
      redPixelCount++;
    }
  }

  return { scanned: true, redPixelCount };
}

/**
 * Scan multiple ROIs on a single canvas.
 * Each ROI is scanned independently via getImageData (small regions only).
 * Detection = ANY ROI has redPixelCount >= threshold.minPixels.
 * Does NOT read full canvas, does NOT save images.
 */
export function scanCanvasROIs(
  canvas: HTMLCanvasElement,
  rois: VisualAlertROI[],
  threshold: RedThreshold,
): MultiROIResult {
  const cw = canvas.width;
  const ch = canvas.height;
  if (cw === 0 || ch === 0 || rois.length === 0) {
    return { scanned: false, detected: false, totalRedPixelCount: 0, hits: [] };
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { scanned: false, detected: false, totalRedPixelCount: 0, hits: [] };
  }

  let totalRedPixelCount = 0;
  let detected = false;
  const hits: ROIHit[] = [];

  for (const roi of rois) {
    const px = Math.max(0, Math.floor(roi.x * cw));
    const py = Math.max(0, Math.floor(roi.y * ch));
    const pw = Math.max(1, Math.min(Math.ceil(roi.w * cw), cw - px));
    const ph = Math.max(1, Math.min(Math.ceil(roi.h * ch), ch - py));

    let roiRedCount = 0;
    try {
      const imageData = ctx.getImageData(px, py, pw, ph);
      const data = imageData.data;
      for (let i = 0, len = data.length; i < len; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (isRedPixel(r, g, b, threshold)) {
          roiRedCount++;
        }
      }
    } catch {
      // Skip this ROI if getImageData fails
    }

    const roiDetected = roiRedCount >= threshold.minPixels;
    if (roiDetected) detected = true;
    totalRedPixelCount += roiRedCount;

    hits.push({
      roiId: roi.id,
      roiName: roi.name,
      redPixelCount: roiRedCount,
      detected: roiDetected,
    });
  }

  return { scanned: true, detected, totalRedPixelCount, hits };
}

/* ── Audio Alert ────────────────────────────────────────────────── */

/**
 * Play the default alert sound (notification_new.mp3).
 */
export function playAlertSound(): void {
  try {
    const audio = new Audio('/audio/notification_new.mp3');
    audio.play().catch(err => {
      console.warn('Failed to play alert sound:', err);
    });
  } catch (err) {
    console.warn('Failed to initialize Audio player:', err);
  }
}

/* ── Desktop / Toast Notification ───────────────────────────────── */

/**
 * Show a notification when red dot detected.
 * Includes ROI name(s) that triggered the alert.
 */
export function showAlertNotification(udid: string, deviceNumber: number, roiNames?: string[]): void {
  const roiSuffix = roiNames?.length ? `: ${roiNames.slice(0, 2).join(', ')}` : '';
  const body = `Máy ${String(deviceNumber).padStart(2, '0')} phát hiện chấm đỏ${roiSuffix}`;
  const title = 'Visual Alert';

  // Try browser Notification API
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/favicon.ico', tag: `va-${deviceNumber}` });
    } catch {
      /* fallback below */
    }
  }

  // Always dispatch a custom event so the React app can pick it up
  window.dispatchEvent(
    new CustomEvent('visualAlertDetected', {
      detail: { udid, deviceNumber, message: body, timestamp: Date.now() },
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
