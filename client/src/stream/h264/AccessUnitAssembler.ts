import { concatU8 } from '@/lib/bytes';

interface NaluInfo {
  type: number;
  data: Uint8Array; // includes start code
}

function parseNalus(packet: Uint8Array): NaluInfo[] {
  const nalus: NaluInfo[] = [];
  let pos = 0;

  while (pos < packet.length) {
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
      if (n.type === 7) {
        this.cachedSps = n.data;
        hasSps = true;
      } else if (n.type === 8) {
        this.cachedPps = n.data;
        hasPps = true;
      } else if (n.type === 5) {
        isKey = true;
        hasVcl = true;
      } else if (n.type === 1) {
        hasVcl = true;
      }
    }

    if (!hasVcl) return;

    if (isKey) {
      if (hasSps && hasPps) {
        this.onFrame(packet, true);
      } else if (this.cachedSps && this.cachedPps) {
        const assembled = concatU8(concatU8(this.cachedSps, this.cachedPps), packet);
        this.onFrame(assembled, true);
      } else {
        this.onFrame(packet, true);
      }
    } else {
      this.onFrame(packet, false);
    }
  }

  reset() {
    this.cachedSps = null;
    this.cachedPps = null;
  }
}
