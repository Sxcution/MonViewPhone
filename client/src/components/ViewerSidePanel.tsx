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
  pushMediaFilesBatchApi,
  pushLocalMediaFilesBatchApi,
  listPhoneFilesApi,
  exportPhoneFileApi,
  deletePhoneFileApi,
} from '@/lib/serverApi';
import type { PhoneFileEntry } from '@/lib/serverApi';
import type { ConnectionMode, ConnectionState } from '@/components/tile/types';
import { Package, Upload, Download, Terminal, X, Trash2, Plus, ChevronRight, Users, Folder, FileText, ArrowUp, RefreshCw } from 'lucide-react';
import { ViewerAppsMenu } from './ViewerAppsMenu';
import { ViewerAdbTools } from './ViewerAdbTools';

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

function shellQuote(value: string): string { return `'${value.replace(/'/g, `'\\''`)}'`; }
function formatPhoneFileSize(bytes: number): string {
  if (!Number.isFinite(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GiB`;
}
function formatPhoneFileDate(value: string | number): string {
  if (!value) return '—';
  const numericValue = typeof value === 'number' && value < 1e12 ? value * 1000 : value;
  const date = new Date(numericValue);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN');
}
function phoneParentPath(path: string): string {
  const trimmed = path.replace(/\/+$/, '');
  return trimmed.slice(0, trimmed.lastIndexOf('/')) || '/';
}
function canBatchSecondaryImages(userId: number, paths: string[]): boolean {
  if (userId <= 0 || paths.length === 0 || paths.length > 100) return false;
  return paths.every(path => {
    const name = path.split(/[\\/]/).pop() || '';
    const dot = name.lastIndexOf('.');
    if (dot <= 0) return false;
    const stem = name.slice(0, dot);
    const ext = name.slice(dot + 1).toLowerCase();
    return stem.toLowerCase() !== 'qr' && ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);
  });
}
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
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const toastIdRef = useRef(0);
  const showToast = useCallback((text: string, type: 'ok' | 'err') => {
    setToast({ id: ++toastIdRef.current, text, type });
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

      if (canBatchSecondaryImages(selectedProfile, files)) {
        setImportStatus(`Đang đẩy batch ${files.length} ảnh...`);
        let failed = 0;
        let lastErrorMsg = '';
        await runWithConcurrency(targets, 8, async targetUdid => {
          try {
            await pushLocalMediaFilesBatchApi(
              wsServer,
              targetUdid,
              selectedProfile,
              files,
            );
          } catch (err: any) {
            failed++;
            lastErrorMsg = err?.message || 'Lỗi';
          }
        });
        if (failed === 0) {
          setImportStatus(`✅ Đã đẩy ${files.length} ảnh lên ${targets.length} thiết bị`);
          showToast(`✅ Batch: ${files.length} ảnh`, 'ok');
        } else {
          setImportStatus(`❌ Lỗi batch trên ${failed}/${targets.length} thiết bị. Lỗi: ${lastErrorMsg}`);
          showToast(`❌ Batch: ${lastErrorMsg}`, 'err');
        }
        return;
      }

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

  // File Export
  const [showPhoneFileBrowser, setShowPhoneFileBrowser] = useState(false);
  const [phoneFilePath, setPhoneFilePath] = useState('');
  const [phoneFilePathInput, setPhoneFilePathInput] = useState('');
  const [phoneFileEntries, setPhoneFileEntries] = useState<PhoneFileEntry[]>([]);
  const [phoneFilesLoading, setPhoneFilesLoading] = useState(false);
  const [phoneFilesError, setPhoneFilesError] = useState<string | null>(null);
  const [phoneFileStatus, setPhoneFileStatus] = useState<{ text: string; type: 'info' | 'ok' | 'err' } | null>(null);
  const [phoneFileContext, setPhoneFileContext] = useState<{ x: number; y: number; entry: PhoneFileEntry } | null>(null);
  const [phoneFileDeleteTarget, setPhoneFileDeleteTarget] = useState<PhoneFileEntry | null>(null);
  const [phoneFileAction, setPhoneFileAction] = useState<{ kind: 'export' | 'delete'; path: string } | null>(null);
  const phoneFileRequestIdRef = useRef(0);

  const loadPhoneFiles = useCallback(async (nextPath: string) => {
    const targetPath = nextPath;
    if (!targetPath.startsWith('/')) {
      phoneFileRequestIdRef.current += 1;
      setPhoneFilesLoading(false);
      setPhoneFileEntries([]);
      setPhoneFilesError('Đường dẫn trên điện thoại phải bắt đầu bằng /.');
      return;
    }

    const requestId = ++phoneFileRequestIdRef.current;
    setPhoneFilesLoading(true);
    setPhoneFilesError(null);
    setPhoneFileEntries([]);
    setPhoneFileContext(null);
    try {
      const result = await listPhoneFilesApi(wsServer, udid, targetPath);
      if (requestId !== phoneFileRequestIdRef.current) return;
      setPhoneFileEntries([...result.entries].sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name, 'vi');
      }));
      setPhoneFilePath(result.path);
      setPhoneFilePathInput(result.path);
    } catch (err: any) {
      if (requestId !== phoneFileRequestIdRef.current) return;
      setPhoneFilesError(err?.message || 'Không thể tải danh sách tệp.');
    } finally {
      if (requestId === phoneFileRequestIdRef.current) setPhoneFilesLoading(false);
    }
  }, [udid, wsServer]);

  const openPhoneFileBrowser = useCallback(() => {
    if (phoneFileAction) return;
    const initialPath = `/storage/emulated/${selectedProfile}/Download`;
    setShowPhoneFileBrowser(true);
    setPhoneFilePath(initialPath);
    setPhoneFilePathInput(initialPath);
    setPhoneFileStatus(null);
    setPhoneFileContext(null);
    setPhoneFileDeleteTarget(null);
    void loadPhoneFiles(initialPath);
  }, [loadPhoneFiles, phoneFileAction, selectedProfile]);

  const closePhoneFileBrowser = useCallback(() => {
    if (phoneFileAction) return;
    phoneFileRequestIdRef.current += 1;
    setShowPhoneFileBrowser(false);
    setPhoneFileContext(null);
    setPhoneFileDeleteTarget(null);
  }, [phoneFileAction]);

  const openPhoneFileContext = (event: React.MouseEvent, entry: PhoneFileEntry) => {
    event.preventDefault();
    if (entry.isDir || phoneFileAction) {
      setPhoneFileContext(null);
      return;
    }
    setPhoneFileContext({
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - 180)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - 86)),
      entry,
    });
  };

  const handlePhoneFileExport = async (entry: PhoneFileEntry) => {
    if (phoneFileAction) return;
    setPhoneFileContext(null);
    setPhoneFileAction({ kind: 'export', path: entry.path });
    setPhoneFileStatus({ text: `Đang xuất: ${entry.name}`, type: 'info' });
    try {
      const result = await exportPhoneFileApi(wsServer, udid, entry.path);
      const savedPath = result.savedPath || result.fileName || entry.name;
      setPhoneFileStatus({ text: `Đã lưu: ${savedPath}`, type: 'ok' });
      showToast(`Đã xuất tệp: ${savedPath}`, 'ok');
    } catch (err: any) {
      const message = err?.message || 'Xuất tệp thất bại.';
      setPhoneFileStatus({ text: message, type: 'err' });
      showToast(message, 'err');
    } finally {
      setPhoneFileAction(null);
    }
  };

  const handlePhoneFileDelete = async () => {
    const entry = phoneFileDeleteTarget;
    if (!entry || phoneFileAction) return;
    setPhoneFileAction({ kind: 'delete', path: entry.path });
    setPhoneFileStatus({ text: `Đang xoá: ${entry.name}`, type: 'info' });
    try {
      await deletePhoneFileApi(wsServer, udid, entry.path);
      setPhoneFileDeleteTarget(null);
      setPhoneFileStatus({ text: `Đã xoá: ${entry.path}`, type: 'ok' });
      showToast(`Đã xoá tệp: ${entry.name}`, 'ok');
      await loadPhoneFiles(phoneFilePath);
    } catch (err: any) {
      const message = err?.message || 'Xoá tệp thất bại.';
      setPhoneFileStatus({ text: message, type: 'err' });
      showToast(message, 'err');
    } finally {
      setPhoneFileAction(null);
    }
  };

  useEffect(() => {
    if (!phoneFileContext) return;
    const dismiss = (event: Event) => {
      if (!(event.target instanceof Element) || !event.target.closest('.vsp-file-context-menu')) {
        setPhoneFileContext(null);
      }
    };
    window.addEventListener('pointerdown', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => {
      window.removeEventListener('pointerdown', dismiss, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [phoneFileContext]);

  useEffect(() => {
    if (!showPhoneFileBrowser) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (phoneFileAction) return;
      if (phoneFileDeleteTarget) {
        setPhoneFileDeleteTarget(null);
      } else if (phoneFileContext) {
        setPhoneFileContext(null);
      } else {
        closePhoneFileBrowser();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closePhoneFileBrowser, phoneFileAction, phoneFileContext, phoneFileDeleteTarget, showPhoneFileBrowser]);



  const [showProfileSubmenu, setShowProfileSubmenu] = useState(false);
  const [showConnectionSubmenu, setShowConnectionSubmenu] = useState(false);
  const [showGameSubmenu, setShowGameSubmenu] = useState(false);
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


  const handleChangeOrder = () => {
    const n = parseInt(newOrder, 10);
    if (!isFinite(n) || n <= 0) return;
    onChangeOrder?.(udid, n - 1);
    setNewOrder('');
  };

  const profileSectionRef = useRef<HTMLDivElement>(null);
  const profileSubmenuMenuRef = useRef<HTMLDivElement>(null);
  const connectionSectionRef = useRef<HTMLDivElement>(null);
  const connectionSubmenuMenuRef = useRef<HTMLDivElement>(null);
  const gameSectionRef = useRef<HTMLDivElement>(null);
  const gameSubmenuMenuRef = useRef<HTMLDivElement>(null);


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

    if (canBatchSecondaryImages(selectedProfile, files.map(file => file.name))) {
      setImportStatus(`Đang đẩy batch ${files.length} ảnh...`);
      let failed = 0;
      let lastErrorMsg = '';
      await runWithConcurrency(targets, 8, async targetUdid => {
        try {
          await pushMediaFilesBatchApi(
            wsServer,
            targetUdid,
            selectedProfile,
            files,
          );
        } catch (err: any) {
          failed++;
          lastErrorMsg = err?.message || 'Lỗi';
        }
      });
      if (failed === 0) {
        setImportStatus(`✅ Đã đẩy ${files.length} ảnh lên ${targets.length} thiết bị`);
        showToast(`✅ Batch: ${files.length} ảnh`, 'ok');
      } else {
        setImportStatus(`❌ Lỗi batch trên ${failed}/${targets.length} thiết bị. Lỗi: ${lastErrorMsg}`);
        showToast(`❌ Batch: ${lastErrorMsg}`, 'err');
      }
      return;
    }

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
        {toast && ReactDOM.createPortal(
          <div className="vsp-toast-container">
            <ToastItem
              key={toast.id}
              toast={toast}
              onRemove={() => setToast(current => current?.id === toast.id ? null : current)}
            />
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

          <div
            className="vsp-section-title vsp-clickable"
            onClick={openPhoneFileBrowser}
            title="Duyệt và xuất tệp từ điện thoại"
            data-inspector-id="viewerSidePanel.exportFileButton"
            data-inspector-label="Browse and export file from device button"
            data-inspector-component="client/src/components/ViewerSidePanel.tsx"
          >
            <Download size={15} /><span>{t('Xuất Tệp')}</span>
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

          {/* 5. Chạy lệnh ADB */}
          <ViewerAdbTools udid={udid} connectSelection={connectSelection} />


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

      {showPhoneFileBrowser && ReactDOM.createPortal(
        <div
          className="vsp-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Duyệt tệp trên điện thoại"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !phoneFileAction) {
              closePhoneFileBrowser();
            }
          }}
        >
          <div className="vsp-modal vsp-file-browser-modal" onMouseDown={event => event.stopPropagation()}>
            <div className="vsp-modal-header">
              <div className="vsp-modal-title">
                <Download size={17} />
                <span>Xuất Tệp</span>
                <span className="vsp-modal-udid">{udid}</span>
              </div>
              <button
                type="button"
                className="vsp-modal-close"
                onClick={closePhoneFileBrowser}
                disabled={!!phoneFileAction}
                title="Đóng"
                aria-label="Đóng trình duyệt tệp"
              >
                <X size={16} />
              </button>
            </div>

            <form
              className="vsp-file-browser-toolbar"
              onSubmit={event => {
                event.preventDefault();
                void loadPhoneFiles(phoneFilePathInput);
              }}
            >
              <button
                type="button"
                className="vsp-file-tool-btn"
                onClick={() => void loadPhoneFiles(phoneParentPath(phoneFilePath))}
                disabled={phoneFilesLoading || phoneFilePath === '/'}
                title="Lên thư mục cha"
                aria-label="Lên thư mục cha"
              >
                <ArrowUp size={15} />
              </button>
              <input
                className="vsp-file-path-input"
                value={phoneFilePathInput}
                onChange={event => setPhoneFilePathInput(event.target.value)}
                aria-label="Đường dẫn thư mục trên điện thoại"
                spellCheck={false}
              />
              <button
                type="button"
                className="vsp-file-tool-btn"
                onClick={() => void loadPhoneFiles(phoneFilePath)}
                disabled={phoneFilesLoading}
                title="Làm mới"
                aria-label="Làm mới thư mục"
              >
                <RefreshCw size={15} className={phoneFilesLoading ? 'is-spinning' : undefined} />
              </button>
            </form>

            <div className="vsp-file-browser-hint">
              Nhấp thư mục để mở. Nhấp chuột phải vào tệp để xuất hoặc xoá.
            </div>

            <div className="vsp-file-list">
              <div className="vsp-file-row vsp-file-row-head">
                <span>Tên</span>
                <span>Kích thước</span>
                <span>Đã sửa</span>
              </div>

              {phoneFilesLoading && (
                <div className="vsp-file-state">
                  <div className="vsp-spinner-small" />
                  <span>Đang tải thư mục...</span>
                </div>
              )}

              {!phoneFilesLoading && phoneFilesError && (
                <div className="vsp-file-state is-error">
                  <span>{phoneFilesError}</span>
                  <button type="button" className="modalBtn" onClick={() => void loadPhoneFiles(phoneFilePathInput)}>
                    Thử lại
                  </button>
                </div>
              )}

              {!phoneFilesLoading && !phoneFilesError && phoneFileEntries.length === 0 && (
                <div className="vsp-file-state">Thư mục trống.</div>
              )}

              {!phoneFilesLoading && !phoneFilesError && phoneFileEntries.map(entry => (
                <div
                  key={entry.path}
                  className={`vsp-file-row${entry.isDir ? ' is-directory' : ''}${phoneFileAction?.path === entry.path ? ' is-busy' : ''}`}
                  role={entry.isDir ? 'button' : undefined}
                  tabIndex={entry.isDir ? 0 : -1}
                  aria-busy={phoneFileAction?.path === entry.path}
                  onClick={() => {
                    if (entry.isDir) void loadPhoneFiles(entry.path);
                  }}
                  onKeyDown={event => {
                    if (entry.isDir && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      void loadPhoneFiles(entry.path);
                    }
                  }}
                  onContextMenu={event => openPhoneFileContext(event, entry)}
                >
                  <span className="vsp-file-name" title={entry.path}>
                    {entry.isDir ? <Folder size={16} /> : <FileText size={16} />}
                    <span>{entry.name}</span>
                  </span>
                  <span>{entry.isDir ? '—' : formatPhoneFileSize(entry.size)}</span>
                  <span>{formatPhoneFileDate(entry.modifiedAt)}</span>
                </div>
              ))}
            </div>

            {phoneFileStatus && (
              <div className={`vsp-file-action-status is-${phoneFileStatus.type}`}>
                {phoneFileStatus.text}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {phoneFileContext && ReactDOM.createPortal(
        <div
          className="vsp-ctx-menu vsp-file-context-menu"
          style={{ left: phoneFileContext.x, top: phoneFileContext.y }}
          role="menu"
          onContextMenu={event => event.preventDefault()}
        >
          <button
            type="button"
            className="vsp-ctx-item"
            role="menuitem"
            disabled={!!phoneFileAction}
            onClick={() => void handlePhoneFileExport(phoneFileContext.entry)}
          >
            <Download size={14} />
            Xuất Tệp
          </button>
          <button
            type="button"
            className="vsp-ctx-item vsp-file-delete-menu-item"
            role="menuitem"
            disabled={!!phoneFileAction}
            onClick={() => {
              if (phoneFileAction) return;
              setPhoneFileDeleteTarget(phoneFileContext.entry);
              setPhoneFileContext(null);
            }}
          >
            <Trash2 size={14} />
            Xoá Tệp
          </button>
        </div>,
        document.body
      )}

      {phoneFileDeleteTarget && ReactDOM.createPortal(
        <div
          className="confirmOverlay confirmOverlay--top vsp-file-confirm-overlay"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="vsp-file-delete-title"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !phoneFileAction) {
              setPhoneFileDeleteTarget(null);
            }
          }}
        >
          <div className="confirmPanel" onMouseDown={event => event.stopPropagation()}>
            <div className="confirmTitle" id="vsp-file-delete-title">Xoá Tệp</div>
            <p className="confirmText">
              Xoá vĩnh viễn tệp này khỏi điện thoại?
            </p>
            <code className="vsp-file-delete-path">{phoneFileDeleteTarget.path}</code>
            <div className="confirmActions">
              <button
                type="button"
                className="modalBtn"
                disabled={!!phoneFileAction}
                onClick={() => setPhoneFileDeleteTarget(null)}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="modalBtn modalBtnDanger"
                disabled={!!phoneFileAction}
                onClick={() => void handlePhoneFileDelete()}
              >
                {phoneFileAction?.kind === 'delete' ? 'Đang xoá...' : 'Xoá Tệp'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {deleteProfileModalOpen && ReactDOM.createPortal(
        <div
          className="confirmOverlay confirmOverlay--top"
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

    </>
  );
}
