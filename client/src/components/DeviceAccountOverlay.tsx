import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, Plus, MoreVertical, Smartphone, Info, Calendar, Shield, ShieldAlert, Activity, Phone, Hash, Bell, MapPin, QrCode, Mail, Users, Trash2, Briefcase, Folder, Settings, History, Layers, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { getNearbyAccountState, hasNearbyRelevantAccount, hasNearbyEligibleAccount, getNearbyAccountGroupState } from '@/lib/deviceAccountNearby';
import { saveBackendSetting } from '@/lib/backendSettings';
import { useServer } from '@/context/ServerContext';
import { listUserProfiles, runAdbCommandApi } from '@/lib/serverApi';
import { 
  getDeviceAccountData, 
  saveDeviceAccountData, 
  saveDeviceAccountDataAsync,
  loadDeviceAccountVault,
  getDeviceAccountDataFromVault,
  VaultData,
  DeviceAccountData,
  PlatformType, 
  Account, 
  AccountHistoryAction,
  WeChatAccount, 
  createNewAccount,
  getSavedPlatforms,
  saveSavedPlatforms,
  saveDeviceAccountVault,
  WechatLaunchProfile
} from '@/lib/deviceAccountVault';

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
};

const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  'Live': '#22c55e',
  'Die': '#ef4444',
  'Verify': '#eab308',
  'Risk': '#f97316',
  'Unverified': '#64748b'
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

// --- Format Utilities ---
function formatDate(ts: number | null) {
  if (!ts) return 'N/A';
  return new Date(ts).toLocaleDateString('vi-VN');
}

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

const getFloatingTooltipStyle = (x: number, y: number) => {
  const screenWidth = window.innerWidth;
  let tx = '-50%';
  let ty = 'calc(-100% - 10px)';
  
  // Dynamic threshold to avoid overflowing the left/right screen boundaries
  const threshold = Math.min(250, screenWidth / 2 - 20);
  if (x < threshold) {
    tx = '15px';
  } else if (x > screenWidth - threshold) {
    tx = 'calc(-100% - 15px)';
  }
  
  if (y < 160) {
    ty = '15px';
  }
  
  return {
    left: x,
    top: y,
    transform: `translate(${tx}, ${ty})`
  };
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

function renderLoginStreakDot(account: Account) {
  const loginDates = Array.from(new Set(
    (account.history || [])
      .filter(h => h.action === 'Login')
      .map(h => getLocalDateString(h.timestamp))
  )).sort();

  const todayStr = getLocalDateString(Date.now());
  const yesterdayStr = getLocalDateString(Date.now() - 24 * 60 * 60 * 1000);

  let showDot = false;
  let dotColor = 'white';
  let tooltipText = '';
  let streakDays = 0;

  if (loginDates.includes(todayStr)) {
    showDot = true;
    streakDays = countConsecutiveDays(todayStr, loginDates);
    dotColor = streakDays >= 3 ? 'green' : 'white';
    tooltipText = `Đăng nhập vào hôm nay: ${formatStreakDays(streakDays)}`;
  } else if (loginDates.includes(yesterdayStr)) {
    showDot = true;
    streakDays = countConsecutiveDays(yesterdayStr, loginDates);
    dotColor = streakDays >= 3 ? 'green' : 'white';
    tooltipText = `Đăng nhập vào ngày trước: ${formatStreakDays(streakDays)}`;
  }

  if (!showDot) {
    return null;
  }

  return (
    <span 
      className={`dav-account-state-dot streak-${dotColor}`}
      style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        flexShrink: 0,
        backgroundColor: dotColor === 'green' ? '#22c55e' : '#ffffff',
        display: 'inline-block',
        marginRight: '6px',
        cursor: 'pointer'
      }}
    />
  );
}

function getElapsedDaysSince(ts?: number | null): number {
  if (!ts) return 0;
  return Math.max(0, Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24)));
}

function getAccountListNameColor(account: Account): string {
  if (account.status === 'Unverified') return '#eab308';

  if (getNearbyAccountState(account) === 'eligible') return '#3b82f6';

  if (account.status === 'Die') return '#ef4444';
  if (account.status === 'Risk') return '#f97316';

  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  const isOverOneYear = !!(
    account.isOneYearOld ||
    (account.createdAt && Date.now() - account.createdAt >= oneYearMs)
  );

  return isOverOneYear ? '#22c55e' : '#ffffff';
}

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

