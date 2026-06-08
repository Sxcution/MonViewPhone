import { clamp, encodeKeycodeMessage, encodeScrollMessage, encodeTouchMessage, KeyEventAction, MotionAction } from './control';
import type { InputTarget } from '@/context/ActiveContext';
import { AndroidKeycode } from './keyEvent';
import { emitAutomationClick, emitAutomationSwipe } from './automation';
import { loadSyncTimeSettings, syncTimeDelayRangeMs, type SyncTimeSettings } from './syncTimeSettings';

type TargetsGetter = () => InputTarget[];

type TouchTarget = {
  target: InputTarget;
  dxPx: number;
  dyPx: number;
};

type ActivePointerState = {
  pid: number;
  // Normalized (0..1) coords from the source canvas, later mapped to each target device.
  startClient: { x: number; y: number };
  startXY: { x01: number; y01: number };
  lastXY: { x01: number; y01: number };
  lastButtons: number;
  dirty: boolean;
  isolated: boolean;
  downTimestamp: number;
  touchTargets: TouchTarget[];
  delayedFollowers: TouchTarget[];
  syncSettings: SyncTimeSettings;
};

function makePointerIdAllocator() {
  const idToPointer = new Map<number, number>();
  const pointerToId = new Map<number, number>();
  function alloc(browserPointerId: number): number {
    if (idToPointer.has(browserPointerId)) return idToPointer.get(browserPointerId)!;
    let pid = 0;
    while (pointerToId.has(pid)) pid++;
    idToPointer.set(browserPointerId, pid);
    pointerToId.set(pid, browserPointerId);
    return pid;
  }
  function free(browserPointerId: number) {
    const pid = idToPointer.get(browserPointerId);
    if (pid == null) return;
    idToPointer.delete(browserPointerId);
    pointerToId.delete(pid);
  }
  return { alloc, free };
}

function mapClientToNormXY(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  const cw = rect.width || canvas.clientWidth || 1;
  const ch = rect.height || canvas.clientHeight || 1;

  const x01 = (clientX - rect.left) / cw;
  const y01 = (clientY - rect.top) / ch;

  return { x01, y01 };
}

function mapNormToDeviceXY(targetCanvas: HTMLCanvasElement, x01: number, y01: number) {
  const w = targetCanvas.width || 1;
  const h = targetCanvas.height || 1;
  const x = clamp(Math.round(x01 * w), 0, w);
  const y = clamp(Math.round(y01 * h), 0, h);
  return { x, y, w, h };
}

function mapNormToDeviceXYWithOffset(targetCanvas: HTMLCanvasElement, x01: number, y01: number, dxPx: number, dyPx: number) {
  const base = mapNormToDeviceXY(targetCanvas, x01, y01);
  return {
    ...base,
    x: clamp(base.x + dxPx, 0, base.w),
    y: clamp(base.y + dyPx, 0, base.h),
  };
}

function isOpenTarget(t: InputTarget) {
  return Boolean(t.ws && t.ws.readyState === WebSocket.OPEN && t.canvas);
}

function sleep(ms: number) {
  return new Promise<void>(resolve => window.setTimeout(resolve, Math.max(0, ms)));
}

function randomInt(min: number, max: number) {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.floor(low + Math.random() * (high - low + 1));
}

function randomSignedOffset(settings: SyncTimeSettings) {
  if (!settings.offsetEnabled || settings.offsetMaxPx <= 0) return 0;
  const magnitude = randomInt(settings.offsetMinPx, settings.offsetMaxPx);
  if (magnitude === 0) return 0;
  return Math.random() < 0.5 ? -magnitude : magnitude;
}

function shuffleTargets<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = out[i];
    out[i] = out[j];
    out[j] = temp;
  }
  return out;
}

