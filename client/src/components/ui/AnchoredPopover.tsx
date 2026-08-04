import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { OverlayPortal } from './OverlayPortal';
import { OverlayManager } from './OverlayManager';

export type PopoverPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end'
  | 'right-start'
  | 'left-start';

export interface AnchoredPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
  anchorRef?: React.RefObject<any>;
  children: React.ReactNode;
  placement?: PopoverPlacement;
  className?: string;
  style?: React.CSSProperties;
  offset?: number;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
}

export const AnchoredPopover: React.FC<AnchoredPopoverProps> = ({
  isOpen,
  onClose,
  anchorEl,
  anchorRef,
  children,
  placement = 'bottom-start',
  className = 'anchoredPopoverPanel',
  style = {},
  offset = 4,
  closeOnOutsideClick = true,
  closeOnEscape = true,
}) => {
  const targetAnchor = anchorEl || (anchorRef ? anchorRef.current : null);
  const popoverIdRef = useRef<string>(`popover-${Math.random().toString(36).substr(2, 9)}`);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  const updatePosition = () => {
    if (!targetAnchor || !popoverRef.current) return;

    const anchorRect = targetAnchor.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;

    let left = anchorRect.left;
    let top = anchorRect.bottom + offset;

    // Evaluate preferred placement
    if (placement === 'bottom-end') {
      left = anchorRect.right - popoverRect.width;
    } else if (placement === 'top-start') {
      top = anchorRect.top - popoverRect.height - offset;
    } else if (placement === 'top-end') {
      left = anchorRect.right - popoverRect.width;
      top = anchorRect.top - popoverRect.height - offset;
    } else if (placement === 'right-start') {
      left = anchorRect.right + offset;
      top = anchorRect.top;
    } else if (placement === 'left-start') {
      left = anchorRect.left - popoverRect.width - offset;
      top = anchorRect.top;
    }

    // Auto flip vertical if overflowing bottom
    if (top + popoverRect.height > vh - margin && anchorRect.top - popoverRect.height - offset > margin) {
      top = anchorRect.top - popoverRect.height - offset;
    }
    // Auto flip vertical if overflowing top
    if (top < margin && anchorRect.bottom + popoverRect.height + offset < vh - margin) {
      top = anchorRect.bottom + offset;
    }

    // Horizontal clamping
    if (left + popoverRect.width > vw - margin) {
      left = Math.max(margin, vw - popoverRect.width - margin);
    }
    if (left < margin) left = margin;
    if (top < margin) top = margin;

    setPos({ left, top });
  };

  useEffect(() => {
    if (!isOpen) return;

    const unregister = OverlayManager.register({
      id: popoverIdRef.current,
      type: 'popover',
      onClose,
      closeOnEscape: true,
    });

    const handlePointerDown = (e: PointerEvent | MouseEvent) => {
      if (
        closeOnOutsideClick &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        (!targetAnchor || !targetAnchor.contains(e.target as Node))
      ) {
        if (OverlayManager.isTopOverlay(popoverIdRef.current)) {
          onClose();
        }
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize, true);

    let ro: ResizeObserver | null = null;
    if (anchorEl && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updatePosition());
      ro.observe(anchorEl);
    }

    return () => {
      unregister();
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize, true);
      if (ro) ro.disconnect();
    };
  }, [isOpen, anchorEl, onClose, closeOnOutsideClick]);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, anchorEl, placement]);

  if (!isOpen || !anchorEl) return null;

  return (
    <OverlayPortal>
      <div
        ref={popoverRef}
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
      >
        {children}
      </div>
    </OverlayPortal>
  );
};
