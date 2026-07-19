const express = require('express');
const { query, pool } = require('../../lib/db');
const { invalidate } = require('../../lib/settings');

const router = express.Router();

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// qs can hand back an object keyed by index instead of an array
function toRows(value) {
  const list = Array.isArray(value)
    ? value
    : (value && typeof value === 'object' ? Object.values(value) : []);
  return list.filter(function (row) { return row && typeof row === 'object'; });
}

router.get('/', async function (req, res, next) {
  try {
    const [hourRows, notes] = await Promise.all([
      query('SELECT * FROM opening_hours'),
      query('SELECT * FROM opening_hours_notes ORDER BY sort_order, id')
    ]);
    const byDay = {};
    hourRows.forEach(function (row) { byDay[row.day_of_week] = row; });
    // A missing row counts as closed
    const days = DAY_NAMES.map(function (name, dow) {
      const row = byDay[dow];
      return {
        dow: dow,
        name: name,
        closed: !row || !!row.is_closed || !row.open_time || !row.close_time,
        open: row && row.open_time ? String(row.open_time).slice(0, 5) : '',
        close: row && row.close_time ? String(row.close_time).slice(0, 5) : ''
      };
    });
    res.render('admin/hours/index', { pageTitle: 'Opening hours', active: 'hours', days, notes });
  } catch (err) {
    next(err);
  }
});

router.post('/', async function (req, res) {
  const body = req.body || {};
  const dayInput = body.days || {};
  const days = DAY_NAMES.map(function (name, dow) {
    const row = dayInput[dow] || {};
    const open = String(row.open_time || '').trim();
    const close = String(row.close_time || '').trim();
    // Missing or malformed times fall back to closed
    const closed = !!row.closed || !TIME_RE.test(open) || !TIME_RE.test(close);
    return { dow: dow, closed: closed, open: open, close: close };
  });
  const notes = toRows(body.notes).map(function (row) {
    const sort = parseInt(row.sort_order, 10);
    return {
      note: String(row.note || '').trim(),
      sort_order: Number.isFinite(sort) ? sort : 0
    };
  }).filter(function (n) { return n.note; });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const d of days) {
      const openVal = d.closed ? null : d.open + ':00';
      const closeVal = d.closed ? null : d.close + ':00';
      const closedVal = d.closed ? 1 : 0;
      await conn.query(
        'INSERT INTO opening_hours (day_of_week, open_time, close_time, is_closed) VALUES (?, ?, ?, ?) ' +
        'ON DUPLICATE KEY UPDATE open_time = ?, close_time = ?, is_closed = ?',
        [d.dow, openVal, closeVal, closedVal, openVal, closeVal, closedVal]
      );
    }
    await conn.query('DELETE FROM opening_hours_notes');
    for (const n of notes) {
      await conn.query(
        'INSERT INTO opening_hours_notes (note, sort_order) VALUES (?, ?)',
        [n.note, n.sort_order]
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
  res.redirect('/admin/hours?saved=1');
});

module.exports = router;
