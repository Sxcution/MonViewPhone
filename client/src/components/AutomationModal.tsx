import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  AUTOMATION_SWIPE_EVENT,
  runScript,
  type AutomationClickDetail,
  type AutomationSwipeDetail,
  type AutomationStep,
} from '@/lib/automation';
import { AndroidKeycode } from '@/lib/keyEvent';
import {
  loadSyncMacroSettings,
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
  MACRO_RUNNING_UDIDS_EVENT,
} from '@/lib/automationData';

/* ── types ── */

export type AutomationDeviceOption = {
  udid: string;
  number: number;
  manufacturer?: string;
  model?: string;
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

function formatMacroAction(action: 'touch' | 'swipe' | 'seeding') {
  if (action === 'swipe') return 'Vuốt';
  if (action === 'seeding') return 'Seeding';
  return 'Touch';
}

function formatStepDetails(row: AutomationMacroRow) {
  if (row.action === 'swipe') {
    return `(${row.x ?? ''},${row.y ?? ''}) → (${row.endX ?? ''},${row.endY ?? ''}) ${row.durationMs ?? 0}ms`;
  }
  if (row.action === 'seeding') return 'Random từ ngữ chung + Enter';
  return `X=${row.x == null ? '' : row.x}, Y=${row.y == null ? '' : row.y}`;
}

function makeActionPatch(row: AutomationMacroRow, action: 'touch' | 'swipe' | 'seeding'): Partial<AutomationMacroRow> {
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
  const raw = localStorage.getItem('automationSeedingContentsV1') || '';
  const lines = raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!lines.length) return '';
  return lines[Math.floor(Math.random() * lines.length)];
}

