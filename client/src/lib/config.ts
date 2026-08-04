export const SCRCPY_WS_PORT_ON_DEVICE = 8886;

export const COMMON_PARAMS = {
  action: 'proxy-adb',
  remote: `tcp:${SCRCPY_WS_PORT_ON_DEVICE}`,
};

export type StreamConfig = {
  bitrate: number;
  maxFps: number;
  iFrameInterval: number;
  bounds: { width: number; height: number };
  sendFrameMeta: boolean;
  displayId: number;
  codecOptions?: string;
  encoderName?: string;
  engine?: 'tango-scrcpy';
  encoderMode?: 'auto' | 'hardware' | 'software' | 'custom';
};

export const STREAM_CONFIG: StreamConfig = {
  bitrate: 786432,
  maxFps: 15,
  iFrameInterval: 5,
  bounds: { width: 500, height: 500 },
  sendFrameMeta: false,
  displayId: 0,
  engine: 'tango-scrcpy',
  encoderMode: 'auto',
};

export function normalizeEncoderConfig(cfg: StreamConfig): StreamConfig {
  const rawMode = cfg.encoderMode;
  const encoderMode =
    rawMode === 'hardware' || rawMode === 'software' || rawMode === 'custom'
      ? rawMode
      : 'auto';
  return {
    ...cfg,
    engine: 'tango-scrcpy',
    encoderMode,
    encoderName: encoderMode === 'custom' ? cfg.encoderName : undefined,
  };
}

export function readStoredStreamConfig(key: string, fallback: StreamConfig): StreamConfig {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return normalizeEncoderConfig(fallback);
    const parsed = JSON.parse(saved);
    if (
      parsed &&
      typeof parsed.bitrate === 'number' &&
      typeof parsed.maxFps === 'number' &&
      typeof parsed.bounds?.width === 'number' &&
      typeof parsed.bounds?.height === 'number'
    ) {
      return normalizeEncoderConfig({
        ...fallback,
        ...parsed,
        bounds: { ...fallback.bounds, ...parsed.bounds },
      });
    }
  } catch {}
  return normalizeEncoderConfig(fallback);
}
