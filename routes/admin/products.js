const express = require('express');
const { query, queryOne, pool } = require('../../lib/db');
const { BASE_URL } = require('../../lib/seo');
const { imageUpload, csrfOk, saveUploadedMedia, removeUploaded } = require('../../lib/uploads');

const router = express.Router();

const VEHICLES = ['car', 'bike', 'both'];
const PER_CHOICES = [10, 25, 50, 100];

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
const SEO_TEXT_FIELDS = [
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

const PRODUCT_LIMITS = [
  ['name', 'Name', 150],
  ['slug', 'Slug', 120],
  ['category', 'Category', 100],
  ['size', 'Size', 50],
  ['sku', 'SKU', 50],
  ['listing_blurb', 'Listing blurb', 255]
];

// ---- Parsing helpers ------------------------------------------------------

function parseLines(text) {
  return String(text || '').split(/\r?\n/)
    .map(function (line) { return line.trim(); })
    .filter(Boolean);
}

function linesToJson(text) {
  const lines = parseLines(text);
  return lines.length ? JSON.stringify(lines) : null;
}

// "Label | Value" lines become an object; lines without a pipe are skipped
function specsToJson(text) {
  const specs = {};
  let any = false;
  parseLines(text).forEach(function (line) {
    const idx = line.indexOf('|');
    if (idx === -1) return;
    const label = line.slice(0, idx).trim();
    if (!label) return;
    specs[label] = line.slice(idx + 1).trim();
    any = true;
  });
  return any ? JSON.stringify(specs) : null;
}

function parseJsonColumn(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch (err) { return null; }
  }
  return value;
}

function arrayToText(value) {
  const arr = parseJsonColumn(value);
  return Array.isArray(arr) ? arr.join('\n') : '';
}

function specsToText(value) {
  const obj = parseJsonColumn(value);
  if (!obj || Array.isArray(obj) || typeof obj !== 'object') return '';
  return Object.keys(obj).map(function (label) {
    return label + ' | ' + obj[label];
  }).join('\n');
}

// ---- Form readers ---------------------------------------------------------

function readProductForm(body) {
  const price = parseFloat(body.price_lkr);
  return {
    name: String(body.name || '').trim(),
    slug: String(body.slug || '').trim().toLowerCase(),
    vehicle: VEHICLES.indexOf(body.vehicle) !== -1 ? body.vehicle : 'both',
    category: String(body.category || '').trim() || null,
    price_lkr: Number.isFinite(price) ? price : null,
    size: String(body.size || '').trim() || null,
    sku: String(body.sku || '').trim() || null,
    listing_blurb: String(body.listing_blurb || '').trim() || null,
    short_description: String(body.short_description || '').trim() || null,
    description_html: String(body.description_html || '').trim() || null,
    features: linesToJson(body.features),
    specs: specsToJson(body.specs),
    how_to_use: linesToJson(body.how_to_use),
    is_active: body.is_active ? 1 : 0
  };
}

// Blank SEO inputs become NULL so the site falls back to auto-generated values
function readSeoForm(body) {
  const values = {};
  let error = null;
  SEO_TEXT_FIELDS.forEach(function (field) {
    const s = String(body[field[0]] || '').trim();
    values[field[0]] = s || null;
    if (s.length > field[2] && !error) {
      error = field[1] + ' must be ' + field[2] + ' characters or fewer';
    }
  });
  values.excerpt = String(body.excerpt || '').trim() || null;
  values.cornerstone = body.cornerstone ? 1 : 0;
  values.page_type = PAGE_TYPES.indexOf(body.page_type) !== -1 ? body.page_type : 'Item Page';
  values.article_type = ARTICLE_TYPES.indexOf(body.article_type) !== -1 ? body.article_type : 'None';
  return { values: values, error: error };
}

function readImagePicks(body) {
  const featured = parseInt(body.featured_media, 10);
  let gallery = body.gallery_media === undefined ? [] : body.gallery_media;
  if (!Array.isArray(gallery)) gallery = [gallery];
  return {
    featuredId: Number.isFinite(featured) ? featured : null,
    galleryIds: gallery
      .map(function (v) { return parseInt(v, 10); })
      .filter(function (n) { return Number.isFinite(n); })
  };
}

function validate(data) {
  if (!data.name) return 'Name is required';
  if (!data.slug) return 'Slug is required';
  if (!/^[a-z0-9-]+$/.test(data.slug)) return 'Slug can only contain lowercase letters, numbers and hyphens';
  if (data.price_lkr === null || data.price_lkr < 0) return 'Price must be a number of rupees, 0 or more';
  let error = null;
  PRODUCT_LIMITS.forEach(function (field) {
    const value = data[field[0]];
    if (value && String(value).length > field[2] && !error) {
      error = field[1] + ' must be ' + field[2] + ' characters or fewer';
    }
  });
  return error;
}

// ---- Render helpers -------------------------------------------------------

