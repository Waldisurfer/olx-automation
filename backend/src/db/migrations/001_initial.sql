CREATE TABLE IF NOT EXISTS olx_tokens (
  id            INTEGER PRIMARY KEY DEFAULT 1,
  access_token  TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at    BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS listings (
  id                       SERIAL PRIMARY KEY,
  title                    TEXT NOT NULL,
  description              TEXT NOT NULL,
  category_id              INTEGER NOT NULL DEFAULT 0,
  category_name            TEXT NOT NULL DEFAULT '',
  price                    NUMERIC NOT NULL,
  currency                 TEXT NOT NULL DEFAULT 'PLN',
  status                   TEXT NOT NULL DEFAULT 'draft',
  olx_advert_id            TEXT,
  olx_advert_url           TEXT,
  photos                   TEXT NOT NULL DEFAULT '[]',
  ai_generated_description TEXT NOT NULL DEFAULT '',
  reduction_percent        NUMERIC NOT NULL DEFAULT 10.0,
  reduction_interval_days  INTEGER NOT NULL DEFAULT 14,
  next_reduction_at        TIMESTAMPTZ,
  published_at             TIMESTAMPTZ,
  sold_at                  TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_next_reduction ON listings(next_reduction_at);
