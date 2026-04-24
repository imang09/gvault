/**
 * Gvault Coupon Scraper (Playwright)
 *
 * - nitter: instance rotation (primary → fallback)
 * - arca.live: listing page + individual post scraping
 * - Per-game page isolation to prevent context pollution
 * - Random delays + realistic Chrome UA for anti-bot
 *
 * Run: node scripts/scrape-coupons.mjs
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_DIR = process.env.REPO_DIR || join(__dirname, '..');
const COUPONS_PATH = join(REPO_DIR, 'src', 'data', 'coupons.json');
const GAMES_PATH = join(REPO_DIR, 'src', 'data', 'games.json');

/* ===== Nitter Instances (wiki 2026-04-17, working only) ===== */
const NITTER_INSTANCES = [
  'https://nitter.net',
  'https://nitter.poast.org',
  'https://nitter.privacydev.net',
  'https://xcancel.com',
  'https://nitter.cz',
];

/* ===== Game Scrape Configs ===== */
const GAME_CONFIGS = [
  {
    slug: 'ark-recode',
    name: 'Ark Re:Code',
    urls: [
      { type: 'nitter', handle: 'ArkRecodeKR' },
      { type: 'arca', url: 'https://arca.live/b/codeark?category=%EC%BF%A0%ED%8F%B0' },
    ],
    patterns: [/\bArk[A-Za-z0-9]{4,}\b/g],
    exclude: ['ArkRecodeKR', 'ArkRecode', 'ArkReCode'],
  },
  {
    slug: 'tenkafuma',
    name: 'TenkafuMA',
    urls: [
      { type: 'nitter', handle: 'TenkafumaK' },
      { type: 'arca', url: 'https://arca.live/b/tenkafumaa?target=all&keyword=%EC%BD%94%EB%93%9C&category=info' },
    ],
    patterns: null,
    exclude: ['TenkafumaK', 'Tenkafuma', 'TenkafuMA'],
  },
  {
    slug: 'rise-of-eros',
    name: 'Rise of Eros',
    urls: [
      { type: 'nitter', handle: 'RiseofEros' },
      { type: 'arca', url: 'https://arca.live/b/riseoferos?category=%EC%BF%A0%ED%8F%B0' },
    ],
    patterns: null,
    exclude: ['RiseofEros', 'RiseOfEros'],
  },
  {
    slug: 'cherrytale',
    name: 'CherryTale',
    urls: [
      { type: 'nitter', handle: 'CherryTale' },
      { type: 'arca', url: 'https://arca.live/b/cherrytale?category=%EC%BF%A0%ED%8F%B0' },
    ],
    patterns: [/\bCT[A-Za-z0-9]{4,}\b/g],
    exclude: ['CherryTale'],
  },
  {
    slug: 'throne-of-desire',
    name: 'Throne of Desire',
    urls: [
      { type: 'arca', url: 'https://arca.live/b/throneofdesire?category=Code' },
    ],
    patterns: [/\btod[A-Za-z0-9]{3,}\b/gi],
    exclude: [],
  },
  {
    slug: 'horizon-walker',
    name: 'Horizon Walker',
    urls: [
      { type: 'arca', url: 'https://arca.live/b/horizonwalker2?target=all&keyword=%EC%BF%A0%ED%8F%B0&category=8' },
    ],
    patterns: null,
    exclude: [],
  },
  {
    slug: 'star-lusts',
    name: 'Star Lusts',
    urls: [
      { type: 'arca', url: 'https://arca.live/b/lustsisters?category=%EC%BF%A0%ED%8F%B0' },
    ],
    patterns: null,
    exclude: [],
  },
  {
    slug: 'megaha-re',
    name: 'Megaha:RE',
    urls: [
      { type: 'arca', url: 'https://arca.live/b/megahare?category=gamenote' },
    ],
    patterns: null,
    exclude: [],
  },
  {
    slug: 'alliance-sages',
    name: 'Alliance Sages',
    urls: [
      { type: 'arca', url: 'https://arca.live/b/hyeonjadongmaeng?category=%EC%BF%A0%ED%8F%B0' },
    ],
    patterns: null,
    exclude: [],
  },
  {
    slug: 'ero-dorado',
    name: 'Ero Dorado',
    urls: [
      { type: 'arca', url: 'https://arca.live/b/pangeaodyssey?category=%EC%BF%A0%ED%8F%B0' },
    ],
    patterns: null,
    exclude: [],
  },
];

/* ===== Helpers ===== */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randomSleep = (min, max) =>
  sleep(Math.floor(Math.random() * (max - min)) + min);

