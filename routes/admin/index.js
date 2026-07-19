const express = require('express');
const bcrypt = require('bcryptjs');
const { queryOne, query } = require('../../lib/db');
const { requireAdmin, csrfToken, verifyCsrf } = require('../../lib/auth');

const router = express.Router();

// ---- Login / logout -------------------------------------------------------

// Failed sign-ins are counted per client address so the single admin account
// cannot be brute forced; the counter clears on a successful sign-in.
const loginFails = new Map();
const LOGIN_MAX_FAILS = 5;
const LOGIN_LOCK_MS = 10 * 60 * 1000;

function loginLocked(ip) {
  const rec = loginFails.get(ip);
  return !!rec && rec.count >= LOGIN_MAX_FAILS && Date.now() - rec.last < LOGIN_LOCK_MS;
}

function noteLoginFail(ip) {
  const now = Date.now();
  const rec = loginFails.get(ip);
  if (rec && now - rec.last < LOGIN_LOCK_MS) {
    rec.count += 1;
    rec.last = now;
  } else {
    loginFails.set(ip, { count: 1, last: now });
  }
  if (loginFails.size > 1000) {
    loginFails.forEach(function (r, key) {
      if (now - r.last >= LOGIN_LOCK_MS) loginFails.delete(key);
    });
  }
}

router.get('/login', function (req, res) {
  if (req.session.adminId) return res.redirect('/admin');
  res.render('admin/login', { csrf: csrfToken(req), error: null });
});

router.post('/login', verifyCsrf, async function (req, res, next) {
  try {
    if (loginLocked(req.ip)) {
      return res.status(429).render('admin/login', {
        csrf: csrfToken(req), error: 'Too many attempts. Try again in a few minutes.'
      });
    }
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    const user = await queryOne('SELECT * FROM admin_users WHERE username = ?', [username]);
    const ok = user && await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      noteLoginFail(req.ip);
      // Same delay either way so usernames cannot be probed by timing.
      await new Promise(function (r) { setTimeout(r, 400); });
      return res.status(401).render('admin/login', { csrf: csrfToken(req), error: 'Wrong username or password' });
    }
    loginFails.delete(req.ip);
    req.session.regenerate(function (err) {
      if (err) return next(err);
      req.session.adminId = user.id;
      req.session.adminName = user.username;
      res.redirect('/admin');
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', requireAdmin, verifyCsrf, function (req, res, next) {
  req.session.destroy(function (err) {
    if (err) return next(err);
    res.redirect('/admin/login');
  });
});

// ---- Everything below needs a signed-in admin -----------------------------

router.use(requireAdmin);

// Make csrf + admin name available to every admin view.
router.use(function (req, res, next) {
  res.locals.csrf = csrfToken(req);
  res.locals.adminName = req.session.adminName;
  res.locals.saved = req.query.saved === '1';
  next();
});

// State-changing requests must carry the CSRF token. Multipart uploads are
// exempt here because multer parses their body inside the media module, which
// verifies the token itself right after.
router.use(function (req, res, next) {
  if (req.method === 'GET') return next();
  if (req.path === '/media' && (req.get('content-type') || '').indexOf('multipart/form-data') === 0) return next();
  return verifyCsrf(req, res, next);
});

router.get('/', async function (req, res, next) {
  try {
    const counts = await queryOne(
      'SELECT ' +
      '(SELECT COUNT(*) FROM products WHERE is_active = 1) AS products, ' +
      '(SELECT COUNT(*) FROM testimonials WHERE is_active = 1) AS testimonials, ' +
      '(SELECT COUNT(*) FROM faqs WHERE is_active = 1) AS faqs, ' +
      '(SELECT COUNT(*) FROM media) AS media, ' +
      '(SELECT COALESCE(SUM(click_count), 0) FROM products) AS clicks'
    );
    const topProducts = await query(
      'SELECT name, slug, click_count FROM products WHERE is_active = 1 ORDER BY click_count DESC LIMIT 5'
    );
    res.render('admin/dashboard', { pageTitle: 'Dashboard', active: 'dashboard', counts, topProducts });
  } catch (err) {
    next(err);
  }
});

router.use('/products', require('./products'));
router.use('/media', require('./media'));
router.use('/testimonials', require('./testimonials'));
router.use('/faqs', require('./faqs'));
router.use('/site-info', require('./site-info'));
router.use('/hours', require('./hours'));
router.use('/legal', require('./legal'));
router.use('/page-seo', require('./page-seo'));
router.use('/settings', require('./settings'));

module.exports = router;
