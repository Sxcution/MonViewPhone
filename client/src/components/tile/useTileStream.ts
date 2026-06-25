import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { attachTouchControls } from '@/lib/touchControls';
import { buildConfigBinary, makeWsUrl } from '@/lib/video';
import { useI18n } from '@/context/I18nContext';
import { type StreamConfig, STREAM_MODE } from '@/lib/config';
import type { InputTarget } from '@/context/ActiveContext';
import type { StreamReloadOptions } from './types';
import { useServer } from '@/context/ServerContext';

// Stream Engine V2 Imports
import { StreamEngine, StreamStats } from '@/stream/StreamEngine';
import { LegacyTinyH264Engine } from '@/stream/legacy/LegacyTinyH264Engine';
import { WebCodecsH264Engine } from '@/stream/webcodecs/WebCodecsH264Engine';
import {
  getCachedDeviceStream,
  cacheSuccessfulStream,
  clearDeviceStreamCache,
  getFallbackStages,
  FallbackStage
} from '@/lib/deviceStreamCache';

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
const INITIAL_FRAME_TIMEOUT_MS = 15_000; // Lower timeout to trigger fallback stages faster
const RECONNECT_DELAY_MS = 1200;

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

// Static feature detection state for WebCodecs
let webCodecsSupported = false;
let webCodecsChecked = false;

