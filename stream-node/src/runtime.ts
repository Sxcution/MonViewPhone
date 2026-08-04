import { log, warn } from './logger.js';

export const STREAM_NODE_BUILD_ID = 'tango-v2-realtime-backpressure-2';

function parseDeviceList(raw: string | undefined): string[] {
  if (raw == null || raw.trim() === '') return [];
  const normalized = raw.trim().toLowerCase();
  if (normalized === '*' || normalized === 'all') return [];
  return raw
    .split(/[;,\s]+/g)
    .map((v) => v.trim())
    .filter(Boolean);
}

export const DEBUG_ALLOWED_DEVICES = parseDeviceList(process.env.MONVIEW_DEBUG_DEVICES);

function serialMatchesRule(udid: string, rule: string): boolean {
  const a = udid.trim().toLowerCase();
  const b = rule.trim().toLowerCase();
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 8 && b.length >= 8 && (a.endsWith(b) || b.endsWith(a))) return true;
  return false;
}

export function isDeviceAllowed(udid: string): boolean {
  return DEBUG_ALLOWED_DEVICES.length === 0 || DEBUG_ALLOWED_DEVICES.some((rule) => serialMatchesRule(udid, rule));
}

export function allowedDevicesLabel(): string {
  return DEBUG_ALLOWED_DEVICES.length === 0 ? 'ALL' : DEBUG_ALLOWED_DEVICES.join(',');
}

export class DeviceStepLogger {
  #step = 0;
  #started = Date.now();

  constructor(private readonly udid: string, private readonly sessionId: string) {}

  step(name: string, details?: Record<string, unknown> | string) {
    this.#step += 1;
    const elapsed = Date.now() - this.#started;
    const suffix = typeof details === 'string'
      ? ` | ${details}`
      : details
        ? ` | ${JSON.stringify(details)} `
        : '';
    log(this.udid, `[TRACE ${this.sessionId}] step=${String(this.#step).padStart(2, '0')} +${elapsed}ms ${name}${suffix}`);
  }

  warn(name: string, details?: Record<string, unknown> | string) {
    const elapsed = Date.now() - this.#started;
    const suffix = typeof details === 'string'
      ? ` | ${details}`
      : details
        ? ` | ${JSON.stringify(details)}`
        : '';
    warn(this.udid, `[TRACE ${this.sessionId}] WARN +${elapsed}ms ${name}${suffix}`);
  }
}
