const express = require('express');
const bcrypt = require('bcryptjs');
const { query, queryOne } = require('../../lib/db');
const { imageUpload, csrfOk, saveUploadedMedia, removeUploaded } = require('../../lib/uploads');

const router = express.Router();

const BCRYPT_COST = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function loadSelf(req) {
  return queryOne(
    'SELECT a.*, m.file_path AS avatar_file_path FROM admin_users a ' +
    'LEFT JOIN media m ON m.id = a.avatar_media_id WHERE a.id = ?',
    [req.session.adminId]
  );
}

// Multer runs before the handler; its errors re-render as a form error.
function avatarUpload(req, res, next) {
  imageUpload.single('avatar_file')(req, res, function (err) {
    if (err) {
      req.uploadError = err.code === 'LIMIT_FILE_SIZE'
        ? 'Photo is too large. The limit is 8 MB.'
        : 'Photo upload failed. Use a jpg, png, webp, avif or gif.';
    }
    next();
  });
}

router.get('/', async function (req, res, next) {
  try {
    const admin = await loadSelf(req);
    res.render('admin/profile', {
      pageTitle: 'My profile', active: 'profile', admin, error: null, passwordError: null
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', avatarUpload, async function (req, res, next) {
  try {
    if (!csrfOk(req)) {
      await removeUploaded(req.file);
      return res.status(403).send('Invalid or missing CSRF token');
    }
    const id = req.session.adminId;
    const first_name = String(req.body.first_name || '').trim();
    const last_name = String(req.body.last_name || '').trim();
    const nickname = String(req.body.nickname || '').trim();
    const email = String(req.body.email || '').trim();
    const admin = await loadSelf(req);

    let error = req.uploadError || null;
    if (!error && email && !EMAIL_RE.test(email)) error = 'Enter a valid email address';
    if (!error && email) {
      const dupe = await queryOne('SELECT id FROM admin_users WHERE email = ? AND id <> ?', [email, id]);
      if (dupe) error = 'That email is already in use by another admin';
    }

    if (error) {
      await removeUploaded(req.file);
      return res.status(422).render('admin/profile', {
        pageTitle: 'My profile', active: 'profile',
        admin: Object.assign({}, admin, { first_name, last_name, nickname, email }),
        error, passwordError: null
      });
    }

    let avatar_media_id = admin.avatar_media_id;
    if (req.file) {
      avatar_media_id = await saveUploadedMedia(req.file, nickname || admin.username);
    } else if (req.body.avatar_clear) {
      avatar_media_id = null;
    }

    await query(
      'UPDATE admin_users SET first_name = ?, last_name = ?, nickname = ?, email = ?, avatar_media_id = ? WHERE id = ?',
      [first_name || null, last_name || null, nickname || null, email || null, avatar_media_id, id]
    );
    res.redirect('/admin/profile?saved=1');
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      const admin = await loadSelf(req);
      return res.status(422).render('admin/profile', {
        pageTitle: 'My profile', active: 'profile', admin,
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
      return res.status(422).render('admin/profile', {
        pageTitle: 'My profile', active: 'profile', admin, error: null, passwordError
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
