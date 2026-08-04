import assert from 'node:assert/strict';
import { makeTangoStreamUrl, parseTangoPacket } from '../src/stream/tango/TangoProtocol.ts';

const streamUrl = new URL(makeTangoStreamUrl({
  udid: 'device-1',
  bitrate: 2_000_000,
  maxFps: 30,
  iFrameInterval: 2,
  maxSize: 720,
  displayId: 0,
}));
assert.equal(streamUrl.searchParams.get('iFrameInterval'), '2');

const backing = new ArrayBuffer(64);
const packetBytes = new Uint8Array(backing, 7, 27);
const header = new DataView(backing, packetBytes.byteOffset, packetBytes.byteLength);
header.setUint32(0, 0x4d565453, false);
header.setUint8(4, 1);
header.setUint8(5, 2);
header.setUint8(6, 1);
header.setBigUint64(8, 123n, false);
header.setUint32(16, 3, false);
packetBytes.set([0x65, 0xaa, 0xbb], 20);

const packet = parseTangoPacket(packetBytes);
assert(packet);
assert.equal(packet.type, 2);
assert.equal(packet.keyframe, true);
assert.equal(packet.timestampUs, 123);
assert.deepEqual([...packet.payload], [0x65, 0xaa, 0xbb]);
assert.equal(packet.payload.buffer, backing);
assert.equal(packet.payload.byteOffset, packetBytes.byteOffset + 20);

packetBytes[20] = 0x41;
assert.equal(packet.payload[0], 0x41);

header.setUint32(16, 8, false);
assert.equal(parseTangoPacket(packetBytes.subarray(0, 24)), null);

console.log('Tango MVTS v1 offset/zero-copy self-check passed');
