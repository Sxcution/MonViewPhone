import type { AutomationStep } from '@/lib/automation'
import { AndroidKeycode } from '@/lib/keyEvent'
import {
  loadSeedingContents,
  type AutomationAppId,
  type AutomationMacroRow,
  type SavedAutomationMacro,
} from '@/lib/automationData'
import { saveAutomationSettingToBackend } from '@/lib/backendSettings'

export type MacroSortMode = 'name' | 'createdAt'

/* ── constants ── */

export const AUTOMATION_SETTINGS_KEY = 'automationSettingsV1';
export const DEFAULT_DELAY_MS = 1000;
export const ONLY_ONE_DEVICE_MSG = 'Chỉ chọn 1 thiết bị';
export const SELECT_ONE_DEVICE_MSG = 'Chọn 1 thiết bị';

export const AUTOMATION_APPS: Array<{ id: AutomationAppId; label: string; icon: string }> = [
  { id: 'wechat', label: 'Wechat', icon: '/automation-icons/WechatIcon.png' },
  { id: 'line', label: 'Line', icon: '/automation-icons/LINE_New_App_Icon_(2020-12).png' },
  { id: 'tantan', label: 'Tantan', icon: '/automation-icons/TantanIcon.png' },
  { id: 'setting', label: 'Setting', icon: '/automation-icons/setting.png' },
];

/* ── helpers ── */

export function loadAutomationSettings(): { realtimeRecording: boolean } {
  try {
    const v = JSON.parse(localStorage.getItem(AUTOMATION_SETTINGS_KEY) || '{}');
    return { realtimeRecording: !!v.realtimeRecording };
  } catch {
    return { realtimeRecording: false };
  }
}

export function saveAutomationSettings(s: { realtimeRecording: boolean }) {
  try {
    const value = JSON.stringify(s);
    localStorage.setItem(AUTOMATION_SETTINGS_KEY, value);
    saveAutomationSettingToBackend(AUTOMATION_SETTINGS_KEY, value);
  } catch {
    // ignore
  }
}

export function makeId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function compareByName(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base', numeric: true });
}

export function sortMacros(macros: SavedAutomationMacro[], mode: MacroSortMode) {
  const next = [...macros];
  if (mode === 'name') return next.sort(compareByName);
  return next.sort((a, b) => (b.createdAt ?? b.updatedAt ?? 0) - (a.createdAt ?? a.updatedAt ?? 0));
}

export function loadMacroSortMode(): MacroSortMode {
  try {
    return localStorage.getItem('automationMacroSortModeV1') === 'createdAt' ? 'createdAt' : 'name';
  } catch {
    return 'name';
  }
}

export function saveMacroSortMode(mode: MacroSortMode) {
  try {
    localStorage.setItem('automationMacroSortModeV1', mode);
  } catch {
    // ignore
  }
}

export function macroRandomDelayRangeMs(baseSec: number) {
  const sec = Math.max(1, Math.floor(baseSec));
  const lowRatio = sec < 10 ? 0.6 : 2 / 3;
  const highRatio = sec < 10 ? 1.2 : 4 / 3;
  const minMs = Math.max(0, Math.floor(sec * lowRatio) * 1000);
  const maxMs = Math.max(minMs, Math.floor(sec * highRatio) * 1000);
  return { minMs, maxMs };
}

export function resolveMacroDelayMs(row: AutomationMacroRow) {
  if (row.delayRandomBaseSec && row.delayRandomBaseSec > 0) {
    const { minMs, maxMs } = macroRandomDelayRangeMs(row.delayRandomBaseSec);
    return randomInt(minMs, maxMs);
  }
  return Math.max(0, Math.floor(row.delayMs || 0));
}

export function formatMacroDelay(row: AutomationMacroRow) {
  if (!row.delayRandomBaseSec) return '';
  const { minMs, maxMs } = macroRandomDelayRangeMs(row.delayRandomBaseSec);
  return `${Math.round(minMs / 1000)}-${Math.round(maxMs / 1000)}s`;
}

export function isRunnableMacroRow(row: AutomationMacroRow) {
  if (row.action === 'seeding') return true;
  if (row.action === 'key') return Number.isFinite(row.keycode);
  if (row.action === 'text') return Boolean(row.text?.length);
  if (row.action === 'swipe') {
    return row.x01 != null && row.y01 != null && row.endX01 != null && row.endY01 != null;
  }
  return row.x01 != null && row.y01 != null;
}

