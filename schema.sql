-- Car Spa LK database schema (structure only, no data).
-- Import order: run this file first, then the content seed.
-- MySQL 8 / MariaDB 10.5+

CREATE DATABASE IF NOT EXISTS carspa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE carspa;

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_users (
  id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)      NOT NULL,
  password_hash VARCHAR(255)     NOT NULL,
  created_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_users_username (username)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Media library
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS media (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  file_path  VARCHAR(255)  NOT NULL COMMENT 'relative to the media folder, e.g. products/chain-lube-featured.webp',
  alt_text   VARCHAR(255)  NOT NULL DEFAULT '',
  mime_type  VARCHAR(100)  NULL,
  file_size  INT UNSIGNED  NULL,
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_media_file_path (file_path)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS products (
  id                INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  slug              VARCHAR(120)   NOT NULL,
  name              VARCHAR(150)   NOT NULL,
  vehicle           ENUM('car','bike','both') NOT NULL DEFAULT 'both',
  category          VARCHAR(100)   NULL COMMENT 'product family shown in listing filters',
  price_lkr         DECIMAL(10,2)  NOT NULL,
  size              VARCHAR(50)    NULL,
  sku               VARCHAR(50)    NULL,
  listing_blurb     VARCHAR(255)   NULL COMMENT 'short text on listing cards',
  short_description TEXT           NULL,
  description_html  MEDIUMTEXT     NULL,
  features          JSON           NULL COMMENT 'array of bullet strings',
  specs             JSON           NULL COMMENT 'object of label -> value',
  how_to_use        JSON           NULL COMMENT 'array of steps',
  is_active         TINYINT(1)     NOT NULL DEFAULT 1,
  click_count       INT UNSIGNED   NOT NULL DEFAULT 0,
  created_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  KEY idx_products_active_created (is_active, created_at),
  KEY idx_products_active_clicks (is_active, click_count)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_images (
  id         INT UNSIGNED             NOT NULL AUTO_INCREMENT,
  product_id INT UNSIGNED             NOT NULL,
  media_id   INT UNSIGNED             NOT NULL,
  role       ENUM('featured','gallery') NOT NULL DEFAULT 'gallery',
  sort_order INT                      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_product_images_product (product_id, role, sort_order),
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT fk_product_images_media   FOREIGN KEY (media_id)   REFERENCES media (id)    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Testimonials and FAQs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS testimonials (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  quote         TEXT         NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  detail        VARCHAR(150) NULL COMMENT 'short context line shown under the name, e.g. 2 weeks ago',
  rating        TINYINT      NOT NULL DEFAULT 5,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order    INT          NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_testimonials_active (is_active, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS faqs (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  question   VARCHAR(255) NOT NULL,
  answer     TEXT         NOT NULL,
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order INT          NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_faqs_active (is_active, sort_order)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Site info
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key   VARCHAR(100) NOT NULL,
  setting_value TEXT         NULL,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS phone_numbers (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  number     VARCHAR(30)  NOT NULL,
  label      VARCHAR(100) NULL,
  type       ENUM('hotline','landline','whatsapp','other') NOT NULL DEFAULT 'other',
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_phone_numbers_active (is_active, sort_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS social_links (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  platform   VARCHAR(50)  NOT NULL COMMENT 'facebook, instagram, whatsapp, tiktok, youtube, x, other',
  label      VARCHAR(100) NULL,
  url        VARCHAR(255) NOT NULL,
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_social_links_active (is_active, sort_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS opening_hours (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  day_of_week TINYINT      NOT NULL COMMENT '0 = Monday ... 6 = Sunday',
  open_time   TIME         NULL,
  close_time  TIME         NULL,
  is_closed   TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_opening_hours_day (day_of_week)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS opening_hours_notes (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  note       VARCHAR(255) NOT NULL COMMENT 'free-form row, e.g. holiday hours',
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Legal pages
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS legal_pages (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug         VARCHAR(60)  NOT NULL,
  title        VARCHAR(150) NOT NULL,
  content_html MEDIUMTEXT   NOT NULL,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_legal_pages_slug (slug)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- SEO metadata (same field set for pages and products, separate tables)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS page_seo (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  page_key           VARCHAR(60)  NOT NULL COMMENT 'home, products, contact, cart, checkout, 404, privacy-policy, ...',
  path               VARCHAR(190) NOT NULL,
  seo_title          VARCHAR(70)  NULL,
  focus_keyphrase    VARCHAR(120) NULL,
  meta_description   VARCHAR(200) NULL,
  cornerstone        TINYINT(1)   NOT NULL DEFAULT 0,
  breadcrumbs_title  VARCHAR(120) NULL,
  canonical_url      VARCHAR(255) NULL COMMENT 'NULL means auto-generated from base URL + path',
  page_type          VARCHAR(50)  NOT NULL DEFAULT 'Default for Pages (Web Page)',
  article_type       VARCHAR(50)  NOT NULL DEFAULT 'Default for Pages (None)',
  social_title       VARCHAR(120) NULL,
  social_description VARCHAR(300) NULL,
  x_title            VARCHAR(120) NULL,
  x_description      VARCHAR(300) NULL,
  excerpt            TEXT         NULL,
  updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_page_seo_page_key (page_key)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_seo (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id         INT UNSIGNED NOT NULL,
  seo_title          VARCHAR(70)  NULL,
  focus_keyphrase    VARCHAR(120) NULL,
  meta_description   VARCHAR(200) NULL,
  cornerstone        TINYINT(1)   NOT NULL DEFAULT 0,
  breadcrumbs_title  VARCHAR(120) NULL,
  canonical_url      VARCHAR(255) NULL COMMENT 'NULL means auto-generated from base URL + product path',
  page_type          VARCHAR(50)  NOT NULL DEFAULT 'Item Page',
  article_type       VARCHAR(50)  NOT NULL DEFAULT 'None',
  social_title       VARCHAR(120) NULL,
  social_description VARCHAR(300) NULL,
  x_title            VARCHAR(120) NULL,
  x_description      VARCHAR(300) NULL,
  excerpt            TEXT         NULL,
  updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_product_seo_product (product_id),
  CONSTRAINT fk_product_seo_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB;
