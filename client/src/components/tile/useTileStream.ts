import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { attachTouchControls } from '@/lib/touchControls';
import { useI18n } from '@/context/I18nContext';
import type { StreamConfig } from '@/lib/config';
import type { InputTarget } from '@/context/ActiveContext';
import type { StreamReloadOptions } from './types';
import { StreamStats } from '@/stream/StreamEngine';
import { TangoStreamEngine, makeTangoStreamUrl } from '@/stream/tango';

type Args = {
    udid: string;
    deviceParam: string | null;
    streamUdid?: string;
    controlUdid?: string;
    wsServer: string;
    enabled?: boolean;
    suppressLoadingOverlay?: boolean;

    canvasRef: MutableRefObject<HTMLCanvasElement | null>;
    bodyRef: MutableRefObject<HTMLDivElement | null>;
    frameRef: MutableRefObject<HTMLDivElement | null>;

    wsRef: MutableRefObject<WebSocket | null>;
    reconnectTimerRef: MutableRefObject<number | null>;
    detachControlsRef: MutableRefObject<(() => void) | null>;
    closingRef: MutableRefObject<boolean>;
    destroyedRef: MutableRefObject<boolean>;

    streamCfgRef: MutableRefObject<StreamConfig>;

    selectOnly: (udid: string) => void;
    getInputTargetsForSource: (udid: string) => InputTarget[];
    setAltSoloUdid?: (udid: string | null) => void;
    getIsAltHeld?: () => boolean;

    setStatus: (s: string) => void;
    setLoading: (b: boolean) => void;

    reloadRef: MutableRefObject<((opts?: StreamReloadOptions) => void) | null>;
    onVideoDims?: (w: number, h: number) => void;
};

const STREAM_CONNECT_BATCH_SIZE = 3;
const STREAM_CONNECT_BATCH_DELAY_MS = 1200;
const INITIAL_FRAME_TIMEOUT_MS = 120_000;
const NO_PACKET_BEFORE_FIRST_FRAME_TIMEOUT_MS = 180_000;
const NO_PACKET_AFTER_FIRST_FRAME_TIMEOUT_MS = 90_000;
const RENDER_STALL_RESTART_DECODER_MS = 18_000;
const RECONNECT_DELAY_MS = 4000;

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
    if (existing && existing.owner !== owner) return false;
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

function maxSizeFromConfig(cfg: StreamConfig): number {
    const w = cfg.bounds?.width || 500;
    const h = cfg.bounds?.height || 500;
    return Math.max(1, Math.max(w, h));
}

