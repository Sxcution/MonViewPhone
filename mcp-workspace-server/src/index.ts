import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { authMiddleware } from './auth.js';
import { mcpServer } from './server.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

const app = express();

// Configure CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Location'],
  })
);

// Body parser
app.use(express.json());

// Active SSE transports mapping session ID -> transport
const activeTransports = new Map<string, SSEServerTransport>();

// Unauthenticated health endpoint
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    name: 'workspace-mcp-server',
    version: '1.0.0',
    workspaceRoot: config.WORKSPACE_ROOT,
  });
});

// Authenticated MCP SSE Stream Endpoint
app.get('/mcp', authMiddleware, async (req, res) => {
  logger.info('Client establishing SSE connection on /mcp');
  
  // Create transport indicating POST endpoint
  const transport = new SSEServerTransport('/messages', res);
  
  try {
    await mcpServer.connect(transport);
    const sessionId = transport.sessionId;
    activeTransports.set(sessionId, transport);
    logger.info(`MCP Session ${sessionId} created and connected.`);
    
    transport.onclose = () => {
      logger.info(`MCP Session ${sessionId} closed.`);
      activeTransports.delete(sessionId);
    };
  } catch (err: any) {
    logger.error('Failed to connect SSE transport to MCP server', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error establishing MCP session' });
    }
  }
});

// Authenticated MCP Message Post Endpoint
app.post('/messages', authMiddleware, async (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId || typeof sessionId !== 'string') {
    logger.warn('Received /messages POST without valid sessionId');
    return res.status(400).json({ error: 'Missing sessionId query parameter' });
  }

  const transport = activeTransports.get(sessionId);
  if (!transport) {
    logger.warn(`Received message for untracked or expired session: ${sessionId}`);
    return res.status(404).json({ error: 'Session not found or has expired' });
  }

  try {
    await transport.handlePostMessage(req, res, req.body);
  } catch (err: any) {
    logger.error(`Error handling message for session ${sessionId}`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process message' });
    }
  }
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled server error', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
const port = config.PORT;
app.listen(port, '0.0.0.0', () => {
  logger.info(`MCP Workspace Server is listening on port ${port}`);
  logger.info(`Health check: http://localhost:${port}/health`);
  logger.info(`MCP endpoint: http://localhost:${port}/mcp`);
  logger.info(`Target workspace: ${config.WORKSPACE_ROOT}`);
});
