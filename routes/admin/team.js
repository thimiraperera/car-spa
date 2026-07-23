const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query, queryOne } = require('../../lib/db');
const { sendMail, buildEmailHtml } = require('../../lib/mailer');
const { BASE_URL } = require('../../lib/seo');
const { imageUpload, csrfOk, saveUploadedMedia, removeUploaded, deleteMediaIfUnused } = require('../../lib/uploads');

const router = express.Router();

// bcryptjs default cost factor; the login route only compares hashes so it
// carries no cost of its own, this just matches the library default.
const BCRYPT_COST = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function loadAdmin(id) {
  return queryOne(
    'SELECT a.*, m.file_path AS avatar_file_path FROM admin_users a ' +
    'LEFT JOIN media m ON m.id = a.avatar_media_id WHERE a.id = ?',
    [id]
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

function listAdmins() {
  return query(
    'SELECT a.id, a.username, a.first_name, a.last_name, a.email, a.created_at, ' +
    'm.file_path AS avatar_file_path FROM admin_users a ' +
    'LEFT JOIN media m ON m.id = a.avatar_media_id ORDER BY a.username'
  );
}

function readForm(body) {
  return {
    username: String(body.username || '').trim(),
    first_name: String(body.first_name || '').trim(),
    last_name: String(body.last_name || '').trim(),
    email: String(body.email || '').trim()
  };
}

// Checks the username/email against every other admin. excludeId is 0 for a
// new admin, which never matches a real id.
async function findDuplicate(username, email, excludeId) {
  const clauses = ['username = ?'];
  const params = [username];
  if (email) {
    clauses.push('email = ?');
    params.push(email);
  }
  params.push(excludeId || 0);
  return queryOne('SELECT id FROM admin_users WHERE (' + clauses.join(' OR ') + ') AND id <> ?', params);
}

async function issueResetToken(admin) {
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

// ---- List -------------------------------------------------------------

router.get('/', async function (req, res, next) {
  try {
    const admins = await listAdmins();
    res.render('admin/team/list', {
      pageTitle: 'Team', active: 'team', admins, selfId: req.session.adminId, error: null
    });
  } catch (err) {
    next(err);
  }
});

// ---- Create -------------------------------------------------------------

router.get('/new', function (req, res) {
  res.render('admin/team/form', {
    pageTitle: 'Add admin', active: 'team', item: null, error: null
  });
});

router.post('/', avatarUpload, async function (req, res, next) {
  try {
    if (!csrfOk(req)) {
      await removeUploaded(req.file);
      return res.status(403).send('Invalid or missing CSRF token');
    }
    const data = readForm(req.body);
    const password = String(req.body.password || '');

    let error = req.uploadError || null;
    if (!error) {
      if (!data.username) error = 'Username is required';
      else if (!data.email) error = 'Email is required';
      else if (!EMAIL_RE.test(data.email)) error = 'Enter a valid email address';
      else if (password.length < 8) error = 'Temporary password must be at least 8 characters';
    }

    if (!error) {
      const dupe = await findDuplicate(data.username, data.email, 0);
      if (dupe) error = 'That username or email is already in use';
    }

    if (error) {
      await removeUploaded(req.file);
      return res.status(422).render('admin/team/form', {
        pageTitle: 'Add admin', active: 'team',
        item: Object.assign({ password }, data), error
      });
    }

    const avatarId = req.file ? await saveUploadedMedia(req.file, data.username) : null;
    const hash = await bcrypt.hash(password, BCRYPT_COST);
    await query(
      'INSERT INTO admin_users (username, first_name, last_name, email, avatar_media_id, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
      [data.username, data.first_name || null, data.last_name || null, data.email, avatarId, hash]
    );
    res.redirect('/admin/team?saved=1');
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(422).render('admin/team/form', {
        pageTitle: 'Add admin', active: 'team',
        item: readForm(req.body), error: 'That username or email is already in use'
      });
    }
    next(err);
  }
});

// ---- Edit -----------------------------------------------------------------

router.get('/:id/edit', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const item = Number.isFinite(id) ? await loadAdmin(id) : null;
    if (!item) return res.status(404).send('Admin not found');
    res.render('admin/team/form', {
      pageTitle: 'Edit admin', active: 'team', item, error: null
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id', avatarUpload, async function (req, res, next) {
  try {
    if (!csrfOk(req)) {
      await removeUploaded(req.file);
      return res.status(403).send('Invalid or missing CSRF token');
    }
    const id = parseInt(req.params.id, 10);
    const existing = Number.isFinite(id) ? await loadAdmin(id) : null;
    if (!existing) {
      await removeUploaded(req.file);
      return res.status(404).send('Admin not found');
    }

    const data = readForm(req.body);
    let error = req.uploadError || null;
    if (!error) {
      if (!data.username) error = 'Username is required';
      else if (data.email && !EMAIL_RE.test(data.email)) error = 'Enter a valid email address';
    }
    if (!error) {
      const dupe = await findDuplicate(data.username, data.email, id);
      if (dupe) error = 'That username or email is already in use';
    }

    if (error) {
      await removeUploaded(req.file);
      return res.status(422).render('admin/team/form', {
        pageTitle: 'Edit admin', active: 'team',
        item: Object.assign({ id, avatar_file_path: existing.avatar_file_path }, data), error
      });
    }

    // Avatar precedence: new upload, then explicit remove, then keep.
    let avatarId = existing.avatar_media_id;
    if (req.file) avatarId = await saveUploadedMedia(req.file, data.username);
    else if (req.body.avatar_clear) avatarId = null;

    await query(
      'UPDATE admin_users SET username = ?, first_name = ?, last_name = ?, email = ?, avatar_media_id = ? WHERE id = ?',
      [data.username, data.first_name || null, data.last_name || null, data.email || null, avatarId, id]
    );
    // A replaced or removed avatar gets cleaned out of the media library when
    // nothing else references it.
    if (existing.avatar_media_id && existing.avatar_media_id !== avatarId) {
      await deleteMediaIfUnused(existing.avatar_media_id);
    }
    // Keep the sidebar greeting in sync if an admin renames their own account here.
    if (req.session.adminId === id) req.session.adminName = data.username;
    res.redirect('/admin/team/' + id + '/edit?saved=1');
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(422).render('admin/team/form', {
        pageTitle: 'Edit admin', active: 'team',
        item: Object.assign({ id: parseInt(req.params.id, 10) }, readForm(req.body)),
        error: 'That username or email is already in use'
      });
    }
    next(err);
  }
});

// ---- Set another admin's password ------------------------------------------
// No role tiers exist yet, so any signed-in admin can set any other admin's
// password directly from the edit page.

router.post('/:id/password', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const admin = Number.isFinite(id) ? await queryOne('SELECT * FROM admin_users WHERE id = ?', [id]) : null;
    if (!admin) return res.status(404).send('Admin not found');

    const password = String(req.body.new_password || '');
    const confirm = String(req.body.confirm_password || '');
    let error = null;
    if (password.length < 8) error = 'New password must be at least 8 characters';
    else if (password !== confirm) error = 'Passwords do not match';

    if (error) {
      const item = await loadAdmin(id);
      return res.status(422).render('admin/team/form', {
        pageTitle: 'Edit admin', active: 'team', item, error
      });
    }

    const hash = await bcrypt.hash(password, BCRYPT_COST);
    await query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hash, id]);
    res.redirect('/admin/team/' + id + '/edit?saved=1');
  } catch (err) {
    next(err);
  }
});

