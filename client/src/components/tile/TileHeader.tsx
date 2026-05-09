import React, { useEffect, useState } from 'react';
import { useI18n } from '@/context/I18nContext';
import { Eye, GripVertical, RefreshCw } from 'lucide-react';
// 1. Thêm import gọi API lấy danh sách user
import { listUserProfiles } from '@/lib/serverApi'; 

type Props = {
    udid: string;
    wsServer: string; // 2. Bổ sung thêm wsServer
    order?: number;
    status: string;
    syncRole: 'main' | 'follower' | null;
    onHeaderClick: (e: React.MouseEvent) => void;
    onReloadClick: (e: React.MouseEvent) => void;
    connectionLabel?: string;
    onViewClick?: () => void;
    onMove?: (udid: string, toIndex: number) => void;
    onChangeOrderNumber?: (udid: string, nextNumber: number) => void;
    onDragStart?: (udid: string) => void;
    onDragEnd?: () => void;
};

export function TileHeader({
    udid,
    wsServer, // Nhận wsServer từ props
    order,
    status,
    syncRole,
    onHeaderClick,
    onReloadClick,
    connectionLabel,
    onViewClick,
    onMove,
    onChangeOrderNumber,
    onDragStart,
    onDragEnd,
}: Props) {
    const { t } = useI18n();
    const [orderValue, setOrderValue] = useState('');
    
    // 3. Khai báo state lưu danh sách user
    const [profiles, setProfiles] = useState<{ id: number; name: string }[]>([]);
    const [selectedUser, setSelectedUser] = useState<number>(0);

    // 4. Lấy danh sách profile khi component được mount
    useEffect(() => {
        let active = true;
        listUserProfiles(wsServer, udid)
            .then((res) => {
                if (active && res && res.length > 0) {
                    setProfiles(res);
                    setSelectedUser(res[0].id);
                }
            })
            .catch((err) => console.error('Failed to load profiles', err));
        return () => { active = false; };
    }, [wsServer, udid]);

    useEffect(() => {
        setOrderValue(typeof order === 'number' ? String(order).padStart(2, '0') : '');
    }, [order]);

    const commitOrder = () => {
        if (typeof order !== 'number') return;
        const nextOrder = parseInt(orderValue, 10);
        if (!Number.isFinite(nextOrder) || nextOrder <= 0) {
            setOrderValue(String(order).padStart(2, '0'));
            return;
        }
        if (nextOrder !== order) {
            onChangeOrderNumber?.(udid, nextOrder);
        } else {
            setOrderValue(String(order).padStart(2, '0'));
        }
    };

    const connClass =
        connectionLabel?.toLowerCase() === 'usb'
            ? ' usb'
            : connectionLabel?.toLowerCase() === 'wifi'
                ? ' wifi'
                : '';
                
    return (
        <div className="tileHeader" onClick={onHeaderClick} title={udid}>
            <div className="left">
                <div className="udidRow">
                    {/* 5. Gói Số hiệu và Chọn User vào một Flex column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                        {typeof order === 'number' ? (
                            <input
                                className="tileNumber"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={orderValue}
                                title="Nhập số thứ tự"
                                onChange={(e) => setOrderValue(e.target.value.replace(/[^0-9]/g, ''))}
                                onBlur={commitOrder}
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === 'Enter') {
                                        e.currentTarget.blur();
                                    }
                                    if (e.key === 'Escape') {
                                        setOrderValue(String(order).padStart(2, '0'));
                                        e.currentTarget.blur();
                                    }
                                }}
                            />
                        ) : null}
                        
                        {/* Box hiển thị User Profile */}
                        {profiles.length > 0 && (
                            <select
                                className="userProfileSelect"
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(Number(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                title="Chọn User Profile"
                                style={{
                                    fontSize: '10px',
                                    padding: '1px 2px',
                                    borderRadius: '3px',
                                    background: 'rgba(0,0,0,0.3)',
                                    color: '#fff',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    width: '100%',
                                    textAlign: 'center',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {profiles.map((p) => (
                                    <option key={p.id} value={p.id} style={{ color: '#000' }}>
                                        User {p.id}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {connectionLabel ? <div className={`tileConnChip${connClass}`}>{connectionLabel}</div> : null}
                    {syncRole ? (
                        <div className={`tileSyncChip ${syncRole}`}>{syncRole === 'main' ? t('Chính') : t('Phụ')}</div>
                    ) : null}
                </div>
            </div>

            <div className="tileActions">
                <button
                    className="tileViewBtn"
                    title="Xem thiết bị"
                    onClick={(e) => {
                        e.stopPropagation();
                        onViewClick?.();
                    }}
                >
                    <Eye size={16} strokeWidth={1.8} />
                </button>
                <button className="tileReloadBtn" title="Tải lại" onClick={onReloadClick}>
                    <RefreshCw size={16} strokeWidth={1.8} />
                </button>
            </div>
        </div>
    );
}
