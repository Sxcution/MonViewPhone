import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CirclePlus,
  FolderOpen,
  Info,
  Pencil,
  Play,
  Plus,
  Save,
  Settings,
  Square,
  Trash2,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useActive } from '@/context/ActiveContext';
import { DeviceSelectionGrid, type DeviceSelectionGridItem } from '@/components/DeviceSelectionGrid';
import {
  AUTOMATION_CLICK_EVENT,
  AUTOMATION_SWIPE_EVENT,
  runScript,
  type AutomationClickDetail,
  type AutomationSwipeDetail,
  type AutomationStep,
} from '@/lib/automation';
import { AndroidKeycode } from '@/lib/keyEvent';

/* ── types ─────────────────────────────────────────────────────── */

export type AutomationDeviceOption = {
  udid: string;
  number: number;
  manufacturer?: string;
  model?: string;
};

type AutomationMacroAction = 'touch' | 'swipe' | 'seeding';

type AutomationMacroRow = {
  id: string;
  action: AutomationMacroAction;
  delayMs: number;
  delayRandomBaseSec?: number;
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

type SavedAutomationMacro = {
  id: string;
  name: string;
  rows: AutomationMacroRow[];
  updatedAt: number;
};

type AutomationSavedGroup = {
  name: string;
  udids: string[];
};

type SeedingPairingMode = 'ordered' | 'random';
type SeedingRepeatMode = 'minutes' | 'hours' | 'days';
type SeedingMissedRunPolicy = 'skip' | 'runLate';
type SeedingRunningJobPolicy = 'skip' | 'restart';

type SeedingJob = {
  id: string;
  enabled: boolean;
  name: string;
  groupAId: string;
  groupBId: string;
  groupAName?: string;
  groupBName?: string;
  groupASnapshot: string[];
  groupBSnapshot: string[];
  lockSnapshot: boolean;
  pairingMode: SeedingPairingMode;
  day: number;
  hour: number;
  minute: number;
  repeatEnabled: boolean;
  repeatMode: SeedingRepeatMode;
  repeatEveryValue: number;
  durationMin: number;
  maxRuns: number;
  delayMinSec: number;
  delayMaxSec: number;
  missedRunPolicy: SeedingMissedRunPolicy;
  runningJobPolicy: SeedingRunningJobPolicy;
  lastRunAt?: number;
  updatedAt: number;
};

type SeedingStorage = {
  version: 1;
  jobs: SeedingJob[];
};

type AutomationAppId = 'wechat' | 'line' | 'tantan' | 'setting';

type AutomationActionMacroBinding = {
  id: string;
  macroId: string;
  macroName: string;
  profileId: string;
  profileName: string;
  targetUdids?: string[];
  updatedAt: number;
};

type AutomationAppAction = {
  id: string;
  name: string;
  bindings: AutomationActionMacroBinding[];
};

type AutomationDeviceProfile = {
  id: string;
  name: string;
  udids: string[];
  updatedAt: number;
};

type AutomationContextMenuTarget =
  | { type: 'app'; appId: AutomationAppId; x: number; y: number }
  | { type: 'action'; appId: AutomationAppId; actionId: string; x: number; y: number }
  | { type: 'device'; udid: string; x: number; y: number };

type AutomationContextMenuInput =
  | { type: 'app'; appId: AutomationAppId }
  | { type: 'action'; appId: AutomationAppId; actionId: string }
  | { type: 'device'; udid: string };

/* Submenu state: level 2 + optional level 3 */
type CtxSubState = {
  main: 'profileList' | { appId: AutomationAppId; actionId: string };
  nested?: { type: 'profileActions'; profileId: string } | 'macroList';
} | null;

type ConfirmModalState = {
  title: string;
  message: string;
  onConfirm: () => void;
} | null;

type InputModalState = {
  key: string;
  title: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  onConfirm: (value: string) => void;
} | null;

type MacroCtxMenuState = {
  macroId: string;
  x: number;
  y: number;
} | null;

type RowDelayCtxMenuState = {
  rowId: string;
  x: number;
  y: number;
} | null;

type AutomationModalProps = {
  open: boolean;
  devices: AutomationDeviceOption[];
  savedGroups: AutomationSavedGroup[];
  selectedUdids: string[];
  onToggleDevice: (udid: string, checked: boolean) => void;
  onToggleAllDevices: (checked: boolean) => void;
  onClose: () => void;
};

/* ── constants ─────────────────────────────────────────────────── */

const AUTOMATION_MACROS_KEY = 'automationMacrosV1';
const AUTOMATION_APP_ACTIONS_KEY = 'automationAppActionsV1';
const AUTOMATION_DEVICE_PROFILES_KEY = 'automationDeviceProfilesV1';
const AUTOMATION_SEEDING_JOBS_KEY = 'automationSeedingJobsV1';
const AUTOMATION_SEEDING_CONTENTS_KEY = 'automationSeedingContentsV1';
const DEFAULT_DELAY_MS = 1000;
const AUTOMATION_SETTINGS_KEY = 'automationSettingsV1';

function loadAutomationSettings(): { realtimeRecording: boolean } {
  try { const v = JSON.parse(localStorage.getItem(AUTOMATION_SETTINGS_KEY) || '{}'); return { realtimeRecording: !!v.realtimeRecording }; } catch { return { realtimeRecording: false }; }
}
function saveAutomationSettings(s: { realtimeRecording: boolean }) {
  try { localStorage.setItem(AUTOMATION_SETTINGS_KEY, JSON.stringify(s)); } catch { /* */ }
}

function macroRandomDelayRangeMs(baseSec: number) {
  const sec = Math.max(1, Math.floor(baseSec));
  const lowRatio = sec < 10 ? 0.6 : 2 / 3;
  const highRatio = sec < 10 ? 1.2 : 4 / 3;
  const minMs = Math.max(0, Math.floor(sec * lowRatio) * 1000);
  const maxMs = Math.max(minMs, Math.floor(sec * highRatio) * 1000);
  return { minMs, maxMs };
}

function resolveMacroDelayMs(row: AutomationMacroRow) {
  if (row.delayRandomBaseSec && row.delayRandomBaseSec > 0) {
    const { minMs, maxMs } = macroRandomDelayRangeMs(row.delayRandomBaseSec);
    return randomInt(minMs, maxMs);
  }
  return Math.max(0, Math.floor(row.delayMs || 0));
}

function formatMacroDelay(row: AutomationMacroRow) {
  if (!row.delayRandomBaseSec) return '';
  const { minMs, maxMs } = macroRandomDelayRangeMs(row.delayRandomBaseSec);
  return `${Math.round(minMs / 1000)}-${Math.round(maxMs / 1000)}s`;
}

function isRunnableMacroRow(row: AutomationMacroRow) {
  if (row.action === 'seeding') return true;
  if (row.action === 'swipe') return row.x01 != null && row.y01 != null && row.endX01 != null && row.endY01 != null;
  return row.x01 != null && row.y01 != null;
}

/* Convert a macro row to automation steps */
function rowToSteps(row: AutomationMacroRow, opts?: { seedingText?: string; delayMs?: number }): AutomationStep[] {
  const steps: AutomationStep[] = [];
  if (row.action === 'swipe' && row.x01 != null && row.y01 != null && row.endX01 != null && row.endY01 != null) {
    steps.push({ type: 'swipe', x1: row.x01, y1: row.y01, x2: row.endX01, y2: row.endY01, durationMs: row.durationMs ?? 300 });
  } else if (row.action === 'touch' && row.x01 != null && row.y01 != null) {
    steps.push({ type: 'tap', x01: row.x01, y01: row.y01 });
  } else if (row.action === 'seeding' && opts?.seedingText) {
    steps.push({ type: 'text', text: opts.seedingText }, { type: 'key', keycode: AndroidKeycode.KEYCODE_ENTER });
  }
  const delayMs = opts?.delayMs ?? row.delayMs;
  if (delayMs > 0) steps.push({ type: 'wait', ms: delayMs });
  return steps;
}
const ONLY_ONE_DEVICE_MSG = 'Chỉ chọn 1 thiết bị';
const SELECT_ONE_DEVICE_MSG = 'Chọn 1 thiết bị';

const AUTOMATION_APPS: Array<{ id: AutomationAppId; label: string; icon: string }> = [
  { id: 'wechat', label: 'Wechat', icon: '/automation-icons/WechatIcon.png' },
  { id: 'line', label: 'Line', icon: '/automation-icons/LINE_New_App_Icon_(2020-12).png' },
  { id: 'tantan', label: 'Tantan', icon: '/automation-icons/TantanIcon.png' },
  { id: 'setting', label: 'Setting', icon: '/automation-icons/setting.png' },
];

/* ── utility ───────────────────────────────────────────────────── */

function emptyAppActions(): Record<AutomationAppId, AutomationAppAction[]> {
  return { wechat: [], line: [], tantan: [], setting: [] };
}

function makeId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadSavedMacros(): SavedAutomationMacro[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTOMATION_MACROS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SavedAutomationMacro => Boolean(item?.id && item?.name && Array.isArray(item?.rows)));
  } catch { return []; }
}
function saveSavedMacros(macros: SavedAutomationMacro[]) {
  try { localStorage.setItem(AUTOMATION_MACROS_KEY, JSON.stringify(macros)); } catch { /* ignore */ }
}

function loadAppActions(): Record<AutomationAppId, AutomationAppAction[]> {
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
function saveAppActions(actions: Record<AutomationAppId, AutomationAppAction[]>) {
  try { localStorage.setItem(AUTOMATION_APP_ACTIONS_KEY, JSON.stringify(actions)); } catch { /* ignore */ }
}

function loadDeviceProfiles(): AutomationDeviceProfile[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTOMATION_DEVICE_PROFILES_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is AutomationDeviceProfile => Boolean(item?.id && item?.name && Array.isArray(item?.udids)));
  } catch { return []; }
}
function saveDeviceProfiles(profiles: AutomationDeviceProfile[]) {
  try { localStorage.setItem(AUTOMATION_DEVICE_PROFILES_KEY, JSON.stringify(profiles)); } catch { /* ignore */ }
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

const DEFAULT_SEEDING_CONTENTS = `Hey
Hi
Hello
Good morning
Good afternoon
Good evening
Hey there
Hi there
Hello there
Hope you are well
how is your day going so far?
are you busy right now?
what are you up to right now?
did you sleep well last night?
did your day start smoothly?
are things okay on your side?
do you have a minute to chat?
are you free for a short message?
did you already eat today?
is your schedule busy today?
are you at home right now?
are you outside today?
are you working today?
is everything going fine today?
did anything interesting happen today?
are you still online?
do you usually check messages around this time?
are you having a calm day?
are you feeling okay today?
do you want to talk for a little while?
finished some work
got back home
made a cup of coffee
made some tea
had lunch
had dinner
took a short break
answered a few messages
checked my schedule
cleaned my desk
went for a short walk
finished a small task
opened WeChat
sat down for a moment
got off a call
came back from outside
charged my phone
checked the weather
read a few updates
washed my face
changed clothes
made a quick snack
checked my calendar
closed my laptop
finished a short errand
looked through my messages
put my phone on charge
came back to my room
turned on some music
finished replying to someone
feeling relaxed now
not too busy right now
taking it slow today
in a pretty calm mood
trying to rest a bit
free for a short chat
just catching my breath
keeping things simple today
doing fine so far
a little tired but okay
still in a good mood
not rushing anything today
ready to chat for a bit
enjoying a quiet moment
waiting for the next thing to do
feeling better now
trying to stay focused
just relaxing for a while
not doing much at the moment
glad to have a small break
That sounds good.
That makes sense.
I understand what you mean.
No problem at all.
Take your time with it.
That is totally fine.
I am glad to hear that.
I hope it gets easier soon.
You handled that well.
That sounds a little tiring.
That sounds comfortable.
I would probably do the same.
Thanks for telling me.
I see what you mean.
That is interesting.
That sounds like a normal day.
I hope your evening feels lighter.
That is nice to know.
I am happy you said that.
That sounds better than expected.
I know that feeling.
That is fair.
I get it now.
That sounds pretty calm.
That must have taken some energy.
I can wait.
I am not in a rush.
Just reply whenever you are free.
We can talk slowly.
No need to hurry.
I like calm conversations.
I am still here.
I will check again later.
That works for me.
I do not mind at all.
We can keep it simple.
I just wanted to ask.
I only wanted to say hello.
I can reply later too.
It is okay if you are busy.
We can continue when you have time.
I like talking this way.
A slow chat is fine with me.
You can answer when it is convenient.
I am just relaxing anyway.
Do you usually listen to music while you work?
What kind of music do you like these days?
Do you prefer coffee or tea?
What food do you usually like for dinner?
Do you like quiet places or busy places?
Do you usually go out on weekends?
Do you prefer texting or voice messages?
Do you watch movies often?
What kind of movies do you enjoy?
Do you usually sleep late?
Do you wake up early most days?
Do you like taking photos when you go out?
Do you check WeChat often during the day?
Do you usually reply fast or slow?
Do you like simple conversations?
Do you prefer staying home or going outside?
Do you have any plans for later today?
Do you like rainy weather?
Do you like sunny days more?
Do you usually drink coffee in the afternoon?
Do you enjoy walking around at night?
Do you like trying new food?
Do you often talk with friends online?
Do you prefer a busy day or a quiet day?
Do you like making plans or deciding later?
finish something
step away for a minute
make a quick call
reply to another message
get some water
charge my phone
check something nearby
take a short break
get back to work
prepare something
look at my schedule
handle a small task
make a quick note
answer a call
clean up a little
check one more thing
send a message to someone
rest my eyes for a moment
walk around for a minute
take care of something
I will message you again later.
I will come back after that.
I will check your reply when I return.
we can continue after that.
I will not be away for too long.
I will reply when I am back.
I will open the chat again later.
we can talk more when I am done.
I will be back soon.
I will read your message later.
By the way
Also
One more thing
Just asking
Small question
I was wondering
Before I forget
Another random thought
Something simple
Quick question
what time do you usually sleep?
what are you doing after work?
do you have a favorite drink?
do you like quiet evenings?
do you usually plan your day?
do you prefer short messages?
do you like chatting at night?
do you usually eat at home?
do you like morning or evening better?
do you often use your phone before sleeping?
do you like simple food?
do you usually take breaks during work?
do you prefer warm weather?
do you like walking outside?
do you check messages before bed?
do you like talking about daily life?
do you enjoy slow conversations?
do you usually keep your phone nearby?
do you like staying busy?
do you like a calm routine?`;

function normalizeSeedingContentLines(value: string) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of value.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out.join('\n');
}

