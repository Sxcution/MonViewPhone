import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useServer } from '@/context/ServerContext';
import { useI18n } from '@/context/I18nContext';
import {
  installApk,
  installUploadedApk,
  installApkToUser,
  listUserProfiles,
  runAdbCommandApi,
  openPcFileDialog,
  pushLocalFileApi,
  splitCommandBatchSmart,
  normalizeAdbSegment,
} from '@/lib/serverApi';
import type { ConnectionMode, ConnectionState } from '@/components/tile/types';
import { Hash, Package, Upload, Download, Terminal, X, Play, Clock, Save, Trash2, Palette, Plus, Copy, ChevronRight, Users } from 'lucide-react';
import { ViewerAppsMenu } from './ViewerAppsMenu';

type ViewerSidePanelProps = {
  udid: string;
  currentOrder?: number;
  onChangeOrder?: (udid: string, newIndex: number) => void;
  onCloseViewer: () => void;
  connectSelection?: Set<string>;
  connectionMode?: ConnectionState;
  availableConnections?: Partial<Record<ConnectionMode, boolean>>;
  onChangeConnection?: (mode: ConnectionMode) => void;
  gameModeEnabled?: boolean;
  onToggleGameMode?: () => void;
  onShowWasdKeySetting?: () => void;
  onShowCustomKeySetting?: () => void;
};
type AdbLogEntry = { id: number; time: string; command: string; output: string; success: boolean };
type ToastMsg = { id: number; text: string; type: 'ok' | 'err' };

interface ToastItemProps {
  toast: ToastMsg;
  onRemove: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const timeoutRef = useRef<any>(null);

