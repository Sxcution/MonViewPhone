import React, { useEffect, useRef } from 'react';
import { OverlayPortal } from './OverlayPortal';
import { OverlayManager } from './OverlayManager';

export interface FloatingTooltipProps {
  isOpen: boolean;
  onClose: () => void;
  x: number;
  y: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const getFloatingTooltipStyle = (x: number, y: number): React.CSSProperties => {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Offset slightly from cursor so tooltip doesn't block cursor interactions
  let left = x + 12;
  let top = y + 16;

  // Viewport clamping
  if (left > vw - 240) {
    left = Math.max(8, x - 220);
  }
  if (top > vh - 100) {
    top = Math.max(8, y - 80);
  }

  return {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
  };
};

export const FloatingTooltip: React.FC<FloatingTooltipProps> = ({
  isOpen,
  onClose,
  x,
  y,
  children,
  className = 'dav-bell-tooltip-floating',
  style = {},
}) => {
  const tooltipIdRef = useRef<string>(`tooltip-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!isOpen) return;

    const unregister = OverlayManager.register({
      id: tooltipIdRef.current,
      type: 'tooltip',
      onClose,
      closeOnEscape: true,
    });

    return () => {
      unregister();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <OverlayPortal>
      <div
        className={className}
        style={{
          ...getFloatingTooltipStyle(x, y),
          position: 'fixed',
          zIndex: 'var(--md-layer-tooltip, 30500)',
          pointerEvents: 'none',
          ...style,
        }}
      >
        {children}
      </div>
    </OverlayPortal>
  );
};
