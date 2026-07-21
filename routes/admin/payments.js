const express = require('express');
const { query, pool } = require('../../lib/db');
const { invalidate } = require('../../lib/settings');

const router = express.Router();

const SETTING_KEYS = ['payment_cod_enabled', 'payment_bank_enabled'];

// qs can hand back an object keyed by index instead of an array
function toRows(value) {
  const list = Array.isArray(value)
    ? value
    : (value && typeof value === 'object' ? Object.values(value) : []);
  return list.filter(function (row) { return row && typeof row === 'object'; });
}

function readAccount(row) {
  const sort = parseInt(row.sort_order, 10);
  return {
    bank_name: String(row.bank_name || '').trim(),
    branch: String(row.branch || '').trim(),
    account_name: String(row.account_name || '').trim(),
    account_number: String(row.account_number || '').trim(),
    note: String(row.note || '').trim(),
    sort_order: Number.isFinite(sort) ? sort : 0
  };
}

router.get('/', async function (req, res, next) {
  try {
    const [settingRows, accounts] = await Promise.all([
      query('SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN (?, ?)', SETTING_KEYS),
      query('SELECT * FROM bank_accounts ORDER BY sort_order, id')
    ]);
    const settings = {};
    settingRows.forEach(function (row) { settings[row.setting_key] = row.setting_value; });
    res.render('admin/payments/index', {
      pageTitle: 'Payments', active: 'payments',
      codEnabled: settings.payment_cod_enabled !== '0',
      bankEnabled: settings.payment_bank_enabled !== '0',
      accounts
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async function (req, res) {
  const body = req.body || {};
  const values = {
    payment_cod_enabled: body.payment_cod_enabled ? '1' : '0',
    payment_bank_enabled: body.payment_bank_enabled ? '1' : '0'
  };
  const accounts = toRows(body.accounts).map(readAccount).filter(function (a) {
    return a.bank_name && a.account_number;
  });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const key of SETTING_KEYS) {
      await conn.query(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, values[key], values[key]]
      );
    }
    await conn.query('DELETE FROM bank_accounts');
    for (const a of accounts) {
      await conn.query(
        'INSERT INTO bank_accounts (bank_name, branch, account_name, account_number, note, is_active, sort_order) VALUES (?, ?, ?, ?, ?, 1, ?)',
        [a.bank_name, a.branch || null, a.account_name, a.account_number, a.note || null, a.sort_order]
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
  res.redirect('/admin/payments?saved=1');
});

module.exports = router;
