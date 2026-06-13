import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  GoogDeviceDescriptor,
  connectGoogDeviceTracker,
  listDevtools,
  listDir,
  pullFile,
  pushFile,
  RemoteDevtoolsInfo,
  statPath,
  type FileStats,
} from '@/lib/serverApi';

type ServerContextValue = {
  wsServer: string;
  androidDevices: GoogDeviceDescriptor[];
  androidDeviceMap: Record<string, GoogDeviceDescriptor>;
  trackerMeta: { id: string; name: string } | null;
  startScrcpyServer: (udid: string) => void;
  killScrcpyServer: (udid: string, pid: number) => void;
  updateInterfaces: (udid: string) => void;
  listDevtools: (udid: string) => Promise<RemoteDevtoolsInfo[]>;
  listDir: (udid: string, remotePath: string) => Promise<FileStats[]>;
  statPath: (udid: string, remotePath: string) => Promise<{ isDir: boolean; size: number; mtimeMs: number }>;
  pullFile: (udid: string, remotePath: string) => Promise<Blob>;
  pushFile: (udid: string, file: File, remotePath: string) => Promise<void>;
};

const Ctx = createContext<ServerContextValue | null>(null);

const areGoogDevicesEqual = (a: GoogDeviceDescriptor, b: GoogDeviceDescriptor): boolean => {
  if (a.udid !== b.udid) return false;
  if (a.state !== b.state) return false;
  if (a.pid !== b.pid) return false;
  if (a['ro.product.model'] !== b['ro.product.model']) return false;
  if (a['ro.product.manufacturer'] !== b['ro.product.manufacturer']) return false;
  if (a['ro.build.version.release'] !== b['ro.build.version.release']) return false;
  if (a['ro.build.version.sdk'] !== b['ro.build.version.sdk']) return false;

  const aIfaces = a.interfaces || [];
  const bIfaces = b.interfaces || [];
  if (aIfaces.length !== bIfaces.length) return false;
  for (let i = 0; i < aIfaces.length; i++) {
    if (aIfaces[i].name !== bIfaces[i].name || aIfaces[i].ipv4 !== bIfaces[i].ipv4) return false;
  }
  return true;
};

const areGoogDeviceListsEqual = (a: GoogDeviceDescriptor[], b: GoogDeviceDescriptor[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!areGoogDevicesEqual(a[i], b[i])) return false;
  }
  return true;
};

export function ServerProvider({ wsServer, children }: { wsServer: string; children: React.ReactNode }) {
  const [androidDevices, setAndroidDevices] = useState<GoogDeviceDescriptor[]>([]);
  const [trackerMeta, setTrackerMeta] = useState<{ id: string; name: string } | null>(null);
  const sendRef = useRef<any>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let stopped = false;

    const onList = (list: GoogDeviceDescriptor[], meta: { id: string; name: string }) => {
      const safeList = Array.isArray(list) ? list : [];
      setAndroidDevices((prev) => {
        if (areGoogDeviceListsEqual(prev, safeList)) return prev;
        return safeList;
      });
      setTrackerMeta((prev) => {
        if (prev?.id === meta?.id && prev?.name === meta?.name) return prev;
        return meta ?? null;
      });
    };

    const onDevice = (dev: GoogDeviceDescriptor, meta: { id: string; name: string }) => {
      if (!dev || typeof dev !== 'object' || !('udid' in dev)) {
        setTrackerMeta((prev) => {
          if (prev?.id === meta?.id && prev?.name === meta?.name) return prev;
          return meta ?? null;
        });
        return;
      }

      setAndroidDevices((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const idx = safePrev.findIndex((d) => d.udid === dev.udid);
        if (idx >= 0) {
          const oldDev = safePrev[idx];
          if (areGoogDevicesEqual(oldDev, dev)) {
            return prev;
          }
          const next = [...safePrev];
          next[idx] = dev;
          return next;
        }
        return [...safePrev, dev];
      });

      setTrackerMeta((prev) => {
        if (prev?.id === meta?.id && prev?.name === meta?.name) return prev;
        return meta ?? null;
      });
    };

    const scheduleReconnect = () => {
      if (stopped || reconnectTimer !== null) return;
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, 1000);
    };

    const connect = () => {
      try {
        const tracker = connectGoogDeviceTracker(wsServer, onList, onDevice);
        ws = tracker.ws;
        sendRef.current = tracker.sendCommand;
        ws.addEventListener('close', () => {
          if (ws === tracker.ws) {
            sendRef.current = null;
            ws = null;
          }
          scheduleReconnect();
        });
        ws.addEventListener('error', () => {
          tracker.ws.close();
        });
      } catch {
        scheduleReconnect();
      }
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      sendRef.current = null;
      ws?.close();
    };
  }, [wsServer]);

  const androidDeviceMap = useMemo(() => {
    const out: Record<string, GoogDeviceDescriptor> = {};
    const safeDevices = Array.isArray(androidDevices) ? androidDevices : [];
    for (const d of safeDevices) {
      if (d?.udid) out[d.udid] = d;
    }
    return out;
  }, [androidDevices]);

  const send = (cmd: any, data: any) => {
    if (sendRef.current) sendRef.current(cmd, data);
  };

  const value: ServerContextValue = {
    wsServer,
    androidDevices,
    androidDeviceMap,
    trackerMeta,
    startScrcpyServer: (udid) => send('start_server', { udid }),
    killScrcpyServer: (udid, pid) => send('kill_server', { udid, pid }),
    updateInterfaces: (udid) => send('update_interfaces', { udid }),
    listDevtools: (udid) => listDevtools(wsServer, udid),
    listDir: (udid, remotePath) => listDir(wsServer, udid, remotePath),
    statPath: (udid, remotePath) => statPath(wsServer, udid, remotePath),
    pullFile: (udid, remotePath) => pullFile(wsServer, udid, remotePath),
    pushFile: (udid, file, remotePath) => pushFile(wsServer, udid, file, remotePath),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useServer() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useServer must be used within ServerProvider');
  return v;
}
