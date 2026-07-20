-- Car Spa LK content seed. Git-tracked, safe to publish: this file never
-- touches admin_users, so it never resets your admin login on re-import.
-- Import order: 1) schema.sql (creates the tables), 2) this file, 3) create
-- the admin account separately (see PROJECT-STATUS.md), not stored here.
-- Neither schema.sql nor this file creates or selects a database, point
-- the client at your existing database yourself, e.g.
--   mysql -u dbuser -p dbname < schema.sql
--   mysql -u dbuser -p dbname < seed.sql

SET NAMES utf8mb4;

-- Clean slate so the seed can be re-imported without duplicating rows.
DELETE FROM product_images;
DELETE FROM product_seo;
DELETE FROM products;
DELETE FROM media;
DELETE FROM testimonials;
DELETE FROM faqs;
DELETE FROM site_settings;
DELETE FROM phone_numbers;
DELETE FROM social_links;
DELETE FROM opening_hours;
DELETE FROM opening_hours_notes;
DELETE FROM legal_pages;
DELETE FROM page_seo;

-- Media library (current product photography)
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/ac-disinfectant-spray-featured.webp', 'AC Disinfectant Spray', 'image/webp', 28328);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/brake-cleaner-featured.webp', 'Brake Cleaner', 'image/webp', 29618);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/chain-cleaner-featured.webp', 'Chain Cleaner', 'image/webp', 31048);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/chain-cleaner-gallery-01.webp', 'Chain Cleaner photo 01', 'image/webp', 39608);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/chain-cleaner-gallery-02.webp', 'Chain Cleaner photo 02', 'image/webp', 24808);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/chain-cleaner-gallery-03.webp', 'Chain Cleaner photo 03', 'image/webp', 59916);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/chain-cleaner-gallery-04.webp', 'Chain Cleaner photo 04', 'image/webp', 26932);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/chain-lube-featured.webp', 'Chain Lube', 'image/webp', 28492);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/chain-lube-gallery-01.webp', 'Chain Lube photo 01', 'image/webp', 29280);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/chain-lube-gallery-02.webp', 'Chain Lube photo 02', 'image/webp', 24210);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/chain-lube-gallery-03.webp', 'Chain Lube photo 03', 'image/webp', 55550);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/chain-lube-gallery-04.webp', 'Chain Lube photo 04', 'image/webp', 25286);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/engine-degreaser-featured.webp', 'Engine Degreaser', 'image/webp', 29914);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/engine-flush-2-wheeler-featured.webp', 'Engine Flush 2 Wheeler', 'image/webp', 23062);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/engine-flush-4-wheeler-featured.webp', 'Engine Flush 4 Wheeler', 'image/webp', 36720);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/headlight-polish-featured.webp', 'Headlight Polish', 'image/webp', 23436);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/insta-glaze-featured.webp', 'Insta Glaze', 'image/webp', 33130);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/insta-polish-featured.webp', 'Insta Polish', 'image/webp', 47874);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/insta-polish-gallery-01.webp', 'Insta Polish photo 01', 'image/webp', 56554);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/insta-polish-gallery-02.webp', 'Insta Polish photo 02', 'image/webp', 46246);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/insta-polish-gallery-03.webp', 'Insta Polish photo 03', 'image/webp', 47046);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/insta-polish-gallery-04.webp', 'Insta Polish photo 04', 'image/webp', 45770);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/one-step-rubbing-compound-featured.webp', 'One Step Rubbing Compound', 'image/webp', 29032);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/radiator-flush-featured.webp', 'Radiator Flush', 'image/webp', 27842);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/rust-off-featured.webp', 'Rust Off', 'image/webp', 26160);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/rust-off-gallery-01.webp', 'Rust Off photo 01', 'image/webp', 24566);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/rust-off-gallery-02.webp', 'Rust Off photo 02', 'image/webp', 24324);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/rust-off-gallery-03.webp', 'Rust Off photo 03', 'image/webp', 47450);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/rust-off-gallery-04.webp', 'Rust Off photo 04', 'image/webp', 23550);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/throttle-body-cleaner-featured.webp', 'Throttle Body Cleaner', 'image/webp', 29388);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/throttle-body-cleaner-gallery-01.webp', 'Throttle Body Cleaner photo 01', 'image/webp', 31388);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/throttle-body-cleaner-gallery-02.webp', 'Throttle Body Cleaner photo 02', 'image/webp', 23128);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/throttle-body-cleaner-gallery-03.webp', 'Throttle Body Cleaner photo 03', 'image/webp', 56084);
INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES ('products/throttle-body-cleaner-gallery-04.webp', 'Throttle Body Cleaner photo 04', 'image/webp', 24874);

-- Products
INSERT INTO products (slug, name, vehicle, category, price_lkr, size, sku, listing_blurb, short_description, description_html, features, specs, how_to_use, is_active) VALUES ('ac-disinfectant-spray', 'AC Disinfectant Spray', 'car', 'Interior & AC', 2650, '300 ml', NULL, NULL, 'A ready-to-use foam disinfectant designed for air-conditioning and heating systems. Kills bacteria and fungi at the source, controlling germ spread in enclosed spaces. Ideal for vehicles, home and office.', '<p class="pd-desc">A ready-to-use foam disinfectant designed for air-conditioning and heating systems. Kills bacteria and fungi at the source, controlling germ spread in enclosed spaces. Ideal for vehicles, home and office.</p>', '["Ready-to-use foam disinfectant","Cleans instantly","Kills bacteria and fungi at the source","Designed for air-conditioning and heating systems","Suitable for vehicles, home and office"]', '{"Size":"300 ml","Brand":"Arkos Vetek","Suitable for":"Cars (4-wheelers)","Delivery":"Island-wide, 2–4 days"}', NULL, 1);
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'featured', 0 FROM products p, media m WHERE p.slug = 'ac-disinfectant-spray' AND m.file_path = 'products/ac-disinfectant-spray-featured.webp';
INSERT INTO product_seo (product_id, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) SELECT p.id, 'AC Disinfectant Spray 300 ml | Car Spa LK', 'ac disinfectant spray sri lanka', 'Foam disinfectant for car AC and heating systems. Kills bacteria and fungi at the source. 300 ml, Rs. 2,650, island-wide delivery across Sri Lanka.', 0, 'AC Disinfectant Spray', NULL, 'Item Page', 'None', 'AC Disinfectant Spray by Arkos Vetek | Car Spa LK', 'Musty smell from your AC vents? This ready-to-use foam disinfectant kills bacteria and fungi at the source. Works in vehicles, homes and offices. Rs. 2,650 for 300 ml, delivered island-wide in Sri Lanka.', 'AC Disinfectant Spray | Car Spa LK', 'Ready-to-use foam disinfectant for AC and heating systems. Kills bacteria and fungi at the source. 300 ml, Rs. 2,650, delivered island-wide.', 'A ready-to-use foam disinfectant for air-conditioning and heating systems that kills bacteria and fungi at the source. Suitable for vehicles, home and office, with island-wide delivery across Sri Lanka.' FROM products p WHERE p.slug = 'ac-disinfectant-spray';

INSERT INTO products (slug, name, vehicle, category, price_lkr, size, sku, listing_blurb, short_description, description_html, features, specs, how_to_use, is_active) VALUES ('brake-cleaner', 'Brake Cleaner', 'both', 'Brake & Underbody', 2200, '500 ml', 'E-ARK-006', NULL, 'A non-chlorinated, non-carcinogenic formula that degreases brake components instantly. Cleans fast, dries quickly, and helps eliminate disc brake squeal and chatter.', '<p class="pd-desc">A non-chlorinated, non-carcinogenic formula that degreases brake components instantly. Cleans fast, dries quickly, and helps eliminate disc brake squeal and chatter.</p>', '["Degreases brake components instantly","Cleans fast and dries quickly","Helps eliminate disc brake squeal and chatter","Non-chlorinated","Non-carcinogenic"]', '{"Size":"500 ml","Part No":"E-ARK-006","Brand":"Arkos Vetek","Suitable for":"Cars & bikes","Delivery":"Island-wide, 2–4 days"}', NULL, 1);
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'featured', 0 FROM products p, media m WHERE p.slug = 'brake-cleaner' AND m.file_path = 'products/brake-cleaner-featured.webp';
INSERT INTO product_seo (product_id, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) SELECT p.id, 'Brake Cleaner 500 ml | Arkos Vetek | Car Spa LK', 'brake cleaner sri lanka', 'Non-chlorinated brake cleaner that degreases brake parts instantly, dries fast and stops disc brake squeal. 500 ml Arkos Vetek spray, island-wide delivery.', 0, 'Brake Cleaner', NULL, 'Item Page', 'None', 'Brake Cleaner by Arkos Vetek | Car Spa LK', 'Degrease brake components instantly with this non-chlorinated, non-carcinogenic 500 ml spray. Helps eliminate disc brake squeal and chatter. Rs. 2,200 with island-wide delivery across Sri Lanka.', 'Brake Cleaner | Car Spa LK', 'Non-chlorinated 500 ml brake cleaner that degreases instantly, dries fast and quiets disc brake squeal. Delivered island-wide in Sri Lanka.', 'A non-chlorinated, non-carcinogenic brake cleaner from Arkos Vetek that degreases brake components instantly and dries fast. Helps eliminate disc brake squeal and chatter on cars and bikes.' FROM products p WHERE p.slug = 'brake-cleaner';

