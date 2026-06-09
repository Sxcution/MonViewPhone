import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CirclePlus,
  Clock3,
  FolderOpen,
  Info,
  Pencil,
  Play,
  Plus,
  Save,
  Settings,
  Square,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { useActive } from '@/context/ActiveContext';
import {
  AUTOMATION_CLICK_EVENT,
  AUTOMATION_KEY_EVENT,
  AUTOMATION_SWIPE_EVENT,
  AUTOMATION_TEXT_EVENT,
  runScript,
  type AutomationClickDetail,
  type AutomationKeyDetail,
  type AutomationSwipeDetail,
  type AutomationTextDetail,
  type AutomationStep,
} from '@/lib/automation';
import { AndroidKeycode } from '@/lib/keyEvent';
import {
  DEFAULT_SYNC_MACRO_SETTINGS,
  loadSyncMacroSettings,
  normalizeSyncMacroSettings,
  saveSyncMacroSettings,
  syncMacroDelayRangeMs,
  type SyncMacroSettings,
  SYNC_MACRO_SETTINGS_EVENT,
} from '@/lib/syncMacroSettings';
import { SyncTimeSettingsModal } from './SyncTimeSettingsModal';
import {
  type AutomationMacroRow,
  type SavedAutomationMacro,
  type AutomationAppId,
  type AutomationAppAction,
  type AutomationActionMacroBinding,
  type AutomationDeviceProfile,
  loadSavedMacros,
  saveSavedMacros,
  loadAppActions,
  saveAppActions,
  loadDeviceProfiles,
  saveDeviceProfiles,
  loadSeedingContents,
  AUTOMATION_DATA_CHANGED_EVENT,
  MACRO_RUNNING_UDIDS_EVENT,
  MACRO_PLAYBACK_PROGRESS_EVENT,
  MACRO_PLAYBACK_STOP_EVENT,
  type MacroPlaybackProgressDetail,
  type MacroPlaybackStopDetail,
} from '@/lib/automationData';

/* ── types ── */

export type AutomationDeviceOption = {
  udid: string;
  number: number;
  manufacturer?: string;
  model?: string;
};

export type AutomationModalRef = {
  playAppAction: (appId: AutomationAppId, actionId: string) => Promise<void>;
  playing: boolean;
};

type AutomationContextMenuTarget =
  | { type: 'app'; appId: AutomationAppId; x: number; y: number }
  | { type: 'action'; appId: AutomationAppId; actionId: string; x: number; y: number };

type AutomationContextMenuInput =
  | { type: 'app'; appId: AutomationAppId }
  | { type: 'action'; appId: AutomationAppId; actionId: string };

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

type MacroSortMode = 'name' | 'createdAt';

type AutomationModalProps = {
  open: boolean;
  devices: AutomationDeviceOption[];
  selectedUdids: string[];
  viewerUdid?: string | null;
  onClose: () => void;
};

/* ── constants ── */

const AUTOMATION_SETTINGS_KEY = 'automationSettingsV1';
const DEFAULT_DELAY_MS = 1000;
const ONLY_ONE_DEVICE_MSG = 'Chỉ chọn 1 thiết bị';
const SELECT_ONE_DEVICE_MSG = 'Chọn 1 thiết bị';

const AUTOMATION_APPS: Array<{ id: AutomationAppId; label: string; icon: string }> = [
  { id: 'wechat', label: 'Wechat', icon: '/automation-icons/WechatIcon.png' },
  { id: 'line', label: 'Line', icon: '/automation-icons/LINE_New_App_Icon_(2020-12).png' },
  { id: 'tantan', label: 'Tantan', icon: '/automation-icons/TantanIcon.png' },
  { id: 'setting', label: 'Setting', icon: '/automation-icons/setting.png' },
];

/* ── helpers ── */

function loadAutomationSettings(): { realtimeRecording: boolean } {
  try {
    const v = JSON.parse(localStorage.getItem(AUTOMATION_SETTINGS_KEY) || '{}');
    return { realtimeRecording: !!v.realtimeRecording };
  } catch {
    return { realtimeRecording: false };
  }
}

