function isVclNalu(type: number): boolean {
  return type === 1 || type === 5;
}

export class AccessUnitAssembler {
  private pendingNalus: { type: number; data: Uint8Array }[] = [];
  private onFrame: (frameBytes: Uint8Array, isKey: boolean) => void;

  constructor(onFrame: (frameBytes: Uint8Array, isKey: boolean) => void) {
    this.onFrame = onFrame;
  }

  feedNalu(naluWithStartCode: Uint8Array) {
    // Determine the start code length (3 or 4 bytes)
    let startLen = 0;
    if (naluWithStartCode[2] === 0x01) {
      startLen = 3;
    } else if (naluWithStartCode[2] === 0x00 && naluWithStartCode[3] === 0x01) {
      startLen = 4;
    }
    
    if (naluWithStartCode.length <= startLen) return;
    
    const naluData = naluWithStartCode.subarray(startLen);
    const type = naluData[0] & 0x1f;

    // Detect frame boundaries
    const hasVcl = this.pendingNalus.some(n => isVclNalu(n.type));
    const isHeader = type === 7 || type === 8 || type === 9 || type === 6;

    if (hasVcl && (isHeader || isVclNalu(type))) {
      // Flush currently accumulated NALUs as a complete Access Unit
      this.flush();
    }

    this.pendingNalus.push({ type, data: naluWithStartCode });
  }

  flush() {
    if (this.pendingNalus.length === 0) return;

    let totalLength = 0;
    for (const n of this.pendingNalus) {
      totalLength += n.data.length;
    }

    const frameBytes = new Uint8Array(totalLength);
    let offset = 0;
    let isKey = false;

    for (const n of this.pendingNalus) {
      frameBytes.set(n.data, offset);
      offset += n.data.length;
      if (n.type === 5) {
        isKey = true;
      }
    }

    this.onFrame(frameBytes, isKey);
    this.pendingNalus = [];
  }

  reset() {
    this.pendingNalus = [];
  }
}
