import { Request, Response, NextFunction } from 'express';
import { config } from './config.js';
import { logger } from './utils/logger.js';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn('Authentication failed: Missing Authorization header', {
      ip: req.ip,
      path: req.path,
    });
    return res.status(401).json({ error: 'Unauthorized: Missing Authorization header' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    logger.warn('Authentication failed: Invalid Authorization header format', {
      ip: req.ip,
      path: req.path,
    });
    return res.status(401).json({ error: 'Unauthorized: Format must be Bearer <token>' });
  }

  const token = parts[1];
  if (token !== config.MCP_AUTH_TOKEN) {
    logger.warn('Authentication failed: Invalid auth token', {
      ip: req.ip,
      path: req.path,
    });
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  // Token is valid
  next();
}
