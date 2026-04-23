/**
 * Gvault Coupon Scraper v3
 * 
 * All sources: arca.live (page 1 only)
 * Only extracts coupon codes from post body content
 * 
 * Run: node scripts/scrape-coupons.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COUPONS_PATH = join(__dirname, '..', 'src', 'data', 'coupons.json');
const GAMES_PATH = join(__dirname, '..', 'src', 'data', 'games.json');

/* ===== Realistic Browser Headers ===== */
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Upgrade-Insecure-Requests': '1',
  'Referer': 'https://arca.live/',
};

/* ===== Game Scrape Configs ===== */
const GAME_CONFIGS = [
  {
    slug: 'ark-recode',
    name: 'Ark Re:Code',
    url: 'https://arca.live/b/codeark?category=%EC%BF%A0%ED%8F%B0',
    // Specific pattern: Ark followed by 4+ alphanumeric chars
    patterns: [/\bArk[A-Za-z0-9]{4,}\b/g],
    useListingPage: true, // Extract from listing page HTML directly
  },
  {
    slug: 'tenkafuma',
    name: 'TenkafuMA',
    url: 'https://arca.live/b/tenkafumaa?target=all&keyword=%EC%BD%94%EB%93%9C&category=info',
    patterns: null, // Use post body extraction
    useListingPage: false,
  },
  {
    slug: 'rise-of-eros',
    name: 'Rise of Eros',
    url: 'https://arca.live/b/riseoferos?category=%EC%BF%A0%ED%8F%B0',
    patterns: null,
    useListingPage: false,
  },
  {
    slug: 'cherrytale',
    name: 'CherryTale',
    url: 'https://arca.live/b/cherrytale?category=%EC%BF%A0%ED%8F%B0',
    // Specific pattern: CT followed by alphanumeric chars
    patterns: [/\bCT[A-Za-z0-9]{4,}\b/g],
    useListingPage: true,
  },
  {
    slug: 'throne-of-desire',
    name: 'Throne of Desire',
    url: 'https://arca.live/b/throneofdesire?category=Code',
    patterns: [/\btod[A-Za-z0-9]{3,}\b/gi],
    useListingPage: false,
  },
  {
    slug: 'horizon-walker',
    name: 'Horizon Walker',
    url: 'https://arca.live/b/horizonwalker2?target=all&keyword=%EC%BF%A0%ED%8F%B0&category=8',
    patterns: null,
    useListingPage: false,
  },
  {
    slug: 'star-lusts',
    name: 'Star Lusts',
    url: 'https://arca.live/b/lustsisters?category=%EC%BF%A0%ED%8F%B0',
    patterns: null,
    useListingPage: false,
  },
  {
    slug: 'megaha-re',
    name: 'Megaha:RE',
    url: 'https://arca.live/b/megahare?category=gamenote',
    patterns: null,
    useListingPage: false,
  },
  {
    slug: 'alliance-sages',
    name: 'Alliance Sages',
    url: 'https://arca.live/b/hyeonjadongmaeng?category=%EC%BF%A0%ED%8F%B0',
    patterns: null,
    useListingPage: false,
  },
  {
    slug: 'ero-dorado',
    name: 'Ero Dorado',
    url: 'https://arca.live/b/pangeaodyssey?category=%EC%BF%A0%ED%8F%B0',
    patterns: null,
    useListingPage: false,
  },
];

/* ===== Helpers ===== */
function randomDelay(minMs, maxMs) {
  return new Promise(resolve =>
    setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs)) + minMs)
  );
}

async function fetchPage(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
      });
      if (res.ok) return await res.text();
      console.log(`  [WARN] HTTP ${res.status} for ${url}`);
    } catch (e) {
      console.log(`  [WARN] Attempt ${attempt + 1}: ${e.message}`);
    }
    if (attempt < 2) await randomDelay(2000, 5000);
  }
  return null;
}

/* ===== Extract post body content only (skip nav, scripts, styles) ===== */
function extractArticleBody(html) {
  // Try to find article body: <div class="article-body">...</div>
  const bodyMatch = html.match(/<div[^>]*class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div/i);
  if (bodyMatch) return bodyMatch[1];
  
  // Fallback: find content area
  const contentMatch = html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (contentMatch) return contentMatch[1];
  
  // Last resort: strip scripts/styles and return plain text sections
  let clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '');
  return clean;
}

