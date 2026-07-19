const express = require('express');
const { query, queryOne } = require('../../lib/db');

const router = express.Router();

function readForm(body) {
  const sort = parseInt(body.sort_order, 10);
  return {
    question: String(body.question || '').trim(),
    answer: String(body.answer || '').trim(),
    is_active: body.is_active ? 1 : 0,
    sort_order: Number.isFinite(sort) ? sort : 0
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

router.post('/', async function (req, res, next) {
  try {
    const data = readForm(req.body);
    const error = validate(data);
    if (error) {
      return res.status(422).render('admin/faqs/form', {
        pageTitle: 'Add FAQ', active: 'faqs', item: data, error
      });
    }
    await query(
      'INSERT INTO faqs (question, answer, is_active, sort_order) VALUES (?, ?, ?, ?)',
      [data.question, data.answer, data.is_active, data.sort_order]
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
      'UPDATE faqs SET question = ?, answer = ?, is_active = ?, sort_order = ? WHERE id = ?',
      [data.question, data.answer, data.is_active, data.sort_order, id]
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