export function attachTouchControls(
  canvas: HTMLCanvasElement,
  getTargets: TargetsGetter,
  onActivate?: () => void,
  udid?: string,
): () => void {
  const ptr = makePointerIdAllocator();
  const active = new Map<number, ActivePointerState>();
  let raf = 0;

  function canSend() {
    const targets = getTargets();
    return targets.some((t) => t.ws && t.ws.readyState === WebSocket.OPEN);
  }

  function prepareTouchTargets(isolated: boolean, settings: SyncTimeSettings) {
    const targets = getTargets().filter(isOpenTarget);
    const sourceIndex = targets.findIndex((t) => (udid ? t.udid === udid : false) || t.canvas === canvas);
    const source = sourceIndex >= 0 ? targets[sourceIndex] : targets[0];
    if (!source) return { source: null as TouchTarget | null, followers: [] as TouchTarget[] };

    const makeTouchTarget = (target: InputTarget, isSource: boolean): TouchTarget => ({
      target,
      dxPx: isSource ? 0 : randomSignedOffset(settings),
      dyPx: isSource ? 0 : randomSignedOffset(settings),
    });

    if (isolated) return { source: makeTouchTarget(source, true), followers: [] };

    const rawFollowers = targets.filter((_, index) => index !== (sourceIndex >= 0 ? sourceIndex : 0));
    console.log('[SyncTime] settings:', settings);
    console.log('[SyncTime] rawFollowers:', rawFollowers.map(f => f.udid));
    const shuffledRaw = settings.randomOrder ? shuffleTargets(rawFollowers) : rawFollowers;
    console.log('[SyncTime] final queue:', shuffledRaw.map(f => f.udid));
    
    const followers = shuffledRaw.map(target => makeTouchTarget(target, false));
    return { source: makeTouchTarget(source, true), followers };
  }

  function sendTouch(tt: TouchTarget, action: MotionAction, pid: number, x01: number, y01: number, pressure: number, buttons: number) {
    if (!isOpenTarget(tt.target)) return;
    const { x, y, w, h } = mapNormToDeviceXYWithOffset(tt.target.canvas, x01, y01, tt.dxPx, tt.dyPx);
    try {
      tt.target.ws.send(encodeTouchMessage(action, pid, x, y, w, h, pressure, buttons));
    } catch {
      // ignore
    }
  }

  function sendToTargets(makeMsg: (t: InputTarget) => Uint8Array, isolated: boolean = false) {
    const targets = getTargets();
    for (const t of targets) {
      if (isolated && t.canvas !== canvas) continue; // Chỉ gửi cho canvas hiện tại
      if (!t.ws || t.ws.readyState !== WebSocket.OPEN) continue;
      try {
        t.ws.send(makeMsg(t));
      } catch {
        // ignore
      }
    }
  }

  function sendBackKey(isolated: boolean = false) {
    const down = encodeKeycodeMessage(KeyEventAction.DOWN, AndroidKeycode.KEYCODE_BACK);
    const up = encodeKeycodeMessage(KeyEventAction.UP, AndroidKeycode.KEYCODE_BACK);
    sendToTargets(() => down, isolated);

    // Thêm độ trễ để Android kịp ghi nhận sự kiện nhấn phím
    setTimeout(() => {
      sendToTargets(() => up, isolated);
    }, 30);
  }

  async function replayDelayedTap(tt: TouchTarget, pid: number, x01: number, y01: number) {
    sendTouch(tt, MotionAction.DOWN, pid, x01, y01, 1, 1);
    await sleep(60);
    sendTouch(tt, MotionAction.UP, pid, x01, y01, 0, 0);
    await sleep(80);
  }

  async function replayDelayedSwipe(tt: TouchTarget, pid: number, startXY: { x01: number; y01: number }, endXY: { x01: number; y01: number }, durationMs: number) {
    const cleanDuration = Math.max(50, durationMs);
    const nMoves = Math.max(5, Math.min(60, Math.round(cleanDuration / 16)));
    sendTouch(tt, MotionAction.DOWN, pid, startXY.x01, startXY.y01, 1, 1);
    const start = Date.now();
    for (let i = 1; i < nMoves; i++) {
      const a = i / nMoves;
      const x01 = startXY.x01 + (endXY.x01 - startXY.x01) * a;
      const y01 = startXY.y01 + (endXY.y01 - startXY.y01) * a;
      sendTouch(tt, MotionAction.MOVE, pid, x01, y01, 1, 1);
      const elapsed = Date.now() - start;
      const targetElapsed = (cleanDuration * i) / nMoves;
      const wait = Math.max(0, Math.round(targetElapsed - elapsed));
      if (wait) await sleep(wait);
    }
    sendTouch(tt, MotionAction.MOVE, pid, endXY.x01, endXY.y01, 1, 1);
    sendTouch(tt, MotionAction.UP, pid, endXY.x01, endXY.y01, 0, 0);
    await sleep(120);
  }

  async function replayDelayedFollowers(st: ActivePointerState, endXY: { x01: number; y01: number }, movedPx: number, durationMs: number) {
    if (!st.delayedFollowers.length) return;
    const { minMs, maxMs } = syncTimeDelayRangeMs(st.syncSettings.intervalSec);
    
    for (const follower of st.delayedFollowers) {
      if (st.syncSettings.intervalEnabled) {
        await sleep(randomInt(minMs, maxMs));
      } else {
        // Run sequentially with a tiny 100ms gap when interval delay is disabled
        await sleep(100);
      }
      if (movedPx <= 8) {
        await replayDelayedTap(follower, st.pid, endXY.x01, endXY.y01);
      } else {
        await replayDelayedSwipe(follower, st.pid, st.startXY, endXY, durationMs);
      }
    }
  }

  function scheduleMoveFlush() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!canSend()) return;
      for (const st of active.values()) {
        if (!st.dirty) continue;
        st.dirty = false;
        const { x01, y01 } = st.lastXY;
        for (const tt of st.touchTargets) {
          sendTouch(tt, MotionAction.MOVE, st.pid, x01, y01, 1, st.lastButtons);
        }
      }
    });
  }

  function onPointerDown(e: PointerEvent) {
    // Chặn luồng thao tác và nhường lại quyền cho hệ thống Chọn (App.tsx => onClick) nếu đè Ctrl
    if (e.ctrlKey || e.metaKey) return;
    if (e.button === 1 || (e.buttons & 4) === 4) return;

    if (!canSend()) return;
    e.preventDefault();
    onActivate?.();

    const isolated = e.altKey;
    if (e.button === 2) {
      sendBackKey(isolated);
      return;
    }
    if (((e.buttons ?? 0) & 2) === 2) return;

    canvas.focus?.();
    canvas.setPointerCapture?.(e.pointerId);

    const pid = ptr.alloc(e.pointerId);
    const { x01, y01 } = mapClientToNormXY(canvas, e.clientX, e.clientY);
    const buttons = e.buttons ?? 0;
    const syncSettings = loadSyncTimeSettings();
    const prepared = prepareTouchTargets(isolated, syncSettings);
    if (!prepared.source) return;
    const slowSync = syncSettings.delayEnabled && prepared.followers.length > 0;
    const touchTargets = slowSync ? [prepared.source] : [prepared.source, ...prepared.followers];

    active.set(e.pointerId, {
      pid,
      startClient: { x: e.clientX, y: e.clientY },
      startXY: { x01, y01 },
      lastXY: { x01, y01 },
      lastButtons: buttons,
      dirty: false,
      isolated,
      downTimestamp: Date.now(),
      touchTargets,
      delayedFollowers: slowSync ? prepared.followers : [],
      syncSettings,
    });

    for (const tt of touchTargets) {
      sendTouch(tt, MotionAction.DOWN, pid, x01, y01, 1, buttons);
    }
  }

  function onPointerMove(e: PointerEvent) {
    if ((e.buttons & 4) === 4) return;
    if (!active.has(e.pointerId)) {
      if (((e.buttons ?? 0) & 2) === 2) {
        e.preventDefault();
        return;
      }
      if (((e.buttons ?? 0) | 0) !== 0 && canSend()) onPointerDown(e);
      return;
    }
    e.preventDefault();

    const st = active.get(e.pointerId)!;
    const { x01, y01 } = mapClientToNormXY(canvas, e.clientX, e.clientY);
    st.lastXY = { x01, y01 };
    st.lastButtons = e.buttons ?? st.lastButtons;
    st.dirty = true;

    scheduleMoveFlush();
  }

  function onPointerUpOrCancel(e: PointerEvent) {
    const st = active.get(e.pointerId);
    if (!st) return;
    e.preventDefault();

    const { x01, y01 } = mapClientToNormXY(canvas, e.clientX, e.clientY);

    if (st.dirty && canSend()) {
      st.dirty = false;
      for (const tt of st.touchTargets) {
        sendTouch(tt, MotionAction.MOVE, st.pid, x01, y01, 1, st.lastButtons);
      }
    }

    for (const tt of st.touchTargets) {
      sendTouch(tt, MotionAction.UP, st.pid, x01, y01, 0, 0);
    }

    const movedPx = Math.hypot(e.clientX - st.startClient.x, e.clientY - st.startClient.y);
    const durationMs = Math.max(50, Date.now() - st.downTimestamp);
    if (udid && movedPx <= 8) {
      const { x, y, w, h } = mapNormToDeviceXY(canvas, x01, y01);
      emitAutomationClick({
        udid,
        x01,
        y01,
        x,
        y,
        width: w,
        height: h,
        timestamp: Date.now(),
      });
    } else if (udid && movedPx > 8) {
      const startMapped = mapNormToDeviceXY(canvas, st.startXY.x01, st.startXY.y01);
      const endMapped = mapNormToDeviceXY(canvas, x01, y01);
      emitAutomationSwipe({
        udid,
        startX01: st.startXY.x01,
        startY01: st.startXY.y01,
        endX01: x01,
        endY01: y01,
        startX: startMapped.x,
        startY: startMapped.y,
        endX: endMapped.x,
        endY: endMapped.y,
        width: endMapped.w,
        height: endMapped.h,
        durationMs,
        timestamp: Date.now(),
      });
    }

    void replayDelayedFollowers(st, { x01, y01 }, movedPx, durationMs);

    active.delete(e.pointerId);
    ptr.free(e.pointerId);
  }

  function onWheel(e: WheelEvent) {
    if (!canSend()) return;
    e.preventDefault();
    onActivate?.();

    const { x01, y01 } = mapClientToNormXY(canvas, e.clientX, e.clientY);
    const hScroll = e.deltaX > 0 ? -1 : e.deltaX < 0 ? 1 : 0;
    const vScroll = e.deltaY > 0 ? -1 : e.deltaY < 0 ? 1 : 0;
    if (hScroll === 0 && vScroll === 0) return;

    sendToTargets((t) => {
      const { x, y, w, h } = mapNormToDeviceXY(t.canvas, x01, y01);
      return encodeScrollMessage(x, y, w, h, hScroll, vScroll);
    }, e.altKey);
  }

  const onContextMenu = (e: Event) => {
    e.preventDefault();
  };

  canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
  canvas.addEventListener('pointermove', onPointerMove, { passive: false });
  canvas.addEventListener('pointerup', onPointerUpOrCancel, { passive: false });
  canvas.addEventListener('pointercancel', onPointerUpOrCancel, { passive: false });
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', onContextMenu);

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUpOrCancel);
    canvas.removeEventListener('pointercancel', onPointerUpOrCancel);
    canvas.removeEventListener('wheel', onWheel);
    canvas.removeEventListener('contextmenu', onContextMenu);
  };
}
