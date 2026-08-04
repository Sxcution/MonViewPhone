export const STREAM_NODE_PORT = Number(process.env.MONVIEW_STREAM_NODE_PORT ?? 11080);
export const SCRCPY_VERSION = process.env.MONVIEW_SCRCPY_VERSION ?? '3.3.4';
export const REMOTE_SERVER_PATH = `/data/local/tmp/monviewphone-scrcpy-server-${SCRCPY_VERSION}.jar`;

const MAGIC = 0x4d565453; // MVTS
export const HEADER_SIZE = 20;

export const enum ServerPacketType {
  VideoConfiguration = 1,
  VideoData = 2,
}

export const enum ClientControlType {
  Keycode = 0,
  Text = 1,
  Touch = 2,
  Scroll = 3,
  SetClipboard = 9,
  SetScreenPowerMode = 10,
  UhidKeyboard = 17,
  UhidTouch = 18,
}

export type ServerHello = {
  type: 'hello';
  protocol: 'monview-tango-stream';
  version: 1;
  udid: string;
  scrcpyVersion: string;
  codec: 'h264';
};

export type StreamQuery = {
  udid: string;
  maxSize: number;
  maxFps: number;
  bitrate: number;
  displayId: number;
  iFrameInterval?: number;
  encoder?: string;
};

export type ParsedControlMessage =
  | { kind: 'keycode'; action: number; keyCode: number; repeat: number; metaState: number }
  | { kind: 'text'; text: string }
  | { kind: 'touch'; action: number; pointerId: bigint; x: number; y: number; width: number; height: number; pressure: number; buttons: number }
  | { kind: 'scroll'; x: number; y: number; width: number; height: number; scrollX: number; scrollY: number; buttons: number }
  | { kind: 'clipboard'; text: string; paste: boolean }
  | { kind: 'screenPower'; mode: number }
  | { kind: 'uhidKeyboard'; action: number; usage: number }
  | { kind: 'uhidTouch'; action: number; pointerId: bigint; x: number; y: number; width: number; height: number; pressure: number };

type RawWsData = Buffer | ArrayBuffer | Buffer[];

export function parseStreamQuery(url: URL): StreamQuery {
  const udid = url.searchParams.get('udid')?.trim();
  if (!udid) {
    throw new Error('missing udid');
  }
  const maxSize = clampNumber(url.searchParams.get('maxSize'), 1, 4096, 500);
  const maxFps = clampNumber(url.searchParams.get('maxFps'), 1, 120, 24);
  const bitrate = clampNumber(url.searchParams.get('bitrate'), 64 * 1024, 128 * 1024 * 1024, 917504);
  const displayId = clampNumber(url.searchParams.get('displayId'), 0, 32, 0);
  const iFrameIntervalRaw = url.searchParams.get('iFrameInterval')?.trim();
  const iFrameInterval = iFrameIntervalRaw ? clampNumber(iFrameIntervalRaw, 0, 60, 5) : undefined;
  const encoder = url.searchParams.get('encoder')?.trim() || undefined;
  return { udid, maxSize, maxFps, bitrate, displayId, iFrameInterval, encoder };
}

function clampNumber(raw: string | null, min: number, max: number, fallback: number): number {
  const parsed = raw == null ? Number.NaN : Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(parsed)));
}

export function encodeHello(udid: string): string {
  const hello: ServerHello = {
    type: 'hello',
    protocol: 'monview-tango-stream',
    version: 1,
    udid,
    scrcpyVersion: SCRCPY_VERSION,
    codec: 'h264',
  };
  return JSON.stringify(hello);
}

export function encodeVideoPacket(packetType: ServerPacketType, payload: Uint8Array, timestamp = 0, keyframe = false): Buffer {
  const out = Buffer.allocUnsafe(HEADER_SIZE + payload.byteLength);
  out.writeUInt32BE(MAGIC, 0);
  out.writeUInt8(1, 4);
  out.writeUInt8(packetType, 5);
  out.writeUInt8(keyframe ? 1 : 0, 6);
  out.writeUInt8(0, 7);
  out.writeBigUInt64BE(BigInt(Math.max(0, Math.trunc(timestamp))), 8);
  out.writeUInt32BE(payload.byteLength, 16);
  Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength).copy(out, HEADER_SIZE);
  return out;
}

