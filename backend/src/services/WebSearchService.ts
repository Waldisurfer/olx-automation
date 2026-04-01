import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ProductInfo {
  abstract: string;
  officialUrl: string | null;
  features: string[];
  searchQuery: string;
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
};

export const WebSearchService = {
  async searchProduct(query: string): Promise<ProductInfo> {
    console.log(`[WebSearch] Searching for: ${query}`);

    const results: ProductInfo = {
      abstract: '',
      officialUrl: null,
      features: [],
      searchQuery: query,
    };

    // 1. DuckDuckGo Instant Answer API (Wikipedia/structured data)
    try {
      const { data } = await axios.get('https://api.duckduckgo.com/', {
        params: { q: query, format: 'json', no_html: 1, skip_disambig: 1 },
        headers: HEADERS,
        timeout: 6000,
      });

      if (data.Abstract) {
        results.abstract = data.Abstract;
      }
      if (data.AbstractURL) {
        results.officialUrl = data.AbstractURL;
      }

      // Extract related topics as features
      const topics: string[] = (data.RelatedTopics ?? [])
        .slice(0, 5)
        .filter((t: { Text?: string }) => t.Text)
        .map((t: { Text: string }) => t.Text.split(' - ')[0].trim());
      results.features.push(...topics);
    } catch (err) {
      console.warn('[WebSearch] DuckDuckGo API failed:', (err as Error).message);
    }

    // 2. Bing HTML search for official product page
    try {
      const officialUrl = await findOfficialPage(query);
      if (officialUrl && !results.officialUrl) {
        results.officialUrl = officialUrl;
      }

      // If we found an official page, scrape it for features
      if (officialUrl) {
        const pageFeatures = await scrapeProductPage(officialUrl);
        results.features.push(...pageFeatures);
        if (!results.abstract && pageFeatures.length > 0) {
          results.abstract = pageFeatures.slice(0, 2).join('. ');
        }
      }
    } catch (err) {
      console.warn('[WebSearch] Official page scrape failed:', (err as Error).message);
    }

    // Deduplicate features
    results.features = [...new Set(results.features)].filter(Boolean).slice(0, 10);

    console.log(`[WebSearch] Found: url=${results.officialUrl}, features=${results.features.length}`);
    return results;
  },
};

async function findOfficialPage(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query + ' official site')}&setlang=pl`;
    const { data } = await axios.get<string>(searchUrl, { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(data);

    // Extract first organic result
    const firstResult = $('li.b_algo h2 a').first().attr('href');
    if (firstResult && firstResult.startsWith('http')) {
      // Prefer manufacturer/brand pages, skip marketplaces
      const skip = ['allegro', 'olx', 'amazon', 'ceneo', 'morele', 'mediaexpert', 'rtveuroagd', 'ebay', 'wikipedia'];
      if (!skip.some((s) => firstResult.includes(s))) {
        return firstResult;
      }

      // Try second result
      const results: string[] = [];
      $('li.b_algo h2 a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.startsWith('http') && !skip.some((s) => href.includes(s))) {
          results.push(href);
        }
      });
      return results[0] ?? firstResult;
    }
  } catch {
    // Bing may block — silent fail
  }
  return null;
}

async function scrapeProductPage(url: string): Promise<string[]> {
  try {
    const { data } = await axios.get<string>(url, {
      headers: HEADERS,
      timeout: 6000,
      maxRedirects: 3,
    });
    const $ = cheerio.load(data);

    const features: string[] = [];

    // Try common product description selectors
    const selectors = [
      '.product-description', '.product-details', '.description',
      '[class*="feature"]', '[class*="spec"]', '[class*="highlight"]',
      'ul li', '.product-info p',
    ];

    for (const sel of selectors) {
      $(sel).each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 20 && text.length < 200) {
          features.push(text);
        }
      });
      if (features.length >= 8) break;
    }

    // Also grab meta description
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc && metaDesc.length > 30) {
      features.unshift(metaDesc.slice(0, 300));
    }

    return features.slice(0, 10);
  } catch {
    return [];
  }
}
