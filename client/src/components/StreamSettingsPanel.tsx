import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { normalizeEncoderConfig, STREAM_CONFIG, type StreamConfig } from '@/lib/config'
import { useI18n } from '@/context/I18nContext'

const BITRATE_MIN = 524_288
const BITRATE_MAX = 8_388_608
const BITRATE_WARN_THRESHOLD = Math.floor(BITRATE_MAX * 0.6)
const TILE_WIDTH_MIN = 105
const TILE_WIDTH_MAX = 726
const VIEWER_WIDTH_MIN = 400
const VIEWER_WIDTH_MAX = 900
const STREAM_WIDTH_MIN = 100
const STREAM_WIDTH_MAX = 726
const VIEWER_STREAM_WIDTH_MAX = 1200

type ConfirmRequest = {
  title: string
  message: string
  danger?: boolean
  onConfirm: () => void
}

type StreamSettingsPanelProps = {
  viewerUdid: string | null
  streamConfig: StreamConfig
  setStreamConfig: Dispatch<SetStateAction<StreamConfig>>
  viewerStreamConfig: StreamConfig
  setViewerStreamConfig: Dispatch<SetStateAction<StreamConfig>>
  tileWidth: number
  onTileWidthChange: (width: number) => void
  viewerWidthPx: number
  onViewerWidthChange: (width: number) => void
  showTileInfo: boolean
  setShowTileInfo: Dispatch<SetStateAction<boolean>>
  onReloadAll: () => void
  requestConfirm: (request: ConfirmRequest) => void
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.floor(value)))
}

function sameStreamConfig(a: StreamConfig, b: StreamConfig): boolean {
  return (
    a.bitrate === b.bitrate &&
    a.maxFps === b.maxFps &&
    a.iFrameInterval === b.iFrameInterval &&
    a.bounds.width === b.bounds.width &&
    a.bounds.height === b.bounds.height &&
    a.sendFrameMeta === b.sendFrameMeta &&
    a.displayId === b.displayId &&
    (a.engine || 'auto') === (b.engine || 'auto') &&
    (a.encoderMode || 'auto') === (b.encoderMode || 'auto') &&
    (a.encoderName || '') === (b.encoderName || '') &&
    (a.codecOptions || '') === (b.codecOptions || '')
  )
}

