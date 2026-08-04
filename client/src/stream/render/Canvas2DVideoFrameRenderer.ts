import type { VideoFrameRenderer } from './VideoFrameRenderer';

export class Canvas2DVideoFrameRenderer implements VideoFrameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private pendingFrame: VideoFrame | null = null;
  private pendingOnPresented: (() => void) | null = null;
  private pendingOnError: ((error: unknown) => void) | null = null;
  private drawRequest: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
  }

  draw(
    frame: VideoFrame,
    onPresented?: () => void,
    onError?: (error: unknown) => void,
  ) {
    if (!this.ctx) {
      frame.close();
      return;
    }

    // Latest frame wins: drawing stale frames only extends stream latency.
    this.pendingFrame?.close();
    this.pendingFrame = frame;
    this.pendingOnPresented = onPresented ?? null;
    this.pendingOnError = onError ?? null;
    this.drawRequest ??= requestAnimationFrame(() => this.presentPendingFrame());
  }

  private presentPendingFrame() {
    this.drawRequest = null;
    const frame = this.pendingFrame;
    const onPresented = this.pendingOnPresented;
    const onError = this.pendingOnError;
    this.pendingFrame = null;
    this.pendingOnPresented = null;
    this.pendingOnError = null;
    if (!frame) return;

    let presented = false;
    try {
      if (!this.ctx) return;
      if (this.canvas.width !== frame.displayWidth || this.canvas.height !== frame.displayHeight) {
        this.canvas.width = frame.displayWidth;
        this.canvas.height = frame.displayHeight;
      }
      this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
      presented = true;
    } catch (error) {
      onError?.(error);
    } finally {
      frame.close();
    }

    if (presented) onPresented?.();
  }

  discardPending() {
    if (this.drawRequest !== null) cancelAnimationFrame(this.drawRequest);
    this.drawRequest = null;
    this.pendingFrame?.close();
    this.pendingFrame = null;
    this.pendingOnPresented = null;
    this.pendingOnError = null;
  }

  clear() {
    this.discardPending();
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  close() {
    this.discardPending();
    this.ctx = null;
  }
}
