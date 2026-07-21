const express = require('express');
const { query, pool } = require('../lib/db');
const siteSettings = require('../lib/settings');

const router = express.Router();

// Live search for the header search overlay.
router.get('/search', async function (req, res, next) {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json({ results: [] });
    const like = '%' + q.replace(/[%_]/g, '\\$&') + '%';
    const rows = await query(
      'SELECT p.slug, p.name, p.price_lkr, p.size, p.listing_blurb, m.file_path AS image ' +
      'FROM products p ' +
      'LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.role = "featured" ' +
      'LEFT JOIN media m ON m.id = pi.media_id ' +
      'WHERE p.is_active = 1 AND (p.name LIKE ? OR p.category LIKE ? OR p.listing_blurb LIKE ? OR p.short_description LIKE ?) ' +
      'GROUP BY p.id ' +
      'ORDER BY p.click_count DESC, p.name ' +
      'LIMIT 8',
      [like, like, like, like]
    );
    res.json({
      results: rows.map(function (row) {
        return {
          slug: row.slug,
          name: row.name,
          price: Number(row.price_lkr),
          size: row.size,
          blurb: row.listing_blurb,
          image: row.image ? '/media/' + row.image : null,
          url: '/products/' + row.slug
        };
      })
    });
  } catch (err) {
    next(err);
  }
});

// Click tracking; the products page orders by this. One counted click per
// client per product per window, so a curl loop cannot pin a product on top.
const recentClicks = new Map();
const CLICK_WINDOW_MS = 10 * 60 * 1000;

router.post('/products/:slug/click', async function (req, res, next) {
  try {
    const key = req.ip + '|' + req.params.slug;
    const now = Date.now();
    const last = recentClicks.get(key);
    if (last && now - last < CLICK_WINDOW_MS) return res.json({ ok: true });
    recentClicks.set(key, now);
    if (recentClicks.size > 5000) {
      recentClicks.forEach(function (t, k) {
        if (now - t >= CLICK_WINDOW_MS) recentClicks.delete(k);
      });
    }
    await query('UPDATE products SET click_count = click_count + 1 WHERE slug = ? AND is_active = 1', [req.params.slug]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Order creation from the checkout page. Prices and totals always come from
// the database; the client only ever sends slugs and quantities.
router.post('/orders', async function (req, res, next) {
  try {
    const body = req.body || {};
    const name = String(body.customer_name || '').trim();
    const phone = String(body.phone || '').trim();
    const address = String(body.address || '').trim();
    const city = String(body.city || '').trim();
    const notes = String(body.notes || '').trim();
    const payment = body.payment === 'bank' ? 'bank' : body.payment === 'cod' ? 'cod' : null;

    if (!name || name.length > 150 || !phone || phone.length > 40 ||
        !address || address.length > 255 || city.length > 100 || notes.length > 1000) {
      return res.status(400).json({ error: 'Please fill in your name, phone and delivery address.' });
    }

    const site = await siteSettings.load();
    const codEnabled = siteSettings.get(site.settings, 'payment_cod_enabled', '1') !== '0';
    const bankEnabled = siteSettings.get(site.settings, 'payment_bank_enabled', '1') !== '0';
    if (!payment || (payment === 'cod' && !codEnabled) || (payment === 'bank' && !bankEnabled)) {
      return res.status(400).json({ error: 'That payment method is not available right now.' });
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (!rawItems.length || rawItems.length > 100) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }
    // Merge repeated slugs so the stock math cannot be split across lines.
    const qtyBySlug = {};
    for (const item of rawItems) {
      const slug = item && typeof item.slug === 'string' ? item.slug.trim() : '';
      const qty = item ? Number(item.qty) : NaN;
      if (!slug || slug.length > 120 || !Number.isInteger(qty) || qty < 1 || qty > 99) {
        return res.status(400).json({ error: 'One of the cart items is invalid. Please refresh and try again.' });
      }
      qtyBySlug[slug] = (qtyBySlug[slug] || 0) + qty;
    }
    const slugs = Object.keys(qtyBySlug);

    const products = await query(
      'SELECT id, slug, name, size, price_lkr, stock_qty FROM products WHERE is_active = 1 AND slug IN (?)',
      [slugs]
    );
    const bySlug = {};
    products.forEach(function (p) { bySlug[p.slug] = p; });
    const missing = slugs.filter(function (slug) { return !bySlug[slug]; });
    if (missing.length) {
      return res.status(400).json({ error: 'Some items in your cart are no longer available: ' + missing.join(', ') });
    }

    const shortages = [];
    slugs.forEach(function (slug) {
      const p = bySlug[slug];
      if (p.stock_qty !== null && qtyBySlug[slug] > p.stock_qty) {
        shortages.push({ slug: p.slug, name: p.name, available: p.stock_qty });
      }
    });
    if (shortages.length) {
      return res.status(409).json({ error: 'Not enough stock for some items.', shortages });
    }

    let total = 0;
    const lines = slugs.map(function (slug) {
      const p = bySlug[slug];
      const qty = qtyBySlug[slug];
      const line = Number(p.price_lkr) * qty;
      total += line;
      return { product: p, qty, line };
    });

    const conn = await pool.getConnection();
    let orderId;
    try {
      await conn.beginTransaction();
      const [result] = await conn.query(
        'INSERT INTO orders (customer_name, phone, address, city, notes, payment_method, status, total_lkr) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, phone, address, city || null, notes || null, payment, payment === 'bank' ? 'awaiting_payment' : 'new', total]
      );
      orderId = result.insertId;
      for (const line of lines) {
        await conn.query(
          'INSERT INTO order_items (order_id, product_id, name, size, price_lkr, qty, line_lkr) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [orderId, line.product.id, line.product.name, line.product.size || null, line.product.price_lkr, line.qty, line.line]
        );
        await conn.query(
          'UPDATE products SET stock_qty = stock_qty - ? WHERE id = ? AND stock_qty IS NOT NULL',
          [line.qty, line.product.id]
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const response = { ok: true, orderNo: 'CS-' + (1000 + orderId), total };
    if (payment === 'bank') {
      response.bankAccounts = await query(
        'SELECT bank_name, branch, account_name, account_number, note FROM bank_accounts WHERE is_active = 1 ORDER BY sort_order, id'
      );
    }
    res.json(response);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
