/**
 * Auth Middleware
 *
 * Simple API key authentication for scraper and admin endpoints.
 * Public endpoints (GET) don't require auth.
 */

import type { Request, Response, NextFunction } from 'express';

const API_KEY = process.env.GVAULT_API_KEY || 'gvault-dev-key-change-me';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-api-key'] as string || req.query.apiKey as string;

  if (!key || key !== API_KEY) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
    return;
  }

  next();
}

export { API_KEY };
