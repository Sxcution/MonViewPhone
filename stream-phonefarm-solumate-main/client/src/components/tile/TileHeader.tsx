import React, { useEffect, useState } from 'react';
import { useI18n } from '@/context/I18nContext';
import { Eye, GripVertical, RefreshCw } from 'lucide-react';

type Props = {
    udid: string;
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

/**
 * Tile header (UDID, status, reload).
 */
export function TileHeader({
    udid,
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
                      {typeof order === 'number' ? (
                          <input
                              className="tileNumber"
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={orderValue}
                              title="Nhap so thu tu"
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
                      {connectionLabel ? <div className={`tileConnChip${connClass}`}>{connectionLabel}</div> : null}
                      {syncRole ? (
                          <div className={`tileSyncChip ${syncRole}`}>{syncRole === 'main' ? t('ChÃ­nh') : t('Phá»¥')}</div>
                      ) : null}
                    </div>
                </div>

            <div className="tileActions">

                <button
                    className="tileViewBtn"
                    title="Nhap so thu tu"
                    onClick={(e) => {
                        e.stopPropagation();
                        onViewClick?.();
                    }}
                >
                    <Eye size={16} strokeWidth={1.8} />
                </button>
                <button className="tileReloadBtn" title="Nhap so thu tu" onClick={onReloadClick}>
                    <RefreshCw size={16} strokeWidth={1.8} />
                </button>
            </div>
        </div>
    );
}
