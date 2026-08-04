import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

import { AdbScrcpyClient, AdbScrcpyOptionsLatest } from '@yume-chan/adb-scrcpy';
import { ScrcpyCodecOptions } from '@yume-chan/scrcpy';

import { createAdbForSerial, listDevices } from './adb.js';
import { DeviceStepLogger } from './runtime.js';
import { error, log, warn } from './logger.js';
import {
  ParsedControlMessage,
  REMOTE_SERVER_PATH,
  SCRCPY_VERSION,
  ServerPacketType,
  StreamQuery,
} from './protocol.js';

export type VideoPacket = {
  type: ServerPacketType;
  data: Uint8Array;
  timestamp: number;
  keyframe: boolean;
};
export type VideoPacketSink = (packet: VideoPacket) => void;

type MaybeReadableStream = ReadableStream<Uint8Array>;
type DeviceAdb = Awaited<ReturnType<typeof createAdbForSerial>>;
type UhidTouchCalibration = {
  xOffset: number;
  yOffset: number;
  xScale: number;
  yScale: number;
};

const SERVER_CANDIDATES = [
  resolve(process.cwd(), 'vendor', `scrcpy-server-v${SCRCPY_VERSION}.jar`),
  resolve(process.cwd(), 'stream-node', 'vendor', `scrcpy-server-v${SCRCPY_VERSION}.jar`),
  resolve(process.cwd(), 'server-go', 'bin', `scrcpy-server-v${SCRCPY_VERSION}.jar`),
  resolve(process.cwd(), '..', 'server-go', 'bin', `scrcpy-server-v${SCRCPY_VERSION}.jar`),
  resolve(process.cwd(), 'server-go', 'scrcpy-server.jar'),
  resolve(process.cwd(), '..', 'server-go', 'scrcpy-server.jar'),
];
const execFileAsync = promisify(execFile);
const SERVER_IO_TIMEOUT_MS = 10_000;

const UHID_KEYBOARD_ID = 1;
const UHID_TOUCH_ID = 3;

const UHID_KEYBOARD_REPORT_DESC = new Uint8Array([
  0x05, 0x01, 0x09, 0x06, 0xa1, 0x01, 0x05, 0x07,
  0x19, 0xe0, 0x29, 0xe7, 0x15, 0x00, 0x25, 0x01,
  0x75, 0x01, 0x95, 0x08, 0x81, 0x02, 0x75, 0x08,
  0x95, 0x01, 0x81, 0x01, 0x05, 0x08, 0x19, 0x01,
  0x29, 0x05, 0x75, 0x01, 0x95, 0x05, 0x91, 0x02,
  0x75, 0x03, 0x95, 0x01, 0x91, 0x01, 0x05, 0x07,
  0x19, 0x00, 0x29, 0x65, 0x15, 0x00, 0x25, 0x65,
  0x75, 0x08, 0x95, 0x06, 0x81, 0x00, 0xc0,
]);

const UHID_TOUCH_REPORT_DESC = new Uint8Array([
  0x05, 0x0d,       // Usage Page (Digitizers)
  0x09, 0x04,       // Usage (Touch Screen)
  0xa1, 0x01,       // Collection (Application)
  0x09, 0x22,       // Usage (Finger)
  0xa1, 0x02,       // Collection (Logical)
  0x09, 0x42,       // Usage (Tip Switch)
  0x15, 0x00, 0x25, 0x01,
  0x75, 0x01, 0x95, 0x01,
  0x81, 0x02,
  0x09, 0x32,       // Usage (In Range)
  0x81, 0x02,
  0x75, 0x06, 0x95, 0x01,
  0x81, 0x03,
  0x05, 0x01,       // Usage Page (Generic Desktop)
  0x09, 0x30,       // Usage (X)
  0x09, 0x31,       // Usage (Y)
  0x16, 0x00, 0x00,
  0x26, 0xff, 0x7f,
  0x75, 0x10, 0x95, 0x02,
  0x81, 0x02,
  0xc0,
  0xc0,
]);

const UHID_KEYBOARD_ACTION_DOWN = 0;
const UHID_KEYBOARD_ACTION_UP = 1;
const UHID_KEYBOARD_ACTION_RESET = 2;
const TOUCH_ACTION_DOWN = 0;
const TOUCH_ACTION_UP = 1;
const TOUCH_ACTION_MOVE = 2;

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

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function modifierBit(usage: number) {
  return usage >= 0xe0 && usage <= 0xe7 ? 1 << (usage - 0xe0) : 0;
}

