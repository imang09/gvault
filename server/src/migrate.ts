/**
 * Data Migration Script
 *
 * Migrates existing JSON data (games.json, coupons.json) to SQLite.
 * Run once: npx tsx src/migrate.ts
 */

import db from './database.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_DIR = join(__dirname, '..', '..');
const GAMES_PATH = join(REPO_DIR, 'src', 'data', 'games.json');
const COUPONS_PATH = join(REPO_DIR, 'src', 'data', 'coupons.json');

interface GameJson {
  slug: string;
  name: string;
  nameEn: string;
  thumbnail?: string;
  platforms?: string[];
  webPlayable?: boolean;
  webPlayUrl?: string;
  officialSite?: string;
  storeLinks?: Record<string, string>;
  releaseDate?: string;
  genre?: string;
  activeCouponCount?: number;
  isShutdown?: boolean;
  shutdownDate?: string;
  description?: string;
  descriptionEn?: string;
  developer?: string;
  peakPlayers?: string;
  lastEvent?: string;
  lastEventEn?: string;
  shutdownReason?: string;
  shutdownReasonEn?: string;
  timeline?: { date: string; event: string; eventEn?: string }[];
}

interface CouponJson {
  id: string;
  gameSlug: string;
  code: string;
  description?: string;
  descriptionEn?: string;
  issuedDate: string;
  expiryDate?: string | null;
  expired?: boolean;
  source?: string;
  sourceUrl?: string;
}

function migrateGames() {
  console.log('📦 Migrating games...');
  const games: GameJson[] = JSON.parse(readFileSync(GAMES_PATH, 'utf8'));

  const insert = db.prepare(`
    INSERT OR REPLACE INTO games (slug, name, name_en, thumbnail, platforms,
      web_playable, web_play_url, official_site, store_links,
      release_date, genre, description, description_en,
      is_shutdown, shutdown_date, developer, peak_players,
      last_event, last_event_en, shutdown_reason, shutdown_reason_en, timeline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const g of games) {
      insert.run(
        g.slug,
        g.name,
        g.nameEn || g.name,
        g.thumbnail || '',
        JSON.stringify(g.platforms || []),
        g.webPlayable ? 1 : 0,
        g.webPlayUrl || '',
        g.officialSite || '',
        JSON.stringify(g.storeLinks || {}),
        g.releaseDate || '',
        g.genre || '',
        g.description || '',
        g.descriptionEn || '',
        g.isShutdown ? 1 : 0,
        g.shutdownDate || null,
        g.developer || '',
        g.peakPlayers || '',
        g.lastEvent || '',
        g.lastEventEn || '',
        g.shutdownReason || '',
        g.shutdownReasonEn || '',
        JSON.stringify(g.timeline || []),
      );
    }
  });

  tx();
  console.log(`  ✅ ${games.length} games migrated`);
}

function migrateCoupons() {
  console.log('📦 Migrating coupons...');
  const coupons: CouponJson[] = JSON.parse(readFileSync(COUPONS_PATH, 'utf8'));

  const insert = db.prepare(`
    INSERT OR IGNORE INTO coupons (id, game_slug, code, description, description_en,
      issued_date, expiry_date, expired, source, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  let skipped = 0;

  const tx = db.transaction(() => {
    for (const c of coupons) {
      const result = insert.run(
        c.id,
        c.gameSlug,
        c.code,
        c.description || '',
        c.descriptionEn || '',
        c.issuedDate,
        c.expiryDate || null,
        c.expired ? 1 : 0,
        c.source || 'other',
        c.sourceUrl || '',
      );

      if (result.changes > 0) {
        inserted++;
      } else {
        skipped++;
      }
    }
  });

  tx();
  console.log(`  ✅ ${inserted} coupons migrated, ${skipped} skipped (duplicates)`);
}

function main() {
  console.log('🔄 Starting data migration...\n');

  migrateGames();
  migrateCoupons();

  // Verify
  const gameCount = (db.prepare('SELECT COUNT(*) as cnt FROM games').get() as { cnt: number }).cnt;
  const couponCount = (db.prepare('SELECT COUNT(*) as cnt FROM coupons').get() as { cnt: number }).cnt;

  console.log(`\n📊 Verification:`);
  console.log(`  Games:   ${gameCount}`);
  console.log(`  Coupons: ${couponCount}`);
  console.log('\n✅ Migration complete!');
}

main();
