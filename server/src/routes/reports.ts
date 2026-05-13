/**
 * Reports API Routes
 *
 * POST   /api/reports       - Submit user report (rate limited, validated)
 * GET    /api/reports       - List reports (auth required)
 * PATCH  /api/reports/:id   - Approve/reject report (auth required)
 */

import { Router } from 'express';
import db from '../database.js';
import { requireAuth } from '../middleware/auth.js';
import { reportLimiter, dailyReportLimiter } from '../middleware/rateLimit.js';
import { validateReport } from '../middleware/validate.js';
import crypto from 'crypto';

const router = Router();

/* ===== POST /api/reports ===== */
router.post('/',
  reportLimiter,
  dailyReportLimiter,
  validateReport,
  (req, res) => {
    const { gameSlug, code, description, reward, sourceUrl } = req.body;
    const reporterIp = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    const reporterHash = crypto.createHash('sha256').update(reporterIp).digest('hex').slice(0, 16);

    // Check if game exists
    const game = db.prepare('SELECT slug FROM games WHERE slug = ?').get(gameSlug);
    if (!game) {
      res.status(400).json({ error: 'Invalid game selected.' });
      return;
    }

    // Check if coupon already exists (auto-merge if so)
    const existing = db.prepare(
      'SELECT id FROM coupons WHERE game_slug = ? AND code = ?'
    ).get(gameSlug, code);

    if (existing) {
      res.status(409).json({
        error: 'This coupon code is already registered.',
        existingCode: true,
      });
      return;
    }

    // Check for recent duplicate reports (same code within 24h)
    const recentDupe = db.prepare(`
      SELECT id FROM reports
      WHERE game_slug = ? AND code = ? AND created_at > datetime('now', '-24 hours')
    `).get(gameSlug, code);

    if (recentDupe) {
      res.status(409).json({
        error: 'This code was recently reported and is under review.',
      });
      return;
    }

    // Check daily report count for this IP
    const todayCount = db.prepare(`
      SELECT COUNT(*) as cnt FROM reports
      WHERE reporter_hash = ? AND created_at > datetime('now', '-24 hours')
    `).get(reporterHash) as { cnt: number };

    if (todayCount.cnt >= 20) {
      res.status(429).json({ error: 'Daily report limit reached.' });
      return;
    }

    // Insert report
    const result = db.prepare(`
      INSERT INTO reports (game_slug, code, description, reward, source_url, reporter_ip, reporter_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      gameSlug, code,
      description || '', reward || '', sourceUrl || '',
      reporterIp, reporterHash,
    );

    res.status(201).json({
      success: true,
      reportId: result.lastInsertRowid,
      message: 'Report submitted successfully. It will be reviewed shortly.',
    });
  }
);

/* ===== GET /api/reports ===== */
router.get('/', requireAuth, (req, res) => {
  const { status = 'pending', page = '1', limit = '50' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
  const offset = (pageNum - 1) * limitNum;

  let where = '';
  const params: unknown[] = [];

  if (status !== 'all') {
    where = 'WHERE status = ?';
    params.push(status);
  }

  const countRow = db.prepare(
    `SELECT COUNT(*) as total FROM reports ${where}`
  ).get(...params) as { total: number };

  const rows = db.prepare(`
    SELECT r.*, g.name_en as game_name
    FROM reports r
    LEFT JOIN games g ON r.game_slug = g.slug
    ${where}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limitNum, offset) as Record<string, unknown>[];

  res.json({
    reports: rows.map(r => ({
      id: r.id,
      gameSlug: r.game_slug,
      gameName: r.game_name,
      code: r.code,
      description: r.description,
      reward: r.reward,
      sourceUrl: r.source_url,
      status: r.status,
      rejectReason: r.reject_reason,
      createdAt: r.created_at,
      reviewedAt: r.reviewed_at,
    })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: countRow.total,
      totalPages: Math.ceil(countRow.total / limitNum),
    },
  });
});

/* ===== PATCH /api/reports/:id ===== */
router.patch('/:id', requireAuth, (req, res) => {
  const { status, rejectReason } = req.body;
  const reportId = req.params.id;

  if (!['approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
    return;
  }

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId) as Record<string, unknown> | undefined;
  if (!report) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }

  if (report.status !== 'pending') {
    res.status(400).json({ error: 'Report already reviewed' });
    return;
  }

  const tx = db.transaction(() => {
    // Update report status
    db.prepare(`
      UPDATE reports SET status = ?, reject_reason = ?, reviewed_at = datetime('now')
      WHERE id = ?
    `).run(status, rejectReason || '', reportId);

    // If approved, create the coupon
    if (status === 'approved') {
      const today = new Date().toISOString().split('T')[0];
      const couponId = `${report.game_slug}-${(report.code as string).toLowerCase()}-${Date.now()}`;

      db.prepare(`
        INSERT OR IGNORE INTO coupons (id, game_slug, code, description, description_en,
          reward, issued_date, source, source_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'community', ?)
      `).run(
        couponId,
        report.game_slug,
        report.code,
        report.description || `${report.game_slug} coupon`,
        report.description || `${report.game_slug} coupon`,
        report.reward || '',
        today,
        report.source_url || '',
      );
    }
  });

  tx();

  res.json({
    success: true,
    reportId,
    status,
    ...(status === 'approved' ? { couponCreated: true } : {}),
  });
});

export default router;
