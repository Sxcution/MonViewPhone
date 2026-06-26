import { AdbServerClient } from '@yume-chan/adb';
import { AdbServerNodeTcpConnector } from '@yume-chan/adb-server-node-tcp';

const host = process.env.ADB_HOST ?? '127.0.0.1';
const port = Number(process.env.ADB_PORT ?? 5037);

const connector = new AdbServerNodeTcpConnector({ host, port });
export const adbServer = new AdbServerClient(connector);

export async function createAdbForSerial(serial: string) {
  return adbServer.createAdb({ serial });
}

export async function listDevices() {
  return adbServer.getDevices();
}
