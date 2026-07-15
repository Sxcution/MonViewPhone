import { MuxChannel, ascii4, concatBytes, int32le, utf8, int16be, int8, int32be } from './multiplexer';

export type GoogDeviceDescriptor = {
  udid: string;
  state: string;
  pid?: number;
  interfaces?: { name: string; ipv4: string }[];
  ['ro.product.model']?: string;
  ['ro.product.manufacturer']?: string;
  ['ro.build.version.release']?: string;
  ['ro.build.version.sdk']?: string;
  ['last.update.timestamp']?: number;
  [k: string]: any;
};

export type DeviceTrackerEventList<T> = {
  list: T[];
  id: string;
  name: string;
};

export type DeviceTrackerEvent<T> = {
  device: T;
  id: string;
  name: string;
};

type TrackerMessage<T> =
  | { id: number; type: 'devicelist'; data: DeviceTrackerEventList<T> }
  | { id: number; type: 'device'; data: DeviceTrackerEvent<T> };

export type ControlCenterCommandType = 'start_server' | 'kill_server' | 'update_interfaces';

export type RemoteDevtoolsInfo = {
  title: string;
  url: string;
  type?: string;
  webSocketDebuggerUrl?: string;
  devtoolsFrontendUrl?: string;
  description?: string;
  version?: string;
  [k: string]: any;
};

// File metadata shape returned by the backend file API.
export type FileStats = {
  name: string;
  isDir: 0 | 1;
  size: number;
  dateModified: number;
};

function httpBase(wsServer: string): string {
  const u = new URL(wsServer);
  u.protocol = u.protocol === 'wss:' ? 'https:' : 'http:';
  u.search = '';
  u.hash = '';
  if (!u.pathname.endsWith('/')) {
    u.pathname += '/';
  }
  return u.toString();
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Invalid file reader result'));
        return;
      }
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function actionUrl(wsServer: string, action: string, extra?: Record<string, string>): string {
  const u = new URL(wsServer);
  u.searchParams.set('action', action);
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => u.searchParams.set(k, v));
  }
  return u.toString();
}

export function connectGoogDeviceTracker(
  wsServer: string,
  onList: (list: GoogDeviceDescriptor[], meta: { id: string; name: string }) => void,
  onDevice: (device: GoogDeviceDescriptor, meta: { id: string; name: string }) => void,
): { ws: WebSocket; sendCommand: (cmd: ControlCenterCommandType, data: any) => void } {
  const ws = new WebSocket(actionUrl(wsServer, 'goog-device-list'));
  ws.addEventListener('message', (e) => {
    try {
      const msg = JSON.parse(String(e.data)) as TrackerMessage<GoogDeviceDescriptor>;
      if (msg.type === 'devicelist') {
        onList(msg.data.list, { id: msg.data.id, name: msg.data.name });
      } else if (msg.type === 'device') {
        onDevice(msg.data.device, { id: msg.data.id, name: msg.data.name });
      }
    } catch {
      // ignore
    }
  });

  const sendCommand = (cmd: ControlCenterCommandType, data: any) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    ws.send(
      JSON.stringify({
        id: Date.now(),
        type: cmd,
        data,
      }),
    );
  };

  return { ws, sendCommand };
}

export async function listDevtools(wsServer: string, udid: string): Promise<RemoteDevtoolsInfo[]> {
  const ws = new WebSocket(actionUrl(wsServer, 'devtools', { udid }));
  return new Promise((resolve, reject) => {
    let done = false;
    const timeout = setTimeout(() => {
      if (done) return;
      done = true;
      try {
        ws.close();
      } catch {}
      reject(new Error('devtools timeout'));
    }, 8000);

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ command: 'list_devtools' }));
    });

    ws.addEventListener('message', (e) => {
      try {
        const data = JSON.parse(String(e.data));
        if (data?.type === 'devtools' && Array.isArray(data?.data)) {
          done = true;
          clearTimeout(timeout);
          ws.close();
          resolve(data.data);
        }
        if (data?.error) {
          done = true;
          clearTimeout(timeout);
          ws.close();
          reject(new Error(String(data.error)));
        }
      } catch {
        // ignore
      }
    });

    ws.addEventListener('error', () => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      reject(new Error('devtools ws error'));
    });
  });
}

