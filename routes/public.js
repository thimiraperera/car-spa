const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query, queryOne } = require('../lib/db');
const siteSettings = require('../lib/settings');
const { pageMeta, productMeta, BASE_URL } = require('../lib/seo');
const { productSchema, faqSchema, localBusinessSchema } = require('../lib/jsonld');
const { sendMail, buildEmailHtml } = require('../lib/mailer');

const router = express.Router();

// Products with their featured image, ready for cards.
const CARD_SELECT =
  'SELECT p.id, p.slug, p.name, p.vehicle, p.category, p.price_lkr, p.size, p.listing_blurb, p.stock_qty, ' +
  '(SELECT m.file_path FROM product_images pi JOIN media m ON m.id = pi.media_id ' +
  ' WHERE pi.product_id = p.id AND pi.role = "featured" ORDER BY pi.sort_order, pi.id LIMIT 1) AS featured_image ' +
  'FROM products p WHERE p.is_active = 1 ';

function cardify(rows) {
  return rows.map(function (p) {
    return Object.assign({}, p, {
      price_lkr: Number(p.price_lkr),
      image: p.featured_image ? '/media/' + p.featured_image : null,
      url: '/products/' + p.slug
    });
  });
}

// ---- Home -----------------------------------------------------------------

router.get('/', async function (req, res, next) {
  try {
    const site = res.locals.site;
    const carouselCount = siteSettings.intSetting(site.settings, 'carousel_product_count', 10);
    const testimonialCount = siteSettings.intSetting(site.settings, 'testimonials_count', 10);
    const picksCount = siteSettings.intSetting(site.settings, 'hero_picks_count', 3);

    const [carousel, picksCar, picksBike, testimonials, faqs] = await Promise.all([
      query(CARD_SELECT + 'ORDER BY p.created_at DESC, p.id DESC LIMIT ?', [carouselCount]),
      query(CARD_SELECT + 'AND p.vehicle IN ("car", "both") ORDER BY p.click_count DESC, p.created_at DESC LIMIT ?', [picksCount]),
      query(CARD_SELECT + 'AND p.vehicle IN ("bike", "both") ORDER BY p.click_count DESC, p.created_at DESC LIMIT ?', [picksCount]),
      query('SELECT t.*, m.file_path AS image_file_path FROM testimonials t ' +
        'LEFT JOIN media m ON m.id = t.image_media_id ' +
        'WHERE t.is_active = 1 ORDER BY t.created_at DESC, t.id DESC LIMIT ?', [testimonialCount]),
      query('SELECT * FROM faqs WHERE is_active = 1 ORDER BY sort_order, id')
    ]);

    const meta = await pageMeta('home', {
      title: 'Car Spa LK | Premium Car Care Products in Sri Lanka',
      description: '',
      path: '/'
    });

    res.render('index', {
      meta,
      carousel: cardify(carousel),
      picksCar: cardify(picksCar),
      picksBike: cardify(picksBike),
      testimonials,
      faqs,
      jsonld: [faqSchema(faqs), localBusinessSchema(site)].filter(Boolean)
    });
  } catch (err) {
    next(err);
  }
});

// ---- Products listing (most clicked first) --------------------------------

const CATEGORY_KEYS = ['engine', 'exterior', 'interior', 'brake', 'chain'];

// Maps a raw product category string to the filter pill it belongs under.
function catKey(category) {
  const c = String(category || '').toLowerCase();
  if (c.indexOf('engine') !== -1) return 'engine';
  if (c.indexOf('exterior') !== -1 || c.indexOf('shine') !== -1) return 'exterior';
  if (c.indexOf('brake') !== -1 || c.indexOf('underbody') !== -1) return 'brake';
  if (c.indexOf('chain') !== -1 || c.indexOf('bike') !== -1) return 'chain';
  if (c.indexOf('interior') !== -1 || /\bac\b/.test(c)) return 'interior';
  return '';
}

router.get('/products', async function (req, res, next) {
  try {
    const site = res.locals.site;
    const perPage = siteSettings.intSetting(site.settings, 'products_per_page', 12);

    const currentCat = CATEGORY_KEYS.indexOf(req.query.cat) !== -1 ? req.query.cat : 'all';
    let page = parseInt(req.query.page, 10);
    if (!Number.isFinite(page) || page < 1) page = 1;

    const rows = await query(CARD_SELECT + 'ORDER BY p.click_count DESC, p.created_at DESC, p.id DESC');
    const all = cardify(rows).map(function (p) {
      return Object.assign(p, { cat_key: catKey(p.category) });
    });
    const filtered = currentCat === 'all' ? all : all.filter(function (p) { return p.cat_key === currentCat; });

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    if (page > totalPages) page = totalPages;

    const products = filtered.slice((page - 1) * perPage, page * perPage);

    const meta = await pageMeta('products', {
      title: 'Shop Car and Bike Care Products | Car Spa LK',
      description: '',
      path: '/products'
    });
    res.render('products', { meta, products, currentPage: page, totalPages, currentCat, jsonld: [] });
  } catch (err) {
    next(err);
  }
});

