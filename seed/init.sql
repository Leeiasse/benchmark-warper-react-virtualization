CREATE TABLE IF NOT EXISTS transactions (
  id            SERIAL PRIMARY KEY,
  reference     VARCHAR(20) NOT NULL,
  amount        NUMERIC(12, 2) NOT NULL,
  currency      VARCHAR(3) NOT NULL DEFAULT 'USD',
  status        VARCHAR(20) NOT NULL,
  merchant      VARCHAR(100) NOT NULL,
  category      VARCHAR(50) NOT NULL,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_created_at ON transactions (created_at DESC);
CREATE INDEX idx_transactions_status ON transactions (status);
CREATE INDEX idx_transactions_cursor ON transactions (id, created_at DESC);
