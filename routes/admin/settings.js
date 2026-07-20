const express = require('express');
const { query, pool } = require('../../lib/db');
const { invalidate } = require('../../lib/settings');

const router = express.Router();

const FIELDS = [
  { key: 'carousel_product_count', def: 10, min: 1, max: 24 },
  { key: 'testimonials_count', def: 10, min: 1, max: 30 },
  { key: 'hero_picks_count', def: 3, min: 1, max: 6 }
];

const OPTION_FIELDS = [
  { key: 'products_per_page', def: 12, options: [6, 12, 18, 24, 36, 48] },
  { key: 'media_per_page', def: 24, options: [12, 24, 48, 96] }
];

const LOGO_FIELDS = [
  'site_logo_media_id',
  'mail_header_logo_media_id',
  'dark_mode_logo_media_id',
  'light_mode_logo_media_id'
];

const ALL_KEYS = FIELDS.map(function (f) { return f.key; })
  .concat(OPTION_FIELDS.map(function (f) { return f.key; }), LOGO_FIELDS);

// Anything that is not a positive integer inside the range becomes the default
function clean(value, field) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= field.min && n <= field.max ? n : field.def;
}

// Anything not one of the allowed options becomes the default
function cleanOption(value, field) {
  const n = parseInt(value, 10);
  return field.options.indexOf(n) !== -1 ? n : field.def;
}

// Empty clears the logo, anything else must be a positive integer media id
function cleanLogo(value) {
  const raw = value == null ? '' : String(value).trim();
  if (raw === '') return '';
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? String(n) : '';
}

router.get('/', async function (req, res, next) {
  try {
    const [rows, media] = await Promise.all([
      query('SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN (?)', [ALL_KEYS]),
      query('SELECT id, file_path, alt_text FROM media ORDER BY created_at DESC')
    ]);
    const stored = {};
    rows.forEach(function (row) { stored[row.setting_key] = row.setting_value; });
    const values = {};
    FIELDS.forEach(function (f) { values[f.key] = clean(stored[f.key], f); });
    OPTION_FIELDS.forEach(function (f) { values[f.key] = cleanOption(stored[f.key], f); });
    LOGO_FIELDS.forEach(function (key) {
      const n = parseInt(stored[key], 10);
      values[key] = Number.isFinite(n) && n > 0 ? n : null;
    });
    res.render('admin/settings/index', {
      pageTitle: 'Settings', active: 'settings', values, media
    });
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
    for (const f of OPTION_FIELDS) {
      const value = String(cleanOption(body[f.key], f));
      await conn.query(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [f.key, value, value]
      );
    }
    for (const key of LOGO_FIELDS) {
      const value = cleanLogo(body[key]);
      await conn.query(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, value]
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
