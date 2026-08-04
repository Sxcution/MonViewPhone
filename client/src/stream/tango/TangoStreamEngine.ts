import { StreamCallbacks, StreamEngine, StreamStats } from '../StreamEngine';
import { WebCodecsH264Engine } from '../webcodecs/WebCodecsH264Engine';
import { parseTangoPacket } from './TangoProtocol';

const BACKLOG_LOG_THRESHOLD_MS = 250;
const BACKLOG_LOG_INTERVAL_MS = 5000;

export class TangoStreamEngine implements StreamEngine {
  private canvas: HTMLCanvasElement;
  private callbacks: StreamCallbacks;
  private onVideoPacket?: () => void;
  private inner: WebCodecsH264Engine | null = null;
  private packets = 0;
  private configPackets = 0;
  private dataPackets = 0;
  private lastPacketAt = 0;
  private lastVideoPtsUs: number | null = null;
  private arrivalMinusPtsBaselineUs: number | null = null;
  private relativeTransportBacklogEstimateMs = 0;
  private lastBacklogLogAt = -Infinity;

  constructor(canvas: HTMLCanvasElement, callbacks: StreamCallbacks, onVideoPacket?: () => void) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.onVideoPacket = onVideoPacket;
  }

  start(): void {
    this.packets = 0;
    this.configPackets = 0;
    this.dataPackets = 0;
    this.lastPacketAt = 0;
    this.lastVideoPtsUs = null;
    this.arrivalMinusPtsBaselineUs = null;
    this.relativeTransportBacklogEstimateMs = 0;
    this.lastBacklogLogAt = -Infinity;
    this.inner = new WebCodecsH264Engine(this.canvas, this.callbacks);
    this.inner.start();
  }

  stop(): void {
    this.inner?.stop();
    this.inner = null;
  }

  restartDecoderOnly(): void {
    this.inner?.restartDecoderOnly('watchdog-render-stall');
  }

  feedBytes(data: Uint8Array): void {
    const packet = parseTangoPacket(data);
    if (!packet) return;

    this.packets++;
    this.lastPacketAt = Date.now();
    if (packet.type === 1) {
      this.configPackets++;
    } else {
      this.dataPackets++;
      this.onVideoPacket?.();
      this.updateRelativeTransportBacklog(packet.timestampUs);
    }

    // Tango server already unwraps scrcpy media packets. Payload is Annex-B H.264.
    this.inner?.feedBytes(packet.payload);
  }

  isReady(): boolean {
    return Boolean(this.inner?.isReady());
  }

  private updateRelativeTransportBacklog(ptsUs: number): void {
    if (ptsUs <= 0) {
      if (this.lastVideoPtsUs != null && ptsUs < this.lastVideoPtsUs) {
        this.lastVideoPtsUs = null;
        this.arrivalMinusPtsBaselineUs = null;
        this.relativeTransportBacklogEstimateMs = 0;
      }
      return;
    }

    // Relative only: media PTS and performance.now() have unrelated clock origins.
    const arrivalNowMs = performance.now();
    const arrivalMinusPtsUs = arrivalNowMs * 1000 - ptsUs;
    if (this.lastVideoPtsUs != null && ptsUs < this.lastVideoPtsUs) {
      this.arrivalMinusPtsBaselineUs = arrivalMinusPtsUs;
    } else if (
      this.arrivalMinusPtsBaselineUs == null
      || arrivalMinusPtsUs < this.arrivalMinusPtsBaselineUs
    ) {
      this.arrivalMinusPtsBaselineUs = arrivalMinusPtsUs;
    }
    this.lastVideoPtsUs = ptsUs;
    this.relativeTransportBacklogEstimateMs = Math.max(
      0,
      Math.round((arrivalMinusPtsUs - this.arrivalMinusPtsBaselineUs) / 1000),
    );
    if (
      this.relativeTransportBacklogEstimateMs >= BACKLOG_LOG_THRESHOLD_MS
      && arrivalNowMs - this.lastBacklogLogAt >= BACKLOG_LOG_INTERVAL_MS
    ) {
      this.lastBacklogLogAt = arrivalNowMs;
      const stats = this.inner?.getStats();
      console.info('[Tango realtime]', {
        event: 'transport-backlog',
        relativeTransportBacklogEstimateMs: this.relativeTransportBacklogEstimateMs,
        clientDecodeLatencyEstimateMs: stats?.clientDecodeLatencyEstimateMs ?? 0,
        decodeQueueSize: stats?.decodeQueueSize ?? 0,
        droppedFrames: stats?.droppedFrames ?? 0,
      });
    }
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
      relativeTransportBacklogEstimateMs: this.relativeTransportBacklogEstimateMs,
      fallbackReason: stats.fallbackReason || `MVTS packets: ${this.packets} (${this.configPackets} cfg / ${this.dataPackets} video)` ,
    };
  }
}
