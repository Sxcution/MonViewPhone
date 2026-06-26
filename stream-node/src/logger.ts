import { traceLine } from './traceFile.js';

export function log(scope: string, message: string, ...args: unknown[]) {
  const rendered = render(message, args);
  console.log(`[${new Date().toISOString()}] [${scope}] ${rendered}`);
  if (shouldTrace(scope, rendered)) traceLine(scope, rendered);
}

export function warn(scope: string, message: string, ...args: unknown[]) {
  const rendered = render(message, args);
  console.warn(`[${new Date().toISOString()}] [${scope}] ${rendered}`);
  if (shouldTrace(scope, rendered)) traceLine(scope, `WARN ${rendered}`);
}

export function error(scope: string, message: string, ...args: unknown[]) {
  const rendered = render(message, args);
  console.error(`[${new Date().toISOString()}] [${scope}] ${rendered}`);
  traceLine(scope, `ERROR ${rendered}`);
}

function render(message: string, args: unknown[]) {
  if (!args.length) return message;
  return `${message} ${args.map((arg) => {
    if (arg instanceof Error) return arg.stack || arg.message;
    if (typeof arg === 'string') return arg;
    try { return JSON.stringify(arg); } catch { return String(arg); }
  }).join(' ')}`;
}

function shouldTrace(scope: string, message: string) {
  return message.includes('[TRACE') ||
    message.includes('[WS]') ||
    message.includes('[QUEUE]') ||
    message.includes('[MANAGER]') ||
    message.includes('stream-node') ||
    scope === 'stream-node';
}