/* ===== extractCodes ===== */
/**
 * Extract coupon codes from page text.
 * - patterns: use game-specific regex
 * - generic: scan 200 chars before and 500 chars after coupon keywords
 */
function extractCodes(text, patterns, exclude) {
  const codes = new Set();
  const excluded = new Set(exclude || []);

  if (patterns) {
    for (const p of patterns) {
      p.lastIndex = 0;
      let m;
      while ((m = p.exec(text)) !== null) {
        const code = m[0];
        if (code.length >= 5 && code.length <= 25 && !excluded.has(code)) {
          codes.add(code);
        }
      }
    }
  } else {
    // Generic: scan text around coupon-related keywords
    // Window: 200 chars before keyword + 500 chars after keyword
    const kwRegex = /(?:쿠폰|코드|coupon|code|보물코드|리딤코드|redeem|교환|입력)/gi;
    let kw;
    while ((kw = kwRegex.exec(text)) !== null) {
      const start = Math.max(0, kw.index - 200);
      const end = Math.min(text.length, kw.index + 500);
      const nearby = text.slice(start, end);
      const codeRx = /\b([A-Za-z0-9]{6,25})\b/g;
      let cm;
      while ((cm = codeRx.exec(nearby)) !== null) {
        const c = cm[1];
        // Must contain both letters AND digits (filters out plain words)
        if (/[A-Za-z]/.test(c) && /[0-9]/.test(c) && !excluded.has(c)) {
          codes.add(c);
        }
      }
    }
  }

  return [...codes];
}

/* ===== scrapePage ===== */
async function scrapePage(page, url, timeout = 30000) {
  try {
    console.log(`   📡 ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });

    // Wait for dynamic content (SPA), 10s max to avoid infinite polling
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Bot challenge detection (Cloudflare, Anubis, etc.)
    const title = await page.title();
    if (/bot|making sure|challenge|just a moment/i.test(title)) {
      console.log('   ⏳ Bot challenge detected, waiting...');
      try {
        await page.waitForFunction(
          () => !/bot|making sure|challenge|just a moment/i.test(document.title),
          { timeout: 45000 }
        );
        console.log('   ✅ Challenge passed');
        await sleep(2000);
      } catch {
        console.log('   ❌ Challenge timeout');
        return null;
      }
    }

    const text = await page.evaluate(() => document.body.innerText);
    if (!text || text.trim().length < 100) {
      console.log('   ⚠️  Empty or very short response');
      return null;
    }
    return text;
  } catch (e) {
    console.log(`   ❌ ${e.message}`);
    return null;
  }
}

/* ===== scrapeNitter (instance rotation) ===== */
/**
 * Try nitter instances in order. Treat responses < 500 chars as failures.
 */
async function scrapeNitter(page, handle, patterns, exclude) {
  for (const instance of NITTER_INSTANCES) {
    const url = `${instance}/${handle}`;
    const text = await scrapePage(page, url, 10000);

    if (text && text.length >= 500) {
      const codes = extractCodes(text, patterns, exclude);
      console.log(`   ✅ nitter OK (${instance}): ${codes.length} codes`);
      return codes;
    }

    console.log(`   ⚠️  ${instance} — bad response, trying next...`);
    await randomSleep(1000, 2500);
  }

  console.log(`   ❌ All nitter instances failed for @${handle}`);
  return [];
}

/* ===== scrapeArcaPosts ===== */
async function scrapeArcaPosts(page, listUrl, boardSlug, patterns, exclude) {
  const listText = await scrapePage(page, listUrl);
  if (!listText) return [];

  // For pattern games, try quick extract from listing page
  if (patterns) {
    const quickCodes = extractCodes(listText, patterns, exclude);
    if (quickCodes.length > 0) {
      console.log(`   ⚡ Quick extract from listing: ${quickCodes.length} codes`);
    }
  }

  // Collect post IDs (max 10)
  const postIds = await page.evaluate((slug) => {
    const links = [];
    const seen = new Set();
    const re = new RegExp(`/b/${slug}/(\\d{6,})`);
    document.querySelectorAll('a[href]').forEach((a) => {
      const m = a.href.match(re);
      if (m && !seen.has(m[1])) {
        seen.add(m[1]);
        links.push(m[1]);
      }
    });
    return links.slice(0, 10);
  }, boardSlug);

  console.log(`   📋 ${postIds.length} posts found`);

  const allCodes = [];

  // Also include listing page codes for pattern games
  if (patterns) {
    allCodes.push(...extractCodes(listText, patterns, exclude));
  }

  // Visit top 8 posts
  for (const pid of postIds.slice(0, 8)) {
    await randomSleep(1500, 3500);
    const postText = await scrapePage(
      page,
      `https://arca.live/b/${boardSlug}/${pid}`,
      20000
    );
    if (postText) {
      const codes = extractCodes(postText, patterns, exclude);
      if (codes.length > 0) {
        console.log(`   📄 Post ${pid}: ${codes.length} codes`);
      }
      allCodes.push(...codes);
    }
  }

  return [...new Set(allCodes)];
}

