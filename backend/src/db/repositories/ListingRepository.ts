import { getPool } from '../database.js';
import type { Listing, CreateListingDto, UpdateListingDto, ListingStatus } from '../../types/Listing.types.js';

function toISO(val: unknown): string | undefined {
  if (val == null) return undefined;
  if (val instanceof Date) return val.toISOString();
  return val as string;
}

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
    nextReductionAt: toISO(row.next_reduction_at),
    publishedAt: toISO(row.published_at),
    soldAt: toISO(row.sold_at),
    createdAt: toISO(row.created_at) ?? '',
    updatedAt: toISO(row.updated_at) ?? '',
  };
}

export const ListingRepository = {
  async findAll(status?: ListingStatus): Promise<Listing[]> {
    const pool = getPool();
    const { rows } = status
      ? await pool.query('SELECT * FROM listings WHERE status = $1 ORDER BY created_at DESC', [status])
      : await pool.query('SELECT * FROM listings ORDER BY created_at DESC');
    return rows.map(rowToListing);
  },

  async findById(id: number): Promise<Listing | null> {
    const { rows } = await getPool().query('SELECT * FROM listings WHERE id = $1', [id]);
    return rows.length ? rowToListing(rows[0]) : null;
  },

  async findDueForReduction(): Promise<Listing[]> {
    const { rows } = await getPool().query(`
      SELECT * FROM listings
      WHERE status = 'active' AND next_reduction_at IS NOT NULL
      AND next_reduction_at <= NOW()
    `);
    return rows.map(rowToListing);
  },

  async create(dto: CreateListingDto): Promise<Listing> {
    const { rows } = await getPool().query(`
      INSERT INTO listings (title, description, category_id, category_name, price, photos,
        condition, city, negotiable, shipping,
        ai_generated_description, reduction_percent, reduction_interval_days)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
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
      dto.reductionIntervalDays ?? 14,
    ]);
    return rowToListing(rows[0]);
  },

  async update(id: number, dto: UpdateListingDto): Promise<Listing | null> {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let i = 1;

    if (dto.title !== undefined) { fields.push(`title = $${i++}`); values.push(dto.title); }
    if (dto.description !== undefined) { fields.push(`description = $${i++}`); values.push(dto.description); }
    if (dto.categoryId !== undefined) { fields.push(`category_id = $${i++}`); values.push(dto.categoryId); }
    if (dto.categoryName !== undefined) { fields.push(`category_name = $${i++}`); values.push(dto.categoryName); }
    if (dto.price !== undefined) { fields.push(`price = $${i++}`); values.push(dto.price); }
    if (dto.condition !== undefined) { fields.push(`condition = $${i++}`); values.push(dto.condition); }
    if (dto.city !== undefined) { fields.push(`city = $${i++}`); values.push(dto.city); }
    if (dto.negotiable !== undefined) { fields.push(`negotiable = $${i++}`); values.push(dto.negotiable ? 1 : 0); }
    if (dto.shipping !== undefined) { fields.push(`shipping = $${i++}`); values.push(dto.shipping ? 1 : 0); }
    if (dto.reductionPercent !== undefined) { fields.push(`reduction_percent = $${i++}`); values.push(dto.reductionPercent); }
    if (dto.reductionIntervalDays !== undefined) { fields.push(`reduction_interval_days = $${i++}`); values.push(dto.reductionIntervalDays); }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    await getPool().query(`UPDATE listings SET ${fields.join(', ')} WHERE id = $${i}`, values);
    return this.findById(id);
  },

  async setStatus(id: number, status: ListingStatus): Promise<void> {
    await getPool().query('UPDATE listings SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
  },

  async setOlxData(id: number, olxAdvertId: string, olxAdvertUrl: string): Promise<void> {
    await getPool().query(`
      UPDATE listings SET
        olx_advert_id = $1, olx_advert_url = $2,
        status = 'active', published_at = NOW(),
        next_reduction_at = NOW() + (reduction_interval_days * INTERVAL '1 day'),
        updated_at = NOW()
      WHERE id = $3
    `, [olxAdvertId, olxAdvertUrl, id]);
  },

  async updatePrice(id: number, price: number): Promise<void> {
    await getPool().query(`
      UPDATE listings SET
        price = $1,
        next_reduction_at = NOW() + (reduction_interval_days * INTERVAL '1 day'),
        updated_at = NOW()
      WHERE id = $2
    `, [price, id]);
  },

  async markSold(id: number): Promise<void> {
    await getPool().query(`
      UPDATE listings SET
        status = 'sold', sold_at = NOW(),
        next_reduction_at = NULL, updated_at = NOW()
      WHERE id = $1
    `, [id]);
  },

  async setPublished(id: number, publishedAt: Date, nextReductionAt: Date): Promise<void> {
    await getPool().query(`
      UPDATE listings SET
        status = 'active',
        published_at = $1,
        next_reduction_at = $2,
        updated_at = NOW()
      WHERE id = $3
    `, [publishedAt.toISOString(), nextReductionAt.toISOString(), id]);
  },

  async delete(id: number): Promise<void> {
    await getPool().query('DELETE FROM listings WHERE id = $1', [id]);
  },
};