function parseUhidTouchCalibration(inputDump: string): UhidTouchCalibration | null {
  const match = inputDump.match(/Viewport INTERNAL:.*?physicalFrame=\[(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\],\s*deviceSize=\[(\d+),\s*(\d+)\]/);
  if (!match) return null;
  const [, leftRaw, topRaw, rightRaw, bottomRaw, widthRaw, heightRaw] = match;
  const left = Number(leftRaw);
  const top = Number(topRaw);
  const right = Number(rightRaw);
  const bottom = Number(bottomRaw);
  const width = Number(widthRaw);
  const height = Number(heightRaw);
  if (!width || !height || right <= left || bottom <= top) return null;
  return {
    xOffset: left / width,
    yOffset: top / height,
    xScale: (right - left) / width,
    yScale: (bottom - top) / height,
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}

async function pushServer(adb: DeviceAdb, trace: DeviceStepLogger, remoteServerPath: string) {
  const serverJar = findServerJar(trace);
  const info = await stat(serverJar);

  trace.step('PUSH_JAR_BEGIN', { local: serverJar, bytes: info.size, remote: remoteServerPath });
  await AdbScrcpyClient.pushServer(adb, nodeFileToWebStream(serverJar) as never, remoteServerPath);
  trace.step('PUSH_JAR_OK', { remote: remoteServerPath });
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
    powerOn: false,
    stayAwake: false,
  };

  if (query.encoder) init.videoEncoder = query.encoder;
  if (query.iFrameInterval !== undefined) {
    init.videoCodecOptions = new ScrcpyCodecOptions({ iFrameInterval: query.iFrameInterval });
  }
  trace.step('BUILD_SCRCPY_OPTIONS', init);
  return new AdbScrcpyOptionsLatest(init as never, { version: SCRCPY_VERSION });
}

export class ScrcpySession {
  readonly udid: string;
  readonly scid: string;
  readonly query: StreamQuery;
  readonly trace: DeviceStepLogger;

  #adb: DeviceAdb | undefined;
  #client: any | undefined;
  #remoteServerPath: string | undefined;
  #serverPush: Promise<void> | undefined;
  #closed = false;
  #started = false;
  #readerAbort = new AbortController();
  #firstConfigLogged = false;
  #firstVideoLogged = false;
  #videoPackets = 0;
  #controlPackets = 0;
  #uHidKeyboardReady = false;
  #uHidTouchReady = false;
  #uHidTouchCalibration: UhidTouchCalibration | null | undefined;
  #uHidKeyboardModifiers = 0;
  #uHidKeyboardKeys = new Set<number>();

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
      iFrameInterval: this.query.iFrameInterval ?? 'default',
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

      // Grid/Viewer sessions must not share a JAR that the previous scrcpy CleanUp can delete.
      this.#remoteServerPath = REMOTE_SERVER_PATH.replace(/\.jar$/, `-${this.scid}.jar`);
      this.#serverPush = withTimeout(
        pushServer(this.#adb, this.trace, this.#remoteServerPath),
        SERVER_IO_TIMEOUT_MS,
        `scrcpy server push timed out after ${SERVER_IO_TIMEOUT_MS}ms`,
      );
      try {
        await this.#serverPush;
      } finally {
        this.#serverPush = undefined;
      }
      if (this.#closed) throw new Error('session cancelled after server push');

      const options = makeOptions(this.query, this.scid, this.trace);
      this.trace.step('SCRCPY_START_BEGIN', { remotePath: this.#remoteServerPath });
      this.#client = await AdbScrcpyClient.start(this.#adb, this.#remoteServerPath, options as never);
      this.#remoteServerPath = undefined; // The scrcpy CleanUp process owns this path now.
      this.trace.step('SCRCPY_START_OK');
      if (this.#closed) throw new Error('session cancelled after scrcpy start');
    } catch (e) {
      await this.#removePendingServer();
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
            onVideoPacket({ type: ServerPacketType.VideoConfiguration, data: value.data, timestamp: 0, keyframe: true });
          } else {
            const timestamp = Number(value.pts ?? 0);
            if (!this.#firstVideoLogged) {
              this.#firstVideoLogged = true;
              this.trace.step('FIRST_VIDEO_DATA_PACKET', { bytes: value.data.byteLength, keyframe: Boolean(value.keyframe), timestamp });
            }
            if (this.#videoPackets % 300 === 0) this.trace.step('VIDEO_PACKET_HEARTBEAT', { packets: this.#videoPackets });
            onVideoPacket({ type: ServerPacketType.VideoData, data: value.data, timestamp, keyframe: Boolean(value.keyframe) });
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

  async #ensureUhidKeyboard(controller: any) {
    if (this.#uHidKeyboardReady) return true;
    try {
      await controller.uHidCreate({
        id: UHID_KEYBOARD_ID,
        vendorId: 0,
        productId: 0,
        name: '',
        data: UHID_KEYBOARD_REPORT_DESC,
      });
      this.#uHidKeyboardReady = true;
      this.trace.step('UHID_KEYBOARD_READY');
      return true;
    } catch (e) {
      this.trace.warn('UHID_KEYBOARD_CREATE_FAILED', describeError(e));
      return false;
    }
  }

  async #ensureUhidTouch(controller: any) {
    if (this.#uHidTouchReady) return true;
    try {
      await controller.uHidCreate({
        id: UHID_TOUCH_ID,
        vendorId: 0,
        productId: 0,
        name: 'MonViewPhone Touch',
        data: UHID_TOUCH_REPORT_DESC,
      });
      this.#uHidTouchReady = true;
      this.trace.step('UHID_TOUCH_READY');
      return true;
    } catch (e) {
      this.trace.warn('UHID_TOUCH_CREATE_FAILED', describeError(e));
      return false;
    }
  }

  async #getUhidTouchCalibration(): Promise<UhidTouchCalibration | null> {
    if (this.#uHidTouchCalibration !== undefined) return this.#uHidTouchCalibration;
    try {
      const { stdout } = await execFileAsync('adb', ['-s', this.udid, 'shell', 'dumpsys', 'input'], {
        timeout: 2500,
        maxBuffer: 1024 * 1024,
      });
      this.#uHidTouchCalibration = parseUhidTouchCalibration(String(stdout));
      if (this.#uHidTouchCalibration) {
        this.trace.step('UHID_TOUCH_CALIBRATION', this.#uHidTouchCalibration);
      } else {
        this.trace.warn('UHID_TOUCH_CALIBRATION_MISSING', 'using direct 0..1 mapping');
      }
    } catch (e) {
      this.#uHidTouchCalibration = null;
      this.trace.warn('UHID_TOUCH_CALIBRATION_FAILED', describeError(e));
    }
    return this.#uHidTouchCalibration;
  }

  async #sendUhidKeyboardReport(controller: any) {
    const keys = Array.from(this.#uHidKeyboardKeys).slice(0, 6);
    const data = new Uint8Array(8);
    data[0] = this.#uHidKeyboardModifiers & 0xff;
    if (this.#uHidKeyboardKeys.size > 6) {
      data.fill(0x01, 2);
    } else {
      for (let i = 0; i < keys.length; i++) data[i + 2] = keys[i] & 0xff;
    }
    await controller.uHidInput({ id: UHID_KEYBOARD_ID, data });
  }

  async #injectUhidKeyboard(controller: any, message: Extract<ParsedControlMessage, { kind: 'uhidKeyboard' }>) {
    if (!await this.#ensureUhidKeyboard(controller)) return;

    if (message.action === UHID_KEYBOARD_ACTION_RESET) {
      this.#uHidKeyboardModifiers = 0;
      this.#uHidKeyboardKeys.clear();
      await this.#sendUhidKeyboardReport(controller);
      return;
    }

    const usage = clampInt(message.usage, 0, 0xff);
    const bit = modifierBit(usage);
    if (message.action === UHID_KEYBOARD_ACTION_DOWN) {
      if (bit) this.#uHidKeyboardModifiers |= bit;
      else if (usage) this.#uHidKeyboardKeys.add(usage);
    } else if (message.action === UHID_KEYBOARD_ACTION_UP) {
      if (bit) this.#uHidKeyboardModifiers &= ~bit;
      else this.#uHidKeyboardKeys.delete(usage);
    } else {
      return;
    }
    await this.#sendUhidKeyboardReport(controller);
  }

  async #injectUhidTouch(controller: any, message: Extract<ParsedControlMessage, { kind: 'uhidTouch' }>) {
    if (!await this.#ensureUhidTouch(controller)) return;
    const calibration = await this.#getUhidTouchCalibration();
    const width = Math.max(1, message.width || 1);
    const height = Math.max(1, message.height || 1);
    const x01 = message.x / width;
    const y01 = message.y / height;
    const mappedX = calibration ? calibration.xOffset + x01 * calibration.xScale : x01;
    const mappedY = calibration ? calibration.yOffset + y01 * calibration.yScale : y01;
    const x = clampInt(Math.round(mappedX * 0x7fff), 0, 0x7fff);
    const y = clampInt(Math.round(mappedY * 0x7fff), 0, 0x7fff);
    const touching = message.action === TOUCH_ACTION_DOWN || message.action === TOUCH_ACTION_MOVE;
    const flags = touching ? 0x03 : 0x00;
    const data = new Uint8Array([
      flags,
      x & 0xff,
      (x >> 8) & 0xff,
      y & 0xff,
      (y >> 8) & 0xff,
    ]);
    await controller.uHidInput({ id: UHID_TOUCH_ID, data });
  }

  async #releaseUhidDevices() {
    const controller = this.#client?.controller;
    if (!controller) return;
    try {
      if (this.#uHidKeyboardReady) {
        this.#uHidKeyboardModifiers = 0;
        this.#uHidKeyboardKeys.clear();
        await this.#sendUhidKeyboardReport(controller);
        await controller.uHidDestroy(UHID_KEYBOARD_ID);
        this.#uHidKeyboardReady = false;
      }
    } catch (e) {
      this.trace.warn('UHID_KEYBOARD_RELEASE_FAILED', describeError(e));
    }
    try {
      if (this.#uHidTouchReady) {
        await controller.uHidInput({ id: UHID_TOUCH_ID, data: new Uint8Array(5) });
        await controller.uHidDestroy(UHID_TOUCH_ID);
        this.#uHidTouchReady = false;
      }
    } catch (e) {
      this.trace.warn('UHID_TOUCH_RELEASE_FAILED', describeError(e));
    }
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
        // @yume-chan/scrcpy 3.3.4: controller writer exposes setScreenPowerMode, not setDisplayPower
        if (typeof controller.setScreenPowerMode === 'function') {
          await controller.setScreenPowerMode(message.mode);
        } else if (typeof controller.setDisplayPower === 'function') {
          await controller.setDisplayPower(message.mode);
        }
        break;
      case 'clipboard':
        await controller.setClipboard({
          sequence: 0n,
          paste: message.paste,
          content: message.text || '',
        });
        break;
      case 'uhidKeyboard':
        await this.#injectUhidKeyboard(controller, message);
        break;
      case 'uhidTouch':
        await this.#injectUhidTouch(controller, message);
        break;
    }
  }

  async close() {
    if (this.#closed) return;
    this.#closed = true;
    this.trace.step('SESSION_CLOSE_BEGIN', { videoPackets: this.#videoPackets, controlPackets: this.#controlPackets });
    this.#readerAbort.abort();

    try { await this.#releaseUhidDevices(); } catch {}
    try { await this.#serverPush; } catch {}
    await this.#removePendingServer();
    try { await this.#client?.close(); } catch {}
    try { await this.#adb?.close(); } catch {}

    this.#client = undefined;
    this.#adb = undefined;
    this.trace.step('SESSION_CLOSE_OK');
  }

  async #removePendingServer() {
    const remoteServerPath = this.#remoteServerPath;
    this.#remoteServerPath = undefined;
    if (!remoteServerPath || !this.#adb) return;
    try {
      await withTimeout(
        this.#adb.rm(remoteServerPath, { force: true }),
        SERVER_IO_TIMEOUT_MS,
        `pending scrcpy server cleanup timed out after ${SERVER_IO_TIMEOUT_MS}ms`,
      );
      this.trace.step('PENDING_JAR_REMOVED', { remote: remoteServerPath });
    } catch (e) {
      this.trace.warn('PENDING_JAR_REMOVE_FAILED', describeError(e));
    }
  }
}

async function selfCheck() {
  assert.equal(await withTimeout(Promise.resolve('ok'), 100, 'unexpected timeout'), 'ok');
  await assert.rejects(
    withTimeout(new Promise<void>(() => undefined), 5, 'expected timeout'),
    /expected timeout/,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await selfCheck();
  console.log('scrcpy session self-check passed');
}
