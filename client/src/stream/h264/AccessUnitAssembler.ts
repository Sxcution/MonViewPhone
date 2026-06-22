import { concatU8 } from '@/lib/bytes';

interface NaluInfo {
  type: number;
  data: Uint8Array; // includes start code
}

function parseNalus(packet: Uint8Array): NaluInfo[] {
  const nalus: NaluInfo[] = [];
  let pos = 0;
  
  while (pos < packet.length) {
    // Find start code
    let startLen = 0;
    if (pos + 2 < packet.length && packet[pos] === 0x00 && packet[pos + 1] === 0x00 && packet[pos + 2] === 0x01) {
      startLen = 3;
    } else if (pos + 3 < packet.length && packet[pos] === 0x00 && packet[pos + 1] === 0x00 && packet[pos + 2] === 0x00 && packet[pos + 3] === 0x01) {
      startLen = 4;
    }
    
    if (startLen === 0) {
      pos++;
      continue;
    }
    
    // Find next start code
    let nextStart = -1;
    for (let i = pos + startLen; i + 2 < packet.length; i++) {
      if (packet[i] === 0x00 && packet[i + 1] === 0x00) {
        if (packet[i + 2] === 0x01) {
          nextStart = i;
          break;
        }
        if (i + 3 < packet.length && packet[i + 2] === 0x00 && packet[i + 3] === 0x01) {
          nextStart = i;
          break;
        }
      }
    }
    
    const end = nextStart === -1 ? packet.length : nextStart;
    const naluData = packet.subarray(pos, end);
    const type = naluData[startLen] & 0x1f;
    
    nalus.push({ type, data: naluData });
    pos = end;
  }
  
  return nalus;
}

export class AccessUnitAssembler {
  private onFrame: (frameBytes: Uint8Array, isKey: boolean) => void;
  private cachedSps: Uint8Array | null = null;
  private cachedPps: Uint8Array | null = null;

  constructor(onFrame: (frameBytes: Uint8Array, isKey: boolean) => void) {
    this.onFrame = onFrame;
  }

  feedPacket(packet: Uint8Array) {
    const nalus = parseNalus(packet);
    if (nalus.length === 0) return;

    let hasVcl = false;
    let isKey = false;
    let hasSps = false;
    let hasPps = false;

    for (const n of nalus) {
      console.log(`[WebCodecs Debug] NAL type: ${n.type}`);
      if (n.type === 7) {
        this.cachedSps = n.data;
        hasSps = true;
        console.log(`[WebCodecs Debug] SPS detected`);
      } else if (n.type === 8) {
        this.cachedPps = n.data;
        hasPps = true;
        console.log(`[WebCodecs Debug] PPS detected`);
      } else if (n.type === 5) {
        isKey = true;
        hasVcl = true;
        console.log(`[WebCodecs Debug] IDR detected`);
      } else if (n.type === 1) {
        hasVcl = true;
      }
    }

    if (!hasVcl) {
      // Packet has only headers (SPS/PPS), do not emit it as a frame
      console.log(`[WebCodecs Debug] Packet contains no VCL NALs, skipping emit`);
      return;
    }

    // It has VCL, so we assemble the complete Access Unit
    if (isKey) {
      // If it's a keyframe, ensure it contains SPS + PPS + IDR
      if (hasSps && hasPps) {
        // Already contains SPS and PPS, emit as is
        console.log(`[WebCodecs Debug] Keyframe access unit contains SPS + PPS + IDR`);
        this.onFrame(packet, true);
      } else {
        // Prepend cached SPS/PPS
        if (this.cachedSps && this.cachedPps) {
          console.log(`[WebCodecs Debug] Prepending cached SPS + PPS to IDR keyframe`);
          const assembled = concatU8(concatU8(this.cachedSps, this.cachedPps), packet);
          this.onFrame(assembled, true);
        } else {
          // No cached SPS/PPS yet, emit as is (might fail decoding but we have no choice)
          console.log(`[WebCodecs Debug] Keyframe missing SPS/PPS and no cached SPS/PPS available`);
          this.onFrame(packet, true);
        }
      }
    } else {
      // P-frame, emit as is
      this.onFrame(packet, false);
    }
  }

  reset() {
    this.cachedSps = null;
    this.cachedPps = null;
  }
}
