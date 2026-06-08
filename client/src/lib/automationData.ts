/* ── automationData.ts ──────────────────────────────────────────
   Shared types, constants, and persistence helpers for the
   Automation subsystem.  Both AutomationModal and App.tsx import
   from here to avoid circular dependencies.
   ─────────────────────────────────────────────────────────────── */

/* ── types ─────────────────────────────────────────────────────── */

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
  action: 'touch' | 'swipe' | 'seeding';
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

export type SavedAutomationMacro = {
  id: string;
  name: string;
  rows: AutomationMacroRow[];
  createdAt?: number;
  updatedAt: number;
};

/* ── constants ─────────────────────────────────────────────────── */

export const AUTOMATION_MACROS_KEY = 'automationMacrosV1';
export const AUTOMATION_APP_ACTIONS_KEY = 'automationAppActionsV1';
export const AUTOMATION_DEVICE_PROFILES_KEY = 'automationDeviceProfilesV1';
export const AUTOMATION_SEEDING_CONTENTS_KEY = 'automationSeedingContentsV1';

export const AUTOMATION_APPS: Array<{ id: AutomationAppId; label: string; icon: string }> = [
  { id: 'wechat', label: 'Wechat', icon: '/automation-icons/WechatIcon.png' },
  { id: 'line', label: 'Line', icon: '/automation-icons/LINE_New_App_Icon_(2020-12).png' },
  { id: 'tantan', label: 'Tantan', icon: '/automation-icons/TantanIcon.png' },
  { id: 'setting', label: 'Setting', icon: '/automation-icons/setting.png' },
];

/** Custom event name dispatched when the set of macro-running udids changes */
export const MACRO_RUNNING_UDIDS_EVENT = 'monviewphone:macro-running-udids';

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

/* ── persistence ───────────────────────────────────────────────── */

export function loadSavedMacros(): SavedAutomationMacro[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTOMATION_MACROS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is SavedAutomationMacro => Boolean(item?.id && item?.name && Array.isArray(item?.rows)))
      .map(item => ({
        ...item,
        createdAt: Number(item.createdAt) || Number(item.updatedAt) || Date.now(),
        updatedAt: Number(item.updatedAt) || Number(item.createdAt) || Date.now(),
      }));
  } catch { return []; }
}

export function saveSavedMacros(macros: SavedAutomationMacro[]) {
  try { localStorage.setItem(AUTOMATION_MACROS_KEY, JSON.stringify(macros)); } catch { /* ignore */ }
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
  try { localStorage.setItem(AUTOMATION_APP_ACTIONS_KEY, JSON.stringify(actions)); } catch { /* ignore */ }
}

export function loadDeviceProfiles(): AutomationDeviceProfile[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTOMATION_DEVICE_PROFILES_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return sortDeviceProfilesByName(parsed.filter((item): item is AutomationDeviceProfile => Boolean(item?.id && item?.name && Array.isArray(item?.udids))));
  } catch { return []; }
}

export function saveDeviceProfiles(profiles: AutomationDeviceProfile[]) {
  try { localStorage.setItem(AUTOMATION_DEVICE_PROFILES_KEY, JSON.stringify(sortDeviceProfilesByName(profiles))); } catch { /* ignore */ }
}

/* ── seeding content persistence ─────────────────────────────── */

export const DEFAULT_SEEDING_CONTENTS = `Hey
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

export function normalizeSeedingContentLines(value: string) {
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
