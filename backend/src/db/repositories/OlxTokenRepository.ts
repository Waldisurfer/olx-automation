import { getDb } from '../database.js';
import type { OlxStoredToken } from '../../types/OlxApi.types.js';

export const OlxTokenRepository = {
  get(): OlxStoredToken | null {
    const row = getDb().prepare('SELECT * FROM olx_tokens WHERE id = 1').get() as
      | { access_token: string; refresh_token: string; expires_at: number }
      | undefined;
    if (!row) return null;
    return {
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAt: row.expires_at,
    };
  },

  save(token: OlxStoredToken): void {
    getDb()
      .prepare(`
        INSERT INTO olx_tokens (id, access_token, refresh_token, expires_at)
        VALUES (1, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          access_token = excluded.access_token,
          refresh_token = excluded.refresh_token,
          expires_at = excluded.expires_at
      `)
      .run(token.accessToken, token.refreshToken, token.expiresAt);
  },

  delete(): void {
    getDb().prepare('DELETE FROM olx_tokens WHERE id = 1').run();
  },
};
