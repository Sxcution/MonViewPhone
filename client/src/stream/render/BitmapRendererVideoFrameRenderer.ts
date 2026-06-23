import { VideoFrameRenderer } from './VideoFrameRenderer';

export class BitmapRendererVideoFrameRenderer implements VideoFrameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: ImageBitmapRenderingContext | null;
  private closed = false;
  private lastDrawTime = 0;
  public maxFps: number;

  constructor(canvas: HTMLCanvasElement, maxFps: number = 15) {
    this.canvas = canvas;
    this.maxFps = maxFps;
    this.ctx = canvas.getContext('bitmaprenderer');
    if (!this.ctx) {
      throw new Error('bitmaprenderer context is not supported by this browser/canvas.');
    }
  }

  draw(frame: VideoFrame) {
    if (this.closed || !this.ctx) return;

    // Clone the frame so it remains valid during the async createImageBitmap call
    let frameClone: VideoFrame | null = null;
    try {
      frameClone = frame.clone();
    } catch {
      return; // Return silently if the source frame is already invalid or closed
    }

    createImageBitmap(frameClone)
      .then((bitmap) => {
        if (frameClone) {
          try { frameClone.close(); } catch {}
        }

        if (this.closed || !this.ctx) {
          try { bitmap.close(); } catch {}
          return;
        }

        // Adjust canvas dimensions if needed
        if (this.canvas.width !== frame.displayWidth || this.canvas.height !== frame.displayHeight) {
          this.canvas.width = frame.displayWidth;
          this.canvas.height = frame.displayHeight;
        }

        this.ctx.transferFromImageBitmap(bitmap);
      })
      .catch(() => {
        if (frameClone) {
          try { frameClone.close(); } catch {}
        }
      });
  }

  clear() {
    // Clear canvas by transferring an empty/null image bitmap
    if (this.ctx) {
      try {
        this.ctx.transferFromImageBitmap(null);
      } catch {}
    }
  }

  close() {
    this.closed = true;
    this.ctx = null;
  }
}