INSERT INTO products (slug, name, vehicle, category, price_lkr, size, sku, listing_blurb, short_description, description_html, features, specs, how_to_use, is_active) VALUES ('chain-cleaner', 'Chain Cleaner', 'bike', 'Bike & Chain Care', 3000, '500 ml', 'E-ARK-004', NULL, 'A non-corrosive, deep-cleaning spray that removes grease and grime, cleaning thrown-off chain gunk from chains and swing arms for smooth running. O-ring, X-ring and Z-ring compatible.', '<p class="pd-desc">A non-corrosive, deep-cleaning spray that removes grease and grime, cleaning thrown-off chain gunk from chains and swing arms for smooth running. O-ring, X-ring and Z-ring compatible.</p>', '["Non-corrosive, deep-cleaning formula","Removes grease and grime","Cleans thrown-off chain gunk and swing arms","Keeps the drivetrain running smooth","O-ring, X-ring and Z-ring compatible"]', '{"Size":"500 ml","Part No":"E-ARK-004","Brand":"Arkos Vetek","Suitable for":"Bikes (2-wheelers)","Delivery":"Island-wide, 2–4 days"}', NULL, 1);
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'featured', 0 FROM products p, media m WHERE p.slug = 'chain-cleaner' AND m.file_path = 'products/chain-cleaner-featured.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 1 FROM products p, media m WHERE p.slug = 'chain-cleaner' AND m.file_path = 'products/chain-cleaner-gallery-01.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 2 FROM products p, media m WHERE p.slug = 'chain-cleaner' AND m.file_path = 'products/chain-cleaner-gallery-02.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 3 FROM products p, media m WHERE p.slug = 'chain-cleaner' AND m.file_path = 'products/chain-cleaner-gallery-03.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 4 FROM products p, media m WHERE p.slug = 'chain-cleaner' AND m.file_path = 'products/chain-cleaner-gallery-04.webp';
INSERT INTO product_seo (product_id, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) SELECT p.id, 'Chain Cleaner 500 ml | Arkos Vetek | Car Spa LK', 'bike chain cleaner sri lanka', 'Non-corrosive chain cleaner spray from Arkos Vetek. Removes grease, grime and thrown-off gunk from chains and swing arms. O-ring, X-ring and Z-ring safe.', 0, 'Chain Cleaner', NULL, 'Item Page', 'None', 'Chain Cleaner | Arkos Vetek Bike & Chain Care', 'Deep-cleaning, non-corrosive spray that lifts grease and chain gunk from chains and swing arms. 500 ml, Rs. 3,000, island-wide delivery across Sri Lanka.', 'Chain Cleaner 500 ml | Car Spa LK', 'Non-corrosive deep-cleaning spray for bike chains and swing arms. O-ring, X-ring and Z-ring safe. Rs. 3,000 for 500 ml.', 'A non-corrosive, deep-cleaning spray that strips grease, grime and thrown-off chain gunk from bike chains and swing arms. Safe on O-ring, X-ring and Z-ring chains.' FROM products p WHERE p.slug = 'chain-cleaner';

INSERT INTO products (slug, name, vehicle, category, price_lkr, size, sku, listing_blurb, short_description, description_html, features, specs, how_to_use, is_active) VALUES ('chain-lube', 'Chain Lube', 'bike', 'Bike & Chain Care', 3000, '500 ml', 'E-ARK-003', NULL, 'A foaming-action adhesive chain lubricant with deep penetration and wide coverage. The tackifier formula reduces friction and metal fatigue, extending chain life. O-ring, X-ring and Z-ring compatible.', '<p class="pd-desc">A foaming-action adhesive chain lubricant with deep penetration and wide coverage. The tackifier formula reduces friction and metal fatigue, extending chain life. O-ring, X-ring and Z-ring compatible.</p>', '["Foaming action with deep penetration","Wide lubrication coverage","Tackifier formula reduces friction and metal fatigue","Extends chain life","O-ring, X-ring and Z-ring compatible"]', '{"Size":"500 ml","Part No":"E-ARK-003","Brand":"Arkos Vetek","Suitable for":"Bikes (2-wheelers)","Delivery":"Island-wide, 2–4 days"}', NULL, 1);
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'featured', 0 FROM products p, media m WHERE p.slug = 'chain-lube' AND m.file_path = 'products/chain-lube-featured.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 1 FROM products p, media m WHERE p.slug = 'chain-lube' AND m.file_path = 'products/chain-lube-gallery-01.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 2 FROM products p, media m WHERE p.slug = 'chain-lube' AND m.file_path = 'products/chain-lube-gallery-02.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 3 FROM products p, media m WHERE p.slug = 'chain-lube' AND m.file_path = 'products/chain-lube-gallery-03.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 4 FROM products p, media m WHERE p.slug = 'chain-lube' AND m.file_path = 'products/chain-lube-gallery-04.webp';
INSERT INTO product_seo (product_id, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) SELECT p.id, 'Chain Lube 500 ml, Arkos Vetek | Car Spa LK', 'chain lube sri lanka', 'Foaming adhesive chain lube with deep penetration and a tackifier formula. O-ring, X-ring and Z-ring safe. 500 ml, Rs. 3,000, delivered across Sri Lanka.', 0, 'Chain Lube', NULL, 'Item Page', 'None', 'Chain Lube by Arkos Vetek | Car Spa LK', 'A foaming-action adhesive chain lubricant that penetrates deep, coats wide and cuts friction to extend chain life. Safe on O-ring, X-ring and Z-ring chains.', 'Chain Lube | Car Spa LK', 'Foaming adhesive chain lube for bikes. Reduces friction and metal fatigue, extends chain life. 500 ml at Rs. 3,000 with island-wide delivery.', 'A foaming-action adhesive chain lubricant from Arkos Vetek that penetrates deep and coats wide. The tackifier formula cuts friction and metal fatigue, extending chain life on O-ring, X-ring and Z-ring chains.' FROM products p WHERE p.slug = 'chain-lube';

INSERT INTO products (slug, name, vehicle, category, price_lkr, size, sku, listing_blurb, short_description, description_html, features, specs, how_to_use, is_active) VALUES ('engine-degreaser', 'Engine Degreaser', 'car', 'Engine Care', 3600, '1000 ml', 'E-ARK-009', NULL, 'An advanced water-based formula that cuts through tough engine bay grease and grime. Powerful on metal, gentle on rubber and plastic.', '<p class="pd-desc">An advanced water-based formula that cuts through tough engine bay grease and grime. Powerful on metal, gentle on rubber and plastic.</p>', '["Cuts through tough grease and grime","Advanced water-based formula","Powerful solvents for deep metal cleaning","Gentle on rubber and plastic"]', '{"Size":"1000 ml","Part No":"E-ARK-009","Brand":"Arkos Vetek","Suitable for":"Cars (4-wheelers)","Delivery":"Island-wide, 2–4 days"}', NULL, 1);
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'featured', 0 FROM products p, media m WHERE p.slug = 'engine-degreaser' AND m.file_path = 'products/engine-degreaser-featured.webp';
INSERT INTO product_seo (product_id, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) SELECT p.id, 'Engine Degreaser 1000 ml | Car Spa LK', 'engine degreaser sri lanka', 'Buy Arkos Vetek Engine Degreaser (1000 ml) in Sri Lanka for Rs. 3,600. Water-based formula cuts engine bay grease, gentle on rubber and plastic.', 0, 'Engine Degreaser', NULL, 'Item Page', 'None', 'Engine Degreaser | Car Spa LK', 'Genuine Arkos Vetek Engine Degreaser, 1000 ml for Rs. 3,600. Cuts tough engine bay grease and grime while staying gentle on rubber and plastic. Island-wide delivery across Sri Lanka.', 'Engine Degreaser | Car Spa LK', 'Arkos Vetek Engine Degreaser, 1000 ml, Rs. 3,600. Water-based formula that cuts engine bay grease yet stays gentle on rubber and plastic.', 'An advanced water-based degreaser that cuts through tough engine bay grease and grime while staying gentle on rubber and plastic. Genuine Arkos Vetek, 1000 ml, delivered island-wide in Sri Lanka.' FROM products p WHERE p.slug = 'engine-degreaser';

INSERT INTO products (slug, name, vehicle, category, price_lkr, size, sku, listing_blurb, short_description, description_html, features, specs, how_to_use, is_active) VALUES ('engine-flush-2-wheeler', 'Engine Flush 2 Wheeler', 'bike', 'Engine Care', 950, '50 ml', NULL, NULL, 'The same trusted 10-minute sludge-dissolving treatment, sized for motorcycles and scooters. Pour it in before an oil change and let it clean where fresh oil alone can''t.', '<p class="pd-desc">The same trusted 10-minute sludge-dissolving treatment, sized for motorcycles and scooters. Pour it in before an oil change and let it clean where fresh oil alone can''t.</p>', '["Dissolves sludge inside the engine","Cleans the engine in 10 minutes of idling","Sized for motorcycles and scooters"]', '{"Size":"50 ml","Brand":"Arkos Vetek","Suitable for":"Bikes (2-wheelers)","Delivery":"Island-wide, 2–4 days"}', '["Add the full bottle to warm engine oil before an oil change.","Idle for 10 minutes. Do not ride.","Drain the old oil and refill with fresh oil."]', 1);
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'featured', 0 FROM products p, media m WHERE p.slug = 'engine-flush-2-wheeler' AND m.file_path = 'products/engine-flush-2-wheeler-featured.webp';
INSERT INTO product_seo (product_id, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) SELECT p.id, 'Engine Flush 2 Wheeler 50 ml | Car Spa LK', 'motorcycle engine flush sri lanka', 'Arkos Vetek engine flush for motorcycles and scooters. 50 ml dissolves sludge in 10 minutes of idling before an oil change. Island-wide delivery.', 0, 'Engine Flush 2 Wheeler', NULL, 'Item Page', 'None', 'Engine Flush 2 Wheeler (50 ml) | Car Spa LK', 'The trusted 10-minute sludge-dissolving treatment, sized for motorcycles and scooters. Genuine Arkos Vetek, delivered island-wide in Sri Lanka.', 'Engine Flush 2 Wheeler (50 ml)', 'Dissolves engine sludge in 10 minutes of idling before an oil change. Genuine Arkos Vetek for bikes and scooters, delivered across Sri Lanka.', 'A 50 ml engine flush for motorcycles and scooters that dissolves sludge in 10 minutes of idling before an oil change. Genuine Arkos Vetek, Rs. 950 with island-wide delivery.' FROM products p WHERE p.slug = 'engine-flush-2-wheeler';

