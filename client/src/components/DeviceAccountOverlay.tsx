import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, Plus, MoreVertical, Smartphone, Info, Calendar, Shield, Activity, Phone, Hash, Bell } from 'lucide-react';
import { 
  getDeviceAccountData, 
  saveDeviceAccountData, 
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

// --- Format Utilities ---
function formatDate(ts: number | null) {
  if (!ts) return 'N/A';
  return new Date(ts).toLocaleDateString('vi-VN');
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
    const isOverdue = acc.notice.dueDate && Date.now() > acc.notice.dueDate;
    badges.push({ label: 'Thông báo', color: isOverdue ? '#ef4444' : '#3b82f6' });
  }

  return badges;
}

// --- Device Panel Component ---
function DeviceAccountPanel({ 
  udid, 
  order, 
  model, 
  isOnline,
  filterSearch
}: { 
  udid: string; 
  order: number; 
  model: string; 
  isOnline: boolean;
  filterSearch: string;
}) {
  const [data, setData] = useState(() => getDeviceAccountData(udid));
  const [activeTab, setActiveTab] = useState<PlatformType>(data.defaultPlatform || 'wechat');
  const [ctxMenu, setCtxMenu] = useState<{ x: number, y: number, accountId: string } | null>(null);
  
  // Save when data changes
  const updateData = (newData: typeof data) => {
    setData(newData);
    saveDeviceAccountData(udid, newData);
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

  // Actions
  const handleAddAccount = () => {
    const newAcc = createNewAccount(isWeChat);
    const newData = { ...data };
    newData.platforms[activeTab] = [...(newData.platforms[activeTab] || []), newAcc];
    newData.selectedAccountByPlatform[activeTab] = newAcc.id;
    updateData(newData);
  };

  const handleUpdateAccount = (id: string, updates: Partial<Account>) => {
    const newData = { ...data };
    newData.platforms[activeTab] = newData.platforms[activeTab].map(a => 
      a.id === id ? { ...a, ...updates } : a
    );
    updateData(newData);
  };

  const handleDeleteAccount = (id: string) => {
    if (!window.confirm('Xoá tài khoản này?')) return;
    const newData = { ...data };
    newData.platforms[activeTab] = newData.platforms[activeTab].filter(a => a.id !== id);
    if (newData.selectedAccountByPlatform[activeTab] === id) {
      newData.selectedAccountByPlatform[activeTab] = newData.platforms[activeTab][0]?.id;
    }
    updateData(newData);
    setCtxMenu(null);
  };

  const handleSetMain = (id: string) => {
    const newData = { ...data };
    newData.selectedAccountByPlatform[activeTab] = id;
    updateData(newData);
    setCtxMenu(null);
  };

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return;
    const hide = () => setCtxMenu(null);
    window.addEventListener('click', hide);
    return () => window.removeEventListener('click', hide);
  }, [ctxMenu]);

  return (
    <div className="dav-panel">
      <div className="dav-panel-header">
        <div className="dav-panel-title">
          <span className="dav-order">{order.toString().padStart(2, '0')}</span>
          <span className="dav-udid">{udid}</span>
        </div>
        <div className="dav-panel-meta">
          <span className="dav-model">{model || 'Unknown'}</span>
          <span className={`dav-status-dot ${isOnline ? 'online' : 'offline'}`} />
          <span className="dav-total-badge">{totalAccounts} TK</span>
        </div>
      </div>
      
      <div className="dav-tabs">
        {PLATFORMS.map(p => (
          <button 
            key={p.id} 
            className={`dav-tab ${activeTab === p.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(p.id);
              updateData({ ...data, defaultPlatform: p.id });
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="dav-panel-body">
        {!selectedAccount ? (
          <div className="dav-empty-state">
            <p>Chưa có tài khoản {PLATFORMS.find(p => p.id === activeTab)?.label}</p>
            <button className="dav-btn primary" onClick={handleAddAccount}>
              <Plus size={14} /> Thêm tài khoản
            </button>
          </div>
        ) : (
          <div className="dav-account-card" onContextMenu={(e) => {
            e.preventDefault();
            setCtxMenu({ x: e.clientX, y: e.clientY, accountId: selectedAccount.id });
          }}>
            <div className="dav-card-header">
              <div className="dav-card-title">
                <Shield size={16} color={ACCOUNT_STATUS_COLORS[selectedAccount.status]} />
                <input 
                  className="dav-input-inline dav-name" 
                  value={selectedAccount.name} 
                  placeholder="Tên tài khoản"
                  onChange={e => handleUpdateAccount(selectedAccount.id, { name: e.target.value })} 
                />
              </div>
              <div className="dav-badges-container">
                {computeBadges(selectedAccount, isWeChat).map((b, i) => (
                  <span key={i} className="dav-badge" style={{ backgroundColor: b.color + '33', color: b.color, borderColor: b.color + '55' }}>
                    {b.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="dav-card-grid">
              <div className="dav-field">
                <label>Nickname</label>
                <input className="dav-input" value={selectedAccount.nickname} onChange={e => handleUpdateAccount(selectedAccount.id, { nickname: e.target.value })} />
              </div>
              <div className="dav-field">
                <label>Số điện thoại</label>
                <input className="dav-input" value={selectedAccount.phone} onChange={e => handleUpdateAccount(selectedAccount.id, { phone: e.target.value })} />
              </div>
              <div className="dav-field">
                <label>Email</label>
                <input className="dav-input" value={selectedAccount.email} onChange={e => handleUpdateAccount(selectedAccount.id, { email: e.target.value })} />
              </div>
              <div className="dav-field">
                <label>Trạng thái</label>
                <select className="dav-input" value={selectedAccount.status} onChange={e => handleUpdateAccount(selectedAccount.id, { status: e.target.value as any })}>
                  <option value="Live">Live</option>
                  <option value="Die">Die</option>
                  <option value="Verify">Verify</option>
                  <option value="Risk">Risk</option>
                  <option value="Unverified">Unverified</option>
                </select>
              </div>

              {isWeChat && (
                <>
                  <div className="dav-field">
                    <label>Ngày tạo WeChat</label>
                    <input 
                      type="date" 
                      className="dav-input" 
                      value={(selectedAccount as WeChatAccount).createdAt ? new Date((selectedAccount as WeChatAccount).createdAt!).toISOString().split('T')[0] : ''} 
                      onChange={e => handleUpdateAccount(selectedAccount.id, { createdAt: e.target.value ? new Date(e.target.value).getTime() : null })}
                    />
                  </div>
                  <div className="dav-field">
                    <label>Vùng ĐT</label>
                    <select className="dav-input" value={(selectedAccount as WeChatAccount).phoneRegion} onChange={e => handleUpdateAccount(selectedAccount.id, { phoneRegion: e.target.value as any })}>
                      <option value="Unknown">Unknown</option>
                      <option value="VN">Việt Nam</option>
                      <option value="HK">Hong Kong</option>
                    </select>
                  </div>
                  <div className="dav-field">
                    <label>Xác minh</label>
                    <select className="dav-input" value={(selectedAccount as WeChatAccount).verifyStatus} onChange={e => handleUpdateAccount(selectedAccount.id, { verifyStatus: e.target.value as any })}>
                      <option value="Unknown">Unknown</option>
                      <option value="Verified">Verified</option>
                      <option value="Unverified">Unverified</option>
                    </select>
                  </div>
                  <div className="dav-field">
                    <label>Nearby People</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input 
                        type="checkbox" 
                        checked={(selectedAccount as WeChatAccount).nearbyPeopleEnabled}
                        onChange={e => handleUpdateAccount(selectedAccount.id, { nearbyPeopleEnabled: e.target.checked })}
                      />
                      <input 
                        type="date" 
                        className="dav-input" 
                        style={{ flex: 1 }}
                        disabled={!(selectedAccount as WeChatAccount).nearbyPeopleEnabled}
                        value={(selectedAccount as WeChatAccount).nearbyPeopleDueDate ? new Date((selectedAccount as WeChatAccount).nearbyPeopleDueDate!).toISOString().split('T')[0] : ''}
                        onChange={e => handleUpdateAccount(selectedAccount.id, { nearbyPeopleDueDate: e.target.value ? new Date(e.target.value).getTime() : null })}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="dav-field" style={{ marginTop: '8px' }}>
              <label>Ghi chú</label>
              <textarea 
                className="dav-input" 
                rows={2} 
                value={selectedAccount.note} 
                onChange={e => handleUpdateAccount(selectedAccount.id, { note: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Context Menu Portal */}
      {ctxMenu && ReactDOM.createPortal(
        <div className="dav-ctx-menu" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={e => e.stopPropagation()}>
          <button className="dav-ctx-item" onClick={handleAddAccount}>
            <Plus size={14} /> Thêm tài khoản phụ
          </button>
          
          {activeAccounts.length > 1 && (
            <div className="dav-ctx-submenu-container">
              <div className="dav-ctx-item dav-ctx-has-sub">
                <Users size={14} /> Chọn tài khoản phụ
                <div className="dav-ctx-submenu">
                  {activeAccounts.map(a => (
                    <button key={a.id} className={`dav-ctx-item ${selectedAccountId === a.id ? 'active' : ''}`} onClick={() => handleSetMain(a.id)}>
                      {a.name || a.phone || a.nickname || 'Unknown'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="dav-ctx-divider" />
          <button className="dav-ctx-item" onClick={() => handleUpdateAccount(selectedAccount.id, { status: 'Live' })}>
            <div className="dav-status-dot" style={{ background: '#22c55e' }} /> Set Live
          </button>
          <button className="dav-ctx-item" onClick={() => handleUpdateAccount(selectedAccount.id, { status: 'Die' })}>
            <div className="dav-status-dot" style={{ background: '#ef4444' }} /> Set Die
          </button>
          <button className="dav-ctx-item" onClick={() => handleUpdateAccount(selectedAccount.id, { status: 'Risk' })}>
            <div className="dav-status-dot" style={{ background: '#f97316' }} /> Set Risk
          </button>
          <div className="dav-ctx-divider" />
          <button className="dav-ctx-item danger" onClick={() => handleDeleteAccount(selectedAccount.id)}>
            <Trash2 size={14} /> Xoá tài khoản
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

// Ensure icon imports for context menu
import { Users, Trash2 } from 'lucide-react';

export function DeviceAccountOverlay({
  open,
  onClose,
  registeredUdids,
  connectedUdids,
  orderMap,
  androidDeviceMap
}: DeviceAccountOverlayProps) {
  const [search, setSearch] = useState('');

  // Handle ESC
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="dav-overlay">
      <div className="dav-header">
        <div className="dav-header-left">
          <h2 className="dav-title">Kho tài khoản thiết bị</h2>
          <span className="dav-subtitle">Ctrl + D để mở/đóng</span>
        </div>
        <div className="dav-header-center">
          <div className="dav-search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Tìm theo UDID, Tên, Số thứ tự, Số điện thoại..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
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
            return (
              <DeviceAccountPanel 
                key={udid} 
                udid={udid} 
                order={order} 
                model={model} 
                isOnline={isOnline}
                filterSearch={search}
              />
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
