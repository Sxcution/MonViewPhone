import { StreamCallbacks, StreamEngine, StreamStats } from '../StreamEngine';
import { AccessUnitAssembler } from '../h264/AccessUnitAssembler';
import { Canvas2DVideoFrameRenderer } from '../render/Canvas2DVideoFrameRenderer';

const MAX_DECODE_QUEUE_SIZE = 8;
const RECOVERY_DROP_LOG_INTERVAL_MS = 5000;

function getCodecString(sps: Uint8Array): string {
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
  private dropUntilKeyframe = false;

  private lastSps: Uint8Array | null = null;
  private lastPps: Uint8Array | null = null;
  private activeCodec = '';

  private decodedFramesCount = 0;
  private renderedFramesCount = 0;
  private droppedFramesCount = 0;
  private decoderRecoveryCount = 0;
  private recoveryStartedAt = 0;
  private recoveryDroppedFrames = 0;
  private lastRecoveryDropLogAt = -Infinity;
  private clientDecodeLatencyEstimateMs = 0;
  private lastChunkTimestampUs = 0;
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
    this.dropUntilKeyframe = false;
    this.isReadyState = false;
    this.lastSps = null;
    this.lastPps = null;
    this.activeCodec = '';
    this.decoderRecoveryCount = 0;
    this.recoveryStartedAt = 0;
    this.recoveryDroppedFrames = 0;
    this.lastRecoveryDropLogAt = -Infinity;
    this.clientDecodeLatencyEstimateMs = 0;
    this.lastChunkTimestampUs = 0;

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

    const decoder = new VideoDecoder({
      output: (frame) => {
        if (this.decoder !== decoder) {
          frame.close();
          return;
        }
        const renderer = this.renderer;
        if (!renderer) {
          frame.close();
          return;
        }

        const timestampUs = frame.timestamp;
        const width = frame.displayWidth;
        const height = frame.displayHeight;
        this.width = width;
        this.height = height;

        renderer.draw(frame, () => {
          if (this.decoder !== decoder || this.renderer !== renderer) return;
          this.clientDecodeLatencyEstimateMs = Math.max(
            0,
            Math.round(performance.now() - timestampUs / 1000),
          );
          this.renderedFramesCount++;
          if (!this.firstFrame) {
            this.firstFrame = true;
            this.callbacks.onFirstFrame?.({ width, height });
          }
          this.callbacks.onFrame?.();
        }, (error) => {
          if (this.decoder !== decoder || this.renderer !== renderer) return;
          console.error('[WebCodecs Debug] Render failed:', error);
          this.callbacks.onError?.(error);
        });
      },
      error: (e) => {
        if (this.decoder !== decoder) return;
        console.error('[WebCodecs Debug] Decoder error callback triggered:', e);
        this.callbacks.onError?.(e);
        this.recoverDecoder('decoder-error');
      }
    });
    this.decoder = decoder;
  }

  private recreateDecoder() {
    this.renderer?.discardPending();
    try { this.decoder?.close(); } catch {}
    this.decoder = null;
    this.initDecoder();
    if (this.lastSps) {
      this.reconfigureDecoder();
    }
  }

  restartDecoderOnly(reason = 'manual'): void {
    this.recoverDecoder(reason);
  }

  private recoverDecoder(reason: string) {
    if (!this.isReadyState || this.dropUntilKeyframe) return;

    const queueSize = this.decoder?.decodeQueueSize ?? 0;
    this.dropUntilKeyframe = true;
    this.keyframeReceived = false;
    this.decoderRecoveryCount++;
    this.recoveryStartedAt = performance.now();
    this.lastRecoveryDropLogAt = this.recoveryStartedAt;
    this.recoveryDroppedFrames = queueSize;
    this.droppedFramesCount += queueSize;
    this.logRecoveryMetrics(`recovery-start:${reason}`, queueSize);
    this.recreateDecoder();
  }

  private dropFrame() {
    this.droppedFramesCount++;
    if (!this.dropUntilKeyframe) return;

    this.recoveryDroppedFrames++;
    const now = performance.now();
    if (now - this.lastRecoveryDropLogAt >= RECOVERY_DROP_LOG_INTERVAL_MS) {
      this.lastRecoveryDropLogAt = now;
      this.logRecoveryMetrics('waiting-for-live-keyframe');
    }
  }

  private logRecoveryMetrics(event: string, decodeQueueSize = this.decoder?.decodeQueueSize ?? 0) {
    console.info('[WebCodecs realtime]', {
      event,
      decodeQueueSize,
      droppedFrames: this.droppedFramesCount,
      recoveryDroppedFrames: this.recoveryDroppedFrames,
      decoderRecoveryCount: this.decoderRecoveryCount,
      recoveryWaitMs: this.recoveryStartedAt
        ? Math.round(performance.now() - this.recoveryStartedAt)
        : 0,
      clientDecodeLatencyEstimateMs: this.clientDecodeLatencyEstimateMs,
    });
  }

  private handleAssembledFrame(frameBytes: Uint8Array, isKey: boolean) {
    if (!this.decoder) return;
    let completesRecovery = false;

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

      if (type === 7) {
        if (!this.lastSps || !arrayEquals(this.lastSps, naluData)) {
          this.lastSps = new Uint8Array(naluData);
          this.reconfigureDecoder();
        }
      } else if (type === 8) {
        if (!this.lastPps || !arrayEquals(this.lastPps, naluData)) {
          this.lastPps = new Uint8Array(naluData);
          this.reconfigureDecoder();
        }
      }

      offset = naluEnd;
    }

    if (this.activeCodec === '') return;

    if (this.decoder.decodeQueueSize > MAX_DECODE_QUEUE_SIZE) {
      this.recoverDecoder('decode-queue-high-water');
    }

    if (this.dropUntilKeyframe) {
      if (!isKey) {
        this.dropFrame();
        return;
      }
      this.dropUntilKeyframe = false;
      this.keyframeReceived = true;
      completesRecovery = true;
    }

    if (!this.keyframeReceived) {
      if (isKey) this.keyframeReceived = true;
      else {
        this.dropFrame();
        return;
      }
    }

    try {
      const nowUs = Math.round(performance.now() * 1000);
      this.lastChunkTimestampUs = Math.max(nowUs, this.lastChunkTimestampUs + 1);
      const chunk = new EncodedVideoChunk({
        type: isKey ? 'key' : 'delta',
        timestamp: this.lastChunkTimestampUs,
        data: frameBytes,
      });
      this.decoder.decode(chunk);
      this.decodedFramesCount++;
      if (completesRecovery) this.logRecoveryMetrics('recovery-complete');
    } catch (e: any) {
      console.error('[WebCodecs Debug] decode chunk failed:', e);
      this.dropFrame();
      this.recoverDecoder('decode-throw');
    }
  }

  private reconfigureDecoder() {
    if (!this.lastSps || !this.decoder) return;

    try {
      const codec = getCodecString(this.lastSps);
      this.activeCodec = codec;
      if (this.decoder.state !== 'closed') {
        this.decoder.configure({ codec, optimizeForLatency: true });
      }
    } catch (e: any) {
      console.error('[WebCodecs Debug] configure failed:', e);
      this.dropUntilKeyframe = true;
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
      decoderName: 'webcodecs',
      decodedFps: this.decodedFps,
      renderedFps: this.renderedFps,
      droppedFrames: this.droppedFramesCount,
      decodeQueueSize: this.decoder?.decodeQueueSize || 0,
      clientDecodeLatencyEstimateMs: this.clientDecodeLatencyEstimateMs,
      decoderRecoveryCount: this.decoderRecoveryCount,
      waitingForKeyframe: this.dropUntilKeyframe || !this.keyframeReceived,
      reconnectCount: 0,
      width: this.width,
      height: this.height
    };
  }
}
