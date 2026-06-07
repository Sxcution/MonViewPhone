/**
 * VisualAlertPanel.tsx
 * UI component for Visual Alert settings, Multi-ROI setup, and toast notifications.
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
  Plus,
  RotateCcw,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { useActive } from '@/context/ActiveContext';
import {
  type VisualAlertConfig,
  type VisualAlertROI,
  type MultiROIResult,
  DEFAULT_VISUAL_ALERT_CONFIG,
  loadVisualAlertConfig,
  saveVisualAlertConfig,
  scanCanvasROI,
  scanCanvasROIs,
  generateROIId,
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

  // Test scan (multi-ROI)
  const [testResult, setTestResult] = useState<string | null>(null);
  const handleTestScan = useCallback(() => {
    if (!registeredUdids.length) {
      setTestResult('Không có máy online');
      return;
    }
    if (!config.rois.length) {
      setTestResult('Chưa thiết lập điểm quét');
      return;
    }
    const udid = registeredUdids[0];
    const result = testScanDevice(udid);
    const num = orderMap.get(udid) ?? 0;
    if (!result.scanned) {
      setTestResult(`Máy ${String(num).padStart(2, '0')}: Không thể đọc canvas`);
    } else {
      const lines = result.hits.map(
        h => `${h.roiName}: ${h.redPixelCount} px ${h.detected ? '✅' : '❌'}`,
      );
      setTestResult(`Máy ${String(num).padStart(2, '0')}:\n${lines.join('\n')}`);
    }
    setTimeout(() => setTestResult(null), 5000);
  }, [registeredUdids, testScanDevice, orderMap, config.rois.length]);

  const handleTestSound = useCallback(() => {
    testSound();
  }, [testSound]);

  const handleResetROIs = useCallback(() => {
    updateConfig({ rois: [] });
  }, [updateConfig]);

  const handleROISave = useCallback(
    (rois: VisualAlertROI[]) => {
      updateConfig({ rois });
      setRoiModalOpen(false);
    },
    [updateConfig],
  );

  const roiCountText = `${config.rois.length} điểm quét`;

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
              <span className="visualAlertLabel">Vùng nhận diện: {roiCountText}</span>
            </div>
            {config.rois.length > 10 && (
              <div className="visualAlertROIWarning">⚠ Nhiều ROI có thể ảnh hưởng hiệu năng</div>
            )}
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
                onClick={handleResetROIs}
                title="Xoá tất cả ROI"
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
              <div className="visualAlertTestResult" style={{ whiteSpace: 'pre-line' }}>{testResult}</div>
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
        <MultiROISetupModal
          registeredUdids={registeredUdids}
          orderMap={orderMap}
          currentROIs={config.rois}
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

/* ── Multi-ROI Setup Modal ──────────────────────────────────────── */

type MultiROISetupModalProps = {
  registeredUdids: string[];
  orderMap: Map<string, number>;
  currentROIs: VisualAlertROI[];
  redThreshold: VisualAlertConfig['redThreshold'];
  onSave: (rois: VisualAlertROI[]) => void;
  onClose: () => void;
};