// ---------------- File listing / transfer via Multiplexer (FSLS) ----------------

type FslSession = {
  root: MuxChannel;
  session: MuxChannel;
};

const FSL_SESSION_TTL = 60_000; // 60 seconds
const fslSessionCache = new Map<string, { promise: Promise<FslSession>; timestamp: number }>();

async function getFslSession(wsServer: string, udid: string): Promise<FslSession> {
  const key = `${wsServer}__${udid}`;
  const cached = fslSessionCache.get(key);
  if (cached) {
    // Evict stale entries older than TTL
    if (Date.now() - cached.timestamp > FSL_SESSION_TTL) {
      fslSessionCache.delete(key);
    } else {
      return cached.promise;
    }
  }

  const promise = new Promise<FslSession>((resolve, reject) => {
    const ws = new WebSocket(actionUrl(wsServer, 'multiplex'));
    ws.binaryType = 'arraybuffer';
    ws.addEventListener('error', () => reject(new Error('multiplex ws error')));
    ws.addEventListener('open', () => {
      const root = MuxChannel.wrap(ws);
      // Create FSLS session channel: [code:'FSLS'][len:u32le][serial utf8]
      const serialBytes = utf8(udid);
      const init = concatBytes(ascii4('FSLS'), int32le(serialBytes.byteLength), serialBytes);
      const session = root.createChannel(init);
      resolve({ root, session });
    });
  });

  fslSessionCache.set(key, { promise, timestamp: Date.now() });
  return promise;
}

function parseAdbSyncFrame(buf: ArrayBuffer): { cmd: string; payload: Uint8Array } {
  const u8 = new Uint8Array(buf);
  const cmd = String.fromCharCode(u8[0], u8[1], u8[2], u8[3]);
  return { cmd, payload: u8.slice(4) };
}

function u32le(u8: Uint8Array, offset: number): number {
  return new DataView(u8.buffer, u8.byteOffset + offset, 4).getUint32(0, true);
}

function u32be(u8: Uint8Array, offset: number): number {
  return new DataView(u8.buffer, u8.byteOffset + offset, 4).getUint32(0, false);
}

// adb sync DENT payload: mode(u32le) size(u32le) mtime(u32le) namelen(u32le) + name
function parseDent(payload: Uint8Array): FileStats | null {
  if (payload.byteLength < 16) return null;
  const mode = u32le(payload, 0);
  const size = u32le(payload, 4);
  const mtime = u32le(payload, 8);
  const nameLen = u32le(payload, 12);
  if (payload.byteLength < 16 + nameLen) return null;
  const nameBytes = payload.slice(16, 16 + nameLen);
  const name = new TextDecoder().decode(nameBytes);
  // POSIX dir bit: 0o040000
  const isDir = (mode & 0o170000) === 0o040000 ? 1 : 0;
  return {
    name,
    isDir,
    size,
    // server uses ms in FileStats for UI
    dateModified: mtime * 1000,
  };
}

// STAT payload: mode(u32le) size(u32le) mtime(u32le)
function parseStat(payload: Uint8Array): { mode: number; size: number; mtimeMs: number } | null {
  if (payload.byteLength < 12) return null;
  const mode = u32le(payload, 0);
  const size = u32le(payload, 4);
  const mtime = u32le(payload, 8);
  return { mode, size, mtimeMs: mtime * 1000 };
}

