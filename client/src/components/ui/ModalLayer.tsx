import React, { useEffect, useRef } from 'react';
import { OverlayPortal } from './OverlayPortal';
import { OverlayManager, OverlayType } from './OverlayManager';

export interface ModalLayerProps {
  isOpen: boolean;
  onClose: () => void;
  level?: 'modal' | 'modal-child' | 'confirm';
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  cardStyle?: React.CSSProperties;
  role?: 'dialog' | 'alertdialog';
  ariaLabel?: string;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  showBackdrop?: boolean;
}

export const ModalLayer: React.FC<ModalLayerProps> = ({
  isOpen,
  onClose,
  level = 'modal',
  children,
  className = '',
  overlayClassName = '',
  cardStyle,
  role = 'dialog',
  ariaLabel,
  closeOnOutsideClick = false,
  closeOnEscape = true,
}) => {
  const modalIdRef = useRef<string>(`modal-${Math.random().toString(36).substr(2, 9)}`);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const unregister = OverlayManager.register({
      id: modalIdRef.current,
      type: level as OverlayType,
      onClose,
      closeOnEscape,
      closeOnOutsideClick,
    });

    // Focus first focusable element inside modal or modal container itself
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      unregister();
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, level, onClose, closeOnEscape, closeOnOutsideClick]);

  // Focus trap
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab' && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOutsideClick) {
      if (OverlayManager.isTopOverlay(modalIdRef.current)) {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  const zIndexVar =
    level === 'confirm'
      ? 'var(--md-layer-confirm, 31000)'
      : level === 'modal-child'
      ? 'var(--md-layer-modal-child, 28000)'
      : 'var(--md-layer-modal, 27000)';

  return (
    <OverlayPortal>
      <div
        className={`vsp-modal-overlay ${overlayClassName}`}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: zIndexVar,
          background: 'transparent',
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={handleBackdropClick}
      >
        <div
          ref={modalRef}
          role={role}
          aria-modal="true"
          aria-label={ariaLabel}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className={className}
          style={cardStyle}
        >
          {children}
        </div>
      </div>
    </OverlayPortal>
  );
};
