import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

import { AdbScrcpyClient, AdbScrcpyOptionsLatest } from '@yume-chan/adb-scrcpy';

import { createAdbForSerial, listDevices } from './adb.js';
import { DeviceStepLogger } from './runtime.js';
import { error, log, warn } from './logger.js';
import {
  encodeVideoPacket,
  ParsedControlMessage,
  REMOTE_SERVER_PATH,
  SCRCPY_VERSION,
  ServerPacketType,
  StreamQuery,
} from './protocol.js';

export type VideoPacketSink = (packet: Buffer) => void;

type MaybeReadableStream = ReadableStream<Uint8Array>;

const SERVER_CANDIDATES = [
  resolve(process.cwd(), 'vendor', `scrcpy-server-v${SCRCPY_VERSION}.jar`),
  resolve(process.cwd(), '..', 'server-go', 'bin', `scrcpy-server-v${SCRCPY_VERSION}.jar`),
];

function describeError(e: unknown): string {
  if (!e) return 'unknown error';
  const err = e as any;
  const parts: string[] = [];
  if (err.name) parts.push(String(err.name));
  if (err.message) parts.push(String(err.message));
  if (Array.isArray(err.output) && err.output.length) parts.push(`server output:\n${err.output.join('\n')}`);
  if (err.stack) parts.push(String(err.stack));
  try {
    const json = JSON.stringify(err, Object.getOwnPropertyNames(err));
    if (json && json !== '{}') parts.push(json);
  } catch {}
  return parts.join('\n') || String(e);
}

function findServerJar(trace?: DeviceStepLogger): string {
  trace?.step('FIND_SCRCPY_JAR_BEGIN', { candidates: SERVER_CANDIDATES });
  for (const p of SERVER_CANDIDATES) {
    if (existsSync(p)) {
      trace?.step('FIND_SCRCPY_JAR_OK', { path: p });
      return p;
    }
  }
  throw new Error(`scrcpy-server ${SCRCPY_VERSION} jar not found. Checked: ${SERVER_CANDIDATES.join(', ')}`);
}

function nodeFileToWebStream(path: string): MaybeReadableStream {
  const nodeStream = createReadStream(path);
  return new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream.on('data', (chunk) => {
        const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
        controller.enqueue(new Uint8Array(buf));
      });
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', (e) => controller.error(e));
    },
    cancel() { nodeStream.destroy(); },
  });
}

function randomScid() {
  // scrcpy-server parses scid with Java Integer.parseInt(..., 16), so values
  // above 0x7fffffff crash with NumberFormatException. Keep it signed-int safe.
  const buf = randomBytes(4);
  buf[0] &= 0x7f;
  return buf.toString('hex').padStart(8, '0');
}

async function pushServer(adb: any, trace: DeviceStepLogger) {
  const serverJar = findServerJar(trace);
  const info = await stat(serverJar);
  trace.step('PUSH_JAR_BEGIN', { local: serverJar, bytes: info.size, remote: REMOTE_SERVER_PATH });
  await AdbScrcpyClient.pushServer(adb, nodeFileToWebStream(serverJar) as never, REMOTE_SERVER_PATH);
  trace.step('PUSH_JAR_OK', { remote: REMOTE_SERVER_PATH });
}

function makeOptions(query: StreamQuery, scid: string, trace: DeviceStepLogger) {
  const init: Record<string, unknown> = {
    scid,
    video: true,
    audio: false,
    control: true,
    tunnelForward: false,
    sendDummyByte: true,
    videoCodec: 'h264',
    videoBitRate: query.bitrate,
    maxSize: query.maxSize,
    maxFps: query.maxFps,
    displayId: query.displayId,
    sendDeviceMeta: true,
    sendCodecMeta: true,
    clipboardAutosync: true,
    powerOn: true,
    stayAwake: true,
  };

  if (query.encoder) init.videoEncoder = query.encoder;
  trace.step('BUILD_SCRCPY_OPTIONS', init);
  return new AdbScrcpyOptionsLatest(init as never, { version: SCRCPY_VERSION });
}