INSERT INTO products (slug, name, vehicle, category, price_lkr, size, sku, listing_blurb, short_description, description_html, features, specs, how_to_use, is_active) VALUES ('engine-flush-4-wheeler', 'Engine Flush 4 Wheeler', 'car', 'Engine Care', 2950, '250 ml / 200 g', NULL, NULL, 'A powerful pre-oil-change treatment that dissolves years of sludge and varnish inside your engine in just 10 minutes of idling. Frees sticky lifters, opens restricted oil passages and removes power-robbing deposits before your oil change.', '<p class="pd-desc">A powerful pre-oil-change treatment that dissolves years of sludge and varnish inside your engine in just 10 minutes of idling. Frees sticky lifters, opens restricted oil passages and removes power-robbing deposits before your oil change.</p>', '["Dissolves sludge and varnish deposits","Cleans the engine in 10 minutes of idling","Opens restricted oil passages","Frees sticky lifters","Dissolves power-robbing deposits","Formulated for 4-wheelers"]', '{"Size":"250 ml / 200 g","Brand":"Arkos Vetek","Product type":"Engine oil flush","Suitable for":"Cars (4-wheelers)","Delivery":"Island-wide, 2–4 days"}', '["Add the full can to warm engine oil before an oil change.","Idle for 10 minutes.","Do not drive.","Drain the old oil, replace the filter and refill with fresh oil."]', 1);
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'featured', 0 FROM products p, media m WHERE p.slug = 'engine-flush-4-wheeler' AND m.file_path = 'products/engine-flush-4-wheeler-featured.webp';
INSERT INTO product_seo (product_id, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) SELECT p.id, 'Engine Flush 4 Wheeler | Arkos Vetek | Car Spa LK', 'engine flush sri lanka', 'Arkos Vetek Engine Flush (250 ml, Rs. 2,950) dissolves sludge and varnish in 10 minutes of idling before your oil change. Island-wide delivery in Sri Lanka.', 0, 'Engine Flush 4 Wheeler', NULL, 'Item Page', 'None', 'Engine Flush 4 Wheeler | Car Spa LK', 'Ten minutes of idling is all it takes. This genuine Arkos Vetek engine flush dissolves years of sludge, frees sticky lifters and opens restricted oil passages before your next oil change.', 'Engine Flush 4 Wheeler | Car Spa LK', 'Dissolves sludge, frees sticky lifters and opens oil passages in 10 minutes of idling. Rs. 2,950, island-wide delivery in Sri Lanka.', 'A pre-oil-change treatment for cars that dissolves sludge and varnish in just 10 minutes of idling. Genuine Arkos Vetek, 250 ml / 200 g, Rs. 2,950 with island-wide delivery across Sri Lanka.' FROM products p WHERE p.slug = 'engine-flush-4-wheeler';

INSERT INTO products (slug, name, vehicle, category, price_lkr, size, sku, listing_blurb, short_description, description_html, features, specs, how_to_use, is_active) VALUES ('headlight-polish', 'Headlight Polish', 'bike', 'Exterior & Shine', 1150, '50 g', 'E-ARK-008', NULL, 'Restores cloudy, yellowed headlights to crystal clarity in minutes. Improves light output and night-driving visibility. No power tools needed.', '<p class="pd-desc">Restores cloudy, yellowed headlights to crystal clarity in minutes. Improves light output and night-driving visibility. No power tools needed.</p>', '["Restores cloudy or yellowed headlights","Improves clarity and visibility","Works by hand, no machine required"]', '{"Size":"50 g","Part No":"E-ARK-008","Brand":"Arkos Vetek","Suitable for":"Bikes (2-wheelers)","Delivery":"Island-wide, 2–4 days"}', NULL, 1);
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'featured', 0 FROM products p, media m WHERE p.slug = 'headlight-polish' AND m.file_path = 'products/headlight-polish-featured.webp';
INSERT INTO product_seo (product_id, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) SELECT p.id, 'Headlight Polish 50 g | Car Spa LK', 'headlight polish sri lanka', 'Arkos Vetek Headlight Polish 50 g, Rs. 1,150. Restores cloudy, yellowed headlights by hand, no machine needed. Island-wide delivery in 2 to 4 days.', 0, 'Headlight Polish', NULL, 'Item Page', 'None', 'Headlight Polish: Restore Cloudy Headlights in Minutes', 'Cloudy, yellowed headlights? This 50 g Arkos Vetek polish brings back crystal clarity by hand, no power tools needed. Rs. 1,150 with island-wide delivery from Car Spa LK.', 'Headlight Polish | Car Spa LK', 'Restore cloudy, yellowed headlights to crystal clarity by hand. Arkos Vetek, 50 g, Rs. 1,150. Island-wide delivery across Sri Lanka.', 'Headlight Polish restores cloudy, yellowed headlights to crystal clarity in minutes and improves night-driving visibility. A 50 g Arkos Vetek product that works by hand, with no machine required.' FROM products p WHERE p.slug = 'headlight-polish';

INSERT INTO products (slug, name, vehicle, category, price_lkr, size, sku, listing_blurb, short_description, description_html, features, specs, how_to_use, is_active) VALUES ('insta-glaze', 'Insta Glaze', 'car', 'Exterior & Shine', 9990, '1 kg', 'E-ARK-010', NULL, 'A professional glaze that delivers a deep, wet-look finish. Safe on all paint surfaces, it boosts gloss and shine in a single application.', '<p class="pd-desc">A professional glaze that delivers a deep, wet-look finish. Safe on all paint surfaces, it boosts gloss and shine in a single application.</p>', '["Delivers a deep, wet-look finish","Boosts gloss and shine","Safe on all paint surfaces"]', '{"Size":"1 kg","Part No":"E-ARK-010","Brand":"Arkos Vetek","Suitable for":"Cars (4-wheelers)","Delivery":"Island-wide, 2–4 days","Product type":"Glaze polish"}', NULL, 1);
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'featured', 0 FROM products p, media m WHERE p.slug = 'insta-glaze' AND m.file_path = 'products/insta-glaze-featured.webp';
INSERT INTO product_seo (product_id, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) SELECT p.id, 'Insta Glaze Car Polish in Sri Lanka | Car Spa LK', 'car glaze polish sri lanka', 'Insta Glaze by Arkos Vetek gives your car a deep, wet-look shine in one application. 1 kg, Rs. 9,990, safe on all paint. Island-wide delivery in Sri Lanka.', 0, 'Insta Glaze', NULL, 'Item Page', 'None', 'Insta Glaze: Deep Wet-Look Shine in One Application', 'Professional Arkos Vetek glaze that boosts gloss and delivers a wet-look finish, safe on all paint surfaces. Rs. 9,990 for 1 kg, delivered island-wide in Sri Lanka.', 'Insta Glaze | Car Spa LK', 'Deep, wet-look shine in a single application. Genuine Arkos Vetek glaze, 1 kg for Rs. 9,990 with island-wide delivery across Sri Lanka.', 'Insta Glaze is a professional Arkos Vetek glaze that delivers a deep, wet-look finish and boosts gloss in a single application. Safe on all paint surfaces, sold in 1 kg packs at Rs. 9,990.' FROM products p WHERE p.slug = 'insta-glaze';

INSERT INTO products (slug, name, vehicle, category, price_lkr, size, sku, listing_blurb, short_description, description_html, features, specs, how_to_use, is_active) VALUES ('insta-polish', 'Insta Polish', 'both', 'Interior & AC', 250, 'Single-use sachet', 'E-ARK-005', NULL, 'An easy-to-use dashboard polish sachet that delivers an instant glossy finish. Safe on plastic and painted surfaces, for both bikes and cars.', '<p class="pd-desc">An easy-to-use dashboard polish sachet that delivers an instant glossy finish. Safe on plastic and painted surfaces, for both bikes and cars.</p>', '["Easy to use, quick shine in seconds","Instant glossy finish","Dashboard safe","Safe on plastic and painted surfaces","For bike and car dashboards"]', '{"Size":"Single-use sachet","Part No":"E-ARK-005","Brand":"Arkos Vetek","Suitable for":"Cars & bikes","Delivery":"Island-wide, 2–4 days"}', NULL, 1);
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'featured', 0 FROM products p, media m WHERE p.slug = 'insta-polish' AND m.file_path = 'products/insta-polish-featured.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 1 FROM products p, media m WHERE p.slug = 'insta-polish' AND m.file_path = 'products/insta-polish-gallery-01.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 2 FROM products p, media m WHERE p.slug = 'insta-polish' AND m.file_path = 'products/insta-polish-gallery-02.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 3 FROM products p, media m WHERE p.slug = 'insta-polish' AND m.file_path = 'products/insta-polish-gallery-03.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 4 FROM products p, media m WHERE p.slug = 'insta-polish' AND m.file_path = 'products/insta-polish-gallery-04.webp';
INSERT INTO product_seo (product_id, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) SELECT p.id, 'Insta Polish | Instant Dashboard Shine | Car Spa LK', 'dashboard polish sri lanka', 'Insta Polish is a single-use dashboard polish sachet from Arkos Vetek. Instant glossy finish, safe on plastic and paint, Rs. 250 with island-wide delivery.', 0, 'Insta Polish', NULL, 'Item Page', 'None', 'Insta Polish: Instant Dashboard Shine for Cars and Bikes', 'A Rs. 250 single-use sachet that gives car and bike dashboards an instant glossy finish. Safe on plastic and painted surfaces, delivered island-wide in Sri Lanka.', 'Insta Polish | Car Spa LK', 'Single-use dashboard polish sachet by Arkos Vetek. Instant gloss, safe on plastic and paint, Rs. 250 with island-wide delivery in Sri Lanka.', 'Insta Polish is a Rs. 250 single-use sachet from Arkos Vetek that gives car and bike dashboards an instant glossy finish. It is safe on plastic and painted surfaces and ships island-wide in Sri Lanka.' FROM products p WHERE p.slug = 'insta-polish';