export function StreamSettingsPanel({
  viewerUdid,
  streamConfig,
  setStreamConfig,
  viewerStreamConfig,
  setViewerStreamConfig,
  tileWidth,
  onTileWidthChange,
  viewerWidthPx,
  onViewerWidthChange,
  showTileInfo,
  setShowTileInfo,
  onReloadAll,
  requestConfirm,
}: StreamSettingsPanelProps) {
  const { t } = useI18n()
  const [streamControlsOpen, setStreamControlsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('rightPanel.streamControlsOpen')
      return saved === null ? true : saved === 'true'
    } catch {
      return true
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('rightPanel.streamControlsOpen', String(streamControlsOpen))
    } catch {}
  }, [streamControlsOpen])

  const [draftConfig, setDraftConfig] = useState<StreamConfig>(STREAM_CONFIG)
  const [draftViewerConfig, setDraftViewerConfig] = useState<StreamConfig>(viewerStreamConfig)

  // Track aspect ratio so stream height follows width
  const boundsAspectRef = useRef<number>(
    STREAM_CONFIG.bounds.height && STREAM_CONFIG.bounds.width
      ? STREAM_CONFIG.bounds.height / STREAM_CONFIG.bounds.width
      : 1
  )
  const autoApplyTimer = useRef<number | null>(null)
  const skipNextAutoApply = useRef(false)
  const [bitrateWarnAccepted, setBitrateWarnAccepted] = useState(false)
  const [bitrateConfirmVisible, setBitrateConfirmVisible] = useState(false)
  const [bitratePending, setBitratePending] = useState<number | null>(null)
  const [bitrateNeedsConfirm, setBitrateNeedsConfirm] = useState(false)
  const [bitrateLastSafe, setBitrateLastSafe] = useState<number>(
    STREAM_CONFIG.bitrate
  )
  const bitrateDragRef = useRef(false)

  useEffect(() => {
    setDraftConfig(streamConfig)
    const w = streamConfig.bounds.width || 1
    const h = streamConfig.bounds.height || 1
    boundsAspectRef.current = h / w
    skipNextAutoApply.current = true
    setBitrateWarnAccepted(false)
    setBitrateConfirmVisible(false)
    setBitratePending(null)
    setBitrateNeedsConfirm(false)
    setBitrateLastSafe(streamConfig.bitrate)
    bitrateDragRef.current = false
  }, [streamConfig])

  useEffect(() => {
    setDraftViewerConfig(viewerStreamConfig)
  }, [viewerStreamConfig])

  const normalizeStreamConfig = (cfg: StreamConfig): StreamConfig => {
    const bitrate = clamp(cfg.bitrate, 524288, 8_388_608)
    const maxFps = clamp(cfg.maxFps, 1, 60)
    const iFrameInterval = clamp(cfg.iFrameInterval, 0, 60)
    const width = clamp(cfg.bounds?.width ?? 0, STREAM_WIDTH_MIN, STREAM_WIDTH_MAX)
    const height = clamp(cfg.bounds?.height ?? 0, STREAM_WIDTH_MIN, 4000)
    const displayId = Math.max(0, Math.floor(cfg.displayId ?? 0))
    const encoderMode = cfg.encoderMode || 'auto'
    return {
      ...normalizeEncoderConfig({
        bitrate,
        maxFps,
        iFrameInterval,
        bounds: { width, height },
        sendFrameMeta: Boolean(cfg.sendFrameMeta),
        displayId,
        codecOptions: cfg.codecOptions,
        engine: cfg.engine,
        encoderMode,
        encoderName: cfg.encoderName
      })
    }
  }

  const normalizeViewerStreamConfig = (cfg: StreamConfig): StreamConfig => {
    const bitrate = clamp(cfg.bitrate, 524288, 8_388_608)
    const maxFps = clamp(cfg.maxFps, 1, 60)
    const iFrameInterval = clamp(cfg.iFrameInterval, 0, 60)
    const width = clamp(cfg.bounds?.width ?? 0, STREAM_WIDTH_MIN, VIEWER_STREAM_WIDTH_MAX)
    const height = clamp(cfg.bounds?.height ?? 0, STREAM_WIDTH_MIN, 4000)
    const displayId = Math.max(0, Math.floor(cfg.displayId ?? 0))
    const encoderMode = cfg.encoderMode || 'auto'
    return {
      ...normalizeEncoderConfig({
        bitrate,
        maxFps,
        iFrameInterval,
        bounds: { width, height },
        sendFrameMeta: Boolean(cfg.sendFrameMeta),
        displayId,
        codecOptions: cfg.codecOptions,
        engine: cfg.engine,
        encoderMode,
        encoderName: cfg.encoderName
      })
    }
  }

  const isViewerConfigMode = viewerUdid !== null
  const activeDraftConfig = isViewerConfigMode ? draftViewerConfig : draftConfig

  const setActiveDraftConfig = useCallback((updater: SetStateAction<StreamConfig>) => {
    if (viewerUdid) {
      setDraftViewerConfig(updater)
    } else {
      setDraftConfig(updater)
    }
  }, [viewerUdid])



  const updateGridBoundsWidth = (widthRaw: number) => {
    const width = clamp(widthRaw, STREAM_WIDTH_MIN, STREAM_WIDTH_MAX)
    const height = Math.max(1, Math.round(width * boundsAspectRef.current))
    setDraftConfig(prev => ({
      ...prev,
      bounds: { width, height }
    }))
  }

  const updateViewerBoundsWidth = (widthRaw: number) => {
    const width = clamp(widthRaw, STREAM_WIDTH_MIN, VIEWER_STREAM_WIDTH_MAX)
    const aspect =
      draftViewerConfig.bounds.width && draftViewerConfig.bounds.height
        ? draftViewerConfig.bounds.height / draftViewerConfig.bounds.width
        : boundsAspectRef.current || 1
    const height = Math.max(1, Math.round(width * aspect))
    setDraftViewerConfig(prev => ({
      ...prev,
      bounds: { width, height }
    }))
  }

  const applyGridDraftConfig = useCallback(() => {
    const next = normalizeStreamConfig(draftConfig)
    setStreamConfig(prev => {
      if (sameStreamConfig(prev, next)) return prev
      onReloadAll()
      return next
    })
  }, [draftConfig, onReloadAll])

  const applyViewerDraftConfig = useCallback(() => {
    const next = normalizeViewerStreamConfig(draftViewerConfig)
    setViewerStreamConfig(prev => {
      if (sameStreamConfig(prev, next)) return prev
      return next
    })
  }, [draftViewerConfig])

  const applyActiveDraftConfig = useCallback(() => {
    if (viewerUdid) {
      applyViewerDraftConfig()
    } else {
      applyGridDraftConfig()
    }
  }, [viewerUdid, applyViewerDraftConfig, applyGridDraftConfig])

  const handleBitrateChange = (val: number) => {
    const needsConfirm = val > BITRATE_WARN_THRESHOLD && !bitrateWarnAccepted
    if (needsConfirm) {
      setBitrateNeedsConfirm(true)
      setBitratePending(val)
    } else {
      setBitrateNeedsConfirm(false)
      setBitratePending(null)
      setBitrateLastSafe(val)
    }
    setDraftConfig(prev => ({ ...prev, bitrate: val }))
  }

  const onBitratePointerDown = () => {
    bitrateDragRef.current = true
  }

  const onBitratePointerUp = () => {
    const needsConfirm = bitrateNeedsConfirm && !bitrateWarnAccepted
    bitrateDragRef.current = false
    if (needsConfirm) {
      setBitrateConfirmVisible(true)
    }
  }

  // Auto-apply on slider changes with debounce to avoid spamming reconnects
  useEffect(() => {
    if (skipNextAutoApply.current) {
      skipNextAutoApply.current = false
      return
    }
    if (
      (bitrateNeedsConfirm && !bitrateWarnAccepted) ||
      bitrateConfirmVisible
    ) {
      return
    }
    if (autoApplyTimer.current) window.clearTimeout(autoApplyTimer.current)
    autoApplyTimer.current = window.setTimeout(() => {
      applyActiveDraftConfig()
      autoApplyTimer.current = null
    }, 600)
    return () => {
      if (autoApplyTimer.current) {
        window.clearTimeout(autoApplyTimer.current)
        autoApplyTimer.current = null
      }
    }
  }, [
    draftConfig,
    draftViewerConfig,
    applyActiveDraftConfig,
    bitrateNeedsConfirm,
    bitrateWarnAccepted,
    bitrateConfirmVisible
  ])
  return (
    <>
    <div 
      className={`rcpSection rcpDropdown rcpDropdownStatic${streamControlsOpen ? '' : ' rcpSectionCollapsed'}`}
      data-inspector-id="rightSidebar.streamSection"
      data-inspector-label="Stream configuration section"
      data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
    >
      <div className='rcpTitleBar'>
        <div 
          className='rcpTitle'
          data-inspector-id="rightSidebar.streamTitle"
          data-inspector-label="Stream configuration section title"
          data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
        >
          {viewerUdid ? t('Stream config (viewer)') : t('Stream config')}
        </div>
        <div className='rcpTitleActions'>
          <button
            className='rcpMiniBtn'
            title={t('Reset stream config to default')}
            aria-label={t('Reset stream config to default')}
            onClick={() => {
              requestConfirm({
                title: 'Reset cấu hình?',
                message: 'Bạn có chắc chắn muốn khôi phục cấu hình stream về mặc định không?',
                danger: true,
                onConfirm: () => {
                  if (viewerUdid) {
                    const defaultViewerCfg = {
                      ...STREAM_CONFIG,
                      bitrate: 8_388_608,
                      maxFps: 60,
                      bounds: {
                        width: 1000,
                        height: Math.round(1000 * (boundsAspectRef.current || 16 / 9))
                      }
                    }
                    setViewerStreamConfig(defaultViewerCfg)
                    setDraftViewerConfig(defaultViewerCfg)
                    onTileWidthChange(205)
                    onViewerWidthChange(900)
                    setShowTileInfo(false)
                  } else {
                    setStreamConfig(STREAM_CONFIG)
                    setDraftConfig(STREAM_CONFIG)
                    onTileWidthChange(205)
                    onViewerWidthChange(900)
                    setShowTileInfo(false)
                    setBitrateWarnAccepted(false)
                    setBitrateConfirmVisible(false)
                    setBitratePending(null)
                    setBitrateNeedsConfirm(false)
                    setBitrateLastSafe(STREAM_CONFIG.bitrate)
                    onReloadAll()
                  }
                }
              });
            }}
            data-inspector-id="rightSidebar.streamResetButton"
            data-inspector-label="Stream config reset button"
            data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
          >
            <RotateCcw size={12} strokeWidth={2} />
            <span>Reset</span>
          </button>
          <button
            className='rcpIconBtn'
            title={streamControlsOpen ? t('Collapse stream config') : t('Expand stream config')}
            aria-label={streamControlsOpen ? t('Collapse stream config') : t('Expand stream config')}
            onClick={() => setStreamControlsOpen(prev => !prev)}
            data-inspector-id="rightSidebar.streamCollapseButton"
            data-inspector-label="Stream config collapse/expand button"
            data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
          >
            {streamControlsOpen ? <ChevronUp size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
          </button>
        </div>
      </div>
      <div 
        className='rcpToggleRow'
        data-inspector-id="rightSidebar.showTileInfoToggle"
        data-inspector-label="Toggle row for showing title/nav on tiles"
        data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
      >
        <span>{t('Hiển thị Title / Nav')}</span>
        <div style={{ display: 'contents' }}>
          <button
            className={`rcpToggleBtn ${showTileInfo ? 'on' : ''}`}
            onClick={() => setShowTileInfo(prev => !prev)}
          >
            {showTileInfo ? t('Bật') : t('Ẩn')}
          </button>
        </div>
      </div>
 
      <div 
        className='rcpSliderRow'
        data-inspector-id="rightSidebar.tileSizeRow"
        data-inspector-label="Tile size setting row container"
        data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
      >
        <div className='rcpSliderLabel'>Kích thước</div>
        <button
          className='rcpStepBtn'
          aria-label={t('Decrease tile width')}
          onClick={() => onTileWidthChange(tileWidth - 5)}
          data-inspector-id="rightSidebar.tileSizeDecreaseButton"
          data-inspector-label="Tile size decrease button"
          data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
        >
          –
        </button>
        <input
          type='range'
          min={TILE_WIDTH_MIN}
          max={TILE_WIDTH_MAX}
          value={tileWidth}
          onChange={e => onTileWidthChange(Number(e.target.value))}
          className='modalRange'
          data-inspector-id="rightSidebar.tileSizeSlider"
          data-inspector-label="Tile size range slider"
          data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
        />
        <button
          className='rcpStepBtn'
          aria-label={t('Increase tile width')}
          onClick={() => onTileWidthChange(tileWidth + 5)}
          data-inspector-id="rightSidebar.tileSizeIncreaseButton"
          data-inspector-label="Tile size increase button"
          data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
        >
          +
        </button>
        <div className='rcpValue'>{tileWidth}px</div>
      </div>
      <div 
        className='rcpSliderRow'
        data-inspector-id="rightSidebar.viewerSizeRow"
        data-inspector-label="Viewer screen size setting row container"
        data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
      >
        <div className='rcpSliderLabel'>Kích thước màn hình lớn</div>
        <button
          className='rcpStepBtn'
          aria-label={t('Decrease viewer width')}
          onClick={() => onViewerWidthChange(viewerWidthPx - 20)}
          data-inspector-id="rightSidebar.viewerSizeDecreaseButton"
          data-inspector-label="Viewer size decrease button"
          data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
        >
          –
        </button>
        <input
          type='range'
          min={VIEWER_WIDTH_MIN}
          max={VIEWER_WIDTH_MAX}
          value={viewerWidthPx}
          onChange={e => onViewerWidthChange(Number(e.target.value))}
          className='modalRange'
          data-inspector-id="rightSidebar.viewerSizeSlider"
          data-inspector-label="Viewer size range slider"
          data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
        />
        <button
          className='rcpStepBtn'
          aria-label={t('Increase viewer width')}
          onClick={() => onViewerWidthChange(viewerWidthPx + 20)}
          data-inspector-id="rightSidebar.viewerSizeIncreaseButton"
          data-inspector-label="Viewer size increase button"
          data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
        >
          +
        </button>
        <div className='rcpValue'>{viewerWidthPx}px</div>
      </div>
      <div 
        className='rcpSliderRow'
        data-inspector-id="rightSidebar.bitrateRow"
        data-inspector-label="Bitrate setting row container"
        data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
      >
        <div className='rcpSliderLabel'>Bitrate</div>
        <button
          className='rcpStepBtn'
          aria-label={t('Decrease bitrate')}
          onClick={() => {
            const delta = -131072
            if (viewerUdid) {
              setDraftViewerConfig(prev => ({
                ...prev,
                bitrate: clamp(prev.bitrate + delta, BITRATE_MIN, BITRATE_MAX)
              }))
            } else {
              handleBitrateChange(
                clamp(draftConfig.bitrate + delta, BITRATE_MIN, BITRATE_MAX)
              )
            }
          }}
          data-inspector-id="rightSidebar.bitrateDecreaseButton"
          data-inspector-label="Bitrate decrease button"
          data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
        >
          –
        </button>
        <input
          type='range'
          min={BITRATE_MIN}
          max={BITRATE_MAX}
          step='131072'
          value={
            viewerUdid
              ? draftViewerConfig.bitrate
              : draftConfig.bitrate
          }
          onChange={e => {
            const val = Number(e.target.value)
            if (viewerUdid) {
              setDraftViewerConfig(prev => ({
                ...prev,
                bitrate: val
              }))
            } else {
              handleBitrateChange(val)
            }
          }}
          onMouseDown={onBitratePointerDown}
          onTouchStart={onBitratePointerDown}
          onMouseUp={onBitratePointerUp}
          onTouchEnd={onBitratePointerUp}
          onMouseLeave={onBitratePointerUp}
          className='modalRange'
          data-inspector-id="rightSidebar.bitrateSlider"
          data-inspector-label="Bitrate range slider"
          data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
        />
        <button
          className='rcpStepBtn'
          aria-label={t('Increase bitrate')}
          onClick={() => {
            const delta = 131072
            if (viewerUdid) {
              setDraftViewerConfig(prev => ({
                ...prev,
                bitrate: clamp(prev.bitrate + delta, BITRATE_MIN, BITRATE_MAX)
              }))
            } else {
              handleBitrateChange(
                clamp(draftConfig.bitrate + delta, BITRATE_MIN, BITRATE_MAX)
              )
            }
          }}
          data-inspector-id="rightSidebar.bitrateIncreaseButton"
          data-inspector-label="Bitrate increase button"
          data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
        >
          +
        </button>
        <div className='rcpValue'>
          {(viewerUdid
            ? draftViewerConfig.bitrate
            : draftConfig.bitrate
          ).toLocaleString()}
        </div>
      </div>
      <div 
        className='rcpSliderRow'
        data-inspector-id="rightSidebar.fpsRow"
        data-inspector-label="FPS setting row container"
        data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
      >
        <div className='rcpSliderLabel'>FPS</div>
        <button
          className='rcpStepBtn'
          aria-label={t('Decrease FPS')}
          onClick={() => {
            if (viewerUdid) {
              setDraftViewerConfig(prev => ({
                ...prev,
                maxFps: clamp(prev.maxFps - 1, 1, 60)
              }))
            } else {
              setDraftConfig(prev => ({
                ...prev,
                maxFps: clamp(prev.maxFps - 1, 1, 60)
              }))
            }
          }}
          data-inspector-id="rightSidebar.fpsDecreaseButton"
          data-inspector-label="FPS decrease button"
          data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
        >
          –
        </button>
        <input
          type='range'
          min='1'
          max='60'
          value={
            viewerUdid
              ? draftViewerConfig.maxFps
              : draftConfig.maxFps
          }
          onChange={e => {
            const val = Number(e.target.value)
            if (viewerUdid) {
              setDraftViewerConfig(prev => ({
                ...prev,
                maxFps: val
              }))
            } else {
              setDraftConfig(prev => ({
                ...prev,
                maxFps: val
              }))
            }
          }}
          className='modalRange'
          data-inspector-id="rightSidebar.fpsSlider"
          data-inspector-label="FPS range slider"
          data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
        />
        <button
          className='rcpStepBtn'
          aria-label={t('Increase FPS')}
          onClick={() => {
            if (viewerUdid) {
              setDraftViewerConfig(prev => ({
                ...prev,
                maxFps: clamp(prev.maxFps + 1, 1, 60)
              }))
            } else {
              setDraftConfig(prev => ({
                ...prev,
                maxFps: clamp(prev.maxFps + 1, 1, 60)
              }))
            }
          }}
          data-inspector-id="rightSidebar.fpsIncreaseButton"
          data-inspector-label="FPS increase button"
          data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
        >
          +
        </button>
        <div className='rcpValue'>
          {viewerUdid
            ? draftViewerConfig.maxFps
            : draftConfig.maxFps}{' '}
          fps
        </div>
      </div>

      <div className='rcpSliderRow'>
        <div className='rcpSliderLabel'>Độ Nét</div>
        <button
          className='rcpStepBtn'
          aria-label={t('Decrease stream width')}
          onClick={() => {
            if (viewerUdid) {
              updateViewerBoundsWidth(draftViewerConfig.bounds.width - 20)
            } else {
              updateGridBoundsWidth(draftConfig.bounds.width - 20)
            }
          }}
        >
          –
        </button>
        <input
          type='range'
          min={STREAM_WIDTH_MIN}
          max={viewerUdid ? VIEWER_STREAM_WIDTH_MAX : STREAM_WIDTH_MAX}
          value={
            viewerUdid
              ? draftViewerConfig.bounds.width
              : draftConfig.bounds.width
          }
          onChange={e => {
            const val = Number(e.target.value)
            if (viewerUdid) {
              updateViewerBoundsWidth(val)
            } else {
              updateGridBoundsWidth(val)
            }
          }}
          className='modalRange'
        />
        <button
          className='rcpStepBtn'
          aria-label={t('Increase stream width')}
          onClick={() => {
            if (viewerUdid) {
              updateViewerBoundsWidth(draftViewerConfig.bounds.width + 20)
            } else {
              updateGridBoundsWidth(draftConfig.bounds.width + 20)
            }
          }}
        >
          +
        </button>
        <div className='rcpValue'>
          {viewerUdid
            ? draftViewerConfig.bounds.width
            : draftConfig.bounds.width}
          px
        </div>
      </div>

    </div>
      {bitrateConfirmVisible ? createPortal(
      <div
        className='confirmOverlay confirmOverlay--top'
        onMouseDown={() => setBitrateConfirmVisible(false)}
        data-inspector-id="confirm.bitrateOverlay"
        data-inspector-label="Bitrate change confirmation overlay background"
        data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
      >
        <div 
          className='confirmPanel' 
          onMouseDown={e => e.stopPropagation()}
          data-inspector-id="confirm.bitratePanel"
          data-inspector-label="Bitrate change confirmation card panel"
          data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
        >
          <div 
            className='confirmTitle'
            data-inspector-id="confirm.bitrateTitle"
            data-inspector-label="Bitrate change confirmation title"
            data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
          >
            {t('Bitrate cao')}
          </div>
          <div 
            className='confirmText'
            data-inspector-id="confirm.bitrateText"
            data-inspector-label="Bitrate warning message text"
            data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
          >
            {t(
              'Kéo bitrate cao trên (60%) có thể làm tăng tải và đôi lúc gây giật/đứt stream. Vẫn tiếp tục?'
            )}
          </div>
          <div className='confirmActions'>
            <button
              className='modalBtn'
              onClick={() => {
                setBitrateConfirmVisible(false)
                setBitratePending(null)
                setBitrateNeedsConfirm(false)
                setDraftConfig(prev => ({
                  ...prev,
                  bitrate: bitrateLastSafe
                }))
              }}
              data-inspector-id="confirm.bitrateCancelButton"
              data-inspector-label="Bitrate warning cancel button"
              data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
            >
              {t('Hủy')}
            </button>
            <button
              className='modalBtnPrimary'
              onClick={() => {
                const target = bitratePending ?? draftConfig.bitrate
                setBitrateWarnAccepted(true)
                setBitrateConfirmVisible(false)
                setBitrateNeedsConfirm(false)
                setBitratePending(null)
                setBitrateLastSafe(target)
                setDraftConfig(prev => ({ ...prev, bitrate: target }))
                applyGridDraftConfig()
              }}
              data-inspector-id="confirm.bitrateContinueButton"
              data-inspector-label="Bitrate warning confirm/continue button"
              data-inspector-component="client/src/components/StreamSettingsPanel.tsx"
            >
              {t('Tiếp tục')}
            </button>
          </div>
        </div>
      </div>,
        document.body,
      ) : null}
    </>
  )
}
