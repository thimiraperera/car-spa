const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { query, queryOne } = require('./db');

// Shared image upload handling for every admin form that accepts files
// (products, testimonials, branding, profile avatar). Files land in
// media/uploads/<year>/ and get a media library row, exactly like the old
// media-page upload did.

const MEDIA_ROOT = path.join(__dirname, '..', 'media');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'];

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

const imageUpload = multer({
  storage: storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ALLOWED_TYPES.indexOf(file.mimetype) !== -1 && ALLOWED_EXTS.indexOf(ext) !== -1);
  }
});

// Multipart bodies bypass the global CSRF gate (multer has to parse them
// first), so every multipart handler must call this right after multer ran.
function csrfOk(req) {
  return !!(req.session && req.session.csrf && req.body && req.body._csrf === req.session.csrf);
}

async function removeUploaded(file) {
  if (file) await fs.promises.unlink(file.path).catch(function () {});
}

// Registers an uploaded file in the media library, returns the new media id.
async function saveUploadedMedia(file, altText) {
  const relPath = path.relative(MEDIA_ROOT, file.path).split(path.sep).join('/');
  const alt = String(altText || '').trim().slice(0, 255);
  await query(
    'INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES (?, ?, ?, ?)',
    [relPath, alt, file.mimetype, file.size]
  );
  const row = await queryOne('SELECT id FROM media WHERE file_path = ?', [relPath]);
  return row.id;
}

module.exports = { imageUpload, csrfOk, saveUploadedMedia, removeUploaded, MEDIA_ROOT };
