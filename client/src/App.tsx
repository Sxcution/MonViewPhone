import React, { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react'
import { readPageParams } from '@/lib/params'
import { useServer } from '@/context/ServerContext'
import { Tile } from '@/components/Tile'
import { RightBar } from '@/components/RightBar'
import { STREAM_CONFIG, type StreamConfig } from '@/lib/config'
import { useI18n } from '@/context/I18nContext'
import { HeaderBar } from '@/components/HeaderBar'
import { DeviceViewer } from '@/components/DeviceViewer'
import { useActive } from '@/context/ActiveContext'
import { AndroidKeycode } from '@/lib/keyEvent'
import { encodeKeycodeMessage, KeyEventAction } from '@/lib/control'
import {
  installApk,
  installUploadedApk,
  runAdbCommandApi
} from '@/lib/serverApi'
import { SyncPanel } from '@/components/SyncPanel'
import { useTileOrder } from '@/store/useTileOrder'
import {
  ArrowLeft,
  Camera,
  ChevronsLeft,
  ChevronsRight,
  Home,
  MonitorOff,
  Menu,
  Pin,
  PinOff,
  Package,
  Settings,
  Terminal,
  Upload,
  Volume2,
  VolumeX
} from 'lucide-react'

type TileDims = { width: number; height: number }

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.floor(n)))
}

const BITRATE_MIN = 524_288
const BITRATE_MAX = 8_388_608
const BITRATE_WARN_THRESHOLD = Math.floor(BITRATE_MAX * 0.6) // ~60%
const VIEWER_STREAM_WIDTH = 1000

type ConnectRequestPayload = {
  device: string
  connect: 'usb' | 'wifi'
  port?: number
}

const CONNECT_API_URL = 'http://127.0.0.1:11000/api/devices/connect'
const CONNECT_CHECK_DEVICE_MESSAGE =
  'Please check that the device is properly plugged into the host'
const QUICK_ACTION_ORDER_KEY = 'quickActionOrder'

type QuickActionId =
  | 'screenOff'
  | 'mute'
  | 'soundOn'
  | 'maxVolume'
  | 'back'
  | 'home'
  | 'recent'
  | 'screenshot'

const DEFAULT_QUICK_ACTION_ORDER: QuickActionId[] = [
  'screenOff',
  'mute',
  'soundOn',
  'maxVolume',
  'back',
  'home',
  'recent',
  'screenshot'
]