export async function listDir(wsServer: string, udid: string, remotePath: string): Promise<FileStats[]> {
  const { session } = await getFslSession(wsServer, udid);

  const p = utf8(remotePath);
  const init = concatBytes(ascii4('LIST'), int32le(p.byteLength), p);
  const ch = session.createChannel(init);

  return new Promise((resolve, reject) => {
    const out: FileStats[] = [];
    let done = false;

    const cleanup = () => {
      ch.removeEventListener('message', onMsg as any);
      ch.removeEventListener('close', onClose as any);
    };

    const onMsg = (e: MessageEvent) => {
      if (!(e.data instanceof ArrayBuffer)) return;
      const { cmd, payload } = parseAdbSyncFrame(e.data);
      if (cmd === 'DENT') {
        const st = parseDent(payload);
        if (st) out.push(st);
        return;
      }
      // Some servers may emit FAIL as a payload frame. Handle it too.
      if (cmd === 'FAIL') {
        try {
          const len = u32le(payload, 0);
          const msg = new TextDecoder().decode(payload.slice(4, 4 + len));
          done = true;
          cleanup();
          reject(new Error(msg || 'LIST failed'));
        } catch {
          done = true;
          cleanup();
          reject(new Error('LIST failed'));
        }
      }
    };

    const onClose = (ev: any) => {
      if (done) return;
      done = true;
      cleanup();
      // The server closes with code=0 on success in ExtendedSync.pipeReadDir.
      // Browser WebSocket close codes are 1000+; but Multiplexer channel close codes are passed through.
      // MuxChannel wraps them as CloseEvent-like objects in some builds; in ours we treat missing as ok.
      const code = typeof ev?.code === 'number' ? ev.code : 0;
      const reason = typeof ev?.reason === 'string' ? ev.reason : '';
      if (code && code !== 0 && code !== 1000) {
        reject(new Error(reason || `LIST closed (${code})`));
        return;
      }
      resolve(out);
    };

    ch.addEventListener('message', onMsg as any);
    ch.addEventListener('close', onClose as any);
  });
}

export async function statPath(wsServer: string, udid: string, remotePath: string): Promise<{ isDir: boolean; size: number; mtimeMs: number }> {
  const { session } = await getFslSession(wsServer, udid);
  const p = utf8(remotePath);
  const init = concatBytes(ascii4('STAT'), int32le(p.byteLength), p);
  const ch = session.createChannel(init);

  return new Promise((resolve, reject) => {
    let done = false;
    const cleanup = () => {
      ch.removeEventListener('message', onMsg as any);
      ch.removeEventListener('close', onClose as any);
    };

    let result: { isDir: boolean; size: number; mtimeMs: number } | null = null;

    const onMsg = (e: MessageEvent) => {
      if (!(e.data instanceof ArrayBuffer)) return;
      const { cmd, payload } = parseAdbSyncFrame(e.data);
      if (cmd === 'STAT') {
        const st = parseStat(payload);
        if (st) {
          const isDir = (st.mode & 0o170000) === 0o040000;
          result = { isDir, size: st.size, mtimeMs: st.mtimeMs };
        }
        return;
      }
      if (cmd === 'FAIL') {
        try {
          const len = u32le(payload, 0);
          const msg = new TextDecoder().decode(payload.slice(4, 4 + len));
          done = true;
          cleanup();
          reject(new Error(msg || 'STAT failed'));
        } catch {
          done = true;
          cleanup();
          reject(new Error('STAT failed'));
        }
      }
    };

    const onClose = (ev: any) => {
      if (done) return;
      done = true;
      cleanup();
      if (!result) {
        const code = typeof ev?.code === 'number' ? ev.code : 0;
        const reason = typeof ev?.reason === 'string' ? ev.reason : '';
        reject(new Error(reason || `STAT closed (${code})`));
        return;
      }
      resolve(result);
    };

    ch.addEventListener('message', onMsg as any);
    ch.addEventListener('close', onClose as any);
  });
}

