/**
 * Gvault API Server
 *
 * Express entry point. Serves:
 * - /api/* → REST API routes
 * - /* → Static React SPA (production)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

import db from './database.js';
import { generalLimiter } from './middleware/rateLimit.js';
import couponsRouter from './routes/coupons.js';
import gamesRouter from './routes/games.js';
import reportsRouter from './routes/reports.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

/* ===== Global Middleware ===== */

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Let the SPA handle CSP
  crossOriginEmbedderPolicy: false,
}));

// CORS (allow frontend dev server)
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-API-Key'],
}));

// Parse JSON body
app.use(express.json({ limit: '1mb' }));

// Trust proxy (for rate limiting behind K3S ingress)
app.set('trust proxy', 1);

// General rate limit
app.use('/api', generalLimiter);

/* ===== API Routes ===== */

app.use('/api/coupons', couponsRouter);
app.use('/api/games', gamesRouter);
app.use('/api/reports', reportsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Stats endpoint
app.get('/api/stats', (_req, res) => {
  const stats = {
    totalCoupons: (db.prepare('SELECT COUNT(*) as cnt FROM coupons').get() as { cnt: number }).cnt,
    activeCoupons: (db.prepare('SELECT COUNT(*) as cnt FROM coupons WHERE expired = 0').get() as { cnt: number }).cnt,
    totalGames: (db.prepare('SELECT COUNT(*) as cnt FROM games').get() as { cnt: number }).cnt,
    pendingReports: (db.prepare("SELECT COUNT(*) as cnt FROM reports WHERE status = 'pending'").get() as { cnt: number }).cnt,
    timestamp: new Date().toISOString(),
  };
  res.json(stats);
});

/* ===== Static File Serving (Production) ===== */

const publicDir = join(__dirname, '..', 'public');
if (existsSync(publicDir)) {
  app.use(express.static(publicDir, {
    maxAge: '30d',
    immutable: true,
    index: false, // We handle index manually for SPA
  }));

  // SPA fallback: all non-API routes → index.html
  app.get('{*path}', (req, res) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'API endpoint not found' });
      return;
    }
    res.sendFile(join(publicDir, 'index.html'));
  });
} else {
  console.log('ℹ️  No public/ directory found. Running in API-only mode.');
  app.get('{*path}', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.status(404).json({ error: 'Frontend not available. Build the SPA first.' });
      return;
    }
    res.status(404).json({ error: 'API endpoint not found' });
  });
}

/* ===== Error Handler ===== */

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

/* ===== Start Server ===== */

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Gvault API running on http://0.0.0.0:${PORT}`);
  console.log(`📂 Static files: ${existsSync(publicDir) ? publicDir : 'NOT FOUND'}`);
});
