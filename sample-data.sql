-- Car Spa LK SAMPLE data for testing the Orders and Payments screens.
-- NOT part of the real seed. Import it into a database that already has
-- schema.sql + seed.sql loaded:
--   mysql -u dbuser -p dbname < sample-data.sql
-- Everything here is fictional. Safe to re-run (it clears orders and bank
-- accounts first). Remove the rows again by re-running seed.sql plus
--   DELETE FROM orders; DELETE FROM bank_accounts;

SET NAMES utf8mb4;

DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM bank_accounts;

-- ---------------------------------------------------------------------------
-- Bank accounts (Payments tab)
-- ---------------------------------------------------------------------------
INSERT INTO bank_accounts (bank_name, branch, account_name, account_number, note, is_active, sort_order) VALUES
('Commercial Bank', 'Kollupitiya', 'Car Spa LK (Pvt) Ltd', '8001234567', 'Send the transfer slip on WhatsApp with your order number', 1, 0),
('Sampath Bank', 'Bambalapitiya', 'Car Spa LK (Pvt) Ltd', '0123456789', NULL, 1, 1),
('HNB', 'Wellawatte', 'Car Spa LK (Pvt) Ltd', '2501122334', 'Use your order number as the reference', 1, 2);

-- ---------------------------------------------------------------------------
-- Orders (Orders tab), one in every status, various dates and sizes
-- ---------------------------------------------------------------------------
INSERT INTO orders (customer_name, phone, address, city, notes, payment_method, status, total_lkr, created_at) VALUES
('Kasun Perera', '0771234567', '45 Temple Road', 'Nugegoda', NULL, 'cod', 'new', 5150.00, NOW() - INTERVAL 2 HOUR),
('Nadeesha Fernando', '0712345678', '12/3 Lake Drive', 'Kandy', 'Please call before delivery', 'bank', 'awaiting_payment', 9990.00, NOW() - INTERVAL 6 HOUR),
('Ruwan Jayasuriya', '0763456789', '78 Galle Road', 'Moratuwa', NULL, 'bank', 'paid', 6000.00, NOW() - INTERVAL 1 DAY),
('Chamari Ratnayake', '0754567890', '5 Flower Lane', 'Colombo 07', NULL, 'cod', 'processing', 4450.00, NOW() - INTERVAL 2 DAY),
('Dinesh Abeysekera', '0705678901', '230 Kandy Road', 'Kadawatha', 'Leave with security if not home', 'cod', 'completed', 2200.00, NOW() - INTERVAL 5 DAY),
('Nilmini Silva', '0776789012', '89 Beach Road', 'Negombo', NULL, 'bank', 'completed', 13590.00, NOW() - INTERVAL 8 DAY),
('Ashan Gunasekera', '0717890123', '17 Hill Street', 'Matara', 'Changed mind, cancel please', 'cod', 'cancelled', 950.00, NOW() - INTERVAL 3 DAY),
('Iresha Kodikara', '0768901234', '56 Station Road', 'Gampaha', NULL, 'bank', 'awaiting_payment', 3600.00, NOW() - INTERVAL 30 MINUTE);

-- Items reference real seeded products by slug so admin product links work.
INSERT INTO order_items (order_id, product_id, name, size, price_lkr, qty, line_lkr)
SELECT o.id, p.id, p.name, p.size, p.price_lkr, x.qty, p.price_lkr * x.qty
FROM (SELECT 1 AS ord, 'engine-flush-4-wheeler' AS slug, 1 AS qty
      UNION ALL SELECT 1, 'brake-cleaner', 1
      UNION ALL SELECT 2, 'insta-glaze', 1
      UNION ALL SELECT 3, 'chain-lube', 2
      UNION ALL SELECT 4, 'brake-cleaner', 1
      UNION ALL SELECT 4, 'rust-off', 1
      UNION ALL SELECT 5, 'brake-cleaner', 1
      UNION ALL SELECT 6, 'insta-glaze', 1
      UNION ALL SELECT 6, 'engine-degreaser', 1
      UNION ALL SELECT 7, 'engine-flush-2-wheeler', 1
      UNION ALL SELECT 8, 'engine-degreaser', 1) x
JOIN products p ON p.slug = x.slug
JOIN (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM orders) o ON o.rn = x.ord;
