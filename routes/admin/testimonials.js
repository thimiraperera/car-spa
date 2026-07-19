const express = require('express');
const { query, queryOne } = require('../../lib/db');

const router = express.Router();

function readForm(body) {
  const sort = parseInt(body.sort_order, 10);
  const rating = parseInt(body.rating, 10);
  return {
    quote: String(body.quote || '').trim(),
    customer_name: String(body.customer_name || '').trim(),
    detail: String(body.detail || '').trim(),
    rating: rating >= 1 && rating <= 5 ? rating : 5,
    is_active: body.is_active ? 1 : 0,
    sort_order: Number.isFinite(sort) ? sort : 0
  };
}

function validate(data) {
  if (!data.quote) return 'Quote is required';
  if (!data.customer_name) return 'Customer name is required';
  return null;
}

router.get('/', async function (req, res, next) {
  try {
    const testimonials = await query('SELECT * FROM testimonials ORDER BY created_at DESC, id DESC');
    res.render('admin/testimonials/list', { pageTitle: 'Testimonials', active: 'testimonials', testimonials });
  } catch (err) {
    next(err);
  }
});

router.get('/new', function (req, res) {
  res.render('admin/testimonials/form', {
    pageTitle: 'Add testimonial', active: 'testimonials', item: null, error: null
  });
});

router.get('/:id/edit', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const item = Number.isFinite(id)
      ? await queryOne('SELECT * FROM testimonials WHERE id = ?', [id])
      : null;
    if (!item) return res.status(404).send('Testimonial not found');
    res.render('admin/testimonials/form', {
      pageTitle: 'Edit testimonial', active: 'testimonials', item, error: null
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
      return res.status(422).render('admin/testimonials/form', {
        pageTitle: 'Add testimonial', active: 'testimonials', item: data, error
      });
    }
    await query(
      'INSERT INTO testimonials (quote, customer_name, detail, rating, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [data.quote, data.customer_name, data.detail || null, data.rating, data.is_active, data.sort_order]
    );
    res.redirect('/admin/testimonials?saved=1');
  } catch (err) {
    next(err);
  }
});

router.post('/:id', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = Number.isFinite(id)
      ? await queryOne('SELECT id FROM testimonials WHERE id = ?', [id])
      : null;
    if (!existing) return res.status(404).send('Testimonial not found');
    const data = readForm(req.body);
    const error = validate(data);
    if (error) {
      return res.status(422).render('admin/testimonials/form', {
        pageTitle: 'Edit testimonial', active: 'testimonials',
        item: Object.assign({ id: id }, data), error
      });
    }
    await query(
      'UPDATE testimonials SET quote = ?, customer_name = ?, detail = ?, rating = ?, is_active = ?, sort_order = ? WHERE id = ?',
      [data.quote, data.customer_name, data.detail || null, data.rating, data.is_active, data.sort_order, id]
    );
    res.redirect('/admin/testimonials?saved=1');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/delete', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isFinite(id)) await query('DELETE FROM testimonials WHERE id = ?', [id]);
    res.redirect('/admin/testimonials?saved=1');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
