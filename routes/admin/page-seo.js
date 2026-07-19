const express = require('express');
const { query, queryOne } = require('../../lib/db');

const router = express.Router();

const PAGE_TYPES = [
  'Default for Pages (Web Page)', 'WebPage', 'Item Page', 'About Page', 'FAQ Page',
  'QA Page', 'Profile Page', 'Contact Page', 'Medical Web Page', 'Collection Page',
  'Checkout Page', 'Real Estate Listing', 'Search Results Page'
];

const ARTICLE_TYPES = [
  'Default for Pages (None)', 'Article', 'Blog Post', 'Social Media Posting',
  'News Article', 'Advertiser Content Article', 'Satirical Article',
  'Scholarly Article', 'Tech Article', 'Report', 'None'
];

// name, human label, max length (matches column sizes in schema.sql)
const TEXT_FIELDS = [
  ['seo_title', 'SEO title', 70],
  ['focus_keyphrase', 'Focus keyphrase', 120],
  ['meta_description', 'Meta description', 200],
  ['breadcrumbs_title', 'Breadcrumbs title', 120],
  ['canonical_url', 'Canonical URL', 255],
  ['social_title', 'Social title', 120],
  ['social_description', 'Social description', 300],
  ['x_title', 'X title', 120],
  ['x_description', 'X description', 300]
];

function canonicalDefault(row) {
  return (process.env.BASE_URL || 'https://carspa.lk') + row.path;
}

function formLocals(row, error) {
  return {
    pageTitle: 'Edit SEO: ' + row.page_key,
    active: 'page-seo',
    row,
    pageTypes: PAGE_TYPES,
    articleTypes: ARTICLE_TYPES,
    canonicalDefault: canonicalDefault(row),
    error: error || null
  };
}

router.get('/', async function (req, res, next) {
  try {
    const rows = await query(
      'SELECT id, page_key, path, seo_title, cornerstone, updated_at FROM page_seo ORDER BY page_key'
    );
    res.render('admin/page-seo/list', { pageTitle: 'Page SEO', active: 'page-seo', rows });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/edit', async function (req, res, next) {
  try {
    const row = await queryOne('SELECT * FROM page_seo WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).send('Page not found');
    res.render('admin/page-seo/form', formLocals(row));
  } catch (err) {
    next(err);
  }
});

router.post('/:id', async function (req, res, next) {
  try {
    const row = await queryOne('SELECT * FROM page_seo WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).send('Page not found');

    // Blank inputs become NULL so the site falls back to auto-generated values.
    const values = {};
    let error = null;
    TEXT_FIELDS.forEach(function (field) {
      const s = String(req.body[field[0]] || '').trim();
      values[field[0]] = s || null;
      if (s.length > field[2] && !error) {
        error = field[1] + ' must be ' + field[2] + ' characters or fewer';
      }
    });
    values.excerpt = String(req.body.excerpt || '').trim() || null;
    values.cornerstone = req.body.cornerstone ? 1 : 0;
    values.page_type = PAGE_TYPES.indexOf(req.body.page_type) !== -1 ? req.body.page_type : PAGE_TYPES[0];
    values.article_type = ARTICLE_TYPES.indexOf(req.body.article_type) !== -1 ? req.body.article_type : ARTICLE_TYPES[0];

    if (error) {
      return res.status(422).render('admin/page-seo/form',
        formLocals(Object.assign({}, row, values), error));
    }

    await query(
      'UPDATE page_seo SET seo_title = ?, focus_keyphrase = ?, meta_description = ?, ' +
      'cornerstone = ?, breadcrumbs_title = ?, canonical_url = ?, page_type = ?, ' +
      'article_type = ?, social_title = ?, social_description = ?, x_title = ?, ' +
      'x_description = ?, excerpt = ? WHERE id = ?',
      [
        values.seo_title, values.focus_keyphrase, values.meta_description,
        values.cornerstone, values.breadcrumbs_title, values.canonical_url,
        values.page_type, values.article_type, values.social_title,
        values.social_description, values.x_title, values.x_description,
        values.excerpt, row.id
      ]
    );
    res.redirect('/admin/page-seo/' + row.id + '/edit?saved=1');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