export class ScrcpySession {
  readonly udid: string;
  readonly scid: string;
  readonly query: StreamQuery;
  readonly trace: DeviceStepLogger;

  #adb: any | undefined;
  #client: any | undefined;
  #closed = false;
  #started = false;
  #readerAbort = new AbortController();
  #firstConfigLogged = false;
  #firstVideoLogged = false;
  #videoPackets = 0;
  #controlPackets = 0;

  constructor(query: StreamQuery, trace: DeviceStepLogger) {
    this.query = query;
    this.udid = query.udid;
    this.scid = randomScid();
    this.trace = trace;
  }

  get started() { return this.#started; }
  get closed() { return this.#closed; }

  async start(onVideoPacket: VideoPacketSink) {
    if (this.#started) return;
    if (this.#closed) throw new Error('session cancelled before start');
    this.#started = true;

    this.trace.step('SESSION_START_BEGIN', {
      version: SCRCPY_VERSION,
      scid: this.scid,
      maxSize: this.query.maxSize,
      fps: this.query.maxFps,
      bitrate: this.query.bitrate,
      encoder: this.query.encoder ?? 'auto',
    });

    try {
      this.trace.step('ADB_LIST_DEVICES_BEGIN');
      const devices = await listDevices();
      this.trace.step('ADB_LIST_DEVICES_OK', { count: devices.length, serials: devices.map((d: any) => d.serial ?? d.name ?? String(d)) });
      const found = devices.some((d: any) => (d.serial ?? d.name) === this.udid);
      if (!found) throw new Error(`device ${this.udid} not found in adb device list`);

      this.trace.step('ADB_CREATE_TRANSPORT_BEGIN');
      this.#adb = await createAdbForSerial(this.udid);
      this.trace.step('ADB_CREATE_TRANSPORT_OK');
      if (this.#closed) throw new Error('session cancelled after adb transport');

      await pushServer(this.#adb, this.trace);
      if (this.#closed) throw new Error('session cancelled after server push');

      const options = makeOptions(this.query, this.scid, this.trace);
      this.trace.step('SCRCPY_START_BEGIN', { remotePath: REMOTE_SERVER_PATH });
      this.#client = await AdbScrcpyClient.start(this.#adb, REMOTE_SERVER_PATH, options as never);
      this.trace.step('SCRCPY_START_OK');
      if (this.#closed) throw new Error('session cancelled after scrcpy start');
    } catch (e) {
      this.trace.warn('SESSION_START_FAILED', describeError(e));
      error(this.udid, `scrcpy start failed:\n${describeError(e)}`);
      throw e;
    }

    this.#client.exited.catch((e: unknown) => {
      if (!this.#closed) {
        this.trace.warn('SCRCPY_SERVER_EXITED', describeError(e));
        warn(this.udid, `scrcpy server exited:\n${describeError(e)}`);
      }
    });

    void this.#drainOutput();
    await this.#pipeVideo(onVideoPacket);
  }

  async #drainOutput() {
    const output = this.#client?.output;
    if (!output) { this.trace.step('SCRCPY_OUTPUT_STREAM_ABSENT'); return; }
    this.trace.step('SCRCPY_OUTPUT_READER_BEGIN');
    const reader = output.getReader();
    try {
      while (!this.#closed) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) log(`${this.udid}/scrcpy`, String(value));
      }
    } catch (e) {
      if (!this.#closed) this.trace.warn('SCRCPY_OUTPUT_READER_FAILED', describeError(e));
    } finally {
      try { reader.releaseLock(); } catch {}
      this.trace.step('SCRCPY_OUTPUT_READER_END');
    }
  }

  async #pipeVideo(onVideoPacket: VideoPacketSink) {
    this.trace.step('VIDEO_STREAM_GET_BEGIN');
    const video = await this.#client?.videoStream;
    if (!video) throw new Error('scrcpy video stream is disabled');
    this.trace.step('VIDEO_STREAM_GET_OK', { metadata: video.metadata ?? null });

    const reader = video.stream.getReader();
    const signal = this.#readerAbort.signal;
    const abort = () => { try { reader.cancel().catch(() => undefined); } catch {} };
    signal.addEventListener('abort', abort, { once: true });

    void (async () => {
      try {
        while (!this.#closed) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;
          this.#videoPackets += 1;
          if (value.type === 'configuration') {
            if (!this.#firstConfigLogged) {
              this.#firstConfigLogged = true;
              this.trace.step('FIRST_VIDEO_CONFIGURATION_PACKET', { bytes: value.data.byteLength });
            }
            onVideoPacket(encodeVideoPacket(ServerPacketType.VideoConfiguration, value.data, 0, true));
          } else {
            if (!this.#firstVideoLogged) {
              this.#firstVideoLogged = true;
              this.trace.step('FIRST_VIDEO_DATA_PACKET', { bytes: value.data.byteLength, keyframe: Boolean(value.keyframe), timestamp: Number(value.timestamp ?? 0) });
            }
            if (this.#videoPackets % 300 === 0) this.trace.step('VIDEO_PACKET_HEARTBEAT', { packets: this.#videoPackets });
            onVideoPacket(encodeVideoPacket(ServerPacketType.VideoData, value.data, Number(value.timestamp ?? 0), Boolean(value.keyframe)));
          }
        }
      } catch (e) {
        if (!this.#closed) {
          this.trace.warn('VIDEO_STREAM_FAILED', describeError(e));
          error(this.udid, `video stream failed:\n${describeError(e)}`);
        }
      } finally {
        signal.removeEventListener('abort', abort);
        try { reader.releaseLock(); } catch {}
        this.trace.step('VIDEO_STREAM_READER_END', { packets: this.#videoPackets });
      }
    })();
  }

  async handleControl(message: ParsedControlMessage) {
    const controller = this.#client?.controller;
    if (!controller || this.#closed) return;

    this.#controlPackets += 1;
    if (this.#controlPackets <= 5 || this.#controlPackets % 100 === 0) {
      this.trace.step('CONTROL_PACKET', { count: this.#controlPackets, kind: message.kind });
    }

    switch (message.kind) {
      case 'keycode':
        await controller.injectKeyCode({
          action: message.action,
          keyCode: message.keyCode,
          repeat: message.repeat,
          metaState: message.metaState,
        });
        break;
      case 'text':
        if (message.text) await controller.injectText(message.text);
        break;
      case 'touch':
        await controller.injectTouch({
          action: message.action,
          pointerId: message.pointerId,
          pointerX: message.x,
          pointerY: message.y,
          videoWidth: message.width,
          videoHeight: message.height,
          pressure: message.pressure,
          actionButton: message.buttons,
          buttons: message.buttons,
        });
        break;
      case 'scroll':
        await controller.injectScroll({
          pointerX: message.x,
          pointerY: message.y,
          videoWidth: message.width,
          videoHeight: message.height,
          scrollX: message.scrollX,
          scrollY: message.scrollY,
          buttons: message.buttons,
        });
        break;
      case 'screenPower':
        await controller.setDisplayPower(message.mode);
        break;
      case 'clipboard':
        await controller.setClipboard({
          sequence: 0n,
          paste: message.paste,
          content: message.text || '',
        });
        break;
    }
  }

  async close() {
    if (this.#closed) return;
    this.#closed = true;
    this.trace.step('SESSION_CLOSE_BEGIN', { videoPackets: this.#videoPackets, controlPackets: this.#controlPackets });
    this.#readerAbort.abort();

    try { await this.#client?.close(); } catch {}
    try { await this.#adb?.close(); } catch {}

    this.#client = undefined;
    this.#adb = undefined;
    this.trace.step('SESSION_CLOSE_OK');
  }
}
