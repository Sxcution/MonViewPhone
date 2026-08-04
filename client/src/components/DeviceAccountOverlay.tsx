import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Plus, Trash2, Settings, ChevronDown, ChevronUp, Play, RefreshCw } from 'lucide-react';
import { hasNearbyRelevantAccount } from '@/lib/deviceAccountNearby';
import { saveBackendSetting } from '@/lib/backendSettings';
import { useServer } from '@/context/ServerContext';
import { runAdbCommandApi } from '@/lib/serverApi';
import { ConfirmDialog, ContextMenuLayer, ModalLayer } from '@/components/ui';
import {
  getDeviceAccountData,
  loadDeviceAccountVault,
  getDeviceAccountDataFromVault,
  VaultData,
  DeviceAccountData,
  PlatformType,
  WeChatAccount,
  getWechatNewStatus,
  getSavedPlatforms,
  saveSavedPlatforms,
  saveDeviceAccountVault,
} from '@/lib/deviceAccountVault';
export { DeviceAccountPanel } from './DeviceAccountPanel';

type DeviceAccountOverlayProps = {
  open: boolean;
  panelOpen: boolean;
  onClose: () => void;
  registeredUdids: string[];
  connectedUdids: Set<string>;
  orderMap: Map<string, number>;
  androidDeviceMap: Record<string, any>;
  search: string;
  setSearch: (val: string) => void;
  activeFilter: string;
  setActiveFilter: (val: string) => void;
  activeTab: PlatformType;
  setActiveTab: (val: PlatformType) => void;
  onOpenDeviceViewer?: (udid: string) => void;
  connectSelection?: Set<string>;
  setConnectSelection?: React.Dispatch<React.SetStateAction<Set<string>>>;
  onDeviceContextMenu?: (e: React.MouseEvent, udid: string, groupIdx: number) => void;
  onSyncNovaWechat?: (udids: string[], dataByUdid?: Record<string, DeviceAccountData>, force?: boolean) => Promise<void>;
};

function clampDavPanelPosition(pos: { x: number; y: number }, panel?: HTMLElement | null) {
  const margin = 12;
  const minVisibleHeader = 56;

  const panelWidth = panel?.offsetWidth || 900;
  const panelHeight = panel?.offsetHeight || 600;

  const maxX = Math.max(margin, window.innerWidth - Math.min(panelWidth, window.innerWidth - margin * 2) - margin);
  const maxY = Math.max(margin, window.innerHeight - minVisibleHeader);

  return {
    x: Math.min(Math.max(pos.x, margin), maxX),
    y: Math.min(Math.max(pos.y, margin), maxY),
  };
}

