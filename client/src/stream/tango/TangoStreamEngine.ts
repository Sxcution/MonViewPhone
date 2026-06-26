import { StreamCallbacks, StreamEngine, StreamStats } from '../StreamEngine';
import { WebCodecsH264Engine } from '../webcodecs/WebCodecsH264Engine';
import { parseTangoPacket } from './TangoProtocol';

export class TangoStreamEngine implements StreamEngine {
  private canvas: HTMLCanvasElement;
  private callbacks: StreamCallbacks;
  private inner: WebCodecsH264Engine | null = null;
  private packets = 0;
  private configPackets = 0;
  private dataPackets = 0;
  private lastPacketAt = 0;
  private pendingConfigPayload: Uint8Array | null = null;
  private lastKeyframePayload: Uint8Array | null = null;

  constructor(canvas: HTMLCanvasElement, callbacks: StreamCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
  }

  start(): void {
    this.packets = 0;
    this.configPackets = 0;
    this.dataPackets = 0;
    this.lastPacketAt = 0;
    this.pendingConfigPayload = null;
    this.lastKeyframePayload = null;
    this.inner = new WebCodecsH264Engine(this.canvas, this.callbacks);
    this.inner.start();
  }

  stop(): void {
    this.inner?.stop();
    this.inner = null;
  }

  restartDecoderOnly(): void {
    this.inner?.stop();
    this.inner = new WebCodecsH264Engine(this.canvas, this.callbacks);
    this.inner.start();

    // Re-feed the latest SPS/PPS and keyframe if available. This avoids tearing
    // down the WebSocket/scrcpy session when Chrome's renderer/decoder stalls.
    if (this.pendingConfigPayload) {
      this.inner.feedBytes(this.pendingConfigPayload);
    }
    if (this.lastKeyframePayload) {
      this.inner.feedBytes(this.lastKeyframePayload);
    }
  }

  feedBytes(data: Uint8Array): void {
    const copied = data.slice().buffer as ArrayBuffer;
    const packet = parseTangoPacket(copied);
    if (!packet) return;

    this.packets++;
    this.lastPacketAt = Date.now();
    if (packet.type === 1) {
      this.configPackets++;
      this.pendingConfigPayload = packet.payload.slice();
    } else {
      this.dataPackets++;
      if (packet.keyframe) {
        this.lastKeyframePayload = packet.payload.slice();
      }
    }

    // Tango server already unwraps scrcpy media packets. Payload is Annex-B H.264.
    this.inner?.feedBytes(packet.payload);
  }

  isReady(): boolean {
    return Boolean(this.inner?.isReady());
  }

  getStats(): StreamStats {
    const stats = this.inner?.getStats() ?? {
      engineName: 'webcodecs',
      decoderName: 'webcodecs',
      decodedFps: 0,
      renderedFps: 0,
      droppedFrames: 0,
      decodeQueueSize: 0,
      reconnectCount: 0,
      width: 0,
      height: 0,
    };
    return {
      ...stats,
      engineName: 'tango-scrcpy',
      decoderName: stats.decoderName || 'webcodecs',
      fallbackReason: stats.fallbackReason || `MVTS packets: ${this.packets} (${this.configPackets} cfg / ${this.dataPackets} video)` ,
    };
  }
}
