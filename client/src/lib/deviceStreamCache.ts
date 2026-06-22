import type { StreamConfig } from './config';
import type { GoogDeviceDescriptor } from './serverApi';

export interface DeviceStreamCacheEntry {
  workingEncoder?: string;
  workingWidth?: number;
  workingHeight?: number;
  workingFps?: number;
  workingBitrate?: number;
}

const CACHE_KEY = 'monviewphone:device-stream-cache';

export function loadDeviceStreamCache(): Record<string, DeviceStreamCacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveDeviceStreamCache(cache: Record<string, DeviceStreamCacheEntry>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

export function getCachedDeviceStream(udid: string): DeviceStreamCacheEntry | undefined {
  return loadDeviceStreamCache()[udid];
}

export function cacheSuccessfulStream(udid: string, entry: DeviceStreamCacheEntry) {
  const cache = loadDeviceStreamCache();
  cache[udid] = entry;
  saveDeviceStreamCache(cache);
}

export function clearDeviceStreamCache(udid: string) {
  const cache = loadDeviceStreamCache();
  delete cache[udid];
  saveDeviceStreamCache(cache);
}

export function getHardwareEncodersForDevice(meta?: GoogDeviceDescriptor): string[] {
  const manufacturer = (meta?.['ro.product.manufacturer'] || '').toLowerCase();
  const board = (meta?.['ro.product.board'] || '').toLowerCase();
  const platform = (meta?.['ro.board.platform'] || '').toLowerCase();

  const candidates: string[] = [];

  const isQualcomm = platform.includes('qcom') || platform.includes('msm') || platform.includes('sdm') || platform.includes('sm') || board.includes('qcom') || manufacturer.includes('qualcomm');
  const isSamsung = manufacturer.includes('samsung') || platform.includes('exynos') || board.includes('universal') || board.includes('exynos');
  const isMTK = platform.includes('mt') || board.includes('mt') || manufacturer.includes('mediatek');

  if (isQualcomm) {
    candidates.push('OMX.qcom.video.encoder.avc', 'c2.qti.avc.encoder');
  }
  if (isSamsung) {
    candidates.push('OMX.Exynos.AVC.Encoder', 'c2.exynos.h264.encoder');
  }
  if (isMTK) {
    candidates.push('OMX.MTK.VIDEO.ENCODER.AVC', 'c2.mtk.avc.encoder');
  }

  // Common order list as general candidates
  const allHardware = [
    'OMX.qcom.video.encoder.avc',
    'c2.qti.avc.encoder',
    'OMX.Exynos.AVC.Encoder',
    'c2.exynos.h264.encoder',
    'OMX.MTK.VIDEO.ENCODER.AVC',
    'c2.mtk.avc.encoder'
  ];

  for (const c of allHardware) {
    if (!candidates.includes(c)) {
      candidates.push(c);
    }
  }

  return candidates;
}

export const SOFTWARE_ENCODERS = [
  'OMX.google.h264.encoder',
  'c2.android.avc.encoder'
];

export interface FallbackStage {
  encoderName?: string;
  bitrate?: number;
  maxFps?: number;
  bounds?: { width: number; height: number };
  description: string;
}

export function getFallbackStages(
  baseConfig: StreamConfig,
  meta?: GoogDeviceDescriptor
): FallbackStage[] {
  const mode = baseConfig.encoderMode || 'auto';
  
  if (mode === 'custom') {
    return [{
      encoderName: baseConfig.encoderName,
      description: `Custom: ${baseConfig.encoderName || 'default'}`
    }];
  }

  if (mode === 'software') {
    return SOFTWARE_ENCODERS.map(enc => ({
      encoderName: enc,
      description: `Software: ${enc}`
    }));
  }

  const hwEncoders = getHardwareEncodersForDevice(meta);

  if (mode === 'hardware') {
    return hwEncoders.map(enc => ({
      encoderName: enc,
      description: `Hardware: ${enc}`
    }));
  }

  // mode === 'auto'
  const stages: FallbackStage[] = [];

  // Stage 0: default/auto (let Android decide) at base config settings
  stages.push({
    encoderName: undefined,
    description: 'Auto (Default Android encoder)'
  });

  // Stages 1..N: Try known hardware encoders at base config settings
  for (const enc of hwEncoders) {
    stages.push({
      encoderName: enc,
      description: `Hardware Candidate: ${enc}`
    });
  }

  // Downgrade 1: 720p / 15fps / 1M using default/hardware
  stages.push({
    encoderName: undefined,
    bounds: { width: 720, height: 1280 },
    maxFps: 15,
    bitrate: 1024 * 1024,
    description: 'Downgrade: 720p / 15fps / 1M (Auto encoder)'
  });

  for (const enc of hwEncoders) {
    stages.push({
      encoderName: enc,
      bounds: { width: 720, height: 1280 },
      maxFps: 15,
      bitrate: 1024 * 1024,
      description: `Downgrade: 720p / 15fps / 1M (Hardware: ${enc})`
    });
  }

  // Downgrade 2: 480p / 10fps / 600K using default/hardware
  stages.push({
    encoderName: undefined,
    bounds: { width: 480, height: 854 },
    maxFps: 10,
    bitrate: 600 * 1024,
    description: 'Downgrade: 480p / 10fps / 600K (Auto encoder)'
  });

  for (const enc of hwEncoders) {
    stages.push({
      encoderName: enc,
      bounds: { width: 480, height: 854 },
      maxFps: 10,
      bitrate: 600 * 1024,
      description: `Downgrade: 480p / 10fps / 600K (Hardware: ${enc})`
    });
  }

  // Software fallbacks
  for (const enc of SOFTWARE_ENCODERS) {
    stages.push({
      encoderName: enc,
      description: `Software Fallback: ${enc}`
    });
  }

  return stages;
}
