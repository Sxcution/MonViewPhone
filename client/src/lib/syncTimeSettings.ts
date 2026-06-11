import { saveSyncTimeSettingToBackend } from './backendSettings';

export type SyncTimeSettings = {
  delayEnabled: boolean;
  randomOrder: boolean;
  intervalSec: number;
  intervalEnabled: boolean;
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

export function normalizeSyncTimeSettings(value: Partial<SyncTimeSettings> | null | undefined): SyncTimeSettings {
  const rawMinPx = Math.round(clampNumber(value?.offsetMinPx, 0, 999, DEFAULT_SYNC_TIME_SETTINGS.offsetMinPx));
  const rawMaxPx = Math.round(clampNumber(value?.offsetMaxPx, 0, 999, DEFAULT_SYNC_TIME_SETTINGS.offsetMaxPx));
  return {
    delayEnabled: value?.delayEnabled === true,
    randomOrder: value?.randomOrder === true,
    intervalSec: clampNumber(value?.intervalSec, 0.1, 86400, DEFAULT_SYNC_TIME_SETTINGS.intervalSec),
    intervalEnabled: value?.intervalEnabled !== false,
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
    const value = JSON.stringify(normalized);
    localStorage.setItem(SYNC_TIME_SETTINGS_KEY, value);
    window.dispatchEvent(new CustomEvent<SyncTimeSettings>(SYNC_TIME_SETTINGS_EVENT, { detail: normalized }));
    saveSyncTimeSettingToBackend(SYNC_TIME_SETTINGS_KEY, value);
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

export function matchesHotkey(e: KeyboardEvent, hotkeyStr: string): boolean {
  if (!hotkeyStr) return false;
  const parts = hotkeyStr.split('+').map(p => p.trim().toLowerCase());
  const hasCtrl = parts.includes('ctrl');
  const hasAlt = parts.includes('alt');
  const hasShift = parts.includes('shift');
  const targetKeyName = parts[parts.length - 1];
  
  if (hasCtrl !== (e.ctrlKey || e.metaKey)) return false;
  if (hasAlt !== e.altKey) return false;
  if (hasShift !== e.shiftKey) return false;
  
  let eventKey = e.key.toLowerCase();
  if (eventKey === ' ') eventKey = 'space';
  const eventCode = e.code.toLowerCase();
  
  return (
    eventKey === targetKeyName ||
    eventCode === `key${targetKeyName}` ||
    eventCode === targetKeyName
  );
}
