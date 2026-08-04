import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useServer } from '@/context/ServerContext';
import { useI18n } from '@/context/I18nContext';
import { runAdbCommandApi, splitCommandBatchSmart, normalizeAdbSegment } from '@/lib/serverApi';
import { Terminal, X, Play, Clock, Save, Trash2, Palette, Plus, Copy } from 'lucide-react';

type AdbLogEntry = { id: number; time: string; command: string; output: string; success: boolean };
/* Preset ADB commands - warn=true for dangerous */
const DEFAULT_PRESETS: { label: string; cmd: string; warn?: boolean; color?: string }[] = [
  { label: 'Bật WiFi', cmd: 'svc wifi enable' },
  { label: 'Tắt WiFi', cmd: 'svc wifi disable' },
  { label: 'Tăng âm lượng', cmd: 'input keyevent 24' },
  { label: 'Giảm âm lượng', cmd: 'input keyevent 25' },
  { label: 'Tắt tiếng', cmd: 'input keyevent 164' },
  { label: 'Xoá cache (an toàn)', cmd: 'pm trim-caches 999999G' },
  { label: 'Thông tin pin', cmd: 'dumpsys battery' },
  { label: 'DS ứng dụng đã cài', cmd: 'pm list packages -3' },
  { label: 'Khởi động lại', cmd: 'adb reboot', warn: true },
  { label: 'Chụp màn hình', cmd: 'screencap -p /sdcard/screenshot.png' },
  { label: '⚠ Xoá DỮ LIỆU app', cmd: 'pm clear <package>', warn: true },
  { label: 'IP thiết bị', cmd: 'ip addr show wlan0' },
  { label: 'DS user profiles', cmd: 'pm list users' },
  { label: 'Bộ nhớ trống', cmd: 'df -h /sdcard' },
];

const LS_CMD_HISTORY = 'vsp_cmd_history';
const LS_PRESET_COLORS = 'vsp_preset_colors';

const isRiskyPreset = (warn?: boolean, color?: string) =>
  Boolean(warn || ['#ef4444', '#ff9c9c', 'red'].includes((color || '').toLowerCase()));

function loadJson<T>(key: string, def: T): T { try { return JSON.parse(localStorage.getItem(key) || '') ?? def; } catch { return def; } }
function saveJson(key: string, v: any) { localStorage.setItem(key, JSON.stringify(v)); }

type ViewerAdbToolsProps = {
  udid: string;
  connectSelection?: Set<string>;
};

