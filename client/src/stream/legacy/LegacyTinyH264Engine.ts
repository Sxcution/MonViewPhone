import { StreamCallbacks, StreamEngine, StreamStats } from '../StreamEngine';
import { AnnexBSplitter } from '@/lib/video';

export class LegacyTinyH264Engine implements StreamEngine {
  private canvas: HTMLCanvasElement;
  private callbacks: StreamCallbacks;
  private worker: Worker | null = null;
  private renderWorker: Worker | null = null;
  private splitter: AnnexBSplitter | null = null;

  private decoderReady = false;
  private firstFrame = false;
  private renderStateId = 1;
  private renderBusy = false;
  private pendingFrame: { width: number; height: number; data: ArrayBuffer } | null = null;
  private frameId = 1;

  private decodedFramesCount = 0;
  private renderedFramesCount = 0;
  private lastFpsCalcTime = Date.now();
  private decodedFps = 0;
  private renderedFps = 0;
  private width = 0;
  private height = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: StreamCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
  }

  start() {
    this.firstFrame = false;
    this.decoderReady = false;
    this.renderBusy = false;
    this.pendingFrame = null;
    this.frameId = 1;

    // Instantiate tinyh264 decoder worker
    this.worker = new Worker(
      new URL('../../workers/device_worker.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Instantiate YUV rendering worker
    this.renderWorker = new Worker(
      new URL('../../workers/yuvRender.worker.ts', import.meta.url),
      { type: 'module' }
    );

    const myStateId = this.renderStateId;
    const ctx2d = this.canvas.getContext('2d', { alpha: false });

    this.renderWorker.onerror = (e) => {
      this.callbacks.onError?.(new Error('YUV Render Worker error: ' + e.message));
    };

    this.renderWorker.onmessage = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || typeof msg.type !== 'string') return;

      if (msg.type === 'bitmap') {
        const width: number = msg.width;
        const height: number = msg.height;
        const bitmap: ImageBitmap = msg.bitmap;

        this.width = width;
        this.height = height;

        try {
          if (ctx2d) {
            ctx2d.drawImage(bitmap, 0, 0);
          }
          bitmap.close?.();
        } catch (e) {
          console.error('[present bitmap legacy]', e);
        }

        this.renderedFramesCount++;

        if (!this.firstFrame) {
          this.firstFrame = true;
          this.callbacks.onFirstFrame?.({ width, height });
        }
        this.callbacks.onFrame?.();

        this.renderBusy = false;
        if (this.pendingFrame && this.renderWorker) {
          const f = this.pendingFrame;
          this.pendingFrame = null;
          this.renderBusy = true;
          const id = ++this.frameId;
          try {
            this.renderWorker.postMessage(
              { type: 'render', width: f.width, height: f.height, data: f.data, frameId: id },
              [f.data]
            );
          } catch (e) {
            this.renderBusy = false;
          }
        }
      }
    };

    this.worker.onmessage = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || typeof msg.type !== 'string') return;

      if (typeof msg.renderStateId === 'number' && msg.renderStateId !== myStateId) return;

      if (msg.type === 'decoderReady') {
        this.decoderReady = true;
        return;
      }

      if (msg.type === 'pictureReady') {
        const width: number = msg.width;
        const height: number = msg.height;
        const data: ArrayBuffer = msg.data;

        this.decodedFramesCount++;

        if (!data || !width || !height || !this.renderWorker) return;

        if (this.renderBusy) {
          this.pendingFrame = { width, height, data };
          return;
        }

        this.renderBusy = true;
        const id = ++this.frameId;
        try {
          this.renderWorker.postMessage(
            { type: 'render', width: width, height: height, data, frameId: id },
            [data]
          );
        } catch (e) {
          this.renderBusy = false;
        }
      }
    };

    this.worker.onerror = (e) => {
      this.callbacks.onError?.(new Error('tinyh264 Worker error: ' + e.message));
    };

    this.splitter = new AnnexBSplitter((naluWithStartCode) => {
      if (!this.worker || !this.decoderReady) return;

      const payload = new Uint8Array(naluWithStartCode);
      if (payload.length < 5) return;

      try {
        this.worker.postMessage(
          {
            type: 'decode',
            data: payload.buffer,
            offset: 0,
            length: payload.byteLength,
            renderStateId: myStateId,
          },
          [payload.buffer]
        );
      } catch (e) {
        // ignore
      }
    });
  }

  stop() {
    this.renderStateId++;
    if (this.worker) {
      try {
        this.worker.postMessage({ type: 'release', renderStateId: this.renderStateId });
      } catch {}
      try {
        this.worker.terminate();
      } catch {}
      this.worker = null;
    }
    if (this.renderWorker) {
      try {
        this.renderWorker.postMessage({ type: 'release' });
      } catch {}
      try {
        this.renderWorker.terminate();
      } catch {}
      this.renderWorker = null;
    }
    this.splitter = null;
  }

  feedBytes(data: Uint8Array) {
    this.splitter?.push(data);
  }

  isReady(): boolean {
    return this.decoderReady;
  }

  getStats(): StreamStats {
    const now = Date.now();
    const elapsed = now - this.lastFpsCalcTime;
    if (elapsed >= 1000) {
      this.decodedFps = Math.round((this.decodedFramesCount * 1000) / elapsed);
      this.renderedFps = Math.round((this.renderedFramesCount * 1000) / elapsed);
      this.decodedFramesCount = 0;
      this.renderedFramesCount = 0;
      this.lastFpsCalcTime = now;
    }

    return {
      engineName: 'legacy-tinyh264',
      decodedFps: this.decodedFps,
      renderedFps: this.renderedFps,
      droppedFrames: 0,
      decodeQueueSize: 0,
      reconnectCount: 0,
      width: this.width,
      height: this.height,
    };
  }
}
