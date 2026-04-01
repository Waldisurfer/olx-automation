import { getPool } from '../database.js';
import type { PriceHistoryEntry } from '../../types/Listing.types.js';

export const PriceHistoryRepository = {
  async findByListingId(listingId: number): Promise<PriceHistoryEntry[]> {
    const { rows } = await getPool().query(
      'SELECT * FROM price_history WHERE listing_id = $1 ORDER BY recorded_at ASC',
      [listingId]
    );
    return rows.map((r) => ({
      id: r.id as number,
      listingId: r.listing_id as number,
      price: r.price as number,
      reason: r.reason as PriceHistoryEntry['reason'],
      recordedAt: r.recorded_at instanceof Date ? r.recorded_at.toISOString() : r.recorded_at as string,
    }));
  },

  async add(listingId: number, price: number, reason: PriceHistoryEntry['reason']): Promise<void> {
    await getPool().query(
      'INSERT INTO price_history (listing_id, price, reason) VALUES ($1, $2, $3)',
      [listingId, price, reason]
    );
  },
};
