import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CirclePlus,
  FolderOpen,
  Info,
  Play,
  Plus,
  Save,
  Settings,
  Square,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useActive } from '@/context/ActiveContext';
import { DeviceSelectionGrid, type DeviceSelectionGridItem } from '@/components/DeviceSelectionGrid';
import {
  AUTOMATION_CLICK_EVENT,
  runScript,
  type AutomationClickDetail,
} from '@/lib/automation';

/* ── types ─────────────────────────────────────────────────────── */

export type AutomationDeviceOption = {
  udid: string;
  number: number;
  /* manufacturer / model chỉ dùng để gợi ý tên khi tạo profile */
  manufacturer?: string;
  model?: string;
};

type AutomationMacroRow = {
  id: string;
  action: 'click';
  delayMs: number;
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

type AutomationAppId = 'wechat' | 'line' | 'tantan' | 'setting';

/* binding: Action + Profile → Macro */
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

/* device_profile: nhóm layout thao tác, do user quản lý */
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

type AutomationModalProps = {
  open: boolean;
  devices: AutomationDeviceOption[];
  selectedUdids: string[];
  onToggleDevice: (udid: string, checked: boolean) => void;
  onToggleAllDevices: (checked: boolean) => void;
  onClose: () => void;
};

/* ── constants ─────────────────────────────────────────────────── */

const AUTOMATION_MACROS_KEY = 'automationMacrosV1';
const AUTOMATION_APP_ACTIONS_KEY = 'automationAppActionsV1';
const AUTOMATION_DEVICE_PROFILES_KEY = 'automationDeviceProfilesV1';
const DEFAULT_DELAY_MS = 1000;
const ONLY_ONE_DEVICE_MSG = 'Chỉ chọn 1 thiết bị';
const SELECT_ONE_DEVICE_MSG = 'Chọn 1 thiết bị';

const AUTOMATION_APPS: Array<{ id: AutomationAppId; label: string; icon: string }> = [
  { id: 'wechat', label: 'Wechat', icon: '/automation-icons/WechatIcon.png' },
  { id: 'line', label: 'Line', icon: '/automation-icons/LINE_New_App_Icon_(2020-12).png' },
  { id: 'tantan', label: 'Tantan', icon: '/automation-icons/TantanIcon.png' },
  { id: 'setting', label: 'Setting', icon: '/automation-icons/setting.png' },
];

/* ── utility functions ─────────────────────────────────────────── */

function emptyAppActions(): Record<AutomationAppId, AutomationAppAction[]> {
  return { wechat: [], line: [], tantan: [], setting: [] };
}

function makeId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
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

/* loadAppActions: chấp nhận binding có profileId (new) HOẶC targetUdids (legacy) */
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
                id: String(b.id),
                macroId: String(b.macroId),
                macroName: String(b.macroName),
                profileId: b.profileId ? String(b.profileId) : '',
                profileName: b.profileName ? String(b.profileName) : '',
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

function cloneRows(rows: AutomationMacroRow[]) {
  return rows.map(row => ({ ...row, targetUdids: Array.isArray(row.targetUdids) ? [...row.targetUdids] : [], note: row.note ?? '' }));
}

function formatDeviceNo(n: number) { return String(n || 0).padStart(2, '0'); }

function formatStepDetails(row: AutomationMacroRow) {
  return `X=${row.x == null ? '' : row.x}, Y=${row.y == null ? '' : row.y}`;
}

function clampPosition(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/* ── component ─────────────────────────────────────────────────── */

export function AutomationModal({
  open, devices, selectedUdids, onToggleDevice, onToggleAllDevices, onClose,
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
  const [deviceContextSubMenu, setDeviceContextSubMenu] = useState<{ appId: AutomationAppId; actionId: string } | null>(null);
  const [currentMacroName, setCurrentMacroName] = useState('');
  const [position, setPosition] = useState({ x: 120, y: 80 });
  const recordingRef = useRef(false);
  const selectedRef = useRef<string[]>([]);
  const abortPlaybackRef = useRef<AbortController | null>(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  /* ── memos ── */

  const deviceByUdid = useMemo(() => {
    const map = new Map<string, AutomationDeviceOption>();
    devices.forEach(d => map.set(d.udid, d));
    return map;
  }, [devices]);

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

  /* Thông tin profile của target devices */
  const automationContextDeviceProfileInfo = useMemo(() => {
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

  /* Thông tin binding cho submenu action trong device context menu */
  const deviceSubmenuInfo = useMemo(() => {
    if (!deviceContextSubMenu || automationContextMenu?.type !== 'device') return null;
    const targets = automationContextDeviceTargets;
    if (!targets.length) return null;

    const action = appActions[deviceContextSubMenu.appId]?.find(a => a.id === deviceContextSubMenu.actionId);
    if (!action) return null;

    const profileMap = new Map<string, AutomationDeviceProfile>();
    const unassigned: string[] = [];
    for (const udid of targets) {
      const p = deviceProfiles.find(pr => pr.udids.includes(udid));
      if (p) profileMap.set(p.id, p);
      else unassigned.push(udid);
    }

    const profileCount = profileMap.size;
    const singleProfile = profileCount === 1 && unassigned.length === 0 ? [...profileMap.values()][0] : null;
    const binding = singleProfile
      ? (action.bindings ?? []).find(b => b.profileId === singleProfile.id) ?? null
      : null;
    const macroExists = binding ? savedMacros.some(m => m.id === binding.macroId) : false;

    return { action, profiles: [...profileMap.values()], profileCount, singleProfile, unassigned, binding, macroExists };
  }, [deviceContextSubMenu, automationContextMenu, automationContextDeviceTargets, appActions, deviceProfiles, savedMacros]);

  /* ── effects ── */

  useEffect(() => {
    if (!open) return;
    const width = coordinatePanelOpen ? 1200 : 860;
    const height = 600;
    setPosition({
      x: Math.max(12, Math.round((window.innerWidth - width) / 2)),
      y: Math.max(48, Math.round((window.innerHeight - height) / 2)),
    });
  }, [open]);

  useEffect(() => {
    if (!open || !coordinatePanelOpen) return;
    const estimatedWidth = 1280;
    setPosition(prev => ({
      x: clampPosition(prev.x, 12, Math.max(12, window.innerWidth - estimatedWidth - 12)),
      y: clampPosition(prev.y, 12, Math.max(12, window.innerHeight - 120)),
    }));
  }, [coordinatePanelOpen, open]);

  useEffect(() => { recordingRef.current = recording; }, [recording]);
  useEffect(() => { selectedRef.current = selectedList; }, [selectedList]);

  useEffect(() => {
    if (open) return;
    setRecording(false);
    setActionOverlayOpen(null);
    setAutomationContextMenu(null);
    abortPlaybackRef.current?.abort();
  }, [open]);

  /* Reset submenu khi context menu thay đổi */
  useEffect(() => { setDeviceContextSubMenu(null); }, [automationContextMenu]);

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
    const onAutomationClick = (event: Event) => {
      if (!recordingRef.current) return;
      const detail = (event as CustomEvent<AutomationClickDetail>).detail;
      const selected = selectedRef.current;
      if (!detail?.udid || selected.length !== 1 || detail.udid !== selected[0]) return;
      const sourceNo = deviceByUdid.get(detail.udid)?.number;
      setRows(prev => [...prev, {
        id: makeId('step'), action: 'click', delayMs: DEFAULT_DELAY_MS,
        x01: detail.x01, y01: detail.y01, x: detail.x, y: detail.y,
        width: detail.width, height: detail.height,
        sourceUdid: detail.udid, targetUdids: [detail.udid], note: '',
      }]);
      setStatus(`Đã ghi tọa độ${sourceNo ? ` máy #${formatDeviceNo(sourceNo)}` : ''}: x=${detail.x}, y=${detail.y}`);
    };
    window.addEventListener(AUTOMATION_CLICK_EVENT, onAutomationClick as EventListener);
    return () => window.removeEventListener(AUTOMATION_CLICK_EVENT, onAutomationClick as EventListener);
  }, [deviceByUdid]);

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
    setRecording(false); setActionOverlayOpen(null); setAutomationContextMenu(null);
    abortPlaybackRef.current?.abort(); onClose();
  }, [onClose]);

  const addAppAction = useCallback((appId: AutomationAppId) => {
    const app = AUTOMATION_APPS.find(a => a.id === appId);
    const name = window.prompt(`Thêm hành động ${app?.label ?? appId}`, '');
    if (!name?.trim()) return;
    setAppActions(prev => {
      const next = { ...prev, [appId]: [...prev[appId], { id: makeId(`${appId}-action`), name: name.trim(), bindings: [] }] };
      saveAppActions(next); return next;
    });
    setActiveActionApp(appId);
    setActionOverlayOpen(appId);
  }, []);

  const deleteAppAction = useCallback((appId: AutomationAppId, actionId: string) => {
    const actionName = appActions[appId].find(a => a.id === actionId)?.name;
    setAppActions(prev => {
      const next = { ...prev, [appId]: prev[appId].filter(a => a.id !== actionId) };
      saveAppActions(next); return next;
    });
    setStatus(actionName ? `Đã xoá thao tác: ${actionName}` : 'Đã xoá thao tác');
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
    const no = deviceByUdid.get(selectedList[0])?.number;
    setStatus(`Đang ghi tọa độ${no ? ` máy #${formatDeviceNo(no)}` : ''}`);
  }, [deviceByUdid, selectedList]);

  const toggleRecording = useCallback(() => {
    if (recording) { setRecording(false); setStatus('Đã dừng ghi tọa độ'); return; }
    startRecording();
  }, [recording, startRecording]);

  const addBlankStep = useCallback(() => {
    setRows(prev => [...prev, {
      id: makeId('step'), action: 'click', delayMs: DEFAULT_DELAY_MS,
      targetUdids: selectedList.length === 1 ? [selectedList[0]] : [], note: '',
    }]);
  }, [selectedList]);

  const updateRow = useCallback((id: string, patch: Partial<AutomationMacroRow>) => {
    setRows(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)));
  }, []);

  const loadMacroForDevices = useCallback((macro: SavedAutomationMacro, targetUdids: string[]) => {
    const allowed = new Set(devices.map(d => d.udid));
    const cleanTargets = [...new Set(targetUdids)].filter(u => allowed.has(u));
    if (!cleanTargets.length) { setStatus('Chưa chọn máy để tải tọa độ'); return; }
    setRows(macro.rows.map(row => ({ ...row, id: makeId('step'), targetUdids: cleanTargets, note: row.note ?? '' })));
    setCurrentMacroName(macro.name);
    setCoordinatePanelOpen(true);
    setStatus(`Đã tải tọa độ "${macro.name}" cho ${cleanTargets.length} máy`);
  }, [devices]);

  /* ── assignMacroToAction (nhận profile trực tiếp, không tự tạo profile) ── */

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
    const actionName = appActions[appId].find(a => a.id === actionId)?.name ?? 'thao tác';
    setStatus(`Đã gán "${macro.name}" vào ${actionName} cho profile "${profile.name}"`);
  }, [appActions]);

  /* ── removeBindingFromAction ── */

  const removeBindingFromAction = useCallback((appId: AutomationAppId, actionId: string, profileId: string) => {
    const profileName = deviceProfiles.find(p => p.id === profileId)?.name ?? 'profile';
    setAppActions(prev => {
      const nextActions = prev[appId].map(action => {
        if (action.id !== actionId) return action;
        return { ...action, bindings: (action.bindings ?? []).filter(b => b.profileId !== profileId) };
      });
      const next = { ...prev, [appId]: nextActions };
      saveAppActions(next); return next;
    });
    const actionName = appActions[appId].find(a => a.id === actionId)?.name ?? 'thao tác';
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

  /* ── macro save / load ── */

  const newMacro = useCallback(() => { setRows([]); setCurrentMacroName(''); setStatus('Đã tạo macro mới'); }, []);

  const saveMacro = useCallback(() => {
    const name = window.prompt('Tên nhóm Automation', currentMacroName || `Macro ${new Date().toLocaleTimeString('vi-VN')}`);
    if (!name?.trim()) return;
    const cleanName = name.trim();
    const nextMacro: SavedAutomationMacro = { id: makeId('macro'), name: cleanName, rows: cloneRows(rows), updatedAt: Date.now() };
    setSavedMacros(prev => {
      const next = [nextMacro, ...prev.filter(m => m.name !== cleanName)].slice(0, 50);
      saveSavedMacros(next); return next;
    });
    setCurrentMacroName(cleanName);
    setStatus(`Đã lưu nhóm Automation: ${cleanName}`);
  }, [currentMacroName, rows]);

  const loadMacro = useCallback((macro: SavedAutomationMacro) => {
    setRows(cloneRows(macro.rows)); setCurrentMacroName(macro.name);
    setStatus(`Đã mở nhóm Automation: ${macro.name}`);
  }, []);

  /* ── playMacro (coordinate panel) ── */

  const playMacro = useCallback(async () => {
    if (playing) { abortPlaybackRef.current?.abort(); setStatus('Đang dừng phát'); return; }
    const runnableRows = rows.filter(r => r.x01 != null && r.y01 != null);
    if (!runnableRows.length) { setStatus('Chưa có bước tọa độ để phát'); return; }
    setRecording(false); setPlaying(true);
    const controller = new AbortController();
    abortPlaybackRef.current = controller;
    try {
      for (const row of runnableRows) {
        if (controller.signal.aborted) break;
        if (row.x01 == null || row.y01 == null) continue;
        const targets = getTargetsByUdids(row.targetUdids);
        if (!targets.length) continue;
        await runScript(targets, [{ type: 'tap', x01: row.x01, y01: row.y01 }, { type: 'wait', ms: row.delayMs }], { signal: controller.signal, log: msg => setStatus(msg) });
      }
      setStatus(controller.signal.aborted ? 'Đã dừng phát' : 'Đã phát xong');
    } finally { setPlaying(false); abortPlaybackRef.current = null; }
  }, [getTargetsByUdids, playing, rows]);

  /* ── playAppAction (group by profile, Promise.all, status chi tiết) ── */

  const playAppAction = useCallback(async (appId: AutomationAppId, actionId: string) => {
    if (playing) { abortPlaybackRef.current?.abort(); setStatus('Đang dừng phát'); return; }
    const action = appActions[appId].find(a => a.id === actionId);
    if (!action) return;
    if (!selectedList.length) { setStatus('Chưa chọn máy'); return; }

    /* Group theo profile */
    const profileGroups = new Map<string, { profile: AutomationDeviceProfile; udids: string[] }>();
    const noProfileUdids: string[] = [];
    for (const udid of selectedList) {
      const profile = deviceProfiles.find(p => p.udids.includes(udid));
      if (profile) {
        const g = profileGroups.get(profile.id);
        if (g) g.udids.push(udid);
        else profileGroups.set(profile.id, { profile, udids: [udid] });
      } else {
        noProfileUdids.push(udid);
      }
    }

    /* Legacy fallback */
    const legacyTasks: Array<{ binding: AutomationActionMacroBinding; udids: string[] }> = [];
    if (noProfileUdids.length > 0) {
      const legacyBindings = (action.bindings ?? []).filter(b => !b.profileId && Array.isArray(b.targetUdids) && b.targetUdids.length > 0);
      for (const binding of legacyBindings) {
        const matched = noProfileUdids.filter(u => binding.targetUdids?.includes(u));
        if (matched.length > 0) legacyTasks.push({ binding, udids: matched });
      }
    }

    /* Track kết quả */
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
            if (row.x01 == null || row.y01 == null) continue;
            await runScript(targets, [{ type: 'tap', x01: row.x01, y01: row.y01 }, { type: 'wait', ms: row.delayMs }], { signal: controller.signal, log: msg => setStatus(msg) });
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
            if (row.x01 == null || row.y01 == null) continue;
            await runScript(targets, [{ type: 'tap', x01: row.x01, y01: row.y01 }, { type: 'wait', ms: row.delayMs }], { signal: controller.signal, log: msg => setStatus(msg) });
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
        setStatus(parts.length ? `Không có macro hợp lệ để chạy | ${parts.join(' | ')}` : `Không có macro hợp lệ để chạy cho ${action.name}`);
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
    } finally { setPlaying(false); abortPlaybackRef.current = null; }
  }, [appActions, deviceProfiles, getTargetsByUdids, playing, savedMacros, selectedList]);

  if (!open) return null;

  /* ══════════════════ RENDER ══════════════════ */

  return (
    <div
      className={`automationFloatingLayer${coordinatePanelOpen ? ' withCoordinatePanel' : ''}`}
      style={{ left: position.x, top: position.y }}
    >
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

              {/* ── SECTION: Chạy Thao Tác ── */}
              <div className='automationActionBlock'>
                <div className='automationSectionTitle'>
                  <span>Chạy Thao Tác</span>
                  <button className='automationArrowBtn' onClick={() => setActionRunnerOpen(p => !p)} title={actionRunnerOpen ? 'Ẩn' : 'Hiện'}>
                    {actionRunnerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span>{actionRunnerOpen ? 'Ẩn' : 'Hiện'}</span>
                  </button>
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
                                    {/* badge_profile: số profile đã gán macro */}
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

              <button className={`automationCoordinateRow${coordinatePanelOpen ? ' open' : ''}`} onClick={openCoordinatePanel}>
                <div className='automationCoordinateTitle'>Nhập tọa độ</div>
                <div className='automationCoordinateMeta'>{selectedList.length ? `${selectedList.length} máy được chọn` : 'Chưa chọn máy'}</div>
                {status ? <div className={`automationStatus${statusIsError ? ' error' : ''}`}>{status}</div> : <div className='automationStatus muted'>Mở bảng Record/Phát tọa độ</div>}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Coordinate Panel ── */}
      {coordinatePanelOpen ? (
        <div className='automationCoordinatePanel modal show d-block' role='dialog' aria-modal='false'>
          <div className='modal-dialog automationCoordinateDialog'>
            <div className='modal-content automationContent automationCoordinateContent'>
              <div className='modal-header automationHeader' onPointerDown={startDrag}>
                <div className='automationTitle'><Video size={17} /><span>Nhập tọa độ</span></div>
                <button className='btn-close automationClose' aria-label='Close coordinate panel' onClick={() => setCoordinatePanelOpen(false)}><X size={16} strokeWidth={2} /></button>
              </div>
              <div className='modal-body automationCoordinateBody'>
                <div className='automationToolbar'>
                  <button className='btn automationBtn' onClick={newMacro} title='Mới'><Plus size={16} /><span>Mới</span></button>
                  <button className='btn automationBtn' onClick={() => setStatus('Chọn macro trong cột File Macro để mở')} title='Mở'><FolderOpen size={16} /><span>Mở</span></button>
                  <button className='btn automationBtn' onClick={saveMacro} disabled={!rows.length} title='Lưu'><Save size={16} /><span>Lưu</span></button>
                  <button className='btn automationBtn' onClick={addBlankStep} title='Thêm bước'><CirclePlus size={16} /><span>Thêm bước</span></button>
                  <button className={`btn automationBtn${recording ? ' active' : ''}`} onClick={toggleRecording} title='Ghi'>
                    {recording ? <Square size={16} /> : <Video size={16} />}<span>{recording ? 'Dừng ghi' : 'Ghi'}</span>
                  </button>
                  <button className={`btn automationBtn automationPlayBtn${playing ? ' active' : ''}`} onClick={playMacro} title='Phát'>
                    {playing ? <Square size={16} /> : <Play size={16} />}<span>{playing ? 'Dừng' : 'Phát'}</span>
                  </button>
                  <button className='btn automationBtn automationNarrowBtn' onClick={() => setStatus(status || 'Automation ready')} title='Log'><Info size={16} /><span>!</span></button>
                  <button className='btn automationBtn' onClick={() => setStatus('Settings Automation sẽ thêm sau')} title='Settings'><Settings size={16} /><span>Settings</span></button>
                </div>
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
                            <td>{i + 1}</td><td>Click to setup</td>
                            <td><input className='automationDelayInput' type='number' min={0} value={row.delayMs} onChange={e => updateRow(row.id, { delayMs: Math.max(0, Number(e.target.value) || 0) })} /></td>
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
                        {savedMacros.map(m => <tr key={m.id}><td><button className='automationSavedMacroBtn' onClick={() => loadMacro(m)} title={m.name}>{m.name}</button></td></tr>)}
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

      {/* ══════════════════ CONTEXT MENUS ══════════════════ */}
      {automationContextMenu && (automationContextApp || automationContextMenu.type === 'device') ? (
        <div className='automationContextMenuPanel contextMenuPanel dropdown-menu show'
          style={{ left: automationContextMenu.x, top: automationContextMenu.y }}
          onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
          onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
        >

          {/* ── context menu: app cha → Thêm hành động ── */}
          {automationContextMenu.type === 'app' ? (
            <button type='button' className='automationContextMenuItem dropdown-item'
              onPointerDown={e => { e.preventDefault(); e.stopPropagation(); addAppAction(automationContextMenu.appId); setAutomationContextMenu(null); }}
            >
              <Plus size={14} /><span>Thêm hành động {automationContextApp?.label}</span>
            </button>
          ) : null}

          {/* ── context menu: action con → chỉ Xoá Thao Tác ── */}
          {automationContextMenu.type === 'action' ? (
            <button type='button' className='automationContextMenuItem automationContextMenuDanger dropdown-item'
              disabled={!automationContextAction}
              onPointerDown={e => {
                e.preventDefault(); e.stopPropagation();
                if (!automationContextAction) return;
                deleteAppAction(automationContextMenu.appId, automationContextMenu.actionId);
                setAutomationContextMenu(null);
              }}
            >
              <X size={14} /><span>Xoá Thao Tác</span>
            </button>
          ) : null}

          {/* ── context menu: device → Profile + Actions (submenu) + Tải tọa độ ── */}
          {automationContextMenu.type === 'device' ? (
            <>
              {/* ─── Section 1: Device Profile ─── */}
              <div className='automationContextMenuLabel' onMouseEnter={() => setDeviceContextSubMenu(null)}>Device Profile</div>
              {automationContextDeviceProfileInfo?.currentProfiles.length ? (
                automationContextDeviceProfileInfo.currentProfiles.map(p => (
                  <button key={`cur-${p.id}`} type='button' className='automationContextMenuItem dropdown-item' disabled
                    onMouseEnter={() => setDeviceContextSubMenu(null)}>
                    <Users size={14} /><span>Hiện tại: {p.name}</span>
                  </button>
                ))
              ) : (
                <button type='button' className='automationContextMenuItem dropdown-item' disabled
                  onMouseEnter={() => setDeviceContextSubMenu(null)}>
                  <Users size={14} /><span>Chưa có Profile</span>
                </button>
              )}
              {deviceProfiles.map(p => (
                <button key={`assign-${p.id}`} type='button' className='automationContextMenuItem dropdown-item'
                  disabled={automationContextDeviceProfileInfo?.singleProfile?.id === p.id}
                  onMouseEnter={() => setDeviceContextSubMenu(null)}
                  onPointerDown={e => {
                    e.preventDefault(); e.stopPropagation();
                    if (automationContextDeviceProfileInfo?.singleProfile?.id === p.id) return;
                    assignDevicesToProfile(p.id, automationContextDeviceTargets);
                    setAutomationContextMenu(null);
                  }}
                >
                  <ChevronRight size={14} /><span>Gán vào: {p.name}</span>
                </button>
              ))}
              <button type='button' className='automationContextMenuItem dropdown-item'
                onMouseEnter={() => setDeviceContextSubMenu(null)}
                onPointerDown={e => {
                  e.preventDefault(); e.stopPropagation();
                  const targets = automationContextDeviceTargets;
                  const hints = targets.map(u => { const d = deviceByUdid.get(u); return [d?.manufacturer, d?.model].filter(Boolean).join(' '); }).filter(Boolean);
                  const name = window.prompt('Tạo Device Profile mới', hints[0] || '');
                  if (!name?.trim()) return;
                  createProfileForDevices(name.trim(), targets);
                  setAutomationContextMenu(null);
                }}
              >
                <Plus size={14} /><span>Tạo Profile mới</span>
              </button>

              {/* ─── Section 2: App Actions (dynamic, with submenu) ─── */}
              {AUTOMATION_APPS.map(app => {
                const actions = appActions[app.id];
                if (!actions.length) return null;
                return (
                  <React.Fragment key={`ctx-app-${app.id}`}>
                    <div className='automationContextMenuDivider' />
                    <div className='automationContextMenuLabel' onMouseEnter={() => setDeviceContextSubMenu(null)}>{app.label}</div>
                    {actions.map(action => (
                      <div key={`ctx-act-${action.id}`} style={{ position: 'relative' }}
                        onMouseEnter={() => setDeviceContextSubMenu({ appId: app.id, actionId: action.id })}
                      >
                        <button type='button' className='automationContextMenuItem dropdown-item'
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.name}</span>
                          <ChevronRight size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
                        </button>

                        {/* ═══ SUBMENU: action binding management ═══ */}
                        {deviceContextSubMenu?.appId === app.id && deviceContextSubMenu?.actionId === action.id && deviceSubmenuInfo ? (
                          <div className='automationContextMenuPanel contextMenuPanel dropdown-menu show'
                            style={{ position: 'absolute', left: 'calc(100% - 4px)', top: '-4px', minWidth: '240px', zIndex: 10, maxHeight: '320px', overflowY: 'auto' }}
                            onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
                            onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
                          >
                            {/* ── Case: có máy chưa có profile ── */}
                            {deviceSubmenuInfo.unassigned.length > 0 ? (
                              <>
                                <button type='button' className='automationContextMenuItem dropdown-item' disabled>
                                  <Users size={14} /><span>Chưa có Profile ({deviceSubmenuInfo.unassigned.length} máy)</span>
                                </button>
                                <div className='automationContextMenuDivider' />
                                <div className='automationContextMenuLabel'>Gán Profile trước</div>
                                {deviceProfiles.map(p => (
                                  <button key={`sub-assign-${p.id}`} type='button' className='automationContextMenuItem dropdown-item'
                                    onPointerDown={e => {
                                      e.preventDefault(); e.stopPropagation();
                                      assignDevicesToProfile(p.id, deviceSubmenuInfo.unassigned);
                                    }}
                                  >
                                    <ChevronRight size={14} /><span>{p.name}</span>
                                  </button>
                                ))}
                                <button type='button' className='automationContextMenuItem dropdown-item'
                                  onPointerDown={e => {
                                    e.preventDefault(); e.stopPropagation();
                                    const hints = deviceSubmenuInfo.unassigned.map(u => {
                                      const d = deviceByUdid.get(u);
                                      return [d?.manufacturer, d?.model].filter(Boolean).join(' ');
                                    }).filter(Boolean);
                                    const name = window.prompt('Tạo Device Profile mới', hints[0] || '');
                                    if (!name?.trim()) return;
                                    createProfileForDevices(name.trim(), deviceSubmenuInfo.unassigned);
                                  }}
                                >
                                  <Plus size={14} /><span>Tạo Profile mới</span>
                                </button>
                              </>
                            ) : deviceSubmenuInfo.profileCount > 1 ? (
                              /* ── Case: nhiều profile → báo lỗi ── */
                              <>
                                <button type='button' className='automationContextMenuItem dropdown-item' disabled>
                                  <span>Nhiều profile: {deviceSubmenuInfo.profiles.map(p => p.name).join(', ')}</span>
                                </button>
                                <button type='button' className='automationContextMenuItem dropdown-item' disabled>
                                  <span>Chọn cùng profile để gán macro</span>
                                </button>
                              </>
                            ) : deviceSubmenuInfo.singleProfile ? (
                              /* ── Case: 1 profile → quản lý macro binding ── */
                              <>
                                <button type='button' className='automationContextMenuItem dropdown-item' disabled>
                                  <Users size={14} /><span>Profile: {deviceSubmenuInfo.singleProfile.name}</span>
                                </button>

                                {deviceSubmenuInfo.binding ? (
                                  <button type='button' className='automationContextMenuItem dropdown-item' disabled>
                                    <Save size={14} />
                                    <span>{deviceSubmenuInfo.macroExists ? `Macro: ${deviceSubmenuInfo.binding.macroName}` : `⚠ Macro đã mất: ${deviceSubmenuInfo.binding.macroName}`}</span>
                                  </button>
                                ) : (
                                  <button type='button' className='automationContextMenuItem dropdown-item' disabled>
                                    <span>Chưa gán macro</span>
                                  </button>
                                )}

                                <div className='automationContextMenuDivider' />
                                <div className='automationContextMenuLabel'>{deviceSubmenuInfo.binding ? 'Thay đổi file macro' : 'Chọn file macro'}</div>

                                {savedMacros.map(macro => (
                                  <button key={`sub-macro-${macro.id}`} type='button'
                                    className='automationContextMenuItem automationContextMacroItem dropdown-item'
                                    disabled={deviceSubmenuInfo.binding?.macroId === macro.id}
                                    title={macro.name}
                                    onPointerDown={e => {
                                      e.preventDefault(); e.stopPropagation();
                                      if (deviceSubmenuInfo.binding?.macroId === macro.id) return;
                                      assignMacroToAction(app.id, action.id, macro, deviceSubmenuInfo.singleProfile!);
                                      setAutomationContextMenu(null);
                                    }}
                                  >
                                    {deviceSubmenuInfo.binding?.macroId === macro.id ? <Save size={14} /> : <FolderOpen size={14} />}
                                    <span>{macro.name}</span>
                                  </button>
                                ))}
                                {!savedMacros.length ? (
                                  <button type='button' className='automationContextMenuItem dropdown-item' disabled>
                                    <span>Chưa có file Macro</span>
                                  </button>
                                ) : null}

                                {deviceSubmenuInfo.binding ? (
                                  <>
                                    <div className='automationContextMenuDivider' />
                                    <button type='button' className='automationContextMenuItem automationContextMenuDanger dropdown-item'
                                      onPointerDown={e => {
                                        e.preventDefault(); e.stopPropagation();
                                        removeBindingFromAction(app.id, action.id, deviceSubmenuInfo.singleProfile!.id);
                                        setAutomationContextMenu(null);
                                      }}
                                    >
                                      <X size={14} /><span>Xoá gán macro</span>
                                    </button>
                                  </>
                                ) : null}
                              </>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </React.Fragment>
                );
              })}

              {/* ─── Section 3: Tải tọa độ (existing) ─── */}
              <div className='automationContextMenuDivider' />
              <div className='automationContextMenuLabel' onMouseEnter={() => setDeviceContextSubMenu(null)}>Tải tọa độ</div>
              {savedMacros.map(macro => (
                <button key={`load-${macro.id}`} type='button' className='automationContextMenuItem automationContextMacroItem dropdown-item'
                  title={macro.name}
                  onMouseEnter={() => setDeviceContextSubMenu(null)}
                  onPointerDown={e => {
                    e.preventDefault(); e.stopPropagation();
                    loadMacroForDevices(macro, automationContextDeviceTargets);
                    setAutomationContextMenu(null);
                  }}
                >
                  <FolderOpen size={14} /><span>{macro.name}</span>
                </button>
              ))}
              {!savedMacros.length ? (
                <button type='button' className='automationContextMenuItem dropdown-item' disabled
                  onMouseEnter={() => setDeviceContextSubMenu(null)}>
                  <span>Chưa có file Macro</span>
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function BotTitleIcon() {
  return <span className='automationTitleIcon' aria-hidden='true'><Video size={17} strokeWidth={2} /></span>;
}
