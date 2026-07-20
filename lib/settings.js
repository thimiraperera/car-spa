const { query } = require('./db');

// Site settings, phones, socials and hours change rarely; cache them and
// invalidate whenever the admin saves.
let cache = null;

const LOGO_KEYS = {
  site_logo_media_id: 'siteLogo',
  mail_header_logo_media_id: 'mailHeaderLogo',
  dark_mode_logo_media_id: 'darkModeLogo',
  light_mode_logo_media_id: 'lightModeLogo'
};

async function load() {
  if (cache) return cache;
  const [settingsRows, phones, socials, hours, hourNotes] = await Promise.all([
    query('SELECT setting_key, setting_value FROM site_settings'),
    query('SELECT * FROM phone_numbers WHERE is_active = 1 ORDER BY sort_order, id'),
    query('SELECT * FROM social_links WHERE is_active = 1 ORDER BY sort_order, id'),
    query('SELECT * FROM opening_hours ORDER BY day_of_week'),
    query('SELECT * FROM opening_hours_notes WHERE is_active = 1 ORDER BY sort_order, id')
  ]);
  const settings = {};
  settingsRows.forEach(function (row) { settings[row.setting_key] = row.setting_value; });
  const logos = await resolveLogos(settings);
  cache = { settings, phones, socials, hours, hourNotes, hoursDisplay: buildHoursDisplay(hours), logos };
  return cache;
}

// Resolves the 4 logo site_settings (stored as media ids) to media rows, so
// views/emails can render an <img> when the admin has uploaded one and fall
// back to the existing hand-drawn wordmark otherwise.
async function resolveLogos(settings) {
  const ids = Object.keys(LOGO_KEYS)
    .map(function (key) { return parseInt(settings[key], 10); })
    .filter(function (id) { return Number.isFinite(id); });
  const logos = { siteLogo: null, mailHeaderLogo: null, darkModeLogo: null, lightModeLogo: null };
  if (!ids.length) return logos;
  const rows = await query('SELECT id, file_path, alt_text FROM media WHERE id IN (?)', [ids]);
  const byId = {};
  rows.forEach(function (row) { byId[row.id] = row; });
  Object.keys(LOGO_KEYS).forEach(function (settingKey) {
    const id = parseInt(settings[settingKey], 10);
    if (Number.isFinite(id) && byId[id]) logos[LOGO_KEYS[settingKey]] = byId[id];
  });
  return logos;
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function fmtTime(t) {
  if (!t) return '';
  const parts = String(t).split(':');
  return String(parseInt(parts[0], 10)) + ':' + parts[1];
}

// Collapse consecutive days with identical hours into ranges for compact
// display, e.g. Monday - Friday: 9:00 - 18:00.
function buildHoursDisplay(hours) {
  const rows = [];
  for (let d = 0; d < 7; d++) {
    const row = hours.find(function (h) { return h.day_of_week === d; });
    const value = (!row || row.is_closed || !row.open_time || !row.close_time)
      ? 'Closed'
      : fmtTime(row.open_time) + ' - ' + fmtTime(row.close_time);
    rows.push({ day: DAY_NAMES[d], value });
  }
  const groups = [];
  rows.forEach(function (r) {
    const last = groups[groups.length - 1];
    if (last && last.value === r.value) last.endDay = r.day;
    else groups.push({ startDay: r.day, endDay: r.day, value: r.value });
  });
  return groups.map(function (g) {
    return {
      label: g.startDay === g.endDay ? g.startDay : g.startDay + ' - ' + g.endDay,
      value: g.value
    };
  });
}

function invalidate() {
  cache = null;
}

function get(settings, key, fallback) {
  const value = settings[key];
  return value === undefined || value === null || value === '' ? fallback : value;
}

function intSetting(settings, key, fallback) {
  const n = parseInt(settings[key], 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

module.exports = { load, invalidate, get, intSetting };