function MultiROISetupModal({
  registeredUdids,
  orderMap,
  currentROIs,
  redThreshold,
  onSave,
  onClose,
}: MultiROISetupModalProps) {
  const { getCanvasForUdid } = useActive();

  const [selectedUdid, setSelectedUdid] = useState<string | null>(null);
  const [draftROIs, setDraftROIs] = useState<VisualAlertROI[]>(
    currentROIs.map(r => ({ ...r })),
  );
  const [activeROIId, setActiveROIId] = useState<string | null>(
    currentROIs.length > 0 ? currentROIs[0].id : null,
  );
  const [testResults, setTestResults] = useState<MultiROIResult | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);

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

    const container = containerRef.current;
    // Use parent width as base (modal body), not container itself (which may auto-size)
    const parentW = container?.parentElement?.clientWidth ?? 500;
    const maxW = parentW - 2; // account for border
    const aspect = srcCanvas.height / srcCanvas.width;

    // Cap preview height to ~48vh so the phone screen is fully visible
    const maxH = Math.round(window.innerHeight * 0.48);
    let previewW = maxW;
    let previewH = Math.round(maxW * aspect);

    if (previewH > maxH) {
      previewH = maxH;
      previewW = Math.round(maxH / aspect);
    }

    dst.width = previewW;
    dst.height = previewH;
    ctx.drawImage(srcCanvas, 0, 0, previewW, previewH);

    // Sync container size so ROI overlay percentages align with canvas
    if (container) {
      container.style.width = `${previewW}px`;
    }
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
    roiId: string;
    startX: number;
    startY: number;
    startROI: VisualAlertROI;
  } | null>(null);

  const handleROIPointerDown = useCallback(
    (e: React.PointerEvent, roiId: string, type: 'move' | 'resize') => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setActiveROIId(roiId);
      const roi = draftROIs.find(r => r.id === roiId);
      if (!roi) return;
      dragRef.current = {
        type,
        roiId,
        startX: e.clientX,
        startY: e.clientY,
        startROI: { ...roi },
      };
    },
    [draftROIs],
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
      const roiId = dragRef.current.roiId;
      const dragType = dragRef.current.type;

      setDraftROIs(prev =>
        prev.map(r => {
          if (r.id !== roiId) return r;
          if (dragType === 'move') {
            return {
              ...r,
              x: Math.max(0, Math.min(1 - s.w, s.x + dx)),
              y: Math.max(0, Math.min(1 - s.h, s.y + dy)),
            };
          } else {
            return {
              ...r,
              w: Math.max(0.02, Math.min(1 - s.x, s.w + dx)),
              h: Math.max(0.02, Math.min(1 - s.y, s.h + dy)),
            };
          }
        }),
      );
    },
    [],
  );

  const handleROIPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Add new ROI
  const handleAddROI = useCallback(() => {
    const idx = draftROIs.length + 1;
    const newROI: VisualAlertROI = {
      id: generateROIId(),
      name: `Badge ${idx}`,
      x: 0.45,
      y: 0.45,
      w: 0.06,
      h: 0.04,
    };
    setDraftROIs(prev => [...prev, newROI]);
    setActiveROIId(newROI.id);
  }, [draftROIs.length]);

  // Delete ROI
  const handleDeleteROI = useCallback((roiId: string) => {
    setDraftROIs(prev => {
      const next = prev.filter(r => r.id !== roiId);
      return next;
    });
    setActiveROIId(prev => (prev === roiId ? null : prev));
  }, []);

  // Rename ROI
  const handleRenameROI = useCallback((roiId: string, newName: string) => {
    setDraftROIs(prev =>
      prev.map(r => (r.id === roiId ? { ...r, name: newName || r.name } : r)),
    );
  }, []);

  // Test scan inside modal (multi-ROI)
  const handleTestInModal = useCallback(() => {
    if (!selectedUdid || !draftROIs.length) return;
    const canvas = getCanvasForUdid(selectedUdid);
    if (!canvas) {
      setTestResults(null);
      return;
    }
    const result = scanCanvasROIs(canvas, draftROIs, redThreshold);
    setTestResults(result);
    setTimeout(() => setTestResults(null), 8000);
  }, [selectedUdid, getCanvasForUdid, draftROIs, redThreshold]);

  // Sort devices by number
  const sortedDevices = useMemo(() => {
    return registeredUdids
      .map(udid => ({
        udid,
        number: orderMap.get(udid) ?? 0,
      }))
      .sort((a, b) => a.number - b.number);
  }, [registeredUdids, orderMap]);

  // Active ROI object
  const activeROI = draftROIs.find(r => r.id === activeROIId) ?? null;

  return createPortal(
    <>
      {/* visualAlertModal : Modal thiết lập Multi-ROI */}
      <div className="visualAlertModalBackdrop" onClick={onClose} />
      <div className="visualAlertModalOverlay" onClick={onClose}>
        <div className="visualAlertModalCard visualAlertModalCardWide" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="visualAlertModalHeader">
            <h5 className="visualAlertModalTitle">
              <Crosshair size={16} />
              <span>Thiết lập vùng nhận diện</span>
              {draftROIs.length > 0 && (
                <span className="visualAlertROICountBadge">{draftROIs.length}</span>
              )}
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
                {/* Guide text */}
                <div className="visualAlertGuideText">
                  Chỉ khoanh đúng ô badge đỏ, không khoanh vùng avatar để tránh nhận nhầm ảnh màu đỏ
                </div>

                {/* Canvas preview + ROI overlays */}
                <div className="visualAlertPreviewWrap" ref={containerRef}>
                  <canvas
                    ref={previewCanvasRef}
                    className="visualAlertPreviewCanvas"
                    onPointerMove={handleROIPointerMove}
                    onPointerUp={handleROIPointerUp}
                  />
                  {/* Render all ROI overlays */}
                  {draftROIs.map(roi => {
                    const isActive = roi.id === activeROIId;
                    const isLarge = roi.w * roi.h > 0.05;
                    return (
                      <div
                        key={roi.id}
                        className={`visualAlertROIBox${isActive ? '' : ' inactive'}`}
                        style={{
                          left: `${roi.x * 100}%`,
                          top: `${roi.y * 100}%`,
                          width: `${roi.w * 100}%`,
                          height: `${roi.h * 100}%`,
                        }}
                        onPointerDown={e => handleROIPointerDown(e, roi.id, 'move')}
                        onPointerMove={handleROIPointerMove}
                        onPointerUp={handleROIPointerUp}
                      >
                        {/* ROI label */}
                        <span className="visualAlertROILabel">{roi.name}</span>
                        {/* Large ROI warning */}
                        {isLarge && isActive && (
                          <span className="visualAlertROILargeWarn">⚠</span>
                        )}
                        {/* Resize handle only for active ROI */}
                        {isActive && (
                          <div
                            className="visualAlertROIResizeHandle"
                            onPointerDown={e => handleROIPointerDown(e, roi.id, 'resize')}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Active ROI coordinates */}
                {activeROI && (
                  <div className="visualAlertROICoords">
                    <span>x: {activeROI.x.toFixed(3)}</span>
                    <span>y: {activeROI.y.toFixed(3)}</span>
                    <span>w: {activeROI.w.toFixed(3)}</span>
                    <span>h: {activeROI.h.toFixed(3)}</span>
                    {activeROI.w * activeROI.h > 0.05 && (
                      <span className="visualAlertROIWarning" style={{ marginLeft: 4 }}>⚠ Vùng quá lớn</span>
                    )}
                  </div>
                )}

                {/* ROI List */}
                <div className="visualAlertROIList">
                  <div className="visualAlertROIListHeader">
                    <span>Danh sách điểm quét ({draftROIs.length})</span>
                    <button
                      className="visualAlertAddROIBtn"
                      onClick={handleAddROI}
                      title="Thêm điểm quét mới"
                    >
                      <Plus size={13} />
                      Thêm
                    </button>
                  </div>
                  {draftROIs.length === 0 && (
                    <div className="visualAlertROIEmpty">
                      Chưa có điểm quét. Nhấn "+ Thêm" để tạo.
                    </div>
                  )}
                  {draftROIs.map(roi => (
                    <div
                      key={roi.id}
                      className={`visualAlertROIItem${roi.id === activeROIId ? ' active' : ''}`}
                      onClick={() => setActiveROIId(roi.id)}
                    >
                      <div className="visualAlertROIItemLeft">
                        {editingNameId === roi.id ? (
                          <input
                            className="visualAlertROINameInput"
                            autoFocus
                            defaultValue={roi.name}
                            onClick={e => e.stopPropagation()}
                            onBlur={e => {
                              handleRenameROI(roi.id, e.target.value.trim());
                              setEditingNameId(null);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                handleRenameROI(roi.id, (e.target as HTMLInputElement).value.trim());
                                setEditingNameId(null);
                              }
                              if (e.key === 'Escape') setEditingNameId(null);
                            }}
                          />
                        ) : (
                          <span
                            className="visualAlertROIItemName"
                            onDoubleClick={e => {
                              e.stopPropagation();
                              setEditingNameId(roi.id);
                            }}
                            title="Double-click để đổi tên"
                          >
                            {roi.name}
                          </span>
                        )}
                        <span className="visualAlertROIItemCoords">
                          {roi.w.toFixed(2)}×{roi.h.toFixed(2)}
                        </span>
                      </div>
                      <button
                        className="visualAlertROIDeleteBtn"
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteROI(roi.id);
                        }}
                        title="Xoá điểm quét"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Test results */}
                {testResults && testResults.scanned && (
                  <div className="visualAlertMultiTestResult">
                    {testResults.hits.map(h => (
                      <div key={h.roiId} className="visualAlertMultiTestRow">
                        <span>{h.roiName}:</span>
                        <span>{h.redPixelCount} px</span>
                        <span>{h.detected ? '✅' : '❌'}</span>
                      </div>
                    ))}
                  </div>
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
                    disabled={!draftROIs.length}
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
                    onClick={() => { setDraftROIs([]); setActiveROIId(null); }}
                  >
                    <RotateCcw size={13} />
                    Reset
                  </button>
                  <button
                    className="visualAlertModalBtn primary"
                    onClick={() => onSave(draftROIs)}
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
