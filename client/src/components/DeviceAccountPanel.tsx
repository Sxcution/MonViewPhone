import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Shield, ShieldAlert, Activity, Bell, MapPin, QrCode, Users, Trash2, Briefcase, Folder, History, Layers } from 'lucide-react';
import { OverlayPortal } from '@/components/ui/OverlayPortal';
import { ModalLayer } from '@/components/ui/ModalLayer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ContextMenuLayer } from '@/components/ui/ContextMenuLayer';
import { AnchoredPopover } from '@/components/ui/AnchoredPopover';
import { Tooltip } from '@/components/ui/Tooltip';
import { FloatingTooltip, getFloatingTooltipStyle } from '@/components/ui/FloatingTooltip';
import { getNearbyAccountState, hasNearbyRelevantAccount, hasNearbyEligibleAccount, getNearbyAccountGroupState } from '@/lib/deviceAccountNearby';
import { useServer } from '@/context/ServerContext';
import { listUserProfiles, runAdbCommandApi } from '@/lib/serverApi';
import {
  getDeviceAccountData,
  saveDeviceAccountData,
  saveDeviceAccountDataAsync,
  DeviceAccountData,
  PlatformType,
  Account,
  AccountHistoryAction,
  WeChatAccount,
  createNewAccount,
  getWechatNewStatus,
  getSavedPlatforms,
  WechatLaunchProfile
} from '@/lib/deviceAccountVault';

const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  'Live': 'var(--md-success)',
  'Die': 'var(--md-danger)',
  'Verify': 'var(--md-verify)',
  'Risk': 'var(--md-risk)',
  'Unverified': 'var(--md-muted)'
};

const formatDatePickerMask = (val: string): string => {
  const clean = val.replace(/\D/g, '').slice(0, 8);
  if (clean.length > 4) {
    return `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4)}`;
  }
  if (clean.length > 2) {
    return `${clean.slice(0, 2)}/${clean.slice(2)}`;
  }
  return clean;
};

const parseDateDDMMYYYY = (val: string): number | null => {
  const parts = val.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  const d = new Date(year, month, day);
  if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
    return d.getTime();
  }
  return null;
};

function getAccountDisplayName(account?: Account | null) {
  return account?.name || account?.phone || account?.nickname || 'Không tên';
}

function generateHistoryId() {
  return Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

function getStatusHistoryAction(status?: string): AccountHistoryAction | null {
  if (status === 'Live' || status === 'Die' || status === 'Risk') return status;
  return null;
}

function getRiskNearbyUpdates(now = Date.now()): Partial<Account> {
  const days = 31;
  const dueDate = now + days * 24 * 60 * 60 * 1000;
  return {
    status: 'Risk',
    nearbyPeopleEnabled: false,
    nearbyPeopleDueDate: dueDate,
    notice: {
      title: 'Dưỡng Hiện',
      content: 'Dưỡng Hiện',
      days,
      startDate: now,
      dueDate,
    },
  };
}

function getHistoryActionLabel(action: AccountHistoryAction | string) {
  if (action === 'Open Nearby People') return 'Open Nearby';
  return action;
}

function getHistoryActionClass(action: AccountHistoryAction | string) {
  if (action === 'Live') return 'live';
  if (action === 'Die') return 'die';
  if (action === 'Risk' || action === 'Risk Nearby') return 'risk';
  if (action === 'Open Nearby' || action === 'Open Nearby People') return 'nearby';
  return '';
}

function formatHistoryTimeParts(ts: number) {
  const d = new Date(ts);
  return {
    time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    year: d.getFullYear().toString(),
  };
}

function getRelativeTimeStr(createdAt: number) {
  const diffMs = Date.now() - createdAt;
  if (diffMs < 0) return 'Mới tạo';

  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (totalDays === 0) return 'Hôm nay';

  const years = Math.floor(totalDays / 365);
  const remainingDaysAfterYears = totalDays % 365;
  const months = Math.floor(remainingDaysAfterYears / 30);

  if (years > 0) {
    if (months > 0) {
      return `${years} năm ${months} tháng`;
    }
    return `${years} năm`;
  }

  if (months > 0) {
    const days = totalDays % 30;
    if (days > 0) {
      return `${months} tháng ${days} ngày`;
    }
    return `${months} tháng`;
  }

  return `${totalDays} ngày`;
}

function formatCountdown(diffMs: number): string {
  if (diffMs <= 0) return '0 giờ';
  const hours = Math.ceil(diffMs / (1000 * 60 * 60));
  if (hours < 24) {
    return `${hours} giờ`;
  }
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return `${days} ngày`;
}

const getLocalDateString = (timestamp: number) => {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getCalendarDaysDiff = (ts1: number, ts2: number) => {
  const d1 = new Date(getLocalDateString(ts1));
  const d2 = new Date(getLocalDateString(ts2));
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

const countConsecutiveDays = (startDateStr: string, allDates: string[]) => {
  let count = 0;
  const current = new Date(startDateStr);
  while (true) {
    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    if (allDates.includes(dateStr)) {
      count++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return count;
};

const formatStreakDays = (totalDays: number): string => {
  if (totalDays < 30) {
    return `${totalDays} ngày`;
  }

  const years = Math.floor(totalDays / 365);
  const remDays = totalDays % 365;
  const months = Math.floor(remDays / 30);
  const days = remDays % 30;

  let result = '';
  if (years > 0) {
    result += `${years}N`;
  }
  if (months > 0) {
    result += `${months}T`;
  }
  if (days > 0) {
    result += `${days}n`;
  }
  return result;
};

function getElapsedDaysSince(ts?: number | null): number {
  if (!ts) return 0;
  return Math.max(0, Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24)));
}

function getAccountListNameColor(account: Account): string {
  if (account.status === 'Unverified') return 'var(--md-verify)';

  if (getNearbyAccountState(account) === 'eligible') return 'var(--md-nearby)';

  if (account.status === 'Die') return 'var(--md-danger)';
  if (account.status === 'Risk') return 'var(--md-risk)';

  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  const isOverOneYear = !!(
    account.isOneYearOld ||
    (account.createdAt && Date.now() - account.createdAt >= oneYearMs)
  );

  return isOverOneYear ? 'var(--md-success)' : 'var(--md-text)';
}

function getAppTypeLabel(type?: 'main' | 'clone' | 'secure' | 'shelter' | 'unknown') {
  if (type === 'clone') return 'Clone';
  if (type === 'secure') return 'Secure Folder';
  if (type === 'shelter') return 'Shelter';
  if (type === 'unknown') return 'Unknown';
  return 'Main';
}

function renderAppTypeIcon(type?: 'main' | 'clone' | 'secure' | 'shelter' | 'unknown', isLoggedInToday?: boolean) {
  if (!type || type === 'main' || type === 'unknown') return null;

  const iconColor = isLoggedInToday ? 'var(--md-success)' : 'var(--md-text)';

  if (type === 'shelter') {
    return (
      <span 
        title="Shelter" 
        style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
        data-inspector-id="deviceAccount.accountTypeBadge"
        data-inspector-label="Shelter account type badge"
        data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
      >
        <Briefcase
          size={13}
          color={iconColor}
          style={{ flexShrink: 0, marginRight: '6px' }}
        />
      </span>
    );
  }

  if (type === 'secure') {
    return (
      <span 
        title="Secure Folder" 
        style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
        data-inspector-id="deviceAccount.accountTypeBadge"
        data-inspector-label="Secure folder account type badge"
        data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
      >
        <Folder
          size={13}
          color={iconColor}
          style={{ flexShrink: 0, marginRight: '6px' }}
        />
      </span>
    );
  }

  if (type === 'clone') {
    return (
      <span 
        title="Clone App" 
        style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
        data-inspector-id="deviceAccount.accountTypeBadge"
        data-inspector-label="Clone app account type badge"
        data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, marginRight: '6px' }}
        >
          <circle cx="9" cy="15" r="5" />
          <circle cx="15" cy="9" r="5" />
        </svg>
      </span>
    );
  }

  return null;
}

// --- Render Nearby Icon helper ---
function renderNearbyAccountIcon(account: Account) {
  const state = getNearbyAccountState(account);
  if (state === 'eligible') {
    return (
      <span title="Đủ điều kiện Nearby People" style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, marginLeft: 4 }}>
        <MapPin size={13} color="var(--md-nearby)" />
      </span>
    );
  }

  if (state === 'upcoming') {
    const wc = account as WeChatAccount;
    if (wc.nearbyPeopleDueDate) {
      const diffMs = wc.nearbyPeopleDueDate - Date.now();
      let text = '';
      if (diffMs > 0) {
        if (diffMs >= 24 * 60 * 60 * 1000) {
          const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
          text = `${days} ngày`;
        } else {
          const hours = Math.ceil(diffMs / (60 * 60 * 1000));
          text = `${hours} Giờ`;
        }
      }
      return (
        <span
          title={`Còn ${text} để hiển thị Nearby People`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            flexShrink: 0,
            marginLeft: 4,
            gap: '2px',
            fontSize: '9px',
            color: 'var(--md-risk)',
            fontWeight: 'bold'
          }}
        >
          <MapPin size={13} color="var(--md-risk)" />
          <span>{text}</span>
        </span>
      );
    }
  }

  return null;
}

function renderAccountNoticeIcon(account: Account) {
  if (!account.notice || !account.notice.title) return null;

  const expired = !!(account.notice.dueDate && account.notice.dueDate <= Date.now());

  return (
    <span
      title={expired ? 'Thông báo đã đến hạn' : 'Tài khoản có thông báo'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0,
        marginLeft: 4,
      }}
    >
      <Bell
        size={13}
        color={expired ? 'var(--md-danger)' : 'var(--md-verify)'}
        className={expired ? 'dav-bell-expired' : undefined}
      />
    </span>
  );
}

function renderUnverifiedIcon(account: Account) {
  if (account.status !== 'Unverified') return null;

  return (
    <span
      title="Tài khoản chưa Verify"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0,
        marginLeft: 4,
      }}
    >
      <ShieldAlert size={13} color="var(--md-verify)" />
    </span>
  );
}

function getAppTypeFromProfile(userId: number, name: string): 'main' | 'shelter' | 'clone' | 'secure' | 'unknown' {
  if (userId === 0 || name.toLowerCase().includes('owner')) {
    return 'main';
  }
  const lowerName = name.toLowerCase();
  if (lowerName.includes('work profile') || lowerName.includes('shelter')) {
    return 'shelter';
  }
  if (lowerName.includes('dual_app') || lowerName.includes('dual') || lowerName.includes('clone')) {
    return 'clone';
  }
  if (lowerName.includes('secure folder') || lowerName.includes('secure')) {
    return 'secure';
  }
  return 'unknown';
}

