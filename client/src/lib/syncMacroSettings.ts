import { saveSyncTimeSettingToBackend } from './backendSettings';

export type SyncMacroSettings = {
  delayEnabled: boolean;
  randomOrder: boolean;
  intervalSec: number;
  intervalEnabled: boolean;
  offsetEnabled: boolean;
  offsetMinPx: number;
  offsetMaxPx: number;
};

export const SYNC_MACRO_SETTINGS_KEY = 'manualSyncMacroSettingsV1';
export const SYNC_MACRO_SETTINGS_EVENT = 'monviewphone:sync-macro-settings';

export const DEFAULT_SYNC_MACRO_SETTINGS: SyncMacroSettings = {
  delayEnabled: false,
  randomOrder: false,
  intervalSec: 5,
  intervalEnabled: true,
  offsetEnabled: false,
  offsetMinPx: 2,
  offsetMaxPx: 6,
};

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export function normalizeSyncMacroSettings(value: Partial<SyncMacroSettings> | null | undefined): SyncMacroSettings {
  const rawMinPx = Math.round(clampNumber(value?.offsetMinPx, 0, 999, DEFAULT_SYNC_MACRO_SETTINGS.offsetMinPx));
  const rawMaxPx = Math.round(clampNumber(value?.offsetMaxPx, 0, 999, DEFAULT_SYNC_MACRO_SETTINGS.offsetMaxPx));
  return {
    delayEnabled: value?.delayEnabled === true,
    randomOrder: value?.randomOrder === true,
    intervalSec: clampNumber(value?.intervalSec, 0.1, 86400, DEFAULT_SYNC_MACRO_SETTINGS.intervalSec),
    intervalEnabled: value?.intervalEnabled !== false,
    offsetEnabled: value?.offsetEnabled === true,
    offsetMinPx: Math.min(rawMinPx, rawMaxPx),
    offsetMaxPx: Math.max(rawMinPx, rawMaxPx),
  };
}

export function loadSyncMacroSettings(): SyncMacroSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(SYNC_MACRO_SETTINGS_KEY) || 'null') as Partial<SyncMacroSettings> | null;
    return normalizeSyncMacroSettings(parsed);
  } catch {
    return DEFAULT_SYNC_MACRO_SETTINGS;
  }
}

export function saveSyncMacroSettings(settings: SyncMacroSettings): SyncMacroSettings {
  const normalized = normalizeSyncMacroSettings(settings);
  try {
    const value = JSON.stringify(normalized);
    localStorage.setItem(SYNC_MACRO_SETTINGS_KEY, value);
    window.dispatchEvent(new CustomEvent<SyncMacroSettings>(SYNC_MACRO_SETTINGS_EVENT, { detail: normalized }));
    saveSyncTimeSettingToBackend(SYNC_MACRO_SETTINGS_KEY, value);
  } catch {
    // ignore
  }
  return normalized;
}

export function syncMacroDelayRangeMs(intervalSec: number) {
  const sec = Math.max(0.1, intervalSec);
  const lowRatio = sec < 10 ? 0.6 : 2 / 3;
  const highRatio = sec < 10 ? 1.2 : 4 / 3;
  const minMs = Math.max(0, Math.round(sec * lowRatio * 1000));
  const maxMs = Math.max(minMs, Math.round(sec * highRatio * 1000));
  return { minMs, maxMs };
}
