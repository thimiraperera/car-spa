-- Car Spa LK schema migration, 2026-07-21.
-- Adds the admin nickname field. Additive only, safe to run once against the
-- existing database. Point the client at your database yourself, e.g.
--   mysql -u dbuser -p dbname < migrate-2026-07-21.sql

ALTER TABLE admin_users
  ADD COLUMN nickname VARCHAR(60) NULL AFTER last_name;
