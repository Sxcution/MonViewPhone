import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useActive } from '@/context/ActiveContext';
import { useServer } from '@/context/ServerContext';
import { attachTouchControls } from '@/lib/touchControls';
import type { FileStats } from '@/lib/serverApi';
import { encodeKeycodeMessage, encodeTouchMessage, KeyEventAction, MotionAction } from '@/lib/control';
import { AndroidKeycode } from '@/lib/keyEvent';
import type { ConnectionMode, ConnectionState } from '@/components/tile/types';
import { ShellPage } from '@/pages/ShellPage';
import { ViewerSidePanel } from './ViewerSidePanel';
import { DeviceAccountPanel } from './DeviceAccountOverlay';
import { loadDeviceAccountVault, getDeviceAccountDataFromVault, type DeviceAccountData } from '@/lib/deviceAccountVault';
import {
  ArrowLeft,
  Camera,
  Download,
  FileText,
  Folder,
  Home,
  Menu,
  Power,
  RefreshCw,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

type Props = {
  udid: string;
  onClose: () => void;
  wsServer: string;
  currentOrder?: number;
  onChangeOrder?: (udid: string, newIndex: number) => void;
  connectSelection?: Set<string>;
  connectionMode?: ConnectionState;
  availableConnections?: Partial<Record<ConnectionMode, boolean>>;
  onChangeConnection?: (mode: ConnectionMode) => void;
  onSyncNovaWechat?: (udids: string[], dataByUdid?: Record<string, DeviceAccountData>, force?: boolean) => Promise<void>;
};

type ViewerTab = 'view' | 'files' | 'apps' | 'shell';

type GameWasdConfig = {
  x01: number;
  y01: number;
  size01: number;
};

type CustomKeyConfig = {
  code: string;
  key: string;
  x01: number;
  y01: number;
};

type ActiveBindingKey = {
  index: number;
  x01: number;
  y01: number;
  isNew: boolean;
} | null;

const GAME_WASD_STORAGE_KEY = 'monviewphone:game:liquan:wasd';
const GAME_WASD_POINTER_ID = 77;
const GAME_WASD_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD']);
const DEFAULT_GAME_WASD_CONFIG: GameWasdConfig = { x01: 0.165, y01: 0.61, size01: 0.22 };

function clampGameValue(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function loadGameWasdConfig(): GameWasdConfig {
  try {
    const raw = localStorage.getItem(GAME_WASD_STORAGE_KEY);
    if (!raw) return DEFAULT_GAME_WASD_CONFIG;
    const parsed = JSON.parse(raw) as Partial<GameWasdConfig>;
    return {
      x01: clampGameValue(Number(parsed.x01 ?? DEFAULT_GAME_WASD_CONFIG.x01), 0, 0.9),
      y01: clampGameValue(Number(parsed.y01 ?? DEFAULT_GAME_WASD_CONFIG.y01), 0, 0.9),
      size01: clampGameValue(Number(parsed.size01 ?? DEFAULT_GAME_WASD_CONFIG.size01), 0.12, 0.4),
    };
  } catch {
    return DEFAULT_GAME_WASD_CONFIG;
  }
}

function saveGameWasdConfig(config: GameWasdConfig) {
  try {
    localStorage.setItem(GAME_WASD_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

function isGameKeyboardEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

function normPath(p: string): string {
  let out = (p || '/').trim().replace(/\\/g, '/');
  out = out.replace(/\/+/g, '/');
  if (!out.startsWith('/')) out = '/' + out;
  return out;
}

function joinPath(base: string, name: string): string {
  const b = normPath(base);
  const n = String(name || '').replace(/^\/+/, '');
  if (b.endsWith('/')) return b + n;
  return b + '/' + n;
}

function parentPath(p: string): string {
  const x = normPath(p);
  if (x === '/' || x === '') return '/';
  const noTrail = x.endsWith('/') ? x.slice(0, -1) : x;
  const idx = noTrail.lastIndexOf('/');
  if (idx <= 0) return '/';
  return noTrail.slice(0, idx + 1);
}

function isTextFile(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.endsWith('.txt') ||
    n.endsWith('.log') ||
    n.endsWith('.json') ||
    n.endsWith('.xml') ||
    n.endsWith('.csv') ||
    n.endsWith('.md') ||
    n.endsWith('.ini') ||
    n.endsWith('.yaml') ||
    n.endsWith('.yml') ||
    n.endsWith('.js') ||
    n.endsWith('.ts') ||
    n.endsWith('.html') ||
    n.endsWith('.css')
  );
}

function isImageFile(name: string): boolean {
  const n = name.toLowerCase();
  return n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.webp') || n.endsWith('.gif');
}

type PreviewState =
  | { kind: 'none' }
  | { kind: 'text'; path: string; text: string }
  | { kind: 'image'; path: string; url: string }
  | { kind: 'blob'; path: string; url: string };

/**
 * Right-side "Open device" viewer:
 * - Mirrors the decoded canvas from the tile (no extra WS/decoder)
 * - Fixes aspect ratio (no stretch)
 * - Adds per-device Files + Apps panels
 */
const DeviceViewerComponent = ({
  udid,
  onClose,
  wsServer,
  currentOrder,
  onChangeOrder,
  connectSelection,
  connectionMode = 'unknown',
  availableConnections,
  onChangeConnection,
  onSyncNovaWechat,
}: Props) => {
  const { androidDeviceMap, listDir, pullFile, pushFile } = useServer();
  const { getCanvasForUdid, getInputTargetsForSource, getTargetsByUdids, selectOnly } = useActive();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detachRef = useRef<(() => void) | null>(null);
  const pressedWasdKeysRef = useRef<Set<string>>(new Set());
  const joystickDownRef = useRef(false);
  const lastWasdTouchRef = useRef<{ x01: number; y01: number } | null>(null);
  const [gameModeEnabled, setGameModeEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`monviewphone:game-mode:${udid}`) === 'true';
    } catch {
      return false;
    }
  });
  const [wasdEditVisible, setWasdEditVisible] = useState(false);
  const wasdTimerRef = useRef<number | null>(null);
  const [wasdPreviewActive, setWasdPreviewActive] = useState(false);
  const [wasdConfig, setWasdConfig] = useState<GameWasdConfig>(() => loadGameWasdConfig());

  const [customKeys, setCustomKeys] = useState<CustomKeyConfig[]>(() => {
    try {
      const raw = localStorage.getItem(`monviewphone:game:keys:${udid}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isAddingKeyMode, setIsAddingKeyMode] = useState(false);
  const [activeBindingKey, setActiveBindingKey] = useState<ActiveBindingKey>(null);
  const pressedCustomKeysRef = useRef<Map<string, number>>(new Map());

  const saveCustomKeys = (keys: CustomKeyConfig[]) => {
    setCustomKeys(keys);
    try {
      localStorage.setItem(`monviewphone:game:keys:${udid}`, JSON.stringify(keys));
    } catch {}
  };

  useEffect(() => {
    return () => {
      if (wasdTimerRef.current) {
        clearTimeout(wasdTimerRef.current);
      }
    };
  }, []);
  const rafRef = useRef<number | null>(null);

  const [status, setStatus] = useState<'connecting' | 'ready'>('connecting');
  const statusRef = useRef<'connecting' | 'ready'>('connecting');
  const [tab, setTab] = useState<ViewerTab>('view');
  const [serialCopied, setSerialCopied] = useState(false);
  const [newOrderViewer, setNewOrderViewer] = useState('');
  const handleChangeOrderViewer = () => {
    const n = parseInt(newOrderViewer, 10);
    if (!isFinite(n) || n <= 0) return;
    onChangeOrder?.(udid, n - 1);
    setNewOrderViewer('');
  };

  const [alwaysShowHeader, setAlwaysShowHeader] = useState(() => localStorage.getItem('monviewphone:dav-always-show-header') === 'true');
  const [headerHideOrder, setHeaderHideOrder] = useState(() => localStorage.getItem('monviewphone:dav-header-hide-order') === 'true');
  const [headerMinimalBg, setHeaderMinimalBg] = useState(() => localStorage.getItem('monviewphone:dav-header-minimal-bg') === 'true');
  const [tileTab, setTileTab] = useState<string>('wechat');

  const [accountData, setAccountData] = useState<DeviceAccountData | undefined>(() => {
    try {
      const vault = loadDeviceAccountVault();
      return getDeviceAccountDataFromVault(vault, udid);
    } catch {
      return undefined;
    }
  });

  const setViewerStatus = useCallback((next: 'connecting' | 'ready') => {
    if (statusRef.current === next) return;
    statusRef.current = next;
    setStatus(next);
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const vault = loadDeviceAccountVault();
        setAccountData(getDeviceAccountDataFromVault(vault, udid));
      } catch {}
    };
    window.addEventListener('device-account-updated', handleUpdate);
    return () => window.removeEventListener('device-account-updated', handleUpdate);
  }, [udid]);

  useEffect(() => {
    joystickDownRef.current = false;
    lastWasdTouchRef.current = null;
    pressedWasdKeysRef.current.clear();
    try {
      const saved = localStorage.getItem(`monviewphone:game-mode:${udid}`) === 'true';
      setGameModeEnabled(saved);
    } catch {
      setGameModeEnabled(false);
    }
  }, [udid]);

  useEffect(() => {
    if (accountData?.defaultPlatform) {
      setTileTab(accountData.defaultPlatform);
    }
  }, [accountData?.defaultPlatform]);

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setAlwaysShowHeader(localStorage.getItem('monviewphone:dav-always-show-header') === 'true');
      setHeaderHideOrder(localStorage.getItem('monviewphone:dav-header-hide-order') === 'true');
      setHeaderMinimalBg(localStorage.getItem('monviewphone:dav-header-minimal-bg') === 'true');
    };
    window.addEventListener('monviewphone:dav-hide-settings-changed', handleSettingsUpdate);
    return () => window.removeEventListener('monviewphone:dav-hide-settings-changed', handleSettingsUpdate);
  }, []);

  const initialAspect = useMemo(() => {
    try {
      const src = getCanvasForUdid(udid);
      if (src && src.width > 0 && src.height > 0) {
        return src.width / src.height;
      }
    } catch {}
    return 9 / 16;
  }, [udid, getCanvasForUdid]);

  const viewerAspectRef = useRef<number>(initialAspect);
  const [viewerAspect, setViewerAspect] = useState<number>(initialAspect);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const suppressStreamContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const sendKeyToThis = (keycode: number) => {
    const targets = getInputTargetsForSource(udid);
    const down = encodeKeycodeMessage(KeyEventAction.DOWN, keycode);
    const up = encodeKeycodeMessage(KeyEventAction.UP, keycode);
    for (const t of targets) {
      try {
        t.ws.send(down);
        t.ws.send(up);
      } catch {
        // ignore
      }
    }
  };

  const deviceName = useMemo(() => {
    const meta = androidDeviceMap[udid];
    const model = String(meta?.['ro.product.model'] || '').trim();
    const manufacturer = String(meta?.['ro.product.manufacturer'] || '').trim();
    const name = [manufacturer, model]
      .filter(Boolean)
      .filter((part, idx, arr) => idx === 0 || part.toLowerCase() !== arr[0].toLowerCase())
      .join(' ')
      .trim();
    return name || 'Device';
  }, [androidDeviceMap, udid]);

  const copySerial = () => {
    navigator.clipboard?.writeText(udid).catch(() => undefined);
    setSerialCopied(true);
    window.setTimeout(() => setSerialCopied(false), 1200);
  };

  const takeScreenshot = () => {
    const src = getCanvasForUdid(udid);
    if (!src) return;
    try {
      const a = document.createElement('a');
      a.download = `${udid}_${Date.now()}.png`;
      a.href = src.toDataURL('image/png');
      a.click();
    } catch {
      // ignore
    }
  };

  const getWasdTouchGeometry = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = canvas?.parentElement;
    if (!canvas || !wrap) return null;

    const canvasRect = canvas.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();

    // Overlay CSS: width = size01 * wrapWidth, aspect-ratio: 1 → height = width
    // So the rendered overlay size in pixels is always square:
    const overlaySizePx = wasdConfig.size01 * wrapRect.width;

    // Overlay left = x01 * wrapWidth, top = y01 * wrapHeight (CSS percentage)
    const overlayLeftPx = wasdConfig.x01 * wrapRect.width;
    const overlayTopPx = wasdConfig.y01 * wrapRect.height;

    // Center in client coordinates
    const centerClientX = wrapRect.left + overlayLeftPx + overlaySizePx / 2;
    const centerClientY = wrapRect.top + overlayTopPx + overlaySizePx / 2;

    // Convert to 0-1 normalized coords relative to the displayed canvas
    const centerX01 = clampGameValue((centerClientX - canvasRect.left) / canvasRect.width, 0.02, 0.98);
    const centerY01 = clampGameValue((centerClientY - canvasRect.top) / canvasRect.height, 0.02, 0.98);

    // Radius is 28% of the overlay size, converted to canvas-relative 0-1
    const radiusX01 = (overlaySizePx * 0.28) / canvasRect.width;
    const radiusY01 = (overlaySizePx * 0.28) / canvasRect.height;

    return { centerX01, centerY01, radiusX01, radiusY01 };
  }, [wasdConfig]);

  const sendGameTouch = useCallback((action: MotionAction, x01: number, y01: number, pressure: number, buttons: number, pointerId: number = GAME_WASD_POINTER_ID) => {
    const targets = getTargetsByUdids([udid]);
    for (const target of targets) {
      if (!target.ws || target.ws.readyState !== WebSocket.OPEN || !target.canvas) continue;
      const w = target.canvas.width || 1;
      const h = target.canvas.height || 1;
      const x = clampGameValue(Math.round(x01 * w), 0, w);
      const y = clampGameValue(Math.round(y01 * h), 0, h);
      try {
        target.ws.send(encodeTouchMessage(action, pointerId, x, y, w, h, pressure, buttons));
      } catch {
        // ignore
      }
    }
  }, [getTargetsByUdids, udid]);

  const updateWasdJoystickTouch = useCallback(() => {
    const keys = pressedWasdKeysRef.current;
    let dx = 0;
    let dy = 0;
    if (keys.has('KeyA')) dx -= 1;
    if (keys.has('KeyD')) dx += 1;
    if (keys.has('KeyW')) dy -= 1;
    if (keys.has('KeyS')) dy += 1;

    const geo = getWasdTouchGeometry();
    if (!geo) return;

    if (dx === 0 && dy === 0) {
      if (joystickDownRef.current) {
        const last = lastWasdTouchRef.current ?? { x01: geo.centerX01, y01: geo.centerY01 };
        sendGameTouch(MotionAction.UP, last.x01, last.y01, 0, 0);
        joystickDownRef.current = false;
        lastWasdTouchRef.current = null;
      }
      return;
    }

    const len = Math.hypot(dx, dy) || 1;
    const targetX01 = clampGameValue(geo.centerX01 + (dx / len) * geo.radiusX01, 0.02, 0.98);
    const targetY01 = clampGameValue(geo.centerY01 + (dy / len) * geo.radiusY01, 0.02, 0.98);

    if (!joystickDownRef.current) {
      sendGameTouch(MotionAction.DOWN, geo.centerX01, geo.centerY01, 1, 1);
      joystickDownRef.current = true;
      requestAnimationFrame(() => {
        sendGameTouch(MotionAction.MOVE, targetX01, targetY01, 1, 1);
      });
    } else {
      sendGameTouch(MotionAction.MOVE, targetX01, targetY01, 1, 1);
    }

    lastWasdTouchRef.current = { x01: targetX01, y01: targetY01 };
  }, [getWasdTouchGeometry, sendGameTouch]);

  const handleShowWasdKeySetting = useCallback(() => {
    setGameModeEnabled(true);
    try {
      localStorage.setItem(`monviewphone:game-mode:${udid}`, 'true');
    } catch {}
    setWasdEditVisible(true);
    setTab('view');
    selectOnly(udid);
  }, [selectOnly, udid]);

  const handleToggleGameMode = useCallback(() => {
    setGameModeEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem(`monviewphone:game-mode:${udid}`, String(next));
      } catch {}
      if (!next) {
        pressedWasdKeysRef.current.clear();
        updateWasdJoystickTouch();
      } else {
        setTab('view');
        selectOnly(udid);
      }
      return next;
    });
  }, [selectOnly, udid, updateWasdJoystickTouch]);

  const handleWasdOverlayPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (wasdTimerRef.current) {
      clearTimeout(wasdTimerRef.current);
      wasdTimerRef.current = null;
    }
    setWasdPreviewActive(false);

    const wrap = canvasRef.current?.parentElement;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const mode = (e.target instanceof HTMLElement && e.target.closest('.gameWasdResizeHandle')) ? 'resize' : 'move';
    const startX = e.clientX;
    const startY = e.clientY;
    const start = wasdConfig;

    const onMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const dx01 = rect.width ? (moveEvent.clientX - startX) / rect.width : 0;
      const dy01 = rect.height ? (moveEvent.clientY - startY) / rect.height : 0;
      setWasdConfig(prev => {
        const nextSize = mode === 'resize'
          ? clampGameValue(start.size01 + Math.max(dx01, dy01), 0.12, 0.4)
          : start.size01;
        const next = mode === 'resize'
          ? {
              x01: clampGameValue(start.x01, 0, 1 - nextSize),
              y01: clampGameValue(start.y01, 0, 1 - nextSize),
              size01: nextSize,
            }
          : {
              x01: clampGameValue(start.x01 + dx01, 0, 1 - prev.size01),
              y01: clampGameValue(start.y01 + dy01, 0, 1 - prev.size01),
              size01: prev.size01,
            };
        saveGameWasdConfig(next);
        return next;
      });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp, { once: true });
  }, [wasdConfig, setWasdEditVisible]);

  const handleShowCustomKeySetting = useCallback(() => {
    setGameModeEnabled(true);
    try {
      localStorage.setItem(`monviewphone:game-mode:${udid}`, 'true');
    } catch {}
    setIsAddingKeyMode(true);
    setTab('view');
    selectOnly(udid);
  }, [selectOnly, udid]);

  const handleCanvasClickForAddKey = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x01 = clampGameValue((e.clientX - rect.left) / rect.width, 0.02, 0.98);
    const y01 = clampGameValue((e.clientY - rect.top) / rect.height, 0.02, 0.98);
    
    setActiveBindingKey({
      index: -1,
      x01,
      y01,
      isNew: true
    });
    setIsAddingKeyMode(false);
  };

  const handleDeleteCustomKey = (index: number) => {
    const updated = customKeys.filter((_, idx) => idx !== index);
    saveCustomKeys(updated);
  };

  useEffect(() => {
    const disableDirectKeyboard = tab === 'shell' || (tab === 'view' && gameModeEnabled);
    (window as any).__disableDirectKeyboard = disableDirectKeyboard;
    return () => {
      (window as any).__disableDirectKeyboard = false;
    };
  }, [tab, gameModeEnabled]);

  useEffect(() => {
    if (tab !== 'view' || !gameModeEnabled) {
      pressedWasdKeysRef.current.clear();
      updateWasdJoystickTouch();
      
      // Release custom keys
      pressedCustomKeysRef.current.forEach((pointerId, code) => {
        const customKey = customKeys.find(ck => ck.code === code);
        if (customKey) {
          sendGameTouch(MotionAction.UP, customKey.x01, customKey.y01, 0, 0, pointerId);
        }
      });
      pressedCustomKeysRef.current.clear();
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (isGameKeyboardEditableTarget(e.target)) return;
      
      // WASD Joystick Keys
      if (GAME_WASD_KEYS.has(e.code)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        selectOnly(udid);
        if (!pressedWasdKeysRef.current.has(e.code)) {
          pressedWasdKeysRef.current.add(e.code);
          updateWasdJoystickTouch();
        }
        return;
      }

      // Custom Key Mappings
      const customKeyIndex = customKeys.findIndex(ck => ck.code === e.code);
      if (customKeyIndex !== -1) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        selectOnly(udid);
        
        if (!pressedCustomKeysRef.current.has(e.code)) {
          const pointerId = 80 + customKeyIndex;
          pressedCustomKeysRef.current.set(e.code, pointerId);
          const ck = customKeys[customKeyIndex];
          sendGameTouch(MotionAction.DOWN, ck.x01, ck.y01, 1, 1, pointerId);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (GAME_WASD_KEYS.has(e.code)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        if (pressedWasdKeysRef.current.delete(e.code)) {
          updateWasdJoystickTouch();
        }
        return;
      }

      const pointerId = pressedCustomKeysRef.current.get(e.code);
      if (pointerId !== undefined) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        pressedCustomKeysRef.current.delete(e.code);
        const customKey = customKeys.find(ck => ck.code === e.code);
        if (customKey) {
          sendGameTouch(MotionAction.UP, customKey.x01, customKey.y01, 0, 0, pointerId);
        }
      }
    };

    const onBlur = () => {
      pressedWasdKeysRef.current.clear();
      updateWasdJoystickTouch();
      
      pressedCustomKeysRef.current.forEach((pointerId, code) => {
        const customKey = customKeys.find(ck => ck.code === code);
        if (customKey) {
          sendGameTouch(MotionAction.UP, customKey.x01, customKey.y01, 0, 0, pointerId);
        }
      });
      pressedCustomKeysRef.current.clear();
    };

    window.addEventListener('keydown', onKeyDown, { capture: true, passive: false });
    window.addEventListener('keyup', onKeyUp, { capture: true, passive: false });
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true } as any);
      window.removeEventListener('keyup', onKeyUp, { capture: true } as any);
      window.removeEventListener('blur', onBlur);
    };
  }, [gameModeEnabled, tab, selectOnly, udid, updateWasdJoystickTouch, customKeys, sendGameTouch]);

  useEffect(() => {
    if (!activeBindingKey) return;
    
    const handleKeyCapture = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      
      if (e.code === 'Escape') {
        setActiveBindingKey(null);
        return;
      }
      
      const displayKey = e.key === ' ' ? 'Space' : e.key;
      
      if (activeBindingKey.isNew) {
        // Add new key mapping
        const newKey: CustomKeyConfig = {
          code: e.code,
          key: displayKey,
          x01: activeBindingKey.x01,
          y01: activeBindingKey.y01
        };
        const filtered = customKeys.filter(ck => ck.code !== newKey.code);
        const updated = [...filtered, newKey];
        saveCustomKeys(updated);
      } else {
        // Edit existing key mapping
        const updated = [...customKeys];
        const targetCode = e.code;
        
        updated[activeBindingKey.index] = {
          ...updated[activeBindingKey.index],
          code: targetCode,
          key: displayKey
        };
        
        // Filter out duplicate mappings on other keys
        const finalKeys = updated.filter((ck, idx) => idx === activeBindingKey.index || ck.code !== targetCode);
        saveCustomKeys(finalKeys);
      }
      
      setActiveBindingKey(null);
      setWasdEditVisible(true); // stay in edit mode
    };
    
    window.addEventListener('keydown', handleKeyCapture, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyCapture, { capture: true });
    };
  }, [activeBindingKey, customKeys]);

  // ===== Touch controls: only bind when we are in "view" tab.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    detachRef.current?.();
    detachRef.current = null;

    if (tab !== 'view') return;

    const onActivate = () => selectOnly(udid);
    detachRef.current = attachTouchControls(
      c,
      () => getInputTargetsForSource(udid),
      onActivate,
      udid,
      { ctrlWheelPinch: true }
    );

    return () => {
      detachRef.current?.();
      detachRef.current = null;
    };
  }, [udid, tab, getInputTargetsForSource, selectOnly]);

  useEffect(() => {
    if (tab !== 'view') return;
    selectOnly(udid);
    requestAnimationFrame(() => {
      canvasRef.current?.focus?.();
    });
  }, [udid, tab, selectOnly]);

  // ===== Mirror tile canvas into viewer canvas (RAF), only in view tab.
  useEffect(() => {
    if (tab !== 'view') return;
    const dst = canvasRef.current;
    if (!dst) return;
    const ctx = dst.getContext('2d', { alpha: false });
    if (!ctx) return;

    const tick = () => {
      const src = getCanvasForUdid(udid);
      if (src && src.width > 0 && src.height > 0) {
        if (dst.width !== src.width || dst.height !== src.height) {
          dst.width = src.width;
          dst.height = src.height;
        }
        const ratio = src.width / src.height;
        if (Number.isFinite(ratio) && Math.abs(ratio - viewerAspectRef.current) > 0.05) {
          viewerAspectRef.current = ratio;
          setViewerAspect(ratio);
        }
        try {
          ctx.drawImage(src, 0, 0, dst.width, dst.height);
          setViewerStatus('ready');
        } catch {
          // ignore
        }
      } else {
        setViewerStatus('connecting');
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [udid, tab, getCanvasForUdid, setViewerStatus]);

  // ===== Files tab state =====
  const [cwd, setCwd] = useState<string>(() => {
    try {
      return localStorage.getItem('viewerCwd') || '/sdcard/';
    } catch {
      return '/sdcard/';
    }
  });
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [entries, setEntries] = useState<(FileStats & { fullPath: string; isDirBool: boolean })[]>([]);
  const [preview, setPreview] = useState<PreviewState>({ kind: 'none' });
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const parent = useMemo(() => parentPath(cwd), [cwd]);

  useEffect(() => {
    try {
      localStorage.setItem('viewerCwd', cwd);
    } catch {}
  }, [cwd]);

  // Revoke preview URLs on change/unmount
  useEffect(() => {
    return () => {
      if (preview.kind === 'image' || preview.kind === 'blob') {
        try {
          URL.revokeObjectURL(preview.url);
        } catch {}
      }
    };
  }, [preview]);

  const refreshDir = async (path?: string) => {
    const p = normPath(path ?? cwd);
    setFileLoading(true);
    setFileError(null);
    try {
      const list = await listDir(udid, p);
      const mapped = list
        .filter((x) => x && typeof x.name === 'string')
        .map((x) => ({
          ...x,
          fullPath: joinPath(p, x.name),
          isDirBool: x.isDir === 1,
        }))
        .sort((a, b) => {
          if (a.isDirBool !== b.isDirBool) return a.isDirBool ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
      setEntries(mapped);
      setCwd(p);
    } catch (e: any) {
      setEntries([]);
      setFileError(String(e?.message || e || 'List failed'));
    } finally {
      setFileLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== 'files') return;
    refreshDir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, udid]);

  const openFile = async (fullPath: string, name: string) => {
    // Clear old preview first
    setPreview((prev) => {
      if (prev.kind === 'image' || prev.kind === 'blob') {
        try {
          URL.revokeObjectURL(prev.url);
        } catch {}
      }
      return { kind: 'none' };
    });

    setFileLoading(true);
    setFileError(null);
    try {
      const blob = await pullFile(udid, fullPath);
      if (isImageFile(name)) {
        const url = URL.createObjectURL(blob);
        setPreview({ kind: 'image', path: fullPath, url });
      } else if (isTextFile(name) && blob.size <= 2_000_000) {
        const text = await blob.text();
        setPreview({ kind: 'text', path: fullPath, text });
      } else {
        const url = URL.createObjectURL(blob);
        setPreview({ kind: 'blob', path: fullPath, url });
      }
    } catch (e: any) {
      setFileError(String(e?.message || e || 'Open file failed'));
    } finally {
      setFileLoading(false);
    }
  };

  const downloadCurrentPreview = () => {
    if (preview.kind !== 'image' && preview.kind !== 'blob') return;
    const a = document.createElement('a');
    a.href = preview.url;
    a.download = preview.path.split('/').pop() || 'download';
    a.click();
  };

  const onUploadPick = async (f: File | null) => {
    if (!f) return;
    setFileLoading(true);
    setFileError(null);
    try {
      const dst = joinPath(cwd, f.name);
      await pushFile(udid, f, dst);
      await refreshDir(cwd);
    } catch (e: any) {
      setFileError(String(e?.message || e || 'Upload failed'));
    } finally {
      setFileLoading(false);
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  // ===== Apps tab (best-effort) =====
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [apps, setApps] = useState<{ name: string; path: string }[]>([]);
  const [appsFilter, setAppsFilter] = useState('');
  const shellWrapRef = useRef<HTMLDivElement | null>(null);

  const appRoots = useMemo(
    () => ['/system/app/', '/system/priv-app/', '/product/app/', '/vendor/app/', '/data/app/'],
    [],
  );

  const refreshApps = async () => {
    setAppsLoading(true);
    setAppsError(null);
    const out: { name: string; path: string }[] = [];
    try {
      for (const root of appRoots) {
        try {
          const list = await listDir(udid, root);
          for (const e of list) {
            if (e.isDir !== 1) continue;
            out.push({ name: e.name, path: joinPath(root, e.name) });
          }
        } catch (e: any) {
          // Some roots may be permission denied (notably /data/app on non-rooted devices).
          // Keep going, but keep the first error for display.
          if (!appsError) setAppsError(String(e?.message || e || `Cannot read ${root}`));
        }
      }
      out.sort((a, b) => a.name.localeCompare(b.name));
      setApps(out);
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== 'apps') return;
    refreshApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, udid]);

  const filteredApps = useMemo(() => {
    const q = appsFilter.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter((a) => a.name.toLowerCase().includes(q) || a.path.toLowerCase().includes(q));
  }, [apps, appsFilter]);

  return (
    <>
    <div
      id="viewerPanel"
      className={`deviceViewerPanel ${viewerAspect >= 1 ? 'is-landscape' : 'is-portrait'}`}
      style={{ width: '100%', ['--viewer-aspect' as any]: viewerAspect }}
      onMouseDown={(e) => {
        if (e.button === 1) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        } else {
          e.stopPropagation();
        }
      }}
      onContextMenu={suppressStreamContextMenu}
      data-inspector-id="deviceViewer.panel"
      data-inspector-label="Single device viewer main panel"
      data-inspector-component="client/src/components/DeviceViewer.tsx"
    >
      <div className="viewerHeader">
        <div className="viewerTitle">
          <div className="viewerTitleLine">
            {status !== 'ready' ? <span className="viewerStatus">loading...</span> : null}
          </div>
        </div>

        <div className="viewerHeaderRight">
{/* 
          <div className="viewerTabs">
            <button className={`viewerTab ${tab === 'view' ? 'on' : ''}`} onClick={() => setTab('view')}>
              View
            </button>
            <button className={`viewerTab ${tab === 'files' ? 'on' : ''}`} onClick={() => setTab('files')}>
              Files
            </button>
            <button className={`viewerTab ${tab === 'apps' ? 'on' : ''}`} onClick={() => setTab('apps')}>
              Apps
            </button>
            <button className={`viewerTab ${tab === 'shell' ? 'on' : ''}`} onClick={() => setTab('shell')}>
              Shell
            </button>
          </div>
          */}

        </div>
      </div>

      <div className={`viewerBody${tab === 'view' ? ' viewMode' : ''}`} ref={bodyRef}>
        {tab === 'view' ? (
          <div className="viewerMain">
            <div className="viewerCanvasWrap" style={{ transform: 'none', position: 'relative' }} onContextMenu={suppressStreamContextMenu}>
              {wasdEditVisible && (
                <button
                  type="button"
                  className="gameSaveConfigBtn"
                  onClick={() => {
                    setWasdEditVisible(false);
                  }}
                  onPointerDown={e => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  data-inspector-id="gameKeyboard.saveConfigBtn"
                  data-inspector-label="Save game keyboard configuration button"
                  data-inspector-component="client/src/components/DeviceViewer.tsx"
                >
                  Lưu
                </button>
              )}
              <div 
                className="viewerDragHandleTop"
                data-inspector-id="deviceViewer.dragHandleTop"
                data-inspector-label="Viewer top drag handle"
                data-inspector-component="client/src/components/DeviceViewer.tsx"
              />
              <canvas
                ref={canvasRef}
                className="viewerCanvas"
                style={{ touchAction: 'none' }}
                tabIndex={0}
                onContextMenu={suppressStreamContextMenu}
                data-inspector-id="deviceViewer.canvas"
                data-inspector-label="Device screen mirroring canvas"
                data-inspector-component="client/src/components/DeviceViewer.tsx"
              />
              {wasdEditVisible && (
                <div
                  className={`gameWasdOverlay${wasdPreviewActive ? ' is-preview' : ''}`}
                  style={{
                    left: `${wasdConfig.x01 * 100}%`,
                    top: `${wasdConfig.y01 * 100}%`,
                    width: `${wasdConfig.size01 * 100}%`,
                    height: `${wasdConfig.size01 * 100}%`,
                  }}
                  onPointerDown={handleWasdOverlayPointerDown}
                  data-inspector-id="gameKeyboard.wasdOverlay"
                  data-inspector-label="Game keyboard WASD joystick edit overlay"
                  data-inspector-component="client/src/components/DeviceViewer.tsx"
                >
                  <div className="gameWasdPad" aria-label="WASD joystick preview">
                    <span className="gameWasdKey gameWasdKeyW">W</span>
                    <span className="gameWasdKey gameWasdKeyA">A</span>
                    <span className="gameWasdKey gameWasdKeyS">S</span>
                    <span className="gameWasdKey gameWasdKeyD">D</span>
                    <span className="gameWasdCenter" />
                  </div>
                  <button
                    type="button"
                    className="gameWasdCloseBtn"
                    onClick={() => {
                      if (wasdTimerRef.current) {
                        clearTimeout(wasdTimerRef.current);
                        wasdTimerRef.current = null;
                      }
                      setWasdEditVisible(false);
                      setWasdPreviewActive(false);
                    }}
                    onPointerDown={e => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    data-inspector-id="gameKeyboard.wasdCloseBtn"
                    data-inspector-label="Close WASD joystick overlay button"
                    data-inspector-component="client/src/components/DeviceViewer.tsx"
                  >
                    ×
                  </button>
                  <span
                    className="gameWasdResizeHandle"
                    data-inspector-id="gameKeyboard.wasdResizeHandle"
                    data-inspector-label="Resize WASD joystick overlay handle"
                    data-inspector-component="client/src/components/DeviceViewer.tsx"
                  />
                </div>
              )}

              {wasdEditVisible && customKeys.map((ck, idx) => {
                const isBindingThis = activeBindingKey && !activeBindingKey.isNew && activeBindingKey.index === idx;
                return (
                  <div
                    key={idx}
                    className={`gameCustomKeyCircle is-editable${isBindingThis ? ' is-binding' : ''}`}
                    style={{
                      left: `${ck.x01 * 100}%`,
                      top: `${ck.y01 * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setActiveBindingKey({
                        index: idx,
                        x01: ck.x01,
                        y01: ck.y01,
                        isNew: false
                      });
                    }}
                  >
                    <span className="gameCustomKeyLabel">
                      {isBindingThis ? '?' : (ck.key === ' ' ? 'Space' : ck.key.toUpperCase())}
                    </span>
                    <button
                      type="button"
                      className="gameCustomKeyDeleteBtn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomKey(idx);
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              {/* Pulsing indicator circle for new pending key */}
              {activeBindingKey && activeBindingKey.isNew && (
                <div
                  className="gameCustomKeyCircle is-binding"
                  style={{
                    left: `${activeBindingKey.x01 * 100}%`,
                    top: `${activeBindingKey.y01 * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <span className="gameCustomKeyLabel">?</span>
                </div>
              )}

              {isAddingKeyMode && (
                <div
                  className="gameAddKeyOverlay"
                  onClick={handleCanvasClickForAddKey}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.25)',
                    cursor: 'crosshair',
                    zIndex: 10030,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: '15px',
                    background: 'rgba(0, 0, 0, 0.85)',
                    color: 'var(--md-info)',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    pointerEvents: 'none',
                    border: '1.5px solid var(--md-info)'
                  }}>
                    Click lên màn hình để gán phím
                  </span>
                </div>
              )}
              {alwaysShowHeader && accountData && (
                <div 
                  className={`tile-account-overlay is-header-only ${headerHideOrder ? 'header-hide-order' : ''} ${headerMinimalBg ? 'header-minimal-bg' : ''}`}
                  onMouseDown={e => e.stopPropagation()}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999, pointerEvents: 'none' }}
                  data-inspector-id="deviceViewer.accountOverlay"
                  data-inspector-label="Device viewer accounts info overlay cards"
                  data-inspector-component="client/src/components/DeviceViewer.tsx"
                >
                  <div className="tile-account-inner" style={{ height: '100%', display: 'flex', flexDirection: 'column', pointerEvents: 'auto' }}>
                    <DeviceAccountPanel
                      udid={udid}
                      order={(currentOrder ?? 0) + 1}
                      model={deviceName}
                      isOnline={status === 'ready'}
                      orderMap={new Map()}
                      initialData={accountData}
                      activeTab={tileTab as any}
                      setActiveTab={setTileTab as any}
                      showAccountOverlay={false}
                      alwaysShowHeader={alwaysShowHeader}
                      onSyncNovaWechat={onSyncNovaWechat}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {tab === 'files' ? (
          <div className="viewerPanelInner">
            <div className="viewerFsTop">
              <button className="viewerFsBtn" onClick={() => refreshDir(parent)} disabled={!parent || fileLoading}>
                <ArrowLeft size={16} strokeWidth={1.8} />
                <span style={{ marginLeft: 6 }}>Up</span>
              </button>
              <button className="viewerFsBtn" onClick={() => refreshDir(cwd)} disabled={fileLoading}>
                <RefreshCw size={16} strokeWidth={1.8} />
                <span style={{ marginLeft: 6 }}>Refresh</span>
              </button>
              <button
                className="viewerFsBtn"
                onClick={() => uploadInputRef.current?.click()}
                disabled={fileLoading}
              >
                ⬆ Upload
              </button>
              <input
                ref={uploadInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => onUploadPick(e.target.files?.[0] || null)}
              />
            </div>

            <div className="viewerFsPath">
              <input
                className="viewerFsPathInput"
                value={cwd}
                onChange={(e) => setCwd(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') refreshDir(e.currentTarget.value);
                }}
              />
              <button className="viewerFsBtn" onClick={() => refreshDir(cwd)} disabled={fileLoading}>
                Go
              </button>
            </div>

            {fileError ? <div className="viewerError">{fileError}</div> : null}

            <div className="viewerFsMain">
              <div className="viewerFsList">
                {fileLoading ? <div className="viewerHint">Loading…</div> : null}
                {!fileLoading && !entries.length ? <div className="viewerHint">No entries</div> : null}
                {entries.map((e) => (
                  <button
                    key={e.fullPath}
                    className="viewerFsRow"
                    onClick={() => {
                      if (e.isDirBool) {
                        setPreview({ kind: 'none' });
                        refreshDir(joinPath(cwd, e.name + '/'));
                      } else {
                        openFile(e.fullPath, e.name);
                      }
                    }}
                  >
                    <span className="viewerFsName">
                      {e.isDirBool ? (
                        <Folder size={16} strokeWidth={1.8} style={{ marginRight: 8, flexShrink: 0 }} />
                      ) : (
                        <FileText size={16} strokeWidth={1.8} style={{ marginRight: 8, flexShrink: 0 }} />
                      )}
                      {e.name}
                    </span>
                    {!e.isDirBool ? <span className="viewerFsMeta">{e.size}b</span> : null}
                  </button>
                ))}
              </div>

              <div className="viewerFsPreview">
                {preview.kind === 'none' ? <div className="viewerHint">Select a file to preview</div> : null}
                {preview.kind === 'text' ? (
                  <pre className="viewerFsText">{preview.text}</pre>
                ) : null}
                {preview.kind === 'image' ? (
                  <>
                    <div className="viewerFsPreviewTop">
                      <button className="viewerFsBtn" onClick={downloadCurrentPreview}>
                        <Download size={16} strokeWidth={1.8} style={{ marginRight: 6 }} />
                        Download
                      </button>
                      <div className="viewerFsSmall">{preview.path}</div>
                    </div>
                    <img className="viewerFsImg" src={preview.url} alt={preview.path} />
                  </>
                ) : null}
                {preview.kind === 'blob' ? (
                  <>
                    <div className="viewerFsPreviewTop">
                      <button className="viewerFsBtn" onClick={downloadCurrentPreview}>
                        <Download size={16} strokeWidth={1.8} style={{ marginRight: 6 }} />
                        Download
                      </button>
                      <a className="viewerFsBtn" href={preview.url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </div>
                    <div className="viewerHint">Binary file preview (download/open)</div>
                    <div className="viewerFsSmall">{preview.path}</div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'apps' ? (
          <div className="viewerPanelInner">
            <div className="viewerFsTop">
              <button className="viewerFsBtn" onClick={() => refreshApps()} disabled={appsLoading}>
                <RefreshCw size={16} strokeWidth={1.8} />
                <span style={{ marginLeft: 6 }}>Refresh</span>
              </button>
              <input
                className="viewerFsPathInput"
                placeholder="Filter apps…"
                value={appsFilter}
                onChange={(e) => setAppsFilter(e.target.value)}
              />
            </div>

            <div className="viewerHint" style={{ marginBottom: 8 }}>
              Apps list is <b>best-effort</b> (based on readable app directories). Some devices block /data/app without root.
            </div>

            {appsError ? <div className="viewerError">{appsError}</div> : null}
            {appsLoading ? <div className="viewerHint">Loading…</div> : null}

            <div className="viewerAppsList">
              {filteredApps.map((a) => (
                <div key={a.path} className="viewerAppsRow">
                  <div className="viewerAppsName">{a.name}</div>
                  <div className="viewerAppsPath">{a.path}</div>
                </div>
              ))}
              {!appsLoading && !filteredApps.length ? <div className="viewerHint">No apps found</div> : null}
            </div>
          </div>
        ) : null}

        {tab === 'shell' ? (
          <div className="viewerPanelInner viewerShellWrap" ref={shellWrapRef}>
            <ShellPage wsServer={wsServer} udid={udid} />
          </div>
        ) : null}
      </div>
    </div>
    <ViewerSidePanel
      udid={udid}
      currentOrder={currentOrder}
      onChangeOrder={onChangeOrder}
      onCloseViewer={onClose}
      connectSelection={connectSelection}
      connectionMode={connectionMode}
      availableConnections={availableConnections}
      onChangeConnection={onChangeConnection}
      gameModeEnabled={gameModeEnabled}
      onToggleGameMode={handleToggleGameMode}
      onShowWasdKeySetting={handleShowWasdKeySetting}
      onShowCustomKeySetting={handleShowCustomKeySetting}
    />
    </>
  );
}

export const DeviceViewer = memo(DeviceViewerComponent);