export async function pullFile(wsServer: string, udid: string, remotePath: string): Promise<Blob> {
  const { session } = await getFslSession(wsServer, udid);

  // Create RECV channel: [cmd:'RECV'][len:u32le][path utf8]
  const p = utf8(remotePath);
  const init = concatBytes(ascii4('RECV'), int32le(p.byteLength), p);
  const ch = session.createChannel(init);

  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    let done = false;

    const cleanup = () => {
      ch.removeEventListener('message', onMsg as any);
      ch.removeEventListener('close', onClose as any);
    };

    const onMsg = (e: MessageEvent) => {
      if (!(e.data instanceof ArrayBuffer)) return;
      const { cmd, payload } = parseAdbSyncFrame(e.data);
      if (cmd === 'DATA') {
        chunks.push(payload);
        return;
      }
      if (cmd === 'DONE') {
        done = true;
        cleanup();
        try {
          ch.close();
        } catch {}
        // TS can be picky about ArrayBufferLike vs ArrayBuffer (SharedArrayBuffer in newer lib.dom).
        // In browsers, Blob accepts Uint8Array just fine.
        resolve(new Blob(chunks as unknown as BlobPart[]));
        return;
      }
      if (cmd === 'FAIL') {
        // payload: len:u32le + msg
        try {
          const dv = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
          const len = dv.getUint32(0, true);
          const msgBytes = payload.slice(4, 4 + len);
          const msg = new TextDecoder().decode(msgBytes);
          done = true;
          cleanup();
          reject(new Error(msg || 'pull failed'));
        } catch {
          done = true;
          cleanup();
          reject(new Error('pull failed'));
        }
      }
    };

    const onClose = () => {
      if (!done) {
        done = true;
        cleanup();
        reject(new Error('pull channel closed'));
      }
    };

    ch.addEventListener('message', onMsg as any);
    ch.addEventListener('close', onClose as any);
  });
}

// File push binary protocol (matches server's FilePushProtocol.ts)
const TYPE_PUSH_FILE = 102;
enum FilePushState {
  NEW,
  START,
  APPEND,
  FINISH,
  CANCEL,
}

enum FilePushResponseStatus {
  NEW_PUSH_ID = 1,
  NO_ERROR = 0,
}

function buildPushCommandNew(): Uint8Array {
  return concatBytes(new Uint8Array([TYPE_PUSH_FILE]), int16be(0), int8(FilePushState.NEW));
}

function buildPushCommandStart(id: number, fileSize: number, remotePath: string): Uint8Array {
  const nameBytes = utf8(remotePath);
  const header = concatBytes(
    new Uint8Array([TYPE_PUSH_FILE]),
    int16be(id),
    int8(FilePushState.START),
    int32be(fileSize),
    // name length u16be
    (() => {
      const b = new Uint8Array(2);
      new DataView(b.buffer).setUint16(0, nameBytes.byteLength, false);
      return b;
    })(),
  );
  return concatBytes(header, nameBytes);
}

function buildPushCommandAppend(id: number, chunk: Uint8Array): Uint8Array {
  return concatBytes(
    new Uint8Array([TYPE_PUSH_FILE]),
    int16be(id),
    int8(FilePushState.APPEND),
    int32be(chunk.byteLength),
    chunk,
  );
}

function buildPushCommandFinish(id: number): Uint8Array {
  return concatBytes(new Uint8Array([TYPE_PUSH_FILE]), int16be(id), int8(FilePushState.FINISH));
}

function parsePushResponse(buf: ArrayBuffer): { id: number; status: number } {
  const u8 = new Uint8Array(buf);
  if (u8.byteLength < 3) throw new Error('bad push response');
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const id = dv.getInt16(0, false);
  const status = dv.getInt8(2);
  return { id, status };
}

async function waitForPushAck(ch: MuxChannel, timeoutMs = 10000): Promise<{ id: number; status: number }> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      cleanup();
      reject(new Error('push ack timeout'));
    }, timeoutMs);

    const onMsg = (e: MessageEvent) => {
      if (!(e.data instanceof ArrayBuffer)) return;
      try {
        const r = parsePushResponse(e.data);
        cleanup();
        resolve(r);
      } catch {
        // ignore
      }
    };
    const onClose = () => {
      cleanup();
      reject(new Error('push channel closed'));
    };
    const cleanup = () => {
      clearTimeout(t);
      ch.removeEventListener('message', onMsg as any);
      ch.removeEventListener('close', onClose as any);
    };
    ch.addEventListener('message', onMsg as any);
    ch.addEventListener('close', onClose as any);
  });
}

