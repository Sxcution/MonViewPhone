export interface VideoFrameRenderer {
  draw(frame: VideoFrame): void;
  clear(): void;
  close(): void;
  maxFps: number;
}