function computeBadges(acc: Account, isWeChat: boolean) {
  const badges: { label: string; color: string }[] = [];
  
  if (acc.status === 'Die') badges.push({ label: 'Die', color: '#ef4444' });
  else if (acc.status === 'Risk') badges.push({ label: 'Risk', color: '#f97316' });
  
  if (isWeChat) {
    const wc = acc as WeChatAccount;
    // 1 Year badge
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    if (wc.isOneYearOld || (wc.createdAt && Date.now() - wc.createdAt >= oneYearMs)) {
      badges.push({ label: '1 Năm', color: '#8b5cf6' });
    } else if (wc.isNew || (wc.createdAt && Date.now() - wc.createdAt < 30 * 24 * 60 * 60 * 1000)) {
      badges.push({ label: 'TK Mới', color: '#0ea5e9' });
    }
    
    if (wc.nearbyPeopleEnabled) {
      badges.push({ label: 'Nearby', color: '#ec4899' });
    }
    if (wc.phoneRegion === 'HK') {
      badges.push({ label: 'Cần HK', color: '#f59e0b' });
    }
    if (wc.verifyStatus === 'Unverified') {
      badges.push({ label: 'Unverify', color: '#64748b' });
    }
  }

  if (acc.notice) {
    badges.push({ label: 'Thông báo', color: '#eab308' });
  }

  return badges;
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
  
  const iconColor = isLoggedInToday ? '#22c55e' : '#ffffff';
  
  if (type === 'shelter') {
    return (
      <span title="Shelter" style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
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
      <span title="Secure Folder" style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
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
      <span title="Clone App" style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
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
        <MapPin size={13} color="#3b82f6" />
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
            color: '#f97316',
            fontWeight: 'bold'
          }}
        >
          <MapPin size={13} color="#f97316" />
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
        color={expired ? '#ef4444' : '#eab308'}
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
      <ShieldAlert size={13} color="#eab308" />
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
  nearbyAutoOpenEnabled,
  onOpenDeviceViewer,
  showAccountOverlay = false,
  alwaysShowHeader = false
}: { 
  udid: string; 
  order: number; 
  model: string; 
  isOnline: boolean;
  orderMap: Map<string, number>;
  initialData: DeviceAccountData;
  activeTab: PlatformType;
  setActiveTab: (tab: PlatformType) => void;
  nearbyAutoOpenEnabled?: boolean;
  onOpenDeviceViewer?: (udid: string) => void;
  showAccountOverlay?: boolean;
  alwaysShowHeader?: boolean;
}) {
  const { wsServer } = useServer();
  const DAV_DEBUG_KEY = 'monviewphone:dav-debug-open-wechat';
  const isDavDebugEnabled = () => localStorage.getItem(DAV_DEBUG_KEY) === 'true';
  const davDebug = (...args: any[]) => { if (isDavDebugEnabled()) console.log('[DAV_OPEN_WECHAT]', ...args); };
  const davWarn = (...args: any[]) => console.warn('[DAV_OPEN_WECHAT]', ...args);

  const [data, setData] = useState(initialData);
  const [platforms, setPlatforms] = useState(() => getSavedPlatforms());
  const [bellTooltip, setBellTooltip] = useState<{ x: number; y: number } | null>(null);
  const [hiddenIdentityFields, setHiddenIdentityFields] = useState<Record<string, boolean>>({});
  const [pendingDeleteAccount, setPendingDeleteAccount] = useState<{ id: string; name: string } | null>(null);
  const [historyModalAccountId, setHistoryModalAccountId] = useState<string | null>(null);
  const [pendingResetHistoryAccount, setPendingResetHistoryAccount] = useState<Account | null>(null);
  const [deviceProfiles, setDeviceProfiles] = useState<{ id: number; name: string }[]>([]);
  const [showSetSubmenu, setShowSetSubmenu] = useState(false);
  /* showClassificationSubmenu : State hiển thị submenu phân loại của tài khoản trong dropdown */
  const [showClassificationSubmenu, setShowClassificationSubmenu] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setPlatforms(getSavedPlatforms());
    };
    window.addEventListener('device-account-platforms-updated', handleUpdate);
    return () => window.removeEventListener('device-account-platforms-updated', handleUpdate);
  }, []);

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

  useEffect(() => {
    if (accountTitleDropdownOpen && accountTitleDropdownRef.current) {
      const rect = accountTitleDropdownRef.current.getBoundingClientRect();
      const dropdownWidth = 220;
      const safetyWidth = 280; // Estimated width for edge-collision check
      let left = rect.left;
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
  }, [accountTitleDropdownOpen]);

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

  // Auto-open dropdown khi filter Nearby People bật
  useEffect(() => {
    const shouldOpen =
      nearbyAutoOpenEnabled &&
      activeTab === 'wechat' &&
      panelHasNearbyRelevantAccount;

    if (shouldOpen) {
      setAccountTitleDropdownOpen(true);
      setPlatformDropdownOpen(false);
      autoOpenedNearbyDropdownRef.current = true;
      return;
    }

    if (!nearbyAutoOpenEnabled && autoOpenedNearbyDropdownRef.current) {
      setAccountTitleDropdownOpen(false);
      autoOpenedNearbyDropdownRef.current = false;
    }
  }, [nearbyAutoOpenEnabled, activeTab, panelHasNearbyRelevantAccount]);
  const [accountActionMenu, setAccountActionMenu] = useState<{ x: number; y: number; sourceUdid: string; account: Account } | null>(null);
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
      
      setAccountTitleDropdownOpen(false);
      setPlatformDropdownOpen(false);
    };
    window.addEventListener('mousedown', hide, true);
    return () => window.removeEventListener('mousedown', hide, true);
  }, [accountTitleDropdownOpen, platformDropdownOpen]);

  // Close accountActionMenu on outside click
  useEffect(() => {
    if (!accountActionMenu) return;
    const hide = (e: MouseEvent) => {
      const target = e.target as Node;
      if (accountActionMenuRef.current && accountActionMenuRef.current.contains(target)) {
        return;
      }
      setAccountActionMenu(null);
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

  const deviceNoticeStatus = useMemo(() => {
    if (accountsWithNotices.length === 0) return 'none';
    const hasExpired = accountsWithNotices.some(acc => acc.notice?.dueDate && acc.notice.dueDate <= Date.now());
    return hasExpired ? 'expired' : 'counting';
  }, [accountsWithNotices]);

  const noticeTooltipText = useMemo(() => {
    return accountsWithNotices.map(acc => {
      const accName = acc.name || acc.phone || acc.nickname || 'Không tên';
      const accNameColor = getAccountListNameColor(acc);
      const title = acc.notice?.title || '';
      if (acc.notice?.dueDate) {
        const diffMs = acc.notice.dueDate - Date.now();
        const timeStr = diffMs <= 0 ? 'đã đến hạn' : formatCountdown(diffMs);
        return (
          <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
            <span style={{ color: accNameColor, fontWeight: 'bold' }}>{accName}</span>
            <span style={{ color: '#f97316' }}> : {title} ({timeStr})</span>
          </div>
        );
      }
      return (
        <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
          <span style={{ color: accNameColor, fontWeight: 'bold' }}>{accName}</span>
          <span style={{ color: '#f97316' }}> : {title}</span>
        </div>
      );
    });
  }, [accountsWithNotices]);

  const handleNoticeIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (accountsWithNotices.length === 0) return;
    
    const expired = accountsWithNotices.filter(acc => acc.notice?.dueDate && acc.notice.dueDate <= Date.now());
    const nonExpired = accountsWithNotices.filter(acc => !acc.notice?.dueDate || acc.notice.dueDate > Date.now());
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
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

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
    if (!selectedAccount) return '#fff';
    if (selectedAccount.status === 'Unverified') {
      return '#eab308'; // Vàng khi tài khoản Unverified
    }
    if (selectedAccount.status === 'Die') {
      return '#ef4444'; // Đỏ khi tài khoản Die
    }
    if (selectedAccount.status === 'Risk') {
      return '#f97316'; // Cam khi tài khoản Risk
    }
    if (showBlueNearby) {
      return '#3b82f6'; // Xanh dương khi đủ điều kiện Nearby People
    }
    if (!isOverOneYear) {
      return '#ffffff'; // Trắng cho tài khoản dưới 1 năm tuổi
    }
    return ACCOUNT_STATUS_COLORS[selectedAccount.status] || '#22c55e'; // Xanh lá
  }, [selectedAccount, showBlueNearby, isOverOneYear]);

  const nameColor = useMemo(() => {
    if (!selectedAccount) return '#fff';
    if (selectedAccount.status === 'Unverified') {
      return '#eab308'; // Vàng khi tài khoản Unverified
    }
    if (selectedAccount.status === 'Die') {
      return '#ef4444'; // Đỏ khi tài khoản Die
    }
    if (selectedAccount.status === 'Risk') {
      return '#f97316'; // Cam khi tài khoản Risk
    }
    if (showBlueNearby) {
      return '#3b82f6'; // Xanh dương khi đủ điều kiện Nearby People
    }
    if (!isOverOneYear) {
      return '#ffffff'; // Trắng cho tài khoản dưới 1 năm tuổi
    }
    return '#22c55e'; // Xanh lá cho tài khoản trên 1 năm tuổi
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
    if (
      lastDropdownActivateRef.current?.accountId === account.id &&
      now - lastDropdownActivateRef.current.ts < 500
    ) {
      davDebug('ITEM_ACTIVATE_DEDUPED', { accountId: account.id, accUdid });
      return;
    }
    lastDropdownActivateRef.current = { accountId: account.id, ts: now };

    const latestAccount =
      (data.platforms[activeTab] || []).find(a => a.id === account.id) || account;

    const activeAccs = data.platforms[activeTab] || [];
    const selAccId = data.selectedAccountByPlatform[activeTab];
    const selAcc = activeAccs.find(a => a.id === selAccId) || activeAccs[0];

    davDebug('ITEM_ACTIVATE_START', {
      eventType: e.type,
      accUdid,
      accountId: account.id,
      latestAccountId: latestAccount.id,
      name: latestAccount.name,
      phone: latestAccount.phone,
      nickname: latestAccount.nickname,
      activeTab,
      hasWechatLaunchProfile: !!latestAccount.wechatLaunchProfile,
      wechatLaunchProfile: latestAccount.wechatLaunchProfile,
      appType: latestAccount.appType,
      selectedAccountId: selAcc?.id,
    });

    if (!account.wechatLaunchProfile && latestAccount.wechatLaunchProfile) {
      davDebug('STALE_ACCOUNT_OBJECT_DETECTED', {
        accountId: account.id,
        latestProfile: latestAccount.wechatLaunchProfile,
      });
    }

    davDebug('ITEM_CALL_HANDLE_SET_MAIN_FROM_MOUSE_DOWN', {
      accountId: latestAccount.id,
      accUdid,
    });
    handleSetMain(latestAccount.id);

    setAccountTitleDropdownOpen(false);
    setAccountHoverTooltip(null);

    davDebug('ITEM_CALL_OPEN_WECHAT_FROM_MOUSE_DOWN', {
      accountId: latestAccount.id,
      accUdid,
      wechatLaunchProfile: latestAccount.wechatLaunchProfile,
    });
    openWechatForAccount(latestAccount, accUdid, 'header-dropdown-account-mousedown');

    davDebug('ITEM_ACTIVATE_DONE', {
      accountId: latestAccount.id,
      accUdid,
    });
  };

  const activePlatformLabel = platforms.find(p => p.id === activeTab)?.label || 'WeChat';

  return (
    <div className="dav-panel" onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}>
      <div className="dav-panel-header">
        <div 
          className="dav-panel-title-left"
          onMouseDown={handleOpenViewerMiddleClick}
          onAuxClick={handleOpenViewerAuxClick}
        >
          <span className={`dav-order ${panelHasNearbyEligibleAccount ? 'dav-order-nearby-eligible' : ''}`}>
            {order.toString().padStart(2, '0')}
          </span>
          <div className="dav-title-dropdown-wrap" ref={accountTitleDropdownRef}>
            <button
              type="button"
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
                setAccountTitleDropdownOpen(v => !v);
                setPlatformDropdownOpen(false);
              }}
            >
              {totalAccounts}
            </button>
            {accountTitleDropdownOpen && dropdownCoords && ReactDOM.createPortal(
              <div 
                className="dav-title-account-dropdown contextMenuPanel"
                style={{
                  position: 'fixed',
                  top: `${dropdownCoords.top}px`,
                  left: `${dropdownCoords.left}px`,
                  minWidth: `${dropdownCoords.width}px`,
                  width: 'max-content',
                  maxWidth: '320px',
                  right: 'auto',
                  marginTop: 0,
                  zIndex: 28000,
                  maxHeight: '300px',
                  overflowY: 'auto',
                  background: 'var(--md-card)',
                  border: '1px solid var(--md-border)',
                  boxShadow: 'var(--md-shadow-panel)',
                  borderRadius: 'var(--md-radius-sm, 8px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  padding: '6px',
                }}
                onMouseDown={e => e.stopPropagation()}
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
                        {account.wechatLaunchProfile && (
                          <span 
                            style={{ 
                              fontSize: '8px', 
                              background: 'rgba(34, 197, 94, 0.2)', 
                              color: '#22c55e', 
                              padding: '1px 4px', 
                              borderRadius: '4px',
                              marginLeft: 'auto',
                              fontWeight: 'bold',
                              flexShrink: 0
                            }}
                          >
                            U{account.wechatLaunchProfile.userId}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>,
              document.body
            )}
          </div>
        </div>

        {selectedAccount && (
          <div className="dav-header-name-wrapper">
            {showAccountOverlay && (
              <span 
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
            
            {showNameStatusDropdown && (
              <div 
                className="dav-name-status-dropdown"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  background: '#252525',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  padding: '4px',
                  zIndex: 21000,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  minWidth: '100px'
                }}
                onClick={e => e.stopPropagation()}
              >
                {selectedAccount.status !== 'Die' && selectedAccount.status !== 'Risk' ? (
                  <>
                    <button 
                      type="button"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        padding: '6px 8px',
                        fontSize: '11px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateAccount(selectedAccount.id, { status: 'Die' });
                        setShowNameStatusDropdown(false);
                      }}
                    >
                      Set Die
                    </button>
                    <button 
                      type="button"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f97316',
                        padding: '6px 8px',
                        fontSize: '11px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateAccount(selectedAccount.id, { status: 'Risk' });
                        setShowNameStatusDropdown(false);
                      }}
                    >
                      Set Risk
                    </button>
                  </>
                ) : (
                  <button 
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#22c55e',
                      padding: '6px 8px',
                      fontSize: '11px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateAccount(selectedAccount.id, { status: 'Live' });
                      setShowNameStatusDropdown(false);
                    }}
                  >
                    Set Live
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="dav-panel-title-right" style={{ position: 'relative' }}>
          {deviceNoticeStatus !== 'none' && (
            <>
              <button
                type="button"
                className="dav-bell-btn"
                onMouseEnter={(e) => setBellTooltip({ x: e.clientX, y: e.clientY })}
                onMouseMove={(e) => setBellTooltip({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setBellTooltip(null)}
                onClick={handleNoticeIconClick}
              >
                <Bell 
                  size={20} 
                  color={deviceNoticeStatus === 'expired' ? 'var(--md-danger)' : 'var(--md-warning)'} 
                  className={deviceNoticeStatus === 'expired' ? "dav-bell-expired animate-pulse" : ""} 
                />
              </button>
              {bellTooltip && noticeTooltipText && noticeTooltipText.length > 0 && ReactDOM.createPortal(
                <div
                  className="dav-bell-tooltip-floating"
                  style={{
                    ...getFloatingTooltipStyle(bellTooltip.x, bellTooltip.y),
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {noticeTooltipText}
                </div>,
                document.body
              )}
            </>
          )}
          {/* dav-daily-reminder-tooltip : Tooltip nhắc nhở hàng ngày */}
          {activeDailyReminders.length > 0 && (
            <div className="dav-daily-reminder-tooltip">
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
              >
                Đóng
              </button>
            </div>
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
                    const streakDays = countConsecutiveDays(todayStr, loginDates);
                    line1 = `Online: Hôm nay (${formatStreakDays(streakDays)})`;
                  } else if (diffDays === 1) {
                    const streakDays = countConsecutiveDays(yesterdayStr, loginDates);
                    line1 = `Online: Hôm qua (${formatStreakDays(streakDays)})`;
                  } else if (diffDays >= 2 && diffDays <= 7) {
                    line1 = `Offline: ${diffDays} ngày (Online lần cuối: ${formattedLastLogin})`;
                  } else {
                    line1 = `Offline: Online lần cuối: ${formattedLastLogin}`;
                  }
                }

                const statusTooltip = getAccountStatusTooltip(acc);
                const details: React.ReactNode[] = [];
                if (statusTooltip) {
                  details.push(
                    <span 
                      key="status" 
                      style={{ color: acc.status === 'Risk' ? '#f97316' : undefined }}
                    >
                      {statusTooltip}
                    </span>
                  );
                }
                if (acc.notice) {
                  const title = acc.notice.title || '';
                  const isAutoRiskNotice = acc.status === 'Risk' && title === 'Account Risk';
                  
                  if (acc.notice.dueDate) {
                    const diffMs = acc.notice.dueDate - Date.now();
                    const isDue = diffMs <= 0;
                    const shouldShowNotice = !isAutoRiskNotice || isDue;
                    
                    if (shouldShowNotice) {
                      const timeStr = isDue ? 'đã đến hạn' : formatCountdown(diffMs);
                      details.push(
                        <span key="notice" style={{ color: '#f97316' }}>
                          Thông báo: {title} ({timeStr})
                        </span>
                      );
                    }
                  } else {
                    details.push(
                      <span key="notice" style={{ color: '#f97316' }}>
                        Thông báo: {title}
                      </span>
                    );
                  }
                }
                
                const accName = acc.name || acc.phone || acc.nickname || 'Không tên';
                const nameColor = getAccountListNameColor(acc);

                return ReactDOM.createPortal(
                  <div
                    className="dav-bell-tooltip-floating"
                    style={{
                      ...getFloatingTooltipStyle(accountHoverTooltip.x, accountHoverTooltip.y),
                      whiteSpace: 'pre-line'
                    }}
                  >
                    <div style={{ color: nameColor, fontWeight: 'bold', marginBottom: '4px' }}>
                      {accName}
                    </div>
                    <div>{line1}</div>
                    {details.map((detail, idx) => (
                      <div key={idx} style={{ marginTop: '2px' }}>{detail}</div>
                    ))}
                  </div>,
                  document.body
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
                        <span style={{ color: '#f97316' }}>: {riskText}</span>
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

                return ReactDOM.createPortal(
                  <div
                    className="dav-bell-tooltip-floating"
                    style={getFloatingTooltipStyle(badgeHoverTooltip.x, badgeHoverTooltip.y)}
                  >
                    {tooltipRows.length > 0 ? tooltipRows : 'Tổng số tài khoản trên điện thoại này'}
                  </div>,
                  document.body
                );
              })()}
        </div>
      </div>
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
                Cài đặt thông báo: <span style={{ fontWeight: 'bold', color: '#fff' }}>{selectedAccount.name || selectedAccount.phone || selectedAccount.nickname || 'Không tên'}</span>
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', textAlign: 'left' }}>Nội dung</span>
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
                  <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', textAlign: 'left' }}>Số ngày đếm ngược</span>
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
                  <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', textAlign: 'left' }}>Nhắc nhở hàng ngày</span>
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
                className="dav-edit-btn cancel" 
                style={{ background: '#64748b' }}
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
            <div className="dav-input-wrapper" style={{ marginTop: '10px' }}>
              <span 
                style={{ color: '#888', userSelect: 'none', fontSize: '11px', fontWeight: 'bold', marginLeft: '2px', cursor: 'default', display: 'inline-flex', alignItems: 'center' }}
              >
                Tên
              </span>
              <input 
                className="dav-transparent-input" 
                style={{ color: '#fff', fontWeight: 'bold' }}
                placeholder="Tên tài khoản"
                value={selectedAccount.name || ''}
                onChange={e => handleUpdateAccount(selectedAccount.id, { name: e.target.value })} 
              />
            </div>

            {/* Biệt danh (Nickname) */}
            <div className="dav-input-wrapper" style={{ marginTop: '10px' }}>
              <span 
                className="dav-identity-toggle"
                title={isIdentityHidden('nickname') ? 'Hiện biệt danh' : 'Ẩn biệt danh'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleIdentityHidden('nickname');
                }}
                style={{ color: '#888', userSelect: 'none', fontSize: '13px', fontWeight: 'bold', marginLeft: '2px', cursor: 'pointer' }}
              >
                @
              </span>
              <input 
                className="dav-transparent-input" 
                style={{ color: '#fff' }}
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
                <span
                  className="dav-identity-toggle"
                  title={isIdentityHidden('phone') ? 'Hiện số điện thoại' : 'Ẩn số điện thoại'}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleIdentityHidden('phone');
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                >
                  <Phone size={12} color="#ec4899" style={{ flexShrink: 0 }} />
                </span>
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
                />
              </div>
            )}

            {/* Email */}
            {!hideEmail && (
              <div className="dav-input-wrapper">
                <span
                  className="dav-identity-toggle"
                  title={isIdentityHidden('email') ? 'Hiện email' : 'Ẩn email'}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleIdentityHidden('email');
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                >
                  <Mail size={12} color="#9ca3af" style={{ flexShrink: 0 }} />
                </span>
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
                <div className="dav-stats-row">
                  {!hideQR ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <QrCode size={13} color="#ffffff" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 'bold', color: (selectedAccount.scanCount || 0) >= 3 ? '#ef4444' : '#ffffff' }}>
                        {selectedAccount.scanCount || 0}/3
                      </span>
                      {qrCountdownText && (
                        <span style={{ color: '#eab308', fontSize: '10px' }}>
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
                            <MapPin size={13} color="#eab308" style={{ flexShrink: 0 }} />
                            <span style={{ color: '#eab308', fontSize: '11px', fontWeight: '500' }}>
                              {formatCountdown(diffMs)}
                            </span>
                          </>
                        ) : (
                          <>
                            <MapPin size={13} color="#22c55e" style={{ flexShrink: 0 }} />
                            <span style={{ color: '#22c55e', fontSize: '11px', fontWeight: '500' }}>
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
                <span className="muted" style={{ color: '#666', fontStyle: 'italic', fontSize: '11px' }}>Chưa đặt thông báo</span>
              ) : (
                <span style={{ color: noticeStatus === 'expired' ? '#ef4444' : '#eab308', fontWeight: noticeStatus === 'expired' ? 'bold' : '500' }}>
                  {selectedAccount.notice?.title} {noticeStatus === 'expired' ? ': đã đến hạn' : `: ${noticeCountdownText}`}
                </span>
              )}
            </div>

            {/* input_created_at : Nhập ngày tạo tài khoản */}
            {!hideCreatedAt && (
              <div className="dav-centered-row">
                {!selectedAccount.createdAt || showDateInput ? (
                  <input 
                    type="text"
                    className="dav-centered-input" 
                    style={{ fontSize: '10px', width: '90px', padding: 0, color: '#fff', textAlign: 'center', background: 'transparent', border: 'none' }}
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
                    style={{ fontSize: '10px', color: isOverOneYear ? '#22c55e' : '#fff', cursor: 'pointer' }}
                    onClick={(e) => {
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

      {/* Context Menu Portal */}
      {ctxMenu && ReactDOM.createPortal(
        <div 
          ref={menuRef} 
          className={`dav-ctx-menu contextMenuPanel ${ctxMenu.x > window.innerWidth - 380 ? 'direction-left' : ''}`} 
          style={{ left: ctxMenu.x, top: ctxMenu.y }} 
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onContextMenu={e => e.stopPropagation()}
        >
          
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
                    Open Nearby
                  </button>
                  <button 
                    className="dav-ctx-item" 
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const startDate = Date.now();
                      const dueDate = startDate + 31 * 24 * 60 * 60 * 1000;
                      handleUpdateAccount(selectedAccount.id, {
                        status: 'Risk',
                        nearbyPeopleEnabled: false,
                        nearbyPeopleDueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
                        notice: {
                          title: 'Dưỡng Hiện',
                          content: 'Dưỡng Hiện',
                          days: 31,
                          startDate,
                          dueDate
                        }
                      }, 'Risk Nearby');
                      setCtxMenu(null);
                    }}
                  >
                    Risk Nearby
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
        </div>,
        document.body
      )}

      {pendingDeleteAccount && ReactDOM.createPortal(
        <div className="confirmOverlay" style={{ zIndex: 29000, background: 'transparent' }} onPointerDown={e => { e.preventDefault(); e.stopPropagation(); }}>
          <div className="confirmPanel" style={{ minWidth: 380, maxWidth: 480, zIndex: 29001 }} onPointerDown={e => e.stopPropagation()}>
            <div className="confirmTitle">Xác nhận xoá tài khoản</div>
            <div className="confirmText">
              Bạn có chắc chắn muốn xoá tài khoản <strong>{pendingDeleteAccount.name}</strong>?
              Hành động này sẽ xoá toàn bộ dữ liệu tài khoản và không thể hoàn tác.
            </div>
            <div className="confirmActions">
              <button 
                type="button" 
                className="modalBtn" 
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPendingDeleteAccount(null);
                }}
              >
                Huỷ
              </button>
              <button 
                type="button" 
                className="modalBtnDanger" 
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteAccount(pendingDeleteAccount.id);
                  setPendingDeleteAccount(null);
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {historyModalAccount && ReactDOM.createPortal(
        <div
          className="confirmOverlay dav-history-overlay"
        >
          <div
            className="confirmPanel dav-history-panel"
            onPointerDown={(e) => e.stopPropagation()}
          >
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
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {pendingResetHistoryAccount && ReactDOM.createPortal(
        <div className="confirmOverlay" style={{ zIndex: 29000, background: 'transparent' }} onPointerDown={e => { e.preventDefault(); e.stopPropagation(); }}>
          <div className="confirmPanel" style={{ minWidth: 380, maxWidth: 480, zIndex: 29001 }} onPointerDown={e => e.stopPropagation()}>
            <div className="confirmTitle">Reset lịch sử tài khoản</div>
            <div className="confirmText">
              Bạn có chắc chắn muốn reset toàn bộ lịch sử trạng thái của tài khoản <strong>{getAccountDisplayName(pendingResetHistoryAccount)}</strong>?
              Hành động này sẽ xoá sạch lịch sử đã ghi và không thể hoàn tác.
            </div>
            <div className="confirmActions">
              <button 
                type="button" 
                className="modalBtn" 
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPendingResetHistoryAccount(null);
                }}
              >
                Huỷ
              </button>
              <button 
                type="button" 
                className="modalBtnDanger" 
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUpdateAccount(pendingResetHistoryAccount.id, { history: [] });
                  setPendingResetHistoryAccount(null);
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Account Action Menu Portal */}
      {accountActionMenu && ReactDOM.createPortal(
        <div
          ref={accountActionMenuRef}
          className={`dav-ctx-menu contextMenuPanel dav-account-action-menu ${accountActionMenu.x > window.innerWidth - 380 ? 'direction-left' : ''}`}
          style={{ left: accountActionMenu.x, top: accountActionMenu.y }}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onContextMenu={e => e.stopPropagation()}
        >
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
          >
            Copy ID ( User name)
          </button>

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
          >
            Thông báo
          </button>

          {activeTab === 'wechat' && (
            <div 
              className="dav-ctx-submenu-container"
              onMouseEnter={() => setShowSetSubmenu(true)}
              onMouseLeave={() => setShowSetSubmenu(false)}
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
                >
                  {getAppTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

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
          >
            Di chuyển tài khoản
          </button>
        </div>,
        document.body
      )}
      {/* Move Modal Portal */}
      {moveModal && ReactDOM.createPortal(
        <div 
          className="confirmOverlay" 
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        >
          <div 
            className="confirmPanel confirmPanel--compact" 
            style={{ minWidth: '280px' }}
            onMouseDown={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
          >
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
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Notice Edit Modal Portal */}
      {noticeEditModal && ReactDOM.createPortal(
        <div 
          className="confirmOverlay" 
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          style={{ zIndex: 28000 }}
        >
          <div 
            className="confirmPanel confirmPanel--compact" 
            style={{ minWidth: '360px' }}
            onMouseDown={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
          >
            <div className="confirmTitle" style={{ display: 'flex', alignItems: 'center', width: '100%', borderBottom: '1px solid var(--md-border)', paddingBottom: '6px', marginBottom: '8px', justifyContent: 'flex-start' }}>
              <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--md-text)' }}>
                Cài đặt thông báo: <span style={{ fontWeight: 'bold', color: '#fff' }}>{noticeEditModal.account.name || noticeEditModal.account.phone || noticeEditModal.account.nickname || 'Không tên'}</span>
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', textAlign: 'left' }}>Nội dung</span>
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
                  <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', textAlign: 'left' }}>Số ngày đếm ngược</span>
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
                  <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', textAlign: 'left' }}>Nhắc nhở hàng ngày</span>
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
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});



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
  setActiveTab
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

  const [davGroupDeviceDropdown, setDavGroupDeviceDropdown] = useState<{
    udid: string;
    groupIdx: number;
    x: number;
    y: number;
  } | null>(null);

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

  useEffect(() => {
    if (!davGroupDeviceDropdown) return;
    const handleOutsideClick = () => {
      setDavGroupDeviceDropdown(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [davGroupDeviceDropdown]);

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
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    
    for (const udid of registeredUdids) {
      const d = getDeviceAccountDataFromVault(vault, udid);
      const accounts = d.platforms[activeTab] || [];
      total += accounts.length;
      for (const acc of accounts) {
        if (acc.createdAt) {
          if ((Date.now() - acc.createdAt) >= oneYearMs) {
            oneYear++;
          } else if ((Date.now() - acc.createdAt) < thirtyDaysMs) {
            newMonth++;
          }
        } else if ((acc as any).isOneYearOld === true) {
          oneYear++;
        } else if ((acc as any).isNew === true) {
          newMonth++;
        }
        
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
      <div className={`dav-overlay ${panelOpen ? 'is-open' : 'is-hidden'}`}>
      <div 
        ref={floatingPanelRef}
        className="dav-floating-panel" 
        style={dragPos ? { position: 'absolute', left: `${dragPos.x}px`, top: `${dragPos.y}px`, transform: 'none' } : {}}
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
        >
          <div className="dav-floating-title-left" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <span className="dav-floating-title">Quản lý tài khoản</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 16 }}>
              <span style={{ fontSize: 11, color: 'var(--md-muted)', userSelect: 'none' }}>Ẩn Tên</span>
              <button
                type="button"
                className={`dav-toggle-switch ${hideName ? 'on' : ''}`}
                style={{ width: 34, height: 18 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const nextVal = !hideName;
                  setHideName(nextVal);
                  localStorage.setItem('monviewphone:dav-hide-name', String(nextVal));
                  saveBackendSetting('monviewphone:dav-hide-name', String(nextVal));
                  window.dispatchEvent(new CustomEvent('monviewphone:dav-hide-settings-changed'));
                }}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <div className="dav-toggle-knob" style={{ width: 12, height: 12, top: 2, left: hideName ? 18 : 2 }} />
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="dav-floating-platform-select" style={{ marginRight: 4 }}>
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
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                className="dav-floating-platform-btn-add"
                onClick={() => setShowAddPlatformModal(true)}
                title="Thêm nhóm mới"
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
            >
              <Settings size={15} />
            </button>
            <button className="dav-floating-close-btn" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Thanh lọc statistics */}
        <div className="dav-stats-container">
          <div className="dav-stats-row-global">
            <span className="dav-stats-label">Tài khoản:</span>
            <span className="dav-stats-val-total">{totalAccs}</span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'one_year' ? 'active' : ''}`} onClick={() => handleFilterClick('one_year')}>
              TK 1 năm: <strong style={{ color: '#fff' }}>{oneYearCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'new_month' ? 'active' : ''}`} onClick={() => handleFilterClick('new_month')}>
              TK mới: <strong style={{ color: '#fff' }}>{newMonthCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'die' ? 'active' : ''}`} onClick={() => handleFilterClick('die')}>
              TK Die: <strong style={{ color: 'var(--md-danger)' }}>{dieCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'risk' ? 'active' : ''}`} onClick={() => handleFilterClick('risk')}>
              TK Risk: <strong style={{ color: '#f97316' }}>{riskCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'unverified' ? 'active' : ''}`} onClick={() => handleFilterClick('unverified')}>
              UnVerify: <strong style={{ color: 'var(--md-warning)' }}>{unverifiedCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'incomplete_info' ? 'active' : ''}`} onClick={() => handleFilterClick('incomplete_info')}>
              Thiếu Info: <strong style={{ color: '#ffffff' }}>{incompleteInfoCount}</strong>
            </span>
          </div>
          
          <div className="dav-stats-row-global">
            <span className="dav-stats-label">Thiết bị:</span>
            <span className="dav-stats-val-total">{totalDevices}</span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'wechat_scan_qr' ? 'active' : ''}`} onClick={() => handleFilterClick('wechat_scan_qr')}>
              Scan QR: <strong style={{ color: '#ffffff' }}>{scanQRCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'has_notice' ? 'active' : ''}`} onClick={() => handleFilterClick('has_notice')}>
              Thông báo: <strong style={{ color: 'var(--md-warning)' }}>{hasNoticeCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'nearby_people' ? 'active' : ''}`} onClick={() => handleFilterClick('nearby_people')}>
              Nearby People: <strong style={{ color: '#3b82f6' }}>{nearbyPeopleCount}</strong>
            </span>
          </div>
        </div>

        {/* Thanh tìm kiếm ngay phía dưới */}
        <div className="dav-search-box-global">
          <Search size={14} />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Tìm theo Tên, Nickname, SĐT, Email..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
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
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDavExpandedGroupIdx(isExpanded ? null : idx);
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
                            ▾
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
                                    className={`dav-saved-group-device-cell ${isOnline ? 'online' : 'offline'} ${matchedAccount ? 'has-set' : ''}`}
                                    title={`${uid}${accountName ? ` - WeChat: ${accountName}` : ''}`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setDavGroupDeviceDropdown({
                                        udid: uid,
                                        groupIdx: idx,
                                        x: rect.left,
                                        y: rect.bottom + window.scrollY,
                                      });
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
        <div className="confirmOverlay" style={{ zIndex: 28000 }} onMouseDown={() => {
          setShowAddPlatformModal(false);
          setNewPlatformName('');
          setAddPlatformError('');
        }}>
          <div className="confirmPanel" style={{ minWidth: 380, maxWidth: 480, zIndex: 28001 }} onMouseDown={e => e.stopPropagation()}>
            <div className="confirmTitle">Thêm nhóm mới</div>
            <div className="confirmText">
              <label className="modalLabelSmall" style={{ display: 'block', marginBottom: 8 }}>Tên nhóm mới</label>
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
                <div style={{ color: 'var(--md-danger)', fontSize: 11, marginTop: 6 }}>
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
                style={{
                  opacity: newPlatformName.trim() ? 1 : 0.5,
                  cursor: newPlatformName.trim() ? 'pointer' : 'not-allowed'
                }}
                disabled={!newPlatformName.trim()}
                onClick={handleConfirmAddPlatform}
              >
                Xác Nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {platformCtxMenu && (
        <div 
          ref={platformCtxMenuRef}
          className="dav-ctx-menu contextMenuPanel" 
          style={{ 
            left: platformCtxMenu.x, 
            top: platformCtxMenu.y, 
            zIndex: 29000
          }}
          onContextMenu={e => e.preventDefault()}
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
        </div>
      )}

      {pendingDeletePlatform && (
        <div className="confirmOverlay" style={{ zIndex: 28000 }} onMouseDown={() => setPendingDeletePlatform(null)}>
          <div className="confirmPanel" style={{ minWidth: 380, maxWidth: 480, zIndex: 28001 }} onMouseDown={e => e.stopPropagation()}>
            <div className="confirmTitle">Xác nhận xoá nhóm</div>
            <div className="confirmText">
              Bạn có chắc chắn muốn xoá nhóm <strong>{platforms.find(p => p.id === pendingDeletePlatform)?.label || pendingDeletePlatform}</strong>?
              Tất cả tài khoản và dữ liệu thuộc nhóm này sẽ bị xoá vĩnh viễn khỏi toàn bộ thiết bị.
            </div>
            <div className="confirmActions">
              <button type="button" className="modalBtn" onClick={() => setPendingDeletePlatform(null)}>Huỷ</button>
              <button type="button" className="modalBtnDanger" onClick={handleConfirmDeletePlatform}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cài đặt Quản lý tài khoản */}
      {showAccountSettingsModal && ReactDOM.createPortal(
        <div
          className="confirmOverlay dav-settings-overlay"
          style={{ zIndex: 30000 }}
          onMouseDown={e => e.stopPropagation()}
        >
          <div
            className="confirmPanel dav-settings-panel"
            style={{ minWidth: 420, maxWidth: 520 }}
            onMouseDown={e => e.stopPropagation()}
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
                >
                  <strong>Sắp xếp ưu tiên Nearby</strong>
                </button>

                {/* btn_dav_settings_hide_unmatched : Chọn mode ẩn title không liên quan */}
                <button
                  type="button"
                  className={`dav-settings-choice ${nearbyFilterMode === 'hide_unmatched' ? 'active' : ''}`}
                  onClick={() => updateNearbyFilterMode('hide_unmatched')}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: hidePhone ? 'var(--md-info)' : 'var(--md-muted)' }}>
                    {hidePhone ? 'On' : 'Off'}
                  </span>
                  <button
                    type="button"
                    className={`dav-toggle-switch ${hidePhone ? 'on' : ''}`}
                    onClick={() => updateHideSetting('monviewphone:dav-hide-phone', !hidePhone, setHidePhone)}
                  >
                    <div className="dav-toggle-knob" />
                  </button>
                </div>
              </div>

              {/* btn_dav_settings_hide_email : Bật/Tắt ẩn Email */}
              <div className="dav-settings-toggle-row">
                <span className="dav-settings-toggle-label">Ẩn Email</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: hideEmail ? 'var(--md-info)' : 'var(--md-muted)' }}>
                    {hideEmail ? 'On' : 'Off'}
                  </span>
                  <button
                    type="button"
                    className={`dav-toggle-switch ${hideEmail ? 'on' : ''}`}
                    onClick={() => updateHideSetting('monviewphone:dav-hide-email', !hideEmail, setHideEmail)}
                  >
                    <div className="dav-toggle-knob" />
                  </button>
                </div>
              </div>

              {/* btn_dav_settings_hide_qr : Bật/Tắt ẩn QR */}
              <div className="dav-settings-toggle-row">
                <span className="dav-settings-toggle-label">Ẩn QR</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: hideQR ? 'var(--md-info)' : 'var(--md-muted)' }}>
                    {hideQR ? 'On' : 'Off'}
                  </span>
                  <button
                    type="button"
                    className={`dav-toggle-switch ${hideQR ? 'on' : ''}`}
                    onClick={() => updateHideSetting('monviewphone:dav-hide-qr', !hideQR, setHideQR)}
                  >
                    <div className="dav-toggle-knob" />
                  </button>
                </div>
              </div>

              {/* btn_dav_settings_hide_created_at : Bật/Tắt ẩn Ngày tạo */}
              <div className="dav-settings-toggle-row">
                <span className="dav-settings-toggle-label">Ẩn Ngày Tạo</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: hideCreatedAt ? 'var(--md-info)' : 'var(--md-muted)' }}>
                    {hideCreatedAt ? 'On' : 'Off'}
                  </span>
                  <button
                    type="button"
                    className={`dav-toggle-switch ${hideCreatedAt ? 'on' : ''}`}
                    onClick={() => updateHideSetting('monviewphone:dav-hide-created-at', !hideCreatedAt, setHideCreatedAt)}
                  >
                    <div className="dav-toggle-knob" />
                  </button>
                </div>
              </div>
            </div>

            {/* Section: Overlay Header settings */}
            <div className="dav-settings-section">
              <div className="dav-settings-section-title">Overlay Header</div>
              <div style={{ fontSize: 11, color: 'var(--md-muted)', marginBottom: 8 }}>Áp dụng khi Overlay Header đang bật</div>

              {/* btn_dav_settings_header_hide_order : Ẩn số máy trên header strip */}
              <div className="dav-settings-toggle-row">
                <span className="dav-settings-toggle-label">Ẩn số máy</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: headerHideOrder ? 'var(--md-info)' : 'var(--md-muted)' }}>
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
              <div className="dav-settings-toggle-row" style={{ marginTop: 8 }}>
                <span className="dav-settings-toggle-label">Ẩn tên</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: hideName ? 'var(--md-info)' : 'var(--md-muted)' }}>
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
              <div className="dav-settings-toggle-row" style={{ marginTop: 8 }}>
                <span className="dav-settings-toggle-label">Hiển thị: Nền tối giản</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: headerMinimalBg ? 'var(--md-info)' : 'var(--md-muted)' }}>
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
        </div>,
        document.body
      )}
      {davGroupDeviceDropdown && (() => {
        const devData = getDeviceAccountData(davGroupDeviceDropdown.udid);
        const accounts = devData?.platforms?.['wechat'] || [];
        const group = savedGroups[davGroupDeviceDropdown.groupIdx];
        const groupSelectedAccounts = group?.selectedAccounts || {};
        const selectedId = groupSelectedAccounts[davGroupDeviceDropdown.udid];

        return ReactDOM.createPortal(
          <div 
            className="dav-title-account-dropdown contextMenuPanel davGroupDeviceDropdownPanel" 
            style={{
              position: 'fixed',
              left: davGroupDeviceDropdown.x,
              top: davGroupDeviceDropdown.y,
              right: 'auto',
              zIndex: 29000,
              minWidth: 200,
              maxHeight: 300,
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {accounts.length === 0 ? (
              <div className="dav-title-empty" style={{ padding: '8px 12px', color: 'var(--md-muted)', fontSize: 13, fontStyle: 'italic', textAlign: 'center' }}>Không có tài khoản</div>
            ) : (
              accounts.map((account) => {
                const aLoginDates = Array.from(new Set(
                  (account.history || [])
                    .filter(h => h.action === 'Login')
                    .map(h => getLocalDateString(h.timestamp))
                ));
                const todayStr = getLocalDateString(Date.now());
                const aIsLoggedInToday = aLoginDates.includes(todayStr);

                return (
                  <button
                    key={account.id}
                    type="button"
                    className={`dav-title-account-item ${selectedId === account.id ? 'active' : ''}`}
                    onClick={(e) => {
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
                        saveDeviceAccountData(davGroupDeviceDropdown.udid, newData);
                      }
                      
                      // Update group selection
                      const nextGroups = savedGroups.map((g, i) => {
                        if (i !== davGroupDeviceDropdown.groupIdx) return g;
                        const selAcc = { ...(g.selectedAccounts || {}) };
                        if (isDeselect) {
                          delete selAcc[davGroupDeviceDropdown.udid];
                        } else {
                          selAcc[davGroupDeviceDropdown.udid] = account.id;
                        }
                        return { ...g, selectedAccounts: selAcc };
                      });
                      setSavedGroups(nextGroups);
                      localStorage.setItem('savedGroups', JSON.stringify(nextGroups));
                      
                      // Trigger state refresh
                      setVault(loadDeviceAccountVault());
                      
                      // Dispatch events to refresh other components
                      window.dispatchEvent(new CustomEvent('saved-groups-updated'));
                      window.dispatchEvent(new CustomEvent('monviewphone:dav-hide-settings-changed'));
                      
                      setDavGroupDeviceDropdown(null);
                    }}
                  >
                    {renderAppTypeIcon(account.appType, aIsLoggedInToday)}
                    <span className="dav-title-account-name">{account.name || account.phone || account.nickname || 'Không tên'}</span>
                  </button>
                );
              })
            )}
          </div>,
          document.body
        );
      })()}
    </>,
    document.body
  );
}
