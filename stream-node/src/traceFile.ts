import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TRACE_PATH = resolve(process.cwd(), '..', 'logs', 'stream-trace-current.log');
let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  mkdirSync(resolve(process.cwd(), '..', 'logs'), { recursive: true });
  writeFileSync(TRACE_PATH, `--- stream trace start ${new Date().toISOString()} ---\n`, 'utf8');
  initialized = true;
}

export function traceLine(scope: string, message: string) {
  ensureInitialized();
  appendFileSync(TRACE_PATH, `[${new Date().toISOString()}] [${scope}] ${message}\n`, 'utf8');
}

export function tracePath() {
  return TRACE_PATH;
}
