/* ── automationData.ts ──────────────────────────────────────────
   Shared types, constants, and persistence helpers for the
   Automation subsystem.  Both AutomationModal and App.tsx import
   from here to avoid circular dependencies.
   ─────────────────────────────────────────────────────────────── */

/* ── types ─────────────────────────────────────────────────────── */

import { normalizeSyncMacroSettings, type SyncMacroSettings } from './syncMacroSettings';

export type AutomationAppId = 'wechat' | 'line' | 'tantan' | 'setting';

export type AutomationActionMacroBinding = {
  id: string;
  macroId: string;
  macroName: string;
  profileId: string;
  profileName: string;
  targetUdids?: string[];
  updatedAt: number;
};

export type AutomationAppAction = {
  id: string;
  name: string;
  bindings: AutomationActionMacroBinding[];
};

export type AutomationDeviceProfile = {
  id: string;
  name: string;
  udids: string[];
  updatedAt: number;
};

export type AutomationMacroRow = {
  id: string;
  action: 'touch' | 'swipe' | 'seeding' | 'key' | 'text';
  delayMs: number;
  delayRandomBaseSec?: number;
  keycode?: number;
  text?: string;
  endX01?: number;
  endY01?: number;
  endX?: number;
  endY?: number;
  durationMs?: number;
  x01?: number;
  y01?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  sourceUdid?: string;
  targetUdids: string[];
  note: string;
};

export type SavedAutomationMacro = {
  id: string;
  name: string;
  rows: AutomationMacroRow[];
  syncMacroSettings?: SyncMacroSettings;
  createdAt?: number;
  updatedAt: number;
};

/* ── constants ─────────────────────────────────────────────────── */

export const AUTOMATION_MACROS_KEY = 'automationMacrosV1';
export const AUTOMATION_APP_ACTIONS_KEY = 'automationAppActionsV1';
export const AUTOMATION_DEVICE_PROFILES_KEY = 'automationDeviceProfilesV1';
export const AUTOMATION_SEEDING_CONTENTS_KEY = 'automationSeedingContentsV1';
export const AUTOMATION_DATA_CHANGED_EVENT = 'monviewphone:automation-data-changed';

export type AutomationDataChangedKind = 'macros' | 'actions' | 'profiles';

export const AUTOMATION_APPS: Array<{ id: AutomationAppId; label: string; icon: string }> = [
  { id: 'wechat', label: 'Wechat', icon: '/automation-icons/WechatIcon.png' },
  { id: 'line', label: 'Line', icon: '/automation-icons/LINE_New_App_Icon_(2020-12).png' },
  { id: 'tantan', label: 'Tantan', icon: '/automation-icons/TantanIcon.png' },
  { id: 'setting', label: 'Setting', icon: '/automation-icons/setting.png' },
];

/** Custom event name dispatched when the set of macro-running udids changes */
export const MACRO_RUNNING_UDIDS_EVENT = 'monviewphone:macro-running-udids';
export const MACRO_PLAYBACK_PROGRESS_EVENT = 'monviewphone:macro-playback-progress';
export const MACRO_PLAYBACK_STOP_EVENT = 'monviewphone:macro-playback-stop';

export type MacroPlaybackProgressDetail = {
  id: string;
  running: boolean;
  title: string;
  udids: string[];
  startedAt: number;
  replayAppId?: string;
  replayActionId?: string;
};

export type MacroPlaybackStopDetail = {
  id: string;
};

export type MacroPlaybackReplayDetail = {
  appId: string;
  actionId: string;
};

export const MACRO_PLAYBACK_REPLAY_EVENT = 'monviewphone:macro-playback-replay';

/* ── utility ───────────────────────────────────────────────────── */

export function makeId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function compareByName(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base', numeric: true });
}

export function sortDeviceProfilesByName(profiles: AutomationDeviceProfile[]) {
  return [...profiles].sort(compareByName);
}

export function emptyAppActions(): Record<AutomationAppId, AutomationAppAction[]> {
  return { wechat: [], line: [], tantan: [], setting: [] };
}

function dispatchAutomationDataChanged(kind: AutomationDataChangedKind) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(AUTOMATION_DATA_CHANGED_EVENT, { detail: { kind } }));
  } catch { /* ignore */ }
}

/* ── persistence ───────────────────────────────────────────────── */

