-- PrintKu: skema database (PostgreSQL)
-- Jalankan di SQL Editor Supabase / Neon, atau: npm run db:init

DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. users
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  phone       VARCHAR(20),
  role        VARCHAR(20) NOT NULL DEFAULT 'customer'
              CHECK (role IN ('customer', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. categories (kategori layanan: Dokumen, Foto, Banner, dst.)
CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

-- 3. services (jenis layanan cetak, 1 kategori punya banyak layanan)
CREATE TABLE services (
  id              SERIAL PRIMARY KEY,
  category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name            VARCHAR(150) NOT NULL,
  description     TEXT,
  price_per_unit  NUMERIC(12,2) NOT NULL CHECK (price_per_unit >= 0),
  unit            VARCHAR(20) NOT NULL DEFAULT 'lembar',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. orders (1 user punya banyak pesanan)
CREATE TABLE orders (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'processing', 'ready', 'completed', 'cancelled')),
  total_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes        TEXT,
  pickup_date  DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. order_items (tabel pivot many-to-many: orders <-> services)
CREATE TABLE order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  service_id  INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(12,2) NOT NULL,
  subtotal    NUMERIC(12,2) NOT NULL,
  paper_size  VARCHAR(20) DEFAULT 'A4',
  color_mode  VARCHAR(20) DEFAULT 'bw' CHECK (color_mode IN ('bw', 'color')),
  file_url    TEXT,
  notes       TEXT
);

-- 6. payments (1 pesanan punya pembayaran)
CREATE TABLE payments (
  id        SERIAL PRIMARY KEY,
  order_id  INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount    NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  method    VARCHAR(20) NOT NULL CHECK (method IN ('cash', 'transfer', 'qris', 'ewallet')),
  status    VARCHAR(20) NOT NULL DEFAULT 'pending'
            CHECK (status IN ('pending', 'paid', 'failed')),
  paid_at   TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_payments_order ON payments(order_id);