export async function pushFile(wsServer: string, udid: string, file: File, remotePath: string): Promise<void> {
  const { session } = await getFslSession(wsServer, udid);
  const ch = session.createChannel(ascii4('SEND'));

  // NEW -> receive pushId
  ch.send(buildPushCommandNew());
  const r1 = await waitForPushAck(ch);
  if (r1.status !== FilePushResponseStatus.NEW_PUSH_ID) {
    throw new Error(`push NEW failed (status=${r1.status})`);
  }
  const pushId = r1.id;

  // START
  ch.send(buildPushCommandStart(pushId, file.size, remotePath));
  const r2 = await waitForPushAck(ch);
  if (r2.status !== FilePushResponseStatus.NO_ERROR) {
    throw new Error(`push START failed (status=${r2.status})`);
  }

  // APPEND chunks with simple backpressure (wait ack per chunk)
  const chunkSize = 64 * 1024;
  let offset = 0;
  while (offset < file.size) {
    const blob = file.slice(offset, Math.min(file.size, offset + chunkSize));
    const buf = new Uint8Array(await blob.arrayBuffer());
    ch.send(buildPushCommandAppend(pushId, buf));
    const ack = await waitForPushAck(ch);
    if (ack.status !== FilePushResponseStatus.NO_ERROR) {
      throw new Error(`push APPEND failed (status=${ack.status})`);
    }
    offset += buf.byteLength;
  }

  // FINISH
  ch.send(buildPushCommandFinish(pushId));
  const r3 = await waitForPushAck(ch, 30000);
  if (r3.status !== FilePushResponseStatus.NO_ERROR) {
    throw new Error(`push FINISH failed (status=${r3.status})`);
  }
  try {
    ch.close();
  } catch {}
}

// Install APK via HTTP API (server writes temp file and runs adb install)
export async function installApk(wsServer: string, udid: string, file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const endpoint = `${httpBase(wsServer)}api/goog/device/install-apk-binary?udid=${encodeURIComponent(
    udid,
  )}&fileName=${encodeURIComponent(file.name)}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type':
        file.name.toLowerCase().endsWith('.xapk') || file.name.toLowerCase().endsWith('.zip')
          ? 'application/zip'
          : 'application/vnd.android.package-archive',
      'X-UDID': udid,
      'X-Filename': encodeURIComponent(file.name),
      'X-File-Size': String(buf.byteLength),
    },
    body: buf,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Upload failed (status ${res.status})`);
  }
  return json.filePath || '';
}

export async function installUploadedApk(wsServer: string, udid: string, filePath: string): Promise<void> {
  const endpoint = `${httpBase(wsServer)}api/goog/device/install-uploaded`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ udid, filePath }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Install failed (status ${res.status})`);
  }
}

export async function runAdbCommandApi(
  wsServer: string,
  udid: string,
  command: string,
  kind?: 'shell' | 'host-adb',
  args?: string[],
): Promise<{ success: boolean; output: string }> {
  const isDebug = typeof window !== 'undefined' && localStorage.getItem('monviewphone:dav-debug-open-wechat') === 'true';
  const endpoint = `${httpBase(wsServer)}api/goog/device/adb-command`;
  if (isDebug) {
    console.log('[DAV_OPEN_WECHAT] ADB_API_REQUEST:', { endpoint, udid, command, kind, args });
  }
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ udid, command, kind, args }),
    });
  } catch (err: any) {
    if (isDebug) {
      console.error('[DAV_OPEN_WECHAT] ADB_API_REQUEST_FAILED:', err);
    }
    throw err;
  }
  const json = await res.json().catch(() => ({}));
  const success = !!json?.success;
  const output = json?.output || json?.error || 'No output';
  if (isDebug) {
    console.log('[DAV_OPEN_WECHAT] ADB_API_RESPONSE:', {
      status: res.status,
      ok: res.ok,
      jsonRaw: json,
      success,
      output,
    });
  }
  return { success, output };
}

export async function syncPhoneClipboardToPcApi(
  wsServer: string,
  udid: string,
): Promise<{ changed: boolean; bytes?: number }> {
  const endpoint = `${httpBase(wsServer)}api/goog/device/sync-clipboard-to-pc`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ udid }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Sync clipboard failed (status ${res.status})`);
  }
  return { changed: !!json.changed, bytes: json.bytes };
}

