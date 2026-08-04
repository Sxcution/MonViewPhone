import React from 'react';
import { ModalLayer } from './ModalLayer';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  variant?: string;
  confirmDisabled?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  isDanger = false,
  variant,
  confirmDisabled = false,
}) => {
  if (!isOpen) return null;
  const isDangerous = isDanger || variant === 'danger';

  return (
    <ModalLayer
      isOpen={isOpen}
      onClose={onClose}
      level="confirm"
      role="alertdialog"
      ariaLabel={title}
      closeOnOutsideClick={false}
      closeOnEscape={true}
      overlayClassName="confirmOverlay confirmOverlay--top"
    >
      <div className="confirmPanel">
        <div className={`modalWarnTitle ${isDangerous ? 'modalWarnTitle--danger' : ''}`}>{title}</div>
        {message && <div className="confirmText">{message}</div>}
        <div className="confirmActions">
          <button type="button" className="modalBtn" onClick={onClose}>
            {cancelText}
          </button>
          <button
            type="button"
            className={isDangerous ? 'modalBtnDanger' : 'modalBtnPrimary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={confirmDisabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </ModalLayer>
  );
};
