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

export type VisualAlertDetectionMode = 'red-dot' | 'wechat-status';

export type VisualAlertROI = {
  id: string;    // unique identifier
  name: string;  // user-friendly label, e.g. "Badge Chat"
  x: number;     // 0-1
  y: number;     // 0-1
  w: number;     // 0-1
  h: number;     // 0-1
  detectionMode?: VisualAlertDetectionMode;
};

export type RedThreshold = {
  rMin: number;
  gMax: number;
  bMax: number;
  minPixels: number;
  dominanceMin?: number;
  saturationMin?: number;
};

export type WeChatStatusConfig = {
  minScore: number;
  whiteThreshold: number;
  minWhitePixels: number;
  adbVerify: boolean;
  adbCooldownSec: number;
};

export type VisualAlertConfig = {
  enabled: boolean;
  detectionMode: VisualAlertDetectionMode;
  rois: VisualAlertROI[];
  scanIntervalSec: number;
  confirmCount: number;
  cooldownSec: number;
  redThreshold: RedThreshold;
  wechatStatus: WeChatStatusConfig;
};

export type ScanResult = {
  scanned: boolean;
  redPixelCount: number;
};

/** Per-ROI hit detail within a MultiROIResult */
export type ROIHit = {
  roiId: string;
  roiName: string;
  detectionMode?: VisualAlertDetectionMode;
  redPixelCount: number;
  whitePixelCount?: number;
  foregroundPixelCount?: number;
  matchScore?: number;
  metricLabel?: string;
  polarity?: 'light' | 'dark';
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
  detectionMode: 'red-dot',
  rois: [],
  scanIntervalSec: 3,
  confirmCount: 2,
  cooldownSec: 60,
  redThreshold: {
    rMin: 180,
    gMax: 100,
    bMax: 100,
    minPixels: 6,
    dominanceMin: 45,
    saturationMin: 0.28,
  },
  wechatStatus: {
    minScore: 0.62,
    whiteThreshold: 176,
    minWhitePixels: 24,
    adbVerify: false,
    adbCooldownSec: 20,
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
    minPixels: clampInt(o.minPixels, 1, 10000, DEFAULT_VISUAL_ALERT_CONFIG.redThreshold.minPixels),
    dominanceMin: clampInt(o.dominanceMin, 0, 255, 45),
    saturationMin: clampNumber(o.saturationMin, 0, 1, 0.28),
  };
}

function normalizeDetectionMode(raw: unknown): VisualAlertDetectionMode {
  return raw === 'wechat-status' ? 'wechat-status' : 'red-dot';
}

function inferROIDetectionMode(name: string, fallbackMode: VisualAlertDetectionMode): VisualAlertDetectionMode {
  const lower = name.toLowerCase();
  if (lower.includes('wechat') || lower.includes('we chat')) return 'wechat-status';
  if (lower.includes('message') || lower.includes('nearby') || lower.includes('badge')) return 'red-dot';
  return fallbackMode;
}

function normalizeROIDetectionMode(
  rawMode: unknown,
  name: string,
  fallbackMode: VisualAlertDetectionMode,
): VisualAlertDetectionMode {
  if (rawMode === 'wechat-status' || rawMode === 'red-dot') return rawMode;
  return inferROIDetectionMode(name, fallbackMode);
}

function normalizeWeChatStatus(raw: unknown): WeChatStatusConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_VISUAL_ALERT_CONFIG.wechatStatus };
  const o = raw as Record<string, unknown>;
  return {
    minScore: clampNumber(o.minScore, 0.35, 0.95, DEFAULT_VISUAL_ALERT_CONFIG.wechatStatus.minScore),
    whiteThreshold: clampInt(o.whiteThreshold, 80, 255, DEFAULT_VISUAL_ALERT_CONFIG.wechatStatus.whiteThreshold),
    minWhitePixels: clampInt(o.minWhitePixels, 1, 10000, DEFAULT_VISUAL_ALERT_CONFIG.wechatStatus.minWhitePixels),
    adbVerify: typeof o.adbVerify === 'boolean' ? o.adbVerify : DEFAULT_VISUAL_ALERT_CONFIG.wechatStatus.adbVerify,
    adbCooldownSec: clampInt(o.adbCooldownSec, 5, 300, DEFAULT_VISUAL_ALERT_CONFIG.wechatStatus.adbCooldownSec),
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
  const passesBaseRed = r >= threshold.rMin && hueIsRed && redDominance >= dominanceMin && saturation >= saturationMin;
  const capSlack = 32;
  const passesSoftCaps = g <= threshold.gMax + capSlack && b <= threshold.bMax + capSlack;
  const isStrongRed = redDominance >= Math.max(80, dominanceMin + 25) && saturation >= Math.max(0.45, saturationMin);

  return passesBaseRed && (passesSoftCaps || isStrongRed);
}

