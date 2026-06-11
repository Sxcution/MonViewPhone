import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, Plus, MoreVertical, Smartphone, Info, Calendar, Shield, Activity, Phone, Hash, Bell, MapPin, QrCode, Mail, Users, Trash2, Briefcase, Folder, Settings } from 'lucide-react';
import { getNearbyAccountState, hasNearbyRelevantAccount, hasNearbyEligibleAccount, getNearbyAccountGroupState } from '@/lib/deviceAccountNearby';
import { 
  getDeviceAccountData, 
  saveDeviceAccountData, 
  loadDeviceAccountVault,
  getDeviceAccountDataFromVault,
  VaultData,
  DeviceAccountData,
  PlatformType, 
  Account, 
  WeChatAccount, 
  createNewAccount,
  getSavedPlatforms,
  saveSavedPlatforms,
  saveDeviceAccountVault
} from '@/lib/deviceAccountVault';

type DeviceAccountOverlayProps = {
  open: boolean;
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

function getElapsedDaysSince(ts?: number | null): number {
  if (!ts) return 0;
  return Math.max(0, Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24)));
}

function getAccountListNameColor(account: Account): string {
  if (account.status === 'Die') return '#ef4444';
  if (account.status === 'Risk') return '#f97316';

  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  const isOverOneYear = !!(
    account.isOneYearOld ||
    (account.createdAt && Date.now() - account.createdAt >= oneYearMs)
  );

  if (isOverOneYear) return '#22c55e';

  return '#ffffff';
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

function getAppTypeLabel(type?: 'main' | 'clone' | 'secure' | 'shelter') {
  if (type === 'clone') return 'Clone';
  if (type === 'secure') return 'Secure Folder';
  if (type === 'shelter') return 'Shelter';
  return 'Main';
}

function renderAppTypeIcon(type?: 'main' | 'clone' | 'secure' | 'shelter') {
  if (!type || type === 'main') return null;
  
  if (type === 'shelter') {
    return (
      <span title="Shelter" style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
        <Briefcase 
          size={13} 
          color="#ffffff" 
          style={{ flexShrink: 0, marginLeft: '4px' }} 
        />
      </span>
    );
  }
  
  if (type === 'secure') {
    return (
      <span title="Secure Folder" style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
        <Folder 
          size={13} 
          color="#ffffff" 
          style={{ flexShrink: 0, marginLeft: '4px' }} 
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
          stroke="#ffffff" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          style={{ flexShrink: 0, marginLeft: '4px' }}
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
    return (
      <span title="Còn tối đa 3 ngày để hiển thị Nearby People" style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, marginLeft: 4 }}>
        <MapPin size={13} color="#f97316" />
      </span>
    );
  }

  return null;
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
  nearbyAutoOpenEnabled
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
}) {
  const [data, setData] = useState(initialData);
  const [platforms, setPlatforms] = useState(() => getSavedPlatforms());
  const [bellTooltip, setBellTooltip] = useState<{ x: number; y: number } | null>(null);
  const [hiddenIdentityFields, setHiddenIdentityFields] = useState<Record<string, boolean>>({});
  const [pendingDeleteAccount, setPendingDeleteAccount] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setPlatforms(getSavedPlatforms());
    };
    window.addEventListener('device-account-platforms-updated', handleUpdate);
    return () => window.removeEventListener('device-account-platforms-updated', handleUpdate);
  }, []);

  const [ctxMenu, setCtxMenu] = useState<{ x: number, y: number, accountId: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeLevel1, setActiveLevel1] = useState<'tai_khoan' | 'trang_thai' | 'nearby' | 'quet_qr' | null>(null);
  const [activeLevel2, setActiveLevel2] = useState<string | null>(null);
  
  // Sync state data when initialData prop changes (synchronized from parent vault update)
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Load savedGroups and reactive listener
  const [savedGroups, setSavedGroups] = useState<{ name: string, udids: string[] }[]>(() => {
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
    const gData = getDeviceAccountData(udid);
    const accounts = gData.platforms[activeTab] || [];
    for (const acc of accounts) {
      list.push({ udid, order: gOrder, account: acc });
    }
    return list.sort((a, b) => (a.account.name || '').localeCompare(b.account.name || ''));
  }, [udid, activeTab, orderMap]);

  const [accountTitleDropdownOpen, setAccountTitleDropdownOpen] = useState(false);
  const accountTitleDropdownRef = useRef<HTMLDivElement>(null);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const platformDropdownRef = useRef<HTMLDivElement>(null);
  const autoOpenedNearbyDropdownRef = useRef(false);

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
  const accountActionMenuRef = useRef<HTMLDivElement>(null);
  const [moveModal, setMoveModal] = useState<{ sourceUdid: string, account: Account } | null>(null);
  const [targetOrderStr, setTargetOrderStr] = useState('');
  const [moveError, setMoveError] = useState('');

  useEffect(() => {
    if (!accountTitleDropdownOpen && !platformDropdownOpen && !accountActionMenu) return;
    const hide = (e: MouseEvent) => {
      const target = e.target as Node;
      if (accountTitleDropdownRef.current?.contains(target)) return;
      if (platformDropdownRef.current?.contains(target)) return;
      if (accountActionMenuRef.current?.contains(target)) return;
      // Khi filter Nearby đang bật và dropdown được ghim bởi auto-open,
      // click ngoài không đóng accountTitleDropdown — chỉ đóng khi filter tắt.
      if (nearbyAutoOpenEnabled && autoOpenedNearbyDropdownRef.current) {
        setPlatformDropdownOpen(false);
        setAccountActionMenu(null);
        return;
      }
      setAccountTitleDropdownOpen(false);
      setPlatformDropdownOpen(false);
      setAccountActionMenu(null);
    };
    window.addEventListener('mousedown', hide);
    return () => window.removeEventListener('mousedown', hide);
  }, [accountTitleDropdownOpen, platformDropdownOpen, accountActionMenu, nearbyAutoOpenEnabled]);

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
    saveDeviceAccountData(udid, newData);
    window.dispatchEvent(new Event('device-account-updated'));
  };

  const activeAccounts = data.platforms[activeTab] || [];
  const selectedAccountId = data.selectedAccountByPlatform[activeTab];
  let selectedAccount = activeAccounts.find(a => a.id === selectedAccountId) || activeAccounts[0];

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
  let remainingDays = 0;

  if (notice && notice.dueDate) {
    const diffMs = notice.dueDate - Date.now();
    if (diffMs <= 0) {
      noticeStatus = 'expired';
    } else {
      noticeStatus = 'counting';
      remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
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
      return `${accName} : ${acc.notice?.title || ''}`;
    }).join('\n');
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
      const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      qrCountdownText = `(${remainingDays} ngày)`;
    }
  }

  const [showNoticeEdit, setShowNoticeEdit] = useState(false);
  const [editNoticeTitle, setEditNoticeTitle] = useState('');
  const [editNoticeDays, setEditNoticeDays] = useState('');
  const [showNameStatusDropdown, setShowNameStatusDropdown] = useState(false);
  const [showDateInput, setShowDateInput] = useState(false);
  const [dateText, setDateText] = useState('');

  // Sync edit state when selected account changes
  useEffect(() => {
    if (selectedAccount) {
      setEditNoticeTitle(selectedAccount.notice?.title || '');
      setEditNoticeDays(selectedAccount.notice?.days?.toString() || '');
      
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
      setDateText('');
    }
    setShowNoticeEdit(false);
    setShowNameStatusDropdown(false);
    setShowDateInput(false);
  }, [selectedAccount]);

  // Close name status dropdown on outside click
  useEffect(() => {
    if (!showNameStatusDropdown) return;
    const hide = () => setShowNameStatusDropdown(false);
    window.addEventListener('click', hide);
    return () => window.removeEventListener('click', hide);
  }, [showNameStatusDropdown]);

  const handleSaveNotice = () => {
    const daysNum = parseInt(editNoticeDays, 10);
    if (!editNoticeTitle || isNaN(daysNum) || daysNum <= 0) {
      return;
    }
    const startDate = Date.now();
    const dueDate = startDate + daysNum * 24 * 60 * 60 * 1000;

    handleUpdateAccount(selectedAccount.id, {
      notice: {
        title: editNoticeTitle,
        content: editNoticeTitle,
        days: daysNum,
        startDate,
        dueDate
      } as any
    });
    setShowNoticeEdit(false);
  };

  const handleClearNotice = () => {
    handleUpdateAccount(selectedAccount.id, { notice: null });
    setEditNoticeTitle('');
    setEditNoticeDays('');
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

  const handleUpdateAccount = (id: string, updates: Partial<Account>) => {
    const newData = {
      ...data,
      platforms: {
        ...data.platforms,
        [activeTab]: (data.platforms[activeTab] || []).map(a => {
          if (a.id === id) {
            const updated = { ...a, ...updates };
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
    const newData = {
      ...data,
      selectedAccountByPlatform: {
        ...data.selectedAccountByPlatform,
        [activeTab]: id
      }
    };
    updateData(newData);
    setCtxMenu(null);
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
    window.addEventListener('click', hide);
    return () => window.removeEventListener('click', hide);
  }, [ctxMenu]);

  // Reset submenu states when context menu is closed
  useEffect(() => {
    if (!ctxMenu) {
      setActiveLevel1(null);
      setActiveLevel2(null);
    }
  }, [ctxMenu]);

  const getAccountStatusClass = (account: Account) => {
    if (activeTab === 'wechat') {
      // Điều kiện Nearby: tài khoản PHẢI đủ 1 năm tuổi
      const oneYearMs = 365 * 24 * 60 * 60 * 1000;
      const accountIsOverOneYear = !!(account.isOneYearOld || (account.createdAt && (Date.now() - account.createdAt) >= oneYearMs));
      if (accountIsOverOneYear) {
        if (account.nearbyPeopleDueDate) {
          if (account.nearbyPeopleDueDate <= Date.now()) return 'nearby';
        } else {
          return 'nearby';
        }
      }
    }
    if (account.status === 'Die') return 'die';
    if (account.status === 'Risk') return 'risk';
    if (account.status === 'Verify' || account.status === 'Unverified') return 'verify';
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

  const shieldColor = useMemo(() => {
    if (!selectedAccount) return '#fff';
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

  const activePlatformLabel = platforms.find(p => p.id === activeTab)?.label || 'WeChat';

  return (
    <div className="dav-panel" onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}>
      <div className="dav-panel-header">
        <div className="dav-panel-title-left">
          <span className={`dav-order ${panelHasNearbyEligibleAccount ? 'dav-order-nearby-eligible' : ''}`}>
            {order.toString().padStart(2, '0')}
          </span>
          {deviceNoticeStatus !== 'none' && (
            <>
              <button
                type="button"
                className="dav-bell-btn"
                onMouseEnter={(e) => setBellTooltip({ x: e.clientX, y: e.clientY })}
                onMouseMove={(e) => setBellTooltip({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setBellTooltip(null)}
                onClick={handleNoticeIconClick}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  height: 16,
                  width: 16
                }}
              >
                <Bell 
                  size={13} 
                  color={deviceNoticeStatus === 'expired' ? 'var(--md-danger)' : 'var(--md-warning)'} 
                  className={deviceNoticeStatus === 'expired' ? "dav-bell-expired animate-pulse" : ""} 
                />
              </button>
              {bellTooltip && noticeTooltipText && ReactDOM.createPortal(
                <div
                  className="dav-bell-tooltip-floating"
                  style={{
                    left: bellTooltip.x,
                    top: bellTooltip.y,
                  }}
                >
                  {noticeTooltipText}
                </div>,
                document.body
              )}
            </>
          )}
        </div>

        <div className="dav-panel-title-right">
          <div className="dav-title-dropdown-wrap" ref={accountTitleDropdownRef}>
            <button
              type="button"
              className={[
                'dav-total-badge',
                panelNearbyAccountState === 'eligible' ? 'nearby-eligible' : '',
                panelNearbyAccountState === 'upcoming' ? 'nearby-upcoming' : '',
              ].filter(Boolean).join(' ')}
              title="Tong so tai khoan tren dien thoai nay"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setAccountTitleDropdownOpen(v => !v);
                setPlatformDropdownOpen(false);
              }}
            >
              {totalAccounts}
            </button>
            {accountTitleDropdownOpen && (
              <div className="dav-title-account-dropdown contextMenuPanel">
                <div className="dav-title-dropdown-heading">Tai khoan nhom hien tai</div>
                {groupAccounts.length === 0 ? (
                  <div className="dav-title-empty">Khong co tai khoan</div>
                ) : (
                  groupAccounts.map(({ udid: accUdid, account }) => (
                    <button
                      key={account.id}
                      type="button"
                      className={`dav-title-account-item ${selectedAccount?.id === account.id ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSetMain(account.id);
                        setAccountTitleDropdownOpen(false);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAccountActionMenu({ x: e.clientX, y: e.clientY, sourceUdid: accUdid, account });
                      }}
                    >
                      <span className={`dav-account-state-dot ${getAccountStatusClass(account)}`} />
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
                        {activeTab === 'wechat' && renderNearbyAccountIcon(account)}
                        {renderAppTypeIcon(account.appType)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
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
          /* page_notice_edit : Giao diện cài đặt thông báo */
          <div className="dav-notice-edit-form" onContextMenu={e => e.stopPropagation()}>
            <div className="dav-edit-header" style={{ justifyContent: 'center' }}>
              <span>Cài đặt thông báo</span>
            </div>
            
            <div className="dav-field-row">
              <span className="dav-field-label">Nội dung</span>
              <input 
                className="dav-input" 
                placeholder="Ví dụ: WeChat hỗ trợ" 
                value={editNoticeTitle} 
                onChange={e => setEditNoticeTitle(e.target.value)} 
                autoFocus
              />
            </div>
            
            <div className="dav-field-row">
              <span className="dav-field-label">Số ngày</span>
              <input 
                type="number"
                className="dav-input" 
                placeholder="Số ngày đếm ngược (VD: 3)" 
                value={editNoticeDays} 
                onChange={e => setEditNoticeDays(e.target.value)} 
              />
            </div>
            
            <div className="dav-edit-actions">
              <button 
                className="dav-edit-btn cancel" 
                style={{ background: '#64748b' }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowNoticeEdit(false);
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
            <div className="dav-input-wrapper" style={{ marginTop: '10px', position: 'relative' }}>
              <Shield 
                size={12} 
                color={shieldColor} 
                style={{ flexShrink: 0, cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNameStatusDropdown(!showNameStatusDropdown);
                }}
              />
              <input 
                className="dav-transparent-input" 
                style={{ color: nameColor, fontWeight: 'bold', fontSize: '13px' }}
                placeholder="Tên tài khoản"
                value={selectedAccount.name || ''} 
                onChange={e => handleUpdateAccount(selectedAccount.id, { name: e.target.value })} 
              />
              
              {showNameStatusDropdown && (
                <div 
                  className="dav-name-status-dropdown"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 8,
                    background: '#252525',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    padding: '4px',
                    zIndex: 100,
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
                        onClick={() => {
                          handleUpdateAccount(selectedAccount.id, { status: 'Die' });
                          setShowNameStatusDropdown(false);
                        }}
                      >
                        Set Die
                      </button>
                      <button 
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
                        onClick={() => {
                          handleUpdateAccount(selectedAccount.id, { status: 'Risk' });
                          setShowNameStatusDropdown(false);
                        }}
                      >
                        Set Risk
                      </button>
                    </>
                  ) : (
                    <button 
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
                      onClick={() => {
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

            {/* Biệt danh (Nickname) */}
            <div className="dav-input-wrapper">
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

            {/* Email */}
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

            {/* Hàng QR Code & Nearby People */}
            <div className="dav-stats-row">
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

              {(() => {
                if (!isWeChat || !selectedAccount) return null;
                // Điều kiện bắt buộc: tài khoản phải đủ 1 năm tuổi mới hiển thị Nearby
                if (!isEligibleNearby) return null;
                const nearbyDays = selectedAccount.nearbyPeopleDueDate
                  ? Math.ceil((selectedAccount.nearbyPeopleDueDate - Date.now()) / (1000 * 60 * 60 * 24))
                  : 0;

                // Hide icon if remaining days > 7
                if (selectedAccount.nearbyPeopleDueDate && nearbyDays > 7) {
                  return null;
                }

                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {selectedAccount.nearbyPeopleDueDate && nearbyDays > 0 ? (
                      <>
                        <MapPin size={13} color="#eab308" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#eab308', fontSize: '11px', fontWeight: '500' }}>
                          {nearbyDays} ngày
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

            {/* Thông báo */}
            <div className="dav-notice-centered-row" onClick={() => setShowNoticeEdit(true)}>
              {noticeStatus === 'none' ? (
                <span className="muted" style={{ color: '#666', fontStyle: 'italic', fontSize: '11px' }}>Chưa đặt thông báo</span>
              ) : (
                <span style={{ color: noticeStatus === 'expired' ? '#ef4444' : '#eab308', fontWeight: noticeStatus === 'expired' ? 'bold' : '500' }}>
                  {selectedAccount.notice?.title} {noticeStatus === 'expired' ? ': đã đến hạn' : `: ${remainingDays} ngày`}
                </span>
              )}
            </div>

            {/* input_created_at : Nhập ngày tạo tài khoản */}
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
              <div className="dav-ctx-submenu" style={{ display: activeLevel1 === 'tai_khoan' ? 'flex' : 'none' }}>
                {activeAccounts.map(a => (
                  <button
                    key={a.id}
                    className={`dav-ctx-item ${a.id === selectedAccount.id ? 'active' : ''}`}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSetMain(a.id);
                      setCtxMenu(null);
                    }}
                  >
                    <span
                      style={{
                        fontWeight: a.id === selectedAccount.id ? 'bold' : 'normal',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        color: getAccountListNameColor(a),
                      }}
                    >
                      {a.name || a.phone || a.nickname || 'Tài khoản'}
                      {renderAppTypeIcon(a.appType)}
                    </span>
                  </button>
                ))}
                
                <div className="dav-ctx-divider" />
                
                <div 
                  className="dav-ctx-submenu-container"
                  onMouseEnter={() => setActiveLevel2('them_tai_khoan')}
                  onMouseLeave={() => setActiveLevel2(null)}
                >
                  <div className="dav-ctx-item dav-ctx-has-sub">
                    <Plus size={16} /> Thêm tài khoản
                    <div className="dav-ctx-submenu" style={{ display: activeLevel2 === 'them_tai_khoan' ? 'flex' : 'none' }}>
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

          {/* Submenu Trạng Thái */}
          <div 
            className="dav-ctx-submenu-container"
            onMouseEnter={() => setActiveLevel1('trang_thai')}
            onMouseLeave={() => setActiveLevel1(null)}
          >
            <div className="dav-ctx-item dav-ctx-has-sub">
              <Activity size={16} /> Trạng Thái
              <div className="dav-ctx-submenu" style={{ display: activeLevel1 === 'trang_thai' ? 'flex' : 'none' }}>
                <button 
                  className={`dav-ctx-item ${selectedAccount.status === 'Live' ? 'active' : ''}`} 
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUpdateAccount(selectedAccount.id, { status: 'Live' });
                    setCtxMenu(null);
                  }}
                >
                  <div className="dav-status-dot" style={{ background: '#22c55e' }} /> Set Live {selectedAccount.status === 'Live' ? '(Hiện tại)' : ''}
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
                  <div className="dav-status-dot" style={{ background: '#ef4444' }} /> Set Die {selectedAccount.status === 'Die' ? '(Hiện tại)' : ''}
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
                  <div className="dav-status-dot" style={{ background: '#f97316' }} /> Set Risk {selectedAccount.status === 'Risk' ? '(Hiện tại)' : ''}
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
                <div className="dav-ctx-submenu" style={{ display: activeLevel1 === 'nearby' ? 'flex' : 'none' }}>
                  <button 
                    className={`dav-ctx-item ${selectedAccount.nearbyPeopleEnabled ? 'active' : ''}`} 
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUpdateAccount(selectedAccount.id, { nearbyPeopleEnabled: true, nearbyPeopleDueDate: Date.now() + 30 * 24 * 60 * 60 * 1000 });
                      setCtxMenu(null);
                    }}
                  >
                    Open Nearby People
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
                        notice: {
                          title: 'Dưỡng Hiện',
                          content: 'Dưỡng Hiện',
                          days: 31,
                          startDate,
                          dueDate
                        }
                      });
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
                <div className="dav-ctx-submenu" style={{ display: activeLevel1 === 'quet_qr' ? 'flex' : 'none' }}>
                  <button 
                    className="dav-ctx-item" 
                    disabled={(selectedAccount.scanCount || 0) >= 3}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const currentCount = selectedAccount.scanCount || 0;
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
              setMoveModal({ sourceUdid: accountActionMenu.sourceUdid, account: accountActionMenu.account });
              setMoveError('');
              setAccountActionMenu(null);
              setAccountTitleDropdownOpen(false);
            }}
          >
            Di chuyen tai khoan
          </button>
        </div>,
        document.body
      )}
      {/* Move Modal Portal */}
      {moveModal && ReactDOM.createPortal(
        <div 
          className="confirmOverlay" 
          onClick={e => e.stopPropagation()}
        >
          <div 
            className="confirmPanel confirmPanel--compact" 
            style={{ minWidth: '280px' }}
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
                className="modalBtn" 
                style={{ flex: 1 }}
                onClick={() => {
                  setMoveModal(null);
                  setTargetOrderStr('');
                  setMoveError('');
                }}
              >
                Hủy
              </button>
              <button 
                className="modalBtnPrimary" 
                style={{ flex: 1 }}
                onClick={() => handleConfirmMove()}
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
  const [vault, setVault] = useState<VaultData>(() => loadDeviceAccountVault());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const floatingPanelRef = useRef<HTMLDivElement | null>(null);

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
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.x;
      const dy = moveEvent.clientY - dragStartRef.current.y;
      const rawPos = {
        x: dragStartRef.current.panelX + dx,
        y: dragStartRef.current.panelY + dy,
      };
      const newPos = clampDavPanelPosition(rawPos, panel);
      setDragPos(newPos);
      localStorage.setItem('monviewphone:dav-drag-pos', JSON.stringify(newPos));
    };
    
    const handleMouseUp = () => {
      dragStartRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    if (!open || !dragPos) return;

    requestAnimationFrame(() => {
      const fixed = clampDavPanelPosition(dragPos, floatingPanelRef.current);
      if (fixed.x !== dragPos.x || fixed.y !== dragPos.y) {
        setDragPos(fixed);
        localStorage.setItem('monviewphone:dav-drag-pos', JSON.stringify(fixed));
      }
    });
  }, [open, dragPos]);

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
    window.addEventListener('mousedown', hide);
    return () => window.removeEventListener('mousedown', hide);
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
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);
    }
  }, [open]);

  // 1. Tính toán statistics
  const { totalAccs, oneYearCount, newMonthCount, disabledCount, unverifiedCount, incompleteInfoCount } = useMemo(() => {
    let total = 0;
    let oneYear = 0;
    let newMonth = 0;
    let disabled = 0;
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
        
        if (acc.status === 'Die' || acc.status === 'Risk') {
          disabled++;
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
      disabledCount: disabled,
      unverifiedCount: unverified,
      incompleteInfoCount: incomplete
    };
  }, [registeredUdids, activeTab, vault]);

  const { totalDevices, scanVNCount, scanHKCount, hasNoticeCount, nearbyPeopleCount } = useMemo(() => {
    let scanVN = 0;
    let scanHK = 0;
    let hasNotice = 0;
    let nearbyPeople = 0;
    
    for (const udid of registeredUdids) {
      const d = getDeviceAccountDataFromVault(vault, udid);
      const accounts = d.platforms[activeTab] || [];
      
      if (activeTab === 'wechat') {
        const hasVN = accounts.some(acc => {
          const wc = acc as WeChatAccount;
          const scanCount = wc.scanCount || 0;
          if (scanCount >= 3) return false;
          if (wc.lastScanDate) {
            const nextScan = wc.lastScanDate + 30 * 24 * 60 * 60 * 1000;
            if (nextScan > Date.now()) return false;
          }
          return wc.phoneRegion !== 'HK';
        });
        if (hasVN) scanVN++;

        const hasHK = accounts.some(acc => {
          const wc = acc as WeChatAccount;
          const scanCount = wc.scanCount || 0;
          if (scanCount >= 3) return false;
          if (wc.lastScanDate) {
            const nextScan = wc.lastScanDate + 30 * 24 * 60 * 60 * 1000;
            if (nextScan > Date.now()) return false;
          }
          return wc.phoneRegion === 'HK';
        });
        if (hasHK) scanHK++;
        
        const hasNearby = activeTab === 'wechat' && hasNearbyRelevantAccount(accounts);
        if (hasNearby) nearbyPeople++;
      }
      
      const hasN = accounts.some(acc => !!(acc.notice && acc.notice.dueDate));
      if (hasN) hasNotice++;
    }
    
    return {
      totalDevices: registeredUdids.length,
      scanVNCount: scanVN,
      scanHKCount: scanHK,
      hasNoticeCount: hasNotice,
      nearbyPeopleCount: nearbyPeople
    };
  }, [registeredUdids, activeTab, vault]);

  const handleFilterClick = (filter: string) => {
    setActiveFilter(activeFilter === filter ? 'default' : filter);
  };

  return ReactDOM.createPortal(
    <>
      <div className={`dav-overlay ${open ? 'is-open' : 'is-hidden'}`}>
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
          <div className="dav-floating-title-left">
            <span className="dav-floating-title">Quản lý tài khoản</span>
          </div>
          
          <div className="dav-floating-platform-select">
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
            <span className={`dav-stats-btn ${activeFilter === 'disabled' ? 'active' : ''}`} onClick={() => handleFilterClick('disabled')}>
              TK hạn chế: <strong style={{ color: 'var(--md-danger)' }}>{disabledCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'unverified' ? 'active' : ''}`} onClick={() => handleFilterClick('unverified')}>
              UnVerify: <strong style={{ color: 'var(--md-warning)' }}>{unverifiedCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'incomplete_info' ? 'active' : ''}`} onClick={() => handleFilterClick('incomplete_info')}>
              Thiếu Info: <strong style={{ color: 'var(--md-info)' }}>{incompleteInfoCount}</strong>
            </span>
          </div>
          
          <div className="dav-stats-row-global">
            <span className="dav-stats-label">Thiết bị:</span>
            <span className="dav-stats-val-total">{totalDevices}</span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'wechat_scan_vn' ? 'active' : ''}`} onClick={() => handleFilterClick('wechat_scan_vn')}>
              Scan VN: <strong style={{ color: 'var(--md-success)' }}>{scanVNCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'wechat_scan_hk' ? 'active' : ''}`} onClick={() => handleFilterClick('wechat_scan_hk')}>
              Scan HK: <strong style={{ color: '#8b5cf6' }}>{scanHKCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'has_notice' ? 'active' : ''}`} onClick={() => handleFilterClick('has_notice')}>
              Thông báo: <strong style={{ color: 'var(--md-warning)' }}>{hasNoticeCount}</strong>
            </span>
            <span className="dav-stats-divider">|</span>
            <span className={`dav-stats-btn ${activeFilter === 'nearby_people' ? 'active' : ''}`} onClick={() => handleFilterClick('nearby_people')}>
              Nearby People: <strong style={{ color: '#ec4899' }}>{nearbyPeopleCount}</strong>
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

              {/* btn_dav_settings_priority_sort : Chọn mode sắp xếp ưu tiên Nearby */}
              <button
                type="button"
                className={`dav-settings-choice ${nearbyFilterMode === 'priority_sort' ? 'active' : ''}`}
                onClick={() => updateNearbyFilterMode('priority_sort')}
              >
                <strong>Sắp xếp ưu tiên Nearby</strong>
                <span>Giữ cách cũ, đưa title có Nearby gần nhất lên trước</span>
              </button>

              {/* btn_dav_settings_hide_unmatched : Chọn mode ẩn title không liên quan */}
              <button
                type="button"
                className={`dav-settings-choice ${nearbyFilterMode === 'hide_unmatched' ? 'active' : ''}`}
                onClick={() => updateNearbyFilterMode('hide_unmatched')}
              >
                <strong>Ẩn title không liên quan</strong>
                <span>Chỉ hiện title có tài khoản đủ điều kiện hoặc còn tối đa 3 ngày</span>
              </button>
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
    </>,
    document.body
  );
}