export function DeviceAccountOverlay({
  open,
  panelOpen,
  onClose,
  registeredUdids,
  connectedUdids,
  orderMap,
  androidDeviceMap,
  search,
  setSearch,
  activeFilter,
  setActiveFilter,
  activeTab,
  setActiveTab,
  connectSelection,
  setConnectSelection,
  onDeviceContextMenu,
  onSyncNovaWechat
}: DeviceAccountOverlayProps) {
  const { wsServer } = useServer();
  const [vault, setVault] = useState<VaultData>(() => loadDeviceAccountVault());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const floatingPanelRef = useRef<HTMLDivElement | null>(null);

  // Load savedGroups and reactive listener
  const [savedGroups, setSavedGroups] = useState<{ name: string, udids: string[], selectedAccounts?: Record<string, string> }[]>(() => {
    try {
      const raw = localStorage.getItem('savedGroups');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : (parsed?.groups || []);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleGroupsUpdate = () => {
      try {
        const raw = localStorage.getItem('savedGroups');
        if (raw) {
          const parsed = JSON.parse(raw);
          setSavedGroups(Array.isArray(parsed) ? parsed : (parsed?.groups || []));
        }
      } catch {}
    };
    window.addEventListener('saved-groups-updated', handleGroupsUpdate);
    return () => window.removeEventListener('saved-groups-updated', handleGroupsUpdate);
  }, []);

  const [davGroupsExpanded, setDavGroupsExpanded] = useState<boolean>(() => {
    return localStorage.getItem('monviewphone:dav-groups-expanded') === 'true';
  });

  const [davExpandedGroupIdx, setDavExpandedGroupIdx] = useState<number | null>(null);



  const [platforms, setPlatforms] = useState(() => getSavedPlatforms());
  const [showAddPlatformModal, setShowAddPlatformModal] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState('');
  const [addPlatformError, setAddPlatformError] = useState('');

  const [platformCtxMenu, setPlatformCtxMenu] = useState<{ x: number; y: number; platformId: string } | null>(null);
  const platformCtxMenuRef = useRef<HTMLDivElement>(null);
  const [pendingDeletePlatform, setPendingDeletePlatform] = useState<string | null>(null);

  // === Nearby Filter Mode State (dav-nearby-filter-mode) ===
  type DavNearbyFilterMode = 'priority_sort' | 'hide_unmatched';
  const DAV_NEARBY_FILTER_MODE_KEY_LOCAL = 'monviewphone:dav-nearby-filter-mode';

  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false);
  const [nearbyFilterMode, setNearbyFilterMode] = useState<DavNearbyFilterMode>(() => {
    try {
      const raw = localStorage.getItem(DAV_NEARBY_FILTER_MODE_KEY_LOCAL);
      return raw === 'priority_sort' ? 'priority_sort' : 'hide_unmatched';
    } catch {
      return 'hide_unmatched';
    }
  });

  const updateNearbyFilterMode = (mode: DavNearbyFilterMode) => {
    setNearbyFilterMode(mode);
    localStorage.setItem(DAV_NEARBY_FILTER_MODE_KEY_LOCAL, mode);
    window.dispatchEvent(new CustomEvent('monviewphone:dav-nearby-filter-mode-changed', { detail: mode }));
  };

  // === Hide settings (Ẩn/Hiển) ===
  const [hidePhone, setHidePhone] = useState(() => localStorage.getItem('monviewphone:dav-hide-phone') === 'true');
  const [hideEmail, setHideEmail] = useState(() => localStorage.getItem('monviewphone:dav-hide-email') === 'true');
  const [hideQR, setHideQR] = useState(() => localStorage.getItem('monviewphone:dav-hide-qr') === 'true');
  const [hideCreatedAt, setHideCreatedAt] = useState(() => localStorage.getItem('monviewphone:dav-hide-created-at') === 'true');
  const [alwaysShowHeader, setAlwaysShowHeader] = useState(() => localStorage.getItem('monviewphone:dav-always-show-header') === 'true');
  const [hideName, setHideName] = useState(() => localStorage.getItem('monviewphone:dav-hide-name') === 'true');
  const [novaSyncing, setNovaSyncing] = useState(false);
  // Ẩn số máy (dav-order) khi Overlay Header mode
  const [headerHideOrder, setHeaderHideOrder] = useState(() => localStorage.getItem('monviewphone:dav-header-hide-order') === 'true');
  // Chế độ nền tối thiểu (chỉ nền sau nội dung) khi Overlay Header
  const [headerMinimalBg, setHeaderMinimalBg] = useState(() => localStorage.getItem('monviewphone:dav-header-minimal-bg') === 'true');

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setHidePhone(localStorage.getItem('monviewphone:dav-hide-phone') === 'true');
      setHideEmail(localStorage.getItem('monviewphone:dav-hide-email') === 'true');
      setHideQR(localStorage.getItem('monviewphone:dav-hide-qr') === 'true');
      setHideCreatedAt(localStorage.getItem('monviewphone:dav-hide-created-at') === 'true');
      setAlwaysShowHeader(localStorage.getItem('monviewphone:dav-always-show-header') === 'true');
      setHeaderHideOrder(localStorage.getItem('monviewphone:dav-header-hide-order') === 'true');
      setHeaderMinimalBg(localStorage.getItem('monviewphone:dav-header-minimal-bg') === 'true');
      setHideName(localStorage.getItem('monviewphone:dav-hide-name') === 'true');
    };
    window.addEventListener('monviewphone:dav-hide-settings-changed', handleSettingsUpdate);
    return () => window.removeEventListener('monviewphone:dav-hide-settings-changed', handleSettingsUpdate);
  }, []);



  const updateHideSetting = (key: string, value: boolean, setter: (val: boolean) => void) => {
    setter(value);
    localStorage.setItem(key, String(value));
    saveBackendSetting(key, String(value));
    window.dispatchEvent(new CustomEvent('monviewphone:dav-hide-settings-changed'));
  };

  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('monviewphone:dav-drag-pos');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const dragStartRef = useRef<{ x: number; y: number; panelX: number; panelY: number } | null>(null);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) {
      return;
    }
    e.preventDefault();
    const panel = target.closest('.dav-floating-panel') as HTMLElement;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panelX: rect.left,
      panelY: rect.top,
    };

    let latestPos = { x: rect.left, y: rect.top };
    document.body.classList.add('is-dragging-modal');

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.x;
      const dy = moveEvent.clientY - dragStartRef.current.y;
      const rawPos = {
        x: dragStartRef.current.panelX + dx,
        y: dragStartRef.current.panelY + dy,
      };
      const newPos = clampDavPanelPosition(rawPos, panel);

      // Update DOM directly
      panel.style.left = `${newPos.x}px`;
      panel.style.top = `${newPos.y}px`;
      latestPos = newPos;
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('is-dragging-modal');

      // Update state and localStorage once at the end
      setDragPos(latestPos);
      localStorage.setItem('monviewphone:dav-drag-pos', JSON.stringify(latestPos));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    if (!panelOpen || !dragPos) return;

    requestAnimationFrame(() => {
      const fixed = clampDavPanelPosition(dragPos, floatingPanelRef.current);
      if (fixed.x !== dragPos.x || fixed.y !== dragPos.y) {
        setDragPos(fixed);
        localStorage.setItem('monviewphone:dav-drag-pos', JSON.stringify(fixed));
      }
    });
  }, [panelOpen, dragPos]);

  useEffect(() => {
    const onResize = () => {
      if (!dragPos) return;
      const fixed = clampDavPanelPosition(dragPos, floatingPanelRef.current);
      setDragPos(fixed);
      localStorage.setItem('monviewphone:dav-drag-pos', JSON.stringify(fixed));
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [dragPos]);

  useEffect(() => {
    if (!platformCtxMenu) return;
    const hide = (e: MouseEvent) => {
      if (platformCtxMenuRef.current && !platformCtxMenuRef.current.contains(e.target as Node)) {
        setPlatformCtxMenu(null);
      }
    };
    window.addEventListener('mousedown', hide, true);
    return () => window.removeEventListener('mousedown', hide, true);
  }, [platformCtxMenu]);

  // Sync vault state when updates occur (one listener for all panels)
  useEffect(() => {
    const handleAccountUpdate = () => {
      setVault(loadDeviceAccountVault());
    };
    window.addEventListener('device-account-updated', handleAccountUpdate);
    return () => window.removeEventListener('device-account-updated', handleAccountUpdate);
  }, []);

  useEffect(() => {
    const handlePlatformsUpdate = () => {
      setPlatforms(getSavedPlatforms());
    };
    window.addEventListener('device-account-platforms-updated', handlePlatformsUpdate);
    return () => window.removeEventListener('device-account-platforms-updated', handlePlatformsUpdate);
  }, []);

  const handleConfirmAddPlatform = () => {
    const name = newPlatformName.trim();
    if (!name) {
      setAddPlatformError('Tên nhóm không được để trống');
      return;
    }
    const id = name.toLowerCase();

    // Check duplicate
    const currentPlatforms = getSavedPlatforms();
    if (currentPlatforms.some(p => p.id === id)) {
      setAddPlatformError('Nhóm này đã tồn tại');
      return;
    }

    const updated = [...currentPlatforms, { id, label: name }];
    saveSavedPlatforms(updated);

    window.dispatchEvent(new Event('device-account-platforms-updated'));
    setActiveTab(id);
    setShowAddPlatformModal(false);
    setNewPlatformName('');
    setAddPlatformError('');
  };

  const handleSyncNovaWechatClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onSyncNovaWechat || novaSyncing) return;
    setNovaSyncing(true);
    try {
      await onSyncNovaWechat(Array.from(connectedUdids), undefined, true);
    } finally {
      setNovaSyncing(false);
    }
  };

  const handleConfirmDeletePlatform = () => {
    if (!pendingDeletePlatform) return;

    const currentPlatforms = getSavedPlatforms();
    const updatedPlatforms = currentPlatforms.filter(p => p.id !== pendingDeletePlatform);
    saveSavedPlatforms(updatedPlatforms);

    const updatedVault = { ...vault };
    for (const udid in updatedVault.devices) {
      const dev = updatedVault.devices[udid];
      if (dev.platforms) {
        delete dev.platforms[pendingDeletePlatform];
      }
      if (dev.selectedAccountByPlatform) {
        delete dev.selectedAccountByPlatform[pendingDeletePlatform];
      }
      if (dev.defaultPlatform === pendingDeletePlatform) {
        dev.defaultPlatform = 'wechat';
      }
    }
    saveDeviceAccountVault(updatedVault);

    window.dispatchEvent(new Event('device-account-platforms-updated'));
    window.dispatchEvent(new Event('device-account-updated'));

    if (activeTab === pendingDeletePlatform) {
      setActiveTab('wechat');
    }

    setPendingDeletePlatform(null);
  };

  // Auto-focus search input when opened
  useEffect(() => {
    if (panelOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);
    }
  }, [panelOpen]);

  // 1. Tính toán statistics
  const { totalAccs, oneYearCount, newMonthCount, dieCount, riskCount, unverifiedCount, incompleteInfoCount } = useMemo(() => {
    let total = 0;
    let oneYear = 0;
    let newMonth = 0;
    let die = 0;
    let risk = 0;
    let unverified = 0;
    let incomplete = 0;

    const oneYearMs = 365 * 24 * 60 * 60 * 1000;

    for (const udid of registeredUdids) {
      const d = getDeviceAccountDataFromVault(vault, udid);
      const accounts = d.platforms[activeTab] || [];
      total += accounts.length;
      for (const acc of accounts) {
        if (acc.createdAt) {
          if ((Date.now() - acc.createdAt) >= oneYearMs) {
            oneYear++;
          }
        } else if ((acc as any).isOneYearOld === true) {
          oneYear++;
        }
        if (getWechatNewStatus(acc) === 'New') newMonth++;

        if (acc.status === 'Die') {
          die++;
        }
        if (acc.status === 'Risk') {
          risk++;
        }
        if (acc.status === 'Unverified' || (acc as any).verifyStatus === 'Unverified') {
          unverified++;
        }
        if (!acc.name || !acc.nickname || !acc.phone || !acc.email) {
          incomplete++;
        }
      }
    }

    return {
      totalAccs: total,
      oneYearCount: oneYear,
      newMonthCount: newMonth,
      dieCount: die,
      riskCount: risk,
      unverifiedCount: unverified,
      incompleteInfoCount: incomplete
    };
  }, [registeredUdids, activeTab, vault]);

  const { totalDevices, scanQRCount, hasNoticeCount, nearbyPeopleCount } = useMemo(() => {
    let scanQR = 0;
    let hasNotice = 0;
    let nearbyPeople = 0;

    for (const udid of registeredUdids) {
      const d = getDeviceAccountDataFromVault(vault, udid);
      const accounts = d.platforms[activeTab] || [];

      if (activeTab === 'wechat') {
        const hasQR = accounts.some(acc => {
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
        if (hasQR) scanQR++;

        const hasNearby = activeTab === 'wechat' && hasNearbyRelevantAccount(accounts);
        if (hasNearby) nearbyPeople++;
      }

      const hasN = accounts.some(acc => !!(acc.notice && acc.notice.dueDate));
      if (hasN) hasNotice++;
    }

    return {
      totalDevices: registeredUdids.length,
      scanQRCount: scanQR,
      hasNoticeCount: hasNotice,
      nearbyPeopleCount: nearbyPeople
    };
  }, [registeredUdids, activeTab, vault]);

  const handleDavRunGroupProfiles = React.useCallback(async (group: { name: string; udids: string[]; selectedAccounts?: Record<string, string> }) => {
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

  const handleFilterClick = (filter: string) => {
    setActiveFilter(activeFilter === filter ? 'default' : filter);
  };

  return ReactDOM.createPortal(
    <>
      <div 
        className={`dav-overlay ${panelOpen ? 'is-open' : 'is-hidden'}`}
        data-inspector-id="deviceAccount.overlay"
        data-inspector-label="Device accounts overlay backdrop"
        data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
      >
      <div
        ref={floatingPanelRef}
        className="dav-floating-panel"
        style={dragPos ? { position: 'absolute', left: `${dragPos.x}px`, top: `${dragPos.y}px`, transform: 'none' } : {}}
        data-inspector-id="deviceAccount.panel"
        data-inspector-label="Device accounts floating card panel"
        data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
      >
        <div
          className="dav-floating-header"
          onMouseDown={handleHeaderMouseDown}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragPos(null);
            localStorage.removeItem('monviewphone:dav-drag-pos');
          }}
          data-inspector-id="deviceAccount.header"
          data-inspector-label="Device accounts header drag area"
          data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
        >
          <div className="dav-floating-title-left">
            <span 
              className="dav-floating-title"
              data-inspector-id="deviceAccount.title"
              data-inspector-label="Device accounts overlay title"
              data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
            >
              Quản lý tài khoản
            </span>
 
            <button
              type="button"
              title="Sync trạng thái WeChat xuống Nova cho máy đang online"
              onClick={handleSyncNovaWechatClick}
              disabled={!onSyncNovaWechat || novaSyncing}
              className="dav-sync-nova-btn"
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <RefreshCw size={12} />
              {novaSyncing ? 'Sync...' : 'Sync Nova'}
            </button>

            {/* Thanh tìm kiếm thu nhỏ */}
            <input
              ref={searchInputRef}
              className="account-search-input dav-floating-search"
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.stopPropagation()}
              onKeyUp={e => e.stopPropagation()}
              data-inspector-id="deviceAccount.searchInput"
              data-inspector-label="Device accounts search query input"
              data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
            />
          </div>
 
          <div className="dav-floating-header-actions">
            <div 
              className="dav-floating-platform-select dav-floating-platform-select--header"
              data-inspector-id="deviceAccount.platformTabs"
              data-inspector-label="Platform selection tab container"
              data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
            >
              {platforms.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className={`dav-floating-platform-btn ${activeTab === p.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(p.id)}
                  onContextMenu={(e) => {
                    if (p.id === 'wechat') return;
                    e.preventDefault();
                    e.stopPropagation();
                    setPlatformCtxMenu({
                      x: e.clientX,
                      y: e.clientY,
                      platformId: p.id
                    });
                  }}
                  data-inspector-id={p.id === 'wechat' ? "deviceAccount.wechatTab" : undefined}
                  data-inspector-label={p.id === 'wechat' ? "WeChat platform tab button" : undefined}
                  data-inspector-component={p.id === 'wechat' ? "client/src/components/DeviceAccountOverlay.tsx" : undefined}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                className="dav-floating-platform-btn-add"
                onClick={() => setShowAddPlatformModal(true)}
                title="Thêm nhóm mới"
                data-inspector-id="deviceAccount.addGroupButton"
                data-inspector-label="Add new platform group button"
                data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
              >
                <Plus size={12} />
              </button>
            </div>
 
            {/* btn_dav_settings : Nút cài đặt Quản lý tài khoản */}
            <button
              type="button"
              className="dav-floating-settings-btn"
              title="Cài đặt Quản lý tài khoản"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAccountSettingsModal(true);
              }}
              data-inspector-id="deviceAccount.settingsButton"
              data-inspector-label="Device accounts global settings button"
              data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
            >
              <Settings size={15} />
            </button>
            <button 
              className="dav-floating-close-btn" 
              onClick={onClose}
              data-inspector-id="deviceAccount.closeButton"
              data-inspector-label="Device accounts overlay close button"
              data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
            >
              <X size={16} />
            </button>
          </div>
        </div>
 
        {/* Thanh lọc statistics */}
        <div className="dav-stats-container">
          <div className="dav-stats-row-global">
            <span className="dav-stats-label">Tài khoản:</span>
            <span 
              className="dav-stats-val-total"
              data-inspector-id="deviceAccount.totalAccountsBadge"
              data-inspector-label="Total accounts count badge"
              data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
            >
              {totalAccs}
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'one_year' ? 'active' : ''}`} onClick={() => handleFilterClick('one_year')}>
              TK 1 năm: <strong className="dav-stat-value">{oneYearCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'new_month' ? 'active' : ''}`} onClick={() => handleFilterClick('new_month')}>
              TK mới: <strong className="dav-stat-value">{newMonthCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'die' ? 'active' : ''}`} onClick={() => handleFilterClick('die')}>
              TK Die: <strong className="dav-stat-value danger">{dieCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'risk' ? 'active' : ''}`} onClick={() => handleFilterClick('risk')}>
              TK Risk: <strong className="dav-stat-value risk">{riskCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'unverified' ? 'active' : ''}`} onClick={() => handleFilterClick('unverified')}>
              UnVerify: <strong className="dav-stat-value warning">{unverifiedCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'incomplete_info' ? 'active' : ''}`} onClick={() => handleFilterClick('incomplete_info')}>
              Thiếu Info: <strong className="dav-stat-value">{incompleteInfoCount}</strong>
            </span>
          </div>
 
          <div className="dav-stats-row-global">
            <span className="dav-stats-label">Thiết bị:</span>
            <span className="dav-stats-val-total">{totalDevices}</span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'wechat_scan_qr' ? 'active' : ''}`} onClick={() => handleFilterClick('wechat_scan_qr')}>
              Scan QR: <strong className="dav-stat-value">{scanQRCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'has_notice' ? 'active' : ''}`} onClick={() => handleFilterClick('has_notice')}>
              Thông báo: <strong className="dav-stat-value warning">{hasNoticeCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'nearby_people' ? 'active' : ''}`} onClick={() => handleFilterClick('nearby_people')}>
              Nearby People: <strong className="dav-stat-value nearby">{nearbyPeopleCount}</strong>
            </span>
          </div>
        </div>
 


        {/* Nhóm đã tạo sẵn trong Quản lý tài khoản */}
        <div className="dav-saved-groups-section">
          <div
            className="dav-saved-groups-header-row"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const nextVal = !davGroupsExpanded;
              setDavGroupsExpanded(nextVal);
              localStorage.setItem('monviewphone:dav-groups-expanded', String(nextVal));
            }}
          >
            <div className="dav-saved-groups-title">
              <span>Danh sách nhóm máy</span>
              <span className="dav-saved-groups-badge">{savedGroups.length}</span>
            </div>
            <button type="button" className="dav-saved-groups-toggle-btn">
              {davGroupsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {davGroupsExpanded && (
            <div className="dav-saved-groups-list">
              {savedGroups.length === 0 ? (
                <div className="dav-saved-groups-empty">Không có nhóm nào</div>
              ) : (
                savedGroups.map((group, idx) => {
                  const isExpanded = davExpandedGroupIdx === idx;
                  const groupDevices = group.udids.filter(uid => registeredUdids.includes(uid));
                  const onlineCount = groupDevices.filter(uid => connectedUdids.has(uid)).length;

                  return (
                    <div key={idx} className="dav-saved-group-item">
                      <div className="dav-saved-group-row">
                        <div
                          className="dav-saved-group-info"
                          // select_all_group_devices : Chọn tất cả thiết bị trong nhóm
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (setConnectSelection && connectSelection) {
                              const allSelected = groupDevices.length > 0 && groupDevices.every(uid => connectSelection.has(uid));
                              if (allSelected) {
                                setConnectSelection(new Set());
                              } else {
                                setConnectSelection(new Set(groupDevices));
                              }
                            }
                          }}
                        >
                          <span className="dav-saved-group-name">{group.name}</span>
                          <span className="dav-saved-group-count">
                            ({onlineCount}/{groupDevices.length})
                          </span>
                        </div>
                        <div className="dav-saved-group-actions">
                          <button
                            type="button"
                            className="dav-saved-group-play-btn"
                            title="Chạy WeChat theo Set tài khoản đã chọn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDavRunGroupProfiles(group);
                            }}
                          >
                            <Play size={10} fill="currentColor" /> Chạy Set
                          </button>
                          <button
                            type="button"
                            className={`dav-saved-group-expand-btn ${isExpanded ? 'open' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDavExpandedGroupIdx(isExpanded ? null : idx);
                            }}
                          >
                            <span className="dav-saved-group-expand-icon">▾</span>
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="dav-saved-group-devices">
                          <div className="dav-saved-group-grid">
                            {groupDevices
                              .sort((a, b) => (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0))
                              .map(uid => {
                                const selectedAccountId = group.selectedAccounts?.[uid];
                                const devData = getDeviceAccountData(uid);
                                const accounts = devData?.platforms?.['wechat'] || [];
                                const matchedAccount = selectedAccountId ? accounts.find(a => a.id === selectedAccountId) : null;
                                const accountName = matchedAccount ? (matchedAccount.name || matchedAccount.phone || matchedAccount.nickname || 'Không tên') : null;
                                const isOnline = connectedUdids.has(uid);

                                return (
                                  <div
                                    key={uid}
                                    className={`dav-saved-group-device-cell ${isOnline ? 'online' : 'offline'} ${matchedAccount ? 'has-set' : ''} ${connectSelection?.has(uid) ? 'on' : ''}`}
                                    title={accountName || 'Chưa set tài khoản'}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (setConnectSelection) {
                                        setConnectSelection(prev => {
                                          const next = new Set(prev);
                                          if (next.has(uid)) next.delete(uid);
                                          else next.add(uid);
                                          return next;
                                        });
                                      }
                                    }}
                                    onContextMenu={(e) => {
                                      if (onDeviceContextMenu) {
                                        onDeviceContextMenu(e, uid, idx);
                                      }
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
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>

      {showAddPlatformModal && (
        <ModalLayer level="confirm" isOpen={true} onClose={() => {
          setShowAddPlatformModal(false);
          setNewPlatformName('');
          setAddPlatformError('');
        }}>
          <div className="confirmPanel dav-confirm-panel" onMouseDown={e => e.stopPropagation()}>
            <div className="confirmTitle">Thêm nhóm mới</div>
            <div className="confirmText">
              <label className="modalLabelSmall dav-modal-field-label">Tên nhóm mới</label>
              <input
                type='text'
                className="modalInput"
                placeholder="Nhập tên nhóm mới..."
                value={newPlatformName}
                onChange={e => {
                  setNewPlatformName(e.target.value);
                  setAddPlatformError('');
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleConfirmAddPlatform();
                  if (e.key === 'Escape') {
                    setShowAddPlatformModal(false);
                    setNewPlatformName('');
                    setAddPlatformError('');
                  }
                }}
                autoFocus
              />
              {addPlatformError && (
                <div className="dav-modal-error">
                  {addPlatformError}
                </div>
              )}
            </div>
            <div className="confirmActions">
              <button type='button' className="modalBtn" onClick={() => {
                setShowAddPlatformModal(false);
                setNewPlatformName('');
                setAddPlatformError('');
              }}>Huỷ</button>
              <button
                type='button'
                className="modalBtnPrimary"
                disabled={!newPlatformName.trim()}
                onClick={handleConfirmAddPlatform}
              >
                Xác Nhận
              </button>
            </div>
          </div>
        </ModalLayer>
      )}

      {platformCtxMenu && (
        <ContextMenuLayer
          isOpen={true}
          onClose={() => setPlatformCtxMenu(null)}
          x={platformCtxMenu.x}
          y={platformCtxMenu.y}
          className="dav-ctx-menu contextMenuPanel"
        >
          <button
            type="button"
            className="dav-ctx-item danger"
            onClick={() => {
              setPendingDeletePlatform(platformCtxMenu.platformId);
              setPlatformCtxMenu(null);
            }}
          >
            <Trash2 size={16} /> Xoá Nhóm
          </button>
        </ContextMenuLayer>
      )}

      {/* confirmOverlay--top */}
      <ConfirmDialog
        isOpen={!!pendingDeletePlatform}
        title="Xác nhận xoá nhóm"
        message={`Bạn có chắc chắn muốn xoá nhóm "${platforms.find(p => p.id === pendingDeletePlatform)?.label || pendingDeletePlatform}"? Tất cả tài khoản và dữ liệu thuộc nhóm này sẽ bị xoá vĩnh viễn khỏi toàn bộ thiết bị.`}
        confirmText="Xác Nhận"
        cancelText="Huỷ"
        variant="danger"
        onConfirm={handleConfirmDeletePlatform}
        onClose={() => setPendingDeletePlatform(null)}
      />

      {/* Modal cài đặt Quản lý tài khoản */}
      {showAccountSettingsModal && (
        <ModalLayer level="modal-child" isOpen={true} onClose={() => setShowAccountSettingsModal(false)} showBackdrop={true}>
          <div
            className="confirmPanel dav-settings-panel"
            onMouseDown={e => e.stopPropagation()}
            data-inspector-id="deviceAccount.settingsPanel"
            data-inspector-label="Device accounts overlay global settings modal"
            data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
          >
            <div className="confirmTitle">Cài đặt Quản lý tài khoản</div>

            <div className="dav-settings-section">
              <div className="dav-settings-section-title">Bộ lọc Nearby People</div>

              <div className="dav-settings-row-container">
                {/* btn_dav_settings_priority_sort : Chọn mode sắp xếp ưu tiên Nearby */}
                <button
                  type="button"
                  className={`dav-settings-choice ${nearbyFilterMode === 'priority_sort' ? 'active' : ''}`}
                  onClick={() => updateNearbyFilterMode('priority_sort')}
                  data-inspector-id="deviceAccount.nearbySortButton"
                  data-inspector-label="Nearby people priority sort setting button"
                  data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
                >
                  <strong>Sắp xếp ưu tiên Nearby</strong>
                </button>

                {/* btn_dav_settings_hide_unmatched : Chọn mode ẩn title không liên quan */}
                <button
                  type="button"
                  className={`dav-settings-choice ${nearbyFilterMode === 'hide_unmatched' ? 'active' : ''}`}
                  onClick={() => updateNearbyFilterMode('hide_unmatched')}
                  data-inspector-id="deviceAccount.nearbyFilterButton"
                  data-inspector-label="Nearby people hide unmatched setting button"
                  data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
                >
                  <strong>Ẩn title không liên quan</strong>
                </button>
              </div>
            </div>

            <div className="dav-settings-section">
              <div className="dav-settings-section-title">Ẩn trong Panel</div>

              {/* btn_dav_settings_hide_phone : Bật/Tắt ẩn số điện thoại */}
              <div className="dav-settings-toggle-row">
                <span className="dav-settings-toggle-label">Ẩn SĐT</span>
                <div className="dav-settings-toggle-control">
                  <span className={`dav-settings-toggle-state ${hidePhone ? 'on' : ''}`}>
                    {hidePhone ? 'On' : 'Off'}
                  </span>
                  <button
                    type="button"
                    className={`dav-toggle-switch ${hidePhone ? 'on' : ''}`}
                    onClick={() => updateHideSetting('monviewphone:dav-hide-phone', !hidePhone, setHidePhone)}
                    data-inspector-id="deviceAccount.hidePhoneToggle"
                    data-inspector-label="Hide phone number display toggle"
                    data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
                  >
                    <div className="dav-toggle-knob" />
                  </button>
                </div>
              </div>

              {/* btn_dav_settings_hide_email : Bật/Tắt ẩn Email */}
              <div className="dav-settings-toggle-row">
                <span className="dav-settings-toggle-label">Ẩn Email</span>
                <div className="dav-settings-toggle-control">
                  <span className={`dav-settings-toggle-state ${hideEmail ? 'on' : ''}`}>
                    {hideEmail ? 'On' : 'Off'}
                  </span>
                  <button
                    type="button"
                    className={`dav-toggle-switch ${hideEmail ? 'on' : ''}`}
                    onClick={() => updateHideSetting('monviewphone:dav-hide-email', !hideEmail, setHideEmail)}
                    data-inspector-id="deviceAccount.hideEmailToggle"
                    data-inspector-label="Hide email display toggle"
                    data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
                  >
                    <div className="dav-toggle-knob" />
                  </button>
                </div>
              </div>

              {/* btn_dav_settings_hide_qr : Bật/Tắt ẩn QR */}
              <div className="dav-settings-toggle-row">
                <span className="dav-settings-toggle-label">Ẩn QR</span>
                <div className="dav-settings-toggle-control">
                  <span className={`dav-settings-toggle-state ${hideQR ? 'on' : ''}`}>
                    {hideQR ? 'On' : 'Off'}
                  </span>
                  <button
                    type="button"
                    className={`dav-toggle-switch ${hideQR ? 'on' : ''}`}
                    onClick={() => updateHideSetting('monviewphone:dav-hide-qr', !hideQR, setHideQR)}
                    data-inspector-id="deviceAccount.hideQrToggle"
                    data-inspector-label="Hide QR code display toggle"
                    data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
                  >
                    <div className="dav-toggle-knob" />
                  </button>
                </div>
              </div>

              {/* btn_dav_settings_hide_created_at : Bật/Tắt ẩn Ngày tạo */}
              <div className="dav-settings-toggle-row">
                <span className="dav-settings-toggle-label">Ẩn Ngày Tạo</span>
                <div className="dav-settings-toggle-control">
                  <span className={`dav-settings-toggle-state ${hideCreatedAt ? 'on' : ''}`}>
                    {hideCreatedAt ? 'On' : 'Off'}
                  </span>
                  <button
                    type="button"
                    className={`dav-toggle-switch ${hideCreatedAt ? 'on' : ''}`}
                    onClick={() => updateHideSetting('monviewphone:dav-hide-created-at', !hideCreatedAt, setHideCreatedAt)}
                    data-inspector-id="deviceAccount.hideCreatedDateToggle"
                    data-inspector-label="Hide created date display toggle"
                    data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
                  >
                    <div className="dav-toggle-knob" />
                  </button>
                </div>
              </div>
            </div>

            {/* Section: Overlay Header settings */}
            <div className="dav-settings-section">
              <div className="dav-settings-section-title">Overlay Header</div>
              <div className="dav-settings-help">Áp dụng khi Overlay Header đang bật</div>

              {/* btn_dav_settings_header_hide_order : Ẩn số máy trên header strip */}
              <div className="dav-settings-toggle-row">
                <span className="dav-settings-toggle-label">Ẩn số máy</span>
                <div className="dav-settings-toggle-control">
                  <span className={`dav-settings-toggle-state ${headerHideOrder ? 'on' : ''}`}>
                    {headerHideOrder ? 'On' : 'Off'}
                  </span>
                  <button
                    type="button"
                    className={`dav-toggle-switch ${headerHideOrder ? 'on' : ''}`}
                    onClick={() => {
                      const next = !headerHideOrder;
                      setHeaderHideOrder(next);
                      localStorage.setItem('monviewphone:dav-header-hide-order', String(next));
                      saveBackendSetting('monviewphone:dav-header-hide-order', String(next));
                      window.dispatchEvent(new CustomEvent('monviewphone:dav-hide-settings-changed'));
                    }}
                  >
                    <div className="dav-toggle-knob" />
                  </button>
                </div>
              </div>

              {/* btn_dav_settings_hide_name : Bật/Tắt ẩn tên */}
              <div className="dav-settings-toggle-row dav-settings-toggle-row-spaced">
                <span className="dav-settings-toggle-label">Ẩn tên</span>
                <div className="dav-settings-toggle-control">
                  <span className={`dav-settings-toggle-state ${hideName ? 'on' : ''}`}>
                    {hideName ? 'On' : 'Off'}
                  </span>
                  <button
                    type="button"
                    className={`dav-toggle-switch ${hideName ? 'on' : ''}`}
                    onClick={() => {
                      const next = !hideName;
                      setHideName(next);
                      localStorage.setItem('monviewphone:dav-hide-name', String(next));
                      saveBackendSetting('monviewphone:dav-hide-name', String(next));
                      window.dispatchEvent(new CustomEvent('monviewphone:dav-hide-settings-changed'));
                    }}
                  >
                    <div className="dav-toggle-knob" />
                  </button>
                </div>
              </div>

              {/* btn_dav_settings_header_minimal_bg : Nền tối thiểu - chỉ sau nội dung */}
              <div className="dav-settings-toggle-row dav-settings-toggle-row-spaced">
                <span className="dav-settings-toggle-label">Hiển thị: Nền tối giản</span>
                <div className="dav-settings-toggle-control">
                  <span className={`dav-settings-toggle-state ${headerMinimalBg ? 'on' : ''}`}>
                    {headerMinimalBg ? 'On' : 'Off'}
                  </span>
                  <button
                    type="button"
                    className={`dav-toggle-switch ${headerMinimalBg ? 'on' : ''}`}
                    onClick={() => {
                      const next = !headerMinimalBg;
                      setHeaderMinimalBg(next);
                      localStorage.setItem('monviewphone:dav-header-minimal-bg', String(next));
                      saveBackendSetting('monviewphone:dav-header-minimal-bg', String(next));
                      window.dispatchEvent(new CustomEvent('monviewphone:dav-hide-settings-changed'));
                    }}
                  >
                    <div className="dav-toggle-knob" />
                  </button>
                </div>
              </div>
            </div>

            <div className="confirmActions">
              <button type="button" className="modalBtnPrimary" onClick={() => setShowAccountSettingsModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </ModalLayer>
      )}
</>,
    document.body
  );
}