INSERT INTO products (slug, name, vehicle, category, price_lkr, size, sku, listing_blurb, short_description, description_html, features, specs, how_to_use, is_active) VALUES ('one-step-rubbing-compound', 'One Step Rubbing Compound', 'car', 'Exterior & Shine', 9890, '1 kg', 'E-ARK-011', NULL, 'A one-step compound that instantly removes scratches and oxidation, then restores a high-gloss showroom finish. The professional detailer''s shortcut, in one tub.', '<p class="pd-desc">A one-step compound that instantly removes scratches and oxidation, then restores a high-gloss showroom finish. The professional detailer''s shortcut, in one tub.</p>', '["Instantly removes scratches","Removes oxidation and swirl marks","Restores shine and gloss","Delivers a high-gloss showroom finish"]', '{"Size":"1 kg","Part No":"E-ARK-011","Brand":"Arkos Vetek","Suitable for":"Cars (4-wheelers)","Delivery":"Island-wide, 2–4 days"}', NULL, 1);
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'featured', 0 FROM products p, media m WHERE p.slug = 'one-step-rubbing-compound' AND m.file_path = 'products/one-step-rubbing-compound-featured.webp';
INSERT INTO product_seo (product_id, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) SELECT p.id, 'One Step Rubbing Compound | Car Spa LK', 'rubbing compound sri lanka', 'Arkos Vetek One Step Rubbing Compound, 1 kg. Removes scratches, swirl marks and oxidation and restores a high-gloss showroom finish. Island-wide delivery.', 0, 'One Step Rubbing Compound', NULL, 'Item Page', 'None', 'One Step Rubbing Compound, 1 kg | Car Spa LK', 'One tub removes scratches, swirl marks and oxidation, then restores a high-gloss showroom finish. Genuine Arkos Vetek, Rs. 9,890, delivered across Sri Lanka.', 'One Step Rubbing Compound | Car Spa LK', 'Scratches, swirl marks and oxidation gone in one step. Arkos Vetek 1 kg tub, Rs. 9,890 with island-wide delivery in Sri Lanka.', 'A one-step compound from Arkos Vetek that removes scratches, swirl marks and oxidation, then restores a high-gloss showroom finish. Sold in a 1 kg tub for cars.' FROM products p WHERE p.slug = 'one-step-rubbing-compound';

INSERT INTO products (slug, name, vehicle, category, price_lkr, size, sku, listing_blurb, short_description, description_html, features, specs, how_to_use, is_active) VALUES ('radiator-flush', 'Radiator Flush', 'car', 'Engine Care', 2100, '250 ml', 'E-ARK-007', NULL, 'Removes rust, grime and buildup from your cooling system to restore efficiency and protect your engine. A simple pre-coolant-change treatment for 4-wheelers.', '<p class="pd-desc">Removes rust, grime and buildup from your cooling system to restore efficiency and protect your engine. A simple pre-coolant-change treatment for 4-wheelers.</p>', '["Removes rust, grime and buildup from the cooling system","Restores cooling efficiency","Improves performance","Extends vehicle life","For 4-wheelers"]', '{"Size":"250 ml","Part No":"E-ARK-007","Brand":"Arkos Vetek","Suitable for":"Cars (4-wheelers)","Delivery":"Island-wide, 2–4 days"}', NULL, 1);
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'featured', 0 FROM products p, media m WHERE p.slug = 'radiator-flush' AND m.file_path = 'products/radiator-flush-featured.webp';
INSERT INTO product_seo (product_id, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) SELECT p.id, 'Radiator Flush 250 ml | Car Spa LK', 'radiator flush sri lanka', 'Arkos Vetek Radiator Flush, 250 ml, Rs. 2,100. Removes rust, grime and buildup from your car''s cooling system before a coolant change. Island-wide delivery.', 0, 'Radiator Flush', NULL, 'Item Page', 'None', 'Radiator Flush by Arkos Vetek | Car Spa LK', 'Genuine Arkos Vetek Radiator Flush in Sri Lanka. Clears rust, grime and buildup from your cooling system to keep your engine running cool. Rs. 2,100 for 250 ml.', 'Radiator Flush | Car Spa LK', 'Arkos Vetek Radiator Flush, 250 ml, Rs. 2,100. Cleans rust and buildup from your car''s cooling system. Delivered island-wide in Sri Lanka.', 'A pre-coolant-change treatment that removes rust, grime and buildup from your car''s cooling system. Genuine Arkos Vetek product, 250 ml, delivered island-wide in Sri Lanka.' FROM products p WHERE p.slug = 'radiator-flush';

INSERT INTO products (slug, name, vehicle, category, price_lkr, size, sku, listing_blurb, short_description, description_html, features, specs, how_to_use, is_active) VALUES ('rust-off', 'Rust Off', 'both', 'Brake & Underbody', 2250, '500 ml', 'E-ARK-001', NULL, 'A multipurpose light oil that lubricates, penetrates and prevents rust. Frees rusted nuts and bolts, eliminates squeaks and protects metal from corrosion.', '<p class="pd-desc">A multipurpose light oil that lubricates, penetrates and prevents rust. Frees rusted nuts and bolts, eliminates squeaks and protects metal from corrosion.</p>', '["Lubricates, penetrates and prevents rust","Frees rusted nuts and bolts","Cleans and lubricates hinges","Eliminates squeaks and reduces friction","Automotive, industrial, marine and home use"]', '{"Size":"500 ml","Part No":"E-ARK-001","Brand":"Arkos Vetek","Suitable for":"Cars & bikes","Delivery":"Island-wide, 2–4 days"}', NULL, 1);
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'featured', 0 FROM products p, media m WHERE p.slug = 'rust-off' AND m.file_path = 'products/rust-off-featured.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 1 FROM products p, media m WHERE p.slug = 'rust-off' AND m.file_path = 'products/rust-off-gallery-01.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 2 FROM products p, media m WHERE p.slug = 'rust-off' AND m.file_path = 'products/rust-off-gallery-02.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 3 FROM products p, media m WHERE p.slug = 'rust-off' AND m.file_path = 'products/rust-off-gallery-03.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 4 FROM products p, media m WHERE p.slug = 'rust-off' AND m.file_path = 'products/rust-off-gallery-04.webp';
INSERT INTO product_seo (product_id, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) SELECT p.id, 'Rust Off 500 ml Rust Remover & Lubricant | Car Spa LK', 'rust remover sri lanka', 'Rust Off by Arkos Vetek: a 500 ml light oil that penetrates rust, frees seized nuts and bolts and stops corrosion. Rs. 2,250 island-wide in Sri Lanka.', 0, 'Rust Off', NULL, 'Item Page', 'None', 'Rust Off | Rust Remover & Lubricant by Arkos Vetek', 'One light oil for rusted bolts, squeaky hinges and corrosion protection. Genuine Arkos Vetek, 500 ml, Rs. 2,250 from Car Spa LK with island-wide delivery.', 'Rust Off | Car Spa LK', 'Penetrating light oil that frees rusted nuts and bolts, stops squeaks and prevents rust. 500 ml, Rs. 2,250, delivered island-wide in Sri Lanka.', 'A multipurpose light oil from Arkos Vetek that penetrates rust, frees seized nuts and bolts and keeps metal protected from corrosion. Sold as a 500 ml bottle for automotive, industrial, marine and home use.' FROM products p WHERE p.slug = 'rust-off';

