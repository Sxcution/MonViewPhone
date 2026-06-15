import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  MACRO_PLAYBACK_PROGRESS_EVENT,
  MACRO_PLAYBACK_STOP_EVENT,
  MACRO_PLAYBACK_REPLAY_EVENT,
  type MacroPlaybackProgressDetail,
  type MacroPlaybackStopDetail,
} from '@/lib/automationData';

export function MacroPlaybackPanel() {
  const [macroPlaybackItems, setMacroPlaybackItems] = useState<MacroPlaybackProgressDetail[]>([]);
  const [macroPlaybackExpanded, setMacroPlaybackExpanded] = useState(true);
  const [macroPlaybackNow, setMacroPlaybackNow] = useState(Date.now());
  const [macroPlaybackPosition, setMacroPlaybackPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('monviewphone:macro-playback-position');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const macroPlaybackDragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    panelEl?: HTMLElement | null;
    lastX?: number;
    lastY?: number;
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  // 1. Listen for macro playback progress updates
  useEffect(() => {
    const handleProgress = (e: Event) => {
      const detail = (e as CustomEvent<MacroPlaybackProgressDetail>).detail;
      if (!detail?.id) return;

      setMacroPlaybackItems(prev => {
        // If the item is marked as stopped/not running
        if (!detail.running) {
          // Return updated item with running state set to false
          return prev.map(item => item.id === detail.id ? { ...detail, running: false } : item);
        }

        const next = prev.filter(item => item.id !== detail.id);
        return [...next, detail];
      });

      setMacroPlaybackNow(Date.now());
    };

    window.addEventListener(MACRO_PLAYBACK_PROGRESS_EVENT, handleProgress);
    return () => {
      window.removeEventListener(MACRO_PLAYBACK_PROGRESS_EVENT, handleProgress);
    };
  }, []);

  // 2. High-performance interval: tick ONLY when at least one macro is actively running
  useEffect(() => {
    const hasRunningItem = macroPlaybackItems.some(item => item.running);
    if (!hasRunningItem) return;

    const id = window.setInterval(() => {
      setMacroPlaybackNow(Date.now());
    }, 1000);

    return () => window.clearInterval(id);
  }, [macroPlaybackItems]);

  // 3. Pointer drag handlers
  const onMacroPlaybackPointerMove = useCallback((event: PointerEvent) => {
    const drag = macroPlaybackDragRef.current;
    if (!drag.active || !drag.panelEl) return;
    event.preventDefault();
    const nextX = drag.originX + event.clientX - drag.startX;
    const nextY = drag.originY + event.clientY - drag.startY;
    const finalX = Math.max(8, Math.min(window.innerWidth - 180, nextX));
    const finalY = Math.max(8, Math.min(window.innerHeight - 48, nextY));

    drag.panelEl.style.left = `${finalX}px`;
    drag.panelEl.style.top = `${finalY}px`;

    drag.lastX = finalX;
    drag.lastY = finalY;
  }, []);

  const onMacroPlaybackPointerUp = useCallback(() => {
    const drag = macroPlaybackDragRef.current;
    if (!drag.active) return;
    drag.active = false;
    document.body.classList.remove('is-dragging-modal');
    window.removeEventListener('pointermove', onMacroPlaybackPointerMove);
    window.removeEventListener('pointerup', onMacroPlaybackPointerUp);

    if (drag.lastX !== undefined && drag.lastY !== undefined) {
      setMacroPlaybackPosition({ x: drag.lastX, y: drag.lastY });
      try {
        localStorage.setItem('monviewphone:macro-playback-position', JSON.stringify({ x: drag.lastX, y: drag.lastY }));
      } catch {}
    }
  }, [onMacroPlaybackPointerMove]);

  const startMacroPlaybackDrag = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button')) return;
    const panel = event.currentTarget.closest('.macroPlaybackPanel') as HTMLElement | null;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    macroPlaybackDragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
      panelEl: panel,
      lastX: rect.left,
      lastY: rect.top,
    };
    document.body.classList.add('is-dragging-modal');
    window.addEventListener('pointermove', onMacroPlaybackPointerMove, { passive: false });
    window.addEventListener('pointerup', onMacroPlaybackPointerUp);
  }, [onMacroPlaybackPointerMove, onMacroPlaybackPointerUp]);

  // 4. Time formatter
  const formatPlaybackElapsed = useCallback((startedAt: number) => {
    const elapsedSec = Math.max(0, Math.floor((macroPlaybackNow - startedAt) / 1000));
    return `${String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:${String(elapsedSec % 60).padStart(2, '0')}`;
  }, [macroPlaybackNow]);

  if (!macroPlaybackItems.length) return null;

  return createPortal(
    <section
      className={`macroPlaybackPanel${macroPlaybackExpanded ? ' expanded' : ' collapsed'}`}
      aria-label="Automation Playback"
      style={macroPlaybackPosition ? {
        left: macroPlaybackPosition.x,
        top: macroPlaybackPosition.y,
        right: 'auto',
        bottom: 'auto',
      } : undefined}
      data-inspector-id="macroPlayback.panel"
      data-inspector-label="Automation macro playback status overlay panel"
      data-inspector-component="client/src/components/MacroPlaybackPanel.tsx"
    >
      {/* startMacroPlaybackDrag : Drag panel header handler */}
      <header className="macroPlaybackHeader" onPointerDown={startMacroPlaybackDrag}>
        <div className="macroPlaybackHeading">
          <span>Automation Playback</span>
          <small>{macroPlaybackItems.filter(i => i.running).length > 0 ? `${macroPlaybackItems.filter(i => i.running).length} đang chạy` : 'Hoàn tất'}</small>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {/* macroPlaybackToggleBtn : Button thu gọn / mở rộng */}
          <button
            type="button"
            className="modalBtn macroPlaybackToggleBtn"
            onClick={() => setMacroPlaybackExpanded(prev => !prev)}
            data-inspector-id="macroPlayback.toggleButton"
            data-inspector-label="Toggle playback details expand/collapse button"
            data-inspector-component="client/src/components/MacroPlaybackPanel.tsx"
          >
            {macroPlaybackExpanded ? 'Thu gọn' : 'Mở rộng'}
          </button>
          {/* macroPlaybackCloseBtn : Button đóng panel và dừng các macro đang chạy */}
          <button
            type="button"
            className="modalBtn macroPlaybackCloseBtn"
            onClick={() => {
              macroPlaybackItems.forEach(item => {
                if (item.running) {
                  const detail: MacroPlaybackStopDetail = { id: item.id };
                  window.dispatchEvent(new CustomEvent(MACRO_PLAYBACK_STOP_EVENT, { detail }));
                }
              });
              setMacroPlaybackItems([]);
            }}
            title="Đóng panel"
            data-inspector-id="macroPlayback.closeButton"
            data-inspector-label="Close playback status panel and stop macros button"
            data-inspector-component="client/src/components/MacroPlaybackPanel.tsx"
          >
            ✕
          </button>
        </div>
      </header>
      {macroPlaybackExpanded ? (
        <div className="macroPlaybackList">
          {macroPlaybackItems.map(item => (
            <div 
              key={item.id} 
              className={`macroPlaybackItem${!item.running ? ' finished' : ''}`}
              data-inspector-id="macroPlayback.itemRow"
              data-inspector-label={`Macro execution status for: ${item.title}`}
              data-inspector-component="client/src/components/MacroPlaybackPanel.tsx"
            >
              <div className="macroPlaybackItemText">
                <span>
                  {item.running
                    ? (item.totalSteps !== undefined ? `Đang chạy (${item.currentStep ?? 0}/${item.totalSteps}):` : 'Đang chạy:')
                    : (item.totalSteps !== undefined ? `Hoàn tất (${item.totalSteps}/${item.totalSteps}):` : 'Hoàn tất:')}
                </span>
                <strong>{item.title}</strong>
                <small>{formatPlaybackElapsed(item.startedAt)}</small>
              </div>
              {item.running ? (
                /* macroPlaybackStopBtn : Button dừng macro */
                <button
                  type="button"
                  className="modalBtnDanger macroPlaybackStopBtn"
                  onClick={() => {
                    const detail: MacroPlaybackStopDetail = { id: item.id };
                    window.dispatchEvent(new CustomEvent(MACRO_PLAYBACK_STOP_EVENT, { detail }));
                    setMacroPlaybackItems(prev => prev.filter(progress => progress.id !== item.id));
                  }}
                  data-inspector-id="macroPlayback.stopButton"
                  data-inspector-label="Stop macro button"
                  data-inspector-component="client/src/components/MacroPlaybackPanel.tsx"
                >
                  Stop
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 4 }}>
                  {item.replayAppId && item.replayActionId ? (
                    /* macroPlaybackPlayBtn : Button phát lại macro */
                    <button
                      type="button"
                      className="modalBtnPrimary macroPlaybackStopBtn"
                      onClick={() => {
                        setMacroPlaybackItems(prev => prev.filter(p => p.id !== item.id));
                        window.dispatchEvent(new CustomEvent(MACRO_PLAYBACK_REPLAY_EVENT, {
                          detail: { appId: item.replayAppId, actionId: item.replayActionId }
                        }));
                      }}
                      data-inspector-id="macroPlayback.replayButton"
                      data-inspector-label="Replay macro button"
                      data-inspector-component="client/src/components/MacroPlaybackPanel.tsx"
                    >
                      ▶ Play
                    </button>
                  ) : null}
                  {/* macroPlaybackRemoveBtn : Button xóa item khỏi danh sách */}
                  <button
                    type="button"
                    className="modalBtn macroPlaybackStopBtn"
                    onClick={() => setMacroPlaybackItems(prev => prev.filter(p => p.id !== item.id))}
                    title="Xóa khỏi danh sách"
                    data-inspector-id="macroPlayback.removeItemButton"
                    data-inspector-label="Remove macro item from list button"
                    data-inspector-component="client/src/components/MacroPlaybackPanel.tsx"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </section>,
    document.body
  );
}
