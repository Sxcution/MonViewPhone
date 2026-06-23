import { VideoFrameRenderer } from './VideoFrameRenderer';
import { BitmapRendererVideoFrameRenderer } from './BitmapRendererVideoFrameRenderer';
import { WebGLVideoFrameRenderer } from './WebGLVideoFrameRenderer';
import { Canvas2DVideoFrameRenderer } from './Canvas2DVideoFrameRenderer';

export function createBestVideoFrameRenderer(
  canvas: HTMLCanvasElement,
  maxFps: number = 15
): VideoFrameRenderer {
  // 1. Try bitmaprenderer (best performance for multi-screen, no context limits)
  try {
    return new BitmapRendererVideoFrameRenderer(canvas, maxFps);
  } catch (e) {
    // Suppress spam, but can print a warning if useful
  }

  // 2. Try WebGL (fast hardware GPU rendering)
  try {
    return new WebGLVideoFrameRenderer(canvas, maxFps);
  } catch (e) {
    // Suppress spam
  }

  // 3. Fallback to Canvas2D (always supported)
  return new Canvas2DVideoFrameRenderer(canvas, maxFps);
}
