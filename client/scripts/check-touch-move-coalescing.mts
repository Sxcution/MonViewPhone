import assert from 'node:assert/strict';
import { createServer } from 'vite';

type FrameCallback = (now: number) => void;
const frameCallbacks = new Map<number, FrameCallback>();
let nextFrameId = 1;
let storedSettings: string | null = null;

Object.assign(globalThis, {
  WebSocket: { OPEN: 1 },
  localStorage: { getItem: () => storedSettings },
  requestAnimationFrame(callback: FrameCallback) {
    const id = nextFrameId++;
    frameCallbacks.set(id, callback);
    return id;
  },
  cancelAnimationFrame(id: number) {
    frameCallbacks.delete(id);
  },
});

function runFrame(now: number) {
  const callbacks = [...frameCallbacks.values()];
  frameCallbacks.clear();
  for (const callback of callbacks) callback(now);
}

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { attachTouchControls } = await vite.ssrLoadModule('/src/lib/touchControls.ts');
  const listeners = new Map<string, (event: any) => void>();
  const canvas = {
    width: 100,
    height: 200,
    clientWidth: 100,
    clientHeight: 200,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 200 }),
    addEventListener: (type: string, listener: (event: any) => void) => listeners.set(type, listener),
    removeEventListener: (type: string) => listeners.delete(type),
    focus() {},
    setPointerCapture() {},
  };
  const sent = [[], []] as Uint8Array[][];
  const targets = sent.map((messages) => ({
    canvas,
    controlMode: { mouseMode: 'sdk' },
    ws: { readyState: 1, send: (message: Uint8Array) => messages.push(message) },
  }));
  const fire = (type: string, x: number) => listeners.get(type)!({
    pointerId: 7,
    clientX: x,
    clientY: 20,
    button: 0,
    buttons: type === 'pointerup' ? 0 : 1,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    preventDefault() {},
  });

  const detach = attachTouchControls(canvas, () => targets);
  fire('pointerdown', 10);
  fire('pointermove', 20);
  fire('pointermove', 30);
  assert.equal(frameCallbacks.size, 1);

  runFrame(100);
  assert.deepEqual(sent[0].map((message) => message[1]), [0, 2]);
  assert.deepEqual(sent[1].map((message) => message[1]), [0, 2]);

  fire('pointermove', 40);
  runFrame(116);
  assert.equal(sent[0].length, 2);
  assert.equal(frameCallbacks.size, 1);

  runFrame(134);
  assert.deepEqual(sent[0].map((message) => message[1]), [0, 2, 2]);

  fire('pointermove', 50);
  fire('pointerup', 60);
  assert.deepEqual(sent[0].map((message) => message[1]), [0, 2, 2, 2, 1]);
  assert.deepEqual(sent[1].map((message) => message[1]), [0, 2, 2, 2, 1]);

  runFrame(150);
  assert.equal(sent[0].length, 5);
  detach();

  storedSettings = JSON.stringify({ delayEnabled: true });
  for (const messages of sent) messages.length = 0;
  const detachDelayedSync = attachTouchControls(canvas, () => targets);
  fire('pointerdown', 10);
  fire('pointermove', 20);
  runFrame(200);
  fire('pointermove', 30);
  runFrame(216);
  assert.deepEqual(sent[0].map((message) => message[1]), [0, 2, 2]);
  assert.equal(sent[1].length, 0);
  detachDelayedSync();

  console.log('Touch MOVE broadcast coalescing self-check passed');
} finally {
  await vite.close();
}
