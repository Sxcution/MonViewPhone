import { createServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';

import { listDevices } from './adb.js';
import { allowedDevicesLabel, isDeviceAllowed, STREAM_NODE_BUILD_ID } from './runtime.js';
import { error, log, warn } from './logger.js';
import { encodeHello, parseClientControl, parseStreamQuery, STREAM_NODE_PORT } from './protocol.js';
import { sessionManager } from './sessionManager.js';

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

    const session = await sessionManager.start(query, (packet) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(packet, { binary: true }, (err) => {
          if (err) warn(udid, `[WS] send video packet failed: ${String(err)}`);
        });
      }
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
      log(udid, `[WS] closed code=${code} reason=${reason.toString()}`);
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

process.on('uncaughtException', (err) => {
  error('stream-node', 'Uncaught Exception:', err);
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
