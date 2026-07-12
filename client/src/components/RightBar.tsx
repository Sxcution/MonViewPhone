import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useActive } from '@/context/ActiveContext';
import { AndroidKeycode } from '@/lib/keyEvent';
import { useDirectKeyboard } from '@/hooks/useDirectKeyboard';
import { useServer } from '@/context/ServerContext';
import { installApk, installUploadedApk, syncPhoneClipboardToPcApi } from '@/lib/serverApi';
import { useI18n } from '@/context/I18nContext';
import {
  ArrowLeft,
  Camera,
  ChevronsLeft,
  ClipboardPaste,
  Home,
  Link2,
  Package,
  Power,
  Square,
  Menu,
  Volume1,
  Volume2,
  VolumeX,
  Clock3,
} from 'lucide-react';
import {
  loadSyncTimeSettings,
  saveSyncTimeSettings,
  syncTimeDelayRangeMs,
  type SyncTimeSettings,
  SYNC_TIME_SETTINGS_EVENT,
} from '@/lib/syncTimeSettings';
import { SyncTimeSettingsModal } from './SyncTimeSettingsModal';

type RightBarProps = {
  hidden?: boolean;
  showExpand?: boolean;
  onExpand?: () => void;
  hideSyncButtons?: boolean;
};

export function RightBar({ hidden, showExpand, onExpand, hideSyncButtons }: RightBarProps) {
  const {
    activeUdid,
    sendKeyTap,
    screenshotActiveCanvas,
    syncAll,
    setSyncAll,
    syncMain,
    setSyncMain,
    registeredUdids,
    stopSync,
  } = useActive();
  const { t } = useI18n();
  const { wsServer } = useServer();
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  const [syncTimeOpen, setSyncTimeOpen] = useState(false);
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

  const kbBarRef = useRef<HTMLDivElement | null>(null);
  const { manualPaste } = useDirectKeyboard(true, kbBarRef.current);
  const apkInputRef = useRef<HTMLInputElement | null>(null);
  const clipboardSyncErrorShownRef = useRef(false);

  useEffect(() => {
    if (!activeUdid) return;
    let stopped = false;
    let timer: number | null = null;

    const activateClipboardSync = async () => {
      try {
        const result = await syncPhoneClipboardToPcApi(wsServer, activeUdid);
        clipboardSyncErrorShownRef.current = false;
        if (!stopped && result.changed) {
          setInstallStatus(t('Đã tự copy clipboard device sang PC'));
        }
      } catch (err: any) {
        if (!stopped && !clipboardSyncErrorShownRef.current) {
          clipboardSyncErrorShownRef.current = true;
          setInstallStatus(err?.message || t('Auto copy clipboard từ device thất bại'));
        }
      } finally {
        if (!stopped) timer = window.setTimeout(activateClipboardSync, 15000);
      }
    };

    timer = window.setTimeout(activateClipboardSync, 300);
    return () => {
      stopped = true;
      if (timer != null) window.clearTimeout(timer);
    };
  }, [activeUdid, wsServer, t]);

  const handleApkSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!activeUdid) {
      setInstallStatus(t('Chọn device trước khi cài APK'));
      return;
    }
    try {
      setInstallStatus(t('Đang upload {name}...', { name: file.name }));
      const saved = await installApk(wsServer, activeUdid, file);
      setInstallStatus(
        t('Đã lưu lên server: {name}, đang cài...', { name: saved || file.name }),
      );
      await installUploadedApk(wsServer, activeUdid, saved || file.name);
      setInstallStatus(t('Đã cài: {name}', { name: file.name }));
    } catch (err: any) {
      setInstallStatus(err?.message || t('Cài/Upload APK thất bại'));
    }
  };

  const triggerApkPicker = () => {
    if (!activeUdid) {
      setInstallStatus(t('Chọn device trước khi cài APK'));
      return;
    }
    apkInputRef.current?.click();
  };

  const ensureMainSelected = () => {
    if (syncMain || !registeredUdids.length) return;
    const fallback = activeUdid || registeredUdids[0] || null;
    if (fallback) setSyncMain(fallback);
  };

  const handleSyncToggle = () => {
    if (syncAll) {
      stopSync();
      return;
    }
    setSyncAll(true);
    ensureMainSelected();
  };

  const handleStopSync = () => {
    stopSync();
  };

  return (
    <>
      <div
        id="rightbar"
        ref={kbBarRef}
        className={hidden ? 'rb-hidden' : undefined}
      >
        {showExpand ? (
          <button
            className="rb-btn"
            title={t('Mở rộng bảng cấu hình')}
            onClick={onExpand}
          >
            <span className="rb-icon">
              <ChevronsLeft size={16} strokeWidth={1.8} />
            </span>
          </button>
        ) : null}
        {hideSyncButtons ? null : (
          <>
            <button
              className={`rb-btn ${syncAll ? 'on' : ''}`}
              title={
                syncAll
                  ? t('Sync đang bật: gửi thao tác tới tất cả thiết bị đang mở')
                  : t('Sync đang tắt: chỉ điều khiển thiết bị đang focus')
              }
              onClick={handleSyncToggle}
            >
              <span className="rb-icon">
                <Link2 size={16} strokeWidth={1.8} />
              </span>
            </button>
            {syncAll ? (
              <button className="rb-btn rb-stop" title={t('Dừng sync')} onClick={handleStopSync}>
                <span className="rb-icon">
                  <Square size={14} strokeWidth={1.8} />
                </span>
              </button>
            ) : null}
          </>
        )}

        <button className="rb-btn" title={t('Nguồn')} onClick={() => sendKeyTap(AndroidKeycode.KEYCODE_POWER)}>
          <span className="rb-icon">
            <Power size={16} strokeWidth={1.8} />
          </span>
        </button>
        <button className="rb-btn" title={t('Tăng âm lượng')} onClick={() => sendKeyTap(AndroidKeycode.KEYCODE_VOLUME_UP)}>
          <span className="rb-icon">
            <Volume2 size={16} strokeWidth={1.8} />
          </span>
        </button>
        <button className="rb-btn" title={t('Giảm âm lượng')} onClick={() => sendKeyTap(AndroidKeycode.KEYCODE_VOLUME_DOWN)}>
          <span className="rb-icon">
            <Volume1 size={16} strokeWidth={1.8} />
          </span>
        </button>
        <button className="rb-btn" title={t('Tắt tiếng')} onClick={() => sendKeyTap(AndroidKeycode.KEYCODE_VOLUME_MUTE)}>
          <span className="rb-icon">
            <VolumeX size={16} strokeWidth={1.8} />
          </span>
        </button>

        <div className="rb-sep" />

        <button className="rb-btn" title={t('Quay lại')} onClick={() => sendKeyTap(AndroidKeycode.KEYCODE_BACK)}>
          <span className="rb-icon">
            <ArrowLeft size={16} strokeWidth={1.8} />
          </span>
        </button>
        <button className="rb-btn" title={t('Về Home')} onClick={() => sendKeyTap(AndroidKeycode.KEYCODE_HOME)}>
          <span className="rb-icon">
            <Home size={16} strokeWidth={1.8} />
          </span>
        </button>
        <button className="rb-btn" title={t('Đa nhiệm')} onClick={() => sendKeyTap(AndroidKeycode.KEYCODE_APP_SWITCH)}>
          <span className="rb-icon">
            <Menu size={16} strokeWidth={1.8} />
          </span>
        </button>

        <div className="rb-sep" />

        <button className="rb-btn" title={t('Sync Time')} onClick={() => setSyncTimeOpen(true)}>
          <span className="rb-icon">
            <Clock3 size={16} strokeWidth={1.8} />
          </span>
        </button>
        <button className="rb-btn" title={t('Cài APK (device active)')} onClick={triggerApkPicker}>
          <span className="rb-icon">
            <Package size={16} strokeWidth={1.8} />
          </span>
        </button>
        <button className="rb-btn" title={t('Paste từ PC vào device')} onClick={() => manualPaste()}>
          <span className="rb-icon">
            <ClipboardPaste size={16} strokeWidth={1.8} />
          </span>
        </button>
        <input
          ref={apkInputRef}
          type="file"
          accept=".apk,.xapk,.zip,application/vnd.android.package-archive,application/zip"
          style={{ display: 'none' }}
          onChange={handleApkSelect}
        />
        {installStatus ? <div style={{ fontSize: 11, color: '#9bc1ff', marginTop: 6 }}>{installStatus}</div> : null}

        <div className="rb-spacer" />

        {/* Locale switch moved to header */}
      </div>

      {syncTimeOpen ? (
        <SyncTimeSettingsModal
          settings={syncTimeSettings}
          delayRange={syncDelayRange}
          onChange={updateSyncTimeSettings}
          onClose={() => setSyncTimeOpen(false)}
        />
      ) : null}
    </>
  );
}