export function useTileStream(args: Args) {
    const {
        udid,
        deviceParam,
        streamUdid,
        controlUdid,
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
    const streamSessionKey = streamEndpointUdid;
    const { t } = useI18n();
    const tRef = useRef(t);
    const ownerRef = useRef<symbol | null>(null);
    if (ownerRef.current == null) ownerRef.current = Symbol(logicalUdid);
    useEffect(() => { tRef.current = t; }, [t]);

    const [streamStats, setStreamStats] = useState<StreamStats | null>(null);
    const reconnectCountRef = useRef<number>(0);
    const prevStatsRef = useRef<string>('');

    const getInputTargetsRef = useRef(getInputTargetsForSource);
    useEffect(() => { getInputTargetsRef.current = getInputTargetsForSource; }, [getInputTargetsForSource]);

    const getIsAltHeldRef = useRef(getIsAltHeld);
    useEffect(() => { getIsAltHeldRef.current = getIsAltHeld; }, [getIsAltHeld]);

    const setAltSoloUdidRef = useRef(setAltSoloUdid);
    useEffect(() => { setAltSoloUdidRef.current = setAltSoloUdid; }, [setAltSoloUdid]);

    const suppressLoadingOverlayRef = useRef(suppressLoadingOverlay);
    useEffect(() => { suppressLoadingOverlayRef.current = suppressLoadingOverlay; }, [suppressLoadingOverlay]);

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

        function fitCanvasToBody() {
            if (!body || !canvas) return;
            if (!canvas.width || !canvas.height) return;
        }

        const ro = new ResizeObserver(fitCanvasToBody);
        ro.observe(body);

        const scheduleFit = () => requestAnimationFrame(() => fitCanvasToBody());
        window.addEventListener('resize', scheduleFit, { passive: true } as any);
        window.addEventListener('orientationchange', scheduleFit, { passive: true } as any);
        window.visualViewport?.addEventListener('resize', scheduleFit, { passive: true } as any);
        window.visualViewport?.addEventListener('scroll', scheduleFit, { passive: true } as any);

        function ensureCanvasSize(w: number, h: number) {
            if (!canvas) return;
            w = w & ~1;
            h = h & ~1;
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
                fitCanvasToBody();
            }
            return { w, h };
        }

        let firstFrame = false;
        let engine: TangoStreamEngine | null = null;
        let lastPacketAt = Date.now();
        let lastBitmapAt = 0;
        let lastDecoderRestartAt = 0;
        let watchdogTimer: number | null = null;
        let initialLoadTimer: number | null = null;
        let queuedConnectCancel: (() => void) | null = null;
        let connectGeneration = 0;

        const onActivate = () => selectOnly(logicalUdid);

        const handlePointerEnter = () => {
            if (getIsAltHeldRef.current?.()) setAltSoloUdidRef.current?.(logicalUdid);
        };
        const handlePointerLeave = () => {
            if (!getIsAltHeldRef.current?.()) setAltSoloUdidRef.current?.(null);
        };

        body.addEventListener('pointerenter', handlePointerEnter);
        body.addEventListener('pointerleave', handlePointerLeave);

        detachControlsRef.current = attachTouchControls(canvas, () => getInputTargetsRef.current(logicalUdid), onActivate, logicalUdid);

        async function makeStreamEngine() {
            firstFrame = false;
            if (!isSilent()) setLoading(true);
            if (engine) {
                try { engine.stop(); } catch {}
                engine = null;
            }

            const callbacks = {
                onFirstFrame: (meta: { width: number; height: number }) => {
                    if (destroyedRef.current) return;
                    firstFrame = true;
                    reconnectCountRef.current = 0;
                    if (initialLoadTimer != null) {
                        clearTimeout(initialLoadTimer);
                        initialLoadTimer = null;
                    }
                    setLoading(false);
                    setStatus('');
                    silentReconnectRef.current = false;
                    lastBitmapAt = Date.now();
                    ensureCanvasSize(meta.width, meta.height);
                    fitCanvasToBody();
                    onVideoDims?.(meta.width, meta.height);
                },
                onFrame: () => { lastBitmapAt = Date.now(); },
                onError: (err: any) => { console.error('[TangoStreamEngine error]', udid, err); },
            };

            engine = new TangoStreamEngine(canvas!, callbacks);
            engine.start();
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
                prev.onopen = null;
                prev.onmessage = null;
                prev.onerror = null;
                prev.onclose = null;
                try { prev.close(); } catch {}
            }
            wsRef.current = null;
            releaseStreamSession(streamSessionKey, owner);
            if (engine) {
                try { engine.stop(); } catch {}
                engine = null;
            }
            if (reconnectTimerRef.current != null) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
            if (initialLoadTimer != null) {
                clearTimeout(initialLoadTimer);
                initialLoadTimer = null;
            }
        }

        async function connect(opts?: { immediate?: boolean }) {
            if (!opts?.immediate) {
                cleanupWs();
                if (!claimStreamSession(streamSessionKey, owner, 'queued')) {
                    if (!isSilent()) {
                        setStatus(tRef.current('Đang có phiên stream khác mở…'));
                        setLoading(false);
                    }
                    return;
                }
                if (!isSilent()) {
                    setLoading(true);
                    setStatus(tRef.current('Đang xếp hàng khởi động Tango...'));
                }
                const generation = ++connectGeneration;
                queuedConnectCancel = scheduleBatchedConnect(streamSessionKey, owner, () => {
                    queuedConnectCancel = null;
                    if (destroyedRef.current || generation !== connectGeneration) {
                        releaseStreamSession(streamSessionKey, owner);
                        return;
                    }
                    connect({ immediate: true });
                });
                return;
            }

            updateStreamSession(streamSessionKey, owner, 'connecting');
            await makeStreamEngine();

            const cfg = streamCfgRef.current;
            const url = makeTangoStreamUrl({
                udid: streamEndpointUdid,
                bitrate: cfg.bitrate,
                maxFps: cfg.maxFps,
                maxSize: maxSizeFromConfig(cfg),
                displayId: cfg.displayId ?? 0,
                encoderName: cfg.encoderMode === 'custom' ? cfg.encoderName : undefined,
            });

            const ws = new WebSocket(url);
            ws.binaryType = 'arraybuffer';
            closingRef.current = false;
            wsRef.current = ws;
            updateStreamSession(streamSessionKey, owner, 'connecting', ws);
            lastPacketAt = Date.now();

            if (!isSilent()) setStatus(tRef.current('Đang kết nối Tango/scrcpy 3.3.4…'));

            if (initialLoadTimer != null) clearTimeout(initialLoadTimer);
            initialLoadTimer = window.setTimeout(() => {
                if (destroyedRef.current || closingRef.current || firstFrame) return;
                reconnectCountRef.current++;
                setStatus(tRef.current('Khởi động Tango quá lâu - kết nối lại…'));
                connect();
            }, INITIAL_FRAME_TIMEOUT_MS);

            ws.onopen = () => {
                updateStreamSession(streamSessionKey, owner, 'connected', ws);
                lastPacketAt = Date.now();
                if (!isSilent()) setStatus(tRef.current('Đang chờ frame Tango…'));
            };

            ws.onmessage = async (ev) => {
                if (typeof ev.data === 'string') {
                    lastPacketAt = Date.now();
                    try {
                        const msg = JSON.parse(ev.data);
                        if (msg?.type === 'error') setStatus(`❌ ${msg.message || 'Tango stream lỗi'}`);
                        else if (msg?.type === 'status' && msg.message && !firstFrame) setStatus(String(msg.message));
                    } catch {}
                    return;
                }

                let ab: ArrayBuffer | null = null;
                if (ev.data instanceof ArrayBuffer) ab = ev.data;
                else if (ev.data instanceof Blob) ab = await ev.data.arrayBuffer();
                if (!ab) return;
                lastPacketAt = Date.now();
                engine?.feedBytes(new Uint8Array(ab));
            };

            ws.onerror = () => setStatus(tRef.current('Không kết nối được stream-node 11080'));

            ws.onclose = () => {
                releaseStreamSession(streamSessionKey, owner, ws);
                if (closingRef.current || destroyedRef.current) return;
                if (initialLoadTimer != null) {
                    clearTimeout(initialLoadTimer);
                    initialLoadTimer = null;
                }
                silentReconnectRef.current = false;
                reconnectCountRef.current++;
                reconnectTimerRef.current = window.setTimeout(() => {
                    if (destroyedRef.current) return;
                    setStatus(tRef.current('Stream service chưa sẵn sàng - kết nối lại…'));
                    connect();
                }, RECONNECT_DELAY_MS);
            };
        }

        reloadRef.current = (opts?: StreamReloadOptions) => {
            if (destroyedRef.current) return;
            silentReconnectRef.current = Boolean(opts?.silent);
            if (!silentReconnectRef.current) {
                setLoading(true);
                setStatus(tRef.current('Đang reload Tango…'));
            }
            connect();
        };

        connect();

        watchdogTimer = window.setInterval(() => {
            if (destroyedRef.current || closingRef.current) return;
            const ws = wsRef.current;
            if (!ws || ws.readyState !== WebSocket.OPEN) return;

            const now = Date.now();
            const packetAge = now - lastPacketAt;
            const bitmapAge = lastBitmapAt ? now - lastBitmapAt : 1e9;

            // Important: if packets are still arriving, do NOT close WebSocket.
            // Closing WS tears down scrcpy and creates the random reconnect storm.
            // Only restart the local decoder/canvas pipeline and keep control alive.
            if (firstFrame && packetAge < 5000 && bitmapAge > RENDER_STALL_RESTART_DECODER_MS) {
                if (now - lastDecoderRestartAt > RENDER_STALL_RESTART_DECODER_MS) {
                    lastDecoderRestartAt = now;
                    setStatus(tRef.current('⚠️ render Tango đang hồi…'));
                    try { engine?.restartDecoderOnly(); } catch (e) { console.warn('[Tango] decoder-only restart failed', e); }
                }
            }

            const noPacketLimit = firstFrame ? NO_PACKET_AFTER_FIRST_FRAME_TIMEOUT_MS : NO_PACKET_BEFORE_FIRST_FRAME_TIMEOUT_MS;
            if (packetAge > noPacketLimit) {
                setStatus(tRef.current('⚠️ Tango stream im lặng - kết nối lại…'));
                setLoading(true);
                connect();
                return;
            }

            if (engine) {
                const cfg = streamCfgRef.current;
                const stats = {
                    ...engine.getStats(),
                    reconnectCount: reconnectCountRef.current,
                    encoderName: cfg.encoderMode === 'custom' ? (cfg.encoderName || 'custom') : 'auto'
                };
                const serialized = JSON.stringify(stats);
                if (serialized !== prevStatsRef.current) {
                    prevStatsRef.current = serialized;
                    setStreamStats(stats);
                }
            }
        }, 3000);

        const closeWs = () => {
            cleanupWs();
            try { detachControlsRef.current?.(); } catch {}
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
    }, [enabled, udid, logicalUdid, streamEndpointUdid, streamSessionKey, selectOnly]);

    return { streamStats };
}