// ---- Product detail -------------------------------------------------------

router.get('/products/:slug', async function (req, res, next) {
  try {
    const product = await queryOne('SELECT * FROM products WHERE slug = ? AND is_active = 1', [req.params.slug]);
    if (!product) return render404(req, res);

    const images = await query(
      'SELECT m.file_path, m.alt_text, pi.role FROM product_images pi ' +
      'JOIN media m ON m.id = pi.media_id WHERE pi.product_id = ? ' +
      'ORDER BY pi.role = "featured" DESC, pi.sort_order, pi.id',
      [product.id]
    );

    // "You might also like": hand-picked ids first, topped up with same-category
    // best sellers, then random actives. Always 3 at most.
    let picked = [];
    if (typeof product.related_ids === 'string') {
      try { picked = JSON.parse(product.related_ids); } catch (err) { picked = []; }
    } else if (Array.isArray(product.related_ids)) {
      picked = product.related_ids;
    }
    picked = (Array.isArray(picked) ? picked : [])
      .map(Number)
      .filter(function (id, i, arr) {
        return Number.isInteger(id) && id > 0 && id !== product.id && arr.indexOf(id) === i;
      })
      .slice(0, 3);

    let related = [];
    if (picked.length) {
      const rows = await query(
        CARD_SELECT + 'AND p.id IN (' + picked.map(function () { return '?'; }).join(', ') + ')',
        picked
      );
      picked.forEach(function (id) {
        const row = rows.find(function (r) { return r.id === id; });
        if (row) related.push(row);
      });
    }

    if (related.length < 3) {
      const exclude = [product.id].concat(related.map(function (r) { return r.id; }));
      const holes = exclude.map(function () { return '?'; }).join(', ');
      const fill = await query(
        CARD_SELECT + 'AND p.category = ? AND p.id NOT IN (' + holes + ') ' +
        'ORDER BY p.click_count DESC LIMIT ?',
        [product.category].concat(exclude, [3 - related.length])
      );
      related = related.concat(fill);
    }

    if (related.length < 3) {
      const exclude = [product.id].concat(related.map(function (r) { return r.id; }));
      const holes = exclude.map(function () { return '?'; }).join(', ');
      const fill = await query(
        CARD_SELECT + 'AND p.id NOT IN (' + holes + ') ORDER BY RAND() LIMIT ?',
        exclude.concat([3 - related.length])
      );
      related = related.concat(fill);
    }
    related = related.slice(0, 3);

    ['features', 'specs', 'how_to_use'].forEach(function (key) {
      if (typeof product[key] === 'string') {
        try { product[key] = JSON.parse(product[key]); } catch (err) { product[key] = null; }
      }
    });
    product.price_lkr = Number(product.price_lkr);

    const featured = images.find(function (img) { return img.role === 'featured'; }) || images[0] || null;
    const meta = await productMeta(product.id, {
      title: product.name + ' | Car Spa LK',
      description: product.short_description || '',
      path: '/products/' + product.slug,
      image: featured ? BASE_URL + '/media/' + featured.file_path : null
    });

    res.render('product', {
      meta,
      product,
      images,
      featured,
      related: cardify(related),
      jsonld: [productSchema(product, images, meta)]
    });
  } catch (err) {
    next(err);
  }
});

// ---- Contact --------------------------------------------------------------

router.get('/contact', async function (req, res, next) {
  try {
    const meta = await pageMeta('contact', {
      title: 'Contact Us | Car Spa LK',
      description: '',
      path: '/contact'
    });
    res.render('contact', { meta, jsonld: [localBusinessSchema(res.locals.site)] });
  } catch (err) {
    next(err);
  }
});

// ---- Cart and checkout ----------------------------------------------------

router.get('/cart', async function (req, res, next) {
  try {
    const meta = await pageMeta('cart', { title: 'Your Cart | Car Spa LK', description: '', path: '/cart', robots: 'noindex' });
    res.render('cart', { meta, jsonld: [] });
  } catch (err) {
    next(err);
  }
});

router.get('/checkout', async function (req, res, next) {
  try {
    const settings = res.locals.site.settings;
    const meta = await pageMeta('checkout', { title: 'Checkout | Car Spa LK', description: '', path: '/checkout', robots: 'noindex' });
    res.render('checkout', {
      meta,
      // Missing keys count as enabled so a fresh database keeps both methods.
      payCod: siteSettings.get(settings, 'payment_cod_enabled', '1') !== '0',
      payBank: siteSettings.get(settings, 'payment_bank_enabled', '1') !== '0',
      jsonld: []
    });
  } catch (err) {
    next(err);
  }
});

// ---- Legal pages (DB content) ---------------------------------------------

