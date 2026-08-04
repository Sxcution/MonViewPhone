import assert from 'node:assert/strict';
import { Canvas2DVideoFrameRenderer } from '../src/stream/render/Canvas2DVideoFrameRenderer.ts';

type FakeFrame = {
  name: string;
  displayWidth: number;
  displayHeight: number;
  closed: number;
  close(): void;
};

const scheduled = new Map<number, FrameRequestCallback>();
let nextRequest = 1;
globalThis.requestAnimationFrame = (callback) => {
  const request = nextRequest++;
  scheduled.set(request, callback);
  return request;
};
globalThis.cancelAnimationFrame = (request) => {
  scheduled.delete(request);
};

function flushFrame() {
  const callbacks = [...scheduled.values()];
  scheduled.clear();
  callbacks.forEach((callback) => callback(performance.now()));
}

function makeFrame(name: string): FakeFrame {
  return {
    name,
    displayWidth: 100,
    displayHeight: 200,
    closed: 0,
    close() {
      this.closed++;
    },
  };
}

const drawn: string[] = [];
let drawError: Error | null = null;
const context = {
  drawImage(frame: FakeFrame) {
    if (drawError) throw drawError;
    drawn.push(frame.name);
  },
  clearRect() {},
};
const canvas = {
  width: 0,
  height: 0,
  getContext: () => context,
} as unknown as HTMLCanvasElement;
const renderer = new Canvas2DVideoFrameRenderer(canvas);

const first = makeFrame('first');
const latest = makeFrame('latest');
let firstPresented = 0;
let latestPresented = 0;
renderer.draw(first as unknown as VideoFrame, () => firstPresented++);
renderer.draw(latest as unknown as VideoFrame, () => latestPresented++);

assert.equal(scheduled.size, 1);
assert.equal(first.closed, 1);
assert.equal(latest.closed, 0);
flushFrame();
assert.deepEqual(drawn, ['latest']);
assert.equal(firstPresented, 0);
assert.equal(latestPresented, 1);
assert.equal(latest.closed, 1);

const failed = makeFrame('failed');
drawError = new Error('draw failed');
let reportedError: unknown;
renderer.draw(
  failed as unknown as VideoFrame,
  () => assert.fail('failed frame must not be presented'),
  (error) => { reportedError = error; },
);
flushFrame();
assert.equal(reportedError, drawError);
assert.equal(failed.closed, 1);

drawError = null;
const discarded = makeFrame('discarded');
renderer.draw(discarded as unknown as VideoFrame);
renderer.close();
assert.equal(discarded.closed, 1);
assert.equal(scheduled.size, 0);

console.log('Canvas latest-frame renderer self-check passed');
