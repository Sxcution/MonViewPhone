import { useEffect, useRef, type MutableRefObject } from 'react';
import { attachTouchControls } from '@/lib/touchControls';
import { AnnexBSplitter, buildConfigBinary, makeWsUrl } from '@/lib/video';
import { useI18n } from '@/context/I18nContext';
import type { StreamConfig } from '@/lib/config';
import type { InputTarget } from '@/context/ActiveContext';
import type { StreamReloadOptions } from './types';

type Args = {
    udid: string;
    deviceParam: string | null;
    streamUdid?: string;
    controlUdid?: string;
    wsServer: string;
    enabled?: boolean;
    suppressLoadingOverlay?: boolean;

    // DOM refs
    canvasRef: MutableRefObject<HTMLCanvasElement | null>;
    bodyRef: MutableRefObject<HTMLDivElement | null>;
    frameRef: MutableRefObject<HTMLDivElement | null>;

    // WS + teardown refs
    wsRef: MutableRefObject<WebSocket | null>;
    reconnectTimerRef: MutableRefObject<number | null>;
    detachControlsRef: MutableRefObject<(() => void) | null>;
    closingRef: MutableRefObject<boolean>;
    destroyedRef: MutableRefObject<boolean>;

    // Keep latest config without re-running the heavy stream effect on every tick
    streamCfgRef: MutableRefObject<StreamConfig>;

    // Active/sync callbacks from ActiveContext
    selectOnly: (udid: string) => void;
    getInputTargetsForSource: (udid: string) => InputTarget[];
    setAltSoloUdid?: (udid: string | null) => void;
    getIsAltHeld?: () => boolean;

    // UI state setters
    setStatus: (s: string) => void;
    setLoading: (b: boolean) => void;

    // Exposed reload ref (used by header/menu + parent App for reload-all)
    reloadRef: MutableRefObject<((opts?: StreamReloadOptions) => void) | null>;

    // Notify caller about current video dimensions (per-tile aspect ratio)
    onVideoDims?: (w: number, h: number) => void;
};

const STREAM_CONNECT_BATCH_SIZE = 6;
const STREAM_CONNECT_BATCH_DELAY_MS = 1000;
const INITIAL_FRAME_TIMEOUT_MS = 35_000;
const MAX_INITIAL_FRAME_RESTARTS = 3;
const RECONNECT_DELAY_MS = 1200;
const SCRCPY_RESTARTING_STATUS = 'ADB online but scrcpy WS not responding - restarting server on device...';
const SCRCPY_FAILED_STATUS = 'ADB online but scrcpy WS not responding after retries';

type StreamSessionState = 'queued' | 'connecting' | 'connected';

type StreamSession = {
    owner: symbol;
    state: StreamSessionState;
    ws?: WebSocket;
};

type QueuedConnect = {
    udid: string;
    owner: symbol;
    cancelled: boolean;
    run: () => void;
};

const activeStreamSessions = new Map<string, StreamSession>();
const connectQueue: QueuedConnect[] = [];
let connectQueueTimer: number | null = null;

function flushConnectQueue() {
    connectQueueTimer = null;
    let started = 0;
    while (connectQueue.length && started < STREAM_CONNECT_BATCH_SIZE) {
        const item = connectQueue.shift();
        if (!item || item.cancelled) continue;
        started++;
        item.run();
    }
    if (connectQueue.some(item => !item.cancelled)) {
        connectQueueTimer = window.setTimeout(flushConnectQueue, STREAM_CONNECT_BATCH_DELAY_MS);
    } else {
        connectQueue.length = 0;
    }
}

function scheduleBatchedConnect(udid: string, owner: symbol, run: () => void): () => void {
    const item: QueuedConnect = { udid, owner, cancelled: false, run };
    connectQueue.push(item);
    if (connectQueueTimer == null) {
        connectQueueTimer = window.setTimeout(flushConnectQueue, 0);
    }
    return () => {
        item.cancelled = true;
        const session = activeStreamSessions.get(udid);
        if (session?.owner === owner && session.state === 'queued') {
            activeStreamSessions.delete(udid);
        }
    };
}

function claimStreamSession(udid: string, owner: symbol, state: StreamSessionState): boolean {
    const existing = activeStreamSessions.get(udid);
    if (existing && existing.owner !== owner) {
        return false;
    }
    activeStreamSessions.set(udid, { owner, state });
    return true;
}

