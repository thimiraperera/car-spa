const express = require('express');
const { queryOne, query } = require('../../lib/db');
const { sendMail, buildEmailHtml } = require('../../lib/mailer');

const router = express.Router();

const ENCRYPTIONS = ['none', 'ssl', 'tls'];

function loadSettings() {
  return queryOne('SELECT * FROM smtp_settings WHERE id = 1');
}

router.get('/', async function (req, res, next) {
  try {
    const settings = await loadSettings();
    res.render('admin/smtp/index', {
      pageTitle: 'SMTP settings', active: 'smtp',
      settings: settings || {}, encryptions: ENCRYPTIONS,
      error: null, sent: req.query.sent === '1'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async function (req, res, next) {
  try {
    const body = req.body || {};
    const host = String(body.host || '').trim();
    const portNum = parseInt(body.port, 10);
    const port = Number.isFinite(portNum) ? portNum : null;
    const username = String(body.username || '').trim();
    const encryption = ENCRYPTIONS.indexOf(body.encryption) !== -1 ? body.encryption : 'tls';
    const fromEmail = String(body.from_email || '').trim();
    const fromName = String(body.from_name || '').trim();
    const password = String(body.password || '');

    if (password) {
      await query(
        'UPDATE smtp_settings SET host = ?, port = ?, username = ?, password = ?, encryption = ?, from_email = ?, from_name = ? WHERE id = 1',
        [host, port, username, password, encryption, fromEmail, fromName]
      );
    } else {
      await query(
        'UPDATE smtp_settings SET host = ?, port = ?, username = ?, encryption = ?, from_email = ?, from_name = ? WHERE id = 1',
        [host, port, username, encryption, fromEmail, fromName]
      );
    }
    res.redirect('/admin/smtp?saved=1');
  } catch (err) {
    next(err);
  }
});

router.post('/test', async function (req, res, next) {
  try {
    const to = String((req.body && req.body.to) || '').trim();
    if (!to) throw new Error('Enter an email address to send the test to.');
    const html = await buildEmailHtml({
      title: 'SMTP test',
      bodyHtml: '<p>This is a test email from the Car Spa LK admin panel. If you are reading this, SMTP is working.</p>'
    });
    await sendMail({
      to, subject: 'Car Spa LK SMTP test', html,
      text: 'This is a test email from the Car Spa LK admin panel. If you are reading this, SMTP is working.'
    });
    res.redirect('/admin/smtp?saved=1&sent=1');
  } catch (err) {
    try {
      const settings = await loadSettings();
      res.status(422).render('admin/smtp/index', {
        pageTitle: 'SMTP settings', active: 'smtp',
        settings: settings || {}, encryptions: ENCRYPTIONS,
        error: err.message, sent: false
      });
    } catch (renderErr) {
      next(renderErr);
    }
  }
});

module.exports = router;
