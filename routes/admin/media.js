const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { query, queryOne } = require('../../lib/db');

const router = express.Router();

const MEDIA_ROOT = path.join(__dirname, '..', '..', 'media');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

function slugifyBase(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'file';
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(MEDIA_ROOT, 'uploads', String(new Date().getFullYear()));
    fs.mkdir(dir, { recursive: true }, function (err) { cb(err, dir); });
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = slugifyBase(path.basename(file.originalname, ext));
    cb(null, base + '-' + Date.now() + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    cb(null, ALLOWED_TYPES.indexOf(file.mimetype) !== -1);
  }
});

router.get('/', async function (req, res, next) {
  try {
    const items = await query('SELECT * FROM media ORDER BY created_at DESC, id DESC');
    res.render('admin/media/index', {
      pageTitle: 'Media',
      active: 'media',
      items: items,
      err: req.query.err || null
    });
  } catch (err) {
    next(err);
  }
});

// Multipart body, so multer runs first and the CSRF token is checked by hand
// afterwards. The global CSRF gate in routes/admin/index.js skips this POST.
router.post('/', function (req, res, next) {
  upload.single('file')(req, res, async function (err) {
    try {
      if (err) return res.redirect('/admin/media?err=upload');
      const tokenOk = req.session && req.session.csrf &&
        req.body && req.body._csrf === req.session.csrf;
      if (!tokenOk) {
        if (req.file) await fs.promises.unlink(req.file.path).catch(function () {});
        return res.status(403).send('Invalid or missing CSRF token');
      }
      if (!req.file) return res.redirect('/admin/media?err=upload');

      const relPath = path.relative(MEDIA_ROOT, req.file.path).split(path.sep).join('/');
      const altText = String(req.body.alt_text || '').trim().slice(0, 255);
      await query(
        'INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES (?, ?, ?, ?)',
        [relPath, altText, req.file.mimetype, req.file.size]
      );
      res.redirect('/admin/media?saved=1');
    } catch (e) {
      next(e);
    }
  });
});

router.post('/:id/alt', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.redirect('/admin/media');
    const altText = String(req.body.alt_text || '').trim().slice(0, 255);
    await query('UPDATE media SET alt_text = ? WHERE id = ?', [altText, id]);
    res.redirect('/admin/media?saved=1');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/delete', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.redirect('/admin/media');
    const row = await queryOne('SELECT * FROM media WHERE id = ?', [id]);
    if (!row) return res.redirect('/admin/media');

    const used = await queryOne('SELECT COUNT(*) AS n FROM product_images WHERE media_id = ?', [id]);
    if (used && used.n > 0) return res.redirect('/admin/media?err=used');

    await query('DELETE FROM media WHERE id = ?', [id]);
    try {
      await fs.promises.unlink(path.join(MEDIA_ROOT, row.file_path));
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    res.redirect('/admin/media?saved=1');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
