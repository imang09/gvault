/**
 * Games API Routes
 *
 * GET /api/games       - List all games (with dynamic activeCouponCount)
 * GET /api/games/:slug - Get game detail
 */

import { Router } from 'express';
import db from '../database.js';

const router = Router();

/* ===== GET /api/games ===== */
router.get('/', (req, res) => {
  const { includeShutdown } = req.query;

  let query = `
    SELECT g.*,
      COALESCE(c.active_count, 0) as active_coupon_count
    FROM games g
    LEFT JOIN (
      SELECT game_slug, COUNT(*) as active_count
      FROM coupons
      WHERE expired = 0
      GROUP BY game_slug
    ) c ON g.slug = c.game_slug
  `;

  if (includeShutdown !== 'true') {
    query += ' WHERE g.is_shutdown = 0';
  }

  query += ' ORDER BY g.name_en ASC';

  const rows = db.prepare(query).all() as Record<string, unknown>[];
  const games = rows.map(toGameResponse);

  res.json(games);
});

/* ===== GET /api/games/:slug ===== */
router.get('/:slug', (req, res) => {
  const row = db.prepare(`
    SELECT g.*,
      COALESCE(c.active_count, 0) as active_coupon_count
    FROM games g
    LEFT JOIN (
      SELECT game_slug, COUNT(*) as active_count
      FROM coupons
      WHERE expired = 0
      GROUP BY game_slug
    ) c ON g.slug = c.game_slug
    WHERE g.slug = ?
  `).get(req.params.slug) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  res.json(toGameResponse(row));
});

/* ===== Helpers ===== */

function toGameResponse(row: Record<string, unknown>) {
  return {
    slug: row.slug,
    name: row.name,
    nameEn: row.name_en,
    thumbnail: row.thumbnail || '',
    platforms: safeJsonParse(row.platforms as string, []),
    webPlayable: row.web_playable === 1,
    webPlayUrl: row.web_play_url || '',
    officialSite: row.official_site || '',
    storeLinks: safeJsonParse(row.store_links as string, {}),
    releaseDate: row.release_date || '',
    genre: row.genre || '',
    activeCouponCount: row.active_coupon_count as number,
    isShutdown: row.is_shutdown === 1,
    shutdownDate: row.shutdown_date || undefined,
    description: row.description || '',
    descriptionEn: row.description_en || '',
    // Memorial fields
    developer: row.developer || '',
    peakPlayers: row.peak_players || '',
    lastEvent: row.last_event || '',
    lastEventEn: row.last_event_en || '',
    shutdownReason: row.shutdown_reason || '',
    shutdownReasonEn: row.shutdown_reason_en || '',
    timeline: safeJsonParse(row.timeline as string, []),
  };
}

function safeJsonParse(str: string | null | undefined, fallback: unknown): unknown {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export default router;