function loadLegacySeedingContents() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTOMATION_SEEDING_JOBS_KEY) || '{"version":1,"jobs":[]}');
    const list = Array.isArray(parsed) ? parsed : parsed?.jobs;
    if (!Array.isArray(list)) return '';
    const joined = list
      .map(item => item && typeof item === 'object' && typeof (item as Record<string, unknown>).contents === 'string'
        ? String((item as Record<string, unknown>).contents)
        : '')
      .filter(Boolean)
      .join('\n');
    return normalizeSeedingContentLines(joined);
  } catch { return ''; }
}

function loadSeedingContents() {
  try {
    const raw = localStorage.getItem(AUTOMATION_SEEDING_CONTENTS_KEY);
    if (raw !== null) return normalizeSeedingContentLines(raw) ? raw : DEFAULT_SEEDING_CONTENTS;
    const legacy = loadLegacySeedingContents();
    return legacy || DEFAULT_SEEDING_CONTENTS;
  } catch { return DEFAULT_SEEDING_CONTENTS; }
}

function saveSeedingContents(contents: string) {
  try { localStorage.setItem(AUTOMATION_SEEDING_CONTENTS_KEY, contents); } catch { /* ignore */ }
}

function normalizeSeedingJob(item: Record<string, unknown>): SeedingJob | null {
  const id = typeof item.id === 'string' && item.id.trim() ? item.id : makeId('seed-job');
  const name = typeof item.name === 'string' && item.name.trim() ? item.name.trim() : 'Seeding Job';
  const groupAId = typeof item.groupAId === 'string' ? item.groupAId : '';
  const groupBId = typeof item.groupBId === 'string' ? item.groupBId : '';
  const pairingMode: SeedingPairingMode = item.pairingMode === 'random' ? 'random' : 'ordered';
  const repeatMode: SeedingRepeatMode = item.repeatMode === 'hours' || item.repeatMode === 'days' ? item.repeatMode : 'minutes';
  const missedRunPolicy: SeedingMissedRunPolicy = item.missedRunPolicy === 'runLate' ? 'runLate' : 'skip';
  const runningJobPolicy: SeedingRunningJobPolicy = item.runningJobPolicy === 'restart' ? 'restart' : 'skip';
  const groupASnapshot = Array.isArray(item.groupASnapshot) ? item.groupASnapshot.map(String).filter(Boolean) : [];
  const groupBSnapshot = Array.isArray(item.groupBSnapshot) ? item.groupBSnapshot.map(String).filter(Boolean) : [];
  return {
    id,
    enabled: item.enabled !== false,
    name,
    groupAId,
    groupBId,
    groupAName: typeof item.groupAName === 'string' ? item.groupAName : undefined,
    groupBName: typeof item.groupBName === 'string' ? item.groupBName : undefined,
    groupASnapshot,
    groupBSnapshot,
    lockSnapshot: item.lockSnapshot === true,
    pairingMode,
    day: clampNumber(item.day, 1, 31, new Date().getDate()),
    hour: clampNumber(item.hour, 0, 23, new Date().getHours()),
    minute: clampNumber(item.minute, 0, 59, new Date().getMinutes()),
    repeatEnabled: item.repeatEnabled === true,
    repeatMode,
    repeatEveryValue: clampNumber(item.repeatEveryValue, 1, 999, 1),
    durationMin: clampNumber(item.durationMin, 1, 1440, 10),
    maxRuns: clampNumber(item.maxRuns, 0, 9999, 0),
    delayMinSec: clampNumber(item.delayMinSec, 1, 86400, 10),
    delayMaxSec: clampNumber(item.delayMaxSec, 1, 86400, 60),
    missedRunPolicy,
    runningJobPolicy,
    lastRunAt: Number.isFinite(Number(item.lastRunAt)) ? Number(item.lastRunAt) : undefined,
    updatedAt: Number.isFinite(Number(item.updatedAt)) ? Number(item.updatedAt) : Date.now(),
  };
}

function loadSeedingJobs(): SeedingJob[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTOMATION_SEEDING_JOBS_KEY) || '{"version":1,"jobs":[]}');
    const list = Array.isArray(parsed) ? parsed : parsed?.jobs;
    if (!Array.isArray(list)) return [];
    return list.map(item => item && typeof item === 'object' ? normalizeSeedingJob(item as Record<string, unknown>) : null).filter((x): x is SeedingJob => Boolean(x));
  } catch { return []; }
}

function saveSeedingJobs(jobs: SeedingJob[]) {
  const payload: SeedingStorage = { version: 1, jobs };
  try { localStorage.setItem(AUTOMATION_SEEDING_JOBS_KEY, JSON.stringify(payload)); } catch { /* ignore */ }
}

function createDefaultSeedingJob(groupRefs: Array<{ id: string; name: string; udids: string[] }>): SeedingJob {
  const now = new Date();
  const a = groupRefs[0];
  const b = groupRefs[1];
  return {
    id: makeId('seed-job'),
    enabled: true,
    name: `Seeding ${groupRefs.length + 1}`,
    groupAId: a?.id ?? '',
    groupBId: b?.id ?? '',
    groupAName: a?.name,
    groupBName: b?.name,
    groupASnapshot: a ? [...a.udids] : [],
    groupBSnapshot: b ? [...b.udids] : [],
    lockSnapshot: false,
    pairingMode: 'ordered',
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
    repeatEnabled: false,
    repeatMode: 'minutes',
    repeatEveryValue: 30,
    durationMin: 10,
    maxRuns: 0,
    delayMinSec: 10,
    delayMaxSec: 60,
    missedRunPolicy: 'skip',
    runningJobPolicy: 'skip',
    updatedAt: Date.now(),
  };
}

function cloneRows(rows: AutomationMacroRow[]) {
  return rows.map(row => ({ ...row, targetUdids: Array.isArray(row.targetUdids) ? [...row.targetUdids] : [], note: row.note ?? '' }));
}

