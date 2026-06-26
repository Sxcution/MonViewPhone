export interface StreamStats {
  engineName: string;
  decoderName?: string;
  decodedFps: number;
  renderedFps: number;
  droppedFrames: number;
  decodeQueueSize: number;
  reconnectCount: number;
  width: number;
  height: number;
  encoderName?: string;
  fallbackReason?: string;
}

export interface StreamCallbacks {
  onFirstFrame?: (meta: { width: number; height: number }) => void;
  onFrame?: () => void;
  onError?: (err: any) => void;
  onFatalError?: (err: any) => void;
  onFallbackRequested?: (reason: string) => void;
}

export interface StreamEngine {
  start(): void;
  stop(): void;
  feedBytes(data: Uint8Array): void;
  isReady(): boolean;
  getStats(): StreamStats;
}