  const startTimeout = useCallback((duration: number) => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      onRemove();
    }, duration);
  }, [onRemove]);

  useEffect(() => {
    startTimeout(4000);
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [startTimeout]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    startTimeout(2000);
  };

  return (
    <div
      className={`vsp-toast vsp-toast-${toast.type}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {toast.text}
    </div>
  );
};


function httpBase(wsServer: string): string {
  const u = new URL(wsServer);
  u.protocol = u.protocol === 'wss:' ? 'https:' : 'http:';
  u.search = ''; u.hash = '';
  if (!u.pathname.endsWith('/')) u.pathname += '/';
  return u.toString();
}

/* Preset ADB commands - warn=true for dangerous */
const DEFAULT_PRESETS: { label: string; cmd: string; warn?: boolean; color?: string }[] = [
  { label: 'Bật WiFi', cmd: 'svc wifi enable' },
  { label: 'Tắt WiFi', cmd: 'svc wifi disable' },
  { label: 'Tăng âm lượng', cmd: 'input keyevent 24' },
  { label: 'Giảm âm lượng', cmd: 'input keyevent 25' },
  { label: 'Tắt tiếng', cmd: 'input keyevent 164' },
  { label: 'Xoá cache (an toàn)', cmd: 'pm trim-caches 999999G' },
  { label: 'Thông tin pin', cmd: 'dumpsys battery' },
  { label: 'DS ứng dụng đã cài', cmd: 'pm list packages -3' },
  { label: 'Khởi động lại', cmd: 'adb reboot', warn: true },
  { label: 'Chụp màn hình', cmd: 'screencap -p /sdcard/screenshot.png' },
  { label: '⚠ Xoá DỮ LIỆU app', cmd: 'pm clear <package>', warn: true },
  { label: 'IP thiết bị', cmd: 'ip addr show wlan0' },
  { label: 'DS user profiles', cmd: 'pm list users' },
  { label: 'Bộ nhớ trống', cmd: 'df -h /sdcard' },
];

const LS_CMD_HISTORY = 'vsp_cmd_history';
const LS_PRESET_COLORS = 'vsp_preset_colors';

function loadJson<T>(key: string, def: T): T { try { return JSON.parse(localStorage.getItem(key) || '') ?? def; } catch { return def; } }
function saveJson(key: string, v: any) { localStorage.setItem(key, JSON.stringify(v)); }
function shellQuote(value: string): string { return `'${value.replace(/'/g, `'\\''`)}'`; }
function parseCreatedUserId(output: string): number | null {
  const match = output.match(/(?:created user id|id)\s+(\d+)/i);
  return match ? Number(match[1]) : null;
}

function inspectManagedProfileCapacity(output: string): { maxPerParent: number | null; existingIds: number[] } {
  const maxMatch = output.match(/android\.os\.usertype\.profile\.MANAGED:[\s\S]*?mMaxAllowedPerParent:\s*(-?\d+)/);
  const maxPerParent = maxMatch ? Number(maxMatch[1]) : null;
  const existingIds: number[] = [];
  for (const block of output.split(/\r?\n(?=\s*UserInfo\{)/)) {
    if (!/parentId=0/.test(block) || !/Type:\s*android\.os\.usertype\.profile\.MANAGED/.test(block)) continue;
    const idMatch = block.match(/UserInfo\{(\d+):/);
    if (idMatch) existingIds.push(Number(idMatch[1]));
  }
  return { maxPerParent, existingIds };
}

export function ViewerSidePanel({
  udid,
  currentOrder,
  onChangeOrder,
  onCloseViewer,
  connectSelection,
  connectionMode = 'unknown',
  availableConnections,
  onChangeConnection,
  gameModeEnabled = false,
  onToggleGameMode,
  onShowWasdKeySetting,
  onShowCustomKeySetting,
}: ViewerSidePanelProps) {
  const { wsServer } = useServer();
  const { t } = useI18n();

  // Device number
  const [newOrder, setNewOrder] = useState('');

  // Shared profile
  const [profiles, setProfiles] = useState<{ id: number; name: string }[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<number>(0);
  const [profileActionStatus, setProfileActionStatus] = useState<string | null>(null);
  const [deleteProfileModalOpen, setDeleteProfileModalOpen] = useState(false);
  const [deleteProfileInput, setDeleteProfileInput] = useState('');

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastIdRef = useRef(0);
  const showToast = useCallback((text: string, type: 'ok' | 'err') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, text, type }]);
  }, []);

  // APK
  const [apkStatus, setApkStatus] = useState<string | null>(null);
  const apkInputRef = useRef<HTMLInputElement | null>(null);

  // File Import
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Local PC folder import config
  const LS_DEVICE_IMPORT_FOLDERS = 'monviewphone:device-import-folders';
  const [deviceFolders, setDeviceFolders] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_DEVICE_IMPORT_FOLDERS) || '{}');
    } catch {
      return {};
    }
  });
  const [showPathInput, setShowPathInput] = useState(false);
  const [folderPathInput, setFolderPathInput] = useState('');

  useEffect(() => {
    setFolderPathInput(deviceFolders[udid] || '');
    setShowPathInput(false);
  }, [udid, deviceFolders]);

  const handleImportRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPathInput(prev => !prev);
  };

  const handleSavePath = () => {
    const pathTrimmed = folderPathInput.trim();
    if (!pathTrimmed) {
      showToast('Vui lòng nhập đường dẫn hợp lệ', 'err');
      return;
    }
    const next = { ...deviceFolders, [udid]: pathTrimmed };
    setDeviceFolders(next);
    localStorage.setItem(LS_DEVICE_IMPORT_FOLDERS, JSON.stringify(next));
    setShowPathInput(false);
    showToast('Đã lưu đường dẫn thư mục', 'ok');
  };

  const handleDeletePath = () => {
    const next = { ...deviceFolders };
    delete next[udid];
    setDeviceFolders(next);
    localStorage.setItem(LS_DEVICE_IMPORT_FOLDERS, JSON.stringify(next));
    setFolderPathInput('');
    setShowPathInput(false);
    showToast('Đã xóa thư mục đã lưu', 'ok');
  };

  const handleImportClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const savedPath = deviceFolders[udid];
    if (!savedPath) {
      // Fallback to native browser file picker
      fileInputRef.current?.click();
      return;
    }

    try {
      setImportStatus('Đang mở hộp thoại chọn tệp trên PC...');
      const res = await openPcFileDialog(wsServer, savedPath, true);
      if (res.cancelled || !res.files || res.files.length === 0) {
        setImportStatus(null);
        return;
      }

      if (res.warning) {
        showToast(`⚠️ Warning: ${res.warning}`, 'err');
      }

      const files = res.files;
      const targets = connectSelection && connectSelection.size > 0
        ? Array.from(connectSelection)
        : [udid];

      const runWithConcurrency = async <T,>(
        items: T[],
        limit: number,
        worker: (item: T, index: number) => Promise<void>
      ) => {
        let nextIndex = 0;
        const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
          while (nextIndex < items.length) {
            const index = nextIndex++;
            await worker(items[index], index);
          }
        });
        await Promise.all(workers);
      };

      for (let i = 0; i < files.length; i++) {
        const localPath = files[i];
        const parts = localPath.split(/[\\/]/);
        const fileName = parts[parts.length - 1];
        setImportStatus(`Đang đẩy ${fileName}... (${i + 1}/${files.length})`);

        const ext = fileName.toLowerCase().split('.').pop() || '';
        let folder = 'Download';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'mp4', 'mkv', 'avi', 'mov'].includes(ext)) {
            folder = 'DCIM/Camera';
        } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
            folder = 'Music';
        }

        const targetPath = selectedProfile > 0 
          ? `/storage/emulated/${selectedProfile}/${folder}/${fileName}` 
          : `/sdcard/${folder}/${fileName}`;

        let failed = 0;
        let lastErrorMsg = '';

        await runWithConcurrency(targets, 8, async (targetUdid) => {
          try {
            await pushLocalFileApi(wsServer, targetUdid, localPath, targetPath);
          } catch (err: any) {
            failed++;
            lastErrorMsg = err?.message || 'Lỗi';
          }
        });

        if (failed === 0) {
          setImportStatus(`✅ Đã đẩy: ${fileName} lên ${targets.length} thiết bị`);
          showToast(`✅ Push: ${fileName}`, 'ok');
        } else {
          setImportStatus(`❌ Lỗi đẩy ${fileName} trên ${failed}/${targets.length} thiết bị. Lỗi: ${lastErrorMsg}`);
          showToast(`❌ Push: ${lastErrorMsg}`, 'err');
        }
      }
    } catch (err: any) {
      console.error('[VSP] Local push error:', err);
      const msg = err?.message || 'Lỗi';
      setImportStatus(`❌ ${msg}`);
      showToast(`❌: ${msg}`, 'err');
    }
  };

  // ADB Modal
  const [showAdbModal, setShowAdbModal] = useState(false);
  const [adbCommand, setAdbCommand] = useState('');
  const [adbLogs, setAdbLogs] = useState<AdbLogEntry[]>([]);
  const [adbRunning, setAdbRunning] = useState(false);

  const textareaRef = useCallback((node: HTMLTextAreaElement | null) => {
    if (node !== null) {
      if (!adbCommand.includes('\n')) {
        node.style.height = '36px';
      } else {
        node.style.height = '36px'; // reset to measure
        node.style.height = `${Math.min(node.scrollHeight + 2, 120)}px`;
      }
    }
  }, [adbCommand]);
  const [adbTab, setAdbTab] = useState<'preset' | 'history' | 'custom'>('preset');
  const [cmdHistory, setCmdHistory] = useState<string[]>(() => loadJson(LS_CMD_HISTORY, []));
  const [newCmdLabel, setNewCmdLabel] = useState('');
  const [newCmdValue, setNewCmdValue] = useState('');

  const logIdRef = useRef(0);

  // Preset commands state
  const LS_PRESETS = 'vsp_presets';
  const [presets, setPresets] = useState<{ label: string; cmd: string; warn?: boolean; color?: string }[]>(() => loadJson(LS_PRESETS, DEFAULT_PRESETS));

  // Draggable position
  const [position, setPosition] = useState(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      x: Math.max(20, Math.floor((w - 720) / 2)),
      y: Math.max(20, Math.floor((h - 550) / 2)),
    };
  });

  // Preset color overrides
  const COLOR_MIGRATION: Record<string, string> = {
    '#fff': '#ffffff', '#ff9c9c': '#ef4444', '#9cffb8': '#22c55e', '#9cd4ff': '#3b82f6', '#ffdc9c': '#f59e0b', '#d49cff': '#a855f7', '#ff9ce0': '#ec4899'
  };
  const [presetColors, setPresetColors] = useState<Record<number, string>>(() => {
    const loaded = loadJson(LS_PRESET_COLORS, {});
    const migrated: Record<number, string> = {};
    for (const [k, v] of Object.entries(loaded)) {
      migrated[Number(k)] = COLOR_MIGRATION[v as string] || v as string;
    }
    return migrated;
  });

  const [confirmCmd, setConfirmCmd] = useState<{ cmd: string; label: string } | null>(null);

  // Context menu for presets
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; idx: number } | null>(null);

  // Drag and drop for presets
  const [draggedPresetIdx, setDraggedPresetIdx] = useState<number | null>(null);
  const [dragOverPresetIdx, setDragOverPresetIdx] = useState<number | null>(null);
  const [editingPreset, setEditingPreset] = useState<{ idx: number; label: string; cmd: string } | null>(null);

  // ===== DRAGGABLE LOGIC =====
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    panelEl?: HTMLElement | null;
    lastX?: number;
    lastY?: number;
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  const clampPosition = (val: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, val));
  };

  const onDragMove = useCallback((e: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag.active || !drag.panelEl) return;
    e.preventDefault();
    const nextX = drag.originX + e.clientX - drag.startX;
    const nextY = drag.originY + e.clientY - drag.startY;
    const finalX = clampPosition(nextX, 0, Math.max(0, window.innerWidth - 100));
    const finalY = clampPosition(nextY, 0, Math.max(0, window.innerHeight - 80));
    
    drag.panelEl.style.left = `${finalX}px`;
    drag.panelEl.style.top = `${finalY}px`;
    
    drag.lastX = finalX;
    drag.lastY = finalY;
  }, []);

  const onDragUp = useCallback(() => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.active = false;
    document.body.classList.remove('is-dragging-modal');
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragUp);
    
    if (drag.lastX !== undefined && drag.lastY !== undefined) {
      setPosition({ x: drag.lastX, y: drag.lastY });
    }
  }, [onDragMove]);

  const startDrag = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input, select, textarea')) return;
    e.preventDefault();
    const panel = e.currentTarget.closest('.vsp-modal') as HTMLElement | null;
    if (!panel) return;
    
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
      panelEl: panel,
      lastX: position.x,
      lastY: position.y
    };
    document.body.classList.add('is-dragging-modal');
    window.addEventListener('pointermove', onDragMove, { passive: false });
    window.addEventListener('pointerup', onDragUp);
  }, [onDragMove, onDragUp, position.x, position.y]);

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onDragMove);
      window.removeEventListener('pointerup', onDragUp);
    };
  }, [onDragMove, onDragUp]);


  // ADB submenu on hover
  const [showAdbSubmenu, setShowAdbSubmenu] = useState(false);
  const [showProfileSubmenu, setShowProfileSubmenu] = useState(false);
  const [showConnectionSubmenu, setShowConnectionSubmenu] = useState(false);
  const [showGameSubmenu, setShowGameSubmenu] = useState(false);
  const adbHoverTimer = useRef<number | null>(null);
  const profileHoverTimer = useRef<number | null>(null);
  const connectionHoverTimer = useRef<number | null>(null);
  const gameHoverTimer = useRef<number | null>(null);




  // Load profiles
  const refreshProfiles = useCallback(async () => {
    try {
      const nextProfiles = await listUserProfiles(wsServer, udid);
      setProfiles(nextProfiles);
      setSelectedProfile(prev => nextProfiles.some(p => p.id === prev) ? prev : 0);
      return nextProfiles;
    } catch (err) {
      console.warn('[VSP] Failed to refresh profiles:', err);
      return [];
    }
  }, [wsServer, udid]);

  useEffect(() => {
    void refreshProfiles();
  }, [refreshProfiles]);

  // Handle click outside to close context menu, using capture phase to catch clicks blocked by canvas
  useEffect(() => {
    if (!ctxMenu) return;
    const handleClickOutside = (event: MouseEvent | PointerEvent) => {
      if (event.button === 2) return;
      const target = event.target as Element;
      const isClickOnContextMenu = target.closest('.react-contexify') || target.closest('.vsp-ctx-menu') || target.closest('.context-menu');
      if (!isClickOnContextMenu) {
        setCtxMenu(null);
      }
    };

    window.addEventListener('pointerdown', handleClickOutside, true);
    return () => window.removeEventListener('pointerdown', handleClickOutside, true);
  }, [ctxMenu]);

  const handleChangeOrder = () => {
    const n = parseInt(newOrder, 10);
    if (!isFinite(n) || n <= 0) return;
    onChangeOrder?.(udid, n - 1);
    setNewOrder('');
  };

  const adbSectionRef = useRef<HTMLDivElement>(null);
  const adbSubmenuMenuRef = useRef<HTMLDivElement>(null);
  const profileSectionRef = useRef<HTMLDivElement>(null);
  const profileSubmenuMenuRef = useRef<HTMLDivElement>(null);
  const connectionSectionRef = useRef<HTMLDivElement>(null);
  const connectionSubmenuMenuRef = useRef<HTMLDivElement>(null);
  const gameSectionRef = useRef<HTMLDivElement>(null);
  const gameSubmenuMenuRef = useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (showAdbSubmenu && adbSectionRef.current && adbSubmenuMenuRef.current) {
      const rect = adbSectionRef.current.getBoundingClientRect();
      const menuEl = adbSubmenuMenuRef.current;
      const menuWidth = 220;
      let x = rect.right - 4;
      if (x + menuWidth > window.innerWidth) {
        x = rect.left - menuWidth + 4;
      }
      
      let top = rect.top - 30;
      top = Math.max(10, top);
      const menuHeight = menuEl.offsetHeight || 150;
      if (top + menuHeight > window.innerHeight - 10) {
        top = window.innerHeight - menuHeight - 10;
      }
      top = Math.max(10, top);

      menuEl.style.left = `${x}px`;
      menuEl.style.bottom = 'auto';
      menuEl.style.top = `${top}px`;
      menuEl.style.maxHeight = `${window.innerHeight - top - 12}px`;
      menuEl.style.opacity = '1';
      menuEl.style.pointerEvents = 'auto';
    }
  }, [showAdbSubmenu]);

  React.useLayoutEffect(() => {
    if (showProfileSubmenu && profileSectionRef.current && profileSubmenuMenuRef.current) {
      const rect = profileSectionRef.current.getBoundingClientRect();
      const menuEl = profileSubmenuMenuRef.current;
      const menuWidth = 190;
      let x = rect.right - 4;
      if (x + menuWidth > window.innerWidth) {
        x = rect.left - menuWidth + 4;
      }

      let top = rect.top - 30;
      top = Math.max(10, top);
      const menuHeight = menuEl.offsetHeight || 150;
      if (top + menuHeight > window.innerHeight - 10) {
        top = window.innerHeight - menuHeight - 10;
      }
      top = Math.max(10, top);

      menuEl.style.left = `${x}px`;
      menuEl.style.bottom = 'auto';
      menuEl.style.top = `${top}px`;
      menuEl.style.maxHeight = `${window.innerHeight - top - 12}px`;
      menuEl.style.opacity = '1';
      menuEl.style.pointerEvents = 'auto';
    }
  }, [showProfileSubmenu]);

  React.useLayoutEffect(() => {
    if (showConnectionSubmenu && connectionSectionRef.current && connectionSubmenuMenuRef.current) {
      const rect = connectionSectionRef.current.getBoundingClientRect();
      const menuEl = connectionSubmenuMenuRef.current;
      const menuWidth = 220;
      let x = rect.right - 4;
      if (x + menuWidth > window.innerWidth) {
        x = rect.left - menuWidth + 4;
      }
      
      let top = rect.top - 30;
      top = Math.max(10, top);
      const menuHeight = menuEl.offsetHeight || 150;
      if (top + menuHeight > window.innerHeight - 10) {
        top = window.innerHeight - menuHeight - 10;
      }
      top = Math.max(10, top);

      menuEl.style.left = `${x}px`;
      menuEl.style.bottom = 'auto';
      menuEl.style.top = `${top}px`;
      menuEl.style.maxHeight = `${window.innerHeight - top - 12}px`;
      menuEl.style.opacity = '1';
      menuEl.style.pointerEvents = 'auto';
    }
  }, [showConnectionSubmenu]);

  React.useLayoutEffect(() => {
    if (showGameSubmenu && gameSectionRef.current && gameSubmenuMenuRef.current) {
      const rect = gameSectionRef.current.getBoundingClientRect();
      const menuEl = gameSubmenuMenuRef.current;
      const menuWidth = 180;
      let x = rect.right - 4;
      if (x + menuWidth > window.innerWidth) {
        x = rect.left - menuWidth + 4;
      }

      let top = rect.top - 30;
      top = Math.max(10, top);
      const menuHeight = menuEl.offsetHeight || 150;
      if (top + menuHeight > window.innerHeight - 10) {
        top = window.innerHeight - menuHeight - 10;
      }
      top = Math.max(10, top);

      menuEl.style.left = `${x}px`;
      menuEl.style.bottom = 'auto';
      menuEl.style.top = `${top}px`;
      menuEl.style.maxHeight = `${window.innerHeight - top - 12}px`;
      menuEl.style.opacity = '1';
      menuEl.style.pointerEvents = 'auto';
    }
  }, [showGameSubmenu]);

  const handleAdbEnter = () => {
    if (adbHoverTimer.current) clearTimeout(adbHoverTimer.current);
    setShowAdbSubmenu(true);
  };

  const handleAdbLeave = () => {
    adbHoverTimer.current = window.setTimeout(() => setShowAdbSubmenu(false), 100);
  };

  const handleProfileEnter = () => {
    if (profileHoverTimer.current) clearTimeout(profileHoverTimer.current);
    setShowProfileSubmenu(true);
  };

  const handleProfileLeave = () => {
    profileHoverTimer.current = window.setTimeout(() => setShowProfileSubmenu(false), 100);
  };

  const nextMonSpaceProfileName = useCallback(() => {
    const used = new Set<number>();
    for (const profile of profiles) {
      const match = profile.name.match(/^MonSpace\s+(\d+)$/i);
      if (match) used.add(Number(match[1]));
    }
    let index = 1;
    while (used.has(index)) index += 1;
    return `MonSpace ${index}`;
  }, [profiles]);

  const handleCreateProfilePointerDown = useCallback(async (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowProfileSubmenu(false);

    const targets = connectSelection && connectSelection.size > 0
      ? Array.from(connectSelection)
      : [udid];
    const profileName = nextMonSpaceProfileName();

    setProfileActionStatus(`Creating ${profileName}...`);
    let okCount = 0;

    try {
      for (const targetUdid of targets) {
        const userDump = await runAdbCommandApi(wsServer, targetUdid, 'dumpsys user', 'shell');
        if (userDump.success) {
          const capacity = inspectManagedProfileCapacity(userDump.output);
          if (
            capacity.maxPerParent !== null &&
            capacity.maxPerParent >= 0 &&
            capacity.existingIds.length >= capacity.maxPerParent
          ) {
            throw new Error(
              `${targetUdid}: ROM hiện chỉ cho ${capacity.maxPerParent} managed profile/user 0; ` +
              `đang có user ${capacity.existingIds.join(', ')}. Xoá profile cũ hoặc cài/reboot MonSpace UserType overlay trước khi tạo thêm.`,
            );
          }
        }

        const createResult = await runAdbCommandApi(
          wsServer,
          targetUdid,
          `pm create-user --profileOf 0 --managed ${shellQuote(profileName)}`,
          'shell',
        );
        if (!createResult.success) throw new Error(createResult.output || 'pm create-user failed');
        const createdUserId = parseCreatedUserId(createResult.output);
        if (!createdUserId) throw new Error(`Cannot parse created user id: ${createResult.output}`);

        const setupCommands = [
          `cmd package install-existing --user ${createdUserId} com.mon.monspacev2`,
          `dpm set-profile-owner --user ${createdUserId} com.mon.monspacev2/.MonDeviceAdminReceiver`,
          `am start-user -w ${createdUserId}`,
          `settings --user ${createdUserId} put secure user_setup_complete 1`,
          `am start --user ${createdUserId} -n com.mon.monspacev2/.MonspaceV2Activity --ez finish_only true`,
        ];

        for (const setupCommand of setupCommands) {
          const result = await runAdbCommandApi(wsServer, targetUdid, setupCommand, 'shell');
          if (!result.success) {
            throw new Error(`${setupCommand}: ${result.output || 'failed'}`);
          }
        }

        okCount += 1;
      }

      if (okCount > 0) {
        showToast(`Đã tạo ${profileName} trên ${okCount}/${targets.length} thiết bị`, 'ok');
      }
      await refreshProfiles();
    } catch (err: any) {
      showToast(err?.message || 'Tạo profile thất bại', 'err');
    } finally {
      setProfileActionStatus(null);
    }
  }, [connectSelection, nextMonSpaceProfileName, refreshProfiles, showToast, udid, wsServer]);

  const handleDeleteProfilePointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowProfileSubmenu(false);

    if (selectedProfile <= 0) {
      showToast('Chọn profile cần xoá trước.', 'err');
      return;
    }
    setDeleteProfileInput('');
    setDeleteProfileModalOpen(true);
  }, [selectedProfile, showToast]);

  const handleDeleteProfileConfirm = useCallback(async () => {
    if (deleteProfileInput.trim().toLowerCase() !== 'delete') return;
    const profileId = selectedProfile;
    if (profileId <= 0) {
      showToast('Không thể xoá User 0 - Owner.', 'err');
      return;
    }

    const targets = connectSelection && connectSelection.size > 0
      ? Array.from(connectSelection)
      : [udid];
    const errors: string[] = [];
    let okCount = 0;

    setDeleteProfileModalOpen(false);
    setProfileActionStatus(`Deleting User ${profileId}...`);

    try {
      for (const targetUdid of targets) {
        const result = await runAdbCommandApi(wsServer, targetUdid, `pm remove-user ${profileId}`, 'shell');
        const output = (result.output || '').trim();
        if (result.success && !/(error|failure|failed)/i.test(output)) {
          okCount += 1;
        } else {
          errors.push(`${targetUdid}: ${output || 'failed'}`);
        }
      }

      if (okCount > 0) {
        showToast(`Đã xoá User ${profileId} trên ${okCount}/${targets.length} thiết bị`, 'ok');
        setSelectedProfile(0);
        await refreshProfiles();
      }
      if (errors.length > 0) {
        showToast(`Xoá profile lỗi ${errors.length}/${targets.length}: ${errors[0]}`, 'err');
      }
    } catch (err: any) {
      showToast(err?.message || 'Xoá profile thất bại', 'err');
    } finally {
      setProfileActionStatus(null);
    }
  }, [connectSelection, deleteProfileInput, refreshProfiles, selectedProfile, showToast, udid, wsServer]);

  const handleConnectionEnter = () => {
    if (connectionHoverTimer.current) clearTimeout(connectionHoverTimer.current);
    setShowConnectionSubmenu(true);
  };

  const handleConnectionLeave = () => {
    connectionHoverTimer.current = window.setTimeout(() => setShowConnectionSubmenu(false), 100);
  };

  const handleGameEnter = () => {
    if (gameHoverTimer.current) clearTimeout(gameHoverTimer.current);
    setShowGameSubmenu(true);
  };

  const handleGameLeave = () => {
    gameHoverTimer.current = window.setTimeout(() => setShowGameSubmenu(false), 100);
  };

  const handleGameKeyPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowGameSubmenu(false);
    onShowWasdKeySetting?.();
  };

  const handleCustomKeyPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowGameSubmenu(false);
    onShowCustomKeySetting?.();
  };

  const handleConnectionModePointerDown = (e: React.PointerEvent<HTMLButtonElement>, mode: ConnectionMode, disabled: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) {
      const isActive = connectionMode === mode;
      console.warn(`[ConnectionMode] Cannot switch to "${mode}". Details:`, {
        targetMode: mode,
        isActive,
        availableConnections,
        currentMode: connectionMode,
        udid
      });

      if (isActive) {
        setShowConnectionSubmenu(false);
        return;
      }
      if (mode === 'adb') {
        showToast('Không tìm thấy kết nối USB (ADB) cho thiết bị này. Hãy cắm cáp USB.', 'err');
      } else if (mode === 'wifi') {
        showToast('Không tìm thấy kết nối WiFi hoặc USB (ADB) để tạo WiFi. Hãy cắm cáp USB trước.', 'err');
      }
      return;
    }
    setShowConnectionSubmenu(false);
    onChangeConnection?.(mode);
  };
  useEffect(() => {
    return () => {
      if (adbHoverTimer.current) window.clearTimeout(adbHoverTimer.current);
      if (profileHoverTimer.current) window.clearTimeout(profileHoverTimer.current);
      if (connectionHoverTimer.current) window.clearTimeout(connectionHoverTimer.current);
      if (gameHoverTimer.current) window.clearTimeout(gameHoverTimer.current);
    };
  }, []);

  // Push file via HTTP API
  const pushFileToDevice = async (targetUdid: string, file: File, remotePath: string) => {
    const buf = await file.arrayBuffer();
    const base = httpBase(wsServer);
    const res = await fetch(`${base}api/goog/device/push-file`, {
      method: 'POST',
      headers: { 'X-UDID': targetUdid, 'X-Remote-Path': encodeURIComponent(remotePath), 'Content-Type': 'application/octet-stream' },
      body: buf,
    });
    const json = await res.json().catch(() => ({}));
    if (!json?.success) throw new Error(json?.error || 'Push failed');
  };

  // APK Install
  const handleApkSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) { console.warn('[VSP] No files selected'); return; }
    // MUST copy to array before clearing input - FileList is a live reference!
    const files = Array.from(fileList);
    e.target.value = '';
    console.log('[VSP] APK files selected:', files.length);

    const targets = connectSelection && connectSelection.size > 0
      ? Array.from(connectSelection)
      : [udid];

    const runWithConcurrency = async <T,>(
      items: T[],
      limit: number,
      worker: (item: T, index: number) => Promise<void>
    ) => {
      let nextIndex = 0;
      const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (nextIndex < items.length) {
          const index = nextIndex++;
          await worker(items[index], index);
        }
      });
      await Promise.all(workers);
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setApkStatus(`Đang upload ${file.name}...`);
      try {
        console.log('[VSP] Uploading APK:', file.name, 'size:', file.size, 'wsServer:', wsServer, 'udid:', udid);
        const saved = await installApk(wsServer, udid, file);
        console.log('[VSP] Uploaded OK, filePath:', saved);

        setApkStatus(`Đang cài đặt ${file.name} trên ${targets.length} thiết bị...`);
        let failed = 0;
        let lastErrorMsg = '';

        await runWithConcurrency(targets, 8, async (targetUdid) => {
          try {
            if (selectedProfile > 0) {
              await installApkToUser(wsServer, targetUdid, saved, selectedProfile);
            } else {
              await installUploadedApk(wsServer, targetUdid, saved);
            }
          } catch (err: any) {
            failed++;
            lastErrorMsg = err?.message || 'Lỗi';
          }
        });

        if (failed === 0) {
          setApkStatus(`✅ Đã cài: ${file.name} trên ${targets.length} thiết bị`);
          showToast(`✅ APK: ${file.name}`, 'ok');
        } else {
          setApkStatus(`❌ Lỗi cài ${file.name} trên ${failed}/${targets.length} thiết bị. Lỗi: ${lastErrorMsg}`);
          showToast(`❌ APK: ${lastErrorMsg}`, 'err');
        }
      } catch (err: any) {
        console.error('[VSP] APK install error:', err);
        const msg = err?.message || 'Cài APK thất bại';
        setApkStatus(`❌ ${msg}`);
        showToast(`❌ APK: ${msg}`, 'err');
      }
    }
  }, [wsServer, udid, selectedProfile, connectSelection]);

  // File Import - multi file
  const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) { console.warn('[VSP] No files selected for import'); return; }
    const files = Array.from(fileList);
    e.target.value = '';
    console.log('[VSP] Import files selected:', files.length, 'profile:', selectedProfile);

    const targets = connectSelection && connectSelection.size > 0
      ? Array.from(connectSelection)
      : [udid];

    const runWithConcurrency = async <T,>(
      items: T[],
      limit: number,
      worker: (item: T, index: number) => Promise<void>
    ) => {
      let nextIndex = 0;
      const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (nextIndex < items.length) {
          const index = nextIndex++;
          await worker(items[index], index);
        }
      });
      await Promise.all(workers);
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setImportStatus(`Đang đẩy ${file.name}... (${i + 1}/${files.length})`);
      try {
        const ext = file.name.toLowerCase().split('.').pop() || '';
        let folder = 'Download';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'mp4', 'mkv', 'avi', 'mov'].includes(ext)) {
            folder = 'DCIM/Camera';
        } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
            folder = 'Music';
        }

        const targetPath = selectedProfile > 0 
          ? `/storage/emulated/${selectedProfile}/${folder}/${file.name}` 
          : `/sdcard/${folder}/${file.name}`;
        
        let failed = 0;
        let lastErrorMsg = '';

        await runWithConcurrency(targets, 8, async (targetUdid) => {
          try {
            await pushFileToDevice(targetUdid, file, targetPath);
          } catch (err: any) {
            failed++;
            lastErrorMsg = err?.message || 'Lỗi';
          }
        });

        if (failed === 0) {
          setImportStatus(`✅ Đã đẩy: ${file.name} lên ${targets.length} thiết bị`);
          showToast(`✅ Push: ${file.name}`, 'ok');
        } else {
          setImportStatus(`❌ Lỗi đẩy ${file.name} trên ${failed}/${targets.length} thiết bị. Lỗi: ${lastErrorMsg}`);
          showToast(`❌ Push: ${lastErrorMsg}`, 'err');
        }
      } catch (err: any) {
        console.error('[VSP] Push error:', err);
        const msg = err?.message || 'Lỗi';
        setImportStatus(`❌ ${file.name}: ${msg}`);
        showToast(`❌ Push: ${msg}`, 'err');
      }
    }
  }, [wsServer, udid, selectedProfile, connectSelection]);

  // ADB execution
  const executeAdbCommand = useCallback(async (rawInput: string) => {
    if (!rawInput.trim()) return;
    setAdbRunning(true);
    setCmdHistory(prev => {
      const next = [rawInput, ...prev.filter(c => c !== rawInput)].slice(0, 50);
      saveJson(LS_CMD_HISTORY, next);
      return next;
    });

    const segments = splitCommandBatchSmart(rawInput);
    const parsedCommands = segments.map(normalizeAdbSegment);

    const targets = connectSelection && connectSelection.size > 0
      ? Array.from(connectSelection)
      : [udid];

    interface StepLog {
      original: string;
      normalized: string;
      success: boolean;
      output: string;
    }

    const executeBatchOnDevice = async (targetUdid: string): Promise<StepLog[]> => {
      const stepLogs: StepLog[] = [];
      for (let stepIdx = 0; stepIdx < parsedCommands.length; stepIdx++) {
        const parsed = parsedCommands[stepIdx];
        if (parsed.kind === 'invalid') {
          stepLogs.push({
            original: parsed.original,
            normalized: 'INVALID',
            success: false,
            output: parsed.error,
          });
          break; // Stop batch on error
        }

        let success = false;
        let output = '';
        try {
          let result;
          if (parsed.kind === 'shell') {
            result = await runAdbCommandApi(wsServer, targetUdid, parsed.command, 'shell');
          } else {
            result = await runAdbCommandApi(wsServer, targetUdid, '', 'host-adb', parsed.args);
          }
          success = result.success;
          output = result.output;
        } catch (err: any) {
          success = false;
          output = err?.message || 'Error executing command';
        }

        stepLogs.push({
          original: parsed.original,
          normalized: parsed.kind === 'shell' ? `shell: ${parsed.command}` : `host-adb: ${parsed.args.join(' ')}`,
          success,
          output,
        });

        if (!success) {
          break; // Stop batch on failure
        }
      }
      return stepLogs;
    };

    let mainDeviceLogs: StepLog[] = [];

    const runWithConcurrency = async <T,>(
      items: T[],
      limit: number,
      worker: (item: T, index: number) => Promise<void>
    ) => {
      let nextIndex = 0;
      const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (nextIndex < items.length) {
          const index = nextIndex++;
          await worker(items[index], index);
        }
      });
      await Promise.all(workers);
    };

    const allDevicesLogs: Record<string, StepLog[]> = {};
    await runWithConcurrency(targets, 8, async (targetUdid) => {
      const stepLogs = await executeBatchOnDevice(targetUdid);
      allDevicesLogs[targetUdid] = stepLogs;
      if (targetUdid === udid) {
        mainDeviceLogs = stepLogs;
      }
    });

    const extractMainErrorLine = (output: string): string => {
      const clean = output.trim();
      if (!clean) return 'Error';

      const lines = clean.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) return 'Error';

      for (const line of lines) {
        if (line.includes('** Error:') || line.includes('** Error')) {
          return line.length > 500 ? line.slice(0, 500) + '...' : line;
        }
      }
      for (const line of lines) {
        if (line.toLowerCase().includes('error:')) {
          return line.length > 500 ? line.slice(0, 500) + '...' : line;
        }
      }

      const firstLine = lines[0];
      if (firstLine.length > 500) {
        return firstLine.slice(0, 500) + '...';
      }
      return firstLine;
    };

    const formatBatchLog = (stepLogs: StepLog[]): string => {
      if (parsedCommands.length === 1) {
        const step = stepLogs[0];
        if (!step) return '';
        if (step.success) {
          const cleanOutput = step.output.trim();
          if (cleanOutput && cleanOutput !== 'No output') {
            return cleanOutput;
          }
          return '✅ Thành công';
        } else {
          const errorLine = extractMainErrorLine(step.output);
          return `❌ Thất bại\n${errorLine}`;
        }
      }

      const lastStep = stepLogs[stepLogs.length - 1];
      const hasFailure = lastStep && !lastStep.success;

      let logStr = '';
      stepLogs.forEach((step) => {
        if (step.success) {
          const cleanOutput = step.output.trim();
          if (cleanOutput && cleanOutput !== 'No output') {
            if (logStr) logStr += '\n';
            logStr += cleanOutput;
          }
        }
      });

      if (!hasFailure) {
        const header = `✅ Thành công ${parsedCommands.length}/${parsedCommands.length} lệnh`;
        if (logStr) {
          return `${header}\n\n${logStr}`;
        }
        return header;
      } else {
        const failingStepIdx = stepLogs.length;
        const failedHeader = `❌ Lỗi ở lệnh ${failingStepIdx}/${parsedCommands.length}\n${lastStep.original}`;
        const errorLine = extractMainErrorLine(lastStep.output);
        
        if (logStr) {
          return `${logStr}\n\n${failedHeader}\n\n${errorLine}`;
        }
        return `${failedHeader}\n\n${errorLine}`;
      }
    };

    const id = ++logIdRef.current;
    const time = new Date().toLocaleTimeString('vi-VN');
    
    let isOverallSuccess = true;
    for (const targetUdid of targets) {
      const deviceLogs = allDevicesLogs[targetUdid] || [];
      const ok = deviceLogs.length === parsedCommands.length && deviceLogs.every(s => s.success);
      if (!ok) {
        isOverallSuccess = false;
        break;
      }
    }

    let formattedOutput = '';
    if (targets.length > 1) {
      const parts = targets.map(targetUdid => {
        const deviceLogs = allDevicesLogs[targetUdid] || [];
        const deviceOut = formatBatchLog(deviceLogs);
        if (deviceOut.trim().toLowerCase() === targetUdid.toLowerCase()) {
          return `[Device: ${targetUdid}]`;
        }
        return `[Device: ${targetUdid}]\n${deviceOut}`;
      });
      const allSingleLine = parts.every(p => !p.includes('\n'));
      formattedOutput = parts.join(allSingleLine ? '\n' : '\n\n');
    } else {
      formattedOutput = formatBatchLog(mainDeviceLogs);
    }

    setAdbLogs(prev => [
      {
        id,
        time,
        command: rawInput,
        output: formattedOutput,
        success: isOverallSuccess,
      },
      ...prev,
    ]);
    setAdbRunning(false);
  }, [wsServer, udid, connectSelection]);

  const handleAdbSubmit = () => { if (adbCommand.trim()) { executeAdbCommand(adbCommand.trim()); setAdbCommand(''); } };

  const handleSaveCustomCmd = () => {
    if (!newCmdLabel.trim() || !newCmdValue.trim()) return;
    const next = [...presets, { label: newCmdLabel.trim(), cmd: newCmdValue.trim() }];
    setPresets(next); saveJson(LS_PRESETS, next);
    setNewCmdLabel(''); setNewCmdValue('');
    setAdbTab('preset');
  };

  // Preset context menu handlers
  const handlePresetContextMenu = (e: React.MouseEvent, idx: number) => {
    e.preventDefault(); e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, idx });
  };
  const startEditPreset = (idx: number) => {
    setCtxMenu(null);
    setEditingPreset({ idx, label: presets[idx].label, cmd: presets[idx].cmd });
  };
  const handleDeletePreset = (idx: number) => {
    setCtxMenu(null);
    setPresets(prev => {
      const next = prev.filter((_, i) => i !== idx);
      saveJson(LS_PRESETS, next);
      return next;
    });
  };
  const setPresetColor = (idx: number, color: string) => {
    setCtxMenu(null);
    setPresetColors(prev => { const next = { ...prev, [idx]: color }; saveJson(LS_PRESET_COLORS, next); return next; });
  };

  const COLORS = ['#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899'];

  const handlePresetClick = (cmd: string, label: string, color?: string, fromSubmenu?: boolean) => {
    if (fromSubmenu) {
      if (cmd.includes('<')) {
        setShowAdbSubmenu(false);
        setShowAdbModal(true);
        setAdbCommand(cmd);
        return;
      }
      if (color === '#ef4444' || color === '#ff9c9c' || color === 'red') {
        setShowAdbSubmenu(false);
        setConfirmCmd({ cmd, label });
      } else {
        executeAdbCommand(cmd);
      }
    } else {
      setAdbCommand(cmd);
    }
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedPresetIdx(idx);
    e.dataTransfer.setData('text/plain', '');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedPresetIdx === null || draggedPresetIdx === idx) return;
    e.dataTransfer.dropEffect = 'move';
    if (dragOverPresetIdx !== idx) setDragOverPresetIdx(idx);
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedPresetIdx === null || draggedPresetIdx === idx) {
      setDraggedPresetIdx(null);
      setDragOverPresetIdx(null);
      return;
    }
    const from = draggedPresetIdx;
    const to = idx;
    
    setPresets(prev => {
      const next = [...prev];
      const item = next.splice(from, 1)[0];
      next.splice(to, 0, item);
      saveJson(LS_PRESETS, next);
      return next;
    });
    
    setPresetColors(prev => {
      const nextColors: Record<number, string> = {};
      const idxArray = Array.from({ length: presets.length }, (_, i) => i);
      const movedIdx = idxArray.splice(from, 1)[0];
      idxArray.splice(to, 0, movedIdx);
      
      idxArray.forEach((oldI, newI) => {
        if (prev[oldI]) nextColors[newI] = prev[oldI];
      });
      saveJson(LS_PRESET_COLORS, nextColors);
      return nextColors;
    });
    
    setDraggedPresetIdx(null);
    setDragOverPresetIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedPresetIdx(null);
    setDragOverPresetIdx(null);
  };

  return (
    <>
      <div 
        className="vsp-panel right-bar-container"
        data-inspector-id="viewerSidePanel.panel"
        data-inspector-label="Viewer sidebar control panel container"
        data-inspector-component="client/src/components/ViewerSidePanel.tsx"
      >
        <div className="vsp-header" style={{ justifyContent: 'space-between' }}>
          <div 
            className="device-serial-title" 
            style={{
              color: '#fff', 
              fontWeight: 'bold',
              fontSize: '17px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            title={t('Click để copy số seri')}
            onClick={() => {
              navigator.clipboard.writeText(udid);
              showToast('Đã copy: ' + udid, 'ok');
            }}
          >
            {udid}
          </div>
          <button 
            className="vsp-header-close" 
            onClick={onCloseViewer} 
            title={t('Close')}
            data-inspector-id="viewerSidePanel.closeButton"
            data-inspector-label="Close device viewer button"
            data-inspector-component="client/src/components/ViewerSidePanel.tsx"
          >
            <X size={14} />
          </button>
        </div>
        {/* Toast notifications */}
        {toasts.length > 0 && ReactDOM.createPortal(
          <div className="vsp-toast-container">
            {toasts.map(toast => (
              <ToastItem
                key={toast.id}
                toast={toast}
                onRemove={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              />
            ))}
          </div>,
          document.body
        )}
        <div className="vsp-body">
          {/* 1. Số Máy - inline */}
          <div className="vsp-section-title-inline" style={{ padding: '0 4px' }}>
            <span>{t('Số Máy')}</span>
            <input className="vsp-input vsp-input-inline" type="text" inputMode="numeric" pattern="[0-9]*"
              placeholder={currentOrder !== undefined ? String(currentOrder + 1) : '?'}
              value={newOrder} onChange={e => setNewOrder(e.target.value.replace(/[^0-9]/g, ''))}
              onPointerDown={e => e.stopPropagation()}
              onKeyDown={e => e.key === 'Enter' && handleChangeOrder()} />
            <button
              className="vsp-btn vsp-btn-primary"
              onClick={handleChangeOrder}
              data-inspector-id="viewerSidePanel.changeOrderButton"
              data-inspector-label="Change viewer device order button"
              data-inspector-component="client/src/components/ViewerSidePanel.tsx"
            >{t('Đổi')}</button>
            <button
              type="button"
              className={`vsp-btn vsp-game-btn${gameModeEnabled ? ' active' : ''}`}
              aria-pressed={gameModeEnabled}
              onClick={onToggleGameMode}
              data-inspector-id="gameKeyboard.toggleButton"
              data-inspector-label="Toggle Game WASD joystick mode for current viewer"
              data-inspector-component="client/src/components/ViewerSidePanel.tsx"
            >Game</button>
          </div>

          {/* 2. Profile selector (shared) */}
          {profiles.length > 0 && (
            <div className="vsp-profile-inline" style={{ padding: '0 4px' }}>
              <span className="vsp-label">{t('Profile:')}</span>
              <select 
                className="vsp-select" 
                value={selectedProfile} 
                onChange={e => setSelectedProfile(Number(e.target.value))}
                data-inspector-id="viewerSidePanel.profileSelect"
                data-inspector-label="WeChat profile selector"
                data-inspector-component="client/src/components/ViewerSidePanel.tsx"
              >
                {profiles.map(p => <option key={p.id} value={p.id}>User {p.id} - {p.name}</option>)}
              </select>
            </div>
          )}

          {/* DS ứng dụng */}
          <ViewerAppsMenu
            wsServer={wsServer}
            udid={udid}
            userId={selectedProfile}
            profileName={profiles.find(p => p.id === selectedProfile)?.name || `User ${selectedProfile}`}
            showToast={showToast}
          />

          {/* 4. Nhập tệp */}
          <div>
            <div 
              className="vsp-section-title vsp-clickable" 
              onClick={handleImportClick}
              onContextMenu={handleImportRightClick}
              title="Click trái: Nhập tệp | Click phải: Cấu hình thư mục ảnh PC"
              data-inspector-id="viewerSidePanel.importButton"
              data-inspector-label="Push file to device button"
              data-inspector-component="client/src/components/ViewerSidePanel.tsx"
            >
              <Upload size={15} /><span>{t('Nhập tệp vào điện thoại')}</span>
            </div>
            <input ref={fileInputRef} type="file" multiple
              style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden', pointerEvents: 'none' }}
              onChange={handleFileImport} />
            {importStatus && <div className="vsp-status" style={{ marginTop: '4px' }}>{importStatus}</div>}

            {showPathInput && (
              <div className="vsp-import-path-container" onClick={e => e.stopPropagation()}>
                <input 
                  type="text" 
                  className="vsp-import-path-input" 
                  placeholder="Dán đường dẫn thư mục ảnh trên PC..." 
                  value={folderPathInput}
                  onChange={e => setFolderPathInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSavePath();
                    }
                  }}
                  autoFocus
                />
                <div className="vsp-import-path-actions">
                  <button 
                    type="button" 
                    className="vsp-import-path-btn danger" 
                    onClick={handleDeletePath}
                  >
                    Xóa
                  </button>
                  <button 
                    type="button" 
                    className="vsp-import-path-btn primary" 
                    onClick={handleSavePath}
                  >
                    Lưu
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Cài APK */}
          <div>
            <div 
              className="vsp-section-title vsp-clickable" 
              onClick={() => {
                console.log('[VSP] APK click, ref:', apkInputRef.current);
                apkInputRef.current?.click();
              }}
              data-inspector-id="viewerSidePanel.apkButton"
              data-inspector-label="Upload and install APK button"
              data-inspector-component="client/src/components/ViewerSidePanel.tsx"
            >
              <Package size={15} /><span>{t('Cài đặt APK')}</span>
            </div>
            <input ref={apkInputRef} type="file" accept=".apk,.xapk,.zip" multiple
              style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden', pointerEvents: 'none' }}
              onChange={handleApkSelect} />
            {apkStatus && <div className="vsp-status" style={{ marginTop: '4px' }}>{apkStatus}</div>}
          </div>

          {/* DS Profile */}
          <div
            className="vsp-profile-section"
            ref={profileSectionRef}
            onMouseEnter={handleProfileEnter}
            onMouseLeave={handleProfileLeave}
            onMouseMove={handleProfileEnter}
            data-inspector-id="viewerSidePanel.profileActions"
            data-inspector-label="Profile management sidebar row"
            data-inspector-component="client/src/components/ViewerSidePanel.tsx"
          >
            <div className="vsp-section-title vsp-clickable vsp-connection-title">
              <span className="vsp-connection-title-left">
                <Users size={15} />
                <span>DS Profile</span>
              </span>
              <ChevronRight size={14} />
            </div>
            {showProfileSubmenu && ReactDOM.createPortal(
              <div
                ref={profileSubmenuMenuRef}
                className="vsp-adb-submenu vsp-profile-submenu"
                style={{ position: 'fixed', left: 0, top: 0, opacity: 0, pointerEvents: 'none', margin: 0 }}
                onMouseEnter={() => {
                  if (profileHoverTimer.current) clearTimeout(profileHoverTimer.current);
                  setShowProfileSubmenu(true);
                }}
                onMouseLeave={handleProfileLeave}
                data-inspector-id="viewerSidePanel.profileActionsSubmenu"
                data-inspector-label="Profile management hover submenu"
                data-inspector-component="client/src/components/ViewerSidePanel.tsx"
              >
                <button
                  type="button"
                  className="vsp-adb-submenu-item"
                  onPointerDown={handleCreateProfilePointerDown}
                  data-inspector-id="viewerSidePanel.createProfileButton"
                  data-inspector-label="Open Android managed profile setup"
                  data-inspector-component="client/src/components/ViewerSidePanel.tsx"
                >
                  <Plus size={14} />
                  <span>Tạo Profile</span>
                </button>
                <button
                  type="button"
                  className="vsp-adb-submenu-item vsp-cmd-warn"
                  style={{ color: '#ef4444' }}
                  onPointerDown={handleDeleteProfilePointerDown}
                  data-inspector-id="viewerSidePanel.deleteProfileButton"
                  data-inspector-label="Delete selected Android profile"
                  data-inspector-component="client/src/components/ViewerSidePanel.tsx"
                >
                  <Trash2 size={14} />
                  <span>Xoá Profile</span>
                </button>
              </div>,
              document.body
            )}
            {profileActionStatus && <div className="vsp-status" style={{ marginTop: '4px' }}>{profileActionStatus}</div>}
          </div>

          {/* 5. Chạy lệnh ADB - with hover submenu */}
          <div 
            className="vsp-adb-section" 
            ref={adbSectionRef}
            onMouseEnter={handleAdbEnter}
            onMouseLeave={handleAdbLeave}
            onMouseMove={handleAdbEnter}
            data-inspector-id="viewerSidePanel.adbButton"
            data-inspector-label="Run ADB Shell command sidebar row"
            data-inspector-component="client/src/components/ViewerSidePanel.tsx"
          >
            <div className="vsp-section-title vsp-clickable" onClick={() => setShowAdbModal(true)}>
              <Terminal size={15} /><span>{t('Chạy lệnh ADB')}</span>
            </div>
            {showAdbSubmenu && ReactDOM.createPortal(
              <div 
                ref={adbSubmenuMenuRef}
                className="vsp-adb-submenu"
                style={{ position: 'fixed', left: 0, top: 0, opacity: 0, pointerEvents: 'none', margin: 0 }}
                onMouseEnter={() => {
                  if (adbHoverTimer.current) clearTimeout(adbHoverTimer.current);
                  setShowAdbSubmenu(true);
                }}
                onMouseLeave={handleAdbLeave}
                data-inspector-id="viewerSidePanel.adbHoverSubmenu"
                data-inspector-label="ADB quick commands hover popup menu"
                data-inspector-component="client/src/components/ViewerSidePanel.tsx"
              >
                {presets.map((c, i) => (
                  <button key={i}
                    className={`vsp-adb-submenu-item${c.warn ? ' vsp-cmd-warn' : ''}`}
                    style={presetColors[i] ? { color: presetColors[i] } : undefined}
                    onClick={e => { e.stopPropagation(); handlePresetClick(c.cmd, c.label, presetColors[i], true); }}
                    title={c.cmd}
                  >
                    {c.label}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>

          {/* 6. Kết Nối */}
          <div
            className="vsp-connection-section"
            ref={connectionSectionRef}
            onMouseEnter={handleConnectionEnter}
            onMouseLeave={handleConnectionLeave}
            onMouseMove={handleConnectionEnter}
            data-inspector-id="viewerSidePanel.connectionSwitch"
            data-inspector-label="Device stream connection mode switch"
            data-inspector-component="client/src/components/ViewerSidePanel.tsx"
          >
            <div
              className="vsp-section-title vsp-clickable vsp-connection-title"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                if (showConnectionSubmenu) {
                  setShowConnectionSubmenu(false);
                  return;
                }
                handleConnectionEnter();
              }}
            >
              <span className="vsp-connection-title-left">
                <Terminal size={15} />
                <span>Kết Nối</span>
              </span>
              <span className="vsp-connection-title-right">
                <span>{connectionMode === 'wifi' ? 'WiFi' : connectionMode === 'adb' ? 'ADB' : 'Chưa rõ'}</span>
                <ChevronRight size={14} />
              </span>
            </div>
            {showConnectionSubmenu && ReactDOM.createPortal(
              <div
                ref={connectionSubmenuMenuRef}
                className="vsp-adb-submenu vsp-connection-submenu"
                style={{ position: 'fixed', left: 0, top: 0, opacity: 0, pointerEvents: 'none', margin: 0 }}
                onMouseEnter={() => {
                  if (connectionHoverTimer.current) clearTimeout(connectionHoverTimer.current);
                  setShowConnectionSubmenu(true);
                }}
                onMouseLeave={handleConnectionLeave}
                data-inspector-id="viewerSidePanel.connectionSubmenu"
                data-inspector-label="Device stream connection mode submenu"
                data-inspector-component="client/src/components/ViewerSidePanel.tsx"
              >
                {(['adb', 'wifi'] as ConnectionMode[]).map(mode => {
                  const isActive = connectionMode === mode;
                  const isAvailable = Boolean(availableConnections?.[mode]);
                  
                  let isDisabled = false;
                  if (mode === 'wifi') {
                    const canCreateWiFi = isAvailable || Boolean(availableConnections?.adb);
                    isDisabled = isActive || !canCreateWiFi;
                  } else {
                    isDisabled = isActive || !isAvailable;
                  }

                  const label = mode === 'adb' ? 'ADB' : 'WiFi';
                  const reason = isActive
                    ? 'Đang dùng'
                    : isAvailable
                    ? 'Chuyển sang endpoint này'
                    : (mode === 'wifi' && Boolean(availableConnections?.adb))
                    ? 'Có thể tạo kết nối WiFi'
                    : 'Chưa có endpoint';

                  return (
                    <button
                      key={mode}
                      type="button"
                      className={`vsp-adb-submenu-item vsp-connection-submenu-item${isActive ? ' active' : ''}${isDisabled ? ' disabled' : ''}`}
                      aria-disabled={isDisabled}
                      aria-pressed={isActive}
                      title={isAvailable ? label : (mode === 'wifi' && Boolean(availableConnections?.adb)) ? 'Có thể tạo kết nối WiFi qua ADB USB' : `${label} chưa có endpoint cho máy này`}
                      onPointerDown={e => handleConnectionModePointerDown(e, mode, isDisabled)}
                    >
                      <span>{label}</span>
                      <span className="vsp-connection-submenu-status">{reason}</span>
                    </button>
                  );
                })}
              </div>,
              document.body
            )}
          </div>

          <div
            className="vsp-game-setting-section"
            ref={gameSectionRef}
            onMouseEnter={handleGameEnter}
            onMouseLeave={handleGameLeave}
            onMouseMove={handleGameEnter}
            data-inspector-id="gameKeyboard.settingRow"
            data-inspector-label="Game Setting sidebar row"
            data-inspector-component="client/src/components/ViewerSidePanel.tsx"
          >
            <div className="vsp-section-title vsp-clickable vsp-connection-title">
              <span className="vsp-connection-title-left">
                <ChevronRight size={15} />
                <span>Game Setting</span>
              </span>
            </div>
            {showGameSubmenu && ReactDOM.createPortal(
              <div
                ref={gameSubmenuMenuRef}
                className="vsp-adb-submenu vsp-game-submenu"
                style={{ position: 'fixed', left: 0, top: 0, opacity: 0, pointerEvents: 'none', margin: 0 }}
                onMouseEnter={() => {
                  if (gameHoverTimer.current) clearTimeout(gameHoverTimer.current);
                  setShowGameSubmenu(true);
                }}
                onMouseLeave={handleGameLeave}
                data-inspector-id="gameKeyboard.settingSubmenu"
                data-inspector-label="Game Setting hover submenu"
                data-inspector-component="client/src/components/ViewerSidePanel.tsx"
              >
                <button
                  type="button"
                  className="vsp-adb-submenu-item"
                  onPointerDown={handleGameKeyPointerDown}
                  data-inspector-id="gameKeyboard.addWasdKeyButton"
                  data-inspector-label="Add/edit WASD joystick key mapping button"
                  data-inspector-component="client/src/components/ViewerSidePanel.tsx"
                >
                  + WASD
                </button>
                <button
                  type="button"
                  className="vsp-adb-submenu-item"
                  onPointerDown={handleCustomKeyPointerDown}
                  data-inspector-id="gameKeyboard.addCustomKeyButton"
                  data-inspector-label="Add custom keyboard mapping button"
                  data-inspector-component="client/src/components/ViewerSidePanel.tsx"
                >
                  + Key
                </button>
              </div>,
              document.body
            )}
          </div>
        </div>
      </div>

      {deleteProfileModalOpen && ReactDOM.createPortal(
        <div
          className="confirmOverlay"
          style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseDown={() => setDeleteProfileModalOpen(false)}
          data-inspector-id="viewerSidePanel.deleteProfileModal"
          data-inspector-label="Confirm selected profile deletion modal"
          data-inspector-component="client/src/components/ViewerSidePanel.tsx"
        >
          <div
            className="confirmPanel"
            style={{ width: 380, maxWidth: 'calc(100vw - 28px)', padding: 18, color: '#fff' }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Xoá Profile</div>
            <div style={{ color: '#cfcfcf', fontSize: 13, lineHeight: 1.45 }}>
              Profile đã chọn sẽ bị xoá khỏi thiết bị: User {selectedProfile}
              {profiles.find(p => p.id === selectedProfile)?.name ? ` - ${profiles.find(p => p.id === selectedProfile)?.name}` : ''}.
              Nhập <b>Delete</b> để xác nhận.
            </div>
            <input
              className="vsp-input"
              style={{ width: '100%', marginTop: 12 }}
              value={deleteProfileInput}
              onChange={e => setDeleteProfileInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && deleteProfileInput.trim().toLowerCase() === 'delete') {
                  void handleDeleteProfileConfirm();
                }
              }}
              placeholder="Delete"
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button type="button" className="modalBtn" onClick={() => setDeleteProfileModalOpen(false)}>Huỷ</button>
              <button
                type="button"
                className="modalBtn modalBtnDanger"
                disabled={deleteProfileInput.trim().toLowerCase() !== 'delete'}
                style={{
                  opacity: deleteProfileInput.trim().toLowerCase() === 'delete' ? 1 : 0.5,
                  cursor: deleteProfileInput.trim().toLowerCase() === 'delete' ? 'pointer' : 'not-allowed',
                }}
                onClick={() => void handleDeleteProfileConfirm()}
              >
                Xoá
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ADB Command Modal */}
      {showAdbModal && (
        <div 
          className="vsp-modal-overlay" 
          style={{ background: 'transparent', backdropFilter: 'none', pointerEvents: 'none' }}
          onClick={() => setShowAdbModal(false)}
          data-inspector-id="viewerSidePanel.adbModalOverlay"
          data-inspector-label="ADB command execution modal backdrop"
          data-inspector-component="client/src/components/ViewerSidePanel.tsx"
        >
          <div 
            className="vsp-modal" 
            style={{ left: position.x, top: position.y, position: 'fixed', pointerEvents: 'auto' }}
            onClick={e => e.stopPropagation()}
            data-inspector-id="viewerSidePanel.adbModal"
            data-inspector-label="ADB command execution modal card"
            data-inspector-component="client/src/components/ViewerSidePanel.tsx"
          >
            <div className="vsp-modal-header" onPointerDown={startDrag} style={{ cursor: 'move' }}>
              <div className="vsp-modal-title">
                <Terminal size={18} />
                <span>ADB Command</span>
                <span style={{ color: '#fff', fontWeight: 400, fontSize: '13px' }}>Device:</span>
                <span
                  className="vsp-modal-udid"
                  style={{ cursor: 'pointer' }}
                  title={t('Click để copy số seri')}
                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(udid); }}
                >{udid}</span>
              </div>
              <button className="vsp-modal-close" onClick={() => setShowAdbModal(false)}><X size={16} /></button>
            </div>
            <div className="vsp-modal-input-row" style={{ alignItems: 'flex-start' }}>
              <textarea
                ref={textareaRef}
                className="vsp-modal-input"
                placeholder={t('Nhập lệnh ADB (VD: pm list packages -3)')}
                value={adbCommand}
                onChange={e => setAdbCommand(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdbSubmit(); } }}
                autoFocus
                data-inspector-id="viewerSidePanel.adbModalInput"
                data-inspector-label="ADB command text field input"
                data-inspector-component="client/src/components/ViewerSidePanel.tsx"
                rows={1}
              />
              <button
                className="vsp-btn vsp-btn-primary"
                onClick={handleAdbSubmit}
                disabled={adbRunning || !adbCommand.trim()}
                data-inspector-id="viewerSidePanel.adbModalExecuteButton"
                data-inspector-label="Execute command button"
                data-inspector-component="client/src/components/ViewerSidePanel.tsx"
              >
                <Play size={14} />{t('Thực hiện')}
              </button>
              <button className={`vsp-btn ${adbTab === 'history' ? 'vsp-btn-primary' : ''}`} onClick={() => setAdbTab(adbTab === 'history' ? 'preset' : 'history')}>
                <Clock size={13} />{t('Lịch sử')}
              </button>
              <button className={`vsp-btn ${adbTab === 'custom' ? 'vsp-btn-primary' : ''}`} onClick={() => setAdbTab(adbTab === 'custom' ? 'preset' : 'custom')}>
                <Plus size={13} />{t('Thêm lệnh')}
              </button>
            </div>

            {/* Lịch sử / Thêm lệnh - hiển thị phía trên khu vực 2 cột khi được bật */}
            {adbTab === 'history' && (
              <div className="vsp-modal-tab-content">
                <div className="vsp-cmd-list">
                  {cmdHistory.length === 0 && <div className="vsp-empty">{t('Chưa có lịch sử')}</div>}
                  {cmdHistory.map((cmd, i) => (
                    <button key={i} className="vsp-cmd-history-item" onClick={() => setAdbCommand(cmd)} onDoubleClick={() => executeAdbCommand(cmd)}>
                      <Clock size={13} /><span>{cmd}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {adbTab === 'custom' && (
              <div className="vsp-modal-tab-content">
                <div className="vsp-cmd-custom">
                  <div className="vsp-cmd-add-row">
                    <input className="vsp-input" placeholder={t('Tên')} value={newCmdLabel} onChange={e => setNewCmdLabel(e.target.value)} />
                    <input className="vsp-input vsp-input-grow" placeholder={t('Lệnh ADB')} value={newCmdValue} onChange={e => setNewCmdValue(e.target.value)} />
                    <button className="vsp-btn vsp-btn-primary" onClick={handleSaveCustomCmd}><Save size={14} /></button>
                  </div>
                </div>
              </div>
            )}

            {/* 2-column body: command list left + log right */}
            <div className="vsp-modal-2col">
              {/* Left column – Danh sách ADB */}
              <div className="vsp-modal-2col-left">
                <div className="vsp-modal-col-header">{t('Danh sách ADB')}</div>
                <div className="vsp-modal-cmd-list">
                  {presets.map((c, i) => (
                    <div
                      key={i}
                      draggable
                      className={`vsp-cmd-text-item${c.warn ? ' vsp-cmd-warn' : ''}${dragOverPresetIdx === i ? ' drag-over' : ''}${draggedPresetIdx === i ? ' dragging' : ''}`}
                      style={{
                        color: presetColors[i] || undefined,
                        borderTop: dragOverPresetIdx === i && draggedPresetIdx !== null && draggedPresetIdx > i ? '2px solid var(--md-info)' : '2px solid transparent',
                        borderBottom: dragOverPresetIdx === i && draggedPresetIdx !== null && draggedPresetIdx < i ? '2px solid var(--md-info)' : '2px solid transparent',
                        opacity: draggedPresetIdx === i ? 0.4 : 1
                      }}
                      onClick={() => handlePresetClick(c.cmd, c.label, presetColors[i])}
                      onContextMenu={e => handlePresetContextMenu(e, i)}
                      onDragStart={e => handleDragStart(e, i)}
                      onDragOver={e => handleDragOver(e, i)}
                      onDrop={e => handleDrop(e, i)}
                      onDragEnd={handleDragEnd}
                      title={c.cmd}
                    >
                      {c.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column – Nhật ký thực hiện */}
              <div className="vsp-modal-2col-right">
                <div className="vsp-modal-col-header">
                  <span>{t('Nhật ký thực hiện')}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="vsp-btn" 
                      onClick={() => {
                        const logText = adbLogs.map(log => `[${log.time}] $ ${log.command}\n${log.output}`).join('\n\n');
                        navigator.clipboard.writeText(logText);
                      }}
                      disabled={adbLogs.length === 0}
                      data-inspector-id="viewerSidePanel.adbModalCopyLogButton"
                      data-inspector-label="Copy ADB execution logs button"
                      data-inspector-component="client/src/components/ViewerSidePanel.tsx"
                    >
                      <Copy size={13} />{t('Copy log')}
                    </button>
                    <button 
                      className="vsp-btn" 
                      onClick={() => setAdbLogs([])}
                      disabled={adbLogs.length === 0}
                      data-inspector-id="viewerSidePanel.adbModalClearLogButton"
                      data-inspector-label="Clear ADB execution logs button"
                      data-inspector-component="client/src/components/ViewerSidePanel.tsx"
                    >
                      <Trash2 size={13} />{t('Clear')}
                    </button>
                  </div>
                </div>
                <div className="vsp-modal-log" style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '12px' }}>
                  {adbLogs.length === 0 ? (
                    <div className="vsp-empty">{t('Chưa có lệnh nào được thực hiện')}</div>
                  ) : (
                    adbLogs.map(log => (
                      <div key={log.id} style={{ fontFamily: 'monospace', fontSize: '12.5px', borderBottom: '1px solid #1c1c1c', paddingBottom: '6px', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ color: '#666' }}>[{log.time}]</span>
                          <span style={{ color: log.success ? '#2BD03C' : '#ff6060', fontWeight: 'bold' }}>$ {log.command}</span>
                        </div>
                        <pre style={{ margin: 0, paddingLeft: '8px', color: '#ccc', whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 'inherit', wordBreak: 'break-all' }}>
                          {log.output}
                        </pre>
                      </div>
                    ))
                  )}

                </div>
                {adbRunning && <div className="vsp-modal-running"><div className="vsp-spinner-small" /><span>{t('Đang thực hiện...')}</span></div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preset right-click context menu - portal to body for correct positioning */}
      {ctxMenu && ReactDOM.createPortal(
        <div 
          className="vsp-ctx-menu" 
          style={{ left: ctxMenu.x, top: ctxMenu.y }} 
          onClick={e => e.stopPropagation()}
          data-inspector-id="viewerSidePanel.contextMenu"
          data-inspector-label="ADB preset commands styling/edit context menu"
          data-inspector-component="client/src/components/ViewerSidePanel.tsx"
        >
          <button className="vsp-ctx-item" onClick={() => startEditPreset(ctxMenu.idx)}>
            <Terminal size={13} />{t('Tuỳ chỉnh lệnh (Edit)')}
          </button>
          <button className="vsp-ctx-item" onClick={() => handleDeletePreset(ctxMenu.idx)} style={{ color: '#f87171' }}>
            <Trash2 size={13} color="#f87171" />{t('Xoá lệnh (Delete)')}
          </button>
          <div className="vsp-ctx-divider" />
          <div className="vsp-ctx-label"><Palette size={12} />{t('Màu chữ')}</div>
          <div className="vsp-ctx-colors">
            {COLORS.map(c => (
              <button key={c} className="vsp-ctx-color-dot" style={{ background: c }}
                onClick={() => setPresetColor(ctxMenu.idx, c)} />
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* Edit preset modal */}
      {editingPreset && (
        <div className="vsp-modal-overlay" onClick={() => setEditingPreset(null)}>
          <div className="vsp-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="vsp-modal-header">
              <div className="vsp-modal-title"><Terminal size={16} /><span>{t('Tuỳ chỉnh lệnh')}</span></div>
              <button className="vsp-modal-close" onClick={() => setEditingPreset(null)}><X size={16} /></button>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="vsp-label">{t('Tên lệnh')}</div>
              <input className="vsp-input" value={editingPreset.label} onChange={e => setEditingPreset(p => p ? { ...p, label: e.target.value } : p)} />
              <div className="vsp-label">{t('Lệnh ADB')}</div>
              <input className="vsp-modal-input" value={editingPreset.cmd} onChange={e => setEditingPreset(p => p ? { ...p, cmd: e.target.value } : p)} />
              <button className="vsp-btn vsp-btn-primary vsp-btn-full" onClick={() => {
                if (editingPreset.cmd.trim()) {
                  setPresets(prev => {
                    const next = [...prev];
                    next[editingPreset.idx] = {
                      ...next[editingPreset.idx],
                      label: editingPreset.label.trim(),
                      cmd: editingPreset.cmd.trim(),
                    };
                    saveJson(LS_PRESETS, next);
                    return next;
                  });
                  executeAdbCommand(editingPreset.cmd.trim());
                }
                setEditingPreset(null);
              }}><Play size={14} />{t('Thực hiện')}</button>
            </div>
          </div>
        </div>
      )}

      {confirmCmd && ReactDOM.createPortal(
        <div className="confirmOverlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="confirmPanel" style={{ width: 320, padding: 20 }}>
            <div style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold', marginBottom: '10px' }}>{t('Xác nhận lệnh rủi ro')}</div>
            <div style={{ color: '#ccc', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>
              {t('Bạn có chắc muốn thực hiện lệnh')} <strong style={{ color: '#ef4444' }}>{confirmCmd.label}</strong> {t('không?')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="modalBtn" onClick={() => setConfirmCmd(null)}>{t('Hủy')}</button>
              <button className="modalBtnPrimary modalBtnDanger" onClick={() => {
                executeAdbCommand(confirmCmd.cmd);
                setConfirmCmd(null);
              }}>{t('Thực hiện')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
