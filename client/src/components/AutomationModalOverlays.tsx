import { useEffect, useRef, useState } from 'react'
import type { AutomationDeviceProfile } from '@/lib/automationData'
import { ConfirmDialog, ModalLayer } from '@/components/ui'

export type AutomationDeviceOption = {
  udid: string
  number: number
  manufacturer?: string
  model?: string
}

export type ConfirmModalState = {
  title: string
  message: string
  onConfirm: () => void
} | null

export type InputModalState = {
  key: string
  title: string
  label?: string
  placeholder?: string
  defaultValue?: string
  confirmText?: string
  onConfirm: (value: string) => void
} | null

export function ConfirmDeleteModal({ state, onClose }: { state: ConfirmModalState; onClose: () => void }) {
  if (!state) return null;
  /* confirmOverlay--top */
  return (
    <ConfirmDialog
      isOpen={true}
      title={state.title}
      message={state.message}
      confirmText="Xác Nhận"
      cancelText="Huỷ"
      variant="danger"
      onConfirm={state.onConfirm}
      onClose={onClose}
    />
  );
}

function InputModalInner({ state, onClose }: { state: NonNullable<InputModalState>; onClose: () => void }) {
  const [value, setValue] = useState(state.defaultValue ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = () => {
    const v = value.trim();
    if (!v) return;
    state.onConfirm(v);
  };

  return (
    <ModalLayer level="confirm" isOpen={true} onClose={onClose} showBackdrop={true}>
      <div 
        className="confirmPanel" 
        style={{ minWidth: 380, maxWidth: 480 }} 
        onMouseDown={e => e.stopPropagation()}
        data-inspector-id="automation.inputModalPanel"
        data-inspector-label="Automation text input modal card"
        data-inspector-component="client/src/components/AutomationModalOverlays.tsx"
      >
        <div className="confirmTitle">{state.title}</div>
        <div className="confirmText">
          {state.label ? <label className="modalLabelSmall" style={{ display: 'block', marginBottom: 8 }}>{state.label}</label> : null}
          <input
            ref={inputRef}
            type='text'
            className="modalInput"
            placeholder={state.placeholder ?? ''}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSubmit();
              if (e.key === 'Escape') onClose();
            }}
            data-inspector-id="automation.inputModalField"
            data-inspector-label="Text input field in modal"
            data-inspector-component="client/src/components/AutomationModalOverlays.tsx"
          />
        </div>
        <div className="confirmActions">
          <button 
            type='button' 
            className="modalBtn" 
            onClick={onClose}
            data-inspector-id="automation.inputModalCancelButton"
            data-inspector-label="Cancel button in text input modal"
            data-inspector-component="client/src/components/AutomationModalOverlays.tsx"
          >
            Huỷ
          </button>
          <button
            type='button'
            className="modalBtnPrimary"
            style={{
              opacity: value.trim() ? 1 : 0.5,
              cursor: value.trim() ? 'pointer' : 'not-allowed',
            }}
            disabled={!value.trim()}
            onClick={handleSubmit}
            data-inspector-id="automation.inputModalConfirmButton"
            data-inspector-label="Confirm button in text input modal"
            data-inspector-component="client/src/components/AutomationModalOverlays.tsx"
          >
            {state.confirmText ?? 'Xác Nhận'}
          </button>
        </div>
      </div>
    </ModalLayer>
  );
}

export function InputModal({ state, onClose }: { state: InputModalState; onClose: () => void }) {
  if (!state) return null;
  return <InputModalInner key={state.key} state={state} onClose={onClose} />;
}

export function DeviceAssignModal({
  profileId,
  devices,
  deviceProfiles,
  onSave,
  onClose,
}: {
  profileId: string;
  devices: AutomationDeviceOption[];
  deviceProfiles: AutomationDeviceProfile[];
  onSave: (udids: string[]) => void;
  onClose: () => void;
}) {
  const profile = deviceProfiles.find(p => p.id === profileId);
  if (!profile) return null;

  const [checkedUdids, setCheckedUdids] = useState<string[]>(() => [...profile.udids]);

  const toggleUdid = (udid: string) => {
    setCheckedUdids(prev => {
      if (prev.includes(udid)) {
        return prev.filter(u => u !== udid);
      } else {
        return [...prev, udid];
      }
    });
  };

  return (
    <ModalLayer level="modal-child" isOpen={true} onClose={onClose} showBackdrop={true}>
      <div 
        className='confirmPanel' 
        onMouseDown={e => e.stopPropagation()} 
        style={{ width: '400px' }}
        data-inspector-id="automation.deviceAssignPanel"
        data-inspector-label="Device assign modal card"
        data-inspector-component="client/src/components/AutomationModalOverlays.tsx"
      >
        <div className='confirmTitle'>Gán thiết bị</div>
        <div className='confirmText' style={{ marginBottom: 12 }}>
          Chọn các thiết bị gán cho profile <strong>"{profile.name}"</strong>:
        </div>
        <div className='automationDeviceSelectList'>
          {devices.map(device => {
            const isChecked = checkedUdids.includes(device.udid);
            const otherProfile = deviceProfiles.find(p => p.id !== profileId && p.udids.includes(device.udid));
            return (
              <label 
                key={device.udid} 
                className='automationDeviceSelectRow'
                data-inspector-id="automation.deviceAssignRow"
                data-inspector-label={`Device select row for No. ${device.number}`}
                data-inspector-component="client/src/components/AutomationModalOverlays.tsx"
              >
                <input
                  type='checkbox'
                  checked={isChecked}
                  onChange={() => toggleUdid(device.udid)}
                  data-inspector-id="automation.deviceAssignCheckbox"
                  data-inspector-label={`Device checkbox for No. ${device.number}`}
                  data-inspector-component="client/src/components/AutomationModalOverlays.tsx"
                />
                <span className='automationDeviceSelectLabel'>
                  No. {device.number} - {[device.manufacturer, device.model].filter(Boolean).join(' ') || 'Device'} ({device.udid}) {otherProfile ? `[Profile: ${otherProfile.name}]` : ''}
                </span>
              </label>
            );
          })}
          {!devices.length ? <div style={{ padding: 12, textAlign: 'center', color: '#888' }}>Không có máy online</div> : null}
        </div>
        <div className='confirmActions center'>
          <button 
            type='button' 
            className='modalBtn' 
            onClick={onClose}
            data-inspector-id="automation.deviceAssignCancelButton"
            data-inspector-label="Cancel device assignment button"
            data-inspector-component="client/src/components/AutomationModalOverlays.tsx"
          >
            Huỷ
          </button>
          <button
            type='button'
            className='modalBtnPrimary'
            onClick={() => onSave(checkedUdids)}
            data-inspector-id="automation.deviceAssignSaveButton"
            data-inspector-label="Save device assignment button"
            data-inspector-component="client/src/components/AutomationModalOverlays.tsx"
          >
            Lưu
          </button>
        </div>
      </div>
    </ModalLayer>
  );
}
