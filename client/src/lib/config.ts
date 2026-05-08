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
};

export const STREAM_CONFIG: StreamConfig = {
  bitrate: 524288, //max 8388608
  maxFps: 25, // max 60
  iFrameInterval: 5,
  bounds: { width: 500, height: 500 },
  sendFrameMeta: false,
  displayId: 0,
  encoderName: 'OMX.google.h264.encoder',
};