// List user profiles on a device
export async function listUserProfiles(
  wsServer: string,
  udid: string,
): Promise<{ id: number; name: string }[]> {
  const endpoint = `${httpBase(wsServer)}api/goog/device/user-profiles`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ udid }),
  });
  const json = await res.json().catch(() => ({}));
  if (!json?.success || !Array.isArray(json?.profiles)) {
    return [{ id: 0, name: 'Owner' }];
  }
  return json.profiles;
}

// Install APK to a specific user profile
export async function installApkToUser(
  wsServer: string,
  udid: string,
  filePath: string,
  userId?: number,
): Promise<void> {
  const endpoint = `${httpBase(wsServer)}api/goog/device/install-apk-user`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ udid, filePath, userId }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Install failed (status ${res.status})`);
  }
}


export async function setDeviceDisplayPower(
  wsServer: string,
  udid: string,
  mode: 'off' | 'on',
  displayIndex = 0,
): Promise<{ success: boolean; output: string; method?: string }> {
  const endpoint = `${httpBase(wsServer)}api/goog/device/display-power`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ udid, mode, displayIndex }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || json?.output || `Display power failed (status ${res.status})`);
  }
  return {
    success: true,
    output: json?.output || '',
    method: json?.method,
  };
}

export async function openPcFileDialog(
  wsServer: string,
  initialDir: string,
  multi = true,
  filter = "Images and Videos|*.jpg;*.jpeg;*.png;*.webp;*.bmp;*.gif;*.mp4;*.mov;*.mkv|All Files|*.*"
): Promise<{ success: boolean; cancelled: boolean; files: string[]; warning?: string }> {
  const endpoint = `${httpBase(wsServer)}api/goog/pc/open-file-dialog`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initialDir, multi, filter }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Open file dialog failed (status ${res.status})`);
  }
  return {
    success: true,
    cancelled: !!json.cancelled,
    files: json.files || [],
    warning: json.warning,
  };
}

export async function pushLocalFileApi(
  wsServer: string,
  udid: string,
  localPath: string,
  remotePath: string
): Promise<void> {
  const endpoint = `${httpBase(wsServer)}api/goog/device/push-local-file`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ udid, localPath, remotePath }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Push local file failed (status ${res.status})`);
  }
}

export type ParsedCommand =
  | { kind: 'shell'; original: string; command: string }
  | { kind: 'host-adb'; original: string; args: string[] }
  | { kind: 'invalid'; original: string; error: string };

function unquote(str: string): string {
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  return str;
}

interface TokenInfo {
  text: string;
  startIndex: number;
  endIndex: number;
}

function tokenizeCommandWithIndices(input: string): TokenInfo[] {
  const tokens: TokenInfo[] = [];
  let i = 0;
  const len = input.length;

  while (i < len) {
    // Skip whitespace
    while (i < len && /\s/.test(input[i])) {
      i++;
    }
    if (i >= len) break;

    const startIndex = i;
    let current = '';
    let inDoubleQuote = false;
    let inSingleQuote = false;

    while (i < len) {
      const char = input[i];
      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        current += char;
        i++;
      } else if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        current += char;
        i++;
      } else if (!inDoubleQuote && !inSingleQuote && /\s/.test(char)) {
        break;
      } else {
        current += char;
        i++;
      }
    }
    tokens.push({
      text: current,
      startIndex,
      endIndex: i
    });
  }
  return tokens;
}

export function splitCommandBatchSmart(input: string): string[] {
  const segments: string[] = [];
  let currentSegment = '';
  let inDoubleQuote = false;
  let inSingleQuote = false;
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      currentSegment += char;
      i++;
    } else if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      currentSegment += char;
      i++;
    } else if (!inDoubleQuote && !inSingleQuote && char === '\n') {
      segments.push(currentSegment);
      currentSegment = '';
      i++;
    } else if (!inDoubleQuote && !inSingleQuote && char === '&' && input[i + 1] === '&') {
      segments.push(currentSegment);
      currentSegment = '';
      i += 2; // skip both '&'
    } else {
      currentSegment += char;
      i++;
    }
  }
  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

export function normalizeAdbSegment(segment: string): ParsedCommand {
  const original = segment;
  let cleanSegment = segment.trim();
  if (cleanSegment.startsWith('$')) {
    cleanSegment = cleanSegment.slice(1).trim();
  }

  if (cleanSegment.toLowerCase() === 'device') {
    return { kind: 'host-adb', original, args: ['get-serialno'] };
  }

  if (!cleanSegment) {
    return { kind: 'invalid', original, error: 'Command is empty' };
  }

  const tokens = tokenizeCommandWithIndices(cleanSegment);
  if (tokens.length === 0) {
    return { kind: 'invalid', original, error: 'Command is empty' };
  }

  const firstTokenText = tokens[0].text.toLowerCase();
  if (firstTokenText === 'adb' || firstTokenText === 'adb.exe') {
    let tokenIdx = 1;
    if (tokenIdx < tokens.length && tokens[tokenIdx].text === '-s') {
      tokenIdx += 2; // skip -s and SERIAL
    }

    if (tokenIdx >= tokens.length) {
      return { kind: 'invalid', original, error: 'Missing adb command' };
    }

    if (tokens[tokenIdx].text.toLowerCase() === 'shell') {
      const shellCmdStartIdx = tokens[tokenIdx].endIndex;
      const shellCmd = cleanSegment.slice(shellCmdStartIdx).trim();
      if (!shellCmd) {
        return { kind: 'invalid', original, error: 'Missing shell command after adb shell' };
      }
      return { kind: 'shell', original, command: shellCmd };
    } else {
      // It's a host-adb command
      const args = tokens.slice(tokenIdx).map(t => unquote(t.text));
      if (args.length === 0) {
        return { kind: 'invalid', original, error: 'Missing adb command arguments' };
      }
      if (args[0].toLowerCase() === 'device') {
        args[0] = 'get-serialno';
      }
      return { kind: 'host-adb', original, args };
    }
  } else {
    // If not starting with adb, it's treated as shell command
    return { kind: 'shell', original, command: cleanSegment };
  }
}

export interface AppInfo {
  packageName: string;
  displayName: string;
  userId: number;
  baseApkPath: string;
  splitApkPaths: string[];
  isSystem: boolean;
  enabled: boolean;
  icon: string; // Base64 string
}

export async function getAppsList(wsServer: string, udid: string, userId: number): Promise<AppInfo[]> {
  const endpoint = `${httpBase(wsServer)}api/goog/device/apps/list`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ udid, userId }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Failed to fetch app list (status ${res.status})`);
  }
  return json.apps || [];
}

