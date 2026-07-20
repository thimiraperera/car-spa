const express = require('express');
const path = require('path');
const fs = require('fs');
const { query, queryOne } = require('../../lib/db');
const { MEDIA_ROOT } = require('../../lib/uploads');

const router = express.Router();

const PER_CHOICES = [10, 25, 50, 100];

router.get('/', async function (req, res, next) {
  try {
    req.session.adminPerPage = req.session.adminPerPage || {};
    const asked = parseInt(req.query.per, 10);
    if (PER_CHOICES.indexOf(asked) !== -1) req.session.adminPerPage.media = asked;
    const perPage = PER_CHOICES.indexOf(req.session.adminPerPage.media) !== -1
      ? req.session.adminPerPage.media
      : 25;

    let page = parseInt(req.query.page, 10);
    if (!Number.isFinite(page) || page < 1) page = 1;

    const totalRow = await queryOne('SELECT COUNT(*) AS n FROM media');
    const total = totalRow ? totalRow.n : 0;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (page > totalPages) page = totalPages;
    const offset = (page - 1) * perPage;

    const items = await query(
      'SELECT * FROM media ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?',
      [perPage, offset]
    );
    res.render('admin/media/index', {
      pageTitle: 'Media',
      active: 'media',
      items: items,
      currentPage: page,
      totalPages: totalPages,
      per: perPage,
      err: req.query.err || null
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.redirect('/admin/media');
    const title = String(req.body.title || '').trim().slice(0, 190);
    const altText = String(req.body.alt_text || '').trim().slice(0, 255);
    const description = String(req.body.description || '').trim();
    const caption = String(req.body.caption || '').trim().slice(0, 255);
    await query(
      'UPDATE media SET title = ?, alt_text = ?, description = ?, caption = ? WHERE id = ?',
      [title || null, altText, description || null, caption || null, id]
    );
    res.redirect('/admin/media?saved=1');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/delete', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.redirect('/admin/media');
    const row = await queryOne('SELECT * FROM media WHERE id = ?', [id]);
    if (!row) return res.redirect('/admin/media');

    const used = await queryOne('SELECT COUNT(*) AS n FROM product_images WHERE media_id = ?', [id]);
    if (used && used.n > 0) return res.redirect('/admin/media?err=used');

    await query('DELETE FROM media WHERE id = ?', [id]);
    try {
      await fs.promises.unlink(path.join(MEDIA_ROOT, row.file_path));
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    res.redirect('/admin/media?saved=1');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