/** Normalize a single ROI object (with id/name) */
function normalizeROI(
  raw: unknown,
  fallbackId: string,
  fallbackName: string,
  fallbackMode: VisualAlertDetectionMode,
): VisualAlertROI {
  if (!raw || typeof raw !== 'object') {
    return { id: fallbackId, name: fallbackName, x: 0, y: 0, w: 0.06, h: 0.04, detectionMode: fallbackMode };
  }
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === 'string' && o.name ? o.name : fallbackName;
  return {
    id: typeof o.id === 'string' && o.id ? o.id : fallbackId,
    name,
    x: clamp01(o.x),
    y: clamp01(o.y),
    w: clamp01(o.w, 0.01),
    h: clamp01(o.h, 0.01),
    detectionMode: normalizeROIDetectionMode(o.detectionMode, name, fallbackMode),
  };
}

/** Normalize an array of ROIs */
function normalizeROIs(raw: unknown, fallbackMode: VisualAlertDetectionMode): VisualAlertROI[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) =>
    normalizeROI(item, `roi-${i + 1}`, `Badge ${i + 1}`, fallbackMode),
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
    const detectionMode = normalizeDetectionMode(parsed.detectionMode);

    // Migration: old single-ROI config had `roi` key instead of `rois`
    let rois: VisualAlertROI[];
    if (Array.isArray(parsed.rois)) {
      rois = normalizeROIs(parsed.rois, detectionMode);
    } else if (parsed.roi && typeof parsed.roi === 'object') {
      // Migrate old single ROI → rois array
      const oldRoi = parsed.roi as Record<string, unknown>;
      rois = [normalizeROI(oldRoi, 'roi-1', 'ROI 1', detectionMode)];
    } else {
      rois = [];
    }

    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : false,
      detectionMode,
      rois,
      scanIntervalSec: clampInt(parsed.scanIntervalSec, 1, 30, 3),
      confirmCount: clampInt(parsed.confirmCount, 1, 10, 2),
      cooldownSec: clampInt(parsed.cooldownSec, 10, 600, 60),
      redThreshold: normalizeThreshold(parsed.redThreshold),
      wechatStatus: normalizeWeChatStatus(parsed.wechatStatus),
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
      detectionMode: 'red-dot',
      redPixelCount: roiRedCount,
      detected: roiDetected,
    });
  }

  return { scanned: true, detected, totalRedPixelCount, hits };
}

/* -- WeChat Status Icon Scanning -- */

type StatusIconPolarity = 'light' | 'dark';

function isStatusForegroundPixel(
  r: number,
  g: number,
  b: number,
  threshold: number,
  polarity: StatusIconPolarity,
): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const neutralEnough = max - min <= 72;
  if (!neutralEnough) return false;
  return polarity === 'light' ? min >= threshold : max <= 255 - threshold;
}

const WECHAT_TEMPLATE_W = 28;
const WECHAT_TEMPLATE_H = 20;

function wechatTemplateAt(tx: number, ty: number): -1 | 0 | 1 {
  const x = (tx + 0.5) / WECHAT_TEMPLATE_W;
  const y = (ty + 0.5) / WECHAT_TEMPLATE_H;

  const bubbleA = Math.pow((x - 0.39) / 0.29, 2) + Math.pow((y - 0.48) / 0.34, 2) <= 1;
  const bubbleB = Math.pow((x - 0.63) / 0.25, 2) + Math.pow((y - 0.38) / 0.27, 2) <= 1;
  const tailA = x >= 0.49 && x <= 0.66 && y >= 0.67 && y <= 0.88 && y >= 1.15 - x;
  const tailB = x >= 0.70 && x <= 0.86 && y >= 0.55 && y <= 0.76 && y >= 1.22 - x;

  const eyeA1 = Math.pow((x - 0.31) / 0.045, 2) + Math.pow((y - 0.46) / 0.055, 2) <= 1;
  const eyeA2 = Math.pow((x - 0.45) / 0.045, 2) + Math.pow((y - 0.46) / 0.055, 2) <= 1;
  const eyeB1 = Math.pow((x - 0.56) / 0.04, 2) + Math.pow((y - 0.36) / 0.05, 2) <= 1;
  const eyeB2 = Math.pow((x - 0.68) / 0.04, 2) + Math.pow((y - 0.36) / 0.05, 2) <= 1;

  if (eyeA1 || eyeA2 || eyeB1 || eyeB2) return -1;
  if (bubbleA || bubbleB || tailA || tailB) return 1;
  if (x < 0.08 || x > 0.93 || y < 0.06 || y > 0.94) return -1;
  return 0;
}

