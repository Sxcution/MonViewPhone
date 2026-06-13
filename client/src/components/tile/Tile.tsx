import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useActive } from '@/context/ActiveContext';
import type { StreamConfig } from '@/lib/config';
import { useI18n } from '@/context/I18nContext';
import { useServer } from '@/context/ServerContext';

import type { StreamReloadOptions, TileProps } from './types';
import { TileHeader } from './TileHeader';
import { useTileStream } from './useTileStream';
import { AlertTriangle, Info, MousePointer2, XCircle, Bell } from 'lucide-react';
import { DeviceAccountPanel } from '@/components/DeviceAccountOverlay';

/**
 * Device tile.
 *
 * This file keeps all behavior/logic identical to the original monolithic
 * src/components/Tile.tsx, but splits UI pieces and the streaming pipeline
 * into smaller modules with comments so it's easier to maintain.
 */
function TileComponent({
    udid,
    deviceParam,
    wsServer,
    streamConfig,
    order,
    isViewing = false,
    selected = false,
    showTileInfo = true,
    isDisconnected = false,
    visualAlertActive = false,
    onClearVisualAlert,
    onRegisterReload,
    onUnregisterReload,
    onViewDevice,
    onMove,
    onChangeOrderNumber,
    onDragStart,
    onDragEnd,
    showAccountOverlay = false,
    orderMap,
    accountData,
    isFilteredOut = false,
    nearbyAutoOpenEnabled = false,
    highlightFilterMatched = false,
    onOpenDeviceViewer,
}: TileProps) {
    const { t } = useI18n();
    const [accountOverlayMounted, setAccountOverlayMounted] = useState(false);
    const [tileTab, setTileTab] = useState<string>('wechat');
    const [alwaysShowHeader, setAlwaysShowHeader] = useState(() => localStorage.getItem('monviewphone:dav-always-show-header') === 'true');
    const [headerHideOrder, setHeaderHideOrder] = useState(() => localStorage.getItem('monviewphone:dav-header-hide-order') === 'true');
    const [headerMinimalBg, setHeaderMinimalBg] = useState(() => localStorage.getItem('monviewphone:dav-header-minimal-bg') === 'true');

    useEffect(() => {
        if (accountData?.defaultPlatform) {
            setTileTab(accountData.defaultPlatform);
        }
    }, [accountData?.defaultPlatform]);

    useEffect(() => {
        const handleSettingsUpdate = () => {
            setAlwaysShowHeader(localStorage.getItem('monviewphone:dav-always-show-header') === 'true');
            setHeaderHideOrder(localStorage.getItem('monviewphone:dav-header-hide-order') === 'true');
            setHeaderMinimalBg(localStorage.getItem('monviewphone:dav-header-minimal-bg') === 'true');
        };
        window.addEventListener('monviewphone:dav-hide-settings-changed', handleSettingsUpdate);
        return () => window.removeEventListener('monviewphone:dav-hide-settings-changed', handleSettingsUpdate);
    }, []);

    useEffect(() => {
        let timeoutId: number | undefined;
        if (showAccountOverlay || alwaysShowHeader) {
            setAccountOverlayMounted(true);
        } else {
            // Warm cache: giữ mounted thêm 5 giây trước khi unmount
            timeoutId = window.setTimeout(() => {
                setAccountOverlayMounted(false);
            }, 5000);
        }
        return () => {
            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [showAccountOverlay, alwaysShowHeader]);
    const {
        activeUdid,
        registerDevice,
        unregisterDevice,
        selectOnly,
        getInputTargetsForSource,
        syncAll,
        syncMain,
        syncTargets,
        setSyncMain,
        toggleSyncTarget,
        setAltSoloUdid,
        getIsAltHeld,   // <-- thay isAltHeld bằng getIsAltHeld
        clickDevice,
    } = useActive();
    const { androidDeviceMap } = useServer();

    const isActive = activeUdid === udid;
    const connectionLabel = useMemo(() => {
        const meta = androidDeviceMap[udid];
        const ifaceNames = meta?.interfaces?.map((i) => i.name.toLowerCase()) || [];
        const hasWifiIface = ifaceNames.some((n) => n.includes('wlan') || n.includes('wifi') || n.includes('wl'));
        const hasUsbIface = ifaceNames.some((n) => n.includes('usb') || n.includes('rndis'));
        if (hasWifiIface) return 'WIFI';
        if (hasUsbIface) return 'USB';
        if (udid.includes(':')) return 'WIFI';
        return 'USB';
    }, [androidDeviceMap, udid]);
    const modelName = useMemo(() => {
        const meta = androidDeviceMap[udid];
        return meta ? [meta.manufacturer, meta['ro.product.model']].filter(Boolean).join(' ') : '';
    }, [androidDeviceMap, udid]);
    const isSyncMain = syncAll && syncMain === udid;
    const isSyncFollower = syncAll && syncTargets.includes(udid);
    const syncRole = isSyncMain ? 'main' : isSyncFollower ? 'follower' : null;
    const buildHashUrl = useCallback(
        (action: 'shell' | 'list-files') => {
            const u = new URL(window.location.href);
            if (action === 'shell') {
                u.hash = `!action=shell&udid=${encodeURIComponent(udid)}`;
            } else {
                u.hash = `!action=list-files&udid=${encodeURIComponent(udid)}&path=${encodeURIComponent('/data/local/tmp/')}`;
            }
            return u.toString();
        },
        [udid],
    );
    const buildSingleViewUrl = useCallback(() => {
        const u = new URL(window.location.href);
        u.searchParams.set('device', udid);
        u.hash = '';
        return u.toString();
    }, [udid]);

    // ===== DOM + runtime refs =====
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const bodyRef = useRef<HTMLDivElement | null>(null);
    const frameRef = useRef<HTMLDivElement | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<number | null>(null);
    const detachControlsRef = useRef<(() => void) | null>(null);
    const closingRef = useRef(false);
    const destroyedRef = useRef(false);

    // ===== UI state =====
    const [status, setStatus] = useState(t('Khởi tạo…'));
    const [loading, setLoading] = useState(true);
    const [videoAspect, setVideoAspect] = useState<number>(9 / 16);

    // Expose a per-tile reload handler to the UI (header/menu buttons)
    // and to parent App ("reload all tiles").
    const reloadRef = useRef<((opts?: StreamReloadOptions) => void) | null>(null);

    // Keep latest streamConfig in a ref so ws.onopen/reload always send newest config
    // without forcing the heavy streaming effect to re-run on every slider tick.
    const streamCfgRef = useRef<StreamConfig>(streamConfig);
    useEffect(() => {
        streamCfgRef.current = streamConfig;
    }, [streamConfig]);

    // Register a stable reload wrapper with the parent (App) so it can "reload all tiles".
    useEffect(() => {
        if (!onRegisterReload) return;
        const wrapper = (opts?: { silent?: boolean }) => {
            try {
                reloadRef.current?.(opts);
            } catch {
                // ignore
            }
        };
        onRegisterReload(udid, wrapper);
        return () => onUnregisterReload?.(udid);
    }, [udid, onRegisterReload, onUnregisterReload]);

    // Register this tile into ActiveContext so other tiles can broadcast inputs to it.
    const getWs = useMemo(() => () => wsRef.current, []);
    const getCanvas = useMemo(() => () => canvasRef.current, []);
    useEffect(() => {
        registerDevice({ udid, getWs, getCanvas });
        return () => unregisterDevice(udid);
    }, [udid, getWs, getCanvas, registerDevice, unregisterDevice]);

    // ===== Streaming pipeline (WS + workers + canvas fit + touch controls) =====
    useTileStream({
        enabled: !isDisconnected,
        udid,
        deviceParam,
        wsServer,
        canvasRef,
        bodyRef,
        frameRef,
        wsRef,
        reconnectTimerRef,
        detachControlsRef,
        closingRef,
        destroyedRef,
        streamCfgRef,
        selectOnly,
        getInputTargetsForSource,
        setAltSoloUdid,
        getIsAltHeld,
        setStatus,
        setLoading,
        reloadRef,
        onVideoDims: (w, h) => {
            if (!w || !h) return;
            setVideoAspect(w / h);
        },
        suppressLoadingOverlay: isViewing,
    });

    // Lắng nghe sự kiện nhả phím Alt (KeyUp) để khôi phục focus về máy Main
    useEffect(() => {
        // Chỉ máy Main mới cần lắng nghe để tự đoạt lại focus, tránh gọi hàm trùng lặp ở các máy Follower
        if (!isSyncMain) return;

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Alt') {
                selectOnly(udid); // udid ở đây chính là máy Main
                canvasRef.current?.focus?.();
            }
        };

        window.addEventListener('keyup', handleKeyUp);
        return () => window.removeEventListener('keyup', handleKeyUp);
    }, [isSyncMain, selectOnly, udid]);

    const screenshotThisCanvas = useCallback(() => {
        const c = canvasRef.current;
        if (!c) return;
        try {
            const a = document.createElement('a');
            a.download = `${udid}_${Date.now()}.png`;
            a.href = c.toDataURL('image/png');
            a.click();
        } catch (e) {
            console.warn('screenshot failed', e);
        }
    }, [udid]);

    // ===== Header click behavior (single active on click) =====
    const onHeaderClick = useCallback(
        (e: React.MouseEvent) => {
            selectOnly(udid);
            clickDevice(udid);
            canvasRef.current?.focus?.();
        },
        [selectOnly, clickDevice, udid],
    );

    // When user triggers any tile-specific action, keep focus on this tile.
    const focusThisTile = useCallback(() => {
        selectOnly(udid);
        clickDevice(udid);
    }, [selectOnly, clickDevice, udid]);

    const onPointerEnter = useCallback(() => {
        if (isDisconnected || isViewing) return;
        selectOnly(udid);
        canvasRef.current?.focus?.({ preventScroll: true });
    }, [isDisconnected, isViewing, selectOnly, udid]);

    const onPointerLeave = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        // Khi chuột rời khỏi máy này, nếu đang bật đồng bộ thì lập tức trả focus về máy Main
        // Việc này ngăn ngừa kẹt trạng thái focus ở máy Follower khi rê chuột ra ngoài grid
        if (syncAll && syncMain) {
            selectOnly(syncMain);
        } else {
            selectOnly(null);
        }
    }, [syncAll, syncMain, selectOnly]);

    const highlightClass = highlightFilterMatched
        ? typeof highlightFilterMatched === 'string'
            ? ` is-filter-matched-${highlightFilterMatched}`
            : ' is-filter-matched-yellow'
        : '';
    const tileClass = `tile${isActive ? ' active' : ''}${selected ? ' selected' : ''}${isSyncMain ? ' sync-main' : ''
        }${isSyncFollower ? ' sync-follower' : ''}${isViewing ? ' viewing' : ''}${highlightClass}`;

    const viewingLabel = t('Đang điều khiển');
    const viewingHint = t('Thiết bị đang mở trong viewer — tránh điều khiển trùng lặp');

    const statusTrimmed = (status || '').trim();
    const statusTone = statusTrimmed.startsWith('❌')
        ? 'error'
        : statusTrimmed.startsWith('⚠️')
            ? 'warn'
            : 'info';
    const statusIcon =
        statusTone === 'error' ? (
            <XCircle size={38} strokeWidth={2} />
        ) : statusTone === 'warn' ? (
            <AlertTriangle size={38} strokeWidth={2} />
        ) : (
            <Info size={38} strokeWidth={2} />
        );

    const videoFrame = (
        <div
            className="tileVideoFrame"
            ref={frameRef}
            style={{ cursor: 'pointer' }}
            aria-hidden={isViewing}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'fill',
                    display: 'block',
                    position: 'relative',
                    touchAction: 'none',
                }}
                tabIndex={0}
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Ctrl + Click phải = phóng to device (mở DeviceViewer)
                    if (e.ctrlKey && onViewDevice) {
                        selectOnly(udid);
                        clickDevice(udid);
                        onViewDevice(udid);
                    }
                }}
                onPointerDown={(e) => {
                    // Click/pointer down on video frame registers this device selection
                    if (e.button === 0) {
                        clickDevice(udid);
                    }
                }}
            />
        </div>
    );

    return (
        <div
            className={tileClass}
            data-udid={udid}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            onMouseDown={(e) => {
                if (e.button === 1) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onViewDevice) {
                        onViewDevice(udid);
                    }
                }
            }}
        >
            {showTileInfo ? (
                <TileHeader
                    udid={udid}
                    wsServer={wsServer}
                    order={order}
                    status={status}
                    syncRole={syncRole}
                    connectionLabel={connectionLabel}
                    onHeaderClick={onHeaderClick}
                    onReloadClick={(e) => {
                        e.stopPropagation();
                        focusThisTile();
                        reloadRef.current?.({ restart: true });
                    }}
                    onViewClick={() => {
                        if (onViewDevice) onViewDevice(udid);
                    }}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onMove={onMove}
                    onChangeOrderNumber={onChangeOrderNumber}
                />
            ) : null}

            <div className="tileBody" ref={bodyRef}>
                {isDisconnected && !showAccountOverlay ? (
                    <div className="tileDisconnectedOverlay">
                        <div className="tileDisconnectedIcon" aria-hidden="true">
                            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="1.8" />
                            </svg>
                        </div>
                        <div className="tileDisconnectedText">Điện thoại đã ngắt kết nối</div>
                    </div>
                ) : (
                    <>
                        {!isViewing && loading && !showAccountOverlay ? (
                            <div className="loading">
                                <div className="spinner"></div>
                            </div>
                        ) : null}

                        {videoFrame}

                        {accountOverlayMounted && (
                            <div 
                                className={`tile-account-overlay ${showAccountOverlay ? 'is-open' : (alwaysShowHeader ? 'is-header-only' : 'is-hidden')} ${isFilteredOut ? 'mxh-filtered-out' : ''} ${alwaysShowHeader && !showAccountOverlay && headerHideOrder ? 'header-hide-order' : ''} ${alwaysShowHeader && !showAccountOverlay && headerMinimalBg ? 'header-minimal-bg' : ''}`} 
                                onMouseDown={e => e.stopPropagation()}
                            >
                                {isFilteredOut && showAccountOverlay && (
                                    <div className="mxh-filter-overlay">
                                        <div className="mxh-filter-overlay-inner">
                                            <div className="mxh-filter-x">×</div>
                                            <div className="mxh-filter-none">None</div>
                                        </div>
                                    </div>
                                )}
                                {accountData && (
                                    <div className="tile-account-inner" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <DeviceAccountPanel
                                            udid={udid}
                                            order={order ?? 0}
                                            model={modelName}
                                            isOnline={!isDisconnected}
                                            orderMap={orderMap || new Map()}
                                            initialData={accountData}
                                            activeTab={tileTab}
                                            setActiveTab={setTileTab}
                                            nearbyAutoOpenEnabled={nearbyAutoOpenEnabled}
                                            onOpenDeviceViewer={onOpenDeviceViewer}
                                            showAccountOverlay={showAccountOverlay}
                                            alwaysShowHeader={alwaysShowHeader}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {visualAlertActive ? (
                            <div 
                                className="tileVisualAlertBadge" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClearVisualAlert?.(udid);
                                }}
                            >
                                <Bell size={14} className="visualAlertBadgeIcon" />
                                <span>Thông Báo Mới</span>
                            </div>
                        ) : null}

                        {isViewing ? (
                            <div className="tileViewingOverlay">
                                <div className="tileViewingIcon" aria-hidden="true">
                                    <MousePointer2 size={44} strokeWidth={1.8} />
                                </div>
                                <div className="tileViewingTitle">{viewingLabel}</div>
                            </div>
                        ) : statusTrimmed ? (
                            <div className={`tileStatusOverlay ${statusTone}`}>
                                <div className="tileStatusIcon" aria-hidden="true">
                                    {statusIcon}
                                </div>
                                <div className="tileStatusText">{statusTrimmed}</div>
                            </div>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
}
export const Tile = memo(TileComponent);