function saveAutomationSettings(s: { realtimeRecording: boolean }) {
  try {
    localStorage.setItem(AUTOMATION_SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

function makeId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function compareByName(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base', numeric: true });
}

function sortMacros(macros: SavedAutomationMacro[], mode: MacroSortMode) {
  const next = [...macros];
  if (mode === 'name') return next.sort(compareByName);
  return next.sort((a, b) => (b.createdAt ?? b.updatedAt ?? 0) - (a.createdAt ?? a.updatedAt ?? 0));
}

function loadMacroSortMode(): MacroSortMode {
  try {
    return localStorage.getItem('automationMacroSortModeV1') === 'createdAt' ? 'createdAt' : 'name';
  } catch {
    return 'name';
  }
}

function saveMacroSortMode(mode: MacroSortMode) {
  try {
    localStorage.setItem('automationMacroSortModeV1', mode);
  } catch {
    // ignore
  }
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
  if (row.action === 'key') return Number.isFinite(row.keycode);
  if (row.action === 'text') return Boolean(row.text?.length);
  if (row.action === 'swipe') {
    return row.x01 != null && row.y01 != null && row.endX01 != null && row.endY01 != null;
  }
  return row.x01 != null && row.y01 != null;
}

function rowToSteps(row: AutomationMacroRow, opts?: { seedingText?: string }): AutomationStep[] {
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

function cloneRows(rows: AutomationMacroRow[]) {
  return rows.map(row => ({
    ...row,
    targetUdids: Array.isArray(row.targetUdids) ? [...row.targetUdids] : [],
    note: row.note ?? '',
  }));
}

function formatDeviceNo(n: number) {
  return String(n || 0).padStart(2, '0');
}

function clamp01Value(value: number) {
  return Math.max(0, Math.min(1, value));
}

function formatMacroAction(action: AutomationMacroRow['action']) {
  if (action === 'swipe') return 'Vuốt';
  if (action === 'seeding') return 'Seeding';
  if (action === 'key') return 'Key';
  if (action === 'text') return 'Text';
  return 'Touch';
}

function formatStepDetails(row: AutomationMacroRow) {
  if (row.action === 'swipe') {
    return `(${row.x ?? ''},${row.y ?? ''}) → (${row.endX ?? ''},${row.endY ?? ''}) ${row.durationMs ?? 0}ms`;
  }
  if (row.action === 'seeding') return 'Random từ ngữ chung + Enter';
  if (row.action === 'key') return `Keycode=${row.keycode ?? ''}`;
  if (row.action === 'text') return row.text ? `Text="${row.text}"` : 'Text=""';
  return `X=${row.x == null ? '' : row.x}, Y=${row.y == null ? '' : row.y}`;
}

function makeActionPatch(row: AutomationMacroRow, action: AutomationMacroRow['action']): Partial<AutomationMacroRow> {
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

function clampPosition(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function sleepMs(ms: number, signal?: AbortSignal) {
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

function randomInt(min: number, max: number) {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.floor(low + Math.random() * (high - low + 1));
}

function pickSeedingContent() {
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

function pickSeedingContents(count: number) {
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

function ConfirmDeleteModal({ state, onClose }: { state: ConfirmModalState; onClose: () => void }) {
  if (!state) return null;
  return createPortal(
    <>
      <div className="confirmOverlay" onMouseDown={onClose}>
        <div className="confirmPanel compact" onMouseDown={e => e.stopPropagation()}>
          <div className="confirmTitle">{state.title}</div>
          <div className="confirmText" style={{ whiteSpace: 'pre-wrap' }}>
            {state.message}
          </div>
          <div className="confirmActions center">
            <button type='button' className="modalBtn" onClick={onClose}>Huỷ</button>
            <button type='button' className="modalBtnDanger" onClick={state.onConfirm}>Xác Nhận</button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

function InputModalInner({ state, onClose }: { state: NonNullable<InputModalState>; onClose: () => void }) {
  const [value, setValue] = useState(state.defaultValue ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = () => {
    const v = value.trim();
    if (!v) return;
    state.onConfirm(v);
  };

  return createPortal(
    <>
      <div className="confirmOverlay" onMouseDown={onClose}>
        <div className="confirmPanel" style={{ minWidth: 380, maxWidth: 480 }} onMouseDown={e => e.stopPropagation()}>
          <div className="confirmTitle">{state.title}</div>
          <div className="confirmText">
            {state.label ? <label className="modalLabelSmall" style={{ display: 'block', marginBottom: 8 }}>{state.label}</label> : null}
            <input
              ref={inputRef}
              type='text'
              className="modalInput"
              placeholder={state.placeholder ?? ''}
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') onClose();
              }}
            />
          </div>
          <div className="confirmActions">
            <button type='button' className="modalBtn" onClick={onClose}>Huỷ</button>
            <button
              type='button'
              className="modalBtnPrimary"
              style={{
                opacity: value.trim() ? 1 : 0.5,
                cursor: value.trim() ? 'pointer' : 'not-allowed',
              }}
              disabled={!value.trim()}
              onClick={handleSubmit}
            >
              {state.confirmText ?? 'Xác Nhận'}
            </button>
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

function DeviceAssignModal({
  profileId,
  devices,
  deviceProfiles,
  onSave,
  onClose,
}: {
  profileId: string;
  devices: AutomationDeviceOption[];
  deviceProfiles: AutomationDeviceProfile[];
  onSave: (udids: string[]) => void;
  onClose: () => void;
}) {
  const profile = deviceProfiles.find(p => p.id === profileId);
  if (!profile) return null;

  const [checkedUdids, setCheckedUdids] = useState<string[]>(() => [...profile.udids]);

  const toggleUdid = (udid: string) => {
    setCheckedUdids(prev => {
      if (prev.includes(udid)) {
        return prev.filter(u => u !== udid);
      } else {
        return [...prev, udid];
      }
    });
  };

  return createPortal(
    <div className='confirmOverlay' onMouseDown={onClose}>
      <div className='confirmPanel' onMouseDown={e => e.stopPropagation()} style={{ width: '400px' }}>
        <div className='confirmTitle'>Gán thiết bị</div>
        <div className='confirmText' style={{ marginBottom: 12 }}>
          Chọn các thiết bị gán cho profile <strong>"{profile.name}"</strong>:
        </div>
        <div className='automationDeviceSelectList'>
          {devices.map(device => {
            const isChecked = checkedUdids.includes(device.udid);
            const otherProfile = deviceProfiles.find(p => p.id !== profileId && p.udids.includes(device.udid));
            return (
              <label key={device.udid} className='automationDeviceSelectRow'>
                <input
                  type='checkbox'
                  checked={isChecked}
                  onChange={() => toggleUdid(device.udid)}
                />
                <span className='automationDeviceSelectLabel'>
                  No. {device.number} - {[device.manufacturer, device.model].filter(Boolean).join(' ') || 'Device'} ({device.udid}) {otherProfile ? `[Profile: ${otherProfile.name}]` : ''}
                </span>
              </label>
            );
          })}
          {!devices.length ? <div style={{ padding: 12, textAlign: 'center', color: '#888' }}>Không có máy online</div> : null}
        </div>
        <div className='confirmActions center'>
          <button type='button' className='modalBtn' onClick={onClose}>
            Huỷ
          </button>
          <button
            type='button'
            className='modalBtnPrimary'
            onClick={() => onSave(checkedUdids)}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── main component ── */

export const AutomationModal = forwardRef<any, AutomationModalProps>(
  function AutomationModalComponent({
    open,
    devices,
    selectedUdids,
    viewerUdid = null,
    onClose,
  }, ref) {
  const { getTargetsByUdids } = useActive();

  /* ── state ── */
  const [actionRunnerOpen, setActionRunnerOpen] = useState(true);
  const [coordinatePanelOpen, setCoordinatePanelOpen] = useState(false);
  const [rows, setRows] = useState<AutomationMacroRow[]>([]);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showProfileSection, setShowProfileSection] = useState(true);
  const [deviceAssigningProfileId, setDeviceAssigningProfileId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [savedMacros, setSavedMacros] = useState<SavedAutomationMacro[]>(loadSavedMacros);
  const [appActions, setAppActions] = useState<Record<AutomationAppId, AutomationAppAction[]>>(loadAppActions);
  const [deviceProfiles, setDeviceProfiles] = useState<AutomationDeviceProfile[]>(loadDeviceProfiles);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [activeProfileAction, setActiveProfileAction] = useState<{ appId: AutomationAppId; actionId: string } | null>(null);
  const [activeActionApp, setActiveActionApp] = useState<AutomationAppId>('wechat');
  const [actionOverlayOpen, setActionOverlayOpen] = useState<AutomationAppId | null>(null);
  const [automationContextMenu, setAutomationContextMenu] = useState<AutomationContextMenuTarget | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(null);
  const [inputModal, setInputModal] = useState<InputModalState>(null);
  const [macroCtxMenu, setMacroCtxMenu] = useState<MacroCtxMenuState>(null);
  const [rowDelayCtxMenu, setRowDelayCtxMenu] = useState<RowDelayCtxMenuState>(null);
  const [macroSortMode, setMacroSortMode] = useState<MacroSortMode>(loadMacroSortMode);
  const [macroSortMenuOpen, setMacroSortMenuOpen] = useState(false);
  const [currentMacroName, setCurrentMacroName] = useState('');
  const [position, setPosition] = useState({ x: 120, y: 80 });
  const [draggingRowId, setDraggingRowId] = useState<string | null>(null);
  const [editingTouchRowId, setEditingTouchRowId] = useState<string | null>(null);
  const [realtimeRecording, setRealtimeRecording] = useState(() => loadAutomationSettings().realtimeRecording);

  // Sync Macro state
  const [syncMacroOpen, setSyncMacroOpen] = useState(false);
  const [syncMacroSettings, setSyncMacroSettings] = useState<SyncMacroSettings>(loadSyncMacroSettings);
  const syncMacroDelayRange = useMemo(() => syncMacroDelayRangeMs(syncMacroSettings.intervalSec), [syncMacroSettings.intervalSec]);

  // Settings Panel state
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);

  const recordingRef = useRef(false);
  const recordTargetRef = useRef<string | null>(null);
  const editingTouchRowIdRef = useRef<string | null>(null);
  const playbackControllersRef = useRef<Map<string, AbortController>>(new Map());
  const manualPlaybackIdRef = useRef<string | null>(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const lastRecordTimestampRef = useRef<number>(0);
  const macroRunningCounterRef = useRef<Map<string, number>>(new Map());

  /* ── memos ── */
  const deviceByUdid = useMemo(() => {
    const map = new Map<string, AutomationDeviceOption>();
    devices.forEach(d => map.set(d.udid, d));
    return map;
  }, [devices]);

  const recordTargetUdid = useMemo(
    () => viewerUdid || (selectedUdids.length === 1 ? selectedUdids[0] : null),
    [selectedUdids, viewerUdid],
  );

  const selectedRecordDevice = useMemo(
    () => (recordTargetUdid ? deviceByUdid.get(recordTargetUdid) ?? null : null),
    [deviceByUdid, recordTargetUdid],
  );

  const statusIsError = status === ONLY_ONE_DEVICE_MSG || status === SELECT_ONE_DEVICE_MSG;
  const sortedSavedMacros = useMemo(() => sortMacros(savedMacros, macroSortMode), [savedMacros, macroSortMode]);
  const selectedProfile = useMemo(
    () => deviceProfiles.find(profile => profile.id === activeProfileId) ?? null,
    [activeProfileId, deviceProfiles],
  );
  const profileActionItems = useMemo(() => (
    AUTOMATION_APPS.flatMap(app => (appActions[app.id] ?? []).map(action => ({ app, action })))
  ), [appActions]);
  const selectedProfileActionItem = useMemo(() => {
    if (!activeProfileAction) return null;
    return profileActionItems.find(item => item.app.id === activeProfileAction.appId && item.action.id === activeProfileAction.actionId) ?? null;
  }, [activeProfileAction, profileActionItems]);
  const selectedProfileBinding = useMemo(() => {
    if (!selectedProfile || !selectedProfileActionItem) return null;
    return (selectedProfileActionItem.action.bindings ?? []).find(binding => binding.profileId === selectedProfile.id) ?? null;
  }, [selectedProfile, selectedProfileActionItem]);

  /* ── callbacks ── */
  const refreshAutomationData = useCallback(() => {
    setSavedMacros(loadSavedMacros());
    setAppActions(loadAppActions());
    setDeviceProfiles(loadDeviceProfiles());
  }, []);

  const updateSyncMacroSettings = useCallback((patch: Partial<SyncMacroSettings>) => {
    setSyncMacroSettings(prev => saveSyncMacroSettings({ ...prev, ...patch }));
  }, []);

  const updateRunningMacroUdids = useCallback((udids: string[], isStarting: boolean) => {
    const map = macroRunningCounterRef.current;
    udids.forEach(u => {
      const current = map.get(u) || 0;
      if (isStarting) {
        map.set(u, current + 1);
      } else {
        map.set(u, Math.max(0, current - 1));
      }
    });

    const running = Array.from(map.entries())
      .filter(([_, count]) => count > 0)
      .map(([udid]) => udid);

    window.dispatchEvent(new CustomEvent(MACRO_RUNNING_UDIDS_EVENT, { detail: running }));
  }, []);

  const updatePlaybackProgress = useCallback((detail: MacroPlaybackProgressDetail) => {
    window.dispatchEvent(new CustomEvent(MACRO_PLAYBACK_PROGRESS_EVENT, { detail }));
  }, []);

  const updateMacroSortMode = useCallback((mode: MacroSortMode) => {
    setMacroSortMode(mode);
    saveMacroSortMode(mode);
    setMacroSortMenuOpen(false);
  }, []);

  const closeModal = useCallback(() => {
    setRecording(false);
    setEditingTouchRowId(null);
    setActionOverlayOpen(null);
    setAutomationContextMenu(null);
    setMacroCtxMenu(null);
    setRowDelayCtxMenu(null);
    setMacroSortMenuOpen(false);
    onClose();
  }, [onClose]);

  /* ── app action helpers ── */
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
          saveAppActions(next);
          return next;
        });
        setActiveActionApp(appId);
        setActionOverlayOpen(appId);
        setStatus(`Đã thêm hành động: ${name}`);
        setInputModal(null);
      },
    });
  }, []);

  const deleteAppActionImpl = useCallback((appId: AutomationAppId, actionId: string) => {
    const actionName = appActions[appId].find(a => a.id === actionId)?.name;
    setAppActions(prev => {
      const next = { ...prev, [appId]: prev[appId].filter(a => a.id !== actionId) };
      saveAppActions(next);
      return next;
    });
    setStatus(actionName ? `Đã xoá hành động: ${actionName}` : 'Đã xoá hành động');
  }, [appActions]);

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
          saveAppActions(next);
          return next;
        });
        setStatus(`Đã đổi tên thành "${name}"`);
        setInputModal(null);
      },
    });
  }, [appActions]);

  const openAutomationContextMenu = useCallback((event: React.MouseEvent<HTMLElement>, target: AutomationContextMenuInput) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveActionApp(target.appId);
    const x = clampPosition(event.clientX, 8, Math.max(8, window.innerWidth - 230));
    const y = clampPosition(event.clientY, 8, Math.max(8, window.innerHeight - 112));
    if (target.type === 'app') {
      setAutomationContextMenu({ type: 'app', appId: target.appId, x, y });
    } else {
      setAutomationContextMenu({ type: 'action', appId: target.appId, actionId: target.actionId, x, y });
    }
  }, []);

  const createProfile = useCallback(() => {
    setInputModal({
      key: makeId('input'),
      title: 'Tạo Profile mới',
      label: 'Tên Profile',
      placeholder: 'Ví dụ: K30 ultra',
      onConfirm: (name) => {
        const profile: AutomationDeviceProfile = {
          id: makeId('profile'),
          name,
          udids: [],
          updatedAt: Date.now(),
        };
        setDeviceProfiles(prev => {
          const next = [...prev, profile];
          saveDeviceProfiles(next);
          return next;
        });
        setActiveProfileId(profile.id);
        setStatus(`Đã tạo Profile: ${name}`);
        setInputModal(null);
      },
    });
  }, []);

  const renameProfile = useCallback((profile: AutomationDeviceProfile) => {
    setInputModal({
      key: makeId('input'),
      title: 'Đổi tên Profile',
      label: 'Tên mới',
      defaultValue: profile.name,
      onConfirm: (name) => {
        setDeviceProfiles(prev => {
          const next = prev.map(item => item.id === profile.id ? { ...item, name, updatedAt: Date.now() } : item);
          saveDeviceProfiles(next);
          return next;
        });
        setAppActions(prev => {
          const next = { ...prev };
          for (const appId of Object.keys(next) as AutomationAppId[]) {
            next[appId] = next[appId].map(action => ({
              ...action,
              bindings: (action.bindings ?? []).map(binding => (
                binding.profileId === profile.id ? { ...binding, profileName: name } : binding
              )),
            }));
          }
          saveAppActions(next);
          return next;
        });
        setStatus(`Đã đổi tên Profile: ${name}`);
        setInputModal(null);
      },
    });
  }, []);

  const deleteProfile = useCallback((profile: AutomationDeviceProfile) => {
    const bindingCount = AUTOMATION_APPS.reduce((sum, app) => (
      sum + (appActions[app.id] ?? []).reduce((s, action) => s + (action.bindings ?? []).filter(binding => binding.profileId === profile.id).length, 0)
    ), 0);
    setConfirmModal({
      title: 'Xoá Profile',
      message: `Xoá Profile "${profile.name}" sẽ gỡ ${profile.udids.length} máy khỏi Profile và xoá ${bindingCount} macro binding đã gán cho Profile này.\n\nFile macro gốc vẫn được giữ.\n\nBạn có chắc muốn xoá không?`,
      onConfirm: () => {
        setDeviceProfiles(prev => {
          const next = prev.filter(item => item.id !== profile.id);
          saveDeviceProfiles(next);
          return next;
        });
        setAppActions(prev => {
          const next = { ...prev };
          for (const appId of Object.keys(next) as AutomationAppId[]) {
            next[appId] = next[appId].map(action => ({
              ...action,
              bindings: (action.bindings ?? []).filter(binding => binding.profileId !== profile.id),
            }));
          }
          saveAppActions(next);
          return next;
        });
        setStatus(`Đã xoá Profile: ${profile.name}`);
        setConfirmModal(null);
      },
    });
  }, [appActions]);

  const assignMacroToProfileAction = useCallback((
    profile: AutomationDeviceProfile,
    appId: AutomationAppId,
    action: AutomationAppAction,
    macro: SavedAutomationMacro,
  ) => {
    setAppActions(prev => {
      const nextActions = (prev[appId] ?? []).map(item => {
        if (item.id !== action.id) return item;
        const bindings = (item.bindings ?? []).filter(binding => binding.profileId !== profile.id);
        bindings.push({
          id: makeId('binding'),
          macroId: macro.id,
          macroName: macro.name,
          profileId: profile.id,
          profileName: profile.name,
          updatedAt: Date.now(),
        });
        return { ...item, bindings };
      });
      const next = { ...prev, [appId]: nextActions };
      saveAppActions(next);
      return next;
    });
    setStatus(`Đã gán ${macro.name} cho ${profile.name} / ${action.name}`);
  }, []);

  const removeProfileActionBinding = useCallback((
    profile: AutomationDeviceProfile,
    appId: AutomationAppId,
    action: AutomationAppAction,
  ) => {
    setAppActions(prev => {
      const nextActions = (prev[appId] ?? []).map(item => (
        item.id === action.id
          ? { ...item, bindings: (item.bindings ?? []).filter(binding => binding.profileId !== profile.id) }
          : item
      ));
      const next = { ...prev, [appId]: nextActions };
      saveAppActions(next);
      return next;
    });
    setStatus(`Đã xoá gán macro cho ${profile.name} / ${action.name}`);
  }, []);

  const openCoordinatePanel = useCallback(() => {
    setCoordinatePanelOpen(true);
    if (!recordTargetUdid) {
      setStatus(SELECT_ONE_DEVICE_MSG);
    }
  }, [recordTargetUdid]);

  const startRecording = useCallback(() => {
    setCoordinatePanelOpen(true);
    if (!viewerUdid && selectedUdids.length > 1) {
      setRecording(false);
      setStatus(ONLY_ONE_DEVICE_MSG);
      return;
    }
    if (!recordTargetUdid) {
      setRecording(false);
      setStatus(SELECT_ONE_DEVICE_MSG);
      return;
    }
    setRecording(true);
    lastRecordTimestampRef.current = 0;
    const no = deviceByUdid.get(recordTargetUdid)?.number;
    setStatus(`Đang ghi${realtimeRecording ? ' (Realtime)' : ''}${no ? ` máy #${formatDeviceNo(no)}` : ''}`);
  }, [deviceByUdid, recordTargetUdid, realtimeRecording, selectedUdids.length, viewerUdid]);

  const toggleRecording = useCallback(() => {
    if (recording) {
      setRecording(false);
      setStatus('Đã dừng ghi tọa độ');
      return;
    }
    startRecording();
  }, [recording, startRecording]);

  const addBlankStep = useCallback(() => {
    setRows(prev => [...prev, {
      id: makeId('step'),
      action: 'touch',
      delayMs: DEFAULT_DELAY_MS,
      targetUdids: [],
      note: '',
    }]);
  }, []);

  const updateRow = useCallback((id: string, patch: Partial<AutomationMacroRow>) => {
    setRows(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)));
  }, []);

  const startEditTouchDetails = useCallback((row: AutomationMacroRow, index: number) => {
    if (row.action !== 'touch') return;
    if (!recordTargetUdid) {
      setStatus(SELECT_ONE_DEVICE_MSG);
      return;
    }
    setEditingTouchRowId(row.id);
    setStatus(`Chọn tọa độ mới cho step ${index + 1}`);
  }, [recordTargetUdid]);

  const deleteRow = useCallback((rowId: string) => {
    setRows(prev => {
      const index = prev.findIndex(row => row.id === rowId);
      const next = prev.filter(row => row.id !== rowId);
      setStatus(index >= 0 ? `Đã xoá step ${index + 1}` : 'Đã xoá step');
      return next;
    });
    if (editingTouchRowIdRef.current === rowId) setEditingTouchRowId(null);
    setRowDelayCtxMenu(null);
  }, []);

  const moveRow = useCallback((sourceId: string, targetId: string, placement: 'before' | 'after') => {
    if (sourceId === targetId) return;
    setRows(prev => {
      const sourceIndex = prev.findIndex(row => row.id === sourceId);
      const targetIndex = prev.findIndex(row => row.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      const adjustedTargetIndex = next.findIndex(row => row.id === targetId);
      const insertAt = placement === 'after' ? adjustedTargetIndex + 1 : adjustedTargetIndex;
      next.splice(insertAt, 0, moved);
      setStatus(`Đã chuyển step ${sourceIndex + 1} đến ${targetIndex + 1}`);
      return next;
    });
  }, []);

  const changeRowAction = useCallback((row: AutomationMacroRow, action: AutomationMacroRow['action']) => {
    updateRow(row.id, makeActionPatch(row, action));
  }, [updateRow]);

  const updateRowDelay = useCallback((row: AutomationMacroRow, delayMs: number) => {
    const nextDelayMs = Math.max(0, Math.floor(delayMs));
    const patch: Partial<AutomationMacroRow> = { delayMs: nextDelayMs };
    if (row.delayRandomBaseSec) {
      patch.delayRandomBaseSec = Math.max(1, Math.round(nextDelayMs / 1000) || 1);
    }
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

  const saveMacro = useCallback(() => {
    setInputModal({
      key: makeId('input'),
      title: 'Lưu File Macro',
      label: 'Tên File Macro',
      placeholder: 'Ví dụ: Samsung Note 9 WN Macro',
      defaultValue: currentMacroName || `Macro ${new Date().toLocaleTimeString('vi-VN')}`,
      confirmText: 'Lưu',
      onConfirm: (cleanName) => {
        setSavedMacros(prev => {
          const existing = prev.find(m => m.name === cleanName);
          const now = Date.now();
          const nextMacro: SavedAutomationMacro = {
            id: existing?.id ?? makeId('macro'),
            name: cleanName,
            rows: cloneRows(rows),
            syncMacroSettings: normalizeSyncMacroSettings(syncMacroSettings),
            createdAt: existing?.createdAt ?? existing?.updatedAt ?? now,
            updatedAt: now,
          };
          const next = [nextMacro, ...prev.filter(m => m.name !== cleanName)].slice(0, 50);
          saveSavedMacros(next);
          return next;
        });
        setCurrentMacroName(cleanName);
        setStatus(`Đã lưu File Macro: ${cleanName}`);
        setInputModal(null);
      },
    });
  }, [currentMacroName, rows, syncMacroSettings]);

  const loadMacro = useCallback((macro: SavedAutomationMacro) => {
    if (recordingRef.current) {
      setStatus('⚠ Đang ghi macro – hãy Dừng ghi hoặc Lưu trước khi mở file khác');
      return;
    }
    setRows(cloneRows(macro.rows));
    setCurrentMacroName(macro.name);
    setSyncMacroSettings(saveSyncMacroSettings(normalizeSyncMacroSettings(macro.syncMacroSettings ?? DEFAULT_SYNC_MACRO_SETTINGS)));
    setStatus(`Đã mở File Macro: ${macro.name}`);
  }, []);

  const renameMacro = useCallback((macroId: string, newName: string) => {
    const oldMacro = savedMacros.find(m => m.id === macroId);
    setSavedMacros(prev => {
      const next = prev.map(m => m.id === macroId ? { ...m, name: newName, updatedAt: Date.now() } : m);
      saveSavedMacros(next);
      return next;
    });
    if (oldMacro && currentMacroName === oldMacro.name) {
      setCurrentMacroName(newName);
    }
    setAppActions(prev => {
      const next = { ...prev };
      for (const appId of Object.keys(next) as AutomationAppId[]) {
        next[appId] = next[appId].map(action => ({
          ...action,
          bindings: action.bindings.map(b => b.macroId === macroId ? { ...b, macroName: newName } : b),
        }));
      }
      saveAppActions(next);
      return next;
    });
    setStatus(`Đã đổi tên File Macro thành "${newName}"`);
  }, [savedMacros, currentMacroName]);

  const deleteMacroImpl = useCallback((macroId: string) => {
    const macro = savedMacros.find(m => m.id === macroId);
    setSavedMacros(prev => {
      const next = prev.filter(m => m.id !== macroId);
      saveSavedMacros(next);
      return next;
    });
    if (macro && currentMacroName === macro.name) {
      setCurrentMacroName('');
    }
    setStatus(`Đã xoá File Macro: ${macro?.name ?? ''}`);
  }, [savedMacros, currentMacroName]);

  const runMacroRow = useCallback(async (
    targets: ReturnType<typeof getTargetsByUdids>,
    row: AutomationMacroRow,
    controller: AbortController,
    macroSyncSettings: SyncMacroSettings,
  ) => {
    const delayMs = resolveMacroDelayMs(row);
    if (delayMs > 0) {
      setStatus(`wait ${delayMs}`);
      await sleepMs(delayMs, controller.signal);
      if (controller.signal.aborted) return;
    }
    const seedingText = row.action === 'seeding' ? pickSeedingContent() : undefined;
    const seedingTexts = row.action === 'seeding' ? pickSeedingContents(targets.length) : [];
    if (row.action === 'seeding') {
      if (!seedingTexts.length) {
        setStatus('Seeding lỗi: danh sách từ ngữ chung trống');
        return;
      }
      const hasOpenStream = targets.some(t => t.ws && t.ws.readyState === WebSocket.OPEN);
      if (!hasOpenStream) {
        setStatus('Seeding lỗi: target chưa online hoặc stream chưa mở');
        return;
      }
      const formattedUdids = targets.map(t => {
        const no = deviceByUdid.get(t.udid)?.number;
        return '#' + (no ?? t.udid);
      }).join(', ');
      setStatus(`Seeding ${formattedUdids}: random rieng tung may`);
      for (let i = 0; i < targets.length; i++) {
        if (controller.signal.aborted) return;
        if (i > 0 && macroSyncSettings.delayEnabled) {
          if (macroSyncSettings.intervalEnabled) {
            const { minMs, maxMs } = syncMacroDelayRangeMs(macroSyncSettings.intervalSec);
            await sleepMs(randomInt(minMs, maxMs), controller.signal);
          } else {
            await sleepMs(100, controller.signal);
          }
          if (controller.signal.aborted) return;
        }
        const target = targets[i];
        const text = seedingTexts[i] ?? pickSeedingContent();
        const no = deviceByUdid.get(target.udid)?.number;
        setStatus(`Seeding #${no ?? target.udid}: ${text}`);
        await runScript([target], rowToSteps(row, { seedingText: text }), {
          signal: controller.signal,
          syncSettings: macroSyncSettings,
        });
      }
      return;
      setStatus(`Seeding máy ${formattedUdids}: ${seedingText}`);
    }
    await runScript(targets, rowToSteps(row, { seedingText }), {
      signal: controller.signal,
      syncSettings: macroSyncSettings,
      log: msg => {
        if (row.action !== 'seeding') setStatus(msg);
      },
    });
  }, [deviceByUdid]);

  const newMacro = useCallback(() => {
    setRows([]);
    setCurrentMacroName('');
    setStatus('Đã tạo macro mới');
  }, []);

  const playMacro = useCallback(async () => {
    if (playing) {
      const activeManualId = manualPlaybackIdRef.current;
      if (activeManualId) playbackControllersRef.current.get(activeManualId)?.abort();
      setStatus('Đang dừng phát');
      return;
    }
    const runnableRows = rows.filter(isRunnableMacroRow);
    if (!runnableRows.length) {
      setStatus('Chưa có bước tọa độ để phát');
      return;
    }
    setRecording(false);
    setPlaying(true);
    const controller = new AbortController();
    const playbackId = makeId('macro-playback');
    manualPlaybackIdRef.current = playbackId;
    playbackControllersRef.current.set(playbackId, controller);
    const targetUdidsList = selectedUdids.length > 0 ? selectedUdids : (selectedRecordDevice ? [selectedRecordDevice.udid] : []);
    const startedAt = Date.now();
    const playbackTitle = currentMacroName || 'Thiết Lập Macro';
    try {
      const targets = getTargetsByUdids(targetUdidsList);
      if (!targets.length) {
        setStatus('Lỗi: Chưa chọn máy nào để phát Macro');
        return;
      }
      updateRunningMacroUdids(targetUdidsList, true);
      updatePlaybackProgress({ id: playbackId, running: true, title: playbackTitle, udids: targetUdidsList, startedAt });
      const currentMacroSyncSettings = normalizeSyncMacroSettings(syncMacroSettings);
      for (const row of runnableRows) {
        if (controller.signal.aborted) break;
        await runMacroRow(targets, row, controller, currentMacroSyncSettings);
      }
      setStatus(controller.signal.aborted ? 'Đã dừng phát' : 'Đã phát xong');
    } finally {
      setPlaying(false);
      if (manualPlaybackIdRef.current === playbackId) manualPlaybackIdRef.current = null;
      playbackControllersRef.current.delete(playbackId);
      updateRunningMacroUdids(targetUdidsList, false);
      updatePlaybackProgress({ id: playbackId, running: false, title: playbackTitle, udids: targetUdidsList, startedAt });
    }
  }, [currentMacroName, getTargetsByUdids, playing, rows, runMacroRow, selectedUdids, selectedRecordDevice, syncMacroSettings, updatePlaybackProgress, updateRunningMacroUdids]);

  const playAppAction = useCallback(async (appId: AutomationAppId, actionId: string) => {
    const latestAppActions = loadAppActions();
    const latestDeviceProfiles = loadDeviceProfiles();
    const latestSavedMacros = loadSavedMacros();
    setAppActions(latestAppActions);
    setDeviceProfiles(latestDeviceProfiles);
    setSavedMacros(latestSavedMacros);

    const action = latestAppActions[appId].find(a => a.id === actionId);
    if (!action) return;
    const targetUdidsList = selectedUdids.length > 0 ? selectedUdids : (recordTargetUdid ? [recordTargetUdid] : []);
    if (!targetUdidsList.length) {
      setStatus('Chưa chọn máy');
      return;
    }

    const profileGroups = new Map<string, { profile: AutomationDeviceProfile; udids: string[] }>();
    const noProfileUdids: string[] = [];
    for (const udid of targetUdidsList) {
      const profile = latestDeviceProfiles.find(p => p.udids.includes(udid));
      if (profile) {
        const g = profileGroups.get(profile.id);
        if (g) g.udids.push(udid);
        else profileGroups.set(profile.id, { profile, udids: [udid] });
      } else {
        noProfileUdids.push(udid);
      }
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

    setRecording(false);
    const controller = new AbortController();
    const playbackId = makeId('action-playback');
    playbackControllersRef.current.set(playbackId, controller);
    const startedAt = Date.now();
    let progressStarted = false;

    try {
      const tasks: Promise<void>[] = [];
      for (const [, group] of profileGroups) {
        const binding = (action.bindings ?? []).find(b => b.profileId === group.profile.id);
        if (!binding) {
          missingMacroProfiles.push(group.profile.name);
          continue;
        }
        const macro = latestSavedMacros.find(m => m.id === binding.macroId);
        if (!macro) {
          macroNotFoundProfiles.push(group.profile.name);
          continue;
        }
        const targets = getTargetsByUdids(group.udids);
        if (!targets.length) continue;
        ranProfiles.push(group.profile.name);
        const macroSyncSettings = normalizeSyncMacroSettings(macro.syncMacroSettings ?? DEFAULT_SYNC_MACRO_SETTINGS);
        tasks.push((async () => {
          try {
            updateRunningMacroUdids(group.udids, true);
            for (const row of macro.rows) {
              if (controller.signal.aborted) break;
              if (!isRunnableMacroRow(row)) continue;
              await runMacroRow(targets, row, controller, macroSyncSettings);
            }
          } finally {
            updateRunningMacroUdids(group.udids, false);
          }
        })());
      }
      for (const { binding, udids } of legacyTasks) {
        const macro = latestSavedMacros.find(m => m.id === binding.macroId);
        if (!macro) continue;
        const targets = getTargetsByUdids(udids);
        if (!targets.length) continue;
        const macroSyncSettings = normalizeSyncMacroSettings(macro.syncMacroSettings ?? DEFAULT_SYNC_MACRO_SETTINGS);
        tasks.push((async () => {
          try {
            updateRunningMacroUdids(udids, true);
            for (const row of macro.rows) {
              if (controller.signal.aborted) break;
              if (!isRunnableMacroRow(row)) continue;
              await runMacroRow(targets, row, controller, macroSyncSettings);
            }
          } finally {
            updateRunningMacroUdids(udids, false);
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
      progressStarted = true;
      updatePlaybackProgress({ id: playbackId, running: true, title: action.name, udids: targetUdidsList, startedAt });
      await Promise.all(tasks);
      if (controller.signal.aborted) {
        setStatus('Đã dừng phát');
      } else {
        const parts: string[] = [];
        if (ranProfiles.length) parts.push(`Đã chạy: ${ranProfiles.join(', ')}`);
        if (missingMacroProfiles.length) parts.push(`Thiếu macro: ${missingMacroProfiles.join(', ')}`);
        if (macroNotFoundProfiles.length) parts.push(`Macro đã mất: ${macroNotFoundProfiles.join(', ')}`);
        const legacyBound = legacyTasks.reduce((s, lt) => s + lt.udids.length, 0);
        const npCount = noProfileUdids.length - legacyBound;
        if (npCount > 0) parts.push(`Chưa có profile: ${npCount} máy`);
        setStatus(parts.join(' | '));
      }
    } finally {
      playbackControllersRef.current.delete(playbackId);
      if (progressStarted) {
        updatePlaybackProgress({ id: playbackId, running: false, title: action.name, udids: targetUdidsList, startedAt });
      }
    }
  }, [getTargetsByUdids, recordTargetUdid, runMacroRow, selectedUdids, updatePlaybackProgress, updateRunningMacroUdids]);

  useImperativeHandle(ref, () => ({
    playAppAction,
    playing,
  }), [playAppAction, playing]);

  /* ── drag window ── */
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

  /* ── effects ── */
  useEffect(() => {
    if (!open) return;
    const width = coordinatePanelOpen ? 1200 : 860;
    const height = 600;
    setPosition({
      x: Math.max(12, Math.round((window.innerWidth - width) / 2)),
      y: Math.max(48, Math.round((window.innerHeight - height) / 2)),
    });
  }, [coordinatePanelOpen, open]);

  useEffect(() => {
    if (!open || !coordinatePanelOpen) return;
    const estimatedWidth = 1280;
    setPosition(prev => ({
      x: clampPosition(prev.x, 12, Math.max(12, window.innerWidth - estimatedWidth - 12)),
      y: clampPosition(prev.y, 12, Math.max(12, window.innerHeight - 120)),
    }));
  }, [coordinatePanelOpen, open]);

  useEffect(() => {
    if (!deviceProfiles.length) {
      if (activeProfileId) setActiveProfileId(null);
      return;
    }
    if (!activeProfileId || !deviceProfiles.some(profile => profile.id === activeProfileId)) {
      setActiveProfileId(deviceProfiles[0].id);
    }
  }, [activeProfileId, deviceProfiles]);

  useEffect(() => {
    if (!profileActionItems.length) {
      if (activeProfileAction) setActiveProfileAction(null);
      return;
    }
    if (!activeProfileAction || !profileActionItems.some(item => item.app.id === activeProfileAction.appId && item.action.id === activeProfileAction.actionId)) {
      const first = profileActionItems[0];
      setActiveProfileAction({ appId: first.app.id, actionId: first.action.id });
    }
  }, [activeProfileAction, profileActionItems]);

  useEffect(() => {
    if (!open) return;
    refreshAutomationData();
    const refresh = () => refreshAutomationData();
    window.addEventListener(AUTOMATION_DATA_CHANGED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(AUTOMATION_DATA_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [open, refreshAutomationData]);

  useEffect(() => { recordingRef.current = recording; }, [recording]);
  useEffect(() => { recordTargetRef.current = recordTargetUdid; }, [recordTargetUdid]);
  useEffect(() => { editingTouchRowIdRef.current = editingTouchRowId; }, [editingTouchRowId]);

  useEffect(() => {
    if (status === ONLY_ONE_DEVICE_MSG && (selectedUdids.length <= 1 || viewerUdid)) setStatus(null);
    if (status === SELECT_ONE_DEVICE_MSG && recordTargetUdid) setStatus(null);
  }, [recordTargetUdid, selectedUdids.length, status, viewerUdid]);

  useEffect(() => {
    if (open) return;
    setRecording(false);
    setEditingTouchRowId(null);
    setActionOverlayOpen(null);
    setAutomationContextMenu(null);
    setMacroCtxMenu(null);
    setRowDelayCtxMenu(null);
    setMacroSortMenuOpen(false);
  }, [open]);

  useEffect(() => {
    const stopPlayback = (event: Event) => {
      const id = (event as CustomEvent<MacroPlaybackStopDetail>).detail?.id;
      if (!id) return;
      playbackControllersRef.current.get(id)?.abort();
    };
    window.addEventListener(MACRO_PLAYBACK_STOP_EVENT, stopPlayback);
    return () => window.removeEventListener(MACRO_PLAYBACK_STOP_EVENT, stopPlayback);
  }, []);

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

  useEffect(() => {
    if (!macroSortMenuOpen) return;
    const close = (e: Event) => {
      if ((e.target as HTMLElement | null)?.closest('.automationSavedHeaderCell')) return;
      setMacroSortMenuOpen(false);
    };
    const closeKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMacroSortMenuOpen(false); };
    window.addEventListener('mousedown', close, true);
    window.addEventListener('keydown', closeKey);
    return () => {
      window.removeEventListener('mousedown', close, true);
      window.removeEventListener('keydown', closeKey);
    };
  }, [macroSortMenuOpen]);

  /* automation click + swipe recording */
  useEffect(() => {
    const onAutomationClick = (event: Event) => {
      const detail = (event as CustomEvent<AutomationClickDetail>).detail;
      const recordTarget = recordTargetRef.current;
      if (!detail?.udid || !recordTarget || detail.udid !== recordTarget) return;
      const sourceNo = deviceByUdid.get(detail.udid)?.number;
      const editingRowId = editingTouchRowIdRef.current;
      if (editingRowId) {
        setRows(prev => prev.map(row => (row.id === editingRowId ? {
          ...row,
          action: 'touch',
          x01: detail.x01,
          y01: detail.y01,
          x: detail.x,
          y: detail.y,
          width: detail.width,
          height: detail.height,
          sourceUdid: detail.udid,
          targetUdids: [detail.udid],
        } : row)));
        setEditingTouchRowId(null);
        setStatus(`Đã cập nhật tọa độ${sourceNo ? ` máy #${formatDeviceNo(sourceNo)}` : ''}: X=${detail.x}, Y=${detail.y}`);
        return;
      }
      if (!recordingRef.current) return;
      const now = Date.now();
      const elapsed = lastRecordTimestampRef.current > 0 ? now - lastRecordTimestampRef.current : 0;
      const delayMs = realtimeRecording ? elapsed : DEFAULT_DELAY_MS;
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
      const recordTarget = recordTargetRef.current;
      if (!detail?.udid || !recordTarget || detail.udid !== recordTarget) return;
      const sourceNo = deviceByUdid.get(detail.udid)?.number;
      const now = Date.now();
      const elapsed = lastRecordTimestampRef.current > 0 ? now - lastRecordTimestampRef.current : 0;
      const delayMs = realtimeRecording ? elapsed : DEFAULT_DELAY_MS;
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
    const onAutomationKey = (event: Event) => {
      if (!recordingRef.current) return;
      const detail = (event as CustomEvent<AutomationKeyDetail>).detail;
      const recordTarget = recordTargetRef.current;
      if (!detail?.udid || !recordTarget || detail.udid !== recordTarget) return;
      const sourceNo = deviceByUdid.get(detail.udid)?.number;
      const now = Date.now();
      const elapsed = lastRecordTimestampRef.current > 0 ? now - lastRecordTimestampRef.current : 0;
      const delayMs = realtimeRecording ? elapsed : DEFAULT_DELAY_MS;
      lastRecordTimestampRef.current = now;
      setRows(prev => [...prev, {
        id: makeId('step'), action: 'key', delayMs,
        keycode: detail.keycode,
        sourceUdid: detail.udid, targetUdids: [detail.udid], note: '',
      }]);
      setStatus(`Key${sourceNo ? ` mÃ¡y #${formatDeviceNo(sourceNo)}` : ''}: ${detail.keycode}${realtimeRecording ? ` (delay ${delayMs}ms)` : ''}`);
    };
    const onAutomationText = (event: Event) => {
      if (!recordingRef.current) return;
      const detail = (event as CustomEvent<AutomationTextDetail>).detail;
      const recordTarget = recordTargetRef.current;
      if (!detail?.udid || !recordTarget || detail.udid !== recordTarget || !detail.text) return;
      const sourceNo = deviceByUdid.get(detail.udid)?.number;
      const now = Date.now();
      const elapsed = lastRecordTimestampRef.current > 0 ? now - lastRecordTimestampRef.current : 0;
      const delayMs = realtimeRecording ? elapsed : DEFAULT_DELAY_MS;
      lastRecordTimestampRef.current = now;
      setRows(prev => [...prev, {
        id: makeId('step'), action: 'text', delayMs,
        text: detail.text,
        sourceUdid: detail.udid, targetUdids: [detail.udid], note: '',
      }]);
      setStatus(`Text${sourceNo ? ` mÃ¡y #${formatDeviceNo(sourceNo)}` : ''}: ${detail.text.length} ky tu${realtimeRecording ? ` (delay ${delayMs}ms)` : ''}`);
    };
    window.addEventListener(AUTOMATION_CLICK_EVENT, onAutomationClick as EventListener);
    window.addEventListener(AUTOMATION_SWIPE_EVENT, onAutomationSwipe as EventListener);
    window.addEventListener(AUTOMATION_KEY_EVENT, onAutomationKey as EventListener);
    window.addEventListener(AUTOMATION_TEXT_EVENT, onAutomationText as EventListener);
    return () => {
      window.removeEventListener(AUTOMATION_CLICK_EVENT, onAutomationClick as EventListener);
      window.removeEventListener(AUTOMATION_SWIPE_EVENT, onAutomationSwipe as EventListener);
      window.removeEventListener(AUTOMATION_KEY_EVENT, onAutomationKey as EventListener);
      window.removeEventListener(AUTOMATION_TEXT_EVENT, onAutomationText as EventListener);
    };
  }, [deviceByUdid, realtimeRecording]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<SyncMacroSettings>;
      setSyncMacroSettings(customEvent.detail);
    };
    window.addEventListener(SYNC_MACRO_SETTINGS_EVENT, handleUpdate);
    return () => window.removeEventListener(SYNC_MACRO_SETTINGS_EVENT, handleUpdate);
  }, []);

  if (!open) return null;

  const automationContextApp = automationContextMenu && automationContextMenu.type !== 'action'
    ? AUTOMATION_APPS.find(app => app.id === automationContextMenu.appId) ?? null : null;
  const automationContextAction = automationContextMenu?.type === 'action'
    ? appActions[automationContextMenu.appId].find(a => a.id === automationContextMenu.actionId) ?? null : null;

  /* ══════════════════ RENDER ══════════════════ */
  return (
    <div className={`automationFloatingLayer${coordinatePanelOpen ? ' withCoordinatePanel' : ''}`} style={{ left: position.x, top: position.y }}>
      {!coordinatePanelOpen ? (
      <div className='automationModal modal show d-block' role='dialog' aria-modal='false'>
        <div className='modal-dialog automationDialog'>
          <div className='modal-content automationContent'>
            <div className='modal-header automationHeader' onPointerDown={startDrag}>
              <div className='automationTitle'>
                <span className='automationTitleIcon' aria-hidden='true'><Video size={17} strokeWidth={2} /></span>
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

              {/* ── Thiết Lập Macro ── */}
              <div className='automationProfileBlock'>
                <div className='automationSectionTitle'>
                  <span>Profile</span>
                  <div className='automationSectionActions'>
                    <button
                      type='button'
                      className='automationArrowBtn'
                      onClick={() => setShowProfileSection(prev => !prev)}
                      style={{ minWidth: 64 }}
                    >
                      {showProfileSection ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      <span>{showProfileSection ? 'Ẩn' : 'Hiện'}</span>
                    </button>
                    <button type='button' className='automationArrowBtn automationProfileCreateBtn' onClick={createProfile} title='Tạo profile'>
                      <Plus size={15} />
                      <span>Tạo profile</span>
                    </button>
                  </div>
                </div>
                {showProfileSection && (
                  <div className='automationProfileManagerGrid'>
                    <div className='automationProfileColumn'>
                      <div className='automationProfileColumnTitle'>Tên profile</div>
                      <div className='automationProfileList'>
                        {deviceProfiles.map(profile => {
                          const isActive = profile.id === activeProfileId;
                          return (
                            <div key={profile.id} className={`automationProfileRow${isActive ? ' active' : ''}`}>
                              <button type='button' className='automationProfileNameBtn' onClick={() => setActiveProfileId(profile.id)} title={profile.name}>
                                <span>{profile.name}</span>
                                <small>{profile.udids.length} máy</small>
                              </button>
                              <button
                                type='button'
                                className='automationProfileIconBtn'
                                style={{ width: 'auto', padding: '0 6px', fontSize: 11, color: '#9bc1ff' }}
                                onClick={() => setDeviceAssigningProfileId(profile.id)}
                                title='Gán thiết bị'
                              >
                                Device
                              </button>
                              <button type='button' className='automationProfileIconBtn' onClick={() => renameProfile(profile)} title='Đổi tên profile'>
                                <Pencil size={13} />
                              </button>
                              <button type='button' className='automationProfileIconBtn danger' onClick={() => deleteProfile(profile)} title='Xoá profile'>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          );
                        })}
                        {!deviceProfiles.length ? <div className='automationProfileEmpty'>Chưa có profile</div> : null}
                      </div>
                    </div>

                    <div className='automationProfileColumn'>
                      <div className='automationProfileColumnTitle'>Hành Động</div>
                      <div className='automationProfileList'>
                        {profileActionItems.map(item => {
                          const binding = selectedProfile
                            ? (item.action.bindings ?? []).find(b => b.profileId === selectedProfile.id)
                            : null;
                          const isActive = activeProfileAction?.appId === item.app.id && activeProfileAction?.actionId === item.action.id;
                          return (
                            <button
                              key={`${item.app.id}-${item.action.id}`}
                              type='button'
                              className={`automationProfileActionBtn${isActive ? ' active' : ''}`}
                              onClick={() => setActiveProfileAction({ appId: item.app.id, actionId: item.action.id })}
                              title={binding ? `${item.action.name} -> ${binding.macroName}` : item.action.name}
                            >
                              <img src={item.app.icon} alt='' />
                              <span>{item.action.name}</span>
                              <small>{binding ? binding.macroName : 'Chưa gán'}</small>
                            </button>
                          );
                        })}
                        {!profileActionItems.length ? <div className='automationProfileEmpty'>Chưa có hành động</div> : null}
                      </div>
                    </div>

                    <div className='automationProfileColumn last'>
                      <div className='automationProfileColumnTitle'>File Macro</div>
                      {selectedProfile && selectedProfileActionItem && selectedProfileBinding ? (
                        <div className='automationProfileCurrentBinding'>
                          <span>Đang gán: {selectedProfileBinding.macroName}</span>
                          <button
                            type='button'
                            className='automationProfileUnbindBtn'
                            onClick={() => removeProfileActionBinding(selectedProfile, selectedProfileActionItem.app.id, selectedProfileActionItem.action)}
                          >
                            Xoá gán
                          </button>
                        </div>
                      ) : null}
                      <div className='automationProfileList'>
                        {sortedSavedMacros.map(macro => {
                          const isActive = selectedProfileBinding?.macroId === macro.id;
                          const disabled = !selectedProfile || !selectedProfileActionItem;
                          return (
                            <button
                              key={macro.id}
                              type='button'
                              className={`automationProfileMacroBtn${isActive ? ' active' : ''}`}
                              disabled={disabled}
                              onClick={() => {
                                if (!selectedProfile || !selectedProfileActionItem) return;
                                assignMacroToProfileAction(selectedProfile, selectedProfileActionItem.app.id, selectedProfileActionItem.action, macro);
                              }}
                              title={macro.name}
                            >
                              <FolderOpen size={14} />
                              <span>{macro.name}</span>
                            </button>
                          );
                        })}
                        {!sortedSavedMacros.length ? <div className='automationProfileEmpty'>Chưa có File Macro</div> : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button className={`automationCoordinateRow${coordinatePanelOpen ? ' open' : ''}`} onClick={openCoordinatePanel}>
                <div className='automationCoordinateTitle'>Thiết Lập Macro</div>
                <div className='automationCoordinateMeta'>{selectedUdids.length ? `${selectedUdids.length} máy được chọn` : 'Chưa chọn máy'}</div>
                {status ? <div className={`automationStatus${statusIsError ? ' error' : ''}`}>{status}</div> : <div className='automationStatus muted'>Mở bảng Record/Phát tọa độ</div>}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
      ) : null}

      {/* ── Coordinate Panel (Thiết Lập Macro) ── */}
      {coordinatePanelOpen ? (
        <div className='automationCoordinatePanel modal show d-block' role='dialog' aria-modal='false'>
          <div className='modal-dialog automationCoordinateDialog'>
            <div className='modal-content automationContent automationCoordinateContent'>
              <div className='modal-header automationHeader' onPointerDown={startDrag}>
                <div className='automationTitle'><Video size={17} /><span>Thiết Lập Macro</span></div>
                <div className='automationHeaderNotification'>
                  <span className={statusIsError ? 'automationErrorText' : undefined}>
                    {selectedRecordDevice ? `Máy ghi: #${formatDeviceNo(selectedRecordDevice.number)}` : selectedUdids.length > 1 ? `${selectedUdids.length} máy được chọn` : 'Chưa chọn máy'}
                  </span>
                  {status ? <span className={`automationStatus${statusIsError ? ' error' : ''}`}>{status}</span> : null}
                </div>
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
                  <button className={`btn automationBtn${syncMacroOpen ? ' active' : ''}`} onClick={() => setSyncMacroOpen(v => !v)} title='Sync Macro'>
                    <Clock3 size={16} /><span>Sync Macro</span>
                  </button>
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

                <div className='automationCoordinateTables'>
                  <div className='automationMainTableWrap'>
                    <table className='table table-dark table-sm automationMacroTable'>
                      <thead><tr><th>Step</th><th>Action</th><th>Delay (ms)</th><th>Details</th><th>Note</th></tr></thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr
                            key={row.id}
                            className={`automationMacroRow${draggingRowId === row.id ? ' dragging' : ''}`}
                            onContextMenu={e => openRowDelayMenu(e, row.id)}
                            onDragOver={e => {
                              if (draggingRowId && draggingRowId !== row.id) e.preventDefault();
                            }}
                            onDrop={e => {
                              e.preventDefault();
                              const sourceId = e.dataTransfer.getData('text/plain') || draggingRowId;
                              if (!sourceId) return;
                              const rect = e.currentTarget.getBoundingClientRect();
                              const placement = e.clientY > rect.top + rect.height / 2 ? 'after' : 'before';
                              moveRow(sourceId, row.id, placement);
                              setDraggingRowId(null);
                            }}
                          >
                            <td
                              className='automationStepCell'
                              draggable
                              title='Giữ chuột và kéo để đổi thứ tự step'
                              onDragStart={e => {
                                setDraggingRowId(row.id);
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('text/plain', row.id);
                              }}
                              onDragEnd={() => setDraggingRowId(null)}
                            >
                              {i + 1}
                            </td>
                            <td>
                              <select
                                className='automationActionSelect'
                                value={row.action}
                                onChange={e => changeRowAction(row, e.target.value as any)}
                                title={`Action hiện tại: ${formatMacroAction(row.action)}`}
                              >
                                <option value='touch'>Touch</option>
                                <option value='swipe'>Vuốt</option>
                                <option value='seeding'>Seeding</option>
                                <option value='key'>Key</option>
                                <option value='text'>Text</option>
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
                            <td className='automationDetailsCell'>
                              {row.action === 'touch' ? (
                                <button
                                  type='button'
                                  className={`automationDetailsBtn${editingTouchRowId === row.id ? ' active' : ''}`}
                                  onClick={() => startEditTouchDetails(row, i)}
                                  title='Click để chọn lại tọa độ trên điện thoại đang chọn'
                                >
                                  {formatStepDetails(row)}
                                </button>
                              ) : formatStepDetails(row)}
                            </td>
                            <td><input className='automationNoteInput' type='text' value={row.note ?? ''} onChange={e => updateRow(row.id, { note: e.target.value })} /></td>
                          </tr>
                        ))}
                        {!rows.length ? <tr><td colSpan={5} className='automationEmptyRow'>Chưa có bước nào</td></tr> : null}
                      </tbody>
                    </table>
                  </div>
                  <div className='automationSavedTableWrap'>
                    <table className='table table-dark table-sm automationSavedTable'>
                      <thead><tr><th className='automationSavedHeaderCell'>
                        <button type='button' className='automationSavedHeaderBtn' onClick={() => setMacroSortMenuOpen(v => !v)} title='Sắp xếp File Macro'>
                          <span>File Macro</span>
                          <small>{macroSortMode === 'name' ? 'Name' : 'Ngày tạo'}</small>
                        </button>
                        {macroSortMenuOpen ? (
                          <div className='automationMacroSortMenu' onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                            <button type='button' className={`automationMacroSortItem${macroSortMode === 'name' ? ' active' : ''}`} onClick={() => updateMacroSortMode('name')}>Name</button>
                            <button type='button' className={`automationMacroSortItem${macroSortMode === 'createdAt' ? ' active' : ''}`} onClick={() => updateMacroSortMode('createdAt')}>Ngày tạo</button>
                          </div>
                        ) : null}
                      </th></tr></thead>
                      <tbody>
                        {sortedSavedMacros.map(m => (
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

      {/* ── CONTEXT MENUS ── */}
      {automationContextMenu && automationContextApp ? (
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
              <Plus size={14} /><span>Thêm hành động {automationContextApp.label}</span>
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
        </div>
      ) : null}

      {/* ── MACRO CONTEXT MENU ── */}
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
            <div className='automationContextMenuDivider' />
            <button type='button' className='automationContextMenuItem automationContextMenuDanger dropdown-item'
              onPointerDown={e => {
                e.preventDefault(); e.stopPropagation();
                deleteRow(row.id);
              }}
            >
              <Trash2 size={14} /><span>Xoá step</span>
            </button>
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

      {syncMacroOpen && (
        <SyncTimeSettingsModal
          title="Sync Macro"
          settings={syncMacroSettings as any}
          delayRange={syncMacroDelayRange}
          onChange={updateSyncMacroSettings as any}
          onClose={() => setSyncMacroOpen(false)}
        />
      )}

      {deviceAssigningProfileId && (
        <DeviceAssignModal
          profileId={deviceAssigningProfileId}
          devices={devices}
          deviceProfiles={deviceProfiles}
          onSave={(updatedUdids) => {
            setDeviceProfiles(prev => {
              const cleaned = prev.map(p => ({
                ...p,
                udids: p.id === deviceAssigningProfileId
                  ? updatedUdids
                  : p.udids.filter(u => !updatedUdids.includes(u))
              }));
              saveDeviceProfiles(cleaned);
              return cleaned;
            });
            setDeviceAssigningProfileId(null);
          }}
          onClose={() => setDeviceAssigningProfileId(null)}
        />
      )}

      <ConfirmDeleteModal state={confirmModal} onClose={() => setConfirmModal(null)} />
      <InputModal state={inputModal} onClose={() => setInputModal(null)} />
    </div>
  );
});