INSERT INTO products (slug, name, vehicle, category, price_lkr, size, sku, listing_blurb, short_description, description_html, features, specs, how_to_use, is_active) VALUES ('throttle-body-cleaner', 'Throttle Body Cleaner', 'both', 'Engine Care', 1500, '500 ml', 'E-ARK-002', NULL, 'A super jet spray that blasts away grease, gum and varnish from throttle bodies, carburettors and chokes, instantly. Oxygen sensor safe and fully VOC compliant.', '<p class="pd-desc">A super jet spray that blasts away grease, gum and varnish from throttle bodies, carburettors and chokes, instantly. Oxygen sensor safe and fully VOC compliant.</p>', '["Super jet spray blasts away grease, gum and varnish","Keeps throttle bodies, carburettors and chokes spotless","Enhances engine response and efficiency","Oxygen sensor safe","VOC compliant"]', '{"Size":"500 ml","Part No":"E-ARK-002","Brand":"Arkos Vetek","Suitable for":"Cars & bikes","Delivery":"Island-wide, 2–4 days"}', NULL, 1);
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'featured', 0 FROM products p, media m WHERE p.slug = 'throttle-body-cleaner' AND m.file_path = 'products/throttle-body-cleaner-featured.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 1 FROM products p, media m WHERE p.slug = 'throttle-body-cleaner' AND m.file_path = 'products/throttle-body-cleaner-gallery-01.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 2 FROM products p, media m WHERE p.slug = 'throttle-body-cleaner' AND m.file_path = 'products/throttle-body-cleaner-gallery-02.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 3 FROM products p, media m WHERE p.slug = 'throttle-body-cleaner' AND m.file_path = 'products/throttle-body-cleaner-gallery-03.webp';
INSERT INTO product_images (product_id, media_id, role, sort_order) SELECT p.id, m.id, 'gallery', 4 FROM products p, media m WHERE p.slug = 'throttle-body-cleaner' AND m.file_path = 'products/throttle-body-cleaner-gallery-04.webp';
INSERT INTO product_seo (product_id, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) SELECT p.id, 'Throttle Body Cleaner Sri Lanka | Car Spa LK', 'throttle body cleaner sri lanka', 'Arkos Vetek Throttle Body Cleaner 500 ml, Rs. 1,500. Jet spray removes grease, gum and varnish from throttle bodies and carburettors. Island-wide delivery.', 0, 'Throttle Body Cleaner', NULL, 'Item Page', 'None', 'Throttle Body Cleaner (500 ml) | Car Spa LK', 'A super jet spray that blasts grease, gum and varnish out of throttle bodies, carburettors and chokes. Oxygen sensor safe and VOC compliant. Rs. 1,500 for 500 ml, delivered island-wide in Sri Lanka.', 'Throttle Body Cleaner (500 ml) | Car Spa LK', 'Jet spray cleaner for throttle bodies, carburettors and chokes. Oxygen sensor safe, VOC compliant. Rs. 1,500, island-wide delivery in Sri Lanka.', 'Genuine Arkos Vetek Throttle Body Cleaner in a 500 ml jet spray that clears grease, gum and varnish from throttle bodies, carburettors and chokes. Oxygen sensor safe, VOC compliant, and suitable for both cars and bikes.' FROM products p WHERE p.slug = 'throttle-body-cleaner';

-- Media library (testimonial photos)
INSERT INTO media (file_path, title, alt_text, mime_type, file_size) VALUES ('testimonials/ashan-gunasekera.jpg', 'Ashan Gunasekera', 'Ashan Gunasekera', 'image/jpeg', 50948);
INSERT INTO media (file_path, title, alt_text, mime_type, file_size) VALUES ('testimonials/chamari-ratnayake.jpg', 'Chamari Ratnayake', 'Chamari Ratnayake', 'image/jpeg', 62368);
INSERT INTO media (file_path, title, alt_text, mime_type, file_size) VALUES ('testimonials/dinesh-abeysekera.jpg', 'Dinesh Abeysekera', 'Dinesh Abeysekera', 'image/jpeg', 58631);
INSERT INTO media (file_path, title, alt_text, mime_type, file_size) VALUES ('testimonials/iresha-kodikara.jpg', 'Iresha Kodikara', 'Iresha Kodikara', 'image/jpeg', 57388);
INSERT INTO media (file_path, title, alt_text, mime_type, file_size) VALUES ('testimonials/kasun-perera.jpg', 'Kasun Perera', 'Kasun Perera', 'image/jpeg', 61231);
INSERT INTO media (file_path, title, alt_text, mime_type, file_size) VALUES ('testimonials/nadeesha-fernando.jpg', 'Nadeesha Fernando', 'Nadeesha Fernando', 'image/jpeg', 58018);
INSERT INTO media (file_path, title, alt_text, mime_type, file_size) VALUES ('testimonials/nilmini-silva.jpg', 'Nilmini Silva', 'Nilmini Silva', 'image/jpeg', 68895);
INSERT INTO media (file_path, title, alt_text, mime_type, file_size) VALUES ('testimonials/priyantha-wickramasinghe.jpg', 'Priyantha Wickramasinghe', 'Priyantha Wickramasinghe', 'image/jpeg', 51264);
INSERT INTO media (file_path, title, alt_text, mime_type, file_size) VALUES ('testimonials/ruwan-jayasuriya.jpg', 'Ruwan Jayasuriya', 'Ruwan Jayasuriya', 'image/jpeg', 54506);
INSERT INTO media (file_path, title, alt_text, mime_type, file_size) VALUES ('testimonials/sampath-herath.jpg', 'Sampath Herath', 'Sampath Herath', 'image/jpeg', 60846);

-- Testimonials
INSERT INTO testimonials (quote, customer_name, image_media_id, detail, rating, is_active, sort_order) VALUES ('Used the Engine Oil Flush before my service and the difference is real: smoother idle and the old oil came out black as tar. Will order again.', 'Kasun Perera', (SELECT id FROM media WHERE file_path = 'testimonials/kasun-perera.jpg'), '2 weeks ago', 5, 1, 0);
INSERT INTO testimonials (quote, customer_name, image_media_id, detail, rating, is_active, sort_order) VALUES ('Headlight Polish brought my 10-year-old Aqua''s lights back to crystal clear in 15 minutes. Night driving feels safe again. Fast delivery to Kandy too!', 'Nadeesha Fernando', (SELECT id FROM media WHERE file_path = 'testimonials/nadeesha-fernando.jpg'), '1 month ago', 5, 1, 1);
INSERT INTO testimonials (quote, customer_name, image_media_id, detail, rating, is_active, sort_order) VALUES ('The AC spray removed a musty smell that three service centres couldn''t fix. Whole cabin smells fresh. Excellent products and friendly support on WhatsApp.', 'Ruwan Jayasuriya', (SELECT id FROM media WHERE file_path = 'testimonials/ruwan-jayasuriya.jpg'), '2 months ago', 5, 1, 2);
INSERT INTO testimonials (quote, customer_name, image_media_id, detail, rating, is_active, sort_order) VALUES ('Ride to work every day and my chain used to squeal within a week. Chain Lube keeps it quiet a lot longer, and it doesn''t fling grease all over the rim like the cheap stuff did.', 'Priyantha Wickramasinghe', (SELECT id FROM media WHERE file_path = 'testimonials/priyantha-wickramasinghe.jpg'), '6 days ago', 5, 1, 3);
INSERT INTO testimonials (quote, customer_name, image_media_id, detail, rating, is_active, sort_order) VALUES ('Had rust spots forming on the underbody after last monsoon. Rust Off took care of it in one afternoon and the car has been parked outside since with no new spots.', 'Chamari Ratnayake', (SELECT id FROM media WHERE file_path = 'testimonials/chamari-ratnayake.jpg'), '3 weeks ago', 5, 1, 4);
INSERT INTO testimonials (quote, customer_name, image_media_id, detail, rating, is_active, sort_order) VALUES ('Brake Cleaner does exactly what it says, cuts through brake dust fast. Only reason it''s not five stars is the can ran out quicker than I expected on a full service.', 'Dinesh Abeysekera', (SELECT id FROM media WHERE file_path = 'testimonials/dinesh-abeysekera.jpg'), '1 month ago', 4, 1, 5);
INSERT INTO testimonials (quote, customer_name, image_media_id, detail, rating, is_active, sort_order) VALUES ('Used Insta Glaze before a wedding we were driving the car for. Paint looked like it just left the showroom. So many compliments that day, ordering a second tub already.', 'Nilmini Silva', (SELECT id FROM media WHERE file_path = 'testimonials/nilmini-silva.jpg'), '1 month ago', 5, 1, 6);
INSERT INTO testimonials (quote, customer_name, image_media_id, detail, rating, is_active, sort_order) VALUES ('Car was running hot on the Matara expressway stretch every time. Did a proper Radiator Flush and the temperature gauge has stayed exactly where it should since.', 'Ashan Gunasekera', (SELECT id FROM media WHERE file_path = 'testimonials/ashan-gunasekera.jpg'), '2 months ago', 5, 1, 7);
INSERT INTO testimonials (quote, customer_name, image_media_id, detail, rating, is_active, sort_order) VALUES ('Throttle response felt sluggish after years of city driving. Throttle Body Cleaner brought back the smoothness, feels like a different car pulling away from lights now.', 'Iresha Kodikara', (SELECT id FROM media WHERE file_path = 'testimonials/iresha-kodikara.jpg'), '3 months ago', 5, 1, 8);
INSERT INTO testimonials (quote, customer_name, image_media_id, detail, rating, is_active, sort_order) VALUES ('One Step Rubbing Compound took out swirl marks I thought were permanent from an automatic car wash. Took some elbow grease but the result was worth it.', 'Sampath Herath', (SELECT id FROM media WHERE file_path = 'testimonials/sampath-herath.jpg'), '4 months ago', 5, 1, 9);

