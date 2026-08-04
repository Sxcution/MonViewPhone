import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const OVERLAY_ROOT_ID = 'overlay-root';

function getOrCreateOverlayRoot(): HTMLElement {
  let root = document.getElementById(OVERLAY_ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = OVERLAY_ROOT_ID;
    document.body.appendChild(root);
  }
  return root;
}

export interface OverlayPortalProps {
  children: React.ReactNode;
}

export const OverlayPortal: React.FC<OverlayPortalProps> = ({ children }) => {
  const [container] = useState<HTMLElement | null>(() => {
    if (typeof document !== 'undefined') {
      return getOrCreateOverlayRoot();
    }
    return null;
  });

  if (!container) return null;
  return createPortal(children, container);
};
