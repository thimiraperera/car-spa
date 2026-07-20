const nodemailer = require('nodemailer');
const { queryOne } = require('./db');
const { BASE_URL } = require('./seo');
const settings = require('./settings');

// Reads the smtp_settings singleton row fresh on every call so a saved
// change takes effect immediately, no cache to invalidate.
async function loadRow() {
  return queryOne('SELECT * FROM smtp_settings WHERE id = 1');
}

function buildTransporter(row) {
  const config = {
    host: row.host,
    port: row.port || undefined,
    secure: row.encryption === 'ssl'
  };
  if (row.encryption === 'tls') config.requireTLS = true;
  if (row.username) config.auth = { user: row.username, pass: row.password || '' };
  return nodemailer.createTransport(config);
}

function formatFrom(row) {
  const name = row.from_name || '';
  const email = row.from_email || row.username || '';
  if (name && email) return name + ' <' + email + '>';
  return email || name || 'Car Spa LK';
}

async function sendMail({ to, subject, html, text }) {
  const row = await loadRow();
  if (!row || !row.host) throw new Error('SMTP is not configured yet');
  const transporter = buildTransporter(row);
  return transporter.sendMail({ from: formatFrom(row), to, subject, html, text });
}

// Wraps bodyHtml in a simple, email-safe HTML shell for transactional mail.
// Used by SMTP test sends today, and by the upcoming password reset flow,
// so the signature stays deliberately small and stable.
async function buildEmailHtml({ title, bodyHtml }) {
  const site = await settings.load();
  const logo = site.logos.mailHeaderLogo;
  const header = logo
    ? '<img src="' + BASE_URL + '/media/' + logo.file_path + '" alt="' + (logo.alt_text || 'Car Spa LK') +
      '" style="max-height:44px;display:block;margin:0 auto;">'
    : '<div style="font-family:Arial,sans-serif;font-weight:800;font-size:22px;color:#1c1f23;text-align:center;">' +
      'Car Spa<span style="color:#e0332b;">.LK</span></div>';
  const titleHtml = title
    ? '<h1 style="margin:0 0 12px;font-size:19px;color:#1c1f23;font-family:Arial,sans-serif;">' + title + '</h1>'
    : '';
  return (
    '<!doctype html>' +
    '<html><body style="margin:0;padding:24px;background:#f4f2ee;font-family:Arial,sans-serif;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">' +
    '<table role="presentation" width="480" style="max-width:480px;width:100%;background:#ffffff;' +
    'border-radius:14px;border:1px solid #e5e2dc;" cellpadding="0" cellspacing="0"><tr><td style="padding:28px 30px;">' +
    '<div style="margin-bottom:20px;">' + header + '</div>' +
    titleHtml +
    '<div style="color:#26292e;font-size:14px;line-height:1.6;">' + bodyHtml + '</div>' +
    '</td></tr></table>' +
    '</td></tr></table>' +
    '</body></html>'
  );
}

module.exports = { sendMail, buildEmailHtml };
