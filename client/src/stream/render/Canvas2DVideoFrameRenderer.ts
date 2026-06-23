import { VideoFrameRenderer } from './VideoFrameRenderer';

export class Canvas2DVideoFrameRenderer implements VideoFrameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private lastDrawTime = 0;
  public maxFps: number;

  constructor(canvas: HTMLCanvasElement, maxFps: number = 15) {
    this.canvas = canvas;
    this.maxFps = maxFps;
    this.ctx = canvas.getContext('2d', { alpha: false });
  }

  draw(frame: VideoFrame) {
    if (!this.ctx) return;
    
    // Auto-update canvas width/height to match decoded video frames
    if (this.canvas.width !== frame.displayWidth || this.canvas.height !== frame.displayHeight) {
      this.canvas.width = frame.displayWidth;
      this.canvas.height = frame.displayHeight;
    }
    
    this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
  }

  clear() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  close() {
    this.ctx = null;
  }
}
