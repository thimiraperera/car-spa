-- Car Spa LK schema migration, 2026-07-20.
-- Adds: media metadata fields, testimonial photos, admin profiles (name,
-- email, avatar, password reset tokens), and a new smtp_settings table.
-- Additive only, safe to run once against the existing database (the one
-- schema.sql + seed.sql already created). Does not touch existing rows.
-- Point the client at your existing database yourself, e.g.
--   mysql -u dbuser -p dbname < migrate-2026-07-20.sql

ALTER TABLE media
  ADD COLUMN title VARCHAR(190) NULL AFTER file_path,
  ADD COLUMN description TEXT NULL AFTER alt_text,
  ADD COLUMN caption VARCHAR(255) NULL AFTER description;

ALTER TABLE testimonials
  ADD COLUMN image_media_id INT UNSIGNED NULL AFTER customer_name,
  ADD CONSTRAINT fk_testimonials_media FOREIGN KEY (image_media_id) REFERENCES media (id) ON DELETE SET NULL;

ALTER TABLE admin_users
  ADD COLUMN first_name VARCHAR(60) NULL AFTER username,
  ADD COLUMN last_name VARCHAR(60) NULL AFTER first_name,
  ADD COLUMN email VARCHAR(190) NULL AFTER last_name,
  ADD COLUMN avatar_media_id INT UNSIGNED NULL AFTER email,
  ADD COLUMN reset_token_hash VARCHAR(128) NULL AFTER password_hash,
  ADD COLUMN reset_token_expires DATETIME NULL AFTER reset_token_hash,
  ADD CONSTRAINT fk_admin_users_media FOREIGN KEY (avatar_media_id) REFERENCES media (id) ON DELETE SET NULL,
  ADD UNIQUE KEY uq_admin_users_email (email);

CREATE TABLE IF NOT EXISTS smtp_settings (
  id         INT UNSIGNED NOT NULL,
  host       VARCHAR(190) NULL,
  port       SMALLINT UNSIGNED NULL,
  username   VARCHAR(190) NULL,
  password   VARCHAR(255) NULL,
  encryption ENUM('none','ssl','tls') NOT NULL DEFAULT 'tls',
  from_email VARCHAR(190) NULL,
  from_name  VARCHAR(190) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

INSERT IGNORE INTO smtp_settings (id) VALUES (1);