function wechatBubbleRegionAt(tx: number, ty: number): 'left' | 'right' | null {
  const x = (tx + 0.5) / WECHAT_TEMPLATE_W;
  const y = (ty + 0.5) / WECHAT_TEMPLATE_H;
  const leftCore = Math.pow((x - 0.39) / 0.24, 2) + Math.pow((y - 0.48) / 0.29, 2) <= 1;
  const rightCore = Math.pow((x - 0.63) / 0.20, 2) + Math.pow((y - 0.38) / 0.22, 2) <= 1;
  if (leftCore) return 'left';
  if (rightCore) return 'right';
  return null;
}

function wechatTailRegionAt(tx: number, ty: number): 'left' | 'right' | null {
  const x = (tx + 0.5) / WECHAT_TEMPLATE_W;
  const y = (ty + 0.5) / WECHAT_TEMPLATE_H;
  const leftTail = x >= 0.49 && x <= 0.66 && y >= 0.67 && y <= 0.88 && y >= 1.15 - x;
  const rightTail = x >= 0.70 && x <= 0.86 && y >= 0.55 && y <= 0.76 && y >= 1.22 - x;
  if (leftTail) return 'left';
  if (rightTail) return 'right';
  return null;
}

function wechatEyeRegionAt(tx: number, ty: number): 'left' | 'right' | null {
  const x = (tx + 0.5) / WECHAT_TEMPLATE_W;
  const y = (ty + 0.5) / WECHAT_TEMPLATE_H;
  const leftEye =
    Math.pow((x - 0.31) / 0.045, 2) + Math.pow((y - 0.46) / 0.055, 2) <= 1 ||
    Math.pow((x - 0.45) / 0.045, 2) + Math.pow((y - 0.46) / 0.055, 2) <= 1;
  const rightEye =
    Math.pow((x - 0.56) / 0.04, 2) + Math.pow((y - 0.36) / 0.05, 2) <= 1 ||
    Math.pow((x - 0.68) / 0.04, 2) + Math.pow((y - 0.36) / 0.05, 2) <= 1;
  if (leftEye) return 'left';
  if (rightEye) return 'right';
  return null;
}

function countForegroundPixels(data: Uint8ClampedArray, threshold: number, polarity: StatusIconPolarity): number {
  let count = 0;
  for (let i = 0, len = data.length; i < len; i += 4) {
    if (isStatusForegroundPixel(data[i], data[i + 1], data[i + 2], threshold, polarity)) count++;
  }
  return count;
}

function sampleCandidateForeground(
  data: Uint8ClampedArray,
  imageW: number,
  imageH: number,
  x: number,
  y: number,
  w: number,
  h: number,
  tx: number,
  ty: number,
  threshold: number,
  polarity: StatusIconPolarity,
): boolean {
  const sx = Math.max(0, Math.min(imageW - 1, x + Math.floor(((tx + 0.5) * w) / WECHAT_TEMPLATE_W)));
  const sy = Math.max(0, Math.min(imageH - 1, y + Math.floor(((ty + 0.5) * h) / WECHAT_TEMPLATE_H)));
  const idx = (sy * imageW + sx) * 4;
  return isStatusForegroundPixel(data[idx], data[idx + 1], data[idx + 2], threshold, polarity);
}

