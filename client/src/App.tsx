import React, { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react'
import { createPortal } from 'react-dom'
import { DeviceAccountOverlay } from '@/components/DeviceAccountOverlay'
import { saveHotkeySettingToBackend } from '@/lib/backendSettings'
import { loadDeviceAccountVault, getDeviceAccountDataFromVault, type VaultData, type PlatformType, type WeChatAccount } from '@/lib/deviceAccountVault'
import { hasNearbyRelevantAccount, getNearestNearbyHours } from '@/lib/deviceAccountNearby'
import { readPageParams } from '@/lib/params'
import { useServer } from '@/context/ServerContext'
import { Tile } from '@/components/Tile'
import { STREAM_CONFIG, type StreamConfig } from '@/lib/config'
import { useI18n } from '@/context/I18nContext'
import { useDirectKeyboard } from '@/hooks/useDirectKeyboard'
import { DeviceViewer } from '@/components/DeviceViewer'
import { DeviceSelectionGrid, type DeviceSelectionGridItem } from '@/components/DeviceSelectionGrid'
import { AutomationModal, type AutomationDeviceOption, type AutomationModalRef } from '@/components/AutomationModal'
import { AutomationPanel } from '@/components/AutomationPanel'
import { VisualAlertPanel } from '@/components/VisualAlertPanel'
import { ThemeInspector } from '@/components/ThemeInspector'
import { applyThemeOverrides, loadThemeOverrides, clearThemeOverrides } from '@/lib/themeInspector'
import { useActive } from '@/context/ActiveContext'
import { AndroidKeycode } from '@/lib/keyEvent'
import { encodeKeycodeMessage, KeyEventAction } from '@/lib/control'
import {
  installApk,
  installUploadedApk,
  runAdbCommandApi,
  setDeviceWallpaper,
  setDeviceDisplayPower
} from '@/lib/serverApi'
import { SyncPanel } from '@/components/SyncPanel'
import { SyncTimeSettingsModal } from '@/components/SyncTimeSettingsModal'
import {
  loadSyncTimeSettings,
  saveSyncTimeSettings,
  syncTimeDelayRangeMs,
  type SyncTimeSettings,
  SYNC_TIME_SETTINGS_EVENT,
  matchesHotkey,
} from '@/lib/syncTimeSettings'
import { useTileOrder } from '@/store/useTileOrder'
import type { StreamReloadOptions } from '@/components/tile/types'
import {
  loadDeviceProfiles,
  saveDeviceProfiles,
  loadAppActions,
  saveAppActions,
  loadSavedMacros,
  MACRO_RUNNING_UDIDS_EVENT,
  MACRO_PLAYBACK_PROGRESS_EVENT,
  MACRO_PLAYBACK_STOP_EVENT,
  MACRO_PLAYBACK_REPLAY_EVENT,
  type MacroPlaybackProgressDetail,
  type MacroPlaybackStopDetail,
  loadSeedingContents,
  saveSeedingContents,
  AUTOMATION_APPS,
  type AutomationAppId,
  type AutomationDeviceProfile,
  type SavedAutomationMacro,
  type AutomationAppAction,
} from '@/lib/automationData'
import {
  Bot,
  Camera,
  ChevronDown,
  ChevronUp,
  Clock3,
  MonitorOff,
  Pin,
  PinOff,
  Package,
  RotateCcw,
  Settings,
  Terminal,
  Upload,
  Volume2,
  VolumeX,
  X,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Users,
  Save,
  FolderOpen
} from 'lucide-react'

type TileDims = { width: number; height: number }

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.floor(n)))
}

const BITRATE_MIN = 524_288
const BITRATE_MAX = 8_388_608
const BITRATE_WARN_THRESHOLD = Math.floor(BITRATE_MAX * 0.6) // ~60%
const TILE_WIDTH_MIN = 105
const TILE_WIDTH_MAX = 726
const VIEWER_WIDTH_MIN = 400
const VIEWER_WIDTH_MAX = 900
const STREAM_WIDTH_MIN = 100
const STREAM_WIDTH_MAX = 726
const VIEWER_STREAM_WIDTH = STREAM_WIDTH_MAX
const VIEWER_STREAM_WIDTH_MAX = 1200
const DEVICE_LIST_OFFLINE_GRACE_MS = 15_000

type ConnectRequestPayload = {
  device: string
  connect: 'usb' | 'wifi'
  port?: number
}
type RemoteDevice = { udid: string; type: 'usb' | 'wifi' | 'unknown' }

const CONNECT_CHECK_DEVICE_MESSAGE =
  'Please check that the device is properly plugged into the host'
const QUICK_ACTION_ORDER_KEY = 'quickActionOrder'
const SAVED_GROUPS_KEY = 'savedGroups'
const STREAM_CONFIG_KEY = 'streamConfig'
const VIEWER_STREAM_CONFIG_KEY = 'viewerStreamConfig'
const SAVED_GROUPS_BACKUP_KEY = 'savedGroupsBackupV1'
const SAVED_GROUPS_DELETED_ALL_KEY = 'savedGroupsDeletedAllV1'

type SavedDeviceGroup = { name: string; udids: string[] }

function uniqueStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    if (typeof value !== 'string') continue
    const id = value.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

function normalizeSavedGroups(value: unknown): SavedDeviceGroup[] {
  if (!Array.isArray(value)) return []
  const out: SavedDeviceGroup[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const name = typeof (item as any).name === 'string' ? (item as any).name.trim() : ''
    const udids = uniqueStrings((item as any).udids)
    if (!name || udids.length === 0) continue
    out.push({ name, udids })
  }
  return out
}

function parseSavedGroups(raw: string | null): SavedDeviceGroup[] {
  if (!raw) return []
  try {
    return normalizeSavedGroups(JSON.parse(raw))
  } catch {
    return []
  }
}

function loadSavedGroups(): SavedDeviceGroup[] {
  const current = parseSavedGroups(localStorage.getItem(SAVED_GROUPS_KEY))
  if (current.length > 0) return current

  if (localStorage.getItem(SAVED_GROUPS_DELETED_ALL_KEY) === '1') return []

  try {
    const backupRaw = localStorage.getItem(SAVED_GROUPS_BACKUP_KEY)
    if (!backupRaw) return []
    const parsed = JSON.parse(backupRaw)
    return normalizeSavedGroups(parsed?.groups ?? parsed)
  } catch {
    return []
  }
}

function backupSavedGroups(groups: SavedDeviceGroup[]) {
  try {
    if (groups.length === 0) return
    localStorage.removeItem(SAVED_GROUPS_DELETED_ALL_KEY)
    localStorage.setItem(
      SAVED_GROUPS_BACKUP_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        groups,
      })
    )
  } catch {
    // ignore
  }
}

function wsActionUrl(wsServer: string, action: string): string {
  const url = new URL(wsServer)
  url.searchParams.set('action', action)
  return url.toString()
}

function httpApiUrl(wsServer: string, path: string): string {
  const url = new URL(wsServer)
  url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:'
  url.pathname = path
  url.search = ''
  url.hash = ''
  return url.toString()
}

// type_QuickActionId : Định nghĩa các id phím tắt nhanh
type QuickActionId =
  | 'physicalScreenToggle'
  | 'screenOff'
  | 'mute'
  | 'soundOn'
  | 'maxVolume'
  | 'syncTime'
  | 'automation'

// DEFAULT_QUICK_ACTION_ORDER : Thứ tự mặc định các phím tắt nhanh
const DEFAULT_QUICK_ACTION_ORDER: QuickActionId[] = [
  'physicalScreenToggle',
  'screenOff',
  'mute',
  'soundOn',
  'maxVolume',
  'syncTime',
  'automation'
]

function loadQuickActionOrder(): QuickActionId[] {
  try {
    const raw = localStorage.getItem(QUICK_ACTION_ORDER_KEY)
    if (!raw) return DEFAULT_QUICK_ACTION_ORDER
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULT_QUICK_ACTION_ORDER
    
    // Bỏ các ID cũ
    const oldIds = new Set(['physicalScreenOff', 'physicalScreenOn', 'stayAwakeOn'])
    const filtered = parsed.filter(id => !oldIds.has(id))
    
    const hadOld = parsed.some(id => oldIds.has(id))
    if (hadOld && !filtered.includes('physicalScreenToggle')) {
      filtered.push('physicalScreenToggle')
    }

    const allowed = new Set(DEFAULT_QUICK_ACTION_ORDER)
    const out = filtered.filter((id): id is QuickActionId => allowed.has(id))
    for (const id of DEFAULT_QUICK_ACTION_ORDER) {
      if (!out.includes(id)) out.push(id)
    }
    return out
  } catch {
    return DEFAULT_QUICK_ACTION_ORDER
  }
}

function sameStreamConfig(a: StreamConfig, b: StreamConfig): boolean {
  return (
    a.bitrate === b.bitrate &&
    a.maxFps === b.maxFps &&
    a.iFrameInterval === b.iFrameInterval &&
    a.bounds.width === b.bounds.width &&
    a.bounds.height === b.bounds.height &&
    a.sendFrameMeta === b.sendFrameMeta &&
    a.displayId === b.displayId
  )
}

function loadBoolKey(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return fallback;
  } catch {
    return fallback;
  }
}

type ConfirmState = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
} | null;

