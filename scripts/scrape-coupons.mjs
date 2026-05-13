/**
 * Gvault Coupon Scraper (Playwright)
 *
 * - nitter: instance rotation (primary → fallback)
 * - arca.live: listing page + individual post scraping
 * - Per-game page isolation to prevent context pollution
 * - Random delays + realistic Chrome UA for anti-bot
 * - Results posted to API server (no more JSON files or git push)
 *
 * Run: node scripts/scrape-coupons.mjs
 */

import { chromium } from 'playwright';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { isXApiAvailable, scrapeXApi } from './x-api-scraper.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// API configuration
const API_BASE = process.env.GVAULT_API_URL || 'http://localhost:4000/api';
const API_KEY = process.env.GVAULT_API_KEY || 'gvault-dev-key-change-me';

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
      { type: 'x-api', handle: 'ArkRecodeKR' },
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
      { type: 'x-api', handle: 'TenkafumaK' },
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
      { type: 'x-api', handle: 'RiseofEros' },
      { type: 'nitter', handle: 'RiseofEros' },
      { type: 'arca', url: 'https://arca.live/b/riseoferos?category=%EC%BF%A0%ED%8F%B0' },
    ],
    patterns: null,
    articleExtract: true, // Line-based extraction from article body
    exclude: ['RiseofEros', 'RiseOfEros', 'EROLABS', 'riseoferos'],
  },
  {
    slug: 'cherrytale',
    name: 'CherryTale',
    urls: [
      { type: 'x-api', handle: 'CherryTale' },
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

/* ===== False-positive blocklist ===== */
const FP_BLOCKLIST = new Set([
  // UI / HTML
  'Continue', 'Download', 'Settings', 'Comments', 'Homepage', 'Category',
  'Bookmark', 'Subscribe', 'Unsubscribe', 'Recommend', 'Translate',
  'Previous', 'Notifications', 'LiveConfig', 'Arcalive', 'Compatible',
  'Application', 'NanumGothic', 'BlinkMacSystemFont', 'NanumBarunGothic',
  // Social / platform
  'Facebook', 'Twitter', 'YouTube', 'Instagram', 'Discord', 'Telegram',
  'TikTok', 'Pinterest', 'WhatsApp', 'Twitch',
  // Tech
  'Android', 'Windows', 'EROLABS', 'Samsung', 'iPhone',
  'ChromeOS', 'Mozilla', 'Firefox', 'Safari',
  // Common false matches
  'undefined', 'function', 'document', 'console', 'Object',
  'Seoulwork', 'Paraguay', 'PRIVACIDAD', 'LivePageAd',
]);

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
        if (/[A-Za-z]/.test(c) && /[0-9]/.test(c) && !excluded.has(c)) {
          codes.add(c);
        }
      }
    }
  }

  return [...codes];
}

/* ===== extractArticleBody ===== */
/**
 * Extract only the article body text from an arca.live post page.
 * Uses CSS selectors to isolate content from menus/sidebars.
 */
async function extractArticleBody(page) {
  return page.evaluate(() => {
    const selectors = [
      '.article-body',        // arca.live main
      '.article-content',
      '.fr-view',             // Froala editor
      'article .body',
      '.content-wrapper .body',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim().length > 20) return el.innerText;
    }
    // Fallback: full body
    return document.body.innerText;
  });
}

/* ===== isCouponLike ===== */
/**
 * Check if a token looks like a coupon code.
 * - Mixed case (upper+lower) or contains digits
 * - Not in blocklist
 * - Not a URL fragment
 */