/* ===== Extract coupon codes ===== */
function extractCodesFromBody(bodyHtml, patterns) {
  // Strip all HTML tags to get plain text
  const text = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const codes = new Set();
  
  if (patterns) {
    for (const p of patterns) {
      p.lastIndex = 0;
      let m;
      while ((m = p.exec(text)) !== null) {
        if (m[0].length >= 5 && m[0].length <= 30) codes.add(m[0]);
      }
    }
  } else {
    // Look for codes near coupon-related keywords
    // Strategy: find keyword, then extract nearby code-like strings
    const keywordRegex = /(?:쿠폰|코드|coupon|code|보물코드|리딤코드|redeem|교환|입력)/gi;
    let kwMatch;
    while ((kwMatch = keywordRegex.exec(text)) !== null) {
      // Search within 200 chars after the keyword
      const nearby = text.slice(kwMatch.index, kwMatch.index + 200);
      // Look for code-like patterns: mix of upper letters and digits, 6-25 chars
      const codeRegex = /\b([A-Za-z0-9]{6,25})\b/g;
      let cm;
      while ((cm = codeRegex.exec(nearby)) !== null) {
        const code = cm[1];
        // Must have at least one letter AND one digit (to avoid normal words)
        if (/[A-Za-z]/.test(code) && /[0-9]/.test(code)) {
          codes.add(code);
        }
      }
    }
  }
  
  return [...codes];
}

/* ===== Extract post links from listing page ===== */
function extractPostLinks(html, boardSlug) {
  const links = [];
  const seen = new Set();
  const regex = new RegExp(`/b/${boardSlug}/(\\d{6,})`, 'g');
  let m;
  while ((m = regex.exec(html)) !== null) {
    if (!seen.has(m[1])) { seen.add(m[1]); links.push(m[1]); }
  }
  return links.slice(0, 15);
}

/* ===== Main ===== */
async function main() {
  console.log('🔍 Gvault Coupon Scraper v3');
  console.log(`📅 ${new Date().toISOString()}\n`);
  
  let existingCoupons = [];
  try { existingCoupons = JSON.parse(readFileSync(COUPONS_PATH, 'utf8')); } catch { /* empty */ }
  
  const existingCodes = new Set(existingCoupons.map(c => c.code));
  const newCoupons = [];
  const today = new Date().toISOString().split('T')[0];
  
  for (const config of GAME_CONFIGS) {
    console.log(`🎮 ${config.name} (${config.slug})`);
    await randomDelay(1500, 4000);
    
    const listHtml = await fetchPage(config.url);
    if (!listHtml) { console.log('   ❌ Failed\n'); continue; }
    
    let foundCodes = [];
    
    if (config.useListingPage && config.patterns) {
      // Extract codes directly from listing page text
      const text = listHtml.replace(/<[^>]+>/g, ' ');
      for (const p of config.patterns) {
        p.lastIndex = 0;
        let m;
        while ((m = p.exec(text)) !== null) {
          if (m[0].length >= 5) foundCodes.push(m[0]);
        }
      }
      foundCodes = [...new Set(foundCodes)];
      console.log(`   📋 ${foundCodes.length} codes from listing`);
    } else {
      // Visit individual posts
      const boardSlug = config.url.match(/\/b\/([^/?]+)/)?.[1] || '';
      const postIds = extractPostLinks(listHtml, boardSlug);
      console.log(`   📋 ${postIds.length} posts found`);
      
      for (const postId of postIds.slice(0, 6)) {
        await randomDelay(1000, 3000);
        const postUrl = `https://arca.live/b/${boardSlug}/${postId}`;
        const postHtml = await fetchPage(postUrl);
        if (!postHtml) continue;
        
        const body = extractArticleBody(postHtml);
        const codes = extractCodesFromBody(body, config.patterns);
        foundCodes.push(...codes);
      }
      foundCodes = [...new Set(foundCodes)];
      console.log(`   📋 ${foundCodes.length} unique codes total`);
    }
    
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
          sourceUrl: config.url,
        });
        existingCodes.add(code);
        console.log(`   ✅ NEW: ${code}`);
      }
    }
    console.log('');
  }
  
  // Save
  if (newCoupons.length > 0) {
    const all = [...existingCoupons, ...newCoupons];
    writeFileSync(COUPONS_PATH, JSON.stringify(all, null, 2) + '\n');
    console.log(`📝 +${newCoupons.length} coupons (total: ${all.length})`);
  } else {
    console.log('📝 No new coupons');
  }
  
  // Update game counts
  try {
    const games = JSON.parse(readFileSync(GAMES_PATH, 'utf8'));
    const all = JSON.parse(readFileSync(COUPONS_PATH, 'utf8'));
    for (const g of games) {
      g.activeCouponCount = all.filter(c => c.gameSlug === g.slug && !c.expired).length;
    }
    writeFileSync(GAMES_PATH, JSON.stringify(games, null, 2) + '\n');
  } catch { /* ignore */ }
  
  console.log('✅ Done!');
}

main().catch(console.error);
