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
  engine?: 'auto' | 'webcodecs' | 'legacy-tinyh264';
  encoderMode?: 'auto' | 'hardware' | 'software' | 'custom';
};

export const STREAM_CONFIG: StreamConfig = {
  bitrate: 393216, // 384 KB/s-ish, nhẹ hơn cho grid
  maxFps: 12,
  iFrameInterval: 5,
  bounds: { width: 360, height: 360 },
  sendFrameMeta: false,
  displayId: 0,
  encoderName: 'OMX.google.h264.encoder',
  engine: 'auto',
  encoderMode: 'auto',
};

export type StreamMode = 'ws6' | 'raw-v2';

export const STREAM_MODE: StreamMode = 'raw-v2';
