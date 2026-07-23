const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const AdmZip = require('adm-zip');
const { csrfOk, MEDIA_ROOT } = require('../../lib/uploads');
const { dumpDatabase, restoreDatabase, folderSizeBytes, humanSize } = require('../../lib/backup');
const siteSettings = require('../../lib/settings');

const router = express.Router();

// Restore uploads are not images, so they get their own multer instance with
// a temp dir beside the media folder and a much larger size cap.
const TMP_DIR = path.join(MEDIA_ROOT, '..', 'tmp-restore');

const restoreUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      fs.mkdir(TMP_DIR, { recursive: true }, function (err) { cb(err, TMP_DIR); });
    },
    filename: function (req, file, cb) {
      cb(null, 'restore-' + Date.now() + path.extname(file.originalname).toLowerCase());
    }
  }),
  limits: { fileSize: 512 * 1024 * 1024 }
});

// Multer errors (mostly the size cap) become a page error instead of a crash.
function restoreFile(field) {
  return function (req, res, next) {
    restoreUpload.single(field)(req, res, function (err) {
      if (err) {
        req.uploadError = err.code === 'LIMIT_FILE_SIZE'
          ? 'That file is too large. The limit is 512 MB.'
          : 'Upload failed. Try again.';
      }
      next();
    });
  };
}

async function removeTemp(file) {
  if (file) await fs.promises.unlink(file.path).catch(function () {});
}

function stamp() {
  const d = new Date();
  return String(d.getFullYear()) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
}

async function renderPage(res, status, error) {
  const mediaSize = humanSize(await folderSizeBytes(MEDIA_ROOT));
  res.status(status).render('admin/backup/index', {
    pageTitle: 'Backup', active: 'backup', mediaSize, error: error || null
  });
}

router.get('/', async function (req, res, next) {
  try {
    await renderPage(res, 200, null);
  } catch (err) {
    next(err);
  }
});

// ---- Downloads ------------------------------------------------------------

router.get('/database', async function (req, res, next) {
  try {
    const sql = await dumpDatabase();
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename="carspa-database-' + stamp() + '.sql"');
    res.send(Buffer.from(sql, 'utf8'));
  } catch (err) {
    next(err);
  }
});

router.get('/media', function (req, res, next) {
  try {
    const zip = new AdmZip();
    zip.addLocalFolder(MEDIA_ROOT, 'media');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="carspa-media-' + stamp() + '.zip"');
    res.send(zip.toBuffer());
  } catch (err) {
    next(err);
  }
});

router.get('/full', async function (req, res, next) {
  try {
    const sql = await dumpDatabase();
    const zip = new AdmZip();
    zip.addFile('database.sql', Buffer.from(sql, 'utf8'));
    zip.addLocalFolder(MEDIA_ROOT, 'media');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="carspa-full-' + stamp() + '.zip"');
    res.send(zip.toBuffer());
  } catch (err) {
    next(err);
  }
});

// ---- Restore --------------------------------------------------------------

router.post('/database', restoreFile('database_file'), async function (req, res, next) {
  try {
    if (!csrfOk(req)) {
      await removeTemp(req.file);
      return res.status(403).send('Invalid or missing CSRF token');
    }
    if (req.uploadError) {
      await removeTemp(req.file);
      return renderPage(res, 422, req.uploadError);
    }
    if (!req.file || path.extname(req.file.originalname).toLowerCase() !== '.sql') {
      await removeTemp(req.file);
      return renderPage(res, 422, 'Choose a .sql backup file first.');
    }
    try {
      const sql = await fs.promises.readFile(req.file.path, 'utf8');
      if (!sql.trim()) return renderPage(res, 422, 'That file is empty.');
      await restoreDatabase(sql);
    } catch (err) {
      return renderPage(res, 422, 'Restore failed, the database was not fully replaced: ' + err.message);
    } finally {
      await removeTemp(req.file);
    }
    siteSettings.invalidate();
    res.redirect('/admin/backup?saved=1');
  } catch (err) {
    await removeTemp(req.file);
    next(err);
  }
});

router.post('/media', restoreFile('media_file'), async function (req, res, next) {
  try {
    if (!csrfOk(req)) {
      await removeTemp(req.file);
      return res.status(403).send('Invalid or missing CSRF token');
    }
    if (req.uploadError) {
      await removeTemp(req.file);
      return renderPage(res, 422, req.uploadError);
    }
    if (!req.file || path.extname(req.file.originalname).toLowerCase() !== '.zip') {
      await removeTemp(req.file);
      return renderPage(res, 422, 'Choose a .zip backup file first.');
    }
    try {
      const zip = new AdmZip(req.file.path);
      const entries = zip.getEntries();
      if (!entries.length) return renderPage(res, 422, 'That zip file is empty.');
      // Reject any entry that could land outside the media folder.
      for (const entry of entries) {
        const name = entry.entryName;
        const parts = name.split(/[\\/]+/);
        if (path.isAbsolute(name) || /^[a-zA-Z]:/.test(name) || parts.indexOf('..') !== -1) {
          return res.status(403).send('Rejected: the zip contains unsafe paths (' + name + ')');
        }
      }
      // Zips made by this module wrap everything in a top-level media/ folder
      // so a file-manager extraction at the site root lands right. Extract
      // those one level up; anything else goes straight into the media folder.
      const wrapped = entries.every(function (entry) {
        return /^media[\\/]/.test(entry.entryName);
      });
      zip.extractAllTo(wrapped ? path.dirname(MEDIA_ROOT) : MEDIA_ROOT, true);
    } catch (err) {
      return renderPage(res, 422, 'Restore failed: ' + err.message);
    } finally {
      await removeTemp(req.file);
    }
    res.redirect('/admin/backup?saved=1');
  } catch (err) {
    await removeTemp(req.file);
    next(err);
  }
});

module.exports = router;
