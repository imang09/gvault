/**
 * Gvault API - Database Layer
 *
 * SQLite setup with automatic schema migration.
 * Uses better-sqlite3 for synchronous, high-performance access.
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// DB path: configurable via env, defaults to server/data/gvault.db
const DB_DIR = process.env.DB_DIR || join(__dirname, '..', 'data');
const DB_PATH = process.env.DB_PATH || join(DB_DIR, 'gvault.db');

// Ensure data directory exists
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* ===== Schema Migration ===== */

function migrate() {
  db.exec(`
    -- Games table
    CREATE TABLE IF NOT EXISTS games (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_en TEXT NOT NULL DEFAULT '',
      thumbnail TEXT DEFAULT '',
      platforms TEXT DEFAULT '[]',
      web_playable INTEGER DEFAULT 0,
      web_play_url TEXT DEFAULT '',
      official_site TEXT DEFAULT '',
      store_links TEXT DEFAULT '{}',
      release_date TEXT,
      genre TEXT DEFAULT '',
      description TEXT DEFAULT '',
      description_en TEXT DEFAULT '',
      is_shutdown INTEGER DEFAULT 0,
      shutdown_date TEXT,
      developer TEXT DEFAULT '',
      peak_players TEXT DEFAULT '',
      last_event TEXT DEFAULT '',
      last_event_en TEXT DEFAULT '',
      shutdown_reason TEXT DEFAULT '',
      shutdown_reason_en TEXT DEFAULT '',
      timeline TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Coupons table
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      game_slug TEXT NOT NULL REFERENCES games(slug),
      code TEXT NOT NULL,
      description TEXT DEFAULT '',
      description_en TEXT DEFAULT '',
      reward TEXT DEFAULT '',
      reward_en TEXT DEFAULT '',
      issued_date TEXT NOT NULL,
      expiry_date TEXT,
      expired INTEGER DEFAULT 0,
      verified INTEGER DEFAULT 0,
      source TEXT DEFAULT 'scraper',
      source_url TEXT DEFAULT '',
      confidence REAL DEFAULT 1.0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(game_slug, code)
    );

    -- User reports table
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_slug TEXT NOT NULL,
      code TEXT NOT NULL,
      description TEXT DEFAULT '',
      reward TEXT DEFAULT '',
      source_url TEXT DEFAULT '',
      reporter_ip TEXT,
      reporter_hash TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      reject_reason TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      reviewed_at TEXT
    );

    -- Scrape logs table
    CREATE TABLE IF NOT EXISTS scrape_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_slug TEXT NOT NULL,
      source TEXT NOT NULL,
      codes_found INTEGER DEFAULT 0,
      codes_new INTEGER DEFAULT 0,
      error TEXT,
      duration_ms INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_coupons_game ON coupons(game_slug);
    CREATE INDEX IF NOT EXISTS idx_coupons_expired ON coupons(expired);
    CREATE INDEX IF NOT EXISTS idx_coupons_issued ON coupons(issued_date);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_scrape_logs_date ON scrape_logs(created_at);
  `);

  console.log('✅ Database schema migrated');
}

// Run migration on import
migrate();

export default db;
export { DB_PATH };
