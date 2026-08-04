import React, { useState, useRef } from 'react';
import { AnchoredPopover } from './AnchoredPopover';
import { ContextMenuLayer } from './ContextMenuLayer';
import { ConfirmDialog } from './ConfirmDialog';
import { ModalLayer } from './ModalLayer';
import { FloatingTooltip } from './FloatingTooltip';

export const OverlayTestHarness: React.FC = () => {
  const [popoverRefOpen, setPopoverRefOpen] = useState(false);
  const [popoverElOpen, setPopoverElOpen] = useState(false);
  const [popoverClampOpen, setPopoverClampOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const anchorBtnRef = useRef<HTMLButtonElement>(null);
  const clampBtnRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <div
      id="overlay-test-harness"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        background: '#111',
        color: '#fff',
      }}
    >
      <h2>Overlay Primitive Real React Component Test Harness</h2>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          ref={anchorBtnRef}
          id="btn-popover-ref"
          onClick={() => setPopoverRefOpen(!popoverRefOpen)}
        >
          Toggle Popover Ref
        </button>

        <button
          id="btn-popover-el"
          ref={node => setAnchorEl(node)}
          onClick={() => setPopoverElOpen(!popoverElOpen)}
        >
          Toggle Popover El
        </button>

        <button
          id="btn-context-menu"
          onClick={() => setContextMenuOpen(!contextMenuOpen)}
        >
          Toggle Context Menu
        </button>

        <button
          id="btn-confirm-dialog"
          onClick={() => setConfirmOpen(!confirmOpen)}
        >
          Toggle Confirm Dialog
        </button>

        <button
          id="btn-modal-layer"
          onClick={() => setModalOpen(!modalOpen)}
        >
          Toggle Modal Layer
        </button>

        <button
          id="btn-reminder-no-escape"
          onClick={() => setReminderOpen(!reminderOpen)}
        >
          Toggle Reminder (No Escape)
        </button>

        <button
          id="btn-floating-tooltip"
          onClick={() => setTooltipOpen(!tooltipOpen)}
        >
          Toggle Floating Tooltip
        </button>

        <button
          ref={clampBtnRef}
          id="btn-clamp-test"
          style={{ position: 'fixed', right: '10px', bottom: '10px' }}
          onClick={() => setPopoverClampOpen(!popoverClampOpen)}
        >
          Clamp Target Bottom Right
        </button>
      </div>

      {/* Real AnchoredPopover via anchorRef */}
      <AnchoredPopover
        isOpen={popoverRefOpen}
        onClose={() => setPopoverRefOpen(false)}
        anchorRef={anchorBtnRef}
        className="test-popover-ref-panel"
      >
        <div id="test-popover-ref-content" style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #555' }}>
          Real Popover content via anchorRef
        </div>
      </AnchoredPopover>

      {/* Real AnchoredPopover for Clamping */}
      <AnchoredPopover
        isOpen={popoverClampOpen}
        onClose={() => setPopoverClampOpen(false)}
        anchorRef={clampBtnRef}
        className="test-popover-clamp-panel"
      >
        <div id="test-popover-clamp-content" style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #555', width: '200px', height: '100px' }}>
          Real Clamped Popover Content
        </div>
      </AnchoredPopover>

      {/* Real AnchoredPopover via anchorEl */}
      <AnchoredPopover
        isOpen={popoverElOpen}
        onClose={() => setPopoverElOpen(false)}
        anchorEl={anchorEl}
        className="test-popover-el-panel"
      >
        <div id="test-popover-el-content" style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #555' }}>
          Real Popover content via anchorEl
        </div>
      </AnchoredPopover>

      {/* Real ContextMenuLayer */}
      <ContextMenuLayer
        isOpen={contextMenuOpen}
        onClose={() => setContextMenuOpen(false)}
        x={300}
        y={200}
        className="test-context-menu-panel"
      >
        <div id="test-context-menu-content" style={{ padding: '10px', background: '#333', color: '#fff', width: '150px' }}>
          Real Context Menu
        </div>
      </ContextMenuLayer>

      {/* Real ConfirmDialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
        title="Confirm Test Title"
        message="Confirm Test Message Content"
        confirmText="OK Confirm"
        cancelText="Cancel Confirm"
      />

      {/* Real ModalLayer */}
      <ModalLayer
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div id="test-modal-content" style={{ padding: '20px', color: '#fff' }}>
          Real Modal Layer Inner Content
        </div>
      </ModalLayer>

      {/* Real Reminder Popover (closeOnEscape = false) */}
      <AnchoredPopover
        isOpen={reminderOpen}
        onClose={() => {}}
        anchorRef={anchorBtnRef}
        closeOnEscape={false}
        className="test-reminder-no-escape-panel"
      >
        <div id="test-reminder-content" style={{ padding: '10px', background: '#444', color: '#fff' }}>
          Daily Reminder Popover (closeOnEscape=false)
        </div>
      </AnchoredPopover>

      {/* Real FloatingTooltip */}
      <FloatingTooltip
        isOpen={tooltipOpen}
        onClose={() => setTooltipOpen(null as any)}
        x={400}
        y={300}
      >
        <div id="test-tooltip-content">Real Floating Tooltip Content</div>
      </FloatingTooltip>
    </div>
  );
};
