import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { Server } from 'http';
import { authMiddleware } from '../src/auth.js';
import { config } from '../src/config.js';

describe('HTTP Endpoint & Authentication Tests', () => {
  let app: express.Express;
  let server: Server;
  const testPort = 13579;

  beforeAll(() => {
    app = express();
    
    // Health endpoint (no auth)
    app.get('/health', (req, res) => {
      res.json({ ok: true, name: 'workspace-mcp-server' });
    });

    // Dummy protected endpoint
    app.get('/mcp', authMiddleware, (req, res) => {
      res.json({ authenticated: true });
    });

    return new Promise<void>((resolve) => {
      server = app.listen(testPort, '127.0.0.1', () => {
        resolve();
      });
    });
  });

  afterAll(() => {
    return new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
  });

  it('should allow access to unauthenticated /health endpoint', async () => {
    const response = await fetch(`http://127.0.0.1:${testPort}/health`);
    expect(response.status).toBe(200);
    const body = await response.json() as any;
    expect(body.ok).toBe(true);
    expect(body.name).toBe('workspace-mcp-server');
  });

  it('should return 401 when Authorization header is missing', async () => {
    const response = await fetch(`http://127.0.0.1:${testPort}/mcp`);
    expect(response.status).toBe(401);
    const body = await response.json() as any;
    expect(body.error).toContain('Missing Authorization header');
  });

  it('should return 401 when Authorization format is invalid', async () => {
    const response = await fetch(`http://127.0.0.1:${testPort}/mcp`, {
      headers: {
        'Authorization': 'Basic dGVzdC10b2tlbg==',
      },
    });
    expect(response.status).toBe(401);
    const body = await response.json() as any;
    expect(body.error).toContain('Format must be Bearer');
  });

  it('should return 401 when token is incorrect', async () => {
    const response = await fetch(`http://127.0.0.1:${testPort}/mcp`, {
      headers: {
        'Authorization': 'Bearer wrong-token',
      },
    });
    expect(response.status).toBe(401);
    const body = await response.json() as any;
    expect(body.error).toContain('Invalid token');
  });

  it('should allow access when Bearer token is correct', async () => {
    const response = await fetch(`http://127.0.0.1:${testPort}/mcp`, {
      headers: {
        'Authorization': `Bearer ${config.MCP_AUTH_TOKEN}`,
      },
    });
    expect(response.status).toBe(200);
    const body = await response.json() as any;
    expect(body.authenticated).toBe(true);
  });
});