-- FAQs
INSERT INTO faqs (question, answer, is_active, sort_order) VALUES ('Are Car Spa LK products safe for all vehicles?', 'Yes. Our range is formulated for petrol, diesel and hybrid vehicles, and clearly labelled for cars, bikes or both. Every product includes usage instructions on the label; follow them and you''re covered.', 1, 0);
INSERT INTO faqs (question, answer, is_active, sort_order) VALUES ('How do I use the Engine Flush?', 'Add the full can to your engine oil before an oil change, idle the engine for 10 minutes (don''t drive), then drain the old oil and refill as usual. It dissolves sludge, opens restricted oil passages and frees sticky lifters in a single treatment. Available in 4-wheeler and 2-wheeler sizes.', 1, 1);
INSERT INTO faqs (question, answer, is_active, sort_order) VALUES ('Do you deliver island-wide?', 'Yes, we deliver across Sri Lanka, typically within 2–4 working days. Orders in Colombo and suburbs usually arrive next day. Cash on delivery and bank transfer are both available.', 1, 2);
INSERT INTO faqs (question, answer, is_active, sort_order) VALUES ('Which product should I start with?', '<ul><li>Dull or yellowed headlights → Headlight Polish</li><li>Rough idle or sluggish response → Engine Flush</li><li>Bad smell from AC vents → AC Disinfectant Spray</li><li>Noisy or dry bike chain → Chain Cleaner + Chain Lube</li><li>Squealing brakes → Brake Cleaner</li><li>Scratches or faded paint → One Step Rubbing Compound + Insta Glaze</li></ul>', 1, 3);
INSERT INTO faqs (question, answer, is_active, sort_order) VALUES ('Are the sprays safe on painted surfaces?', 'Insta Polish and Headlight Polish are safe on paint and plastics. Brake Cleaner and Rust Off are powerful solvents; keep them away from painted panels and rinse off any overspray immediately.', 1, 4);
INSERT INTO faqs (question, answer, is_active, sort_order) VALUES ('Can I become a reseller or stockist?', 'We''re building our dealer network across Sri Lanka. Get in touch via the contact details below with your shop name and location, and our team will share wholesale pricing.', 1, 5);

-- Site settings
INSERT INTO site_settings (setting_key, setting_value) VALUES ('brand_name', 'Car Spa LK');
INSERT INTO site_settings (setting_key, setting_value) VALUES ('tagline', 'Auto care, done right');
INSERT INTO site_settings (setting_key, setting_value) VALUES ('address', '123 Galle Road, Colombo 04, Sri Lanka');
INSERT INTO site_settings (setting_key, setting_value) VALUES ('email', 'info@carspa.lk');
INSERT INTO site_settings (setting_key, setting_value) VALUES ('carousel_product_count', '10');
INSERT INTO site_settings (setting_key, setting_value) VALUES ('testimonials_count', '10');
INSERT INTO site_settings (setting_key, setting_value) VALUES ('hero_picks_count', '3');

-- Brand logos
INSERT INTO media (file_path, title, alt_text, mime_type, file_size) VALUES ('site/logo-dark.webp', 'Car Spa LK logo, light on dark', 'Car Spa LK', 'image/webp', 28516);
INSERT INTO site_settings (setting_key, setting_value) VALUES ('dark_mode_logo_media_id', (SELECT id FROM media WHERE file_path = 'site/logo-dark.webp'));
INSERT INTO media (file_path, title, alt_text, mime_type, file_size) VALUES ('site/logo-light.webp', 'Car Spa LK logo, dark on light', 'Car Spa LK', 'image/webp', 26280);
INSERT INTO site_settings (setting_key, setting_value) VALUES ('light_mode_logo_media_id', (SELECT id FROM media WHERE file_path = 'site/logo-light.webp'));
INSERT INTO media (file_path, title, alt_text, mime_type, file_size) VALUES ('site/logo-email.png', 'Car Spa LK logo, email header', 'Car Spa LK', 'image/png', 62571);
INSERT INTO site_settings (setting_key, setting_value) VALUES ('mail_header_logo_media_id', (SELECT id FROM media WHERE file_path = 'site/logo-email.png'));

-- Phone numbers
INSERT INTO phone_numbers (number, label, type, is_active, sort_order) VALUES ('074 2 388 588', 'Hotline', 'hotline', 1, 0);
INSERT INTO phone_numbers (number, label, type, is_active, sort_order) VALUES ('011 42 42 400', 'Landline', 'landline', 1, 1);
INSERT INTO phone_numbers (number, label, type, is_active, sort_order) VALUES ('94742388588', 'WhatsApp', 'whatsapp', 1, 2);

-- Social links (Facebook and Instagram URLs are placeholders on the live site; fill real URLs in the admin)
INSERT INTO social_links (platform, label, url, is_active, sort_order) VALUES ('facebook', 'Facebook', '#', 1, 0);
INSERT INTO social_links (platform, label, url, is_active, sort_order) VALUES ('instagram', 'Instagram', '#', 1, 1);
INSERT INTO social_links (platform, label, url, is_active, sort_order) VALUES ('whatsapp', 'WhatsApp', 'https://wa.me/94742388588?text=Hi%20Car%20Spa%20LK!', 1, 2);

-- Opening hours (0 = Monday ... 6 = Sunday)
INSERT INTO opening_hours (day_of_week, open_time, close_time, is_closed) VALUES (0, '09:00:00', '18:00:00', 0);
INSERT INTO opening_hours (day_of_week, open_time, close_time, is_closed) VALUES (1, '09:00:00', '18:00:00', 0);
INSERT INTO opening_hours (day_of_week, open_time, close_time, is_closed) VALUES (2, '09:00:00', '18:00:00', 0);
INSERT INTO opening_hours (day_of_week, open_time, close_time, is_closed) VALUES (3, '09:00:00', '18:00:00', 0);
INSERT INTO opening_hours (day_of_week, open_time, close_time, is_closed) VALUES (4, '09:00:00', '18:00:00', 0);
INSERT INTO opening_hours (day_of_week, open_time, close_time, is_closed) VALUES (5, '09:00:00', '15:00:00', 0);
INSERT INTO opening_hours (day_of_week, open_time, close_time, is_closed) VALUES (6, NULL, NULL, 1);
INSERT INTO opening_hours_notes (note, is_active, sort_order) VALUES ('Closed on Poya days', 1, 0);

