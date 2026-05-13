/**
 * X (Twitter) API v2 Scraper Module
 *
 * Uses Bearer Token authentication to fetch recent tweets
 * from game official accounts and extract coupon codes.
 *
 * Free Tier limits:
 * - 1 app per project
 * - 1,500 tweets read/month (Tweet search)
 * - 1 request per 15 min window (user timeline)
 *
 * Strategy:
 * - Use GET /2/tweets/search/recent for keyword-based search
 * - 10 tweets per query to conserve monthly quota
 * - Skip if TWITTER_BEARER_TOKEN not set (graceful fallback)
 */

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || '';
const X_API_BASE = 'https://api.twitter.com/2';

/**
 * Check if X API is available (token set)
 */
export function isXApiAvailable() {
  return !!BEARER_TOKEN;
}

/**
 * Fetch recent tweets mentioning coupon-related keywords from a specific account.
 *
 * @param {string} handle - Twitter handle (without @)
 * @param {RegExp[]|null} patterns - Optional regex patterns for coupon codes
 * @param {string[]} exclude - Strings to exclude from results
 * @returns {Promise<string[]>} - Array of coupon codes found
 */
export async function scrapeXApi(handle, patterns, exclude = []) {
  if (!BEARER_TOKEN) {
    console.log('   ⚠️  X API: No bearer token, skipping');
    return [];
  }

  try {
    // Search for recent tweets from account containing coupon-related keywords
    // Free tier: /2/tweets/search/recent
    const query = `from:${handle} (coupon OR 쿠폰 OR code OR 코드 OR gift OR reward)`;
    const params = new URLSearchParams({
      query,
      max_results: '10',
      'tweet.fields': 'created_at,text',
    });

    const url = `${X_API_BASE}/tweets/search/recent?${params}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${decodeURIComponent(BEARER_TOKEN)}`,
        'User-Agent': 'GvaultScraper/1.0',
      },
    });

    if (response.status === 429) {
      console.log('   ⚠️  X API: Rate limited, skipping');
      return [];
    }

    if (!response.ok) {
      const errText = await response.text();
      console.log(`   ⚠️  X API ${response.status}: ${errText.substring(0, 200)}`);
      return [];
    }

    const data = await response.json();
    const tweets = data.data || [];
    console.log(`   🐦 X API: ${tweets.length} tweets from @${handle}`);

    if (tweets.length === 0) return [];

    // Extract coupon codes from tweet text
    const codes = [];
    const excludeSet = new Set(exclude.map(e => e.toLowerCase()));

    for (const tweet of tweets) {
      const text = tweet.text || '';
      let extracted = [];

      if (patterns && patterns.length > 0) {
        // Use game-specific patterns
        for (const pattern of patterns) {
          const regex = new RegExp(pattern.source, pattern.flags);
          const matches = text.matchAll(regex);
          for (const m of matches) {
            extracted.push(m[0]);
          }
        }
      } else {
        // Generic extraction: alphanumeric strings 5-30 chars
        const generic = text.match(/\b[A-Za-z][A-Za-z0-9]{4,29}\b/g) || [];
        extracted.push(...generic);
      }

      // Filter
      for (const code of extracted) {
        if (code.length < 5 || code.length > 30) continue;
        if (excludeSet.has(code.toLowerCase())) continue;
        // Skip common words
        if (/^(https?|coupon|code|gift|reward|event|update|notice|patch)$/i.test(code)) continue;
        codes.push(code);
      }
    }

    const unique = [...new Set(codes)];
    if (unique.length > 0) {
      console.log(`   🐦 X API: Found ${unique.length} potential codes`);
    }
    return unique;
  } catch (err) {
    console.log(`   ⚠️  X API error: ${err.message}`);
    return [];
  }
}
