import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock3, X } from 'lucide-react';
import { type SyncTimeSettings } from '@/lib/syncTimeSettings';

type SyncTimeSettingsModalProps = {
  settings: SyncTimeSettings;
  delayRange: { minMs: number; maxMs: number };
  onChange: (patch: Partial<SyncTimeSettings>) => void;
  onClose: () => void;
  title?: string;
};

export function SyncTimeSettingsModal({
  settings,
  delayRange,
  onChange,
  onClose,
  title,
}: SyncTimeSettingsModalProps) {
  const parseNumberInput = (value: string) => {
    const n = Number(value.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };

  const handleNumberChange = (value: string, key: 'intervalSec' | 'offsetMinPx' | 'offsetMaxPx') => {
    const n = parseNumberInput(value);
    if (n == null) return;
    onChange({ [key]: n } as Partial<SyncTimeSettings>);
  };

  // Determine if the inputs should be locked
  const isIntervalLocked = !settings.delayEnabled || !settings.intervalEnabled;
  const isOffsetLocked = isIntervalLocked || !settings.offsetEnabled;

  // ===== DRAGGABLE LOGIC =====
  const [position, setPosition] = useState(() => {
    const w = window.innerWidth;
    return {
      x: Math.max(20, w - 380), // Position on the right side initially
      y: 150,
    };
  });

  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    panelEl?: HTMLElement | null;
    lastX?: number;
    lastY?: number;
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  const clampPosition = (val: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, val));
  };

  const onDragMove = useCallback((e: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag.active || !drag.panelEl) return;
    e.preventDefault();
    const nextX = drag.originX + e.clientX - drag.startX;
    const nextY = drag.originY + e.clientY - drag.startY;
    const finalX = clampPosition(nextX, 0, Math.max(0, window.innerWidth - 80));
    const finalY = clampPosition(nextY, 0, Math.max(0, window.innerHeight - 60));
    
    drag.panelEl.style.left = `${finalX}px`;
    drag.panelEl.style.top = `${finalY}px`;
    
    drag.lastX = finalX;
    drag.lastY = finalY;
  }, []);

  const onDragUp = useCallback(() => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.active = false;
    document.body.classList.remove('is-dragging-modal');
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragUp);
    
    if (drag.lastX !== undefined && drag.lastY !== undefined) {
      setPosition({ x: drag.lastX, y: drag.lastY });
    }
  }, [onDragMove]);

  const startDrag = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input')) return;
    e.preventDefault();
    const panel = e.currentTarget.closest('.syncTimeCard') as HTMLElement | null;
    if (!panel) return;
    
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
      panelEl: panel,
      lastX: position.x,
      lastY: position.y
    };
    document.body.classList.add('is-dragging-modal');
    window.addEventListener('pointermove', onDragMove, { passive: false });
    window.addEventListener('pointerup', onDragUp);
  }, [onDragMove, onDragUp, position.x, position.y]);

  // Cleanup drag listeners on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onDragMove);
      window.removeEventListener('pointerup', onDragUp);
    };
  }, [onDragMove, onDragUp]);

  return createPortal(
    <div 
      className="syncTimeOverlay"
      data-inspector-id="syncTime.overlay"
      data-inspector-label="Sync Time/Macro settings overlay backdrop"
      data-inspector-component="client/src/components/SyncTimeSettingsModal.tsx"
    >
      <div
        className="syncTimeCard"
        role="dialog"
        aria-modal="false"
        style={{ left: position.x, top: position.y }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        data-inspector-id="syncTime.card"
        data-inspector-label="Sync Time/Macro settings card panel"
        data-inspector-component="client/src/components/SyncTimeSettingsModal.tsx"
      >
        <div className="syncTimeHeader" onPointerDown={startDrag}>
          <div className="syncTimeTitle">
            <Clock3 size={15} style={{ color: 'var(--md-info)' }} />
            <span>{title || 'Sync Time'}</span>
          </div>
          <button
            type="button"
            className="btn-close automationClose"
            aria-label="Close"
            onClick={onClose}
            data-inspector-id="syncTime.closeButton"
            data-inspector-label="Sync settings close button"
            data-inspector-component="client/src/components/SyncTimeSettingsModal.tsx"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        
        <div className="syncTimeBody">
          {/* Vertical gray separator line */}
          <div className="syncTimeLine" />

          {/* Row 1: Độ trễ */}
          <div className="syncTimeRow">
            <span className="syncTimeLabel">Độ trễ</span>
            <div className="syncTimeControls">
              <button
                type="button"
                className={`visualAlertToggle${settings.delayEnabled ? ' on' : ''}`}
                onClick={() => onChange({ delayEnabled: !settings.delayEnabled })}
                data-inspector-id="syncTime.delayToggle"
                data-inspector-label="Sync delay enable toggle"
                data-inspector-component="client/src/components/SyncTimeSettingsModal.tsx"
              >
                <span className="visualAlertToggleKnob" />
              </button>
            </div>
          </div>

          {/* Row 2: Ngẫu nhiên */}
          <div className="syncTimeRow">
            <span className="syncTimeLabel">Ngẫu nhiên</span>
            <div className="syncTimeControls">
              <button
                type="button"
                className={`visualAlertToggle${settings.randomOrder ? ' on' : ''}`}
                onClick={() => onChange({ randomOrder: !settings.randomOrder })}
                data-inspector-id="syncTime.randomOrderToggle"
                data-inspector-label="Random execution order toggle"
                data-inspector-component="client/src/components/SyncTimeSettingsModal.tsx"
              >
                <span className="visualAlertToggleKnob" />
              </button>
            </div>
          </div>

          {/* Row 3: Khoảng thời gian */}
          <div className="syncTimeRow">
            <span className="syncTimeLabel">Khoảng thời gian</span>
            <div className="syncTimeControls">
              <button
                type="button"
                className={`visualAlertToggle${settings.intervalEnabled ? ' on' : ''}`}
                onClick={() => onChange({ intervalEnabled: !settings.intervalEnabled })}
                data-inspector-id="syncTime.intervalToggle"
                data-inspector-label="Sync interval enable toggle"
                data-inspector-component="client/src/components/SyncTimeSettingsModal.tsx"
              >
                <span className="visualAlertToggleKnob" />
              </button>
              <input
                className="syncTimeInput"
                type="text"
                inputMode="decimal"
                value={String(settings.intervalSec)}
                onChange={(e) => handleNumberChange(e.target.value, 'intervalSec')}
                disabled={isIntervalLocked}
                data-inspector-id="syncTime.intervalInput"
                data-inspector-label="Sync interval duration input"
                data-inspector-component="client/src/components/SyncTimeSettingsModal.tsx"
              />
              <span className="syncTimeUnit">giây</span>
            </div>
          </div>

          {/* Row 4: Độ lệch */}
          <div className="syncTimeRow">
            <span className="syncTimeLabel">Độ lệch</span>
            <div className="syncTimeControls">
              <button
                type="button"
                className={`visualAlertToggle${settings.offsetEnabled ? ' on' : ''}`}
                onClick={() => onChange({ offsetEnabled: !settings.offsetEnabled })}
                data-inspector-id="syncTime.offsetToggle"
                data-inspector-label="Sync offset enable toggle"
                data-inspector-component="client/src/components/SyncTimeSettingsModal.tsx"
              >
                <span className="visualAlertToggleKnob" />
              </button>
              <input
                className="syncTimeInput offsetInput"
                type="text"
                inputMode="numeric"
                value={String(settings.offsetMinPx)}
                onChange={(e) => handleNumberChange(e.target.value, 'offsetMinPx')}
                disabled={isOffsetLocked}
                data-inspector-id="syncTime.offsetMinInput"
                data-inspector-label="Sync offset minimum pixel input"
                data-inspector-component="client/src/components/SyncTimeSettingsModal.tsx"
              />
              <span className="syncTimeRangeDash">-</span>
              <input
                className="syncTimeInput offsetInput"
                type="text"
                inputMode="numeric"
                value={String(settings.offsetMaxPx)}
                onChange={(e) => handleNumberChange(e.target.value, 'offsetMaxPx')}
                disabled={isOffsetLocked}
                data-inspector-id="syncTime.offsetMaxInput"
                data-inspector-label="Sync offset maximum pixel input"
                data-inspector-component="client/src/components/SyncTimeSettingsModal.tsx"
              />
              <span className="syncTimeUnit">px</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
