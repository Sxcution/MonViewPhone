import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const OVERLAY_ROOT_ID = 'overlay-root';

function getOrCreateOverlayRoot(): HTMLElement {
  let root = document.getElementById(OVERLAY_ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = OVERLAY_ROOT_ID;
    root.style.position = 'fixed';
    root.style.top = '0';
    root.style.left = '0';
    root.style.width = '100vw';
    root.style.height = '0';
    root.style.pointerEvents = 'none';
    root.style.zIndex = 'var(--md-layer-modal, 27000)';
    document.body.appendChild(root);
  }
  return root;
}

export interface OverlayPortalProps {
  children: React.ReactNode;
}

export const OverlayPortal: React.FC<OverlayPortalProps> = ({ children }) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setContainer(getOrCreateOverlayRoot());
  }, []);

  if (!container) return null;
  return createPortal(children, container);
};
