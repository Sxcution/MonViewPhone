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
  type ThemeColorRole,
  type ThemeColorMatch
} from '@/lib/themeInspector';

type ThemeInspectorProps = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
};

interface HoverState {
  x: number;
  y: number;
  match: ThemeColorMatch;
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

async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Navigator clipboard writeText failed, trying fallback...', err);
    }
  }
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback copy failed', err);
    return false;
  }
}

export function ThemeInspector({ enabled, onEnabledChange }: ThemeInspectorProps) {
  const [hoverState, setHoverState] = useState<HoverState | null>(null);
  const [editingRole, setEditingRole] = useState<{ match: ThemeColorMatch } | null>(null);
  const [copiedState, setCopiedState] = useState<{ text: string; type: 'id' | 'var'; x: number; y: number } | null>(null);
  
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
          const matchedEl = match.element;

          if (hoveredTargetRef.current !== matchedEl) {
            cleanupHoverClassOnly();
            matchedEl.classList.add('themeInspectorHoverTarget');
            hoveredTargetRef.current = matchedEl;
          }

          const hexColor = match.currentColor || '#000000';

          const nextHoverState = {
            x: evt.clientX,
            y: evt.clientY,
            match,
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
        // ALWAYS block native click to prevent triggering underlying UI actions
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const match = currentHover.match;

        if (e.ctrlKey) {
          // Ctrl + Click: Open editing card
          setEditingRole({
            match
          });
          const currentOverrides = loadThemeOverrides();
          const activeColor = currentOverrides[match.cssVar] || match.currentColor || '#000000';
          setNewColorText(activeColor);
          const normalized = normalizeHexColor(activeColor);
          if (normalized) {
            setColorPickerValue(normalized);
          }
          clearHoverState();
        } else if (e.altKey || e.shiftKey) {
          // Alt/Shift + Click: Copy Style Variable
          const cssVar = match.cssVar;
          copyToClipboard(cssVar).then(() => {
            setCopiedState({ text: cssVar, type: 'var', x: e.clientX, y: e.clientY });
            setTimeout(() => setCopiedState(null), 1500);
          });
        } else {
          // Normal Click: Copy LOGIC TARGET info block
          const textToCopy = `Inspector ID Target: ${match.inspectorId}
Label: ${match.label}
Selector: ${match.selector}
Class: ${match.classNameExact || ''}
Component: ${match.component || ''}
Style Variable: ${match.cssVar}
Property: ${match.property}`;

          copyToClipboard(textToCopy).then(() => {
            setCopiedState({ text: match.inspectorId, type: 'id', x: e.clientX, y: e.clientY });
            setTimeout(() => setCopiedState(null), 1500);
          });
        }
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
    setThemeOverride(editingRole.match.cssVar, normalized);
    setEditingRole(null);
  };

  const handleResetCurrent = () => {
    if (!editingRole) return;
    removeThemeOverride(editingRole.match.cssVar);
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
            zIndex: 31000,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '10px 12px'
          }}
        >
          {/* LOGIC TARGET INFO section */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--md-info)', fontWeight: 'bold', marginBottom: '4px' }}>
              Logic Target Info
            </div>
            <div style={{ fontWeight: 'bold', marginBottom: '2px', color: 'var(--md-text)' }}>
              {hoverState.match.label || 'Unknown Target'}
            </div>
            {hoverState.match.inspectorId && (
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--md-text-soft)' }}>
                Inspector ID: <span style={{ color: 'var(--md-info)' }}>{hoverState.match.inspectorId}</span>
              </div>
            )}
            {hoverState.match.component && (
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--md-muted)', marginTop: '2px', wordBreak: 'break-all' }}>
                file: {hoverState.match.component}
              </div>
            )}
          </div>

          {/* STYLE INFO section */}
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--md-info)', fontWeight: 'bold', marginBottom: '4px' }}>
              Style Info
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', marginBottom: '2px' }}>
              Style Variable: <span style={{ color: 'var(--md-text-soft)', fontWeight: 'bold' }}>{hoverState.match.cssVar}</span>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', marginBottom: '2px' }}>
              Property: <span style={{ color: 'var(--md-text-soft)' }}>{hoverState.match.property}</span>
            </div>
            {hoverState.match.selector && (
              <div style={{ fontFamily: 'monospace', fontSize: '11px', marginBottom: '2px', wordBreak: 'break-all' }}>
                Selector: <span style={{ color: 'var(--md-muted)' }}>{hoverState.match.selector}</span>
              </div>
            )}
            {hoverState.match.currentColor && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '11px' }}>Color:</span>
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    borderRadius: '2px',
                    background: hoverState.match.currentColor,
                    border: '1px solid var(--md-border)'
                  }}
                />
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px' }}>{hoverState.match.currentColor}</span>
              </div>
            )}
          </div>

          {/* Candidates list (if multiple found) */}
          {hoverState.match.candidates && hoverState.match.candidates.length > 1 && (
            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '4px', fontSize: '9px', color: 'var(--md-muted)' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Other Variables:</div>
              {hoverState.match.candidates.slice(1, 4).map((c, i) => (
                <div key={i} style={{ fontFamily: 'monospace' }}>
                  {c.property}: {c.cssVar}
                </div>
              ))}
            </div>
          )}

          {/* Guide section */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px', fontSize: '10px', color: 'var(--md-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div>• Click: Copy Logic Target Info</div>
            <div>• Alt/Shift + Click: Copy Style Variable</div>
            <div>• Ctrl + Click: Open Color Editor</div>
          </div>
        </div>,
        document.body
      )}

      {/* 2. Editor Modal */}
      {editingRole && createPortal(
        <div className="themeInspectorOverlay themeInspectorRoot">
          <div className="themeInspectorPanel" onMouseDown={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--md-border)', paddingBottom: 8, marginBottom: 4 }}>
              <strong style={{ fontSize: 15 }}>Inspector ID Editor</strong>
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
              <span className="themeInspectorLabel" style={{ display: 'block', fontSize: 12, color: 'var(--md-muted)', marginBottom: 2 }}>Inspector ID:</span>
              <strong style={{ fontSize: 14 }}>{editingRole.match.inspectorId}</strong>
            </div>

            <div className="themeInspectorRow">
              <span className="themeInspectorLabel" style={{ display: 'block', fontSize: 12, color: 'var(--md-muted)', marginBottom: 2 }}>Style Variable:</span>
              <code className="themeInspectorCode" style={{ fontFamily: 'monospace', fontSize: 12, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>
                {editingRole.match.cssVar}
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
                    background: editingRole.match.currentColor || '#000000',
                    border: '1px solid var(--md-border)'
                  }}
                />
                <span style={{ fontFamily: 'monospace' }}>{editingRole.match.currentColor || '#000000'}</span>
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

      {/* 3. Toast status overlay */}
      {copiedState && createPortal(
        <div
          className="themeInspectorRoot"
          style={{
            position: 'fixed',
            left: copiedState.x + 15,
            top: copiedState.y + 15,
            pointerEvents: 'none',
            zIndex: 32000,
            background: 'var(--md-success, #10b981)',
            color: '#ffffff',
            border: '1px solid var(--md-border-strong)',
            padding: '6px 12px',
            borderRadius: '6px',
            boxShadow: 'var(--md-shadow-panel)',
            fontWeight: 'bold',
            fontSize: '12px'
          }}
        >
          {copiedState.type === 'var' ? 'Copied Style Variable' : 'Copied Inspector ID'}: {copiedState.text}
        </div>,
        document.body
      )}
    </>
  );
}
