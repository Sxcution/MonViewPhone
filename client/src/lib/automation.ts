import {
  encodeKeycodeMessage,
  encodeTextMessage,
  encodeTouchMessage,
  encodeSetClipboardMessage,
  KeyEventAction,
  MotionAction,
} from '@/lib/control';
import type { InputTarget } from '@/context/ActiveContext';

export const AUTOMATION_CLICK_EVENT = 'monviewphone:automation-click';
export const AUTOMATION_SWIPE_EVENT = 'monviewphone:automation-swipe';

export type AutomationClickDetail = {
  udid: string;
  x01: number;
  y01: number;
  x: number;
  y: number;
  width: number;
  height: number;
  timestamp: number;
};

export type AutomationSwipeDetail = {
  udid: string;
  startX01: number;
  startY01: number;
  endX01: number;
  endY01: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  height: number;
  durationMs: number;
  timestamp: number;
};

export function emitAutomationClick(detail: AutomationClickDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<AutomationClickDetail>(AUTOMATION_CLICK_EVENT, { detail }));
}

export function emitAutomationSwipe(detail: AutomationSwipeDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<AutomationSwipeDetail>(AUTOMATION_SWIPE_EVENT, { detail }));
}

export type AutomationStep =
  | { type: 'wait'; ms: number }
  | { type: 'tap'; x01: number; y01: number }
  | { type: 'swipe'; x1: number; y1: number; x2: number; y2: number; durationMs: number }
  | { type: 'key'; keycode: number }
  | { type: 'text'; text: string };

export type ParsedScript = {
  steps: AutomationStep[];
  errors: string[];
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function mapNormToDeviceXY(targetCanvas: HTMLCanvasElement, x01: number, y01: number) {
  const w = targetCanvas.width || 1;
  const h = targetCanvas.height || 1;
  const x = Math.max(0, Math.min(w, Math.round(x01 * w)));
  const y = Math.max(0, Math.min(h, Math.round(y01 * h)));
  return { x, y, w, h };
}

function sendSafe(t: InputTarget, u8: Uint8Array) {
  try {
    if (!t.ws || t.ws.readyState !== WebSocket.OPEN) return;
    t.ws.send(u8);
  } catch {
    // ignore
  }
}

export function parseScriptDsl(dsl: string, keyNameToCode: Record<string, number>): ParsedScript {
  const steps: AutomationStep[] = [];
  const errors: string[] = [];
  const lines = (dsl ?? '').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#') || line.startsWith('//')) continue;

    const parts = line.split(/\s+/);
    const cmd = (parts[0] ?? '').toLowerCase();

    const errPrefix = `Line ${i + 1}:`;
    const n = (x: string) => Number(x);

    if (cmd === 'wait') {
      const ms = n(parts[1] ?? '');
      if (!Number.isFinite(ms) || ms < 0) errors.push(`${errPrefix} wait <ms>`);
      else steps.push({ type: 'wait', ms: Math.floor(ms) });
      continue;
    }

    if (cmd === 'tap') {
      const x01 = n(parts[1] ?? '');
      const y01 = n(parts[2] ?? '');
      if (!Number.isFinite(x01) || !Number.isFinite(y01)) errors.push(`${errPrefix} tap <x01> <y01>`);
      else steps.push({ type: 'tap', x01: clamp01(x01), y01: clamp01(y01) });
      continue;
    }

    if (cmd === 'swipe') {
      const x1 = n(parts[1] ?? '');
      const y1 = n(parts[2] ?? '');
      const x2 = n(parts[3] ?? '');
      const y2 = n(parts[4] ?? '');
      const dur = n(parts[5] ?? '');
      if (![x1, y1, x2, y2, dur].every((v) => Number.isFinite(v))) {
        errors.push(`${errPrefix} swipe <x1> <y1> <x2> <y2> <durationMs>`);
      } else {
        steps.push({
          type: 'swipe',
          x1: clamp01(x1),
          y1: clamp01(y1),
          x2: clamp01(x2),
          y2: clamp01(y2),
          durationMs: Math.max(0, Math.floor(dur)),
        });
      }
      continue;
    }

    if (cmd === 'key') {
      const keyRaw = (parts[1] ?? '').trim();
      if (!keyRaw) {
        errors.push(`${errPrefix} key <KEYCODE|NAME>`);
        continue;
      }
      const asNum = Number(keyRaw);
      if (Number.isFinite(asNum)) {
        steps.push({ type: 'key', keycode: Math.floor(asNum) });
        continue;
      }
      const k = keyRaw.toUpperCase();
      const code = keyNameToCode[k];
      if (!Number.isFinite(code)) errors.push(`${errPrefix} unknown key name "${keyRaw}"`);
      else steps.push({ type: 'key', keycode: code });
      continue;
    }

    if (cmd === 'text') {
      // Keep spaces: everything after first space is the text.
      const text = raw.slice(raw.indexOf(' ') + 1);
      if (!text || text.trim().length === 0) errors.push(`${errPrefix} text <your text...>`);
      else steps.push({ type: 'text', text });
      continue;
    }

    errors.push(`${errPrefix} unknown command "${parts[0]}"`);
  }

  return { steps, errors };
}

import { loadSyncMacroSettings, syncMacroDelayRangeMs, type SyncMacroSettings } from './syncMacroSettings';

function randomInt(min: number, max: number) {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.floor(low + Math.random() * (high - low + 1));
}

