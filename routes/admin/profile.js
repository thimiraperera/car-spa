const express = require('express');
const bcrypt = require('bcryptjs');
const { query, queryOne } = require('../../lib/db');

const router = express.Router();

const BCRYPT_COST = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mediaList() {
  return query('SELECT id, file_path, alt_text FROM media ORDER BY created_at DESC, id DESC');
}

function loadSelf(req) {
  return queryOne('SELECT * FROM admin_users WHERE id = ?', [req.session.adminId]);
}

router.get('/', async function (req, res, next) {
  try {
    const admin = await loadSelf(req);
    const media = await mediaList();
    res.render('admin/profile', {
      pageTitle: 'My profile', active: 'profile', admin, media, error: null, passwordError: null
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async function (req, res, next) {
  try {
    const id = req.session.adminId;
    const first_name = String(req.body.first_name || '').trim();
    const last_name = String(req.body.last_name || '').trim();
    const email = String(req.body.email || '').trim();
    const avatarId = parseInt(req.body.avatar_media, 10);
    const avatar_media_id = Number.isFinite(avatarId) ? avatarId : null;

    let error = null;
    if (email && !EMAIL_RE.test(email)) error = 'Enter a valid email address';
    if (!error && email) {
      const dupe = await queryOne('SELECT id FROM admin_users WHERE email = ? AND id <> ?', [email, id]);
      if (dupe) error = 'That email is already in use by another admin';
    }

    if (error) {
      const admin = await loadSelf(req);
      const media = await mediaList();
      return res.status(422).render('admin/profile', {
        pageTitle: 'My profile', active: 'profile',
        admin: Object.assign({}, admin, { first_name, last_name, email, avatar_media_id }),
        media, error, passwordError: null
      });
    }

    await query(
      'UPDATE admin_users SET first_name = ?, last_name = ?, email = ?, avatar_media_id = ? WHERE id = ?',
      [first_name || null, last_name || null, email || null, avatar_media_id, id]
    );
    res.redirect('/admin/profile?saved=1');
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      const admin = await loadSelf(req);
      const media = await mediaList();
      return res.status(422).render('admin/profile', {
        pageTitle: 'My profile', active: 'profile', admin, media,
        error: 'That email is already in use by another admin', passwordError: null
      });
    }
    next(err);
  }
});

router.post('/password', async function (req, res, next) {
  try {
    const id = req.session.adminId;
    const current = String(req.body.current_password || '');
    const newPassword = String(req.body.new_password || '');
    const confirm = String(req.body.confirm_password || '');

    const admin = await loadSelf(req);
    const ok = admin && await bcrypt.compare(current, admin.password_hash);

    let passwordError = null;
    if (!ok) passwordError = 'Current password is incorrect';
    else if (newPassword.length < 8) passwordError = 'New password must be at least 8 characters';
    else if (newPassword !== confirm) passwordError = 'New passwords do not match';

    if (passwordError) {
      const media = await mediaList();
      return res.status(422).render('admin/profile', {
        pageTitle: 'My profile', active: 'profile', admin, media, error: null, passwordError
      });
    }

    const hash = await bcrypt.hash(newPassword, BCRYPT_COST);
    await query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hash, id]);
    res.redirect('/admin/profile?saved=1');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
