export const TANGO_STREAM_NODE_WS = 'ws://127.0.0.1:11080';

export const enum TangoPacketType {
  VideoConfiguration = 1,
  VideoData = 2,
}

export type TangoVideoPacket = {
  type: TangoPacketType;
  keyframe: boolean;
  timestampUs: number;
  payload: Uint8Array;
};

const MAGIC = 0x4d565453; // MVTS
const HEADER_SIZE = 20;

export function makeTangoStreamUrl(args: {
  udid: string;
  bitrate: number;
  maxFps: number;
  iFrameInterval?: number;
  maxSize: number;
  displayId: number;
  encoderName?: string;
}): string {
  const u = new URL('/stream', TANGO_STREAM_NODE_WS);
  u.searchParams.set('udid', args.udid);
  u.searchParams.set('bitrate', String(args.bitrate));
  u.searchParams.set('maxFps', String(args.maxFps));
  if (args.iFrameInterval != null) {
    u.searchParams.set('iFrameInterval', String(args.iFrameInterval));
  }
  u.searchParams.set('maxSize', String(args.maxSize));
  u.searchParams.set('displayId', String(args.displayId));
  if (args.encoderName) {
    u.searchParams.set('encoder', args.encoderName);
  }
  return u.toString();
}

export function parseTangoPacket(data: ArrayBuffer | Uint8Array): TangoVideoPacket | null {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (bytes.byteLength < HEADER_SIZE) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (dv.getUint32(0, false) !== MAGIC) return null;
  const version = dv.getUint8(4);
  if (version !== 1) return null;

  const packetType = dv.getUint8(5) as TangoPacketType;
  const flags = dv.getUint8(6);
  const timestampUs = Number(dv.getBigUint64(8, false));
  const length = dv.getUint32(16, false);
  if (length > bytes.byteLength - HEADER_SIZE) return null;

  return {
    type: packetType,
    keyframe: (flags & 1) !== 0,
    timestampUs,
    payload: bytes.subarray(HEADER_SIZE, HEADER_SIZE + length),
  };
}