export function toBuffer(data: RawWsData): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (Array.isArray(data)) return Buffer.concat(data);
  return Buffer.from(data as ArrayBuffer);
}

export function parseClientControl(data: RawWsData): ParsedControlMessage | undefined {
  const buf = toBuffer(data);
  if (buf.byteLength < 1) return undefined;
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const type = dv.getUint8(0);
  let o = 1;

  switch (type) {
    case ClientControlType.Keycode: {
      if (buf.byteLength < 14) return undefined;
      const action = dv.getUint8(o++);
      const keyCode = dv.getUint32(o, false); o += 4;
      const repeat = dv.getUint32(o, false); o += 4;
      const metaState = dv.getUint32(o, false);
      return { kind: 'keycode', action, keyCode, repeat, metaState };
    }
    case ClientControlType.Text: {
      if (buf.byteLength < 5) return undefined;
      const len = dv.getUint32(o, false); o += 4;
      if (buf.byteLength < o + len) return undefined;
      const text = new TextDecoder().decode(buf.subarray(o, o + len));
      return { kind: 'text', text };
    }
    case ClientControlType.Touch: {
      if (buf.byteLength < 29) return undefined;
      const action = dv.getUint8(o++);
      const pointerHigh = dv.getUint32(o, false); o += 4;
      const pointerLow = dv.getUint32(o, false); o += 4;
      const x = dv.getUint32(o, false); o += 4;
      const y = dv.getUint32(o, false); o += 4;
      const width = dv.getUint16(o, false); o += 2;
      const height = dv.getUint16(o, false); o += 2;
      const pressure = dv.getUint16(o, false) / 0xffff; o += 2;
      const buttons = dv.getUint32(o, false);
      const pointerId = (BigInt(pointerHigh) << 32n) | BigInt(pointerLow);
      return { kind: 'touch', action, pointerId, x, y, width, height, pressure, buttons };
    }
    case ClientControlType.Scroll: {
      if (buf.byteLength < 21) return undefined;
      const x = dv.getUint32(o, false); o += 4;
      const y = dv.getUint32(o, false); o += 4;
      const width = dv.getUint16(o, false); o += 2;
      const height = dv.getUint16(o, false); o += 2;
      const hScroll = dv.getInt32(o, false); o += 4;
      const vScroll = dv.getInt32(o, false); o += 4;
      return { kind: 'scroll', x, y, width, height, scrollX: hScroll, scrollY: vScroll, buttons: 0 };
    }
    case ClientControlType.SetClipboard: {
      if (buf.byteLength < 6) return undefined;
      const paste = dv.getUint8(o++) !== 0;
      const len = dv.getUint32(o, false); o += 4;
      if (buf.byteLength < o + len) return undefined;
      const text = new TextDecoder().decode(buf.subarray(o, o + len));
      return { kind: 'clipboard', text, paste };
    }
    case ClientControlType.SetScreenPowerMode: {
      if (buf.byteLength < 2) return undefined;
      return { kind: 'screenPower', mode: dv.getUint8(1) };
    }
    case ClientControlType.UhidKeyboard: {
      if (buf.byteLength < 3) return undefined;
      const action = dv.getUint8(o++);
      const usage = dv.getUint8(o);
      return { kind: 'uhidKeyboard', action, usage };
    }
    case ClientControlType.UhidTouch: {
      if (buf.byteLength < 24) return undefined;
      const action = dv.getUint8(o++);
      const pointerHigh = dv.getUint32(o, false); o += 4;
      const pointerLow = dv.getUint32(o, false); o += 4;
      const x = dv.getUint32(o, false); o += 4;
      const y = dv.getUint32(o, false); o += 4;
      const width = dv.getUint16(o, false); o += 2;
      const height = dv.getUint16(o, false); o += 2;
      const pressure = dv.getUint16(o, false) / 0xffff;
      const pointerId = (BigInt(pointerHigh) << 32n) | BigInt(pointerLow);
      return { kind: 'uhidTouch', action, pointerId, x, y, width, height, pressure };
    }
    default:
      return undefined;
  }
}
