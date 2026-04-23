/**
 * Gvault Coupon Scraper — Playwright Edition
 * 
 * Uses headless Chromium to bypass JS bot challenges on nitter/arca.live
 * Designed to run on the production server via cron
 * 
 * Run: node scripts/scrape-coupons.mjs
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_DIR = join(__dirname, '..');
const COUPONS_PATH = join(REPO_DIR, 'src', 'data', 'coupons.json');
const GAMES_PATH = join(REPO_DIR, 'src', 'data', 'games.json');

/* ===== Game Scrape Configs ===== */
const GAME_CONFIGS = [
  {
    slug: 'ark-recode',
    name: 'Ark Re:Code',
    urls: [
      { type: 'nitter', url: 'https://nitter.net/ArkRecodeKR' },
      { type: 'arca', url: 'https://arca.live/b/codeark?category=%EC%BF%A0%ED%8F%B0' },
    ],
    patterns: [/\bArk[A-Za-z0-9]{4,}\b/g],
    exclude: ['ArkRecodeKR', 'ArkRecode', 'ArkReCode'],
  },
  {
    slug: 'tenkafuma',
    name: 'TenkafuMA',
    urls: [
      { type: 'nitter', url: 'https://nitter.net/TenkafumaK' },
      { type: 'arca', url: 'https://arca.live/b/tenkafumaa?target=all&keyword=%EC%BD%94%EB%93%9C&category=info' },
    ],
    patterns: null,
    exclude: ['TenkafumaK', 'Tenkafuma', 'TenkafuMA'],
  },
  {
    slug: 'rise-of-eros',
    name: 'Rise of Eros',
    urls: [
      { type: 'nitter', url: 'https://nitter.net/RiseofEros' },
      { type: 'arca', url: 'https://arca.live/b/riseoferos?category=%EC%BF%A0%ED%8F%B0' },
    ],
    patterns: null,
    exclude: ['RiseofEros', 'RiseOfEros'],
  },
  {
    slug: 'cherrytale',
    name: 'CherryTale',
    urls: [
      { type: 'nitter', url: 'https://nitter.net/CherryTale' },
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
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function randomSleep(minMs, maxMs) {
  return sleep(Math.floor(Math.random() * (maxMs - minMs)) + minMs);
}

/**
 * Extract coupon codes from page text
 */
function extractCodes(text, patterns, exclude) {
  const codes = new Set();
  const excludeSet = new Set(exclude || []);

  if (patterns) {
    // Specific regex patterns
    for (const p of patterns) {
      p.lastIndex = 0;
      let m;
      while ((m = p.exec(text)) !== null) {
        const code = m[0];
        if (code.length >= 5 && code.length <= 25 && !excludeSet.has(code)) {
          codes.add(code);
        }
      }
    }
  } else {
    // Generic: look for codes near coupon keywords
    const kwRegex = /(?:쿠폰|코드|coupon|code|보물코드|리딤코드|redeem|교환|입력)/gi;
    let kw;
    while ((kw = kwRegex.exec(text)) !== null) {
      const nearby = text.slice(kw.index, kw.index + 300);
      const codeRx = /\b([A-Za-z0-9]{6,25})\b/g;
      let cm;
      while ((cm = codeRx.exec(nearby)) !== null) {
        const c = cm[1];
        if (/[A-Za-z]/.test(c) && /[0-9]/.test(c) && !excludeSet.has(c)) {
          codes.add(c);
        }
      }
    }
  }

  return [...codes];
}

/* ===== Scrape a single page with Playwright ===== */
async function scrapePage(page, url, timeout = 30000) {
  try {
    console.log(`   📡 ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });

    // Wait for content to load (handles JS challenges)
    await sleep(3000);

    // Check for bot challenge and wait
    const title = await page.title();
    if (title.includes('bot') || title.includes('Making sure') || title.includes('challenge')) {
      console.log('   ⏳ Bot challenge detected, waiting...');
      try {
        await page.waitForFunction(
          () => {
            const t = document.title.toLowerCase();
            return !t.includes('bot') && !t.includes('making sure') && !t.includes('challenge');
          },
          { timeout: 45000 }
        );
        console.log('   ✅ Challenge passed');
        await sleep(2000);
      } catch {
        console.log('   ❌ Challenge timeout');
        return null;
      }
    }

    // Get visible text content
    const text = await page.evaluate(() => document.body.innerText);
    return text;
  } catch (e) {
    console.log(`   ❌ ${e.message}`);
    return null;
  }
}

/* ===== Scrape arca.live posts ===== */
async function scrapeArcaPosts(page, listUrl, boardSlug, patterns, exclude) {
  const text = await scrapePage(page, listUrl);
  if (!text) return [];

  // For games with specific patterns, check listing page directly
  if (patterns) {
    const codes = extractCodes(text, patterns, exclude);
    if (codes.length > 0) return codes;
  }

  // Get post links from the page HTML
  const postIds = await page.evaluate((slug) => {
    const links = [];
    const seen = new Set();
    const re = new RegExp(`/b/${slug}/(\\d{6,})`);
    document.querySelectorAll('a[href]').forEach(a => {
      const m = a.href.match(re);
      if (m && !seen.has(m[1])) { seen.add(m[1]); links.push(m[1]); }
    });
    return links.slice(0, 8);
  }, boardSlug);

  console.log(`   📋 ${postIds.length} posts on page 1`);

  const allCodes = [];
  for (const pid of postIds.slice(0, 5)) {
    await randomSleep(1500, 3500);
    const postText = await scrapePage(page, `https://arca.live/b/${boardSlug}/${pid}`, 20000);
    if (postText) {
      const codes = extractCodes(postText, patterns, exclude);
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
  try { existingCoupons = JSON.parse(readFileSync(COUPONS_PATH, 'utf8')); } catch { /* empty */ }
  const existingCodes = new Set(existingCoupons.map(c => c.code));
  const newCoupons = [];
  const today = new Date().toISOString().split('T')[0];

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'ko-KR',
  });

  const page = await context.newPage();

  try {
    for (const config of GAME_CONFIGS) {
      console.log(`🎮 ${config.name} (${config.slug})`);
      let foundCodes = [];

      for (const src of config.urls) {
        await randomSleep(2000, 5000);

        if (src.type === 'nitter') {
          const text = await scrapePage(page, src.url);
          if (text) {
            const codes = extractCodes(text, config.patterns, config.exclude);
            foundCodes.push(...codes);
            console.log(`   Found ${codes.length} codes from nitter`);
          }
        } else if (src.type === 'arca') {
          const boardSlug = src.url.match(/\/b\/([^/?]+)/)?.[1] || '';
          const codes = await scrapeArcaPosts(page, src.url, boardSlug, config.patterns, config.exclude);
          foundCodes.push(...codes);
          console.log(`   Found ${codes.length} codes from arca.live`);
        }

        // If we found codes, no need to try more sources
        if (foundCodes.length > 0) break;
      }

      foundCodes = [...new Set(foundCodes)];

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
            sourceUrl: config.urls[0].url,
          });
          existingCodes.add(code);
          console.log(`   ✅ NEW: ${code}`);
        }
      }
      console.log('');
    }
  } finally {
    await browser.close();
  }

  // Save
  if (newCoupons.length > 0) {
    const all = [...existingCoupons, ...newCoupons];
    writeFileSync(COUPONS_PATH, JSON.stringify(all, null, 2) + '\n');
    console.log(`📝 +${newCoupons.length} coupons (total: ${all.length})`);
  } else {
    console.log('📝 No new coupons');
  }

  // Update game coupon counts
  try {
    const games = JSON.parse(readFileSync(GAMES_PATH, 'utf8'));
    const all = JSON.parse(readFileSync(COUPONS_PATH, 'utf8'));
    for (const g of games) {
      g.activeCouponCount = all.filter(c => c.gameSlug === g.slug && !c.expired).length;
    }
    writeFileSync(GAMES_PATH, JSON.stringify(games, null, 2) + '\n');
  } catch { /* ignore */ }

  // Git commit & push if there are changes
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
