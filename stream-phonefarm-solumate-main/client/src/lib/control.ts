export enum ControlMessageType {
  KEYCODE = 0,
  TEXT = 1,
  TOUCH = 2,
  SCROLL = 3,
  GET_CLIPBOARD = 8,
  SET_CLIPBOARD = 9,
}

export enum MotionAction {
  DOWN = 0,
  UP = 1,
  MOVE = 2,
}

export enum KeyEventAction {
  DOWN = 0,
  UP = 1,
}

export function clamp(n: number, min: number, max: number): number {
  return n < min ? min : n > max ? max : n;
}

export function encodeTouchMessage(
  action: MotionAction,
  pointerId: number,
  x: number,
  y: number,
  screenW: number,
  screenH: number,
  pressure01: number | undefined,
  buttons: number,
): Uint8Array {
  const buf = new ArrayBuffer(29);
  const dv = new DataView(buf);
  let o = 0;

  const p = clamp(pressure01 ?? 1, 0, 1);
  const pressureU16 = Math.round(p * 0xffff) & 0xffff;

  dv.setUint8(o++, ControlMessageType.TOUCH);
  dv.setUint8(o++, action & 0xff);

  dv.setUint32(o, 0, false);
  o += 4;
  dv.setUint32(o, pointerId >>> 0, false);
  o += 4;

  dv.setUint32(o, x >>> 0, false);
  o += 4;
  dv.setUint32(o, y >>> 0, false);
  o += 4;

  dv.setUint16(o, screenW & 0xffff, false);
  o += 2;
  dv.setUint16(o, screenH & 0xffff, false);
  o += 2;

  dv.setUint16(o, pressureU16, false);
  o += 2;

  dv.setUint32(o, buttons >>> 0, false);
  return new Uint8Array(buf);
}

export function encodeScrollMessage(
  x: number,
  y: number,
  screenW: number,
  screenH: number,
  hScroll: number,
  vScroll: number,
): Uint8Array {
  const buf = new ArrayBuffer(21);
  const dv = new DataView(buf);
  let o = 0;

  dv.setUint8(o++, ControlMessageType.SCROLL);
  dv.setUint32(o, x >>> 0, false);
  o += 4;
  dv.setUint32(o, y >>> 0, false);
  o += 4;
  dv.setUint16(o, screenW & 0xffff, false);
  o += 2;
  dv.setUint16(o, screenH & 0xffff, false);
  o += 2;
  dv.setInt32(o, hScroll | 0, false);
  o += 4;
  dv.setInt32(o, vScroll | 0, false);
  return new Uint8Array(buf);
}

export function encodeKeycodeMessage(
  action: KeyEventAction,
  keycode: number,
  repeat = 0,
  meta = 0,
): Uint8Array {
  const buf = new ArrayBuffer(14);
  const dv = new DataView(buf);
  let o = 0;
  dv.setUint8(o++, ControlMessageType.KEYCODE);
  dv.setUint8(o++, action & 0xff);
  dv.setUint32(o, keycode >>> 0, false);
  o += 4;
  dv.setUint32(o, repeat >>> 0, false);
  o += 4;
  dv.setUint32(o, meta >>> 0, false);
  return new Uint8Array(buf);
}

export function encodeTextMessage(text: string): Uint8Array {
  const enc = new TextEncoder();
  const bytes = enc.encode(text ?? '');
  const u8 = new Uint8Array(1 + bytes.length + 1);
  u8[0] = ControlMessageType.TEXT;
  u8.set(bytes, 1);
  u8[u8.length - 1] = 0;
  return u8;
}

export function encodeSetClipboardMessage(text: string, paste: boolean = false): Uint8Array {
  const enc = new TextEncoder();
  const bytes = enc.encode(text ?? '');
  const u8 = new Uint8Array(1 + 1 + 4 + bytes.length);
  const dv = new DataView(u8.buffer);
  dv.setUint8(0, ControlMessageType.SET_CLIPBOARD);
  // Optional sequence number? Wait, the server code `CommandControlMessage.ts` showed: format is type(1), paste(1), length(4), bytes.
  dv.setUint8(1, paste ? 1 : 0);
  dv.setUint32(2, bytes.length, false); // big endian
  u8.set(bytes, 6);
  return u8;
}
