-- Car Spa LK schema migration, 2026-07-21, second part: orders, payments,
-- bank accounts and stock. Additive only, safe to run once against the
-- existing database. Run after migrate-2026-07-21.sql, e.g.
--   mysql -u dbuser -p dbname < migrate-2026-07-21-orders.sql

ALTER TABLE products
  ADD COLUMN stock_qty INT NULL COMMENT 'NULL means unlimited stock' AFTER click_count;

CREATE TABLE IF NOT EXISTS bank_accounts (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  bank_name      VARCHAR(120) NOT NULL,
  branch         VARCHAR(120) NULL,
  account_name   VARCHAR(150) NOT NULL,
  account_number VARCHAR(60)  NOT NULL,
  note           VARCHAR(255) NULL,
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order     INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_bank_accounts_active (is_active, sort_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  customer_name  VARCHAR(150)  NOT NULL,
  phone          VARCHAR(40)   NOT NULL,
  address        VARCHAR(255)  NOT NULL,
  city           VARCHAR(100)  NULL,
  notes          TEXT          NULL,
  payment_method ENUM('cod','bank') NOT NULL,
  status         ENUM('new','awaiting_payment','paid','processing','completed','cancelled') NOT NULL DEFAULT 'new',
  total_lkr      DECIMAL(10,2) NOT NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_orders_status (status, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  order_id   INT UNSIGNED  NOT NULL,
  product_id INT UNSIGNED  NULL COMMENT 'kept NULL if the product is later deleted',
  name       VARCHAR(150)  NOT NULL,
  size       VARCHAR(50)   NULL,
  price_lkr  DECIMAL(10,2) NOT NULL,
  qty        INT UNSIGNED  NOT NULL,
  line_lkr   DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  CONSTRAINT fk_order_items_order   FOREIGN KEY (order_id)   REFERENCES orders (id)   ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Payment method toggles (both on by default)
INSERT INTO site_settings (setting_key, setting_value) VALUES ('payment_cod_enabled', '1')
  ON DUPLICATE KEY UPDATE setting_key = setting_key;
INSERT INTO site_settings (setting_key, setting_value) VALUES ('payment_bank_enabled', '1')
  ON DUPLICATE KEY UPDATE setting_key = setting_key;
