/**
 * VisualAlertPanel.tsx
 * UI component for Visual Alert settings, Multi-ROI setup, and toast notifications.
 * Rendered inside the right config panel in App.tsx.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Trash2,
  X,
} from 'lucide-react';
import { useActive } from '@/context/ActiveContext';
import {
  type VisualAlertConfig,
  type VisualAlertROI,
  type MultiROIResult,
  loadVisualAlertConfig,
  saveVisualAlertConfig,
  scanCanvasROIs,
  generateROIId,
  playAlertSound,
} from '@/lib/visualAlertEngine';

function loadBoolKey(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return fallback;
  } catch {
    return fallback;
  }
}
import { useVisualAlert } from '@/hooks/useVisualAlert';

/* ── Props ──────────────────────────────────────────────────────── */

type VisualAlertPanelProps = {
  registeredUdids: string[];
  orderMap: Map<string, number>;
  viewerUdid?: string | null;
};

/* ── Component ──────────────────────────────────────────────────── */

export function VisualAlertPanel({ registeredUdids, orderMap, viewerUdid }: VisualAlertPanelProps) {
  const { getCanvasForUdid } = useActive();

  // Config state
  const [config, setConfig] = useState<VisualAlertConfig>(loadVisualAlertConfig);
  const [expanded, setExpanded] = useState(() =>
    loadBoolKey('rightPanel.visualAlertOpen', false)
  );
  const [roiModalOpen, setRoiModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('rightPanel.visualAlertOpen', String(expanded));
    } catch {}
  }, [expanded]);

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

  const handleROISave = useCallback(
    (rois: VisualAlertROI[]) => {
      updateConfig({ rois });
      setRoiModalOpen(false);
    },
    [updateConfig],
  );

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
            {config.rois.length > 10 && (
              <div className="visualAlertROIWarning">⚠ Nhiều ROI có thể ảnh hưởng hiệu năng</div>
            )}
            <div className="visualAlertActions">
              <button
                className="visualAlertBtn"
                onClick={() => {
                  setRoiModalOpen(true);
                }}
                title="Thiết lập vùng nhận diện"
              >
                <span>Thiết lập ROI</span>
              </button>
              <button
                className="visualAlertBtn"
                onClick={handleTestScan}
                title="Test quét trên 1 máy"
              >
                <span>Test quét</span>
              </button>
              <button
                className="visualAlertBtn"
                onClick={handleTestSound}
                title="Test âm thanh"
              >
                <span>Test âm thanh</span>
              </button>
            </div>
            {testResult && (
              <div className="visualAlertTestResult" style={{ whiteSpace: 'pre-line' }}>{testResult}</div>
            )}

            {/* Settings */}
            <div className="visualAlertSettingsGrid">
              <label className="visualAlertSettingItem">
                <span>Chu kỳ (s)</span>
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
                </div>
              </label>
              <label className="visualAlertSettingItem">
                <span>Lần check</span>
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
                </div>
              </label>
              <label className="visualAlertSettingItem">
                <span>Báo Lại</span>
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
                </div>
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
          currentROIs={config.rois}
          redThreshold={config.redThreshold}
          onSave={handleROISave}
          onClose={() => setRoiModalOpen(false)}
          viewerUdid={viewerUdid}
        />
      )}
    </>
  );
}

/* ── Multi-ROI Setup Modal ──────────────────────────────────────── */

type MultiROISetupModalProps = {
  currentROIs: VisualAlertROI[];
  redThreshold: VisualAlertConfig['redThreshold'];
  onSave: (rois: VisualAlertROI[]) => void;
  onClose: () => void;
  viewerUdid?: string | null;
};

