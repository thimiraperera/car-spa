const express = require('express');
const { query, queryOne } = require('../lib/db');
const siteSettings = require('../lib/settings');
const { pageMeta, productMeta, BASE_URL } = require('../lib/seo');
const { productSchema, faqSchema, localBusinessSchema } = require('../lib/jsonld');

const router = express.Router();

// Products with their featured image, ready for cards.
const CARD_SELECT =
  'SELECT p.id, p.slug, p.name, p.vehicle, p.category, p.price_lkr, p.size, p.listing_blurb, ' +
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
      query('SELECT * FROM testimonials WHERE is_active = 1 ORDER BY created_at DESC, id DESC LIMIT ?', [testimonialCount]),
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

router.get('/products', async function (req, res, next) {
  try {
    const products = await query(CARD_SELECT + 'ORDER BY p.click_count DESC, p.created_at DESC, p.id DESC');
    const meta = await pageMeta('products', {
      title: 'Shop Car and Bike Care Products | Car Spa LK',
      description: '',
      path: '/products'
    });
    res.render('products', { meta, products: cardify(products), jsonld: [] });
  } catch (err) {
    next(err);
  }
});

// ---- Product detail -------------------------------------------------------

router.get('/products/:slug', async function (req, res, next) {
  try {
    const product = await queryOne('SELECT * FROM products WHERE slug = ? AND is_active = 1', [req.params.slug]);
    if (!product) return render404(req, res);

    const [images, related] = await Promise.all([
      query(
        'SELECT m.file_path, m.alt_text, pi.role FROM product_images pi ' +
        'JOIN media m ON m.id = pi.media_id WHERE pi.product_id = ? ' +
        'ORDER BY pi.role = "featured" DESC, pi.sort_order, pi.id',
        [product.id]
      ),
      query(CARD_SELECT + 'AND p.id <> ? AND p.vehicle IN (?, "both") ORDER BY p.click_count DESC LIMIT 4',
        [product.id, product.vehicle === 'both' ? 'car' : product.vehicle])
    ]);

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
    const meta = await pageMeta('checkout', { title: 'Checkout | Car Spa LK', description: '', path: '/checkout', robots: 'noindex' });
    res.render('checkout', { meta, jsonld: [] });
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

module.exports = router;
module.exports.render404 = render404;