['privacy-policy', 'cookie-policy', 'terms-of-service', 'delivery-returns'].forEach(function (slug) {
  router.get('/' + slug, async function (req, res, next) {
    try {
      const page = await queryOne('SELECT * FROM legal_pages WHERE slug = ?', [slug]);
      if (!page) return render404(req, res);
      const meta = await pageMeta(page.slug, {
        title: page.title + ' | Car Spa LK',
        description: '',
        path: '/' + page.slug
      });
      res.render('legal', { meta, page, jsonld: [] });
    } catch (err) {
      next(err);
    }
  });
});

// ---- 404 ------------------------------------------------------------------

async function render404(req, res) {
  const meta = await pageMeta('404', { title: 'Page Not Found | Car Spa LK', description: '', path: '/404', robots: 'noindex' });
  res.status(404).render('404', { meta, jsonld: [] });
}

router.get('/404', function (req, res, next) {
  render404(req, res).catch(next);
});

// ---- Forgot / reset password (public) --------------------------------------

async function sendResetEmail(admin) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await query(
    'UPDATE admin_users SET reset_token_hash = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?',
    [tokenHash, admin.id]
  );
  const resetUrl = BASE_URL + '/reset-password/' + token;
  const bodyHtml =
    '<p>Hi ' + (admin.first_name || admin.username) + ',</p>' +
    '<p>Click below to set a new password for your Car Spa LK admin account. This link expires in 1 hour.</p>' +
    '<p><a href="' + resetUrl + '" style="display:inline-block;background:#e0332b;color:#fff;padding:10px 20px;' +
    'border-radius:8px;text-decoration:none;font-weight:700;">Reset password</a></p>' +
    '<p>If you did not request this, you can ignore this email.</p>';
  const html = await buildEmailHtml({ title: 'Reset your password', bodyHtml });
  await sendMail({
    to: admin.email,
    subject: 'Reset your Car Spa LK admin password',
    html,
    text: 'Reset your password: ' + resetUrl
  });
}

router.get('/forgot-password', async function (req, res, next) {
  try {
    const meta = await pageMeta('forgot-password', {
      title: 'Forgot Password | Car Spa LK', description: '', path: '/forgot-password', robots: 'noindex'
    });
    res.render('forgot-password', { meta, sent: false, jsonld: [] });
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', async function (req, res, next) {
  try {
    const email = String((req.body && req.body.email) || '').trim();
    if (email) {
      const admin = await queryOne('SELECT * FROM admin_users WHERE email = ?', [email]);
      // Whether or not an account was found, the response below is identical,
      // so this endpoint cannot be used to discover which emails have admin
      // accounts. A failed send (bad SMTP config etc) never surfaces either.
      if (admin) {
        try {
          await sendResetEmail(admin);
        } catch (mailErr) {
          console.error('forgot-password: could not send reset email:', mailErr.message);
        }
      }
    }
    const meta = await pageMeta('forgot-password', {
      title: 'Forgot Password | Car Spa LK', description: '', path: '/forgot-password', robots: 'noindex'
    });
    res.render('forgot-password', { meta, sent: true, jsonld: [] });
  } catch (err) {
    next(err);
  }
});

router.get('/reset-password/:token', async function (req, res, next) {
  try {
    const tokenHash = crypto.createHash('sha256').update(String(req.params.token || '')).digest('hex');
    const admin = await queryOne(
      'SELECT id FROM admin_users WHERE reset_token_hash = ? AND reset_token_expires > NOW()', [tokenHash]
    );
    const meta = await pageMeta('reset-password', {
      title: 'Reset Password | Car Spa LK', description: '', path: '/reset-password', robots: 'noindex'
    });
    res.render('reset-password', { meta, token: req.params.token, valid: !!admin, error: null, jsonld: [] });
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password/:token', async function (req, res, next) {
  try {
    const tokenHash = crypto.createHash('sha256').update(String(req.params.token || '')).digest('hex');
    const admin = await queryOne(
      'SELECT id FROM admin_users WHERE reset_token_hash = ? AND reset_token_expires > NOW()', [tokenHash]
    );
    const meta = await pageMeta('reset-password', {
      title: 'Reset Password | Car Spa LK', description: '', path: '/reset-password', robots: 'noindex'
    });
    if (!admin) {
      return res.status(400).render('reset-password', { meta, token: req.params.token, valid: false, error: null, jsonld: [] });
    }

    const password = String((req.body && req.body.password) || '');
    const confirm = String((req.body && req.body.confirm_password) || '');
    let error = null;
    if (password.length < 8) error = 'New password must be at least 8 characters';
    else if (password !== confirm) error = 'Passwords do not match';
    if (error) {
      return res.status(422).render('reset-password', { meta, token: req.params.token, valid: true, error, jsonld: [] });
    }

    const hash = await bcrypt.hash(password, 10);
    // Single use: cleared immediately so the same link cannot be replayed.
    await query(
      'UPDATE admin_users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = ?',
      [hash, admin.id]
    );
    res.redirect('/admin/login?reset=1');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.render404 = render404;
