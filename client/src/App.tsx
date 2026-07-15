import React, { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react'
import { createPortal } from 'react-dom'
import { DeviceAccountOverlay } from '@/components/DeviceAccountOverlay'
import { saveHotkeySettingToBackend, saveBackendSetting } from '@/lib/backendSettings'
import { loadDeviceAccountVault, getDeviceAccountDataFromVault, getDeviceAccountData, saveDeviceAccountData, type VaultData, type PlatformType, type WeChatAccount } from '@/lib/deviceAccountVault'
import { hasNearbyRelevantAccount, getNearestNearbyHours, getNearbyAccountGroupState } from '@/lib/deviceAccountNearby'
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
import { MacroPlaybackPanel } from '@/components/MacroPlaybackPanel'
import { applyThemeOverrides, loadThemeOverrides } from '@/lib/themeInspector'
import { useActive } from '@/context/ActiveContext'
import { AndroidKeycode } from '@/lib/keyEvent'
import {
  encodeKeycodeMessage,
  encodeSetScreenPowerModeMessage,
  KeyEventAction,
  ScreenPowerMode
} from '@/lib/control'
import {
  installApk,
  installUploadedApk,
  runAdbCommandApi,
  setDeviceDisplayPower
} from '@/lib/serverApi'
import { SyncPanel } from '@/components/SyncPanel'
import { NotesModal, type Note } from '@/components/NotesModal'
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
import type { ConnectionMode, ConnectionState, StreamReloadOptions } from '@/components/tile/types'
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
  Bell,
  Bot,
  Camera,
  ChevronDown,
  ChevronUp,
  Clock3,
  MonitorOff,
  Monitor,
  Pin,
  PinOff,
  Package,
  RotateCcw,
  Settings,
  Notebook,
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
type RemoteDeviceEndpoint = { udid: string; type: ConnectionState }
type RemoteDevice = {
  udid: string
  type: ConnectionState
  endpoints: Partial<Record<ConnectionMode, string>>
}
const CONNECTION_MODES: ConnectionMode[] = ['adb', 'wifi']

const CONNECT_CHECK_DEVICE_MESSAGE =
  'Please check that the device is properly plugged into the host'
const QUICK_ACTION_ORDER_KEY = 'quickActionOrder'
const SAVED_GROUPS_KEY = 'savedGroups'
const STREAM_CONFIG_KEY = 'streamConfig'
const VIEWER_STREAM_CONFIG_KEY = 'viewerStreamConfig'
const SAVED_GROUPS_BACKUP_KEY = 'savedGroupsBackupV1'
const SAVED_GROUPS_DELETED_ALL_KEY = 'savedGroupsDeletedAllV1'
const PREFERRED_CONNECTION_BY_UDID_KEY = 'monviewphone:preferred-connection-by-udid'

type SavedDeviceGroup = { name: string; udids: string[]; selectedAccounts?: Record<string, string> }

function normalizeEncoderConfig(cfg: StreamConfig): StreamConfig {
  const rawMode = cfg.encoderMode
  const encoderMode =
    rawMode === 'hardware' || rawMode === 'software' || rawMode === 'custom'
      ? rawMode
      : 'auto'
  return {
    ...cfg,
    engine: 'tango-scrcpy',
    encoderMode,
    encoderName: encoderMode === 'custom' ? cfg.encoderName : undefined
  }
}

function readStoredStreamConfig(key: string, fallback: StreamConfig): StreamConfig {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return normalizeEncoderConfig(fallback)
    const parsed = JSON.parse(saved)
    if (
      parsed &&
      typeof parsed.bitrate === 'number' &&
      typeof parsed.maxFps === 'number' &&
      typeof parsed.bounds?.width === 'number' &&
      typeof parsed.bounds?.height === 'number'
    ) {
      return normalizeEncoderConfig({
        ...fallback,
        ...parsed,
        bounds: { ...fallback.bounds, ...parsed.bounds }
      })
    }
  } catch {}
  return normalizeEncoderConfig(fallback)
}

function normalizeConnectionMode(device: string, connectType: string): ConnectionState {
  const ct = connectType.toLowerCase()
  if (ct.includes('wifi')) return 'wifi'
  if (ct.includes('usb') || ct.includes('adb')) return 'adb'
  if (device.includes(':')) return 'wifi'
  return 'adb'
}

function connectionModeToDeviceFilter(mode: ConnectionState): 'usb' | 'wifi' | 'unknown' {
  if (mode === 'adb') return 'usb'
  return mode
}

function chooseRemoteDeviceMode(
  endpoints: Partial<Record<ConnectionMode, string>>,
  preferred?: ConnectionMode
): ConnectionState {
  if (preferred && endpoints[preferred]) return preferred
  if (endpoints.adb) return 'adb'
  if (endpoints.wifi) return 'wifi'
  return 'unknown'
}

