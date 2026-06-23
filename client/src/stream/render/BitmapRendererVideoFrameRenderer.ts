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

  private inFlight = false;

  draw(frame: VideoFrame) {
    if (this.closed || !this.ctx) return;

    // Drop frame if another async conversion is already in-flight
    if (this.inFlight) return;
    this.inFlight = true;

    // Capture dimensions before the async boundary
    const displayWidth = frame.displayWidth;
    const displayHeight = frame.displayHeight;

    // Clone the frame so it remains valid during the async createImageBitmap call
    let frameClone: VideoFrame | null = null;
    try {
      frameClone = frame.clone();
    } catch {
      this.inFlight = false;
      return; // Return silently if the source frame is already invalid or closed
    }

    createImageBitmap(frameClone)
      .then((bitmap) => {
        this.inFlight = false;
        if (frameClone) {
          try { frameClone.close(); } catch {}
        }

        if (this.closed || !this.ctx) {
          try { bitmap.close(); } catch {}
          return;
        }

        // Adjust canvas dimensions if needed
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
          this.canvas.width = displayWidth;
          this.canvas.height = displayHeight;
        }

        this.ctx.transferFromImageBitmap(bitmap);
      })
      .catch(() => {
        this.inFlight = false;
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
