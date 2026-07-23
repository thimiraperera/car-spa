const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { query, queryOne } = require('./db');
const siteSettings = require('./settings');

// sharp ships a native binary; if it ever fails to load on a host we keep
// accepting uploads and just skip compression.
let sharp = null;
try {
  sharp = require('sharp');
} catch (err) {
  console.warn('uploads: sharp unavailable, images are stored unprocessed (' + err.message + ')');
}

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

// Mimetypes we convert to webp on upload. Gif stays untouched so animations
// keep playing.
const COMPRESSIBLE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

async function maxImageDimension() {
  const { settings } = await siteSettings.load();
  const limit = siteSettings.intSetting(settings, 'image_max_dimension', 1024);
  return Math.min(4096, Math.max(256, limit));
}

// Resizes and converts an upload to webp in place (same directory, same base
// name, .webp extension). Returns { path, mimetype, size } for the file the
// media row should point at. Any failure falls back to the original file so a
// corrupt image never breaks the upload.
async function compressUploadedImage(file) {
  if (!sharp || COMPRESSIBLE_TYPES.indexOf(file.mimetype) === -1) return file;
  const ext = path.extname(file.path);
  const outPath = path.join(path.dirname(file.path), path.basename(file.path, ext) + '.webp');
  const tmpPath = outPath + '.tmp';
  try {
    const limit = await maxImageDimension();
    await sharp(file.path)
      .rotate()
      .resize({ width: limit, height: limit, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(tmpPath);
    const stat = await fs.promises.stat(tmpPath);
    if (outPath !== file.path) await fs.promises.unlink(file.path).catch(function () {});
    await fs.promises.rename(tmpPath, outPath);
    return { path: outPath, mimetype: 'image/webp', size: stat.size };
  } catch (err) {
    await fs.promises.unlink(tmpPath).catch(function () {});
    console.warn('uploads: image compression failed for ' + file.path + ', storing original (' + err.message + ')');
    return file;
  }
}

// Registers an uploaded file in the media library, returns the new media id.
async function saveUploadedMedia(file, altText) {
  const stored = await compressUploadedImage(file);
  const relPath = path.relative(MEDIA_ROOT, stored.path).split(path.sep).join('/');
  const alt = String(altText || '').trim().slice(0, 255);
  await query(
    'INSERT INTO media (file_path, alt_text, mime_type, file_size) VALUES (?, ?, ?, ?)',
    [relPath, alt, stored.mimetype, stored.size]
  );
  const row = await queryOne('SELECT id FROM media WHERE file_path = ?', [relPath]);
  return row.id;
}

// Deletes a media row and its file from disk, but only when nothing points at
// it anymore. Call it after the DB update that dropped the reference has
// committed, so the caller's own row no longer counts as a reference.
async function deleteMediaIfUnused(mediaId) {
  if (!mediaId) return;
  const media = await queryOne('SELECT id, file_path FROM media WHERE id = ?', [mediaId]);
  if (!media) return;

  const refs = await Promise.all([
    queryOne('SELECT id FROM admin_users WHERE avatar_media_id = ? LIMIT 1', [mediaId]),
    queryOne('SELECT id FROM testimonials WHERE image_media_id = ? LIMIT 1', [mediaId]),
    queryOne('SELECT id FROM product_images WHERE media_id = ? LIMIT 1', [mediaId]),
    queryOne(
      'SELECT setting_key FROM site_settings WHERE setting_key IN (?, ?, ?, ?) AND setting_value = ? LIMIT 1',
      ['site_logo_media_id', 'mail_header_logo_media_id', 'dark_mode_logo_media_id', 'light_mode_logo_media_id', String(mediaId)]
    )
  ]);
  if (refs.some(Boolean)) return;

  await query('DELETE FROM media WHERE id = ?', [mediaId]);
  await fs.promises.unlink(path.join(MEDIA_ROOT, media.file_path)).catch(function (err) {
    if (err.code !== 'ENOENT') throw err;
  });
}

module.exports = { imageUpload, csrfOk, saveUploadedMedia, removeUploaded, deleteMediaIfUnused, MEDIA_ROOT };
