// Uses Node.js built-in SQLite (node:sqlite), available since Node 22.5 / Node 25
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/AppConfig.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!_db) throw new Error('Database not initialized. Call initDb() first.');
  return _db;
}

export function initDb(): void {
  mkdirSync(dirname(config.dbPath), { recursive: true });
  _db = new DatabaseSync(config.dbPath);
  _db.exec(`PRAGMA journal_mode = WAL`);
  _db.exec(`PRAGMA foreign_keys = ON`);
  runMigrations(_db);
  console.log(`[DB] Connected: ${config.dbPath}`);
}

function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
    )
  `);

  const migrationsDir = join(__dirname, 'migrations');
  const files = ['001_initial.sql', '002_price_history.sql', '003_extra_fields.sql'];

  for (const file of files) {
    const applied = db.prepare('SELECT name FROM migrations WHERE name = ?').get(file);
    if (!applied) {
      const sql = readFileSync(join(migrationsDir, file), 'utf-8');
      db.exec(sql);
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
      console.log(`[DB] Applied migration: ${file}`);
    }
  }
}
