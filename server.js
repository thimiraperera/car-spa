require('dotenv').config();

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');

const siteSettings = require('./lib/settings');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');

// Cache-busting version for styles.css and main.js, derived from file mtimes
// so nobody has to bump ?v=N by hand across pages anymore.
function assetVersion() {
  const files = ['styles.css', 'main.js'];
  let latest = 0;
  files.forEach(function (file) {
    try {
      const ms = fs.statSync(path.join(__dirname, file)).mtimeMs;
      if (ms > latest) latest = ms;
    } catch (err) { /* file missing, keep going */ }
  });
  return Math.round(latest / 1000).toString(36);
}
let ASSET_V = assetVersion();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('trust proxy', 1);
app.use(function (req, res, next) {
  res.set('X-Frame-Options', 'DENY');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Without a configured secret, sessions cannot survive a restart; a random
// one is safer than a guessable literal in a public repo.
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) {
  console.warn('SESSION_SECRET is not set; using a random secret, sign-ins reset on restart.');
}

app.use(session({
  name: 'carspa.sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: 'auto',
    maxAge: 1000 * 60 * 60 * 8
  }
}));

// Static files keep their existing URLs; product images move to /media.
const staticOpts = { maxAge: '7d' };
app.use('/assets', express.static(path.join(__dirname, 'assets'), staticOpts));
app.use('/media', express.static(path.join(__dirname, 'media'), staticOpts));
app.get('/styles.css', function (req, res) { res.sendFile(path.join(__dirname, 'styles.css')); });
app.get('/main.js', function (req, res) { res.sendFile(path.join(__dirname, 'main.js')); });
app.get('/favicon.ico', function (req, res) { res.status(204).end(); });

// Common locals for every render.
app.use(async function (req, res, next) {
  try {
    res.locals.site = await siteSettings.load();
    res.locals.v = ASSET_V;
    res.locals.currentPath = req.path;
    next();
  } catch (err) {
    next(err);
  }
});

// Old static URLs 301 to the clean ones so nothing indexed breaks.
const LEGACY_REDIRECTS = {
  '/index.html': '/',
  '/products.html': '/products',
  '/contact.html': '/contact',
  '/cart.html': '/cart',
  '/checkout.html': '/checkout',
  '/404.html': '/404',
  '/privacy-policy.html': '/privacy-policy',
  '/cookie-policy.html': '/cookie-policy',
  '/terms-of-service.html': '/terms-of-service',
  '/delivery-returns.html': '/delivery-returns'
};
app.use(function (req, res, next) {
  if (LEGACY_REDIRECTS[req.path]) return res.redirect(301, LEGACY_REDIRECTS[req.path]);
  const productHtml = req.path.match(/^\/products\/([a-z0-9-]+)\.html$/);
  if (productHtml) return res.redirect(301, '/products/' + productHtml[1]);
  next();
});

app.use('/api', require('./routes/api'));
app.use('/admin', require('./routes/admin'));
app.use('/', require('./routes/public'));

// Anything unmatched renders the 404 page.
app.use(async function (req, res, next) {
  try {
    const render404 = require('./routes/public').render404;
    await render404(req, res);
  } catch (err) {
    next(err);
  }
});

app.use(function (err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).send('Something went wrong on our side. Please try again.');
});

app.listen(PORT, function () {
  console.log('Car Spa LK running on http://localhost:' + PORT);
});
