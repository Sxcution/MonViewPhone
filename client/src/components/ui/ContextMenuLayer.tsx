import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { OverlayPortal } from './OverlayPortal';
import { OverlayManager } from './OverlayManager';

export interface ContextMenuLayerProps {
  isOpen: boolean;
  onClose: () => void;
  x: number;
  y: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ContextMenuLayer: React.FC<ContextMenuLayerProps> = ({
  isOpen,
  onClose,
  x,
  y,
  children,
  className = 'contextMenuPanel',
  style = {},
}) => {
  const menuIdRef = useRef<string>(`menu-${Math.random().toString(36).substr(2, 9)}`);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useEffect(() => {
    if (!isOpen) return;

    const unregister = OverlayManager.register({
      id: menuIdRef.current,
      type: 'menu',
      onClose,
      closeOnEscape: true,
    });

    const handlePointerDownOutside = (e: PointerEvent | MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (OverlayManager.isTopOverlay(menuIdRef.current)) {
          onClose();
        }
      }
    };

    const handleScrollOrResize = () => {
      onClose();
    };

    window.addEventListener('pointerdown', handlePointerDownOutside, true);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize, true);

    return () => {
      unregister();
      window.removeEventListener('pointerdown', handlePointerDownOutside, true);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize, true);
    };
  }, [isOpen, onClose]);

  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;

    let finalLeft = x;
    let finalTop = y;

    // Flip or clamp horizontal
    if (x + rect.width > vw - margin) {
      finalLeft = Math.max(margin, vw - rect.width - margin);
    }
    if (finalLeft < margin) finalLeft = margin;

    // Flip or clamp vertical
    if (y + rect.height > vh - margin) {
      finalTop = Math.max(margin, vh - rect.height - margin);
    }
    if (finalTop < margin) finalTop = margin;

    setPos({ left: finalLeft, top: finalTop });
  }, [isOpen, x, y]);

  if (!isOpen) return null;

  return (
    <OverlayPortal>
      <div
        ref={menuRef}
        className={className}
        style={{
          position: 'fixed',
          left: `${pos.left}px`,
          top: `${pos.top}px`,
          zIndex: 'var(--md-layer-menu, 30000)',
          pointerEvents: 'auto',
          ...style,
        }}
        onMouseDown={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        onContextMenu={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {children}
      </div>
    </OverlayPortal>
  );
};
