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
  Crosshair,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { useActive } from '@/context/ActiveContext';
import {
  type VisualAlertConfig,
  type VisualAlertROI,
  type MultiROIResult,
  type RedThreshold,
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
  const [roiModalOpen, setRoiModalOpen] = useState(false);

  // Hook for scan loop
  const { scanning } = useVisualAlert({
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

  const handleROISave = useCallback(
    (rois: VisualAlertROI[], settings: { scanIntervalSec: number; confirmCount: number; cooldownSec: number; redThreshold: RedThreshold }) => {
      updateConfig({
        rois,
        ...settings,
      });
      setRoiModalOpen(false);
    },
    [updateConfig],
  );

  return (
    <>
      {/* visualAlertSection : Section Visual Alert trong right panel */}
      <div className="rcpSection visualAlertSection"
        data-inspector-id="visualAlert.section"
        data-inspector-label="Visual Alert section"
        data-inspector-component="client/src/components/VisualAlertPanel.tsx"
      >
        <div className="rcpTitleBar"
          data-inspector-id="visualAlert.header"
          data-inspector-label="Visual Alert header"
          data-inspector-component="client/src/components/VisualAlertPanel.tsx"
        >
          <div className="rcpTitle"
            data-inspector-id="visualAlert.title"
            data-inspector-label="Visual Alert title"
            data-inspector-component="client/src/components/VisualAlertPanel.tsx"
          >
            {config.enabled ? <Bell size={14} /> : <BellOff size={14} />}
            <span style={{ marginLeft: 6 }}>Visual Alert</span>
            {scanning && (
              <span className="visualAlertScanBadge"
                data-inspector-id="visualAlert.scanBadge"
                data-inspector-label="Visual Alert scan badge"
                data-inspector-component="client/src/components/VisualAlertPanel.tsx"
              >Đang quét</span>
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
              type="button"
              className="rcpIconBtn"
              title="Setting"
              onClick={() => setRoiModalOpen(true)}
              data-inspector-id="visualAlert.settingsButton"
              data-inspector-label="Visual Alert settings button"
              data-inspector-component="client/src/components/VisualAlertPanel.tsx"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ROI Setup Modal */}
      {roiModalOpen && (
        <MultiROISetupModal
          currentROIs={config.rois}
          redThreshold={config.redThreshold}
          onSave={handleROISave}
          onClose={() => setRoiModalOpen(false)}
          viewerUdid={viewerUdid}
          scanIntervalSec={config.scanIntervalSec}
          confirmCount={config.confirmCount}
          cooldownSec={config.cooldownSec}
        />
      )}
    </>
  );
}

/* ── Multi-ROI Setup Modal ──────────────────────────────────────── */

type MultiROISetupModalProps = {
  currentROIs: VisualAlertROI[];
  redThreshold: VisualAlertConfig['redThreshold'];
  onSave: (
    rois: VisualAlertROI[],
    settings: { scanIntervalSec: number; confirmCount: number; cooldownSec: number; redThreshold: RedThreshold }
  ) => void;
  onClose: () => void;
  viewerUdid?: string | null;
  scanIntervalSec: number;
  confirmCount: number;
  cooldownSec: number;
};

function MultiROISetupModal({
  currentROIs,
  redThreshold,
  onSave,
  onClose,
  viewerUdid,
  scanIntervalSec,
  confirmCount,
  cooldownSec,
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

  // Settings draft states
  const [draftScanIntervalSec, setDraftScanIntervalSec] = useState(scanIntervalSec);
  const [draftConfirmCount, setDraftConfirmCount] = useState(confirmCount);
  const [draftCooldownSec, setDraftCooldownSec] = useState(cooldownSec);
  const [draftRedThreshold, setDraftRedThreshold] = useState<RedThreshold>(redThreshold);

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
    const result = scanCanvasROIs(activeCanvas, draftROIs, draftRedThreshold);
    setTestResults(result);
    setTimeout(() => setTestResults(null), 8000);
  }, [selectedUdid, activeCanvas, draftROIs, draftRedThreshold]);

  // Active ROI object
  const activeROI = draftROIs.find(r => r.id === activeROIId) ?? null;

  return createPortal(
    <>
      <div className="visualAlertModalOverlay"
        data-inspector-id="visualAlert.modalOverlay"
        data-inspector-label="Visual Alert modal overlay"
        data-inspector-component="client/src/components/VisualAlertPanel.tsx"
      >
        <div
          className="visualAlertModalCard visualAlertModalCardWide"
          style={{
            transform: `translate(${modalPos.x}px, ${modalPos.y}px)`,
          }}
          data-inspector-id="visualAlert.modalCard"
          data-inspector-label="Visual Alert modal card"
          data-inspector-component="client/src/components/VisualAlertPanel.tsx"
        >
          {/* Header */}
          <div
            className="visualAlertModalHeader"
            style={{ cursor: 'move', userSelect: 'none' }}
            onPointerDown={handleHeaderPointerDown}
            onPointerMove={handleHeaderPointerMove}
            onPointerUp={handleHeaderPointerUp}
            data-inspector-id="visualAlert.modalHeader"
            data-inspector-label="Visual Alert modal header"
            data-inspector-component="client/src/components/VisualAlertPanel.tsx"
          >
            <h5 className="visualAlertModalTitle"
              data-inspector-id="visualAlert.modalTitle"
              data-inspector-label="Visual Alert modal title"
              data-inspector-component="client/src/components/VisualAlertPanel.tsx"
            >
              <Crosshair size={16} />
              <span>Thiết lập Visual Alert</span>
              {draftROIs.length > 0 && (
                <span className="visualAlertROICountBadge"
                  data-inspector-id="visualAlert.modalRoiCountBadge"
                  data-inspector-label="Visual Alert modal ROI count badge"
                  data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                >{draftROIs.length}</span>
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
              data-inspector-id="visualAlert.modalCloseButton"
              data-inspector-label="Visual Alert modal close button"
              data-inspector-component="client/src/components/VisualAlertPanel.tsx"
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div className="visualAlertModalBody"
            data-inspector-id="visualAlert.modalBody"
            data-inspector-label="Visual Alert modal body"
            data-inspector-component="client/src/components/VisualAlertPanel.tsx"
          >
            {!selectedUdid || !activeCanvas ? (
              <div className="visualAlertPickerEmpty"
                data-inspector-id="visualAlert.modalEmptyState"
                data-inspector-label="Visual Alert modal empty state"
                data-inspector-component="client/src/components/VisualAlertPanel.tsx"
              >
                Chọn một máy đang stream ở Grid trước
              </div>
            ) : (
              <>
                {/* Canvas preview + ROI overlays */}
                <div className="visualAlertPreviewWrap" ref={containerRef}
                  data-inspector-id="visualAlert.previewWrap"
                  data-inspector-label="Visual Alert preview wrapper"
                  data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                >
                  <canvas
                    ref={previewCanvasRef}
                    className="visualAlertPreviewCanvas"
                    onPointerMove={handleROIPointerMove}
                    onPointerUp={handleROIPointerUp}
                    data-inspector-id="visualAlert.previewCanvas"
                    data-inspector-label="Visual Alert preview canvas"
                    data-inspector-component="client/src/components/VisualAlertPanel.tsx"
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
                        data-inspector-id="visualAlert.roiBox"
                        data-inspector-label={`Visual Alert ROI box: ${roi.name}`}
                        data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                      >
                        {/* ROI label */}
                        <span className="visualAlertROILabel"
                          data-inspector-id="visualAlert.roiLabel"
                          data-inspector-label={`Visual Alert ROI label: ${roi.name}`}
                          data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                        >{roi.name}</span>
                        {/* Resize handle only for active ROI */}
                        {isActive && (
                          <div
                            className="visualAlertROIResizeHandle"
                            onPointerDown={e => handleROIPointerDown(e, roi.id, 'resize')}
                            data-inspector-id="visualAlert.roiResizeHandle"
                            data-inspector-label={`Visual Alert ROI resize handle: ${roi.name}`}
                            data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Active ROI coordinates */}
                {activeROI && (
                  <div className="visualAlertROICoords"
                    data-inspector-id="visualAlert.roiCoords"
                    data-inspector-label="Visual Alert ROI coordinates"
                    data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                  >
                    <span>x: {activeROI.x.toFixed(3)}</span>
                    <span>y: {activeROI.y.toFixed(3)}</span>
                    <span>w: {activeROI.w.toFixed(3)}</span>
                    <span>h: {activeROI.h.toFixed(3)}</span>
                  </div>
                )}

                {/* Settings */}
                <div className="visualAlertSettingsGrid" style={{ marginTop: 8, marginBottom: 8 }}
                  data-inspector-id="visualAlert.modalSettingsGrid"
                  data-inspector-label="Visual Alert modal settings grid"
                  data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                >
                  <label className="visualAlertSettingItem">
                    <span>Chu kỳ (s)</span>
                    <div className="visualAlertInputWrap">
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={draftScanIntervalSec}
                        onChange={e =>
                          setDraftScanIntervalSec(Math.max(1, Math.min(30, Number(e.target.value) || 3)))
                        }
                        data-inspector-id="visualAlert.modalScanIntervalInput"
                        data-inspector-label="Visual Alert modal scan interval input"
                        data-inspector-component="client/src/components/VisualAlertPanel.tsx"
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
                        value={draftConfirmCount}
                        onChange={e =>
                          setDraftConfirmCount(Math.max(1, Math.min(10, Number(e.target.value) || 2)))
                        }
                        data-inspector-id="visualAlert.modalConfirmCountInput"
                        data-inspector-label="Visual Alert modal confirm count input"
                        data-inspector-component="client/src/components/VisualAlertPanel.tsx"
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
                        value={draftCooldownSec}
                        onChange={e =>
                          setDraftCooldownSec(Math.max(10, Math.min(600, Number(e.target.value) || 60)))
                        }
                        data-inspector-id="visualAlert.modalCooldownInput"
                        data-inspector-label="Visual Alert modal cooldown input"
                        data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                      />
                    </div>
                  </label>
                  <label className="visualAlertSettingItem">
                    <span title="Giá trị R tối thiểu (0-255). Mặc định: 180">Màu Đỏ</span>
                    <div className="visualAlertInputWrap">
                      <input
                        type="number"
                        min={0} max={255}
                        value={draftRedThreshold.rMin}
                        onChange={e =>
                          setDraftRedThreshold(prev => ({ ...prev, rMin: Math.max(0, Math.min(255, Number(e.target.value) || 0)) }))
                        }
                        data-inspector-id="visualAlert.modalRedThresholdR"
                        data-inspector-label="Visual Alert modal red threshold R min"
                        data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                      />
                    </div>
                  </label>
                  <label className="visualAlertSettingItem">
                    <span title="Giá trị G tối đa (0-255). Giảm để loại bỏ màu Cam/Vàng. Mặc định: 100">Lọc Cam</span>
                    <div className="visualAlertInputWrap">
                      <input
                        type="number"
                        min={0} max={255}
                        value={draftRedThreshold.gMax}
                        onChange={e =>
                          setDraftRedThreshold(prev => ({ ...prev, gMax: Math.max(0, Math.min(255, Number(e.target.value) || 0)) }))
                        }
                        data-inspector-id="visualAlert.modalRedThresholdG"
                        data-inspector-label="Visual Alert modal red threshold G max"
                        data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                      />
                    </div>
                  </label>
                  <label className="visualAlertSettingItem">
                    <span title="Giá trị B tối đa (0-255). Giảm để loại bỏ màu Tím/Hồng. Mặc định: 100">Lọc Tím</span>
                    <div className="visualAlertInputWrap">
                      <input
                        type="number"
                        min={0} max={255}
                        value={draftRedThreshold.bMax}
                        onChange={e =>
                          setDraftRedThreshold(prev => ({ ...prev, bMax: Math.max(0, Math.min(255, Number(e.target.value) || 0)) }))
                        }
                        data-inspector-id="visualAlert.modalRedThresholdB"
                        data-inspector-label="Visual Alert modal red threshold B max"
                        data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                      />
                    </div>
                  </label>

                  <div className="visualAlertSettingItem" style={{ marginLeft: 'auto', justifyContent: 'flex-end', paddingBottom: 2 }}>
                    <div className="visualAlertROIListHeader" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                      <span>DS điểm quét ({draftROIs.length})</span>
                      <button
                        className="visualAlertAddROIBtn"
                        onClick={handleAddROI}
                        title="Thêm điểm quét mới"
                        data-inspector-id="visualAlert.addRoiButton"
                        data-inspector-label="Visual Alert add ROI button"
                        data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                </div>

                {/* ROI List */}
                <div className="visualAlertROIList"
                  data-inspector-id="visualAlert.roiList"
                  data-inspector-label="Visual Alert ROI list"
                  data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                >
                  {draftROIs.length === 0 && (
                    <div className="visualAlertROIEmpty"
                      data-inspector-id="visualAlert.roiEmptyState"
                      data-inspector-label="Visual Alert ROI empty state"
                      data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                    >
                      Chưa có điểm quét. Nhấn "+ Thêm" để tạo.
                    </div>
                  )}
                  {draftROIs.map(roi => (
                    <div
                      key={roi.id}
                      className={`visualAlertROIItem${roi.id === activeROIId ? ' active' : ''}`}
                      onClick={() => setActiveROIId(roi.id)}
                      data-inspector-id="visualAlert.roiItem"
                      data-inspector-label={`Visual Alert ROI item: ${roi.name}`}
                      data-inspector-component="client/src/components/VisualAlertPanel.tsx"
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
                            data-inspector-id="visualAlert.roiNameInput"
                            data-inspector-label={`Visual Alert ROI name input: ${roi.name}`}
                            data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                          />
                        ) : (
                          <span
                            className="visualAlertROIItemName"
                            onDoubleClick={e => {
                              e.stopPropagation();
                              setEditingNameId(roi.id);
                            }}
                            title="Double-click để đổi tên"
                            data-inspector-id="visualAlert.roiName"
                            data-inspector-label={`Visual Alert ROI name: ${roi.name}`}
                            data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                          >
                            {roi.name}
                          </span>
                        )}
                        <span className="visualAlertROIItemCoords"
                          data-inspector-id="visualAlert.roiCoordsLabel"
                          data-inspector-label={`Visual Alert ROI coords label: ${roi.name}`}
                          data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                        >
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
                        data-inspector-id="visualAlert.deleteRoiButton"
                        data-inspector-label={`Visual Alert delete ROI button: ${roi.name}`}
                        data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Test results */}
                {testResults && testResults.scanned && (
                  <div className="visualAlertMultiTestResult"
                    data-inspector-id="visualAlert.multiTestResult"
                    data-inspector-label="Visual Alert multi test results"
                    data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                  >
                    {testResults.hits.map(h => (
                      <div key={h.roiId} className="visualAlertMultiTestRow"
                        data-inspector-id="visualAlert.multiTestRow"
                        data-inspector-label={`Visual Alert multi-test row: ${h.roiName}`}
                        data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                      >
                        <span>{h.roiName}:</span>
                        <span>{h.redPixelCount} px</span>
                        <span>{h.detected ? '✅' : '❌'}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Modal Actions */}
                <div className="visualAlertModalActions"
                  data-inspector-id="visualAlert.modalActions"
                  data-inspector-label="Visual Alert modal actions container"
                  data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                >
                  <button
                    className="visualAlertModalBtn secondary"
                    onClick={handleTestInModal}
                    disabled={!draftROIs.length}
                    data-inspector-id="visualAlert.modalTestScanButton"
                    data-inspector-label="Visual Alert modal test scan button"
                    data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                  >
                    Test quét
                  </button>
                  <button
                    className="visualAlertModalBtn secondary"
                    onClick={() => playAlertSound()}
                    data-inspector-id="visualAlert.modalTestSoundButton"
                    data-inspector-label="Visual Alert modal test sound button"
                    data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                  >
                    Test âm thanh
                  </button>
                  <button
                    className="visualAlertModalBtn primary"
                    onClick={() =>
                      onSave(draftROIs, {
                        scanIntervalSec: draftScanIntervalSec,
                        confirmCount: draftConfirmCount,
                        cooldownSec: draftCooldownSec,
                        redThreshold: draftRedThreshold,
                      })
                    }
                    data-inspector-id="visualAlert.modalSaveButton"
                    data-inspector-label="Visual Alert modal save button"
                    data-inspector-component="client/src/components/VisualAlertPanel.tsx"
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
        <div className="confirmOverlay" onMouseDown={() => setPendingDeleteROI(null)}
          data-inspector-id="visualAlert.deleteRoiConfirmOverlay"
          data-inspector-label="Visual Alert delete ROI confirm overlay"
          data-inspector-component="client/src/components/VisualAlertPanel.tsx"
        >
          <div className="confirmPanel compact" onMouseDown={e => e.stopPropagation()}
            data-inspector-id="visualAlert.deleteRoiConfirmPanel"
            data-inspector-label="Visual Alert delete ROI confirm panel"
            data-inspector-component="client/src/components/VisualAlertPanel.tsx"
          >
            <div className="confirmTitle"
              data-inspector-id="visualAlert.deleteRoiConfirmTitle"
              data-inspector-label="Visual Alert delete ROI confirm title"
              data-inspector-component="client/src/components/VisualAlertPanel.tsx"
            >Xoá điểm quét?</div>
            <div className="confirmText"
              data-inspector-id="visualAlert.deleteRoiConfirmText"
              data-inspector-label="Visual Alert delete ROI confirm text"
              data-inspector-component="client/src/components/VisualAlertPanel.tsx"
            >
              Bạn có chắc muốn xoá điểm quét này không?
            </div>
            <div className="confirmActions center">
              <button className="modalBtn" onClick={() => setPendingDeleteROI(null)}
                data-inspector-id="visualAlert.deleteRoiCancelButton"
                data-inspector-label="Visual Alert delete ROI cancel button"
                data-inspector-component="client/src/components/VisualAlertPanel.tsx"
              >Huỷ</button>
              <button
                className="modalBtnDanger"
                onClick={() => {
                  handleDeleteROI(pendingDeleteROI);
                  setPendingDeleteROI(null);
                }}
                data-inspector-id="visualAlert.deleteRoiConfirmButton"
                data-inspector-label="Visual Alert delete ROI confirm button"
                data-inspector-component="client/src/components/VisualAlertPanel.tsx"
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