export async function extractAppApk(
  wsServer: string,
  udid: string,
  userId: number,
  packageName: string
): Promise<{ outputDir: string; savedPaths: string[]; count: number; packageName: string }> {
  const endpoint = `${httpBase(wsServer)}api/goog/device/apps/extract`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ udid, userId, packageName }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Failed to extract APK (status ${res.status})`);
  }
  return {
    outputDir: json.outputDir || '',
    savedPaths: json.savedPaths || [],
    count: json.count || 0,
    packageName: json.packageName || '',
  };
}

export async function forceStopApp(wsServer: string, udid: string, userId: number, packageName: string): Promise<void> {
  const endpoint = `${httpBase(wsServer)}api/goog/device/apps/force-stop`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ udid, userId, packageName }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Failed to force stop (status ${res.status})`);
  }
}

export async function clearAppCache(wsServer: string, udid: string, userId: number, packageName: string): Promise<void> {
  const endpoint = `${httpBase(wsServer)}api/goog/device/apps/clear-cache`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ udid, userId, packageName }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    if (json?.error === 'unsupported') {
      throw new Error('unsupported');
    }
    throw new Error(json?.error || `Failed to clear cache (status ${res.status})`);
  }
}

export async function uninstallApp(wsServer: string, udid: string, userId: number, packageName: string): Promise<void> {
  const endpoint = `${httpBase(wsServer)}api/goog/device/apps/uninstall`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ udid, userId, packageName }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Failed to uninstall (status ${res.status})`);
  }
}

export async function openApp(wsServer: string, udid: string, userId: number, packageName: string): Promise<void> {
  const endpoint = `${httpBase(wsServer)}api/goog/device/apps/open`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ udid, userId, packageName }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Failed to open app (status ${res.status})`);
  }
}


