const express = require('express');
const { query, pool } = require('../../lib/db');
const { invalidate } = require('../../lib/settings');

const router = express.Router();

const FIELDS = [
  { key: 'carousel_product_count', def: 10, min: 1, max: 24 },
  { key: 'testimonials_count', def: 10, min: 1, max: 30 },
  { key: 'hero_picks_count', def: 3, min: 1, max: 6 }
];

// Anything that is not a positive integer inside the range becomes the default
function clean(value, field) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= field.min && n <= field.max ? n : field.def;
}

router.get('/', async function (req, res, next) {
  try {
    const rows = await query(
      'SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN (?, ?, ?)',
      FIELDS.map(function (f) { return f.key; })
    );
    const stored = {};
    rows.forEach(function (row) { stored[row.setting_key] = row.setting_value; });
    const values = {};
    FIELDS.forEach(function (f) { values[f.key] = clean(stored[f.key], f); });
    res.render('admin/settings/index', { pageTitle: 'Settings', active: 'settings', values });
  } catch (err) {
    next(err);
  }
});

router.post('/', async function (req, res) {
  const body = req.body || {};
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const f of FIELDS) {
      const value = String(clean(body[f.key], f));
      await conn.query(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [f.key, value, value]
      );
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  invalidate();
  res.redirect('/admin/settings?saved=1');
});

module.exports = router;