export function loadSavedMacros(): SavedAutomationMacro[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTOMATION_MACROS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is SavedAutomationMacro => Boolean(item?.id && item?.name && Array.isArray(item?.rows)))
      .map(item => ({
        ...item,
        syncMacroSettings: item.syncMacroSettings ? normalizeSyncMacroSettings(item.syncMacroSettings) : undefined,
        createdAt: Number(item.createdAt) || Number(item.updatedAt) || Date.now(),
        updatedAt: Number(item.updatedAt) || Number(item.createdAt) || Date.now(),
      }));
  } catch { return []; }
}

export function saveSavedMacros(macros: SavedAutomationMacro[]) {
  try {
    localStorage.setItem(AUTOMATION_MACROS_KEY, JSON.stringify(macros));
    dispatchAutomationDataChanged('macros');
  } catch { /* ignore */ }
}

export function loadAppActions(): Record<AutomationAppId, AutomationAppAction[]> {
  const fallback = emptyAppActions();
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTOMATION_APP_ACTIONS_KEY) || '{}');
    const next = emptyAppActions();
    for (const app of AUTOMATION_APPS) {
      const list = parsed?.[app.id];
      next[app.id] = Array.isArray(list)
        ? list.filter(item => Boolean(item?.id && item?.name)).map(item => {
          const bindings = Array.isArray(item.bindings)
            ? item.bindings
              .filter((b: Record<string, unknown>) => Boolean(b?.id && b?.macroId && b?.macroName && (b?.profileId || Array.isArray(b?.targetUdids))))
              .map((b: Record<string, unknown>) => ({
                id: String(b.id), macroId: String(b.macroId), macroName: String(b.macroName),
                profileId: b.profileId ? String(b.profileId) : '', profileName: b.profileName ? String(b.profileName) : '',
                targetUdids: Array.isArray(b.targetUdids) ? (b.targetUdids as string[]).map(String) : undefined,
                updatedAt: Number(b.updatedAt) || Date.now(),
              }))
            : [];
          return { id: String(item.id), name: String(item.name), bindings };
        })
        : [];
    }
    return next;
  } catch { return fallback; }
}

export function saveAppActions(actions: Record<AutomationAppId, AutomationAppAction[]>) {
  try {
    localStorage.setItem(AUTOMATION_APP_ACTIONS_KEY, JSON.stringify(actions));
    dispatchAutomationDataChanged('actions');
  } catch { /* ignore */ }
}

export function loadDeviceProfiles(): AutomationDeviceProfile[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTOMATION_DEVICE_PROFILES_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return sortDeviceProfilesByName(parsed.filter((item): item is AutomationDeviceProfile => Boolean(item?.id && item?.name && Array.isArray(item?.udids))));
  } catch { return []; }
}

export function saveDeviceProfiles(profiles: AutomationDeviceProfile[]) {
  try {
    localStorage.setItem(AUTOMATION_DEVICE_PROFILES_KEY, JSON.stringify(sortDeviceProfilesByName(profiles)));
    dispatchAutomationDataChanged('profiles');
  } catch { /* ignore */ }
}

/* ── seeding content persistence ─────────────────────────────── */

export const DEFAULT_SEEDING_CONTENTS = `Hi, hey, hello, you, me, we, they, love, like, hand, then, got, that, this, there, here, now, today, tonight, morning, evening, friend, chat, talk, message, reply, wait, see, know, think, feel, want, need, hope, good, nice, calm, happy, busy, free, slow, quick, simple, little, much, more, some, any, every, day, time, life, work, home, outside, inside, coffee, tea, food, water, music, movie, photo, phone, walk, sleep, wake, smile, laugh, listen, ask, answer, tell, share, maybe, sure, fine, okay, still, just, again, later, soon, back, around, before, after, because, really, always, often, sometimes, never, right, left, long, short, warm, cool, quiet, clean, open, close, start, stop, keep, make, take, come, go, get, give, send, read, done`;

export function normalizeSeedingContentLines(value: string) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of value.split(/[,\r\n]+/)) {
    const trimmed = line.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out.join('\n');
}

export function loadSeedingContents() {
  try {
    const raw = localStorage.getItem(AUTOMATION_SEEDING_CONTENTS_KEY);
    if (raw !== null) return normalizeSeedingContentLines(raw) ? raw : DEFAULT_SEEDING_CONTENTS;
    return DEFAULT_SEEDING_CONTENTS;
  } catch { return DEFAULT_SEEDING_CONTENTS; }
}

export function saveSeedingContents(contents: string) {
  try { localStorage.setItem(AUTOMATION_SEEDING_CONTENTS_KEY, contents); } catch { /* ignore */ }
}
