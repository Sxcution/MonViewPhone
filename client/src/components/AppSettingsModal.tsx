import { useMemo, useState, type ChangeEvent, type Dispatch, type KeyboardEvent, type SetStateAction } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { saveHotkeySettingToBackend } from '@/lib/backendSettings'
import { normalizeEncoderConfig, type StreamConfig } from '@/lib/config'
import { controlModePreset, type ControlMode } from '@/lib/controlMode'
import { loadSeedingContents, saveSeedingContents } from '@/lib/automationData'
import { useI18n } from '@/context/I18nContext'
import { ModalLayer } from '@/components/ui'

type AppSettingsModalProps = {
  onClose: () => void
  streamConfig: StreamConfig
  setStreamConfig: Dispatch<SetStateAction<StreamConfig>>
  setViewerStreamConfig: Dispatch<SetStateAction<StreamConfig>>
  controlModeDefault: ControlMode
  updateControlModeDefault: (preset: 'sdk' | 'uhid') => void
  syncTimeHotkey: string
  setSyncTimeHotkey: Dispatch<SetStateAction<string>>
  deviceAccountHotkey: string
  setDeviceAccountHotkey: Dispatch<SetStateAction<string>>
  overlayHeaderHotkey: string
  setOverlayHeaderHotkey: Dispatch<SetStateAction<string>>
  accountManagerHotkey: string
  setAccountManagerHotkey: Dispatch<SetStateAction<string>>
  inspectorIdHotkey: string
  setInspectorIdHotkey: Dispatch<SetStateAction<string>>
}

