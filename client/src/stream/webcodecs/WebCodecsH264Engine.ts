import { StreamCallbacks, StreamEngine, StreamStats } from '../StreamEngine';
import { AccessUnitAssembler } from '../h264/AccessUnitAssembler';
import { Canvas2DVideoFrameRenderer } from '../render/Canvas2DVideoFrameRenderer';

function getCodecString(sps: Uint8Array): string {
  // Constructed H.264 profile string: avc1.[profile_idc][profile_compatibility][level_idc]
  const profile = sps[1].toString(16).padStart(2, '0');
  const compat = sps[2].toString(16).padStart(2, '0');
  const level = sps[3].toString(16).padStart(2, '0');
  return `avc1.${profile}${compat}${level}`;
}

function arrayEquals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export class WebCodecsH264Engine implements StreamEngine {
  private canvas: HTMLCanvasElement;
  private callbacks: StreamCallbacks;
  private decoder: VideoDecoder | null = null;
  private renderer: Canvas2DVideoFrameRenderer | null = null;
  private assembler: AccessUnitAssembler | null = null;

  private isReadyState = false;
  private firstFrame = false;
  private keyframeReceived = false;

  private lastSps: Uint8Array | null = null;
  private lastPps: Uint8Array | null = null;
  private activeCodec = '';

  private decodedFramesCount = 0;
  private renderedFramesCount = 0;
  private droppedFramesCount = 0;
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
    this.keyframeReceived = false;
    this.isReadyState = false;
    this.lastSps = null;
    this.lastPps = null;
    this.activeCodec = '';

    this.renderer = new Canvas2DVideoFrameRenderer(this.canvas);
    this.assembler = new AccessUnitAssembler((frameBytes, isKey) => {
      this.handleAssembledFrame(frameBytes, isKey);
    });

    this.initDecoder();

    this.isReadyState = true;
  }

  private initDecoder() {
    if (this.decoder) {
      try { this.decoder.close(); } catch {}
    }

    this.decoder = new VideoDecoder({
      output: (frame) => {
        this.renderedFramesCount++;
        this.width = frame.displayWidth;
        this.height = frame.displayHeight;

        if (!this.firstFrame) {
          this.firstFrame = true;
          this.callbacks.onFirstFrame?.({ width: this.width, height: this.height });
        }

        try {
          this.renderer?.draw(frame);
        } catch (e) {
          console.error('[WebCodecs Debug] Render failed:', e);
        }

        frame.close();
        this.callbacks.onFrame?.();
      },
      error: (e) => {
        console.error('[WebCodecs Debug] Decoder error callback triggered:', e);
        this.callbacks.onError?.(e);
        // Fallback disabled to keep WebCodecs active for debugging
      }
    });
  }

  private handleAssembledFrame(frameBytes: Uint8Array, isKey: boolean) {
    if (!this.decoder) return;

    // Scan for SPS/PPS parameters inside Annex-B to update config
    let offset = 0;
    while (offset < frameBytes.length) {
      let startLen = 0;
      if (frameBytes[offset] === 0x00 && frameBytes[offset + 1] === 0x00) {
        if (frameBytes[offset + 2] === 0x01) startLen = 3;
        else if (frameBytes[offset + 2] === 0x00 && frameBytes[offset + 3] === 0x01) startLen = 4;
      }

      if (startLen === 0) {
        offset++;
        continue;
      }

      const nextNaluStart = this.findNextStartCode(frameBytes, offset + startLen);
      const naluEnd = nextNaluStart === -1 ? frameBytes.length : nextNaluStart;
      const naluData = frameBytes.subarray(offset + startLen, naluEnd);
      const type = naluData[0] & 0x1f;

      if (type === 7) { // SPS
        if (!this.lastSps || !arrayEquals(this.lastSps, naluData)) {
          this.lastSps = new Uint8Array(naluData);
          this.reconfigureDecoder();
        }
      } else if (type === 8) { // PPS
        if (!this.lastPps || !arrayEquals(this.lastPps, naluData)) {
          this.lastPps = new Uint8Array(naluData);
          this.reconfigureDecoder();
        }
      }

      offset = naluEnd;
    }

    // Config verification guard
    if (this.activeCodec === '') {
      return;
    }

    // Drop delta frames if keyframe hasn't arrived
    if (!this.keyframeReceived) {
      if (isKey) {
        this.keyframeReceived = true;
      } else {
        return;
      }
    }

    // Backpressure: drop stale delta frames if decode queue starts to pile up
    if (this.decoder.decodeQueueSize > 8 && !isKey) {
      this.droppedFramesCount++;
      return;
    }

    try {
      const chunk = new EncodedVideoChunk({
        type: isKey ? 'key' : 'delta',
        timestamp: Date.now() * 1000, // microseconds
        data: frameBytes
      });
      this.decoder.decode(chunk);
      this.decodedFramesCount++;
    } catch (e: any) {
      console.error('[WebCodecs Debug] decode chunk failed:', e);
      // Fallback disabled to keep WebCodecs active for debugging
    }
  }

  private reconfigureDecoder() {
    if (!this.lastSps || !this.decoder) return;

    try {
      const codec = getCodecString(this.lastSps);
      this.activeCodec = codec;

      this.decoder.configure({
        codec,
        optimizeForLatency: true
      });
    } catch (e: any) {
      console.error('[WebCodecs Debug] configure failed:', e);
      // Fallback disabled to keep WebCodecs active for debugging
    }
  }

  private findNextStartCode(buf: Uint8Array, from: number): number {
    for (let i = from; i + 3 < buf.length; i++) {
      if (buf[i] === 0x00 && buf[i + 1] === 0x00) {
        if (buf[i + 2] === 0x01) return i;
        if (buf[i + 2] === 0x00 && buf[i + 3] === 0x01) return i;
      }
    }
    return -1;
  }

  stop() {
    this.isReadyState = false;
    this.activeCodec = '';
    if (this.decoder) {
      try { this.decoder.close(); } catch {}
      this.decoder = null;
    }
    if (this.renderer) {
      try { this.renderer.close(); } catch {}
      this.renderer = null;
    }
    this.assembler = null;
  }

  feedBytes(data: Uint8Array) {
    this.assembler?.feedPacket(data);
  }

  isReady(): boolean {
    return this.isReadyState && this.activeCodec !== '';
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
      engineName: 'webcodecs',
      decodedFps: this.decodedFps,
      renderedFps: this.renderedFps,
      droppedFrames: this.droppedFramesCount,
      decodeQueueSize: this.decoder?.decodeQueueSize || 0,
      reconnectCount: 0,
      width: this.width,
      height: this.height
    };
  }
}
