/**
 * Coupons API Routes
 *
 * GET    /api/coupons         - List with filters (game, status, page)
 * GET    /api/coupons/:id     - Get single coupon
 * POST   /api/coupons         - Add single coupon (auth)
 * POST   /api/coupons/batch   - Add multiple coupons (auth)
 * PATCH  /api/coupons/:id     - Update coupon (auth)
 * DELETE /api/coupons/:id     - Delete coupon (auth)
 */

import { Router } from 'express';
import db from '../database.js';
import { requireAuth } from '../middleware/auth.js';
import { validateCoupon, validateBatchCoupons } from '../middleware/validate.js';

const router = Router();

/* ===== GET /api/coupons ===== */
router.get('/', (req, res) => {
  const {
    game,
    status,    // 'active' | 'expired' | 'all'
    page = '1',
    limit = '50',
    sort = 'issued_date',
    order = 'desc',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
  const offset = (pageNum - 1) * limitNum;

  // Build WHERE clause
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (game && game !== 'all') {
    conditions.push('game_slug = ?');
    params.push(game);
  }

  if (status === 'active') {
    conditions.push('expired = 0');
  } else if (status === 'expired') {
    conditions.push('expired = 1');
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Allowed sort columns
  const allowedSorts = ['issued_date', 'created_at', 'code', 'game_slug'];
  const sortCol = allowedSorts.includes(sort as string) ? sort : 'issued_date';
  const sortOrder = (order as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Count total
  const countRow = db.prepare(`SELECT COUNT(*) as total FROM coupons ${where}`).get(...params) as { total: number };

  // Fetch page
  const rows = db.prepare(
    `SELECT * FROM coupons ${where} ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`
  ).all(...params, limitNum, offset);

  // Convert DB rows to camelCase API response
  const coupons = (rows as Record<string, unknown>[]).map(toCamelCase);

  res.json({
    coupons,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: countRow.total,
      totalPages: Math.ceil(countRow.total / limitNum),
    },
  });
});

/* ===== GET /api/coupons/:id ===== */
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id);
  if (!row) {
    res.status(404).json({ error: 'Coupon not found' });
    return;
  }
  res.json(toCamelCase(row as Record<string, unknown>));
});

/* ===== POST /api/coupons ===== */
router.post('/', requireAuth, validateCoupon, (req, res) => {
  const {
    gameSlug, code, description, descriptionEn,
    reward, rewardEn, issuedDate, expiryDate,
    source, sourceUrl, confidence,
  } = req.body;

  const id = `${gameSlug}-${code.toLowerCase()}-${Date.now()}`;

  try {
    db.prepare(`
      INSERT INTO coupons (id, game_slug, code, description, description_en, reward, reward_en,
        issued_date, expiry_date, source, source_url, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, gameSlug, code,
      description || '', descriptionEn || '',
      reward || '', rewardEn || '',
      issuedDate, expiryDate || null,
      source || 'scraper', sourceUrl || '',
      confidence ?? 1.0,
    );

    res.status(201).json({ id, code, gameSlug, created: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE')) {
      res.status(409).json({ error: 'Coupon already exists', code, gameSlug });
    } else {
      throw err;
    }
  }
});

/* ===== POST /api/coupons/batch ===== */
router.post('/batch', requireAuth, validateBatchCoupons, (req, res) => {
  const { coupons } = req.body;
  const today = new Date().toISOString().split('T')[0];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO coupons (id, game_slug, code, description, description_en,
      reward, reward_en, issued_date, expiry_date, source, source_url, confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const results = { inserted: 0, skipped: 0, codes: [] as string[] };

  const tx = db.transaction(() => {
    for (const c of coupons) {
      const id = c.id || `${c.gameSlug}-${c.code.toLowerCase()}-${Date.now()}`;
      const result = insert.run(
        id, c.gameSlug, c.code,
        c.description || '', c.descriptionEn || '',
        c.reward || '', c.rewardEn || '',
        c.issuedDate || today, c.expiryDate || null,
        c.source || 'scraper', c.sourceUrl || '',
        c.confidence ?? 1.0,
      );

      if (result.changes > 0) {
        results.inserted++;
        results.codes.push(c.code);
      } else {
        results.skipped++;
      }
    }
  });

  tx();

  res.json(results);
});

/* ===== PATCH /api/coupons/:id ===== */
router.patch('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Coupon not found' });
    return;
  }

  const allowed = ['description', 'description_en', 'reward', 'reward_en',
    'expiry_date', 'expired', 'verified', 'source', 'source_url', 'confidence'];

  const updates: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(req.body)) {
    const dbKey = toSnakeCase(key);
    if (allowed.includes(dbKey)) {
      updates.push(`${dbKey} = ?`);
      values.push(value);
    }
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }

  updates.push("updated_at = datetime('now')");
  values.push(req.params.id);

  db.prepare(`UPDATE coupons SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id);
  res.json(toCamelCase(updated as Record<string, unknown>));
});

/* ===== DELETE /api/coupons/:id ===== */
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Coupon not found' });
    return;
  }
  res.json({ deleted: true, id: req.params.id });
});

/* ===== Helpers ===== */

function toCamelCase(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    // Convert SQLite integers to booleans for known fields
    if (['expired', 'verified'].includes(key)) {
      result[camelKey] = value === 1;
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

export default router;
