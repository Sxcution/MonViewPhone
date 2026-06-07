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

export type AutomationDeviceOption = {
  udid: string;
  number: number;
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

type AutomationActionMacroBinding = {
  id: string;
  macroId: string;
  macroName: string;
  targetUdids: string[];
  updatedAt: number;
};

type AutomationAppAction = {
  id: string;
  name: string;
  bindings: AutomationActionMacroBinding[];
};

type AutomationContextMenuTarget =
  | {
    type: 'app';
    appId: AutomationAppId;
    x: number;
    y: number;
  }
  | {
    type: 'action';
    appId: AutomationAppId;
    actionId: string;
    x: number;
    y: number;
  }
  | {
    type: 'device';
    udid: string;
    x: number;
    y: number;
  };

type AutomationContextMenuInput =
  | {
    type: 'app';
    appId: AutomationAppId;
  }
  | {
    type: 'action';
    appId: AutomationAppId;
    actionId: string;
  }
  | {
    type: 'device';
    udid: string;
  };

type AutomationModalProps = {
  open: boolean;
  devices: AutomationDeviceOption[];
  selectedUdids: string[];
  onToggleDevice: (udid: string, checked: boolean) => void;
  onToggleAllDevices: (checked: boolean) => void;
  onClose: () => void;
};

const AUTOMATION_MACROS_KEY = 'automationMacrosV1';
const AUTOMATION_APP_ACTIONS_KEY = 'automationAppActionsV1';
const DEFAULT_DELAY_MS = 1000;
const ONLY_ONE_DEVICE_MSG = 'Chỉ chọn 1 thiết bị';
const SELECT_ONE_DEVICE_MSG = 'Chọn 1 thiết bị';

const AUTOMATION_APPS: Array<{ id: AutomationAppId; label: string; icon: string }> = [
  { id: 'wechat', label: 'Wechat', icon: '/automation-icons/WechatIcon.png' },
  { id: 'line', label: 'Line', icon: '/automation-icons/LINE_New_App_Icon_(2020-12).png' },
  { id: 'tantan', label: 'Tantan', icon: '/automation-icons/TantanIcon.png' },
  { id: 'setting', label: 'Setting', icon: '/automation-icons/setting.png' },
];

function emptyAppActions(): Record<AutomationAppId, AutomationAppAction[]> {
  return {
    wechat: [],
    line: [],
    tantan: [],
    setting: [],
  };
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
    return parsed.filter((item): item is SavedAutomationMacro => {
      return Boolean(item?.id && item?.name && Array.isArray(item?.rows));
    });
  } catch {
    return [];
  }
}

function saveSavedMacros(macros: SavedAutomationMacro[]) {
  try {
    localStorage.setItem(AUTOMATION_MACROS_KEY, JSON.stringify(macros));
  } catch {
    // ignore
  }
}

function loadAppActions(): Record<AutomationAppId, AutomationAppAction[]> {
  const fallback = emptyAppActions();
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTOMATION_APP_ACTIONS_KEY) || '{}');
    const next = emptyAppActions();
    for (const app of AUTOMATION_APPS) {
      const list = parsed?.[app.id];
      next[app.id] = Array.isArray(list)
        ? list
          .filter(item => Boolean(item?.id && item?.name))
          .map(item => {
            const bindings = Array.isArray(item.bindings)
              ? item.bindings
                .filter((binding: Partial<AutomationActionMacroBinding>) => (
                  Boolean(binding?.id && binding?.macroId && binding?.macroName && Array.isArray(binding?.targetUdids))
                ))
                .map((binding: AutomationActionMacroBinding) => ({
                  id: String(binding.id),
                  macroId: String(binding.macroId),
                  macroName: String(binding.macroName),
                  targetUdids: binding.targetUdids.map(String),
                  updatedAt: Number(binding.updatedAt) || Date.now(),
                }))
              : [];
            return { id: String(item.id), name: String(item.name), bindings };
          })
        : [];
    }
    return next;
  } catch {
    return fallback;
  }
}

