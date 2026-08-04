import { createServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';

import { listDevices } from './adb.js';
import { allowedDevicesLabel, isDeviceAllowed, STREAM_NODE_BUILD_ID } from './runtime.js';
import { error, log, warn } from './logger.js';
import { encodeHello, encodeVideoPacket, HEADER_SIZE, parseClientControl, parseStreamQuery, ServerPacketType, STREAM_NODE_PORT } from './protocol.js';
import { sessionManager } from './sessionManager.js';
import { VideoBackpressureGate } from './videoBackpressure.js';

function bytesFromEnv(name: string) {
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Math.trunc(value) : undefined;
}

const WS_HIGH_WATER_OVERRIDE = bytesFromEnv('MONVIEW_WS_HIGH_WATER_BYTES');
const WS_LOW_WATER_OVERRIDE = bytesFromEnv('MONVIEW_WS_LOW_WATER_BYTES');
const CONGESTION_LOG_INTERVAL_MS = 5_000;

function waterMarksForBitrate(bitrate: number) {
  // Half a second of encoded bits, converted to bytes.
  const derivedHigh = Math.max(64 * 1024, Math.min(512 * 1024, Math.trunc(bitrate / 16)));
  const high = WS_HIGH_WATER_OVERRIDE !== undefined && WS_HIGH_WATER_OVERRIDE > 0 ? WS_HIGH_WATER_OVERRIDE : derivedHigh;
  const low = Math.min(high - 1, WS_LOW_WATER_OVERRIDE ?? Math.max(16 * 1024, Math.trunc(high / 4)));
  return { high, low };
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`);
    if (url.pathname === '/') {
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(`MonViewPhoneV2 stream-node is running. build=${STREAM_NODE_BUILD_ID}. devices=${allowedDevicesLabel()}. Use /healthz for status.`);
      return;
    }
    if (url.pathname === '/healthz') {
      const devices = await listDevices().catch(() => []);
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        ok: true,
        name: 'monviewphone-stream-node',
        buildId: STREAM_NODE_BUILD_ID,
        allowedDevices: allowedDevicesLabel(),
        devices: devices.length,
      }));
      return;
    }
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found');
  } catch (e) {
    res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: String(e) }));
  }
});

const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`);
  if (url.pathname !== '/stream') {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`);
  let udid = 'unknown';
  try {
    const query = parseStreamQuery(url);
    udid = query.udid;

    log(udid, `[WS] accepted path=${url.pathname} build=${STREAM_NODE_BUILD_ID} query=${url.search}`);
    ws.send(encodeHello(udid));

    if (!isDeviceAllowed(udid)) {
      const message = `Stream limited to ${allowedDevicesLabel()}. ${udid} is skipped.`;
      warn(udid, `[WS] rejected by device allowlist. allowed=${allowedDevicesLabel()}`);
      ws.send(JSON.stringify({ type: 'error', message }));
      ws.close(1008, 'device allowlist');
      return;
    }

    ws.send(JSON.stringify({ type: 'status', message: 'Đã nhận WS, vào hàng đợi stream Tango…' }));

    const { high: highWaterBytes, low: lowWaterBytes } = waterMarksForBitrate(query.bitrate);
    log(udid, `[WS] video backpressure highWater=${highWaterBytes} lowWater=${lowWaterBytes} bitrate=${query.bitrate} source=${WS_HIGH_WATER_OVERRIDE ? 'env' : 'bitrate'}`);
    const backpressure = new VideoBackpressureGate(highWaterBytes, lowWaterBytes);
    let latestConfiguration: Buffer | undefined;
    let lastCongestionSummaryAt = 0;
    let lastMissingConfigurationWarningAt = 0;
    const onBinarySend = (err?: Error) => {
      if (err) warn(udid, `[WS] send video packet failed: ${String(err)}`);
    };
    const sendBinary = (packet: Buffer) => {
      ws.send(packet, { binary: true }, onBinarySend);
    };

    const session = await sessionManager.start(query, (packet) => {
      if (ws.readyState !== WebSocket.OPEN) return;

      const bufferedAmount = ws.bufferedAmount;
      const packetBytes = HEADER_SIZE + packet.data.byteLength;
      const wasCongested = backpressure.congested;
      const action = backpressure.decide(packet.type, packet.keyframe, bufferedAmount, latestConfiguration !== undefined);
      if (!wasCongested && backpressure.congested) {
        lastCongestionSummaryAt = Date.now();
        warn(udid, `[WS] video congestion entered bufferedAmount=${bufferedAmount} packetBytes=${packetBytes} highWater=${highWaterBytes}`);
      }

      if (packet.type === ServerPacketType.VideoConfiguration) {
        latestConfiguration = encodeVideoPacket(packet.type, packet.data, packet.timestamp, packet.keyframe);
        if (action === 'send') sendBinary(latestConfiguration);
        return;
      }

      if (action === 'drop-video') {
        const now = Date.now();
        if (packet.keyframe && bufferedAmount <= lowWaterBytes && !latestConfiguration && now - lastMissingConfigurationWarningAt >= CONGESTION_LOG_INTERVAL_MS) {
          lastMissingConfigurationWarningAt = now;
          warn(udid, `[WS] recovery keyframe held: no cached video configuration bufferedAmount=${bufferedAmount} droppedTotal=${backpressure.droppedFrames}`);
        }
        if (now - lastCongestionSummaryAt >= CONGESTION_LOG_INTERVAL_MS) {
          lastCongestionSummaryAt = now;
          warn(udid, `[WS] video congestion active bufferedAmount=${bufferedAmount} droppedFrames=${backpressure.droppedSinceCongestion} droppedTotal=${backpressure.droppedFrames}`);
        }
        return;
      }

      if (action === 'recover') {
        log(udid, `[WS] video congestion recovered bufferedAmount=${bufferedAmount} droppedFrames=${backpressure.droppedSinceCongestion} droppedTotal=${backpressure.droppedFrames}`);
        sendBinary(latestConfiguration!);
      }
      sendBinary(encodeVideoPacket(packet.type, packet.data, packet.timestamp, packet.keyframe));
    });

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'status', message: 'scrcpy đã start, đang chờ frame…' }));
    }

    ws.on('message', async (data, isBinary) => {
      try {
        if (!isBinary) {
          const text = data.toString();
          if (!text) return;
          const msg = JSON.parse(text) as { type?: string };
          if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
          return;
        }
        const control = parseClientControl(data);
        if (control) await session.handleControl(control);
      } catch (e) {
        warn(udid, `[WS] control message failed: ${String(e)}`);
      }
    });

    ws.on('close', (code, reason) => {
      log(udid, `[WS] closed code=${code} reason=${reason.toString()} bufferedAmount=${ws.bufferedAmount} droppedFrames=${backpressure.droppedFrames}`);
      void sessionManager.closeIfCurrent(udid, session);
    });

    ws.on('error', (e) => {
      warn(udid, `[WS] websocket error: ${String(e)}`);
      void sessionManager.closeIfCurrent(udid, session);
    });
  } catch (e) {
    error(udid, '[WS] stream session failed', e);
    try {
      ws.send(JSON.stringify({ type: 'error', message: e instanceof Error ? e.message : String(e) }));
    } catch {}
    try { ws.close(1011, 'stream session failed'); } catch {}
    // Do not close by udid here. sessionManager.start already cleans up the failed
    // session it created. Closing by udid from an old/failed WebSocket can kill a
    // newer zoom/viewer session for the same device.
  }
});

process.on('SIGINT', () => {
  void sessionManager.closeAll().finally(() => process.exit(0));
});
process.on('SIGTERM', () => {
  void sessionManager.closeAll().finally(() => process.exit(0));
});

process.on('uncaughtException', (err: any) => {
  error('stream-node', 'Uncaught Exception:', err);
  // Do not crash the entire server for common socket resets (ECONNRESET/EPIPE)
  if (err && (err.code === 'ECONNRESET' || err.code === 'EPIPE' || err.message?.includes('ECONNRESET') || err.message?.includes('EPIPE'))) {
    warn('stream-node', `Ignored socket exception to prevent server crash: ${err.message || String(err)}`);
    return;
  }
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  error('stream-node', 'Unhandled Rejection at:', promise, 'reason:', reason);
});

server.on('error', (e: any) => {
  if (e.code === 'EADDRINUSE') {
    error('stream-node', `Port ${STREAM_NODE_PORT} is already in use. Please close the occupying process.`);
    process.exit(1);
  } else {
    error('stream-node', 'Server error:', e);
    process.exit(1);
  }
});

server.listen(STREAM_NODE_PORT, '127.0.0.1', () => {
  log('stream-node', `listening on http://127.0.0.1:${STREAM_NODE_PORT}, build=${STREAM_NODE_BUILD_ID}, devices=${allowedDevicesLabel()}`);
});