-- Legal pages
INSERT INTO legal_pages (slug, title, content_html) VALUES ('privacy-policy', 'Privacy Policy', '<h2>Our promise in plain words</h2>
<p>Car Spa LK (carspa.lk) is a small Sri Lankan online store selling genuine Arkos Vetek car and bike care products. We do not want your data, we want to deliver your order. This page explains the little information we handle, why we handle it, and what we never do with it.</p>

<h2>What information we handle</h2>
<p>Honestly, very little. There are no user accounts on our site, no sign-ups and no passwords. Here is the full list:</p>
<ul>
<li>Your shopping cart. When you add products to the cart, the items are saved in your own browser using localStorage. This stays on your device. It is never sent to our server, and we cannot see it.</li>
<li>Messages you send us. If you order or ask a question through WhatsApp on 074 2 388 588, or email us at info@carspa.lk, we receive whatever you choose to share, such as your name, phone number and message. Our contact form simply opens your own email app, so the website itself stores no form submissions.</li>
<li>Delivery details. To deliver an order we need your name, delivery address and contact number. You share these with us over WhatsApp when confirming the order.</li>
</ul>

<h2>How we use your information</h2>
<p>We use your details for one purpose only: to get your order to your door. That means:</p>
<ul>
<li>Confirming your order and the total in LKR over WhatsApp.</li>
<li>Arranging delivery, island-wide across Sri Lanka, usually within 2 to 4 working days, and often next day for Colombo and suburbs.</li>
<li>Passing your name, address and phone number to the courier, only so they can deliver your parcel and collect payment if you chose cash on delivery.</li>
<li>Replying to your questions about products or an existing order.</li>
</ul>
<p>That is it. We do not add you to marketing lists, and we do not message you unless it is about your order or you contacted us first.</p>

<h2>What we never do</h2>
<ul>
<li>We never sell your information to anyone.</li>
<li>We never share your details with advertisers or marketing companies.</li>
<li>We do not use analytics tools, tracking cookies or advertising cookies. Our site is essentially cookie-free.</li>
<li>We do not store your payment card details. Payment is by cash on delivery or bank transfer, handled directly between you and your bank.</li>
</ul>

<h2>A note about WhatsApp</h2>
<p>Orders and chats happen on WhatsApp, which is run by Meta. WhatsApp has its own privacy policy that applies to messages sent through their app. We only use the chat to take your order and arrange delivery.</p>

<h2>How long we keep things</h2>
<p>We keep order details, such as our WhatsApp chat with you, only as long as needed to complete the delivery and handle any follow-up questions. Your cart lives in your own browser, so you can clear it any time by emptying the cart or clearing your browser data.</p>

<h2>Your rights</h2>
<p>Your information belongs to you. At any time you can ask us to:</p>
<ul>
<li>Tell you what details of yours we have.</li>
<li>Correct anything that is wrong, such as a delivery address.</li>
<li>Delete your details from our records.</li>
</ul>
<p>Just message or email us and we will sort it out. No forms, no waiting periods.</p>

<h2>Children</h2>
<p>Our products and website are meant for adults. We do not knowingly collect information from children.</p>

<h2>Changes to this policy</h2>
<p>If we ever change how we handle information, we will update this page and change the date at the bottom. Since we collect so little, big changes are unlikely.</p>

<h2>Governing law</h2>
<p>This policy and our handling of your information are governed by the laws of Sri Lanka.</p>

<h2>How to reach us</h2>
<p>Questions about privacy, or anything else? We are happy to help.</p>
<ul>
<li>Email: info@carspa.lk</li>
<li>WhatsApp / Hotline: 074 2 388 588</li>
<li>Landline: 011 42 42 400</li>
<li>Address: 123 Galle Road, Colombo 04, Sri Lanka</li>
<li>Hours: Monday to Friday 9:00 to 18:00, Saturday 9:00 to 15:00, closed on Sundays and Poya days</li>
</ul>');
INSERT INTO legal_pages (slug, title, content_html) VALUES ('cookie-policy', 'Cookie Policy', '<h2>The short version</h2>
<p>Car Spa LK does not use tracking cookies, advertising cookies or analytics of any kind. Our website is essentially cookie-free. The only thing stored in your browser is your shopping cart, and that stays on your own device.</p>

<h2>What are cookies?</h2>
<p>Cookies are small files that many websites save in your browser to remember things about you, and sometimes to track you across the internet for advertising. Lots of sites use them. We don''t.</p>

<h2>What we actually use</h2>
<p>The only browser storage carspa.lk uses is something called localStorage, and only for one job: remembering the items in your shopping cart.</p>
<ul>
<li>Your cart contents are saved in your own browser, on your own device.</li>
<li>This information is never sent to our server. We cannot see what is in your cart until you choose to place your order through WhatsApp.</li>
<li>It simply makes shopping easier, so your cart is still there if you close the page and come back later.</li>
</ul>
<p>Beyond that, your browser may handle standard technical necessities needed for any website to load and work properly. Nothing about you is collected, profiled or shared.</p>

<h2>What we do not use</h2>
<ul>
<li>No tracking cookies</li>
<li>No advertising or marketing cookies</li>
<li>No analytics tools watching how you browse</li>
<li>No third-party trackers or social media pixels</li>
<li>No user accounts or login sessions, because our site has no accounts at all</li>
</ul>

<h2>How to clear your cart storage</h2>
<p>Since your cart lives in your own browser, you are always in control of it. You can remove it at any time through your browser settings:</p>
<ul>
<li>On Chrome: go to Settings, then Privacy and security, then Delete browsing data, and choose "Cookies and other site data".</li>
<li>On Safari, Firefox, Edge and other browsers: look for "Clear browsing data" or "Manage website data" in the settings or privacy section.</li>
</ul>
<p>Clearing this data will empty your Car Spa LK cart, and that is the only effect it will have. You can also just remove items from the cart on the website itself.</p>

<h2>If this ever changes</h2>
<p>If we add new features to the website in the future that need cookies or other storage, we will update this policy first and explain clearly what is used and why. Any changes will appear on this page with a new "Last updated" date.</p>

<h2>Questions?</h2>
<p>If anything here is unclear, we are happy to help. Email us at info@carspa.lk, call our hotline on 074 2 388 588 or our landline on 011 42 42 400, or visit us at 123 Galle Road, Colombo 04, Sri Lanka. We are open Monday to Friday from 9:00 to 18:00 and Saturday from 9:00 to 15:00. We are closed on Sundays and Poya days.</p>');
INSERT INTO legal_pages (slug, title, content_html) VALUES ('terms-of-service', 'Terms of Service', '<h2>Welcome to Car Spa LK</h2>
<p>Thank you for visiting carspa.lk. These terms explain how our website works and what you can expect when you order from us. By browsing the site or placing an order, you agree to these terms. We have kept them short and in plain language, so please take a minute to read them.</p>
<p>If anything is unclear, just ask us. You can email info@carspa.lk or call our hotline on 074 2 388 588.</p>

<h2>Using our website</h2>
<p>You are welcome to browse carspa.lk, view our products and place orders for your personal use. We only ask that you use the site honestly and do not try to disrupt it, copy it, or misuse it in any way.</p>
<p>The content on this site, including product descriptions and images, belongs to Car Spa LK or its suppliers. Please do not reuse it for commercial purposes without asking us first.</p>

<h2>Products and prices</h2>
<p>We sell genuine Arkos Vetek car and bike care products, covering engine care, exterior shine, interior and AC care, brake and underbody care, and bike and chain care.</p>
<p>A few important points about product information:</p>
<ul>
<li>All prices on the site are in Sri Lankan Rupees (LKR).</li>
<li>Prices can change from time to time without notice. The price we confirm with you on WhatsApp when you order is the price that applies.</li>
<li>We do our best to keep descriptions, images and stock levels accurate, but small errors can happen. If we spot a mistake in your order, we will contact you before going ahead.</li>
<li>Product colours and packaging in photos may look slightly different in real life.</li>
</ul>

<h2>Ordering</h2>
<p>Ordering from us is simple. You can order in two ways:</p>
<ul>
<li>Message us directly on WhatsApp at 074 2 388 588 with the products you want.</li>
<li>Use the cart on our website. When you check out, the cart sends your order to us through WhatsApp.</li>
</ul>
<p>Your order is confirmed once we reply on WhatsApp and agree on the items, the total and the delivery details. If a product is out of stock, we will let you know and suggest an alternative or a refund of any payment made.</p>
<p>We deliver island-wide across Sri Lanka. Delivery usually takes 2 to 4 working days, and Colombo and suburbs usually receive orders the next day.</p>

<h2 id="payments">Payments &amp; security</h2>
<p>We keep payment simple and safe. You can pay in two ways:</p>
<ul>
<li>Cash on delivery: pay the courier in cash when your order arrives.</li>
<li>Bank transfer: we will share our bank details on WhatsApp, and we dispatch your order once the transfer is confirmed.</li>
</ul>
<p>Here is the important part: our website never asks for or collects card details. There is no card payment form on carspa.lk. If you ever see a page claiming to be Car Spa LK asking for your card number, PIN or online banking password, do not enter anything and please report it to us right away.</p>
<p>All payment amounts are in Sri Lankan Rupees (LKR). Always confirm the total with us on WhatsApp before making a bank transfer.</p>

<h2>Product safety</h2>
<p>Our products are made for vehicle care and work best, and safest, when used correctly. Please:</p>
<ul>
<li>Read and follow the instructions on the product label before use.</li>
<li>Keep all products away from children and pets.</li>
<li>Take extra care with solvent-based products such as degreasers and certain sprays. Use them in a well-ventilated area, away from open flames, and avoid contact with skin and eyes.</li>
<li>Store products in a cool, dry place with the cap closed tightly.</li>
</ul>
<p>If a product gets into someone''s eyes or is swallowed, follow the first aid guidance on the label and get medical help without delay.</p>

<h2>Our responsibility to you</h2>
<p>We stand behind the products we sell and we will always try to put things right if something goes wrong with your order. That said, there are sensible limits to what we can be responsible for:</p>
<ul>
<li>We are not responsible for damage caused by using a product against its label instructions.</li>
<li>We are not responsible for delivery delays caused by things outside our control, such as weather, courier issues or road closures.</li>
<li>Our total responsibility for any order is limited to the amount you paid for that order.</li>
</ul>
<p>Nothing in these terms takes away any rights you have as a consumer under Sri Lankan law.</p>

<h2>Governing law</h2>
<p>These terms, and any order you place with us, are governed by the laws of Sri Lanka.</p>

<h2>Changes to these terms</h2>
<p>We may update these terms from time to time, for example if we add new payment or delivery options. The latest version will always be on this page, with the date below.</p>

<h2>Contact us</h2>
<p>Questions about these terms or an order? We are happy to help.</p>
<ul>
<li>Email: info@carspa.lk</li>
<li>WhatsApp / hotline: 074 2 388 588</li>
<li>Landline: 011 42 42 400</li>
<li>Address: 123 Galle Road, Colombo 04, Sri Lanka</li>
<li>Hours: Monday to Friday 9:00 to 18:00, Saturday 9:00 to 15:00. Closed on Sundays and Poya days.</li>
</ul>');
INSERT INTO legal_pages (slug, title, content_html) VALUES ('delivery-returns', 'Delivery & Returns', '<h2>Delivery across Sri Lanka</h2>
<p>We deliver island-wide, from Colombo to Jaffna, Galle to Batticaloa. Wherever you are in Sri Lanka, we can get your order to you.</p>
<ul>
<li>Island-wide: orders typically arrive within 2 to 4 working days.</li>
<li>Colombo and suburbs: usually next-day delivery.</li>
</ul>
<p>Working days are Monday to Saturday. Sundays and Poya days are not counted, so if you order just before a long weekend, please allow a little extra time.</p>

<h3>Delivery fees</h3>
<p>We confirm any delivery fee with you on WhatsApp when you place your order, before anything is dispatched. No surprises at the doorstep.</p>

<h3>How ordering works</h3>
<p>You can order in two easy ways:</p>
<ul>
<li>Message us directly on WhatsApp at 074 2 388 588 with the products you want.</li>
<li>Add products to the cart on carspa.lk and check out. The cart sends your order to us through WhatsApp.</li>
</ul>
<p>Once we receive your order, we confirm availability, the total in LKR and any delivery fee, then dispatch your items.</p>

<h3>Payment options</h3>
<ul>
<li>Cash on delivery: pay the courier when your order arrives.</li>
<li>Bank transfer: we share our bank details on WhatsApp. Once the transfer is confirmed, we dispatch your order.</li>
</ul>

<h3>When your order arrives</h3>
<p>Please check your parcel when you receive it. If anything looks damaged or incorrect, take a few photos right away and message us on WhatsApp. It makes sorting things out much faster.</p>

<h2 id="returns">Returns &amp; refunds</h2>
<p>We want you to be happy with every bottle and can you buy from us. Here is how returns work, in plain language.</p>

<h3>Unopened products: 7 days to return</h3>
<p>If you change your mind, you can return any unopened and unused product within 7 days of delivery. The product must be in its original packaging, with the seal intact, in resellable condition. Message us on WhatsApp at 074 2 388 588 to arrange the return.</p>

<h3>Damaged or wrong items: tell us within 48 hours</h3>
<p>If your order arrives damaged, leaking, or you received the wrong product, let us know within 48 hours of delivery. Send us clear photos of the item and the packaging on WhatsApp so we can see what went wrong. We will sort it out with a replacement or a refund at no extra cost to you.</p>

<h3>What we cannot take back</h3>
<p>For safety reasons, some items cannot be returned:</p>
<ul>
<li>Aerosol products, once delivered, unless they arrived damaged or were the wrong item.</li>
<li>Any product that has been opened or used.</li>
</ul>
<p>Car care chemicals and pressurised cans cannot safely be restocked once they leave sealed condition, so please check your order carefully when it arrives.</p>

<h3>How refunds are paid</h3>
<p>Once we receive and check your returned item, you can choose:</p>
<ul>
<li>A replacement: we send the correct or a fresh product to you.</li>
<li>A refund by bank transfer: paid in LKR to your Sri Lankan bank account, usually within a few working days of approval.</li>
</ul>

<h2>Need help?</h2>
<p>Questions about a delivery or a return? We are happy to help.</p>
<ul>
<li>WhatsApp or hotline: 074 2 388 588</li>
<li>Landline: 011 42 42 400</li>
<li>Email: info@carspa.lk</li>
<li>Address: 123 Galle Road, Colombo 04, Sri Lanka</li>
</ul>
<p>We are available Monday to Friday 9:00 to 18:00 and Saturday 9:00 to 15:00. We are closed on Sundays and Poya days.</p>');

-- Page SEO
INSERT INTO page_seo (page_key, path, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) VALUES ('home', '/', 'Car Spa LK | Premium Car Care Products in Sri Lanka', 'car care products sri lanka', 'Shop genuine Arkos Vetek car and bike care in Sri Lanka. Engine flush, polish, brake and chain care with island-wide delivery and LKR pricing at carspa.lk.', 1, 'Home', NULL, 'WebPage', 'None', 'Car Spa LK | Auto Care, Done Right', 'Professional-grade Arkos Vetek products for every part of your vehicle, from the engine bay to the last detail of your interior. Delivered island-wide across Sri Lanka.', 'Car Spa LK | Auto Care, Done Right', 'Genuine Arkos Vetek car and bike care products, delivered island-wide across Sri Lanka. Order online or on WhatsApp.', 'Car Spa LK is a Sri Lankan online store for genuine Arkos Vetek car and bike care products, covering engine, exterior, interior, brake and chain care. Orders are delivered island-wide and confirmed on WhatsApp.');
INSERT INTO page_seo (page_key, path, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) VALUES ('products', '/products', 'All Car & Bike Care Products | Car Spa LK', 'buy car care products online sri lanka', 'Browse the Arkos Vetek range: engine care, exterior shine, interior and AC, brake and underbody, and bike chain care. LKR prices, island-wide delivery.', 1, 'Products', NULL, 'Collection Page', 'None', 'Shop All Products | Car Spa LK', 'Professional-grade auto care, delivered island-wide. Filter by engine care, exterior and shine, interior and AC, brake and underbody, or bike and chain care.', 'Shop All Products | Car Spa LK', 'The full Arkos Vetek car and bike care range with LKR pricing and island-wide delivery across Sri Lanka.', 'The complete Car Spa LK catalogue of Arkos Vetek products, filterable by engine care, exterior and shine, interior and AC, brake and underbody, and bike and chain care.');
INSERT INTO page_seo (page_key, path, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) VALUES ('contact', '/contact', 'Contact Us | Car Spa LK', 'car spa lk contact', 'Reach Car Spa LK on hotline 074 2 388 588, WhatsApp, or info@carspa.lk. Visit 123 Galle Road, Colombo 04, Monday to Saturday. We answer fast.', 0, 'Contact', NULL, 'Contact Page', 'None', 'Get in Touch | Car Spa LK', 'Questions, orders, wholesale enquiries. Call 074 2 388 588, chat on WhatsApp, or email info@carspa.lk. We reply within one working day.', 'Get in Touch | Car Spa LK', 'Call, WhatsApp, or email Car Spa LK for orders, product questions, and dealer enquiries. We answer fast.', 'Contact Car Spa LK by hotline, WhatsApp, email, or in person at 123 Galle Road, Colombo 04. Open Monday to Friday 9:00 to 18:00 and Saturday 9:00 to 15:00.');
INSERT INTO page_seo (page_key, path, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) VALUES ('cart', '/cart', 'Your Cart | Car Spa LK', 'car spa lk shopping cart', 'Review the items in your Car Spa LK cart before checkout. Every order is confirmed on WhatsApp and paid by cash on delivery or bank transfer.', 0, 'Cart', NULL, 'Checkout Page', 'None', 'Your Cart | Car Spa LK', 'Review your items, then check out. We confirm every order with you before anything is charged.', 'Your Cart | Car Spa LK', 'Your Car Spa LK cart, saved in your own browser. Check out when you are ready and we confirm everything on WhatsApp.', 'The Car Spa LK shopping cart, saved in your own browser. Review your items and head to checkout when you are ready.');
INSERT INTO page_seo (page_key, path, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) VALUES ('checkout', '/checkout', 'Checkout | Car Spa LK', 'car spa lk checkout', 'Complete your Car Spa LK order with your delivery details. Pay by cash on delivery or bank transfer, with the total confirmed on WhatsApp before dispatch.', 0, 'Checkout', NULL, 'Checkout Page', 'None', 'Checkout | Car Spa LK', 'Fill in your delivery details and place your order. We confirm the total plus delivery on WhatsApp before anything is paid.', 'Checkout | Car Spa LK', 'Enter delivery details, choose cash on delivery or bank transfer, and your order goes straight to Car Spa LK on WhatsApp.', 'Checkout for carspa.lk orders. Enter delivery details, choose cash on delivery or bank transfer, and the order is sent to Car Spa LK through WhatsApp.');
INSERT INTO page_seo (page_key, path, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) VALUES ('404', '/404', 'Page Not Found | Car Spa LK', 'car spa lk page not found', 'That page has been moved, renamed, or never existed. Head back to the Car Spa LK home page or browse genuine Arkos Vetek car and bike care products.', 0, 'Page Not Found', NULL, 'Default for Pages (Web Page)', 'None', 'Page Not Found | Car Spa LK', 'Looks like a wrong turn. Let''s get you back on the road with quick links to the home page and the full product range.', 'Page Not Found | Car Spa LK', 'This page has been moved, renamed, or never existed. Head back to carspa.lk to keep shopping.', 'The carspa.lk 404 page. The requested page does not exist, with quick links back to the home page and the product catalogue.');
INSERT INTO page_seo (page_key, path, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) VALUES ('privacy-policy', '/privacy-policy', 'Privacy Policy | Car Spa LK', 'car spa lk privacy policy', 'How Car Spa LK handles the little data we touch: cart stored in your browser, order details on WhatsApp, no accounts, no analytics, and nothing ever sold.', 0, 'Privacy Policy', NULL, 'WebPage', 'None', 'Privacy Policy | Car Spa LK', 'We collect almost nothing. No accounts, no tracking, no analytics. Your cart stays on your device and delivery details are used only to get your order to you.', 'Privacy Policy | Car Spa LK', 'No accounts, no tracking, no marketing lists. The little we handle exists only to deliver your order.', 'The Car Spa LK privacy policy in plain words: no user accounts, no tracking, cart data kept in your own browser, and delivery details used only to fulfil orders.');
INSERT INTO page_seo (page_key, path, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) VALUES ('cookie-policy', '/cookie-policy', 'Cookie Policy | Car Spa LK', 'car spa lk cookie policy', 'carspa.lk uses no tracking, advertising, or analytics cookies. The only browser storage is localStorage for your shopping cart, kept on your own device.', 0, 'Cookie Policy', NULL, 'WebPage', 'None', 'Cookie Policy | Car Spa LK', 'No tracking, no ads, no analytics. Just your cart, saved on your own device, and nothing else.', 'Cookie Policy | Car Spa LK', 'Our site is essentially cookie-free. The only thing stored in your browser is your shopping cart.', 'Car Spa LK is essentially cookie-free. The site stores only your shopping cart in localStorage on your own device, with no trackers, pixels, or analytics.');
INSERT INTO page_seo (page_key, path, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) VALUES ('terms-of-service', '/terms-of-service', 'Terms of Service | Car Spa LK', 'car spa lk terms of service', 'Plain-language terms for shopping at carspa.lk: LKR pricing, WhatsApp order confirmation, cash on delivery or bank transfer, and island-wide delivery.', 0, 'Terms of Service', NULL, 'WebPage', 'None', 'Terms of Service | Car Spa LK', 'The simple, fair rules for using carspa.lk and ordering genuine Arkos Vetek car and bike care products, kept short and in plain language.', 'Terms of Service | Car Spa LK', 'How ordering works at carspa.lk: LKR prices, WhatsApp confirmation, cash on delivery or bank transfer.', 'The simple rules for using carspa.lk and ordering genuine Arkos Vetek products, covering prices in LKR, ordering by WhatsApp or cart, payments, and product safety.');
INSERT INTO page_seo (page_key, path, seo_title, focus_keyphrase, meta_description, cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, social_title, social_description, x_title, x_description, excerpt) VALUES ('delivery-returns', '/delivery-returns', 'Delivery & Returns | Car Spa LK', 'car care products delivery sri lanka', 'Island-wide delivery in 2 to 4 working days, usually next day for Colombo. 7-day returns on unopened items, 48 hours to report damaged or wrong products.', 0, 'Delivery & Returns', NULL, 'WebPage', 'None', 'Delivery & Returns | Car Spa LK', 'We deliver island-wide, from Colombo to Jaffna, Galle to Batticaloa. Orders arrive in 2 to 4 working days, usually next day for Colombo and suburbs.', 'Delivery & Returns | Car Spa LK', 'Island-wide delivery across Sri Lanka in 2 to 4 working days, with 7-day returns on unopened products.', 'How Car Spa LK delivers across Sri Lanka and handles returns: 2 to 4 working days island-wide, next day for Colombo and suburbs, 7-day returns on unopened products, and replacements or LKR refunds for damaged items.');

