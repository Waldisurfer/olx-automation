CREATE TABLE IF NOT EXISTS price_history (
  id          SERIAL PRIMARY KEY,
  listing_id  INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  price       NUMERIC NOT NULL,
  reason      TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_listing ON price_history(listing_id);
