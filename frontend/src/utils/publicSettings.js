const asString = (value, fallback = '') => (
  typeof value === 'string' && value.trim() ? value.trim() : fallback
);

const asBoolean = (value, fallback) => typeof value === 'boolean' ? value : fallback;

const safeHttpUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
};

const safeFooterHref = (value) => {
  if (typeof value !== 'string') return '';
  const href = value.trim();
  if (href.startsWith('/') && !href.startsWith('//')) return href;
  return safeHttpUrl(href);
};

const pickAssetUrl = (value, fallback) => (
  safeHttpUrl(typeof value === 'string' ? value : value?.url) || fallback
);

const normalizeAddress = (address) => ({
  label: asString(address?.label),
  line1: asString(address?.line1),
  line2: asString(address?.line2),
  city: asString(address?.city),
  state: asString(address?.state),
  zip: asString(address?.zip),
  country: asString(address?.country, 'US'),
  mapUrl: safeHttpUrl(address?.mapUrl),
  isPrimary: address?.isPrimary === true,
});

const SOCIAL_KEYS = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'dribbble', 'behance'];

export const DEFAULT_PUBLIC_SETTINGS = {
  site: {
    name: 'MetlifeDM',
    legalName: 'MetlifeDM LLC',
    tagline: 'Digital marketing excellence for USA businesses',
    description: 'A US-based digital marketing agency helping businesses grow through SEO, paid media, content, and web development.',
    logo: '/metlifedm-logo.png',
    ogImage: '/og/default.jpg',
  },
  contact: {
    email: 'metlifedm4u@gmail.com',
    supportEmail: 'metlifedm4u@gmail.com',
    salesEmail: 'metlifedm4u@gmail.com',
    phone: '',
    whatsapp: '',
    officeHours: 'Mon–Fri · 9am–6pm EST',
    addresses: [{ line1: '#571', city: 'Nassau', state: 'DE', zip: '19969', country: 'US', isPrimary: true }],
  },
  social: {
    twitter: 'https://x.com/MetlifeDM_LLC',
    linkedin: 'https://linkedin.com/company/metlifedm-llc-digital-marketing',
    instagram: 'https://www.instagram.com/metlifedm.llc/',
    facebook: 'https://www.facebook.com/profile.php?id=61591351247538',
  },
  business: { registeredName: 'MetlifeDM LLC', established: 2024 },
  analytics: { ga4Id: '', gtmId: '', metaPixelId: '' },
  seo: {
    defaultMetaTitle: 'MetlifeDM · Digital marketing for USA businesses',
    defaultMetaDescription: 'Digital marketing services spanning SEO, paid media, content, and web development for growing USA businesses.',
    defaultKeywords: ['digital marketing', 'SEO agency', 'PPC', 'content marketing', 'USA'],
    defaultOgImage: '/og/default.jpg',
    twitterHandle: '@metlifedm',
    organizationSchema: null,
  },
  footer: {
    about: 'A US-based digital marketing agency helping businesses grow through SEO, paid media, content, and web development.',
    copyright: '',
    newsletterTitle: 'Growth playbooks',
    newsletterSubtitle: 'when we publish.',
    columns: [],
  },
  features: {
    chatbotEnabled: true,
    newsletterEnabled: true,
    consultationEnabled: true,
    blogCommentsEnabled: true,
    maintenanceMode: false,
    maintenanceMessage: '',
  },
};