export function rowToSteps(row: AutomationMacroRow, opts?: { seedingText?: string }): AutomationStep[] {
  const steps: AutomationStep[] = [];
  if (row.action === 'swipe' && row.x01 != null && row.y01 != null && row.endX01 != null && row.endY01 != null) {
    steps.push({
      type: 'swipe',
      x1: row.x01,
      y1: row.y01,
      x2: row.endX01,
      y2: row.endY01,
      durationMs: row.durationMs ?? 300,
    });
  } else if (row.action === 'touch' && row.x01 != null && row.y01 != null) {
    steps.push({ type: 'tap', x01: row.x01, y01: row.y01 });
  } else if (row.action === 'seeding' && opts?.seedingText) {
    steps.push({ type: 'text', text: opts.seedingText }, { type: 'key', keycode: AndroidKeycode.KEYCODE_ENTER });
  } else if (row.action === 'key' && Number.isFinite(row.keycode)) {
    steps.push({ type: 'key', keycode: Math.floor(row.keycode ?? 0) });
  } else if (row.action === 'text' && row.text) {
    steps.push({ type: 'text', text: row.text });
  }
  return steps;
}

export function cloneRows(rows: AutomationMacroRow[]) {
  return rows.map(row => ({
    ...row,
    targetUdids: Array.isArray(row.targetUdids) ? [...row.targetUdids] : [],
    note: row.note ?? '',
  }));
}

export function formatDeviceNo(n: number) {
  return String(n || 0).padStart(2, '0');
}

export function clamp01Value(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function formatMacroAction(action: AutomationMacroRow['action']) {
  if (action === 'swipe') return 'Vuốt';
  if (action === 'seeding') return 'Seeding';
  if (action === 'key') return 'Key';
  if (action === 'text') return 'Text';
  return 'Touch';
}

export function formatStepDetails(row: AutomationMacroRow) {
  if (row.action === 'swipe') {
    return `(${row.x ?? ''},${row.y ?? ''}) → (${row.endX ?? ''},${row.endY ?? ''}) ${row.durationMs ?? 0}ms`;
  }
  if (row.action === 'seeding') return 'Random từ ngữ chung + Enter';
  if (row.action === 'key') return `Keycode=${row.keycode ?? ''}`;
  if (row.action === 'text') return row.text ? `Text="${row.text}"` : 'Text=""';
  return `X=${row.x == null ? '' : row.x}, Y=${row.y == null ? '' : row.y}`;
}

export function makeActionPatch(row: AutomationMacroRow, action: AutomationMacroRow['action']): Partial<AutomationMacroRow> {
  if (action === 'key') return { action, keycode: row.keycode ?? AndroidKeycode.KEYCODE_ENTER };
  if (action === 'text') return { action, text: row.text ?? '' };
  if (action !== 'swipe') return { action };
  const width = row.width || 1;
  const height = row.height || 1;
  const startX01 = row.x01 ?? 0.5;
  const startY01 = row.y01 ?? 0.5;
  const endX01 = row.endX01 ?? startX01;
  const endY01 = row.endY01 ?? clamp01Value(startY01 + 0.18);
  return {
    action,
    x01: startX01,
    y01: startY01,
    x: row.x ?? Math.round(startX01 * width),
    y: row.y ?? Math.round(startY01 * height),
    endX01,
    endY01,
    endX: row.endX ?? Math.round(endX01 * width),
    endY: row.endY ?? Math.round(endY01 * height),
    durationMs: row.durationMs ?? 400,
  };
}

export function clampPosition(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function sleepMs(ms: number, signal?: AbortSignal) {
  return new Promise<void>(resolve => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const timeout = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, Math.max(0, ms));
    const onAbort = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export function randomInt(min: number, max: number) {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.floor(low + Math.random() * (high - low + 1));
}

export function pickSeedingContent() {
  const raw = loadSeedingContents();
  const words = raw.split(/[,\s]+/).map(word => word.trim()).filter(Boolean);
  if (!words.length) return '';
  const count = randomInt(1, 8);
  const out: string[] = [];
  const used = new Set<number>();
  while (out.length < count && used.size < words.length) {
    const index = randomInt(0, words.length - 1);
    if (used.has(index)) continue;
    used.add(index);
    out.push(words[index]);
  }
  return out.join(' ');
}

export function pickSeedingContents(count: number) {
  const raw = loadSeedingContents();
  const words = raw.split(/[,\s]+/).map(word => word.trim()).filter(Boolean);
  if (!words.length || count <= 0) return [];
  const seen = new Set<string>();
  return Array.from({ length: count }, () => {
    let phrase = '';
    for (let tries = 0; tries < 24; tries++) {
      phrase = pickSeedingContent();
      if (phrase && !seen.has(phrase)) break;
    }
    if (phrase) seen.add(phrase);
    return phrase;
  }).filter(Boolean);
}