function scoreWeChatCandidate(
  data: Uint8ClampedArray,
  imageW: number,
  imageH: number,
  x: number,
  y: number,
  w: number,
  h: number,
  threshold: number,
  polarity: StatusIconPolarity,
): { score: number; foregroundPixelCount: number } {
  let expectedForeground = 0;
  let expectedBackground = 0;
  let foregroundHits = 0;
  let backgroundHits = 0;
  let sampledForeground = 0;
  let leftExpected = 0;
  let rightExpected = 0;
  let leftHits = 0;
  let rightHits = 0;
  let tailExpected = 0;
  let tailHits = 0;
  let eyeExpected = 0;
  let eyeBackgroundHits = 0;

  for (let ty = 0; ty < WECHAT_TEMPLATE_H; ty++) {
    for (let tx = 0; tx < WECHAT_TEMPLATE_W; tx++) {
      const expected = wechatTemplateAt(tx, ty);
      if (expected === 0) continue;
      const isForeground = sampleCandidateForeground(data, imageW, imageH, x, y, w, h, tx, ty, threshold, polarity);
      if (isForeground) sampledForeground++;
      if (expected === 1) {
        expectedForeground++;
        if (isForeground) foregroundHits++;
        const region = wechatBubbleRegionAt(tx, ty);
        if (region === 'left') {
          leftExpected++;
          if (isForeground) leftHits++;
        } else if (region === 'right') {
          rightExpected++;
          if (isForeground) rightHits++;
        }
        if (wechatTailRegionAt(tx, ty)) {
          tailExpected++;
          if (isForeground) tailHits++;
        }
      } else {
        expectedBackground++;
        if (!isForeground) backgroundHits++;
        if (wechatEyeRegionAt(tx, ty)) {
          eyeExpected++;
          if (!isForeground) eyeBackgroundHits++;
        }
      }
    }
  }

  const foregroundScore = expectedForeground > 0 ? foregroundHits / expectedForeground : 0;
  const backgroundScore = expectedBackground > 0 ? backgroundHits / expectedBackground : 0;
  const leftScore = leftExpected > 0 ? leftHits / leftExpected : 0;
  const rightScore = rightExpected > 0 ? rightHits / rightExpected : 0;
  const tailScore = tailExpected > 0 ? tailHits / tailExpected : 0;
  const eyeScore = eyeExpected > 0 ? eyeBackgroundHits / eyeExpected : 0;
  const lobeBalance = Math.min(leftHits, rightHits) / Math.max(1, Math.max(leftHits, rightHits));
  const density = sampledForeground / Math.max(1, expectedForeground + expectedBackground);
  let score = foregroundScore * 0.72 + backgroundScore * 0.28;

  if (density < 0.28 || density > 0.72) score *= 0.62;
  if (foregroundScore < 0.58) score *= 0.55;
  if (leftScore < 0.56 || rightScore < 0.56 || lobeBalance < 0.42) score *= 0.22;
  if (tailScore < 0.36) score *= 0.38;
  if (eyeExpected > 0 && eyeScore < 0.50) score *= 0.72;

  return { score, foregroundPixelCount: sampledForeground };
}

function findBestWeChatStatusMatch(
  imageData: ImageData,
  config: WeChatStatusConfig,
): { score: number; foregroundPixelCount: number; polarity: StatusIconPolarity } {
  const pw = imageData.width;
  const ph = imageData.height;
  if (pw < 8 || ph < 8) return { score: 0, foregroundPixelCount: 0, polarity: 'light' };

  const data = imageData.data;
  let best: { score: number; foregroundPixelCount: number; polarity: StatusIconPolarity } = {
    score: 0,
    foregroundPixelCount: 0,
    polarity: 'light',
  };
  let bestForegroundInROI = 0;
  const minH = Math.max(8, Math.floor(ph * 0.32));
  const maxH = Math.max(minH, Math.min(ph, Math.ceil(ph * 0.92)));
  const heightStep = Math.max(2, Math.floor(ph / 14));
  const aspects = [1.28, 1.45, 1.62, 1.78];

  for (const polarity of ['light', 'dark'] as const) {
    const foregroundInROI = countForegroundPixels(data, config.whiteThreshold, polarity);
    if (foregroundInROI > bestForegroundInROI) bestForegroundInROI = foregroundInROI;
    if (foregroundInROI < config.minWhitePixels) continue;

    for (let h = minH; h <= maxH; h += heightStep) {
      for (const aspect of aspects) {
        const w = Math.max(8, Math.round(h * aspect));
        if (w > pw) continue;
        const stepX = Math.max(1, Math.floor(w / 7));
        const stepY = Math.max(1, Math.floor(h / 7));
        for (let y = 0; y <= ph - h; y += stepY) {
          for (let x = 0; x <= pw - w; x += stepX) {
            const candidate = scoreWeChatCandidate(data, pw, ph, x, y, w, h, config.whiteThreshold, polarity);
            if (candidate.score > best.score) {
              best = { ...candidate, polarity };
            }
          }
        }
      }
    }
  }

  return best.score > 0 ? best : { score: 0, foregroundPixelCount: bestForegroundInROI, polarity: 'light' };
}

function getWeChatStatusScanRect(
  roi: VisualAlertROI,
  px: number,
  py: number,
  pw: number,
  ph: number,
  canvasW: number,
): { px: number; py: number; pw: number; ph: number } {
  const isTopLeftStatusBar = roi.y <= 0.14 && roi.x <= 0.34;
  if (!isTopLeftStatusBar) {
    return { px, py, pw, ph };
  }

  // On dark status bars the white clock digits can look like tiny chat bubbles.
  // Only scan the notification-icon area to the right of the clock.
  const iconAreaMinX = Math.floor(canvasW * 0.17);
  const nextPx = Math.max(px, iconAreaMinX);
  const nextPw = Math.max(1, px + pw - nextPx);
  return { px: nextPx, py, pw: nextPw, ph };
}