/* ── Modal Styles ── */

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
      <div style={MODAL_BACKDROP} onClick={onClose} />
      <div style={MODAL_OVERLAY} onClick={onClose}>
        <div style={MODAL_CARD} onClick={e => e.stopPropagation()}>
          <div style={MODAL_HEADER}>
            <h5 style={MODAL_TITLE}>{state.title}</h5>
            <button type='button' style={MODAL_CLOSE_BTN} aria-label='Close' onClick={onClose}>✕</button>
          </div>
          <div style={MODAL_BODY}>
            {state.label ? <label style={LABEL_STYLE}>{state.label}</label> : null}
            <input
              ref={inputRef}
              type='text'
              style={INPUT_STYLE}
              placeholder={state.placeholder ?? ''}
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') onClose();
              }}
            />
          </div>
          <div style={MODAL_FOOTER}>
            <button type='button' style={BTN_CANCEL} onClick={onClose}>Huỷ</button>
            <button
              type='button'
              style={{
                ...BTN_PRIMARY,
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

/* ── main component ── */

export function AutomationModal({
  open,
  devices,
  selectedUdids,
  onClose,
}: AutomationModalProps) {
  const { getTargetsByUdids } = useActive();

  /* ── state ── */
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
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(null);
  const [inputModal, setInputModal] = useState<InputModalState>(null);
  const [macroCtxMenu, setMacroCtxMenu] = useState<MacroCtxMenuState>(null);
  const [rowDelayCtxMenu, setRowDelayCtxMenu] = useState<RowDelayCtxMenuState>(null);
  const [macroSortMode, setMacroSortMode] = useState<MacroSortMode>(loadMacroSortMode);
  const [macroSortMenuOpen, setMacroSortMenuOpen] = useState(false);
  const [currentMacroName, setCurrentMacroName] = useState('');
  const [position, setPosition] = useState({ x: 120, y: 80 });
  const [realtimeRecording, setRealtimeRecording] = useState(() => loadAutomationSettings().realtimeRecording);

  // Sync Macro state
  const [syncMacroOpen, setSyncMacroOpen] = useState(false);
  const [syncMacroSettings, setSyncMacroSettings] = useState<SyncMacroSettings>(loadSyncMacroSettings);
  const syncMacroDelayRange = useMemo(() => syncMacroDelayRangeMs(syncMacroSettings.intervalSec), [syncMacroSettings.intervalSec]);

  // Settings Panel state
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);

  const recordingRef = useRef(false);
  const selectedRef = useRef<string[]>([]);
  const abortPlaybackRef = useRef<AbortController | null>(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const lastRecordTimestampRef = useRef<number>(0);
  const macroRunningCounterRef = useRef<Map<string, number>>(new Map());

  /* ── memos ── */
  const deviceByUdid = useMemo(() => {
    const map = new Map<string, AutomationDeviceOption>();
    devices.forEach(d => map.set(d.udid, d));
    return map;
  }, [devices]);

  const selectedRecordDevice = useMemo(
    () => (selectedUdids.length === 1 ? deviceByUdid.get(selectedUdids[0]) ?? null : null),
    [deviceByUdid, selectedUdids],
  );

  const statusIsError = status === ONLY_ONE_DEVICE_MSG || status === SELECT_ONE_DEVICE_MSG;
  const sortedSavedMacros = useMemo(() => sortMacros(savedMacros, macroSortMode), [savedMacros, macroSortMode]);

  /* ── callbacks ── */
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

  const updateMacroSortMode = useCallback((mode: MacroSortMode) => {
    setMacroSortMode(mode);
    saveMacroSortMode(mode);
    setMacroSortMenuOpen(false);
  }, []);

  const closeModal = useCallback(() => {
    setRecording(false);
    setActionOverlayOpen(null);
    setAutomationContextMenu(null);
    setMacroCtxMenu(null);
    setRowDelayCtxMenu(null);
    setMacroSortMenuOpen(false);
    abortPlaybackRef.current?.abort();
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

  const openCoordinatePanel = useCallback(() => {
    setCoordinatePanelOpen(true);
    if (selectedUdids.length > 1) {
      setStatus(ONLY_ONE_DEVICE_MSG);
    } else if (selectedUdids.length === 0) {
      setStatus(SELECT_ONE_DEVICE_MSG);
    }
  }, [selectedUdids.length]);

  const startRecording = useCallback(() => {
    setCoordinatePanelOpen(true);
    if (selectedUdids.length > 1) {
      setRecording(false);
      setStatus(ONLY_ONE_DEVICE_MSG);
      return;
    }
    if (selectedUdids.length === 0) {
      setRecording(false);
      setStatus(SELECT_ONE_DEVICE_MSG);
      return;
    }
    setRecording(true);
    lastRecordTimestampRef.current = 0;
    const no = deviceByUdid.get(selectedUdids[0])?.number;
    setStatus(`Đang ghi${realtimeRecording ? ' (Realtime)' : ''}${no ? ` máy #${formatDeviceNo(no)}` : ''}`);
  }, [deviceByUdid, selectedUdids, realtimeRecording]);

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

  const changeRowAction = useCallback((row: AutomationMacroRow, action: 'touch' | 'swipe' | 'seeding') => {
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
            id: makeId('macro'),
            name: cleanName,
            rows: cloneRows(rows),
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
  }, [currentMacroName, rows]);

  const loadMacro = useCallback((macro: SavedAutomationMacro) => {
    if (recordingRef.current) {
      setStatus('⚠ Đang ghi macro – hãy Dừng ghi hoặc Lưu trước khi mở file khác');
      return;
    }
    setRows(cloneRows(macro.rows));
    setCurrentMacroName(macro.name);
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

  const runMacroRow = useCallback(async (targets: ReturnType<typeof getTargetsByUdids>, row: AutomationMacroRow, controller: AbortController) => {
    const delayMs = resolveMacroDelayMs(row);
    if (delayMs > 0) {
      setStatus(`wait ${delayMs}`);
      await sleepMs(delayMs, controller.signal);
      if (controller.signal.aborted) return;
    }
    const seedingText = row.action === 'seeding' ? pickSeedingContent() : undefined;
    if (row.action === 'seeding') {
      if (!seedingText) {
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
      setStatus(`Seeding máy ${formattedUdids}: ${seedingText}`);
    }
    await runScript(targets, rowToSteps(row, { seedingText }), {
      signal: controller.signal,
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
      abortPlaybackRef.current?.abort();
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
    abortPlaybackRef.current = controller;
    const targetUdidsList = selectedUdids.length > 0 ? selectedUdids : (selectedRecordDevice ? [selectedRecordDevice.udid] : []);
    try {
      const targets = getTargetsByUdids(targetUdidsList);
      if (!targets.length) {
        setStatus('Lỗi: Chưa chọn máy nào để phát Macro');
        return;
      }
      updateRunningMacroUdids(targetUdidsList, true);
      for (const row of runnableRows) {
        if (controller.signal.aborted) break;
        await runMacroRow(targets, row, controller);
      }
      setStatus(controller.signal.aborted ? 'Đã dừng phát' : 'Đã phát xong');
    } finally {
      setPlaying(false);
      abortPlaybackRef.current = null;
      updateRunningMacroUdids(targetUdidsList, false);
    }
  }, [getTargetsByUdids, playing, rows, runMacroRow, selectedUdids, selectedRecordDevice, updateRunningMacroUdids]);

  const playAppAction = useCallback(async (appId: AutomationAppId, actionId: string) => {
    if (playing) {
      abortPlaybackRef.current?.abort();
      setStatus('Đang dừng phát');
      return;
    }
    const action = appActions[appId].find(a => a.id === actionId);
    if (!action) return;
    if (!selectedUdids.length) {
      setStatus('Chưa chọn máy');
      return;
    }

    const profileGroups = new Map<string, { profile: AutomationDeviceProfile; udids: string[] }>();
    const noProfileUdids: string[] = [];
    for (const udid of selectedUdids) {
      const profile = deviceProfiles.find(p => p.udids.includes(udid));
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
    setPlaying(true);
    const controller = new AbortController();
    abortPlaybackRef.current = controller;

    try {
      const tasks: Promise<void>[] = [];
      for (const [, group] of profileGroups) {
        const binding = (action.bindings ?? []).find(b => b.profileId === group.profile.id);
        if (!binding) {
          missingMacroProfiles.push(group.profile.name);
          continue;
        }
        const macro = savedMacros.find(m => m.id === binding.macroId);
        if (!macro) {
          macroNotFoundProfiles.push(group.profile.name);
          continue;
        }
        const targets = getTargetsByUdids(group.udids);
        if (!targets.length) continue;
        ranProfiles.push(group.profile.name);
        tasks.push((async () => {
          try {
            updateRunningMacroUdids(group.udids, true);
            for (const row of macro.rows) {
              if (controller.signal.aborted) break;
              if (!isRunnableMacroRow(row)) continue;
              await runMacroRow(targets, row, controller);
            }
          } finally {
            updateRunningMacroUdids(group.udids, false);
          }
        })());
      }
      for (const { binding, udids } of legacyTasks) {
        const macro = savedMacros.find(m => m.id === binding.macroId);
        if (!macro) continue;
        const targets = getTargetsByUdids(udids);
        if (!targets.length) continue;
        tasks.push((async () => {
          try {
            updateRunningMacroUdids(udids, true);
            for (const row of macro.rows) {
              if (controller.signal.aborted) break;
              if (!isRunnableMacroRow(row)) continue;
              await runMacroRow(targets, row, controller);
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
      setPlaying(false);
      abortPlaybackRef.current = null;
    }
  }, [appActions, deviceProfiles, getTargetsByUdids, playing, runMacroRow, savedMacros, selectedUdids, updateRunningMacroUdids]);

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

  useEffect(() => { recordingRef.current = recording; }, [recording]);
  useEffect(() => { selectedRef.current = selectedUdids; }, [selectedUdids]);

  useEffect(() => {
    if (open) return;
    setRecording(false);
    setActionOverlayOpen(null);
    setAutomationContextMenu(null);
    setMacroCtxMenu(null);
    setRowDelayCtxMenu(null);
    setMacroSortMenuOpen(false);
    abortPlaybackRef.current?.abort();
  }, [open]);

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
      if (!recordingRef.current) return;
      const detail = (event as CustomEvent<AutomationClickDetail>).detail;
      const selected = selectedRef.current;
      if (!detail?.udid || selected.length !== 1 || detail.udid !== selected[0]) return;
      const sourceNo = deviceByUdid.get(detail.udid)?.number;
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
      const selected = selectedRef.current;
      if (!detail?.udid || selected.length !== 1 || detail.udid !== selected[0]) return;
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
    window.addEventListener(AUTOMATION_CLICK_EVENT, onAutomationClick as EventListener);
    window.addEventListener(AUTOMATION_SWIPE_EVENT, onAutomationSwipe as EventListener);
    return () => {
      window.removeEventListener(AUTOMATION_CLICK_EVENT, onAutomationClick as EventListener);
      window.removeEventListener(AUTOMATION_SWIPE_EVENT, onAutomationSwipe as EventListener);
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

              {/* ── Thiết Lập Macro ── */}
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

      {/* ── Coordinate Panel (Thiết Lập Macro) ── */}
      {coordinatePanelOpen ? (
        <div className='automationCoordinatePanel modal show d-block' role='dialog' aria-modal='false'>
          <div className='modal-dialog automationCoordinateDialog'>
            <div className='modal-content automationContent automationCoordinateContent'>
              <div className='modal-header automationHeader' onPointerDown={startDrag}>
                <div className='automationTitle'><Video size={17} /><span>Thiết Lập Macro</span></div>
                <div className='automationHeaderNotification'>
                  <span className={selectedUdids.length > 1 ? 'automationErrorText' : undefined}>
                    {selectedRecordDevice ? `Máy ghi: #${formatDeviceNo(selectedRecordDevice.number)}` : selectedUdids.length > 1 ? 'Chỉ chọn 1 thiết bị' : 'Chưa chọn máy'}
                  </span>
                  {status ? <span className={`automationStatus${selectedUdids.length > 1 ? ' error' : ''}`}>{status}</span> : null}
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
                          <tr key={row.id}>
                            <td>{i + 1}</td>
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

      <ConfirmDeleteModal state={confirmModal} onClose={() => setConfirmModal(null)} />
      <InputModal state={inputModal} onClose={() => setInputModal(null)} />
    </div>
  );
}
