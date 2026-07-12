import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { getAppsList, extractAppApk, forceStopApp, clearAppCache, uninstallApp } from '@/lib/serverApi';
import type { AppInfo } from '@/lib/serverApi';
import { Package, RefreshCw, Pin, Trash2, Play, Eraser, Download, Loader2, ChevronRight, AlertTriangle } from 'lucide-react';

interface ViewerAppsMenuProps {
  wsServer: string;
  udid: string;
  userId: number;
  profileName: string;
  showToast: (text: string, type: 'ok' | 'err') => void;
}

export function ViewerAppsMenu({
  wsServer,
  udid,
  userId,
  profileName,
  showToast,
}: ViewerAppsMenuProps) {
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pinned apps state
  const [pinnedPackages, setPinnedPackages] = useState<Set<string>>(new Set());

  // Submenu positioning refs
  const rowRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const submenu2Ref = useRef<HTMLDivElement>(null);

  // Submenu 2 (actions) state
  const [hoveredApp, setHoveredApp] = useState<AppInfo | null>(null);
  const [submenu2Coords, setSubmenu2Coords] = useState<{ left: number; top: number; alignLeft: boolean } | null>(null);

  // Active action running state (packageName -> actionName or true)
  const [actionRunning, setActionRunning] = useState<Record<string, string | boolean>>({});

  // Uninstall confirm modal state
  const [uninstallConfirmApp, setUninstallConfirmApp] = useState<AppInfo | null>(null);

  // Timers for hover delay
  const hoverTimer = useRef<number | null>(null);
  const submenu2HoverTimer = useRef<number | null>(null);

  // Load pinned apps from localStorage
  const pinnedStorageKey = `monviewphone:pinned_apps:${udid}:${userId}`;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(pinnedStorageKey);
      if (saved) {
        setPinnedPackages(new Set(JSON.parse(saved)));
      } else {
        setPinnedPackages(new Set());
      }
    } catch {
      setPinnedPackages(new Set());
    }
  }, [udid, userId]);

  // Save pinned apps helper
  const savePinnedPackages = (newSet: Set<string>) => {
    setPinnedPackages(newSet);
    try {
      localStorage.setItem(pinnedStorageKey, JSON.stringify(Array.from(newSet)));
    } catch (e) {
      console.error('Failed to save pinned apps', e);
    }
  };

  // Close menus when variables change
  useEffect(() => {
    setShowSubmenu(false);
    setHoveredApp(null);
    setApps([]);
    setError(null);
  }, [udid, userId]);

  // Fetch apps helper
  const fetchApps = async (bypassCache = false) => {
    setLoading(true);
    setError(null);
    try {
      const list = await getAppsList(wsServer, udid, userId);
      setApps(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch application list');
      showToast(err?.message || 'Không thể tải danh sách ứng dụng', 'err');
    } finally {
      setLoading(false);
    }
  };

  // Trigger load on menu open
  useEffect(() => {
    if (showSubmenu && apps.length === 0 && !loading && !error) {
      fetchApps();
    }
  }, [showSubmenu]);

  // Listen for Escape key to close menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSubmenu(false);
        setHoveredApp(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hover handlers for row
  const handleMouseEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setShowSubmenu(true);
  };

  const handleMouseLeave = () => {
    hoverTimer.current = window.setTimeout(() => {
      setShowSubmenu(false);
      setHoveredApp(null);
    }, 250);
  };

  // Hover handlers for Submenu 2
  const handleAppItemEnter = (app: AppInfo, event: React.MouseEvent<HTMLDivElement>) => {
    if (submenu2HoverTimer.current) clearTimeout(submenu2HoverTimer.current);
    setHoveredApp(app);

    // Compute Submenu Cấp 2 coordinates
    const itemRect = event.currentTarget.getBoundingClientRect();
    const submenuWidth = 200; // Expected width of submenu 2
    const submenu1Rect = submenuRef.current?.getBoundingClientRect();

    if (submenu1Rect) {
      // Determine if Submenu 2 should open to the left or right of Submenu 1
      let left = submenu1Rect.right + 4;
      let alignLeft = false;

      // If Submenu 1 opened to the left of the sidebar, or space on right is small, open Submenu 2 to the left
      if (left + submenuWidth > window.innerWidth) {
        left = submenu1Rect.left - submenuWidth - 4;
        alignLeft = true;
      }

      setSubmenu2Coords({
        left,
        top: itemRect.top,
        alignLeft,
      });
    }
  };

  const handleAppItemLeave = () => {
    submenu2HoverTimer.current = window.setTimeout(() => {
      setHoveredApp(null);
    }, 250);
  };

  // Positioning Submenu Cấp 1
  useLayoutEffect(() => {
    if (showSubmenu && rowRef.current && submenuRef.current) {
      const rect = rowRef.current.getBoundingClientRect();
      const menuEl = submenuRef.current;
      const menuWidth = 260; // Styled width
      
      let x = rect.right + 4;
      if (x + menuWidth > window.innerWidth) {
        x = rect.left - menuWidth - 4;
      }
      
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      menuEl.style.left = `${x}px`;
      if (spaceBelow < 300 && spaceAbove > spaceBelow) {
        menuEl.style.top = 'auto';
        menuEl.style.bottom = `${window.innerHeight - rect.bottom}px`;
        menuEl.style.maxHeight = `${rect.bottom - 12}px`;
      } else {
        menuEl.style.bottom = 'auto';
        menuEl.style.top = `${rect.top}px`;
        menuEl.style.maxHeight = `${window.innerHeight - rect.top - 12}px`;
      }
      
      menuEl.style.opacity = '1';
      menuEl.style.pointerEvents = 'auto';
    }
  }, [showSubmenu, apps, loading, error]);

  // Actions
  const handlePinToggle = (app: AppInfo) => {
    const newSet = new Set(pinnedPackages);
    if (newSet.has(app.packageName)) {
      newSet.delete(app.packageName);
      showToast(`Đã bỏ ghim ${app.displayName}`, 'ok');
    } else {
      newSet.add(app.packageName);
      showToast(`Đã ghim ${app.displayName} lên đầu danh sách`, 'ok');
    }
    savePinnedPackages(newSet);
  };

  const handleExtractApk = async (app: AppInfo) => {
    const pkg = app.packageName;
    setActionRunning(prev => ({ ...prev, [pkg]: 'Lấy APK...' }));
    try {
      const result = await extractAppApk(wsServer, udid, userId, pkg);
      showToast(`Đã trích xuất thành công: ${result.outputDir}`, 'ok');
    } catch (err: any) {
      showToast(err?.message || 'Trích xuất APK thất bại', 'err');
    } finally {
      setActionRunning(prev => ({ ...prev, [pkg]: false }));
    }
  };

  const handleForceStop = async (app: AppInfo) => {
    const pkg = app.packageName;
    setActionRunning(prev => ({ ...prev, [pkg]: 'Đang đóng...' }));
    try {
      await forceStopApp(wsServer, udid, userId, pkg);
      showToast(`Đã buộc dừng ứng dụng ${app.displayName}`, 'ok');
    } catch (err: any) {
      showToast(err?.message || 'Không thể đóng ứng dụng', 'err');
    } finally {
      setActionRunning(prev => ({ ...prev, [pkg]: false }));
    }
  };

  const handleClearCache = async (app: AppInfo) => {
    const pkg = app.packageName;
    setActionRunning(prev => ({ ...prev, [pkg]: 'Xóa cache...' }));
    try {
      await clearAppCache(wsServer, udid, userId, pkg);
      showToast(`Đã dọn dẹp cache của ${app.displayName}`, 'ok');
    } catch (err: any) {
      if (err?.message === 'unsupported') {
        showToast('Thiết bị/ROM không hỗ trợ xóa riêng cache (Yêu cầu Root)', 'err');
      } else {
        showToast(err?.message || 'Không thể dọn dẹp cache', 'err');
      }
    } finally {
      setActionRunning(prev => ({ ...prev, [pkg]: false }));
    }
  };

  const handleUninstallSubmit = async (app: AppInfo) => {
    const pkg = app.packageName;
    setUninstallConfirmApp(null);
    setActionRunning(prev => ({ ...prev, [pkg]: 'Đang gỡ...' }));
    try {
      await uninstallApp(wsServer, udid, userId, pkg);
      showToast(`Đã gỡ cài đặt ứng dụng ${app.displayName}`, 'ok');
      // Refresh list
      fetchApps();
    } catch (err: any) {
      showToast(err?.message || 'Gỡ cài đặt thất bại', 'err');
    } finally {
      setActionRunning(prev => ({ ...prev, [pkg]: false }));
    }
  };

  // Sort apps: Pinned apps go first, then alphabetically
  const sortedApps = React.useMemo(() => {
    return [...apps].sort((a, b) => {
      const aPinned = pinnedPackages.has(a.packageName);
      const bPinned = pinnedPackages.has(b.packageName);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return a.displayName.localeCompare(b.displayName, 'vi', { sensitivity: 'base' });
    });
  }, [apps, pinnedPackages]);

  return (
    <div
      className="vsp-apps-section"
      ref={rowRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 1. Sidebar trigger row */}
      <div className="vsp-section-title vsp-clickable">
        <Package size={15} />
        <span>DS ứng dụng</span>
      </div>

      {/* 2. Submenu Cấp 1: App List */}
      {showSubmenu && ReactDOM.createPortal(
        <div
          ref={submenuRef}
          className="vsp-adb-submenu vsp-apps-submenu-panel"
          style={{ position: 'fixed', left: 0, top: 0, opacity: 0, pointerEvents: 'none', margin: 0 }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header */}
          <div className="vsp-apps-submenu-header">
            <span className="vsp-apps-submenu-title">Danh sách ứng dụng</span>
            <button
              className="vsp-apps-refresh-btn"
              disabled={loading}
              onClick={(e) => {
                e.stopPropagation();
                fetchApps();
              }}
              title="Tải lại danh sách"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* List Content */}
          <div className="vsp-apps-list-scroll scrollbar-thin">
            {loading && (
              <div className="vsp-apps-state">
                <Loader2 size={16} className="animate-spin" />
                <span>Đang quét thiết bị...</span>
              </div>
            )}

            {error && (
              <div className="vsp-apps-state vsp-apps-error">
                <span>{error}</span>
              </div>
            )}

            {!loading && !error && sortedApps.length === 0 && (
              <div className="vsp-apps-state">
                <span>Không tìm thấy ứng dụng</span>
              </div>
            )}

            {!loading && !error && sortedApps.map((app) => {
              const isPinned = pinnedPackages.has(app.packageName);
              const runningState = actionRunning[app.packageName];
              const isHovered = hoveredApp?.packageName === app.packageName;

              return (
                <div
                  key={app.packageName}
                  className={`vsp-apps-list-item ${isHovered ? 'hovered' : ''}`}
                  onMouseEnter={(e) => handleAppItemEnter(app, e)}
                  onMouseLeave={handleAppItemLeave}
                >
                  {/* App Icon */}
                  {app.icon ? (
                    <img
                      src={`data:image/png;base64,${app.icon}`}
                      alt={app.displayName}
                      className="vsp-app-item-icon"
                    />
                  ) : (
                    <div className="vsp-app-item-icon-fallback">
                      <Package size={14} />
                    </div>
                  )}

                  {/* App Details */}
                  <div className="vsp-app-item-info">
                    <span className="vsp-app-item-name">{app.displayName}</span>
                    <span className="vsp-app-item-pkg">{app.packageName}</span>
                  </div>

                  {/* Badges / Status */}
                  <div className="vsp-app-item-badges">
                    {isPinned && <Pin size={11} className="vsp-app-pinned-icon" />}
                    {runningState && (
                      <span className="vsp-app-running-text">
                        {typeof runningState === 'string' ? runningState : 'Đang xử lý...'}
                      </span>
                    )}
                    <ChevronRight size={13} className="vsp-app-arrow" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}

      {/* 3. Submenu Cấp 2: App Actions */}
      {showSubmenu && hoveredApp && submenu2Coords && ReactDOM.createPortal(
        <div
          ref={submenu2Ref}
          className="vsp-adb-submenu vsp-apps-submenu-cap2"
          style={{
            position: 'fixed',
            left: `${submenu2Coords.left}px`,
            top: `${submenu2Coords.top}px`,
            margin: 0,
            zIndex: 10000,
          }}
          onMouseEnter={() => {
            if (hoverTimer.current) clearTimeout(hoverTimer.current);
            if (submenu2HoverTimer.current) clearTimeout(submenu2HoverTimer.current);
            setShowSubmenu(true);
          }}
          onMouseLeave={handleMouseLeave}
        >
          {/* App Header in Actions Menu */}
          <div className="vsp-apps-cap2-header">
            <span className="vsp-apps-cap2-title">{hoveredApp.displayName}</span>
          </div>

          {/* Action List */}
          {(() => {
            const isPinned = pinnedPackages.has(hoveredApp.packageName);
            const isRunning = Boolean(actionRunning[hoveredApp.packageName]);

            return (
              <div className="vsp-apps-cap2-list">
                <button
                  className="vsp-adb-submenu-item"
                  disabled={isRunning}
                  onClick={() => handlePinToggle(hoveredApp)}
                >
                  <Pin size={13} style={{ marginRight: '8px' }} />
                  <span>{isPinned ? 'Bỏ ghim ứng dụng' : 'Ghim ứng dụng'}</span>
                </button>

                <button
                  className="vsp-adb-submenu-item"
                  disabled={isRunning}
                  onClick={() => handleExtractApk(hoveredApp)}
                >
                  <Download size={13} style={{ marginRight: '8px' }} />
                  <span>Lấy APK</span>
                </button>

                <button
                  className="vsp-adb-submenu-item"
                  disabled={isRunning}
                  onClick={() => handleForceStop(hoveredApp)}
                >
                  <Play size={13} style={{ marginRight: '8px', transform: 'rotate(90deg)' }} />
                  <span>Đóng ứng dụng</span>
                </button>

                <button
                  className="vsp-adb-submenu-item"
                  disabled={isRunning}
                  onClick={() => handleClearCache(hoveredApp)}
                >
                  <Eraser size={13} style={{ marginRight: '8px' }} />
                  <span>Làm sạch bộ nhớ cache</span>
                </button>

                <button
                  className="vsp-adb-submenu-item vsp-cmd-warn"
                  disabled={isRunning}
                  onClick={() => setUninstallConfirmApp(hoveredApp)}
                >
                  <Trash2 size={13} style={{ marginRight: '8px' }} />
                  <span>Gỡ cài đặt ứng dụng</span>
                </button>
              </div>
            );
          })()}
        </div>,
        document.body
      )}

      {/* 4. Custom Portal Uninstall Confirmation Modal */}
      {uninstallConfirmApp && ReactDOM.createPortal(
        <div className="vsp-apps-modal-overlay">
          <div className="vsp-apps-modal-card">
            <div className="vsp-apps-modal-header">
              <AlertTriangle size={20} className="vsp-apps-modal-alert-icon" />
              <span>Xác nhận gỡ cài đặt ứng dụng</span>
            </div>
            
            <div className="vsp-apps-modal-body">
              <p>Bạn có chắc chắn muốn gỡ cài đặt ứng dụng sau khỏi thiết bị?</p>
              <div className="vsp-apps-modal-app-details">
                <div className="vsp-apps-modal-detail-row">
                  <span className="label">Tên ứng dụng:</span>
                  <span className="value strong">{uninstallConfirmApp.displayName}</span>
                </div>
                <div className="vsp-apps-modal-detail-row">
                  <span className="label">Package Name:</span>
                  <span className="value">{uninstallConfirmApp.packageName}</span>
                </div>
                <div className="vsp-apps-modal-detail-row">
                  <span className="label">Hồ sơ/User:</span>
                  <span className="value strong highlight">{profileName} (User {userId})</span>
                </div>
              </div>
              <p className="vsp-apps-modal-warning-text">⚠️ Cảnh báo: Mọi dữ liệu của ứng dụng này trong hồ sơ hiện tại sẽ bị xóa sạch.</p>
            </div>

            <div className="vsp-apps-modal-footer">
              <button 
                type="button" 
                className="modalBtn" 
                onClick={() => setUninstallConfirmApp(null)}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="modalBtnDanger" 
                onClick={() => handleUninstallSubmit(uninstallConfirmApp)}
              >
                Đồng ý gỡ
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
