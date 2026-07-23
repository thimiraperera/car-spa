const express = require('express');
const { pool, query, queryOne } = require('../../lib/db');

const router = express.Router();

function readForm(body) {
  return {
    question: String(body.question || '').trim(),
    answer: String(body.answer || '').trim()
  };
}

function validate(data) {
  if (!data.question) return 'Question is required';
  if (data.question.length > 255) return 'Question must be 255 characters or fewer';
  if (!data.answer) return 'Answer is required';
  return null;
}

router.get('/', async function (req, res, next) {
  try {
    const faqs = await query('SELECT * FROM faqs ORDER BY sort_order, id');
    res.render('admin/faqs/list', { pageTitle: 'FAQs', active: 'faqs', faqs });
  } catch (err) {
    next(err);
  }
});

router.get('/new', function (req, res) {
  res.render('admin/faqs/form', {
    pageTitle: 'Add FAQ', active: 'faqs', item: null, error: null
  });
});

router.get('/:id/edit', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const item = Number.isFinite(id)
      ? await queryOne('SELECT * FROM faqs WHERE id = ?', [id])
      : null;
    if (!item) return res.status(404).send('FAQ not found');
    res.render('admin/faqs/form', {
      pageTitle: 'Edit FAQ', active: 'faqs', item, error: null
    });
  } catch (err) {
    next(err);
  }
});

// Drag-to-reorder on the list posts the row ids in their new order.
router.post('/reorder', async function (req, res, next) {
  const raw = req.body && req.body.ids;
  const ids = Array.isArray(raw)
    ? raw.map(function (v) { return parseInt(v, 10); })
    : null;
  if (!ids || !ids.length || ids.some(function (n) { return !Number.isFinite(n); })) {
    return res.status(400).json({ ok: false, error: 'ids must be an array of integers' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (let i = 0; i < ids.length; i++) {
      await conn.query('UPDATE faqs SET sort_order = ? WHERE id = ?', [i, ids[i]]);
    }
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback().catch(function () {});
    next(err);
  } finally {
    conn.release();
  }
});

router.post('/', async function (req, res, next) {
  try {
    const data = readForm(req.body);
    const error = validate(data);
    if (error) {
      return res.status(422).render('admin/faqs/form', {
        pageTitle: 'Add FAQ', active: 'faqs', item: data, error
      });
    }
    // New FAQs go live right away and append at the end of the list.
    await query(
      'INSERT INTO faqs (question, answer, is_active, sort_order) ' +
      'SELECT ?, ?, 1, COALESCE(MAX(sort_order), -1) + 1 FROM faqs',
      [data.question, data.answer]
    );
    res.redirect('/admin/faqs?saved=1');
  } catch (err) {
    next(err);
  }
});

router.post('/:id', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = Number.isFinite(id)
      ? await queryOne('SELECT id FROM faqs WHERE id = ?', [id])
      : null;
    if (!existing) return res.status(404).send('FAQ not found');
    const data = readForm(req.body);
    const error = validate(data);
    if (error) {
      return res.status(422).render('admin/faqs/form', {
        pageTitle: 'Edit FAQ', active: 'faqs',
        item: Object.assign({ id: id }, data), error
      });
    }
    await query(
      'UPDATE faqs SET question = ?, answer = ? WHERE id = ?',
      [data.question, data.answer, id]
    );
    res.redirect('/admin/faqs?saved=1');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/delete', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isFinite(id)) await query('DELETE FROM faqs WHERE id = ?', [id]);
    res.redirect('/admin/faqs?saved=1');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
