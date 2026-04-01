import axios from 'axios';
import * as cheerio from 'cheerio';
import type { SimilarListing } from '../types/Listing.types.js';

const OLX_SEARCH_URL = 'https://www.olx.pl/oferty/q-';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'pl-PL,pl;q=0.9',
};

export interface ListingWithDescription extends SimilarListing {
  description: string;
}

export const OlxSearchService = {
  async findSimilar(keywords: string, _categoryId?: number): Promise<SimilarListing[]> {
    try {
      return await scrapeOlx(keywords);
    } catch (err) {
      console.warn('[OlxSearch] Scrape failed:', err);
      return [];
    }
  },

  async fetchDescriptions(keywords: string): Promise<ListingWithDescription[]> {
    try {
      const listings = await scrapeOlx(keywords);
      const top = listings.slice(0, 5);
      const results = await Promise.allSettled(
        top.map(async (l) => {
          const description = await scrapeDescription(l.url);
          return { ...l, description };
        })
      );
      return results
        .filter((r): r is PromiseFulfilledResult<ListingWithDescription> => r.status === 'fulfilled' && r.value.description.length > 20)
        .map((r) => r.value);
    } catch (err) {
      console.warn('[OlxSearch] fetchDescriptions failed:', err);
      return [];
    }
  },
};

async function scrapeDescription(listingUrl: string): Promise<string> {
  try {
    const { data } = await axios.get<string>(listingUrl, { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(data);
    const desc =
      $('[data-cy="ad_description"] div').text().trim() ||
      $('[data-cy="ad_description"]').text().trim() ||
      $('[data-testid="ad-description-text"]').text().trim() ||
      $('div.css-bgzo2k').text().trim();
    return desc.slice(0, 1000);
  } catch {
    return '';
  }
}

async function scrapeOlx(keywords: string): Promise<SimilarListing[]> {
  const slug = encodeURIComponent(keywords.trim().replace(/\s+/g, '-'));
  const url = `${OLX_SEARCH_URL}${slug}/`;

  const { data } = await axios.get<string>(url, { headers: HEADERS, timeout: 10000 });

  const $ = cheerio.load(data);
  const results: SimilarListing[] = [];

  // OLX listing cards — selectors as of 2024/2025
  $('[data-cy="l-card"]').each((_i, el) => {
    const $el = $(el);

    const titleEl = $el.find('[data-cy="ad-card-title"] h4, h6').first();
    const title = titleEl.text().trim();

    const priceEl = $el.find('[data-testid="ad-price"]').first();
    const priceText = priceEl.text().replace(/\s/g, '').replace('zł', '').replace(',', '.');
    const price = parseFloat(priceText);

    const linkEl = $el.find('a[href]').first();
    const href = linkEl.attr('href') ?? '';
    const url = href.startsWith('http') ? href : `https://www.olx.pl${href}`;

    const imgEl = $el.find('img').first();
    const thumbnailUrl = imgEl.attr('src') ?? imgEl.attr('data-src');

    const cityEl = $el.find('[data-testid="location-date"]').first();
    const locationCity = cityEl.text().split('-')[0].trim();

    const id = $el.attr('id') ?? href.split('/').filter(Boolean).pop() ?? String(Math.random());

    if (title && !isNaN(price) && price > 0) {
      results.push({ olxId: id, title, price, url, thumbnailUrl, locationCity });
    }
  });

  return results.slice(0, 20);
}
