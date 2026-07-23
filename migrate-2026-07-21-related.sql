-- Car Spa LK schema migration, 2026-07-21, third part: hand-picked related
-- products. Additive only, safe to run once. Run after the other two
-- 2026-07-21 migrations, e.g.
--   mysql -u dbuser -p dbname < migrate-2026-07-21-related.sql

ALTER TABLE products
  ADD COLUMN related_ids JSON NULL COMMENT 'hand-picked related product ids, max 3' AFTER how_to_use;
