const express = require('express');
const { query, queryOne } = require('../../lib/db');

const router = express.Router();

router.get('/', async function (req, res, next) {
  try {
    const pages = await query('SELECT slug, title, updated_at FROM legal_pages ORDER BY id');
    res.render('admin/legal/list', { pageTitle: 'Legal pages', active: 'legal', pages });
  } catch (err) {
    next(err);
  }
});

router.get('/:slug/edit', async function (req, res, next) {
  try {
    const page = await queryOne('SELECT * FROM legal_pages WHERE slug = ?', [req.params.slug]);
    if (!page) return res.status(404).send('Legal page not found');
    res.render('admin/legal/edit', {
      pageTitle: 'Edit ' + page.title, active: 'legal', page, error: null
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:slug', async function (req, res, next) {
  try {
    const page = await queryOne('SELECT * FROM legal_pages WHERE slug = ?', [req.params.slug]);
    if (!page) return res.status(404).send('Legal page not found');
    const title = String(req.body.title || '').trim();
    const contentHtml = String(req.body.content_html || '');
    let error = null;
    if (!title) error = 'Title is required';
    else if (title.length > 150) error = 'Title must be 150 characters or fewer';
    if (error) {
      return res.status(422).render('admin/legal/edit', {
        pageTitle: 'Edit ' + page.title, active: 'legal',
        page: Object.assign({}, page, { title: title, content_html: contentHtml }),
        error
      });
    }
    await query(
      'UPDATE legal_pages SET title = ?, content_html = ? WHERE slug = ?',
      [title, contentHtml, page.slug]
    );
    res.redirect('/admin/legal/' + encodeURIComponent(page.slug) + '/edit?saved=1');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