export function scanCanvasWeChatStatusROIs(
  canvas: HTMLCanvasElement,
  rois: VisualAlertROI[],
  config: WeChatStatusConfig,
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

  let totalWhitePixelCount = 0;
  let detected = false;
  const hits: ROIHit[] = [];

  for (const roi of rois) {
    const px = Math.max(0, Math.floor(roi.x * cw));
    const py = Math.max(0, Math.floor(roi.y * ch));
    const pw = Math.max(1, Math.min(Math.ceil(roi.w * cw), cw - px));
    const ph = Math.max(1, Math.min(Math.ceil(roi.h * ch), ch - py));
    const scanRect = getWeChatStatusScanRect(roi, px, py, pw, ph, cw);

    let score = 0;
    let foregroundPixelCount = 0;
    let polarity: StatusIconPolarity = 'light';
    try {
      const imageData = ctx.getImageData(scanRect.px, scanRect.py, scanRect.pw, scanRect.ph);
      const match = findBestWeChatStatusMatch(imageData, config);
      score = match.score;
      foregroundPixelCount = match.foregroundPixelCount;
      polarity = match.polarity;
    } catch {
      // Skip this ROI if getImageData fails.
    }

    const roiDetected = score >= config.minScore && foregroundPixelCount >= config.minWhitePixels;
    if (roiDetected) detected = true;
    totalWhitePixelCount += foregroundPixelCount;

    hits.push({
      roiId: roi.id,
      roiName: roi.name,
      detectionMode: 'wechat-status',
      redPixelCount: foregroundPixelCount,
      whitePixelCount: foregroundPixelCount,
      foregroundPixelCount,
      matchScore: score,
      metricLabel: 'score',
      polarity,
      detected: roiDetected,
    });
  }

  return { scanned: true, detected, totalRedPixelCount: totalWhitePixelCount, hits };
}

function getROIDetectionMode(roi: VisualAlertROI, fallbackMode: VisualAlertDetectionMode): VisualAlertDetectionMode {
  if (roi.detectionMode === 'wechat-status' || roi.detectionMode === 'red-dot') return roi.detectionMode;
  return inferROIDetectionMode(roi.name, fallbackMode);
}

export function scanCanvasVisualAlert(
  canvas: HTMLCanvasElement,
  config: VisualAlertConfig,
): MultiROIResult {
  const redROIs = config.rois.filter(roi => getROIDetectionMode(roi, config.detectionMode) === 'red-dot');
  const wechatROIs = config.rois.filter(roi => getROIDetectionMode(roi, config.detectionMode) === 'wechat-status');
  if (!redROIs.length && !wechatROIs.length) {
    return { scanned: false, detected: false, totalRedPixelCount: 0, hits: [] };
  }

  const hitById = new Map<string, ROIHit>();
  let scanned = false;
  let detected = false;
  let totalRedPixelCount = 0;

  if (redROIs.length) {
    const redResult = scanCanvasROIs(canvas, redROIs, config.redThreshold);
    scanned = scanned || redResult.scanned;
    detected = detected || redResult.detected;
    totalRedPixelCount += redResult.totalRedPixelCount;
    redResult.hits.forEach(hit => hitById.set(hit.roiId, hit));
  }

  if (wechatROIs.length) {
    const wechatResult = scanCanvasWeChatStatusROIs(canvas, wechatROIs, config.wechatStatus);
    scanned = scanned || wechatResult.scanned;
    detected = detected || wechatResult.detected;
    totalRedPixelCount += wechatResult.totalRedPixelCount;
    wechatResult.hits.forEach(hit => hitById.set(hit.roiId, hit));
  }

  const hits = config.rois
    .map(roi => hitById.get(roi.id))
    .filter((hit): hit is ROIHit => Boolean(hit));

  return { scanned, detected, totalRedPixelCount, hits };
}

/* -- Audio Alert -- */

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
export function showAlertNotification(
  udid: string,
  deviceNumber: number,
  roiNames?: string[],
  alertLabel = 'chấm đỏ',
): void {
  const roiSuffix = roiNames?.length ? `: ${roiNames.slice(0, 2).join(', ')}` : '';
  const body = `Máy ${String(deviceNumber).padStart(2, '0')} phát hiện ${alertLabel}${roiSuffix}`;
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
      detail: {
        udid,
        deviceNumber,
        message: body,
        roiNames: roiNames ?? [],
        alertLabel,
        timestamp: Date.now(),
      },
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