function formatDeviceNo(n: number) { return String(n || 0).padStart(2, '0'); }
function clamp01Value(value: number) { return Math.max(0, Math.min(1, value)); }
function formatMacroAction(action: AutomationMacroAction) {
  if (action === 'swipe') return 'Vuốt';
  if (action === 'seeding') return 'Seeding';
  return 'Touch';
}
function formatStepDetails(row: AutomationMacroRow) {
  if (row.action === 'swipe') return `(${row.x ?? ''},${row.y ?? ''}) → (${row.endX ?? ''},${row.endY ?? ''}) ${row.durationMs ?? 0}ms`;
  if (row.action === 'seeding') return 'Random từ ngữ chung + Enter';
  return `X=${row.x == null ? '' : row.x}, Y=${row.y == null ? '' : row.y}`;
}
function makeActionPatch(row: AutomationMacroRow, action: AutomationMacroAction): Partial<AutomationMacroRow> {
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
function clampPosition(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }
function sleepMs(ms: number) { return new Promise<void>(resolve => window.setTimeout(resolve, ms)); }
function randomInt(min: number, max: number) {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.floor(low + Math.random() * (high - low + 1));
}

/* ── Shared modal styles — matches Automation modal theme ───────── */

const MODAL_BACKDROP: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)', zIndex: 27000 };
const MODAL_OVERLAY: React.CSSProperties = { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 27001, padding: 24 };
const MODAL_CARD: React.CSSProperties = { background: '#1f1f1f', color: '#f3f4f6', border: '1px solid #3c3c3c', borderRadius: 6, minWidth: 380, maxWidth: 480, width: '100%', boxShadow: '0 24px 70px rgba(0,0,0,0.58)', overflow: 'hidden' };
const MODAL_HEADER: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: '1px solid #343434', background: '#242424' };
const MODAL_BODY: React.CSSProperties = { padding: '16px 14px' };
const MODAL_FOOTER: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 14px', borderTop: '1px solid #343434', background: '#242424' };
const MODAL_TITLE: React.CSSProperties = { margin: 0, fontSize: 16, fontWeight: 700 };
const MODAL_CLOSE_BTN: React.CSSProperties = { display: 'grid', placeItems: 'center', width: 30, height: 30, padding: 0, color: '#d9d9d9', background: '#2b2b2b', border: '1px solid #454545', borderRadius: 4, cursor: 'pointer', fontSize: 14, lineHeight: 1 };
const BTN_BASE: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 34, padding: '0 16px', border: '1px solid #3b3b3b', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#f8fafc', background: '#2b2b2b', transition: 'all 0.15s ease' };
const BTN_CANCEL: React.CSSProperties = { ...BTN_BASE };
const BTN_DANGER: React.CSSProperties = { ...BTN_BASE, background: '#c0392b', borderColor: 'rgba(192,57,43,0.6)', color: '#fff' };
const BTN_PRIMARY: React.CSSProperties = { ...BTN_BASE, background: 'rgba(13,110,253,0.22)', borderColor: 'rgba(13,110,253,0.75)', color: '#8ec5ff' };
const INPUT_STYLE: React.CSSProperties = { width: '100%', padding: '8px 12px', background: '#181818', color: '#f3f4f6', border: '1px solid #3c3c3c', borderRadius: 4, fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const LABEL_STYLE: React.CSSProperties = { display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#c9d4e5' };

function ConfirmDeleteModal({ state, onClose }: { state: ConfirmModalState; onClose: () => void }) {
  if (!state) return null;
  return createPortal(
    <>
      <div style={MODAL_BACKDROP} onClick={onClose} />
      <div style={MODAL_OVERLAY} onClick={onClose}>
        <div style={MODAL_CARD} onClick={e => e.stopPropagation()}>
          <div style={MODAL_HEADER}>
            <h5 style={MODAL_TITLE}>{state.title}</h5>
            <button type='button' style={MODAL_CLOSE_BTN} aria-label='Close' onClick={onClose}>✕</button>
          </div>
          <div style={MODAL_BODY}>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: 14 }}>{state.message}</p>
          </div>
          <div style={MODAL_FOOTER}>
            <button type='button' style={BTN_CANCEL} onClick={onClose}>Huỷ</button>
            <button type='button' style={BTN_DANGER} onClick={state.onConfirm}>Xác Nhận</button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

/* ── InputModal (fully self-contained, Portal) ─────────────────── */

function InputModalInner({ state, onClose }: { state: NonNullable<InputModalState>; onClose: () => void }) {
  const [value, setValue] = useState(state.defaultValue ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = () => { const v = value.trim(); if (!v) return; state.onConfirm(v); };

  return createPortal(
    <>
      <div style={MODAL_BACKDROP} onClick={onClose} />
      <div style={MODAL_OVERLAY} onClick={onClose}>
        <div style={MODAL_CARD} onClick={e => e.stopPropagation()}>
          <div style={MODAL_HEADER}>
            <h5 style={MODAL_TITLE}>{state.title}</h5>
            <button type='button' style={MODAL_CLOSE_BTN} aria-label='Close' onClick={onClose}>✕</button>
          </div>
          <div style={MODAL_BODY}>
            {state.label ? <label style={LABEL_STYLE}>{state.label}</label> : null}
            <input ref={inputRef} type='text' style={INPUT_STYLE}
              placeholder={state.placeholder ?? ''} value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onClose(); }}
            />
          </div>
          <div style={MODAL_FOOTER}>
            <button type='button' style={BTN_CANCEL} onClick={onClose}>Huỷ</button>
            <button type='button' style={{ ...BTN_PRIMARY, opacity: value.trim() ? 1 : 0.5, cursor: value.trim() ? 'pointer' : 'not-allowed' }} disabled={!value.trim()} onClick={handleSubmit}>{state.confirmText ?? 'Xác Nhận'}</button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

function InputModal({ state, onClose }: { state: InputModalState; onClose: () => void }) {
  if (!state) return null;
  return <InputModalInner key={state.key} state={state} onClose={onClose} />;
}

/* ── component ─────────────────────────────────────────────────── */

export function AutomationModal({
  open, devices, savedGroups, selectedUdids, onToggleDevice, onToggleAllDevices, onClose,
}: AutomationModalProps) {
  const { getTargetsByUdids } = useActive();

  /* ── state ── */
  const [deviceListOpen, setDeviceListOpen] = useState(true);
  const [actionRunnerOpen, setActionRunnerOpen] = useState(true);
  const [coordinatePanelOpen, setCoordinatePanelOpen] = useState(false);
  const [rows, setRows] = useState<AutomationMacroRow[]>([]);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [savedMacros, setSavedMacros] = useState<SavedAutomationMacro[]>(loadSavedMacros);
  const [appActions, setAppActions] = useState<Record<AutomationAppId, AutomationAppAction[]>>(loadAppActions);
  const [deviceProfiles, setDeviceProfiles] = useState<AutomationDeviceProfile[]>(loadDeviceProfiles);
  const [activeActionApp, setActiveActionApp] = useState<AutomationAppId>('wechat');
  const [actionOverlayOpen, setActionOverlayOpen] = useState<AutomationAppId | null>(null);
  const [automationContextMenu, setAutomationContextMenu] = useState<AutomationContextMenuTarget | null>(null);
  const [ctxSub, setCtxSub] = useState<CtxSubState>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(null);
  const [inputModal, setInputModal] = useState<InputModalState>(null);
  const [macroCtxMenu, setMacroCtxMenu] = useState<MacroCtxMenuState>(null);
  const [rowDelayCtxMenu, setRowDelayCtxMenu] = useState<RowDelayCtxMenuState>(null);
  const [currentMacroName, setCurrentMacroName] = useState('');
  const [position, setPosition] = useState({ x: 120, y: 80 });
  const recordingRef = useRef(false);
  const selectedRef = useRef<string[]>([]);
  const abortPlaybackRef = useRef<AbortController | null>(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const [realtimeRecording, setRealtimeRecording] = useState(() => loadAutomationSettings().realtimeRecording);
  const lastRecordTimestampRef = useRef<number>(0);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [seedingPanelOpen, setSeedingPanelOpen] = useState(false);
  const [seedingJobs, setSeedingJobs] = useState<SeedingJob[]>(loadSeedingJobs);
  const [seedingContents, setSeedingContents] = useState(loadSeedingContents);
  const [activeSeedingJobId, setActiveSeedingJobId] = useState<string | null>(null);
  const [previewGroupId, setPreviewGroupId] = useState<string | null>(null);
  const [seedingLogs, setSeedingLogs] = useState<string[]>([]);
  const [runningSeedingIds, setRunningSeedingIds] = useState<Set<string>>(() => new Set());
  const seedingAbortRef = useRef<Map<string, AbortController>>(new Map());
  const lastSeedingContentRef = useRef<Map<string, string>>(new Map());
  const seedingJobsRef = useRef<SeedingJob[]>(seedingJobs);

  /* ── memos ── */

  const deviceByUdid = useMemo(() => {
    const map = new Map<string, AutomationDeviceOption>();
    devices.forEach(d => map.set(d.udid, d));
    return map;
  }, [devices]);

  const seedingGroupRefs = useMemo(
    () => savedGroups.map((group, index) => ({
      id: `saved:${index}`,
      index,
      name: group.name,
      udids: Array.isArray(group.udids) ? [...group.udids] : [],
    })),
    [savedGroups],
  );

  const activeSeedingJob = useMemo(
    () => seedingJobs.find(job => job.id === activeSeedingJobId) ?? seedingJobs[0] ?? null,
    [activeSeedingJobId, seedingJobs],
  );

  const appendSeedingLog = useCallback((message: string) => {
    const stamp = new Date().toLocaleTimeString();
    setSeedingLogs(prev => [`${stamp} - ${message}`, ...prev].slice(0, 120));
  }, []);

  const getSeedingGroup = useCallback((groupId: string, fallbackName?: string) => {
    return seedingGroupRefs.find(group => group.id === groupId)
      ?? (fallbackName ? seedingGroupRefs.find(group => group.name === fallbackName) : undefined)
      ?? null;
  }, [seedingGroupRefs]);

  const resolveSeedingGroups = useCallback((job: SeedingJob) => {
    const groupA = getSeedingGroup(job.groupAId, job.groupAName);
    const groupB = getSeedingGroup(job.groupBId, job.groupBName);
    const groupAUdids = job.lockSnapshot ? job.groupASnapshot : groupA?.udids ?? [];
    const groupBUdids = job.lockSnapshot ? job.groupBSnapshot : groupB?.udids ?? [];
    const overlap = groupAUdids.filter(udid => groupBUdids.includes(udid));
    return { groupA, groupB, groupAUdids, groupBUdids, overlap };
  }, [getSeedingGroup]);

  const seedingWarnings = useMemo(() => {
    if (!activeSeedingJob) return [];
    const { groupA, groupB, groupAUdids, groupBUdids, overlap } = resolveSeedingGroups(activeSeedingJob);
    const warnings: string[] = [];
    if (!groupA && !activeSeedingJob.groupASnapshot.length) warnings.push('Chưa chọn Nhóm A');
    if (!groupB && !activeSeedingJob.groupBSnapshot.length) warnings.push('Chưa chọn Nhóm B');
    if (activeSeedingJob.groupAId && activeSeedingJob.groupAId === activeSeedingJob.groupBId) warnings.push('Nhóm A và Nhóm B không được giống nhau');
    if (overlap.length) warnings.push(`Có ${overlap.length} thiết bị trùng giữa Nhóm A và Nhóm B`);
    if (groupAUdids.length && groupBUdids.length && groupAUdids.length !== groupBUdids.length) warnings.push('Hai nhóm lệch số lượng máy, chế độ 1-1 sẽ xoay vòng nhóm ít máy hơn');
    if (!seedingContents.split(/\r?\n/).map(line => line.trim()).filter(Boolean).length) warnings.push('Chưa có danh sách từ/ngữ chung');
    return warnings;
  }, [activeSeedingJob, resolveSeedingGroups, seedingContents]);

  const updateSeedingJob = useCallback((jobId: string, patch: Partial<SeedingJob> | ((job: SeedingJob) => Partial<SeedingJob>)) => {
    setSeedingJobs(prev => prev.map(job => {
      if (job.id !== jobId) return job;
      const nextPatch = typeof patch === 'function' ? patch(job) : patch;
      return { ...job, ...nextPatch, updatedAt: Date.now() };
    }));
  }, []);

  const selectSeedingGroup = useCallback((jobId: string, side: 'A' | 'B', groupId: string) => {
    const group = getSeedingGroup(groupId);
    updateSeedingJob(jobId, {
      [side === 'A' ? 'groupAId' : 'groupBId']: groupId,
      [side === 'A' ? 'groupAName' : 'groupBName']: group?.name,
      [side === 'A' ? 'groupASnapshot' : 'groupBSnapshot']: group ? [...group.udids] : [],
    } as Partial<SeedingJob>);
  }, [getSeedingGroup, updateSeedingJob]);

  const addSeedingJob = useCallback(() => {
    setSeedingJobs(prev => {
      const next = createDefaultSeedingJob(seedingGroupRefs);
      next.name = `Seeding Job ${prev.length + 1}`;
      setActiveSeedingJobId(next.id);
      return [...prev, next];
    });
  }, [seedingGroupRefs]);

  const deleteSeedingJob = useCallback((jobId: string) => {
    seedingAbortRef.current.get(jobId)?.abort();
    seedingAbortRef.current.delete(jobId);
    setSeedingJobs(prev => {
      const next = prev.filter(job => job.id !== jobId);
      setActiveSeedingJobId(current => current === jobId ? next[0]?.id ?? null : current);
      return next;
    });
  }, []);

  const duplicateSeedingJob = useCallback((job: SeedingJob) => {
    const copy: SeedingJob = { ...job, id: makeId('seed-job'), name: `${job.name} Copy`, enabled: false, lastRunAt: undefined, updatedAt: Date.now() };
    setSeedingJobs(prev => [...prev, copy]);
    setActiveSeedingJobId(copy.id);
  }, []);

  const stopSeedingJob = useCallback((jobId: string) => {
    const controller = seedingAbortRef.current.get(jobId);
    if (!controller) return;
    controller.abort();
    appendSeedingLog(`Dừng job ${seedingJobsRef.current.find(job => job.id === jobId)?.name ?? jobId}`);
  }, [appendSeedingLog]);

  const pickSeedingContent = useCallback((jobId: string) => {
    const lines = seedingContents.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (!lines.length) return '';
    const last = lastSeedingContentRef.current.get(jobId);
    const pool = lines.length > 1 ? lines.filter(line => line !== last) : lines;
    const picked = pool[randomInt(0, pool.length - 1)] ?? lines[0];
    lastSeedingContentRef.current.set(jobId, picked);
    return picked;
  }, [seedingContents]);

  const runSeedingJob = useCallback(async (jobId: string, opts?: { test?: boolean; scheduledAt?: number }) => {
    const latest = seedingJobsRef.current.find(job => job.id === jobId);
    if (!latest) return;
    const alreadyRunning = seedingAbortRef.current.has(jobId);
    if (alreadyRunning) {
      if (latest.runningJobPolicy === 'restart' && !opts?.test) {
        seedingAbortRef.current.get(jobId)?.abort();
      } else {
        appendSeedingLog(`Bỏ qua ${latest.name}: job đang chạy`);
        return;
      }
    }

    const { groupAUdids, groupBUdids, overlap } = resolveSeedingGroups(latest);
    const lines = seedingContents.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (!latest.groupAId || latest.groupAId === latest.groupBId) { appendSeedingLog(`Không lưu/chạy ${latest.name}: Nhóm A và Nhóm B không hợp lệ`); return; }
    if (!groupAUdids.length || !groupBUdids.length) { appendSeedingLog(`Không chạy ${latest.name}: thiếu máy ở Nhóm A hoặc Nhóm B`); return; }
    if (overlap.length) appendSeedingLog(`${latest.name}: cảnh báo ${overlap.length} máy trùng giữa hai nhóm`);
    if (!lines.length) { appendSeedingLog(`Không chạy ${latest.name}: chưa có danh sách từ/ngữ chung`); return; }

    const controller = new AbortController();
    seedingAbortRef.current.set(jobId, controller);
    setRunningSeedingIds(prev => new Set(prev).add(jobId));
    if (opts?.scheduledAt) {
      updateSeedingJob(jobId, { lastRunAt: opts.scheduledAt });
    }

    const endAt = Date.now() + latest.durationMin * 60_000;
    const maxRuns = opts?.test ? 1 : latest.maxRuns > 0 ? latest.maxRuns : Number.POSITIVE_INFINITY;
    let runCount = 0;
    appendSeedingLog(`${opts?.test ? 'Chạy thử' : 'Bắt đầu'} ${latest.name}`);

    try {
      while (!controller.signal.aborted && Date.now() < endAt && runCount < maxRuns) {
        const onlineA = getTargetsByUdids(groupAUdids);
        const onlineB = getTargetsByUdids(groupBUdids);
        if (!onlineA.length || !onlineB.length) {
          appendSeedingLog(`${latest.name}: thiếu thiết bị online ở một trong hai nhóm`);
          break;
        }
        const pairIndex = latest.pairingMode === 'random'
          ? randomInt(0, Math.max(onlineA.length, onlineB.length) - 1)
          : Math.floor(runCount / 2);
        const a = latest.pairingMode === 'random' ? onlineA[randomInt(0, onlineA.length - 1)] : onlineA[pairIndex % onlineA.length];
        const b = latest.pairingMode === 'random' ? onlineB[randomInt(0, onlineB.length - 1)] : onlineB[pairIndex % onlineB.length];
        const fromA = runCount % 2 === 0;
        const target = fromA ? a : b;
        const text = pickSeedingContent(latest.id);
        await runScript(
          [target],
          [{ type: 'text', text }, { type: 'key', keycode: AndroidKeycode.KEYCODE_ENTER }],
          { signal: controller.signal },
        );
        runCount += 1;
        appendSeedingLog(`${latest.name}: ${fromA ? 'A' : 'B'} -> ${fromA ? 'B' : 'A'} (${target.udid})`);
        if (opts?.test || runCount >= maxRuns || Date.now() >= endAt) break;
        const delayMs = randomInt(latest.delayMinSec, latest.delayMaxSec) * 1000;
        const waitUntil = Date.now() + delayMs;
        while (!controller.signal.aborted && Date.now() < waitUntil) {
          await sleepMs(Math.min(500, waitUntil - Date.now()));
        }
      }
    } finally {
      seedingAbortRef.current.delete(jobId);
      setRunningSeedingIds(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
      appendSeedingLog(controller.signal.aborted ? `Đã dừng ${latest.name}` : `Hoàn tất ${latest.name}: ${runCount} lượt`);
    }
  }, [appendSeedingLog, getTargetsByUdids, pickSeedingContent, resolveSeedingGroups, seedingContents, updateSeedingJob]);

  const selectedSet = useMemo(() => new Set(selectedUdids), [selectedUdids]);

  const automationGridDevices = useMemo<DeviceSelectionGridItem[]>(
    () => devices.map(d => ({ udid: d.udid, label: formatDeviceNo(d.number), title: d.udid })),
    [devices],
  );

  const selectedList = useMemo(
    () => devices.map(d => d.udid).filter(udid => selectedSet.has(udid)),
    [devices, selectedSet],
  );

  const selectedRecordDevice = useMemo(
    () => (selectedList.length === 1 ? deviceByUdid.get(selectedList[0]) ?? null : null),
    [deviceByUdid, selectedList],
  );

  const statusIsError = status === ONLY_ONE_DEVICE_MSG || status === SELECT_ONE_DEVICE_MSG;
  const allAutomationDevicesSelected = devices.length > 0 && devices.every(d => selectedSet.has(d.udid));

  /* ── context menu computed values ── */

  const automationContextApp = automationContextMenu && automationContextMenu.type !== 'device'
    ? AUTOMATION_APPS.find(app => app.id === automationContextMenu.appId) ?? null : null;
  const automationContextAction = automationContextMenu?.type === 'action'
    ? appActions[automationContextMenu.appId].find(a => a.id === automationContextMenu.actionId) ?? null : null;

  const getDeviceContextTargets = useCallback((udid: string) => {
    if (selectedSet.has(udid) && selectedList.length) return selectedList;
    return [udid];
  }, [selectedList, selectedSet]);

  const automationContextDeviceTargets = automationContextMenu?.type === 'device'
    ? getDeviceContextTargets(automationContextMenu.udid) : [];

  /* Profile info cho context menu device */
  const ctxProfileInfo = useMemo(() => {
    if (automationContextMenu?.type !== 'device' || !automationContextDeviceTargets.length) return null;
    const profileSet = new Map<string, AutomationDeviceProfile>();
    const unassignedList: string[] = [];
    for (const udid of automationContextDeviceTargets) {
      const p = deviceProfiles.find(pr => pr.udids.includes(udid));
      if (p) profileSet.set(p.id, p);
      else unassignedList.push(udid);
    }
    return {
      currentProfiles: [...profileSet.values()],
      unassigned: unassignedList,
      singleProfile: profileSet.size === 1 && unassignedList.length === 0 ? [...profileSet.values()][0] : null,
      profileCount: profileSet.size,
    };
  }, [automationContextMenu, automationContextDeviceTargets, deviceProfiles]);

  /* Binding info cho action submenu */
  const actionSubmenuInfo = useMemo(() => {
    if (!ctxSub || typeof ctxSub.main !== 'object' || automationContextMenu?.type !== 'device') return null;
    const { appId, actionId } = ctxSub.main;
    const action = appActions[appId]?.find(a => a.id === actionId);
    if (!action) return null;
    const profileMap = new Map<string, AutomationDeviceProfile>();
    const unassigned: string[] = [];
    for (const udid of automationContextDeviceTargets) {
      const p = deviceProfiles.find(pr => pr.udids.includes(udid));
      if (p) profileMap.set(p.id, p);
      else unassigned.push(udid);
    }
    const profileCount = profileMap.size;
    const singleProfile = profileCount === 1 && unassigned.length === 0 ? [...profileMap.values()][0] : null;
    const binding = singleProfile ? (action.bindings ?? []).find(b => b.profileId === singleProfile.id) ?? null : null;
    const macroExists = binding ? savedMacros.some(m => m.id === binding.macroId) : false;
    return { action, profiles: [...profileMap.values()], profileCount, singleProfile, unassigned, binding, macroExists };
  }, [ctxSub, automationContextMenu, automationContextDeviceTargets, appActions, deviceProfiles, savedMacros]);

  /* ── effects ── */

  useEffect(() => {
    if (!open) return;
    const width = coordinatePanelOpen || seedingPanelOpen ? 1200 : 860;
    const height = 600;
    setPosition({
      x: Math.max(12, Math.round((window.innerWidth - width) / 2)),
      y: Math.max(48, Math.round((window.innerHeight - height) / 2)),
    });
  }, [coordinatePanelOpen, open, seedingPanelOpen]);

  useEffect(() => {
    seedingJobsRef.current = seedingJobs;
    saveSeedingJobs(seedingJobs);
    if (!activeSeedingJobId && seedingJobs.length) setActiveSeedingJobId(seedingJobs[0].id);
  }, [activeSeedingJobId, seedingJobs]);

  useEffect(() => {
    saveSeedingContents(seedingContents);
  }, [seedingContents]);

  useEffect(() => {
    if (activeSeedingJobId && !seedingJobs.some(job => job.id === activeSeedingJobId)) {
      setActiveSeedingJobId(seedingJobs[0]?.id ?? null);
    }
  }, [activeSeedingJobId, seedingJobs]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const nowMs = Date.now();
      const now = new Date(nowMs);
      for (const job of seedingJobsRef.current) {
        if (!job.enabled) continue;
        const scheduledStart = new Date(now.getFullYear(), now.getMonth(), job.day, job.hour, job.minute).getTime();
        if (!Number.isFinite(scheduledStart) || nowMs < scheduledStart) continue;
        let dueAt = scheduledStart;
        if (job.repeatEnabled) {
          const unitMs = job.repeatMode === 'days' ? 86_400_000 : job.repeatMode === 'hours' ? 3_600_000 : 60_000;
          const stepMs = unitMs * Math.max(1, job.repeatEveryValue);
          dueAt = scheduledStart + Math.floor((nowMs - scheduledStart) / stepMs) * stepMs;
        }
        if (job.lastRunAt && job.lastRunAt >= dueAt) continue;
        const lateMs = nowMs - dueAt;
        if (lateMs > 60_000 && job.missedRunPolicy === 'skip') {
          updateSeedingJob(job.id, { lastRunAt: dueAt });
          appendSeedingLog(`Bỏ qua ${job.name}: app mở trễ qua lịch`);
          continue;
        }
        if (seedingAbortRef.current.has(job.id) && job.runningJobPolicy === 'skip') {
          updateSeedingJob(job.id, { lastRunAt: dueAt });
          appendSeedingLog(`Bỏ qua ${job.name}: job đang chạy`);
          continue;
        }
        void runSeedingJob(job.id, { scheduledAt: dueAt });
      }
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [appendSeedingLog, runSeedingJob, updateSeedingJob]);

  useEffect(() => {
    if (!open || (!coordinatePanelOpen && !seedingPanelOpen)) return;
    const estimatedWidth = 1280;
    setPosition(prev => ({
      x: clampPosition(prev.x, 12, Math.max(12, window.innerWidth - estimatedWidth - 12)),
      y: clampPosition(prev.y, 12, Math.max(12, window.innerHeight - 120)),
    }));
  }, [coordinatePanelOpen, open, seedingPanelOpen]);

  useEffect(() => { recordingRef.current = recording; }, [recording]);
  useEffect(() => { selectedRef.current = selectedList; }, [selectedList]);

  useEffect(() => {
    if (open) return;
    setRecording(false); setActionOverlayOpen(null); setAutomationContextMenu(null); setMacroCtxMenu(null); setRowDelayCtxMenu(null);
    abortPlaybackRef.current?.abort();
  }, [open]);

  useEffect(() => { setCtxSub(null); }, [automationContextMenu]);

  /* close automation context menu on outside click */
  useEffect(() => {
    if (!automationContextMenu) return;
    const close = (e: Event) => {
      if ((e.target as HTMLElement | null)?.closest('.automationContextMenuPanel')) return;
      setAutomationContextMenu(null);
    };
    const closeKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAutomationContextMenu(null); };
    window.addEventListener('mousedown', close, true);
    window.addEventListener('contextmenu', close, true);
    window.addEventListener('keydown', closeKey);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('mousedown', close, true);
      window.removeEventListener('contextmenu', close, true);
      window.removeEventListener('keydown', closeKey);
      window.removeEventListener('resize', close);
    };
  }, [automationContextMenu]);

  /* close macro context menu on outside click */
  useEffect(() => {
    if (!macroCtxMenu) return;
    const close = (e: Event) => {
      if ((e.target as HTMLElement | null)?.closest('.automationMacroCtxPanel')) return;
      setMacroCtxMenu(null);
    };
    const closeKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMacroCtxMenu(null); };
    window.addEventListener('mousedown', close, true);
    window.addEventListener('contextmenu', close, true);
    window.addEventListener('keydown', closeKey);
    return () => {
      window.removeEventListener('mousedown', close, true);
      window.removeEventListener('contextmenu', close, true);
      window.removeEventListener('keydown', closeKey);
    };
  }, [macroCtxMenu]);

  /* close delay context menu on outside click */
  useEffect(() => {
    if (!rowDelayCtxMenu) return;
    const close = (e: Event) => {
      if ((e.target as HTMLElement | null)?.closest('.automationRowDelayCtxPanel')) return;
      setRowDelayCtxMenu(null);
    };
    const closeKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setRowDelayCtxMenu(null); };
    window.addEventListener('mousedown', close, true);
    window.addEventListener('contextmenu', close, true);
    window.addEventListener('keydown', closeKey);
    return () => {
      window.removeEventListener('mousedown', close, true);
      window.removeEventListener('contextmenu', close, true);
      window.removeEventListener('keydown', closeKey);
    };
  }, [rowDelayCtxMenu]);

  /* automation click + swipe recording */
  useEffect(() => {
    const onAutomationClick = (event: Event) => {
      if (!recordingRef.current) return;
      const detail = (event as CustomEvent<AutomationClickDetail>).detail;
      const selected = selectedRef.current;
      if (!detail?.udid || selected.length !== 1 || detail.udid !== selected[0]) return;
      const sourceNo = deviceByUdid.get(detail.udid)?.number;
      const now = Date.now();
      const elapsed = lastRecordTimestampRef.current > 0 ? now - lastRecordTimestampRef.current : 0;
      const delayMs = realtimeRecording && elapsed > 0 ? elapsed : DEFAULT_DELAY_MS;
      lastRecordTimestampRef.current = now;
      setRows(prev => [...prev, {
        id: makeId('step'), action: 'touch', delayMs,
        x01: detail.x01, y01: detail.y01, x: detail.x, y: detail.y,
        width: detail.width, height: detail.height,
        sourceUdid: detail.udid, targetUdids: [detail.udid], note: '',
      }]);
      setStatus(`Touch${sourceNo ? ` máy #${formatDeviceNo(sourceNo)}` : ''}: x=${detail.x}, y=${detail.y}${realtimeRecording ? ` (delay ${delayMs}ms)` : ''}`);
    };
    const onAutomationSwipe = (event: Event) => {
      if (!recordingRef.current) return;
      const detail = (event as CustomEvent<AutomationSwipeDetail>).detail;
      const selected = selectedRef.current;
      if (!detail?.udid || selected.length !== 1 || detail.udid !== selected[0]) return;
      const sourceNo = deviceByUdid.get(detail.udid)?.number;
      const now = Date.now();
      const elapsed = lastRecordTimestampRef.current > 0 ? now - lastRecordTimestampRef.current : 0;
      const delayMs = realtimeRecording && elapsed > 0 ? elapsed : DEFAULT_DELAY_MS;
      lastRecordTimestampRef.current = now;
      setRows(prev => [...prev, {
        id: makeId('step'), action: 'swipe', delayMs,
        x01: detail.startX01, y01: detail.startY01, x: detail.startX, y: detail.startY,
        endX01: detail.endX01, endY01: detail.endY01, endX: detail.endX, endY: detail.endY,
        width: detail.width, height: detail.height, durationMs: detail.durationMs,
        sourceUdid: detail.udid, targetUdids: [detail.udid], note: '',
      }]);
      setStatus(`Swipe${sourceNo ? ` máy #${formatDeviceNo(sourceNo)}` : ''}: (${detail.startX},${detail.startY}) → (${detail.endX},${detail.endY}) ${detail.durationMs}ms${realtimeRecording ? ` (delay ${delayMs}ms)` : ''}`);
    };
    window.addEventListener(AUTOMATION_CLICK_EVENT, onAutomationClick as EventListener);
    window.addEventListener(AUTOMATION_SWIPE_EVENT, onAutomationSwipe as EventListener);
    return () => {
      window.removeEventListener(AUTOMATION_CLICK_EVENT, onAutomationClick as EventListener);
      window.removeEventListener(AUTOMATION_SWIPE_EVENT, onAutomationSwipe as EventListener);
    };
  }, [deviceByUdid, realtimeRecording]);

  /* ── drag ── */

  const onDragMove = useCallback((e: PointerEvent) => {
    if (!dragRef.current.active) return;
    e.preventDefault();
    setPosition({
      x: clampPosition(dragRef.current.originX + e.clientX - dragRef.current.startX, 0, Math.max(0, window.innerWidth - 80)),
      y: clampPosition(dragRef.current.originY + e.clientY - dragRef.current.startY, 0, Math.max(0, window.innerHeight - 60)),
    });
  }, []);

  const onDragUp = useCallback(() => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragUp);
  }, [onDragMove]);

  const startDrag = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input, textarea, select')) return;
    e.preventDefault();
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, originX: position.x, originY: position.y };
    window.addEventListener('pointermove', onDragMove, { passive: false });
    window.addEventListener('pointerup', onDragUp);
  }, [onDragMove, onDragUp, position.x, position.y]);

  /* ── callbacks ── */

  const closeModal = useCallback(() => {
    setRecording(false); setActionOverlayOpen(null); setAutomationContextMenu(null); setMacroCtxMenu(null); setRowDelayCtxMenu(null); setSeedingPanelOpen(false);
    abortPlaybackRef.current?.abort(); onClose();
  }, [onClose]);

  /* ── addAppAction (InputModal) ── */
  const addAppAction = useCallback((appId: AutomationAppId) => {
    const app = AUTOMATION_APPS.find(a => a.id === appId);
    setAutomationContextMenu(null);
    setInputModal({
      key: makeId('input'),
      title: `Thêm hành động ${app?.label ?? appId}`,
      label: 'Tên hành động',
      placeholder: 'Ví dụ: Wechat Nearby People',
      onConfirm: (name) => {
        setAppActions(prev => {
          const next = { ...prev, [appId]: [...prev[appId], { id: makeId(`${appId}-action`), name, bindings: [] }] };
          saveAppActions(next); return next;
        });
        setActiveActionApp(appId); setActionOverlayOpen(appId);
        setStatus(`Đã thêm hành động: ${name}`);
        setInputModal(null);
      },
    });
  }, []);

  /* ── deleteAppAction (ConfirmDeleteModal) ── */
  const deleteAppActionImpl = useCallback((appId: AutomationAppId, actionId: string) => {
    const actionName = appActions[appId].find(a => a.id === actionId)?.name;
    setAppActions(prev => {
      const next = { ...prev, [appId]: prev[appId].filter(a => a.id !== actionId) };
      saveAppActions(next); return next;
    });
    setStatus(actionName ? `Đã xoá hành động: ${actionName}` : 'Đã xoá hành động');
  }, [appActions]);

  /* ── renameAppAction (InputModal) ── */
  const openRenameAction = useCallback((appId: AutomationAppId, actionId: string) => {
    const current = appActions[appId].find(a => a.id === actionId);
    setAutomationContextMenu(null);
    setInputModal({
      key: makeId('input'),
      title: 'Đổi tên hành động',
      label: 'Tên mới',
      defaultValue: current?.name ?? '',
      onConfirm: (name) => {
        setAppActions(prev => {
          const next = { ...prev, [appId]: prev[appId].map(a => a.id === actionId ? { ...a, name } : a) };
          saveAppActions(next); return next;
        });
        setStatus(`Đã đổi tên thành "${name}"`);
        setInputModal(null);
      },
    });
  }, [appActions]);

  const openAutomationContextMenu = useCallback((event: React.MouseEvent<HTMLElement>, target: AutomationContextMenuInput) => {
    event.preventDefault(); event.stopPropagation();
    if (target.type !== 'device') setActiveActionApp(target.appId);
    const x = clampPosition(event.clientX, 8, Math.max(8, window.innerWidth - 230));
    const y = clampPosition(event.clientY, 8, Math.max(8, window.innerHeight - 112));
    if (target.type === 'app') { setAutomationContextMenu({ type: 'app', appId: target.appId, x, y }); return; }
    if (target.type === 'action') { setAutomationContextMenu({ type: 'action', appId: target.appId, actionId: target.actionId, x, y }); return; }
    setAutomationContextMenu({ type: 'device', udid: target.udid, x, y });
  }, []);

  const openCoordinatePanel = useCallback(() => {
    setCoordinatePanelOpen(true);
    if (selectedList.length > 1) setStatus(ONLY_ONE_DEVICE_MSG);
    else if (selectedList.length === 0) setStatus(SELECT_ONE_DEVICE_MSG);
  }, [selectedList.length]);

  const startRecording = useCallback(() => {
    setCoordinatePanelOpen(true);
    if (selectedList.length > 1) { setRecording(false); setStatus(ONLY_ONE_DEVICE_MSG); return; }
    if (selectedList.length === 0) { setRecording(false); setStatus(SELECT_ONE_DEVICE_MSG); return; }
    setRecording(true);
    lastRecordTimestampRef.current = 0;
    const no = deviceByUdid.get(selectedList[0])?.number;
    setStatus(`Đang ghi${realtimeRecording ? ' (Realtime)' : ''}${no ? ` máy #${formatDeviceNo(no)}` : ''}`);
  }, [deviceByUdid, selectedList, realtimeRecording]);

  const toggleRecording = useCallback(() => {
    if (recording) { setRecording(false); setStatus('Đã dừng ghi tọa độ'); return; }
    startRecording();
  }, [recording, startRecording]);

  const addBlankStep = useCallback(() => {
    setRows(prev => [...prev, {
      id: makeId('step'), action: 'touch', delayMs: DEFAULT_DELAY_MS,
      targetUdids: selectedList.length === 1 ? [selectedList[0]] : [], note: '',
    }]);
  }, [selectedList]);

  const updateRow = useCallback((id: string, patch: Partial<AutomationMacroRow>) => {
    setRows(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)));
  }, []);

  const changeRowAction = useCallback((row: AutomationMacroRow, action: AutomationMacroAction) => {
    updateRow(row.id, makeActionPatch(row, action));
  }, [updateRow]);

  const updateRowDelay = useCallback((row: AutomationMacroRow, delayMs: number) => {
    const nextDelayMs = Math.max(0, Math.floor(delayMs));
    const patch: Partial<AutomationMacroRow> = { delayMs: nextDelayMs };
    if (row.delayRandomBaseSec) patch.delayRandomBaseSec = Math.max(1, Math.round(nextDelayMs / 1000) || 1);
    updateRow(row.id, patch);
  }, [updateRow]);

  const openRowDelayMenu = useCallback((event: React.MouseEvent<HTMLElement>, rowId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setRowDelayCtxMenu({
      rowId,
      x: clampPosition(event.clientX, 8, Math.max(8, window.innerWidth - 240)),
      y: clampPosition(event.clientY, 8, Math.max(8, window.innerHeight - 120)),
    });
  }, []);

  const openRandomDelayInput = useCallback((row: AutomationMacroRow) => {
    const baseSec = row.delayRandomBaseSec ?? Math.max(1, Math.round((row.delayMs || DEFAULT_DELAY_MS) / 1000));
    setRowDelayCtxMenu(null);
    setInputModal({
      key: makeId('input'),
      title: 'Random khoảng Delay',
      label: 'Nhập số giây gốc',
      defaultValue: String(baseSec),
      placeholder: 'Ví dụ: 5 hoặc 30',
      confirmText: 'Áp dụng',
      onConfirm: (value) => {
        const sec = Number(value.replace(',', '.'));
        if (!Number.isFinite(sec) || sec <= 0) {
          setStatus('Delay random phải lớn hơn 0 giây');
          return;
        }
        const cleanSec = Math.max(1, Math.round(sec));
        updateRow(row.id, { delayMs: cleanSec * 1000, delayRandomBaseSec: cleanSec });
        const { minMs, maxMs } = macroRandomDelayRangeMs(cleanSec);
        setStatus(`Delay random: ${Math.round(minMs / 1000)}-${Math.round(maxMs / 1000)} giây`);
        setInputModal(null);
      },
    });
  }, [updateRow]);

  const clearRandomDelay = useCallback((rowId: string) => {
    updateRow(rowId, { delayRandomBaseSec: undefined });
    setRowDelayCtxMenu(null);
    setStatus('Đã tắt random delay cho dòng');
  }, [updateRow]);

  /* ── macro save (InputModal) ── */
  const saveMacro = useCallback(() => {
    setInputModal({
      key: makeId('input'),
      title: 'Lưu File Macro',
      label: 'Tên File Macro',
      placeholder: 'Ví dụ: Samsung Note 9 WN Macro',
      defaultValue: currentMacroName || `Macro ${new Date().toLocaleTimeString('vi-VN')}`,
      confirmText: 'Lưu',
      onConfirm: (cleanName) => {
        const nextMacro: SavedAutomationMacro = { id: makeId('macro'), name: cleanName, rows: cloneRows(rows), updatedAt: Date.now() };
        setSavedMacros(prev => {
          const next = [nextMacro, ...prev.filter(m => m.name !== cleanName)].slice(0, 50);
          saveSavedMacros(next); return next;
        });
        setCurrentMacroName(cleanName);
        setStatus(`Đã lưu File Macro: ${cleanName}`);
        setInputModal(null);
      },
    });
  }, [currentMacroName, rows]);

  const loadMacro = useCallback((macro: SavedAutomationMacro) => {
    if (recordingRef.current) { setStatus('⚠ Đang ghi macro – hãy Dừng ghi hoặc Lưu trước khi mở file khác'); return; }
    setRows(cloneRows(macro.rows)); setCurrentMacroName(macro.name);
    setStatus(`Đã mở File Macro: ${macro.name}`);
  }, []);

  /* ── macro rename / delete ── */
  const renameMacro = useCallback((macroId: string, newName: string) => {
    const oldMacro = savedMacros.find(m => m.id === macroId);
    setSavedMacros(prev => {
      const next = prev.map(m => m.id === macroId ? { ...m, name: newName, updatedAt: Date.now() } : m);
      saveSavedMacros(next); return next;
    });
    if (oldMacro && currentMacroName === oldMacro.name) setCurrentMacroName(newName);
    setAppActions(prev => {
      const next = { ...prev };
      for (const appId of Object.keys(next) as AutomationAppId[]) {
        next[appId] = next[appId].map(action => ({
          ...action, bindings: action.bindings.map(b => b.macroId === macroId ? { ...b, macroName: newName } : b),
        }));
      }
      saveAppActions(next); return next;
    });
    setStatus(`Đã đổi tên File Macro thành "${newName}"`);
  }, [savedMacros, currentMacroName]);

  const deleteMacroImpl = useCallback((macroId: string) => {
    const macro = savedMacros.find(m => m.id === macroId);
    setSavedMacros(prev => { const next = prev.filter(m => m.id !== macroId); saveSavedMacros(next); return next; });
    if (macro && currentMacroName === macro.name) setCurrentMacroName('');
    setStatus(`Đã xoá File Macro: ${macro?.name ?? ''}`);
  }, [savedMacros, currentMacroName]);

  /* ── assignMacroToAction ── */
  const assignMacroToAction = useCallback((
    appId: AutomationAppId, actionId: string, macro: SavedAutomationMacro, profile: AutomationDeviceProfile,
  ) => {
    setAppActions(prev => {
      const nextActions = prev[appId].map(action => {
        if (action.id !== actionId) return action;
        const bindings = (action.bindings ?? []).filter(b => b.profileId !== profile.id);
        bindings.push({
          id: makeId('binding'), macroId: macro.id, macroName: macro.name,
          profileId: profile.id, profileName: profile.name, updatedAt: Date.now(),
        });
        return { ...action, bindings };
      });
      const next = { ...prev, [appId]: nextActions };
      saveAppActions(next); return next;
    });
    const actionName = appActions[appId].find(a => a.id === actionId)?.name ?? 'hành động';
    setStatus(`Đã gán "${macro.name}" vào ${actionName} cho profile "${profile.name}"`);
  }, [appActions]);

  /* ── removeBindingFromAction (confirm modal) ── */
  const removeBindingImpl = useCallback((appId: AutomationAppId, actionId: string, profileId: string) => {
    const profileName = deviceProfiles.find(p => p.id === profileId)?.name ?? 'profile';
    setAppActions(prev => {
      const nextActions = prev[appId].map(action => {
        if (action.id !== actionId) return action;
        return { ...action, bindings: (action.bindings ?? []).filter(b => b.profileId !== profileId) };
      });
      const next = { ...prev, [appId]: nextActions };
      saveAppActions(next); return next;
    });
    const actionName = appActions[appId].find(a => a.id === actionId)?.name ?? 'hành động';
    setStatus(`Đã xoá gán macro khỏi ${actionName} cho profile "${profileName}"`);
  }, [appActions, deviceProfiles]);

  /* ── profile management ── */
  const assignDevicesToProfile = useCallback((profileId: string, targetUdids: string[]) => {
    setDeviceProfiles(prev => {
      const next = prev.map(p => ({
        ...p,
        udids: p.id === profileId
          ? [...new Set([...p.udids, ...targetUdids])]
          : p.udids.filter(u => !targetUdids.includes(u)),
        updatedAt: p.id === profileId ? Date.now() : p.updatedAt,
      }));
      saveDeviceProfiles(next); return next;
    });
    const profileName = deviceProfiles.find(p => p.id === profileId)?.name ?? 'profile';
    setStatus(`Đã gán ${targetUdids.length} máy vào profile "${profileName}"`);
  }, [deviceProfiles]);

  const createProfileForDevices = useCallback((name: string, targetUdids: string[]) => {
    const newProfile: AutomationDeviceProfile = { id: makeId('profile'), name, udids: [...targetUdids], updatedAt: Date.now() };
    setDeviceProfiles(prev => {
      const cleaned = prev.map(p => ({ ...p, udids: p.udids.filter(u => !targetUdids.includes(u)) }));
      const next = [...cleaned, newProfile];
      saveDeviceProfiles(next); return next;
    });
    setStatus(`Đã tạo profile "${name}" với ${targetUdids.length} máy`);
  }, []);

  const renameProfile = useCallback((profileId: string, newName: string) => {
    setDeviceProfiles(prev => {
      const next = prev.map(p => p.id === profileId ? { ...p, name: newName, updatedAt: Date.now() } : p);
      saveDeviceProfiles(next); return next;
    });
    setAppActions(prev => {
      const next = { ...prev };
      for (const appId of Object.keys(next) as AutomationAppId[]) {
        next[appId] = next[appId].map(action => ({
          ...action, bindings: action.bindings.map(b => b.profileId === profileId ? { ...b, profileName: newName } : b),
        }));
      }
      saveAppActions(next); return next;
    });
    setStatus(`Đã đổi tên profile thành "${newName}"`);
  }, []);

  const deleteProfileImpl = useCallback((profileId: string) => {
    const profileName = deviceProfiles.find(p => p.id === profileId)?.name ?? 'profile';
    setDeviceProfiles(prev => { const next = prev.filter(p => p.id !== profileId); saveDeviceProfiles(next); return next; });
    setAppActions(prev => {
      const next = { ...prev };
      for (const appId of Object.keys(next) as AutomationAppId[]) {
        next[appId] = next[appId].map(action => ({
          ...action, bindings: action.bindings.filter(b => b.profileId !== profileId),
        }));
      }
      saveAppActions(next); return next;
    });
    setStatus(`Đã xoá profile "${profileName}"`);
  }, [deviceProfiles]);

  const buildMacroRowSteps = useCallback((row: AutomationMacroRow) => rowToSteps(row, {
    seedingText: row.action === 'seeding' ? pickSeedingContent('macro') : undefined,
    delayMs: resolveMacroDelayMs(row),
  }), [pickSeedingContent]);

  const newMacro = useCallback(() => { setRows([]); setCurrentMacroName(''); setStatus('Đã tạo macro mới'); }, []);

  /* ── playMacro (coordinate panel) ── */
  const playMacro = useCallback(async () => {
    if (playing) { abortPlaybackRef.current?.abort(); setStatus('Đang dừng phát'); return; }
    const runnableRows = rows.filter(isRunnableMacroRow);
    if (!runnableRows.length) { setStatus('Chưa có bước tọa độ để phát'); return; }
    setRecording(false); setPlaying(true);
    const controller = new AbortController();
    abortPlaybackRef.current = controller;
    try {
      for (const row of runnableRows) {
        if (controller.signal.aborted) break;
        const targets = getTargetsByUdids(row.targetUdids);
        if (!targets.length) continue;
        await runScript(targets, buildMacroRowSteps(row), { signal: controller.signal, log: msg => setStatus(msg) });
      }
      setStatus(controller.signal.aborted ? 'Đã dừng phát' : 'Đã phát xong');
    } finally { setPlaying(false); abortPlaybackRef.current = null; }
  }, [buildMacroRowSteps, getTargetsByUdids, playing, rows]);

  /* ── playAppAction ── */
  const playAppAction = useCallback(async (appId: AutomationAppId, actionId: string) => {
    if (playing) { abortPlaybackRef.current?.abort(); setStatus('Đang dừng phát'); return; }
    const action = appActions[appId].find(a => a.id === actionId);
    if (!action) return;
    if (!selectedList.length) { setStatus('Chưa chọn máy'); return; }

    const profileGroups = new Map<string, { profile: AutomationDeviceProfile; udids: string[] }>();
    const noProfileUdids: string[] = [];
    for (const udid of selectedList) {
      const profile = deviceProfiles.find(p => p.udids.includes(udid));
      if (profile) {
        const g = profileGroups.get(profile.id);
        if (g) g.udids.push(udid); else profileGroups.set(profile.id, { profile, udids: [udid] });
      } else { noProfileUdids.push(udid); }
    }

    const legacyTasks: Array<{ binding: AutomationActionMacroBinding; udids: string[] }> = [];
    if (noProfileUdids.length > 0) {
      const legacyBindings = (action.bindings ?? []).filter(b => !b.profileId && Array.isArray(b.targetUdids) && b.targetUdids.length > 0);
      for (const binding of legacyBindings) {
        const matched = noProfileUdids.filter(u => binding.targetUdids?.includes(u));
        if (matched.length > 0) legacyTasks.push({ binding, udids: matched });
      }
    }

    const ranProfiles: string[] = [];
    const missingMacroProfiles: string[] = [];
    const macroNotFoundProfiles: string[] = [];

    setRecording(false); setPlaying(true);
    const controller = new AbortController();
    abortPlaybackRef.current = controller;

    try {
      const tasks: Promise<void>[] = [];
      for (const [, group] of profileGroups) {
        const binding = (action.bindings ?? []).find(b => b.profileId === group.profile.id);
        if (!binding) { missingMacroProfiles.push(group.profile.name); continue; }
        const macro = savedMacros.find(m => m.id === binding.macroId);
        if (!macro) { macroNotFoundProfiles.push(group.profile.name); continue; }
        const targets = getTargetsByUdids(group.udids);
        if (!targets.length) continue;
        ranProfiles.push(group.profile.name);
        tasks.push((async () => {
          for (const row of macro.rows) {
            if (controller.signal.aborted) break;
            if (!isRunnableMacroRow(row)) continue;
            await runScript(targets, buildMacroRowSteps(row), { signal: controller.signal, log: msg => setStatus(msg) });
          }
        })());
      }
      for (const { binding, udids } of legacyTasks) {
        const macro = savedMacros.find(m => m.id === binding.macroId);
        if (!macro) continue;
        const targets = getTargetsByUdids(udids);
        if (!targets.length) continue;
        tasks.push((async () => {
          for (const row of macro.rows) {
            if (controller.signal.aborted) break;
            if (!isRunnableMacroRow(row)) continue;
            await runScript(targets, buildMacroRowSteps(row), { signal: controller.signal, log: msg => setStatus(msg) });
          }
        })());
      }
      if (!tasks.length) {
        const parts: string[] = [];
        if (missingMacroProfiles.length) parts.push(`Thiếu macro: ${missingMacroProfiles.join(', ')}`);
        if (macroNotFoundProfiles.length) parts.push(`Macro đã mất: ${macroNotFoundProfiles.join(', ')}`);
        const legacyBound = legacyTasks.reduce((s, lt) => s + lt.udids.length, 0);
        const npCount = noProfileUdids.length - legacyBound;
        if (npCount > 0) parts.push(`Chưa có profile: ${npCount} máy`);
        setStatus(parts.length ? `Không có macro hợp lệ | ${parts.join(' | ')}` : `Không có macro hợp lệ để chạy cho ${action.name}`);
        return;
      }
      await Promise.all(tasks);
      if (controller.signal.aborted) { setStatus('Đã dừng phát'); } else {
        const parts: string[] = [];
        if (ranProfiles.length) parts.push(`Đã chạy: ${ranProfiles.join(', ')}`);
        if (missingMacroProfiles.length) parts.push(`Thiếu macro: ${missingMacroProfiles.join(', ')}`);
        if (macroNotFoundProfiles.length) parts.push(`Macro đã mất: ${macroNotFoundProfiles.join(', ')}`);
        const legacyBound = legacyTasks.reduce((s, lt) => s + lt.udids.length, 0);
        const npCount = noProfileUdids.length - legacyBound;
        if (npCount > 0) parts.push(`Chưa có profile: ${npCount} máy`);
        setStatus(parts.join(' | '));
      }
    } finally { setPlaying(false); abortPlaybackRef.current = null; }
  }, [appActions, buildMacroRowSteps, deviceProfiles, getTargetsByUdids, playing, savedMacros, selectedList]);

  if (!open) return null;

  /* ── short aliases for context menu ── */
  const ctxTargets = automationContextDeviceTargets;
  const currentProfileId = ctxProfileInfo?.singleProfile?.id ?? null;
  const previewGroup = previewGroupId ? getSeedingGroup(previewGroupId) : null;
  const activeSeedingResolved = activeSeedingJob ? resolveSeedingGroups(activeSeedingJob) : null;
  const seedingSaveBlocked = !activeSeedingJob || !activeSeedingJob.groupAId || !activeSeedingJob.groupBId || activeSeedingJob.groupAId === activeSeedingJob.groupBId;

  /* ══════════════════ RENDER ══════════════════ */
  return (
    <div className={`automationFloatingLayer${coordinatePanelOpen || seedingPanelOpen ? ' withCoordinatePanel' : ''}`} style={{ left: position.x, top: position.y }}>
      <div className='automationModal modal show d-block' role='dialog' aria-modal='false'>
        <div className='modal-dialog automationDialog'>
          <div className='modal-content automationContent'>
            <div className='modal-header automationHeader' onPointerDown={startDrag}>
              <div className='automationTitle'>
                <BotTitleIcon />
                <span>Automation</span>
                {currentMacroName ? <span className='automationMacroName'>{currentMacroName}</span> : null}
              </div>
              <button className='btn-close automationClose' aria-label='Close' onClick={closeModal}><X size={16} strokeWidth={2} /></button>
            </div>

            <div className='modal-body automationBody'>

              {/* ── SECTION: Hành Động ── */}
              <div className='automationActionBlock'>
                <div className='automationSectionTitle'>
                  <span>Hành Động</span>
                  <div className='automationSectionActions'>
                    <button className={`automationArrowBtn${seedingPanelOpen ? ' active' : ''}`} onClick={() => setSeedingPanelOpen(p => !p)} title='Setting'>
                      <Settings size={16} />
                      <span>Setting</span>
                    </button>
                    <button className='automationArrowBtn' onClick={() => setActionRunnerOpen(p => !p)} title={actionRunnerOpen ? 'Ẩn' : 'Hiện'}>
                      {actionRunnerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      <span>{actionRunnerOpen ? 'Ẩn' : 'Hiện'}</span>
                    </button>
                  </div>
                </div>
                {actionRunnerOpen ? (
                  <div className='automationActionIconArea'>
                    <div className='automationAppIconRow'>
                      {AUTOMATION_APPS.map(app => (
                        <div key={app.id} className='automationAppIconSlot'>
                          <button
                            className={`automationAppIconButton${activeActionApp === app.id ? ' active' : ''}`}
                            title={app.label}
                            onClick={() => { setActiveActionApp(app.id); setActionOverlayOpen(p => (p === app.id ? null : app.id)); }}
                            onContextMenu={e => openAutomationContextMenu(e, { type: 'app', appId: app.id })}
                          >
                            <img src={app.icon} alt='' className='automationAppIconOnly' />
                          </button>
                          {actionOverlayOpen === app.id ? (
                            <div className='automationChildActionOverlay' role='dialog' aria-label={`${app.label} actions`}
                              onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
                              onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
                            >
                              <div className='automationActionChildrenPanel'>
                                {appActions[app.id].map(action => (
                                  <button key={action.id}
                                    className='automationChildActionBtn automationPanelChildActionBtn'
                                    title={
                                      (action.bindings ?? []).filter(b => b.profileId)
                                        .map(b => `${b.profileName} → ${b.macroName}`).join('\n') || `${app.label}: ${action.name}`
                                    }
                                    onClick={() => playAppAction(app.id, action.id)}
                                    onContextMenu={e => openAutomationContextMenu(e, { type: 'action', appId: app.id, actionId: action.id })}
                                  >
                                    <span className='automationChildActionLabel'>{action.name}</span>
                                    <img src={app.icon} alt='' className='automationChildActionIcon' />
                                    {(() => {
                                      const profileBindings = (action.bindings ?? []).filter(b => b.profileId);
                                      if (!profileBindings.length) return null;
                                      return <span className='automationBindingBadge'>{profileBindings.length}</span>;
                                    })()}
                                  </button>
                                ))}
                                {!appActions[app.id].length ? <div className='automationEmpty automationActionEmpty'>Trống</div> : null}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* ── SECTION: Danh sách máy ── */}
              <div className='automationDeviceBlock'>
                <div className='automationSectionTitle'>
                  <span>Danh sách máy</span>
                  <div className='automationSectionActions'>
                    <button className={`rcpSelectPill${allAutomationDevicesSelected ? ' on' : ''}`} onClick={() => onToggleAllDevices(!allAutomationDevicesSelected)}>
                      <span className='rcpSelectIcon'>{allAutomationDevicesSelected ? '✔' : ''}</span>
                      <span className='rcpSelectText'>{allAutomationDevicesSelected ? 'Bỏ tất cả' : 'Chọn tất cả'}</span>
                      <span className='rcpSelectCount'>({devices.length})</span>
                    </button>
                    <button className='automationArrowBtn' onClick={() => setDeviceListOpen(p => !p)} title={deviceListOpen ? 'Ẩn' : 'Hiện'}>
                      {deviceListOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      <span>{deviceListOpen ? 'Ẩn' : 'Hiện'}</span>
                    </button>
                  </div>
                </div>
                {deviceListOpen ? (
                  <div className='rcpGridWrap automationGridWrap'>
                    <DeviceSelectionGrid className='automationTotalDeviceGrid' devices={automationGridDevices} selectedUdids={selectedSet}
                      emptyText='Chưa có máy đang mở' onToggleDevice={onToggleDevice}
                      onDeviceContextMenu={(e, udid) => openAutomationContextMenu(e, { type: 'device', udid })}
                    />
                  </div>
                ) : null}
              </div>

              {/* ── Thiết Lập Macro ── */}
              <button className={`automationCoordinateRow${coordinatePanelOpen ? ' open' : ''}`} onClick={openCoordinatePanel}>
                <div className='automationCoordinateTitle'>Thiết Lập Macro</div>
                <div className='automationCoordinateMeta'>{selectedList.length ? `${selectedList.length} máy được chọn` : 'Chưa chọn máy'}</div>
                {status ? <div className={`automationStatus${statusIsError ? ' error' : ''}`}>{status}</div> : <div className='automationStatus muted'>Mở bảng Record/Phát tọa độ</div>}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Coordinate Panel (Thiết Lập Macro) ── */}
      {coordinatePanelOpen ? (
        <div className='automationCoordinatePanel modal show d-block' role='dialog' aria-modal='false'>
          <div className='modal-dialog automationCoordinateDialog'>
            <div className='modal-content automationContent automationCoordinateContent'>
              <div className='modal-header automationHeader' onPointerDown={startDrag}>
                <div className='automationTitle'><Video size={17} /><span>Thiết Lập Macro</span></div>
                <button className='btn-close automationClose' aria-label='Close coordinate panel' onClick={() => setCoordinatePanelOpen(false)}><X size={16} strokeWidth={2} /></button>
              </div>
              <div className='modal-body automationCoordinateBody'>
                <div className='automationToolbar'>
                  <button className='btn automationBtn' onClick={newMacro} title='Mới'><Plus size={16} /><span>Mới</span></button>

                  <button className='btn automationBtn' onClick={saveMacro} disabled={!rows.length} title='Lưu Macro'><Save size={16} /><span>Lưu Macro</span></button>
                  <button className='btn automationBtn' onClick={addBlankStep} title='Thêm bước'><CirclePlus size={16} /><span>Thêm bước</span></button>
                  <button className={`btn automationBtn${recording ? ' active' : ''}`} onClick={toggleRecording} title='Ghi Macro'>
                    {recording ? <Square size={16} /> : <Video size={16} />}<span>{recording ? 'Dừng ghi' : 'Ghi Macro'}</span>
                  </button>
                  <button className={`btn automationBtn automationPlayBtn${playing ? ' active' : ''}`} onClick={playMacro} title='Phát'>
                    {playing ? <Square size={16} /> : <Play size={16} />}<span>{playing ? 'Dừng' : 'Phát'}</span>
                  </button>
                  <button className='btn automationBtn automationNarrowBtn' onClick={() => setStatus(status || 'Automation ready')} title='Log'><Info size={16} /><span>!</span></button>
                  <button className={`btn automationBtn${settingsPanelOpen ? ' active' : ''}`} onClick={() => setSettingsPanelOpen(v => !v)} title='Settings'><Settings size={16} /><span>Settings</span></button>
                </div>

                {/* ── Settings Panel ── */}
                {settingsPanelOpen ? (
                  <div className='automationDeviceBlock' style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#f3f4f6' }}>Ghi Macro: Realtime</span>
                        <span style={{ fontSize: 11, color: '#8590a3', lineHeight: 1.4 }}>Tự động ghi chính xác thao tác Touch, Swipe, thời gian chờ giữa các bước</span>
                      </div>
                      <button
                        type='button'
                        onClick={() => {
                          const next = !realtimeRecording;
                          setRealtimeRecording(next);
                          saveAutomationSettings({ realtimeRecording: next });
                          setStatus(next ? 'Realtime ON — Ghi chính xác thời gian thực' : 'Realtime OFF — Delay mặc định 1000ms');
                        }}
                        style={{
                          position: 'relative', width: 44, height: 24, padding: 0, borderRadius: 12, cursor: 'pointer',
                          background: realtimeRecording ? 'rgba(13,110,253,0.55)' : '#3a3a3a',
                          border: `1px solid ${realtimeRecording ? 'rgba(13,110,253,0.75)' : '#555'}`,
                          transition: 'all 0.2s ease', flexShrink: 0,
                        }}
                      >
                        <span style={{
                          position: 'absolute', top: 2, left: realtimeRecording ? 22 : 2,
                          width: 18, height: 18, borderRadius: '50%',
                          background: realtimeRecording ? '#8ec5ff' : '#888',
                          transition: 'left 0.2s ease, background 0.2s ease',
                        }} />
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className='automationCoordinateContext'>
                  <span className={selectedList.length > 1 ? 'automationErrorText' : undefined}>
                    {selectedRecordDevice ? `Máy ghi: #${formatDeviceNo(selectedRecordDevice.number)}` : selectedList.length > 1 ? 'Chỉ chọn 1 thiết bị' : 'Chưa chọn máy'}
                  </span>
                  {status ? <span className={`automationStatus full${selectedList.length > 1 ? ' error' : ''}`}>{status}</span> : null}
                </div>
                <div className='automationCoordinateTables'>
                  <div className='automationMainTableWrap'>
                    <table className='table table-dark table-sm automationMacroTable'>
                      <thead><tr><th>Step</th><th>Action</th><th>Delay (ms)</th><th>Details</th><th>Note</th></tr></thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr key={row.id}>
                            <td>{i + 1}</td>
                            <td>
                              <select
                                className='automationActionSelect'
                                value={row.action}
                                onChange={e => changeRowAction(row, e.target.value as AutomationMacroAction)}
                                title={`Action hiện tại: ${formatMacroAction(row.action)}`}
                              >
                                <option value='touch'>Touch</option>
                                <option value='swipe'>Vuốt</option>
                                <option value='seeding'>Seeding</option>
                              </select>
                            </td>
                            <td onContextMenu={e => openRowDelayMenu(e, row.id)} title='Chuột phải để đặt random delay'>
                              <div className='automationDelayCell'>
                                <input
                                  className='automationDelayInput'
                                  type='number'
                                  min={0}
                                  value={row.delayMs}
                                  onContextMenu={e => openRowDelayMenu(e, row.id)}
                                  onChange={e => updateRowDelay(row, Math.max(0, Number(e.target.value) || 0))}
                                />
                                {row.delayRandomBaseSec ? <span className='automationDelayRandomBadge'>{formatMacroDelay(row)}</span> : null}
                              </div>
                            </td>
                            <td className='automationDetailsCell'>{formatStepDetails(row)}</td>
                            <td><input className='automationNoteInput' type='text' value={row.note ?? ''} onChange={e => updateRow(row.id, { note: e.target.value })} /></td>
                          </tr>
                        ))}
                        {!rows.length ? <tr><td colSpan={5} className='automationEmptyRow'>Chưa có bước nào</td></tr> : null}
                      </tbody>
                    </table>
                  </div>
                  <div className='automationSavedTableWrap'>
                    <table className='table table-dark table-sm automationSavedTable'>
                      <thead><tr><th>File Macro</th></tr></thead>
                      <tbody>
                        {savedMacros.map(m => (
                          <tr key={m.id}><td>
                            <button className='automationSavedMacroBtn' onClick={() => loadMacro(m)} title={m.name}
                              onContextMenu={e => {
                                e.preventDefault(); e.stopPropagation();
                                setMacroCtxMenu({ macroId: m.id, x: e.clientX, y: e.clientY });
                              }}
                            >{m.name}</button>
                          </td></tr>
                        ))}
                        {!savedMacros.length ? <tr><td className='automationEmptyRow'>Trống</td></tr> : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {seedingPanelOpen ? (
        <div className='automationCoordinatePanel automationSeedingPanel modal show d-block' role='dialog' aria-modal='false'>
          <div className='modal-dialog automationSeedingDialog'>
            <div className='modal-content automationContent automationSeedingContent'>
              <div className='modal-header automationHeader' onPointerDown={startDrag}>
                <div className='automationTitle'><Settings size={17} /><span>Danh sách Nội Dung Seeding</span></div>
                <button className='btn-close automationClose' aria-label='Close seeding panel' onClick={() => setSeedingPanelOpen(false)}><X size={16} strokeWidth={2} /></button>
              </div>
              <div className='modal-body automationSeedingBody'>
                <div className='automationSeedingSection automationSeedingJobsSection'>
                  <div className='automationSeedingSectionHead'>
                    <span>Danh sách Seeding Job</span>
                    <button className='btn automationBtn' type='button' onClick={addSeedingJob}><Plus size={15} /><span>Job</span></button>
                  </div>
                  <div className='automationSeedingJobList'>
                    {seedingJobs.map(job => (
                      <button
                        key={job.id}
                        type='button'
                        className={`automationSeedingJobItem${activeSeedingJob?.id === job.id ? ' active' : ''}`}
                        onClick={() => setActiveSeedingJobId(job.id)}
                      >
                        <span>{job.name}</span>
                        <small>{job.enabled ? 'Enabled' : 'Disabled'} · {job.pairingMode === 'ordered' ? '1-1' : 'Random'}</small>
                      </button>
                    ))}
                    {!seedingJobs.length ? <div className='automationEmpty automationActionEmpty'>Chưa có job</div> : null}
                  </div>
                </div>

                <div className='automationSeedingSection automationSeedingContentSection'>
                  <div className='automationSeedingSectionHead'>
                    <span>Danh sách Từ ngữ chung</span>
                    <small>{seedingContents.split(/\r?\n/).map(line => line.trim()).filter(Boolean).length} dòng</small>
                  </div>
                  <textarea
                    className='automationSeedingTextarea'
                    value={seedingContents}
                    onChange={e => setSeedingContents(e.target.value)}
                    placeholder={'Mỗi dòng là một nội dung random dùng chung cho tất cả Seeding Job\nVí dụ:\nHello bạn\nHôm nay thế nào?'}
                  />
                </div>

                {activeSeedingJob ? (
                  <>
                    <div className='automationSeedingSection'>
                      <div className='automationSeedingSectionHead'>
                        <span>Thông tin job</span>
                        <label className='automationSeedingSwitch'>
                          <input type='checkbox' checked={activeSeedingJob.enabled} onChange={e => updateSeedingJob(activeSeedingJob.id, { enabled: e.target.checked })} />
                          <span>Enabled</span>
                        </label>
                      </div>
                      <input className='automationSeedingInput' value={activeSeedingJob.name} onChange={e => updateSeedingJob(activeSeedingJob.id, { name: e.target.value })} placeholder='Tên job' />
                    </div>

                    <div className='automationSeedingSection'>
                      <div className='automationSeedingSectionHead'><span>Nhóm máy</span></div>
                      <div className='automationSeedingGroupGrid'>
                        <label>
                          <span>Nhóm A</span>
                          <select className='automationSeedingInput' value={activeSeedingJob.groupAId} onChange={e => selectSeedingGroup(activeSeedingJob.id, 'A', e.target.value)}>
                            <option value=''>Chọn nhóm</option>
                            {seedingGroupRefs.map(group => <option key={group.id} value={group.id}>{group.name} ({group.udids.length})</option>)}
                          </select>
                          <button className='btn automationBtn' type='button' disabled={!activeSeedingJob.groupAId} onClick={() => setPreviewGroupId(activeSeedingJob.groupAId)}>Xem máy</button>
                        </label>
                        <label>
                          <span>Nhóm B</span>
                          <select className='automationSeedingInput' value={activeSeedingJob.groupBId} onChange={e => selectSeedingGroup(activeSeedingJob.id, 'B', e.target.value)}>
                            <option value=''>Chọn nhóm</option>
                            {seedingGroupRefs.map(group => <option key={group.id} value={group.id}>{group.name} ({group.udids.length})</option>)}
                          </select>
                          <button className='btn automationBtn' type='button' disabled={!activeSeedingJob.groupBId} onClick={() => setPreviewGroupId(activeSeedingJob.groupBId)}>Xem máy</button>
                        </label>
                      </div>
                      <div className='automationSeedingToggleRow'>
                        <label><input type='radio' checked={!activeSeedingJob.lockSnapshot} onChange={() => updateSeedingJob(activeSeedingJob.id, { lockSnapshot: false })} /> Dùng nhóm live theo Grid</label>
                        <label><input type='radio' checked={activeSeedingJob.lockSnapshot} onChange={() => updateSeedingJob(activeSeedingJob.id, job => ({ lockSnapshot: true, groupASnapshot: resolveSeedingGroups(job).groupAUdids, groupBSnapshot: resolveSeedingGroups(job).groupBUdids }))} /> Khoá snapshot danh sách máy hiện tại</label>
                      </div>
                      {previewGroup ? (
                        <div className='automationSeedingPreview'>
                          <strong>{previewGroup.name}</strong>
                          <span>{previewGroup.udids.join(', ') || 'Trống'}</span>
                        </div>
                      ) : null}
                      {activeSeedingResolved ? (
                        <div className='automationSeedingMeta'>
                          A: {activeSeedingResolved.groupAUdids.length} máy · B: {activeSeedingResolved.groupBUdids.length} máy
                        </div>
                      ) : null}
                      {seedingWarnings.map(warning => <div key={warning} className='automationSeedingWarning'>{warning}</div>)}
                    </div>

                    <div className='automationSeedingSection'>
                      <div className='automationSeedingSectionHead'><span>Cấu hình lịch chạy</span></div>
                      <div className='automationSeedingFormGrid'>
                        <label><span>Pairing Mode</span><select className='automationSeedingInput' value={activeSeedingJob.pairingMode} onChange={e => updateSeedingJob(activeSeedingJob.id, { pairingMode: e.target.value as SeedingPairingMode })}><option value='ordered'>1-1 theo thứ tự</option><option value='random'>Random cặp</option></select></label>
                        <label><span>Day</span><input className='automationSeedingInput' type='number' min={1} max={31} value={activeSeedingJob.day} onChange={e => updateSeedingJob(activeSeedingJob.id, { day: clampNumber(e.target.value, 1, 31, activeSeedingJob.day) })} /></label>
                        <label><span>Hour</span><input className='automationSeedingInput' type='number' min={0} max={23} value={activeSeedingJob.hour} onChange={e => updateSeedingJob(activeSeedingJob.id, { hour: clampNumber(e.target.value, 0, 23, activeSeedingJob.hour) })} /></label>
                        <label><span>Minute</span><input className='automationSeedingInput' type='number' min={0} max={59} value={activeSeedingJob.minute} onChange={e => updateSeedingJob(activeSeedingJob.id, { minute: clampNumber(e.target.value, 0, 59, activeSeedingJob.minute) })} /></label>
                        <label><span>Delay min (sec)</span><input className='automationSeedingInput' type='number' min={1} value={activeSeedingJob.delayMinSec} onChange={e => updateSeedingJob(activeSeedingJob.id, { delayMinSec: clampNumber(e.target.value, 1, 86400, 10) })} /></label>
                        <label><span>Delay max (sec)</span><input className='automationSeedingInput' type='number' min={1} value={activeSeedingJob.delayMaxSec} onChange={e => updateSeedingJob(activeSeedingJob.id, { delayMaxSec: clampNumber(e.target.value, 1, 86400, 60) })} /></label>
                        <label><span>Duration (min)</span><input className='automationSeedingInput' type='number' min={1} value={activeSeedingJob.durationMin} onChange={e => updateSeedingJob(activeSeedingJob.id, { durationMin: clampNumber(e.target.value, 1, 1440, 10) })} /></label>
                        <label><span>Max runs</span><input className='automationSeedingInput' type='number' min={0} value={activeSeedingJob.maxRuns} onChange={e => updateSeedingJob(activeSeedingJob.id, { maxRuns: clampNumber(e.target.value, 0, 9999, 0) })} /></label>
                        <label><span>Repeat</span><select className='automationSeedingInput' value={activeSeedingJob.repeatEnabled ? '1' : '0'} onChange={e => updateSeedingJob(activeSeedingJob.id, { repeatEnabled: e.target.value === '1' })}><option value='0'>Tắt</option><option value='1'>Bật</option></select></label>
                        <label><span>Repeat mode</span><select className='automationSeedingInput' value={activeSeedingJob.repeatMode} onChange={e => updateSeedingJob(activeSeedingJob.id, { repeatMode: e.target.value as SeedingRepeatMode })}><option value='minutes'>Phút</option><option value='hours'>Giờ</option><option value='days'>Ngày</option></select></label>
                        <label><span>Repeat every</span><input className='automationSeedingInput' type='number' min={1} value={activeSeedingJob.repeatEveryValue} onChange={e => updateSeedingJob(activeSeedingJob.id, { repeatEveryValue: clampNumber(e.target.value, 1, 999, 1) })} /></label>
                        <label><span>Missed run</span><select className='automationSeedingInput' value={activeSeedingJob.missedRunPolicy} onChange={e => updateSeedingJob(activeSeedingJob.id, { missedRunPolicy: e.target.value as SeedingMissedRunPolicy })}><option value='skip'>Bỏ qua</option><option value='runLate'>Chạy trễ</option></select></label>
                        <label><span>Running job</span><select className='automationSeedingInput' value={activeSeedingJob.runningJobPolicy} onChange={e => updateSeedingJob(activeSeedingJob.id, { runningJobPolicy: e.target.value as SeedingRunningJobPolicy })}><option value='skip'>Bỏ qua lần mới</option><option value='restart'>Dừng và chạy lại</option></select></label>
                      </div>
                      <div className='automationSeedingActions'>
                        <button className='btn automationBtn' type='button' onClick={() => runSeedingJob(activeSeedingJob.id, { test: true })} disabled={runningSeedingIds.has(activeSeedingJob.id)}><Play size={15} /><span>Chạy thử</span></button>
                        <button className='btn automationBtn' type='button' disabled={seedingSaveBlocked} onClick={() => { saveSeedingJobs(seedingJobsRef.current); saveSeedingContents(seedingContents); appendSeedingLog(`Đã lưu ${activeSeedingJob.name} và danh sách từ/ngữ chung`); }}><Save size={15} /><span>Lưu</span></button>
                        <button className='btn automationBtn' type='button' onClick={() => stopSeedingJob(activeSeedingJob.id)} disabled={!runningSeedingIds.has(activeSeedingJob.id)}><Square size={15} /><span>Dừng</span></button>
                        <button className='btn automationBtn' type='button' onClick={() => duplicateSeedingJob(activeSeedingJob)}><FolderOpen size={15} /><span>Nhân bản job</span></button>
                        <button className='btn automationBtn' type='button' onClick={() => deleteSeedingJob(activeSeedingJob.id)}><Trash2 size={15} /><span>Xoá</span></button>
                      </div>
                    </div>
                  </>
                ) : null}

                <div className='automationSeedingSection automationSeedingLogSection'>
                  <div className='automationSeedingSectionHead'><span>Nhật ký trạng thái job</span></div>
                  <div className='automationSeedingLog'>
                    {seedingLogs.map((line, idx) => <div key={`${line}-${idx}`}>{line}</div>)}
                    {!seedingLogs.length ? <div className='automationEmpty'>Chưa có log</div> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ══════════════════ CONTEXT MENUS ══════════════════ */}
      {automationContextMenu && (automationContextApp || automationContextMenu.type === 'device') ? (
        <div className='automationContextMenuPanel contextMenuPanel dropdown-menu show'
          style={{ left: automationContextMenu.x, top: automationContextMenu.y }}
          onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
          onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
        >

          {/* ── Context: app cha → Thêm hành động ── */}
          {automationContextMenu.type === 'app' ? (
            <button type='button' className='automationContextMenuItem dropdown-item'
              onPointerDown={e => { e.preventDefault(); e.stopPropagation(); addAppAction(automationContextMenu.appId); }}
            >
              <Plus size={14} /><span>Thêm hành động {automationContextApp?.label}</span>
            </button>
          ) : null}

          {/* ── Context: action con → Đổi tên / Xoá ── */}
          {automationContextMenu.type === 'action' ? (
            <>
              <button type='button' className='automationContextMenuItem dropdown-item'
                onPointerDown={e => {
                  e.preventDefault(); e.stopPropagation();
                  openRenameAction(automationContextMenu.appId, automationContextMenu.actionId);
                }}
              >
                <Pencil size={14} /><span>Đổi tên hành động</span>
              </button>
              <div className='automationContextMenuDivider' />
              <button type='button' className='automationContextMenuItem automationContextMenuDanger dropdown-item'
                disabled={!automationContextAction}
                onPointerDown={e => {
                  e.preventDefault(); e.stopPropagation();
                  if (!automationContextAction) return;
                  const appId = automationContextMenu.appId;
                  const actionId = automationContextMenu.actionId;
                  const actionName = automationContextAction.name;
                  const bindingCount = (automationContextAction.bindings ?? []).filter(b => b.profileId).length;
                  setAutomationContextMenu(null);
                  setConfirmModal({
                    title: 'Xoá hành động',
                    message: `Xoá hành động "${actionName}" sẽ xoá toàn bộ macro binding đã gán (${bindingCount} profile). File macro gốc vẫn được giữ.\n\nBạn có chắc muốn xoá không?`,
                    onConfirm: () => { deleteAppActionImpl(appId, actionId); setConfirmModal(null); },
                  });
                }}
              >
                <Trash2 size={14} /><span>Xoá hành động</span>
              </button>
            </>
          ) : null}

          {/* ── Context: device → Device Profile + App Actions ── */}
          {automationContextMenu.type === 'device' && ctxProfileInfo ? (
            <>
              {/* ═══ Device Profile section ═══ */}
              <div className='automationContextMenuLabel' onMouseEnter={() => setCtxSub(null)}>Device Profile</div>

              {/* Profile trigger row → opens profile list submenu */}
              <div style={{ position: 'relative' }} onMouseEnter={() => setCtxSub({ main: 'profileList' })}>
                <button type='button' className='automationContextMenuItem dropdown-item'
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                    <Users size={14} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ctxProfileInfo.singleProfile
                        ? `Hiện tại: ${ctxProfileInfo.singleProfile.name}`
                        : ctxProfileInfo.profileCount > 1
                          ? `Nhiều profile (${ctxProfileInfo.profileCount})`
                          : 'Chưa có Device Profile'}
                    </span>
                  </span>
                  <ChevronRight size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
                </button>

                {/* ═ Level 2: Profile list submenu ═ */}
                {ctxSub?.main === 'profileList' ? (
                  <div className='automationContextMenuPanel contextMenuPanel dropdown-menu show'
                    style={{ position: 'absolute', left: 'calc(100% - 4px)', top: '-4px', minWidth: 220, zIndex: 10 }}
                    onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
                    onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
                  >
                    {/* Tạo Profile mới (always first) */}
                    <button type='button' className='automationContextMenuItem dropdown-item'
                      onMouseEnter={() => setCtxSub({ main: 'profileList' })}
                      onPointerDown={e => {
                        e.preventDefault(); e.stopPropagation();
                        const hints = ctxTargets.map(u => { const d = deviceByUdid.get(u); return [d?.manufacturer, d?.model].filter(Boolean).join(' '); }).filter(Boolean);
                        setAutomationContextMenu(null);
                        setInputModal({
                          key: makeId('input'),
                          title: 'Tạo Device Profile mới',
                          label: 'Tên Profile',
                          placeholder: 'Ví dụ: Samsung Note 9 Pixel ROM',
                          defaultValue: hints[0] || '',
                          onConfirm: (name) => { createProfileForDevices(name, ctxTargets); setInputModal(null); },
                        });
                      }}
                    >
                      <Plus size={14} /><span>Tạo Profile mới</span>
                    </button>

                    {deviceProfiles.length > 0 ? <div className='automationContextMenuDivider' /> : null}

                    {/* Each profile → Level 3 actions */}
                    {deviceProfiles.map(profile => {
                      const isCurrentProfile = profile.id === currentProfileId;
                      const nested = ctxSub?.nested;
                      const isL3Open = typeof nested === 'object' && nested !== null && nested.type === 'profileActions' && nested.profileId === profile.id;
                      return (
                        <div key={profile.id} style={{ position: 'relative' }}
                          onMouseEnter={() => setCtxSub({ main: 'profileList', nested: { type: 'profileActions', profileId: profile.id } })}
                        >
                          <button type='button' className='automationContextMenuItem dropdown-item'
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {profile.name}{isCurrentProfile ? ' (hiện tại)' : ''}
                            </span>
                            <ChevronRight size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
                          </button>

                          {/* ═ Level 3: Profile actions submenu ═ */}
                          {isL3Open ? (
                            <div className='automationContextMenuPanel contextMenuPanel dropdown-menu show'
                              style={{ position: 'absolute', left: 'calc(100% - 4px)', top: '-4px', minWidth: 180, zIndex: 11 }}
                              onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
                              onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
                            >
                              {/* Gán vào Profile này */}
                              <button type='button' className='automationContextMenuItem dropdown-item'
                                disabled={isCurrentProfile}
                                onPointerDown={e => {
                                  e.preventDefault(); e.stopPropagation();
                                  if (isCurrentProfile) return;
                                  assignDevicesToProfile(profile.id, ctxTargets);
                                  setAutomationContextMenu(null);
                                }}
                              >
                                <Users size={14} /><span>{isCurrentProfile ? 'Đang dùng Profile này' : 'Gán vào Profile này'}</span>
                              </button>

                              <div className='automationContextMenuDivider' />

                              {/* Đổi tên Profile → InputModal */}
                              <button type='button' className='automationContextMenuItem dropdown-item'
                                onPointerDown={e => {
                                  e.preventDefault(); e.stopPropagation();
                                  setAutomationContextMenu(null);
                                  setInputModal({
                                    key: makeId('input'),
                                    title: 'Đổi tên Device Profile',
                                    label: 'Tên mới',
                                    defaultValue: profile.name,
                                    onConfirm: (newName) => { renameProfile(profile.id, newName); setInputModal(null); },
                                  });
                                }}
                              >
                                <Pencil size={14} /><span>Đổi tên Profile</span>
                              </button>

                              {/* Xoá Profile → ConfirmDeleteModal */}
                              <button type='button' className='automationContextMenuItem automationContextMenuDanger dropdown-item'
                                onPointerDown={e => {
                                  e.preventDefault(); e.stopPropagation();
                                  const pId = profile.id;
                                  const pName = profile.name;
                                  const bindingCount = AUTOMATION_APPS.reduce((sum, app) =>
                                    sum + appActions[app.id].reduce((s, a) => s + (a.bindings ?? []).filter(b => b.profileId === pId).length, 0), 0);
                                  setAutomationContextMenu(null);
                                  setConfirmModal({
                                    title: 'Xoá Device Profile',
                                    message: `Xoá Device Profile "${pName}" sẽ gỡ toàn bộ máy khỏi Profile và xoá ${bindingCount} macro binding đã gán cho Profile này.\n\nFile macro gốc vẫn được giữ.\n\nBạn có chắc muốn xoá không?`,
                                    onConfirm: () => { deleteProfileImpl(pId); setConfirmModal(null); },
                                  });
                                }}
                              >
                                <Trash2 size={14} /><span>Xoá Profile</span>
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {/* ═══ App Actions (dynamic) ═══ */}
              {AUTOMATION_APPS.map(app => {
                const actions = appActions[app.id];
                if (!actions.length) return null;
                return (
                  <React.Fragment key={`ctx-app-${app.id}`}>
                    <div className='automationContextMenuDivider' />
                    <div className='automationContextMenuLabel' onMouseEnter={() => setCtxSub(null)}>{app.label}</div>
                    {actions.map(action => {
                      const isOpen = typeof ctxSub?.main === 'object' && ctxSub.main.appId === app.id && ctxSub.main.actionId === action.id;
                      return (
                        <div key={`ctx-act-${action.id}`} style={{ position: 'relative' }}
                          onMouseEnter={() => setCtxSub({ main: { appId: app.id, actionId: action.id } })}
                        >
                          <button type='button' className='automationContextMenuItem dropdown-item'
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.name}</span>
                            <ChevronRight size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
                          </button>

                          {/* ═ Level 2: Action binding submenu ═ */}
                          {isOpen && actionSubmenuInfo ? (
                            <div className='automationContextMenuPanel contextMenuPanel dropdown-menu show'
                              style={{ position: 'absolute', left: 'calc(100% - 4px)', top: '-4px', minWidth: 260, zIndex: 10 }}
                              onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
                              onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
                            >
                              {/* chưa profile */}
                              {actionSubmenuInfo.unassigned.length > 0 ? (
                                <>
                                  <button type='button' className='automationContextMenuItem dropdown-item' disabled><Users size={14} /><span>Chưa có Device Profile</span></button>
                                  <button type='button' className='automationContextMenuItem dropdown-item' disabled><span>Hãy gán/tạo Profile trước</span></button>
                                </>
                              ) : actionSubmenuInfo.profileCount > 1 ? (
                                <>
                                  <button type='button' className='automationContextMenuItem dropdown-item' disabled><span>Các máy thuộc nhiều Device Profile khác nhau</span></button>
                                  <button type='button' className='automationContextMenuItem dropdown-item' disabled><span>Chọn cùng Device Profile để gán macro</span></button>
                                </>
                              ) : actionSubmenuInfo.singleProfile ? (
                                <>
                                  {/* Info: Device Profile */}
                                  <button type='button' className='automationContextMenuItem dropdown-item' disabled
                                    onMouseEnter={() => setCtxSub({ main: { appId: app.id, actionId: action.id } })}
                                  >
                                    <Users size={14} /><span>Device Profile: {actionSubmenuInfo.singleProfile.name}</span>
                                  </button>

                                  {/* Info: Macro hiện tại */}
                                  {actionSubmenuInfo.binding ? (
                                    <button type='button' className='automationContextMenuItem dropdown-item' disabled
                                      onMouseEnter={() => setCtxSub({ main: { appId: app.id, actionId: action.id } })}
                                    >
                                      <Save size={14} />
                                      <span>{actionSubmenuInfo.macroExists ? `Macro hiện tại: ${actionSubmenuInfo.binding.macroName}` : `⚠ Macro đã mất: ${actionSubmenuInfo.binding.macroName}`}</span>
                                    </button>
                                  ) : (
                                    <button type='button' className='automationContextMenuItem dropdown-item' disabled
                                      onMouseEnter={() => setCtxSub({ main: { appId: app.id, actionId: action.id } })}
                                    >
                                      <span>Chưa gán macro</span>
                                    </button>
                                  )}

                                  <div className='automationContextMenuDivider' />

                                  {/* Đổi / Chọn File Macro → Level 3 */}
                                  <div style={{ position: 'relative' }}
                                    onMouseEnter={() => setCtxSub({ main: { appId: app.id, actionId: action.id }, nested: 'macroList' })}
                                  >
                                    <button type='button' className='automationContextMenuItem dropdown-item'
                                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                                    >
                                      <span>{actionSubmenuInfo.binding ? 'Đổi File Macro' : 'Chọn File Macro'}</span>
                                      <ChevronRight size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
                                    </button>

                                    {/* ═ Level 3: Macro list (no clip, proper width) ═ */}
                                    {ctxSub?.nested === 'macroList' ? (
                                      <div className='automationContextMenuPanel contextMenuPanel dropdown-menu show'
                                        style={{ position: 'absolute', left: 'calc(100% - 4px)', top: '-4px', minWidth: 280, maxWidth: 400, zIndex: 11, maxHeight: 400, overflowY: 'auto', overflowX: 'hidden' }}
                                        onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
                                      >
                                        {savedMacros.map(macro => (
                                          <button key={macro.id} type='button'
                                            className='automationContextMenuItem dropdown-item'
                                            disabled={actionSubmenuInfo.binding?.macroId === macro.id}
                                            title={macro.name}
                                            onPointerDown={e => {
                                              e.preventDefault(); e.stopPropagation();
                                              if (actionSubmenuInfo.binding?.macroId === macro.id) return;
                                              assignMacroToAction(app.id, action.id, macro, actionSubmenuInfo.singleProfile!);
                                              setAutomationContextMenu(null);
                                            }}
                                          >
                                            {actionSubmenuInfo.binding?.macroId === macro.id ? <Save size={14} style={{ flexShrink: 0 }} /> : <FolderOpen size={14} style={{ flexShrink: 0 }} />}
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{macro.name}</span>
                                          </button>
                                        ))}
                                        {!savedMacros.length ? (
                                          <button type='button' className='automationContextMenuItem dropdown-item' disabled><span>Chưa có File Macro</span></button>
                                        ) : null}
                                      </div>
                                    ) : null}
                                  </div>

                                  {/* Xoá gán macro → ConfirmDeleteModal */}
                                  {actionSubmenuInfo.binding ? (
                                    <>
                                      <div className='automationContextMenuDivider' />
                                      <button type='button' className='automationContextMenuItem automationContextMenuDanger dropdown-item'
                                        onMouseEnter={() => setCtxSub({ main: { appId: app.id, actionId: action.id } })}
                                        onPointerDown={e => {
                                          e.preventDefault(); e.stopPropagation();
                                          const profileId = actionSubmenuInfo.singleProfile!.id;
                                          const profileName = actionSubmenuInfo.singleProfile!.name;
                                          const macroName = actionSubmenuInfo.binding!.macroName;
                                          const actionName = action.name;
                                          setAutomationContextMenu(null);
                                          setConfirmModal({
                                            title: 'Xoá gán macro',
                                            message: `Xoá gán macro "${macroName}" khỏi hành động "${actionName}" cho Device Profile "${profileName}".\n\nFile macro gốc vẫn được giữ.\n\nBạn có chắc muốn xoá không?`,
                                            onConfirm: () => { removeBindingImpl(app.id, action.id, profileId); setConfirmModal(null); },
                                          });
                                        }}
                                      >
                                        <Trash2 size={14} /><span>Xoá gán macro</span>
                                      </button>
                                    </>
                                  ) : null}
                                </>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </>
          ) : null}
        </div>
      ) : null}

      {/* ══════════════════ MACRO CONTEXT MENU (Portal, fixed) ══════════════════ */}
      {rowDelayCtxMenu ? (() => {
        const row = rows.find(r => r.id === rowDelayCtxMenu.rowId);
        if (!row) return null;
        return createPortal(
          <div className='automationRowDelayCtxPanel automationContextMenuPanel contextMenuPanel dropdown-menu show'
            style={{ position: 'fixed', left: rowDelayCtxMenu.x, top: rowDelayCtxMenu.y, zIndex: 27000, minWidth: 210 }}
            onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
            onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
          >
            <button type='button' className='automationContextMenuItem dropdown-item'
              onPointerDown={e => {
                e.preventDefault(); e.stopPropagation();
                openRandomDelayInput(row);
              }}
            >
              <Pencil size={14} /><span>Random khoảng...</span>
            </button>
            {row.delayRandomBaseSec ? (
              <button type='button' className='automationContextMenuItem dropdown-item'
                onPointerDown={e => {
                  e.preventDefault(); e.stopPropagation();
                  clearRandomDelay(row.id);
                }}
              >
                <X size={14} /><span>Tắt random delay</span>
              </button>
            ) : null}
            <div className='automationContextMenuHint'>Hiện tại: {row.delayRandomBaseSec ? formatMacroDelay(row) : `${Math.round(row.delayMs / 1000)}s cố định`}</div>
          </div>,
          document.body,
        );
      })() : null}

      {macroCtxMenu ? (() => {
        const macro = savedMacros.find(m => m.id === macroCtxMenu.macroId);
        if (!macro) return null;
        const bindingCount = AUTOMATION_APPS.reduce((sum, app) =>
          sum + appActions[app.id].reduce((s, a) => s + (a.bindings ?? []).filter(b => b.macroId === macro.id).length, 0), 0);
        return createPortal(
          <div className='automationMacroCtxPanel automationContextMenuPanel contextMenuPanel dropdown-menu show'
            style={{ position: 'fixed', left: macroCtxMenu.x, top: macroCtxMenu.y, zIndex: 27000, minWidth: 200 }}
            onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
            onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
          >

            {/* Đổi tên File Macro → InputModal */}
            <button type='button' className='automationContextMenuItem dropdown-item'
              onPointerDown={e => {
                e.preventDefault(); e.stopPropagation();
                setMacroCtxMenu(null);
                setInputModal({
                  key: makeId('input'),
                  title: 'Đổi tên File Macro',
                  label: 'Tên mới',
                  defaultValue: macro.name,
                  onConfirm: (newName) => { renameMacro(macro.id, newName); setInputModal(null); },
                });
              }}
            >
              <Pencil size={14} /><span>Đổi tên File Macro</span>
            </button>

            <div className='automationContextMenuDivider' />

            {/* Xoá File Macro → ConfirmDeleteModal */}
            <button type='button' className='automationContextMenuItem automationContextMenuDanger dropdown-item'
              onPointerDown={e => {
                e.preventDefault(); e.stopPropagation();
                const mId = macro.id;
                const mName = macro.name;
                setMacroCtxMenu(null);
                setConfirmModal({
                  title: 'Xoá File Macro',
                  message: bindingCount > 0
                    ? `File Macro "${mName}" đang được dùng bởi ${bindingCount} hành động/profile. Xoá file macro sẽ làm các hành động đó báo "Macro đã mất". File binding không bị xoá.\n\nBạn có chắc muốn xoá không?`
                    : `Xoá File Macro "${mName}"? Thao tác này không thể hoàn tác.\n\nBạn có chắc muốn xoá không?`,
                  onConfirm: () => { deleteMacroImpl(mId); setConfirmModal(null); },
                });
              }}
            >
              <Trash2 size={14} /><span>Xoá File Macro</span>
            </button>
          </div>,
          document.body,
        );
      })() : null}

      {/* ══════════════════ MODALS (Portal → document.body) ══════════════════ */}
      <ConfirmDeleteModal state={confirmModal} onClose={() => setConfirmModal(null)} />
      <InputModal state={inputModal} onClose={() => setInputModal(null)} />
    </div>
  );
}

function BotTitleIcon() {
  return <span className='automationTitleIcon' aria-hidden='true'><Video size={17} strokeWidth={2} /></span>;
}
