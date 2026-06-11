import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  COLOR_ROLES,
  getThemeRoleForElement,
  loadThemeOverrides,
  setThemeOverride,
  removeThemeOverride,
  normalizeHexColor,
  applyThemeOverrides,
  type ThemeColorRole
} from '@/lib/themeInspector';

type ThemeInspectorProps = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
};

interface HoverState {
  x: number;
  y: number;
  role: ThemeColorRole;
  currentColor: string;
  target: HTMLElement;
}

function rgbToHex(rgbStr: string): string {
  if (!rgbStr) return '#000000';
  const match = rgbStr.match(/\d+/g);
  if (!match || match.length < 3) return rgbStr;
  const r = parseInt(match[0], 10);
  const g = parseInt(match[1], 10);
  const b = parseInt(match[2], 10);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

export function ThemeInspector({ enabled, onEnabledChange }: ThemeInspectorProps) {
  const [hoverState, setHoverState] = useState<HoverState | null>(null);
  const [editingRole, setEditingRole] = useState<{ role: ThemeColorRole; currentColor: string } | null>(null);
  
  // Editor values
  const [newColorText, setNewColorText] = useState('');
  const [colorPickerValue, setColorPickerValue] = useState('#000000');

  const hoveredTargetRef = useRef<HTMLElement | null>(null);
  const hoverStateRef = useRef<HoverState | null>(null);

  const rafRef = useRef<number | null>(null);
  const lastPointerRef = useRef<PointerEvent | null>(null);

  // Sync color picker with text input
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewColorText(val);
    const normalized = normalizeHexColor(val);
    if (normalized) {
      setColorPickerValue(normalized);
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setColorPickerValue(val);
    setNewColorText(val);
  };

  // Listen for reset-all event to clear editing panel if open
  useEffect(() => {
    const handleResetAll = () => {
      setEditingRole(null);
    };
    window.addEventListener('monviewphone:theme-reset-all', handleResetAll);
    return () => {
      window.removeEventListener('monviewphone:theme-reset-all', handleResetAll);
    };
  }, []);

  function cleanupHoverClassOnly() {
    if (hoveredTargetRef.current) {
      hoveredTargetRef.current.classList.remove('themeInspectorHoverTarget');
      hoveredTargetRef.current = null;
    }
  }

  function clearHoverState() {
    cleanupHoverClassOnly();
    hoverStateRef.current = null;
    setHoverState(null);
  }

  // Handle pointermove, pointerdown, contextmenu
  useEffect(() => {
    if (!enabled) {
      clearHoverState();
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.closest('.themeInspectorRoot')) {
        clearHoverState();
        return;
      }

      lastPointerRef.current = e;
      if (rafRef.current !== null) return;
      
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const evt = lastPointerRef.current;
        if (!evt) return;

        const currentTarget = evt.target as HTMLElement | null;
        if (!currentTarget || currentTarget.closest('.themeInspectorRoot')) {
          clearHoverState();
          return;
        }

        const match = getThemeRoleForElement(currentTarget);
        if (match) {
          const { role, element: matchedEl } = match;

          if (hoveredTargetRef.current !== matchedEl) {
            cleanupHoverClassOnly();
            matchedEl.classList.add('themeInspectorHoverTarget');
            hoveredTargetRef.current = matchedEl;
          }

          const computed = window.getComputedStyle(matchedEl);
          const rawColor = computed.getPropertyValue(role.property) || '';
          const hexColor = rgbToHex(rawColor);

          const nextHoverState = {
            x: evt.clientX,
            y: evt.clientY,
            role,
            currentColor: hexColor,
            target: matchedEl
          };
          hoverStateRef.current = nextHoverState;
          setHoverState(nextHoverState);
        } else {
          clearHoverState();
        }
      });
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.themeInspectorRoot')) {
        return;
      }

      const currentHover = hoverStateRef.current;
      if (currentHover) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        setEditingRole({
          role: currentHover.role,
          currentColor: currentHover.currentColor
        });
        const currentOverrides = loadThemeOverrides();
        const activeColor = currentOverrides[currentHover.role.cssVar] || currentHover.currentColor;
        setNewColorText(activeColor);
        const normalized = normalizeHexColor(activeColor);
        if (normalized) {
          setColorPickerValue(normalized);
        }

        clearHoverState();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.themeInspectorRoot')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      cleanupHoverClassOnly();
    };
  }, [enabled]);

  // Keyboard handler for Escape keys
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (editingRole) {
          setEditingRole(null);
        } else {
          onEnabledChange(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, editingRole, onEnabledChange]);

  // Clean up outline on unmount
  useEffect(() => {
    return () => {
      if (hoveredTargetRef.current) {
        hoveredTargetRef.current.classList.remove('themeInspectorHoverTarget');
      }
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleApply = () => {
    if (!editingRole) return;
    const normalized = normalizeHexColor(newColorText);
    if (!normalized) return;
    setThemeOverride(editingRole.role.cssVar, normalized);
    setEditingRole(null);
  };

  const handleResetCurrent = () => {
    if (!editingRole) return;
    removeThemeOverride(editingRole.role.cssVar);
    setEditingRole(null);
  };

  const isInvalidColor = newColorText.trim().length > 0 && !normalizeHexColor(newColorText);

  return (
    <>
      {/* 1. Tooltip */}
      {enabled && hoverState && !editingRole && createPortal(
        <div
          className="themeInspectorTooltip themeInspectorRoot"
          style={{
            position: 'fixed',
            left: hoverState.x + 15,
            top: hoverState.y + 15,
            pointerEvents: 'none',
            zIndex: 31000
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: 4, color: 'var(--md-info)' }}>
            {hoverState.role.label}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, marginBottom: 2 }}>
            Variable: <span style={{ color: 'var(--md-text-soft)' }}>{hoverState.role.cssVar}</span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, marginBottom: 2 }}>
            Property: <span style={{ color: 'var(--md-text-soft)' }}>{hoverState.role.property}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span>Color:</span>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: 2,
                background: hoverState.currentColor,
                border: '1px solid var(--md-border)'
              }}
            />
            <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{hoverState.currentColor}</span>
          </div>
        </div>,
        document.body
      )}

      {/* 2. Editor Modal */}
      {editingRole && createPortal(
        <div className="themeInspectorOverlay themeInspectorRoot">
          <div className="themeInspectorPanel" onMouseDown={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--md-border)', paddingBottom: 8, marginBottom: 4 }}>
              <strong style={{ fontSize: 15 }}>Theme Inspector Editor</strong>
              <button
                type="button"
                onClick={() => setEditingRole(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--md-muted)',
                  cursor: 'pointer',
                  fontSize: 16,
                  padding: 4
                }}
              >
                ✕
              </button>
            </div>

            <div className="themeInspectorRow">
              <span className="themeInspectorLabel" style={{ display: 'block', fontSize: 12, color: 'var(--md-muted)', marginBottom: 2 }}>Vùng UI:</span>
              <strong style={{ fontSize: 14 }}>{editingRole.role.label}</strong>
            </div>

            <div className="themeInspectorRow">
              <span className="themeInspectorLabel" style={{ display: 'block', fontSize: 12, color: 'var(--md-muted)', marginBottom: 2 }}>CSS Variable:</span>
              <code className="themeInspectorCode" style={{ fontFamily: 'monospace', fontSize: 12, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>
                {editingRole.role.cssVar}
              </code>
            </div>

            <div className="themeInspectorRow">
              <span className="themeInspectorLabel" style={{ display: 'block', fontSize: 12, color: 'var(--md-muted)', marginBottom: 2 }}>Giá trị màu hiện tại:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: editingRole.currentColor,
                    border: '1px solid var(--md-border)'
                  }}
                />
                <span style={{ fontFamily: 'monospace' }}>{editingRole.currentColor}</span>
              </div>
            </div>

            <div className="themeInspectorRow" style={{ marginTop: 4 }}>
              <span className="themeInspectorLabel" style={{ display: 'block', fontSize: 12, color: 'var(--md-muted)', marginBottom: 6 }}>Chọn màu mới:</span>
              <div className="themeInspectorColorRow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  className="modalInput"
                  value={newColorText}
                  onChange={handleTextChange}
                  placeholder="#Hex"
                  style={{
                    flex: 1,
                    height: 34,
                    background: 'rgba(255,255,255,0.055)',
                    border: isInvalidColor ? '1px solid var(--md-danger)' : '1px solid var(--md-border)',
                    borderRadius: 8,
                    color: 'var(--md-text)',
                    padding: '0 10px',
                    fontSize: 13,
                    outline: 'none'
                  }}
                />
                <input
                  type="color"
                  value={colorPickerValue}
                  onChange={handleColorPickerChange}
                  style={{
                    width: 44,
                    height: 34,
                    padding: 0,
                    border: '1px solid var(--md-border)',
                    borderRadius: 8,
                    background: 'transparent',
                    cursor: 'pointer'
                  }}
                />
              </div>
              {isInvalidColor && (
                <div style={{ color: 'var(--md-danger)', fontSize: 11, marginTop: 4 }}>
                  Vui lòng nhập mã màu Hex hợp lệ (VD: #FFF hoặc #123456)
                </div>
              )}
            </div>

            <div className="themeInspectorActions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button
                type="button"
                className="modalBtnDanger"
                onClick={handleResetCurrent}
                style={{ height: 34, borderRadius: 8, padding: '0 14px', fontSize: 12, cursor: 'pointer' }}
              >
                Reset màu này
              </button>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                className="modalBtn"
                onClick={() => setEditingRole(null)}
                style={{ height: 34, borderRadius: 8, padding: '0 14px', fontSize: 12, cursor: 'pointer' }}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="modalBtnPrimary"
                onClick={handleApply}
                disabled={isInvalidColor || !newColorText.trim()}
                style={{ height: 34, borderRadius: 8, padding: '0 14px', fontSize: 12, cursor: 'pointer' }}
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