function randomSignedOffset(settings: SyncMacroSettings) {
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

export async function runScript(
  targets: InputTarget[],
  steps: AutomationStep[],
  opts?: { signal?: AbortSignal; log?: (msg: string) => void },
) {
  const log = opts?.log ?? (() => {});
  if (!targets.length) {
    log('Lỗi: không có mục tiêu (targets rỗng)');
    return;
  }

  const syncSettings = loadSyncMacroSettings();
  const orderedTargets = (syncSettings.delayEnabled && syncSettings.randomOrder) 
    ? shuffleTargets(targets) 
    : targets;
  
  const { minMs, maxMs } = syncMacroDelayRangeMs(syncSettings.intervalSec);

  const applyStaggerDelay = async (i: number) => {
    if (syncSettings.delayEnabled && i > 0) {
      if (syncSettings.intervalEnabled) {
        await sleep(randomInt(minMs, maxMs));
      } else {
        await sleep(100);
      }
    }
  };

  for (const step of steps) {
    if (opts?.signal?.aborted) {
      log('Script aborted');
      return;
    }

    if (step.type === 'wait') {
      log(`wait ${step.ms}`);
      await sleep(step.ms);
      continue;
    }

    if (step.type === 'key') {
      log(`key ${step.keycode} -> ${targets.length} target(s)`);
      for (let i = 0; i < orderedTargets.length; i++) {
        if (opts?.signal?.aborted) return;
        await applyStaggerDelay(i);
        const t = orderedTargets[i];
        sendSafe(t, encodeKeycodeMessage(KeyEventAction.DOWN, step.keycode));
        sendSafe(t, encodeKeycodeMessage(KeyEventAction.UP, step.keycode));
      }
      await sleep(50);
      continue;
    }

    if (step.type === 'text') {
      log(`text (${step.text.length} chars) -> ${targets.length} target(s)`);
      const u8 = encodeTextMessage(step.text);
      for (let i = 0; i < orderedTargets.length; i++) {
        if (opts?.signal?.aborted) return;
        await applyStaggerDelay(i);
        const t = orderedTargets[i];
        sendSafe(t, u8);
      }
      await sleep(80);
      continue;
    }

    if (step.type === 'tap') {
      log(`tap ${step.x01.toFixed(3)} ${step.y01.toFixed(3)}`);
      for (let i = 0; i < orderedTargets.length; i++) {
        if (opts?.signal?.aborted) return;
        await applyStaggerDelay(i);
        const t = orderedTargets[i];
        const dxPx = syncSettings.delayEnabled ? randomSignedOffset(syncSettings) : 0;
        const dyPx = syncSettings.delayEnabled ? randomSignedOffset(syncSettings) : 0;
        
        let { x, y, w, h } = mapNormToDeviceXY(t.canvas, step.x01, step.y01);
        x = Math.max(0, Math.min(w, x + dxPx));
        y = Math.max(0, Math.min(h, y + dyPx));
        
        sendSafe(t, encodeTouchMessage(MotionAction.DOWN, 0, x, y, w, h, 1, 1));
        await sleep(60);
        sendSafe(t, encodeTouchMessage(MotionAction.UP, 0, x, y, w, h, 0, 0));
      }
      await sleep(80);
      continue;
    }

    if (step.type === 'swipe') {
      const nMoves = Math.max(5, Math.min(60, Math.round(step.durationMs / 16)));
      log(`swipe ${step.x1.toFixed(3)} ${step.y1.toFixed(3)} -> ${step.x2.toFixed(3)} ${step.y2.toFixed(3)} (${step.durationMs}ms)`);
      
      for (let i = 0; i < orderedTargets.length; i++) {
        if (opts?.signal?.aborted) return;
        await applyStaggerDelay(i);
        const t = orderedTargets[i];
        const dxPx = syncSettings.delayEnabled ? randomSignedOffset(syncSettings) : 0;
        const dyPx = syncSettings.delayEnabled ? randomSignedOffset(syncSettings) : 0;
        
        const getXY = (x01: number, y01: number) => {
          let { x, y, w, h } = mapNormToDeviceXY(t.canvas, x01, y01);
          return { x: Math.max(0, Math.min(w, x + dxPx)), y: Math.max(0, Math.min(h, y + dyPx)), w, h };
        };

        const start = getXY(step.x1, step.y1);
        sendSafe(t, encodeTouchMessage(MotionAction.DOWN, 0, start.x, start.y, start.w, start.h, 1, 1));
        
        const startTime = Date.now();
        for (let j = 1; j < nMoves; j++) {
          if (opts?.signal?.aborted) return;
          const a = j / nMoves;
          const x01 = step.x1 + (step.x2 - step.x1) * a;
          const y01 = step.y1 + (step.y2 - step.y1) * a;
          const curr = getXY(x01, y01);
          sendSafe(t, encodeTouchMessage(MotionAction.MOVE, 0, curr.x, curr.y, curr.w, curr.h, 1, 1));
          
          const elapsed = Date.now() - startTime;
          const targetElapsed = (step.durationMs * j) / nMoves;
          const wait = Math.max(0, Math.round(targetElapsed - elapsed));
          if (wait) await sleep(wait);
        }

        const end = getXY(step.x2, step.y2);
        sendSafe(t, encodeTouchMessage(MotionAction.MOVE, 0, end.x, end.y, end.w, end.h, 1, 1));
        sendSafe(t, encodeTouchMessage(MotionAction.UP, 0, end.x, end.y, end.w, end.h, 0, 0));
      }
      await sleep(120);
      continue;
    }
  }

  log('Script done');
}
