const express = require('express');
const { query, queryOne } = require('../../lib/db');

const router = express.Router();

function readForm(body) {
  const sort = parseInt(body.sort_order, 10);
  const rating = parseInt(body.rating, 10);
  const imageMedia = parseInt(body.image_media, 10);
  return {
    quote: String(body.quote || '').trim(),
    customer_name: String(body.customer_name || '').trim(),
    detail: String(body.detail || '').trim(),
    rating: rating >= 1 && rating <= 5 ? rating : 5,
    is_active: body.is_active ? 1 : 0,
    sort_order: Number.isFinite(sort) ? sort : 0,
    image_media_id: Number.isFinite(imageMedia) ? imageMedia : null
  };
}

function validate(data) {
  if (!data.quote) return 'Quote is required';
  if (!data.customer_name) return 'Customer name is required';
  return null;
}

function mediaList() {
  return query('SELECT id, file_path, alt_text FROM media ORDER BY created_at DESC, id DESC');
}

router.get('/', async function (req, res, next) {
  try {
    const testimonials = await query('SELECT t.*, m.file_path AS image_file_path FROM testimonials t ' +
      'LEFT JOIN media m ON m.id = t.image_media_id ORDER BY t.created_at DESC, t.id DESC');
    res.render('admin/testimonials/list', { pageTitle: 'Testimonials', active: 'testimonials', testimonials });
  } catch (err) {
    next(err);
  }
});

router.get('/new', async function (req, res, next) {
  try {
    const media = await mediaList();
    res.render('admin/testimonials/form', {
      pageTitle: 'Add testimonial', active: 'testimonials', item: null, media, error: null
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/edit', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const item = Number.isFinite(id)
      ? await queryOne('SELECT * FROM testimonials WHERE id = ?', [id])
      : null;
    if (!item) return res.status(404).send('Testimonial not found');
    const media = await mediaList();
    res.render('admin/testimonials/form', {
      pageTitle: 'Edit testimonial', active: 'testimonials', item, media, error: null
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
      const media = await mediaList();
      return res.status(422).render('admin/testimonials/form', {
        pageTitle: 'Add testimonial', active: 'testimonials', item: data, media, error
      });
    }
    await query(
      'INSERT INTO testimonials (quote, customer_name, detail, rating, is_active, sort_order, image_media_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.quote, data.customer_name, data.detail || null, data.rating, data.is_active, data.sort_order, data.image_media_id]
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
      const media = await mediaList();
      return res.status(422).render('admin/testimonials/form', {
        pageTitle: 'Edit testimonial', active: 'testimonials',
        item: Object.assign({ id: id }, data), media, error
      });
    }
    await query(
      'UPDATE testimonials SET quote = ?, customer_name = ?, detail = ?, rating = ?, is_active = ?, sort_order = ?, image_media_id = ? WHERE id = ?',
      [data.quote, data.customer_name, data.detail || null, data.rating, data.is_active, data.sort_order, data.image_media_id, id]
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