function saveAppActions(actions: Record<AutomationAppId, AutomationAppAction[]>) {
  try {
    localStorage.setItem(AUTOMATION_APP_ACTIONS_KEY, JSON.stringify(actions));
  } catch {
    // ignore
  }
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

function formatStepDetails(row: AutomationMacroRow) {
  const x = row.x == null ? '' : row.x;
  const y = row.y == null ? '' : row.y;
  return `X=${x}, Y=${y}`;
}

function clampPosition(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function AutomationModal({
  open,
  devices,
  selectedUdids,
  onToggleDevice,
  onToggleAllDevices,
  onClose,
}: AutomationModalProps) {
  const { getTargetsByUdids } = useActive();
  const [deviceListOpen, setDeviceListOpen] = useState(true);
  const [actionRunnerOpen, setActionRunnerOpen] = useState(true);
  const [coordinatePanelOpen, setCoordinatePanelOpen] = useState(false);
  const [rows, setRows] = useState<AutomationMacroRow[]>([]);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [savedMacros, setSavedMacros] = useState<SavedAutomationMacro[]>(loadSavedMacros);
  const [appActions, setAppActions] = useState<Record<AutomationAppId, AutomationAppAction[]>>(loadAppActions);
  const [activeActionApp, setActiveActionApp] = useState<AutomationAppId>('wechat');
  const [actionOverlayOpen, setActionOverlayOpen] = useState<AutomationAppId | null>(null);
  const [automationContextMenu, setAutomationContextMenu] = useState<AutomationContextMenuTarget | null>(null);
  const [currentMacroName, setCurrentMacroName] = useState('');
  const [position, setPosition] = useState({ x: 120, y: 80 });
  const recordingRef = useRef(false);
  const selectedRef = useRef<string[]>([]);
  const abortPlaybackRef = useRef<AbortController | null>(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  const deviceByUdid = useMemo(() => {
    const map = new Map<string, AutomationDeviceOption>();
    devices.forEach(device => map.set(device.udid, device));
    return map;
  }, [devices]);

  const selectedSet = useMemo(() => new Set(selectedUdids), [selectedUdids]);

  const automationGridDevices = useMemo<DeviceSelectionGridItem[]>(
    () => devices.map(device => ({
      udid: device.udid,
      label: formatDeviceNo(device.number),
      title: device.udid,
    })),
    [devices],
  );

  const selectedList = useMemo(() => {
    return devices.map(device => device.udid).filter(udid => selectedSet.has(udid));
  }, [devices, selectedSet]);

  const selectedRecordDevice = useMemo(
    () => (selectedList.length === 1 ? deviceByUdid.get(selectedList[0]) ?? null : null),
    [deviceByUdid, selectedList],
  );

  const statusIsError = status === ONLY_ONE_DEVICE_MSG || status === SELECT_ONE_DEVICE_MSG;
  const allAutomationDevicesSelected = devices.length > 0 && devices.every(device => selectedSet.has(device.udid));

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

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  useEffect(() => {
    selectedRef.current = selectedList;
  }, [selectedList]);

  useEffect(() => {
    if (open) return;
    setRecording(false);
    setActionOverlayOpen(null);
    setAutomationContextMenu(null);
    abortPlaybackRef.current?.abort();
  }, [open]);

  useEffect(() => {
    if (!automationContextMenu) return;

    const closeAutomationContextMenu = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.automationContextMenuPanel')) return;
      setAutomationContextMenu(null);
    };
    const closeAutomationContextMenuOnKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAutomationContextMenu(null);
    };

    window.addEventListener('mousedown', closeAutomationContextMenu, true);
    window.addEventListener('contextmenu', closeAutomationContextMenu, true);
    window.addEventListener('keydown', closeAutomationContextMenuOnKey);
    window.addEventListener('resize', closeAutomationContextMenu);
    return () => {
      window.removeEventListener('mousedown', closeAutomationContextMenu, true);
      window.removeEventListener('contextmenu', closeAutomationContextMenu, true);
      window.removeEventListener('keydown', closeAutomationContextMenuOnKey);
      window.removeEventListener('resize', closeAutomationContextMenu);
    };
  }, [automationContextMenu]);

  useEffect(() => {
    const onAutomationClick = (event: Event) => {
      if (!recordingRef.current) return;
      const detail = (event as CustomEvent<AutomationClickDetail>).detail;
      const selected = selectedRef.current;
      if (!detail?.udid || selected.length !== 1 || detail.udid !== selected[0]) return;

      const sourceNo = deviceByUdid.get(detail.udid)?.number;
      setRows(prev => [
        ...prev,
        {
          id: makeId('step'),
          action: 'click',
          delayMs: DEFAULT_DELAY_MS,
          x01: detail.x01,
          y01: detail.y01,
          x: detail.x,
          y: detail.y,
          width: detail.width,
          height: detail.height,
          sourceUdid: detail.udid,
          targetUdids: [detail.udid],
          note: '',
        },
      ]);
      setStatus(`Đã ghi tọa độ${sourceNo ? ` máy #${formatDeviceNo(sourceNo)}` : ''}: x=${detail.x}, y=${detail.y}`);
    };

    window.addEventListener(AUTOMATION_CLICK_EVENT, onAutomationClick as EventListener);
    return () => window.removeEventListener(AUTOMATION_CLICK_EVENT, onAutomationClick as EventListener);
  }, [deviceByUdid]);

  const onDragMove = useCallback((event: PointerEvent) => {
    if (!dragRef.current.active) return;
    event.preventDefault();
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    setPosition({
      x: clampPosition(dragRef.current.originX + dx, 0, Math.max(0, window.innerWidth - 80)),
      y: clampPosition(dragRef.current.originY + dy, 0, Math.max(0, window.innerHeight - 60)),
    });
  }, []);

  const onDragUp = useCallback(() => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragUp);
  }, [onDragMove]);

  const startDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement;
      if (target.closest('button, input, textarea, select')) return;
      event.preventDefault();
      dragRef.current = {
        active: true,
        startX: event.clientX,
        startY: event.clientY,
        originX: position.x,
        originY: position.y,
      };
      window.addEventListener('pointermove', onDragMove, { passive: false });
      window.addEventListener('pointerup', onDragUp);
    },
    [onDragMove, onDragUp, position.x, position.y],
  );

  const closeModal = useCallback(() => {
    setRecording(false);
    setActionOverlayOpen(null);
    setAutomationContextMenu(null);
    abortPlaybackRef.current?.abort();
    onClose();
  }, [onClose]);

  const addAppAction = useCallback((appId: AutomationAppId) => {
    const app = AUTOMATION_APPS.find(item => item.id === appId);
    const name = window.prompt(`Thêm hành động ${app?.label ?? appId}`, '');
    const cleanName = name?.trim();
    if (!cleanName) return;
    setAppActions(prev => {
      const next = {
        ...prev,
        [appId]: [...prev[appId], { id: makeId(`${appId}-action`), name: cleanName, bindings: [] }],
      };
      saveAppActions(next);
      return next;
    });
    setActiveActionApp(appId);
    setActionOverlayOpen(appId);
  }, []);

  const deleteAppAction = useCallback((appId: AutomationAppId, actionId: string) => {
    const actionName = appActions[appId].find(action => action.id === actionId)?.name;
    setAppActions(prev => {
      const next = {
        ...prev,
        [appId]: prev[appId].filter(action => action.id !== actionId),
      };
      saveAppActions(next);
      return next;
    });
    setStatus(actionName ? `Đã xoá thao tác: ${actionName}` : 'Đã xoá thao tác');
  }, [appActions]);

  const openAutomationContextMenu = useCallback((
    event: React.MouseEvent<HTMLElement>,
    target: AutomationContextMenuInput,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (target.type !== 'device') setActiveActionApp(target.appId);
    const x = clampPosition(event.clientX, 8, Math.max(8, window.innerWidth - 230));
    const y = clampPosition(event.clientY, 8, Math.max(8, window.innerHeight - 112));
    if (target.type === 'app') {
      setAutomationContextMenu({ type: 'app', appId: target.appId, x, y });
      return;
    }
    if (target.type === 'action') {
      setAutomationContextMenu({ type: 'action', appId: target.appId, actionId: target.actionId, x, y });
      return;
    }
    setAutomationContextMenu({ type: 'device', udid: target.udid, x, y });
  }, []);

  const openCoordinatePanel = useCallback(() => {
    setCoordinatePanelOpen(true);
    if (selectedList.length > 1) {
      setStatus(ONLY_ONE_DEVICE_MSG);
    } else if (selectedList.length === 0) {
      setStatus(SELECT_ONE_DEVICE_MSG);
    }
  }, [selectedList.length]);

  const startRecording = useCallback(() => {
    setCoordinatePanelOpen(true);
    if (selectedList.length > 1) {
      setRecording(false);
      setStatus(ONLY_ONE_DEVICE_MSG);
      return;
    }
    if (selectedList.length === 0) {
      setRecording(false);
      setStatus(SELECT_ONE_DEVICE_MSG);
      return;
    }
    setRecording(true);
    const no = deviceByUdid.get(selectedList[0])?.number;
    setStatus(`Đang ghi tọa độ${no ? ` máy #${formatDeviceNo(no)}` : ''}`);
  }, [deviceByUdid, selectedList]);

  const toggleRecording = useCallback(() => {
    if (recording) {
      setRecording(false);
      setStatus('Đã dừng ghi tọa độ');
      return;
    }
    startRecording();
  }, [recording, startRecording]);

  const addBlankStep = useCallback(() => {
    setRows(prev => [
      ...prev,
      {
        id: makeId('step'),
        action: 'click',
        delayMs: DEFAULT_DELAY_MS,
        targetUdids: selectedList.length === 1 ? [selectedList[0]] : [],
        note: '',
      },
    ]);
  }, [selectedList]);

  const updateRow = useCallback((id: string, patch: Partial<AutomationMacroRow>) => {
    setRows(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)));
  }, []);

  const getDeviceContextTargets = useCallback((udid: string) => {
    if (selectedSet.has(udid) && selectedList.length) return selectedList;
    return [udid];
  }, [selectedList, selectedSet]);

  const loadMacroForDevices = useCallback((macro: SavedAutomationMacro, targetUdids: string[]) => {
    const allowed = new Set(devices.map(device => device.udid));
    const cleanTargets = [...new Set(targetUdids)].filter(udid => allowed.has(udid));
    if (!cleanTargets.length) {
      setStatus('Chưa chọn máy để tải tọa độ');
      return;
    }

    setRows(macro.rows.map(row => ({
      ...row,
      id: makeId('step'),
      targetUdids: cleanTargets,
      note: row.note ?? '',
    })));
    setCurrentMacroName(macro.name);
    setCoordinatePanelOpen(true);
    setStatus(`Đã tải tọa độ "${macro.name}" cho ${cleanTargets.length} máy`);
  }, [devices]);

  const assignMacroToAction = useCallback((
    appId: AutomationAppId,
    actionId: string,
    macro: SavedAutomationMacro,
    targetUdids: string[],
  ) => {
    const allowed = new Set(devices.map(device => device.udid));
    const cleanTargets = [...new Set(targetUdids)].filter(udid => allowed.has(udid));
    if (!cleanTargets.length) {
      setStatus('Chọn máy trước khi tải tọa độ cho thao tác');
      return;
    }

    setAppActions(prev => {
      const targetSet = new Set(cleanTargets);
      const nextActions = prev[appId].map(action => {
        if (action.id !== actionId) return action;

        const bindings = (action.bindings ?? [])
          .map(binding => ({
            ...binding,
            targetUdids: binding.targetUdids.filter(udid => !targetSet.has(udid)),
          }))
          .filter(binding => binding.targetUdids.length > 0);
        const sameMacro = bindings.find(binding => binding.macroId === macro.id);

        if (sameMacro) {
          sameMacro.targetUdids = [...new Set([...sameMacro.targetUdids, ...cleanTargets])];
          sameMacro.macroName = macro.name;
          sameMacro.updatedAt = Date.now();
        } else {
          bindings.push({
            id: makeId('binding'),
            macroId: macro.id,
            macroName: macro.name,
            targetUdids: cleanTargets,
            updatedAt: Date.now(),
          });
        }

        return { ...action, bindings };
      });
      const next = { ...prev, [appId]: nextActions };
      saveAppActions(next);
      return next;
    });

    const actionName = appActions[appId].find(action => action.id === actionId)?.name ?? 'thao tác';
    setStatus(`Đã gán "${macro.name}" vào ${actionName} cho ${cleanTargets.length} máy`);
  }, [appActions, devices]);

  const newMacro = useCallback(() => {
    setRows([]);
    setCurrentMacroName('');
    setStatus('Đã tạo macro mới');
  }, []);

  const saveMacro = useCallback(() => {
    const name = window.prompt('Tên nhóm Automation', currentMacroName || `Macro ${new Date().toLocaleTimeString('vi-VN')}`);
    if (!name?.trim()) return;
    const cleanName = name.trim();
    const nextMacro: SavedAutomationMacro = {
      id: makeId('macro'),
      name: cleanName,
      rows: cloneRows(rows),
      updatedAt: Date.now(),
    };
    setSavedMacros(prev => {
      const next = [nextMacro, ...prev.filter(macro => macro.name !== cleanName)].slice(0, 50);
      saveSavedMacros(next);
      return next;
    });
    setCurrentMacroName(cleanName);
    setStatus(`Đã lưu nhóm Automation: ${cleanName}`);
  }, [currentMacroName, rows]);

  const loadMacro = useCallback((macro: SavedAutomationMacro) => {
    setRows(cloneRows(macro.rows));
    setCurrentMacroName(macro.name);
    setStatus(`Đã mở nhóm Automation: ${macro.name}`);
  }, []);

  const playMacro = useCallback(async () => {
    if (playing) {
      abortPlaybackRef.current?.abort();
      setStatus('Đang dừng phát');
      return;
    }

    const runnableRows = rows.filter(row => row.x01 != null && row.y01 != null);
    if (!runnableRows.length) {
      setStatus('Chưa có bước tọa độ để phát');
      return;
    }

    setRecording(false);
    setPlaying(true);
    const controller = new AbortController();
    abortPlaybackRef.current = controller;

    try {
      for (const row of runnableRows) {
        if (controller.signal.aborted) break;
        if (row.x01 == null || row.y01 == null) continue;
        const targets = getTargetsByUdids(row.targetUdids);
        if (!targets.length) continue;

        await runScript(
          targets,
          [
            { type: 'tap', x01: row.x01, y01: row.y01 },
            { type: 'wait', ms: row.delayMs },
          ],
          {
            signal: controller.signal,
            log: msg => setStatus(msg),
          },
        );
      }
      setStatus(controller.signal.aborted ? 'Đã dừng phát' : 'Đã phát xong');
    } finally {
      setPlaying(false);
      abortPlaybackRef.current = null;
    }
  }, [getTargetsByUdids, playing, rows]);

  const playAppAction = useCallback(async (appId: AutomationAppId, actionId: string) => {
    if (playing) {
      abortPlaybackRef.current?.abort();
      setStatus('Đang dừng phát');
      return;
    }

    const action = appActions[appId].find(item => item.id === actionId);
    if (!action) return;
    if (!selectedList.length) {
      setStatus('Chưa chọn máy');
      return;
    }

    const selectedTargetSet = new Set(selectedList);
    const runnableBindings = (action.bindings ?? [])
      .map(binding => ({
        ...binding,
        targetUdids: binding.targetUdids.filter(udid => selectedTargetSet.has(udid)),
      }))
      .filter(binding => binding.targetUdids.length > 0);
    const boundSet = new Set(runnableBindings.flatMap(binding => binding.targetUdids));
    const missingCount = selectedList.filter(udid => !boundSet.has(udid)).length;

    if (!runnableBindings.length) {
      setStatus(`Chưa tải tọa độ cho ${action.name}`);
      return;
    }

    setRecording(false);
    setPlaying(true);
    const controller = new AbortController();
    abortPlaybackRef.current = controller;

    try {
      for (const binding of runnableBindings) {
        if (controller.signal.aborted) break;
        const macro = savedMacros.find(item => item.id === binding.macroId || item.name === binding.macroName);
        if (!macro) {
          setStatus(`Không tìm thấy macro: ${binding.macroName}`);
          continue;
        }

        const targets = getTargetsByUdids(binding.targetUdids);
        if (!targets.length) continue;

        for (const row of macro.rows) {
          if (controller.signal.aborted) break;
          if (row.x01 == null || row.y01 == null) continue;
          await runScript(
            targets,
            [
              { type: 'tap', x01: row.x01, y01: row.y01 },
              { type: 'wait', ms: row.delayMs },
            ],
            {
              signal: controller.signal,
              log: msg => setStatus(msg),
            },
          );
        }
      }
      if (controller.signal.aborted) {
        setStatus('Đã dừng phát');
      } else if (missingCount) {
        setStatus(`Đã phát ${action.name}; ${missingCount} máy chưa có tọa độ`);
      } else {
        setStatus(`Đã phát xong ${action.name}`);
      }
    } finally {
      setPlaying(false);
      abortPlaybackRef.current = null;
    }
  }, [appActions, getTargetsByUdids, playing, savedMacros, selectedList]);

  const automationContextApp = automationContextMenu && automationContextMenu.type !== 'device'
    ? AUTOMATION_APPS.find(app => app.id === automationContextMenu.appId) ?? null
    : null;
  const automationContextAction = automationContextMenu?.type === 'action'
    ? appActions[automationContextMenu.appId].find(action => action.id === automationContextMenu.actionId) ?? null
    : null;
  const automationContextDeviceTargets = automationContextMenu?.type === 'device'
    ? getDeviceContextTargets(automationContextMenu.udid)
    : [];

  if (!open) return null;

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
              <button className='btn-close automationClose' aria-label='Close' onClick={closeModal}>
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <div className='modal-body automationBody'>
              <div className='automationActionBlock'>
                <div className='automationSectionTitle'>
                  <span>Chạy Thao Tác</span>
                  <button
                    className='automationArrowBtn'
                    onClick={() => setActionRunnerOpen(prev => !prev)}
                    title={actionRunnerOpen ? 'Ẩn' : 'Hiện'}
                  >
                    {actionRunnerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span>{actionRunnerOpen ? 'Ẩn' : 'Hiện'}</span>
                  </button>
                </div>

              </div>

              <div className='automationDeviceBlock'>
                <div className='automationSectionTitle'>
                  <span>Danh sách máy</span>
                  <div className='automationSectionActions'>
                    <button
                      className={`rcpSelectPill${allAutomationDevicesSelected ? ' on' : ''}`}
                      onClick={() => onToggleAllDevices(!allAutomationDevicesSelected)}
                    >
                      <span className='rcpSelectIcon'>{allAutomationDevicesSelected ? '✔' : ''}</span>
                      <span className='rcpSelectText'>
                        {allAutomationDevicesSelected ? 'Bỏ tất cả' : 'Chọn tất cả'}
                      </span>
                      <span className='rcpSelectCount'>({devices.length})</span>
                    </button>
                    <button
                      className='automationArrowBtn'
                      onClick={() => setDeviceListOpen(prev => !prev)}
                      title={deviceListOpen ? 'Ẩn' : 'Hiện'}
                    >
                      {deviceListOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      <span>{deviceListOpen ? 'Ẩn' : 'Hiện'}</span>
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
                            onClick={() => {
                              setActiveActionApp(app.id);
                              setActionOverlayOpen(prev => (prev === app.id ? null : app.id));
                            }}
                            onContextMenu={event => openAutomationContextMenu(event, { type: 'app', appId: app.id })}
                          >
                            <img src={app.icon} alt='' className='automationAppIconOnly' />
                          </button>

                          {actionOverlayOpen === app.id ? (
                            <div
                              className='automationChildActionOverlay'
                              role='dialog'
                              aria-label={`${app.label} actions`}
                              onMouseDown={event => event.stopPropagation()}
                              onClick={event => event.stopPropagation()}
                              onContextMenu={event => {
                                event.preventDefault();
                                event.stopPropagation();
                              }}
                            >
                              <div className='automationActionChildrenPanel'>
                                {appActions[app.id].map(action => (
                                  <button
                                    key={action.id}
                                    className='automationChildActionBtn automationPanelChildActionBtn'
                                    title={`${app.label}: ${action.name}`}
                                    onClick={() => playAppAction(app.id, action.id)}
                                    onContextMenu={event => openAutomationContextMenu(event, {
                                      type: 'action',
                                      appId: app.id,
                                      actionId: action.id,
                                    })}
                                  >
                                    <span className='automationChildActionLabel'>{action.name}</span>
                                    <img src={app.icon} alt='' className='automationChildActionIcon' />
                                    {(action.bindings ?? []).length ? (
                                      <span className='automationBindingBadge'>
                                        {(action.bindings ?? []).reduce((sum, binding) => sum + binding.targetUdids.length, 0)}
                                      </span>
                                    ) : null}
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

                {deviceListOpen ? (
                  <div className='rcpGridWrap automationGridWrap'>
                    {/* AUTOMATION_SHARED_DEVICE_GRID: dùng chung DeviceSelectionGrid với grid panel điều khiển. */}
                    <DeviceSelectionGrid
                      className='automationTotalDeviceGrid'
                      devices={automationGridDevices}
                      selectedUdids={selectedSet}
                      emptyText='Chưa có máy đang mở'
                      onToggleDevice={onToggleDevice}
                      onDeviceContextMenu={(event, udid) => openAutomationContextMenu(event, { type: 'device', udid })}
                    />
                  </div>
                ) : null}
              </div>

              {/* AUTOMATION_SHARED_CONTROL_GRID_SELECTION: selection của Automation đồng bộ với Grid điều khiển qua connectSelection. */}
              <button
                className={`automationCoordinateRow${coordinatePanelOpen ? ' open' : ''}`}
                onClick={openCoordinatePanel}
              >
                <div className='automationCoordinateTitle'>Nhập tọa độ</div>
                <div className='automationCoordinateMeta'>
                  {selectedList.length ? `${selectedList.length} máy được chọn` : 'Chưa chọn máy'}
                </div>
                {status ? <div className={`automationStatus${statusIsError ? ' error' : ''}`}>{status}</div> : <div className='automationStatus muted'>Mở bảng Record/Phát tọa độ</div>}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {coordinatePanelOpen ? (
        <div className='automationCoordinatePanel modal show d-block' role='dialog' aria-modal='false'>
          <div className='modal-dialog automationCoordinateDialog'>
            <div className='modal-content automationContent automationCoordinateContent'>
              <div className='modal-header automationHeader' onPointerDown={startDrag}>
                <div className='automationTitle'>
                  <Video size={17} />
                  <span>Nhập tọa độ</span>
                </div>
                <button className='btn-close automationClose' aria-label='Close coordinate panel' onClick={() => setCoordinatePanelOpen(false)}>
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              <div className='modal-body automationCoordinateBody'>
                <div className='automationToolbar'>
                  <button className='btn automationBtn' onClick={newMacro} title='Mới'>
                    <Plus size={16} />
                    <span>Mới</span>
                  </button>
                  <button className='btn automationBtn' onClick={() => setStatus('Chọn macro trong cột File Macro để mở')} title='Mở'>
                    <FolderOpen size={16} />
                    <span>Mở</span>
                  </button>
                  <button className='btn automationBtn' onClick={saveMacro} disabled={!rows.length} title='Lưu'>
                    <Save size={16} />
                    <span>Lưu</span>
                  </button>
                  <button className='btn automationBtn' onClick={addBlankStep} title='Thêm bước'>
                    <CirclePlus size={16} />
                    <span>Thêm bước</span>
                  </button>
                  <button className={`btn automationBtn${recording ? ' active' : ''}`} onClick={toggleRecording} title='Ghi'>
                    {recording ? <Square size={16} /> : <Video size={16} />}
                    <span>{recording ? 'Dừng ghi' : 'Ghi'}</span>
                  </button>
                  <button className={`btn automationBtn automationPlayBtn${playing ? ' active' : ''}`} onClick={playMacro} title='Phát'>
                    {playing ? <Square size={16} /> : <Play size={16} />}
                    <span>{playing ? 'Dừng' : 'Phát'}</span>
                  </button>
                  <button className='btn automationBtn automationNarrowBtn' onClick={() => setStatus(status || 'Automation ready')} title='Log'>
                    <Info size={16} />
                    <span>!</span>
                  </button>
                  <button className='btn automationBtn' onClick={() => setStatus('Settings Automation sẽ thêm sau')} title='Settings'>
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                </div>

                <div className='automationCoordinateContext'>
                  <span className={selectedList.length > 1 ? 'automationErrorText' : undefined}>
                    {selectedRecordDevice
                      ? `Máy ghi: #${formatDeviceNo(selectedRecordDevice.number)}`
                      : selectedList.length > 1
                        ? 'Chỉ chọn 1 thiết bị'
                        : 'Chưa chọn máy'}
                  </span>
                  {status ? <span className={`automationStatus full${selectedList.length > 1 ? ' error' : ''}`}>{status}</span> : null}
                </div>

                <div className='automationCoordinateTables'>
                  <div className='automationMainTableWrap'>
                    <table className='table table-dark table-sm automationMacroTable'>
                      <thead>
                        <tr>
                          <th>Step</th>
                          <th>Action</th>
                          <th>Delay (ms)</th>
                          <th>Details</th>
                          <th>Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, index) => (
                          <tr key={row.id}>
                            <td>{index + 1}</td>
                            <td>Click to setup</td>
                            <td>
                              <input
                                className='automationDelayInput'
                                type='number'
                                min={0}
                                value={row.delayMs}
                                onChange={e => updateRow(row.id, { delayMs: Math.max(0, Number(e.target.value) || 0) })}
                              />
                            </td>
                            <td className='automationDetailsCell'>{formatStepDetails(row)}</td>
                            <td>
                              <input
                                className='automationNoteInput'
                                type='text'
                                value={row.note ?? ''}
                                onChange={e => updateRow(row.id, { note: e.target.value })}
                              />
                            </td>
                          </tr>
                        ))}
                        {!rows.length ? (
                          <tr>
                            <td colSpan={5} className='automationEmptyRow'>Chưa có bước nào</td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>

                  <div className='automationSavedTableWrap'>
                    <table className='table table-dark table-sm automationSavedTable'>
                      <thead>
                        <tr>
                          <th>File Macro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {savedMacros.map(macro => (
                          <tr key={macro.id}>
                            <td>
                              <button className='automationSavedMacroBtn' onClick={() => loadMacro(macro)} title={macro.name}>
                                {macro.name}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {!savedMacros.length ? (
                          <tr>
                            <td className='automationEmptyRow'>Trống</td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Context Automation: menu chuột phải riêng của Automation, không dùng chung context menu khác. */}
      {automationContextMenu && (automationContextApp || automationContextMenu.type === 'device') ? (
        <div
          className='automationContextMenuPanel contextMenuPanel dropdown-menu show'
          style={{ left: automationContextMenu.x, top: automationContextMenu.y }}
          onMouseDown={event => event.stopPropagation()}
          onClick={event => event.stopPropagation()}
          onContextMenu={event => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          {automationContextMenu.type === 'app' ? (
            <button
              type='button'
              className='automationContextMenuItem dropdown-item'
              onPointerDown={event => {
                event.preventDefault();
                event.stopPropagation();
                addAppAction(automationContextMenu.appId);
                setAutomationContextMenu(null);
              }}
            >
              <Plus size={14} />
              <span>Thêm hành động {automationContextApp?.label}</span>
            </button>
          ) : null}

          {automationContextMenu.type === 'action' ? (
            <>
              <div className='automationContextMenuLabel'>Tải tọa độ</div>
              {savedMacros.map(macro => (
                <button
                  key={macro.id}
                  type='button'
                  className='automationContextMenuItem automationContextMacroItem dropdown-item'
                  disabled={!automationContextAction || !selectedList.length}
                  title={macro.name}
                  onPointerDown={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!automationContextAction || !selectedList.length) return;
                    assignMacroToAction(automationContextMenu.appId, automationContextMenu.actionId, macro, selectedList);
                    setAutomationContextMenu(null);
                  }}
                >
                  <Save size={14} />
                  <span>{macro.name}</span>
                </button>
              ))}
              {!savedMacros.length ? (
                <button type='button' className='automationContextMenuItem dropdown-item' disabled>
                  <span>Chưa có file Macro</span>
                </button>
              ) : null}
              <div className='automationContextMenuDivider' />
              <button
                type='button'
                className='automationContextMenuItem automationContextMenuDanger dropdown-item'
                disabled={!automationContextAction}
                onPointerDown={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!automationContextAction) return;
                  deleteAppAction(automationContextMenu.appId, automationContextMenu.actionId);
                  setAutomationContextMenu(null);
                }}
              >
                <X size={14} />
                <span>Xoá Thao Tác</span>
              </button>
            </>
          ) : null}

          {automationContextMenu.type === 'device' ? (
            <>
              <div className='automationContextMenuLabel'>Tải tọa độ</div>
              {savedMacros.map(macro => (
                <button
                  key={macro.id}
                  type='button'
                  className='automationContextMenuItem automationContextMacroItem dropdown-item'
                  title={macro.name}
                  onPointerDown={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    loadMacroForDevices(macro, automationContextDeviceTargets);
                    setAutomationContextMenu(null);
                  }}
                >
                  <FolderOpen size={14} />
                  <span>{macro.name}</span>
                </button>
              ))}
              {!savedMacros.length ? (
                <button type='button' className='automationContextMenuItem dropdown-item' disabled>
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
  return (
    <span className='automationTitleIcon' aria-hidden='true'>
      <Video size={17} strokeWidth={2} />
    </span>
  );
}