function mediaList() {
  return query('SELECT id, file_path, alt_text FROM media ORDER BY created_at DESC, id DESC');
}

function formLocals(opts) {
  return {
    pageTitle: opts.product && opts.product.id ? 'Edit product' : 'Add product',
    active: 'products',
    product: opts.product,
    seo: opts.seo,
    media: opts.media,
    featuredId: opts.featuredId,
    galleryIds: opts.galleryIds,
    featuresText: opts.featuresText,
    specsText: opts.specsText,
    howToText: opts.howToText,
    pageTypes: PAGE_TYPES,
    articleTypes: ARTICLE_TYPES,
    baseUrl: BASE_URL,
    error: opts.error || null
  };
}

// ---- List -----------------------------------------------------------------

router.get('/', async function (req, res, next) {
  try {
    req.session.adminPerPage = req.session.adminPerPage || {};
    const asked = parseInt(req.query.per, 10);
    if (PER_CHOICES.indexOf(asked) !== -1) req.session.adminPerPage.products = asked;
    const per = PER_CHOICES.indexOf(req.session.adminPerPage.products) !== -1
      ? req.session.adminPerPage.products
      : 10;

    let page = parseInt(req.query.page, 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    const totalRow = await queryOne('SELECT COUNT(*) AS n FROM products');
    const total = totalRow ? totalRow.n : 0;
    const totalPages = Math.max(1, Math.ceil(total / per));
    if (page > totalPages) page = totalPages;

    const products = await query(
      'SELECT p.id, p.slug, p.name, p.vehicle, p.category, p.price_lkr, p.size, p.is_active, p.click_count, ' +
      '(SELECT m.file_path FROM product_images pi JOIN media m ON m.id = pi.media_id ' +
      ' WHERE pi.product_id = p.id AND pi.role = "featured" ORDER BY pi.sort_order, pi.id LIMIT 1) AS featured_image ' +
      'FROM products p ORDER BY p.name LIMIT ? OFFSET ?',
      [per, (page - 1) * per]
    );
    res.render('admin/products/list', {
      pageTitle: 'Products', active: 'products', products,
      currentPage: page, totalPages: totalPages, per: per
    });
  } catch (err) {
    next(err);
  }
});

// ---- Form -----------------------------------------------------------------

router.get('/new', async function (req, res, next) {
  try {
    const media = await mediaList();
    res.render('admin/products/form', formLocals({
      product: null, seo: null, media,
      featuredId: null, galleryIds: [],
      featuresText: '', specsText: '', howToText: ''
    }));
  } catch (err) {
    next(err);
  }
});

router.get('/:id/edit', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const product = Number.isFinite(id)
      ? await queryOne('SELECT * FROM products WHERE id = ?', [id])
      : null;
    if (!product) return res.status(404).send('Product not found');

    const [seo, images, media] = await Promise.all([
      queryOne('SELECT * FROM product_seo WHERE product_id = ?', [id]),
      query('SELECT media_id, role FROM product_images WHERE product_id = ? ORDER BY sort_order, id', [id]),
      mediaList()
    ]);
    const featuredRow = images.find(function (row) { return row.role === 'featured'; });

    res.render('admin/products/form', formLocals({
      product, seo, media,
      featuredId: featuredRow ? featuredRow.media_id : null,
      galleryIds: images
        .filter(function (row) { return row.role === 'gallery'; })
        .map(function (row) { return row.media_id; }),
      featuresText: arrayToText(product.features),
      specsText: specsToText(product.specs),
      howToText: arrayToText(product.how_to_use)
    }));
  } catch (err) {
    next(err);
  }
});

// ---- Save (create + update share one transaction path) --------------------

function discardUploads(req) {
  return Promise.all((req.files || []).map(removeUploaded));
}

async function renderFormError(req, res, id, error) {
  const body = req.body || {};
  const data = readProductForm(body);
  const seo = readSeoForm(body);
  const picks = readImagePicks(body);
  const media = await mediaList();
  res.status(422).render('admin/products/form', formLocals({
    product: Object.assign({}, data, { id: id }),
    seo: seo.values,
    media,
    featuredId: picks.featuredId,
    galleryIds: picks.galleryIds,
    featuresText: String(body.features || ''),
    specsText: String(body.specs || ''),
    howToText: String(body.how_to_use || ''),
    error: error
  }));
}