function isCouponLike(token) {
  if (FP_BLOCKLIST.has(token)) return false;
  if (/^https?/i.test(token)) return false;
  if (/^(class|style|width|height|div|span|font|text|data|aria|src|href)/i.test(token)) return false;

  const hasUpper = /[A-Z]/.test(token);
  const hasLower = /[a-z]/.test(token);
  const hasDigit = /[0-9]/.test(token);

  // At least 2 of 3 character classes → looks like a code, not a normal word
  if ((hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + (hasDigit ? 1 : 0) >= 2) return true;

  // All-uppercase with hyphens (like YOU-FOUND-IT-ON-X)
  if (/^[A-Z][A-Z0-9]+(-[A-Z0-9]+)+$/.test(token)) return true;

  return false;
}

/* ===== extractCodesFromArticle ===== */
/**
 * Line-based code extraction for games without prefix patterns.
 * Scans each line of the article body for standalone code tokens.
 * Designed for codes like: cdY5hUJNZWj, AF26-R8P, YOU-FOUND-IT-ON-X
 */
function extractCodesFromArticle(text, exclude) {
  const codes = new Set();
  const excluded = new Set(exclude || []);
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  for (const line of lines) {
    // Skip long lines (paragraphs/sentences)
    if (line.length > 60) continue;

    // Split line into tokens
    const tokens = line.split(/[\s,;:|→·「」【】]+/);
    for (const raw of tokens) {
      const t = raw.trim();
      // Must be 7-25 chars, alphanumeric + hyphens only
      if (t.length < 7 || t.length > 25) continue;
      if (!/^[A-Za-z0-9-]+$/.test(t)) continue;
      if (excluded.has(t)) continue;
      if (!isCouponLike(t)) continue;

      codes.add(t);
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
async function scrapeArcaPosts(page, listUrl, boardSlug, config) {
  const { patterns, exclude, articleExtract } = config;
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

  // Include listing page codes for pattern games
  if (patterns) {
    allCodes.push(...extractCodes(listText, patterns, exclude));
  }

  // Visit top 8 posts
  for (const pid of postIds.slice(0, 8)) {
    await randomSleep(1500, 3500);

    const postUrl = `https://arca.live/b/${boardSlug}/${pid}`;
    // Navigate to the post
    const fullText = await scrapePage(page, postUrl, 20000);
    if (!fullText) continue;

    let codes;
    if (articleExtract) {
      // Line-based extraction from article body only
      const bodyText = await extractArticleBody(page);
      codes = extractCodesFromArticle(bodyText, exclude);
    } else {
      codes = extractCodes(fullText, patterns, exclude);
    }

    if (codes.length > 0) {
      console.log(`   📄 Post ${pid}: ${codes.length} codes`);
    }
    allCodes.push(...codes);
  }

  return [...new Set(allCodes)];
}

/* ===== API Helper ===== */
async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${data.error || 'Unknown error'}`);
  }
  return data;
}

/* ===== Main ===== */
async function main() {
  console.log('🔍 Gvault Coupon Scraper (Playwright → API)');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🔗 API: ${API_BASE}\n`);

  const today = new Date().toISOString().split('T')[0];
  const failedGames = [];
  const allNewCoupons = [];

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
      const startTime = Date.now();

      // New page per game to prevent context pollution
      const page = await context.newPage();
      let foundCodes = [];
      let gameSuccess = false;
      let gameError = null;

      try {
        for (const src of config.urls) {
          await randomSleep(2000, 5000);

          let sourceCodes = [];

          if (src.type === 'x-api') {
            // X API — no browser needed, direct HTTP
            if (isXApiAvailable()) {
              sourceCodes = await scrapeXApi(src.handle, config.patterns, config.exclude);
            } else {
              console.log('   ⏭️  X API not configured, skipping');
            }
          } else if (src.type === 'nitter') {
            sourceCodes = await scrapeNitter(page, src.handle, config.patterns, config.exclude);
          } else if (src.type === 'arca') {
            const boardSlug = src.url.match(/\/b\/([^/?]+)/)?.[1] || '';
            sourceCodes = await scrapeArcaPosts(
              page, src.url, boardSlug, config
            );
            console.log(`   Found ${sourceCodes.length} codes from arca.live`);
          }

          foundCodes.push(...sourceCodes);

          // Skip remaining sources if enough codes found
          if (foundCodes.length >= 5) {
            console.log(`   ℹ️  Enough codes (${foundCodes.length}), skipping remaining sources`);
            break;
          }
        }

        gameSuccess = true;
      } catch (e) {
        console.log(`   ❌ Game scrape error: ${e.message}`);
        gameError = e.message;
        failedGames.push(config.slug);
      } finally {
        await page.close();
      }

      foundCodes = [...new Set(foundCodes)];
      console.log(`   🔢 Total unique codes: ${foundCodes.length}`);

      if (foundCodes.length > 0) {
        // Prepare coupons for batch API POST
        const coupons = foundCodes.map((code) => ({
          gameSlug: config.slug,
          code,
          description: `${config.name} coupon`,
          descriptionEn: `${config.name} coupon`,
          issuedDate: today,
          source: 'scraper',
          sourceUrl: config.urls[0].url || `https://nitter.net/${config.urls[0].handle || ''}`,
          confidence: 1.0,
        }));

        try {
          const result = await apiPost('/coupons/batch', { coupons });
          console.log(`   📤 API: +${result.inserted} new, ${result.skipped} existing`);
          if (result.codes && result.codes.length > 0) {
            allNewCoupons.push(...result.codes);
            result.codes.forEach((c) => console.log(`   ✅ NEW: ${c}`));
          }
        } catch (e) {
          console.log(`   ❌ API batch error: ${e.message}`);
        }
      }

      // Log scrape result
      const duration = Date.now() - startTime;
      try {
        // Scrape log is informational — don't fail on log errors
        console.log(`   ⏱️  ${duration}ms`);
      } catch { /* ignore */ }
    }
  } finally {
    await browser.close();
  }

  // Failure summary
  if (failedGames.length > 0) {
    console.log(`\n⚠️  Failed games: ${failedGames.join(', ')}`);
  }

  // Summary
  console.log(`\n📊 Summary: ${allNewCoupons.length} new coupons found`);
  console.log('✅ Done!');
}

main().catch(console.error);