async function checkWebCodecsSupport(): Promise<boolean> {
  if (webCodecsChecked) return webCodecsSupported;
  if (!window.isSecureContext) {
    webCodecsChecked = true;
    webCodecsSupported = false;
    return false;
  }
  if (typeof VideoDecoder === 'undefined' || typeof EncodedVideoChunk === 'undefined') {
    webCodecsChecked = true;
    webCodecsSupported = false;
    return false;
  }
  try {
    const config: VideoDecoderConfig = {
      codec: 'avc1.42e01f',
      optimizeForLatency: true
    };
    const res = await VideoDecoder.isConfigSupported(config);
    webCodecsSupported = !!res.supported;
  } catch {
    webCodecsSupported = false;
  }
  webCodecsChecked = true;
  return webCodecsSupported;
}

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

    const { androidDeviceMap } = useServer();

    // Stream Stats state exposed to Tile Component
    const [streamStats, setStreamStats] = useState<StreamStats | null>(null);

    // Fallback Machine State
    const fallbackStagesRef = useRef<FallbackStage[]>([]);
    const currentStageIdxRef = useRef<number>(0);
    const activeStageRef = useRef<FallbackStage | null>(null);
    const reconnectCountRef = useRef<number>(0);
    const prevStatsRef = useRef<string>('');
    const activeEngineNameRef = useRef<string>('');
    const fallbackReasonRef = useRef<string>('');

    // Keep latest targets getter in a ref so touch controls always see newest sync state.
    const getInputTargetsRef = useRef(getInputTargetsForSource);
    useEffect(() => {
        getInputTargetsRef.current = getInputTargetsForSource;
    }, [getInputTargetsForSource]);

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
        }

        const ro = new ResizeObserver(fitCanvasToBody);
        ro.observe(body);

        const scheduleFit = () => {
            requestAnimationFrame(() => fitCanvasToBody());
        };
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
        let engine: StreamEngine | null = null;
        let lastPacketAt = Date.now();
        let lastBitmapAt = 0;
        let bytesReceivedThisInterval = 0;
        let lastBitrateCalcTime = Date.now();
        let currentBitrateKbps = 0;

        let watchdogTimer: number | null = null;
        let initialLoadTimer: number | null = null;
        let queuedConnectCancel: (() => void) | null = null;
        let connectGeneration = 0;

        const onActivate = () => selectOnly(logicalUdid);

        const handlePointerEnter = () => {
            if (getIsAltHeldRef.current?.()) {
                setAltSoloUdidRef.current?.(logicalUdid);
            }
        };
        const handlePointerLeave = () => {
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

        async function makeStreamEngine() {
            firstFrame = false;
            if (!isSilent()) {
                setLoading(true);
            }

            if (engine) {
                try { engine.stop(); } catch {}
                engine = null;
            }

            // Engine Decision Block
            let mode = streamCfgRef.current.engine || 'auto';

            // Device ce0817187cd6803d027e (Samsung Note 8) override: Force legacy-tinyh264 software decoder
            if (logicalUdid === 'ce0817187cd6803d027e') {
                mode = 'legacy-tinyh264';
            }

            const hasWebCodecs = await checkWebCodecsSupport();

            const useWebCodecs = mode === 'webcodecs' || (mode === 'auto' && hasWebCodecs);
            activeEngineNameRef.current = useWebCodecs ? 'webcodecs' : 'legacy-tinyh264';

            const callbacks = {
              onFirstFrame: (meta: { width: number; height: number }) => {
                if (destroyedRef.current) return;
                firstFrame = true;
                reconnectCountRef.current = 0;
                fallbackReasonRef.current = '';

                // Cache successful stream params for this device!
                if (activeStageRef.current) {
                  cacheSuccessfulStream(udid, {
                    workingEncoder: activeStageRef.current.encoderName,
                    workingWidth: activeStageRef.current.bounds?.width,
                    workingHeight: activeStageRef.current.bounds?.height,
                    workingFps: activeStageRef.current.maxFps,
                    workingBitrate: activeStageRef.current.bitrate
                  });
                }

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
              onFrame: () => {
                lastBitmapAt = Date.now();
              },
              onError: (err: any) => {
                console.error('[StreamEngine error]', udid, err);
                const reason = `Engine error: ${err?.message || err}`;
                fallbackReasonRef.current = reason;
                triggerFallbackConnection(reason);
              },
              onFallbackRequested: (reason: string) => {
                fallbackReasonRef.current = reason;
                triggerFallbackConnection(reason);
              }
            };

            if (useWebCodecs) {
              engine = new WebCodecsH264Engine(canvas!, callbacks);
            } else {
              engine = new LegacyTinyH264Engine(canvas!, callbacks);
            }

            engine.start();
        }

        function triggerFallbackConnection(reason: string) {
          if (destroyedRef.current || closingRef.current) return;

          // Đã từng có frame rồi thì lỗi này thường là decode/browser overload,
          // không phải encoder Android. Không thử encoder lung tung nữa.
          if (firstFrame) {
            console.warn(`[Stream V2] Ignore fallback after first frame on ${udid}: ${reason}`);
            fallbackReasonRef.current = `Decode overloaded: ${reason}`;
            setStatus(tRef.current('⚠️ decode quá tải'));
            return;
          }

          console.warn(`[Stream V2 Fallback] Fallback requested on device ${udid} due to: ${reason}`);

          currentStageIdxRef.current++;
          if (currentStageIdxRef.current >= fallbackStagesRef.current.length) {
            currentStageIdxRef.current = 0;
            fallbackReasonRef.current = 'All encoders failed. Retrying WebCodecs...';
          }

          reconnectCountRef.current++;
          connect({ restart: true });
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
                try {
                    prev.close();
                } catch {}
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

        async function connect(opts?: { restart?: boolean; immediate?: boolean }) {
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
                    setStatus(tRef.current('Đang đợi lượt kết nối...'));
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
            await makeStreamEngine();

            // Populate fallback stages list if empty
            if (fallbackStagesRef.current.length === 0) {
              const meta = androidDeviceMap[udid];
              fallbackStagesRef.current = getFallbackStages(streamCfgRef.current, meta);

              // Pre-fill cached successful config if it exists
              const cached = getCachedDeviceStream(udid);
              if (cached) {
                fallbackStagesRef.current.unshift({
                  encoderName: cached.workingEncoder,
                  bounds: cached.workingWidth ? { width: cached.workingWidth, height: cached.workingHeight || 1280 } : undefined,
                  maxFps: cached.workingFps,
                  bitrate: cached.workingBitrate,
                  description: `Cached parameters (${cached.workingEncoder || 'default'})`
                });
              }
            }

            const currentStage = fallbackStagesRef.current[currentStageIdxRef.current] || { description: 'Default' };
            activeStageRef.current = currentStage;

            // Resolve target stream parameters based on active stage
            let targetEncoder = 'encoderName' in currentStage ? currentStage.encoderName : streamCfgRef.current.encoderName;

            // Device ce0817187cd6803d027e (Samsung Note 8) override: Force software encoder
            if (logicalUdid === 'ce0817187cd6803d027e') {
                targetEncoder = 'OMX.google.h264.encoder';
            }

            const trialConfig: StreamConfig = {
              ...streamCfgRef.current,
              encoderName: targetEncoder,
              bitrate: currentStage.bitrate || streamCfgRef.current.bitrate,
              maxFps: currentStage.maxFps || streamCfgRef.current.maxFps,
              bounds: currentStage.bounds ? { ...streamCfgRef.current.bounds, ...currentStage.bounds } : streamCfgRef.current.bounds
            };

            let url: string;
            try {
                url = makeWsUrl({
                    wsServer,
                    deviceParam: streamDeviceParam,
                    udid: streamEndpointUdid,
                    restart: Boolean(opts?.restart),
                    config: trialConfig
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
                setStatus(tRef.current(`Đang kết nối: ${currentStage.description}…`));
            }

            if (initialLoadTimer != null) {
                clearTimeout(initialLoadTimer);
                initialLoadTimer = null;
            }
            
            // Watchdog for initial frame timeouts triggers fallback stages
            initialLoadTimer = window.setTimeout(() => {
                if (destroyedRef.current || closingRef.current) return;
                if (firstFrame) return;

                const nextIndex = currentStageIdxRef.current + 1;
                const totalStages = fallbackStagesRef.current.length;

                if (nextIndex >= totalStages) {
                  // Reached end of pipeline, force legacy fallback
                  // DISABLED: Do not fallback to tinyh264 now
                  currentStageIdxRef.current = 0;
                  fallbackReasonRef.current = 'Initial frame timed out. Retrying WebCodecs...';
                  setStatus(tRef.current('Đang chờ phản hồi WebCodecs…'));
                } else {
                  currentStageIdxRef.current = nextIndex;
                  const reason = `Frame timeout on stage ${currentStage.description}`;
                  fallbackReasonRef.current = reason;
                  setStatus(tRef.current(`Lỗi kết nối: thử ${fallbackStagesRef.current[nextIndex].description}…`));
                }

                reconnectCountRef.current++;
                connect({ restart: true });
            }, INITIAL_FRAME_TIMEOUT_MS);

            ws.onopen = () => {
                updateStreamSession(streamSessionKey, owner, 'connected', ws);
                if (STREAM_MODE === 'raw-v2') {
                    if (!isSilent()) {
                        setStatus(tRef.current("Đang chờ phản hồi"));
                    }
                    return;
                }

                if (!isSilent()) {
                    setStatus(tRef.current('Gửi cấu hình stream...'));
                }
                try {
                    ws.send(buildConfigBinary(trialConfig));
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
                bytesReceivedThisInterval += ab.byteLength;
                engine?.feedBytes(new Uint8Array(ab));
            };

            ws.onerror = () => setStatus(tRef.current('❌ lỗi WS'));

            ws.onclose = (e) => {
                releaseStreamSession(streamSessionKey, owner, ws);
                if (closingRef.current || destroyedRef.current) return;
                
                if (initialLoadTimer != null) {
                    clearTimeout(initialLoadTimer);
                    initialLoadTimer = null;
                }
                
                silentReconnectRef.current = false;
                
                // On close before first frame, trigger next fallback stage immediately
                if (!firstFrame) {
                  const nextIndex = currentStageIdxRef.current + 1;
                  if (nextIndex >= fallbackStagesRef.current.length) {
                    // DISABLED: Do not fallback to tinyh264 now
                    currentStageIdxRef.current = 0;
                    fallbackReasonRef.current = 'WS Closed. Retrying WebCodecs...';
                  } else {
                    currentStageIdxRef.current = nextIndex;
                    fallbackReasonRef.current = `WS closed (Code ${e.code})`;
                  }
                }

                reconnectCountRef.current++;
                reconnectTimerRef.current = window.setTimeout(() => {
                    if (destroyedRef.current) return;
                    connect({ restart: !firstFrame });
                }, RECONNECT_DELAY_MS);
            };
        }

        // Allow user to manually reload this tile.
        reloadRef.current = (opts?: StreamReloadOptions) => {
            if (destroyedRef.current) return;
            silentReconnectRef.current = Boolean(opts?.silent);
            if (!silentReconnectRef.current) {
                setLoading(true);
                setStatus(tRef.current('Đang reload…'));
            }
            
            // Clear fallback state and cache on user manual action
            clearDeviceStreamCache(udid);
            currentStageIdxRef.current = 0;
            fallbackStagesRef.current = [];
            fallbackReasonRef.current = '';

            connect({ restart: Boolean(opts?.restart) });
        };

        connect();

        // Watchdog: auto-reconnects only when connection is truly dead.
        // Do NOT reconnect on browser decode stall.
        watchdogTimer = window.setInterval(() => {
            if (destroyedRef.current || closingRef.current) return;

            const ws = wsRef.current;
            if (!ws || ws.readyState !== WebSocket.OPEN) return;
            if (!firstFrame) return;

            const now = Date.now();
            const packetAge = now - lastPacketAt;
            const bitmapAge = lastBitmapAt ? now - lastBitmapAt : 1e9;

            const OUTPUT_STALL_WARN_MS = 20_000;
            const packetsStillArriving = packetAge < 2500;
            const outputStalled = bitmapAge > OUTPUT_STALL_WARN_MS;

            if (packetsStillArriving && outputStalled) {
                // Browser/GPU decode bị nghẽn, nhưng socket vẫn sống.
                // Không reconnect, vì reconnect sẽ kill scrcpy-server trên phone và gây reconnect hàng loạt.
                setStatus(tRef.current('⚠️ Chrome decode quá tải - giữ kết nối'));
                setLoading(false);
                return;
            }

            if (engine) {
              const now = Date.now();
              const elapsed = now - lastBitrateCalcTime;
              if (elapsed > 0) {
                currentBitrateKbps = Math.round((bytesReceivedThisInterval * 8) / elapsed);
                bytesReceivedThisInterval = 0;
                lastBitrateCalcTime = now;
              }

              const stats = engine.getStats();
              const nextStats = {
                ...stats,
                reconnectCount: reconnectCountRef.current,
                encoderName: activeStageRef.current?.encoderName || 'default',
                fallbackReason: fallbackReasonRef.current || undefined,
                bitrateKbps: currentBitrateKbps
              };
              const serialized = JSON.stringify(nextStats);
              if (serialized !== prevStatsRef.current) {
                prevStatsRef.current = serialized;
                setStreamStats(nextStats);
              }
            }

            // Chỉ reconnect nếu socket thật sự im rất lâu.
            if (packetAge > 60_000 && bitmapAge > 60_000) {
                setStatus(tRef.current('⚠️ mất dữ liệu stream - kết nối lại…'));
                setLoading(true);
                connect();
            }
        }, 3000);

        const closeWs = () => {
            cleanupWs();
            try {
                detachControlsRef.current?.();
            } catch {}
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

    return {
      streamStats
    };
}