function MultiROISetupModal({
  currentROIs,
  redThreshold,
  onSave,
  onClose,
  viewerUdid,
}: MultiROISetupModalProps) {
  const { getCanvasForUdid, activeUdid, selectedGridUdid } = useActive();

  // Target device priority: viewerUdid > selectedGridUdid > activeUdid
  const selectedUdid = viewerUdid || selectedGridUdid || activeUdid;
  const activeCanvas = selectedUdid ? getCanvasForUdid(selectedUdid) : null;

  const [draftROIs, setDraftROIs] = useState<VisualAlertROI[]>(
    currentROIs.map(r => ({ ...r })),
  );
  const [activeROIId, setActiveROIId] = useState<string | null>(
    currentROIs.length > 0 ? currentROIs[0].id : null,
  );
  const [testResults, setTestResults] = useState<MultiROIResult | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [pendingDeleteROI, setPendingDeleteROI] = useState<string | null>(null);

  // Offset position for dragging
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const modalDragRef = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null);

  const handleHeaderPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const el = e.target as HTMLElement | null;
    if (el?.closest('button,input,select,textarea,.visualAlertModalCloseBtn')) return;

    const header = e.currentTarget as HTMLElement;
    header.setPointerCapture(e.pointerId);
    modalDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: modalPos.x,
      startOffsetY: modalPos.y,
    };
  }, [modalPos]);

  const handleHeaderPointerMove = useCallback((e: React.PointerEvent) => {
    if (!modalDragRef.current) return;
    const dx = e.clientX - modalDragRef.current.startX;
    const dy = e.clientY - modalDragRef.current.startY;
    setModalPos({
      x: modalDragRef.current.startOffsetX + dx,
      y: modalDragRef.current.startOffsetY + dy,
    });
  }, []);

  const handleHeaderPointerUp = useCallback((e: React.PointerEvent) => {
    if (!modalDragRef.current) return;
    const target = e.currentTarget as HTMLElement;
    try {
      target.releasePointerCapture(e.pointerId);
    } catch {}
    modalDragRef.current = null;
  }, []);

  // Canvas preview ref
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Draw device canvas snapshot to preview
  const drawPreview = useCallback(() => {
    if (!selectedUdid || !activeCanvas) return;
    const dst = previewCanvasRef.current;
    if (!dst) return;

    const ctx = dst.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    // Use parent width as base (modal body), not container itself (which may auto-size)
    const parentW = container?.parentElement?.clientWidth ?? 500;
    const maxW = parentW - 2; // account for border
    const aspect = activeCanvas.height / activeCanvas.width;

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
    ctx.drawImage(activeCanvas, 0, 0, previewW, previewH);

    // Sync container size so ROI overlay percentages align with canvas
    if (container) {
      container.style.width = `${previewW}px`;
    }
  }, [selectedUdid, activeCanvas]);

  // Draw preview when device selected, and refresh periodically
  useEffect(() => {
    if (!selectedUdid || !activeCanvas) return;
    drawPreview();
    const timer = setInterval(drawPreview, 1000);
    return () => clearInterval(timer);
  }, [selectedUdid, activeCanvas, drawPreview]);

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
    if (!selectedUdid || !activeCanvas || !draftROIs.length) return;
    const result = scanCanvasROIs(activeCanvas, draftROIs, redThreshold);
    setTestResults(result);
    setTimeout(() => setTestResults(null), 8000);
  }, [selectedUdid, activeCanvas, draftROIs, redThreshold]);

  // Active ROI object
  const activeROI = draftROIs.find(r => r.id === activeROIId) ?? null;

  return createPortal(
    <>
      <div className="visualAlertModalOverlay">
        <div
          className="visualAlertModalCard visualAlertModalCardWide"
          style={{
            transform: `translate(${modalPos.x}px, ${modalPos.y}px)`,
          }}
        >
          {/* Header */}
          <div
            className="visualAlertModalHeader"
            style={{ cursor: 'move', userSelect: 'none' }}
            onPointerDown={handleHeaderPointerDown}
            onPointerMove={handleHeaderPointerMove}
            onPointerUp={handleHeaderPointerUp}
          >
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
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div className="visualAlertModalBody">
            {!selectedUdid || !activeCanvas ? (
              <div className="visualAlertPickerEmpty">
                Chọn một máy đang stream ở Grid trước
              </div>
            ) : (
              <>
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
                          setPendingDeleteROI(roi.id);
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
                    onClick={handleTestInModal}
                    disabled={!draftROIs.length}
                  >
                    Test quét
                  </button>
                  <button
                    className="visualAlertModalBtn secondary"
                    onClick={() => playAlertSound()}
                  >
                    Test âm thanh
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

      {pendingDeleteROI && (
        <div className="confirmOverlay" onMouseDown={() => setPendingDeleteROI(null)}>
          <div className="confirmPanel compact" onMouseDown={e => e.stopPropagation()}>
            <div className="confirmTitle">Xoá điểm quét?</div>
            <div className="confirmText">
              Bạn có chắc muốn xoá điểm quét này không?
            </div>
            <div className="confirmActions center">
              <button className="modalBtn" onClick={() => setPendingDeleteROI(null)}>Huỷ</button>
              <button
                className="modalBtnDanger"
                onClick={() => {
                  handleDeleteROI(pendingDeleteROI);
                  setPendingDeleteROI(null);
                }}
              >
                Xác Nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
