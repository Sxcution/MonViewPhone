import { config } from '../config.js';

export const logger = {
  info: (message: string, ...meta: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...sanitizeMeta(meta));
  },
  warn: (message: string, ...meta: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...sanitizeMeta(meta));
  },
  error: (message: string, error?: any, ...meta: any[]) => {
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`,
      error instanceof Error ? { message: error.message, stack: error.stack } : error,
      ...sanitizeMeta(meta)
    );
  },
  debug: (message: string, ...meta: any[]) => {
    if (config.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...sanitizeMeta(meta));
    }
  },
};

function sanitizeMeta(meta: any[]): any[] {
  return meta.map((item) => {
    if (typeof item === 'object' && item !== null) {
      const copy = { ...item };
      // Redact sensitive keys
      const sensitiveKeys = ['authorization', 'token', 'key', 'secret', 'password', 'mcp_auth_token'];
      for (const k of Object.keys(copy)) {
        if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
          copy[k] = '[REDACTED]';
        }
      }
      return copy;
    }
    if (typeof item === 'string') {
      // Check if it looks like a bearer token
      if (item.toLowerCase().startsWith('bearer ')) {
        return 'Bearer [REDACTED]';
      }
    }
    return item;
  });
}
