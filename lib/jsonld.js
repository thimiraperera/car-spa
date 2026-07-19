const { BASE_URL } = require('./seo');

// JSON-LD builders. Everything is generated from database content, never
// hand-authored per page.

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function productSchema(product, images, meta) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url: BASE_URL + '/products/' + product.slug,
    description: meta.description || product.short_description || '',
    sku: product.sku || product.slug,
    brand: { '@type': 'Brand', name: 'Arkos Vetek' },
    offers: {
      '@type': 'Offer',
      url: BASE_URL + '/products/' + product.slug,
      priceCurrency: 'LKR',
      price: String(product.price_lkr),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition'
    }
  };
  if (images && images.length) {
    schema.image = images.map(function (img) { return BASE_URL + '/media/' + img.file_path; });
  }
  return schema;
}

function faqSchema(faqs) {
  if (!faqs || !faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(function (faq) {
      return {
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer }
      };
    })
  };
}

function localBusinessSchema(site) {
  const settings = site.settings;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: settings.brand_name || 'Car Spa LK',
    url: BASE_URL,
    email: settings.email || undefined,
    address: settings.address ? {
      '@type': 'PostalAddress',
      streetAddress: settings.address,
      addressCountry: 'LK'
    } : undefined
  };
  const phones = site.phones.filter(function (p) { return p.type !== 'whatsapp'; });
  if (phones.length) schema.telephone = phones[0].number;
  const sameAs = site.socials.map(function (s) { return s.url; });
  if (sameAs.length) schema.sameAs = sameAs;
  const spec = site.hours
    .filter(function (h) { return !h.is_closed && h.open_time && h.close_time; })
    .map(function (h) {
      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'https://schema.org/' + DAY_NAMES[h.day_of_week],
        opens: String(h.open_time).slice(0, 5),
        closes: String(h.close_time).slice(0, 5)
      };
    });
  if (spec.length) schema.openingHoursSpecification = spec;
  Object.keys(schema).forEach(function (key) {
    if (schema[key] === undefined) delete schema[key];
  });
  return schema;
}

module.exports = { productSchema, faqSchema, localBusinessSchema };