export const normalizePublicSettings = (raw = {}, env = {}) => {
  const fallback = DEFAULT_PUBLIC_SETTINGS;
  const addresses = Array.isArray(raw.contact?.addresses)
    ? raw.contact.addresses.map(normalizeAddress).filter((address) => address.city || address.line1)
    : fallback.contact.addresses;
  const social = { ...fallback.social };
  SOCIAL_KEYS.forEach((key) => {
    const url = safeHttpUrl(raw.social?.[key]);
    if (url) social[key] = url;
  });
  const columns = Array.isArray(raw.footer?.columns)
    ? raw.footer.columns
      .map((column) => ({
        title: asString(column?.title),
        links: Array.isArray(column?.links)
          ? column.links
            .map((link) => ({ label: asString(link?.label), href: safeFooterHref(link?.url || link?.href) }))
            .filter((link) => link.label && link.href)
          : [],
      }))
      .filter((column) => column.title && column.links.length)
    : [];

  const rawGaId = asString(raw.analytics?.ga4Id, asString(env.ga4Id));
  const rawGtmId = asString(raw.analytics?.gtmId, asString(env.gtmId));
  const rawMetaId = asString(raw.analytics?.metaPixelId, asString(env.metaPixelId));

  return {
    site: {
      name: asString(raw.site?.name, fallback.site.name),
      legalName: asString(raw.business?.registeredName, fallback.site.legalName),
      tagline: asString(raw.site?.tagline, fallback.site.tagline),
      description: asString(raw.site?.description, fallback.site.description),
      logo: pickAssetUrl(raw.site?.logo, fallback.site.logo),
      ogImage: pickAssetUrl(raw.site?.ogImage, fallback.site.ogImage),
    },
    contact: {
      email: asString(raw.contact?.email, fallback.contact.email),
      supportEmail: asString(raw.contact?.supportEmail, raw.contact?.email || fallback.contact.supportEmail),
      salesEmail: asString(raw.contact?.salesEmail, raw.contact?.email || fallback.contact.salesEmail),
      phone: asString(raw.contact?.phone),
      whatsapp: asString(raw.contact?.whatsapp),
      officeHours: asString(raw.contact?.officeHours, fallback.contact.officeHours),
      addresses: addresses.length ? addresses : fallback.contact.addresses,
    },
    social,
    business: {
      registeredName: asString(raw.business?.registeredName, fallback.business.registeredName),
      established: Number.isInteger(raw.business?.established) ? raw.business.established : fallback.business.established,
    },
    analytics: {
      ga4Id: /^G-[A-Z0-9]+$/i.test(rawGaId) ? rawGaId : '',
      gtmId: /^GTM-[A-Z0-9]+$/i.test(rawGtmId) ? rawGtmId : '',
      metaPixelId: /^\d{5,30}$/.test(rawMetaId) ? rawMetaId : '',
    },
    seo: {
      defaultMetaTitle: asString(raw.seo?.defaultMetaTitle, fallback.seo.defaultMetaTitle),
      defaultMetaDescription: asString(raw.seo?.defaultMetaDescription, fallback.seo.defaultMetaDescription),
      defaultKeywords: Array.isArray(raw.seo?.defaultKeywords)
        ? raw.seo.defaultKeywords.filter((keyword) => typeof keyword === 'string' && keyword.trim()).map((keyword) => keyword.trim())
        : fallback.seo.defaultKeywords,
      defaultOgImage: pickAssetUrl(raw.seo?.defaultOgImage, pickAssetUrl(raw.site?.ogImage, fallback.seo.defaultOgImage)),
      twitterHandle: asString(raw.seo?.twitterHandle, fallback.seo.twitterHandle),
      organizationSchema: raw.seo?.organizationSchema && typeof raw.seo.organizationSchema === 'object'
        ? raw.seo.organizationSchema
        : null,
    },
    footer: {
      about: asString(raw.footer?.about, raw.site?.description || fallback.footer.about),
      copyright: asString(raw.footer?.copyright),
      newsletterTitle: asString(raw.footer?.newsletterTitle, fallback.footer.newsletterTitle),
      newsletterSubtitle: asString(raw.footer?.newsletterSubtitle, fallback.footer.newsletterSubtitle),
      columns,
    },
    features: {
      chatbotEnabled: asBoolean(raw.features?.chatbotEnabled, fallback.features.chatbotEnabled),
      newsletterEnabled: asBoolean(raw.features?.newsletterEnabled, fallback.features.newsletterEnabled),
      consultationEnabled: asBoolean(raw.features?.consultationEnabled, fallback.features.consultationEnabled),
      blogCommentsEnabled: asBoolean(raw.features?.blogCommentsEnabled, fallback.features.blogCommentsEnabled),
      maintenanceMode: asBoolean(raw.features?.maintenanceMode, fallback.features.maintenanceMode),
      maintenanceMessage: asString(raw.features?.maintenanceMessage),
    },
  };
};

export const formatAddress = (address) => [
  address?.line1,
  address?.line2,
  [address?.city, address?.state, address?.zip].filter(Boolean).join(' '),
  address?.country && address.country !== 'US' ? address.country : null,
].filter(Boolean).join(', ');
