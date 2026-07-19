const { queryOne } = require('./db');

const BASE_URL = (process.env.BASE_URL || 'https://carspa.lk').replace(/\/$/, '');

// Every rendered page gets a meta object with the same shape so the head
// partial stays dumb. Falls back to sensible values when a field is empty.
function resolveMeta(seoRow, fallbacks) {
  const row = seoRow || {};
  const title = row.seo_title || fallbacks.title;
  const description = row.meta_description || fallbacks.description || '';
  const canonical = row.canonical_url || (BASE_URL + fallbacks.path);
  return {
    title: title,
    description: description,
    canonical: canonical,
    socialTitle: row.social_title || title,
    socialDescription: row.social_description || description,
    xTitle: row.x_title || row.social_title || title,
    xDescription: row.x_description || row.social_description || description,
    image: fallbacks.image || null,
    robots: fallbacks.robots || null
  };
}

async function pageMeta(pageKey, fallbacks) {
  const row = await queryOne('SELECT * FROM page_seo WHERE page_key = ?', [pageKey]);
  return resolveMeta(row, fallbacks);
}

async function productMeta(productId, fallbacks) {
  const row = await queryOne('SELECT * FROM product_seo WHERE product_id = ?', [productId]);
  return resolveMeta(row, fallbacks);
}

module.exports = { BASE_URL, resolveMeta, pageMeta, productMeta };
