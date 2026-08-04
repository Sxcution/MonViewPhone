import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

import { ServerPacketType } from './protocol.js';

export type VideoBackpressureAction = 'send' | 'hold-configuration' | 'drop-video' | 'recover';

export class VideoBackpressureGate {
  congested = false;
  droppedFrames = 0;
  droppedSinceCongestion = 0;

  constructor(readonly highWater: number, readonly lowWater: number) {
    if (!Number.isFinite(highWater) || !Number.isFinite(lowWater) || lowWater < 0 || highWater <= lowWater) {
      throw new Error(`invalid WebSocket water marks: high=${highWater}, low=${lowWater}`);
    }
  }

  decide(packetType: ServerPacketType, keyframe: boolean, bufferedAmount: number, hasConfiguration: boolean): VideoBackpressureAction {
    if (!this.congested && bufferedAmount >= this.highWater) {
      this.congested = true;
      this.droppedSinceCongestion = 0;
    }

    if (packetType === ServerPacketType.VideoConfiguration) {
      return this.congested ? 'hold-configuration' : 'send';
    }
    if (!this.congested) return 'send';
    if (bufferedAmount <= this.lowWater && keyframe && hasConfiguration) {
      this.congested = false;
      return 'recover';
    }

    this.droppedFrames += 1;
    this.droppedSinceCongestion += 1;
    return 'drop-video';
  }
}

function selfCheck() {
  const gate = new VideoBackpressureGate(100, 20);
  assert.equal(gate.decide(ServerPacketType.VideoData, true, 0, true), 'send');
  assert.equal(gate.congested, false, 'a large current packet is not existing WebSocket backlog');
  assert.equal(gate.decide(ServerPacketType.VideoConfiguration, true, 100, false), 'hold-configuration');
  assert.equal(gate.congested, true, 'configuration key flag must not recover the stream');
  assert.equal(gate.decide(ServerPacketType.VideoData, true, 20, false), 'drop-video');
  assert.equal(gate.decide(ServerPacketType.VideoData, false, 10, true), 'drop-video');
  assert.equal(gate.decide(ServerPacketType.VideoData, true, 21, true), 'drop-video');
  assert.equal(gate.decide(ServerPacketType.VideoData, true, 20, true), 'recover');
  assert.equal(gate.decide(ServerPacketType.VideoData, false, 0, true), 'send');
  assert.equal(gate.droppedFrames, 3);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  selfCheck();
  console.log('video backpressure self-check passed');
}
