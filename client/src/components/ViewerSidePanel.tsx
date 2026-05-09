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
} from '@/lib/serverApi';
import { Hash, Package, Upload, Download, Terminal, X, Play, Clock, Star, List, Save, Trash2, Palette } from 'lucide-react';

type ViewerSidePanelProps = {
  udid: string;
  currentOrder?: number;
  onChangeOrder?: (udid: string, newIndex: number) => void;
  onCloseViewer: () => void;
};
type AdbLogEntry = { id: number; time: string; command: string; output: string; success: boolean };
type ToastMsg = { id: number; text: string; type: 'ok' | 'err' };

function httpBase(wsServer: string): string {
  const u = new URL(wsServer);
  u.protocol = u.protocol === 'wss:' ? 'https:' : 'http:';
  u.search = ''; u.hash = '';
  if (!u.pathname.endsWith('/')) u.pathname += '/';
  return u.toString();
}

/* Preset ADB commands - warn=true for dangerous */
const DEFAULT_PRESETS: { label: string; cmd: string; warn?: boolean; color?: string }[] = [
  { label: 'Tắt màn hình', cmd: 'input keyevent 26' },
  { label: 'Mở khóa màn hình', cmd: 'input keyevent 82' },
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

const LS_CUSTOM_CMDS = 'vsp_custom_commands';
const LS_CMD_HISTORY = 'vsp_cmd_history';
const LS_PRESET_COLORS = 'vsp_preset_colors';

function loadJson<T>(key: string, def: T): T { try { return JSON.parse(localStorage.getItem(key) || '') ?? def; } catch { return def; } }
function saveJson(key: string, v: any) { localStorage.setItem(key, JSON.stringify(v)); }

export function ViewerSidePanel({ udid, currentOrder, onChangeOrder, onCloseViewer }: ViewerSidePanelProps) {
  const { wsServer } = useServer();
  const { t } = useI18n();

  // Device number
  const [newOrder, setNewOrder] = useState('');

  // Shared profile
  const [profiles, setProfiles] = useState<{ id: number; name: string }[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<number>(0);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastIdRef = useRef(0);
  const showToast = (text: string, type: 'ok' | 'err') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // APK
  const [apkStatus, setApkStatus] = useState<string | null>(null);
  const apkInputRef = useRef<HTMLInputElement | null>(null);

  // File Import
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File Export
  const [exportPath, setExportPath] = useState('/sdcard/');
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  // ADB Modal
  const [showAdbModal, setShowAdbModal] = useState(false);
  const [adbCommand, setAdbCommand] = useState('');
  const [adbLogs, setAdbLogs] = useState<AdbLogEntry[]>([]);
  const [adbRunning, setAdbRunning] = useState(false);
  const [adbTab, setAdbTab] = useState<'preset' | 'history' | 'custom'>('preset');
  const [cmdHistory, setCmdHistory] = useState<string[]>(() => loadJson(LS_CMD_HISTORY, []));
  const [customCmds, setCustomCmds] = useState(() => loadJson<{ label: string; cmd: string }[]>(LS_CUSTOM_CMDS, []));
  const [newCmdLabel, setNewCmdLabel] = useState('');
  const [newCmdValue, setNewCmdValue] = useState('');
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const logIdRef = useRef(0);

  // Preset color overrides
  const [presetColors, setPresetColors] = useState<Record<number, string>>(() => loadJson(LS_PRESET_COLORS, {}));

  // Context menu for presets
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; idx: number } | null>(null);
  const [editingPreset, setEditingPreset] = useState<{ idx: number; label: string; cmd: string } | null>(null);

  // ADB submenu on hover
  const [showAdbSubmenu, setShowAdbSubmenu] = useState(false);
  const adbHoverTimer = useRef<number | null>(null);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [adbLogs]);

  // Load profiles
  useEffect(() => {
    listUserProfiles(wsServer, udid).then(setProfiles).catch(() => {});
  }, [wsServer, udid]);

  // Handle click outside to close context menu, but ignore right-click and context menu items
  useEffect(() => {
    if (!ctxMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      // 1. Ignore if right-click
      if (event.button === 2) return;

      // 2. Check if click was on a context menu element
      const target = event.target as Element;
      const isClickOnContextMenu = target.closest('.react-contexify') || target.closest('.vsp-ctx-menu') || target.closest('.context-menu');
      
      // 3. If not on a context menu, close the local context menu
      if (!isClickOnContextMenu) {
        setCtxMenu(null);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [ctxMenu]);

  const handleChangeOrder = () => {
    const n = parseInt(newOrder, 10);
    if (!isFinite(n) || n <= 0) return;
    onChangeOrder?.(udid, n - 1);
    setNewOrder('');
  };

  const adbSectionRef = useRef<HTMLDivElement>(null);
  const [adbSubmenuPos, setAdbSubmenuPos] = useState({ x: 0, y: 0 });

  const handleAdbEnter = () => {
    if (adbHoverTimer.current) clearTimeout(adbHoverTimer.current);
    if (adbSectionRef.current) {
      const rect = adbSectionRef.current.getBoundingClientRect();
      const menuWidth = 220;
      let x = rect.right + 4;
      if (x + menuWidth > window.innerWidth) {
        x = rect.left - menuWidth - 4;
      }
      setAdbSubmenuPos({ x, y: rect.bottom });
    }
    setShowAdbSubmenu(true);
  };

  const handleAdbLeave = () => {
    adbHoverTimer.current = window.setTimeout(() => setShowAdbSubmenu(false), 400);
  };

  // Push file via HTTP API
  const pushFileToDevice = async (file: File, remotePath: string) => {
    const buf = await file.arrayBuffer();
    const base = httpBase(wsServer);
    const res = await fetch(`${base}api/goog/device/push-file`, {
      method: 'POST',
      headers: { 'X-UDID': udid, 'X-Remote-Path': encodeURIComponent(remotePath), 'Content-Type': 'application/octet-stream' },
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
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setApkStatus(`Đang upload ${file.name}...`);
      try {
        console.log('[VSP] Uploading APK:', file.name, 'size:', file.size, 'wsServer:', wsServer, 'udid:', udid);
        const saved = await installApk(wsServer, udid, file);
        console.log('[VSP] Uploaded OK, filePath:', saved);
        if (selectedProfile > 0) {
          setApkStatus(`Đang cài vào user ${selectedProfile}...`);
          await installApkToUser(wsServer, udid, saved, selectedProfile);
        } else {
          setApkStatus('Đang cài đặt...');
          await installUploadedApk(wsServer, udid, saved);
        }
        setApkStatus(`✅ Đã cài: ${file.name}`);
        showToast(`✅ APK: ${file.name}`, 'ok');
      } catch (err: any) {
        console.error('[VSP] APK install error:', err);
        const msg = err?.message || 'Cài APK thất bại';
        setApkStatus(`❌ ${msg}`);
        showToast(`❌ APK: ${msg}`, 'err');
      }
    }
  }, [wsServer, udid, selectedProfile]);

  // File Import - multi file
  const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) { console.warn('[VSP] No files selected for import'); return; }
    const files = Array.from(fileList);
    e.target.value = '';
    console.log('[VSP] Import files selected:', files.length, 'profile:', selectedProfile);
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
        
        await pushFileToDevice(file, targetPath);
        setImportStatus(`✅ Đã đẩy: ${file.name}`);
        showToast(`✅ Push: ${file.name}`, 'ok');
      } catch (err: any) {
        console.error('[VSP] Push error:', err);
        const msg = err?.message || 'Lỗi';
        setImportStatus(`❌ ${file.name}: ${msg}`);
        showToast(`❌ Push: ${msg}`, 'err');
      }
    }
  }, [wsServer, udid, selectedProfile]);

  // File Export
  const handleExport = useCallback(async () => {
    if (!exportPath.trim()) return;
    setExportStatus(t('Đang tải...'));
    try {
      const base = httpBase(wsServer);
      const res = await fetch(`${base}api/goog/device/pull-file`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ udid, remotePath: exportPath.trim() }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j?.error || `Status ${res.status}`); }
      const blob = await res.blob();
      const name = exportPath.trim().split('/').filter(Boolean).pop() || 'file.bin';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${udid}_${name}`; a.click();
      URL.revokeObjectURL(url);
      setExportStatus(t('✅ Đã tải: {name}', { name }));
    } catch (err: any) { setExportStatus(`❌ ${err?.message || t('Lỗi')}`); }
  }, [wsServer, udid, exportPath, t]);

  // ADB execution
  const executeAdbCommand = useCallback(async (cmd: string) => {
    if (!cmd.trim()) return;
    setAdbRunning(true);
    setCmdHistory(prev => { const next = [cmd, ...prev.filter(c => c !== cmd)].slice(0, 50); saveJson(LS_CMD_HISTORY, next); return next; });
    const id = ++logIdRef.current;
    const time = new Date().toLocaleTimeString('vi-VN');
    try {
      const result = await runAdbCommandApi(wsServer, udid, cmd);
      setAdbLogs(prev => [...prev, { id, time, command: cmd, output: result.output, success: result.success }]);
    } catch (err: any) {
      setAdbLogs(prev => [...prev, { id, time, command: cmd, output: err?.message || 'Error', success: false }]);
    }
    setAdbRunning(false);
  }, [wsServer, udid]);

  const handleAdbSubmit = () => { if (adbCommand.trim()) { executeAdbCommand(adbCommand.trim()); setAdbCommand(''); } };

  const handleSaveCustomCmd = () => {
    if (!newCmdLabel.trim() || !newCmdValue.trim()) return;
    const next = [...customCmds, { label: newCmdLabel.trim(), cmd: newCmdValue.trim() }];
    setCustomCmds(next); saveJson(LS_CUSTOM_CMDS, next);
    setNewCmdLabel(''); setNewCmdValue('');
  };
  const handleDeleteCustomCmd = (idx: number) => { const next = customCmds.filter((_, i) => i !== idx); setCustomCmds(next); saveJson(LS_CUSTOM_CMDS, next); };

  // Preset context menu handlers
  const handlePresetContextMenu = (e: React.MouseEvent, idx: number) => {
    e.preventDefault(); e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, idx });
  };
  const startEditPreset = (idx: number) => {
    setCtxMenu(null);
    setEditingPreset({ idx, label: DEFAULT_PRESETS[idx].label, cmd: DEFAULT_PRESETS[idx].cmd });
  };
  const setPresetColor = (idx: number, color: string) => {
    setCtxMenu(null);
    setPresetColors(prev => { const next = { ...prev, [idx]: color }; saveJson(LS_PRESET_COLORS, next); return next; });
  };

  const COLORS = ['#fff', '#ff9c9c', '#9cffb8', '#9cd4ff', '#ffdc9c', '#d49cff', '#ff9ce0'];

  return (
    <>
      <div className="vsp-panel right-bar-container">
        <div className="vsp-header" style={{ justifyContent: 'space-between' }}>
          <div className="device-serial-title" style={{
              color: '#fff', 
              fontWeight: 'bold',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
          }}>
              📱 {udid}
          </div>
          <button className="vsp-header-close" onClick={onCloseViewer} title={t('Close')}><X size={14} /></button>
        </div>
        {/* Toast notifications */}
        {toasts.length > 0 && (
          <div className="vsp-toast-container">
            {toasts.map(toast => (
              <div key={toast.id} className={`vsp-toast vsp-toast-${toast.type}`}>{toast.text}</div>
            ))}
          </div>
        )}
        <div className="vsp-body">
          {/* 1. Số Máy - inline */}
          <div className="vsp-section">
            <div className="vsp-section-title-inline">
              <Hash size={15} />
              <span>{t('Số Máy')}</span>
              <input className="vsp-input vsp-input-inline" type="text" inputMode="numeric" pattern="[0-9]*"
                placeholder={currentOrder !== undefined ? String(currentOrder + 1) : '?'}
                value={newOrder} onChange={e => setNewOrder(e.target.value.replace(/[^0-9]/g, ''))}
                onPointerDown={e => e.stopPropagation()}
                onKeyDown={e => e.key === 'Enter' && handleChangeOrder()} />
              <button className="vsp-btn vsp-btn-primary" onClick={handleChangeOrder}>{t('Đổi')}</button>
            </div>
          </div>

          {/* 2. Profile selector (shared) */}
          {profiles.length > 1 && (
            <div className="vsp-section">
              <div className="vsp-profile-inline">
                <span className="vsp-label">{t('Profile:')}</span>
                <select className="vsp-select" value={selectedProfile} onChange={e => setSelectedProfile(Number(e.target.value))}>
                  {profiles.map(p => <option key={p.id} value={p.id}>User {p.id} - {p.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* 3. Cài APK */}
          <div className="vsp-section">
            <div className="vsp-section-title vsp-clickable" onClick={() => {
              console.log('[VSP] APK click, ref:', apkInputRef.current);
              apkInputRef.current?.click();
            }}>
              <Package size={15} /><span>{t('Cài đặt APK')}</span>
            </div>
            <input ref={apkInputRef} type="file" accept=".apk,.xapk,.zip" multiple
              style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden', pointerEvents: 'none' }}
              onChange={handleApkSelect} />
            {apkStatus && <div className="vsp-status">{apkStatus}</div>}
          </div>

          {/* 4. Nhập tệp */}
          <div className="vsp-section">
            <div className="vsp-section-title vsp-clickable" onClick={() => {
              console.log('[VSP] File import click, ref:', fileInputRef.current);
              fileInputRef.current?.click();
            }}>
              <Upload size={15} /><span>{t('Nhập tệp vào điện thoại')}</span>
            </div>
            <input ref={fileInputRef} type="file" multiple
              style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden', pointerEvents: 'none' }}
              onChange={handleFileImport} />
            {importStatus && <div className="vsp-status">{importStatus}</div>}
          </div>

          {/* 5. Xuất tệp */}
          <div className="vsp-section">
            <div className="vsp-section-title vsp-clickable" onClick={handleExport}>
              <Download size={15} /><span>{t('Xuất tệp từ điện thoại')}</span>
            </div>
            <div className="vsp-row">
              <input className="vsp-input vsp-input-grow" placeholder="/sdcard/DCIM/photo.jpg"
                value={exportPath} onChange={e => setExportPath(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleExport()} />
            </div>
            {exportStatus && <div className="vsp-status">{exportStatus}</div>}
          </div>

          {/* 6. Chạy lệnh ADB - with hover submenu */}
          <div className="vsp-section vsp-adb-section" ref={adbSectionRef}
            onMouseEnter={handleAdbEnter}
            onMouseLeave={handleAdbLeave}
          >
            <div className="vsp-section-title vsp-clickable" onClick={() => setShowAdbModal(true)}>
              <Terminal size={15} /><span>{t('Chạy lệnh ADB')}</span>
            </div>
            {showAdbSubmenu && ReactDOM.createPortal(
              <div className="vsp-adb-submenu"
                style={{ position: 'fixed', left: adbSubmenuPos.x, bottom: window.innerHeight - adbSubmenuPos.y, margin: 0 }}
                onMouseEnter={() => {
                  if (adbHoverTimer.current) clearTimeout(adbHoverTimer.current);
                  setShowAdbSubmenu(true);
                }}
                onMouseLeave={handleAdbLeave}
              >
                {DEFAULT_PRESETS.map((c, i) => (
                  <button key={i}
                    className={`vsp-adb-submenu-item${c.warn ? ' vsp-cmd-warn' : ''}`}
                    style={presetColors[i] ? { color: presetColors[i] } : undefined}
                    onClick={e => { e.stopPropagation(); c.cmd.includes('<') ? (setShowAdbModal(true), setAdbCommand(c.cmd)) : executeAdbCommand(c.cmd); setShowAdbSubmenu(false); }}
                    title={c.cmd}
                  >
                    {c.label}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>
        </div>
      </div>

      {/* ADB Command Modal */}
      {showAdbModal && (
        <div className="vsp-modal-overlay" onClick={() => setShowAdbModal(false)}>
          <div className="vsp-modal" onClick={e => e.stopPropagation()}>
            <div className="vsp-modal-header">
              <div className="vsp-modal-title"><Terminal size={18} /><span>ADB Command</span><span className="vsp-modal-udid">{udid}</span></div>
              <button className="vsp-modal-close" onClick={() => setShowAdbModal(false)}><X size={16} /></button>
            </div>
            <div className="vsp-modal-input-row">
              <input className="vsp-modal-input" placeholder={t('Nhập lệnh ADB (VD: pm list packages -3)')}
                value={adbCommand} onChange={e => setAdbCommand(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdbSubmit(); } }} autoFocus />
              <button className="vsp-btn vsp-btn-primary" onClick={handleAdbSubmit} disabled={adbRunning || !adbCommand.trim()}>
                <Play size={14} />{t('Thực hiện')}
              </button>
            </div>
            <div className="vsp-modal-tabs">
              <button className={`vsp-modal-tab ${adbTab === 'preset' ? 'on' : ''}`} onClick={() => setAdbTab('preset')}><List size={13} />{t('Lệnh nội bộ')}</button>
              <button className={`vsp-modal-tab ${adbTab === 'history' ? 'on' : ''}`} onClick={() => setAdbTab('history')}><Clock size={13} />{t('Lịch sử')}</button>
              <button className={`vsp-modal-tab ${adbTab === 'custom' ? 'on' : ''}`} onClick={() => setAdbTab('custom')}><Star size={13} />{t('Lệnh của tôi')}</button>
            </div>
            <div className="vsp-modal-tab-content">
              {adbTab === 'preset' && (
                <div className="vsp-cmd-grid">
                  {DEFAULT_PRESETS.map((c, i) => (
                    <button key={i}
                      className={`vsp-cmd-item${c.warn ? ' vsp-cmd-warn' : ''}`}
                      style={presetColors[i] ? { color: presetColors[i] } : undefined}
                      onClick={() => { c.cmd.includes('<') ? setAdbCommand(c.cmd) : executeAdbCommand(c.cmd); }}
                      onContextMenu={e => handlePresetContextMenu(e, i)}
                      title={c.cmd}
                    >
                      <span className="vsp-cmd-label" style={presetColors[i] ? { color: presetColors[i] } : undefined}>{c.label}</span>
                      <span className="vsp-cmd-code">{c.cmd}</span>
                    </button>
                  ))}
                </div>
              )}
              {adbTab === 'history' && (
                <div className="vsp-cmd-list">
                  {cmdHistory.length === 0 && <div className="vsp-empty">{t('Chưa có lịch sử')}</div>}
                  {cmdHistory.map((cmd, i) => (
                    <button key={i} className="vsp-cmd-history-item" onClick={() => setAdbCommand(cmd)} onDoubleClick={() => executeAdbCommand(cmd)}>
                      <Clock size={13} /><span>{cmd}</span>
                    </button>
                  ))}
                </div>
              )}
              {adbTab === 'custom' && (
                <div className="vsp-cmd-custom">
                  <div className="vsp-cmd-add-row">
                    <input className="vsp-input" placeholder={t('Tên')} value={newCmdLabel} onChange={e => setNewCmdLabel(e.target.value)} />
                    <input className="vsp-input vsp-input-grow" placeholder={t('Lệnh ADB')} value={newCmdValue} onChange={e => setNewCmdValue(e.target.value)} />
                    <button className="vsp-btn vsp-btn-primary" onClick={handleSaveCustomCmd}><Save size={14} /></button>
                  </div>
                  <div className="vsp-cmd-list">
                    {customCmds.length === 0 && <div className="vsp-empty">{t('Chưa có lệnh tùy chỉnh')}</div>}
                    {customCmds.map((c, i) => (
                      <div key={i} className="vsp-cmd-custom-item">
                        <button className="vsp-cmd-custom-run" onClick={() => executeAdbCommand(c.cmd)} title={c.cmd}>
                          <Play size={13} /><span className="vsp-cmd-label">{c.label}</span><span className="vsp-cmd-code">{c.cmd}</span>
                        </button>
                        <button className="vsp-cmd-custom-del" onClick={() => handleDeleteCustomCmd(i)}><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="vsp-modal-log-header">
              <span>{t('Nhật ký thực hiện')}</span>
              {adbLogs.length > 0 && <button className="vsp-btn-text" onClick={() => setAdbLogs([])}>{t('Xoá log')}</button>}
            </div>
            <div className="vsp-modal-log">
              {adbLogs.length === 0 && <div className="vsp-empty">{t('Chưa có lệnh nào được thực hiện')}</div>}
              {adbLogs.map(log => (
                <div key={log.id} className={`vsp-log-entry ${log.success ? 'ok' : 'err'}`}>
                  <div className="vsp-log-head"><span className="vsp-log-time">{log.time}</span><code className="vsp-log-cmd">$ {log.command}</code></div>
                  <pre className="vsp-log-output">{log.output}</pre>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
            {adbRunning && <div className="vsp-modal-running"><div className="vsp-spinner-small" /><span>{t('Đang thực hiện...')}</span></div>}
          </div>
        </div>
      )}

      {/* Preset right-click context menu - portal to body for correct positioning */}
      {ctxMenu && ReactDOM.createPortal(
        <div className="vsp-ctx-menu" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={e => e.stopPropagation()}>
          <button className="vsp-ctx-item" onClick={() => startEditPreset(ctxMenu.idx)}>
            <Terminal size={13} />{t('Tuỳ chỉnh lệnh (Edit)')}
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
                  executeAdbCommand(editingPreset.cmd.trim());
                }
                setEditingPreset(null);
              }}><Play size={14} />{t('Thực hiện')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
