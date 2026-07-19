const express = require('express');
const { query } = require('../lib/db');

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

// Click tracking; the products page orders by this.
router.post('/products/:slug/click', async function (req, res, next) {
  try {
    await query('UPDATE products SET click_count = click_count + 1 WHERE slug = ? AND is_active = 1', [req.params.slug]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
