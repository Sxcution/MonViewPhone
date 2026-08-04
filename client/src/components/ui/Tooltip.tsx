import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { OverlayPortal } from './OverlayPortal';
import { OverlayManager } from './OverlayManager';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipIdRef = useRef<string>(`tooltip-${Math.random().toString(36).substr(2, 9)}`);

  const showTooltip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    if (!isVisible) return;

    const unregister = OverlayManager.register({
      id: tooltipIdRef.current,
      type: 'tooltip',
      onClose: hideTooltip,
      closeOnEscape: true,
    });

    const handleScrollOrResize = () => hideTooltip();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize, true);

    return () => {
      unregister();
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize, true);
    };
  }, [isVisible]);

  useLayoutEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 6;

    let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    let top = triggerRect.top - tooltipRect.height - margin;

    if (placement === 'bottom') {
      top = triggerRect.bottom + margin;
    } else if (placement === 'left') {
      left = triggerRect.left - tooltipRect.width - margin;
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
    } else if (placement === 'right') {
      left = triggerRect.right + margin;
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
    }

    // Auto flip
    if (top < margin && placement === 'top') {
      top = triggerRect.bottom + margin;
    }
    if (top + tooltipRect.height > vh - margin && placement === 'bottom') {
      top = triggerRect.top - tooltipRect.height - margin;
    }

    // Clamping
    if (left + tooltipRect.width > vw - margin) left = vw - tooltipRect.width - margin;
    if (left < margin) left = margin;
    if (top < margin) top = margin;

    setPos({ left, top });
  }, [isVisible, placement]);

  if (!content) return children;

  const child = React.Children.only(children);

  return (
    <>
      {React.cloneElement(child, {
        ref: (node: HTMLElement) => {
          triggerRef.current = node;
          // Retain original ref if exists
          const { ref } = child as any;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        },
        onMouseEnter: (e: React.MouseEvent) => {
          showTooltip();
          if (child.props.onMouseEnter) child.props.onMouseEnter(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
          hideTooltip();
          if (child.props.onMouseLeave) child.props.onMouseLeave(e);
        },
        onFocus: (e: React.FocusEvent) => {
          showTooltip();
          if (child.props.onFocus) child.props.onFocus(e);
        },
        onBlur: (e: React.FocusEvent) => {
          hideTooltip();
          if (child.props.onBlur) child.props.onBlur(e);
        },
        onClick: (e: React.MouseEvent) => {
          hideTooltip();
          if (child.props.onClick) child.props.onClick(e);
        },
      })}

      {isVisible && (
        <OverlayPortal>
          <div
            ref={tooltipRef}
            className="vsp-tooltip"
            style={{
              position: 'fixed',
              left: `${pos.left}px`,
              top: `${pos.top}px`,
              zIndex: 'var(--md-layer-tooltip, 30500)',
              pointerEvents: 'none',
              background: 'rgba(18, 20, 26, 0.95)',
              color: 'var(--md-text, #ffffff)',
              border: '1px solid var(--md-border-strong, #3b4252)',
              borderRadius: 'var(--md-radius-sm, 6px)',
              padding: '5px 9px',
              fontSize: '12px',
              lineHeight: '1.3',
              boxShadow: 'var(--md-shadow-soft, 0 4px 12px rgba(0, 0, 0, 0.4))',
              whiteSpace: 'nowrap',
            }}
          >
            {content}
          </div>
        </OverlayPortal>
      )}
    </>
  );
};