function readPreferredConnections(): Record<string, ConnectionMode> {
  try {
    const raw = localStorage.getItem(PREFERRED_CONNECTION_BY_UDID_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, ConnectionMode> = {}
    Object.entries(parsed).forEach(([key, value]) => {
      const id = key.trim()
      if (!id) return
      if (value === 'adb' || value === 'wifi') out[id] = value
    })
    return out
  } catch {
    return {}
  }
}

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

    const selectedAccounts: Record<string, string> = {}
    const rawAccounts = (item as any).selectedAccounts
    if (rawAccounts && typeof rawAccounts === 'object') {
      for (const [k, v] of Object.entries(rawAccounts)) {
        if (typeof v === 'string') {
          selectedAccounts[k] = v
        }
      }
    }

    out.push({ name, udids, selectedAccounts })
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

  // V2 migration: groups were stored only in browser localStorage, not in Data.db.
  // If a previous empty V2 run wrote savedGroups=[] or savedGroupsDeletedAllV1=1,
  // still prefer the non-empty backup from the old MonViewPhone origin.
  try {
    const backupRaw = localStorage.getItem(SAVED_GROUPS_BACKUP_KEY)
    if (backupRaw) {
      const parsed = JSON.parse(backupRaw)
      const backupGroups = normalizeSavedGroups(parsed?.groups ?? parsed)
      if (backupGroups.length > 0) {
        localStorage.removeItem(SAVED_GROUPS_DELETED_ALL_KEY)
        localStorage.setItem(SAVED_GROUPS_KEY, JSON.stringify(backupGroups))
        return backupGroups
      }
    }
  } catch {
    // continue to deleted marker check
  }

  if (localStorage.getItem(SAVED_GROUPS_DELETED_ALL_KEY) === '1') return []

  return []
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
  | 'physicalScreenOn'
  | 'physicalScreenOff'
  | 'screenOff'
  | 'mute'
  | 'soundOn'
  | 'maxVolume'
  | 'syncTime'
  | 'automation'

// DEFAULT_QUICK_ACTION_ORDER : Thứ tự mặc định các phím tắt nhanh
const DEFAULT_QUICK_ACTION_ORDER: QuickActionId[] = [
  'physicalScreenOn',
  'physicalScreenOff',
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
    
    const parsedIds = parsed as string[]
    const expanded: string[] = []

    for (const id of parsedIds) {
      if (id === 'physicalScreenToggle') {
        if (!expanded.includes('physicalScreenOn')) expanded.push('physicalScreenOn')
        if (!expanded.includes('physicalScreenOff')) expanded.push('physicalScreenOff')
        continue
      }

      if (id === 'stayAwakeOn') {
        if (!expanded.includes('physicalScreenOff')) expanded.push('physicalScreenOff')
        continue
      }

      expanded.push(id)
    }

    const allowed = new Set<string>(DEFAULT_QUICK_ACTION_ORDER)
    const filtered = expanded.filter((id): id is QuickActionId => allowed.has(id))
    
    const out: QuickActionId[] = []
    for (const id of filtered) {
      if (!out.includes(id)) {
        out.push(id)
      }
    }
    
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
    a.displayId === b.displayId &&
    (a.engine || 'auto') === (b.engine || 'auto') &&
    (a.encoderMode || 'auto') === (b.encoderMode || 'auto') &&
    (a.encoderName || '') === (b.encoderName || '') &&
    (a.codecOptions || '') === (b.codecOptions || '')
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
  const [accountManagerOpen, setAccountManagerOpen] = useState(false)

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
    if (deviceAccountOverlayOpen || accountManagerOpen) {
      setDeviceAccountOverlayMounted(true)
    }
  }, [deviceAccountOverlayOpen, accountManagerOpen])

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
      if (document.activeElement?.classList.contains('account-search-input')) {
        return;
      }
      const active = document.activeElement?.nodeName.toLowerCase();
      if (
        ['input', 'textarea', 'select'].includes(active || '') ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const hotkeyStr = localStorage.getItem('monviewphone:inspector-id-hotkey') || 'Ctrl+Shift+I';
      if (hotkeyStr && matchesHotkey(e, hotkeyStr)) {
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
    return readStoredStreamConfig(STREAM_CONFIG_KEY, STREAM_CONFIG)
  })
  const reloadMap = useRef<Map<string, (opts?: StreamReloadOptions) => void>>(new Map())

  const [viewerStreamConfig, setViewerStreamConfig] = useState<StreamConfig>(() => {
    const width = 1000
    const baseAspect =
      STREAM_CONFIG.bounds.width && STREAM_CONFIG.bounds.height
        ? STREAM_CONFIG.bounds.height / STREAM_CONFIG.bounds.width
        : 16 / 9

    const fallback = {
      ...STREAM_CONFIG,
      bitrate: 8_388_608,
      maxFps: 60,
      bounds: {
        width,
        height: Math.round(width * baseAspect)
      }
    }
    return readStoredStreamConfig(VIEWER_STREAM_CONFIG_KEY, fallback)
  })

  useEffect(() => {
    try {
      localStorage.setItem(VIEWER_STREAM_CONFIG_KEY, JSON.stringify(normalizeEncoderConfig(viewerStreamConfig)))
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

  const handleViewDevice = useCallback((id: string) => {
    setViewerUdid(prev => prev === id ? null : id)
  }, [])

  const handleDragStart = useCallback((id: string) => {
    setDraggingTile(id)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingTile(null)
  }, [])

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

  // ===== ACCOUNT MANAGER MODAL HOTKEY =====
  const [accountManagerHotkey, setAccountManagerHotkey] = useState(() => localStorage.getItem('monviewphone:account-manager-hotkey') || 'Alt+M');

  const handleAccountManagerHotkeyInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
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
    setAccountManagerHotkey(newHotkey);
    localStorage.setItem('monviewphone:account-manager-hotkey', newHotkey);
    saveHotkeySettingToBackend('monviewphone:account-manager-hotkey', newHotkey);
  }, []);

  // ===== OVERLAY HEADER HOTKEY =====
  // Hotkey này toggle deviceAccountOverlayOpen (bảng overlay nổi trên từng tile)
  const [overlayHeaderHotkey, setOverlayHeaderHotkey] = useState(() => localStorage.getItem('monviewphone:overlay-header-hotkey') || '');

  const handleOverlayHeaderHotkeyInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
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
    setOverlayHeaderHotkey(newHotkey);
    localStorage.setItem('monviewphone:overlay-header-hotkey', newHotkey);
    saveHotkeySettingToBackend('monviewphone:overlay-header-hotkey', newHotkey);
  }, []);

  // ===== INSPECTOR ID HOTKEY =====
  const [inspectorIdHotkey, setInspectorIdHotkey] = useState(() => localStorage.getItem('monviewphone:inspector-id-hotkey') || 'Ctrl+Shift+I');

  const handleInspectorIdHotkeyInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
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
    setInspectorIdHotkey(newHotkey);
    localStorage.setItem('monviewphone:inspector-id-hotkey', newHotkey);
    saveHotkeySettingToBackend('monviewphone:inspector-id-hotkey', newHotkey);
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
  const activeViewerStreamUdidRef = useRef<string | null>(null)

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
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
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
      localStorage.setItem(STREAM_CONFIG_KEY, JSON.stringify(normalizeEncoderConfig(streamConfig)))
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
  const [preferredConnectionByLogicalUdid, setPreferredConnectionByLogicalUdid] =
    useState<Record<string, ConnectionMode>>(() => readPreferredConnections())
  const preferredConnectionRef = useRef(preferredConnectionByLogicalUdid)
  const remoteDeviceLastSeenRef = useRef<Map<string, number>>(new Map())
  const wsDevicesRef = useRef<WebSocket | null>(null)
  const [connectSelection, setConnectSelection] = useState<Set<string>>(
    () => new Set(syncTargets)
  )
  const [runningMacroUdids, setRunningMacroUdids] = useState<Set<string>>(new Set())


  useEffect(() => {
    preferredConnectionRef.current = preferredConnectionByLogicalUdid
    try {
      localStorage.setItem(
        PREFERRED_CONNECTION_BY_UDID_KEY,
        JSON.stringify(preferredConnectionByLogicalUdid)
      )
    } catch { }
  }, [preferredConnectionByLogicalUdid])

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



  type CtxSubState = null | {
    main: 'profileList' | 'setAccountList' | { appId: AutomationAppId; actionId: string };
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

  const [blacklistedUdids, setBlacklistedUdids] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('blacklistedUdids')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  useEffect(() => {
    try {
      localStorage.setItem('blacklistedUdids', JSON.stringify(blacklistedUdids))
    } catch { }
  }, [blacklistedUdids])

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
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [activeReminderNote, setActiveReminderNote] = useState<Note | null>(null)
  const [reminderOpenNoteId, setReminderOpenNoteId] = useState<string | null>(null)
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

  // Background note reminder checker
  useEffect(() => {
    const checkReminders = () => {
      try {
        const savedNotesStr = localStorage.getItem('monviewphone:notes');
        if (!savedNotesStr) return;
        const currentNotes: Note[] = JSON.parse(savedNotesStr);
        const now = Date.now();
        
        // Find notes that have a reminder time and the time is due (past or current)
        const dueNote = currentNotes.find(note => {
          if (!note.reminderTime) return false;
          const reminderMs = new Date(note.reminderTime).getTime();
          return reminderMs <= now;
        });

        if (dueNote) {
          // Play a notification sound
          try {
            const audio = new Audio('/audio/notification_new.mp3');
            audio.play().catch(err => console.log('Audio playback prevented', err));
          } catch (e) {
            console.error('Audio play error', e);
          }

          // Show reminder alert modal
          setActiveReminderNote(dueNote);

          // Clear this reminder time from notes so it doesn't trigger again
          const updatedNotes = currentNotes.map(n => {
            if (n.id === dueNote.id) {
              const { reminderTime, ...rest } = n;
              return rest; // remove reminderTime
            }
            return n;
          });
          localStorage.setItem('monviewphone:notes', JSON.stringify(updatedNotes));
          
          // Dispatch custom event to notify NotesModal if it's currently open
          window.dispatchEvent(new CustomEvent('monviewphone:notes-updated-internal', { detail: updatedNotes }));
        }
      } catch (err) {
        console.error('Error in notes reminder checker:', err);
      }
    };

    // Check every 5 seconds
    const interval = setInterval(checkReminders, 5000);
    // Also check immediately on mount
    checkReminders();

    return () => clearInterval(interval);
  }, []);

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
      const isClickOnContextMenu =
        target.closest('.react-contexify') ||
        target.closest('.context-menu') ||
        target.closest('.contextMenuPanel') ||
        target.closest('.pageContextLayer');

      // 3. If clicking outside context menu, ensure it closes
      if (!isClickOnContextMenu && contextMenuOpen) {
        setContextMenuOpen(false);
        setContextMenuTarget(null);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenuOpen]);



  const [connectModalOpen, setConnectModalOpen] = useState(false)

  // ===== SAVED GROUPS =====
  const [savedGroups, setSavedGroups] = useState<SavedDeviceGroup[]>(loadSavedGroups)

  useEffect(() => {
    try {
      const normalized = normalizeSavedGroups(savedGroups)
      const currentInStorageStr = localStorage.getItem(SAVED_GROUPS_KEY)
      const normalizedStr = JSON.stringify(normalized)
      if (currentInStorageStr !== normalizedStr) {
        localStorage.setItem(SAVED_GROUPS_KEY, normalizedStr)
        if (normalized.length > 0) {
          localStorage.removeItem(SAVED_GROUPS_DELETED_ALL_KEY)
          backupSavedGroups(normalized)
          saveBackendSetting(SAVED_GROUPS_KEY, normalizedStr)
        }
        window.dispatchEvent(new Event('saved-groups-updated'));
      }
    } catch { }
  }, [savedGroups])

  useEffect(() => {
    const handleUpdate = () => {
      const newGroups = loadSavedGroups();
      setSavedGroups(prev => {
        if (JSON.stringify(prev) === JSON.stringify(newGroups)) {
          return prev;
        }
        return newGroups;
      });
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



  useEffect(() => {
    const handleUpdate = () => {
      setVault(loadDeviceAccountVault());
    };
    window.addEventListener('monviewphone:dav-hide-settings-changed', handleUpdate);
    return () => window.removeEventListener('monviewphone:dav-hide-settings-changed', handleUpdate);
  }, []);

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
  const groupClickTimeoutRef = useRef<any>(null)
  const lastGroupClickIdxRef = useRef<number | null>(null)
  const overlayHeaderHotkeyTimerRef = useRef<any>(null);
  const overlayHeaderHotkeyHeldRef = useRef<boolean>(false);
  const overlayHeaderHotkeyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (groupClickTimeoutRef.current) {
        clearTimeout(groupClickTimeoutRef.current)
      }
      if (overlayHeaderHotkeyTimerRef.current) {
        clearTimeout(overlayHeaderHotkeyTimerRef.current)
      }
    }
  }, [])

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
        if (connectType === 'wifi') {
          return null
        }
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
      if (!payload.length) return []
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
        return results
      } catch (err: any) {
        setConnectNotification({
          type: 'error',
          text: `${t('Connect failed: {error}', {
            error: err?.message ?? t('Connect failed')
          })} ${t(CONNECT_CHECK_DEVICE_MESSAGE)}`
        })
        return []
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

  // Solumate-style viewer profile:
  // - Open viewer: reload only that tile so scrcpy starts with viewerStreamConfig.
  // - Close/switch viewer: reload previous tile so it returns to global streamConfig.
  useEffect(() => {
    const previousViewerUdid = activeViewerStreamUdidRef.current
    const timers: number[] = []
    const scheduleReload = (udid: string) => {
      const timer = window.setTimeout(() => {
        try {
          reloadMap.current.get(udid)?.({ restart: true, silent: true })
        } catch {
          // ignore reload errors; tile reconnect watchdog still handles failures
        }
      }, 80)
      timers.push(timer)
    }

    if (viewerUdid) {
      if (previousViewerUdid && previousViewerUdid !== viewerUdid) {
        scheduleReload(previousViewerUdid)
      }
      activeViewerStreamUdidRef.current = viewerUdid
      scheduleReload(viewerUdid)
    } else if (previousViewerUdid) {
      activeViewerStreamUdidRef.current = null
      scheduleReload(previousViewerUdid)
    }

    return () => {
      timers.forEach(timer => window.clearTimeout(timer))
    }
  }, [viewerUdid, viewerStreamConfig])

  const PHONE_SHELL_RATIO = 20 / 9;
  const DEFAULT_DIMS: TileDims = { width: 205, height: Math.round(205 * PHONE_SHELL_RATIO) }

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

  const remoteDeviceByUdid = useMemo(() => {
    const map = new Map<string, RemoteDevice>()
    remoteDevices.forEach(device => {
      map.set(device.udid, device)
    })
    return map
  }, [remoteDevices])

  const endpointLogicalByUdid = useMemo(() => {
    const map = new Map<string, string>()
    remoteDevices.forEach(device => {
      CONNECTION_MODES.forEach(mode => {
        const endpoint = device.endpoints[mode]
        if (endpoint && endpoint !== device.udid) {
          map.set(endpoint, device.udid)
        }
      })
    })
    return map
  }, [remoteDevices])

  const endpointAliasUdids = useMemo(
    () => Array.from(endpointLogicalByUdid.keys()),
    [endpointLogicalByUdid]
  )

  const getConnectionEndpoints = useCallback(
    (logicalUdid: string): Partial<Record<ConnectionMode, boolean>> => {
      const endpoints = remoteDeviceByUdid.get(logicalUdid)?.endpoints
      return {
        adb: Boolean(endpoints?.adb),
        wifi: Boolean(endpoints?.wifi)
      }
    },
    [remoteDeviceByUdid]
  )

  const getCurrentConnectionMode = useCallback(
    (logicalUdid: string): ConnectionState => {
      const remoteDevice = remoteDeviceByUdid.get(logicalUdid)
      if (remoteDevice) {
        return chooseRemoteDeviceMode(
          remoteDevice.endpoints,
          preferredConnectionByLogicalUdid[logicalUdid]
        )
      }
      if (logicalUdid.includes(':')) return 'wifi'
      return 'adb'
    },
    [preferredConnectionByLogicalUdid, remoteDeviceByUdid]
  )

  const getStreamEndpointUdid = useCallback(
    (logicalUdid: string): string => {
      const remoteDevice = remoteDeviceByUdid.get(logicalUdid)
      if (!remoteDevice) return logicalUdid
      const mode = getCurrentConnectionMode(logicalUdid)
      if (mode !== 'unknown' && remoteDevice.endpoints[mode]) {
        return remoteDevice.endpoints[mode]!
      }
      return remoteDevice.endpoints.adb ?? remoteDevice.endpoints.wifi ?? logicalUdid
    },
    [getCurrentConnectionMode, remoteDeviceByUdid]
  )

  const switchConnectionForDevices = useCallback(
    (logicalUdids: string[], mode: ConnectionMode) => {
      const targets = Array.from(new Set(logicalUdids.map(id => id.trim()).filter(Boolean)))
      const eligible = targets.filter(id => Boolean(remoteDeviceByUdid.get(id)?.endpoints[mode]))
      if (!eligible.length) return

      setPreferredConnectionByLogicalUdid(prev => {
        let changed = false
        const next = { ...prev }
        eligible.forEach(id => {
          if (next[id] !== mode) {
            next[id] = mode
            changed = true
          }
        })
        return changed ? next : prev
      })

      window.requestAnimationFrame(() => {
        eligible.forEach(id => {
          reloadMap.current.get(id)?.({ restart: true })
        })
      })
    },
    [remoteDeviceByUdid]
  )

  const ensureAndSwitchConnectionForDevices = useCallback(
    async (logicalUdids: string[], mode: ConnectionMode) => {
      const targets = Array.from(new Set(logicalUdids.map(id => id.trim()).filter(Boolean)))
      if (!targets.length) return

      if (mode === 'wifi') {
        // 1. Switch immediately for devices that already have a wifi endpoint
        const alreadyHasWifi = targets.filter(id => {
          const endpoints = remoteDeviceByUdid.get(id)?.endpoints
          return Boolean(endpoints?.wifi)
        })

        if (alreadyHasWifi.length) {
          setPreferredConnectionByLogicalUdid(prev => {
            let changed = false
            const next = { ...prev }
            alreadyHasWifi.forEach(id => {
              if (next[id] !== 'wifi') {
                next[id] = 'wifi'
                changed = true
              }
            })
            return changed ? next : prev
          })

          window.requestAnimationFrame(() => {
            alreadyHasWifi.forEach(id => {
              reloadMap.current.get(id)?.({ restart: true })
            })
          })
        }

        // 2. For devices without a wifi endpoint but with an adb (USB) endpoint, connect them
        const needConnect = targets.filter(id => {
          const endpoints = remoteDeviceByUdid.get(id)?.endpoints
          return !endpoints?.wifi && Boolean(endpoints?.adb)
        })

        if (needConnect.length) {
          const payload = needConnect.map(id => {
            const adbSerial = remoteDeviceByUdid.get(id)?.endpoints.adb || id
            return {
              device: adbSerial,
              connect: 'wifi' as const,
              port: 5555
            }
          })

          try {
            const results = await runConnectRequest(payload, 'wifi')
            if (Array.isArray(results) && results.length) {
              const successResults = results.filter(r => r.success && r.endpoint)
              
              if (successResults.length) {
                // Merge WiFi endpoints into remoteDevices state
                setRemoteDevices(prev => {
                  return prev.map(d => {
                    const matchedResult = successResults.find(r => r.device === d.endpoints.adb || r.device === d.udid)
                    if (matchedResult && matchedResult.endpoint) {
                      return {
                        ...d,
                        endpoints: {
                          ...d.endpoints,
                          wifi: matchedResult.endpoint
                        }
                      }
                    }
                    return d
                  })
                })

                // Set preferred connection to wifi
                setPreferredConnectionByLogicalUdid(prev => {
                  const next = { ...prev }
                  let changed = false
                  successResults.forEach(r => {
                    const matchedDev = remoteDevices.find(d => d.endpoints.adb === r.device || d.udid === r.device)
                    if (matchedDev) {
                      if (next[matchedDev.udid] !== 'wifi') {
                        next[matchedDev.udid] = 'wifi'
                        changed = true
                      }
                    }
                  })
                  return changed ? next : prev
                })

                // Reload tiles
                window.requestAnimationFrame(() => {
                  successResults.forEach(r => {
                    const matchedDev = remoteDevices.find(d => d.endpoints.adb === r.device || d.udid === r.device)
                    if (matchedDev) {
                      reloadMap.current.get(matchedDev.udid)?.({ restart: true })
                    }
                  })
                })
              }
            }
          } catch (err) {
            console.error('[ensureAndSwitchConnectionForDevices] Connect WiFi failed:', err)
          }
        }

        // 3. For devices with no way to connect, display an error
        const noWay = targets.filter(id => {
          const endpoints = remoteDeviceByUdid.get(id)?.endpoints
          return !endpoints?.wifi && !endpoints?.adb
        })
        if (noWay.length) {
          setConnectNotification({
            type: 'error',
            text: t('Không tìm thấy kết nối WiFi hoặc USB (ADB) cho {count} thiết bị.', { count: noWay.length })
          })
        }
      } else if (mode === 'adb') {
        const eligible = targets.filter(id => {
          const endpoints = remoteDeviceByUdid.get(id)?.endpoints
          return Boolean(endpoints?.adb)
        })

        if (eligible.length) {
          setPreferredConnectionByLogicalUdid(prev => {
            let changed = false
            const next = { ...prev }
            eligible.forEach(id => {
              if (next[id] !== 'adb') {
                next[id] = 'adb'
                changed = true
              }
            })
            return changed ? next : prev
          })

          window.requestAnimationFrame(() => {
            eligible.forEach(id => {
              reloadMap.current.get(id)?.({ restart: true })
            })
          })
        }

        const notEligible = targets.filter(id => {
          const endpoints = remoteDeviceByUdid.get(id)?.endpoints
          return !endpoints?.adb
        })

        if (notEligible.length) {
          setConnectNotification({
            type: 'error',
            text: t('Không tìm thấy kết nối USB (ADB) cho {count} thiết bị. Hãy cắm cáp USB.', { count: notEligible.length })
          })
        }
      }
    },
    [remoteDeviceByUdid, remoteDevices, runConnectRequest, t]
  )

  const discoveredDevices = useMemo(
    () => {
      const filteredRemote = remoteDevices.filter(d => !blacklistedUdids.includes(d.udid))
      const filteredAndroid = androidDevices.filter(d => !blacklistedUdids.includes(d.udid))
      if (filteredRemote.length) return filteredRemote.map(d => d.udid)
      if (filteredAndroid.length) return filteredAndroid.map(d => d.udid)
      return []
    },
    [androidDevices, remoteDevices, blacklistedUdids]
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
                const logicalUdid = String(d?.uuid || device).trim()
                if (!device || !logicalUdid) return

                // Guard: skip unmapped WiFi endpoints that would create rogue tiles
                if (device.includes(':') && (!logicalUdid || logicalUdid === device)) {
                  console.warn('[devices-list] skipped unmapped wifi endpoint', device)
                  return
                }

                // Guard: skip blacklisted devices
                if (blacklistedUdids.includes(device) || blacklistedUdids.includes(logicalUdid)) {
                  return
                }

                const endpoint: RemoteDeviceEndpoint = {
                  udid: device,
                  type: normalizeConnectionMode(device, String(d?.connect_type || ''))
                }
                const current: RemoteDevice =
                  dedup.get(logicalUdid) ?? { udid: logicalUdid, type: 'unknown' as const, endpoints: {} }
                if (endpoint.type === 'adb' || endpoint.type === 'wifi') {
                  current.endpoints[endpoint.type] = endpoint.udid
                }
                current.type = chooseRemoteDeviceMode(
                  current.endpoints,
                  preferredConnectionRef.current[logicalUdid]
                )
                dedup.set(logicalUdid, current)
              })
              const mapped = Array.from(dedup.values())
              const endpointAliases = new Set<string>()
              mapped.forEach(d => {
                CONNECTION_MODES.forEach(mode => {
                  const endpoint = d.endpoints[mode]
                  if (endpoint && endpoint !== d.udid) endpointAliases.add(endpoint)
                })
              })
              const now = Date.now()
              const lastSeen = remoteDeviceLastSeenRef.current
              mapped.forEach(d => lastSeen.set(d.udid, now))
              startTransition(() => {
                setRemoteDevices(prev => {
                  const nextMap = new Map<string, RemoteDevice>()
                  mapped.forEach(d => nextMap.set(d.udid, d))
                  prev.forEach(d => {
                    if (nextMap.has(d.udid)) return
                    const seenAt = lastSeen.get(d.udid) || 0
                    if (now - seenAt <= DEVICE_LIST_OFFLINE_GRACE_MS) {
                      nextMap.set(d.udid, d)
                    }
                  })
                  Array.from(lastSeen.entries()).forEach(([udid, seenAt]) => {
                    if (now - seenAt > DEVICE_LIST_OFFLINE_GRACE_MS) {
                      lastSeen.delete(udid)
                    }
                  })
                  const nextList = Array.from(nextMap.values())
                  if (prev.length === nextList.length) {
                    const hasChanged = prev.some((d, idx) => {
                      const nd = nextList[idx]
                      return (
                        d.udid !== nd.udid ||
                        d.type !== nd.type ||
                        d.endpoints.adb !== nd.endpoints.adb ||
                        d.endpoints.wifi !== nd.endpoints.wifi
                      )
                    })
                    if (!hasChanged) return prev
                  }
                  return nextList
                })
                setAllKnownDevices(prev => {
                  const base = prev.filter(item => !endpointAliases.has(item.udid))
                  let hasNew = false
                  for (const d of mapped) {
                    if (!base.some(item => item.udid === d.udid)) {
                      hasNew = true
                      break
                    }
                  }
                  if (!hasNew && base.length === prev.length) return prev;
                  const next = [...base]
                  mapped.forEach((d) => {
                    if (!next.some(item => item.udid === d.udid)) {
                      next.push({ udid: d.udid, name: `P${next.length + 1}` })
                    }
                  })
                  return next
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
      if (d.udid) {
        map.set(
          d.udid,
          connectionModeToDeviceFilter(
            chooseRemoteDeviceMode(d.endpoints, preferredConnectionByLogicalUdid[d.udid])
          )
        )
      }
    })
    androidDevices.forEach(d => {
      if (map.has(d.udid)) return
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
  }, [androidDevices, preferredConnectionByLogicalUdid, remoteDevices])
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
      if (endpointLogicalByUdid.has(d.udid)) return
      if (!onlineSet.has(d.udid)) allUdids.push(d.udid)
    })
    return allUdids
  }, [deviceParam, gridDevices, allKnownDevices, endpointLogicalByUdid])

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
  const { mergedOrder, moveTile, removeTile, getTileNumber, setTileNumber } =
    useTileOrder(allGridUdids)

  const removeUiDeviceEntries = useCallback((udids: string[]) => {
    const targetSet = new Set(udids.map(id => id.trim()).filter(Boolean))
    if (!targetSet.size) return

    setBlacklistedUdids(prev => {
      const next = new Set([...prev, ...Array.from(targetSet)])
      return Array.from(next)
    })

    setAllKnownDevices(prev => {
      const next = prev.filter(device => !targetSet.has(device.udid))
      return next.length === prev.length ? prev : next
    })

    setSavedGroups(prev => {
      let changed = false
      const next = prev.map(group => {
        const nextUdids = group.udids.filter(udid => !targetSet.has(udid))
        let nextSelectedAccounts = group.selectedAccounts
        let groupChanged = nextUdids.length !== group.udids.length

        if (group.selectedAccounts) {
          const cleanedSelectedAccounts = { ...group.selectedAccounts }
          targetSet.forEach(udid => {
            if (Object.prototype.hasOwnProperty.call(cleanedSelectedAccounts, udid)) {
              delete cleanedSelectedAccounts[udid]
              groupChanged = true
            }
          })
          if (groupChanged) {
            nextSelectedAccounts = Object.keys(cleanedSelectedAccounts).length
              ? cleanedSelectedAccounts
              : undefined
          }
        }

        if (!groupChanged) return group
        changed = true
        return { ...group, udids: nextUdids, selectedAccounts: nextSelectedAccounts }
      })
      return changed ? next : prev
    })

    setConnectSelection(prev => {
      let changed = false
      const next = new Set(prev)
      targetSet.forEach(udid => {
        if (next.delete(udid)) changed = true
      })
      return changed ? next : prev
    })

    const nextSyncTargets = syncTargets.filter(udid => !targetSet.has(udid))
    if (nextSyncTargets.length !== syncTargets.length) {
      setSyncTargetsList(nextSyncTargets)
    }

    setPreferredConnectionByLogicalUdid(prev => {
      let changed = false
      const next = { ...prev }
      targetSet.forEach(udid => {
        if (Object.prototype.hasOwnProperty.call(next, udid)) {
          delete next[udid]
          changed = true
        }
      })
      return changed ? next : prev
    })

    setRemoteDevices(prev => {
      const next = prev.filter(device => !targetSet.has(device.udid))
      return next.length === prev.length ? prev : next
    })

    targetSet.forEach(udid => {
      remoteDeviceLastSeenRef.current.delete(udid)
      removeTile(udid)
    })

    if (viewerUdid && targetSet.has(viewerUdid)) {
      setViewerUdid(null)
    }
  }, [removeTile, setSyncTargetsList, syncTargets, viewerUdid])

  useEffect(() => {
    if (!endpointAliasUdids.length) return
    removeUiDeviceEntries(endpointAliasUdids)
  }, [endpointAliasUdids, removeUiDeviceEntries])

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
    // Nếu không mở quản lý tài khoản thì không áp dụng bộ lọc
    if (!accountManagerOpen) return true;

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
      } else if (davActiveFilter === 'die') {
        filterMatched = accounts.some(acc => acc.status === 'Die');
      } else if (davActiveFilter === 'risk') {
        filterMatched = accounts.some(acc => acc.status === 'Risk');
      } else if (davActiveFilter === 'unverified') {
        filterMatched = accounts.some(acc => acc.status === 'Unverified' || (acc as any).verifyStatus === 'Unverified');
      } else if (davActiveFilter === 'incomplete_info') {
        filterMatched = accounts.some(acc => !acc.name || !acc.nickname || !acc.phone || !acc.email);
      } else if (davActiveFilter === 'wechat_scan_qr') {
        if (davActiveTab === 'wechat') {
          filterMatched = accounts.some(acc => {
            const wc = acc as WeChatAccount;
            const is3Months = wc.createdAt ? (Date.now() - wc.createdAt >= 90 * 24 * 60 * 60 * 1000) : (wc as any).isOneYearOld === true;
            if (!is3Months) return false;
            const scanCount = wc.scanCount || 0;
            if (scanCount >= 3) return false;
            if (wc.lastScanDate) {
              const nextScan = wc.lastScanDate + 30 * 24 * 60 * 60 * 1000;
              if (nextScan > Date.now()) return false;
            }
            return true;
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
  }, [accountManagerOpen, vault, davActiveTab, davActiveFilter, davSearch]);

  const selectedVisible = useMemo(
    () => orderedRegistered.filter(id => connectSelection.has(id)),
    [orderedRegistered, connectSelection]
  )

  // Track vị trí chuột cho tooltip (dùng RAF + style transform trực tiếp để tránh rerender)
  useEffect(() => {
    if (selectedVisible.length < 2) return;

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
  }, [selectedVisible.length >= 2]);

  const tileAccountDataMap = useMemo(() => {
    const map = new Map<string, any>();
    mergedOrder.forEach(udid => {
      map.set(udid, getDeviceAccountDataFromVault(vault, udid));
    });
    return map;
  }, [vault, mergedOrder]);

  const tileAccountMatchedMap = useMemo(() => {
    const map = new Map<string, boolean>();
    mergedOrder.forEach(udid => {
      map.set(udid, isDeviceMatchingAccountFilter(udid));
    });
    return map;
  }, [mergedOrder, isDeviceMatchingAccountFilter]);

  const tileHighlightsMap = useMemo(() => {
    const map = new Map<string, 'blue' | 'yellow' | 'red' | 'orange' | 'white' | 'green' | false>();
    if (!accountManagerOpen) return map;

    mergedOrder.forEach(udid => {
      const isAccountMatched = tileAccountMatchedMap.get(udid) ?? true;
      const accountData = tileAccountDataMap.get(udid);
      if (!accountData) {
        map.set(udid, false);
        return;
      }
      const accounts = (accountData.platforms[davActiveTab] || []).filter((acc: any) => acc !== null && acc !== undefined);

      if (davActiveFilter === 'nearby_people' && isAccountMatched) {
        const state = getNearbyAccountGroupState(accounts);
        if (state === 'eligible') {
          map.set(udid, 'blue');
          return;
        }
        if (state === 'upcoming') {
          map.set(udid, 'blue');
          return;
        }
      }

      if (davActiveFilter === 'die' && accounts.some((acc: any) => acc.status === 'Die')) {
        map.set(udid, 'red');
        return;
      }
      if (davActiveFilter === 'risk' && accounts.some((acc: any) => acc.status === 'Risk')) {
        map.set(udid, 'orange');
        return;
      }

      // Lọc UnVerify -> yellow
      if (davActiveFilter === 'unverified' && accounts.some((acc: any) => acc.status === 'Unverified' || acc.verifyStatus === 'Unverified')) {
        map.set(udid, 'yellow');
        return;
      }

      // Lọc Thiếu Info -> trắng
      if (davActiveFilter === 'incomplete_info' && accounts.some((acc: any) => !acc.name || !acc.nickname || !acc.phone || !acc.email)) {
        map.set(udid, 'white');
        return;
      }

      // Lọc TK 1 năm -> xanh lá
      if (davActiveFilter === 'one_year') {
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        const hasOneYear = accounts.some((acc: any) => {
          if (acc.createdAt) {
            return (Date.now() - acc.createdAt) >= oneYearMs;
          }
          return acc.isOneYearOld === true;
        });
        if (hasOneYear) {
          map.set(udid, 'green');
          return;
        }
      }

      // Lọc Thông báo -> cam
      if (davActiveFilter === 'has_notice' && accounts.some((acc: any) => acc.notice && acc.notice.title)) {
        map.set(udid, 'orange');
        return;
      }

      // Lọc Scan QR -> xanh lá
      if (davActiveFilter === 'wechat_scan_qr') {
        const hasScanEligible = accounts.some((acc: any) => {
          const is3Months = acc.createdAt ? (Date.now() - acc.createdAt >= 90 * 24 * 60 * 60 * 1000) : (acc.isOneYearOld === true);
          if (!is3Months) return false;
          const scanCount = acc.scanCount || 0;
          const lastScanDate = acc.lastScanDate;
          return scanCount < 3 && (!lastScanDate || Date.now() >= lastScanDate + 30 * 24 * 60 * 60 * 1000);
        });
        if (hasScanEligible) {
          map.set(udid, 'green');
          return;
        }
      }

      // Lọc TK Mới -> trắng
      if (davActiveFilter === 'new_month') {
        const hasNewMonth = accounts.some((acc: any) => {
          if (!acc.createdAt) return false;
          return Date.now() - acc.createdAt < 30 * 24 * 60 * 60 * 1000;
        });
        if (hasNewMonth) {
          map.set(udid, 'white');
          return;
        }
      }

      map.set(udid, false);
    });
    return map;
  }, [accountManagerOpen, mergedOrder, tileAccountMatchedMap, tileAccountDataMap, davActiveTab, davActiveFilter]);
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

      await Promise.allSettled(
        targets.map(async (udid) => {
          for (const command of commands) {
            try {
              await runAdbCommandApi(wsServer, udid, command)
            } catch {
              // ignore quick action failures; server returns output in UI logs elsewhere.
            }
          }
        })
      )
    },
    [quickCommandTargets, wsServer]
  )


  // callback_runStayAwakeForTargets : Chạy stay awake cho danh sách thiết bị
  const runStayAwakeForTargets = useCallback(
    async (targets: string[]) => {
      if (!targets.length) return

      await Promise.allSettled(
        targets.map((udid) =>
          runAdbCommandApi(
            wsServer,
            udid,
            'adb shell settings put global stay_on_while_plugged_in 7'
          )
        )
      )
    },
    [wsServer]
  )

  // handleRunGroupProfiles : Chạy profiles WeChat cho nhóm máy
  const handleRunGroupProfiles = useCallback(async (group: SavedDeviceGroup) => {
    const udids = group.udids;
    const groupSelectedAccounts = group.selectedAccounts || {};
    for (const udid of udids) {
      if (!connectedUdids.has(udid)) continue;
      const selectedId = groupSelectedAccounts[udid];
      if (!selectedId) {
        console.warn(`Device ${udid} has no mapped WeChat account in group "${group.name}", skipping.`);
        continue;
      }
      try {
        const devData = getDeviceAccountData(udid);
        const accounts = devData?.platforms?.['wechat'] || [];
        const activeAccount = accounts.find(a => a.id === selectedId);
        if (!activeAccount) {
          console.warn(`Mapped WeChat account ${selectedId} not found on device ${udid}, skipping.`);
          continue;
        }
        
        let userId = 0; // Default user 0
        if (activeAccount?.wechatLaunchProfile && typeof activeAccount.wechatLaunchProfile.userId === 'number') {
          userId = activeAccount.wechatLaunchProfile.userId;
        }
        
        const cmd = `am start --user ${userId} -n com.tencent.mm/com.tencent.mm.ui.LauncherUI`;
        await runAdbCommandApi(wsServer, udid, cmd);
      } catch (err) {
        console.warn(`Failed to run profiles for device ${udid}:`, err);
      }
    }
  }, [connectedUdids, wsServer]);

  const stayAwakePreparedRef = useRef<Set<string>>(new Set())

  const ensureStayAwakeForDevice = useCallback(
    async (udid: string) => {
      if (stayAwakePreparedRef.current.has(udid)) return
      try {
        await runAdbCommandApi(
          wsServer,
          udid,
          'adb shell settings put global stay_on_while_plugged_in 7'
        )
        stayAwakePreparedRef.current.add(udid)
      } catch (err) {
        console.warn('[stay-awake] failed', udid, err)
      }
    },
    [wsServer]
  )

  const sendPhysicalScreenPowerViaControl = useCallback(
    (udid: string, mode: ScreenPowerMode): boolean => {
      const resolved = getTargetsByUdids([udid])
      const target = resolved[0]
      if (!target?.ws || target.ws.readyState !== WebSocket.OPEN) return false

      try {
        target.ws.send(encodeSetScreenPowerModeMessage(mode))
        return true
      } catch (err) {
        console.warn('[display-power] screen power ws failed', udid, err)
        return false
      }
    },
    [getTargetsByUdids]
  )

  // callback_runPhysicalScreenOffWithStayAwake : Tắt panel qua control channel trước, rồi đảm bảo Stay Awake
  const runPhysicalScreenOffWithStayAwake = useCallback(
    async (targets: string[]) => {
      if (!targets.length) return

      await Promise.allSettled(
        targets.map(async (udid) => {
          const stayAwakePromise = ensureStayAwakeForDevice(udid)

          try {
            // WS control: fire-and-forget bonus, không được skip REST API vì ws.send() không confirm delivery
            sendPhysicalScreenPowerViaControl(udid, ScreenPowerMode.OFF)

            await stayAwakePromise
            await setDeviceDisplayPower(wsServer, udid, 'off')
          } catch (err) {
            console.warn('[display-power] physical off failed', udid, err)
          }
        })
      )
    },
    [androidDeviceMap, ensureStayAwakeForDevice, sendPhysicalScreenPowerViaControl, wsServer]
  )

  // ref_autoScreenPrepared : Lưu danh sách thiết bị đã được chuẩn bị tự động để tránh spam
  const autoScreenPreparedRef = useRef<Set<string>>(new Set())
  // ref_autoScreenInFlight : Ngăn chạy song song nhiều lần cho cùng device
  const autoScreenInFlightRef = useRef<Set<string>>(new Set())

  // effect_autoScreenPrepare : Tự động chạy khi thiết bị vừa online
  useEffect(() => {
    // Dùng connectedUdids trực tiếp, không phụ thuộc orderedRegistered (cần Tile mount)
    for (const udid of connectedUdids) {
      if (autoScreenPreparedRef.current.has(udid)) continue
      if (autoScreenInFlightRef.current.has(udid)) continue
      autoScreenInFlightRef.current.add(udid)

      // Fire-and-forget async: delay 3s cho ADB ổn định, rồi tắt màn hình
      ;(async () => {
        await new Promise(r => setTimeout(r, 3000))
        try {
          await runPhysicalScreenOffWithStayAwake([udid])
          autoScreenPreparedRef.current.add(udid)
        } catch (err) {
          console.warn('[auto-screen-prepare] failed, will retry next cycle', udid, err)
        } finally {
          autoScreenInFlightRef.current.delete(udid)
        }
      })()
    }

    // Nếu device offline thì cho phép lần sau online lại chạy lại
    for (const udid of Array.from(autoScreenPreparedRef.current)) {
      if (!connectedUdids.has(udid)) {
        autoScreenPreparedRef.current.delete(udid)
        stayAwakePreparedRef.current.delete(udid)
      }
    }
  }, [connectedUdids, runPhysicalScreenOffWithStayAwake])

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


  const runGlobalAdbCommand = useCallback(async () => {
    const commands = globalAdbCommand
      .split(/\r?\n/)
      .map(cmd => cmd.trim())
      .filter(Boolean)

    const targets = quickCommandTargets()
    if (!commands.length || !targets.length) return

    setGlobalAdbRunning(true)
    setGlobalAdbStatus(`Đang chạy ADB đồng thời trên ${targets.length} thiết bị...`)

    try {
      const results = await Promise.allSettled(
        targets.map(async (udid) => {
          for (const command of commands) {
            await runAdbCommandApi(wsServer, udid, command)
          }
        })
      )

      const failedCount = results.filter(r => r.status === 'rejected').length
      if (failedCount > 0) {
        setGlobalAdbStatus(`Đã chạy ADB xong, ${failedCount}/${targets.length} thiết bị có lỗi`)
      } else {
        setGlobalAdbStatus('Đã chạy lệnh ADB xong')
      }

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
      e.stopPropagation()
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

      if (active && active.classList.contains('account-search-input')) {
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
        setDeviceAccountOverlayOpen(prev => {
          const next = !prev;
          if (next) {
            setDeviceAccountOverlayMounted(true);
          }
          return next;
        });
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

  // ===== ACCOUNT MANAGER MODAL HOTKEY LISTENER =====
  useEffect(() => {
    const handleAccountManagerHotkey = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      if (active && active.classList.contains('account-search-input')) {
        return;
      }

      // Bỏ qua khi đang hover/focus trên phone tile
      const isHoveringPhone =
        document.querySelector('.tile:hover') !== null ||
        document.querySelector('.viewerCanvas:hover') !== null ||
        document.querySelector('#viewerPanel:hover') !== null;

      const isCanvasFocused =
        active &&
        (active.tagName === 'CANVAS' || active.classList.contains('viewerCanvas'));

      if (isHoveringPhone || isCanvasFocused) return;

      // Bỏ qua khi focus vào input thường
      if (
        active &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) || active.isContentEditable) &&
        !active.closest('.dav-overlay') &&
        !active.closest('.tile-account-overlay')
      ) {
        return;
      }

      const savedHotkey = localStorage.getItem('monviewphone:account-manager-hotkey') || 'Alt+M';
      if (matchesHotkey(e, savedHotkey)) {
        e.preventDefault();
        e.stopPropagation();
        setAccountManagerOpen(prev => {
          const next = !prev;
          if (next) {
            setDeviceAccountOverlayMounted(true);
          }
          return next;
        });
      }

      if (e.key === 'Escape') {
        setAccountManagerOpen(false);
      }
    };

    window.addEventListener('keydown', handleAccountManagerHotkey, {
      capture: true,
      passive: false,
    });

    return () => {
      window.removeEventListener('keydown', handleAccountManagerHotkey, {
        capture: true,
      } as any);
    };
  }, []);

  // ===== OVERLAY HEADER HOTKEY LISTENER =====
  // Toggle alwaysShowHeader (nút "Overlay Header" trong modal Quản lý tài khoản)
  // Cùng logic với button toggle trong DeviceAccountOverlay.tsx: flip localStorage + dispatch event
  useEffect(() => {
    const handleOverlayHeaderHotkey = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      if (active && active.classList.contains('account-search-input')) {
        return;
      }
      const isPasteSink = active?.id === '__scrcpy_paste_sink';
      const hotkeyStr = localStorage.getItem('monviewphone:overlay-header-hotkey') || '';

      // Bỏ qua khi focus vào input thường (ngoài overlay)
      const isRealEditable =
        active &&
        !isPasteSink &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) || active.isContentEditable) &&
        !active.closest('.dav-overlay') &&
        !active.closest('.tile-account-overlay');

      if (isRealEditable) {
        return;
      }

      if (hotkeyStr && matchesHotkey(e, hotkeyStr)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();

        if (e.repeat) return; // Prevent double toggle on auto-repeat

        overlayHeaderHotkeyKeyRef.current = e.code || e.key;
        if (overlayHeaderHotkeyTimerRef.current) {
          clearTimeout(overlayHeaderHotkeyTimerRef.current);
        }
        overlayHeaderHotkeyHeldRef.current = false;
        overlayHeaderHotkeyTimerRef.current = setTimeout(() => {
          overlayHeaderHotkeyHeldRef.current = true;
          // Hold action: auto show alwaysShowHeader and open all dropdowns
          // Đè phím: tự động hiển thị overlay header và mở toàn bộ dropdown
          const alwaysShowHeader = localStorage.getItem('monviewphone:dav-always-show-header') === 'true';
          if (!alwaysShowHeader) {
            localStorage.setItem('monviewphone:dav-always-show-header', 'true');
            saveBackendSetting('monviewphone:dav-always-show-header', 'true');
            window.dispatchEvent(new CustomEvent('monviewphone:dav-hide-settings-changed'));
          }
          window.dispatchEvent(new CustomEvent('monviewphone:open-all-dropdowns'));
          (window as any).__allDropdownsOpen = true;
        }, 500);
      }
    };

    const handleOverlayHeaderHotkeyUp = (e: KeyboardEvent) => {
      const activeKey = e.code || e.key;
      if (overlayHeaderHotkeyKeyRef.current && overlayHeaderHotkeyKeyRef.current === activeKey) {
        overlayHeaderHotkeyKeyRef.current = null;
        if (overlayHeaderHotkeyTimerRef.current) {
          clearTimeout(overlayHeaderHotkeyTimerRef.current);
          overlayHeaderHotkeyTimerRef.current = null;
        }

        if (overlayHeaderHotkeyHeldRef.current) {
          overlayHeaderHotkeyHeldRef.current = false;
          return;
        }

        // Single press action: toggle dropdowns or toggle header visibility
        // Click đơn: thu gọn dropdown hoặc toggle hiển thị header
        if ((window as any).__allDropdownsOpen) {
          window.dispatchEvent(new CustomEvent('monviewphone:close-all-dropdowns'));
          (window as any).__allDropdownsOpen = false;
        } else {
          const current = localStorage.getItem('monviewphone:dav-always-show-header') === 'true';
          const nextVal = !current;
          localStorage.setItem('monviewphone:dav-always-show-header', String(nextVal));
          saveBackendSetting('monviewphone:dav-always-show-header', String(nextVal));
          window.dispatchEvent(new CustomEvent('monviewphone:dav-hide-settings-changed'));
        }
      }
    };

    window.addEventListener('keydown', handleOverlayHeaderHotkey, { capture: true, passive: false });
    window.addEventListener('keyup', handleOverlayHeaderHotkeyUp, { capture: true, passive: false });
    return () => {
      window.removeEventListener('keydown', handleOverlayHeaderHotkey, { capture: true } as any);
      window.removeEventListener('keyup', handleOverlayHeaderHotkeyUp, { capture: true } as any);
    };
  }, []);

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
    const encoderMode = cfg.encoderMode || 'auto'
    return {
      ...normalizeEncoderConfig({
        bitrate,
        maxFps,
        iFrameInterval,
        bounds: { width, height },
        sendFrameMeta: Boolean(cfg.sendFrameMeta),
        displayId,
        codecOptions: cfg.codecOptions,
        engine: cfg.engine,
        encoderMode,
        encoderName: cfg.encoderName
      })
    }
  }

  const normalizeViewerStreamConfig = (cfg: StreamConfig): StreamConfig => {
    const bitrate = clamp(cfg.bitrate, 524288, 8_388_608)
    const maxFps = clamp(cfg.maxFps, 1, 60)
    const iFrameInterval = clamp(cfg.iFrameInterval, 0, 60)
    const width = clamp(cfg.bounds?.width ?? 0, STREAM_WIDTH_MIN, VIEWER_STREAM_WIDTH_MAX)
    const height = clamp(cfg.bounds?.height ?? 0, STREAM_WIDTH_MIN, 4000)
    const displayId = Math.max(0, Math.floor(cfg.displayId ?? 0))
    const encoderMode = cfg.encoderMode || 'auto'
    return {
      ...normalizeEncoderConfig({
        bitrate,
        maxFps,
        iFrameInterval,
        bounds: { width, height },
        sendFrameMeta: Boolean(cfg.sendFrameMeta),
        displayId,
        codecOptions: cfg.codecOptions,
        engine: cfg.engine,
        encoderMode,
        encoderName: cfg.encoderName
      })
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
    
    let targetX = viewerDragRef.current.originX + dx
    let targetY = viewerDragRef.current.originY + dy

    // Clamp the dragging values within precalculated boundaries
    targetX = Math.max(viewerDragRef.current.minX, Math.min(viewerDragRef.current.maxX, targetX))
    targetY = Math.max(viewerDragRef.current.minY, Math.min(viewerDragRef.current.maxY, targetY))

    setViewerOffset({
      x: targetX,
      y: targetY
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
      const isCanvasWrap = targetEl?.classList.contains('viewerCanvasWrap') || targetEl?.closest('.viewerDragHandleTop') || targetEl?.classList.contains('viewerDragHandleTop')
      const isHandle = isHeader || (isActions && !isActionBtn) || isCanvasWrap
      if (!isHandle) return
      e.preventDefault()

      let minX = -Infinity
      let maxX = Infinity
      let minY = -Infinity
      let maxY = Infinity

      // Calculate dragging boundaries so the Viewer panel never spills out of the screen (12px padding)
      const wrapEl = document.querySelector('.viewerOverlayPanelWrap') as HTMLElement | null
      if (wrapEl) {
        const rect = wrapEl.getBoundingClientRect()
        const viewWidth = window.innerWidth
        const viewHeight = window.innerHeight
        const panelWidth = rect.width
        const panelHeight = rect.height

        const originalLeft = (viewWidth - panelWidth) / 2
        const originalTop = (viewHeight - panelHeight) / 2

        const rawMinX = 12 - originalLeft
        const rawMaxX = viewWidth - 12 - originalLeft - panelWidth
        const rawMinY = 12 - originalTop
        const rawMaxY = viewHeight - 12 - originalTop - panelHeight

        minX = Math.min(rawMinX, rawMaxX)
        maxX = Math.max(rawMinX, rawMaxX)
        minY = Math.min(rawMinY, rawMaxY)
        maxY = Math.max(rawMinY, rawMaxY)
      }

      viewerDragRef.current.startX = e.clientX
      viewerDragRef.current.startY = e.clientY
      viewerDragRef.current.originX = viewerOffset.x
      viewerDragRef.current.originY = viewerOffset.y
      viewerDragRef.current.minX = minX
      viewerDragRef.current.maxX = maxX
      viewerDragRef.current.minY = minY
      viewerDragRef.current.maxY = maxY
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
      physicalScreenOn: {
        label: t('Bật màn hình') || 'Bật Màn Hình',
        icon: <Monitor size={15} strokeWidth={1.8} />,
        run: async () => {
          const targets = quickCommandTargets()
          if (!targets.length) return
          setGlobalAdbStatus(`Đang bật màn hình vật lý cho ${targets.length} thiết bị...`)
          try {
            await Promise.allSettled(
              targets.map((udid) => setDeviceDisplayPower(wsServer, udid, 'on'))
            )
            setGlobalAdbStatus(`Đã bật màn hình vật lý cho ${targets.length} thiết bị`)
          } catch (err: any) {
            setGlobalAdbStatus(`Lỗi bật màn hình vật lý: ${err?.message || err}`)
          }
        }
      },
      physicalScreenOff: {
        label: t('Tắt màn hình') || 'Tắt Màn Hình',
        icon: <MonitorOff size={15} strokeWidth={1.8} />,
        run: async () => {
          const targets = quickCommandTargets()
          if (!targets.length) return
          setGlobalAdbStatus(`Đang tắt màn hình vật lý và bật Stay Awake cho ${targets.length} thiết bị...`)
          try {
            await runPhysicalScreenOffWithStayAwake(targets)
            setGlobalAdbStatus(`Đã tắt màn hình vật lý + Stay Awake cho ${targets.length} thiết bị`)
          } catch (err: any) {
            setGlobalAdbStatus(`Lỗi tắt màn hình vật lý / Stay Awake: ${err?.message || err}`)
          }
        }
      },
      screenOff: {
        label: 'Power key',
        icon: <MonitorOff size={15} strokeWidth={1.8} />,
        run: async () => {
          const targets = quickCommandTargets()
          if (!targets.length) return

          await Promise.allSettled(
            targets.map(async (udid) => {
              const resolved = getTargetsByUdids([udid])
              if (resolved.length > 0 && resolved[0].ws && resolved[0].ws.readyState === WebSocket.OPEN) {
                try {
                  const down = encodeKeycodeMessage(KeyEventAction.DOWN, 26)
                  const up = encodeKeycodeMessage(KeyEventAction.UP, 26)
                  resolved[0].ws.send(down)
                  resolved[0].ws.send(up)
                  return
                } catch {
                  await runAdbCommandApi(wsServer, udid, 'adb shell input keyevent 26')
                  return
                }
              }
              await runAdbCommandApi(wsServer, udid, 'adb shell input keyevent 26')
            })
          )
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
    [runQuickAdbCommands, runPhysicalScreenOffWithStayAwake, quickCommandTargets, getTargetsByUdids, wsServer, t]
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
                accountManagerOpen &&
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
                 const isAccountMatched = tileAccountMatchedMap.get(udid) ?? true;

                // 3. Quyết định hiển thị hay ẩn hoàn toàn
                // Cả 2 mode (priority_sort và hide_unmatched) đều làm mờ title không khớp.
                // Điểm khác nhau duy nhất là priority_sort thì sort renderOrder ở trên, hide_unmatched giữ nguyên vị trí.
                const isVisible = isMatchedByConnectionAndGroup;
                const isFilteredOut = deviceAccountOverlayOpen && accountManagerOpen && isMatchedByConnectionAndGroup && !isAccountMatched;

                const streamUdid = getStreamEndpointUdid(udid)
                const connectionMode = getCurrentConnectionMode(udid)

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
                      deviceParam={streamUdid}
                      streamUdid={streamUdid}
                      connectionMode={connectionMode}
                      wsServer={wsServer}
                      isViewing={viewerUdid === udid}
                      selected={connectSelection.has(udid)}
                      showTileInfo={showTileInfo}
                      isDisconnected={!isConnected}
                      visualAlertActive={Boolean(visualTileAlerts[udid])}
                      onClearVisualAlert={clearVisualAlert}
                      streamConfig={viewerUdid === udid ? viewerStreamConfig : streamConfig}
                      onRegisterReload={registerReload}
                      onUnregisterReload={unregisterReload}
                      onViewDevice={handleViewDevice}
                      onMove={moveTile}
                      onChangeOrderNumber={setTileNumber}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      showAccountOverlay={deviceAccountOverlayOpen}
                      orderMap={orderMap}
                      accountData={tileAccountDataMap.get(udid) || getDeviceAccountDataFromVault(vault, udid)}
                      isFilteredOut={isFilteredOut}
                      activeFilter={davActiveFilter}
                      highlightFilterMatched={tileHighlightsMap.get(udid) ?? false}
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

      <div 
        className={`sidebar-wrapper ${isSidebarPinned ? 'pinned' : (contextMenuOpen || !!groupContextMenu) ? 'auto-hide force-show' : 'auto-hide'}`}
        data-inspector-id="rightSidebar.wrapper"
        data-inspector-label="Right sidebar outer wrapper"
        data-inspector-component="client/src/App.tsx"
      >
        <div 
          className='rightConfigPanel'
          data-inspector-id="rightSidebar.panel"
          data-inspector-label="Right configuration panel"
          data-inspector-component="client/src/App.tsx"
        >
          <button
            className='btn-pin'
            aria-label={isSidebarPinned ? t('Bỏ ghim') : t('Ghim')}
            onClick={() => setIsSidebarPinned(!isSidebarPinned)}
            data-inspector-id="rightSidebar.pinButton"
            data-inspector-label="Right sidebar pin toggle button"
            data-inspector-component="client/src/App.tsx"
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
            data-inspector-id="rightSidebar.settingsButton"
            data-inspector-label="Right sidebar settings button"
            data-inspector-component="client/src/App.tsx"
          >
            <Settings size={16} strokeWidth={2} />
          </button>
          <button
            className='btn-pin btn-notes'
            aria-label='Ghi chú'
            title='Ghi chú'
            onClick={() => {
              setReminderOpenNoteId(null);
              setNotesModalOpen(true);
            }}
            data-inspector-id="rightSidebar.notesButton"
            data-inspector-label="Right sidebar notes button"
            data-inspector-component="client/src/App.tsx"
          >
            <Notebook size={16} strokeWidth={2} />
          </button>
          <div 
            className='rcpContent'
            data-inspector-id="rightSidebar.content"
            data-inspector-label="Right configuration panel content area"
            data-inspector-component="client/src/App.tsx"
          >
            <div 
              className={`rcpSection rcpDropdown rcpDropdownStatic${streamControlsOpen ? '' : ' rcpSectionCollapsed'}`}
              data-inspector-id="rightSidebar.streamSection"
              data-inspector-label="Stream configuration section"
              data-inspector-component="client/src/App.tsx"
            >
              <div className='rcpTitleBar'>
                <div 
                  className='rcpTitle'
                  data-inspector-id="rightSidebar.streamTitle"
                  data-inspector-label="Stream configuration section title"
                  data-inspector-component="client/src/App.tsx"
                >
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
                            updateWidth(205)
                            updateViewerWidthPx(900)
                            setShowTileInfo(false)
                          } else {
                            setStreamConfig(STREAM_CONFIG)
                            setDraftConfig(STREAM_CONFIG)
                            updateWidth(205)
                            updateViewerWidthPx(900)
                            setShowTileInfo(false)
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
                    data-inspector-id="rightSidebar.streamResetButton"
                    data-inspector-label="Stream config reset button"
                    data-inspector-component="client/src/App.tsx"
                  >
                    <RotateCcw size={12} strokeWidth={2} />
                    <span>Reset</span>
                  </button>
                  <button
                    className='rcpIconBtn'
                    title={streamControlsOpen ? t('Collapse stream config') : t('Expand stream config')}
                    aria-label={streamControlsOpen ? t('Collapse stream config') : t('Expand stream config')}
                    onClick={() => setStreamControlsOpen(prev => !prev)}
                    data-inspector-id="rightSidebar.streamCollapseButton"
                    data-inspector-label="Stream config collapse/expand button"
                    data-inspector-component="client/src/App.tsx"
                  >
                    {streamControlsOpen ? <ChevronUp size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
                  </button>
                </div>
              </div>
              <div 
                className='rcpToggleRow'
                data-inspector-id="rightSidebar.showTileInfoToggle"
                data-inspector-label="Toggle row for showing title/nav on tiles"
                data-inspector-component="client/src/App.tsx"
              >
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
 
              <div 
                className='rcpSliderRow'
                data-inspector-id="rightSidebar.tileSizeRow"
                data-inspector-label="Tile size setting row container"
                data-inspector-component="client/src/App.tsx"
              >
                <div className='rcpSliderLabel'>Kích thước</div>
                <button
                  className='rcpStepBtn'
                  aria-label={t('Decrease tile width')}
                  onClick={() => updateWidth(tileDims.width - 5)}
                  data-inspector-id="rightSidebar.tileSizeDecreaseButton"
                  data-inspector-label="Tile size decrease button"
                  data-inspector-component="client/src/App.tsx"
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
                  data-inspector-id="rightSidebar.tileSizeSlider"
                  data-inspector-label="Tile size range slider"
                  data-inspector-component="client/src/App.tsx"
                />
                <button
                  className='rcpStepBtn'
                  aria-label={t('Increase tile width')}
                  onClick={() => updateWidth(tileDims.width + 5)}
                  data-inspector-id="rightSidebar.tileSizeIncreaseButton"
                  data-inspector-label="Tile size increase button"
                  data-inspector-component="client/src/App.tsx"
                >
                  +
                </button>
                <div className='rcpValue'>{tileDims.width}px</div>
              </div>
              <div 
                className='rcpSliderRow'
                data-inspector-id="rightSidebar.viewerSizeRow"
                data-inspector-label="Viewer screen size setting row container"
                data-inspector-component="client/src/App.tsx"
              >
                <div className='rcpSliderLabel'>Kích thước màn hình lớn</div>
                <button
                  className='rcpStepBtn'
                  aria-label={t('Decrease viewer width')}
                  onClick={() => updateViewerWidthPx(viewerWidthPx - 20)}
                  data-inspector-id="rightSidebar.viewerSizeDecreaseButton"
                  data-inspector-label="Viewer size decrease button"
                  data-inspector-component="client/src/App.tsx"
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
                  data-inspector-id="rightSidebar.viewerSizeSlider"
                  data-inspector-label="Viewer size range slider"
                  data-inspector-component="client/src/App.tsx"
                />
                <button
                  className='rcpStepBtn'
                  aria-label={t('Increase viewer width')}
                  onClick={() => updateViewerWidthPx(viewerWidthPx + 20)}
                  data-inspector-id="rightSidebar.viewerSizeIncreaseButton"
                  data-inspector-label="Viewer size increase button"
                  data-inspector-component="client/src/App.tsx"
                >
                  +
                </button>
                <div className='rcpValue'>{viewerWidthPx}px</div>
              </div>
              <div 
                className='rcpSliderRow'
                data-inspector-id="rightSidebar.bitrateRow"
                data-inspector-label="Bitrate setting row container"
                data-inspector-component="client/src/App.tsx"
              >
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
                  data-inspector-id="rightSidebar.bitrateDecreaseButton"
                  data-inspector-label="Bitrate decrease button"
                  data-inspector-component="client/src/App.tsx"
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
                  data-inspector-id="rightSidebar.bitrateSlider"
                  data-inspector-label="Bitrate range slider"
                  data-inspector-component="client/src/App.tsx"
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
                  data-inspector-id="rightSidebar.bitrateIncreaseButton"
                  data-inspector-label="Bitrate increase button"
                  data-inspector-component="client/src/App.tsx"
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
              <div 
                className='rcpSliderRow'
                data-inspector-id="rightSidebar.fpsRow"
                data-inspector-label="FPS setting row container"
                data-inspector-component="client/src/App.tsx"
              >
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
                  data-inspector-id="rightSidebar.fpsDecreaseButton"
                  data-inspector-label="FPS decrease button"
                  data-inspector-component="client/src/App.tsx"
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
                  data-inspector-id="rightSidebar.fpsSlider"
                  data-inspector-label="FPS range slider"
                  data-inspector-component="client/src/App.tsx"
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
                  data-inspector-id="rightSidebar.fpsIncreaseButton"
                  data-inspector-label="FPS increase button"
                  data-inspector-component="client/src/App.tsx"
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

            <div 
              className='rcpSection'
              data-inspector-id="rightSidebar.quickActionsSection"
              data-inspector-label="Right sidebar quick actions section"
              data-inspector-component="client/src/App.tsx"
            >
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

            <div 
              className='rcpSection rcpDevicePanel'
              data-inspector-id="rightSidebar.deviceGroupsSection"
              data-inspector-label="Right sidebar device groups section"
              data-inspector-component="client/src/App.tsx"
            >

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
                              if (groupClickTimeoutRef.current && lastGroupClickIdxRef.current === idx) {
                                clearTimeout(groupClickTimeoutRef.current);
                                groupClickTimeoutRef.current = null;
                                lastGroupClickIdxRef.current = null;

                                if (focusGroupIdx === idx) {
                                  setFocusGroupIdx(null);
                                } else {
                                  setFocusGroupIdx(idx);
                                  setConnectSelection(new Set(group.udids));
                                  setActiveGroupIdx(idx);
                                }
                              } else {
                                if (groupClickTimeoutRef.current) {
                                  clearTimeout(groupClickTimeoutRef.current);
                                }
                                lastGroupClickIdxRef.current = idx;
                                groupClickTimeoutRef.current = setTimeout(() => {
                                  groupClickTimeoutRef.current = null;
                                  lastGroupClickIdxRef.current = null;

                                  if (activeGroupIdx === idx) {
                                    setActiveGroupIdx(null);
                                    setConnectSelection(new Set());
                                  } else {
                                    setConnectSelection(new Set(group.udids));
                                    setActiveGroupIdx(idx);
                                  }
                                }, 250);
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

                          {/* Nút chạy WeChat Profile cho nhóm */}
                          <button
                            className='rcpSavedGroupPlay'
                            title='Chạy WeChat theo Set tài khoản đã chọn'
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRunGroupProfiles(group);
                            }}
                            style={{
                              background: 'rgba(61, 220, 132, 0.1)',
                              border: '1px solid rgba(61, 220, 132, 0.3)',
                              borderRadius: '4px',
                              color: '#3ddc84',
                              padding: '2px 6px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              marginRight: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '2px',
                              height: '22px',
                              alignSelf: 'center',
                            }}
                          >
                            ▶ Chạy Set
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
                              {group.udids
                                .filter(uid => displayFilter === 'all' || connectedUdids.has(uid))
                                .sort((a, b) => {
                                  const numA = orderMap.get(a) ?? 0;
                                  const numB = orderMap.get(b) ?? 0;
                                  return numA - numB;
                                })
                                .map(uid => {
                                const selectedAccountId = group.selectedAccounts?.[uid];
                                const devData = getDeviceAccountData(uid);
                                const accounts = devData?.platforms?.['wechat'] || [];
                                const matchedAccount = selectedAccountId ? accounts.find(a => a.id === selectedAccountId) : null;
                                const accountName = matchedAccount ? (matchedAccount.name || matchedAccount.phone || matchedAccount.nickname || 'Không tên') : null;

                                return (
                                  <div
                                    key={uid}
                                    className={`rcpGridItem${connectSelection.has(uid) ? ' on' : ''}${!connectedUdids.has(uid) ? ' offline' : ''} rcpGroupDeviceItem${matchedAccount ? ' has-set' : ''}`}
                                    title={accountName || 'Chưa set tài khoản'}
                                    onClick={e => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setConnectSelection(prev => {
                                        const next = new Set(prev)
                                        if (next.has(uid)) next.delete(uid)
                                        else next.add(uid)
                                        return next
                                      })
                                    }}
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
                                );
                              })}
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
                connectionMode={getCurrentConnectionMode(viewerUdid)}
                availableConnections={getConnectionEndpoints(viewerUdid)}
                onChangeConnection={(mode) => {
                  const targets = new Set<string>([viewerUdid])
                  connectSelection.forEach(id => targets.add(id))
                  ensureAndSwitchConnectionForDevices(Array.from(targets), mode)
                }}
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
        <div 
          className='appSettingsOverlay'
          data-inspector-id="appSettings.overlay"
          data-inspector-label="System settings modal overlay background"
          data-inspector-component="client/src/App.tsx"
        >
          <div 
            className='confirmPanel appSettingsPanel'
            onMouseDown={e => e.stopPropagation()}
            data-inspector-id="appSettings.panel"
            data-inspector-label="System settings card panel"
            data-inspector-component="client/src/App.tsx"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div 
                className='confirmTitle'
                style={{ fontSize: 22, fontWeight: 700, background: 'linear-gradient(90deg, #fff, #999)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', borderBottom: 'none', margin: 0 }}
                data-inspector-id="appSettings.title"
                data-inspector-label="System settings dialog title"
                data-inspector-component="client/src/App.tsx"
              >
                Cài Đặt Hệ Thống
              </div>
              <button
                className='appSettingsClose'
                title={t('Close settings')}
                aria-label={t('Close settings')}
                onClick={() => setAppSettingsVisible(false)}
                data-inspector-id="appSettings.closeButton"
                data-inspector-label="System settings close button"
                data-inspector-component="client/src/App.tsx"
                style={{ position: 'static' }}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <div 
              style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 16 }}
              data-inspector-id="appSettings.videoEncodingSection"
              data-inspector-label="Video stream settings block"
              data-inspector-component="client/src/App.tsx"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 1. Stream Engine Selection */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div className='rcpSliderLabel' style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0', flex: 1, marginRight: 16 }}>Bộ giải mã video (Stream Engine)</div>
                  <select
                    className='headerLangSelect'
                    style={{ background: '#0a0a0a', color: '#fff', border: '1px solid #444', borderRadius: '6px', padding: '6px 8px', fontSize: 12, width: 220 }}
                    value='tango-scrcpy'
                    disabled
                    title='Tango/scrcpy dùng WebCodecs H.264 trong Chrome'
                    data-inspector-id="appSettings.streamEngineSelect"
                    data-inspector-label="Stream engine selection dropdown"
                    data-inspector-component="client/src/App.tsx"
                  >
                    <option value="tango-scrcpy">Tango/scrcpy + WebCodecs</option>
                  </select>
                </div>

                {/* 2. Encoder Mode Selection */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div className='rcpSliderLabel' style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0', flex: 1, marginRight: 16 }}>Bộ mã hoá thiết bị (Encoder Mode)</div>
                  <select
                    className='headerLangSelect'
                    style={{ background: '#0a0a0a', color: '#fff', border: '1px solid #444', borderRadius: '6px', padding: '6px 8px', fontSize: 12, width: 220 }}
                    value={streamConfig.encoderMode || 'auto'}
                    onChange={e => {
                      const val = e.target.value as any;
                      setStreamConfig(p => normalizeEncoderConfig({ ...p, encoderMode: val }));
                      setViewerStreamConfig(p => normalizeEncoderConfig({ ...p, encoderMode: val }));
                      localStorage.removeItem('monviewphone:device-stream-cache');
                    }}
                    data-inspector-id="appSettings.encoderModeSelect"
                    data-inspector-label="Device encoder mode selection dropdown"
                    data-inspector-component="client/src/App.tsx"
                  >
                    <option value="auto">Tự động (Ưu tiên Hardware)</option>
                    <option value="hardware">Chỉ dùng Hardware (Hardware Only)</option>
                    <option value="software">Chỉ dùng Software (Software Only)</option>
                    <option value="custom">Tuỳ chỉnh (Custom)</option>
                  </select>
                </div>

                {/* 3. Custom Encoder Name Input (Only visible if encoderMode is custom) */}
                {streamConfig.encoderMode === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className='rcpSliderLabel' style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0', flex: 1, marginRight: 16 }}>Tên Encoder Tuỳ chỉnh</div>
                    <input
                      type="text"
                      className="dav-form-input"
                      style={{ background: '#0a0a0a', color: '#fff', border: '1px solid #444', borderRadius: '6px', padding: '6px 8px', fontSize: 12, width: 220 }}
                      placeholder="e.g. OMX.qcom.video.encoder.avc"
                      value={streamConfig.encoderName || ''}
                      onChange={e => {
                        const val = e.target.value.trim() === '' ? undefined : e.target.value.trim();
                        setStreamConfig(p => normalizeEncoderConfig({ ...p, encoderName: val }));
                        setViewerStreamConfig(p => normalizeEncoderConfig({ ...p, encoderName: val }));
                      }}
                      data-inspector-id="appSettings.customEncoderNameInput"
                      data-inspector-label="Custom encoder name text input field"
                      data-inspector-component="client/src/App.tsx"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Hotkey Configuration Section */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 16 }}>
              <div 
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setHotkeySectionOpen(p => !p)}
                data-inspector-id="appSettings.hotkeyHeader"
                data-inspector-label="Hotkey configuration header bar"
                data-inspector-component="client/src/App.tsx"
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
                  data-inspector-id="appSettings.hotkeyToggleButton"
                  data-inspector-label="Hotkey section expand toggle button"
                  data-inspector-component="client/src/App.tsx"
                >
                  {hotkeySectionOpen ? <ChevronUp size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
                </button>
              </div>

              {hotkeySectionOpen && (
                <div 
                  style={{ 
                    marginTop: 14, 
                    borderTop: '1px solid rgba(255,255,255,0.05)', 
                    paddingTop: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                  data-inspector-id="appSettings.hotkeySection"
                  data-inspector-label="Hotkey configuration section"
                  data-inspector-component="client/src/App.tsx"
                >
                  {/* Hotkey 1: Sync Time */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
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
                          width: 150,
                          textAlign: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          outline: 'none',
                        }}
                        data-inspector-id="appSettings.syncTimeHotkeyInput"
                        data-inspector-label="Sync Time hotkey input"
                        data-inspector-component="client/src/App.tsx"
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
                          data-inspector-id="appSettings.syncTimeHotkeyClearButton"
                          data-inspector-label="Sync Time hotkey clear button"
                          data-inspector-component="client/src/App.tsx"
                        >
                          Xoá
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hotkey 2: Tile Account */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--md-muted)', flex: 1 }}>
                      Hiện tài khoản máy (Tile):
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
                          width: 150,
                          textAlign: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          outline: 'none',
                        }}
                        data-inspector-id="appSettings.deviceAccountHotkeyInput"
                        data-inspector-label="Device account hotkey input"
                        data-inspector-component="client/src/App.tsx"
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
                          data-inspector-id="appSettings.deviceAccountHotkeyClearButton"
                          data-inspector-label="Device account hotkey clear button"
                          data-inspector-component="client/src/App.tsx"
                        >
                          Xoá
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hotkey 3: Overlay Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--md-muted)', flex: 1 }}>
                      Overlay Header:
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        id="input_overlay_header_hotkey"
                        type="text"
                        placeholder="Nhấn tổ hợp phím..."
                        readOnly
                        value={overlayHeaderHotkey}
                        onKeyDown={handleOverlayHeaderHotkeyInputKeyDown}
                        style={{
                          background: '#0a0a0a',
                          color: 'var(--md-info)',
                          border: '1px solid #444',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: 12,
                          width: 150,
                          textAlign: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          outline: 'none',
                        }}
                        data-inspector-id="appSettings.overlayHeaderHotkeyInput"
                        data-inspector-label="Overlay header hotkey input"
                        data-inspector-component="client/src/App.tsx"
                      />
                      {overlayHeaderHotkey && (
                        <button
                          type="button"
                          onClick={() => {
                            setOverlayHeaderHotkey('');
                            localStorage.removeItem('monviewphone:overlay-header-hotkey');
                            saveHotkeySettingToBackend('monviewphone:overlay-header-hotkey', '');
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
                          data-inspector-id="appSettings.overlayHeaderHotkeyClearButton"
                          data-inspector-label="Overlay header hotkey clear button"
                          data-inspector-component="client/src/App.tsx"
                        >
                          Xoá
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hotkey 4: Account Manager */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--md-muted)', flex: 1 }}>
                      Bảng Quản lý tài khoản:
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Nhấn tổ hợp phím..."
                        readOnly
                        value={accountManagerHotkey}
                        onKeyDown={handleAccountManagerHotkeyInputKeyDown}
                        style={{
                          background: '#0a0a0a',
                          color: 'var(--md-info)',
                          border: '1px solid #444',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: 12,
                          width: 150,
                          textAlign: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          outline: 'none',
                        }}
                        data-inspector-id="appSettings.accountManagerHotkeyInput"
                        data-inspector-label="Account manager hotkey input"
                        data-inspector-component="client/src/App.tsx"
                      />
                      {accountManagerHotkey && (
                        <button
                          type="button"
                          onClick={() => {
                            setAccountManagerHotkey('');
                            localStorage.removeItem('monviewphone:account-manager-hotkey');
                            saveHotkeySettingToBackend('monviewphone:account-manager-hotkey', '');
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
                          data-inspector-id="appSettings.accountManagerHotkeyClearButton"
                          data-inspector-label="Account manager hotkey clear button"
                          data-inspector-component="client/src/App.tsx"
                        >
                          Xoá
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hotkey 5: Inspector ID */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--md-muted)', flex: 1 }}>
                      Bật/Tắt Inspector ID:
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Nhấn tổ hợp phím..."
                        readOnly
                        value={inspectorIdHotkey}
                        onKeyDown={handleInspectorIdHotkeyInputKeyDown}
                        style={{
                          background: '#0a0a0a',
                          color: 'var(--md-info)',
                          border: '1px solid #444',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: 12,
                          width: 150,
                          textAlign: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          outline: 'none',
                        }}
                        data-inspector-id="appSettings.inspectorIdHotkeyInput"
                        data-inspector-label="Inspector ID hotkey input"
                        data-inspector-component="client/src/App.tsx"
                      />
                      {inspectorIdHotkey && (
                        <button
                          type="button"
                          onClick={() => {
                            setInspectorIdHotkey('');
                            localStorage.removeItem('monviewphone:inspector-id-hotkey');
                            saveHotkeySettingToBackend('monviewphone:inspector-id-hotkey', '');
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
                          data-inspector-id="appSettings.inspectorIdHotkeyClearButton"
                          data-inspector-label="Inspector ID hotkey clear button"
                          data-inspector-component="client/src/App.tsx"
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
            <div 
              style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 16 }}
              data-inspector-id="appSettings.seedingSection"
              data-inspector-label="Seeding content configuration section"
              data-inspector-component="client/src/App.tsx"
            >
              <div 
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setSeedingSectionOpen(p => !p)}
                data-inspector-id="appSettings.seedingHeader"
                data-inspector-label="Seeding configuration section header"
                data-inspector-component="client/src/App.tsx"
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
                    data-inspector-id="appSettings.seedingTextarea"
                    data-inspector-label="Seeding sentences input textarea"
                    data-inspector-component="client/src/App.tsx"
                  />
                  <div style={{ fontSize: 11, color: 'var(--md-muted)', marginTop: 6, textAlign: 'right' }}>
                    Số dòng: <strong style={{ color: 'var(--md-info)' }}>{seedingLineCount}</strong>
                  </div>
                </div>
              )}
            </div>


            <div className='confirmBtns' style={{ marginTop: 32, justifyContent: 'flex-end', display: 'flex' }}>
              <button
                className='modalBtnPrimary'
                style={{
                  padding: '0 24px',
                  height: 38,
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => setAppSettingsVisible(false)}
                data-inspector-id="appSettings.confirmButton"
                data-inspector-label="System settings save confirmation button"
                data-inspector-component="client/src/App.tsx"
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
          data-inspector-id="confirm.bitrateOverlay"
          data-inspector-label="Bitrate change confirmation overlay background"
          data-inspector-component="client/src/App.tsx"
        >
          <div 
            className='confirmPanel' 
            onMouseDown={e => e.stopPropagation()}
            data-inspector-id="confirm.bitratePanel"
            data-inspector-label="Bitrate change confirmation card panel"
            data-inspector-component="client/src/App.tsx"
          >
            <div 
              className='confirmTitle'
              data-inspector-id="confirm.bitrateTitle"
              data-inspector-label="Bitrate change confirmation title"
              data-inspector-component="client/src/App.tsx"
            >
              {t('Bitrate cao')}
            </div>
            <div 
              className='confirmText'
              data-inspector-id="confirm.bitrateText"
              data-inspector-label="Bitrate warning message text"
              data-inspector-component="client/src/App.tsx"
            >
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
                data-inspector-id="confirm.bitrateCancelButton"
                data-inspector-label="Bitrate warning cancel button"
                data-inspector-component="client/src/App.tsx"
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
                data-inspector-id="confirm.bitrateContinueButton"
                data-inspector-label="Bitrate warning confirm/continue button"
                data-inspector-component="client/src/App.tsx"
              >
                {t('Tiếp tục')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {connectModalOpen ? (
        <div 
          className='confirmOverlay' 
          onMouseDown={closeConnectModal}
          data-inspector-id="connectModal.overlay"
          data-inspector-label="Port connector overlay background"
          data-inspector-component="client/src/App.tsx"
        >
          <div 
            className='confirmPanel' 
            onMouseDown={e => e.stopPropagation()}
            data-inspector-id="connectModal.panel"
            data-inspector-label="Port connector card panel"
            data-inspector-component="client/src/App.tsx"
          >
            <div 
              className='confirmTitle'
              data-inspector-id="connectModal.title"
              data-inspector-label="Port connector modal title"
              data-inspector-component="client/src/App.tsx"
            >
              {t('Connect devices')}
            </div>
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
                        data-inspector-id="connectModal.portInput"
                        data-inspector-label={`Port input for device ${id}`}
                        data-inspector-component="client/src/App.tsx"
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
              <button 
                className='modalBtn' 
                onClick={closeConnectModal}
                data-inspector-id="connectModal.cancelButton"
                data-inspector-label="Port connector cancel button"
                data-inspector-component="client/src/App.tsx"
              >
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
                data-inspector-id="connectModal.saveButton"
                data-inspector-label="Port connector save button"
                data-inspector-component="client/src/App.tsx"
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
          data-inspector-id="pageContext.menuLayer"
          data-inspector-label="Page context menu overlay background"
          data-inspector-component="client/src/App.tsx"
        >
          <div
            className='pageContextMenu'
            style={{
              top: Math.min(pageContextMenu.y, window.innerHeight - 150),
              left: Math.min(pageContextMenu.x, window.innerWidth - 230)
            }}
            onClick={e => e.stopPropagation()}
            onContextMenu={e => e.stopPropagation()}
            data-inspector-id="pageContext.menu"
            data-inspector-label="Page context menu card panel"
            data-inspector-component="client/src/App.tsx"
          >
            <button
              className='pageContextItem'
              onClick={() => {
                setPageContextMenu(null)
                apkInputRef.current?.click()
              }}
              data-inspector-id="pageContext.installApkItem"
              data-inspector-label="Page context menu item: Install APK"
              data-inspector-component="client/src/App.tsx"
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
              data-inspector-id="pageContext.importFileItem"
              data-inspector-label="Page context menu item: Import file to phone"
              data-inspector-component="client/src/App.tsx"
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
              data-inspector-id="pageContext.globalAdbItem"
              data-inspector-label="Page context menu item: Run global ADB command"
              data-inspector-component="client/src/App.tsx"
            >
              <Terminal size={15} strokeWidth={1.8} />
              <span>Chạy lệnh ADB</span>
            </button>
            {globalAdbStatus ? <div className='pageContextStatus'>{globalAdbStatus}</div> : null}
          </div>
        </div>
      ) : null}

      {globalAdbOpen ? (
        <div 
          className='confirmOverlay' 
          onMouseDown={() => setGlobalAdbOpen(false)}
          data-inspector-id="globalAdb.overlay"
          data-inspector-label="Global ADB console overlay background"
          data-inspector-component="client/src/App.tsx"
        >
          <div 
            className='confirmPanel adbQuickPanel' 
            onMouseDown={e => e.stopPropagation()}
            data-inspector-id="globalAdb.panel"
            data-inspector-label="Global ADB console card panel"
            data-inspector-component="client/src/App.tsx"
          >
            <div 
              className='confirmTitle'
              data-inspector-id="globalAdb.title"
              data-inspector-label="Global ADB console title"
              data-inspector-component="client/src/App.tsx"
            >
              Chạy lệnh ADB
            </div>
            <textarea
              className='adbQuickInput'
              placeholder='adb shell pm list packages -3'
              value={globalAdbCommand}
              onChange={e => setGlobalAdbCommand(e.target.value)}
              autoFocus
              data-inspector-id="globalAdb.input"
              data-inspector-label="Global ADB command textarea input field"
              data-inspector-component="client/src/App.tsx"
            />
            {globalAdbStatus ? (
              <div 
                className='pageContextStatus'
                data-inspector-id="globalAdb.status"
                data-inspector-label="Global ADB execution status text feedback"
                data-inspector-component="client/src/App.tsx"
              >
                {globalAdbStatus}
              </div>
            ) : null}
            <div className='confirmActions'>
              <button 
                className='modalBtn' 
                onClick={() => setGlobalAdbOpen(false)}
                data-inspector-id="globalAdb.cancelButton"
                data-inspector-label="Global ADB console close/cancel button"
                data-inspector-component="client/src/App.tsx"
              >
                Hủy
              </button>
              <button
                className='modalBtnPrimary'
                disabled={globalAdbRunning || !globalAdbCommand.trim()}
                onClick={runGlobalAdbCommand}
                data-inspector-id="globalAdb.executeButton"
                data-inspector-label="Global ADB console execute button"
                data-inspector-component="client/src/App.tsx"
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

      <MacroPlaybackPanel />

      {/* Modal Thêm Nhóm */}
      {groupModalOpen && (
        <div
          className='confirmOverlay'
          onMouseDown={() => setGroupModalOpen(false)}
          data-inspector-id="savedGroups.addOverlay"
          data-inspector-label="Save group modal overlay background"
          data-inspector-component="client/src/App.tsx"
        >
          <div
            className='confirmPanel'
            style={{ maxWidth: 360 }}
            onMouseDown={e => e.stopPropagation()}
            data-inspector-id="savedGroups.addPanel"
            data-inspector-label="Save group modal card panel"
            data-inspector-component="client/src/App.tsx"
          >
            <div 
              className='confirmTitle'
              data-inspector-id="savedGroups.addTitle"
              data-inspector-label="Save group modal title"
              data-inspector-component="client/src/App.tsx"
            >
              Thêm Nhóm
            </div>
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
              data-inspector-id="savedGroups.addInput"
              data-inspector-label="Save group name input field"
              data-inspector-component="client/src/App.tsx"
            />

            <div className='confirmBtns' style={{ marginTop: 16 }}>
              <button 
                className='modalBtn' 
                onClick={() => setGroupModalOpen(false)}
                data-inspector-id="savedGroups.addCancelButton"
                data-inspector-label="Save group modal cancel button"
                data-inspector-component="client/src/App.tsx"
              >
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
                data-inspector-id="savedGroups.addSaveButton"
                data-inspector-label="Save group modal save button"
                data-inspector-component="client/src/App.tsx"
              >
                Lưu Nhóm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xoá nhóm */}
      {deleteGroupConfirm !== null && (
        <div 
          className='confirmOverlay' 
          onMouseDown={() => setDeleteGroupConfirm(null)}
          data-inspector-id="savedGroups.deleteOverlay"
          data-inspector-label="Delete group confirmation overlay background"
          data-inspector-component="client/src/App.tsx"
        >
          <div 
            className='confirmPanel compact' 
            onMouseDown={e => e.stopPropagation()}
            data-inspector-id="savedGroups.deletePanel"
            data-inspector-label="Delete group confirmation card panel"
            data-inspector-component="client/src/App.tsx"
          >
            <div 
              className='confirmTitle'
              data-inspector-id="savedGroups.deleteTitle"
              data-inspector-label="Delete group confirmation title"
              data-inspector-component="client/src/App.tsx"
            >
              Xoá nhóm
            </div>
            <div className='confirmText'>
              Bạn có chắc muốn xoá nhóm{' '}
              <strong>"{savedGroups[deleteGroupConfirm]?.name}"</strong>?
            </div>
            <div className='confirmActions center'>
              <button 
                className='modalBtn' 
                onClick={() => setDeleteGroupConfirm(null)}
                data-inspector-id="savedGroups.deleteCancelButton"
                data-inspector-label="Delete group confirmation cancel button"
                data-inspector-component="client/src/App.tsx"
              >
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
                data-inspector-id="savedGroups.deleteConfirmButton"
                data-inspector-label="Delete group confirmation execution button"
                data-inspector-component="client/src/App.tsx"
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
          data-inspector-id="savedGroups.contextMenuOverlay"
          data-inspector-label="Saved groups context menu overlay background"
          data-inspector-component="client/src/App.tsx"
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
          data-inspector-id="savedGroups.contextMenu"
          data-inspector-label="Saved groups context menu panel"
          data-inspector-component="client/src/App.tsx"
        >
          <button
            className='ctxMenuItem'
            onClick={() => {
              setRenameGroupIdx(groupContextMenu.idx)
              setRenameGroupValue(savedGroups[groupContextMenu.idx]?.name || '')
              setGroupContextMenu(null)
            }}
            data-inspector-id="savedGroups.contextMenuRename"
            data-inspector-label="Saved groups context menu item: Rename group"
            data-inspector-component="client/src/App.tsx"
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
            data-inspector-id="savedGroups.contextMenuFocus"
            data-inspector-label="Saved groups context menu item: Focus group toggle"
            data-inspector-component="client/src/App.tsx"
          >
            {focusGroupIdx === groupContextMenu.idx ? '👁 Hiện tất cả' : '👁 Chỉ hiện nhóm này'}
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
          data-inspector-id="deviceContext.menuLayer"
          data-inspector-label="Device tile context menu overlay background"
          data-inspector-component="client/src/App.tsx"
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
            data-inspector-id="deviceContext.menu"
            data-inspector-label="Device tile context menu card panel"
            data-inspector-component="client/src/App.tsx"
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
                data-inspector-id="deviceContext.numberInput"
                data-inspector-label="Device tile numbering input field"
                data-inspector-component="client/src/App.tsx"
              />
            </div>

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
                data-inspector-id="deviceContext.profileSubmenu"
                data-inspector-label="Device context menu item: Select profile submenu trigger"
                data-inspector-component="client/src/App.tsx"
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
                    data-inspector-id="deviceContext.createProfileItem"
                    data-inspector-label="Device context menu item: Create profile option"
                    data-inspector-component="client/src/App.tsx"
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
                          data-inspector-id="deviceContext.profileItem"
                          data-inspector-label={`Device context menu item: Assign to profile ${profile.name}`}
                          data-inspector-component="client/src/App.tsx"
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

            {/* === Set WeChat Account (ONLY shown when sourceGrid === 'group') === */}
            {contextMenuTarget.sourceGrid === 'group' && (
              <div
                style={{ position: 'relative' }}
                className='ctxAddToGroupWrap'
                onMouseEnter={() => setCtxSub({ main: 'setAccountList' })}
                onMouseLeave={() => setCtxSub(null)}
              >
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffd700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    padding: '7px 8px',
                    textAlign: 'left',
                    width: '100%',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,215,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                    <Plus size={14} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Set
                    </span>
                  </span>
                  <span style={{ fontSize: 10, color: '#555' }}>▶</span>
                </button>

                {ctxSub?.main === 'setAccountList' && (() => {
                  const clickedUdid = contextMenuTarget!.udid;
                  const devData = getDeviceAccountData(clickedUdid);
                  const accounts = devData?.platforms?.['wechat'] || [];
                  const groupIdx = contextMenuTarget!.groupIdx;
                  const group = groupIdx !== undefined ? savedGroups[groupIdx] : null;
                  const groupSelectedAccounts = group?.selectedAccounts || {};
                  const selectedId = groupSelectedAccounts[clickedUdid];

                  return (
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
                      {accounts.length === 0 ? (
                        <div style={{ padding: '6px 10px', color: '#666', fontSize: 12, fontStyle: 'italic' }}>
                          Không có tài khoản
                        </div>
                      ) : (
                        accounts.map(account => {
                          const isCurrent = selectedId === account.id;
                          return (
                            <button
                              key={account.id}
                              type='button'
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isCurrent ? '#ffd700' : '#cfcfcf',
                                fontSize: '13px',
                                cursor: 'pointer',
                                padding: '6px 10px',
                                textAlign: 'left',
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 8,
                                width: '100%'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                              onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                const isDeselect = selectedId === account.id;

                                if (!isDeselect) {
                                  const today = Date.now();
                                  const date = new Date(today);
                                  const todayStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                  
                                  const updatedPlatforms = { ...devData.platforms };
                                  if (updatedPlatforms['wechat']) {
                                    updatedPlatforms['wechat'] = updatedPlatforms['wechat'].map(acc => {
                                      if (acc.id === account.id) {
                                        const history = acc.history || [];
                                        const alreadyLoggedInToday = history.some(
                                          h => h.action === 'Login' && (
                                            (() => {
                                              const hd = new Date(h.timestamp);
                                              const hdStr = `${hd.getFullYear()}-${String(hd.getMonth() + 1).padStart(2, '0')}-${String(hd.getDate()).padStart(2, '0')}`;
                                              return hdStr === todayStr;
                                            })()
                                          )
                                        );
                                        if (!alreadyLoggedInToday) {
                                          return {
                                            ...acc,
                                            history: [
                                              ...history,
                                              { id: Math.random().toString(36).substr(2, 9), action: 'Login', timestamp: today }
                                            ]
                                          };
                                        }
                                      }
                                      return acc;
                                    });
                                  }
                                  
                                  const newData = {
                                    ...devData,
                                    platforms: updatedPlatforms,
                                  };
                                  saveDeviceAccountData(clickedUdid, newData);
                                }
                                
                                // Update group selection
                                setSavedGroups(prev => prev.map((g, i) => {
                                  if (i !== groupIdx) return g;
                                  const selAcc = { ...(g.selectedAccounts || {}) };
                                  if (isDeselect) {
                                    delete selAcc[clickedUdid];
                                  } else {
                                    selAcc[clickedUdid] = account.id;
                                  }
                                  return { ...g, selectedAccounts: selAcc };
                                }));
                                
                                // Trigger state refresh in App.tsx
                                setVault(loadDeviceAccountVault());
                                
                                // Dispatch event to refresh tiles and overlays
                                window.dispatchEvent(new CustomEvent('monviewphone:dav-hide-settings-changed'));
                                
                                setContextMenuTarget(null);
                                setContextMenuOpen(false);
                              }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {account.name || account.phone || account.nickname || 'Không tên'}
                              </span>
                              {isCurrent ? <span style={{ fontSize: 11, color: '#ffd700' }}>✓ Đang chọn</span> : null}
                            </button>
                          );
                        })
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {contextMenuTarget.groupIdx === undefined ? (
              <button
                className="ctxMenuItem ctxMenuItemDanger"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const { udid } = contextMenuTarget!;
                  setConfirmState({
                    title: 'Xoá thiết bị?',
                    message: 'Bạn có chắc chắn muốn xoá thiết bị này hoàn toàn khỏi hệ thống không?',
                    danger: true,
                    onConfirm: () => {
                      removeUiDeviceEntries([udid]);
                    }
                  });

                  setContextMenuTarget(null);
                  setContextMenuOpen(false);
                  setSubMenuOpen(false);
                }}
              >
                <Trash2 size={14} />
                <span>Xoá Máy</span>
              </button>
            ) : null}

            {/* === Xoá khỏi nhóm — hiện khi click từ grid dropdown nhóm, HOẶC khi đang load nhóm và click từ grid tổng === */}
            {contextMenuTarget.groupIdx !== undefined && (() => {
              const grp = savedGroups[contextMenuTarget.groupIdx]
              const isInGroup = grp?.udids.includes(contextMenuTarget.udid)
              if (!isInGroup) return null
              return (
                <button
                  className="ctxMenuItem ctxMenuItemDanger"
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
                  <Trash2 size={14} />
                  <span>Xoá khỏi nhóm <strong className="ctxMenuItemTarget">"{savedGroups[contextMenuTarget.groupIdx!]?.name}"</strong></span>
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
        <div 
          className="confirmOverlay" 
          onMouseDown={() => setConfirmState(null)}
          data-inspector-id="genericConfirm.overlay"
          data-inspector-label="Generic confirmation overlay background"
          data-inspector-component="client/src/App.tsx"
        >
          <div 
            className={`confirmPanel${confirmState.danger ? ' compact' : ''}`} 
            onMouseDown={e => e.stopPropagation()}
            data-inspector-id="genericConfirm.panel"
            data-inspector-label="Generic confirmation card panel"
            data-inspector-component="client/src/App.tsx"
          >
            <div 
              className="confirmTitle"
              data-inspector-id="genericConfirm.title"
              data-inspector-label="Generic confirmation title"
              data-inspector-component="client/src/App.tsx"
            >
              {confirmState.title}
            </div>
            <div 
              className="confirmText"
              data-inspector-id="genericConfirm.text"
              data-inspector-label="Generic confirmation message text"
              data-inspector-component="client/src/App.tsx"
            >
              {confirmState.message}
            </div>
            <div className={`confirmActions${confirmState.danger ? ' center' : ''}`}>
              <button 
                className="modalBtn" 
                onClick={() => setConfirmState(null)}
                data-inspector-id="genericConfirm.cancelButton"
                data-inspector-label="Generic confirmation cancel button"
                data-inspector-component="client/src/App.tsx"
              >
                {confirmState.cancelText || 'Huỷ'}
              </button>
              <button
                className={confirmState.danger ? 'modalBtnDanger' : 'modalBtnPrimary'}
                onClick={() => {
                  const fn = confirmState.onConfirm;
                  setConfirmState(null);
                  fn();
                }}
                data-inspector-id="genericConfirm.confirmButton"
                data-inspector-label="Generic confirmation execution button"
                data-inspector-component="client/src/App.tsx"
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
          panelOpen={accountManagerOpen}
          onClose={() => {
            setDeviceAccountOverlayOpen(false);
            setAccountManagerOpen(false);
          }}
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
          connectSelection={connectSelection}
          setConnectSelection={setConnectSelection}
          onDeviceContextMenu={(e, udid, groupIdx) => {
            e.preventDefault()
            e.stopPropagation()
            setContextMenuTarget({
              x: e.clientX,
              y: e.clientY,
              udid,
              sourceGrid: 'group',
              groupIdx
            })
            setContextMenuInput(String(orderMap.get(udid) ?? 0))
            setContextMenuOpen(true)
          }}
        />
      )}

      {notesModalOpen && (
        <NotesModal 
          initialNoteId={reminderOpenNoteId}
          onClose={() => setNotesModalOpen(false)} 
        />
      )}

      {activeReminderNote && (
        <div 
          className="notesReminderOverlay"
          onMouseDown={() => setActiveReminderNote(null)}
          data-inspector-id="notes.reminderAlertOverlay"
          data-inspector-label="Notes reminder overlay background alert"
          data-inspector-component="client/src/App.tsx"
        >
          <div 
            className="notesReminderPanel"
            onMouseDown={e => e.stopPropagation()}
            data-inspector-id="notes.reminderAlertPanel"
            data-inspector-label="Notes reminder popup panel"
            data-inspector-component="client/src/App.tsx"
          >
            <div className="notesReminderHeader">
              <Bell size={18} className="dav-bell-counting" />
              <span>Nhắc Nhở Ghi Chú!</span>
            </div>
            <div className="notesReminderTitle">
              {activeReminderNote.title || 'Ghi chú không có tiêu đề'}
            </div>
            {activeReminderNote.content && (
              <div className="notesReminderContent">
                {activeReminderNote.content}
              </div>
            )}
            <div className="notesReminderActions">
              <button
                className="modalBtn"
                onClick={() => setActiveReminderNote(null)}
                data-inspector-id="notes.reminderAlertCloseBtn"
                data-inspector-label="Notes reminder alert dismiss button"
                data-inspector-component="client/src/App.tsx"
              >
                Đóng
              </button>
              <button
                className="modalBtnPrimary"
                onClick={() => {
                  setReminderOpenNoteId(activeReminderNote.id);
                  setActiveReminderNote(null);
                  setNotesModalOpen(true);
                }}
                data-inspector-id="notes.reminderAlertViewBtn"
                data-inspector-label="Notes reminder alert view note button"
                data-inspector-component="client/src/App.tsx"
              >
                Xem Ghi Chú
              </button>
            </div>
          </div>
        </div>
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
      <div 
        className="confirmOverlay" 
        onMouseDown={onClose}
        data-inspector-id="genericInput.overlay"
        data-inspector-label="Generic input modal overlay background"
        data-inspector-component="client/src/App.tsx"
      >
        <div 
          className="confirmPanel" 
          style={{ minWidth: 380, maxWidth: 480 }} 
          onMouseDown={e => e.stopPropagation()}
          data-inspector-id="genericInput.panel"
          data-inspector-label="Generic input modal card panel"
          data-inspector-component="client/src/App.tsx"
        >
          <div 
            className="confirmTitle"
            data-inspector-id="genericInput.title"
            data-inspector-label="Generic input modal title"
            data-inspector-component="client/src/App.tsx"
          >
            {state.title}
          </div>
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
              data-inspector-id="genericInput.field"
              data-inspector-label="Generic input text field"
              data-inspector-component="client/src/App.tsx"
            />
          </div>
          <div className="confirmActions">
            <button 
              type='button' 
              className="modalBtn" 
              onClick={onClose}
              data-inspector-id="genericInput.cancelButton"
              data-inspector-label="Generic input modal cancel button"
              data-inspector-component="client/src/App.tsx"
            >
              Huỷ
            </button>
            <button
              type='button'
              className="modalBtnPrimary"
              style={{
                opacity: value.trim() ? 1 : 0.5,
                cursor: value.trim() ? 'pointer' : 'not-allowed'
              }}
              disabled={!value.trim()}
              onClick={handleSubmit}
              data-inspector-id="genericInput.confirmButton"
              data-inspector-label="Generic input modal confirm button"
              data-inspector-component="client/src/App.tsx"
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