function updateStreamSession(udid: string, owner: symbol, state: StreamSessionState, ws?: WebSocket) {
    const existing = activeStreamSessions.get(udid);
    if (existing && existing.owner !== owner) return;
    activeStreamSessions.set(udid, { owner, state, ws });
}

function releaseStreamSession(udid: string, owner: symbol, ws?: WebSocket) {
    const existing = activeStreamSessions.get(udid);
    if (!existing || existing.owner !== owner) return;
    if (ws && existing.ws && existing.ws !== ws) return;
    activeStreamSessions.delete(udid);
}

/**
 * Handles the *streaming pipeline* for a tile:
 * - WebSocket connect/reconnect
 * - tinyh264 decode worker
 * - YUV->ImageBitmap render worker
 * - canvas fit (ResizeObserver + viewport listeners)
 * - touch controls attachment
 *
 * Logic is moved from the original monolithic Tile.tsx WITHOUT changing behavior.
 */
export function useTileStream(args: Args) {
    const {
        udid,
        deviceParam,
        streamUdid,
        controlUdid,
        wsServer,
        enabled = true,
        suppressLoadingOverlay = false,
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
        onVideoDims,
    } = args;
    const logicalUdid = controlUdid || udid;
    const streamEndpointUdid = streamUdid || deviceParam || udid;
    const streamDeviceParam = streamUdid || deviceParam;
    const streamSessionKey = streamEndpointUdid;
    const { t } = useI18n();
    const tRef = useRef(t);
    const ownerRef = useRef<symbol | null>(null);
    if (ownerRef.current == null) {
        ownerRef.current = Symbol(logicalUdid);
    }
    useEffect(() => {
        tRef.current = t;
    }, [t]);

    // Keep latest targets getter in a ref so touch controls always see newest sync state.
    const getInputTargetsRef = useRef(getInputTargetsForSource);
    useEffect(() => {
        getInputTargetsRef.current = getInputTargetsForSource;
    }, [getInputTargetsForSource]);

    // Keep ref cho getIsAltHeld và setAltSoloUdid để tránh stale closure
    const getIsAltHeldRef = useRef(getIsAltHeld);
    useEffect(() => {
        getIsAltHeldRef.current = getIsAltHeld;
    }, [getIsAltHeld]);

    const setAltSoloUdidRef = useRef(setAltSoloUdid);
    useEffect(() => {
        setAltSoloUdidRef.current = setAltSoloUdid;
    }, [setAltSoloUdid]);

    const suppressLoadingOverlayRef = useRef(suppressLoadingOverlay);
    useEffect(() => {
        suppressLoadingOverlayRef.current = suppressLoadingOverlay;
    }, [suppressLoadingOverlay]);

    const silentReconnectRef = useRef(false);
    const isSilent = () => suppressLoadingOverlayRef.current || silentReconnectRef.current;

    useEffect(() => {
        const owner = ownerRef.current!;
        destroyedRef.current = false;
        closingRef.current = false;
        if (!enabled) {
            setLoading(false);
            setStatus(tRef.current('Mất Kết Nối'));
            reloadRef.current = null;
            return () => {
                destroyedRef.current = true;
                closingRef.current = true;
            };
        }

        const canvas = canvasRef.current;
        const body = frameRef.current || bodyRef.current;
        if (!canvas || !body) return;

        // NOTE: bitmaprenderer is faster but has been observed to render "white tiles" on some GPUs after
        // mid-stream resolution/orientation changes. Use 2D context for stability.
        const bitmapCtx: ImageBitmapRenderingContext | null = null;
        const ctx2d = canvas.getContext("2d", { alpha: false }) as CanvasRenderingContext2D | null;

        function fitCanvasToBody() {
            if (!body || !canvas) return;

            const rect = body.getBoundingClientRect();
            const bw = rect.width;
            const bh = rect.height;

            if (!bw || !bh || !canvas.width || !canvas.height) return;

            const scale = Math.min(bw / canvas.width, bh / canvas.height);
            const dw = Math.ceil(canvas.width * scale);
            const dh = Math.ceil(canvas.height * scale);

            // Đã nhường quyền điều khiển size cho CSS (object-fit: contain)
            // canvas.style.width = `${dw}px`;
            // canvas.style.height = `${dh}px`;
        }

        const ro = new ResizeObserver(fitCanvasToBody);
        ro.observe(body);

        // Fallback for devices/browsers where ResizeObserver is missing or
        // doesn't fire reliably on orientation changes (common on older iOS WebView).
        const scheduleFit = () => {
            // Delay 1 frame to let layout settle after rotation.
            requestAnimationFrame(() => fitCanvasToBody());
        };
        window.addEventListener('resize', scheduleFit, { passive: true } as any);
        window.addEventListener('orientationchange', scheduleFit, { passive: true } as any);
        window.visualViewport?.addEventListener('resize', scheduleFit, { passive: true } as any);
        window.visualViewport?.addEventListener('scroll', scheduleFit, { passive: true } as any);

        function ensureCanvasSize(w: number, h: number) {
            if (!canvas) {
                return;
            }
            // even numbers
            w = w & ~1;
            h = h & ~1;
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
                fitCanvasToBody();
            }
            return { w, h };
        }

        function fnv1a32(u8: Uint8Array): number {
            let h = 0x811c9dc5;
            for (let i = 0; i < u8.length; i++) {
                h ^= u8[i];
                h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
            }
            return h >>> 0;
        }

        let firstFrame = false;
        let worker: Worker | null = null; // tinyh264 decoder
        let renderWorker: Worker | null = null; // YUV->ImageBitmap renderer
        let decoderReady = false;
        let renderStateId = 1;
        let splitter: AnnexBSplitter | null = null;

        // Watchdog timestamps. If decoding/rendering stalls for too long, we reconnect.
        // This prevents the "white tile until reload" symptom when a worker silently dies
        // or the WS stays open but stops delivering usable frames.
        let lastPacketAt = Date.now();
        let lastBitmapAt = 0;
        let lastVideoW = 0;
        let lastVideoH = 0;
        let lastDimRestartAt = 0;
        let lastSpsHash = 0;
        let lastPpsHash = 0;
        let lastParamRestartAt = 0;
        // Changing stream config legitimately changes dimensions/SPS/PPS.
        // Reconnecting on those successful frames causes the "Đang chờ phản hồi" loop.
        const reconnectOnStreamParamChange = false;
        let watchdogTimer: number | null = null;
        let initialLoadTimer: number | null = null;
        let queuedConnectCancel: (() => void) | null = null;
        let connectGeneration = 0;
        let initialFrameRestartAttempts = 0;
        // Render throttling: keep at most 1 in-flight render per tile, drop older frames.
        let renderBusy = false;
        let pendingFrame: { width: number; height: number; data: ArrayBuffer } | null = null;
        let frameId = 1;

        const onActivate = () => selectOnly(logicalUdid);

        const handlePointerEnter = () => {
            if (getIsAltHeldRef.current?.()) {
                setAltSoloUdidRef.current?.(logicalUdid);
            }
        };
        const handlePointerLeave = () => {
            // Khi chuột rời tile, nếu tile này đang là solo thì clear
            // Để resolveTargets biết không còn solo nữa khi chuột ra ngoài
            if (!getIsAltHeldRef.current?.()) {
                setAltSoloUdidRef.current?.(null);
            }
        };

        body.addEventListener('pointerenter', handlePointerEnter);
        body.addEventListener('pointerleave', handlePointerLeave);

        detachControlsRef.current = attachTouchControls(
            canvas,
            () => getInputTargetsRef.current(logicalUdid),
            onActivate,
            logicalUdid
        );

        function makeDecoder() {
            firstFrame = false;
            if (!isSilent()) {
                setLoading(true);
            }
            decoderReady = false;

            // Tear down previous worker if any
            if (worker) {
                try {
                    worker.postMessage({ type: 'release', renderStateId });
                } catch {
                    // ignore
                }
                try {
                    worker.terminate();
                } catch {
                    // ignore
                }
                worker = null;
            }

            const myStateId = renderStateId;

            // Create tinyh264 decoder worker (WASM inside the package)
            worker = new Worker(new URL('../../workers/device_worker.worker.ts', import.meta.url), { type: 'module' });

            // Create per-tile render worker to move YUV->RGBA + bitmap creation off the main thread.
            renderBusy = false;
            pendingFrame = null;
            frameId = 1;

            if (renderWorker) {
                try {
                    renderWorker.postMessage({ type: 'release' });
                } catch {
                    // ignore
                }
                try {
                    renderWorker.terminate();
                } catch {
                    // ignore
                }
                renderWorker = null;
            }

            renderWorker = new Worker(new URL('../../workers/yuvRender.worker.ts', import.meta.url), { type: 'module' });

            renderWorker.onerror = (e) => {
                console.error('[yuv render worker error]', udid, e);
                setStatus(tRef.current('❌ lỗi worker render YUV'));
                setLoading(true);
                // Small async hop to avoid reentrancy issues.
                window.setTimeout(() => {
                    if (!destroyedRef.current) connect({ restart: !firstFrame });
                }, 0);
            };

            renderWorker.onmessage = (event: MessageEvent) => {
                const msg: any = event.data;
                if (!msg || typeof msg.type !== 'string') return;

                if (msg.type === 'bitmap') {
                    const width: number = msg.width;
                    const height: number = msg.height;
                    const bitmap: ImageBitmap = msg.bitmap;

                    // If canvas has no size yet, set it once (for aspect ratio / CSS fit)
                    if (width && height) {
                        ensureCanvasSize(width, height);
                        fitCanvasToBody();
                        onVideoDims?.(width, height);
                    }

                    try {
                        if (bitmapCtx) {
                            bitmapCtx.transferFromImageBitmap(bitmap);
                        } else if (ctx2d) {
                            ctx2d.drawImage(bitmap, 0, 0);
                        }
                        try {
                            bitmap.close?.();
                        } catch {
                            // ignore
                        }
                    } catch (e) {
                        console.error('[present bitmap]', udid, e);
                    }

                    if (!firstFrame) {
                        if (!canvas) {
                            return;
                        }
                        firstFrame = true;
                        initialFrameRestartAttempts = 0;
                        if (initialLoadTimer != null) {
                            clearTimeout(initialLoadTimer);
                            initialLoadTimer = null;
                        }
                        setLoading(false);
                        setStatus('');
                        silentReconnectRef.current = false;
                    }

                    // Mark render as healthy.
                    lastBitmapAt = Date.now();

                    renderBusy = false;
                    if (pendingFrame && renderWorker) {
                        const f = pendingFrame;
                        pendingFrame = null;
                        renderBusy = true;
                        const id = ++frameId;
                        try {
                            renderWorker.postMessage(
                                { type: 'render', width: f.width, height: f.height, data: f.data, frameId: id },
                                [f.data],
                            );
                        } catch (e) {
                            renderBusy = false;
                            console.error('[renderWorker postMessage]', udid, e);
                        }
                    }
                    return;
                }

                if (msg.type === 'error') {
                    renderBusy = false;
                    return;
                }
            };

            worker.onmessage = (event: MessageEvent) => {
                const msg: any = event.data;
                if (!msg || typeof msg.type !== 'string') return;

                // Ignore late frames from old states
                if (typeof msg.renderStateId === 'number' && msg.renderStateId !== myStateId) return;

                if (msg.type === 'decoderReady') {
                    decoderReady = true;
                    return;
                }

                if (msg.type === 'pictureReady') {
                    const width: number = msg.width;
                    const height: number = msg.height;
                    const data: ArrayBuffer = msg.data;

                    if (!data || !width || !height || !renderWorker) return;

                    // Some devices switch resolution on rotation (portrait<->landscape).
                    // A subset of devices/decoders can get stuck (white screen) after that.
                    // When enabled, reconnect after a dimension change without forcing
                    // server-side restart.
                    if (reconnectOnStreamParamChange && firstFrame && (width !== lastVideoW || height !== lastVideoH)) {
                        const now = Date.now();
                        // Throttle: avoid loops if device toggles frequently.
                        if (now - lastDimRestartAt > 1500) {
                            lastDimRestartAt = now;
                            lastVideoW = width;
                            lastVideoH = height;
                            setStatus(tRef.current('Thay đổi xoay/kích thước - khởi động lại…'));
                            setLoading(true);
                            // reconnect (recreate workers + fresh GOP)
                            connect();
                            return;
                        }
                    }

                    // Update dims baseline
                    lastVideoW = width;
                    lastVideoH = height;

                    // Offload YUV->bitmap to render worker; keep only newest if worker is busy.
                    if (renderBusy) {
                        pendingFrame = { width, height, data };
                        return;
                    }

                    renderBusy = true;
                    const id = ++frameId;
                    try {
                        renderWorker.postMessage({ type: 'render', width, height, data, frameId: id }, [data]);
                    } catch (e) {
                        renderBusy = false;
                        console.error('[renderWorker postMessage]', udid, e);
                    }
                    return;
                }

                // Unknown message type
            };

            worker.onerror = (e) => {
                console.error('[tinyh264 worker error]', udid, e);
                setStatus(tRef.current('❌ lỗi worker tinyh264'));
                setLoading(true);
                // Same symptom as "white tile": the decoder worker crashed.
                window.setTimeout(() => {
                    if (!destroyedRef.current) connect({ restart: !firstFrame });
                }, 0);
            };

            splitter = new AnnexBSplitter((naluWithStartCode) => {
                if (!worker || !decoderReady) return;

                // Copy before transferring (splitter may hand us a view)
                const payload = new Uint8Array(naluWithStartCode);
                if (payload.length < 5) return;

                // Detect SPS/PPS changes mid-stream (common on some devices when rotating).
                // When enabled, reconnect after such changes without forcing server-side restart.
                let startLen = 0;
                if (payload[2] === 0x01) startLen = 3;
                else if (payload[2] === 0x00 && payload[3] === 0x01) startLen = 4;
                if (reconnectOnStreamParamChange && startLen) {
                    const nalType = payload[startLen] & 0x1f;
                    if (nalType === 7 || nalType === 8) {
                        const now = Date.now();
                        const h = fnv1a32(payload.subarray(startLen));
                        if (nalType === 7) {
                            if (firstFrame && lastSpsHash && h !== lastSpsHash && now - lastParamRestartAt > 1500) {
                                lastParamRestartAt = now;
                                lastSpsHash = h;
                                setStatus(tRef.current('SPS đổi - khởi động lại…'));
                                setLoading(true);
                                connect();
                                return;
                            }
                            lastSpsHash = h;
                        } else {
                            if (firstFrame && lastPpsHash && h !== lastPpsHash && now - lastParamRestartAt > 1500) {
                                lastParamRestartAt = now;
                                lastPpsHash = h;
                                setStatus(tRef.current('PPS đổi - khởi động lại…'));
                                setLoading(true);
                                connect();
                                return;
                            }
                            lastPpsHash = h;
                        }
                    }
                }

                try {
                    worker.postMessage(
                        {
                            type: "decode",
                            data: payload.buffer,
                            offset: 0,
                            length: payload.byteLength,
                            renderStateId: myStateId,
                        },
                        [payload.buffer],
                    );
                } catch (e) {
                    console.error("[decode]", udid, e);
                }
            });
        }

        function cleanupWs() {
            closingRef.current = true;
            connectGeneration++;
            if (queuedConnectCancel) {
                queuedConnectCancel();
                queuedConnectCancel = null;
            }
            const prev = wsRef.current;
            if (prev) {
                // prevent onclose from scheduling a reconnect when we intentionally close
                prev.onopen = null;
                prev.onmessage = null;
                prev.onerror = null;
                prev.onclose = null;
                try {
                    prev.close();
                } catch {
                    // ignore
                }
            }
            wsRef.current = null;
            releaseStreamSession(streamSessionKey, owner);

            // Stop decoder worker + reset stream state
            if (worker) {
                try {
                    worker.postMessage({ type: 'release', renderStateId });
                } catch {
                    // ignore
                }
                try {
                    worker.terminate();
                } catch {
                    // ignore
                }
                worker = null;
            }

            if (renderWorker) {
                try {
                    renderWorker.postMessage({ type: 'release' });
                } catch {
                    // ignore
                }
                try {
                    renderWorker.terminate();
                } catch {
                    // ignore
                }
                renderWorker = null;
            }

            decoderReady = false;
            renderStateId++;
            splitter = null;

            if (reconnectTimerRef.current != null) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }

            if (initialLoadTimer != null) {
                clearTimeout(initialLoadTimer);
                initialLoadTimer = null;
            }
        }

        function connect(opts?: { restart?: boolean; immediate?: boolean }) {
            if (!opts?.immediate) {
                cleanupWs();
                if (!claimStreamSession(streamSessionKey, owner, 'queued')) {
                    if (!isSilent()) {
                        setStatus(tRef.current('Dang co phien stream dang mo'));
                        setLoading(false);
                    }
                    return;
                }
                if (!isSilent()) {
                    setLoading(true);
                    setStatus(tRef.current('Dang doi luot ket noi...'));
                }
                const generation = ++connectGeneration;
                const restart = Boolean(opts?.restart);
                queuedConnectCancel = scheduleBatchedConnect(streamSessionKey, owner, () => {
                    queuedConnectCancel = null;
                    if (destroyedRef.current || generation !== connectGeneration) {
                        releaseStreamSession(streamSessionKey, owner);
                        return;
                    }
                    connect({ restart, immediate: true });
                });
                return;
            }

            updateStreamSession(streamSessionKey, owner, 'connecting');
            makeDecoder();

            let url: string;
            try {
                url = makeWsUrl({
                    wsServer,
                    deviceParam: streamDeviceParam,
                    udid: streamEndpointUdid,
                    restart: Boolean(opts?.restart)
                });
            } catch (err) {
                releaseStreamSession(streamSessionKey, owner);
                setStatus(tRef.current('❌ thiếu tham số thiết bị'));
                setLoading(false);
                return;
            }

            const ws = new WebSocket(url);
            ws.binaryType = 'arraybuffer';
            closingRef.current = false;
            wsRef.current = ws;
            updateStreamSession(streamSessionKey, owner, 'connecting', ws);

            if (!isSilent()) {
                setStatus(tRef.current('Đang kết nối…'));
            }

            // If we don't get the first decoded frame within 35 seconds,
            // auto-reload this tile (same device) to recover from the stuck 'loading' state.
            if (initialLoadTimer != null) {
                clearTimeout(initialLoadTimer);
                initialLoadTimer = null;
            }
            initialLoadTimer = window.setTimeout(() => {
                if (destroyedRef.current || closingRef.current) return;
                if (firstFrame) return;
                if (initialFrameRestartAttempts >= MAX_INITIAL_FRAME_RESTARTS) {
                    cleanupWs();
                    silentReconnectRef.current = false;
                    setStatus(tRef.current(SCRCPY_FAILED_STATUS));
                    setLoading(false);
                    return;
                }
                initialFrameRestartAttempts++;
                if (!isSilent()) {
                    setStatus(tRef.current(SCRCPY_RESTARTING_STATUS));
                    setLoading(true);
                }
                connect({ restart: true });
            }, INITIAL_FRAME_TIMEOUT_MS);

            ws.onopen = () => {
                updateStreamSession(streamSessionKey, owner, 'connected', ws);
                if (!isSilent()) {
                    setStatus(tRef.current('WS mở → gửi config BINARY…'));
                }
                try {
                    ws.send(buildConfigBinary(streamCfgRef.current));
                    if (!isSilent()) {
                        setStatus(tRef.current("Đang chờ phản hồi"));
                    }
                } catch (e) {
                    console.error('send binary config failed', e);
                    setStatus(tRef.current('❌ Thất bại'));
                }
            };

            ws.onmessage = async (ev) => {
                let ab: ArrayBuffer | null = null;
                if (ev.data instanceof ArrayBuffer) ab = ev.data;
                else if (ev.data instanceof Blob) ab = await ev.data.arrayBuffer();
                if (!ab) return;
                lastPacketAt = Date.now();
                splitter?.push(new Uint8Array(ab));
            };

            ws.onerror = () => setStatus(tRef.current('❌ lỗi WS'));

            ws.onclose = (e) => {
                releaseStreamSession(streamSessionKey, owner, ws);
                if (closingRef.current || destroyedRef.current) return;
                const restartBeforeFirstFrame = !firstFrame;
                if (initialLoadTimer != null) {
                    clearTimeout(initialLoadTimer);
                    initialLoadTimer = null;
                }
                // When WS closes unexpectedly, fall back to normal non-silent connection state
                silentReconnectRef.current = false;
                if (restartBeforeFirstFrame) {
                    if (initialFrameRestartAttempts >= MAX_INITIAL_FRAME_RESTARTS) {
                        cleanupWs();
                        setStatus(tRef.current(SCRCPY_FAILED_STATUS));
                        setLoading(false);
                        return;
                    }
                    initialFrameRestartAttempts++;
                    setStatus(tRef.current(SCRCPY_RESTARTING_STATUS));

                    let delay = RECONNECT_DELAY_MS;
                    if (initialFrameRestartAttempts === 1) delay = 5000;
                    else if (initialFrameRestartAttempts === 2) delay = 10000;
                    else delay = 20000;

                    setLoading(true);
                    reconnectTimerRef.current = window.setTimeout(() => {
                        if (destroyedRef.current) return;
                        connect({ restart: true });
                    }, delay);
                } else {
                    setStatus(
                        tRef.current('WS đóng ({code}{reason}) - thử lại…', {
                            code: e.code,
                            reason: e.reason ? `: ${e.reason}` : '',
                        }),
                    );
                    setLoading(true);
                    reconnectTimerRef.current = window.setTimeout(() => {
                        if (destroyedRef.current) return;
                        connect({ restart: false });
                    }, RECONNECT_DELAY_MS);
                }
            };
        }

        // Allow user to manually reload this tile (recreate workers + reconnect WS).
        reloadRef.current = (opts?: StreamReloadOptions) => {
            if (destroyedRef.current) return;
            silentReconnectRef.current = Boolean(opts?.silent);
            if (!silentReconnectRef.current) {
                setLoading(true);
                setStatus(tRef.current('Đang reload…'));
            }
            initialFrameRestartAttempts = 0;
            connect({ restart: Boolean(opts?.restart) });
        };

        connect();

        // Periodically detect "stuck" tiles: WS open but no packets or no rendered bitmaps.
        // When it happens the canvas often goes white (canvas resize clears pixels) and never recovers
        // until manual reload. This auto-recovers without user action.
        watchdogTimer = window.setInterval(() => {
            if (destroyedRef.current || closingRef.current) return;
            const ws = wsRef.current;
            if (!ws || ws.readyState !== WebSocket.OPEN) return;
            if (!firstFrame) return; // don't trigger while still connecting / before first frame

            const now = Date.now();
            const packetAge = now - lastPacketAt;
            const bitmapAge = lastBitmapAt ? now - lastBitmapAt : 1e9;

            // Only reconnect when we have evidence of a "stuck" decoder:
            // - packets still arrive, but we stop producing bitmaps
            // Avoid reconnecting just because the screen is static and no frames arrive.
            const packetsStillArriving = packetAge < 2500;
            const outputStalled = bitmapAge > 8000;
            if (packetsStillArriving && outputStalled) {
                setStatus(tRef.current('⚠️ decode đứng - kết nối lại…'));
                setLoading(true);
                connect();
                return;
            }

            // Safety net: if absolutely nothing arrives for a long time, try reconnecting occasionally.
            // Keep this very conservative to avoid annoying auto-reloads.
            if (packetAge > 300000 && bitmapAge > 300000) {
                setStatus(tRef.current('⚠️ idle lâu - kết nối lại…'));
                setLoading(true);
                connect();
            }
        }, 3000);

        const closeWs = () => {
            cleanupWs();
            try {
                detachControlsRef.current?.();
            } catch {
                // ignore
            }
        };

        window.addEventListener('beforeunload', closeWs);
        window.addEventListener('pagehide', closeWs);

        return () => {
            destroyedRef.current = true;
            closingRef.current = true;
            reloadRef.current = null;
            ro.disconnect();
            window.removeEventListener('resize', scheduleFit as any);
            window.removeEventListener('orientationchange', scheduleFit as any);
            window.visualViewport?.removeEventListener('resize', scheduleFit as any);
            window.visualViewport?.removeEventListener('scroll', scheduleFit as any);
            window.removeEventListener('beforeunload', closeWs);
            window.removeEventListener('pagehide', closeWs);
            body.removeEventListener('pointerenter', handlePointerEnter);
            body.removeEventListener('pointerleave', handlePointerLeave);
            if (watchdogTimer != null) {
                clearInterval(watchdogTimer);
                watchdogTimer = null;
            }
            closeWs();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        enabled,
        udid,
        logicalUdid,
        streamDeviceParam,
        streamEndpointUdid,
        streamSessionKey,
        wsServer,
        selectOnly
    ]);
}