export function ViewerAdbTools({ udid, connectSelection }: ViewerAdbToolsProps) {
  const { wsServer } = useServer();
  const { t } = useI18n();

  // ADB Modal
  const [showAdbModal, setShowAdbModal] = useState(false);
  const [adbCommand, setAdbCommand] = useState('');
  const [adbLogs, setAdbLogs] = useState<AdbLogEntry[]>([]);
  const [adbRunning, setAdbRunning] = useState(false);

  const textareaRef = useCallback((node: HTMLTextAreaElement | null) => {
    if (node !== null) {
      if (!adbCommand.includes('\n')) {
        node.style.height = '36px';
      } else {
        node.style.height = '36px'; // reset to measure
        node.style.height = `${Math.min(node.scrollHeight + 2, 120)}px`;
      }
    }
  }, [adbCommand]);
  const [adbTab, setAdbTab] = useState<'preset' | 'history' | 'custom'>('preset');
  const [cmdHistory, setCmdHistory] = useState<string[]>(() => loadJson(LS_CMD_HISTORY, []));
  const [newCmdLabel, setNewCmdLabel] = useState('');
  const [newCmdValue, setNewCmdValue] = useState('');

  const logIdRef = useRef(0);

  // Preset commands state
  const LS_PRESETS = 'vsp_presets';
  const [presets, setPresets] = useState<{ label: string; cmd: string; warn?: boolean; color?: string }[]>(() => loadJson(LS_PRESETS, DEFAULT_PRESETS));

  // Draggable position
  const [position, setPosition] = useState(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      x: Math.max(20, Math.floor((w - 720) / 2)),
      y: Math.max(20, Math.floor((h - 550) / 2)),
    };
  });

  // Preset color overrides
  const COLOR_MIGRATION: Record<string, string> = {
    '#fff': '#ffffff', '#ff9c9c': '#ef4444', '#9cffb8': '#22c55e', '#9cd4ff': '#3b82f6', '#ffdc9c': '#f59e0b', '#d49cff': '#a855f7', '#ff9ce0': '#ec4899'
  };
  const [presetColors, setPresetColors] = useState<Record<number, string>>(() => {
    const loaded = loadJson(LS_PRESET_COLORS, {});
    const migrated: Record<number, string> = {};
    for (const [k, v] of Object.entries(loaded)) {
      migrated[Number(k)] = COLOR_MIGRATION[v as string] || v as string;
    }
    return migrated;
  });

  const [confirmCmd, setConfirmCmd] = useState<{ cmd: string; label: string } | null>(null);
  const [adbPresetContext, setAdbPresetContext] = useState<{ label: string; risky: boolean } | null>(null);

  // Context menu for presets
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; idx: number } | null>(null);

  // Drag and drop for presets
  const [draggedPresetIdx, setDraggedPresetIdx] = useState<number | null>(null);
  const [dragOverPresetIdx, setDragOverPresetIdx] = useState<number | null>(null);
  const [editingPreset, setEditingPreset] = useState<{ idx: number; label: string; cmd: string } | null>(null);

  // ===== DRAGGABLE LOGIC =====
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    panelEl?: HTMLElement | null;
    lastX?: number;
    lastY?: number;
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  const clampPosition = (val: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, val));
  };

  const onDragMove = useCallback((e: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag.active || !drag.panelEl) return;
    e.preventDefault();
    const nextX = drag.originX + e.clientX - drag.startX;
    const nextY = drag.originY + e.clientY - drag.startY;
    const finalX = clampPosition(nextX, 0, Math.max(0, window.innerWidth - 100));
    const finalY = clampPosition(nextY, 0, Math.max(0, window.innerHeight - 80));
    
    drag.panelEl.style.left = `${finalX}px`;
    drag.panelEl.style.top = `${finalY}px`;
    
    drag.lastX = finalX;
    drag.lastY = finalY;
  }, []);

  const onDragUp = useCallback(() => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.active = false;
    document.body.classList.remove('is-dragging-modal');
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragUp);
    
    if (drag.lastX !== undefined && drag.lastY !== undefined) {
      setPosition({ x: drag.lastX, y: drag.lastY });
    }
  }, [onDragMove]);

  const startDrag = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input, select, textarea')) return;
    e.preventDefault();
    const panel = e.currentTarget.closest('.vsp-modal') as HTMLElement | null;
    if (!panel) return;
    
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
      panelEl: panel,
      lastX: position.x,
      lastY: position.y
    };
    document.body.classList.add('is-dragging-modal');
    window.addEventListener('pointermove', onDragMove, { passive: false });
    window.addEventListener('pointerup', onDragUp);
  }, [onDragMove, onDragUp, position.x, position.y]);

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onDragMove);
      window.removeEventListener('pointerup', onDragUp);
    };
  }, [onDragMove, onDragUp]);

  // ADB submenu on hover
  const [showAdbSubmenu, setShowAdbSubmenu] = useState(false);
  const adbHoverTimer = useRef<number | null>(null);

  // Handle click outside to close context menu, using capture phase to catch clicks blocked by canvas
  useEffect(() => {
    if (!ctxMenu) return;
    const handleClickOutside = (event: MouseEvent | PointerEvent) => {
      if (event.button === 2) return;
      const target = event.target as Element;
      const isClickOnContextMenu = target.closest('.react-contexify') || target.closest('.vsp-ctx-menu') || target.closest('.context-menu');
      if (!isClickOnContextMenu) {
        setCtxMenu(null);
      }
    };

    window.addEventListener('pointerdown', handleClickOutside, true);
    return () => window.removeEventListener('pointerdown', handleClickOutside, true);
  }, [ctxMenu]);

  const adbSectionRef = useRef<HTMLDivElement>(null);
  const adbSubmenuMenuRef = useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    if (showAdbSubmenu && adbSectionRef.current && adbSubmenuMenuRef.current) {
      const rect = adbSectionRef.current.getBoundingClientRect();
      const menuEl = adbSubmenuMenuRef.current;
      const menuWidth = 220;
      let x = rect.right - 4;
      if (x + menuWidth > window.innerWidth) {
        x = rect.left - menuWidth + 4;
      }
      
      let top = rect.top - 30;
      top = Math.max(10, top);
      const menuHeight = menuEl.offsetHeight || 150;
      if (top + menuHeight > window.innerHeight - 10) {
        top = window.innerHeight - menuHeight - 10;
      }
      top = Math.max(10, top);

      menuEl.style.left = `${x}px`;
      menuEl.style.bottom = 'auto';
      menuEl.style.top = `${top}px`;
      menuEl.style.maxHeight = `${window.innerHeight - top - 12}px`;
      menuEl.style.opacity = '1';
      menuEl.style.pointerEvents = 'auto';
    }
  }, [showAdbSubmenu]);

  const handleAdbEnter = () => {
    if (adbHoverTimer.current) clearTimeout(adbHoverTimer.current);
    setShowAdbSubmenu(true);
  };

  const handleAdbLeave = () => {
    adbHoverTimer.current = window.setTimeout(() => setShowAdbSubmenu(false), 100);
  };

  useEffect(() => {
    return () => {
      if (adbHoverTimer.current) window.clearTimeout(adbHoverTimer.current);
    };
  }, []);

  // ADB execution
  const executeAdbCommand = useCallback(async (rawInput: string) => {
    if (!rawInput.trim()) return;
    setAdbRunning(true);
    setCmdHistory(prev => {
      const next = [rawInput, ...prev.filter(c => c !== rawInput)].slice(0, 50);
      saveJson(LS_CMD_HISTORY, next);
      return next;
    });

    const segments = splitCommandBatchSmart(rawInput);
    const parsedCommands = segments.map(normalizeAdbSegment);

    const targets = connectSelection && connectSelection.size > 0
      ? Array.from(connectSelection)
      : [udid];

    interface StepLog {
      original: string;
      normalized: string;
      success: boolean;
      output: string;
    }

    const executeBatchOnDevice = async (targetUdid: string): Promise<StepLog[]> => {
      const stepLogs: StepLog[] = [];
      for (let stepIdx = 0; stepIdx < parsedCommands.length; stepIdx++) {
        const parsed = parsedCommands[stepIdx];
        if (parsed.kind === 'invalid') {
          stepLogs.push({
            original: parsed.original,
            normalized: 'INVALID',
            success: false,
            output: parsed.error,
          });
          break; // Stop batch on error
        }

        let success = false;
        let output = '';
        try {
          let result;
          if (parsed.kind === 'shell') {
            result = await runAdbCommandApi(wsServer, targetUdid, parsed.command, 'shell');
          } else {
            result = await runAdbCommandApi(wsServer, targetUdid, '', 'host-adb', parsed.args);
          }
          success = result.success;
          output = result.output;
        } catch (err: any) {
          success = false;
          output = err?.message || 'Error executing command';
        }

        stepLogs.push({
          original: parsed.original,
          normalized: parsed.kind === 'shell' ? `shell: ${parsed.command}` : `host-adb: ${parsed.args.join(' ')}`,
          success,
          output,
        });

        if (!success) {
          break; // Stop batch on failure
        }
      }
      return stepLogs;
    };

    let mainDeviceLogs: StepLog[] = [];

    const runWithConcurrency = async <T,>(
      items: T[],
      limit: number,
      worker: (item: T, index: number) => Promise<void>
    ) => {
      let nextIndex = 0;
      const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (nextIndex < items.length) {
          const index = nextIndex++;
          await worker(items[index], index);
        }
      });
      await Promise.all(workers);
    };

    const allDevicesLogs: Record<string, StepLog[]> = {};
    await runWithConcurrency(targets, 8, async (targetUdid) => {
      const stepLogs = await executeBatchOnDevice(targetUdid);
      allDevicesLogs[targetUdid] = stepLogs;
      if (targetUdid === udid) {
        mainDeviceLogs = stepLogs;
      }
    });

    const extractMainErrorLine = (output: string): string => {
      const clean = output.trim();
      if (!clean) return 'Error';

      const lines = clean.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) return 'Error';

      for (const line of lines) {
        if (line.includes('** Error:') || line.includes('** Error')) {
          return line.length > 500 ? line.slice(0, 500) + '...' : line;
        }
      }
      for (const line of lines) {
        if (line.toLowerCase().includes('error:')) {
          return line.length > 500 ? line.slice(0, 500) + '...' : line;
        }
      }

      const firstLine = lines[0];
      if (firstLine.length > 500) {
        return firstLine.slice(0, 500) + '...';
      }
      return firstLine;
    };

    const formatBatchLog = (stepLogs: StepLog[]): string => {
      if (parsedCommands.length === 1) {
        const step = stepLogs[0];
        if (!step) return '';
        if (step.success) {
          const cleanOutput = step.output.trim();
          if (cleanOutput && cleanOutput !== 'No output') {
            return cleanOutput;
          }
          return '✅ Thành công';
        } else {
          const errorLine = extractMainErrorLine(step.output);
          return `❌ Thất bại\n${errorLine}`;
        }
      }

      const lastStep = stepLogs[stepLogs.length - 1];
      const hasFailure = lastStep && !lastStep.success;

      let logStr = '';
      stepLogs.forEach((step) => {
        if (step.success) {
          const cleanOutput = step.output.trim();
          if (cleanOutput && cleanOutput !== 'No output') {
            if (logStr) logStr += '\n';
            logStr += cleanOutput;
          }
        }
      });

      if (!hasFailure) {
        const header = `✅ Thành công ${parsedCommands.length}/${parsedCommands.length} lệnh`;
        if (logStr) {
          return `${header}\n\n${logStr}`;
        }
        return header;
      } else {
        const failingStepIdx = stepLogs.length;
        const failedHeader = `❌ Lỗi ở lệnh ${failingStepIdx}/${parsedCommands.length}\n${lastStep.original}`;
        const errorLine = extractMainErrorLine(lastStep.output);
        
        if (logStr) {
          return `${logStr}\n\n${failedHeader}\n\n${errorLine}`;
        }
        return `${failedHeader}\n\n${errorLine}`;
      }
    };

    const id = ++logIdRef.current;
    const time = new Date().toLocaleTimeString('vi-VN');
    
    let isOverallSuccess = true;
    for (const targetUdid of targets) {
      const deviceLogs = allDevicesLogs[targetUdid] || [];
      const ok = deviceLogs.length === parsedCommands.length && deviceLogs.every(s => s.success);
      if (!ok) {
        isOverallSuccess = false;
        break;
      }
    }

    let formattedOutput = '';
    if (targets.length > 1) {
      const parts = targets.map(targetUdid => {
        const deviceLogs = allDevicesLogs[targetUdid] || [];
        const deviceOut = formatBatchLog(deviceLogs);
        if (deviceOut.trim().toLowerCase() === targetUdid.toLowerCase()) {
          return `[Device: ${targetUdid}]`;
        }
        return `[Device: ${targetUdid}]\n${deviceOut}`;
      });
      const allSingleLine = parts.every(p => !p.includes('\n'));
      formattedOutput = parts.join(allSingleLine ? '\n' : '\n\n');
    } else {
      formattedOutput = formatBatchLog(mainDeviceLogs);
    }

    setAdbLogs(prev => [
      {
        id,
        time,
        command: rawInput,
        output: formattedOutput,
        success: isOverallSuccess,
      },
      ...prev,
    ]);
    setAdbRunning(false);
  }, [wsServer, udid, connectSelection]);

  const requestAdbExecution = (rawInput: string, label: string, risky: boolean) => {
    const cmd = rawInput.trim();
    if (!cmd) return false;
    if (/<[^>\r\n]+>/.test(cmd)) {
      setShowAdbModal(true);
      setAdbCommand(cmd);
      setAdbPresetContext({ label, risky });
      return false;
    }
    if (risky) setConfirmCmd({ cmd, label: label || cmd });
    else executeAdbCommand(cmd);
    return true;
  };

  const getPresetExecutionContext = (cmd: string) => {
    const idx = presets.findIndex(preset => preset.cmd.trim() === cmd.trim());
    if (idx < 0) return null;
    const preset = presets[idx];
    return { label: preset.label, risky: isRiskyPreset(preset.warn, presetColors[idx] || preset.color) };
  };

  const handleAdbSubmit = () => {
    const context = adbPresetContext || getPresetExecutionContext(adbCommand);
    if (requestAdbExecution(adbCommand, context?.label || adbCommand, context?.risky || false)) {
      setAdbCommand('');
      setAdbPresetContext(null);
    }
  };

  const handleSaveCustomCmd = () => {
    if (!newCmdLabel.trim() || !newCmdValue.trim()) return;
    const next = [...presets, { label: newCmdLabel.trim(), cmd: newCmdValue.trim() }];
    setPresets(next); saveJson(LS_PRESETS, next);
    setNewCmdLabel(''); setNewCmdValue('');
    setAdbTab('preset');
  };

  // Preset context menu handlers
  const handlePresetContextMenu = (e: React.MouseEvent, idx: number) => {
    e.preventDefault(); e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, idx });
  };
  const startEditPreset = (idx: number) => {
    setCtxMenu(null);
    setEditingPreset({ idx, label: presets[idx].label, cmd: presets[idx].cmd });
  };
  const handleDeletePreset = (idx: number) => {
    setCtxMenu(null);
    setPresets(prev => {
      const next = prev.filter((_, i) => i !== idx);
      saveJson(LS_PRESETS, next);
      return next;
    });
    setPresetColors(prev => {
      const next: Record<number, string> = {};
      for (const [key, color] of Object.entries(prev)) {
        const oldIdx = Number(key);
        if (oldIdx < idx) next[oldIdx] = color;
        else if (oldIdx > idx) next[oldIdx - 1] = color;
      }
      saveJson(LS_PRESET_COLORS, next);
      return next;
    });
  };
  const setPresetColor = (idx: number, color: string) => {
    setCtxMenu(null);
    setPresetColors(prev => { const next = { ...prev, [idx]: color }; saveJson(LS_PRESET_COLORS, next); return next; });
  };

  const COLORS = ['#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899'];

  const handlePresetClick = (cmd: string, label: string, warn?: boolean, color?: string, fromSubmenu?: boolean) => {
    const risky = isRiskyPreset(warn, color);
    if (fromSubmenu) {
      setShowAdbSubmenu(false);
      requestAdbExecution(cmd, label, risky);
    } else {
      setAdbCommand(cmd);
      setAdbPresetContext({ label, risky });
    }
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedPresetIdx(idx);
    e.dataTransfer.setData('text/plain', '');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedPresetIdx === null || draggedPresetIdx === idx) return;
    e.dataTransfer.dropEffect = 'move';
    if (dragOverPresetIdx !== idx) setDragOverPresetIdx(idx);
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedPresetIdx === null || draggedPresetIdx === idx) {
      setDraggedPresetIdx(null);
      setDragOverPresetIdx(null);
      return;
    }
    const from = draggedPresetIdx;
    const to = idx;
    
    setPresets(prev => {
      const next = [...prev];
      const item = next.splice(from, 1)[0];
      next.splice(to, 0, item);
      saveJson(LS_PRESETS, next);
      return next;
    });
    
    setPresetColors(prev => {
      const nextColors: Record<number, string> = {};
      const idxArray = Array.from({ length: presets.length }, (_, i) => i);
      const movedIdx = idxArray.splice(from, 1)[0];
      idxArray.splice(to, 0, movedIdx);
      
      idxArray.forEach((oldI, newI) => {
        if (prev[oldI]) nextColors[newI] = prev[oldI];
      });
      saveJson(LS_PRESET_COLORS, nextColors);
      return nextColors;
    });
    
    setDraggedPresetIdx(null);
    setDragOverPresetIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedPresetIdx(null);
    setDragOverPresetIdx(null);
  };

  return (
    <>
          {/* 5. Chạy lệnh ADB - with hover submenu */}
          <div 
            className="vsp-adb-section" 
            ref={adbSectionRef}
            onMouseEnter={handleAdbEnter}
            onMouseLeave={handleAdbLeave}
            onMouseMove={handleAdbEnter}
            data-inspector-id="viewerSidePanel.adbButton"
            data-inspector-label="Run ADB Shell command sidebar row"
            data-inspector-component="client/src/components/ViewerAdbTools.tsx"
          >
            <div className="vsp-section-title vsp-clickable" onClick={() => setShowAdbModal(true)}>
              <Terminal size={15} /><span>{t('Chạy lệnh ADB')}</span>
            </div>
            {showAdbSubmenu && ReactDOM.createPortal(
              <div 
                ref={adbSubmenuMenuRef}
                className="vsp-adb-submenu"
                style={{ position: 'fixed', left: 0, top: 0, opacity: 0, pointerEvents: 'none', margin: 0 }}
                onMouseEnter={() => {
                  if (adbHoverTimer.current) clearTimeout(adbHoverTimer.current);
                  setShowAdbSubmenu(true);
                }}
                onMouseLeave={handleAdbLeave}
                data-inspector-id="viewerSidePanel.adbHoverSubmenu"
                data-inspector-label="ADB quick commands hover popup menu"
                data-inspector-component="client/src/components/ViewerAdbTools.tsx"
              >
                {presets.map((c, i) => (
                  <button key={i}
                    className={`vsp-adb-submenu-item${c.warn ? ' vsp-cmd-warn' : ''}`}
                    style={presetColors[i] ? { color: presetColors[i] } : undefined}
                    onClick={e => { e.stopPropagation(); handlePresetClick(c.cmd, c.label, c.warn, presetColors[i] || c.color, true); }}
                    title={c.cmd}
                  >
                    {c.label}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>

      {/* ADB Command Modal */}
      {showAdbModal && ReactDOM.createPortal(
        <div 
          className="vsp-modal-overlay vsp-modal-overlay--modeless"
          onClick={() => setShowAdbModal(false)}
          data-inspector-id="viewerSidePanel.adbModalOverlay"
          data-inspector-label="ADB command execution modal backdrop"
          data-inspector-component="client/src/components/ViewerAdbTools.tsx"
        >
          <div 
            className="vsp-modal vsp-modal--positioned"
            style={{ left: position.x, top: position.y }}
            onClick={e => e.stopPropagation()}
            data-inspector-id="viewerSidePanel.adbModal"
            data-inspector-label="ADB command execution modal card"
            data-inspector-component="client/src/components/ViewerAdbTools.tsx"
          >
            <div className="vsp-modal-header vsp-modal-header--draggable" onPointerDown={startDrag}>
              <div className="vsp-modal-title">
                <Terminal size={18} />
                <span>ADB Command</span>
                <span className="vsp-modal-device-label">Device:</span>
                <span
                  className="vsp-modal-udid vsp-modal-udid--copyable"
                  title={t('Click để copy số seri')}
                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(udid); }}
                >{udid}</span>
              </div>
              <button className="vsp-modal-close" onClick={() => setShowAdbModal(false)}><X size={16} /></button>
            </div>
            <div className="vsp-modal-input-row vsp-modal-input-row--top">
              <textarea
                ref={textareaRef}
                className="vsp-modal-input"
                placeholder={t('Nhập lệnh ADB (VD: pm list packages -3)')}
                value={adbCommand}
                onChange={e => setAdbCommand(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdbSubmit(); } }}
                autoFocus
                data-inspector-id="viewerSidePanel.adbModalInput"
                data-inspector-label="ADB command text field input"
                data-inspector-component="client/src/components/ViewerAdbTools.tsx"
                rows={1}
              />
              <button
                className="vsp-btn vsp-btn-primary"
                onClick={handleAdbSubmit}
                disabled={adbRunning || !adbCommand.trim()}
                data-inspector-id="viewerSidePanel.adbModalExecuteButton"
                data-inspector-label="Execute command button"
                data-inspector-component="client/src/components/ViewerAdbTools.tsx"
              >
                <Play size={14} />{t('Thực hiện')}
              </button>
              <button className={`vsp-btn ${adbTab === 'history' ? 'vsp-btn-primary' : ''}`} onClick={() => setAdbTab(adbTab === 'history' ? 'preset' : 'history')}>
                <Clock size={13} />{t('Lịch sử')}
              </button>
              <button className={`vsp-btn ${adbTab === 'custom' ? 'vsp-btn-primary' : ''}`} onClick={() => setAdbTab(adbTab === 'custom' ? 'preset' : 'custom')}>
                <Plus size={13} />{t('Thêm lệnh')}
              </button>
            </div>

            {/* Lịch sử / Thêm lệnh - hiển thị phía trên khu vực 2 cột khi được bật */}
            {adbTab === 'history' && (
              <div className="vsp-modal-tab-content">
                <div className="vsp-cmd-list">
                  {cmdHistory.length === 0 && <div className="vsp-empty">{t('Chưa có lịch sử')}</div>}
                  {cmdHistory.map((cmd, i) => (
                    <button key={i} className="vsp-cmd-history-item" onClick={() => { setAdbCommand(cmd); setAdbPresetContext(getPresetExecutionContext(cmd)); }} onDoubleClick={() => {
                      const context = getPresetExecutionContext(cmd);
                      requestAdbExecution(cmd, context?.label || cmd, context?.risky || false);
                    }}>
                      <Clock size={13} /><span>{cmd}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {adbTab === 'custom' && (
              <div className="vsp-modal-tab-content">
                <div className="vsp-cmd-custom">
                  <div className="vsp-cmd-add-row">
                    <input className="vsp-input" placeholder={t('Tên')} value={newCmdLabel} onChange={e => setNewCmdLabel(e.target.value)} />
                    <input className="vsp-input vsp-input-grow" placeholder={t('Lệnh ADB')} value={newCmdValue} onChange={e => setNewCmdValue(e.target.value)} />
                    <button className="vsp-btn vsp-btn-primary" onClick={handleSaveCustomCmd}><Save size={14} /></button>
                  </div>
                </div>
              </div>
            )}

            {/* 2-column body: command list left + log right */}
            <div className="vsp-modal-2col">
              {/* Left column – Danh sách ADB */}
              <div className="vsp-modal-2col-left">
                <div className="vsp-modal-col-header">{t('Danh sách ADB')}</div>
                <div className="vsp-modal-cmd-list">
                  {presets.map((c, i) => (
                    <div
                      key={i}
                      draggable
                      className={`vsp-cmd-text-item${c.warn ? ' vsp-cmd-warn' : ''}${dragOverPresetIdx === i ? ' drag-over' : ''}${draggedPresetIdx === i ? ' dragging' : ''}`}
                      style={{
                        color: presetColors[i] || undefined,
                        borderTop: dragOverPresetIdx === i && draggedPresetIdx !== null && draggedPresetIdx > i ? '2px solid var(--md-info)' : '2px solid transparent',
                        borderBottom: dragOverPresetIdx === i && draggedPresetIdx !== null && draggedPresetIdx < i ? '2px solid var(--md-info)' : '2px solid transparent',
                        opacity: draggedPresetIdx === i ? 0.4 : 1
                      }}
                      onClick={() => handlePresetClick(c.cmd, c.label, c.warn, presetColors[i] || c.color)}
                      onContextMenu={e => handlePresetContextMenu(e, i)}
                      onDragStart={e => handleDragStart(e, i)}
                      onDragOver={e => handleDragOver(e, i)}
                      onDrop={e => handleDrop(e, i)}
                      onDragEnd={handleDragEnd}
                      title={c.cmd}
                    >
                      {c.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column – Nhật ký thực hiện */}
              <div className="vsp-modal-2col-right">
                <div className="vsp-modal-col-header">
                  <span>{t('Nhật ký thực hiện')}</span>
                  <div className="vsp-modal-col-actions">
                    <button 
                      className="vsp-btn" 
                      onClick={() => {
                        const logText = adbLogs.map(log => `[${log.time}] $ ${log.command}\n${log.output}`).join('\n\n');
                        navigator.clipboard.writeText(logText);
                      }}
                      disabled={adbLogs.length === 0}
                      data-inspector-id="viewerSidePanel.adbModalCopyLogButton"
                      data-inspector-label="Copy ADB execution logs button"
                      data-inspector-component="client/src/components/ViewerAdbTools.tsx"
                    >
                      <Copy size={13} />{t('Copy log')}
                    </button>
                    <button 
                      className="vsp-btn" 
                      onClick={() => setAdbLogs([])}
                      disabled={adbLogs.length === 0}
                      data-inspector-id="viewerSidePanel.adbModalClearLogButton"
                      data-inspector-label="Clear ADB execution logs button"
                      data-inspector-component="client/src/components/ViewerAdbTools.tsx"
                    >
                      <Trash2 size={13} />{t('Clear')}
                    </button>
                  </div>
                </div>
                <div className="vsp-modal-log">
                  {adbLogs.length === 0 ? (
                    <div className="vsp-empty">{t('Chưa có lệnh nào được thực hiện')}</div>
                  ) : (
                    adbLogs.map(log => (
                      <div key={log.id} className={`vsp-log-entry ${log.success ? 'ok' : 'err'}`}>
                        <div className="vsp-log-head">
                          <span className="vsp-log-time">[{log.time}]</span>
                          <span className="vsp-log-cmd">$ {log.command}</span>
                        </div>
                        <pre className="vsp-log-output">
                          {log.output}
                        </pre>
                      </div>
                    ))
                  )}

                </div>
                {adbRunning && <div className="vsp-modal-running"><div className="vsp-spinner-small" /><span>{t('Đang thực hiện...')}</span></div>}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Preset right-click context menu - portal to body for correct positioning */}
      {ctxMenu && ReactDOM.createPortal(
        <div 
          className="vsp-ctx-menu" 
          style={{ left: ctxMenu.x, top: ctxMenu.y }} 
          onClick={e => e.stopPropagation()}
          data-inspector-id="viewerSidePanel.contextMenu"
          data-inspector-label="ADB preset commands styling/edit context menu"
          data-inspector-component="client/src/components/ViewerAdbTools.tsx"
        >
          <button className="vsp-ctx-item" onClick={() => startEditPreset(ctxMenu.idx)}>
            <Terminal size={13} />{t('Tuỳ chỉnh lệnh (Edit)')}
          </button>
          <button className="vsp-ctx-item vsp-ctx-item--danger" onClick={() => handleDeletePreset(ctxMenu.idx)}>
            <Trash2 size={13} />{t('Xoá lệnh (Delete)')}
          </button>
          <div className="vsp-ctx-divider" />
          <div className="vsp-ctx-label"><Palette size={12} />{t('Màu chữ')}</div>
          <div className="vsp-ctx-colors">
            {COLORS.map(c => (
              <button key={c} className="vsp-ctx-color-dot" style={{ background: c }}
                onClick={() => setPresetColor(ctxMenu.idx, c)} />
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* Edit preset modal */}
      {editingPreset && ReactDOM.createPortal(
        <div className="vsp-modal-overlay" onClick={() => setEditingPreset(null)}>
          <div className="vsp-modal vsp-modal--compact" onClick={e => e.stopPropagation()}>
            <div className="vsp-modal-header">
              <div className="vsp-modal-title"><Terminal size={16} /><span>{t('Tuỳ chỉnh lệnh')}</span></div>
              <button className="vsp-modal-close" onClick={() => setEditingPreset(null)}><X size={16} /></button>
            </div>
            <div className="vsp-modal-edit-body">
              <div className="vsp-label">{t('Tên lệnh')}</div>
              <input className="vsp-input" value={editingPreset.label} onChange={e => setEditingPreset(p => p ? { ...p, label: e.target.value } : p)} />
              <div className="vsp-label">{t('Lệnh ADB')}</div>
              <input className="vsp-modal-input" value={editingPreset.cmd} onChange={e => setEditingPreset(p => p ? { ...p, cmd: e.target.value } : p)} />
              <button className="vsp-btn vsp-btn-primary vsp-btn-full" onClick={() => {
                if (editingPreset.cmd.trim()) {
                  const cmd = editingPreset.cmd.trim();
                  const label = editingPreset.label.trim();
                  const preset = presets[editingPreset.idx];
                  setPresets(prev => {
                    const next = [...prev];
                    next[editingPreset.idx] = {
                      ...next[editingPreset.idx],
                      label,
                      cmd,
                    };
                    saveJson(LS_PRESETS, next);
                    return next;
                  });
                  requestAdbExecution(cmd, label, isRiskyPreset(preset.warn, presetColors[editingPreset.idx] || preset.color));
                }
                setEditingPreset(null);
              }}><Play size={14} />{t('Thực hiện')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {confirmCmd && ReactDOM.createPortal(
        <div className="confirmOverlay confirmOverlay--top">
          <div className="confirmPanel confirmPanel--compact">
            <div className="confirmTitle">{t('Xác nhận lệnh rủi ro')}</div>
            <div className="confirmText">
              {t('Bạn có chắc muốn thực hiện lệnh')} <strong className="modalWarnTitle">{confirmCmd.label}</strong> {t('không?')}
            </div>
            <div className="confirmActions">
              <button className="modalBtn" onClick={() => setConfirmCmd(null)}>{t('Hủy')}</button>
              <button className="modalBtnPrimary modalBtnDanger" onClick={() => {
                executeAdbCommand(confirmCmd.cmd);
                setConfirmCmd(null);
              }}>{t('Thực hiện')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
