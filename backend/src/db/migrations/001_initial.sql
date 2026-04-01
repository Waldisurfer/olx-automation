CREATE TABLE IF NOT EXISTS olx_tokens (
  id            INTEGER PRIMARY KEY DEFAULT 1,
  access_token  TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS listings (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  title                    TEXT NOT NULL,
  description              TEXT NOT NULL,
  category_id              INTEGER NOT NULL DEFAULT 0,
  category_name            TEXT NOT NULL DEFAULT '',
  price                    REAL NOT NULL,
  currency                 TEXT NOT NULL DEFAULT 'PLN',
  status                   TEXT NOT NULL DEFAULT 'draft',
  olx_advert_id            TEXT,
  olx_advert_url           TEXT,
  photos                   TEXT NOT NULL DEFAULT '[]',
  ai_generated_description TEXT NOT NULL DEFAULT '',
  reduction_percent        REAL NOT NULL DEFAULT 10.0,
  reduction_interval_days  INTEGER NOT NULL DEFAULT 14,
  next_reduction_at        TEXT,
  published_at             TEXT,
  sold_at                  TEXT,
  created_at               TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at               TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_next_reduction ON listings(next_reduction_at);
