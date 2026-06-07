/**
 * VisualAlertPanel.tsx
 * UI component for Visual Alert settings, ROI setup, and toast notifications.
 * Rendered inside the right config panel in App.tsx.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Eye,
  RotateCcw,
  Volume2,
  X,
} from 'lucide-react';
import { useActive } from '@/context/ActiveContext';
import {
  type VisualAlertConfig,
  type VisualAlertROI,
  DEFAULT_VISUAL_ALERT_CONFIG,
  loadVisualAlertConfig,
  saveVisualAlertConfig,
  scanCanvasROI,
  playAlertSound,
} from '@/lib/visualAlertEngine';
import { useVisualAlert } from '@/hooks/useVisualAlert';

/* ── Props ──────────────────────────────────────────────────────── */

type VisualAlertPanelProps = {
  registeredUdids: string[];
  orderMap: Map<string, number>;
};

/* ── Component ──────────────────────────────────────────────────── */

export function VisualAlertPanel({ registeredUdids, orderMap }: VisualAlertPanelProps) {
  const { getCanvasForUdid } = useActive();

  // Config state
  const [config, setConfig] = useState<VisualAlertConfig>(loadVisualAlertConfig);
  const [expanded, setExpanded] = useState(false);
  const [roiModalOpen, setRoiModalOpen] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>([]);
  const toastIdRef = useRef(0);

  // Listen for alert events from the engine
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.message) return;
      const id = ++toastIdRef.current;
      setToasts(prev => [...prev.slice(-4), { id, message: detail.message }]);
      // Auto-remove toast after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    };
    window.addEventListener('visualAlertDetected', handler);
    return () => window.removeEventListener('visualAlertDetected', handler);
  }, []);

  // Hook for scan loop
  const { scanning, lastAlert, testScanDevice, testSound } = useVisualAlert({
    config,
    getCanvasForUdid,
    registeredUdids,
    orderMap,
  });

  // Persist config changes
  const updateConfig = useCallback((patch: Partial<VisualAlertConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch };
      saveVisualAlertConfig(next);
      return next;
    });
  }, []);

  const updateThreshold = useCallback(
    (patch: Partial<VisualAlertConfig['redThreshold']>) => {
      setConfig(prev => {
        const next = {
          ...prev,
          redThreshold: { ...prev.redThreshold, ...patch },
        };
        saveVisualAlertConfig(next);
        return next;
      });
    },
    [],
  );

  // Test scan
  const [testResult, setTestResult] = useState<string | null>(null);
  const handleTestScan = useCallback(() => {
    if (!registeredUdids.length) {
      setTestResult('Không có máy online');
      return;
    }
    const udid = registeredUdids[0];
    const result = testScanDevice(udid);
    const num = orderMap.get(udid) ?? 0;
    if (!result.scanned) {
      setTestResult(`Máy ${String(num).padStart(2, '0')}: Không thể đọc canvas`);
    } else {
      setTestResult(
        `Máy ${String(num).padStart(2, '0')}: ${result.pixelCount} pixel đỏ ` +
        `(ngưỡng: ${config.redThreshold.minPixels})`
      );
    }
    setTimeout(() => setTestResult(null), 4000);
  }, [registeredUdids, testScanDevice, orderMap, config.redThreshold.minPixels]);

  const handleTestSound = useCallback(() => {
    testSound();
  }, [testSound]);

  const handleResetROI = useCallback(() => {
    updateConfig({ roi: { ...DEFAULT_VISUAL_ALERT_CONFIG.roi } });
  }, [updateConfig]);

  const handleROISave = useCallback(
    (roi: VisualAlertROI) => {
      updateConfig({ roi });
      setRoiModalOpen(false);
    },
    [updateConfig],
  );

  const roiText = `x:${config.roi.x.toFixed(2)} y:${config.roi.y.toFixed(2)} w:${config.roi.w.toFixed(2)} h:${config.roi.h.toFixed(2)}`;

  return (
    <>
      {/* visualAlertSection : Section Visual Alert trong right panel */}
      <div className="rcpSection visualAlertSection">
        <div className="rcpTitleBar">
          <div className="rcpTitle">
            {config.enabled ? <Bell size={14} /> : <BellOff size={14} />}
            <span style={{ marginLeft: 6 }}>Visual Alert</span>
            {scanning && (
              <span className="visualAlertScanBadge">Đang quét</span>
            )}
          </div>
          <div className="rcpTitleActions">
            {/* visualAlertToggle : Toggle bật/tắt quét chấm đỏ */}
            <button
              type="button"
              className={`visualAlertToggle${config.enabled ? ' on' : ''}`}
              onClick={() => updateConfig({ enabled: !config.enabled })}
              title={config.enabled ? 'Tắt quét' : 'Bật quét chấm đỏ'}
            >
              <span className="visualAlertToggleKnob" />
            </button>
            <button
              className="rcpIconBtn"
              title={expanded ? 'Thu gọn' : 'Mở rộng'}
              onClick={() => setExpanded(prev => !prev)}
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="visualAlertBody">
            {/* ROI info + setup */}
            <div className="visualAlertRow">
              <span className="visualAlertLabel">Vùng nhận diện (ROI)</span>
              <span className="visualAlertROIText">{roiText}</span>
            </div>
            <div className="visualAlertActions">
              <button
                className="visualAlertBtn"
                onClick={() => setRoiModalOpen(true)}
                title="Thiết lập vùng nhận diện"
              >
                <Crosshair size={13} />
                <span>Thiết lập ROI</span>
              </button>
              <button
                className="visualAlertBtn"
                onClick={handleResetROI}
                title="Reset ROI"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
              <button
                className="visualAlertBtn"
                onClick={handleTestScan}
                title="Test quét trên 1 máy"
              >
                <Eye size={13} />
                <span>Test quét</span>
              </button>
              <button
                className="visualAlertBtn"
                onClick={handleTestSound}
                title="Test âm thanh"
              >
                <Volume2 size={13} />
                <span>Test âm thanh</span>
              </button>
            </div>
            {testResult && (
              <div className="visualAlertTestResult">{testResult}</div>
            )}

            {/* Settings */}
            <div className="visualAlertSettingsGrid">
              <label className="visualAlertSettingItem">
                <span>Scan interval</span>
                <div className="visualAlertInputWrap">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={config.scanIntervalSec}
                    onChange={e =>
                      updateConfig({
                        scanIntervalSec: Math.max(1, Math.min(30, Number(e.target.value) || 3)),
                      })
                    }
                  />
                  <span className="visualAlertUnit">giây</span>
                </div>
              </label>
              <label className="visualAlertSettingItem">
                <span>Confirm count</span>
                <div className="visualAlertInputWrap">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={config.confirmCount}
                    onChange={e =>
                      updateConfig({
                        confirmCount: Math.max(1, Math.min(10, Number(e.target.value) || 2)),
                      })
                    }
                  />
                  <span className="visualAlertUnit">lần</span>
                </div>
              </label>
              <label className="visualAlertSettingItem">
                <span>Cooldown</span>
                <div className="visualAlertInputWrap">
                  <input
                    type="number"
                    min={10}
                    max={600}
                    value={config.cooldownSec}
                    onChange={e =>
                      updateConfig({
                        cooldownSec: Math.max(10, Math.min(600, Number(e.target.value) || 60)),
                      })
                    }
                  />
                  <span className="visualAlertUnit">giây</span>
                </div>
              </label>
            </div>

            {/* Red threshold */}
            <div className="visualAlertThresholdTitle">Ngưỡng màu đỏ</div>
            <div className="visualAlertThresholdGrid">
              <label className="visualAlertThresholdItem">
                <span>R min</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={config.redThreshold.rMin}
                  onChange={e =>
                    updateThreshold({ rMin: Math.max(0, Math.min(255, Number(e.target.value) || 180)) })
                  }
                />
              </label>
              <label className="visualAlertThresholdItem">
                <span>G max</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={config.redThreshold.gMax}
                  onChange={e =>
                    updateThreshold({ gMax: Math.max(0, Math.min(255, Number(e.target.value) || 100)) })
                  }
                />
              </label>
              <label className="visualAlertThresholdItem">
                <span>B max</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={config.redThreshold.bMax}
                  onChange={e =>
                    updateThreshold({ bMax: Math.max(0, Math.min(255, Number(e.target.value) || 100)) })
                  }
                />
              </label>
              <label className="visualAlertThresholdItem">
                <span>Min px</span>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={config.redThreshold.minPixels}
                  onChange={e =>
                    updateThreshold({
                      minPixels: Math.max(1, Math.min(10000, Number(e.target.value) || 12)),
                    })
                  }
                />
              </label>
            </div>

            {lastAlert && (
              <div className="visualAlertLastAlert">
                Lần cuối: {lastAlert.message} ({new Date(lastAlert.timestamp).toLocaleTimeString()})
              </div>
            )}
          </div>
        )}
      </div>

      {/* ROI Setup Modal */}
      {roiModalOpen && (
        <ROISetupModal
          registeredUdids={registeredUdids}
          orderMap={orderMap}
          currentROI={config.roi}
          redThreshold={config.redThreshold}
          onSave={handleROISave}
          onClose={() => setRoiModalOpen(false)}
        />
      )}

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="visualAlertToastContainer">
          {toasts.map(t => (
            <div key={t.id} className="visualAlertToast">
              <Bell size={14} />
              <span>{t.message}</span>
              <button
                className="visualAlertToastClose"
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── ROI Setup Modal ────────────────────────────────────────────── */

type ROISetupModalProps = {
  registeredUdids: string[];
  orderMap: Map<string, number>;
  currentROI: VisualAlertROI;
  redThreshold: VisualAlertConfig['redThreshold'];
  onSave: (roi: VisualAlertROI) => void;
  onClose: () => void;
};

function ROISetupModal({
  registeredUdids,
  orderMap,
  currentROI,
  redThreshold,
  onSave,
  onClose,
}: ROISetupModalProps) {
  const { getCanvasForUdid } = useActive();

  const [selectedUdid, setSelectedUdid] = useState<string | null>(null);
  const [roi, setRoi] = useState<VisualAlertROI>({ ...currentROI });
  const [testResultText, setTestResultText] = useState<string | null>(null);

  // Canvas preview ref
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Draw device canvas snapshot to preview
  const drawPreview = useCallback(() => {
    if (!selectedUdid) return;
    const srcCanvas = getCanvasForUdid(selectedUdid);
    const dst = previewCanvasRef.current;
    if (!srcCanvas || !dst) return;

    const ctx = dst.getContext('2d');
    if (!ctx) return;

    // Match preview canvas to source aspect ratio
    const container = containerRef.current;
    const containerW = container?.clientWidth ?? 400;
    const aspect = srcCanvas.height / srcCanvas.width;
    const previewW = containerW;
    const previewH = Math.round(containerW * aspect);

    dst.width = previewW;
    dst.height = previewH;
    ctx.drawImage(srcCanvas, 0, 0, previewW, previewH);
  }, [selectedUdid, getCanvasForUdid]);

  // Draw preview when device selected, and refresh periodically
  useEffect(() => {
    if (!selectedUdid) return;
    drawPreview();
    const timer = setInterval(drawPreview, 1000);
    return () => clearInterval(timer);
  }, [selectedUdid, drawPreview]);

  // ROI drag state
  const dragRef = useRef<{
    type: 'move' | 'resize';
    startX: number;
    startY: number;
    startROI: VisualAlertROI;
  } | null>(null);

  const handleROIPointerDown = useCallback(
    (e: React.PointerEvent, type: 'move' | 'resize') => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        type,
        startX: e.clientX,
        startY: e.clientY,
        startROI: { ...roi },
      };
    },
    [roi],
  );

  const handleROIPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const canvas = previewCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const cw = rect.width;
      const ch = rect.height;

      const dx = (e.clientX - dragRef.current.startX) / cw;
      const dy = (e.clientY - dragRef.current.startY) / ch;

      const s = dragRef.current.startROI;

      if (dragRef.current.type === 'move') {
        setRoi({
          x: Math.max(0, Math.min(1 - s.w, s.x + dx)),
          y: Math.max(0, Math.min(1 - s.h, s.y + dy)),
          w: s.w,
          h: s.h,
        });
      } else {
        // resize
        setRoi({
          x: s.x,
          y: s.y,
          w: Math.max(0.02, Math.min(1 - s.x, s.w + dx)),
          h: Math.max(0.02, Math.min(1 - s.y, s.h + dy)),
        });
      }
    },
    [],
  );

  const handleROIPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Test scan inside modal
  const handleTestInModal = useCallback(() => {
    if (!selectedUdid) return;
    const canvas = getCanvasForUdid(selectedUdid);
    if (!canvas) {
      setTestResultText('Không thể đọc canvas');
      return;
    }
    const result = scanCanvasROI(canvas, roi, redThreshold);
    if (!result.scanned) {
      setTestResultText('Không thể quét');
    } else {
      setTestResultText(
        `${result.redPixelCount} pixel đỏ (ngưỡng: ${redThreshold.minPixels}) — ${
          result.redPixelCount >= redThreshold.minPixels ? '✅ ĐỦ' : '❌ CHƯA ĐỦ'
        }`,
      );
    }
    setTimeout(() => setTestResultText(null), 5000);
  }, [selectedUdid, getCanvasForUdid, roi, redThreshold]);

  // Sort devices by number
  const sortedDevices = useMemo(() => {
    return registeredUdids
      .map(udid => ({
        udid,
        number: orderMap.get(udid) ?? 0,
      }))
      .sort((a, b) => a.number - b.number);
  }, [registeredUdids, orderMap]);

  return createPortal(
    <>
      {/* visualAlertModal : Modal thiết lập vùng ROI */}
      <div className="visualAlertModalBackdrop" onClick={onClose} />
      <div className="visualAlertModalOverlay" onClick={onClose}>
        <div className="visualAlertModalCard" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="visualAlertModalHeader">
            <h5 className="visualAlertModalTitle">
              <Crosshair size={16} />
              <span>Thiết lập vùng nhận diện</span>
            </h5>
            <button
              type="button"
              className="visualAlertModalCloseBtn"
              aria-label="Close"
              onClick={onClose}
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div className="visualAlertModalBody">
            {!selectedUdid ? (
              <>
                {/* Device picker */}
                <div className="visualAlertPickerTitle">
                  Chọn 1 máy mẫu đang online
                </div>
                {sortedDevices.length === 0 ? (
                  <div className="visualAlertPickerEmpty">
                    Không có máy online
                  </div>
                ) : (
                  <div className="visualAlertPickerGrid">
                    {sortedDevices.map(d => (
                      <button
                        key={d.udid}
                        className="visualAlertPickerDevice"
                        onClick={() => setSelectedUdid(d.udid)}
                        title={d.udid}
                      >
                        {String(d.number).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Canvas preview + ROI overlay */}
                <div className="visualAlertPreviewWrap" ref={containerRef}>
                  <canvas
                    ref={previewCanvasRef}
                    className="visualAlertPreviewCanvas"
                    onPointerMove={handleROIPointerMove}
                    onPointerUp={handleROIPointerUp}
                  />
                  {/* ROI box overlay */}
                  <div
                    className="visualAlertROIBox"
                    style={{
                      left: `${roi.x * 100}%`,
                      top: `${roi.y * 100}%`,
                      width: `${roi.w * 100}%`,
                      height: `${roi.h * 100}%`,
                    }}
                    onPointerDown={e => handleROIPointerDown(e, 'move')}
                    onPointerMove={handleROIPointerMove}
                    onPointerUp={handleROIPointerUp}
                  >
                    {/* Resize handle (bottom-right corner) */}
                    <div
                      className="visualAlertROIResizeHandle"
                      onPointerDown={e => handleROIPointerDown(e, 'resize')}
                    />
                  </div>
                </div>

                {/* ROI coordinates */}
                <div className="visualAlertROICoords">
                  <span>x: {roi.x.toFixed(3)}</span>
                  <span>y: {roi.y.toFixed(3)}</span>
                  <span>w: {roi.w.toFixed(3)}</span>
                  <span>h: {roi.h.toFixed(3)}</span>
                </div>

                {testResultText && (
                  <div className="visualAlertModalTestResult">{testResultText}</div>
                )}

                {/* Modal Actions */}
                <div className="visualAlertModalActions">
                  <button
                    className="visualAlertModalBtn secondary"
                    onClick={() => setSelectedUdid(null)}
                  >
                    ← Chọn máy khác
                  </button>
                  <button
                    className="visualAlertModalBtn secondary"
                    onClick={handleTestInModal}
                  >
                    <Eye size={13} />
                    Test quét
                  </button>
                  <button
                    className="visualAlertModalBtn secondary"
                    onClick={() => playAlertSound()}
                  >
                    <Volume2 size={13} />
                    Test âm thanh
                  </button>
                  <button
                    className="visualAlertModalBtn secondary"
                    onClick={() => setRoi({ ...DEFAULT_VISUAL_ALERT_CONFIG.roi })}
                  >
                    <RotateCcw size={13} />
                    Reset
                  </button>
                  <button
                    className="visualAlertModalBtn primary"
                    onClick={() => onSave(roi)}
                  >
                    Lưu
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