export function App() {
  const [deviceAccountOverlayOpen, setDeviceAccountOverlayOpen] = useState(false)
  const [deviceAccountOverlayMounted, setDeviceAccountOverlayMounted] = useState(false)
  const [vault, setVault] = useState<VaultData>(() => loadDeviceAccountVault())
  const [davSearch, setDavSearch] = useState('')
  const [davActiveFilter, setDavActiveFilter] = useState('default')
  const [davActiveTab, setDavActiveTab] = useState<PlatformType>('wechat')

  // Nearby filter mode (stored in localStorage)
  type DavNearbyFilterMode = 'priority_sort' | 'hide_unmatched';
  const DAV_NEARBY_FILTER_MODE_KEY = 'monviewphone:dav-nearby-filter-mode';
  const [davNearbyFilterMode, setDavNearbyFilterMode] = useState<DavNearbyFilterMode>(() => {
    try {
      const raw = localStorage.getItem(DAV_NEARBY_FILTER_MODE_KEY);
      return raw === 'priority_sort' ? 'priority_sort' : 'hide_unmatched';
    } catch {
      return 'hide_unmatched';
    }
  });

  useEffect(() => {
    if (deviceAccountOverlayOpen) {
      setDeviceAccountOverlayMounted(true)
    }
  }, [deviceAccountOverlayOpen])

  useEffect(() => {
    const handleAccountUpdate = () => {
      setVault(loadDeviceAccountVault())
    }
    window.addEventListener('device-account-updated', handleAccountUpdate)
    return () => window.removeEventListener('device-account-updated', handleAccountUpdate)
  }, [])

  // Lắng nghe thay đổi setting nearby filter mode
  useEffect(() => {
    const handler = (e: Event) => {
      const mode = (e as CustomEvent<DavNearbyFilterMode>).detail;
      if (mode === 'priority_sort' || mode === 'hide_unmatched') {
        setDavNearbyFilterMode(mode);
      }
    };
    window.addEventListener('monviewphone:dav-nearby-filter-mode-changed', handler);
    return () => window.removeEventListener('monviewphone:dav-nearby-filter-mode-changed', handler);
  }, []);

  const [themeInspectorEnabled, setThemeInspectorEnabled] = useState(false);

  useEffect(() => {
    applyThemeOverrides(loadThemeOverrides());
  }, []);

  useEffect(() => {
    (window as any).__disableDirectKeyboard = themeInspectorEnabled;
    return () => {
      (window as any).__disableDirectKeyboard = false;
    };
  }, [themeInspectorEnabled]);

  useEffect(() => {
    const handleThemeInspectorHotkey = (e: KeyboardEvent) => {
      const active = document.activeElement?.nodeName.toLowerCase();
      if (
        ['input', 'textarea', 'select'].includes(active || '') ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        e.stopPropagation();
        setThemeInspectorEnabled(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleThemeInspectorHotkey, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleThemeInspectorHotkey, { capture: true });
    };
  }, []);
  useDirectKeyboard(true)
  const { t } = useI18n()
  const { deviceParam, wsServer } = useMemo(() => readPageParams(), [])
  const { androidDevices, androidDeviceMap, pushFile } = useServer()
  const {
    sendKeyTap,
    screenshotActiveCanvas,
    registeredUdids,
    activeUdid,
    selectOnly,
    getTargetsByUdids,
    syncTargets,
    setSyncTargetsList,
    selectedGridUdid,
    clickDevice,
    syncAll,
    syncMain,
  } = useActive()

  const [streamConfig, setStreamConfig] = useState<StreamConfig>(() => {
    try {
      const saved = localStorage.getItem(STREAM_CONFIG_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Validate parsed config has required fields, fallback to default if not
        if (
          typeof parsed.bitrate === 'number' &&
          typeof parsed.maxFps === 'number' &&
          typeof parsed.bounds?.width === 'number' &&
          typeof parsed.bounds?.height === 'number'
        ) {
          return {
            ...STREAM_CONFIG,
            ...parsed,
            bounds: { ...STREAM_CONFIG.bounds, ...parsed.bounds }
          }
        }
      }
    } catch { }
    return STREAM_CONFIG
  })
  const reloadMap = useRef<Map<string, (opts?: StreamReloadOptions) => void>>(new Map())

  const [viewerStreamConfig, setViewerStreamConfig] = useState<StreamConfig>(() => {
    try {
      const saved = localStorage.getItem(VIEWER_STREAM_CONFIG_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          ...STREAM_CONFIG,
          ...parsed,
          bounds: { ...STREAM_CONFIG.bounds, ...parsed.bounds }
        }
      }
    } catch {}

    const width = 1000
    const baseAspect =
      STREAM_CONFIG.bounds.width && STREAM_CONFIG.bounds.height
        ? STREAM_CONFIG.bounds.height / STREAM_CONFIG.bounds.width
        : 16 / 9

    return {
      ...STREAM_CONFIG,
      bitrate: 8_388_608,
      maxFps: 60,
      bounds: {
        width,
        height: Math.round(width * baseAspect)
      }
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(VIEWER_STREAM_CONFIG_KEY, JSON.stringify(viewerStreamConfig))
    } catch {}
  }, [viewerStreamConfig])

  // ===== VISUAL TILE ALERTS =====
  type VisualTileAlert = {
    udid: string;
    timestamp: number;
  };
  const [visualTileAlerts, setVisualTileAlerts] = useState<Record<string, VisualTileAlert>>({});

  useEffect(() => {
    const handleVisualAlert = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.udid) return;
      const now = Date.now();
      setVisualTileAlerts(prev => ({
        ...prev,
        [detail.udid]: {
          udid: detail.udid,
          timestamp: now,
        }
      }));
    };

    const handleVisualAlertCleared = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.udid) return;
      setVisualTileAlerts(prev => {
        const next = { ...prev };
        delete next[detail.udid];
        return next;
      });
    };

    window.addEventListener('visualAlertDetected', handleVisualAlert);
    window.addEventListener('visualAlertCleared', handleVisualAlertCleared);
    
    return () => {
      window.removeEventListener('visualAlertDetected', handleVisualAlert);
      window.removeEventListener('visualAlertCleared', handleVisualAlertCleared);
    };
  }, []);

  const clearVisualAlert = useCallback((udid: string) => {
    setVisualTileAlerts(prev => {
      const next = { ...prev };
      delete next[udid];
      return next;
    });
  }, []);

  // ===== SYNC TIME SETTINGS STATE AND EVENT HANDLERS =====
  const [syncTimeModalOpen, setSyncTimeModalOpen] = useState(false);
  const [syncTimeSettings, setSyncTimeSettings] = useState<SyncTimeSettings>(loadSyncTimeSettings);
  const syncDelayRange = useMemo(() => syncTimeDelayRangeMs(syncTimeSettings.intervalSec), [syncTimeSettings.intervalSec]);

  const updateSyncTimeSettings = useCallback((patch: Partial<SyncTimeSettings>) => {
    setSyncTimeSettings(prev => saveSyncTimeSettings({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<SyncTimeSettings>;
      setSyncTimeSettings(customEvent.detail);
    };
    window.addEventListener(SYNC_TIME_SETTINGS_EVENT, handleUpdate);
    return () => window.removeEventListener(SYNC_TIME_SETTINGS_EVENT, handleUpdate);
  }, []);

  // ===== DEVICE ACCOUNT HOTKEY =====
  const [deviceAccountHotkey, setDeviceAccountHotkey] = useState(() => localStorage.getItem('monviewphone:device-account-hotkey') || 'Alt+C');

  const handleDeviceAccountHotkeyInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const lowerKey = e.key.toLowerCase();
    if (['control', 'alt', 'shift', 'meta'].includes(lowerKey)) {
      return;
    }

    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');

    let keyName = e.key;
    if (keyName === ' ') {
      keyName = 'Space';
    } else if (keyName.length === 1) {
      keyName = keyName.toUpperCase();
    } else {
      keyName = keyName.charAt(0).toUpperCase() + keyName.slice(1);
    }
    parts.push(keyName);

    const newHotkey = parts.join('+');
    setDeviceAccountHotkey(newHotkey);
    localStorage.setItem('monviewphone:device-account-hotkey', newHotkey);
    saveHotkeySettingToBackend('monviewphone:device-account-hotkey', newHotkey);
  }, []);

  // ===== SYNC TIME HOTKEY STATES & GLOBAL LISTENER =====
  const [syncTimeHotkey, setSyncTimeHotkey] = useState(() => localStorage.getItem('monviewphone:sync-time-hotkey') || '');
  const [hotkeySectionOpen, setHotkeySectionOpen] = useState(false);

  useEffect(() => {
    const handleGlobalHotkey = (e: KeyboardEvent) => {
      const active = document.activeElement?.nodeName.toLowerCase();
      if (
        ['input', 'textarea', 'select'].includes(active || '') ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const hotkeyStr = localStorage.getItem('monviewphone:sync-time-hotkey') || '';
      if (hotkeyStr && matchesHotkey(e, hotkeyStr)) {
        e.preventDefault();
        e.stopPropagation();
        setSyncTimeSettings(prev => saveSyncTimeSettings({ ...prev, delayEnabled: !prev.delayEnabled }));
      }
    };

    window.addEventListener('keydown', handleGlobalHotkey, { capture: true });
    return () => window.removeEventListener('keydown', handleGlobalHotkey, { capture: true });
  }, []);

  const handleHotkeyInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const lowerKey = e.key.toLowerCase();
    if (['control', 'alt', 'shift', 'meta'].includes(lowerKey)) {
      return;
    }

    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');

    let keyName = e.key;
    if (keyName === ' ') {
      keyName = 'Space';
    } else if (keyName.length === 1) {
      keyName = keyName.toUpperCase();
    } else {
      keyName = keyName.charAt(0).toUpperCase() + keyName.slice(1);
    }
    parts.push(keyName);

    const newHotkey = parts.join('+');
    setSyncTimeHotkey(newHotkey);
    localStorage.setItem('monviewphone:sync-time-hotkey', newHotkey);
    saveHotkeySettingToBackend('monviewphone:sync-time-hotkey', newHotkey);
  }, []);

  // ===== GRID DISPLAY FILTER STATES =====
  const [displayFilter, setDisplayFilter] = useState<'online' | 'all'>(() => {
    return (localStorage.getItem('monviewphone:display-filter') as 'online' | 'all') || 'all';
  });
  const [displayFilterOpen, setDisplayFilterOpen] = useState(false);

  const updateDisplayFilter = useCallback((val: 'online' | 'all') => {
    setDisplayFilter(val);
    localStorage.setItem('monviewphone:display-filter', val);
  }, []);

  useEffect(() => {
    if (!displayFilterOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.rcpDeviceToolbar')) {
        setDisplayFilterOpen(false);
      }
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [displayFilterOpen]);

  const [viewerUdid, setViewerUdid] = useState<string | null>(null)

  const openDeviceViewerFromAccountOverlay = useCallback((udid: string) => {
    clickDevice(udid);
    selectOnly(udid);
    setViewerUdid(udid);
  }, [clickDevice, selectOnly]);
  const apkInputRef = useRef<HTMLInputElement | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [viewerOffset, setViewerOffset] = useState({ x: 0, y: 0 })
  const viewerDragRef = useRef({
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    active: false
  })
  const [viewerWidthPx, setViewerWidthPx] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('viewerWidthPx') || String(VIEWER_WIDTH_MAX))
      if (Number.isFinite(saved)) {
        return clamp(saved, VIEWER_WIDTH_MIN, VIEWER_WIDTH_MAX)
      }
    } catch { }
    return VIEWER_WIDTH_MAX
  })
  const lastViewedRef = useRef<string | null>(null)
  const [draggingTile, setDraggingTile] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [contextMenuTarget, setContextMenuTarget] = useState<{
    x: number
    y: number
    udid: string
    groupIdx?: number       // có nghĩa: click từ dropdown nhóm (dùng để xoá khỏi nhóm cụ thể)
    sourceGrid?: 'main' | 'group' // 'main' = grid tổng tile lớn, 'group' = grid nhỏ trong nhóm
  } | null>(null)
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [subMenuOpen, setSubMenuOpen] = useState(false)
  const [pageContextMenu, setPageContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [contextMenuInput, setContextMenuInput] = useState('')
  const [globalAdbOpen, setGlobalAdbOpen] = useState(false)
  const [automationOpen, setAutomationOpen] = useState(false)
  const [globalAdbCommand, setGlobalAdbCommand] = useState('')
  const [globalAdbRunning, setGlobalAdbRunning] = useState(false)
  const [globalAdbStatus, setGlobalAdbStatus] = useState<string | null>(null)
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'usb' | 'wifi'>(
    'all'
  )
  const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
    try {
      return localStorage.getItem('isSidebarPinned') === 'true'
    } catch {
      return false
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem('isSidebarPinned', String(isSidebarPinned))
    } catch { }
  }, [isSidebarPinned])

  // Persist streamConfig to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STREAM_CONFIG_KEY, JSON.stringify(streamConfig))
    } catch { }
  }, [streamConfig])
  const [showTileInfo, setShowTileInfo] = useState(() => {
    try {
      return localStorage.getItem('showTileInfo') === 'true'
    } catch {
      return false
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem('showTileInfo', String(showTileInfo))
    } catch { }
  }, [showTileInfo])
  const [remoteDevices, setRemoteDevices] = useState<RemoteDevice[]>([])
  const remoteDeviceLastSeenRef = useRef<Map<string, number>>(new Map())
  const wsDevicesRef = useRef<WebSocket | null>(null)
  const [connectSelection, setConnectSelection] = useState<Set<string>>(
    () => new Set(syncTargets)
  )
  const [runningMacroUdids, setRunningMacroUdids] = useState<Set<string>>(new Set())
  const [macroPlaybackItems, setMacroPlaybackItems] = useState<MacroPlaybackProgressDetail[]>([])
  const [macroPlaybackExpanded, setMacroPlaybackExpanded] = useState(true)
  const [macroPlaybackNow, setMacroPlaybackNow] = useState(Date.now())
  const [macroPlaybackPosition, setMacroPlaybackPosition] = useState<{ x: number; y: number } | null>(null)
  const macroPlaybackDragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 })

  useEffect(() => {
    const handleMacroRunning = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>
      const running = new Set(customEvent.detail || [])
      setRunningMacroUdids(running)
      if (running.size) {
        setConnectSelection(prev => {
          const next = new Set(prev)
          running.forEach(udid => next.delete(udid))
          return next
        })
      }
    }
    window.addEventListener(MACRO_RUNNING_UDIDS_EVENT, handleMacroRunning)
    return () => window.removeEventListener(MACRO_RUNNING_UDIDS_EVENT, handleMacroRunning)
  }, [])

  useEffect(() => {
    const handleProgress = (e: Event) => {
      const detail = (e as CustomEvent<MacroPlaybackProgressDetail>).detail
      if (!detail?.id) return
      setMacroPlaybackItems(prev => {
        if (!detail.running) {
          // Macro xong: giữ item, đánh dấu finished
          return prev.map(item => item.id === detail.id ? { ...detail, running: false } : item)
        }
        const next = prev.filter(item => item.id !== detail.id)
        return [...next, detail]
      })
      setMacroPlaybackNow(Date.now())
    }
    window.addEventListener(MACRO_PLAYBACK_PROGRESS_EVENT, handleProgress)
    return () => window.removeEventListener(MACRO_PLAYBACK_PROGRESS_EVENT, handleProgress)
  }, [])

  useEffect(() => {
    if (!macroPlaybackItems.length) return
    const id = window.setInterval(() => setMacroPlaybackNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [macroPlaybackItems.length])

  const onMacroPlaybackPointerMove = useCallback((event: PointerEvent) => {
    if (!macroPlaybackDragRef.current.active) return
    event.preventDefault()
    const nextX = macroPlaybackDragRef.current.originX + event.clientX - macroPlaybackDragRef.current.startX
    const nextY = macroPlaybackDragRef.current.originY + event.clientY - macroPlaybackDragRef.current.startY
    setMacroPlaybackPosition({
      x: Math.max(8, Math.min(window.innerWidth - 180, nextX)),
      y: Math.max(8, Math.min(window.innerHeight - 48, nextY)),
    })
  }, [])

  const onMacroPlaybackPointerUp = useCallback(() => {
    if (!macroPlaybackDragRef.current.active) return
    macroPlaybackDragRef.current.active = false
    window.removeEventListener('pointermove', onMacroPlaybackPointerMove)
    window.removeEventListener('pointerup', onMacroPlaybackPointerUp)
  }, [onMacroPlaybackPointerMove])

  const startMacroPlaybackDrag = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return
    if ((event.target as HTMLElement).closest('button')) return
    const panel = event.currentTarget.closest('.macroPlaybackPanel') as HTMLElement | null
    if (!panel) return
    const rect = panel.getBoundingClientRect()
    macroPlaybackDragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
    }
    setMacroPlaybackPosition({ x: rect.left, y: rect.top })
    window.addEventListener('pointermove', onMacroPlaybackPointerMove, { passive: false })
    window.addEventListener('pointerup', onMacroPlaybackPointerUp)
  }, [onMacroPlaybackPointerMove, onMacroPlaybackPointerUp])

  type CtxSubState = null | {
    main: 'profileList' | { appId: AutomationAppId; actionId: string };
    nested?: { type: 'profileActions'; profileId: string; appId?: AutomationAppId; actionId?: string } | 'macroList';
  };

  type InputState = {
    key: string;
    title: string;
    label?: string;
    placeholder?: string;
    defaultValue?: string;
    onConfirm: (val: string) => void;
  } | null;

  const [ctxSub, setCtxSub] = useState<CtxSubState>(null);
  const [inputState, setInputState] = useState<InputState>(null);
  const [deviceProfiles, setDeviceProfiles] = useState<AutomationDeviceProfile[]>([]);
  const [savedMacros, setSavedMacros] = useState<SavedAutomationMacro[]>([]);
  const automationModalRef = useRef<AutomationModalRef>(null);
  const [appActions, setAppActions] = useState<Record<AutomationAppId, AutomationAppAction[]>>({ wechat: [], line: [], tantan: [], setting: [] });

  const [seedingSectionOpen, setSeedingSectionOpen] = useState(false);
  const [seedingContents, setSeedingContents] = useState(loadSeedingContents);

  const handleSeedingContentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setSeedingContents(val);
    saveSeedingContents(val);
  };

  const seedingLineCount = useMemo(() => {
    if (!seedingContents) return 0;
    return seedingContents.split(/[,\s]+/).filter(word => word.trim()).length;
  }, [seedingContents]);

  useEffect(() => {
    if (contextMenuTarget) {
      setDeviceProfiles(loadDeviceProfiles());
      setSavedMacros(loadSavedMacros());
      setAppActions(loadAppActions());
      setCtxSub(null);
    }
  }, [contextMenuTarget]);

  // /* createProfileForDevices : Tạo Device Profile mới */
  const createProfileForDevices = useCallback((name: string, targetUdids: string[]) => {
    const newProfile: AutomationDeviceProfile = {
      id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      udids: [...targetUdids],
      updatedAt: Date.now()
    };
    setDeviceProfiles(prev => {
      const cleaned = prev.map(p => ({ ...p, udids: p.udids.filter(u => !targetUdids.includes(u)) }));
      const next = [...cleaned, newProfile];
      saveDeviceProfiles(next);
      return next;
    });
  }, []);

  // /* assignDevicesToProfile : Gán các thiết bị vào profile */
  const assignDevicesToProfile = useCallback((profileId: string, targetUdids: string[]) => {
    setDeviceProfiles(prev => {
      const next = prev.map(p => ({
        ...p,
        udids: p.id === profileId
          ? [...new Set([...p.udids, ...targetUdids])]
          : p.udids.filter(u => !targetUdids.includes(u)),
        updatedAt: p.id === profileId ? Date.now() : p.updatedAt,
      }));
      saveDeviceProfiles(next);
      return next;
    });
  }, []);

  // /* renameProfile : Đổi tên profile */
  const renameProfile = useCallback((profileId: string, newName: string) => {
    setDeviceProfiles(prev => {
      const next = prev.map(p => p.id === profileId ? { ...p, name: newName, updatedAt: Date.now() } : p);
      saveDeviceProfiles(next);
      return next;
    });
    setAppActions(prev => {
      const next = { ...prev };
      for (const appId of Object.keys(next) as AutomationAppId[]) {
        next[appId] = next[appId].map(action => ({
          ...action,
          bindings: action.bindings.map(b => b.profileId === profileId ? { ...b, profileName: newName } : b),
        }));
      }
      saveAppActions(next);
      return next;
    });
  }, []);

  // /* deleteProfileImpl : Xoá profile */
  const deleteProfileImpl = useCallback((profileId: string) => {
    setDeviceProfiles(prev => {
      const next = prev.filter(p => p.id !== profileId);
      saveDeviceProfiles(next);
      return next;
    });
    setAppActions(prev => {
      const next = { ...prev };
      for (const appId of Object.keys(next) as AutomationAppId[]) {
        next[appId] = next[appId].map(action => ({
          ...action,
          bindings: action.bindings.filter(b => b.profileId !== profileId),
        }));
      }
      saveAppActions(next);
      return next;
    });
  }, []);

  // /* assignMacroToAction : Gán macro vào hành động của profile */
  const assignMacroToAction = useCallback((
    appId: AutomationAppId, actionId: string, macro: SavedAutomationMacro, profile: AutomationDeviceProfile,
  ) => {
    setAppActions(prev => {
      const nextActions = prev[appId].map(action => {
        if (action.id !== actionId) return action;
        const bindings = (action.bindings ?? []).filter(b => b.profileId !== profile.id);
        bindings.push({
          id: `binding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          macroId: macro.id,
          macroName: macro.name,
          profileId: profile.id,
          profileName: profile.name,
          updatedAt: Date.now(),
        });
        return { ...action, bindings };
      });
      const next = { ...prev, [appId]: nextActions };
      saveAppActions(next);
      return next;
    });
  }, []);

  // /* removeBindingImpl : Gỡ bỏ gán macro khỏi hành động */
  const removeBindingImpl = useCallback((appId: AutomationAppId, actionId: string, profileId: string) => {
    setAppActions(prev => {
      const nextActions = prev[appId].map(action => {
        if (action.id !== actionId) return action;
        return { ...action, bindings: (action.bindings ?? []).filter(b => b.profileId !== profileId) };
      });
      const next = { ...prev, [appId]: nextActions };
      saveAppActions(next);
      return next;
    });
  }, []);

  const selectionBadgeRef = useRef<HTMLDivElement | null>(null);

  const [allKnownDevices, setAllKnownDevices] = useState<Array<{ udid: string; name?: string }>>(() => {
    try {
      const saved = localStorage.getItem('allKnownDevices')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  useEffect(() => {
    try {
      localStorage.setItem('allKnownDevices', JSON.stringify(allKnownDevices))
    } catch { }
  }, [allKnownDevices])

  // Rubber band selection state
  const [rubberBand, setRubberBand] = useState<{
    startX: number; startY: number; currentX: number; currentY: number
  } | null>(null)
  const rubberBandRef = useRef<{
    startX: number; startY: number; active: boolean
  }>({ startX: 0, startY: 0, active: false })
  const gridScrollRef = useRef<HTMLDivElement | null>(null)
  const rubberBandJustFinishedRef = useRef(false)

  const [appSettingsVisible, setAppSettingsVisible] = useState(false)
  const [streamControlsOpen, setStreamControlsOpen] = useState(() =>
    loadBoolKey('rightPanel.streamControlsOpen', true)
  )
  const [quickControlsOpen, setQuickControlsOpen] = useState(() =>
    loadBoolKey('rightPanel.quickControlsOpen', true)
  )
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)

  useEffect(() => {
    try {
      localStorage.setItem('rightPanel.streamControlsOpen', String(streamControlsOpen));
    } catch {}
  }, [streamControlsOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('rightPanel.quickControlsOpen', String(quickControlsOpen));
    } catch {}
  }, [quickControlsOpen]);

  useEffect(() => {
    try {
      localStorage.removeItem('panelAlign')
    } catch { }
    document.body.classList.remove('alignRight')
  }, [])


  // Đẩy connectSelection vào syncTargets để kích hoạt Smart Sync (khi thao tác 1 máy, cả group ăn theo)
  useEffect(() => {
    setSyncTargetsList(Array.from(connectSelection))
  }, [connectSelection, setSyncTargetsList])

  // Reset activeGroupIdx khi không còn device nào được chọn
  useEffect(() => {
    if (connectSelection.size === 0) {
      setActiveGroupIdx(null)
    }
  }, [connectSelection])

  // Handle click outside to close context menu and sync sidebar state
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 1. Ignore if right-click
      if (event.button === 2) return;

      // 2. Check if click was on a context menu element
      const target = event.target as Element;
      const isClickOnContextMenu = target.closest('.react-contexify') || target.closest('.context-menu') || target.closest('.pageContextLayer');

      // 3. If clicking outside context menu, ensure it closes
      if (!isClickOnContextMenu && contextMenuOpen) {
        setContextMenuOpen(false);
        setContextMenuTarget(null);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenuOpen]);

  // Track vị trí chuột cho tooltip (dùng RAF + style transform trực tiếp để tránh rerender)
  useEffect(() => {
    let raf = 0;
    let lastX = 0;
    let lastY = 0;

    const apply = () => {
      raf = 0;
      const el = selectionBadgeRef.current;
      if (!el) return;

      el.style.transform = `translate3d(${lastX + 14}px, ${lastY + 14}px, 0)`;
    };

    const onPointerMove = (e: PointerEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;

      if (!raf) {
        raf = window.requestAnimationFrame(apply);
      }
    };

    window.addEventListener('pointermove', onPointerMove, true);

    return () => {
      window.removeEventListener('pointermove', onPointerMove, true);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const [connectModalOpen, setConnectModalOpen] = useState(false)

  // ===== SAVED GROUPS =====
  const [savedGroups, setSavedGroups] = useState<SavedDeviceGroup[]>(loadSavedGroups)

  useEffect(() => {
    try {
      const normalized = normalizeSavedGroups(savedGroups)
      localStorage.setItem(SAVED_GROUPS_KEY, JSON.stringify(normalized))
      backupSavedGroups(normalized)
    } catch { }
  }, [savedGroups])

  useEffect(() => {
    const handleUpdate = () => {
      setSavedGroups(loadSavedGroups());
    };
    window.addEventListener('saved-groups-updated', handleUpdate);
    return () => window.removeEventListener('saved-groups-updated', handleUpdate);
  }, []);

  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [groupModalName, setGroupModalName] = useState('')

  // Track nhóm đang được load (để biết xoá device khỏi nhóm nào)
  const [activeGroupIdx, setActiveGroupIdx] = useState<number | null>(null)

  // State dropdown expand từng nhóm
  const [expandedGroupIdx, setExpandedGroupIdx] = useState<number | null>(null)

  // Modal xác nhận xoá nhóm
  const [deleteGroupConfirm, setDeleteGroupConfirm] = useState<number | null>(null)

  // State lọc hiển thị theo nhóm (double click nhóm)
  const [focusGroupIdx, setFocusGroupIdx] = useState<number | null>(null)

  // State đổi tên nhóm
  const [renameGroupIdx, setRenameGroupIdx] = useState<number | null>(null)
  const [renameGroupValue, setRenameGroupValue] = useState('')

  // State drag thứ tự nhóm
  const [dragGroupIdx, setDragGroupIdx] = useState<number | null>(null)
  const [dragGroupOverIdx, setDragGroupOverIdx] = useState<number | null>(null)

  // Context menu nhóm (right-click)
  const [groupContextMenu, setGroupContextMenu] = useState<{ x: number; y: number; idx: number } | null>(null)

  const [connectPorts, setConnectPorts] = useState<Record<string, number>>({})
  const [connectBusy, setConnectBusy] = useState(false)
  const targetConnect = deviceFilter === 'wifi' ? 'usb' : 'wifi'
  const connectBtnLabel =
    deviceFilter === 'wifi' ? t('Connect USB') : t('Connect IP')
  const [connectNotification, setConnectNotification] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [modalPostLoading, setModalPostLoading] = useState(false)
  const modalPostTimerRef = useRef<number | null>(null)

  const formatConnectNotification = useCallback(
    (
      results: Array<{ success?: boolean; error?: string }>,
      connectType: 'usb' | 'wifi',
      attemptCount: number
    ) => {
      const typeLabel = connectType === 'usb' ? 'USB' : 'Wi-Fi'
      const failureHint = t(CONNECT_CHECK_DEVICE_MESSAGE)
      if (!results.length) {
        return {
          type: 'error' as const,
          text: failureHint
        }
      }
      const failed = results.filter(result => !result.success)
      if (!failed.length) {
        return {
          type: 'success' as const,
          text: t('Connected {count} device(s)', { count: results.length })
        }
      }
      const firstError = failed[0].error?.trim()
      return {
        type: 'error' as const,
        text: firstError
          ? `${t('Connect failed for {count} {type} device(s): {error}', {
            count: failed.length,
            type: typeLabel,
            error: firstError
          })} ${failureHint}`
          : `${t('Connect failed for {count} {type} device(s)', {
            count: failed.length,
            type: typeLabel
          })} ${failureHint}`
      }
    },
    [t]
  )

  const runConnectRequest = useCallback(
    async (payload: any[], connectType: 'usb' | 'wifi') => {
      if (!payload.length) return
      setConnectBusy(true)
      setConnectNotification(null)
      try {
        const response = await fetch(httpApiUrl(wsServer, '/api/devices/connect'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const body = await response.json().catch(() => null)
        if (!response.ok && !body?.results) {
          throw new Error(body?.error ?? t('Connect failed'))
        }
        const results =
          Array.isArray(body?.results) && body.results.length ? body.results : []
        setConnectNotification(
          formatConnectNotification(results, connectType, payload.length)
        )
      } catch (err: any) {
        setConnectNotification({
          type: 'error',
          text: `${t('Connect failed: {error}', {
            error: err?.message ?? t('Connect failed')
          })} ${t(CONNECT_CHECK_DEVICE_MESSAGE)}`
        })
      } finally {
        setConnectBusy(false)
      }
    },
    [formatConnectNotification, t, wsServer]
  )
  const closeConnectModal = useCallback(() => {
    setConnectModalOpen(false)
    setModalPostLoading(true)
    if (modalPostTimerRef.current) {
      window.clearTimeout(modalPostTimerRef.current)
    }
    modalPostTimerRef.current = window.setTimeout(() => {
      setModalPostLoading(false)
      modalPostTimerRef.current = null
    }, 1300)
  }, [])

  useEffect(() => {
    return () => {
      if (modalPostTimerRef.current) {
        window.clearTimeout(modalPostTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const cls = 'sidebarPinned'
    document.body.classList.toggle(cls, isSidebarPinned)
    const root = document.documentElement
    root.style.setProperty('--config-width', '320px')
    root.style.setProperty(
      '--sidebar-total',
      isSidebarPinned ? 'var(--config-width)' : '0px'
    )
    return () => {
      document.body.classList.remove(cls)
    }
  }, [isSidebarPinned])

  const registerReload = useCallback((udid: string, fn: (opts?: StreamReloadOptions) => void) => {
    reloadMap.current.set(udid, fn)
  }, [])

  const unregisterReload = useCallback((udid: string) => {
    reloadMap.current.delete(udid)
  }, [])
  const PHONE_SHELL_RATIO = 20 / 9;
  const DEFAULT_DIMS: TileDims = { width: 350, height: Math.round(350 * PHONE_SHELL_RATIO) }

  // Persisted tile size
  const [tileDims, setTileDims] = useState<TileDims>(() => {
    try {
      const saved = localStorage.getItem('deviceDimensions')
      if (!saved) return DEFAULT_DIMS
      const p = JSON.parse(saved)
      const w = clamp(Number(p?.width), TILE_WIDTH_MIN, TILE_WIDTH_MAX)
      const h = Math.round(w * PHONE_SHELL_RATIO)
      return { width: w, height: h }
    } catch {
      return DEFAULT_DIMS
    }
  })

  // Reset horizontal scroll when viewer is opened/closed, tile size changes, or filters change
  useEffect(() => {
    const el = gridScrollRef.current
    if (el) {
      el.scrollLeft = 0
    }
  }, [viewerUdid, tileDims.width, deviceFilter, focusGroupIdx])

  const tileAspectRef = useRef<number>(PHONE_SHELL_RATIO)

  const dimsRef = useRef<TileDims>(tileDims)
  useEffect(() => {
    dimsRef.current = tileDims
  }, [tileDims])

  const gridRef = useRef<HTMLDivElement | null>(null)
  const applyDimsToGrid = (d: TileDims) => {
    const el = gridRef.current
    if (!el) return
    el.style.setProperty('--tile-width', `${d.width}px`)
  }

  useEffect(() => {
    applyDimsToGrid(tileDims)
  }, [tileDims])

  const saveTimer = useRef<number | null>(null)
  const scheduleSave = (d: TileDims) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      localStorage.setItem('deviceDimensions', JSON.stringify(d))
    }, 200)
  }
  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [])

  const updateWidth = (w: number) => {
    const width = clamp(w, TILE_WIDTH_MIN, TILE_WIDTH_MAX)
    const height = Math.round(width * PHONE_SHELL_RATIO)
    const next = { width, height }

    dimsRef.current = next
    applyDimsToGrid(next)
    scheduleSave(next)

    startTransition(() => {
      setTileDims(next)
    })
  }
  const updateViewerWidthPx = (w: number) => {
    const next = clamp(w, VIEWER_WIDTH_MIN, VIEWER_WIDTH_MAX)
    setViewerWidthPx(next)
    try {
      localStorage.setItem('viewerWidthPx', String(next))
    } catch { }
  }

  const discoveredDevices = useMemo(
    () => {
      if (remoteDevices.length) return remoteDevices.map(d => d.udid)
      if (androidDevices.length) return androidDevices.map(d => d.udid)
      return []
    },
    [androidDevices, remoteDevices]
  )
  useEffect(() => {
    let active = true
    let timeoutId: number | null = null

    const connect = () => {
      try {
        const ws = new WebSocket(wsActionUrl(wsServer, 'devices-list'))
        wsDevicesRef.current = ws
        ws.onmessage = ev => {
          try {
            const payload = JSON.parse(ev.data as string)
            if (Array.isArray(payload)) {
              const dedup = new Map<string, RemoteDevice>()
              payload.forEach((d: any) => {
                const device = String(d?.device || '').trim()
                const key = String(d?.uuid || device).trim()
                if (!device || !key) return
                const ct = String(d?.connect_type || '').toLowerCase()
                let type: 'usb' | 'wifi' | 'unknown' = 'unknown'
                if (ct.includes('wifi')) type = 'wifi'
                else if (ct.includes('usb')) type = 'usb'
                else if (device.includes(':')) type = 'wifi'
                dedup.set(key, { udid: device, type })
              })
              const mapped = Array.from(dedup.values())
              const now = Date.now()
              const lastSeen = remoteDeviceLastSeenRef.current
              mapped.forEach(d => lastSeen.set(d.udid, now))
              startTransition(() => {
                setRemoteDevices(prev => {
                  const next = new Map<string, RemoteDevice>()
                  mapped.forEach(d => next.set(d.udid, d))
                  prev.forEach(d => {
                    if (next.has(d.udid)) return
                    const seenAt = lastSeen.get(d.udid) || 0
                    if (now - seenAt <= DEVICE_LIST_OFFLINE_GRACE_MS) {
                      next.set(d.udid, d)
                    }
                  })
                  Array.from(lastSeen.entries()).forEach(([udid, seenAt]) => {
                    if (now - seenAt > DEVICE_LIST_OFFLINE_GRACE_MS) {
                      lastSeen.delete(udid)
                    }
                  })
                  return Array.from(next.values())
                })
                setAllKnownDevices(prev => {
                  let changed = false
                  const next = [...prev]
                  mapped.forEach((d, i) => {
                    if (!next.find(item => item.udid === d.udid)) {
                      next.push({ udid: d.udid, name: `P${next.length + 1}` }) // ← Dùng số thứ tự
                      changed = true
                    }
                  })
                  return changed ? next : prev
                })
              })
            }
          } catch {
            // ignore parse errors
          }
        }
        ws.onclose = () => {
          wsDevicesRef.current = null
          if (active) {
            timeoutId = window.setTimeout(connect, 3000)
          }
        }
        ws.onerror = () => {
          ws.close()
        }
      } catch {
        if (active) {
          timeoutId = window.setTimeout(connect, 3000)
        }
      }
    }
    connect()
    return () => {
      active = false
      if (timeoutId) window.clearTimeout(timeoutId)
      wsDevicesRef.current?.close()
      wsDevicesRef.current = null
    }
  }, [wsServer])

  useEffect(() => {
    // Reset selection when switching filter to avoid cross-filter confusion
    setConnectSelection(new Set())
    setConnectBusy(false)
  }, [deviceFilter])
  const connectionTypeByUdid = useMemo(() => {
    const map = new Map<string, 'usb' | 'wifi' | 'unknown'>()
    remoteDevices.forEach(d => {
      if (d.udid) map.set(d.udid, d.type)
    })
    androidDevices.forEach(d => {
      const ifaceNames = d.interfaces?.map(i => i.name.toLowerCase()) || []
      const hasWifiIface = ifaceNames.some(
        n => n.includes('wlan') || n.includes('wifi') || n.includes('wl')
      )
      const hasUsbIface = ifaceNames.some(
        n => n.includes('usb') || n.includes('rndis')
      )
      let type: 'usb' | 'wifi' | 'unknown' = 'unknown'
      if (hasWifiIface) type = 'wifi'
      else if (hasUsbIface) type = 'usb'
      else if (d.udid.includes(':')) type = 'wifi'
      else type = 'usb'
      map.set(d.udid, type)
    })
    return map
  }, [androidDevices, remoteDevices])
  const getDeviceConnectionType = useCallback(
    (udid: string): 'usb' | 'wifi' | 'unknown' => {
      const known = connectionTypeByUdid.get(udid)
      if (known) return known
      if (udid.includes(':')) return 'wifi'
      return 'usb'
    },
    [connectionTypeByUdid]
  )

  const gridDevices = useMemo(() => {
    if (deviceParam) return [deviceParam]
    if (discoveredDevices.length) return discoveredDevices
    return []
  }, [deviceParam, discoveredDevices])

  // Danh sách tất cả UDID cần hiện trong grid (bao gồm cả thiết bị đã ngắt kết nối)
  const allGridUdids = useMemo(() => {
    if (deviceParam) return [deviceParam]
    // Gộp: thiết bị đang online + thiết bị đã từng kết nối (allKnownDevices)
    const onlineSet = new Set(gridDevices)
    const allUdids = [...gridDevices]
    allKnownDevices.forEach(d => {
      if (!onlineSet.has(d.udid)) allUdids.push(d.udid)
    })
    return allUdids
  }, [deviceParam, gridDevices, allKnownDevices])

  const connectedUdids = useMemo(() => new Set(gridDevices), [gridDevices])
  const filteredGridDevices = useMemo(() => {
    let list = gridDevices
    if (deviceFilter !== 'all') {
      list = list.filter(id => getDeviceConnectionType(id) === deviceFilter)
    }
    if (focusGroupIdx !== null && savedGroups[focusGroupIdx]) {
      const groupSet = new Set(savedGroups[focusGroupIdx].udids)
      list = list.filter(id => groupSet.has(id))
    }
    return list
  }, [deviceFilter, gridDevices, getDeviceConnectionType, focusGroupIdx, savedGroups])
  const { mergedOrder, moveTile, getTileNumber, setTileNumber } =
    useTileOrder(allGridUdids)
  const filteredRegistered = useMemo(() => {
    return registeredUdids.filter(id => {
      if (displayFilter === 'online' && !connectedUdids.has(id)) return false;

      if (deviceFilter !== 'all') {
        const type = getDeviceConnectionType(id)
        if (type !== deviceFilter) return false
      }
      if (focusGroupIdx !== null && savedGroups[focusGroupIdx]) {
        const groupSet = new Set(savedGroups[focusGroupIdx].udids)
        if (!groupSet.has(id)) return false
      }
      return true
    })
  }, [registeredUdids, connectedUdids, deviceFilter, getDeviceConnectionType, focusGroupIdx, savedGroups, displayFilter])
  const sidebarRegistered = useMemo(() => {
    return registeredUdids.filter(id => {
      if (displayFilter === 'online' && !connectedUdids.has(id)) return false
      if (deviceFilter !== 'all') {
        const type = getDeviceConnectionType(id)
        if (type !== deviceFilter) return false
      }
      return true
    })
  }, [registeredUdids, connectedUdids, deviceFilter, getDeviceConnectionType, displayFilter])
  const orderMap = useMemo(() => {
    const m = new Map<string, number>()
    mergedOrder.forEach((id, idx) => m.set(id, getTileNumber(id, idx + 1)))
    return m
  }, [mergedOrder, getTileNumber])
  const formatPlaybackElapsed = useCallback((startedAt: number) => {
    const elapsedSec = Math.max(0, Math.floor((macroPlaybackNow - startedAt) / 1000))
    return `${String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:${String(elapsedSec % 60).padStart(2, '0')}`
  }, [macroPlaybackNow])
  const orderedRegistered = useMemo(() => {
    const arr = [...filteredRegistered]

    // Nếu bộ lọc tài khoản là nearby_people và mode là priority_sort thì sort theo Nearby gần nhất
    if (
      deviceAccountOverlayOpen &&
      davActiveFilter === 'nearby_people' &&
      davActiveTab === 'wechat' &&
      davNearbyFilterMode === 'priority_sort'
    ) {
      const now = Date.now();

      const getHours = (udid: string) => {
        const accountData = getDeviceAccountDataFromVault(vault, udid);
        const accounts = accountData.platforms['wechat'] || [];
        return getNearestNearbyHours(accounts, now);
      };

      arr.sort((a, b) => {
        const ha = getHours(a);
        const hb = getHours(b);

        if (ha !== hb) {
          return ha - hb;
        }

        // Cùng giá trị thì sắp xếp theo số thứ tự máy
        const oa = orderMap.get(a) ?? Number.MAX_SAFE_INTEGER;
        const ob = orderMap.get(b) ?? Number.MAX_SAFE_INTEGER;
        return oa - ob;
      });

      return arr;
    }

    arr.sort((a, b) => {
      const oa = orderMap.get(a) ?? Number.MAX_SAFE_INTEGER
      const ob = orderMap.get(b) ?? Number.MAX_SAFE_INTEGER
      return oa - ob
    })
    return arr
  }, [filteredRegistered, orderMap, deviceAccountOverlayOpen, davActiveFilter, davActiveTab, davNearbyFilterMode, vault])
  const orderedSidebarRegistered = useMemo(() => {
    const arr = [...sidebarRegistered]
    arr.sort((a, b) => {
      const oa = orderMap.get(a) ?? Number.MAX_SAFE_INTEGER
      const ob = orderMap.get(b) ?? Number.MAX_SAFE_INTEGER
      return oa - ob
    })
    return arr
  }, [sidebarRegistered, orderMap])
  const currentFocusGroupSet = useMemo(() => {
    if (focusGroupIdx !== null && savedGroups[focusGroupIdx]) {
      return new Set(savedGroups[focusGroupIdx].udids);
    }
    return null;
  }, [focusGroupIdx, savedGroups]);

  const isDeviceMatchingAccountFilter = useCallback((udid: string) => {
    // Nếu không mở overlay tài khoản thì không áp dụng bộ lọc
    if (!deviceAccountOverlayOpen) return true;

    const accountData = getDeviceAccountDataFromVault(vault, udid);
    const accounts = (accountData.platforms[davActiveTab] || []).filter(acc => acc !== null && acc !== undefined);

    // 1. Lọc theo davActiveFilter
    if (davActiveFilter !== 'default') {
      let filterMatched = false;
      const oneYearMs = 365 * 24 * 60 * 60 * 1000;
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

      if (davActiveFilter === 'one_year') {
        filterMatched = accounts.some(acc => {
          if (acc.createdAt) return (Date.now() - acc.createdAt) >= oneYearMs;
          return (acc as any).isOneYearOld === true;
        });
      } else if (davActiveFilter === 'new_month') {
        filterMatched = accounts.some(acc => {
          if (acc.createdAt) return (Date.now() - acc.createdAt) < thirtyDaysMs;
          return (acc as any).isNew === true;
        });
      } else if (davActiveFilter === 'disabled') {
        filterMatched = accounts.some(acc => acc.status === 'Die' || acc.status === 'Risk');
      } else if (davActiveFilter === 'unverified') {
        filterMatched = accounts.some(acc => acc.status === 'Unverified' || (acc as any).verifyStatus === 'Unverified');
      } else if (davActiveFilter === 'incomplete_info') {
        filterMatched = accounts.some(acc => !acc.name || !acc.nickname || !acc.phone || !acc.email);
      } else if (davActiveFilter === 'wechat_scan_vn') {
        if (davActiveTab === 'wechat') {
          filterMatched = accounts.some(acc => {
            const wc = acc as WeChatAccount;
            const scanCount = wc.scanCount || 0;
            if (scanCount >= 3) return false;
            if (wc.lastScanDate) {
              const nextScan = wc.lastScanDate + 30 * 24 * 60 * 60 * 1000;
              if (nextScan > Date.now()) return false;
            }
            return wc.phoneRegion !== 'HK';
          });
        }
      } else if (davActiveFilter === 'wechat_scan_hk') {
        if (davActiveTab === 'wechat') {
          filterMatched = accounts.some(acc => {
            const wc = acc as WeChatAccount;
            const scanCount = wc.scanCount || 0;
            if (scanCount >= 3) return false;
            if (wc.lastScanDate) {
              const nextScan = wc.lastScanDate + 30 * 24 * 60 * 60 * 1000;
              if (nextScan > Date.now()) return false;
            }
            return wc.phoneRegion === 'HK';
          });
        }
      } else if (davActiveFilter === 'has_notice') {
        filterMatched = accounts.some(acc => !!(acc.notice && acc.notice.dueDate));
      } else if (davActiveFilter === 'nearby_people') {
        if (davActiveTab === 'wechat') {
          filterMatched = hasNearbyRelevantAccount(accounts);
        }
      }

      if (!filterMatched) return false;
    }

    // 2. Lọc theo search query (chỉ lọc trong danh sách tài khoản, không lọc theo model máy/số thiết bị)
    if (davSearch.trim() !== '') {
      const q = davSearch.toLowerCase().trim();

      const accountMatch = accounts.some(acc => {
        return (
          (acc.name || '').toLowerCase().includes(q) ||
          (acc.nickname || '').toLowerCase().includes(q) ||
          (acc.phone || '').toLowerCase().includes(q) ||
          (acc.email || '').toLowerCase().includes(q)
        );
      });

      if (!accountMatch) return false;
    }

    return true;
  }, [deviceAccountOverlayOpen, vault, davActiveTab, davActiveFilter, davSearch]);

  const selectedVisible = useMemo(
    () => orderedRegistered.filter(id => connectSelection.has(id)),
    [orderedRegistered, connectSelection]
  )
  const automationDevices = useMemo<AutomationDeviceOption[]>(
    () => orderedRegistered.map(udid => {
      const meta = androidDeviceMap[udid];
      return {
        udid,
        number: orderMap.get(udid) ?? 0,
        manufacturer: meta?.['ro.product.manufacturer'] ?? undefined,
        model: meta?.['ro.product.model'] ?? undefined,
      };
    }),
    [orderedRegistered, orderMap, androidDeviceMap]
  )

  const controlGridDevices = useMemo<DeviceSelectionGridItem[]>(
    () => orderedSidebarRegistered.map(udid => ({
      udid,
      label: String(orderMap.get(udid) ?? 0).padStart(2, '0'),
      title: udid,
      className: !connectedUdids.has(udid) ? 'offline' : ''
    })),
    [orderedSidebarRegistered, orderMap, connectedUdids]
  )
  const [quickActionOrder, setQuickActionOrder] = useState<QuickActionId[]>(
    loadQuickActionOrder
  )
  const [draggingQuickAction, setDraggingQuickAction] =
    useState<QuickActionId | null>(null)
  const selectableRegistered = useMemo(
    () => sidebarRegistered.filter(id => !runningMacroUdids.has(id)),
    [sidebarRegistered, runningMacroUdids]
  )
  const allSelected =
    selectableRegistered.length > 0 &&
    selectableRegistered.every(id => connectSelection.has(id))
  const isSingleDevice = gridDevices.length === 1

  useEffect(() => {
    try {
      localStorage.setItem(
        QUICK_ACTION_ORDER_KEY,
        JSON.stringify(quickActionOrder)
      )
    } catch { }
  }, [quickActionOrder])

  const quickCommandTargets = useCallback(() => {
    if (selectedVisible.length) return selectedVisible
    if (activeUdid) return [activeUdid]
    return []
  }, [activeUdid, selectedVisible])

  const runQuickAdbCommands = useCallback(
    async (commands: string[]) => {
      const targets = quickCommandTargets()
      if (!targets.length) return

      // Helper function for bounded concurrency
      const runWithConcurrency = async <T,>(
        items: T[],
        limit: number,
        worker: (item: T, index: number) => Promise<void>
      ) => {
        let nextIndex = 0
        const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
          while (nextIndex < items.length) {
            const index = nextIndex++
            await worker(items[index], index)
          }
        })
        await Promise.all(workers)
      }

      await runWithConcurrency(targets, 8, async (udid) => {
        for (const command of commands) {
          try {
            await runAdbCommandApi(wsServer, udid, command)
          } catch {
            // ignore quick action failures; server returns output in UI logs elsewhere.
          }
        }
      })
    },
    [quickCommandTargets, wsServer]
  )

  // state_physicalScreenButtonMode : Trạng thái nút bật/tắt màn hình ('on' | 'off')
  const [physicalScreenButtonMode, setPhysicalScreenButtonMode] = useState<'on' | 'off'>('on')

  // callback_runStayAwakeForTargets : Chạy stay awake cho danh sách thiết bị
  const runStayAwakeForTargets = useCallback(
    async (targets: string[]) => {
      if (!targets.length) return
      for (const udid of targets) {
        await runAdbCommandApi(
          wsServer,
          udid,
          'adb shell settings put global stay_on_while_plugged_in 7'
        )
      }
    },
    [wsServer]
  )

  // callback_runPhysicalScreenOffWithStayAwake : Chạy stay awake trước rồi tắt màn hình vật lý
  const runPhysicalScreenOffWithStayAwake = useCallback(
    async (targets: string[]) => {
      if (!targets.length) return
      for (const udid of targets) {
        try {
          await runAdbCommandApi(
            wsServer,
            udid,
            'adb shell settings put global stay_on_while_plugged_in 7'
          )
        } catch (err) {
          console.warn('[stay-awake] failed', udid, err)
        }

        try {
          const d = androidDeviceMap[udid]
          if (d) {
            const sdk = parseInt(d['ro.build.version.sdk'] || '0', 10)
            const isAndroid15 = sdk >= 35 || d['ro.build.version.release'] === '15'
            if (isAndroid15 || udid === 'R3CR200MXTR' || udid === 'RFCRB1CQ2VE') {
              console.warn('[display-power] skipped physical off for Android 15 / blocked udid', udid)
              continue
            }
          }
          await setDeviceDisplayPower(wsServer, udid, 'off')
        } catch (err) {
          console.warn('[display-power] physical off failed', udid, err)
        }
      }
    },
    [wsServer, androidDeviceMap]
  )

  // ref_autoScreenPrepared : Lưu danh sách thiết bị đã được chuẩn bị tự động để tránh spam
  const autoScreenPreparedRef = useRef<Set<string>>(new Set())

  // effect_autoScreenPrepare : Tự động chạy khi thiết bị vừa online
  useEffect(() => {
    const online = orderedRegistered.filter(id => connectedUdids.has(id))
    for (const udid of online) {
      if (autoScreenPreparedRef.current.has(udid)) continue
      autoScreenPreparedRef.current.add(udid)
      
      runPhysicalScreenOffWithStayAwake([udid]).catch(err => {
        console.warn('[auto-screen-prepare] failed', udid, err)
      })
    }

    // Nếu device offline thì cho phép lần sau online lại chạy lại
    for (const udid of Array.from(autoScreenPreparedRef.current)) {
      if (!connectedUdids.has(udid)) {
        autoScreenPreparedRef.current.delete(udid)
      }
    }
  }, [orderedRegistered, connectedUdids, runPhysicalScreenOffWithStayAwake])

  const handleContextApkSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      e.target.value = ''
      const targets = quickCommandTargets()
      if (!files.length || !targets.length) return
      setGlobalAdbStatus(`Đang cài APK cho ${targets.length} thiết bị...`)
      try {
        for (const udid of targets) {
          for (const file of files) {
            const saved = await installApk(wsServer, udid, file)
            await installUploadedApk(wsServer, udid, saved)
          }
        }
        setGlobalAdbStatus('Đã cài APK xong')
      } catch (err: any) {
        setGlobalAdbStatus(`Lỗi cài APK: ${err?.message || err}`)
      }
    },
    [quickCommandTargets, wsServer]
  )

  const handleContextImportSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      e.target.value = ''
      const targets = quickCommandTargets()
      if (!files.length || !targets.length) return
      setGlobalAdbStatus(`Đang nhập tệp vào ${targets.length} thiết bị...`)
      try {
        for (const udid of targets) {
          for (const file of files) {
            const ext = file.name.toLowerCase().split('.').pop() || ''
            const folder = [
              'jpg',
              'jpeg',
              'png',
              'gif',
              'webp',
              'bmp',
              'mp4',
              'mkv',
              'avi',
              'mov'
            ].includes(ext)
              ? 'DCIM/Camera'
              : ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)
                ? 'Music'
                : 'Download'
            await pushFile(udid, file, `/sdcard/${folder}/${file.name}`)
          }
        }
        setGlobalAdbStatus('Đã nhập tệp xong')
      } catch (err: any) {
        setGlobalAdbStatus(`Lỗi nhập tệp: ${err?.message || err}`)
      }
    },
    [pushFile, quickCommandTargets]
  )

  const handleSetWallpaperForDevices = useCallback(
    async (udids: string[]) => {
      if (!udids.length) return
      setGlobalAdbStatus(`Đang đặt hình nền cho ${udids.length} thiết bị...`)
      try {
        for (const udid of udids) {
          const num = getTileNumber(udid, 0)
          const padded = String(num).padStart(2, '0')
          
          const canvas = document.createElement('canvas')
          canvas.width = 1080
          canvas.height = 1920
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.fillStyle = '#000000'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            ctx.fillStyle = '#2BD03C'
            ctx.font = 'bold 450px Roboto, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(padded, canvas.width / 2, canvas.height / 2)
            
            const base64Image = canvas.toDataURL('image/png')
            await setDeviceWallpaper(wsServer, udid, base64Image)
          }
        }
        setGlobalAdbStatus('Đã đặt hình nền xong')
      } catch (err: any) {
        setGlobalAdbStatus(`Lỗi đặt hình nền: ${err?.message || err}`)
      }
    },
    [getTileNumber, wsServer]
  )


  const runGlobalAdbCommand = useCallback(async () => {
    const commands = globalAdbCommand
      .split(/\r?\n/)
      .map(cmd => cmd.trim())
      .filter(Boolean)
    const targets = quickCommandTargets()
    if (!commands.length || !targets.length) return
    setGlobalAdbRunning(true)
    setGlobalAdbStatus(`Đang chạy ADB trên ${targets.length} thiết bị...`)
    try {
      for (const udid of targets) {
        for (const command of commands) {
          await runAdbCommandApi(wsServer, udid, command)
        }
      }
      setGlobalAdbStatus('Đã chạy lệnh ADB xong')
      setGlobalAdbCommand('')
      setGlobalAdbOpen(false)
    } catch (err: any) {
      setGlobalAdbStatus(`Lỗi ADB: ${err?.message || err}`)
    } finally {
      setGlobalAdbRunning(false)
    }
  }, [globalAdbCommand, quickCommandTargets, wsServer])

  const moveQuickAction = useCallback((from: QuickActionId, to: QuickActionId) => {
    if (from === to) return
    setQuickActionOrder(prev => {
      const next = [...prev]
      const fromIndex = next.indexOf(from)
      const toIndex = next.indexOf(to)
      if (fromIndex < 0 || toIndex < 0) return prev
      next.splice(fromIndex, 1)
      next.splice(toIndex, 0, from)
      return next
    })
  }, [])

  const sendBackToDevice = useCallback(
    (udid: string) => {
      const targets =
        connectSelection.size > 0 && connectSelection.has(udid)
          ? getTargetsByUdids(Array.from(connectSelection))
          : getTargetsByUdids([udid])

      const down = encodeKeycodeMessage(
        KeyEventAction.DOWN,
        AndroidKeycode.KEYCODE_BACK
      )
      const up = encodeKeycodeMessage(
        KeyEventAction.UP,
        AndroidKeycode.KEYCODE_BACK
      )
      for (const t of targets) {
        try {
          t.ws.send(down)
          t.ws.send(up)
        } catch { }
      }
    },
    [connectSelection, getTargetsByUdids]
  )

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const dragState = useRef({
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    active: false
  })
  const [dragging, setDragging] = useState(false)

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragState.current.active) return
    e.preventDefault()
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    setDragOffset({
      x: dragState.current.originX + dx,
      y: dragState.current.originY + dy
    })
  }, [])

  const onPointerUp = useCallback(() => {
    if (!dragState.current.active) return
    dragState.current.active = false
    setDragging(false)
    window.removeEventListener('pointermove', onPointerMove as any)
    window.removeEventListener('pointerup', onPointerUp as any)
  }, [onPointerMove])

  const onGridPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Chỉ kéo chuột trái trên nền grid (không phải trên tile)
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (
      target.closest('.tileDraggableWrapper') ||
      target.closest('.rightConfigPanel') ||
      target.closest('.headerBar')
    ) return

    // Nếu không giữ Ctrl, reset selection trước
    if (!e.ctrlKey && !e.metaKey) {
      setConnectSelection(new Set())
      selectOnly(null)
    }

    rubberBandRef.current.startX = e.clientX
    rubberBandRef.current.startY = e.clientY
    rubberBandRef.current.active = true

    setRubberBand({
      startX: e.clientX, startY: e.clientY,
      currentX: e.clientX, currentY: e.clientY
    })

      ; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [selectOnly])

  const onGridPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!rubberBandRef.current.active) return
    setRubberBand(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null)

    // Tính rect của vùng kéo
    const x1 = Math.min(rubberBandRef.current.startX, e.clientX)
    const y1 = Math.min(rubberBandRef.current.startY, e.clientY)
    const x2 = Math.max(rubberBandRef.current.startX, e.clientX)
    const y2 = Math.max(rubberBandRef.current.startY, e.clientY)

    // Kiểm tra tile nào nằm trong vùng kéo
    const newSelected = new Set<string>()
    mergedOrder.forEach(udid => {
      const el = document.querySelector(`[data-udid="${udid}"]`)
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.left < x2 && rect.right > x1 && rect.top < y2 && rect.bottom > y1) {
        if (!runningMacroUdids.has(udid)) {
          newSelected.add(udid)
        }
      }
    })
    setConnectSelection(newSelected)
  }, [mergedOrder, runningMacroUdids])

  const onGridPointerUp = useCallback((e?: React.PointerEvent<HTMLDivElement>) => {
    if (!rubberBandRef.current.active) return
    rubberBandRef.current.active = false

    // Nếu đã kéo đủ xa (>5px), đánh dấu để onClick không reset selection
    const dx = Math.abs(rubberBandRef.current.startX - (e?.clientX ?? rubberBandRef.current.startX))
    const dy = Math.abs(rubberBandRef.current.startY - (e?.clientY ?? rubberBandRef.current.startY))
    if (dx > 5 || dy > 5) {
      rubberBandJustFinishedRef.current = true
      // Reset sau 100ms (đủ để onClick bỏ qua)
      setTimeout(() => { rubberBandJustFinishedRef.current = false }, 100)
    }

    setRubberBand(null)
  }, [])

  const onTilePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isSingleDevice) return
      if (e.button !== 0) return
      const targetEl = e.target as HTMLElement | null
      const handle = targetEl?.closest('.tileDragHandle')
      if (!handle) return
      e.preventDefault()
      dragState.current.startX = e.clientX
      dragState.current.startY = e.clientY
      dragState.current.originX = dragOffset.x
      dragState.current.originY = dragOffset.y
      dragState.current.active = true
      setDragging(true)
      window.addEventListener('pointermove', onPointerMove as any, {
        passive: false
      })
      window.addEventListener('pointerup', onPointerUp as any)
    },
    [dragOffset.x, dragOffset.y, isSingleDevice, onPointerMove, onPointerUp]
  )

  useEffect(() => {
    if (!isSingleDevice) {
      setDragOffset({ x: 0, y: 0 })
      setDragging(false)
    }
    return () => {
      window.removeEventListener('pointermove', onPointerMove as any)
      window.removeEventListener('pointerup', onPointerUp as any)
    }
  }, [isSingleDevice, onPointerMove, onPointerUp])
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const step = e.deltaY > 0 ? -10 : 10
      updateWidth(dimsRef.current.width + step)
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel as any)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handleDeviceAccountOverlayHotkey = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null

      const isHoveringPhone =
        document.querySelector('.tile:hover') !== null ||
        document.querySelector('.viewerCanvas:hover') !== null ||
        document.querySelector('#viewerPanel:hover') !== null

      const isCanvasFocused =
        active &&
        (active.tagName === 'CANVAS' || active.classList.contains('viewerCanvas'))

      if (isHoveringPhone || isCanvasFocused) {
        return
      }

      if (
        active &&
        (
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) ||
          active.isContentEditable
        ) &&
        !active.closest('.dav-overlay') &&
        !active.closest('.tile-account-overlay')
      ) {
        return
      }

      const savedHotkey = localStorage.getItem('monviewphone:device-account-hotkey') || 'Alt+C'
      const isAltC =
        e.altKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.metaKey &&
        (e.code === 'KeyC' || e.key.toLowerCase() === 'c')

      if (isAltC || matchesHotkey(e, savedHotkey)) {
        e.preventDefault()
        e.stopPropagation()
        setDeviceAccountOverlayOpen(prev => !prev)
        return
      }

      if (e.key === 'Escape') {
        setDeviceAccountOverlayOpen(false)
      }
    }

    window.addEventListener('keydown', handleDeviceAccountOverlayHotkey, {
      capture: true,
      passive: false,
    })

    return () => {
      window.removeEventListener('keydown', handleDeviceAccountOverlayHotkey, {
        capture: true,
      } as any)
    }
  }, [deviceAccountOverlayOpen])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA') {
        const active = document.activeElement?.nodeName.toLowerCase()
        if (
          ['input', 'textarea', 'select'].includes(active || '') ||
          (document.activeElement as HTMLElement)?.isContentEditable
        )
          return
        e.preventDefault()
        const onlineRegistered = orderedRegistered.filter(id => connectedUdids.has(id) && !runningMacroUdids.has(id))
        setConnectSelection(new Set(onlineRegistered))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [orderedRegistered, connectedUdids, runningMacroUdids])

  const [draftConfig, setDraftConfig] = useState<StreamConfig>(STREAM_CONFIG)
  const [draftViewerConfig, setDraftViewerConfig] = useState<StreamConfig>(viewerStreamConfig)

  // Track aspect ratio so stream height follows width
  const boundsAspectRef = useRef<number>(
    STREAM_CONFIG.bounds.height && STREAM_CONFIG.bounds.width
      ? STREAM_CONFIG.bounds.height / STREAM_CONFIG.bounds.width
      : 1
  )
  const autoApplyTimer = useRef<number | null>(null)
  const skipNextAutoApply = useRef(false)
  const [bitrateWarnAccepted, setBitrateWarnAccepted] = useState(false)
  const [bitrateConfirmVisible, setBitrateConfirmVisible] = useState(false)
  const [bitratePending, setBitratePending] = useState<number | null>(null)
  const [bitrateNeedsConfirm, setBitrateNeedsConfirm] = useState(false)
  const [bitrateLastSafe, setBitrateLastSafe] = useState<number>(
    STREAM_CONFIG.bitrate
  )
  const bitrateDragRef = useRef(false)

  useEffect(() => {
    setDraftConfig(streamConfig)
    const w = streamConfig.bounds.width || 1
    const h = streamConfig.bounds.height || 1
    boundsAspectRef.current = h / w
    skipNextAutoApply.current = true
    setBitrateWarnAccepted(false)
    setBitrateConfirmVisible(false)
    setBitratePending(null)
    setBitrateNeedsConfirm(false)
    setBitrateLastSafe(streamConfig.bitrate)
    bitrateDragRef.current = false
  }, [streamConfig])

  useEffect(() => {
    setDraftViewerConfig(viewerStreamConfig)
  }, [viewerStreamConfig])

  const normalizeStreamConfig = (cfg: StreamConfig): StreamConfig => {
    const bitrate = clamp(cfg.bitrate, 524288, 8_388_608)
    const maxFps = clamp(cfg.maxFps, 1, 60)
    const iFrameInterval = clamp(cfg.iFrameInterval, 0, 60)
    const width = clamp(cfg.bounds?.width ?? 0, STREAM_WIDTH_MIN, STREAM_WIDTH_MAX)
    const height = clamp(cfg.bounds?.height ?? 0, STREAM_WIDTH_MIN, 4000)
    const displayId = Math.max(0, Math.floor(cfg.displayId ?? 0))
    return {
      bitrate,
      maxFps,
      iFrameInterval,
      bounds: { width, height },
      sendFrameMeta: Boolean(cfg.sendFrameMeta),
      displayId,
      codecOptions: cfg.codecOptions,
      encoderName: cfg.encoderName
    }
  }

  const normalizeViewerStreamConfig = (cfg: StreamConfig): StreamConfig => {
    const bitrate = clamp(cfg.bitrate, 524288, 8_388_608)
    const maxFps = clamp(cfg.maxFps, 1, 60)
    const iFrameInterval = clamp(cfg.iFrameInterval, 0, 60)
    const width = clamp(cfg.bounds?.width ?? 0, STREAM_WIDTH_MIN, VIEWER_STREAM_WIDTH_MAX)
    const height = clamp(cfg.bounds?.height ?? 0, STREAM_WIDTH_MIN, 4000)
    const displayId = Math.max(0, Math.floor(cfg.displayId ?? 0))
    return {
      bitrate,
      maxFps,
      iFrameInterval,
      bounds: { width, height },
      sendFrameMeta: Boolean(cfg.sendFrameMeta),
      displayId,
      codecOptions: cfg.codecOptions,
      encoderName: cfg.encoderName
    }
  }

  const isViewerConfigMode = viewerUdid !== null
  const activeDraftConfig = isViewerConfigMode ? draftViewerConfig : draftConfig

  const setActiveDraftConfig = useCallback((updater: React.SetStateAction<StreamConfig>) => {
    if (viewerUdid) {
      setDraftViewerConfig(updater)
    } else {
      setDraftConfig(updater)
    }
  }, [viewerUdid])

  const reloadAllTiles = useCallback(() => {
    reloadMap.current.forEach((fn, udid) => {
      if (viewerUdid === udid) return
      try {
        fn?.()
      } catch {
        // ignore
      }
    })
  }, [viewerUdid])

  const updateGridBoundsWidth = (widthRaw: number) => {
    const width = clamp(widthRaw, STREAM_WIDTH_MIN, STREAM_WIDTH_MAX)
    const height = Math.max(1, Math.round(width * boundsAspectRef.current))
    setDraftConfig(prev => ({
      ...prev,
      bounds: { width, height }
    }))
  }

  const updateViewerBoundsWidth = (widthRaw: number) => {
    const width = clamp(widthRaw, STREAM_WIDTH_MIN, VIEWER_STREAM_WIDTH_MAX)
    const aspect =
      draftViewerConfig.bounds.width && draftViewerConfig.bounds.height
        ? draftViewerConfig.bounds.height / draftViewerConfig.bounds.width
        : boundsAspectRef.current || 1
    const height = Math.max(1, Math.round(width * aspect))
    setDraftViewerConfig(prev => ({
      ...prev,
      bounds: { width, height }
    }))
  }

  const applyGridDraftConfig = useCallback(() => {
    const next = normalizeStreamConfig(draftConfig)
    setStreamConfig(prev => {
      if (sameStreamConfig(prev, next)) return prev
      reloadAllTiles()
      return next
    })
  }, [draftConfig, reloadAllTiles])

  const applyViewerDraftConfig = useCallback(() => {
    const next = normalizeViewerStreamConfig(draftViewerConfig)
    setViewerStreamConfig(prev => {
      if (sameStreamConfig(prev, next)) return prev
      return next
    })
  }, [draftViewerConfig])

  const applyActiveDraftConfig = useCallback(() => {
    if (viewerUdid) {
      applyViewerDraftConfig()
    } else {
      applyGridDraftConfig()
    }
  }, [viewerUdid, applyViewerDraftConfig, applyGridDraftConfig])

  const handleBitrateChange = (val: number) => {
    const needsConfirm = val > BITRATE_WARN_THRESHOLD && !bitrateWarnAccepted
    if (needsConfirm) {
      setBitrateNeedsConfirm(true)
      setBitratePending(val)
    } else {
      setBitrateNeedsConfirm(false)
      setBitratePending(null)
      setBitrateLastSafe(val)
    }
    setDraftConfig(prev => ({ ...prev, bitrate: val }))
  }

  const onBitratePointerDown = () => {
    bitrateDragRef.current = true
  }

  const onBitratePointerUp = () => {
    const needsConfirm = bitrateNeedsConfirm && !bitrateWarnAccepted
    bitrateDragRef.current = false
    if (needsConfirm) {
      setBitrateConfirmVisible(true)
    }
  }

  const prevViewerRef = useRef<string | null>(null)

  // Reload single tile silently when opening/closing viewer or when viewer config changes
  useEffect(() => {
    const prev = prevViewerRef.current

    // Case 1: Viewer is currently open
    if (viewerUdid) {
      const fn = reloadMap.current.get(viewerUdid)
      try {
        fn?.({ silent: true })
      } catch {}

      // If we switched from another viewer device, reload that previous device silently so it returns to grid config
      if (prev && prev !== viewerUdid) {
        const prevFn = reloadMap.current.get(prev)
        try {
          prevFn?.({ silent: true })
        } catch {}
      }
      prevViewerRef.current = viewerUdid
    }
    // Case 2: Viewer was closed (viewerUdid is null)
    else if (prev) {
      const fn = reloadMap.current.get(prev)
      try {
        fn?.({ silent: true })
      } catch {}
      prevViewerRef.current = null
    }
  }, [viewerUdid, viewerStreamConfig])

  // Auto-apply on slider changes with debounce to avoid spamming reconnects
  useEffect(() => {
    if (skipNextAutoApply.current) {
      skipNextAutoApply.current = false
      return
    }
    if (
      (bitrateNeedsConfirm && !bitrateWarnAccepted) ||
      bitrateConfirmVisible
    ) {
      return
    }
    if (autoApplyTimer.current) window.clearTimeout(autoApplyTimer.current)
    autoApplyTimer.current = window.setTimeout(() => {
      applyActiveDraftConfig()
      autoApplyTimer.current = null
    }, 600)
    return () => {
      if (autoApplyTimer.current) {
        window.clearTimeout(autoApplyTimer.current)
        autoApplyTimer.current = null
      }
    }
  }, [
    draftConfig,
    draftViewerConfig,
    applyActiveDraftConfig,
    bitrateNeedsConfirm,
    bitrateWarnAccepted,
    bitrateConfirmVisible
  ])

  const onViewerPointerMove = useCallback((e: PointerEvent) => {
    if (!viewerDragRef.current.active) return
    e.preventDefault()
    const dx = e.clientX - viewerDragRef.current.startX
    const dy = e.clientY - viewerDragRef.current.startY
    setViewerOffset({
      x: viewerDragRef.current.originX + dx,
      y: viewerDragRef.current.originY + dy
    })
  }, [])

  const onViewerPointerUp = useCallback(() => {
    if (!viewerDragRef.current.active) return
    viewerDragRef.current.active = false
    window.removeEventListener('pointermove', onViewerPointerMove as any)
    window.removeEventListener('pointerup', onViewerPointerUp as any)
  }, [onViewerPointerMove])

  const onViewerPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      const targetEl = e.target as HTMLElement | null
      const isHeader = targetEl?.closest('.viewerHeader')
      const isActions = targetEl?.closest('.viewerActions')
      const isActionBtn = targetEl?.closest('.viewerActionBtn')
      const isHandle = isHeader || (isActions && !isActionBtn)
      if (!isHandle) return
      e.preventDefault()
      viewerDragRef.current.startX = e.clientX
      viewerDragRef.current.startY = e.clientY
      viewerDragRef.current.originX = viewerOffset.x
      viewerDragRef.current.originY = viewerOffset.y
      viewerDragRef.current.active = true
      window.addEventListener('pointermove', onViewerPointerMove as any, {
        passive: false
      })
      window.addEventListener('pointerup', onViewerPointerUp as any)
    },
    [viewerOffset.x, viewerOffset.y, onViewerPointerMove, onViewerPointerUp]
  )

  const quickActions = useMemo(
    () => ({
      physicalScreenToggle: {
        label: physicalScreenButtonMode === 'on' ? (t('Bật màn hình') || 'Bật màn hình') : (t('Tắt màn hình') || 'Tắt màn hình'),
        icon: <MonitorOff size={15} strokeWidth={1.8} />,
        run: async () => {
          const targets = quickCommandTargets()
          if (!targets.length) return

          if (physicalScreenButtonMode === 'on') {
            setGlobalAdbStatus(`Đang bật màn hình vật lý cho ${targets.length} thiết bị...`)
            try {
              for (const udid of targets) {
                await setDeviceDisplayPower(wsServer, udid, 'on')
              }
              setPhysicalScreenButtonMode('off')
              setGlobalAdbStatus(`Đã bật màn hình vật lý cho ${targets.length} thiết bị`)
            } catch (err: any) {
              setGlobalAdbStatus(`Lỗi bật màn hình vật lý: ${err?.message || err}`)
            }
          } else {
            setGlobalAdbStatus(`Đang tắt màn hình vật lý và bật Stay Awake cho ${targets.length} thiết bị...`)
            try {
              await runPhysicalScreenOffWithStayAwake(targets)
              setPhysicalScreenButtonMode('on')
              setGlobalAdbStatus(`Đã tắt màn hình vật lý + Stay Awake cho ${targets.length} thiết bị`)
            } catch (err: any) {
              setGlobalAdbStatus(`Lỗi tắt màn hình vật lý / Stay Awake: ${err?.message || err}`)
            }
          }
        }
      },
      screenOff: {
        label: 'Power key',
        icon: <MonitorOff size={15} strokeWidth={1.8} />,
        run: async () => {
          const targets = quickCommandTargets()
          if (!targets.length) return

          // Helper function for bounded concurrency
          const runWithConcurrency = async <T,>(
            items: T[],
            limit: number,
            worker: (item: T, index: number) => Promise<void>
          ) => {
            let nextIndex = 0
            const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
              while (nextIndex < items.length) {
                const index = nextIndex++
                await worker(items[index], index)
              }
            })
            await Promise.all(workers)
          }

          await runWithConcurrency(targets, 8, async (udid) => {
            const resolved = getTargetsByUdids([udid])
            if (resolved.length > 0 && resolved[0].ws && resolved[0].ws.readyState === WebSocket.OPEN) {
              try {
                const down = encodeKeycodeMessage(KeyEventAction.DOWN, 26)
                const up = encodeKeycodeMessage(KeyEventAction.UP, 26)
                resolved[0].ws.send(down)
                resolved[0].ws.send(up)
              } catch {
                await runAdbCommandApi(wsServer, udid, 'adb shell input keyevent 26')
              }
            } else {
              await runAdbCommandApi(wsServer, udid, 'adb shell input keyevent 26')
            }
          })
        }
      },
      mute: {
        label: 'Tắt tiếng',
        icon: <VolumeX size={15} strokeWidth={1.8} />,
        run: () =>
          runQuickAdbCommands(['adb shell cmd notification set_dnd none'])
      },
      soundOn: {
        label: 'Mở Âm Thanh',
        icon: <Volume2 size={15} strokeWidth={1.8} />,
        run: () =>
          runQuickAdbCommands([
            'adb shell cmd notification set_dnd off',
            'adb shell cmd media_session volume --stream 3 --set 7',
            'adb shell cmd media_session volume --stream 2 --set 7',
            'adb shell cmd media_session volume --stream 5 --set 7',
            'adb shell cmd media_session volume --stream 4 --set 7',
            'adb shell cmd media_session volume --stream 1 --set 7'
          ])
      },
      maxVolume: {
        label: 'Max âm lượng',
        icon: <Volume2 size={15} strokeWidth={1.8} />,
        run: () =>
          runQuickAdbCommands([
            'adb shell cmd notification set_dnd off',
            'adb shell cmd media_session volume --stream 1 --set 7',
            'adb shell cmd media_session volume --stream 2 --set 15',
            'adb shell cmd media_session volume --stream 3 --set 15',
            'adb shell cmd media_session volume --stream 4 --set 15',
            'adb shell cmd media_session volume --stream 5 --set 15'
          ])
      },
      syncTime: {
        label: 'Sync Time',
        icon: <Clock3 size={15} strokeWidth={1.8} />,
        run: () => setSyncTimeModalOpen(true)
      },
      automation: {
        label: t('Tự động hóa') || 'Automation',
        icon: <Bot size={15} strokeWidth={1.8} />,
        run: () => setAutomationOpen(true)
      }
    }),
    [runQuickAdbCommands, physicalScreenButtonMode, runPhysicalScreenOffWithStayAwake, quickCommandTargets, getTargetsByUdids, wsServer, t]
  )

  {/* ===== SIDEBAR DEVICE GRID — Tổng tất cả ===== */ }
  return (
    <>
      <input
        ref={apkInputRef}
        type='file'
        accept='.apk,.xapk,.zip'
        multiple
        style={{ display: 'none' }}
        onChange={handleContextApkSelect}
      />
      <input
        ref={importInputRef}
        type='file'
        multiple
        style={{ display: 'none' }}
        onChange={handleContextImportSelect}
      />
      <div id='main'>
        {/* ===== EMPTY STATE khi không có device nào ===== */}
        {mergedOrder.length === 0 && allKnownDevices.length === 0 && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#181818',
            zIndex: 0,
            gap: 16,
            pointerEvents: 'none',
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
            <div style={{ color: '#888', fontSize: 15, textAlign: 'center', lineHeight: 1.6, fontWeight: 500 }}>
              Chưa có thiết bị nào kết nối<br />
              <span style={{ fontSize: 13, color: '#555', fontWeight: 400 }}>Kết nối điện thoại qua USB hoặc WiFi để bắt đầu</span>
            </div>
          </div>
        )}
        <div
          id='gridScroll'
          ref={gridScrollRef}
          onPointerDown={onGridPointerDown}
          onPointerMove={onGridPointerMove}
          onPointerUp={onGridPointerUp}
          onPointerCancel={onGridPointerUp}
          onPointerLeave={() => {
            if (syncAll && syncMain) {
              selectOnly(syncMain)
            } else {
              selectOnly(null)
            }
          }}
          onClick={(e) => {
            // Nếu vừa kéo rubber band xong, bỏ qua onClick để không reset selection
            if (rubberBandJustFinishedRef.current) return;

            const target = e.target as HTMLElement;
            // Bỏ chọn tất cả nếu bấm vào nền (không trúng điện thoại, panel nào, hay context menu)
            if (!target.closest('.tileDraggableWrapper') &&
              !target.closest('.rightConfigPanel') &&
              !target.closest('.headerBar') &&
              !target.closest('.react-contexify') &&
              !target.closest('.context-menu') &&
              !target.closest('.pageContextLayer')
            ) {
              selectOnly(null);
              clickDevice(null);
              setConnectSelection(new Set());
            }
          }}
          onContextMenu={e => {
            const target = e.target as HTMLElement
            if (
              target.closest('.tileDraggableWrapper') ||
              target.closest('.rightConfigPanel') ||
              target.closest('.headerBar') ||
              target.closest('.viewerOverlayPanelWrap')
            ) {
              return
            }
            e.preventDefault()
            setPageContextMenu({ x: e.clientX, y: e.clientY })
          }}
        >
          <div
            id='grid'
            className={isSingleDevice ? 'singleMode' : undefined}
            ref={gridRef}
            style={
              {
                ['--tile-width' as any]: `${tileDims.width}px`,
                ['--grid-gap' as any]: '8px',
                ['--grid-width' as any]: '100%'
              } as React.CSSProperties
            }
          >
            {(() => {
              let renderOrder = [...mergedOrder];
              // Chỉ sort khi mode là priority_sort
              if (
                deviceAccountOverlayOpen &&
                davActiveFilter === 'nearby_people' &&
                davActiveTab === 'wechat' &&
                davNearbyFilterMode === 'priority_sort'
              ) {
                const now = Date.now();
                const getHours = (udid: string) => {
                  const accountData = getDeviceAccountDataFromVault(vault, udid);
                  const accounts = accountData.platforms['wechat'] || [];
                  return getNearestNearbyHours(accounts, now);
                };

                renderOrder.sort((a, b) => {
                  const ha = getHours(a);
                  const hb = getHours(b);

                  if (ha !== hb) {
                    return ha - hb;
                  }

                  // Cùng giá trị thì sắp xếp theo số thứ tự máy
                  const oa = orderMap.get(a) ?? Number.MAX_SAFE_INTEGER;
                  const ob = orderMap.get(b) ?? Number.MAX_SAFE_INTEGER;
                  return oa - ob;
                });
              }

              return renderOrder.map((udid, idx) => {
                const isConnected = connectedUdids.has(udid)
                
                // 1. Kiểm tra bộ lọc loại kết nối và nhóm (khi focus vào nhóm chỉ hiện máy online)
                const isMatchedByConnectionAndGroup = (deviceFilter === 'all' || getDeviceConnectionType(udid) === deviceFilter) &&
                  (!currentFocusGroupSet || (currentFocusGroupSet.has(udid) && isConnected));

                // 2. Kiểm tra bộ lọc tài khoản (chỉ khi overlay tài khoản đang mở)
                const isAccountMatched = isDeviceMatchingAccountFilter(udid);

                // 3. Quyết định hiển thị hay ẩn hoàn toàn
                // Cả 2 mode (priority_sort và hide_unmatched) đều làm mờ title không khớp.
                // Điểm khác nhau duy nhất là priority_sort thì sort renderOrder ở trên, hide_unmatched giữ nguyên vị trí.
                const isVisible = isMatchedByConnectionAndGroup;
                const isFilteredOut = deviceAccountOverlayOpen && isMatchedByConnectionAndGroup && !isAccountMatched;

                return (
                  <div
                    key={udid}
                    data-udid={udid}
                    className={`tileDraggableWrapper${isSingleDevice ? ' single' : ''
                      }${dragging ? ' dragging' : ''}${viewerUdid === udid ? ' hiddenByViewer' : ''
                      }${dropTarget === udid ? ' dropTarget' : ''}${runningMacroUdids.has(udid) ? ' macroRunning' : ''}${isFilteredOut ? ' mxh-filtered-out' : ''}`}
                    onPointerDownCapture={e => {
                      if (e.button !== 2) return
                      const target = e.target as HTMLElement
                      if (target.tagName.toLowerCase() === 'canvas') return // Allow right click down to canvas for Back key
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onMouseDownCapture={e => {
                      if (e.button !== 2) return
                      const target = e.target as HTMLElement
                      if (target.tagName.toLowerCase() === 'canvas') return // Allow right click down to canvas for Back key
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onPointerDown={onTilePointerDown}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      // Nhường thao tác UI cho các nút riêng
                      if (target.closest('button') || target.tagName.toLowerCase() === 'input') return;

                      // Click registers this device selection
                      clickDevice(udid);

                      // CHỈ CÓ TÁC DỤNG nếu đang đè phím Ctrl/Meta
                      if (!e.ctrlKey && !e.metaKey) return;
                      if (runningMacroUdids.has(udid)) return;

                      // Chọn/Bỏ chọn đa nhiệm (viền xanh)
                      setConnectSelection(prev => {
                        const next = new Set(prev);
                        if (next.has(udid)) next.delete(udid);
                        else next.add(udid);
                        return next;
                      });
                      // Bật chế độ active duy nhất (viền trắng) để làm tâm điểm
                      selectOnly(udid);
                    }}
                    onContextMenu={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      clickDevice(udid)
                      if (e.ctrlKey || e.metaKey) {
                        selectOnly(udid)
                        setViewerUdid(udid)
                        return
                      }
                      const target = e.target as HTMLElement
                      if (target.tagName.toLowerCase() === 'canvas') {
                        // Right-clicked the stream screen -> Back key sent, skip context menu
                        return
                      }
                      // Mở context menu nhóm cho tile này
                      setContextMenuTarget({ x: e.clientX, y: e.clientY, udid, sourceGrid: 'main', groupIdx: activeGroupIdx ?? undefined })
                      setContextMenuInput(String(orderMap.get(udid) ?? 0))
                      setContextMenuOpen(true)
                    }}
                    onDragOver={e => {
                      if (draggingTile) e.preventDefault()
                      if (draggingTile && dropTarget !== udid) {
                        setDropTarget(udid)
                      }
                      if (draggingTile && draggingTile !== udid) {
                        const toIndex = mergedOrder.indexOf(udid)
                        const fromIndex = mergedOrder.indexOf(draggingTile)
                        if (
                          toIndex >= 0 &&
                          fromIndex >= 0 &&
                          toIndex !== fromIndex
                        ) {
                          moveTile(draggingTile, toIndex)
                        }
                      }
                    }}
                    onDrop={e => {
                      e.preventDefault()
                      if (draggingTile) {
                        const toIndex = mergedOrder.indexOf(udid)
                        if (toIndex >= 0) moveTile(draggingTile, toIndex)
                        setDraggingTile(null)
                      }
                      setDropTarget(null)
                    }}
                    onDragLeave={() => {
                      setDropTarget(prev => (prev === udid ? null : prev))
                    }}
                    style={{
                      display: isVisible ? 'block' : 'none',
                      ...(isSingleDevice
                        ? {
                          ['--drag-x' as any]: `${dragOffset.x}px`,
                          ['--drag-y' as any]: `${dragOffset.y}px`
                        }
                        : {})
                    }}
                  >
                    <Tile
                      udid={udid}
                      order={orderMap.get(udid) ?? idx + 1}
                      deviceParam={udid}
                      wsServer={wsServer}
                      isViewing={viewerUdid === udid}
                      selected={connectSelection.has(udid)}
                      showTileInfo={showTileInfo}
                      isDisconnected={!isConnected}
                      visualAlertActive={Boolean(visualTileAlerts[udid])}
                      onClearVisualAlert={() => clearVisualAlert(udid)}
                      streamConfig={
                        viewerUdid === udid ? viewerStreamConfig : streamConfig
                      }
                      onRegisterReload={registerReload}
                      onUnregisterReload={unregisterReload}
                      onViewDevice={id => {
                        setViewerUdid(prev => prev === id ? null : id)
                      }}
                      onMove={moveTile}
                      onChangeOrderNumber={setTileNumber}
                      onDragStart={id => setDraggingTile(id)}
                      onDragEnd={() => setDraggingTile(null)}
                      showAccountOverlay={deviceAccountOverlayOpen}
                      orderMap={orderMap}
                      accountData={getDeviceAccountDataFromVault(vault, udid)}
                      isFilteredOut={isFilteredOut}
                      nearbyAutoOpenEnabled={davActiveTab === 'wechat' && davActiveFilter === 'nearby_people'}
                      onOpenDeviceViewer={openDeviceViewerFromAccountOverlay}
                    />
                  </div>
                );
              });
            })()}
          </div>
          {rubberBand && (() => {
            const x = Math.min(rubberBand.startX, rubberBand.currentX)
            const y = Math.min(rubberBand.startY, rubberBand.currentY)
            const w = Math.abs(rubberBand.currentX - rubberBand.startX)
            const h = Math.abs(rubberBand.currentY - rubberBand.startY)
            return (
              <div style={{
                position: 'fixed',
                left: x, top: y, width: w, height: h,
                border: '1.5px solid #4f9eff',
                background: 'rgba(79, 158, 255, 0.12)',
                pointerEvents: 'none',
                zIndex: 9000,
                borderRadius: 3
              }} />
            )
          })()}
        </div>
      </div>

      <div className={`sidebar-wrapper ${isSidebarPinned ? 'pinned' : (contextMenuOpen || !!groupContextMenu) ? 'auto-hide force-show' : 'auto-hide'}`}>
        <div className='rightConfigPanel'>
          <button
            className='btn-pin'
            aria-label={isSidebarPinned ? t('Bỏ ghim') : t('Ghim')}
            onClick={() => setIsSidebarPinned(!isSidebarPinned)}
          >
            {isSidebarPinned ? (
              <PinOff size={16} strokeWidth={2} />
            ) : (
              <Pin size={16} strokeWidth={2} />
            )}
          </button>
          <button
            className='btn-pin btn-setting'
            aria-label='Setting'
            title='Setting'
            onClick={() => setAppSettingsVisible(true)}
          >
            <Settings size={16} strokeWidth={2} />
          </button>
          <div className='rcpContent'>
            <div className={`rcpSection rcpDropdown rcpDropdownStatic${streamControlsOpen ? '' : ' rcpSectionCollapsed'}`}>
              <div className='rcpTitleBar'>
                <div className='rcpTitle'>
                  {viewerUdid ? t('Stream config (viewer)') : t('Stream config')}
                </div>
                <div className='rcpTitleActions'>
                  <button
                    className='rcpMiniBtn'
                    title={t('Reset stream config to default')}
                    aria-label={t('Reset stream config to default')}
                    onClick={() => {
                      setConfirmState({
                        title: 'Reset cấu hình?',
                        message: 'Bạn có chắc chắn muốn khôi phục cấu hình stream về mặc định không?',
                        danger: true,
                        onConfirm: () => {
                          if (viewerUdid) {
                            const defaultViewerCfg = {
                              ...STREAM_CONFIG,
                              bitrate: 8_388_608,
                              maxFps: 60,
                              bounds: {
                                width: 1000,
                                height: Math.round(1000 * (boundsAspectRef.current || 16 / 9))
                              }
                            }
                            setViewerStreamConfig(defaultViewerCfg)
                            setDraftViewerConfig(defaultViewerCfg)
                            updateViewerWidthPx(900)
                            const fn = reloadMap.current.get(viewerUdid)
                            try {
                              fn?.({ silent: true })
                            } catch {}
                          } else {
                            setStreamConfig(STREAM_CONFIG)
                            setDraftConfig(STREAM_CONFIG)
                            updateWidth(350)
                            updateViewerWidthPx(900)
                            setBitrateWarnAccepted(false)
                            setBitrateConfirmVisible(false)
                            setBitratePending(null)
                            setBitrateNeedsConfirm(false)
                            setBitrateLastSafe(STREAM_CONFIG.bitrate)
                            reloadAllTiles()
                          }
                        }
                      });
                    }}
                  >
                    <RotateCcw size={12} strokeWidth={2} />
                    <span>Reset</span>
                  </button>
                  <button
                    className='rcpIconBtn'
                    title={streamControlsOpen ? t('Collapse stream config') : t('Expand stream config')}
                    aria-label={streamControlsOpen ? t('Collapse stream config') : t('Expand stream config')}
                    onClick={() => setStreamControlsOpen(prev => !prev)}
                  >
                    {streamControlsOpen ? <ChevronUp size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
                  </button>
                </div>
              </div>
              <div className='rcpToggleRow'>
                <span>{t('Hiển thị Title / Nav')}</span>
                <div style={{ display: 'contents' }}>
                  <button
                    className={`rcpToggleBtn ${showTileInfo ? 'on' : ''}`}
                    onClick={() => setShowTileInfo(prev => !prev)}
                  >
                    {showTileInfo ? t('Bật') : t('Ẩn')}
                  </button>
                </div>
              </div>

              <div className='rcpSliderRow'>
                <div className='rcpSliderLabel'>Kích thước</div>
                <button
                  className='rcpStepBtn'
                  aria-label={t('Decrease tile width')}
                  onClick={() => updateWidth(tileDims.width - 5)}
                >
                  –
                </button>
                <input
                  type='range'
                  min={TILE_WIDTH_MIN}
                  max={TILE_WIDTH_MAX}
                  value={tileDims.width}
                  onChange={e => updateWidth(Number(e.target.value))}
                  className='modalRange'
                />
                <button
                  className='rcpStepBtn'
                  aria-label={t('Increase tile width')}
                  onClick={() => updateWidth(tileDims.width + 5)}
                >
                  +
                </button>
                <div className='rcpValue'>{tileDims.width}px</div>
              </div>
              <div className='rcpSliderRow'>
                <div className='rcpSliderLabel'>Kích thước màn hình lớn</div>
                <button
                  className='rcpStepBtn'
                  aria-label={t('Decrease viewer width')}
                  onClick={() => updateViewerWidthPx(viewerWidthPx - 20)}
                >
                  –
                </button>
                <input
                  type='range'
                  min={VIEWER_WIDTH_MIN}
                  max={VIEWER_WIDTH_MAX}
                  value={viewerWidthPx}
                  onChange={e => updateViewerWidthPx(Number(e.target.value))}
                  className='modalRange'
                />
                <button
                  className='rcpStepBtn'
                  aria-label={t('Increase viewer width')}
                  onClick={() => updateViewerWidthPx(viewerWidthPx + 20)}
                >
                  +
                </button>
                <div className='rcpValue'>{viewerWidthPx}px</div>
              </div>
              <div className='rcpSliderRow'>
                <div className='rcpSliderLabel'>Bitrate</div>
                <button
                  className='rcpStepBtn'
                  aria-label={t('Decrease bitrate')}
                  onClick={() => {
                    const delta = -131072
                    if (viewerUdid) {
                      setDraftViewerConfig(prev => ({
                        ...prev,
                        bitrate: clamp(prev.bitrate + delta, BITRATE_MIN, BITRATE_MAX)
                      }))
                    } else {
                      handleBitrateChange(
                        clamp(draftConfig.bitrate + delta, BITRATE_MIN, BITRATE_MAX)
                      )
                    }
                  }}
                >
                  –
                </button>
                <input
                  type='range'
                  min={BITRATE_MIN}
                  max={BITRATE_MAX}
                  step='131072'
                  value={
                    viewerUdid
                      ? draftViewerConfig.bitrate
                      : draftConfig.bitrate
                  }
                  onChange={e => {
                    const val = Number(e.target.value)
                    if (viewerUdid) {
                      setDraftViewerConfig(prev => ({
                        ...prev,
                        bitrate: val
                      }))
                    } else {
                      handleBitrateChange(val)
                    }
                  }}
                  onMouseDown={onBitratePointerDown}
                  onTouchStart={onBitratePointerDown}
                  onMouseUp={onBitratePointerUp}
                  onTouchEnd={onBitratePointerUp}
                  onMouseLeave={onBitratePointerUp}
                  className='modalRange'
                />
                <button
                  className='rcpStepBtn'
                  aria-label={t('Increase bitrate')}
                  onClick={() => {
                    const delta = 131072
                    if (viewerUdid) {
                      setDraftViewerConfig(prev => ({
                        ...prev,
                        bitrate: clamp(prev.bitrate + delta, BITRATE_MIN, BITRATE_MAX)
                      }))
                    } else {
                      handleBitrateChange(
                        clamp(draftConfig.bitrate + delta, BITRATE_MIN, BITRATE_MAX)
                      )
                    }
                  }}
                >
                  +
                </button>
                <div className='rcpValue'>
                  {(viewerUdid
                    ? draftViewerConfig.bitrate
                    : draftConfig.bitrate
                  ).toLocaleString()}
                </div>
              </div>
              <div className='rcpSliderRow'>
                <div className='rcpSliderLabel'>FPS</div>
                <button
                  className='rcpStepBtn'
                  aria-label={t('Decrease FPS')}
                  onClick={() => {
                    if (viewerUdid) {
                      setDraftViewerConfig(prev => ({
                        ...prev,
                        maxFps: clamp(prev.maxFps - 1, 1, 60)
                      }))
                    } else {
                      setDraftConfig(prev => ({
                        ...prev,
                        maxFps: clamp(prev.maxFps - 1, 1, 60)
                      }))
                    }
                  }}
                >
                  –
                </button>
                <input
                  type='range'
                  min='1'
                  max='60'
                  value={
                    viewerUdid
                      ? draftViewerConfig.maxFps
                      : draftConfig.maxFps
                  }
                  onChange={e => {
                    const val = Number(e.target.value)
                    if (viewerUdid) {
                      setDraftViewerConfig(prev => ({
                        ...prev,
                        maxFps: val
                      }))
                    } else {
                      setDraftConfig(prev => ({
                        ...prev,
                        maxFps: val
                      }))
                    }
                  }}
                  className='modalRange'
                />
                <button
                  className='rcpStepBtn'
                  aria-label={t('Increase FPS')}
                  onClick={() => {
                    if (viewerUdid) {
                      setDraftViewerConfig(prev => ({
                        ...prev,
                        maxFps: clamp(prev.maxFps + 1, 1, 60)
                      }))
                    } else {
                      setDraftConfig(prev => ({
                        ...prev,
                        maxFps: clamp(prev.maxFps + 1, 1, 60)
                      }))
                    }
                  }}
                >
                  +
                </button>
                <div className='rcpValue'>
                  {viewerUdid
                    ? draftViewerConfig.maxFps
                    : draftConfig.maxFps}{' '}
                  fps
                </div>
              </div>

              <div className='rcpSliderRow'>
                <div className='rcpSliderLabel'>Độ Nét</div>
                <button
                  className='rcpStepBtn'
                  aria-label={t('Decrease stream width')}
                  onClick={() => {
                    if (viewerUdid) {
                      updateViewerBoundsWidth(draftViewerConfig.bounds.width - 20)
                    } else {
                      updateGridBoundsWidth(draftConfig.bounds.width - 20)
                    }
                  }}
                >
                  –
                </button>
                <input
                  type='range'
                  min={STREAM_WIDTH_MIN}
                  max={viewerUdid ? VIEWER_STREAM_WIDTH_MAX : STREAM_WIDTH_MAX}
                  value={
                    viewerUdid
                      ? draftViewerConfig.bounds.width
                      : draftConfig.bounds.width
                  }
                  onChange={e => {
                    const val = Number(e.target.value)
                    if (viewerUdid) {
                      updateViewerBoundsWidth(val)
                    } else {
                      updateGridBoundsWidth(val)
                    }
                  }}
                  className='modalRange'
                />
                <button
                  className='rcpStepBtn'
                  aria-label={t('Increase stream width')}
                  onClick={() => {
                    if (viewerUdid) {
                      updateViewerBoundsWidth(draftViewerConfig.bounds.width + 20)
                    } else {
                      updateGridBoundsWidth(draftConfig.bounds.width + 20)
                    }
                  }}
                >
                  +
                </button>
                <div className='rcpValue'>
                  {viewerUdid
                    ? draftViewerConfig.bounds.width
                    : draftConfig.bounds.width}
                  px
                </div>
              </div>
            </div>

            {/* visualAlertPanel : Section Visual Alert - quét chấm đỏ notification */}
            <VisualAlertPanel
              registeredUdids={registeredUdids}
              orderMap={orderMap}
              viewerUdid={viewerUdid}
            />

            <AutomationPanel
              key={automationOpen ? 'open' : 'closed'}
              onOpenSettings={() => setAutomationOpen(true)}
              playAppAction={(appId, actionId) => {
                automationModalRef.current?.playAppAction(appId as any, actionId)
              }}
            />

            <div className='rcpSection'>
              <div className='rcpTitleBar'>
                <div className='rcpTitle'>{t('Điều khiển nhanh')}</div>
                <button
                  className='rcpIconBtn'
                  title={quickControlsOpen ? t('Collapse quick controls') : t('Expand quick controls')}
                  aria-label={quickControlsOpen ? t('Collapse quick controls') : t('Expand quick controls')}
                  onClick={() => setQuickControlsOpen(prev => !prev)}
                >
                  {quickControlsOpen ? <ChevronUp size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
                </button>
              </div>
              <div className={`rcpActions rcpQuickActions${quickControlsOpen ? '' : ' rcpCollapsedBody'}`}>
                {quickActionOrder.map(id => {
                  const action = quickActions[id]
                  return (
                    <button
                      key={id}
                      className={`rcpBtn rcpQuickBtn rcpQuickBtn--${id}${draggingQuickAction === id ? ' dragging' : ''}${
                        id === 'syncTime' && syncTimeSettings.delayEnabled ? ' active-sync' : ''
                      }`}
                      draggable
                      title={action.label}
                      onClick={action.run}
                      onDragStart={e => {
                        setDraggingQuickAction(id)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragOver={e => {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                      }}
                      onDrop={e => {
                        e.preventDefault()
                        if (draggingQuickAction) {
                          moveQuickAction(draggingQuickAction, id)
                        }
                        setDraggingQuickAction(null)
                      }}
                      onDragEnd={() => setDraggingQuickAction(null)}
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className='rcpSection rcpDevicePanel'>

              <div className='rcpFilters rcpFiltersCompact'>
                <button
                  className={`rcpFilter${deviceFilter === 'all' ? ' active' : ''
                    }`}
                  onClick={() => { setDeviceFilter('all'); setFocusGroupIdx(null); }}
                >
                  {t('All')}
                </button>
                <button
                  className={`rcpFilter${deviceFilter === 'usb' ? ' active' : ''
                    }`}
                  onClick={() => { setDeviceFilter('usb'); setFocusGroupIdx(null); }}
                >
                  USB
                </button>
                <button
                  className={`rcpFilter${deviceFilter === 'wifi' ? ' active' : ''
                    }`}
                  onClick={() => { setDeviceFilter('wifi'); setFocusGroupIdx(null); }}
                >
                  WIFI
                </button>
              </div>
              <div className='rcpDeviceSection'>
                <div className='rcpDeviceHeader rcpDeviceHeaderTop'>
                  <span className='rcpDeviceTitle'>{t('Nhóm thiết bị')}</span>
                  <button
                    className={`rcpSelectPill${allSelected ? ' on' : ''}`}
                    onClick={() => {
                      setConnectSelection(prev => {
                        const next = new Set(prev)
                        if (allSelected) {
                          selectableRegistered.forEach(id => next.delete(id))
                        } else {
                          selectableRegistered.forEach(id => next.add(id))
                        }
                        return next
                      })
                    }}
                  >
                    <span className='rcpSelectIcon'>{allSelected ? '✔' : ''}</span>
                    <span className='rcpSelectText'>
                      {allSelected ? t('Deselect all') : t('Select all')}
                    </span>
                    <span className='rcpSelectCount'>({selectableRegistered.length})</span>
                  </button>
                </div>
                <div className='rcpDeviceToolbar'>
                  {deviceFilter !== 'all' ? (
                    <button
                      className='rcpAdd'
                      disabled={!connectSelection.size || connectBusy}
                      onClick={() => {
                        if (!selectedVisible.length) return
                        if (targetConnect === 'wifi') {
                          const nextPorts: Record<string, number> = {}
                          selectedVisible.forEach(id => {
                            const hasPort = id.includes(':')
                            const port = hasPort ? Number(id.split(':').pop()) : 5555
                            nextPorts[id] = Number.isFinite(port) ? port : 5555
                          })
                          setConnectPorts(nextPorts)
                          setConnectModalOpen(true)
                        } else {
                          const payload = selectedVisible.map(id => ({
                            device: id,
                            connect: 'usb'
                          }))
                          runConnectRequest(payload, targetConnect)
                        }
                      }}
                    >
                      {connectBtnLabel}
                    </button>
                  ) : null}
                  <button
                    className='rcpAdd ghost'
                    disabled={!connectSelection.size}
                    title={connectSelection.size ? `Lưu nhóm ${connectSelection.size} device` : 'Chọn device trước'}
                    onClick={() => {
                      if (!connectSelection.size) return
                      setGroupModalName('')
                      setGroupModalOpen(true)
                    }}
                  >
                    {t('Thêm Nhóm')}
                    {connectSelection.size > 0 ? ` (${connectSelection.size})` : ''}
                  </button>

                  <div style={{ position: 'relative', marginLeft: 'auto' }}>
                    <button
                      type="button"
                      className="rcpAdd ghost"
                      onClick={() => setDisplayFilterOpen(p => !p)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>Hiển thị: {displayFilter === 'online' ? 'Online only' : 'Tất cả'}</span>
                      <ChevronDown size={14} />
                    </button>
                    {displayFilterOpen && (
                      <div
                        className="rcpDropdown"
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          marginTop: '4px',
                          background: 'var(--md-card)',
                          border: '1px solid var(--md-border)',
                          borderRadius: '8px',
                          boxShadow: 'var(--md-shadow-panel)',
                          zIndex: 10,
                          width: '120px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          className={`rcpDropdownItem${displayFilter === 'online' ? ' active' : ''}`}
                          onClick={() => {
                            setDisplayFilter('online');
                            setDisplayFilterOpen(false);
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '12px',
                            color: 'var(--md-text)',
                            cursor: 'pointer',
                            background: displayFilter === 'online' ? 'rgba(255,255,255,0.08)' : 'transparent',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => { if (displayFilter !== 'online') e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                          onMouseLeave={(e) => { if (displayFilter !== 'online') e.currentTarget.style.background = 'transparent'; }}
                        >
                          Online only
                        </div>
                        <div
                          className={`rcpDropdownItem${displayFilter === 'all' ? ' active' : ''}`}
                          onClick={() => {
                            setDisplayFilter('all');
                            setDisplayFilterOpen(false);
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '12px',
                            color: 'var(--md-text)',
                            cursor: 'pointer',
                            background: displayFilter === 'all' ? 'rgba(255,255,255,0.08)' : 'transparent',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => { if (displayFilter !== 'all') e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                          onMouseLeave={(e) => { if (displayFilter !== 'all') e.currentTarget.style.background = 'transparent'; }}
                        >
                          Tất cả
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {connectNotification ? (
                  <div className={`rcpConnectNotification ${connectNotification.type}`}>
                    {connectNotification.text}
                  </div>
                ) : null}
                <div className='rcpGridWrap' style={{ marginTop: '12px' }}>
                  <DeviceSelectionGrid
                    className='rcpGrid12'
                    devices={controlGridDevices}
                    selectedUdids={connectSelection}
                    onToggleDevice={(id, checked) => {
                      setConnectSelection(prev => {
                        const next = new Set(prev)
                        if (checked) next.add(id)
                        else next.delete(id)
                        return next
                      })
                    }}
                    onDeviceContextMenu={(e, id) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const removeGroupIdx =
                        activeGroupIdx !== null &&
                        savedGroups[activeGroupIdx]?.udids.includes(id)
                          ? activeGroupIdx
                          : undefined;
                      setContextMenuTarget({
                        x: e.clientX,
                        y: e.clientY,
                        udid: id,
                        sourceGrid: 'main',
                        groupIdx: removeGroupIdx
                      })
                      setContextMenuInput(String(orderMap.get(id) ?? 0))
                      setContextMenuOpen(true)
                    }}
                  />
                </div>
                {savedGroups.length > 0 && (
                  <div className='rcpSavedGroups'>
                    {savedGroups.map((group, idx) => (
                      <div
                        key={idx}
                        className={`rcpSavedGroupItem${focusGroupIdx === idx ? ' focused' : ''}`}
                        draggable
                        onDragStart={() => setDragGroupIdx(idx)}
                        onDragOver={e => { e.preventDefault(); setDragGroupOverIdx(idx) }}
                        onDragEnd={() => {
                          if (dragGroupIdx !== null && dragGroupOverIdx !== null && dragGroupIdx !== dragGroupOverIdx) {
                            setSavedGroups(prev => {
                              const arr = [...prev]
                              const [moved] = arr.splice(dragGroupIdx, 1)
                              arr.splice(dragGroupOverIdx, 0, moved)
                              // Cập nhật focusGroupIdx nếu cần
                              if (focusGroupIdx === dragGroupIdx) setFocusGroupIdx(dragGroupOverIdx)
                              else if (focusGroupIdx !== null) {
                                if (focusGroupIdx > dragGroupIdx && focusGroupIdx <= dragGroupOverIdx) setFocusGroupIdx(focusGroupIdx - 1)
                                else if (focusGroupIdx < dragGroupIdx && focusGroupIdx >= dragGroupOverIdx) setFocusGroupIdx(focusGroupIdx + 1)
                              }
                              return arr
                            })
                          }
                          setDragGroupIdx(null)
                          setDragGroupOverIdx(null)
                        }}
                        style={{
                          opacity: dragGroupIdx === idx ? 0.4 : 1,
                          borderTop: dragGroupOverIdx === idx && dragGroupIdx !== idx ? '2px solid #3ddc84' : undefined,
                        }}
                      >
                        {/* Row chính */}
                        <div className='rcpSavedGroupRow'>
                          {/* Nút load/focus nhóm — double click để focus, single click để select */}
                          <button
                            className={`rcpSavedGroupBtn${activeGroupIdx === idx ? ' active' : ''}${focusGroupIdx === idx ? ' focused' : ''}`}
                            title={`Click: chọn nhóm | Double click: chỉ hiện nhóm này | Drag: đổi thứ tự`}
                            onClick={() => {
                              if (activeGroupIdx === idx) {
                                setActiveGroupIdx(null)
                                setConnectSelection(new Set())
                              } else {
                                setConnectSelection(new Set(group.udids))
                                setActiveGroupIdx(idx)
                              }
                            }}
                            onDoubleClick={() => {
                              if (focusGroupIdx === idx) {
                                // Double click lại → bỏ focus, hiện hết
                                setFocusGroupIdx(null)
                              } else {
                                setFocusGroupIdx(idx)
                                setConnectSelection(new Set(group.udids))
                                setActiveGroupIdx(idx)
                              }
                            }}
                            onContextMenu={e => {
                              e.preventDefault()
                              e.stopPropagation()
                              setGroupContextMenu({ x: e.clientX, y: e.clientY, idx })
                            }}
                          >
                            {renameGroupIdx === idx ? (
                              <input
                                className='rcpGroupRenameInput'
                                autoFocus
                                value={renameGroupValue}
                                onClick={e => e.stopPropagation()}
                                onDoubleClick={e => e.stopPropagation()}
                                onChange={e => setRenameGroupValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && renameGroupValue.trim()) {
                                    setSavedGroups(prev => prev.map((g, i) => i === idx ? { ...g, name: renameGroupValue.trim() } : g))
                                    setRenameGroupIdx(null)
                                  }
                                  if (e.key === 'Escape') setRenameGroupIdx(null)
                                }}
                                onBlur={() => {
                                  if (renameGroupValue.trim()) {
                                    setSavedGroups(prev => prev.map((g, i) => i === idx ? { ...g, name: renameGroupValue.trim() } : g))
                                  }
                                  setRenameGroupIdx(null)
                                }}
                              />
                            ) : (
                              <span className='rcpSavedGroupName'>{group.name}</span>
                            )}
                            <span className='rcpSavedGroupCount'>
                              {group.udids.filter(uid => displayFilter === 'all' || connectedUdids.has(uid)).length}
                            </span>
                            {focusGroupIdx === idx && <span className='rcpGroupFocusDot' title='Đang lọc nhóm này'>●</span>}
                          </button>

                          {/* Nút dropdown xem device */}
                          <button
                            className={`rcpSavedGroupExpand${expandedGroupIdx === idx ? ' open' : ''}`}
                            title='Xem device trong nhóm'
                            onClick={() => setExpandedGroupIdx(prev => prev === idx ? null : idx)}
                          >
                            ▾
                          </button>

                          {/* Nút xoá nhóm */}
                          <button
                            className='rcpSavedGroupDel'
                            title='Xoá nhóm'
                            onClick={() => setDeleteGroupConfirm(idx)}
                          >
                            ✕
                          </button>
                        </div>

                        {/* Dropdown: grid device trong nhóm */}
                        {expandedGroupIdx === idx && (
                          <div className='rcpSavedGroupDevices'>
                            <div className='rcpGrid rcpGridCompact rcpGrid12' style={{ marginTop: 4 }}>
                              {group.udids.filter(uid => displayFilter === 'all' || connectedUdids.has(uid)).map(uid => (
                                <div
                                  key={uid}
                                  className={`rcpGridItem${connectSelection.has(uid) ? ' on' : ''}${!connectedUdids.has(uid) ? ' offline' : ''} rcpGroupDeviceItem`}
                                  title={uid}
                                  onContextMenu={e => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setContextMenuTarget({ x: e.clientX, y: e.clientY, udid: uid, groupIdx: idx, sourceGrid: 'group' })
                                    setContextMenuInput(String(orderMap.get(uid) ?? 0))
                                    setContextMenuOpen(true)
                                  }}
                                >
                                  <span>{String(orderMap.get(uid) ?? 0).padStart(2, '0')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {viewerUdid ? (
        <div
          className='viewerOverlay'
          onMouseDown={(e) => {
            // KHÔNG tắt viewer khi click ngoài — chỉ tắt khi bấm nút X trong DeviceViewer
            // Cho phép click xuyên qua để tương tác grid phía sau
            e.stopPropagation()
          }}
        >
          <div
            className='viewerOverlayPanelWrap'
            style={
              {
                ['--viewer-dx' as any]: `${viewerOffset.x}px`,
                ['--viewer-dy' as any]: `${viewerOffset.y}px`,
                ['--viewer-width' as any]: `${viewerWidthPx}px`
              } as React.CSSProperties
            }
            onMouseDown={e => {
              if (e.button === 1) {
                e.preventDefault()
                e.stopPropagation()
                setViewerUdid(null)
              } else {
                e.stopPropagation()
              }
            }}
            onPointerDown={onViewerPointerDown}
          >
            <div className='viewerOverlayPanel device-viewer-container'>
              <DeviceViewer
                udid={viewerUdid}
                wsServer={wsServer}
                onClose={() => setViewerUdid(null)}
                connectSelection={connectSelection}
                currentOrder={
                  viewerUdid
                    ? getTileNumber(
                      viewerUdid,
                      mergedOrder.indexOf(viewerUdid) + 1
                    ) - 1
                    : undefined
                }
                onChangeOrder={(uid, newIdx) => setTileNumber(uid, newIdx + 1)}
              />
            </div>
          </div>
        </div>
      ) : null}

      {appSettingsVisible ? (
        <div className='appSettingsOverlay'>
          <div className='confirmPanel appSettingsPanel' onMouseDown={e => e.stopPropagation()}>
            <button
              className='appSettingsClose'
              title={t('Close settings')}
              aria-label={t('Close settings')}
              onClick={() => setAppSettingsVisible(false)}
            >
              <X size={16} strokeWidth={2} />
            </button>
            <div className='confirmTitle' style={{ fontSize: 22, fontWeight: 700, background: 'linear-gradient(90deg, #fff, #999)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 24, borderBottom: 'none' }}>Cài Đặt Hệ Thống</div>            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className='rcpSliderLabel' style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0', flex: 1, marginRight: 16 }}>Chế độ mã hoá video</div>
                <select
                  className='headerLangSelect'
                  style={{ background: '#0a0a0a', color: '#fff', border: '1px solid #444', borderRadius: '6px', padding: '6px 8px', fontSize: 12, width: 160 }}
                  value={streamConfig.encoderName || ''}
                  onChange={e => {
                    const val = e.target.value === '' ? undefined : e.target.value
                    setStreamConfig(p => ({ ...p, encoderName: val }))
                  }}
                >
                  <option value="">Auto</option>
                  <option value="OMX.google.h264.encoder">H.264 (OMX.google)</option>
                </select>
              </div>
            </div>

            {/* Hotkey Configuration Section */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 16 }}>
              <div 
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setHotkeySectionOpen(p => !p)}
              >
                <div className='rcpSliderLabel' style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0', flex: 1 }}>
                  Hotkey
                </div>
                <button
                  type="button"
                  className='rcpIconBtn'
                  style={{ background: 'transparent', border: 'none', color: 'var(--md-muted)', cursor: 'pointer', padding: 0 }}
                  title={hotkeySectionOpen ? 'Thu nhỏ' : 'Mở rộng'}
                  aria-label={hotkeySectionOpen ? 'Thu nhỏ' : 'Mở rộng'}
                >
                  {hotkeySectionOpen ? <ChevronUp size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
                </button>
              </div>

              {hotkeySectionOpen && (
                <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--md-muted)', flex: 1 }}>
                      Bật/Tắt Sync Time (Delay):
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Nhấn tổ hợp phím..."
                        readOnly
                        value={syncTimeHotkey}
                        onKeyDown={handleHotkeyInputKeyDown}
                        style={{
                          background: '#0a0a0a',
                          color: 'var(--md-info)',
                          border: '1px solid #444',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: 12,
                          width: 160,
                          textAlign: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          outline: 'none',
                        }}
                      />
                      {syncTimeHotkey && (
                        <button
                          type="button"
                          onClick={() => {
                            setSyncTimeHotkey('');
                            localStorage.removeItem('monviewphone:sync-time-hotkey');
                            saveHotkeySettingToBackend('monviewphone:sync-time-hotkey', '');
                          }}
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            color: '#ff8080',
                            padding: '6px 10px',
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          Xoá
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--md-muted)', flex: 1 }}>
                      Mở Kho tài khoản:
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Nhấn tổ hợp phím..."
                        readOnly
                        value={deviceAccountHotkey}
                        onKeyDown={handleDeviceAccountHotkeyInputKeyDown}
                        style={{
                          background: '#0a0a0a',
                          color: 'var(--md-info)',
                          border: '1px solid #444',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: 12,
                          width: 160,
                          textAlign: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          outline: 'none',
                        }}
                      />
                      {deviceAccountHotkey && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeviceAccountHotkey('');
                            localStorage.removeItem('monviewphone:device-account-hotkey');
                            saveHotkeySettingToBackend('monviewphone:device-account-hotkey', '');
                          }}
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            color: '#ff8080',
                            padding: '6px 10px',
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          Xoá
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Seeding Content Section */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 16 }}>
              <div 
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setSeedingSectionOpen(p => !p)}
              >
                <div className='rcpSliderLabel' style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0', flex: 1 }}>
                  Nội dung Seeding
                </div>
                <button
                  type="button"
                  className='rcpIconBtn'
                  style={{ background: 'transparent', border: 'none', color: 'var(--md-muted)', cursor: 'pointer', padding: 0 }}
                  title={seedingSectionOpen ? 'Thu nhỏ' : 'Mở rộng'}
                  aria-label={seedingSectionOpen ? 'Thu nhỏ' : 'Mở rộng'}
                >
                  {seedingSectionOpen ? <ChevronUp size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
                </button>
              </div>

              {seedingSectionOpen && (
                <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
                  <textarea
                    value={seedingContents}
                    onChange={handleSeedingContentsChange}
                    placeholder="Nhập từ ngữ seeding, mỗi câu 1 dòng..."
                    style={{
                      width: '100%',
                      height: 120,
                      background: '#0a0a0a',
                      color: '#fff',
                      border: '1px solid #444',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: 12,
                      fontFamily: 'monospace',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--md-muted)', marginTop: 6, textAlign: 'right' }}>
                    Số dòng: <strong style={{ color: 'var(--md-info)' }}>{seedingLineCount}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Inspector Section */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0', marginBottom: 6 }}>
                Theme Inspector
              </div>
              <div style={{ fontSize: 12, color: 'var(--md-muted)', marginBottom: 12 }}>
                Rê chuột vào UI để xem mã màu, click để đổi màu
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className={themeInspectorEnabled ? 'modalBtnPrimary' : 'modalBtn'}
                  style={{ height: 34, borderRadius: 8, padding: '0 16px', fontSize: 12, cursor: 'pointer' }}
                  onClick={() => setThemeInspectorEnabled(prev => !prev)}
                >
                  {themeInspectorEnabled ? 'Tắt Theme Inspector' : 'Bật Theme Inspector'}
                </button>
                <button
                  type="button"
                  className='modalBtnDanger'
                  style={{ height: 34, borderRadius: 8, padding: '0 16px', fontSize: 12, cursor: 'pointer' }}
                  onClick={() => {
                    clearThemeOverrides();
                    window.dispatchEvent(new CustomEvent('monviewphone:theme-reset-all'));
                  }}
                >
                  Reset toàn bộ màu đã chỉnh
                </button>
              </div>
            </div>


            <div className='confirmBtns' style={{ marginTop: 32, justifyContent: 'flex-end', display: 'flex' }}>
              <button
                className='confirmBtn'
                style={{
                  background: 'linear-gradient(135deg, #4f7fff, #205cff)',
                  border: 'none',
                  color: '#fff',
                  padding: '10px 24px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 15px rgba(32, 92, 255, 0.4)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                onClick={() => setAppSettingsVisible(false)}
              >
                Xác Nhận
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bitrateConfirmVisible ? (
        <div
          className='confirmOverlay'
          onMouseDown={() => setBitrateConfirmVisible(false)}
        >
          <div className='confirmPanel' onMouseDown={e => e.stopPropagation()}>
            <div className='confirmTitle'>{t('Bitrate cao')}</div>
            <div className='confirmText'>
              {t(
                'Kéo bitrate cao trên (60%) có thể làm tăng tải và đôi lúc gây giật/đứt stream. Vẫn tiếp tục?'
              )}
            </div>
            <div className='confirmActions'>
              <button
                className='modalBtn'
                onClick={() => {
                  setBitrateConfirmVisible(false)
                  setBitratePending(null)
                  setBitrateNeedsConfirm(false)
                  setDraftConfig(prev => ({
                    ...prev,
                    bitrate: bitrateLastSafe
                  }))
                }}
              >
                {t('Hủy')}
              </button>
              <button
                className='modalBtnPrimary'
                onClick={() => {
                  const target = bitratePending ?? draftConfig.bitrate
                  setBitrateWarnAccepted(true)
                  setBitrateConfirmVisible(false)
                  setBitrateNeedsConfirm(false)
                  setBitratePending(null)
                  setBitrateLastSafe(target)
                  setDraftConfig(prev => ({ ...prev, bitrate: target }))
                  applyGridDraftConfig()
                }}
              >
                {t('Tiếp tục')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {connectModalOpen ? (
        <div className='confirmOverlay' onMouseDown={closeConnectModal}>
          <div className='confirmPanel' onMouseDown={e => e.stopPropagation()}>
            <div className='confirmTitle'>{t('Connect devices')}</div>
            {targetConnect === 'wifi' ? (
              <>
                <div className='confirmText'>
                  {t('Set port (default 5555) for each device')}
                </div>
                <div className='connectList'>
                  {selectedVisible.map(id => (
                    <div key={id} className='connectRow'>
                      <div className='connectId'>{id}</div>
                      <input
                        className='connectPort'
                        type='number'
                        min={1}
                        max={65535}
                        value={connectPorts[id] ?? 5555}
                        onChange={e =>
                          setConnectPorts(prev => ({
                            ...prev,
                            [id]: Number(e.target.value) || 5555
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className='connectList'>
                {Array.from(connectSelection).map(id => (
                  <div key={id} className='connectRow'>
                    <div className='connectId'>{id}</div>
                  </div>
                ))}
              </div>
            )}
            <div className='confirmActions'>
              <button className='modalBtn' onClick={closeConnectModal}>
                {t('Cancel')}
              </button>
              <button
                className='modalBtnPrimary'
                disabled={connectBusy}
                onClick={async () => {
                  const payload = Array.from(connectSelection).map(id => {
                    const port = connectPorts[id] ?? 5555
                    return targetConnect === 'wifi'
                      ? { device: id, connect: 'wifi', port }
                      : { device: id, connect: 'usb' }
                  })
                  await runConnectRequest(payload, targetConnect)
                  closeConnectModal()
                }}
              >
                {t('Save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {modalPostLoading ? (
        <div className='rcpModalCloseLoading'>
          <div className='rcpModalLoader' aria-hidden='true'></div>
          <span>{t('Loading…')}</span>
        </div>
      ) : null}

      {pageContextMenu ? (
        <div
          className='pageContextLayer'
          onClick={() => setPageContextMenu(null)}
          onContextMenu={e => {
            e.preventDefault()
            setPageContextMenu(null)
          }}
        >
          <div
            className='pageContextMenu'
            style={{
              top: Math.min(pageContextMenu.y, window.innerHeight - 150),
              left: Math.min(pageContextMenu.x, window.innerWidth - 230)
            }}
            onClick={e => e.stopPropagation()}
            onContextMenu={e => e.stopPropagation()}
          >
            <button
              className='pageContextItem'
              onClick={() => {
                setPageContextMenu(null)
                apkInputRef.current?.click()
              }}
            >
              <Package size={15} strokeWidth={1.8} />
              <span>Cài đặt APK</span>
            </button>
            <button
              className='pageContextItem'
              onClick={() => {
                setPageContextMenu(null)
                importInputRef.current?.click()
              }}
            >
              <Upload size={15} strokeWidth={1.8} />
              <span>Nhập tệp vào điện thoại</span>
            </button>
            <button
              className='pageContextItem'
              onClick={() => {
                setPageContextMenu(null)
                setGlobalAdbOpen(true)
              }}
            >
              <Terminal size={15} strokeWidth={1.8} />
              <span>Chạy lệnh ADB</span>
            </button>
            {globalAdbStatus ? <div className='pageContextStatus'>{globalAdbStatus}</div> : null}
          </div>
        </div>
      ) : null}

      {globalAdbOpen ? (
        <div className='confirmOverlay' onMouseDown={() => setGlobalAdbOpen(false)}>
          <div className='confirmPanel adbQuickPanel' onMouseDown={e => e.stopPropagation()}>
            <div className='confirmTitle'>Chạy lệnh ADB</div>
            <textarea
              className='adbQuickInput'
              placeholder='adb shell pm list packages -3'
              value={globalAdbCommand}
              onChange={e => setGlobalAdbCommand(e.target.value)}
              autoFocus
            />
            {globalAdbStatus ? <div className='pageContextStatus'>{globalAdbStatus}</div> : null}
            <div className='confirmActions'>
              <button className='modalBtn' onClick={() => setGlobalAdbOpen(false)}>
                Hủy
              </button>
              <button
                className='modalBtnPrimary'
                disabled={globalAdbRunning || !globalAdbCommand.trim()}
                onClick={runGlobalAdbCommand}
              >
                Chạy
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AutomationModal
        ref={automationModalRef}
        open={automationOpen}
        devices={automationDevices}
        selectedUdids={selectedVisible}
        viewerUdid={viewerUdid}
        onClose={() => setAutomationOpen(false)}
      />
      <ThemeInspector enabled={themeInspectorEnabled} onEnabledChange={setThemeInspectorEnabled} />
      {macroPlaybackItems.length ? createPortal(
        <section
          className={`macroPlaybackPanel${macroPlaybackExpanded ? ' expanded' : ' collapsed'}`}
          aria-label='Automation Playback'
          style={macroPlaybackPosition ? {
            left: macroPlaybackPosition.x,
            top: macroPlaybackPosition.y,
            right: 'auto',
            bottom: 'auto',
          } : undefined}
        >
          <header className='macroPlaybackHeader' onPointerDown={startMacroPlaybackDrag}>
            <div className='macroPlaybackHeading'>
              <span>Automation Playback</span>
              <small>{macroPlaybackItems.filter(i => i.running).length > 0 ? `${macroPlaybackItems.filter(i => i.running).length} đang chạy` : 'Hoàn tất'}</small>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                type='button'
                className='modalBtn macroPlaybackToggleBtn'
                onClick={() => setMacroPlaybackExpanded(prev => !prev)}
              >
                {macroPlaybackExpanded ? 'Thu gọn' : 'Mở rộng'}
              </button>
              <button
                type='button'
                className='modalBtn macroPlaybackCloseBtn'
                onClick={() => {
                  // Dừng tất cả macro đang chạy trước khi đóng
                  macroPlaybackItems.forEach(item => {
                    if (item.running) {
                      const detail: MacroPlaybackStopDetail = { id: item.id }
                      window.dispatchEvent(new CustomEvent(MACRO_PLAYBACK_STOP_EVENT, { detail }))
                    }
                  })
                  setMacroPlaybackItems([])
                }}
                title='Đóng panel'
              >
                ✕
              </button>
            </div>
          </header>
          {macroPlaybackExpanded ? (
            <div className='macroPlaybackList'>
              {macroPlaybackItems.map(item => (
                <div key={item.id} className={`macroPlaybackItem${!item.running ? ' finished' : ''}`}>
                  <div className='macroPlaybackItemText'>
                    <span>
                      {item.running
                        ? (item.totalSteps !== undefined ? `Đang chạy (${item.currentStep ?? 0}/${item.totalSteps}):` : 'Đang chạy:')
                        : (item.totalSteps !== undefined ? `Hoàn tất (${item.totalSteps}/${item.totalSteps}):` : 'Hoàn tất:')}
                    </span>
                    <strong>{item.title}</strong>
                    <small>{formatPlaybackElapsed(item.startedAt)}</small>
                  </div>
                  {item.running ? (
                    <button
                      type='button'
                      className='modalBtnDanger macroPlaybackStopBtn'
                      onClick={() => {
                        const detail: MacroPlaybackStopDetail = { id: item.id }
                        window.dispatchEvent(new CustomEvent(MACRO_PLAYBACK_STOP_EVENT, { detail }))
                        setMacroPlaybackItems(prev => prev.filter(progress => progress.id !== item.id))
                      }}
                    >
                      Stop
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 4 }}>
                      {item.replayAppId && item.replayActionId ? (
                        <button
                          type='button'
                          className='modalBtnPrimary macroPlaybackStopBtn'
                          onClick={() => {
                            // Xóa item cũ và dispatch replay event
                            setMacroPlaybackItems(prev => prev.filter(p => p.id !== item.id))
                            window.dispatchEvent(new CustomEvent(MACRO_PLAYBACK_REPLAY_EVENT, {
                              detail: { appId: item.replayAppId, actionId: item.replayActionId }
                            }))
                          }}
                        >
                          ▶ Play
                        </button>
                      ) : null}
                      <button
                        type='button'
                        className='modalBtn macroPlaybackStopBtn'
                        onClick={() => setMacroPlaybackItems(prev => prev.filter(p => p.id !== item.id))}
                        title='Xóa khỏi danh sách'
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </section>,
        document.body,
      ) : null}

      {/* Modal Thêm Nhóm */}
      {groupModalOpen && (
        <div
          className='confirmOverlay'
          onMouseDown={() => setGroupModalOpen(false)}
        >
          <div
            className='confirmPanel'
            style={{ maxWidth: 360 }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className='confirmTitle'>Thêm Nhóm</div>
            <div className='confirmText' style={{ marginBottom: 12 }}>
              Đặt tên cho nhóm <strong>{connectSelection.size}</strong> device đang chọn
            </div>

            <input
              className='confirmInput'
              type='text'
              placeholder='Tên nhóm (VD: Nhóm LINE, Nhóm 1-10...)'
              value={groupModalName}
              autoFocus
              onChange={e => setGroupModalName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && groupModalName.trim()) {
                  setSavedGroups(prev => [
                    ...prev,
                    { name: groupModalName.trim(), udids: Array.from(connectSelection) }
                  ])
                  setGroupModalOpen(false)
                }
                if (e.key === 'Escape') setGroupModalOpen(false)
              }}
            />

            <div className='confirmBtns' style={{ marginTop: 16 }}>
              <button className='modalBtn' onClick={() => setGroupModalOpen(false)}>
                Huỷ
              </button>
              <button
                className='modalBtnPrimary'
                disabled={!groupModalName.trim()}
                onClick={() => {
                  if (!groupModalName.trim()) return
                  setSavedGroups(prev => [
                    ...prev,
                    { name: groupModalName.trim(), udids: Array.from(connectSelection) }
                  ])
                  setGroupModalOpen(false)
                }}
              >
                Lưu Nhóm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xoá nhóm */}
      {deleteGroupConfirm !== null && (
        <div className='confirmOverlay' onMouseDown={() => setDeleteGroupConfirm(null)}>
          <div className='confirmPanel compact' onMouseDown={e => e.stopPropagation()}>
            <div className='confirmTitle'>Xoá nhóm</div>
            <div className='confirmText'>
              Bạn có chắc muốn xoá nhóm{' '}
              <strong>"{savedGroups[deleteGroupConfirm]?.name}"</strong>?
            </div>
            <div className='confirmActions center'>
              <button className='modalBtn' onClick={() => setDeleteGroupConfirm(null)}>
                Huỷ
              </button>
              <button
                className='modalBtnDanger'
                onClick={() => {
                  const idx = deleteGroupConfirm
                  setSavedGroups(prev => {
                    const next = prev.filter((_, i) => i !== idx)
                    if (next.length === 0) {
                      try {
                        localStorage.setItem(SAVED_GROUPS_DELETED_ALL_KEY, '1')
                      } catch { }
                    }
                    return next
                  })
                  if (activeGroupIdx === idx) setActiveGroupIdx(null)
                  if (expandedGroupIdx === idx) setExpandedGroupIdx(null)
                  setDeleteGroupConfirm(null)
                }}
              >
                Xoá nhóm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* === Context menu nhóm (right-click) === */}
      {groupContextMenu && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999998 }}
          onMouseDown={() => setGroupContextMenu(null)}
        />
      )}
      {groupContextMenu && (
        <div
          className='contextMenuPanel'
          style={{
            position: 'fixed',
            top: Math.min(groupContextMenu.y, window.innerHeight - 120),
            left: Math.min(groupContextMenu.x, window.innerWidth - 180),
            zIndex: 999999,
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            className='ctxMenuItem'
            onClick={() => {
              setRenameGroupIdx(groupContextMenu.idx)
              setRenameGroupValue(savedGroups[groupContextMenu.idx]?.name || '')
              setGroupContextMenu(null)
            }}
          >
            Đổi tên nhóm
          </button>
          <button
            className='ctxMenuItem'
            onClick={() => {
              const idx = groupContextMenu.idx
              if (focusGroupIdx === idx) {
                setFocusGroupIdx(null)
              } else {
                setFocusGroupIdx(idx)
                setConnectSelection(new Set(savedGroups[idx].udids))
                setActiveGroupIdx(idx)
              }
              setGroupContextMenu(null)
            }}
          >
            {focusGroupIdx === groupContextMenu.idx ? '👁 Hiện tất cả' : '👁 Chỉ hiện nhóm này'}
          </button>
          {/* btn_set_wallpaper_group : Nút đặt số hiệu làm hình nền cho toàn bộ nhóm */}
          <button
            className='ctxMenuItem'
            style={{ color: '#2BD03C' }}
            onClick={() => {
              const group = savedGroups[groupContextMenu.idx]
              if (group && group.udids.length > 0) {
                handleSetWallpaperForDevices(group.udids)
              }
              setGroupContextMenu(null)
            }}
          >
            🖼️ Đặt số hiệu làm hình nền
          </button>
        </div>
      )}
      {contextMenuTarget ? (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}
          onClick={() => {
            setContextMenuTarget(null)
            setContextMenuOpen(false)
            setSubMenuOpen(false)
          }}
          onContextMenu={e => {
            e.preventDefault()
            setContextMenuTarget(null)
            setContextMenuOpen(false)
            setSubMenuOpen(false)
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: Math.min(contextMenuTarget.y, window.innerHeight - 200),
              left: Math.min(contextMenuTarget.x, window.innerWidth - 200),
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '6px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              minWidth: 180,
            }}
            onClick={e => e.stopPropagation()}
            onContextMenu={e => e.stopPropagation()}
          >
            {/* Header: Device # + input số inline trong suốt */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 8px 8px', borderBottom: '1px solid #2a2a2a', marginBottom: 4
            }}>
              <span style={{ fontSize: 12, color: '#666' }}>Device</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={contextMenuInput}
                onChange={e => {
                  // Chỉ cho nhập số
                  const val = e.target.value.replace(/[^0-9]/g, '')
                  setContextMenuInput(val)
                }}
                style={{
                  width: 44,
                  background: 'transparent',
                  color: '#fff',
                  border: 'none',
                  borderBottom: '1px solid #555',
                  outline: 'none',
                  fontSize: 15,
                  fontWeight: 700,
                  padding: '0 2px',
                  textAlign: 'center',
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const n = Math.max(1, parseInt(contextMenuInput, 10))
                    if (!isNaN(n)) setTileNumber(contextMenuTarget!.udid, n)
                    setContextMenuTarget(null)
                    setContextMenuOpen(false)
                  }
                }}
                onBlur={() => {
                  const n = Math.max(1, parseInt(contextMenuInput, 10))
                  if (!isNaN(n)) setTileNumber(contextMenuTarget!.udid, n)
                }}
              />
            </div>

            {/* btn_set_wallpaper_device : Nút đặt số hiệu làm hình nền */}
            <button
              className='ctxMenuItem'
              onPointerDown={e => {
                e.preventDefault()
                e.stopPropagation()
                const clickedUdid = contextMenuTarget!.udid
                const ctxTargets = connectSelection.size > 0 && connectSelection.has(clickedUdid)
                  ? Array.from(connectSelection)
                  : [clickedUdid]
                handleSetWallpaperForDevices(ctxTargets)
                setContextMenuTarget(null)
                setContextMenuOpen(false)
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#2BD03C',
                fontSize: '13px',
                cursor: 'pointer',
                padding: '7px 8px',
                textAlign: 'left',
                width: '100%',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(43,208,60,0.1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span>🖼️</span> <span>Đặt số hiệu làm hình nền</span>
            </button>

            {/* === Device Profile section === */}
            <div style={{ position: 'relative' }} className='ctxAddToGroupWrap' onMouseEnter={() => setCtxSub({ main: 'profileList' })} onMouseLeave={() => setCtxSub(null)}>
              <button
                style={{ background: 'transparent', border: 'none', color: '#7aadff', fontSize: '13px', cursor: 'pointer', padding: '7px 8px', textAlign: 'left', width: '100%', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(122,173,255,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                  <Users size={14} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {(() => {
                      const clickedUdid = contextMenuTarget!.udid;
                      const profile = deviceProfiles.find(p => p.udids.includes(clickedUdid));
                      if (profile) return 'Chọn profile';
                      return 'Chọn profile';
                    })()}
                  </span>
                </span>
                <span style={{ fontSize: 10, color: '#555' }}>▶</span>
              </button>

              {/* Level 2 Submenu: Profile list */}
              {ctxSub?.main === 'profileList' && (
                <div
                  className='ctxSubMenu'
                  style={{
                    display: 'flex',
                    position: 'absolute',
                    top: 0,
                    left: 'calc(100% - 4px)',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: 8,
                    padding: '4px',
                    flexDirection: 'column',
                    gap: 2,
                    minWidth: 200,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                    zIndex: 10
                  }}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                >
                  {/* Tạo Profile mới */}
                  <button
                    type='button'
                    style={{
                      background: 'transparent', border: 'none', color: '#cfcfcf',
                      fontSize: '13px', cursor: 'pointer', padding: '6px 10px', textAlign: 'left', borderRadius: 4,
                      display: 'none', alignItems: 'center', gap: 8, width: '100%'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    onPointerDown={e => {
                      e.preventDefault(); e.stopPropagation();
                      const clickedUdid = contextMenuTarget!.udid;
                      const ctxTargets = connectSelection.size > 0 && connectSelection.has(clickedUdid)
                        ? Array.from(connectSelection)
                        : [clickedUdid];

                      const hints = ctxTargets.map(u => {
                        const d = androidDeviceMap[u];
                        return d ? [d.manufacturer, d.model].filter(Boolean).join(' ') : '';
                      }).filter(Boolean);

                      setContextMenuTarget(null);
                      setContextMenuOpen(false);

                      setInputState({
                        key: `new-profile-${Date.now()}`,
                        title: 'Tạo Device Profile mới',
                        label: 'Tên Profile',
                        placeholder: 'Ví dụ: Samsung Note 9 Pixel ROM',
                        defaultValue: hints[0] || '',
                        onConfirm: (name) => {
                          createProfileForDevices(name, ctxTargets);
                          setInputState(null);
                        },
                      });
                    }}
                  >
                    <Plus size={14} /><span>Tạo Profile mới</span>
                  </button>

                  {deviceProfiles.length > 0 && <div style={{ height: 1, background: '#2a2a2a', margin: '4px 0' }} />}

                  {/* Danh sách profile */}
                  {deviceProfiles.map(profile => {
                    const clickedUdid = contextMenuTarget!.udid;
                    const ctxTargets = connectSelection.size > 0 && connectSelection.has(clickedUdid)
                      ? Array.from(connectSelection)
                      : [clickedUdid];
                    const isCurrentProfile = profile.udids.includes(clickedUdid);
                    const isL3Open = false;

                    return (
                      <div
                        key={profile.id}
                        style={{ position: 'relative' }}
                        onMouseEnter={() => setCtxSub({ main: 'profileList', nested: { type: 'profileActions', profileId: profile.id } })}
                        onMouseLeave={() => setCtxSub({ main: 'profileList' })}
                        onPointerDown={e => {
                          e.preventDefault(); e.stopPropagation();
                          if (isCurrentProfile) return;
                          assignDevicesToProfile(profile.id, ctxTargets);
                          setContextMenuTarget(null);
                          setContextMenuOpen(false);
                        }}
                      >
                        <button
                          type='button'
                          style={{
                            background: 'transparent', border: 'none',
                            color: isCurrentProfile ? '#7aadff' : '#cfcfcf',
                            fontSize: '13px', cursor: 'pointer',
                            padding: '6px 10px', textAlign: 'left', borderRadius: 4,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                            width: '100%'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {profile.name}
                          </span>
                          {isCurrentProfile ? <span style={{ fontSize: 11, color: '#7aadff' }}>Đang dùng</span> : null}
                        </button>

                        {/* Level 3 Submenu: Profile actions */}
                        {isL3Open && (
                          <div
                            className='ctxSubMenu'
                            style={{
                              display: 'flex',
                              position: 'absolute',
                              top: 0,
                              left: 'calc(100% - 4px)',
                              background: '#1a1a1a',
                              border: '1px solid #333',
                              borderRadius: 8,
                              padding: '4px',
                              flexDirection: 'column',
                              gap: 2,
                              minWidth: 200,
                              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                              zIndex: 11
                            }}
                            onMouseDown={e => e.stopPropagation()}
                            onClick={e => e.stopPropagation()}
                          >
                            {/* Gán vào Profile này */}
                            <button
                              type='button'
                              style={{
                                background: 'transparent', border: 'none', color: isCurrentProfile ? '#555' : '#cfcfcf',
                                fontSize: '13px', cursor: isCurrentProfile ? 'default' : 'pointer', padding: '6px 10px', textAlign: 'left', borderRadius: 4,
                                display: 'flex', alignItems: 'center', gap: 8, width: '100%'
                              }}
                              disabled={isCurrentProfile}
                              onMouseEnter={e => { if (!isCurrentProfile) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                              onPointerDown={e => {
                                e.preventDefault(); e.stopPropagation();
                                if (isCurrentProfile) return;
                                assignDevicesToProfile(profile.id, ctxTargets);
                                setContextMenuTarget(null);
                                setContextMenuOpen(false);
                              }}
                            >
                              <Users size={14} /><span>{isCurrentProfile ? 'Đang dùng Profile này' : 'Gán vào Profile này'}</span>
                            </button>

                            <div style={{ height: 1, background: '#2a2a2a', margin: '4px 0' }} />

                            {/* Đổi tên Profile */}
                            <button
                              type='button'
                              style={{
                                background: 'transparent', border: 'none', color: '#cfcfcf',
                                fontSize: '13px', cursor: 'pointer', padding: '6px 10px', textAlign: 'left', borderRadius: 4,
                                display: 'flex', alignItems: 'center', gap: 8, width: '100%'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                              onPointerDown={e => {
                                e.preventDefault(); e.stopPropagation();
                                setContextMenuTarget(null);
                                setContextMenuOpen(false);
                                setInputState({
                                  key: `rename-profile-${profile.id}`,
                                  title: 'Đổi tên Device Profile',
                                  label: 'Tên mới',
                                  defaultValue: profile.name,
                                  onConfirm: (newName) => {
                                    renameProfile(profile.id, newName);
                                    setInputState(null);
                                  },
                                });
                              }}
                            >
                              <Pencil size={14} /><span>Đổi tên Profile</span>
                            </button>

                            {/* Xoá Profile */}
                            <button
                              type='button'
                              style={{
                                background: 'transparent', border: 'none', color: '#ff6060',
                                fontSize: '13px', cursor: 'pointer', padding: '6px 10px', textAlign: 'left', borderRadius: 4,
                                display: 'flex', alignItems: 'center', gap: 8, width: '100%'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,96,96,0.1)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                              onPointerDown={e => {
                                e.preventDefault(); e.stopPropagation();
                                setContextMenuTarget(null);
                                setContextMenuOpen(false);
                                const bindingCount = AUTOMATION_APPS.reduce((sum, app) =>
                                  sum + (appActions[app.id] ?? []).reduce((s, a) => s + (a.bindings ?? []).filter(b => b.profileId === profile.id).length, 0), 0);
                                setConfirmState({
                                  title: 'Xoá Device Profile',
                                  message: `Xoá Device Profile "${profile.name}" sẽ gỡ toàn bộ máy khỏi Profile và xoá ${bindingCount} macro binding đã gán cho Profile này.\n\nFile macro gốc vẫn được giữ.\n\nBạn có chắc muốn xoá không?`,
                                  danger: true,
                                  onConfirm: () => {
                                    deleteProfileImpl(profile.id);
                                  },
                                });
                              }}
                            >
                              <Trash2 size={14} /><span>Xoá Profile</span>
                            </button>

                            {/* Divider cho macro binding */}
                            <div style={{ height: 1, background: '#2a2a2a', margin: '4px 0' }} />

                            {/* Gán macro cho profile */}
                            {AUTOMATION_APPS.map(app => {
                              const actions = appActions[app.id] ?? [];
                              if (!actions.length) return null;
                              const isAppOpen = ctxSub?.nested && typeof ctxSub.nested === 'object' && ctxSub.nested.type === 'profileActions' && ctxSub.nested.profileId === profile.id && ctxSub.nested.appId === app.id;
                              return (
                                <div
                                  key={`app-${app.id}`}
                                  style={{ position: 'relative' }}
                                  onMouseEnter={() => setCtxSub({
                                    main: 'profileList',
                                    nested: { type: 'profileActions', profileId: profile.id, appId: app.id }
                                  })}
                                  onMouseLeave={() => setCtxSub({
                                    main: 'profileList',
                                    nested: { type: 'profileActions', profileId: profile.id }
                                  })}
                                >
                                  <button
                                    type='button'
                                    style={{
                                      background: 'transparent', border: 'none', color: '#cfcfcf',
                                      fontSize: '12px', cursor: 'pointer', padding: '5px 10px', textAlign: 'left', borderRadius: 4,
                                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                                  >
                                    <span>{app.label}</span>
                                    <span style={{ fontSize: 10, color: '#555' }}>▶</span>
                                  </button>

                                  {isAppOpen && (
                                    <div
                                      className='ctxSubMenu'
                                      style={{
                                        display: 'flex',
                                        position: 'absolute',
                                        top: 0,
                                        left: 'calc(100% - 4px)',
                                        background: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: 8,
                                        padding: '4px',
                                        flexDirection: 'column',
                                        gap: 2,
                                        minWidth: 180,
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                                        zIndex: 12
                                      }}
                                    >
                                      {actions.map(action => {
                                        const binding = action.bindings?.find(b => b.profileId === profile.id);
                                        const isActionOpen = ctxSub?.nested && typeof ctxSub.nested === 'object' && ctxSub.nested.type === 'profileActions' && ctxSub.nested.profileId === profile.id && ctxSub.nested.appId === app.id && ctxSub.nested.actionId === action.id;
                                        return (
                                          <div
                                            key={`act-${action.id}`}
                                            style={{ position: 'relative' }}
                                            onMouseEnter={() => setCtxSub({
                                              main: 'profileList',
                                              nested: { type: 'profileActions', profileId: profile.id, appId: app.id, actionId: action.id }
                                            })}
                                            onMouseLeave={() => setCtxSub({
                                              main: 'profileList',
                                              nested: { type: 'profileActions', profileId: profile.id, appId: app.id }
                                            })}
                                          >
                                            <button
                                              type='button'
                                              style={{
                                                background: 'transparent', border: 'none', color: binding ? '#7aadff' : '#cfcfcf',
                                                fontSize: '12px', cursor: 'pointer', padding: '5px 10px', textAlign: 'left', borderRadius: 4,
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%'
                                              }}
                                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                                            >
                                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {action.name} {binding ? `(${binding.macroName})` : ''}
                                              </span>
                                              <span style={{ fontSize: 10, color: '#555' }}>▶</span>
                                            </button>

                                            {isActionOpen && (
                                              <div
                                                className='ctxSubMenu'
                                                style={{
                                                  display: 'flex',
                                                  position: 'absolute',
                                                  top: 0,
                                                  left: 'calc(100% - 4px)',
                                                  background: '#1a1a1a',
                                                  border: '1px solid #333',
                                                  borderRadius: 8,
                                                  padding: '4px',
                                                  flexDirection: 'column',
                                                  gap: 2,
                                                  minWidth: 200,
                                                  maxHeight: 250,
                                                  overflowY: 'auto',
                                                  boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                                                  zIndex: 13
                                                }}
                                              >
                                                {binding && (
                                                  <>
                                                    <button
                                                      type='button'
                                                      style={{
                                                        background: 'transparent', border: 'none', color: '#ff6060',
                                                        fontSize: '12px', cursor: 'pointer', padding: '5px 10px', textAlign: 'left', borderRadius: 4,
                                                        display: 'flex', alignItems: 'center', gap: 6, width: '100%'
                                                      }}
                                                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,96,96,0.1)' }}
                                                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                                                      onPointerDown={e => {
                                                        e.preventDefault(); e.stopPropagation();
                                                        setContextMenuTarget(null);
                                                        setContextMenuOpen(false);
                                                        setConfirmState({
                                                          title: 'Xoá gán macro',
                                                          message: `Xoá gán macro "${binding.macroName}" khỏi hành động "${action.name}" cho Device Profile "${profile.name}".\n\nFile macro gốc vẫn được giữ.\n\nBạn có chắc muốn xoá không?`,
                                                          onConfirm: () => {
                                                            removeBindingImpl(app.id, action.id, profile.id);
                                                          }
                                                        });
                                                      }}
                                                    >
                                                      <Trash2 size={12} /><span>Xoá gán macro</span>
                                                    </button>
                                                    <div style={{ height: 1, background: '#2a2a2a', margin: '4px 0' }} />
                                                  </>
                                                )}

                                                {savedMacros.map(macro => (
                                                  <button
                                                    key={macro.id}
                                                    type='button'
                                                    style={{
                                                      background: 'transparent', border: 'none', color: binding?.macroId === macro.id ? '#7aadff' : '#cfcfcf',
                                                      fontSize: '12px', cursor: binding?.macroId === macro.id ? 'default' : 'pointer', padding: '5px 10px', textAlign: 'left', borderRadius: 4,
                                                      width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                    }}
                                                    disabled={binding?.macroId === macro.id}
                                                    onMouseEnter={e => { if (binding?.macroId !== macro.id) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                                                    onPointerDown={e => {
                                                      e.preventDefault(); e.stopPropagation();
                                                      if (binding?.macroId === macro.id) return;
                                                      assignMacroToAction(app.id, action.id, macro, profile);
                                                      setContextMenuTarget(null);
                                                      setContextMenuOpen(false);
                                                    }}
                                                  >
                                                    {macro.name}
                                                  </button>
                                                ))}
                                                {savedMacros.length === 0 && (
                                                  <button type='button' style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '12px', padding: '5px 10px', textAlign: 'left' }} disabled>
                                                    Chưa có File Macro
                                                  </button>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* === Thêm vào nhóm (submenu) — hiện khi có nhóm đã tạo === */}
            {savedGroups.length > 0 && (
              <div style={{ position: 'relative' }} className='ctxAddToGroupWrap' onMouseEnter={() => setSubMenuOpen(true)} onMouseLeave={() => setSubMenuOpen(false)}>
                <button
                  style={{ background: 'transparent', border: 'none', color: '#7aadff', fontSize: '13px', cursor: 'pointer', padding: '7px 8px', textAlign: 'left', width: '100%', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(122,173,255,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span>Thêm vào nhóm</span>
                  <span style={{ fontSize: 10, color: '#555' }}>▶</span>
                </button>
                {/* Submenu nhóm */}
                <div
                  className='ctxSubMenu'
                  style={{
                    display: subMenuOpen ? 'flex' : 'none',
                    position: 'absolute',
                    top: 0,
                    left: 'calc(100% - 4px)',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: 8,
                    padding: '4px',
                    flexDirection: 'column',
                    gap: 2,
                    minWidth: 160,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                    zIndex: 10
                  }}
                >
                  {savedGroups.map((grp, gIdx) => {
                    const alreadyIn = grp.udids.includes(contextMenuTarget.udid)
                    return (
                      <button
                        key={gIdx}
                        style={{
                          background: 'transparent', border: 'none',
                          color: alreadyIn ? '#555' : '#cfcfcf',
                          fontSize: '13px', cursor: alreadyIn ? 'default' : 'pointer',
                          padding: '6px 10px', textAlign: 'left', borderRadius: 4,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
                        }}
                        onMouseEnter={e => { if (!alreadyIn) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        onPointerDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (alreadyIn) return

                          // Lấy tất cả device đang được chọn (connectSelection)
                          // Nếu device click chuột phải không nằm trong selection → chỉ thêm 1 device đó
                          // Nếu device click chuột phải nằm trong selection → thêm tất cả device đang chọn
                          const clickedUdid = contextMenuTarget!.udid
                          const selectedUdids = connectSelection.size > 0 && connectSelection.has(clickedUdid)
                            ? Array.from(connectSelection)
                            : [clickedUdid]

                          setSavedGroups(prev => prev.map((g, i) => {
                            if (i !== gIdx) return g
                            // Gộp, loại trùng
                            const existingSet = new Set(g.udids)
                            const toAdd = selectedUdids.filter(u => !existingSet.has(u))
                            return { ...g, udids: [...g.udids, ...toAdd] }
                          }))

                          setContextMenuTarget(null)
                          setContextMenuOpen(false)
                        }}
                      >
                        <span>{grp.name}</span>
                        <span style={{ fontSize: 11, color: '#555' }}>
                          {(() => {
                            const clickedUdid = contextMenuTarget!.udid
                            const selectedUdids = connectSelection.size > 0 && connectSelection.has(clickedUdid)
                              ? Array.from(connectSelection)
                              : [clickedUdid]
                            const existingSet = new Set(grp.udids)
                            const countToAdd = selectedUdids.filter(u => !existingSet.has(u)).length
                            if (alreadyIn && countToAdd === 0) return '✓ Đã có'
                            return countToAdd > 1 ? `+${countToAdd} device` : alreadyIn ? '✓ Đã có' : `+1`
                          })()}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* === Xoá khỏi nhóm — hiện khi click từ grid dropdown nhóm, HOẶC khi đang load nhóm và click từ grid tổng === */}
            {contextMenuTarget.groupIdx !== undefined && (() => {
              const grp = savedGroups[contextMenuTarget.groupIdx]
              const isInGroup = grp?.udids.includes(contextMenuTarget.udid)
              if (!isInGroup) return null
              return (
                <button
                  style={{ background: 'transparent', border: 'none', color: '#ff6060', fontSize: '13px', cursor: 'pointer', padding: '7px 8px', textAlign: 'left', width: '100%', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,96,96,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const { udid, groupIdx } = contextMenuTarget!;
                    if (groupIdx === undefined) return;
                    const groupName = savedGroups[groupIdx]?.name || '';

                    setConfirmState({
                      title: 'Xoá khỏi nhóm?',
                      message: `Bạn có chắc chắn muốn xoá device này khỏi nhóm "${groupName}" không?`,
                      danger: true,
                      onConfirm: () => {
                        setSavedGroups(prev =>
                          prev.map((g, i) =>
                            i === groupIdx
                              ? { ...g, udids: g.udids.filter(u => u !== udid) }
                              : g
                          )
                        );

                        if (activeGroupIdx === groupIdx || focusGroupIdx === groupIdx) {
                          setConnectSelection(prev => {
                            const next = new Set(prev);
                            next.delete(udid);
                            return next;
                          });
                        }
                      }
                    });

                    setContextMenuTarget(null);
                    setContextMenuOpen(false);
                    setSubMenuOpen(false);
                  }}
                >
                  <span>🗑</span> Xoá khỏi nhóm <strong style={{ color: '#ff8080', fontSize: 11 }}>"{savedGroups[contextMenuTarget.groupIdx!]?.name}"</strong>
                </button>
              )
            })()}
          </div>
        </div>
      ) : null}

      {/* === Badge tổng số device đang chọn (góc dưới trái) === */}
      {connectSelection.size > 0 && (
        <div className="selectedCountBadge">
          <span className="selectedCountBadgeIcon">📱</span>
          <span className="selectedCountBadgeNum">{connectSelection.size}</span>
        </div>
      )}

      {/* === Floating Badge số device theo con trỏ chuột (tối ưu hiệu năng) === */}
      <div
        ref={selectionBadgeRef}
        className={`selectionFloatingBadge${selectedVisible.length >= 2 ? ' visible' : ''}`}
        aria-hidden={selectedVisible.length < 2}
      >
        {selectedVisible.length}
      </div>

      {confirmState && (
        <div className="confirmOverlay" onMouseDown={() => setConfirmState(null)}>
          <div className={`confirmPanel${confirmState.danger ? ' compact' : ''}`} onMouseDown={e => e.stopPropagation()}>
            <div className="confirmTitle">
              {confirmState.title}
            </div>
            <div className="confirmText">
              {confirmState.message}
            </div>
            <div className={`confirmActions${confirmState.danger ? ' center' : ''}`}>
              <button className="modalBtn" onClick={() => setConfirmState(null)}>
                {confirmState.cancelText || 'Huỷ'}
              </button>
              <button
                className={confirmState.danger ? 'modalBtnDanger' : 'modalBtnPrimary'}
                onClick={() => {
                  const fn = confirmState.onConfirm;
                  setConfirmState(null);
                  fn();
                }}
              >
                {confirmState.confirmText || 'Xác Nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
      {inputState && (
        <InputModalOverlay state={inputState} onClose={() => setInputState(null)} />
      )}
      {syncTimeModalOpen ? (
        <SyncTimeSettingsModal
          settings={syncTimeSettings}
          delayRange={syncDelayRange}
          onChange={updateSyncTimeSettings}
          onClose={() => setSyncTimeModalOpen(false)}
        />
      ) : null}
      {deviceAccountOverlayMounted && (
        <DeviceAccountOverlay
          open={deviceAccountOverlayOpen}
          onClose={() => setDeviceAccountOverlayOpen(false)}
          registeredUdids={registeredUdids}
          connectedUdids={connectedUdids}
          orderMap={orderMap}
          androidDeviceMap={androidDeviceMap}
          search={davSearch}
          setSearch={setDavSearch}
          activeFilter={davActiveFilter}
          setActiveFilter={setDavActiveFilter}
          activeTab={davActiveTab}
          setActiveTab={setDavActiveTab}
          onOpenDeviceViewer={openDeviceViewerFromAccountOverlay}
        />
      )}
    </>
  )
}

interface InputModalOverlayProps {
  state: {
    key: string;
    title: string;
    label?: string;
    placeholder?: string;
    defaultValue?: string;
    onConfirm: (val: string) => void;
  } | null;
  onClose: () => void;
}

function InputModalOverlay({ state, onClose }: InputModalOverlayProps) {
  if (!state) return null;
  return <InputModalOverlayInner key={state.key} state={state} onClose={onClose} />;
}

function InputModalOverlayInner({ state, onClose }: { state: NonNullable<InputModalOverlayProps['state']>; onClose: () => void }) {
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
                cursor: value.trim() ? 'pointer' : 'not-allowed'
              }}
              disabled={!value.trim()}
              onClick={handleSubmit}
            >
              Xác Nhận
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