async function saveProduct(req, res, next, id) {
  const data = readProductForm(req.body);
  const seo = readSeoForm(req.body);
  const picks = readImagePicks(req.body);
  const files = req.files || [];

  try {
    let error = validate(data) || seo.error;
    if (!error) {
      const clash = await queryOne(
        'SELECT id FROM products WHERE slug = ? AND id <> ?', [data.slug, id || 0]
      );
      if (clash) error = 'The slug "' + data.slug + '" is already used by another product';
    }
    if (error) {
      await discardUploads(req);
      return await renderFormError(req, res, id, error);
    }

    // Uploaded files join the media library first so their ids can be
    // attached inside the transaction below.
    const uploadedIds = [];
    for (let i = 0; i < files.length; i++) {
      uploadedIds.push(await saveUploadedMedia(files[i], data.name));
    }
    let featuredId = picks.featuredId;
    const extra = uploadedIds.slice();
    if (featuredId === null && extra.length) featuredId = extra.shift();
    const galleryIds = picks.galleryIds.concat(extra);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const cols = [
        data.slug, data.name, data.vehicle, data.category, data.price_lkr,
        data.size, data.sku, data.listing_blurb, data.short_description,
        data.description_html, data.features, data.specs, data.how_to_use, data.is_active
      ];
      let productId = id;
      if (id) {
        await conn.query(
          'UPDATE products SET slug = ?, name = ?, vehicle = ?, category = ?, price_lkr = ?, ' +
          'size = ?, sku = ?, listing_blurb = ?, short_description = ?, description_html = ?, ' +
          'features = ?, specs = ?, how_to_use = ?, is_active = ? WHERE id = ?',
          cols.concat(id)
        );
      } else {
        const [result] = await conn.query(
          'INSERT INTO products (slug, name, vehicle, category, price_lkr, size, sku, ' +
          'listing_blurb, short_description, description_html, features, specs, how_to_use, is_active) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          cols
        );
        productId = result.insertId;
      }

      await conn.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
      if (featuredId !== null) {
        await conn.query(
          'INSERT INTO product_images (product_id, media_id, role, sort_order) VALUES (?, ?, "featured", 0)',
          [productId, featuredId]
        );
      }
      for (let i = 0; i < galleryIds.length; i++) {
        await conn.query(
          'INSERT INTO product_images (product_id, media_id, role, sort_order) VALUES (?, ?, "gallery", ?)',
          [productId, galleryIds[i], i]
        );
      }

      const v = seo.values;
      await conn.query(
        'INSERT INTO product_seo (product_id, seo_title, focus_keyphrase, meta_description, ' +
        'cornerstone, breadcrumbs_title, canonical_url, page_type, article_type, ' +
        'social_title, social_description, x_title, x_description, excerpt) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
        'ON DUPLICATE KEY UPDATE seo_title = VALUES(seo_title), focus_keyphrase = VALUES(focus_keyphrase), ' +
        'meta_description = VALUES(meta_description), cornerstone = VALUES(cornerstone), ' +
        'breadcrumbs_title = VALUES(breadcrumbs_title), canonical_url = VALUES(canonical_url), ' +
        'page_type = VALUES(page_type), article_type = VALUES(article_type), ' +
        'social_title = VALUES(social_title), social_description = VALUES(social_description), ' +
        'x_title = VALUES(x_title), x_description = VALUES(x_description), excerpt = VALUES(excerpt)',
        [
          productId, v.seo_title, v.focus_keyphrase, v.meta_description,
          v.cornerstone, v.breadcrumbs_title, v.canonical_url, v.page_type, v.article_type,
          v.social_title, v.social_description, v.x_title, v.x_description, v.excerpt
        ]
      );

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    res.redirect(id ? '/admin/products/' + id + '/edit?saved=1' : '/admin/products?saved=1');
  } catch (err) {
    // Duplicate slug race between the pre-check and the write
    if (err && err.code === 'ER_DUP_ENTRY') {
      return renderFormError(req, res, id, 'The slug "' + data.slug + '" is already used by another product').catch(next);
    }
    next(err);
  }
}

// Multipart, so multer runs first and the CSRF token is checked by hand
// (the global gate in routes/admin/index.js skips multipart bodies).
async function handleMultipart(req, res, next, uploadErr, id) {
  try {
    req.body = req.body || {};
    if (uploadErr) {
      await discardUploads(req);
      return await renderFormError(req, res, id,
        'Image upload failed. Use jpg, png, webp, avif or gif files under 8 MB each, at most 12 at a time.');
    }
    if (!csrfOk(req)) {
      await discardUploads(req);
      return res.status(403).send('Invalid or missing CSRF token');
    }
    await saveProduct(req, res, next, id);
  } catch (err) {
    next(err);
  }
}

router.post('/', function (req, res, next) {
  imageUpload.array('new_images', 12)(req, res, function (err) {
    handleMultipart(req, res, next, err, null);
  });
});

router.post('/:id', function (req, res, next) {
  imageUpload.array('new_images', 12)(req, res, async function (err) {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = Number.isFinite(id)
        ? await queryOne('SELECT id FROM products WHERE id = ?', [id])
        : null;
      if (!existing) {
        await discardUploads(req);
        return res.status(404).send('Product not found');
      }
      await handleMultipart(req, res, next, err, id);
    } catch (e) {
      next(e);
    }
  });
});

// ---- Delete (FK cascades remove images and SEO) ---------------------------

router.post('/:id/delete', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isFinite(id)) await query('DELETE FROM products WHERE id = ?', [id]);
    res.redirect('/admin/products?saved=1');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