// ---- Send a password reset link --------------------------------------------

router.post('/:id/send-reset', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const admin = Number.isFinite(id) ? await queryOne('SELECT * FROM admin_users WHERE id = ?', [id]) : null;
    if (!admin) return res.status(404).send('Admin not found');

    if (!admin.email) {
      const admins = await listAdmins();
      return res.status(422).render('admin/team/list', {
        pageTitle: 'Team', active: 'team', admins, selfId: req.session.adminId,
        error: admin.username + ' has no email on file, add one first'
      });
    }

    try {
      await issueResetToken(admin);
    } catch (mailErr) {
      const admins = await listAdmins();
      return res.status(422).render('admin/team/list', {
        pageTitle: 'Team', active: 'team', admins, selfId: req.session.adminId,
        error: 'Could not send the email: ' + mailErr.message
      });
    }

    res.redirect('/admin/team?saved=1');
  } catch (err) {
    next(err);
  }
});

// ---- Delete -----------------------------------------------------------------

router.post('/:id/delete', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.redirect('/admin/team?saved=1');

    if (id === req.session.adminId) {
      const admins = await listAdmins();
      return res.status(422).render('admin/team/list', {
        pageTitle: 'Team', active: 'team', admins, selfId: req.session.adminId,
        error: 'You cannot delete your own account'
      });
    }

    const countRow = await queryOne('SELECT COUNT(*) AS n FROM admin_users');
    if (countRow.n <= 1) {
      const admins = await listAdmins();
      return res.status(422).render('admin/team/list', {
        pageTitle: 'Team', active: 'team', admins, selfId: req.session.adminId,
        error: 'At least one admin account must remain'
      });
    }

    await query('DELETE FROM admin_users WHERE id = ?', [id]);
    res.redirect('/admin/team?saved=1');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