export function AppSettingsModal({
  onClose,
  streamConfig,
  setStreamConfig,
  setViewerStreamConfig,
  controlModeDefault,
  updateControlModeDefault,
  syncTimeHotkey,
  setSyncTimeHotkey,
  deviceAccountHotkey,
  setDeviceAccountHotkey,
  overlayHeaderHotkey,
  setOverlayHeaderHotkey,
  accountManagerHotkey,
  setAccountManagerHotkey,
  inspectorIdHotkey,
  setInspectorIdHotkey,
}: AppSettingsModalProps) {
  const { t } = useI18n()
  const [hotkeySectionOpen, setHotkeySectionOpen] = useState(false)
  const [seedingSectionOpen, setSeedingSectionOpen] = useState(false)
  const [seedingContents, setSeedingContents] = useState(loadSeedingContents)
  const seedingLineCount = useMemo(
    () => seedingContents ? seedingContents.split(/[,\s]+/).filter(word => word.trim()).length : 0,
    [seedingContents],
  )

  const recordHotkey = (
    event: KeyboardEvent<HTMLInputElement>,
    storageKey: string,
    setHotkey: Dispatch<SetStateAction<string>>,
  ) => {
    event.preventDefault()
    event.stopPropagation()
    const lowerKey = event.key.toLowerCase()
    if (['control', 'alt', 'shift', 'meta'].includes(lowerKey)) return

    const parts: string[] = []
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl')
    if (event.altKey) parts.push('Alt')
    if (event.shiftKey) parts.push('Shift')

    let keyName = event.key
    if (keyName === ' ') keyName = 'Space'
    else if (keyName.length === 1) keyName = keyName.toUpperCase()
    else keyName = keyName.charAt(0).toUpperCase() + keyName.slice(1)
    parts.push(keyName)

    const hotkey = parts.join('+')
    setHotkey(hotkey)
    localStorage.setItem(storageKey, hotkey)
    void saveHotkeySettingToBackend(storageKey, hotkey)
  }

  const handleSeedingContentsChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value
    setSeedingContents(value)
    saveSeedingContents(value)
  }

  const hotkeyFields = [
    ['syncTime', 'Bật/Tắt Sync Time (Delay):', syncTimeHotkey, setSyncTimeHotkey, 'monviewphone:sync-time-hotkey'],
    ['deviceAccount', 'Hiện tài khoản máy (Tile):', deviceAccountHotkey, setDeviceAccountHotkey, 'monviewphone:device-account-hotkey'],
    ['overlayHeader', 'Overlay Header:', overlayHeaderHotkey, setOverlayHeaderHotkey, 'monviewphone:overlay-header-hotkey'],
    ['accountManager', 'Bảng Quản lý tài khoản:', accountManagerHotkey, setAccountManagerHotkey, 'monviewphone:account-manager-hotkey'],
    ['inspectorId', 'Bật/Tắt Inspector ID:', inspectorIdHotkey, setInspectorIdHotkey, 'monviewphone:inspector-id-hotkey'],
  ] as const

  return (
    <ModalLayer level="modal" isOpen={true} onClose={onClose} showBackdrop={true}>
      <div 
        className='confirmPanel appSettingsPanel'
        onMouseDown={e => e.stopPropagation()}
        data-inspector-id="appSettings.panel"
        data-inspector-label="System settings card panel"
        data-inspector-component="client/src/components/AppSettingsModal.tsx"
      >
      <div className='appSettingsHeader'>
        <div 
          className='confirmTitle appSettingsTitle'
          data-inspector-id="appSettings.title"
          data-inspector-label="System settings dialog title"
          data-inspector-component="client/src/components/AppSettingsModal.tsx"
        >
          Cài Đặt Hệ Thống
        </div>
        <button
          className='modalBtn appSettingsClose'
          title={t('Close settings')}
          aria-label={t('Close settings')}
          onClick={() => onClose()}
          data-inspector-id="appSettings.closeButton"
          data-inspector-label="System settings close button"
          data-inspector-component="client/src/components/AppSettingsModal.tsx"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
      <div 
        className='appSettingsSection'
        data-inspector-id="appSettings.videoEncodingSection"
        data-inspector-label="Video stream settings block"
        data-inspector-component="client/src/components/AppSettingsModal.tsx"
      >
        <div className='appSettingsStack'>
          {/* 1. Stream Engine Selection */}
          <div className='appSettingsFieldRow'>
            <div className='rcpSliderLabel appSettingsLabel'>Bộ giải mã video (Stream Engine)</div>
            <select
              className='headerLangSelect appSettingsControl'
              value='tango-scrcpy'
              disabled
              title='Tango/scrcpy dùng WebCodecs H.264 trong Chrome'
              data-inspector-id="appSettings.streamEngineSelect"
              data-inspector-label="Stream engine selection dropdown"
              data-inspector-component="client/src/components/AppSettingsModal.tsx"
            >
              <option value="tango-scrcpy">Tango/scrcpy + WebCodecs</option>
            </select>
          </div>

          {/* 2. Encoder Mode Selection */}
          <div className='appSettingsFieldRow'>
            <div className='rcpSliderLabel appSettingsLabel'>Bộ mã hoá thiết bị (Encoder Mode)</div>
            <select
              className='headerLangSelect appSettingsControl'
              value={streamConfig.encoderMode || 'auto'}
              onChange={e => {
                const val = e.target.value as any;
                setStreamConfig(p => normalizeEncoderConfig({ ...p, encoderMode: val }));
                setViewerStreamConfig(p => normalizeEncoderConfig({ ...p, encoderMode: val }));
                localStorage.removeItem('monviewphone:device-stream-cache');
              }}
              data-inspector-id="appSettings.encoderModeSelect"
              data-inspector-label="Device encoder mode selection dropdown"
              data-inspector-component="client/src/components/AppSettingsModal.tsx"
            >
              <option value="auto">Tự động (Ưu tiên Hardware)</option>
              <option value="hardware">Chỉ dùng Hardware (Hardware Only)</option>
              <option value="software">Chỉ dùng Software (Software Only)</option>
              <option value="custom">Tuỳ chỉnh (Custom)</option>
            </select>
          </div>

          {/* 3. Custom Encoder Name Input (Only visible if encoderMode is custom) */}
          {streamConfig.encoderMode === 'custom' && (
            <div className='appSettingsFieldRow'>
              <div className='rcpSliderLabel appSettingsLabel'>Tên Encoder Tuỳ chỉnh</div>
              <input
                type="text"
                className="dav-form-input appSettingsControl"
                placeholder="e.g. OMX.qcom.video.encoder.avc"
                value={streamConfig.encoderName || ''}
                onChange={e => {
                  const val = e.target.value.trim() === '' ? undefined : e.target.value.trim();
                  setStreamConfig(p => normalizeEncoderConfig({ ...p, encoderName: val }));
                  setViewerStreamConfig(p => normalizeEncoderConfig({ ...p, encoderName: val }));
                }}
                data-inspector-id="appSettings.customEncoderNameInput"
                data-inspector-label="Custom encoder name text input field"
                data-inspector-component="client/src/components/AppSettingsModal.tsx"
              />
            </div>
          )}
        </div>
      </div>

      <div 
        className='appSettingsSection'
        data-inspector-id="appSettings.controlModeSection"
        data-inspector-label="Input control mode settings block"
        data-inspector-component="client/src/components/AppSettingsModal.tsx"
      >
        <div className='appSettingsStack'>
          <div className='appSettingsFieldRow'>
            <div className='rcpSliderLabel appSettingsLabel'>
              Chế độ điều khiển
            </div>
            <select
              className='headerLangSelect appSettingsControl'
              value={controlModePreset(controlModeDefault)}
              onChange={e => updateControlModeDefault(e.target.value === 'uhid' ? 'uhid' : 'sdk')}
              data-inspector-id="appSettings.controlModeSelect"
              data-inspector-label="Input control mode selection dropdown"
              data-inspector-component="client/src/components/AppSettingsModal.tsx"
            >
              <option value="sdk">Tiêu chuẩn — Touch SDK + Keyboard SDK</option>
              <option value="uhid">Tương thích UHID — Touch UHID + Keyboard UHID</option>
            </select>
          </div>
          <div className='appSettingsHint'>
            {controlModePreset(controlModeDefault) === 'uhid'
              ? 'Mô phỏng chuột và bàn phím vật lý. Dùng cho ứng dụng không nhận điều khiển thông thường.'
              : 'Điều khiển cảm ứng trực tiếp, phù hợp với hầu hết ứng dụng.'}
          </div>
        </div>
      </div>

      <div className='appSettingsSection'>
        <div 
          className='appSettingsSectionHeader'
          onClick={() => setHotkeySectionOpen(p => !p)}
          data-inspector-id="appSettings.hotkeyHeader"
          data-inspector-label="Hotkey configuration header bar"
          data-inspector-component="client/src/components/AppSettingsModal.tsx"
        >
          <div className='rcpSliderLabel appSettingsLabel'>
            Hotkey
          </div>
          <button
            type="button"
            className='rcpIconBtn'
            title={hotkeySectionOpen ? 'Thu nhỏ' : 'Mở rộng'}
            aria-label={hotkeySectionOpen ? 'Thu nhỏ' : 'Mở rộng'}
            data-inspector-id="appSettings.hotkeyToggleButton"
            data-inspector-label="Hotkey section expand toggle button"
            data-inspector-component="client/src/components/AppSettingsModal.tsx"
          >
            {hotkeySectionOpen ? <ChevronUp size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
          </button>
        </div>

        {hotkeySectionOpen && (
          <div 
            className='appSettingsSectionBody'
            data-inspector-id="appSettings.hotkeySection"
            data-inspector-label="Hotkey configuration section"
            data-inspector-component="client/src/components/AppSettingsModal.tsx"
          >
            {hotkeyFields.map(([id, label, value, setValue, storageKey]) => (
              <div className='appSettingsHotkeyRow' key={id}>
                <div className='appSettingsHotkeyLabel'>{label}</div>
                <div className='appSettingsHotkeyControls'>
                  <input
                    type="text"
                    placeholder="Nhấn tổ hợp phím..."
                    readOnly
                    value={value}
                    onKeyDown={event => recordHotkey(event, storageKey, setValue)}
                    className='modalInput appSettingsHotkeyInput'
                    data-inspector-id={`appSettings.${id}HotkeyInput`}
                    data-inspector-label={`${label} hotkey input`}
                    data-inspector-component="client/src/components/AppSettingsModal.tsx"
                  />
                  {value && (
                    <button
                      type="button"
                      className='modalBtn appSettingsHotkeyClear'
                      onClick={() => {
                        setValue('')
                        localStorage.removeItem(storageKey)
                        void saveHotkeySettingToBackend(storageKey, '')
                      }}
                      data-inspector-id={`appSettings.${id}HotkeyClearButton`}
                      data-inspector-label={`${label} hotkey clear button`}
                      data-inspector-component="client/src/components/AppSettingsModal.tsx"
                    >
                      Xoá
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seeding Content Section */}
      <div 
        className='appSettingsSection'
        data-inspector-id="appSettings.seedingSection"
        data-inspector-label="Seeding content configuration section"
        data-inspector-component="client/src/components/AppSettingsModal.tsx"
      >
        <div 
          className='appSettingsSectionHeader'
          onClick={() => setSeedingSectionOpen(p => !p)}
          data-inspector-id="appSettings.seedingHeader"
          data-inspector-label="Seeding configuration section header"
          data-inspector-component="client/src/components/AppSettingsModal.tsx"
        >
          <div className='rcpSliderLabel appSettingsLabel'>
            Nội dung Seeding
          </div>
          <button
            type="button"
            className='rcpIconBtn'
            title={seedingSectionOpen ? 'Thu nhỏ' : 'Mở rộng'}
            aria-label={seedingSectionOpen ? 'Thu nhỏ' : 'Mở rộng'}
          >
            {seedingSectionOpen ? <ChevronUp size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
          </button>
        </div>

        {seedingSectionOpen && (
          <div className='appSettingsSectionBody'>
            <textarea
              className='modalInput appSettingsTextarea'
              value={seedingContents}
              onChange={handleSeedingContentsChange}
              placeholder="Nhập từ ngữ seeding, mỗi câu 1 dòng..."
              data-inspector-id="appSettings.seedingTextarea"
              data-inspector-label="Seeding sentences input textarea"
              data-inspector-component="client/src/components/AppSettingsModal.tsx"
            />
            <div className='appSettingsCount'>
              Số dòng: <strong className='appSettingsCountValue'>{seedingLineCount}</strong>
            </div>
          </div>
        )}
      </div>


      <div className='confirmBtns appSettingsActions'>
        <button
          className='modalBtnPrimary'
          onClick={() => onClose()}
          data-inspector-id="appSettings.confirmButton"
          data-inspector-label="System settings save confirmation button"
          data-inspector-component="client/src/components/AppSettingsModal.tsx"
        >
          Xác Nhận
        </button>
      </div>
    </div>
  </ModalLayer>
  )
}
