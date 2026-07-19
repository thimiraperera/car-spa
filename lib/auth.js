const crypto = require('crypto');

// Session-backed admin auth plus a per-session CSRF token checked on every
// state-changing admin request.

function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  if (req.method !== 'GET') return res.status(401).json({ error: 'Not signed in' });
  return res.redirect('/admin/login');
}

function csrfToken(req) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  return req.session.csrf;
}

function verifyCsrf(req, res, next) {
  const sent = (req.body && req.body._csrf) || req.get('x-csrf-token');
  if (req.session && req.session.csrf && sent === req.session.csrf) return next();
  return res.status(403).send('Invalid or missing CSRF token');
}

module.exports = { requireAdmin, csrfToken, verifyCsrf };
