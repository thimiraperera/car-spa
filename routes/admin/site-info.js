const express = require('express');
const { query, pool } = require('../../lib/db');
const { invalidate } = require('../../lib/settings');

const router = express.Router();

const SETTING_KEYS = ['brand_name', 'tagline', 'address', 'email'];
const PHONE_TYPES = ['hotline', 'landline', 'whatsapp', 'other'];
const PLATFORMS = ['facebook', 'instagram', 'whatsapp', 'tiktok', 'youtube', 'x', 'other'];

// qs can hand back an object keyed by index instead of an array
function toRows(value) {
  const list = Array.isArray(value)
    ? value
    : (value && typeof value === 'object' ? Object.values(value) : []);
  return list.filter(function (row) { return row && typeof row === 'object'; });
}

function readPhone(row) {
  const sort = parseInt(row.sort_order, 10);
  return {
    number: String(row.number || '').trim(),
    label: String(row.label || '').trim(),
    type: PHONE_TYPES.indexOf(row.type) !== -1 ? row.type : 'other',
    sort_order: Number.isFinite(sort) ? sort : 0
  };
}

function readSocial(row) {
  const sort = parseInt(row.sort_order, 10);
  return {
    platform: PLATFORMS.indexOf(row.platform) !== -1 ? row.platform : 'other',
    label: String(row.label || '').trim(),
    url: String(row.url || '').trim(),
    sort_order: Number.isFinite(sort) ? sort : 0
  };
}

router.get('/', async function (req, res, next) {
  try {
    const [settingRows, phones, socials] = await Promise.all([
      query('SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN (?, ?, ?, ?)', SETTING_KEYS),
      query('SELECT * FROM phone_numbers ORDER BY sort_order, id'),
      query('SELECT * FROM social_links ORDER BY sort_order, id')
    ]);
    const settings = {};
    settingRows.forEach(function (row) { settings[row.setting_key] = row.setting_value || ''; });
    res.render('admin/site-info/index', {
      pageTitle: 'Site info', active: 'site-info',
      settings, phones, socials,
      phoneTypes: PHONE_TYPES, platforms: PLATFORMS
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async function (req, res) {
  const body = req.body || {};
  const values = {
    brand_name: String(body.brand_name || '').trim(),
    tagline: String(body.tagline || '').trim(),
    address: String(body.address || '').trim(),
    email: String(body.email || '').trim()
  };
  const phones = toRows(body.phones).map(readPhone).filter(function (p) { return p.number; });
  const socials = toRows(body.socials).map(readSocial).filter(function (s) { return s.url; });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const key of SETTING_KEYS) {
      await conn.query(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, values[key], values[key]]
      );
    }
    await conn.query('DELETE FROM phone_numbers');
    for (const p of phones) {
      await conn.query(
        'INSERT INTO phone_numbers (number, label, type, sort_order) VALUES (?, ?, ?, ?)',
        [p.number, p.label || null, p.type, p.sort_order]
      );
    }
    await conn.query('DELETE FROM social_links');
    for (const s of socials) {
      await conn.query(
        'INSERT INTO social_links (platform, label, url, sort_order) VALUES (?, ?, ?, ?)',
        [s.platform, s.label || null, s.url, s.sort_order]
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
  res.redirect('/admin/site-info?saved=1');
});

module.exports = router;