/* ===== Main ===== */
async function main() {
  console.log('🔍 Gvault Coupon Scraper (Playwright)');
  console.log(`📅 ${new Date().toISOString()}\n`);

  // Load existing coupons
  let existingCoupons = [];
  try {
    existingCoupons = JSON.parse(readFileSync(COUPONS_PATH, 'utf8'));
  } catch {
    console.log('ℹ️  No existing coupons file, starting fresh');
  }

  const existingCodes = new Set(existingCoupons.map((c) => c.code));
  const newCoupons = [];
  const today = new Date().toISOString().split('T')[0];
  const failedGames = [];

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  });

  try {
    for (const config of GAME_CONFIGS) {
      console.log(`\n🎮 ${config.name} (${config.slug})`);

      // New page per game to prevent context pollution
      const page = await context.newPage();
      let foundCodes = [];
      let gameSuccess = false;

      try {
        for (const src of config.urls) {
          await randomSleep(2000, 5000);

          let sourceCodes = [];

          if (src.type === 'nitter') {
            sourceCodes = await scrapeNitter(page, src.handle, config.patterns, config.exclude);
          } else if (src.type === 'arca') {
            const boardSlug = src.url.match(/\/b\/([^/?]+)/)?.[1] || '';
            sourceCodes = await scrapeArcaPosts(
              page, src.url, boardSlug, config.patterns, config.exclude
            );
            console.log(`   Found ${sourceCodes.length} codes from arca.live`);
          }

          foundCodes.push(...sourceCodes);

          // Skip remaining sources if enough codes found (≥5 reduces false positive risk)
          if (foundCodes.length >= 5) {
            console.log(`   ℹ️  Enough codes (${foundCodes.length}), skipping remaining sources`);
            break;
          }
        }

        gameSuccess = true;
      } catch (e) {
        console.log(`   ❌ Game scrape error: ${e.message}`);
        failedGames.push(config.slug);
      } finally {
        await page.close();
      }

      if (!gameSuccess) continue;

      foundCodes = [...new Set(foundCodes)];
      console.log(`   🔢 Total unique codes: ${foundCodes.length}`);

      for (const code of foundCodes) {
        if (!existingCodes.has(code)) {
          newCoupons.push({
            id: `${config.slug}-${code.toLowerCase()}-${Date.now()}`,
            gameSlug: config.slug,
            code,
            description: `${config.name} coupon`,
            descriptionEn: `${config.name} coupon`,
            issuedDate: today,
            expiryDate: null,
            expired: false,
            source: 'other',
            sourceUrl: config.urls[0].url || `https://nitter.net/${config.urls[0].handle || ''}`,
          });
          existingCodes.add(code);
          console.log(`   ✅ NEW: ${code}`);
        }
      }
    }
  } finally {
    await browser.close();
  }

  // Failure summary
  if (failedGames.length > 0) {
    console.log(`\n⚠️  Failed games: ${failedGames.join(', ')}`);
  }

  // Save
  if (newCoupons.length > 0) {
    const all = [...existingCoupons, ...newCoupons];
    writeFileSync(COUPONS_PATH, JSON.stringify(all, null, 2) + '\n');
    console.log(`\n📝 +${newCoupons.length} coupons (total: ${all.length})`);
  } else {
    console.log('\n📝 No new coupons');
  }

  // Update activeCouponCount
  try {
    const games = JSON.parse(readFileSync(GAMES_PATH, 'utf8'));
    const all = JSON.parse(readFileSync(COUPONS_PATH, 'utf8'));
    for (const g of games) {
      g.activeCouponCount = all.filter((c) => c.gameSlug === g.slug && !c.expired).length;
    }
    writeFileSync(GAMES_PATH, JSON.stringify(games, null, 2) + '\n');
  } catch { /* ignore */ }

  // Git push (only when new coupons found)
  if (newCoupons.length > 0) {
    try {
      console.log('\n📤 Pushing to GitHub...');
      execSync('git add src/data/coupons.json src/data/games.json', { cwd: REPO_DIR });
      execSync(`git commit -m "data: +${newCoupons.length} coupons ${today}"`, { cwd: REPO_DIR });
      execSync('git push origin main', { cwd: REPO_DIR });
      console.log('✅ Pushed to GitHub');
    } catch (e) {
      console.log(`❌ Git push failed: ${e.message}`);
    }
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);
