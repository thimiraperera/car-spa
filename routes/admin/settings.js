const express = require('express');
const { query, pool } = require('../../lib/db');
const { invalidate } = require('../../lib/settings');
const { imageUpload, csrfOk, saveUploadedMedia, removeUploaded } = require('../../lib/uploads');

const router = express.Router();

const FIELDS = [
  { key: 'carousel_product_count', def: 10, min: 1, max: 24 },
  { key: 'testimonials_count', def: 10, min: 1, max: 30 },
  { key: 'hero_picks_count', def: 3, min: 1, max: 6 }
];

const LOGO_FIELDS = [
  'site_logo_media_id',
  'mail_header_logo_media_id',
  'dark_mode_logo_media_id',
  'light_mode_logo_media_id'
];

const ALL_KEYS = FIELDS.map(function (f) { return f.key; }).concat(LOGO_FIELDS);

// Anything that is not a positive integer inside the range becomes the default
function clean(value, field) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= field.min && n <= field.max ? n : field.def;
}

router.get('/', async function (req, res, next) {
  try {
    const rows = await query(
      'SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN (?)', [ALL_KEYS]
    );
    const stored = {};
    rows.forEach(function (row) { stored[row.setting_key] = row.setting_value; });
    const values = {};
    FIELDS.forEach(function (f) { values[f.key] = clean(stored[f.key], f); });
    const logoIds = [];
    LOGO_FIELDS.forEach(function (key) {
      const n = parseInt(stored[key], 10);
      values[key] = Number.isFinite(n) && n > 0 ? n : null;
      if (values[key]) logoIds.push(values[key]);
    });
    const logos = {};
    if (logoIds.length) {
      const mediaRows = await query('SELECT id, file_path FROM media WHERE id IN (?)', [logoIds]);
      const byId = {};
      mediaRows.forEach(function (m) { byId[m.id] = m; });
      LOGO_FIELDS.forEach(function (key) {
        if (values[key] && byId[values[key]]) logos[key] = byId[values[key]];
      });
    }
    res.render('admin/settings/index', {
      pageTitle: 'Settings', active: 'settings', values, logos
    });
  } catch (err) {
    next(err);
  }
});

// Multer runs before the handler; its errors turn into a plain 400.
function logoUpload(req, res, next) {
  const fields = LOGO_FIELDS.map(function (key) { return { name: key + '_file', maxCount: 1 }; });
  imageUpload.fields(fields)(req, res, function (err) {
    if (err) {
      req.uploadError = err.code === 'LIMIT_FILE_SIZE'
        ? 'Logo is too large. The limit is 8 MB.'
        : 'Logo upload failed. Use a jpg, png, webp, avif or gif.';
    }
    next();
  });
}

function allFiles(req) {
  const files = req.files || {};
  return Object.keys(files).reduce(function (list, name) { return list.concat(files[name]); }, []);
}

router.post('/', logoUpload, async function (req, res, next) {
  try {
    if (!csrfOk(req)) {
      await Promise.all(allFiles(req).map(removeUploaded));
      return res.status(403).send('Invalid or missing CSRF token');
    }
    if (req.uploadError) {
      await Promise.all(allFiles(req).map(removeUploaded));
      return res.status(400).send(req.uploadError);
    }
    const body = req.body || {};
    const files = req.files || {};
    const updates = [];
    for (const f of FIELDS) {
      updates.push([f.key, String(clean(body[f.key], f))]);
    }
    // Fresh upload wins, then an explicit clear; otherwise the logo is untouched.
    for (const key of LOGO_FIELDS) {
      const file = files[key + '_file'] && files[key + '_file'][0];
      if (file) {
        updates.push([key, String(await saveUploadedMedia(file, 'Car Spa LK logo'))]);
      } else if (body[key + '_clear'] === '1') {
        updates.push([key, '']);
      }
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const u of updates) {
        await conn.query(
          'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
          [u[0], u[1], u[1]]
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
  } catch (err) {
    next(err);
  }
});

module.exports = router;
