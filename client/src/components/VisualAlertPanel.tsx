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
import { useServer } from '@/context/ServerContext';
import {
  DEFAULT_VISUAL_ALERT_CONFIG,
  type VisualAlertConfig,
  type VisualAlertDetectionMode,
  type VisualAlertROI,
  type MultiROIResult,
  type RedThreshold,
  type WeChatStatusConfig,
  loadVisualAlertConfig,
  saveVisualAlertConfig,
  scanCanvasVisualAlert,
  generateROIId,
  playAlertSound,
} from '@/lib/visualAlertEngine';
import { runAdbCommandApi } from '@/lib/serverApi';

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

function getModalROIDetectionMode(
  roi: VisualAlertROI,
  fallbackMode: VisualAlertDetectionMode,
): VisualAlertDetectionMode {
  if (roi.detectionMode === 'wechat-status' || roi.detectionMode === 'red-dot') return roi.detectionMode;
  const lower = roi.name.toLowerCase();
  if (lower.includes('wechat') || lower.includes('we chat')) return 'wechat-status';
  if (lower.includes('message') || lower.includes('nearby') || lower.includes('badge')) return 'red-dot';
  return fallbackMode;
}

function getModalROIDetectionLabel(mode: VisualAlertDetectionMode): string {
  return mode === 'wechat-status' ? 'WeChat icon' : 'Chấm đỏ';
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
  const { wsServer } = useServer();

  // Config state
  const [config, setConfig] = useState<VisualAlertConfig>(loadVisualAlertConfig);
  const [roiModalOpen, setRoiModalOpen] = useState(false);

  const verifyWeChatNotification = useCallback(async (udid: string): Promise<boolean> => {
    const command =
      "dumpsys notification --noredact 2>/dev/null | sed -n '/Notification List:/,/Historical/p' | grep -m 1 -E 'NotificationRecord\\(.*pkg=com\\.tencent\\.mm|pkg=com\\.tencent\\.mm' || true";
    try {
      const result = await runAdbCommandApi(wsServer, udid, command, 'shell');
      return /com\.tencent\.mm/i.test(result.output || '');
    } catch {
      return false;
    }
  }, [wsServer]);

  // Hook for scan loop
  const { scanning } = useVisualAlert({
    config,
    getCanvasForUdid,
    registeredUdids,
    orderMap,
    viewerUdid,
    verifyWeChatNotification,
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
    (rois: VisualAlertROI[], settings: {
      detectionMode: VisualAlertDetectionMode;
      scanIntervalSec: number;
      confirmCount: number;
      cooldownSec: number;
      redThreshold: RedThreshold;
      wechatStatus: WeChatStatusConfig;
    }) => {
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
          detectionMode={config.detectionMode}
          redThreshold={config.redThreshold}
          wechatStatus={config.wechatStatus}
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
  detectionMode: VisualAlertDetectionMode;
  redThreshold: VisualAlertConfig['redThreshold'];
  wechatStatus: WeChatStatusConfig;
  onSave: (
    rois: VisualAlertROI[],
    settings: {
      detectionMode: VisualAlertDetectionMode;
      scanIntervalSec: number;
      confirmCount: number;
      cooldownSec: number;
      redThreshold: RedThreshold;
      wechatStatus: WeChatStatusConfig;
    }
  ) => void;
  onClose: () => void;
  viewerUdid?: string | null;
  scanIntervalSec: number;
  confirmCount: number;
  cooldownSec: number;
};

function MultiROISetupModal({
  currentROIs,
  detectionMode,
  redThreshold,
  wechatStatus,
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
    currentROIs.map(r => ({ ...r, detectionMode: getModalROIDetectionMode(r, detectionMode) })),
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
  const [draftDetectionMode, setDraftDetectionMode] = useState<VisualAlertDetectionMode>(detectionMode);
  const [draftWeChatStatus, setDraftWeChatStatus] = useState<WeChatStatusConfig>({ ...wechatStatus });

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
  const lastPreviewSizeRef = useRef({ width: 392, height: 660 });

  // Draw device canvas snapshot to preview
  const drawPreview = useCallback(() => {
    const dst = previewCanvasRef.current;
    if (!dst) return;

    const ctx = dst.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    // Use parent width as base (modal body), not container itself (which may auto-size)
    const parentW = container?.parentElement?.clientWidth ?? 500;
    const maxW = parentW - 2; // account for border
    const sourceCanvas = selectedUdid && activeCanvas && activeCanvas.width && activeCanvas.height ? activeCanvas : null;
    const fallbackSize = lastPreviewSizeRef.current;
    const aspect = sourceCanvas
      ? sourceCanvas.height / sourceCanvas.width
      : fallbackSize.height / fallbackSize.width;

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
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, previewW, previewH);
    if (sourceCanvas) {
      ctx.drawImage(sourceCanvas, 0, 0, previewW, previewH);
      lastPreviewSizeRef.current = { width: previewW, height: previewH };
    }

    // Sync container size so ROI overlay percentages align with canvas
    if (container) {
      container.style.width = `${previewW}px`;
    }
  }, [selectedUdid, activeCanvas]);

  // Draw preview when device selected, and refresh periodically
  useEffect(() => {
    drawPreview();
    const timer = setInterval(drawPreview, 1000);
    return () => clearInterval(timer);
  }, [drawPreview]);

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
    const isWeChatMode = draftDetectionMode === 'wechat-status';
    const newROI: VisualAlertROI = {
      id: generateROIId(),
      name: isWeChatMode ? `WeChat ${idx}` : `Badge ${idx}`,
      x: isWeChatMode ? 0.08 : 0.45,
      y: isWeChatMode ? 0 : 0.45,
      w: isWeChatMode ? 0.22 : 0.06,
      h: isWeChatMode ? 0.07 : 0.04,
      detectionMode: draftDetectionMode,
    };
    setDraftROIs(prev => [...prev, newROI]);
    setActiveROIId(newROI.id);
  }, [draftDetectionMode, draftROIs.length]);

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
    const result = scanCanvasVisualAlert(activeCanvas, {
      ...DEFAULT_VISUAL_ALERT_CONFIG,
      enabled: true,
      detectionMode: draftDetectionMode,
      rois: draftROIs,
      scanIntervalSec: draftScanIntervalSec,
      confirmCount: draftConfirmCount,
      cooldownSec: draftCooldownSec,
      redThreshold: draftRedThreshold,
      wechatStatus: draftWeChatStatus,
    });
    setTestResults(result);
    setTimeout(() => setTestResults(null), 8000);
  }, [
    selectedUdid,
    activeCanvas,
    draftROIs,
    draftDetectionMode,
    draftScanIntervalSec,
    draftConfirmCount,
    draftCooldownSec,
    draftRedThreshold,
    draftWeChatStatus,
  ]);

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
            <>
              <div style={{ display: 'none' }} className="visualAlertPickerEmpty"
                data-inspector-id="visualAlert.modalEmptyState"
                data-inspector-label="Visual Alert modal empty state"
                data-inspector-component="client/src/components/VisualAlertPanel.tsx"
              >
                Chọn một máy đang stream ở Grid trước
              </div>
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
                    <span>Chế độ</span>
                    <div className="visualAlertInputWrap">
                      <select
                        value={draftDetectionMode}
                        onChange={e => {
                          setDraftDetectionMode(e.target.value as VisualAlertDetectionMode);
                          setTestResults(null);
                        }}
                        data-inspector-id="visualAlert.modalDetectionModeSelect"
                        data-inspector-label="Visual Alert modal detection mode select"
                        data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                      >
                        <option value="red-dot">Chấm đỏ</option>
                        <option value="wechat-status">WeChat icon</option>
                      </select>
                    </div>
                  </label>
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
                  {draftDetectionMode === 'red-dot' ? (
                    <>
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
                  <label className="visualAlertSettingItem">
                    <span title="Số pixel đỏ tối thiểu trong ROI">Px đỏ</span>
                    <div className="visualAlertInputWrap">
                      <input
                        type="number"
                        min={1} max={10000}
                        value={draftRedThreshold.minPixels}
                        onChange={e =>
                          setDraftRedThreshold(prev => ({ ...prev, minPixels: Math.max(1, Math.min(10000, Number(e.target.value) || DEFAULT_VISUAL_ALERT_CONFIG.redThreshold.minPixels)) }))
                        }
                        data-inspector-id="visualAlert.modalRedThresholdMinPixels"
                        data-inspector-label="Visual Alert modal red threshold minimum pixels"
                        data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                      />
                    </div>
                  </label>
                    </>
                  ) : (
                    <>
                  <label className="visualAlertSettingItem">
                    <span title="Điểm khớp template tối thiểu">Score</span>
                    <div className="visualAlertInputWrap">
                      <input
                        type="number"
                        min={0.35}
                        max={0.95}
                        step={0.01}
                        value={draftWeChatStatus.minScore}
                        onChange={e =>
                          setDraftWeChatStatus(prev => ({
                            ...prev,
                            minScore: Math.max(0.35, Math.min(0.95, Number(e.target.value) || DEFAULT_VISUAL_ALERT_CONFIG.wechatStatus.minScore)),
                          }))
                        }
                        data-inspector-id="visualAlert.modalWechatScore"
                        data-inspector-label="Visual Alert modal WeChat score threshold"
                        data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                      />
                    </div>
                  </label>
                  <label className="visualAlertSettingItem">
                    <span title="Ngưỡng tương phản của icon status bar">Icon</span>
                    <div className="visualAlertInputWrap">
                      <input
                        type="number"
                        min={80}
                        max={255}
                        value={draftWeChatStatus.whiteThreshold}
                        onChange={e =>
                          setDraftWeChatStatus(prev => ({
                            ...prev,
                            whiteThreshold: Math.max(80, Math.min(255, Number(e.target.value) || DEFAULT_VISUAL_ALERT_CONFIG.wechatStatus.whiteThreshold)),
                          }))
                        }
                        data-inspector-id="visualAlert.modalWechatWhiteThreshold"
                        data-inspector-label="Visual Alert modal WeChat white threshold"
                        data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                      />
                    </div>
                  </label>
                  <label className="visualAlertSettingItem">
                    <span title="Số pixel icon tối thiểu trong ROI">Px icon</span>
                    <div className="visualAlertInputWrap">
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        value={draftWeChatStatus.minWhitePixels}
                        onChange={e =>
                          setDraftWeChatStatus(prev => ({
                            ...prev,
                            minWhitePixels: Math.max(1, Math.min(10000, Number(e.target.value) || DEFAULT_VISUAL_ALERT_CONFIG.wechatStatus.minWhitePixels)),
                          }))
                        }
                        data-inspector-id="visualAlert.modalWechatMinWhitePixels"
                        data-inspector-label="Visual Alert modal WeChat minimum white pixels"
                        data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                      />
                    </div>
                  </label>
                  <label className="visualAlertSettingItem visualAlertCheckSetting">
                    <span title="Chỉ hỏi ADB sau khi ROI/template đã nghi trúng icon WeChat">ADB xác minh</span>
                    <div className="visualAlertInputWrap visualAlertCheckWrap">
                      <input
                        type="checkbox"
                        checked={draftWeChatStatus.adbVerify}
                        onChange={e =>
                          setDraftWeChatStatus(prev => ({
                            ...prev,
                            adbVerify: e.target.checked,
                          }))
                        }
                        data-inspector-id="visualAlert.modalWechatAdbVerify"
                        data-inspector-label="Visual Alert modal WeChat ADB verify checkbox"
                        data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                      />
                    </div>
                  </label>
                  {draftWeChatStatus.adbVerify && (
                    <label className="visualAlertSettingItem">
                      <span title="Khoảng nghỉ cache xác minh ADB">ADB (s)</span>
                      <div className="visualAlertInputWrap">
                        <input
                          type="number"
                          min={5}
                          max={300}
                          value={draftWeChatStatus.adbCooldownSec}
                          onChange={e =>
                            setDraftWeChatStatus(prev => ({
                              ...prev,
                              adbCooldownSec: Math.max(5, Math.min(300, Number(e.target.value) || DEFAULT_VISUAL_ALERT_CONFIG.wechatStatus.adbCooldownSec)),
                            }))
                          }
                          data-inspector-id="visualAlert.modalWechatAdbCooldown"
                          data-inspector-label="Visual Alert modal WeChat ADB cooldown"
                          data-inspector-component="client/src/components/VisualAlertPanel.tsx"
                        />
                      </div>
                    </label>
                  )}
                    </>
                  )}

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
                          {getModalROIDetectionLabel(getModalROIDetectionMode(roi, draftDetectionMode))} · {roi.w.toFixed(2)}×{roi.h.toFixed(2)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="visualAlertROIDeleteBtn"
                        onPointerDown={e => {
                          e.stopPropagation();
                        }}
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
                        <span>
                          {h.detectionMode === 'wechat-status'
                            ? `${Math.round((h.matchScore ?? 0) * 100)}% / ${h.foregroundPixelCount ?? h.whitePixelCount ?? h.redPixelCount}px`
                            : `${h.redPixelCount} px`}
                        </span>
                        <span>{h.detected ? 'OK' : 'NO'}</span>
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
                    disabled={!draftROIs.length || !selectedUdid || !activeCanvas}
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
                        detectionMode: draftDetectionMode,
                        scanIntervalSec: draftScanIntervalSec,
                        confirmCount: draftConfirmCount,
                        cooldownSec: draftCooldownSec,
                        redThreshold: draftRedThreshold,
                        wechatStatus: draftWeChatStatus,
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
          </div>
        </div>
      </div>

      {pendingDeleteROI && (
        <div className="confirmOverlay confirmOverlay--top visualAlertDeleteConfirmOverlay" onMouseDown={() => setPendingDeleteROI(null)}
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
                  setTestResults(null);
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
