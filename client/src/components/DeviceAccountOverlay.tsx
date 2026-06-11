import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, Plus, MoreVertical, Smartphone, Info, Calendar, Shield, Activity, Phone, Hash, Bell, MapPin, QrCode, Mail, Users, Trash2 } from 'lucide-react';
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
  createNewAccount 
} from '@/lib/deviceAccountVault';

type DeviceAccountOverlayProps = {
  open: boolean;
  onClose: () => void;
  registeredUdids: string[];
  connectedUdids: Set<string>;
  orderMap: Map<string, number>;
  androidDeviceMap: Record<string, any>;
};

const PLATFORMS: { id: PlatformType; label: string }[] = [
  { id: 'wechat', label: 'WeChat' },
  { id: 'line', label: 'Line' },
  { id: 'tantan', label: 'Tantan' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'other', label: 'Khác' }
];

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

// --- Device Panel Component ---
export const DeviceAccountPanel = React.memo(function DeviceAccountPanel({ 
  udid, 
  order, 
  model, 
  isOnline,
  filterSearch,
  orderMap,
  initialData
}: { 
  udid: string; 
  order: number; 
  model: string; 
  isOnline: boolean;
  filterSearch: string;
  orderMap: Map<string, number>;
  initialData: DeviceAccountData;
}) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<PlatformType>(data.defaultPlatform || 'wechat');
  const [ctxMenu, setCtxMenu] = useState<{ x: number, y: number, accountId: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeLevel1, setActiveLevel1] = useState<'tai_khoan' | 'trang_thai' | 'nearby' | 'quet_qr' | null>(null);
  const [activeLevel2, setActiveLevel2] = useState<string | null>(null);
  
  // Sync state data when initialData prop changes (synchronized from parent vault update)
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Keep default platform tab sync if tab settings changed externally
  useEffect(() => {
    if (initialData.defaultPlatform && initialData.defaultPlatform !== activeTab) {
      setActiveTab(initialData.defaultPlatform);
    }
  }, [initialData.defaultPlatform, activeTab]);

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
      setAccountTitleDropdownOpen(false);
      setPlatformDropdownOpen(false);
      setAccountActionMenu(null);
    };
    window.addEventListener('mousedown', hide);
    return () => window.removeEventListener('mousedown', hide);
  }, [accountTitleDropdownOpen, platformDropdownOpen, accountActionMenu]);

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

  // If search matches anything inside this device
  const matchesSearch = useMemo(() => {
    if (!filterSearch) return true;
    const lowerSearch = filterSearch.toLowerCase();
    if (udid.toLowerCase().includes(lowerSearch)) return true;
    if (String(order).includes(lowerSearch)) return true;
    if (model && model.toLowerCase().includes(lowerSearch)) return true;
    
    // Check accounts
    for (const plt of Object.keys(data.platforms) as PlatformType[]) {
      for (const acc of data.platforms[plt]) {
        if (
          acc.name.toLowerCase().includes(lowerSearch) ||
          acc.nickname.toLowerCase().includes(lowerSearch) ||
          acc.phone.toLowerCase().includes(lowerSearch) ||
          acc.email.toLowerCase().includes(lowerSearch)
        ) {
          return true;
        }
      }
    }
    return false;
  }, [filterSearch, data, udid, order, model]);

  if (!matchesSearch) return null;

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

  // QR scan countdown calculation
  let qrCountdownText = '';
  if (isWeChat && selectedAccount?.lastScanDate) {
    const nextScanDate = selectedAccount.lastScanDate + 30 * 24 * 60 * 60 * 1000;
    const diffMs = nextScanDate - Date.now();
    if (diffMs > 0) {
      const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      qrCountdownText = `(Còn ${remainingDays} ngày)`;
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
      if (account.nearbyPeopleDueDate) {
        if (account.nearbyPeopleDueDate <= Date.now()) return 'nearby';
      } else if (account.createdAt) {
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        if (account.isOneYearOld || Date.now() - account.createdAt >= oneYearMs) return 'nearby';
      }
    }
    if (account.status === 'Die') return 'die';
    if (account.status === 'Risk') return 'risk';
    if (account.status === 'Verify' || account.status === 'Unverified') return 'verify';
    return 'live';
  };

  const isOverOneYear = useMemo(() => {
    if (!selectedAccount || !selectedAccount.createdAt) return false;
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    return !!(
      selectedAccount.isOneYearOld || 
      (Date.now() - selectedAccount.createdAt >= oneYearMs)
    );
  }, [selectedAccount]);

  const isEligibleNearby = useMemo(() => {
    if (activeTab !== 'wechat') return false;
    return isOverOneYear;
  }, [activeTab, isOverOneYear]);

  const showBlueNearby = useMemo(() => {
    if (activeTab !== 'wechat' || !selectedAccount) return false;
    
    if (selectedAccount.nearbyPeopleDueDate) {
      const diffMs = selectedAccount.nearbyPeopleDueDate - Date.now();
      if (diffMs > 0) {
        return false; // Đang đếm ngược -> màu Trắng
      }
      return true; // Đã hết đếm ngược -> màu Xanh dương
    }
    
    return isEligibleNearby;
  }, [selectedAccount, activeTab, isEligibleNearby]);

  const shieldColor = useMemo(() => {
    if (!selectedAccount) return '#22c55e';
    if (selectedAccount.status === 'Die') {
      return '#ef4444'; // Đỏ khi tài khoản Die
    }
    if (selectedAccount.status === 'Risk') {
      return '#f97316'; // Cam khi tài khoản Risk
    }
    if (showBlueNearby) {
      return '#3b82f6'; // Xanh dương khi đủ điều kiện Nearby People
    }
    return ACCOUNT_STATUS_COLORS[selectedAccount.status] || '#22c55e';
  }, [selectedAccount, showBlueNearby]);

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
    return '#fff'; // Mặc định là trắng
  }, [selectedAccount, showBlueNearby]);

  const activePlatformLabel = PLATFORMS.find(p => p.id === activeTab)?.label || 'WeChat';

  return (
    <div className="dav-panel" onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}>
      <div className="dav-panel-header">
        <div className="dav-panel-title-left">
          <span className="dav-order">{order.toString().padStart(2, '0')}</span>
          <span 
            className="dav-status-dot" 
            style={{ 
              background: selectedAccount 
                ? (selectedAccount.status === 'Die' ? 'var(--md-danger)' : selectedAccount.status === 'Risk' ? 'var(--md-warning)' : 'var(--md-success)')
                : (isOnline ? 'var(--md-success)' : 'var(--md-danger)')
            }} 
          />
          {noticeStatus !== 'none' && (
            <Bell size={13} color={noticeStatus === 'expired' ? 'var(--md-danger)' : 'var(--md-warning)'} className={noticeStatus === 'expired' ? "dav-bell-expired" : ""} />
          )}
        </div>

        <div className="dav-panel-title-right">
          <div className="dav-title-dropdown-wrap" ref={accountTitleDropdownRef}>
            <button
              type="button"
              className="dav-total-badge"
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
                      <span className="dav-title-account-name">
                        {account.name || account.phone || account.nickname || 'Khong ten'} ({getAppTypeLabel(account.appType)})
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="dav-platform-dropdown-wrap" ref={platformDropdownRef}>
            <button
              type="button"
              className={`dav-platform-trigger ${activeTab === 'wechat' ? 'wechat' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPlatformDropdownOpen(v => !v);
                setAccountTitleDropdownOpen(false);
              }}
            >
              {activePlatformLabel}
            </button>
            {platformDropdownOpen && (
              <div className="dav-platform-menu contextMenuPanel">
                {PLATFORMS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={`dav-platform-menu-item ${activeTab === p.id ? 'active' : ''} ${p.id === 'wechat' ? 'wechat' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveTab(p.id);
                      updateData({ ...data, defaultPlatform: p.id });
                      setPlatformDropdownOpen(false);
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="dav-panel-body">
        {!selectedAccount ? (
          <div className="dav-empty-state">
            <p>Chưa có tài khoản {PLATFORMS.find(p => p.id === activeTab)?.label}</p>
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
              <span style={{ color: '#888', userSelect: 'none', fontSize: '13px', fontWeight: 'bold', marginLeft: '2px' }}>@</span>
              <input 
                className="dav-transparent-input" 
                style={{ color: '#fff' }}
                placeholder="Biệt danh"
                value={selectedAccount.nickname || ''} 
                onChange={e => handleUpdateAccount(selectedAccount.id, { nickname: e.target.value })} 
              />
            </div>

            {/* Số điện thoại */}
            <div className="dav-input-wrapper">
              <Phone size={12} color="#ec4899" style={{ flexShrink: 0 }} />
              <input 
                className="dav-transparent-input" 
                placeholder="Số điện thoại"
                value={selectedAccount.phone || ''} 
                onChange={e => handleUpdateAccount(selectedAccount.id, { phone: e.target.value })} 
              />
            </div>

            {/* Email */}
            <div className="dav-input-wrapper">
              <Mail size={12} color="#9ca3af" style={{ flexShrink: 0 }} />
              <input 
                className="dav-transparent-input" 
                placeholder="Địa chỉ Email"
                value={selectedAccount.email || ''} 
                onChange={e => handleUpdateAccount(selectedAccount.id, { email: e.target.value })} 
              />
            </div>

            {/* Hàng QR Code & Nearby People */}
            <div className="dav-stats-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <QrCode size={13} color="#22c55e" style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 'bold', color: (selectedAccount.scanCount || 0) >= 3 ? '#ef4444' : '#22c55e' }}>
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
                if (!isEligibleNearby && !selectedAccount.nearbyPeopleDueDate) return null;
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
                          Còn {nearbyDays} ngày
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
                <span style={{ color: '#eab308', fontWeight: noticeStatus === 'expired' ? 'bold' : '500' }}>
                  {selectedAccount.notice?.title} {noticeStatus === 'expired' ? ': đã đến hạn' : `: còn ${remainingDays} ngày`}
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
                  <div 
                    key={a.id} 
                    className="dav-ctx-submenu-container"
                    onMouseEnter={() => setActiveLevel2(a.id)}
                    onMouseLeave={() => setActiveLevel2(null)}
                  >
                    <div className="dav-ctx-item dav-ctx-has-sub">
                      <span style={{ fontWeight: a.id === selectedAccount.id ? 'bold' : 'normal' }}>
                        {a.name || a.phone || a.nickname || 'Tài khoản'} ({getAppTypeLabel(a.appType)}){a.id === selectedAccount.id ? ' (Hiện tại)' : ''}
                      </span>
                      <div className="dav-ctx-submenu" style={{ display: activeLevel2 === a.id ? 'flex' : 'none' }}>
                        {a.id !== selectedAccount.id && (
                          <>
                            <button 
                              className="dav-ctx-item" 
                              onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSetMain(a.id);
                                setCtxMenu(null);
                              }}
                            >
                              Sử dụng tài khoản này
                            </button>
                            <div className="dav-ctx-divider" />
                          </>
                        )}
                        {(['main', 'clone', 'secure', 'shelter'] as const).map(type => (
                          <button
                            key={type}
                            className={`dav-ctx-item ${(a.appType || 'main') === type ? 'active' : ''}`}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleUpdateAccount(a.id, { appType: type });
                              setCtxMenu(null);
                            }}
                          >
                            {getAppTypeLabel(type)} {(a.appType || 'main') === type ? '✓' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
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
              handleDeleteAccount(selectedAccount.id);
            }}
          >
            <Trash2 size={16} /> Xoá tài khoản
          </button>
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
  androidDeviceMap
}: DeviceAccountOverlayProps) {
  const [search, setSearch] = useState('');
  const [vault, setVault] = useState<VaultData>(() => loadDeviceAccountVault());
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync vault state when updates occur (one listener for all panels)
  useEffect(() => {
    const handleAccountUpdate = () => {
      setVault(loadDeviceAccountVault());
    };
    window.addEventListener('device-account-updated', handleAccountUpdate);
    return () => window.removeEventListener('device-account-updated', handleAccountUpdate);
  }, []);

  // Handle ESC key to close
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);
    }
  }, [open]);

  return ReactDOM.createPortal(
    <div className={`dav-overlay ${open ? 'is-open' : 'is-hidden'}`}>
      <div className="dav-header">
        <div className="dav-header-left">
          <h2 className="dav-title">Kho tài khoản thiết bị</h2>
          <span className="dav-subtitle">Ctrl + D để mở/đóng</span>
        </div>
        <div className="dav-header-center">
          <div className="dav-search-box">
            <Search size={16} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Tìm theo UDID, Tên, Số thứ tự, Số điện thoại..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="dav-header-right">
          <button className="dav-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
      </div>
      
      <div className="dav-body">
        <div className="dav-grid">
          {registeredUdids.map(udid => {
            const order = orderMap.get(udid) ?? 0;
            const meta = androidDeviceMap[udid];
            const model = meta ? [meta.manufacturer, meta['ro.product.model']].filter(Boolean).join(' ') : '';
            const isOnline = connectedUdids.has(udid);
            const initialData = getDeviceAccountDataFromVault(vault, udid);
            return (
              <DeviceAccountPanel 
                key={udid} 
                udid={udid} 
                order={order} 
                model={model} 
                isOnline={isOnline}
                filterSearch={search}
                orderMap={orderMap}
                initialData={initialData}
              />
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
