import { getDb } from '../database.js';
import type { Listing, CreateListingDto, UpdateListingDto, ListingStatus } from '../../types/Listing.types.js';

function rowToListing(row: Record<string, unknown>): Listing {
  return {
    id: row.id as number,
    title: row.title as string,
    description: row.description as string,
    categoryId: row.category_id as number,
    categoryName: row.category_name as string,
    price: row.price as number,
    currency: 'PLN',
    status: row.status as ListingStatus,
    condition: (row.condition as Listing['condition']) ?? 'używany_dobry',
    city: (row.city as string) ?? '',
    negotiable: Boolean(row.negotiable ?? 1),
    shipping: Boolean(row.shipping ?? 0),
    olxAdvertId: row.olx_advert_id as string | undefined,
    olxAdvertUrl: row.olx_advert_url as string | undefined,
    photos: JSON.parse((row.photos as string) || '[]'),
    aiGeneratedDescription: row.ai_generated_description as string,
    reductionPercent: row.reduction_percent as number,
    reductionIntervalDays: row.reduction_interval_days as number,
    nextReductionAt: row.next_reduction_at as string | undefined,
    publishedAt: row.published_at as string | undefined,
    soldAt: row.sold_at as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export const ListingRepository = {
  findAll(status?: ListingStatus): Listing[] {
    const db = getDb();
    const rows = status
      ? db.prepare('SELECT * FROM listings WHERE status = ? ORDER BY created_at DESC').all(status)
      : db.prepare('SELECT * FROM listings ORDER BY created_at DESC').all();
    return (rows as Record<string, unknown>[]).map(rowToListing);
  },

  findById(id: number): Listing | null {
    const row = getDb().prepare('SELECT * FROM listings WHERE id = ?').get(id);
    return row ? rowToListing(row as Record<string, unknown>) : null;
  },

  findDueForReduction(): Listing[] {
    const rows = getDb()
      .prepare(
        `SELECT * FROM listings
         WHERE status = 'active' AND next_reduction_at IS NOT NULL
         AND next_reduction_at <= datetime('now')`
      )
      .all();
    return (rows as Record<string, unknown>[]).map(rowToListing);
  },

  create(dto: CreateListingDto): Listing {
    const db = getDb();
    const result = db
      .prepare(`
        INSERT INTO listings (title, description, category_id, category_name, price, photos,
          condition, city, negotiable, shipping,
          ai_generated_description, reduction_percent, reduction_interval_days)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        dto.title,
        dto.description,
        dto.categoryId,
        dto.categoryName,
        dto.price,
        JSON.stringify(dto.photos),
        dto.condition ?? 'używany_dobry',
        dto.city ?? '',
        dto.negotiable !== false ? 1 : 0,
        dto.shipping ? 1 : 0,
        dto.aiGeneratedDescription ?? '',
        dto.reductionPercent ?? 10,
        dto.reductionIntervalDays ?? 14
      );
    return this.findById(result.lastInsertRowid as number)!;
  },

  update(id: number, dto: UpdateListingDto): Listing | null {
    const db = getDb();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (dto.title !== undefined) { fields.push('title = ?'); values.push(dto.title); }
    if (dto.description !== undefined) { fields.push('description = ?'); values.push(dto.description); }
    if (dto.categoryId !== undefined) { fields.push('category_id = ?'); values.push(dto.categoryId); }
    if (dto.categoryName !== undefined) { fields.push('category_name = ?'); values.push(dto.categoryName); }
    if (dto.price !== undefined) { fields.push('price = ?'); values.push(dto.price); }
    if (dto.condition !== undefined) { fields.push('condition = ?'); values.push(dto.condition); }
    if (dto.city !== undefined) { fields.push('city = ?'); values.push(dto.city); }
    if (dto.negotiable !== undefined) { fields.push('negotiable = ?'); values.push(dto.negotiable ? 1 : 0); }
    if (dto.shipping !== undefined) { fields.push('shipping = ?'); values.push(dto.shipping ? 1 : 0); }
    if (dto.reductionPercent !== undefined) { fields.push('reduction_percent = ?'); values.push(dto.reductionPercent); }
    if (dto.reductionIntervalDays !== undefined) { fields.push('reduction_interval_days = ?'); values.push(dto.reductionIntervalDays); }

    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE listings SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  setStatus(id: number, status: ListingStatus): void {
    getDb()
      .prepare("UPDATE listings SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .run(status, id);
  },

  setOlxData(id: number, olxAdvertId: string, olxAdvertUrl: string): void {
    getDb()
      .prepare(`
        UPDATE listings SET
          olx_advert_id = ?, olx_advert_url = ?,
          status = 'active', published_at = datetime('now'),
          next_reduction_at = datetime('now', '+' || reduction_interval_days || ' days'),
          updated_at = datetime('now')
        WHERE id = ?
      `)
      .run(olxAdvertId, olxAdvertUrl, id);
  },

  updatePrice(id: number, price: number): void {
    getDb()
      .prepare(`
        UPDATE listings SET
          price = ?,
          next_reduction_at = datetime('now', '+' || reduction_interval_days || ' days'),
          updated_at = datetime('now')
        WHERE id = ?
      `)
      .run(price, id);
  },

  markSold(id: number): void {
    getDb()
      .prepare(`
        UPDATE listings SET
          status = 'sold', sold_at = datetime('now'),
          next_reduction_at = NULL, updated_at = datetime('now')
        WHERE id = ?
      `)
      .run(id);
  },

  setPublished(id: number, publishedAt: Date, nextReductionAt: Date): void {
    getDb()
      .prepare(`
        UPDATE listings SET
          status = 'active',
          published_at = ?,
          next_reduction_at = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `)
      .run(publishedAt.toISOString(), nextReductionAt.toISOString(), id);
  },

  delete(id: number): void {
    getDb().prepare('DELETE FROM listings WHERE id = ?').run(id);
  },
};