// --- Device Panel Component ---
export const DeviceAccountPanel = React.memo(function DeviceAccountPanel({
  udid,
  order,
  model,
  isOnline,
  orderMap,
  initialData,
  activeTab,
  setActiveTab,
  activeFilter,
  onOpenDeviceViewer,
  showAccountOverlay = false,
  alwaysShowHeader = false,
  search,
  onSyncNovaWechat
}: {
  udid: string;
  order: number;
  model: string;
  isOnline: boolean;
  orderMap: Map<string, number>;
  initialData: DeviceAccountData;
  activeTab: PlatformType;
  setActiveTab: (tab: PlatformType) => void;
  activeFilter?: string;
  onOpenDeviceViewer?: (udid: string) => void;
  showAccountOverlay?: boolean;
  alwaysShowHeader?: boolean;
  search?: string;
  onSyncNovaWechat?: (udids: string[], dataByUdid?: Record<string, DeviceAccountData>, force?: boolean) => Promise<void>;
}) {
  const { wsServer } = useServer();
  const DAV_DEBUG_KEY = 'monviewphone:dav-debug-open-wechat';
  const isDavDebugEnabled = () => localStorage.getItem(DAV_DEBUG_KEY) === 'true';
  const davDebug = (...args: any[]) => { if (isDavDebugEnabled()) console.log('[DAV_OPEN_WECHAT]', ...args); };
  const davWarn = (...args: any[]) => console.warn('[DAV_OPEN_WECHAT]', ...args);

  const [data, setData] = useState(initialData);
  const [platforms, setPlatforms] = useState(() => getSavedPlatforms());

  // States for hiding fields on tile/panel
  const [hidePhone, setHidePhone] = useState(() => localStorage.getItem('monviewphone:dav-hide-phone') === 'true');
  const [hideEmail, setHideEmail] = useState(() => localStorage.getItem('monviewphone:dav-hide-email') === 'true');
  const [hideQR, setHideQR] = useState(() => localStorage.getItem('monviewphone:dav-hide-qr') === 'true');
  const [hideCreatedAt, setHideCreatedAt] = useState(() => localStorage.getItem('monviewphone:dav-hide-created-at') === 'true');
  const [hideName, setHideName] = useState(() => localStorage.getItem('monviewphone:dav-hide-name') === 'true');

  useEffect(() => {
    const handleHideSettingsUpdate = () => {
      setHidePhone(localStorage.getItem('monviewphone:dav-hide-phone') === 'true');
      setHideEmail(localStorage.getItem('monviewphone:dav-hide-email') === 'true');
      setHideQR(localStorage.getItem('monviewphone:dav-hide-qr') === 'true');
      setHideCreatedAt(localStorage.getItem('monviewphone:dav-hide-created-at') === 'true');
      setHideName(localStorage.getItem('monviewphone:dav-hide-name') === 'true');
    };
    window.addEventListener('monviewphone:dav-hide-settings-changed', handleHideSettingsUpdate);
    return () => window.removeEventListener('monviewphone:dav-hide-settings-changed', handleHideSettingsUpdate);
  }, []);

  const [ctxMenu, setCtxMenu] = useState<{ x: number, y: number, accountId: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastDropdownActivateRef = useRef<{ accountId: string; ts: number } | null>(null);
  const dropdownCloseTimeoutRef = useRef<any>(null);
  const [activeLevel1, setActiveLevel1] = useState<'tai_khoan' | 'trang_thai' | 'nearby' | 'quet_qr' | 'phan_loai' | null>(null);
  const [activeLevel2, setActiveLevel2] = useState<string | null>(null);
  const [activeLevel3, setActiveLevel3] = useState<string | null>(null);
  const [activeLevel4, setActiveLevel4] = useState<string | null>(null);

  const handleOpenViewerMiddleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (e.button !== 1) return;
    e.preventDefault();
    e.stopPropagation();
    onOpenDeviceViewer?.(udid);
  };

  const handleOpenViewerAuxClick = (e: React.MouseEvent<HTMLElement>) => {
    if (e.button !== 1) return;
    e.preventDefault();
    e.stopPropagation();
    onOpenDeviceViewer?.(udid);
  };

  // Sync state data when initialData prop changes (synchronized from parent vault update)
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

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

  const currentGroup = useMemo(() => {
    return savedGroups.find(g => g.udids.includes(udid));
  }, [savedGroups, udid]);

  const groupAccounts = useMemo(() => {
    const list: { udid: string; order: number; account: Account }[] = [];
    const gOrder = orderMap?.get(udid) ?? 0;
    const accounts = data.platforms[activeTab] || [];
    for (const acc of accounts) {
      list.push({ udid, order: gOrder, account: acc });
    }
    return list.sort((a, b) => (a.account.name || '').localeCompare(b.account.name || ''));
  }, [udid, activeTab, orderMap, data.platforms, data.updatedAt]);

  const [accountTitleDropdownOpen, setAccountTitleDropdownOpen] = useState(false);
  const accountTitleDropdownRef = useRef<HTMLDivElement>(null);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const platformDropdownRef = useRef<HTMLDivElement>(null);
  const autoOpenedNearbyDropdownRef = useRef(false);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const headerNameDisplayRef = useRef<HTMLDivElement>(null);
  const shieldBtnRef = useRef<HTMLSpanElement>(null);
  const bellBtnRef = useRef<HTMLButtonElement>(null);
  const [dropdownAnchor, setDropdownAnchor] = useState<HTMLElement | null>(null);

  const [bellTooltip, setBellTooltip] = useState<{ x: number; y: number } | null>(null);
  const [hiddenIdentityFields, setHiddenIdentityFields] = useState<Record<string, boolean>>({});
  const [pendingDeleteAccount, setPendingDeleteAccount] = useState<{ id: string; name: string } | null>(null);
  const [historyModalAccountId, setHistoryModalAccountId] = useState<string | null>(null);
  const [pendingResetHistoryAccount, setPendingResetHistoryAccount] = useState<Account | null>(null);
  const [deviceProfiles, setDeviceProfiles] = useState<{ id: number; name: string }[]>([]);
  const [showSetSubmenu, setShowSetSubmenu] = useState(false);
  /* showClassificationSubmenu : State hiển thị submenu phân loại của tài khoản trong dropdown */
  const [showClassificationSubmenu, setShowClassificationSubmenu] = useState(false);
  const [showStatusSubmenu, setShowStatusSubmenu] = useState(false);
  const [showNearbySubmenu, setShowNearbySubmenu] = useState(false);
  const [showQrSubmenu, setShowQrSubmenu] = useState(false);
  const [showAccountSubmenu, setShowAccountSubmenu] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setPlatforms(getSavedPlatforms());
    };
    // Listen to global open/close dropdown events (holding/pressing hotkey)
    // Lắng nghe sự kiện mở/đóng toàn bộ danh sách dropdown (khi đè/nhấn hotkey)
    const handleOpenAll = () => {
      setDropdownAnchor(accountTitleDropdownRef.current);
      setAccountTitleDropdownOpen(true);
    };
    const handleCloseAll = () => {
      setAccountTitleDropdownOpen(false);
    };

    window.addEventListener('device-account-platforms-updated', handleUpdate);
    window.addEventListener('monviewphone:open-all-dropdowns', handleOpenAll);
    window.addEventListener('monviewphone:close-all-dropdowns', handleCloseAll);

    return () => {
      window.removeEventListener('device-account-platforms-updated', handleUpdate);
      window.removeEventListener('monviewphone:open-all-dropdowns', handleOpenAll);
      window.removeEventListener('monviewphone:close-all-dropdowns', handleCloseAll);
      if (dropdownCloseTimeoutRef.current) {
        clearTimeout(dropdownCloseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (accountTitleDropdownOpen && dropdownAnchor) {
      const rect = dropdownAnchor.getBoundingClientRect();
      const dropdownWidth = 220;
      const safetyWidth = 280; // Estimated width for edge-collision check
      let left = rect.left;
      
      // Căn giữa nếu mở từ tên tài khoản hiển thị ở giữa header overlay
      if (dropdownAnchor !== accountTitleDropdownRef.current) {
        left = rect.left + rect.width / 2 - dropdownWidth / 2;
      }

      if (left + safetyWidth > window.innerWidth) {
        left = window.innerWidth - safetyWidth - 10;
      }
      const coords = {
        top: rect.bottom + 4,
        left: Math.max(10, left),
        width: dropdownWidth,
      };
      davDebug('DROPDOWN_COORDS_SET', {
        rect: {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height,
        },
        dropdownCoords: coords,
        window: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
        },
      });
      setDropdownCoords(coords);
    } else {
      davDebug('DROPDOWN_COORDS_CLEAR');
      setDropdownCoords(null);
    }
  }, [accountTitleDropdownOpen, dropdownAnchor]);

  useEffect(() => {
    if (!isDavDebugEnabled()) return;
    const handleGlobalEvent = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const isInDropdown = target.closest('.dav-title-account-dropdown');
      const isInItem = target.closest('.dav-title-account-item');
      const isInHeader = target.closest('.header-name-display-wrapper');
      const isInTotalBadge = target.closest('.dav-total-badge');
      if (!accountTitleDropdownOpen && !isInHeader && !isInTotalBadge) return;
      if (!isInDropdown && !isInItem && !isInHeader && !isInTotalBadge) {
        return;
      }

      const mouseEvent = e as MouseEvent;
      const clientX = mouseEvent.clientX ?? 0;
      const clientY = mouseEvent.clientY ?? 0;
      const elAtPoint = document.elementFromPoint(clientX, clientY) as HTMLElement;
      const elAtPointInfo = elAtPoint ? {
        tagName: elAtPoint.tagName,
        className: elAtPoint.className,
        textContent: elAtPoint.textContent?.slice(0, 30)
      } : null;

      davDebug('GLOBAL_EVENT_CAPTURE', {
        eventType: e.type,
        target: {
          tagName: target.tagName,
          className: target.className,
          textContent: target.textContent?.slice(0, 30),
        },
        button: mouseEvent.button,
        clientX,
        clientY,
        elementFromPoint: elAtPointInfo,
        accountTitleDropdownOpen,
        dropdownCoords,
        activeTab,
        udid,
        showAccountOverlay,
        alwaysShowHeader,
      });
    };

    window.addEventListener('pointerdown', handleGlobalEvent, true);
    window.addEventListener('mousedown', handleGlobalEvent, true);
    window.addEventListener('click', handleGlobalEvent, true);
    return () => {
      window.removeEventListener('pointerdown', handleGlobalEvent, true);
      window.removeEventListener('mousedown', handleGlobalEvent, true);
      window.removeEventListener('click', handleGlobalEvent, true);
    };
  }, [accountTitleDropdownOpen, dropdownCoords, activeTab, udid, showAccountOverlay, alwaysShowHeader]);

  const handleNameClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const activeAccs = data.platforms[activeTab] || [];
    const selAccId = data.selectedAccountByPlatform[activeTab];
    const selAcc = activeAccs.find(a => a.id === selAccId) || activeAccs[0];
    const selectedAccountName = selAcc
      ? (selAcc.name || selAcc.phone || selAcc.nickname || 'Không tên')
      : 'None';
    davDebug('HANDLE_NAME_CLICK_START', {
      selectedAccountId: selAcc?.id,
      selectedAccountName,
      activeTab,
      accountTitleDropdownOpenBefore: accountTitleDropdownOpen,
      accountTitleDropdownOpenAfter: !accountTitleDropdownOpen,
      showAccountOverlay,
      alwaysShowHeader,
    });
    setDropdownAnchor(headerNameDisplayRef.current);
    setAccountTitleDropdownOpen(v => !v);
    setPlatformDropdownOpen(false);
  };

  // Tính toán xem panel này có tài khoản đủ / gần đủ Nearby không
  const panelHasNearbyRelevantAccount = useMemo(() => {
    if (activeTab !== 'wechat') return false;
    return hasNearbyRelevantAccount(groupAccounts.map(x => x.account));
  }, [activeTab, groupAccounts]);

  const panelHasNearbyEligibleAccount = useMemo(() => {
    if (activeTab !== 'wechat') return false;
    return hasNearbyEligibleAccount(groupAccounts.map(x => x.account));
  }, [activeTab, groupAccounts]);

  const panelNearbyAccountState = useMemo(() => {
    if (activeTab !== 'wechat') return 'none';
    return getNearbyAccountGroupState(groupAccounts.map(x => x.account));
  }, [activeTab, groupAccounts]);

  const panelHasNoticeAccount = useMemo(() => {
    if (activeTab !== 'wechat') return false;
    return groupAccounts.some(x => x.account.notice && x.account.notice.title);
  }, [activeTab, groupAccounts]);

  const panelHasScanQrAccount = useMemo(() => {
    if (activeTab !== 'wechat') return false;
    return groupAccounts.some(x => {
      const scanCount = x.account.scanCount || 0;
      const lastScanDate = x.account.lastScanDate;
      const is3Months = x.account.createdAt ? (Date.now() - x.account.createdAt >= 90 * 24 * 60 * 60 * 1000) : (x.account as any).isOneYearOld === true;
      if (!is3Months) return false;
      return scanCount < 3 && (!lastScanDate || Date.now() >= lastScanDate + 30 * 24 * 60 * 60 * 1000);
    });
  }, [activeTab, groupAccounts]);

  const panelHasNewMonthAccount = useMemo(() => {
    if (activeTab !== 'wechat') return false;
    return groupAccounts.some(x => getWechatNewStatus(x.account) === 'New');
  }, [activeTab, groupAccounts]);

  const panelHasUnverifiedAccount = useMemo(() => {
    if (activeTab !== 'wechat') return false;
    return groupAccounts.some(x => x.account.status === 'Unverified' || (x.account as any).verifyStatus === 'Unverified');
  }, [activeTab, groupAccounts]);

  const panelHasIncompleteInfoAccount = useMemo(() => {
    if (activeTab !== 'wechat') return false;
    return groupAccounts.some(x => !x.account.name || !x.account.nickname || !x.account.phone || !x.account.email);
  }, [activeTab, groupAccounts]);

  const panelHasOneYearAccount = useMemo(() => {
    if (activeTab !== 'wechat') return false;
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    return groupAccounts.some(x => {
      if (x.account.createdAt) {
        return (Date.now() - x.account.createdAt) >= oneYearMs;
      }
      return (x.account as any).isOneYearOld === true;
    });
  }, [activeTab, groupAccounts]);

  const panelHasDieAccount = useMemo(() => {
    if (activeTab !== 'wechat') return false;
    return groupAccounts.some(x => x.account.status === 'Die');
  }, [activeTab, groupAccounts]);

  const panelHasRiskAccount = useMemo(() => {
    if (activeTab !== 'wechat') return false;
    return groupAccounts.some(x => x.account.status === 'Risk');
  }, [activeTab, groupAccounts]);

  // Auto-open dropdown khi filter bật
  useEffect(() => {
    let shouldOpen = false;
    if (activeTab === 'wechat' && activeFilter) {
      if (activeFilter === 'nearby_people' && panelHasNearbyRelevantAccount) {
        shouldOpen = true;
      } else if (activeFilter === 'has_notice' && panelHasNoticeAccount) {
        shouldOpen = true;
      } else if (activeFilter === 'wechat_scan_qr' && panelHasScanQrAccount) {
        shouldOpen = true;
      } else if (activeFilter === 'new_month' && panelHasNewMonthAccount) {
        shouldOpen = true;
      } else if (activeFilter === 'unverified' && panelHasUnverifiedAccount) {
        shouldOpen = true;
      } else if (activeFilter === 'incomplete_info' && panelHasIncompleteInfoAccount) {
        shouldOpen = true;
      } else if (activeFilter === 'one_year' && panelHasOneYearAccount) {
        shouldOpen = true;
      } else if (activeFilter === 'die' && panelHasDieAccount) {
        shouldOpen = true;
      } else if (activeFilter === 'risk' && panelHasRiskAccount) {
        shouldOpen = true;
      }
    }

    if (shouldOpen) {
      setDropdownAnchor(accountTitleDropdownRef.current);
      setAccountTitleDropdownOpen(true);
      setPlatformDropdownOpen(false);
      autoOpenedNearbyDropdownRef.current = true;
    } else {
      if (autoOpenedNearbyDropdownRef.current) {
        setAccountTitleDropdownOpen(false);
        autoOpenedNearbyDropdownRef.current = false;
      }
    }
  }, [
    activeFilter, 
    activeTab, 
    panelHasNearbyRelevantAccount, 
    panelHasNoticeAccount, 
    panelHasScanQrAccount, 
    panelHasNewMonthAccount,
    panelHasUnverifiedAccount,
    panelHasIncompleteInfoAccount,
    panelHasOneYearAccount,
    panelHasDieAccount,
    panelHasRiskAccount
  ]);
  const [accountActionMenu, setAccountActionMenu] = useState<{ x: number; y: number; sourceUdid: string; account: Account } | null>(null);
  const [showAddToGroupSubmenu, setShowAddToGroupSubmenu] = useState(false);

  const handleAddDeviceToGroup = (groupIndex: number, udid: string) => {
    const nextGroups = savedGroups.map((g, i) => {
      if (i !== groupIndex) return g;
      const existingSet = new Set(g.udids);
      if (existingSet.has(udid)) return g;
      return { ...g, udids: [...g.udids, udid] };
    });
    localStorage.setItem('savedGroups', JSON.stringify(nextGroups));
    window.dispatchEvent(new Event('saved-groups-updated'));
  };

  const [accountHoverTooltip, setAccountHoverTooltip] = useState<{ x: number; y: number; account: Account } | null>(null);
  const [badgeHoverTooltip, setBadgeHoverTooltip] = useState<{ x: number; y: number } | null>(null);
  const accountActionMenuRef = useRef<HTMLDivElement>(null);
  const moveInputRef = useRef<HTMLInputElement>(null);
  const [moveModal, setMoveModal] = useState<{ sourceUdid: string, account: Account } | null>(null);
  const [targetOrderStr, setTargetOrderStr] = useState('');
  const [moveError, setMoveError] = useState('');
  const [noticeEditModal, setNoticeEditModal] = useState<{ sourceUdid: string, account: Account } | null>(null);
  const [noticeError, setNoticeError] = useState('');

  useEffect(() => {
    if (moveModal) {
      const timer = setTimeout(() => {
        moveInputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [moveModal]);

  useEffect(() => {
    if (accountActionMenu) {
      listUserProfiles(wsServer, accountActionMenu.sourceUdid)
        .then(profiles => {
          setDeviceProfiles(profiles);
        })
        .catch(err => {
          console.error('[DeviceAccountPanel] Failed to load user profiles:', err);
          setDeviceProfiles([{ id: 0, name: 'Owner' }]);
        });
    } else {
      setDeviceProfiles([]);
      setShowSetSubmenu(false);
      setShowClassificationSubmenu(false);
      setShowStatusSubmenu(false);
      setShowNearbySubmenu(false);
      setShowQrSubmenu(false);
      setShowAccountSubmenu(false);
    }
  }, [accountActionMenu, wsServer]);

  useEffect(() => {
    if (!accountTitleDropdownOpen && !platformDropdownOpen) return;
    const hide = (e: MouseEvent) => {
      const target = e.target as Node;
      const matchedDropdownRef = !!accountTitleDropdownRef.current?.contains(target);
      const headerNameWrap = accountTitleDropdownRef.current?.closest('.dav-panel-header')?.querySelector('.dav-header-name-wrapper');
      const matchedHeaderNameWrap = !!headerNameWrap?.contains(target);
      const matchedPlatformDropdownRef = !!platformDropdownRef.current?.contains(target);
      const matchedDropdownClass = !!(target instanceof Element && target.closest('.dav-title-account-dropdown'));
      const shouldKeepOpen = matchedDropdownRef || matchedHeaderNameWrap || matchedPlatformDropdownRef || matchedDropdownClass;

      davDebug('OUTSIDE_CLICK_CAPTURE', {
        target: target instanceof Element ? {
          tagName: target.tagName,
          className: target.className,
          textContent: target.textContent?.slice(0, 30),
        } : null,
        matchedAccountTitleDropdownRef: matchedDropdownRef,
        matchedHeaderNameWrap: matchedHeaderNameWrap,
        matchedPlatformDropdownRef: matchedPlatformDropdownRef,
        matchedTitleAccountDropdown: matchedDropdownClass,
        action: shouldKeepOpen ? 'keep-open' : 'close-dropdown',
      });

      if (shouldKeepOpen) return;

      if (activeFilter && activeFilter !== 'default') {
        // Nếu bộ lọc đang kích hoạt, giữ dropdown luôn mở khi click ra ngoài
        return;
      }

      setAccountTitleDropdownOpen(false);
      setPlatformDropdownOpen(false);
      setDropdownAnchor(null);
    };
    window.addEventListener('mousedown', hide, true);
    return () => window.removeEventListener('mousedown', hide, true);
  }, [accountTitleDropdownOpen, platformDropdownOpen, activeFilter]);

  // Close accountActionMenu on outside click
  useEffect(() => {
    if (!accountActionMenu) return;
    const hide = (e: MouseEvent) => {
      const target = e.target as Node;
      if (accountActionMenuRef.current && accountActionMenuRef.current.contains(target)) {
        return;
      }
      setAccountActionMenu(null);
      setShowSetSubmenu(false);
      setShowClassificationSubmenu(false);
      setShowAddToGroupSubmenu(false);
      setShowStatusSubmenu(false);
      setShowNearbySubmenu(false);
      setShowQrSubmenu(false);
      setShowAccountSubmenu(false);
    };
    window.addEventListener('mousedown', hide, true);
    return () => window.removeEventListener('mousedown', hide, true);
  }, [accountActionMenu]);

  const handleConfirmMove = () => {
    setMoveError('');
    if (!moveModal) return;
    const targetOrder = parseInt(targetOrderStr, 10);
    if (isNaN(targetOrder) || targetOrder <= 0) {
      setMoveError('Vui lòng nhập số máy hợp lệ');
      return;
    }

    let targetUdid = '';
    if (orderMap) {
      for (const [u, o] of orderMap.entries()) {
        if (o === targetOrder) {
          targetUdid = u;
          break;
        }
      }
    }

    if (!targetUdid) {
      setMoveError(`Không tìm thấy máy số ${targetOrder}`);
      return;
    }

    if (targetUdid === moveModal.sourceUdid) {
      setMoveError('Không thể di chuyển tài khoản sang chính nó');
      return;
    }

    const srcData = getDeviceAccountData(moveModal.sourceUdid);
    const tgtData = getDeviceAccountData(targetUdid);

    const accIdx = srcData.platforms[activeTab]?.findIndex(a => a.id === moveModal.account.id);
    if (accIdx === undefined || accIdx === -1) {
      setMoveError('Tài khoản không tồn tại trên máy nguồn');
      return;
    }

    const [accToMove] = srcData.platforms[activeTab].splice(accIdx, 1);

    if (srcData.selectedAccountByPlatform[activeTab] === moveModal.account.id) {
      srcData.selectedAccountByPlatform[activeTab] = srcData.platforms[activeTab][0]?.id || '';
    }

    tgtData.platforms[activeTab] = [...(tgtData.platforms[activeTab] || []), accToMove];
    tgtData.selectedAccountByPlatform[activeTab] = accToMove.id;

    saveDeviceAccountData(moveModal.sourceUdid, srcData);
    saveDeviceAccountData(targetUdid, tgtData);

    const sourceDevOrder = orderMap?.get(moveModal.sourceUdid) ?? 0;

    let srcGrp = savedGroups.find(g => g.udids.includes(moveModal.sourceUdid));
    let tgtGrp = savedGroups.find(g => g.udids.includes(targetUdid));
    let newGroups = [...savedGroups];

    if (!tgtGrp) {
      if (srcGrp) {
        newGroups = savedGroups.map(g => {
          if (g.name === srcGrp.name) {
            return { ...g, udids: [...g.udids, targetUdid] };
          }
          return g;
        });
      } else {
        newGroups.push({
          name: `Nhóm máy ${sourceDevOrder || '01'}`,
          udids: [moveModal.sourceUdid, targetUdid]
        });
      }
      localStorage.setItem('savedGroups', JSON.stringify(newGroups));
      window.dispatchEvent(new Event('saved-groups-updated'));
    }

    window.dispatchEvent(new Event('device-account-updated'));
    setMoveModal(null);
    setTargetOrderStr('');
  };

  // Save when data changes
  const updateData = (newData: typeof data) => {
    setData(newData);
    void saveDeviceAccountDataAsync(udid, newData).then(ok => {
      if (!ok) {
        console.error('[DeviceAccountOverlay] Failed to persist account history to backend/Data.db');
      }
    });
    window.dispatchEvent(new Event('device-account-updated'));
  };

  const activeAccounts = data.platforms[activeTab] || [];
  const selectedAccountId = data.selectedAccountByPlatform[activeTab];
  let selectedAccount = activeAccounts.find(a => a.id === selectedAccountId) || activeAccounts[0];

  if (search && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    const matchedAccount = activeAccounts.find(acc => {
      return (
        (acc.name || '').toLowerCase().includes(q) ||
        (acc.nickname || '').toLowerCase().includes(q) ||
        (acc.phone || '').toLowerCase().includes(q) ||
        (acc.email || '').toLowerCase().includes(q)
      );
    });
    if (matchedAccount) {
      selectedAccount = matchedAccount;
    }
  }
  const selectedAccountIsLoggedInToday = useMemo(() => {
    if (!selectedAccount) return false;
    const loginDates = Array.from(new Set(
      (selectedAccount.history || [])
        .filter(h => h.action === 'Login')
        .map(h => getLocalDateString(h.timestamp))
    ));
    const todayStr = getLocalDateString(Date.now());
    return loginDates.includes(todayStr);
  }, [selectedAccount]);
  const historyModalAccount = historyModalAccountId
    ? activeAccounts.find(a => a.id === historyModalAccountId)
    : null;
  const historyEntries = useMemo(() => {
    if (!historyModalAccount) return [];
    const stored = Array.isArray(historyModalAccount.history) ? historyModalAccount.history : [];
    if (stored.length > 0) {
      return [...stored].sort((a, b) => b.timestamp - a.timestamp);
    }
    const fallbackAction = getStatusHistoryAction(historyModalAccount.status);
    if (!fallbackAction) return [];
    return [{
      id: 'current-status',
      action: fallbackAction,
      timestamp: data.updatedAt || Date.now(),
    }];
  }, [historyModalAccount, data.updatedAt]);

  const getIdentityKey = (field: 'nickname' | 'phone' | 'email') =>
    `${selectedAccount?.id || 'none'}:${field}`;

  const isIdentityHidden = (field: 'nickname' | 'phone' | 'email') =>
    !!hiddenIdentityFields[getIdentityKey(field)];

  const toggleIdentityHidden = (field: 'nickname' | 'phone' | 'email') => {
    if (!selectedAccount) return;
    setHiddenIdentityFields(prev => ({
      ...prev,
      [getIdentityKey(field)]: !prev[getIdentityKey(field)],
    }));
  };

  const isOverOneYear = useMemo(() => {
    if (!selectedAccount) return false;
    if (selectedAccount.isOneYearOld) return true;
    if (!selectedAccount.createdAt) return false;
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    return (Date.now() - selectedAccount.createdAt) >= oneYearMs;
  }, [selectedAccount]);



  const totalAccounts = Object.values(data.platforms).reduce((acc, curr) => acc + curr.length, 0);
  const isWeChat = activeTab === 'wechat';

  // Notice countdown calculation
  const notice = selectedAccount?.notice;
  let noticeStatus: 'none' | 'counting' | 'expired' = 'none';
  let noticeCountdownText = '';

  if (notice && notice.dueDate) {
    const diffMs = notice.dueDate - Date.now();
    if (diffMs <= 0) {
      noticeStatus = 'expired';
    } else {
      noticeStatus = 'counting';
      noticeCountdownText = formatCountdown(diffMs);
    }
  }

  const accountsWithNotices = useMemo(() => {
    return (data.platforms[activeTab] || []).filter(acc => acc.notice && acc.notice.title);
  }, [data.platforms, activeTab]);

  const headerNoticeAccounts = useMemo(() => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return (data.platforms[activeTab] || []).filter(acc => {
      if (!acc.notice || !acc.notice.title || !acc.notice.dueDate) return false;
      const diffMs = acc.notice.dueDate - Date.now();
      return diffMs < sevenDaysMs;
    });
  }, [data.platforms, activeTab]);

  const deviceNoticeStatus = useMemo(() => {
    if (headerNoticeAccounts.length === 0) return 'none';
    const hasExpired = headerNoticeAccounts.some(acc => acc.notice?.dueDate && acc.notice.dueDate <= Date.now());
    return hasExpired ? 'expired' : 'counting';
  }, [headerNoticeAccounts]);

  const noticeTooltipText = useMemo(() => {
    return headerNoticeAccounts.map(acc => {
      const accName = acc.name || acc.phone || acc.nickname || 'Không tên';
      const accNameColor = getAccountListNameColor(acc);
      const title = acc.notice?.title || '';
      if (acc.notice?.dueDate) {
        const diffMs = acc.notice.dueDate - Date.now();
        const timeStr = diffMs <= 0 ? 'đã đến hạn' : formatCountdown(diffMs);
        return (
          <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
            <span style={{ color: accNameColor, fontWeight: 'bold' }}>{accName}</span>
            <span style={{ color: 'var(--md-risk)' }}> : {title} ({timeStr})</span>
          </div>
        );
      }
      return (
        <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
          <span style={{ color: accNameColor, fontWeight: 'bold' }}>{accName}</span>
          <span style={{ color: 'var(--md-risk)' }}> : {title}</span>
        </div>
      );
    });
  }, [headerNoticeAccounts]);

  const handleNoticeIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (headerNoticeAccounts.length === 0) return;

    const expired = headerNoticeAccounts.filter(acc => acc.notice?.dueDate && acc.notice.dueDate <= Date.now());
    const nonExpired = headerNoticeAccounts.filter(acc => !acc.notice?.dueDate || acc.notice.dueDate > Date.now());
    const ordered = [...expired, ...nonExpired];

    if (ordered.length === 0) return;

    const currIdx = ordered.findIndex(acc => acc.id === selectedAccount?.id);
    if (currIdx === -1) {
      handleSetMain(ordered[0].id);
    } else {
      const nextIdx = (currIdx + 1) % ordered.length;
      handleSetMain(ordered[nextIdx].id);
    }
  };

  // QR scan countdown calculation
  let qrCountdownText = '';
  if (isWeChat && selectedAccount?.lastScanDate) {
    const nextScanDate = selectedAccount.lastScanDate + 30 * 24 * 60 * 60 * 1000;
    const diffMs = nextScanDate - Date.now();
    if (diffMs > 0) {
      qrCountdownText = `(${formatCountdown(diffMs)})`;
    }
  }

  const [showNoticeEdit, setShowNoticeEdit] = useState(false);
  const [editNoticeTitle, setEditNoticeTitle] = useState('');
  const [editNoticeDays, setEditNoticeDays] = useState('');
  const [editNoticeTime, setEditNoticeTime] = useState('');
  const [showNameStatusDropdown, setShowNameStatusDropdown] = useState(false);
  const [showDateInput, setShowDateInput] = useState(false);
  const [dateText, setDateText] = useState('');

  // Daily reminder state and clock update
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dismissedReminders, setDismissedReminders] = useState<{ [accountId: string]: string }>(() => {
    try {
      const saved = localStorage.getItem('monviewphone:dismissed-reminders');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const dismissReminder = (accountId: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    const next = { ...dismissedReminders, [accountId]: todayStr };
    setDismissedReminders(next);
    localStorage.setItem('monviewphone:dismissed-reminders', JSON.stringify(next));
  };

  useEffect(() => {
    if (!showAccountOverlay) return;
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, [showAccountOverlay]);

  // activeDailyReminders : Danh sách tài khoản đang đến giờ nhắc nhở hàng ngày
  const activeDailyReminders = useMemo(() => {
    const now = currentTime;
    const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    return accountsWithNotices.filter(acc => {
      const notice = acc.notice;
      if (!notice || !notice.dueDate || notice.dueDate <= Date.now()) return false;
      const reminderTime = (notice as any).dailyReminderTime;
      if (!reminderTime) return false;
      if (nowHHMM < reminderTime) return false;
      if (dismissedReminders[acc.id] === todayStr) return false;
      return true;
    });
  }, [accountsWithNotices, currentTime, dismissedReminders]);

  // Sync edit state when selected account changes
  useEffect(() => {
    if (selectedAccount) {
      setEditNoticeTitle(selectedAccount.notice?.title || '');
      setEditNoticeDays(selectedAccount.notice?.days?.toString() || '');
      setEditNoticeTime((selectedAccount.notice as any)?.dailyReminderTime || '');

      let initialText = '';
      if (selectedAccount.createdAt) {
        const d = new Date(selectedAccount.createdAt);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        initialText = `${day}/${month}/${year}`;
      }
      setDateText(initialText);
    } else {
      setEditNoticeTitle('');
      setEditNoticeDays('');
      setEditNoticeTime('');
      setDateText('');
    }
    setShowNoticeEdit(false);
    setShowNameStatusDropdown(false);
    setShowDateInput(false);
    setNoticeError('');
  }, [selectedAccount]);

  // Close name status dropdown on outside click
  useEffect(() => {
    if (!showNameStatusDropdown) return;
    const hide = (e: MouseEvent) => {
      const target = e.target as Node;
      const panelEl = accountTitleDropdownRef.current?.closest('.dav-panel');
      const wrapper = panelEl?.querySelector('.dav-header-name-wrapper');
      if (wrapper && wrapper.contains(target)) return;
      setShowNameStatusDropdown(false);
    };
    window.addEventListener('mousedown', hide, true);
    return () => window.removeEventListener('mousedown', hide, true);
  }, [showNameStatusDropdown]);

  const handleSaveNotice = () => {
    const daysNum = parseInt(editNoticeDays, 10);
    if (!editNoticeTitle.trim() || isNaN(daysNum) || daysNum <= 0) {
      setNoticeError('Vui lòng nhập đầy đủ nội dung và số ngày hợp lệ (>0).');
      return;
    }
    const startDate = Date.now();
    const dueDate = startDate + daysNum * 24 * 60 * 60 * 1000;

    handleUpdateAccount(selectedAccount.id, {
      notice: {
        title: editNoticeTitle.trim(),
        content: editNoticeTitle.trim(),
        days: daysNum,
        startDate,
        dueDate,
        dailyReminderTime: editNoticeTime || undefined
      } as any
    });
    setNoticeError('');
    setShowNoticeEdit(false);
  };

  const handleClearNotice = () => {
    handleUpdateAccount(selectedAccount.id, { notice: null });
    setEditNoticeTitle('');
    setEditNoticeDays('');
    setEditNoticeTime('');
    setNoticeError('');
    setShowNoticeEdit(false);
  };

  // Actions
  const handleAddAccount = () => {
    const newAcc = createNewAccount(isWeChat);
    const newData = {
      ...data,
      platforms: {
        ...data.platforms,
        [activeTab]: [...(data.platforms[activeTab] || []), newAcc]
      },
      selectedAccountByPlatform: {
        ...data.selectedAccountByPlatform,
        [activeTab]: newAcc.id
      }
    };
    updateData(newData);
  };

  const handleAddAccountWithType = (type: 'main' | 'clone' | 'secure' | 'shelter') => {
    const newAcc = createNewAccount(isWeChat);
    newAcc.appType = type;
    const newData = {
      ...data,
      platforms: {
        ...data.platforms,
        [activeTab]: [...(data.platforms[activeTab] || []), newAcc]
      },
      selectedAccountByPlatform: {
        ...data.selectedAccountByPlatform,
        [activeTab]: newAcc.id
      }
    };
    updateData(newData);
  };

  const handleUpdateAccount = (id: string, updates: Partial<Account>, historyAction?: AccountHistoryAction) => {
    const newData = {
      ...data,
      platforms: {
        ...data.platforms,
        [activeTab]: (data.platforms[activeTab] || []).map(a => {
          if (a.id === id) {
            const updated = { ...a, ...updates };
            const statusHistoryAction = getStatusHistoryAction(updates.status);
            const nextHistoryAction = historyAction || (statusHistoryAction && updates.status !== a.status ? statusHistoryAction : null);
            if (updates.status === 'Die' && a.status !== 'Die') {
              updated.dieAt = Date.now();
            }
            if (updates.status && updates.status !== 'Die') {
              updated.dieAt = null;
            }
            if (updates.status === 'Risk' && a.status !== 'Risk' && updates.notice === undefined) {
              const startDate = Date.now();
              const dueDate = startDate + 30 * 24 * 60 * 60 * 1000;
              updated.notice = {
                title: 'Account Risk',
                content: 'Account Risk',
                days: 30,
                startDate,
                dueDate
              };
            } else if (updates.status && updates.status !== 'Risk' && a.status === 'Risk' && a.notice?.title === 'Account Risk') {
              updated.notice = null;
            }
            if (nextHistoryAction) {
              updated.history = [
                ...(Array.isArray(a.history) ? a.history : []),
                {
                  id: generateHistoryId(),
                  action: nextHistoryAction,
                  timestamp: Date.now(),
                },
              ];
            }
            return updated;
          }
          return a;
        })
      }
    };
    updateData(newData);
    if (
      activeTab === 'wechat' &&
      onSyncNovaWechat &&
      (
        'status' in updates ||
        'createdAt' in updates ||
        'isNew' in updates ||
        'nearbyPeopleEnabled' in updates ||
        'nearbyPeopleDueDate' in updates ||
        'wechatLaunchProfile' in updates
      )
    ) {
      void onSyncNovaWechat([udid], { [udid]: newData }, false);
    }
  };

  const handleDateSubmit = (textVal: string) => {
    if (!selectedAccount) return;
    const trimmed = textVal.trim();
    if (!trimmed) {
      handleUpdateAccount(selectedAccount.id, { createdAt: null });
    } else {
      const ts = parseDateDDMMYYYY(trimmed);
      if (ts !== null) {
        handleUpdateAccount(selectedAccount.id, { createdAt: ts });
      } else {
        let originalText = '';
        if (selectedAccount.createdAt) {
          const d = new Date(selectedAccount.createdAt);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          originalText = `${day}/${month}/${year}`;
        }
        setDateText(originalText);
      }
    }
    setShowDateInput(false);
  };

  const handleDeleteAccount = (id: string) => {
    const nextList = (data.platforms[activeTab] || []).filter(a => a.id !== id);
    const nextSelectedId = data.selectedAccountByPlatform[activeTab] === id
      ? (nextList[0]?.id || '')
      : (data.selectedAccountByPlatform[activeTab] || '');

    const newData = {
      ...data,
      platforms: {
        ...data.platforms,
        [activeTab]: nextList
      },
      selectedAccountByPlatform: {
        ...data.selectedAccountByPlatform,
        [activeTab]: nextSelectedId
      }
    };
    updateData(newData);
    setCtxMenu(null);
  };

  const handleSetMain = (id: string) => {
    const today = Date.now();
    const todayStr = getLocalDateString(today);

    const accountList = data.platforms[activeTab] || [];
    const accFound = accountList.find(a => a.id === id);
    const hasHistoryLoginToday = accFound
      ? (accFound.history || []).some(h => h.action === 'Login' && getLocalDateString(h.timestamp) === todayStr)
      : false;

    davDebug('HANDLE_SET_MAIN_START', {
      id,
      activeTab,
      currentSelectedAccountByPlatform: data.selectedAccountByPlatform,
      accountFound: !!accFound,
      accountName: accFound ? (accFound.name || accFound.phone || accFound.nickname || 'Không tên') : null,
      hasHistoryLoginToday,
    });

    const updatedPlatforms = { ...data.platforms };
    if (updatedPlatforms[activeTab]) {
      updatedPlatforms[activeTab] = updatedPlatforms[activeTab].map(acc => {
        if (acc.id === id) {
          const history = acc.history || [];
          const alreadyLoggedInToday = history.some(
            h => h.action === 'Login' && getLocalDateString(h.timestamp) === todayStr
          );
          if (!alreadyLoggedInToday) {
            return {
              ...acc,
              history: [
                ...history,
                { id: generateHistoryId(), action: 'Login' as AccountHistoryAction, timestamp: today }
              ]
            };
          }
        }
        return acc;
      });
    }

    const newData = {
      ...data,
      platforms: updatedPlatforms,
      selectedAccountByPlatform: {
        ...data.selectedAccountByPlatform,
        [activeTab]: id
      }
    };
    davDebug('HANDLE_SET_MAIN_UPDATE_DATA_CALL', {
      newSelectedAccountByPlatform: newData.selectedAccountByPlatform,
    });
    updateData(newData);
    setCtxMenu(null);
  };

  const openWechatForAccount = (account: Account, sourceUdid: string, reason: string) => {
    const accountName = account.name || account.phone || account.nickname || 'Không tên';
    davDebug('OPEN_WECHAT_START', {
      reason,
      sourceUdid,
      activeTab,
      accountId: account.id,
      accountName,
      appType: account.appType,
      wechatLaunchProfile: account.wechatLaunchProfile,
      wsServer,
    });

    if (activeTab !== 'wechat') {
      console.warn('[DAV_OPEN_WECHAT] OPEN_WECHAT_SKIP_NOT_WECHAT', { activeTab, sourceUdid, reason });
      return;
    }
    const profile = account.wechatLaunchProfile;
    const accountId = account.id;
    if (!profile || typeof profile.userId !== 'number') {
      console.warn('[DAV_OPEN_WECHAT] OPEN_WECHAT_SKIP_NO_PROFILE', { accountId, accountName, sourceUdid, reason });
      return;
    }
    const packageName = profile.packageName || 'com.tencent.mm';
    const activityName = profile.activityName || 'com.tencent.mm.ui.LauncherUI';
    const cmd = `am start --user ${profile.userId} -n ${packageName}/${activityName}`;

    davDebug('OPEN_WECHAT_COMMAND_BUILT', {
      command: cmd,
      userId: profile.userId,
      packageName,
      activityName,
    });

    console.info('[DeviceAccountPanel] Opening WeChat for account');
    runAdbCommandApi(wsServer, sourceUdid, cmd)
      .then(res => {
        davDebug('OPEN_WECHAT_API_RESULT', {
          success: res.success,
          output: res.output,
        });
        if (!res.success) {
          console.warn('[DeviceAccountPanel] Failed to open WeChat via ADB:', res.output);
        }
      })
      .catch(err => {
        console.warn('[DAV_OPEN_WECHAT] OPEN_WECHAT_API_ERROR', err);
      });
  };

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return;
    const hide = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      setCtxMenu(null);
    };
    window.addEventListener('mousedown', hide, true);
    return () => window.removeEventListener('mousedown', hide, true);
  }, [ctxMenu]);

  // Reset submenu states when context menu is closed
  useEffect(() => {
    if (!ctxMenu) {
      setActiveLevel1(null);
      setActiveLevel2(null);
      setActiveLevel3(null);
      setActiveLevel4(null);
    }
  }, [ctxMenu]);

  const getAccountStatusClass = (account: Account) => {
    if (account.status === 'Die') return 'die';
    if (account.status === 'Risk') return 'risk';
    if (account.status === 'Verify' || account.status === 'Unverified') return 'verify';

    if (activeTab === 'wechat') {
      const nearbyState = getNearbyAccountState(account);
      if (nearbyState === 'eligible') return 'nearby';

      const oneYearMs = 365 * 24 * 60 * 60 * 1000;
      const accountIsOverOneYear = !!(
        account.isOneYearOld ||
        (account.createdAt && Date.now() - account.createdAt >= oneYearMs)
      );

      if (accountIsOverOneYear) return 'live';
      return 'under-one-year';
    }

    return 'live';
  };


  const isEligibleNearby = useMemo(() => {
    if (activeTab !== 'wechat') return false;
    return isOverOneYear;
  }, [activeTab, isOverOneYear]);

  const showBlueNearby = useMemo(() => {
    if (activeTab !== 'wechat' || !selectedAccount) return false;
    // Điều kiện bắt buộc: tài khoản phải đủ 1 năm tuổi
    if (!isEligibleNearby) return false;

    if (selectedAccount.nearbyPeopleDueDate) {
      const diffMs = selectedAccount.nearbyPeopleDueDate - Date.now();
      if (diffMs > 0) {
        return false; // Đang đếm ngược -> màu Trắng
      }
      return true; // Đã hết đếm ngược -> màu Xanh dương
    }

    return true; // Đủ 1 năm, chưa bật Nearby -> xanh dương
  }, [selectedAccount, activeTab, isEligibleNearby]);

  const getAccountStatusTooltip = (acc: Account | null) => {
    if (!acc) return undefined;
    if (acc.status === 'Die') {
      if (acc.dieAt) {
        return `Tài khoản đã Die : ${getElapsedDaysSince(acc.dieAt)} Ngày`;
      }
      return 'Tài khoản đã Die';
    }
    if (acc.status === 'Risk') {
      if (acc.notice?.dueDate) {
        const diffMs = acc.notice.dueDate - Date.now();
        const days = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
        return `Tài khoản risk: ${days} Ngày`;
      }
      return 'Tài khoản risk';
    }
    if (acc.status === 'Unverified') {
      return 'Tài khoản chưa Verify';
    }
    return undefined;
  };

  const shieldColor = useMemo(() => {
    if (!selectedAccount) return 'var(--md-text)';
    if (selectedAccount.status === 'Unverified') {
      return 'var(--md-verify)'; // Vàng khi tài khoản Unverified
    }
    if (selectedAccount.status === 'Die') {
      return 'var(--md-danger)'; // Đỏ khi tài khoản Die
    }
    if (selectedAccount.status === 'Risk') {
      return 'var(--md-risk)'; // Cam khi tài khoản Risk
    }
    if (showBlueNearby) {
      return 'var(--md-nearby)'; // Xanh dương khi đủ điều kiện Nearby People
    }
    if (!isOverOneYear) {
      return 'var(--md-text)'; // Trắng cho tài khoản dưới 1 năm tuổi
    }
    return ACCOUNT_STATUS_COLORS[selectedAccount.status] || 'var(--md-success)'; // Xanh lá
  }, [selectedAccount, showBlueNearby, isOverOneYear]);

  const nameColor = useMemo(() => {
    if (!selectedAccount) return 'var(--md-text)';
    if (selectedAccount.status === 'Unverified') {
      return 'var(--md-verify)'; // Vàng khi tài khoản Unverified
    }
    if (selectedAccount.status === 'Die') {
      return 'var(--md-danger)'; // Đỏ khi tài khoản Die
    }
    if (selectedAccount.status === 'Risk') {
      return 'var(--md-risk)'; // Cam khi tài khoản Risk
    }
    if (showBlueNearby) {
      return 'var(--md-nearby)'; // Xanh dương khi đủ điều kiện Nearby People
    }
    if (!isOverOneYear) {
      return 'var(--md-text)'; // Trắng cho tài khoản dưới 1 năm tuổi
    }
    return 'var(--md-success)'; // Xanh lá cho tài khoản trên 1 năm tuổi
  }, [selectedAccount, showBlueNearby, isOverOneYear]);

  const handleDropdownAccountActivate = (
    e: React.MouseEvent<HTMLButtonElement>,
    account: Account,
    accUdid: string
  ) => {
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    const isDoubleClick =
      lastDropdownActivateRef.current?.accountId === account.id &&
      now - lastDropdownActivateRef.current.ts < 300;

    const latestAccount =
      (data.platforms[activeTab] || []).find(a => a.id === account.id) || account;

    if (!isDoubleClick) {
      // Single click: update selected account / header display immediately
      // Click đơn: cập nhật tài khoản được chọn / hiển thị header ngay lập tức
      lastDropdownActivateRef.current = { accountId: account.id, ts: now };

      davDebug('ITEM_ACTIVATE_SINGLE_CLICK', {
        accountId: latestAccount.id,
        accUdid,
      });

      handleSetMain(latestAccount.id);

      // Delay closing the dropdown to allow double click detection
      // Trì hoãn đóng dropdown để cho phép phát hiện click đúp
      if (dropdownCloseTimeoutRef.current) {
        clearTimeout(dropdownCloseTimeoutRef.current);
      }
      dropdownCloseTimeoutRef.current = setTimeout(() => {
        setAccountTitleDropdownOpen(false);
        setAccountHoverTooltip(null);
        dropdownCloseTimeoutRef.current = null;
      }, 300);

      return;
    }

    // Double click: clear close timer, close dropdown immediately, and launch WeChat
    // Click đúp: xóa bộ hẹn giờ đóng, đóng dropdown ngay lập tức và mở WeChat
    if (dropdownCloseTimeoutRef.current) {
      clearTimeout(dropdownCloseTimeoutRef.current);
      dropdownCloseTimeoutRef.current = null;
    }

    lastDropdownActivateRef.current = null; // reset to avoid third click double detection

    setAccountTitleDropdownOpen(false);
    setAccountHoverTooltip(null);

    if (showAccountOverlay) {
      davDebug('ITEM_SKIP_OPEN_WECHAT_DEVICE_ACCOUNT_OVERLAY_OPEN', {
        accountId: latestAccount.id,
        accUdid,
        showAccountOverlay,
        alwaysShowHeader,
      });
      return;
    }

    davDebug('ITEM_CALL_OPEN_WECHAT_FROM_DOUBLE_CLICK', {
      accountId: latestAccount.id,
      accUdid,
      wechatLaunchProfile: latestAccount.wechatLaunchProfile,
    });
    openWechatForAccount(latestAccount, accUdid, 'header-dropdown-account-doubleclick');
  };

  const activePlatformLabel = platforms.find(p => p.id === activeTab)?.label || 'WeChat';

  return (
    <div 
      className="dav-panel" 
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
      data-inspector-id="deviceAccount.deviceCard"
      data-inspector-label={`Device account card for device ${order}`}
      data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
    >
      <div 
        className="dav-panel-header"
        data-inspector-id="deviceAccount.deviceHeader"
        data-inspector-label="Device card header area"
        data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
      >
        <div
          className="dav-panel-title-left"
          onMouseDown={handleOpenViewerMiddleClick}
          onAuxClick={handleOpenViewerAuxClick}
        >
          <span 
            className={`dav-order ${panelHasNearbyEligibleAccount ? 'dav-order-nearby-eligible' : ''}`}
            data-inspector-id="deviceAccount.deviceNumber"
            data-inspector-label={`Device order number: ${order}`}
            data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
          >
            {order.toString().padStart(2, '0')}
          </span>
          <div className="dav-title-dropdown-wrap" ref={accountTitleDropdownRef}>
            <button
              type="button"
              data-inspector-id="deviceAccount.totalAccountsBadge"
              data-inspector-label="Total accounts count badge"
              data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
              className={[
                'dav-total-badge',
                panelNearbyAccountState === 'eligible' ? 'nearby-eligible' : '',
                panelNearbyAccountState === 'upcoming' ? 'nearby-upcoming' : '',
              ].filter(Boolean).join(' ')}
              onMouseEnter={(e) => setBadgeHoverTooltip({ x: e.clientX, y: e.clientY })}
              onMouseMove={(e) => setBadgeHoverTooltip({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setBadgeHoverTooltip(null)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                davDebug('TOTAL_BADGE_CLICK_START', {
                  totalAccounts,
                  groupAccountsLength: groupAccounts.length,
                  dropdownCoords,
                  activeTab,
                });
                setDropdownAnchor(accountTitleDropdownRef.current);
                setAccountTitleDropdownOpen(v => !v);
                setPlatformDropdownOpen(false);
              }}
            >
              {totalAccounts}
            </button>
            <AnchoredPopover
              isOpen={accountTitleDropdownOpen}
              onClose={() => setAccountTitleDropdownOpen(false)}
              anchorRef={accountTitleDropdownRef}
              className="dav-title-account-dropdown contextMenuPanel dav-context-layer"
              style={{
                minWidth: `${dropdownCoords?.width || 120}px`,
                width: 'max-content',
                maxWidth: '320px',
                maxHeight: '300px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                padding: '6px',
              }}
            >
              {groupAccounts.length === 0 ? (
                <div className="dav-title-empty">Khong co tai khoan</div>
              ) : (
                groupAccounts.map(({ udid: accUdid, account }) => {
                  const loginDates = Array.from(new Set(
                    (account.history || [])
                      .filter(h => h.action === 'Login')
                      .map(h => getLocalDateString(h.timestamp))
                  ));
                  const todayStr = getLocalDateString(Date.now());
                  const isLoggedInToday = loginDates.includes(todayStr);

                  const isScanQrEligible = activeTab === 'wechat' && (() => {
                    const is3Months = account.createdAt ? (Date.now() - account.createdAt >= 90 * 24 * 60 * 60 * 1000) : (account as any).isOneYearOld === true;
                    if (!is3Months) return false;
                    const scanCount = account.scanCount || 0;
                    if (scanCount >= 3) return false;
                    if (account.lastScanDate) {
                      const nextScan = account.lastScanDate + 30 * 24 * 60 * 60 * 1000;
                      if (nextScan > Date.now()) return false;
                    }
                    return true;
                  })();

                  const buildItemData = (accObj: Account) => ({
                    accUdid,
                    accountId: accObj.id,
                    name: accObj.name,
                    phone: accObj.phone,
                    nickname: accObj.nickname,
                    activeTab,
                    hasWechatLaunchProfile: !!accObj.wechatLaunchProfile,
                    wechatLaunchProfile: accObj.wechatLaunchProfile,
                    appType: accObj.appType,
                    selectedAccountId: selectedAccount?.id,
                    groupAccountsLength: groupAccounts.length,
                  });

                  return (
                    <button
                      key={account.id}
                      type="button"
                      className={`dav-title-account-item ${selectedAccount?.id === account.id ? 'active' : ''}`}
                      onMouseEnter={(e) => setAccountHoverTooltip({ x: e.clientX, y: e.clientY, account })}
                      onMouseMove={(e) => setAccountHoverTooltip({ x: e.clientX, y: e.clientY, account })}
                      onMouseLeave={() => setAccountHoverTooltip(null)}
                      onPointerDown={(e) => {
                        davDebug('ITEM_POINTER_DOWN', buildItemData(account));
                      }}
                      onMouseDown={(e) => {
                        davDebug('ITEM_MOUSE_DOWN', buildItemData(account));

                        if (e.button === 1) {
                          e.preventDefault();
                          e.stopPropagation();
                          onOpenDeviceViewer?.(accUdid);
                          return;
                        }

                        if (e.button === 0) {
                          handleDropdownAccountActivate(e, account, accUdid);
                          return;
                        }
                      }}
                      onAuxClick={(e) => {
                        if (e.button === 1) {
                          e.preventDefault();
                          e.stopPropagation();
                          onOpenDeviceViewer?.(accUdid);
                        }
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        davDebug('ITEM_CLICK_SUPPRESSED_AFTER_MOUSE_DOWN', buildItemData(account));
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAccountActionMenu({ x: e.clientX, y: e.clientY, sourceUdid: accUdid, account });
                      }}
                    >
                      {renderAppTypeIcon(account.appType, isLoggedInToday)}
                      <span
                        className="dav-title-account-name"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          color: getAccountListNameColor(account),
                          fontWeight: selectedAccount?.id === account.id ? 700 : 500,
                        }}
                      >
                        {account.name || account.phone || account.nickname || 'Không tên'}
                        {renderUnverifiedIcon(account)}
                        {renderAccountNoticeIcon(account)}
                        {activeTab === 'wechat' && renderNearbyAccountIcon(account)}
                      </span>
                      {isScanQrEligible && (
                        <span
                          className="dav-scan-qr-badge"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--md-text)',
                            padding: '0',
                            marginLeft: 'auto',
                            flexShrink: 0,
                            marginRight: account.wechatLaunchProfile ? '4px' : '0'
                          }}
                          data-inspector-id="deviceAccount.scanQrBadge"
                          data-inspector-label={`Scan QR eligible badge for User ${account.name}`}
                          data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
                        >
                          <QrCode size={12} />
                        </span>
                      )}
                      {account.wechatLaunchProfile && (
                        <span
                          style={{
                            fontSize: '8px',
                            background: 'color-mix(in srgb, var(--md-success) 20%, transparent)',
                            color: 'var(--md-success)',
                            padding: '1px 4px',
                            borderRadius: '4px',
                            marginLeft: isScanQrEligible ? '0' : 'auto',
                            fontWeight: 'bold',
                            flexShrink: 0
                          }}
                          data-inspector-id="deviceAccount.launchProfileBadge"
                          data-inspector-label={`Launch profile badge for User ${account.wechatLaunchProfile.userId}`}
                          data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
                        >
                          U{account.wechatLaunchProfile.userId}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </AnchoredPopover>
          </div>
        </div>

        {selectedAccount && (
          <div className="dav-header-name-wrapper">
            {showAccountOverlay && (
              <span
                ref={shieldBtnRef}
                title={getAccountStatusTooltip(selectedAccount)}
                style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
              >
                <Shield
                  size={12}
                  color={shieldColor}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNameStatusDropdown(!showNameStatusDropdown);
                  }}
                />
              </span>
            )}
            <div
              className="header-name-display-wrapper"
              ref={headerNameDisplayRef}
              onClick={handleNameClick}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setAccountActionMenu({ x: e.clientX, y: e.clientY, sourceUdid: udid, account: selectedAccount });
              }}
              onMouseEnter={(e) => setAccountHoverTooltip({ x: e.clientX, y: e.clientY, account: selectedAccount })}
              onMouseMove={(e) => setAccountHoverTooltip({ x: e.clientX, y: e.clientY, account: selectedAccount })}
              onMouseLeave={() => setAccountHoverTooltip(null)}
            >
              {!hideName && (
                <span
                  className="header-name-display"
                  style={{ color: nameColor, fontWeight: 'bold' }}
                >
                  {selectedAccount.name || 'Tên tài khoản'}
                </span>
              )}
              {activeTab === 'wechat' && renderNearbyAccountIcon(selectedAccount)}
            </div>

            <AnchoredPopover
              isOpen={showNameStatusDropdown}
              onClose={() => setShowNameStatusDropdown(false)}
              anchorRef={shieldBtnRef}
              className="uiMenuSurface dav-name-status-dropdown dav-context-layer"
            >
              {selectedAccount.status !== 'Die' && selectedAccount.status !== 'Risk' ? (
                <>
                  <button
                    type="button"
                    className="uiMenuItem dav-name-status-option danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateAccount(selectedAccount.id, { status: 'Die' });
                      setShowNameStatusDropdown(false);
                    }}
                    data-inspector-id="deviceAccount.setDieAction"
                    data-inspector-label="Set account status to Die"
                    data-inspector-component="client/src/components/DeviceAccountPanel.tsx"
                  >
                    Set Die
                  </button>
                  <button
                    type="button"
                    className="uiMenuItem dav-name-status-option risk"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateAccount(selectedAccount.id, { status: 'Risk' });
                      setShowNameStatusDropdown(false);
                    }}
                    data-inspector-id="deviceAccount.setRiskAction"
                    data-inspector-label="Set account status to Risk"
                    data-inspector-component="client/src/components/DeviceAccountPanel.tsx"
                  >
                    Set Risk
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="uiMenuItem dav-name-status-option success"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateAccount(selectedAccount.id, { status: 'Live' });
                    setShowNameStatusDropdown(false);
                  }}
                  data-inspector-id="deviceAccount.setLiveAction"
                  data-inspector-label="Set account status to Live"
                  data-inspector-component="client/src/components/DeviceAccountPanel.tsx"
                >
                  Set Live
                </button>
              )}
            </AnchoredPopover>
          </div>
        )}

        <div className="dav-panel-title-right" style={{ position: 'relative' }}>
          {deviceNoticeStatus !== 'none' && (
            <>
              <button
                ref={bellBtnRef}
                type="button"
                data-inspector-id="deviceAccount.noticeBadge"
                data-inspector-label="Notice warning badge"
                data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
                className="dav-bell-btn"
                onMouseEnter={(e) => setBellTooltip({ x: e.clientX, y: e.clientY })}
                onMouseMove={(e) => setBellTooltip({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setBellTooltip(null)}
                onClick={handleNoticeIconClick}
              >
                <Bell
                  size={20}
                  color={deviceNoticeStatus === 'expired' ? 'var(--md-danger)' : 'var(--md-verify)'}
                  className={deviceNoticeStatus === 'expired' ? "dav-bell-expired animate-pulse" : ""}
                />
              </button>
              {bellTooltip && noticeTooltipText && noticeTooltipText.length > 0 && (
                <FloatingTooltip
                  isOpen={true}
                  onClose={() => setBellTooltip(null)}
                  x={bellTooltip.x}
                  y={bellTooltip.y}
                  style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
                >
                  {noticeTooltipText}
                </FloatingTooltip>
              )}
            </>
          )}
          {/* dav-daily-reminder-tooltip : Tooltip nhắc nhở hàng ngày */}
          {activeDailyReminders.length > 0 && (
            <AnchoredPopover
              isOpen={true}
              onClose={() => activeDailyReminders.forEach(acc => dismissReminder(acc.id))}
              anchorRef={bellBtnRef}
              closeOnOutsideClick={false}
              closeOnEscape={false}
              className="dav-daily-reminder-tooltip"
            >
              {activeDailyReminders.map(acc => {
                const accName = acc.name || acc.phone || acc.nickname || 'Không tên';
                const accNameColor = getAccountListNameColor(acc);
                return (
                  <div key={acc.id} className="dav-daily-reminder-row">
                    <span className="dav-daily-reminder-name" style={{ color: accNameColor }}>{accName}</span>
                    <span className="dav-daily-reminder-text">: {acc.notice?.title || ''}</span>
                  </div>
                );
              })}
              <button
                type="button"
                className="dav-daily-reminder-close"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  activeDailyReminders.forEach(acc => dismissReminder(acc.id));
                }}
                data-inspector-id="deviceAccount.dailyReminderCloseButton"
                data-inspector-label="Daily reminder tooltip close button"
                data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
              >
                Đóng
              </button>
            </AnchoredPopover>
          )}
          {accountHoverTooltip && (() => {
                const acc = accountHoverTooltip.account;
                const loginHistory = (acc.history || []).filter(h => h.action === 'Login');

                let line1 = '';
                if (loginHistory.length === 0) {
                  line1 = 'Offline: Chưa từng đăng nhập';
                } else {
                  const lastLoginTs = Math.max(...loginHistory.map(h => h.timestamp));
                  const diffDays = getCalendarDaysDiff(lastLoginTs, Date.now());

                  const lastLoginDate = new Date(lastLoginTs);
                  const day = String(lastLoginDate.getDate()).padStart(2, '0');
                  const month = String(lastLoginDate.getMonth() + 1).padStart(2, '0');
                  const year = lastLoginDate.getFullYear();
                  const currentYear = new Date().getFullYear();
                  const formattedLastLogin = year === currentYear ? `${day}/${month}` : `${day}/${month}/${year}`;

                  const todayStr = getLocalDateString(Date.now());
                  const yesterdayStr = getLocalDateString(Date.now() - 24 * 60 * 60 * 1000);
                  const loginDates = Array.from(new Set(
                    loginHistory.map(h => getLocalDateString(h.timestamp))
                  )).sort();

                  if (diffDays === 0) {
                    const streak = countConsecutiveDays(todayStr, loginDates);
                    line1 = `Online ngày thứ ${streak} (${formattedLastLogin})`;
                  } else if (diffDays === 1) {
                    const streak = countConsecutiveDays(yesterdayStr, loginDates);
                    line1 = `Online ngày thứ ${streak} (Gần nhất: ${formattedLastLogin})`;
                  } else {
                    line1 = `Bỏ ${diffDays} ngày (Gần nhất: ${formattedLastLogin})`;
                  }
                }

                const details: React.ReactNode[] = [];
                const createdAtStr = acc.createdAt ? getRelativeTimeStr(acc.createdAt) : null;
                if (createdAtStr) {
                  details.push(
                    <span key="created" style={{ color: 'var(--md-text)' }}>
                      Mới tạo: {createdAtStr}
                    </span>
                  );
                }

                if (acc.notice?.title) {
                  const title = acc.notice.title;
                  if (acc.notice.dueDate) {
                    const diffMs = acc.notice.dueDate - Date.now();
                    const days = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
                    if (acc.status === 'Risk') {
                      details.push(
                        <span key="notice" style={{ color: 'var(--md-risk)' }}>
                          Dưỡng Hiện: Còn {days} ngày nữa đủ điều kiện Mở Hiện
                        </span>
                      );
                    } else {
                      details.push(
                        <span key="notice" style={{ color: 'var(--md-risk)' }}>
                          Thông báo: {title} (Còn {days} ngày)
                        </span>
                      );
                    }
                  } else {
                    details.push(
                      <span key="notice" style={{ color: 'var(--md-risk)' }}>
                        Thông báo: {title}
                      </span>
                    );
                  }
                }

                const accName = acc.name || acc.phone || acc.nickname || 'Không tên';
                const nameColor = getAccountListNameColor(acc);

                return (
                  <FloatingTooltip
                    isOpen={true}
                    onClose={() => setAccountHoverTooltip(null)}
                    x={accountHoverTooltip.x}
                    y={accountHoverTooltip.y}
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    <div style={{ color: nameColor, fontWeight: 'bold', marginBottom: '4px' }}>
                      {accName}
                    </div>
                    <div>{line1}</div>
                    {details.map((detail, idx) => (
                      <div key={idx} style={{ marginTop: '2px' }}>{detail}</div>
                    ))}
                  </FloatingTooltip>
                );
              })()}
              {badgeHoverTooltip && (() => {
                const tooltipRows = groupAccounts.map(({ account }) => {
                  const name = account.name || account.phone || account.nickname || 'Không tên';
                  const nameColor = getAccountListNameColor(account);

                  if (account.status === 'Die') {
                    return (
                      <div key={account.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                        <span style={{ color: nameColor, fontWeight: 'bold' }}>{name}</span>
                        <span>: Die</span>
                      </div>
                    );
                  }

                  if (account.status === 'Risk') {
                    let riskText = 'Risk';
                    if (account.notice?.dueDate) {
                      const diffMs = account.notice.dueDate - Date.now();
                      const days = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
                      riskText = `${days} ngày`;
                    }
                    return (
                      <div key={account.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                        <span style={{ color: nameColor, fontWeight: 'bold' }}>{name}</span>
                        <span style={{ color: 'var(--md-risk)' }}>: {riskText}</span>
                      </div>
                    );
                  }

                  const parts: string[] = [];

                  if (activeTab === 'wechat') {
                    const nbState = getNearbyAccountState(account);
                    if (nbState === 'eligible') {
                      parts.push('📍 Đủ điều kiện');
                    } else if (nbState === 'upcoming' && account.nearbyPeopleDueDate) {
                      const diffMs = account.nearbyPeopleDueDate - Date.now();
                      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                      parts.push(`📍 ${days} ngày`);
                    }
                  }

                  const isLiveReady = account.status === 'Live';
                  const getIsOverOneYear = (acc: Account) => {
                    if (acc.isOneYearOld) return true;
                    if (!acc.createdAt) return false;
                    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
                    return (Date.now() - acc.createdAt) >= oneYearMs;
                  };
                  const isUnderOneYear = !getIsOverOneYear(account);
                  const belongsToAnyGroup = savedGroups.some(g => {
                    if (!g.selectedAccounts) return false;
                    return Object.values(g.selectedAccounts).includes(account.id);
                  });

                  if (isLiveReady && isUnderOneYear && belongsToAnyGroup) {
                    const matchedGroups = savedGroups.filter(g => g.selectedAccounts?.[udid] === account.id);
                    if (matchedGroups.length > 0) {
                      parts.push(matchedGroups.map(g => g.name).join(', '));
                    } else {
                      parts.push('Ready');
                    }
                  }

                  const detailsText = parts.join(' - ');
                  return (
                    <div key={account.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                      <span style={{ color: nameColor, fontWeight: 'bold' }}>{name}</span>
                      {detailsText && <span>: {detailsText}</span>}
                    </div>
                  );
                });

                return (
                  <FloatingTooltip
                    isOpen={true}
                    onClose={() => setBadgeHoverTooltip(null)}
                    x={badgeHoverTooltip.x}
                    y={badgeHoverTooltip.y}
                  >
                    {tooltipRows.length > 0 ? tooltipRows : 'Tổng số tài khoản trên điện thoại này'}
                  </FloatingTooltip>
                );
              })()}
        </div>
      </div>
      {showAccountOverlay && (
        <div className="dav-panel-body">
        {!selectedAccount ? (
          <div className="dav-empty-state">
            <p>Chưa có tài khoản {platforms.find(p => p.id === activeTab)?.label || 'WeChat'}</p>
            <button className="dav-btn primary" onClick={handleAddAccount}>
              <Plus size={14} /> Thêm tài khoản
            </button>
          </div>
        ) : showNoticeEdit ? (
          <div className="dav-notice-edit-form" onContextMenu={e => e.stopPropagation()}>
            <div className="dav-edit-header" style={{ display: 'flex', alignItems: 'center', width: '100%', borderBottom: '1px solid var(--md-border)', paddingBottom: '6px', marginBottom: '8px', justifyContent: 'flex-start' }}>
              <span style={{ fontWeight: 'bold', fontSize: '11px', color: 'var(--md-text)' }}>
                Cài đặt thông báo: <span style={{ fontWeight: 'bold', color: 'var(--md-text)' }}>{selectedAccount.name || selectedAccount.phone || selectedAccount.nickname || 'Không tên'}</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--md-text)', fontWeight: 'bold', textAlign: 'left' }}>Nội dung</span>
                <input
                  className="dav-input dav-form-input"
                  placeholder="( Vui lòng nhập )"
                  value={editNoticeTitle}
                  onChange={e => {
                    setEditNoticeTitle(e.target.value);
                    setNoticeError('');
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--md-text)', fontWeight: 'bold', textAlign: 'left' }}>Số ngày đếm ngược</span>
                  <input
                    type="number"
                    className="dav-input dav-form-input"
                    placeholder="Số ngày"
                    value={editNoticeDays}
                    onChange={e => {
                      setEditNoticeDays(e.target.value);
                      setNoticeError('');
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--md-text)', fontWeight: 'bold', textAlign: 'left' }}>Nhắc nhở hàng ngày</span>
                  <input
                    type="time"
                    lang="vi-VN"
                    step="60"
                    className="dav-input dav-form-input"
                    value={editNoticeTime}
                    onChange={e => {
                      setEditNoticeTime(e.target.value);
                      setNoticeError('');
                    }}
                  />
                </div>
              </div>
            </div>

            {noticeError && (
              <div style={{ fontSize: '11px', color: 'var(--md-danger)', textAlign: 'center', marginTop: '8px' }}>
                {noticeError}
              </div>
            )}

            <div className="dav-edit-actions">
              <button
                className="dav-edit-btn cancel dav-edit-btn-muted"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowNoticeEdit(false);
                  setNoticeError('');
                }}
              >
                Hủy
              </button>
              <button className="dav-edit-btn save" onClick={handleSaveNotice}>Xác Nhận</button>
              {selectedAccount.notice && (
                <button className="dav-edit-btn clear" onClick={handleClearNotice}>Xóa</button>
              )}
            </div>
          </div>
        ) : (
          <div className="dav-account-card" onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCtxMenu({ x: e.clientX, y: e.clientY, accountId: selectedAccount.id });
          }}>
            {/* Tên tài khoản */}
            <div 
              className="dav-input-wrapper" 
              data-inspector-id="deviceAccount.accountNameDisplay"
              data-inspector-label="Account name display container"
              data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
            >
              <input
                className="dav-transparent-input"
                style={{ color: 'var(--md-text)', fontWeight: 'bold' }}
                placeholder="Tên tài khoản"
                value={selectedAccount.name || ''}
                onChange={e => handleUpdateAccount(selectedAccount.id, { name: e.target.value })}
                data-inspector-id="deviceAccount.accountNameInput"
                data-inspector-label="Account name text input"
                data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
              />
            </div>

            {/* Biệt danh (Nickname) */}
            <div className="dav-input-wrapper">
              <input
                className="dav-transparent-input"
                style={{ color: 'var(--md-text)' }}
                placeholder="Biệt danh"
                readOnly={isIdentityHidden('nickname')}
                value={
                  isIdentityHidden('nickname') && selectedAccount.nickname
                    ? '••••••'
                    : selectedAccount.nickname || ''
                }
                onChange={e => {
                  if (isIdentityHidden('nickname')) return;
                  handleUpdateAccount(selectedAccount.id, { nickname: e.target.value });
                }}
              />
            </div>

            {/* Số điện thoại */}
            {!hidePhone && (
              <div className="dav-input-wrapper">
                <input
                  className="dav-transparent-input"
                  placeholder="Số điện thoại"
                  readOnly={isIdentityHidden('phone')}
                  value={
                    isIdentityHidden('phone') && selectedAccount.phone
                      ? '••••••'
                      : selectedAccount.phone || ''
                  }
                  onChange={e => {
                    if (isIdentityHidden('phone')) return;
                    handleUpdateAccount(selectedAccount.id, { phone: e.target.value });
                  }}
                  data-inspector-id="deviceAccount.phoneInput"
                  data-inspector-label="Account phone number text input"
                  data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
                />
              </div>
            )}

            {/* Email */}
            {!hideEmail && (
              <div className="dav-input-wrapper">
                <input
                  className="dav-transparent-input"
                  placeholder="Địa chỉ Email"
                  readOnly={isIdentityHidden('email')}
                  value={
                    isIdentityHidden('email') && selectedAccount.email
                      ? '••••••'
                      : selectedAccount.email || ''
                  }
                  onChange={e => {
                    if (isIdentityHidden('email')) return;
                    handleUpdateAccount(selectedAccount.id, { email: e.target.value });
                  }}
                  data-inspector-id="deviceAccount.emailInput"
                  data-inspector-label="Account email text input"
                  data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
                />
              </div>
            )}

            {/* Hàng QR Code & Nearby People */}
            {(() => {
              const showNearby = (() => {
                if (!isWeChat || !selectedAccount) return false;
                if (!isEligibleNearby) return false;
                const diffMs = selectedAccount.nearbyPeopleDueDate
                  ? selectedAccount.nearbyPeopleDueDate - Date.now()
                  : 0;
                if (selectedAccount.nearbyPeopleDueDate && diffMs > 7 * 24 * 60 * 60 * 1000) {
                  return false;
                }
                return true;
              })();

              const showRow = !hideQR || showNearby;
              if (!showRow) return null;

              return (
                <div 
                  className="dav-stats-row"
                  data-inspector-id="deviceAccount.qrCodeRow"
                  data-inspector-label="WeChat QR Code and Nearby People countdown row"
                  data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
                >
                  {!hideQR ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <QrCode size={13} color="var(--md-text)" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 'bold', color: (selectedAccount.scanCount || 0) >= 3 ? 'var(--md-danger)' : 'var(--md-text)' }}>
                        {selectedAccount.scanCount || 0}/3
                      </span>
                      {qrCountdownText && (
                        <span style={{ color: 'var(--md-verify)', fontSize: '10px' }}>
                          {qrCountdownText}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div />
                  )}

                  {showNearby && (() => {
                    const diffMs = selectedAccount.nearbyPeopleDueDate
                      ? selectedAccount.nearbyPeopleDueDate - Date.now()
                      : 0;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {selectedAccount.nearbyPeopleDueDate && diffMs > 0 ? (
                          <>
                            <MapPin size={13} color="var(--md-verify)" style={{ flexShrink: 0 }} />
                            <span style={{ color: 'var(--md-verify)', fontSize: '11px', fontWeight: '500' }}>
                              {formatCountdown(diffMs)}
                            </span>
                          </>
                        ) : (
                          <>
                            <MapPin size={13} color="var(--md-success)" style={{ flexShrink: 0 }} />
                            <span style={{ color: 'var(--md-success)', fontSize: '11px', fontWeight: '500' }}>
                              Active
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {/* Thông báo */}
            <div className="dav-notice-centered-row" onClick={() => setShowNoticeEdit(true)}>
              {noticeStatus === 'none' ? (
                <span className="muted" style={{ color: 'var(--md-muted)', fontStyle: 'italic', fontSize: '11px' }}>Chưa đặt thông báo</span>
              ) : (
                <span style={{ color: noticeStatus === 'expired' ? 'var(--md-danger)' : 'var(--md-verify)', fontWeight: noticeStatus === 'expired' ? 'bold' : '500' }}>
                  {selectedAccount.notice?.title} {noticeStatus === 'expired' ? ': đã đến hạn' : `: ${noticeCountdownText}`}
                </span>
              )}
            </div>

            {/* input_created_at : Nhập ngày tạo tài khoản */}
            {!hideCreatedAt && (
              <div 
                className="dav-centered-row"
                style={{ cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none' }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  window.getSelection()?.removeAllRanges();
                  setShowDateInput(true);
                }}
                data-inspector-id="deviceAccount.createdDateRow"
                data-inspector-label="Account created date display/input row"
                data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
              >
                {!selectedAccount.createdAt || showDateInput ? (
                  <input
                    type="text"
                    className="dav-centered-input dav-created-date-input"
                    style={{ fontSize: '10px', width: '90px', padding: 0, color: 'var(--md-text)', textAlign: 'center', border: 'none' }}
                    placeholder="DD/MM/YYYY"
                    value={dateText}
                    onChange={e => setDateText(formatDatePickerMask(e.target.value))}
                    onBlur={e => handleDateSubmit(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleDateSubmit(dateText);
                      if (e.key === 'Escape') {
                        let originalText = '';
                        if (selectedAccount.createdAt) {
                          const d = new Date(selectedAccount.createdAt);
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          originalText = `${day}/${month}/${year}`;
                        }
                        setDateText(originalText);
                        setShowDateInput(false);
                      }
                    }}
                    autoFocus={showDateInput}
                  />
                ) : (
                  <span
                    className="dav-centered-input"
                    style={{ fontSize: '10px', color: isOverOneYear ? 'var(--md-success)' : 'var(--md-text)', cursor: 'pointer' }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setShowDateInput(true);
                    }}
                  >
                    Đã tạo: {getRelativeTimeStr(selectedAccount.createdAt)}
                  </span>
                )}
              </div>
            )}
            {selectedAccount.status === 'Die' && selectedAccount.dieAt ? (
              <div className="dav-centered-row dav-die-age-row">
                <span className="dav-die-age-text">
                  Die: {getElapsedDaysSince(selectedAccount.dieAt)} ngày
                </span>
              </div>
            ) : null}
          </div>
        )}
      </div>
      )}

      {/* Context Menu Portal */}
      <ContextMenuLayer
        isOpen={!!ctxMenu}
        onClose={() => setCtxMenu(null)}
        x={ctxMenu?.x || 0}
        y={ctxMenu?.y || 0}
        className={`dav-ctx-menu contextMenuPanel ${ctxMenu && ctxMenu.x > window.innerWidth - 380 ? 'direction-left' : ''}`}
      >
        <div ref={menuRef}>
          {/* Submenu Tài Khoản */}
          <div
            className="dav-ctx-submenu-container"
            onMouseEnter={() => setActiveLevel1('tai_khoan')}
            onMouseLeave={() => {
              setActiveLevel1(null);
              setActiveLevel2(null);
            }}
          >
            <div className="dav-ctx-item dav-ctx-has-sub">
              <Users size={16} /> Tài Khoản
              <div className={`dav-ctx-submenu ${activeLevel1 === 'tai_khoan' ? 'is-open' : ''}`}>
                {activeAccounts.map(a => {
                  const aLoginDates = Array.from(new Set(
                    (a.history || [])
                      .filter(h => h.action === 'Login')
                      .map(h => getLocalDateString(h.timestamp))
                  ));
                  const todayStr = getLocalDateString(Date.now());
                  const aIsLoggedInToday = aLoginDates.includes(todayStr);

                  return (
                    <div
                      key={a.id}
                      className="dav-ctx-submenu-container"
                      onMouseEnter={() => setActiveLevel3(a.id)}
                      onMouseLeave={() => {
                        setActiveLevel3(null);
                        setActiveLevel4(null);
                      }}
                    >
                      <div className="dav-ctx-item dav-ctx-has-sub" style={{ display: 'flex', alignItems: 'center' }}>
                        {renderAppTypeIcon(a.appType, aIsLoggedInToday)}
                        <span
                          style={{
                            fontWeight: a.id === selectedAccount.id ? 'bold' : 'normal',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            color: getAccountListNameColor(a),
                            width: '100%'
                          }}
                        >
                          {a.name || a.phone || a.nickname || 'Tài khoản'}
                          {renderUnverifiedIcon(a)}
                          {renderAccountNoticeIcon(a)}
                          {activeTab === 'wechat' && renderNearbyAccountIcon(a)}
                        </span>
                      <div className={`dav-ctx-submenu ${activeLevel3 === a.id ? 'is-open' : ''}`}>
                        <button
                          className={`dav-ctx-item ${a.id === selectedAccount.id ? 'active' : ''}`}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSetMain(a.id);
                            setCtxMenu(null);
                          }}
                        >
                          Chọn tài khoản này
                        </button>
                        <div
                          className="dav-ctx-submenu-container"
                          onMouseEnter={() => setActiveLevel4(a.id)}
                          onMouseLeave={() => setActiveLevel4(null)}
                        >
                          <div className="dav-ctx-item dav-ctx-has-sub">
                            Phân loại
                            <div className={`dav-ctx-submenu ${activeLevel4 === a.id ? 'is-open' : ''}`}>
                              {(['main', 'clone', 'secure', 'shelter'] as const).map(type => (
                                <button
                                  key={type}
                                  className={`dav-ctx-item ${a.appType === type ? 'active' : ''}`}
                                  onPointerDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleUpdateAccount(a.id, { appType: type });
                                    setCtxMenu(null);
                                  }}
                                >
                                  {getAppTypeLabel(type)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

                <div className="dav-ctx-divider" />

                <div
                  className="dav-ctx-submenu-container"
                  onMouseEnter={() => setActiveLevel2('them_tai_khoan')}
                  onMouseLeave={() => setActiveLevel2(null)}
                >
                  <div className="dav-ctx-item dav-ctx-has-sub">
                    <Plus size={16} /> Thêm tài khoản
                    <div className={`dav-ctx-submenu ${activeLevel2 === 'them_tai_khoan' ? 'is-open' : ''}`}>
                      {(['main', 'clone', 'secure', 'shelter'] as const).map(type => (
                        <button
                          key={type}
                          className="dav-ctx-item"
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddAccountWithType(type);
                            setCtxMenu(null);
                          }}
                        >
                          Thêm vào {getAppTypeLabel(type)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submenu Phân Loại */}
          <div
            className="dav-ctx-submenu-container"
            onMouseEnter={() => setActiveLevel1('phan_loai')}
            onMouseLeave={() => setActiveLevel1(null)}
          >
            <div className="dav-ctx-item dav-ctx-has-sub">
              <Layers size={16} /> Phân Loại
              <div className={`dav-ctx-submenu ${activeLevel1 === 'phan_loai' ? 'is-open' : ''}`}>
                {(['main', 'clone', 'secure', 'shelter'] as const).map(type => (
                  <button
                    key={type}
                    className={`dav-ctx-item ${selectedAccount.appType === type ? 'active' : ''}`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUpdateAccount(selectedAccount.id, { appType: type });
                      setCtxMenu(null);
                    }}
                  >
                    {getAppTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submenu Trạng Thái */}
          <div
            className="dav-ctx-submenu-container"
            onMouseEnter={() => setActiveLevel1('trang_thai')}
            onMouseLeave={() => setActiveLevel1(null)}
          >
            <div className="dav-ctx-item dav-ctx-has-sub">
              <Activity size={16} /> Trạng Thái
              <div className={`dav-ctx-submenu ${activeLevel1 === 'trang_thai' ? 'is-open' : ''}`}>
                <button
                  className={`dav-ctx-item ${selectedAccount.status === 'Live' ? 'active' : ''}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUpdateAccount(selectedAccount.id, { status: 'Live' });
                    setCtxMenu(null);
                  }}
                >
                  <div className="dav-status-dot live" /> Set Live {selectedAccount.status === 'Live' ? '(Hiện tại)' : ''}
                </button>
                <button
                  className={`dav-ctx-item ${selectedAccount.status === 'Die' ? 'active' : ''}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUpdateAccount(selectedAccount.id, { status: 'Die' });
                    setCtxMenu(null);
                  }}
                >
                  <div className="dav-status-dot die" /> Set Die {selectedAccount.status === 'Die' ? '(Hiện tại)' : ''}
                </button>
                <button
                  className={`dav-ctx-item ${selectedAccount.status === 'Risk' ? 'active' : ''}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUpdateAccount(selectedAccount.id, { status: 'Risk' });
                    setCtxMenu(null);
                  }}
                >
                  <div className="dav-status-dot risk" /> Set Risk {selectedAccount.status === 'Risk' ? '(Hiện tại)' : ''}
                </button>
                <button
                  className={`dav-ctx-item ${selectedAccount.status === 'Unverified' ? 'active verified' : ''}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const targetStatus = selectedAccount.status === 'Unverified' ? 'Verify' : 'Unverified';
                    handleUpdateAccount(selectedAccount.id, { status: targetStatus });
                    setCtxMenu(null);
                  }}
                >
                  {selectedAccount.status === 'Unverified' ? (
                    <>
                      <div className="dav-status-dot live" /> Verify Success
                    </>
                  ) : (
                    <>
                      <div className="dav-status-dot verify" /> Set UnVerify
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submenu Nearby People (Only WeChat) */}
          {activeTab === 'wechat' && (
            <div
              className="dav-ctx-submenu-container"
              onMouseEnter={() => setActiveLevel1('nearby')}
              onMouseLeave={() => setActiveLevel1(null)}
            >
              <div className="dav-ctx-item dav-ctx-has-sub">
                <MapPin size={16} /> Nearby People
                <div className={`dav-ctx-submenu ${activeLevel1 === 'nearby' ? 'is-open' : ''}`}>
                  <button
                    className={`dav-ctx-item ${selectedAccount.nearbyPeopleEnabled ? 'active' : ''}`}
                    style={{ color: 'var(--md-nearby)' }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const updates: Partial<Account> = {
                        nearbyPeopleEnabled: true,
                        nearbyPeopleDueDate: Date.now() + 30 * 24 * 60 * 60 * 1000
                      };
                      if (selectedAccount.status === 'Risk') {
                        updates.status = 'Live';
                      }
                      handleUpdateAccount(selectedAccount.id, updates, 'Open Nearby');
                      setCtxMenu(null);
                    }}
                  >
                    <MapPin size={16} /> Active Nearby
                  </button>
                  <button
                    className="dav-ctx-item"
                    style={{ color: 'var(--md-risk)' }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUpdateAccount(selectedAccount.id, getRiskNearbyUpdates(), 'Risk Nearby');
                      setCtxMenu(null);
                    }}
                  >
                    <MapPin size={16} /> Risk Nearby
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submenu Quét QR (Only WeChat) */}
          {activeTab === 'wechat' && (
            <div
              className="dav-ctx-submenu-container"
              onMouseEnter={() => setActiveLevel1('quet_qr')}
              onMouseLeave={() => setActiveLevel1(null)}
            >
              <div className="dav-ctx-item dav-ctx-has-sub">
                <QrCode size={16} /> Quét QR
                <div className={`dav-ctx-submenu ${activeLevel1 === 'quet_qr' ? 'is-open' : ''}`}>
                  <button
                    className="dav-ctx-item"
                    disabled={(selectedAccount.scanCount || 0) >= 3}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const currentCount = selectedAccount.scanCount || 0;
                      if (currentCount >= 3) return;
                      handleUpdateAccount(selectedAccount.id, {
                        scanCount: Math.min(3, currentCount + 1),
                        lastScanDate: Date.now()
                      });
                      setCtxMenu(null);
                    }}
                  >
                    Quét thành công
                  </button>
                  <button
                    className="dav-ctx-item"
                    disabled={(selectedAccount.scanCount || 0) >= 3}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const currentCount = selectedAccount.scanCount || 0;
                      if (currentCount >= 3) return;
                      handleUpdateAccount(selectedAccount.id, {
                        lastScanDate: Date.now()
                      });
                      setCtxMenu(null);
                    }}
                  >
                    Quét thất bại
                  </button>
                  <button
                    className="dav-ctx-item"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUpdateAccount(selectedAccount.id, {
                        scanCount: 0,
                        lastScanDate: null
                      });
                      setCtxMenu(null);
                    }}
                  >
                    Reset lượt quét
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            className="dav-ctx-item"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setHistoryModalAccountId(selectedAccount.id);
              setCtxMenu(null);
            }}
          >
            <History size={16} /> Lịch sử tài khoản
          </button>

          <div className="dav-ctx-divider" />
          <button
            className="dav-ctx-item danger"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPendingDeleteAccount({
                id: selectedAccount.id,
                name: selectedAccount.name || selectedAccount.phone || selectedAccount.nickname || 'Không tên'
              });
              setCtxMenu(null);
            }}
          >
            <Trash2 size={16} /> Xoá tài khoản
          </button>
        </div>
      </ContextMenuLayer>

      <ConfirmDialog
        isOpen={!!pendingDeleteAccount}
        title="Xác nhận xoá tài khoản"
        message={
          <>
            Bạn có chắc chắn muốn xoá tài khoản <strong>{pendingDeleteAccount?.name}</strong>?
            Hành động này sẽ xoá toàn bộ dữ liệu tài khoản và không thể hoàn tác.
          </>
        }
        isDanger
        confirmText="Xác nhận"
        cancelText="Huỷ"
        onConfirm={() => {
          if (pendingDeleteAccount) {
            handleDeleteAccount(pendingDeleteAccount.id);
            setPendingDeleteAccount(null);
          }
        }}
        onClose={() => setPendingDeleteAccount(null)}
      />

      <ModalLayer
        isOpen={!!historyModalAccount}
        onClose={() => setHistoryModalAccountId(null)}
        level="modal"
        overlayClassName="dav-history-overlay"
        className="confirmPanel dav-history-panel"
      >
        {historyModalAccount && (
          <>
            <div className="dav-history-title-row">
              <div className="confirmTitle dav-history-title">Lịch sử tài khoản</div>
              <div className="dav-history-account-name">
                {getAccountDisplayName(historyModalAccount)}
              </div>
            </div>
            <div className="dav-history-list">
              <div className="dav-history-row dav-history-head">
                <span>Trạng thái</span>
                <span>Giờ</span>
                <span>Ngày</span>
                <span>Năm</span>
              </div>
              {historyEntries.length > 0 ? historyEntries.map(entry => {
                const parts = formatHistoryTimeParts(entry.timestamp);
                return (
                  <div className="dav-history-row" key={entry.id}>
                    <span className={`dav-history-status ${getHistoryActionClass(entry.action)}`}>
                      {getHistoryActionLabel(entry.action)}
                    </span>
                    <span>{parts.time}</span>
                    <span>{parts.date}</span>
                    <span>{parts.year}</span>
                  </div>
                );
              }) : (
                <div className="dav-history-empty">Chưa có lịch sử trạng thái.</div>
              )}
            </div>
            <div className="confirmActions">
              <button
                type="button"
                className="modalBtnDanger"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPendingResetHistoryAccount(historyModalAccount);
                }}
                data-inspector-id="deviceAccount.accountHistoryResetButton"
                data-inspector-label="Account history reset button"
                data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
              >
                Reset
              </button>
              <button
                type="button"
                className="modalBtnPrimary"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setHistoryModalAccountId(null);
                }}
                data-inspector-id="deviceAccount.accountHistoryCloseButton"
                data-inspector-label="Account history close button"
                data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
              >
                Đóng
              </button>
            </div>
          </>
        )}
      </ModalLayer>

      <ConfirmDialog
        isOpen={!!pendingResetHistoryAccount}
        title="Reset lịch sử tài khoản"
        message={
          <>
            Bạn có chắc chắn muốn reset toàn bộ lịch sử trạng thái của tài khoản <strong>{pendingResetHistoryAccount ? getAccountDisplayName(pendingResetHistoryAccount) : ''}</strong>?
            Hành động này sẽ xoá sạch lịch sử đã ghi và không thể hoàn tác.
          </>
        }
        isDanger
        confirmText="Xác nhận"
        cancelText="Huỷ"
        onConfirm={() => {
          if (pendingResetHistoryAccount) {
            handleUpdateAccount(pendingResetHistoryAccount.id, { history: [] });
            setPendingResetHistoryAccount(null);
          }
        }}
        onClose={() => setPendingResetHistoryAccount(null)}
      />

      <ContextMenuLayer
        isOpen={!!accountActionMenu}
        onClose={() => setAccountActionMenu(null)}
        x={accountActionMenu?.x || 0}
        y={accountActionMenu?.y || 0}
        className={`dav-ctx-menu contextMenuPanel dav-account-action-menu ${accountActionMenu && accountActionMenu.x > window.innerWidth - 380 ? 'direction-left' : ''}`}
      >
        {accountActionMenu && (
          <div ref={accountActionMenuRef}>
          <button
            type="button"
            className="dav-ctx-item"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const textToCopy = accountActionMenu.account.nickname || '';
              navigator.clipboard.writeText(textToCopy);
              setAccountActionMenu(null);
            }}
            data-inspector-id="deviceAccount.contextMenuCopyId"
            data-inspector-label="Copy account ID menu item"
            data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
          >
            Copy ID ( User name)
          </button>

          {/* Submenu Tài Khoản */}
          <div
            className="dav-ctx-submenu-container"
            onMouseEnter={() => setShowAccountSubmenu(true)}
            onMouseLeave={() => setShowAccountSubmenu(false)}
            data-inspector-id="deviceAccount.contextMenuAccountSubmenu"
            data-inspector-label="Account management submenu"
            data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
          >
            <button
              type="button"
              className="dav-ctx-item dav-ctx-has-sub"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAccountSubmenu(v => !v);
              }}
            >
              <Users size={16} /> Tài Khoản
            </button>
            <div className={`dav-ctx-submenu ${showAccountSubmenu ? 'is-open' : ''}`}>
              {/* Submenu Đã set */}
              {activeTab === 'wechat' && (
                <div
                  className="dav-ctx-submenu-container"
                  onMouseEnter={() => setShowSetSubmenu(true)}
                  onMouseLeave={() => setShowSetSubmenu(false)}
                  data-inspector-id="deviceAccount.contextMenuLaunchProfileSubmenu"
                  data-inspector-label="Launch profile mappings submenu"
                  data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
                >
                  <button
                    type="button"
                    className="dav-ctx-item dav-ctx-has-sub"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowSetSubmenu(v => !v);
                    }}
                  >
                    Đã set
                  </button>
                  <div className={`dav-ctx-submenu ${showSetSubmenu ? 'is-open' : ''}`}>
                    {deviceProfiles.length === 0 ? (
                      <div className="dav-ctx-item" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                        Đang tải...
                      </div>
                    ) : (
                      deviceProfiles.map(profile => {
                        const appType = getAppTypeFromProfile(profile.id, profile.name);
                        const label = `User ${profile.id} - ${profile.name} / ${getAppTypeLabel(appType)}`;
                        const isAssigned = accountActionMenu.account.wechatLaunchProfile?.userId === profile.id;
                        return (
                          <button
                            key={profile.id}
                            type="button"
                            className={`dav-ctx-item ${isAssigned ? 'active' : ''}`}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();

                              const launch: WechatLaunchProfile = {
                                userId: profile.id,
                                name: profile.name,
                                appType: appType,
                                packageName: 'com.tencent.mm',
                                activityName: 'com.tencent.mm.ui.LauncherUI',
                                assignedAt: Date.now()
                              };

                              handleUpdateAccount(accountActionMenu.account.id, {
                                appType: appType,
                                wechatLaunchProfile: launch
                              });

                              setAccountActionMenu(null);
                              setAccountTitleDropdownOpen(false);
                            }}
                            data-inspector-id="deviceAccount.contextMenuLaunchProfileItem"
                            data-inspector-label={`Map launch profile to User ${profile.id}`}
                            data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
                          >
                            {label}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Submenu Phân Loại */}
              <div
                className="dav-ctx-submenu-container"
                onMouseEnter={() => setShowClassificationSubmenu(true)}
                onMouseLeave={() => setShowClassificationSubmenu(false)}
                data-inspector-id="deviceAccount.contextMenuClassificationSubmenu"
                data-inspector-label="Account classification submenu"
                data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
              >
                <button
                  type="button"
                  className="dav-ctx-item dav-ctx-has-sub"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowClassificationSubmenu(v => !v);
                  }}
                >
                  Phân loại
                </button>
                <div className={`dav-ctx-submenu ${showClassificationSubmenu ? 'is-open' : ''}`}>
                  {(['main', 'clone', 'secure', 'shelter'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`dav-ctx-item ${accountActionMenu.account.appType === type ? 'active' : ''}`}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUpdateAccount(accountActionMenu.account.id, { appType: type });
                        setAccountActionMenu(null);
                        setAccountTitleDropdownOpen(false);
                      }}
                      data-inspector-id="deviceAccount.contextMenuClassificationItem"
                      data-inspector-label={`Set account classification to ${type}`}
                      data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
                    >
                      {getAppTypeLabel(type)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submenu Trạng Thái */}
              <div
                className="dav-ctx-submenu-container"
                onMouseEnter={() => setShowStatusSubmenu(true)}
                onMouseLeave={() => setShowStatusSubmenu(false)}
                data-inspector-id="deviceAccount.contextMenuStatusSubmenu"
                data-inspector-label="Account status submenu"
                data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
              >
                <button
                  type="button"
                  className="dav-ctx-item dav-ctx-has-sub"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowStatusSubmenu(v => !v);
                  }}
                >
                  <Activity size={16} /> Trạng Thái
                </button>
                <div className={`dav-ctx-submenu ${showStatusSubmenu ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className={`dav-ctx-item ${accountActionMenu.account.status === 'Live' ? 'active' : ''}`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUpdateAccount(accountActionMenu.account.id, { status: 'Live' });
                      setAccountActionMenu(null);
                      setAccountTitleDropdownOpen(false);
                    }}
                  >
                    <div className="dav-status-dot live" /> Set Live {accountActionMenu.account.status === 'Live' ? '(Hiện tại)' : ''}
                  </button>
                  <button
                    type="button"
                    className={`dav-ctx-item ${accountActionMenu.account.status === 'Die' ? 'active' : ''}`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUpdateAccount(accountActionMenu.account.id, { status: 'Die' });
                      setAccountActionMenu(null);
                      setAccountTitleDropdownOpen(false);
                    }}
                  >
                    <div className="dav-status-dot die" /> Set Die {accountActionMenu.account.status === 'Die' ? '(Hiện tại)' : ''}
                  </button>
                  <button
                    type="button"
                    className={`dav-ctx-item ${accountActionMenu.account.status === 'Risk' ? 'active' : ''}`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUpdateAccount(accountActionMenu.account.id, { status: 'Risk' });
                      setAccountActionMenu(null);
                      setAccountTitleDropdownOpen(false);
                    }}
                  >
                    <div className="dav-status-dot risk" /> Set Risk {accountActionMenu.account.status === 'Risk' ? '(Hiện tại)' : ''}
                  </button>
                  <button
                    type="button"
                    className={`dav-ctx-item ${accountActionMenu.account.status === 'Unverified' ? 'active verified' : ''}`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const targetStatus = accountActionMenu.account.status === 'Unverified' ? 'Verify' : 'Unverified';
                      handleUpdateAccount(accountActionMenu.account.id, { status: targetStatus });
                      setAccountActionMenu(null);
                      setAccountTitleDropdownOpen(false);
                    }}
                  >
                    {accountActionMenu.account.status === 'Unverified' ? (
                      <>
                        <div className="dav-status-dot live" /> Verify Success
                      </>
                    ) : (
                      <>
                        <div className="dav-status-dot verify" /> Set UnVerify
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Submenu Thêm Vào Nhóm */}
              <div
                className="dav-ctx-submenu-container"
                onMouseEnter={() => setShowAddToGroupSubmenu(true)}
                onMouseLeave={() => setShowAddToGroupSubmenu(false)}
                data-inspector-id="deviceAccount.contextMenuAddToGroupSubmenu"
                data-inspector-label="Add device to group submenu"
                data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
              >
                <button
                  type="button"
                  className="dav-ctx-item dav-ctx-has-sub"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAddToGroupSubmenu(v => !v);
                  }}
                >
                  Thêm vào nhóm
                </button>
                <div className={`dav-ctx-submenu ${showAddToGroupSubmenu ? 'is-open' : ''}`}>
                  {savedGroups.length === 0 ? (
                    <div className="dav-ctx-item" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                      Không có nhóm nào
                    </div>
                  ) : (
                    savedGroups.map((group, idx) => {
                      const alreadyIn = group.udids.includes(accountActionMenu.sourceUdid);
                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`dav-ctx-item ${alreadyIn ? 'active' : ''}`}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!alreadyIn) {
                              handleAddDeviceToGroup(idx, accountActionMenu.sourceUdid);
                            }
                            setAccountActionMenu(null);
                            setAccountTitleDropdownOpen(false);
                          }}
                        >
                          {group.name} {alreadyIn ? '(Đã có)' : ''}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Di chuyển tài khoản */}
              <button
                type="button"
                className="dav-ctx-item"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMoveModal({ sourceUdid: accountActionMenu.sourceUdid, account: accountActionMenu.account });
                  setMoveError('');
                  setAccountActionMenu(null);
                  setAccountTitleDropdownOpen(false);
                }}
                data-inspector-id="deviceAccount.contextMenuMove"
                data-inspector-label="Move account to another device menu item"
                data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
              >
                Di chuyển tài khoản
              </button>

              {/* Lịch sử tài khoản */}
              <button
                type="button"
                className="dav-ctx-item"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setHistoryModalAccountId(accountActionMenu.account.id);
                  setAccountActionMenu(null);
                  setAccountTitleDropdownOpen(false);
                }}
                data-inspector-id="deviceAccount.contextMenuHistory"
                data-inspector-label="View account history menu item"
                data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
              >
                <History size={16} /> Lịch sử tài khoản
              </button>
            </div>
          </div>



          {/* Submenu Nearby People (Only WeChat) */}
          {activeTab === 'wechat' && (
            <div
              className="dav-ctx-submenu-container"
              onMouseEnter={() => setShowNearbySubmenu(true)}
              onMouseLeave={() => setShowNearbySubmenu(false)}
              data-inspector-id="deviceAccount.contextMenuNearbySubmenu"
              data-inspector-label="Nearby people submenu"
              data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
            >
              <button
                type="button"
                className="dav-ctx-item dav-ctx-has-sub"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowNearbySubmenu(v => !v);
                }}
              >
                <MapPin size={16} /> Nearby People
              </button>
              <div className={`dav-ctx-submenu ${showNearbySubmenu ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className={`dav-ctx-item ${accountActionMenu.account.nearbyPeopleEnabled ? 'active' : ''}`}
                  style={{ color: 'var(--md-nearby)' }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const updates: Partial<Account> = {
                      nearbyPeopleEnabled: true,
                      nearbyPeopleDueDate: Date.now() + 30 * 24 * 60 * 60 * 1000
                    };
                    if (accountActionMenu.account.status === 'Risk') {
                      updates.status = 'Live';
                    }
                    handleUpdateAccount(accountActionMenu.account.id, updates, 'Open Nearby');
                    setAccountActionMenu(null);
                    setAccountTitleDropdownOpen(false);
                  }}
                >
                  <MapPin size={16} /> Active Nearby
                </button>
                <button
                  type="button"
                  className="dav-ctx-item"
                  style={{ color: 'var(--md-risk)' }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUpdateAccount(accountActionMenu.account.id, getRiskNearbyUpdates(), 'Risk Nearby');
                    setAccountActionMenu(null);
                    setAccountTitleDropdownOpen(false);
                  }}
                >
                  <MapPin size={16} /> Risk Nearby
                </button>
              </div>
            </div>
          )}

          {/* Submenu Quét QR (Only WeChat) */}
          {activeTab === 'wechat' && (
            <div
              className="dav-ctx-submenu-container"
              onMouseEnter={() => setShowQrSubmenu(true)}
              onMouseLeave={() => setShowQrSubmenu(false)}
              data-inspector-id="deviceAccount.contextMenuQrSubmenu"
              data-inspector-label="QR scan submenu"
              data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
            >
              <button
                type="button"
                className="dav-ctx-item dav-ctx-has-sub"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowQrSubmenu(v => !v);
                }}
              >
                <QrCode size={16} /> Quét QR
              </button>
              <div className={`dav-ctx-submenu ${showQrSubmenu ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="dav-ctx-item"
                  disabled={(accountActionMenu.account.scanCount || 0) >= 3}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const currentCount = accountActionMenu.account.scanCount || 0;
                    if (currentCount >= 3) return;
                    handleUpdateAccount(accountActionMenu.account.id, {
                      scanCount: Math.min(3, currentCount + 1),
                      lastScanDate: Date.now()
                    });
                    setAccountActionMenu(null);
                    setAccountTitleDropdownOpen(false);
                  }}
                >
                  Quét thành công
                </button>
                <button
                  type="button"
                  className="dav-ctx-item"
                  disabled={(accountActionMenu.account.scanCount || 0) >= 3}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const currentCount = accountActionMenu.account.scanCount || 0;
                    if (currentCount >= 3) return;
                    handleUpdateAccount(accountActionMenu.account.id, {
                      lastScanDate: Date.now()
                    });
                    setAccountActionMenu(null);
                    setAccountTitleDropdownOpen(false);
                  }}
                >
                  Quét thất bại
                </button>
                <button
                  type="button"
                  className="dav-ctx-item"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUpdateAccount(accountActionMenu.account.id, {
                      scanCount: 0,
                      lastScanDate: null
                    });
                    setAccountActionMenu(null);
                    setAccountTitleDropdownOpen(false);
                  }}
                >
                  Reset lượt quét
                </button>
              </div>
            </div>
          )}

          {/* Button Thông báo */}
          <button
            type="button"
            className="dav-ctx-item"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setNoticeEditModal({ sourceUdid: accountActionMenu.sourceUdid, account: accountActionMenu.account });
              setEditNoticeTitle(accountActionMenu.account.notice?.title || '');
              setEditNoticeDays(accountActionMenu.account.notice?.days?.toString() || '');
              setEditNoticeTime((accountActionMenu.account.notice as any)?.dailyReminderTime || '');
              setNoticeError('');
              setAccountActionMenu(null);
              setAccountTitleDropdownOpen(false);
              setAccountHoverTooltip(null);
            }}
            data-inspector-id="deviceAccount.contextMenuNotice"
            data-inspector-label="Edit account notice settings menu item"
            data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
            style={{ display: 'flex', alignItems: 'center', width: '100%' }}
          >
            <Bell size={16} color={accountActionMenu.account.notice?.title ? (!!(accountActionMenu.account.notice.dueDate && accountActionMenu.account.notice.dueDate <= Date.now()) ? 'var(--md-danger)' : 'var(--md-verify)') : 'currentColor'} />
            <span style={{ marginLeft: '8px' }}>Thông báo</span>
            {accountActionMenu.account.notice?.title && (
              <span
                style={{
                  fontSize: '8px',
                  background: !!(accountActionMenu.account.notice.dueDate && accountActionMenu.account.notice.dueDate <= Date.now()) ? 'color-mix(in srgb, var(--md-danger) 20%, transparent)' : 'color-mix(in srgb, var(--md-verify) 20%, transparent)',
                  color: !!(accountActionMenu.account.notice.dueDate && accountActionMenu.account.notice.dueDate <= Date.now()) ? 'var(--md-danger)' : 'var(--md-verify)',
                  padding: '1px 4px',
                  borderRadius: '4px',
                  marginLeft: 'auto',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}
              >
                {accountActionMenu.account.notice.title}
              </span>
            )}
          </button>
        </div>
        )}
      </ContextMenuLayer>
      <ModalLayer
        isOpen={!!moveModal}
        onClose={() => {
          setMoveModal(null);
          setTargetOrderStr('');
          setMoveError('');
        }}
        level="modal-child"
        overlayClassName="confirmOverlay"
        className="confirmPanel confirmPanel--compact"
        cardStyle={{ minWidth: '280px' }}
      >
        {moveModal && (
          <>
            <div className="confirmTitle" style={{ textAlign: 'center', fontSize: '14px' }}>
              Di chuyển tài khoản
            </div>
            <div className="confirmText" style={{ textAlign: 'center', fontSize: '12px' }}>
              Di chuyển tài khoản <strong style={{ color: 'var(--md-text)' }}>{moveModal.account.name || moveModal.account.phone || moveModal.account.nickname || 'Không tên'}</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--md-muted)' }}>Nhập số máy đích</span>
              <input
                ref={moveInputRef}
                type="number"
                className="dav-input"
                style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}
                placeholder="Ví dụ: 5"
                value={targetOrderStr}
                onChange={e => setTargetOrderStr(e.target.value)}
                autoFocus
                data-inspector-id="deviceAccount.moveAccountInput"
                data-inspector-label="Destination device number input"
                data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
              />
              {moveError && (
                <span style={{ fontSize: '11px', color: 'var(--md-danger)', textAlign: 'center', marginTop: '2px' }}>
                  {moveError}
                </span>
              )}
            </div>

            <div className="confirmActions" style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                className="modalBtn"
                style={{ flex: 1 }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMoveModal(null);
                  setTargetOrderStr('');
                  setMoveError('');
                }}
                data-inspector-id="deviceAccount.moveAccountCancelButton"
                data-inspector-label="Cancel move account button"
                data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
              >
                Hủy
              </button>
              <button
                type="button"
                className="modalBtnPrimary"
                style={{ flex: 1 }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleConfirmMove();
                }}
                data-inspector-id="deviceAccount.moveAccountConfirmButton"
                data-inspector-label="Confirm move account button"
                data-inspector-component="client/src/components/DeviceAccountOverlay.tsx"
              >
                Xác nhận
              </button>
            </div>
          </>
        )}
      </ModalLayer>

      <ModalLayer
        isOpen={!!noticeEditModal}
        onClose={() => {
          setNoticeEditModal(null);
          setEditNoticeTitle('');
          setEditNoticeDays('');
          setEditNoticeTime('');
          setNoticeError('');
        }}
        level="modal"
        overlayClassName="confirmOverlay dav-confirm-overlay-layer"
        className="confirmPanel confirmPanel--compact dav-confirm-panel-layer"
        cardStyle={{ minWidth: '360px' }}
      >
        {noticeEditModal && (
          <>
            <div className="confirmTitle" style={{ display: 'flex', alignItems: 'center', width: '100%', borderBottom: '1px solid var(--md-border)', paddingBottom: '6px', marginBottom: '8px', justifyContent: 'flex-start' }}>
              <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--md-text)' }}>
                Cài đặt thông báo: <span style={{ fontWeight: 'bold', color: 'var(--md-text)' }}>{noticeEditModal.account.name || noticeEditModal.account.phone || noticeEditModal.account.nickname || 'Không tên'}</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--md-text)', fontWeight: 'bold', textAlign: 'left' }}>Nội dung</span>
                <input
                  className="dav-input dav-form-input"
                  placeholder="( Vui lòng nhập )"
                  value={editNoticeTitle}
                  onChange={e => {
                    setEditNoticeTitle(e.target.value);
                    setNoticeError('');
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--md-text)', fontWeight: 'bold', textAlign: 'left' }}>Số ngày đếm ngược</span>
                  <input
                    type="number"
                    className="dav-input dav-form-input"
                    placeholder="Số ngày"
                    value={editNoticeDays}
                    onChange={e => {
                      setEditNoticeDays(e.target.value);
                      setNoticeError('');
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--md-text)', fontWeight: 'bold', textAlign: 'left' }}>Nhắc nhở hàng ngày</span>
                  <input
                    type="time"
                    lang="vi-VN"
                    step="60"
                    className="dav-input dav-form-input"
                    value={editNoticeTime}
                    onChange={e => {
                      setEditNoticeTime(e.target.value);
                      setNoticeError('');
                    }}
                  />
                </div>
              </div>

              {noticeError && (
                <span style={{ fontSize: '11px', color: 'var(--md-danger)', textAlign: 'center', marginTop: '4px' }}>
                  {noticeError}
                </span>
              )}
            </div>

            <div className="confirmActions" style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
              <button
                type="button"
                className="modalBtn"
                style={{ flex: 1 }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setNoticeEditModal(null);
                  setEditNoticeTitle('');
                  setEditNoticeDays('');
                  setEditNoticeTime('');
                  setNoticeError('');
                }}
              >
                Hủy
              </button>
              {noticeEditModal.account.notice && (
                <button
                  type="button"
                  className="modalBtnDanger"
                  style={{ flex: 1 }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUpdateAccount(noticeEditModal.account.id, { notice: null });
                    setNoticeEditModal(null);
                    setEditNoticeTitle('');
                    setEditNoticeDays('');
                    setEditNoticeTime('');
                    setNoticeError('');
                  }}
                >
                  Xóa
                </button>
              )}
              <button
                type="button"
                className="modalBtnPrimary"
                style={{ flex: 1 }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const daysNum = parseInt(editNoticeDays, 10);
                  if (!editNoticeTitle.trim() || isNaN(daysNum) || daysNum <= 0) {
                    setNoticeError('Vui lòng nhập đầy đủ nội dung và số ngày hợp lệ (>0).');
                    return;
                  }

                  const startDate = Date.now();
                  handleUpdateAccount(noticeEditModal.account.id, {
                    notice: {
                      title: editNoticeTitle.trim(),
                      content: editNoticeTitle.trim(),
                      dueDate: startDate + daysNum * 24 * 60 * 60 * 1000,
                      days: daysNum,
                      startDate,
                      dailyReminderTime: editNoticeTime || undefined
                    } as any
                  });

                  setNoticeEditModal(null);
                  setEditNoticeTitle('');
                  setEditNoticeDays('');
                  setEditNoticeTime('');
                  setNoticeError('');
                }}
              >
                Xác nhận
              </button>
            </div>
          </>
        )}
      </ModalLayer>
    </div>
  );
});
