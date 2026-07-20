const express = require('express');
const { query, queryOne } = require('../../lib/db');
const { imageUpload, csrfOk, saveUploadedMedia, removeUploaded } = require('../../lib/uploads');

const router = express.Router();

const PER_CHOICES = [10, 25, 50, 100];

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

// Multer runs before the handler; its errors re-render as a form error.
function photoUpload(req, res, next) {
  imageUpload.single('new_photo')(req, res, function (err) {
    if (err) {
      req.uploadError = err.code === 'LIMIT_FILE_SIZE'
        ? 'Photo is too large. The limit is 8 MB.'
        : 'Photo upload failed. Use a jpg, png, webp, avif or gif.';
    }
    next();
  });
}

router.get('/', async function (req, res, next) {
  try {
    req.session.adminPerPage = req.session.adminPerPage || {};
    const chosen = parseInt(req.query.per, 10);
    if (PER_CHOICES.indexOf(chosen) !== -1) req.session.adminPerPage.testimonials = chosen;
    const perPage = PER_CHOICES.indexOf(req.session.adminPerPage.testimonials) !== -1
      ? req.session.adminPerPage.testimonials
      : 10;

    let page = parseInt(req.query.page, 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    const totalRow = await queryOne('SELECT COUNT(*) AS n FROM testimonials');
    const total = totalRow ? totalRow.n : 0;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (page > totalPages) page = totalPages;

    const testimonials = await query(
      'SELECT t.*, m.file_path AS image_file_path FROM testimonials t ' +
      'LEFT JOIN media m ON m.id = t.image_media_id ' +
      'ORDER BY t.created_at DESC, t.id DESC LIMIT ? OFFSET ?',
      [perPage, (page - 1) * perPage]
    );
    res.render('admin/testimonials/list', {
      pageTitle: 'Testimonials', active: 'testimonials', testimonials,
      currentPage: page, totalPages, perPage, perChoices: PER_CHOICES
    });
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

router.post('/', photoUpload, async function (req, res, next) {
  try {
    if (!csrfOk(req)) {
      await removeUploaded(req.file);
      return res.status(403).send('Invalid or missing CSRF token');
    }
    const data = readForm(req.body);
    const error = req.uploadError || validate(data);
    if (error) {
      await removeUploaded(req.file);
      const media = await mediaList();
      return res.status(422).render('admin/testimonials/form', {
        pageTitle: 'Add testimonial', active: 'testimonials', item: data, media, error
      });
    }
    // A freshly uploaded photo wins over whatever the picker had selected.
    if (req.file) data.image_media_id = await saveUploadedMedia(req.file, data.customer_name);
    await query(
      'INSERT INTO testimonials (quote, customer_name, detail, rating, is_active, sort_order, image_media_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.quote, data.customer_name, data.detail || null, data.rating, data.is_active, data.sort_order, data.image_media_id]
    );
    res.redirect('/admin/testimonials?saved=1');
  } catch (err) {
    next(err);
  }
});

router.post('/:id', photoUpload, async function (req, res, next) {
  try {
    if (!csrfOk(req)) {
      await removeUploaded(req.file);
      return res.status(403).send('Invalid or missing CSRF token');
    }
    const id = parseInt(req.params.id, 10);
    const existing = Number.isFinite(id)
      ? await queryOne('SELECT id FROM testimonials WHERE id = ?', [id])
      : null;
    if (!existing) {
      await removeUploaded(req.file);
      return res.status(404).send('Testimonial not found');
    }
    const data = readForm(req.body);
    const error = req.uploadError || validate(data);
    if (error) {
      await removeUploaded(req.file);
      const media = await mediaList();
      return res.status(422).render('admin/testimonials/form', {
        pageTitle: 'Edit testimonial', active: 'testimonials',
        item: Object.assign({ id: id }, data), media, error
      });
    }
    if (req.file) data.image_media_id = await saveUploadedMedia(req.file, data.customer_name);
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
