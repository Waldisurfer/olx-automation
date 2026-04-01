import { getDb } from '../database.js';
import type { PriceHistoryEntry } from '../../types/Listing.types.js';

export const PriceHistoryRepository = {
  findByListingId(listingId: number): PriceHistoryEntry[] {
    const rows = getDb()
      .prepare('SELECT * FROM price_history WHERE listing_id = ? ORDER BY recorded_at ASC')
      .all(listingId) as Record<string, unknown>[];
    return rows.map((r) => ({
      id: r.id as number,
      listingId: r.listing_id as number,
      price: r.price as number,
      reason: r.reason as PriceHistoryEntry['reason'],
      recordedAt: r.recorded_at as string,
    }));
  },

  add(listingId: number, price: number, reason: PriceHistoryEntry['reason']): void {
    getDb()
      .prepare('INSERT INTO price_history (listing_id, price, reason) VALUES (?, ?, ?)')
      .run(listingId, price, reason);
  },
};
