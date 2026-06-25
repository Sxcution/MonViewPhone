import React, { useEffect, useState } from 'react';
import { useI18n } from '@/context/I18nContext';
import { Eye, RefreshCw } from 'lucide-react';

type Props = {
  udid: string;
  wsServer: string;
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
  order,
  syncRole,
  onHeaderClick,
  onReloadClick,
  connectionLabel,
  onViewClick,
  onChangeOrderNumber,
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
    connectionLabel?.toLowerCase() === 'usb' || connectionLabel?.toLowerCase() === 'adb'
      ? ' usb'
      : connectionLabel?.toLowerCase() === 'wifi'
        ? ' wifi'
        : '';

  return (
    <div className="tileHeader" onClick={(e) => {
      if (e.ctrlKey) return;
      onHeaderClick(e);
    }} title={udid}>
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
            <div className={`tileSyncChip ${syncRole}`}>{syncRole === 'main' ? t('Chinh') : t('Phu')}</div>
          ) : null}
        </div>
      </div>

      <div className="tileActions">
        <button
          className="tileViewBtn"
          title="Xem thiet bi"
          onClick={(e) => {
            e.stopPropagation();
            onViewClick?.();
          }}
        >
          <Eye size={16} strokeWidth={1.8} />
        </button>
        <button className="tileReloadBtn" title="Tai lai" onClick={onReloadClick}>
          <RefreshCw size={16} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