function loadQuickActionOrder(): QuickActionId[] {
  try {
    const raw = localStorage.getItem(QUICK_ACTION_ORDER_KEY)
    const parsed = JSON.parse(raw || '[]')
    if (!Array.isArray(parsed)) return DEFAULT_QUICK_ACTION_ORDER
    const allowed = new Set(DEFAULT_QUICK_ACTION_ORDER)
    const out = parsed.filter((id): id is QuickActionId => allowed.has(id))
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

export function App() {
  const { t, locale, setLocale, available } = useI18n()
  const { deviceParam, wsServer } = useMemo(() => readPageParams(), [])
  const { androidDevices, pushFile } = useServer()
  const {
    sendKeyTap,
    screenshotActiveCanvas,
    registeredUdids,
    activeUdid,
    selectOnly,
    getTargetsByUdids,
    syncTargets,
    setSyncTargetsList
  } = useActive()

  const [streamConfig, setStreamConfig] = useState<StreamConfig>(STREAM_CONFIG)
  const reloadMap = useRef<Map<string, () => void>>(new Map())
  const [viewerUdid, setViewerUdid] = useState<string | null>(null)
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
      const saved = Number(localStorage.getItem('viewerWidthPx') || '900')
      if (Number.isFinite(saved)) {
        return clamp(saved, 400, 1400)
      }
    } catch { }
    return 900
  })
  const [viewerOverrideConfig, setViewerOverrideConfig] =
    useState<StreamConfig | null>(null)
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
  const [pageContextMenu, setPageContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [contextMenuInput, setContextMenuInput] = useState('')
  const [globalAdbOpen, setGlobalAdbOpen] = useState(false)
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
  const [showTileInfo, setShowTileInfo] = useState(() => {
    try {
      return localStorage.getItem('showTileInfo') !== 'false'
    } catch {
      return true
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem('showTileInfo', String(showTileInfo))
    } catch { }
  }, [showTileInfo])
  const [remoteDevices, setRemoteDevices] = useState<
    Array<{ udid: string; type: 'usb' | 'wifi' | 'unknown' }>
  >([])
  const wsDevicesRef = useRef<WebSocket | null>(null)
  const [connectSelection, setConnectSelection] = useState<Set<string>>(
    () => new Set(syncTargets)
  )
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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

  // Track vị trí chuột cho tooltip
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const [connectModalOpen, setConnectModalOpen] = useState(false)

  // ===== SAVED GROUPS =====
  const [savedGroups, setSavedGroups] = useState<Array<{ name: string; udids: string[] }>>(() => {
    try {
      const raw = localStorage.getItem('savedGroups')
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  })

  useEffect(() => {
    try {
      localStorage.setItem('savedGroups', JSON.stringify(savedGroups))
    } catch { }
  }, [savedGroups])

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
        const response = await fetch(CONNECT_API_URL, {
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
    [formatConnectNotification, t]
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
      isSidebarPinned ? 'var(--config-width)' : '20px'
    )
    return () => {
      document.body.classList.remove(cls)
    }
  }, [isSidebarPinned])

  const registerReload = useCallback((udid: string, fn: () => void) => {
    reloadMap.current.set(udid, fn)
  }, [])

  const unregisterReload = useCallback((udid: string) => {
    reloadMap.current.delete(udid)
  }, [])
  // useEffect(() => {
  //   console.log(viewerOverrideConfig)
  // }, [viewerOverrideConfig])
  const PHONE_SHELL_RATIO = 20 / 9;
  const DEFAULT_DIMS: TileDims = { width: 350, height: Math.round(350 * PHONE_SHELL_RATIO) }

  // Persisted tile size
  const [tileDims, setTileDims] = useState<TileDims>(() => {
    try {
      const saved = localStorage.getItem('deviceDimensions')
      if (!saved) return DEFAULT_DIMS
      const p = JSON.parse(saved)
      const w = clamp(Number(p?.width), 100, 4000)
      const h = Math.round(w * PHONE_SHELL_RATIO)
      return { width: w, height: h }
    } catch {
      return DEFAULT_DIMS
    }
  })

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
    const width = clamp(w, 100, 4000)
    const height = Math.round(width * PHONE_SHELL_RATIO)
    const next = { width, height }
    dimsRef.current = next
    applyDimsToGrid(next)
    setTileDims(next)
    scheduleSave(next)
  }
  const updateViewerWidthPx = (w: number) => {
    const next = clamp(w, 400, 1400)
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
    const connect = () => {
      try {
        const ws = new WebSocket('ws://localhost:11000/?action=devices-list')
        wsDevicesRef.current = ws
        ws.onmessage = ev => {
          try {
            const payload = JSON.parse(ev.data as string)
            if (Array.isArray(payload)) {
              const dedup = new Map<string, { udid: string; type: 'usb' | 'wifi' | 'unknown' }>()
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
              startTransition(() => {
                setRemoteDevices(mapped)
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
        }
        ws.onerror = () => {
          ws.close()
        }
      } catch {
        // ignore
      }
    }
    connect()
    return () => {
      wsDevicesRef.current?.close()
      wsDevicesRef.current = null
    }
  }, [])

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
  }, [registeredUdids, deviceFilter, getDeviceConnectionType, focusGroupIdx, savedGroups])
  const orderMap = useMemo(() => {
    const m = new Map<string, number>()
    mergedOrder.forEach((id, idx) => m.set(id, getTileNumber(id, idx + 1)))
    return m
  }, [mergedOrder, getTileNumber])
  const orderedRegistered = useMemo(() => {
    const arr = [...filteredRegistered]
    arr.sort((a, b) => {
      const oa = orderMap.get(a) ?? Number.MAX_SAFE_INTEGER
      const ob = orderMap.get(b) ?? Number.MAX_SAFE_INTEGER
      return oa - ob
    })
    return arr
  }, [filteredRegistered, orderMap])
  const currentFocusGroupSet = useMemo(() => {
    if (focusGroupIdx !== null && savedGroups[focusGroupIdx]) {
      return new Set(savedGroups[focusGroupIdx].udids);
    }
    return null;
  }, [focusGroupIdx, savedGroups]);

  const selectedVisible = useMemo(
    () => orderedRegistered.filter(id => connectSelection.has(id)),
    [orderedRegistered, connectSelection]
  )
  const [quickActionOrder, setQuickActionOrder] = useState<QuickActionId[]>(
    loadQuickActionOrder
  )
  const [draggingQuickAction, setDraggingQuickAction] =
    useState<QuickActionId | null>(null)
  const allSelected =
    orderedRegistered.length > 0 &&
    orderedRegistered.every(id => connectSelection.has(id))
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
      for (const udid of targets) {
        for (const command of commands) {
          try {
            await runAdbCommandApi(wsServer, udid, command)
          } catch {
            // ignore quick action failures; server returns output in UI logs elsewhere.
          }
        }
      }
    },
    [quickCommandTargets, wsServer]
  )

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
        newSelected.add(udid)
      }
    })
    setConnectSelection(newSelected)
  }, [mergedOrder])

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
  // Ctrl + A chon tat ca thiet bi để chọn tất cả thiết bị
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A chọn tất cả
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA') {
        const active = document.activeElement?.nodeName.toLowerCase()
        if (
          ['input', 'textarea', 'select'].includes(active || '') ||
          (document.activeElement as HTMLElement)?.isContentEditable
        )
          return
        e.preventDefault()
        setConnectSelection(new Set(mergedOrder))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mergedOrder])

  const [draftConfig, setDraftConfig] = useState<StreamConfig>(STREAM_CONFIG)
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

  const normalizeStreamConfig = (cfg: StreamConfig): StreamConfig => {
    const bitrate = clamp(cfg.bitrate, 524288, 8_388_608)
    const maxFps = clamp(cfg.maxFps, 1, 60)
    const iFrameInterval = clamp(cfg.iFrameInterval, 0, 60)
    const width = clamp(cfg.bounds?.width ?? 0, 400, 1200)
    const height = clamp(cfg.bounds?.height ?? 0, 400, 4000)
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

  const buildViewerConfig = useCallback((base: StreamConfig): StreamConfig => {
    const width = clamp(VIEWER_STREAM_WIDTH, 400, 1200)
    const aspect =
      base.bounds?.width && base.bounds?.height
        ? base.bounds.height / base.bounds.width
        : boundsAspectRef.current || 1
    const height = clamp(Math.round(width * aspect), 400, 4000)
    return {
      ...base,
      bounds: { width, height },
      bitrate: 8_388_608,
      maxFps: 60
    }
  }, [])

  // When switching viewer device, reset offset and apply per-viewer config; when closing, revert and reload tile.
  useEffect(() => {
    const prevViewed = lastViewedRef.current
    if (viewerUdid) {
      lastViewedRef.current = viewerUdid
      setViewerOffset({ x: 0, y: 0 })
      const nextCfg = buildViewerConfig(streamConfig)
      setViewerOverrideConfig(prev =>
        prev && sameStreamConfig(prev, nextCfg) ? prev : nextCfg
      )
    } else {
      setViewerOverrideConfig(prev => (prev ? null : prev))
      if (prevViewed) {
        const fn = reloadMap.current.get(prevViewed)
        try {
          fn?.()
        } catch { }
      }
      lastViewedRef.current = null
    }
  }, [viewerUdid, streamConfig, buildViewerConfig])

  const updateBoundsWidth = (widthRaw: number) => {
    const width = clamp(widthRaw, 400, 1200)
    const height = Math.max(1, Math.round(width * boundsAspectRef.current))
    setDraftConfig(prev => ({
      ...prev,
      bounds: { width, height }
    }))
  }

  const reloadAllTiles = useCallback(() => {
    reloadMap.current.forEach(fn => {
      try {
        fn?.()
      } catch {
        // ignore
      }
    })
  }, [])

  useEffect(() => {
    if (viewerUdid && viewerOverrideConfig) {
      const fn = reloadMap.current.get(viewerUdid)
      try {
        fn?.()
      } catch { }
    }
  }, [viewerOverrideConfig, viewerUdid])

  const applyDraftConfig = useCallback(() => {
    const next = normalizeStreamConfig(draftConfig)
    setStreamConfig(prev => {
      if (sameStreamConfig(prev, next)) return prev
      reloadAllTiles()
      return next
    })
  }, [draftConfig, reloadAllTiles])

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
      applyDraftConfig()
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
    applyDraftConfig,
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
      screenOff: {
        label: 'Tắt màn hình',
        icon: <MonitorOff size={15} strokeWidth={1.8} />,
        run: () => runQuickAdbCommands(['adb shell input keyevent 26'])
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
      back: {
        label: 'Quay lại',
        icon: <ArrowLeft size={15} strokeWidth={1.8} />,
        run: () => {
          const targets = quickCommandTargets()
          const keyTargets = getTargetsByUdids(targets)
          if (keyTargets.length) {
            const down = encodeKeycodeMessage(KeyEventAction.DOWN, AndroidKeycode.KEYCODE_BACK)
            const up = encodeKeycodeMessage(KeyEventAction.UP, AndroidKeycode.KEYCODE_BACK)
            for (const t of keyTargets) { try { t.ws.send(down); t.ws.send(up) } catch { } }
          } else {
            sendKeyTap(AndroidKeycode.KEYCODE_BACK)
          }
        }
      },
      home: {
        label: 'Home',
        icon: <Home size={15} strokeWidth={1.8} />,
        run: () => {
          const targets = quickCommandTargets()
          const keyTargets = getTargetsByUdids(targets)
          if (keyTargets.length) {
            const down = encodeKeycodeMessage(KeyEventAction.DOWN, AndroidKeycode.KEYCODE_HOME)
            const up = encodeKeycodeMessage(KeyEventAction.UP, AndroidKeycode.KEYCODE_HOME)
            for (const t of keyTargets) { try { t.ws.send(down); t.ws.send(up) } catch { } }
          } else {
            sendKeyTap(AndroidKeycode.KEYCODE_HOME)
          }
        }
      },
      recent: {
        label: 'Đa nhiệm',
        icon: <Menu size={15} strokeWidth={1.8} />,
        run: () => {
          const targets = quickCommandTargets()
          const keyTargets = getTargetsByUdids(targets)
          if (keyTargets.length) {
            const down = encodeKeycodeMessage(KeyEventAction.DOWN, AndroidKeycode.KEYCODE_APP_SWITCH)
            const up = encodeKeycodeMessage(KeyEventAction.UP, AndroidKeycode.KEYCODE_APP_SWITCH)
            for (const t of keyTargets) { try { t.ws.send(down); t.ws.send(up) } catch { } }
          } else {
            sendKeyTap(AndroidKeycode.KEYCODE_APP_SWITCH)
          }
        }
      },
      screenshot: {
        label: 'Chụp màn hình',
        icon: <Camera size={15} strokeWidth={1.8} />,
        run: () => screenshotActiveCanvas()
      }
    }),
    [runQuickAdbCommands, screenshotActiveCanvas, sendKeyTap, quickCommandTargets, getTargetsByUdids]
  )

  {/* ===== SIDEBAR DEVICE GRID — Tổng tất cả ===== */}
  const SidebarDeviceGrid = () => {
    if (allKnownDevices.length === 0) return null;
    return (
      <div style={{ padding: '6px 4px 2px', borderBottom: '1px solid #2a2a2a', marginBottom: 4 }}>
        <div style={{ fontSize: 10, color: '#666', padding: '0 4px 4px', letterSpacing: '0.5px' }}>
          THIẾT BỊ ({allKnownDevices.length})
        </div>
        <div className="sidebar-device-grid">
          {allKnownDevices.map((device, index) => {
            const isOnline = connectedUdids.has(device.udid);
            const label = `P${index + 1}`;
            return (
              <div
                key={device.udid}
                className={`sidebar-device-item ${isOnline ? 'online' : 'offline'}`}
                title={isOnline ? `[Online] ${device.udid}` : `[Offline] ${device.udid}`}
                onClick={() => { if (isOnline) selectOnly(device.udid); }}
              >
                <span className="dev-index">{index + 1}</span>
                <span className="dev-status-dot" />
                <span className="dev-label">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <HeaderBar wsServer={wsServer} />
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
        <div
          id='gridScroll'
          ref={gridScrollRef}
          onPointerDown={onGridPointerDown}
          onPointerMove={onGridPointerMove}
          onPointerUp={onGridPointerUp}
          onPointerCancel={onGridPointerUp}
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
            {mergedOrder.map((udid, idx) => {
              const isConnected = connectedUdids.has(udid)
              // isVisible: kiểm tra bộ lọc loại kết nối và nhóm
              const isVisible = (deviceFilter === 'all' || getDeviceConnectionType(udid) === deviceFilter) &&
                (!currentFocusGroupSet || currentFocusGroupSet.has(udid));

              return (
                <div
                  key={udid}
                  data-udid={udid}
                  className={`tileDraggableWrapper${isSingleDevice ? ' single' : ''
                    }${dragging ? ' dragging' : ''}${viewerUdid === udid ? ' hiddenByViewer' : ''
                    }${dropTarget === udid ? ' dropTarget' : ''}`}
                  onPointerDownCapture={e => {
                    if (e.button !== 2) return
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onMouseDownCapture={e => {
                    if (e.button !== 2) return
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onPointerDown={onTilePointerDown}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    // Nhường thao tác UI cho các nút riêng
                    if (target.closest('button') || target.tagName.toLowerCase() === 'input') return;

                    // CHỈ CÓ TÁC DỤNG nếu đang đè phím Ctrl/Meta
                    if (!e.ctrlKey && !e.metaKey) return;

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
                    if (e.ctrlKey || e.metaKey) {
                      selectOnly(udid)
                      setViewerUdid(udid)
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
                    order={getTileNumber(udid, idx + 1)}
                    deviceParam={udid}
                    wsServer={wsServer}
                    isViewing={viewerUdid === udid}
                    selected={connectSelection.has(udid)}
                    showTileInfo={showTileInfo}
                    isDisconnected={!isConnected}   // <-- THÊM DÒNG NÀY
                    streamConfig={
                      viewerUdid === udid && viewerOverrideConfig
                        ? viewerOverrideConfig
                        : streamConfig
                    }
                    onRegisterReload={registerReload}
                    onUnregisterReload={unregisterReload}
                    onViewDevice={id => {
                      setViewerUdid(id)
                    }}
                    onMove={moveTile}
                    onChangeOrderNumber={setTileNumber}
                    onDragStart={id => setDraggingTile(id)}
                    onDragEnd={() => setDraggingTile(null)}
                  />
                </div>
              );
            })}
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
        <RightBar
          hidden={false}
          showExpand={false}
          hideSyncButtons={false}
          onExpand={() => { }}
        />
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
            <SidebarDeviceGrid />
            <details className='rcpSection rcpDropdown'>
              <summary className='rcpTitle rcpDropdownSummary'>
                {viewerUdid ? t('Stream config (viewer)') : t('Stream config')}
              </summary>
              <div className='rcpToggleRow'>
                <span>{t('Hiển thị Title / Nav')}</span>
                <button
                  className={`rcpToggleBtn ${showTileInfo ? 'on' : ''}`}
                  onClick={() => setShowTileInfo(prev => !prev)}
                >
                  {showTileInfo ? t('Bật') : t('Tắt')}
                </button>
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
                  min='150'
                  max='2000'
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
                  min='400'
                  max='1400'
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
                    if (viewerUdid && viewerOverrideConfig) {
                      const next = clamp(
                        (viewerOverrideConfig?.bitrate || 0) + delta,
                        BITRATE_MIN,
                        BITRATE_MAX
                      )
                      setViewerOverrideConfig(prev =>
                        prev ? { ...prev, bitrate: next } : prev
                      )
                    } else {
                      handleBitrateChange(
                        clamp(
                          draftConfig.bitrate + delta,
                          BITRATE_MIN,
                          BITRATE_MAX
                        )
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
                    viewerUdid && viewerOverrideConfig
                      ? viewerOverrideConfig.bitrate
                      : draftConfig.bitrate
                  }
                  onChange={e =>
                    viewerUdid && viewerOverrideConfig
                      ? setViewerOverrideConfig(prev =>
                        prev
                          ? { ...prev, bitrate: Number(e.target.value) }
                          : prev
                      )
                      : handleBitrateChange(Number(e.target.value))
                  }
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
                    if (viewerUdid && viewerOverrideConfig) {
                      const next = clamp(
                        (viewerOverrideConfig?.bitrate || 0) + delta,
                        BITRATE_MIN,
                        BITRATE_MAX
                      )
                      setViewerOverrideConfig(prev =>
                        prev ? { ...prev, bitrate: next } : prev
                      )
                    } else {
                      handleBitrateChange(
                        clamp(
                          draftConfig.bitrate + delta,
                          BITRATE_MIN,
                          BITRATE_MAX
                        )
                      )
                    }
                  }}
                >
                  +
                </button>
                <div className='rcpValue'>
                  {(viewerUdid && viewerOverrideConfig
                    ? viewerOverrideConfig.bitrate
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
                    if (viewerUdid && viewerOverrideConfig) {
                      const next = clamp(
                        (viewerOverrideConfig?.maxFps || 1) - 1,
                        1,
                        60
                      )
                      setViewerOverrideConfig(prev =>
                        prev ? { ...prev, maxFps: next } : prev
                      )
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
                    viewerUdid && viewerOverrideConfig
                      ? viewerOverrideConfig.maxFps
                      : draftConfig.maxFps
                  }
                  onChange={e =>
                    viewerUdid && viewerOverrideConfig
                      ? setViewerOverrideConfig(prev =>
                        prev
                          ? { ...prev, maxFps: Number(e.target.value) }
                          : prev
                      )
                      : setDraftConfig(prev => ({
                        ...prev,
                        maxFps: Number(e.target.value)
                      }))
                  }
                  className='modalRange'
                />
                <button
                  className='rcpStepBtn'
                  aria-label={t('Increase FPS')}
                  onClick={() => {
                    if (viewerUdid && viewerOverrideConfig) {
                      const next = clamp(
                        (viewerOverrideConfig?.maxFps || 1) + 1,
                        1,
                        60
                      )
                      setViewerOverrideConfig(prev =>
                        prev ? { ...prev, maxFps: next } : prev
                      )
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
                  {viewerUdid && viewerOverrideConfig
                    ? viewerOverrideConfig.maxFps
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
                    if (viewerUdid && viewerOverrideConfig) {
                      const w = clamp(
                        (viewerOverrideConfig?.bounds?.width || 400) - 20,
                        400,
                        1200
                      )
                      const h = Math.max(
                        1,
                        Math.round(w * boundsAspectRef.current)
                      )
                      setViewerOverrideConfig(prev =>
                        prev ? { ...prev, bounds: { width: w, height: h } } : prev
                      )
                    } else {
                      updateBoundsWidth(draftConfig.bounds.width - 20)
                    }
                  }}
                >
                  –
                </button>
                <input
                  type='range'
                  min='400'
                  max='1200'
                  value={
                    viewerUdid && viewerOverrideConfig
                      ? viewerOverrideConfig.bounds.width
                      : draftConfig.bounds.width
                  }
                  onChange={e => {
                    if (viewerUdid && viewerOverrideConfig) {
                      const w = clamp(Number(e.target.value), 400, 1200)
                      const h = Math.max(
                        1,
                        Math.round(w * boundsAspectRef.current)
                      )
                      setViewerOverrideConfig(prev =>
                        prev ? { ...prev, bounds: { width: w, height: h } } : prev
                      )
                    } else {
                      updateBoundsWidth(Number(e.target.value))
                    }
                  }}
                  className='modalRange'
                />
                <button
                  className='rcpStepBtn'
                  aria-label={t('Increase stream width')}
                  onClick={() => {
                    if (viewerUdid && viewerOverrideConfig) {
                      const w = clamp(
                        (viewerOverrideConfig?.bounds?.width || 400) + 20,
                        400,
                        1200
                      )
                      const h = Math.max(
                        1,
                        Math.round(w * boundsAspectRef.current)
                      )
                      setViewerOverrideConfig(prev =>
                        prev ? { ...prev, bounds: { width: w, height: h } } : prev
                      )
                    } else {
                      updateBoundsWidth(draftConfig.bounds.width + 20)
                    }
                  }}
                >
                  +
                </button>
                <div className='rcpValue'>
                  {viewerUdid && viewerOverrideConfig
                    ? viewerOverrideConfig.bounds.width
                    : draftConfig.bounds.width}
                  px
                </div>
              </div>
            </details>

            <div className='rcpSection'>
              <div className='rcpTitle'>{t('Điều khiển nhanh')}</div>
              <div className='rcpActions rcpQuickActions'>
                {quickActionOrder.map(id => {
                  const action = quickActions[id]
                  return (
                    <button
                      key={id}
                      className={`rcpBtn rcpQuickBtn${draggingQuickAction === id ? ' dragging' : ''
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
                          filteredRegistered.forEach(id => next.delete(id))
                        } else {
                          filteredRegistered.forEach(id => next.add(id))
                        }
                        return next
                      })
                    }}
                  >
                    <span className='rcpSelectIcon'>{allSelected ? '✔' : ''}</span>
                    <span className='rcpSelectText'>
                      {allSelected ? t('Deselect all') : t('Select all')}
                    </span>
                    <span className='rcpSelectCount'>({filteredRegistered.length})</span>
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
                </div>
                {connectNotification ? (
                  <div className={`rcpConnectNotification ${connectNotification.type}`}>
                    {connectNotification.text}
                  </div>
                ) : null}
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
                            <span className='rcpSavedGroupCount'>{group.udids.length}</span>
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
                            <div className='rcpGrid rcpGridCompact' style={{ marginTop: 4 }}>
                              {group.udids.filter(uid => connectedUdids.has(uid)).map(uid => (
                                <div
                                  key={uid}
                                  className={`rcpGridItem${connectSelection.has(uid) ? ' on' : ''} rcpGroupDeviceItem`}
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
                <div className='rcpGridWrap' style={{ marginTop: '12px' }}>
                  <div className='rcpGrid rcpGridCompact'>
                    {orderedRegistered.map((id) => (
                      <label
                        key={id}
                        className={`rcpGridItem${connectSelection.has(id) ? ' on' : ''}`}
                        onContextMenu={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          // Truyền thêm activeGroupIdx để context menu biết đang active nhóm nào
                          setContextMenuTarget({
                            x: e.clientX,
                            y: e.clientY,
                            udid: id,
                            groupIdx: activeGroupIdx ?? undefined,  // nếu đang load nhóm thì truyền idx nhóm đó
                            sourceGrid: 'main'
                          })
                          setContextMenuInput(String(orderMap.get(id) ?? 0))
                          setContextMenuOpen(true)
                        }}
                      >
                        <input
                          type='checkbox'
                          checked={connectSelection.has(id)}
                          onChange={(e) => {
                            setConnectSelection((prev) => {
                              const next = new Set(prev)
                              if (e.target.checked) next.add(id)
                              else next.delete(id)
                              return next
                            })
                          }}
                        />
                        <span>{String(orderMap.get(id) ?? 0).padStart(2, '0')}</span>
                      </label>
                    ))}
                  </div>
                  {!orderedRegistered.length ? <div className='rcpHint'>{t('Chưa có device')}</div> : null}
                </div>
              </div>
            </div>
            <div className='rcpSection' style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #2a2a2a' }}>
              <div className='rcpSliderRow' style={{ marginBottom: 0 }}>
                <div className='rcpSliderLabel'>{t('Ngôn ngữ')}</div>
                <select
                  className='headerLangSelect'
                  value={locale}
                  onChange={e => setLocale(e.target.value as any)}
                  style={{ marginLeft: 'auto', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '4px', padding: '2px 6px' }}
                >
                  {available.map(code => (
                    <option key={code} value={code}>
                      {code.toUpperCase()}
                    </option>
                  ))}
                </select>
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
            onMouseDown={e => e.stopPropagation()}
            onPointerDown={onViewerPointerDown}
          >
            <div className='viewerOverlayPanel device-viewer-container'>
              <DeviceViewer
                udid={viewerUdid}
                wsServer={wsServer}
                onClose={() => setViewerUdid(null)}
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
        <div className='confirmOverlay' style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(5, 5, 5, 0.75)' }} onMouseDown={() => setAppSettingsVisible(false)}>
          <div className='confirmPanel' style={{ maxWidth: 480, padding: '24px 32px', borderRadius: 20, background: 'linear-gradient(145deg, #161616, #222222)', boxShadow: '0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)', border: '1px solid #333' }} onMouseDown={e => e.stopPropagation()}>
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
                  applyDraftConfig()
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
        <div
          className='confirmOverlay'
          onMouseDown={() => setDeleteGroupConfirm(null)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            className='confirmPanel'
            style={{ maxWidth: 320, textAlign: 'center' }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className='confirmText' style={{ marginBottom: 20 }}>
              Bạn có chắc muốn xoá nhóm{' '}
              <strong>"{savedGroups[deleteGroupConfirm]?.name}"</strong>?
            </div>
            <div className='confirmBtns' style={{ marginTop: 0, justifyContent: 'center', display: 'flex', gap: 12 }}>
              <button className='modalBtn' onClick={() => setDeleteGroupConfirm(null)}>
                Huỷ
              </button>
              <button
                className='modalBtnPrimary'
                style={{ background: '#e94560', borderColor: '#e94560' }}
                onClick={() => {
                  const idx = deleteGroupConfirm
                  setSavedGroups(prev => prev.filter((_, i) => i !== idx))
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
        </div>
      )}
      {contextMenuTarget ? (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}
          onClick={() => {
            setContextMenuTarget(null)
            setContextMenuOpen(false)
          }}
          onContextMenu={e => {
            e.preventDefault()
            setContextMenuTarget(null)
            setContextMenuOpen(false)
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
                  onClick={() => {
                    const { udid, groupIdx } = contextMenuTarget!
                    if (groupIdx === undefined) return
                    setSavedGroups(prev => prev.map((g, i) =>
                      i === groupIdx ? { ...g, udids: g.udids.filter(u => u !== udid) } : g
                    ))
                    if (activeGroupIdx === groupIdx) {
                      setConnectSelection(prev => { const s = new Set(prev); s.delete(udid); return s })
                    }
                    setContextMenuTarget(null)
                    setContextMenuOpen(false)
                  }}
                >
                  <span>🗑</span> Xoá khỏi nhóm <strong style={{ color: '#ff8080', fontSize: 11 }}>"{savedGroups[contextMenuTarget.groupIdx!]?.name}"</strong>
                </button>
              )
            })()}

            {/* === Thêm vào nhóm (submenu) — hiện khi có nhóm đã tạo === */}
            {savedGroups.length > 0 && (
              <div style={{ position: 'relative' }} className='ctxAddToGroupWrap'>
                <button
                  style={{ background: 'transparent', border: 'none', color: '#7aadff', fontSize: '13px', cursor: 'pointer', padding: '7px 8px', textAlign: 'left', width: '100%', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(122,173,255,0.1)';
                    const sub = e.currentTarget.nextElementSibling as HTMLElement
                    if (sub) sub.style.display = 'flex'
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
                    display: 'none',
                    position: 'absolute',
                    top: 0,
                    left: '100%',
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
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.display = 'flex' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.display = 'none' }}
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
                        onClick={() => {
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

      {/* === Tooltip số device theo con trỏ chuột === */}
      {connectSelection.size > 0 && (
        <div
          className="cursorDeviceTooltip"
          style={{
            left: mousePos.x + 14,
            top: mousePos.y + 14,
          }}
        >
          {connectSelection.size}
        </div>
      )}
    </>
  )
}
