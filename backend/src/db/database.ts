import pg from 'pg';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/AppConfig.js';

// Parse NUMERIC as float (pg returns strings for NUMERIC by default)
pg.types.setTypeParser(1700, (val: string) => parseFloat(val));
// Parse BIGINT as number
pg.types.setTypeParser(20, (val: string) => parseInt(val, 10));

const __dirname = dirname(fileURLToPath(import.meta.url));

let _pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!_pool) throw new Error('Database not initialized. Call initDb() first.');
  return _pool;
}

export async function initDb(): Promise<void> {
  _pool = new pg.Pool({ connectionString: config.databaseUrl });
  await runMigrations(_pool);
  console.log('[DB] Connected to PostgreSQL');
}

async function runMigrations(pool: pg.Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrationsDir = join(__dirname, 'migrations');
  const files = ['001_initial.sql', '002_price_history.sql', '003_extra_fields.sql', '004_auth.sql'];

  for (const file of files) {
    const { rows } = await pool.query('SELECT name FROM migrations WHERE name = $1', [file]);
    if (rows.length === 0) {
      const sql = readFileSync(join(migrationsDir, file), 'utf-8');
      await pool.query(sql);
      await pool.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
      console.log(`[DB] Applied migration: ${file}`);
    }
  }
}
