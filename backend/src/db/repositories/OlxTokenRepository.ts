import { getPool } from '../database.js';
import type { OlxStoredToken } from '../../types/OlxApi.types.js';

export const OlxTokenRepository = {
  async get(): Promise<OlxStoredToken | null> {
    const { rows } = await getPool().query('SELECT * FROM olx_tokens WHERE id = 1');
    if (!rows.length) return null;
    const row = rows[0] as { access_token: string; refresh_token: string; expires_at: number };
    return {
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAt: row.expires_at,
    };
  },

  async save(token: OlxStoredToken): Promise<void> {
    await getPool().query(`
      INSERT INTO olx_tokens (id, access_token, refresh_token, expires_at)
      VALUES (1, $1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at
    `, [token.accessToken, token.refreshToken, token.expiresAt]);
  },

  async delete(): Promise<void> {
    await getPool().query('DELETE FROM olx_tokens WHERE id = 1');
  },
};
