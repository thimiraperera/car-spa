const { query } = require('./db');

// Site settings, phones, socials and hours change rarely; cache them and
// invalidate whenever the admin saves.
let cache = null;

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
  cache = { settings, phones, socials, hours, hourNotes, hoursDisplay: buildHoursDisplay(hours) };
  return cache;
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
