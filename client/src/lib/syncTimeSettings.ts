export type SyncTimeSettings = {
  delayEnabled: boolean;
  randomOrder: boolean;
  intervalSec: number;
  offsetEnabled: boolean;
  offsetMinPx: number;
  offsetMaxPx: number;
};

export const SYNC_TIME_SETTINGS_KEY = 'manualSyncTimeSettingsV1';
export const SYNC_TIME_SETTINGS_EVENT = 'monviewphone:sync-time-settings';

export const DEFAULT_SYNC_TIME_SETTINGS: SyncTimeSettings = {
  delayEnabled: false,
  randomOrder: false,
  intervalSec: 5,
  offsetEnabled: false,
  offsetMinPx: 2,
  offsetMaxPx: 6,
};

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export function normalizeSyncTimeSettings(value: Partial<SyncTimeSettings> | null | undefined): SyncTimeSettings {
  const rawMinPx = Math.round(clampNumber(value?.offsetMinPx, 0, 999, DEFAULT_SYNC_TIME_SETTINGS.offsetMinPx));
  const rawMaxPx = Math.round(clampNumber(value?.offsetMaxPx, 0, 999, DEFAULT_SYNC_TIME_SETTINGS.offsetMaxPx));
  return {
    delayEnabled: value?.delayEnabled === true,
    randomOrder: value?.randomOrder === true,
    intervalSec: clampNumber(value?.intervalSec, 0.1, 86400, DEFAULT_SYNC_TIME_SETTINGS.intervalSec),
    offsetEnabled: value?.offsetEnabled === true,
    offsetMinPx: Math.min(rawMinPx, rawMaxPx),
    offsetMaxPx: Math.max(rawMinPx, rawMaxPx),
  };
}

export function loadSyncTimeSettings(): SyncTimeSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(SYNC_TIME_SETTINGS_KEY) || 'null') as Partial<SyncTimeSettings> | null;
    return normalizeSyncTimeSettings(parsed);
  } catch {
    return DEFAULT_SYNC_TIME_SETTINGS;
  }
}

export function saveSyncTimeSettings(settings: SyncTimeSettings): SyncTimeSettings {
  const normalized = normalizeSyncTimeSettings(settings);
  try {
    localStorage.setItem(SYNC_TIME_SETTINGS_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent<SyncTimeSettings>(SYNC_TIME_SETTINGS_EVENT, { detail: normalized }));
  } catch {
    // ignore
  }
  return normalized;
}

export function syncTimeDelayRangeMs(intervalSec: number) {
  const sec = Math.max(0.1, intervalSec);
  const lowRatio = sec < 10 ? 0.6 : 2 / 3;
  const highRatio = sec < 10 ? 1.2 : 4 / 3;
  const minMs = Math.max(0, Math.round(sec * lowRatio * 1000));
  const maxMs = Math.max(minMs, Math.round(sec * highRatio * 1000));
  return { minMs, maxMs };
}
