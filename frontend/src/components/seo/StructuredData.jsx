import { Helmet } from 'react-helmet-async';

/**
 * <StructuredData />
 *
 * Emits schema.org JSON-LD. Pick a type from BUILDERS below or pass raw JSON
 * via the `custom` prop. Multiple <StructuredData /> instances stack — Google
 * will read all of them in the same page.
 *
 * Common patterns:
 *
 *   // Once, in the root layout
 *   <StructuredData type="Organization" data={{...}} />
 *   <StructuredData type="WebSite" data={{ searchAction: true }} />
 *
 *   // On a blog post page
 *   <StructuredData type="Article" data={{ headline, image, ... }} />
 *   <StructuredData type="BreadcrumbList" data={{ items: [...] }} />
 *
 *   // On a service page
 *   <StructuredData type="Product" data={{ name, offers: [...] }} />
 *
 *   // On the contact page
 *   <StructuredData type="LocalBusiness" data={{...}} />
 *
 *   // FAQ page
 *   <StructuredData type="FAQPage" data={{ questions: [{ q, a }] }} />
 */

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://metlifedm.com';

const BUILDERS = {
  Organization: (d) => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: d.name || 'MetlifeDM LLC',
    url: d.url || SITE_URL,
    logo: d.logo || `${SITE_URL}/logo.png`,
    ...(d.description && { description: d.description }),
    ...(d.foundingDate && { foundingDate: d.foundingDate }),
    ...(d.contactPoint && {
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: d.contactPoint.telephone,
        email: d.contactPoint.email,
        contactType: d.contactPoint.type || 'customer service',
        areaServed: d.contactPoint.areaServed || 'US',
        availableLanguage: d.contactPoint.availableLanguage || 'English',
      },
    }),
    ...(d.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: d.address.streetAddress,
        addressLocality: d.address.city,
        addressRegion: d.address.state,
        postalCode: d.address.postalCode,
        addressCountry: d.address.country || 'US',
      },
    }),
    ...(Array.isArray(d.sameAs) && { sameAs: d.sameAs }),
  }),

  LocalBusiness: (d) => ({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: d.name || 'MetlifeDM LLC',
    image: d.image || `${SITE_URL}/logo.png`,
    url: d.url || SITE_URL,
    telephone: d.telephone,
    priceRange: d.priceRange || '$$',
    ...(d.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: d.address.streetAddress,
        addressLocality: d.address.city,
        addressRegion: d.address.state,
        postalCode: d.address.postalCode,
        addressCountry: d.address.country || 'US',
      },
    }),
    ...(d.geo && {
      geo: { '@type': 'GeoCoordinates', latitude: d.geo.lat, longitude: d.geo.lng },
    }),
    ...(d.openingHours && { openingHoursSpecification: d.openingHours }),
  }),

  WebSite: (d) => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: d.name || 'MetlifeDM',
    url: d.url || SITE_URL,
    ...(d.searchAction && {
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${d.url || SITE_URL}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    }),
  }),

  Article: (d) => ({
    '@context': 'https://schema.org',
    '@type': d.type || 'Article',
    headline: d.headline,
    ...(d.description && { description: d.description }),
    image: Array.isArray(d.image) ? d.image : [d.image].filter(Boolean),
    datePublished: d.datePublished,
    ...(d.dateModified && { dateModified: d.dateModified }),
    author: {
      '@type': 'Person',
      name: d.author?.name || 'MetlifeDM Team',
      ...(d.author?.url && { url: d.author.url }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'MetlifeDM',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    ...(d.mainEntityOfPage && {
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': d.mainEntityOfPage,
      },
    }),
    ...(d.wordCount && { wordCount: d.wordCount }),
    ...(Array.isArray(d.keywords) && { keywords: d.keywords.join(', ') }),
  }),

  Product: (d) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: d.name,
    ...(d.description && { description: d.description }),
    ...(d.image && { image: Array.isArray(d.image) ? d.image : [d.image] }),
    ...(d.brand && {
      brand: { '@type': 'Brand', name: d.brand },
    }),
    ...(d.sku && { sku: d.sku }),
    ...(Array.isArray(d.offers) && {
      offers: d.offers.map((o) => ({
        '@type': 'Offer',
        price: o.price,
        priceCurrency: o.priceCurrency || 'USD',
        availability: o.availability || 'https://schema.org/InStock',
        ...(o.url && { url: o.url }),
      })),
    }),
    ...(d.aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: d.aggregateRating.value,
        reviewCount: d.aggregateRating.count,
      },
    }),
  }),

  Service: (d) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: d.name,
    ...(d.description && { description: d.description }),
    ...(d.image && { image: d.image }),
    provider: {
      '@type': 'Organization',
      name: 'MetlifeDM',
      url: SITE_URL,
    },
    ...(d.serviceType && { serviceType: d.serviceType }),
    ...(d.areaServed && { areaServed: d.areaServed }),
    ...(Array.isArray(d.offers) && {
      offers: d.offers.map((o) => ({
        '@type': 'Offer',
        price: o.price,
        priceCurrency: o.priceCurrency || 'USD',
      })),
    }),
  }),

  BreadcrumbList: (d) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: (d.items || []).map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url?.startsWith('http') ? item.url : `${SITE_URL}${item.url || ''}`,
    })),
  }),

  FAQPage: (d) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (d.questions || []).map((q) => ({
      '@type': 'Question',
      name: q.question || q.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer || q.a,
      },
    })),
  }),

  Review: (d) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: d.rating,
      bestRating: d.bestRating || 5,
    },
    author: { '@type': 'Person', name: d.author?.name || 'Anonymous' },
    reviewBody: d.body,
    ...(d.itemReviewed && {
      itemReviewed: { '@type': d.itemReviewed.type || 'Thing', name: d.itemReviewed.name },
    }),
  }),

  JobPosting: (d) => ({
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: d.title,
    description: d.description,
    datePosted: d.datePosted,
    ...(d.validThrough && { validThrough: d.validThrough }),
    employmentType: (d.employmentType || 'FULL_TIME').toUpperCase(),
    hiringOrganization: {
      '@type': 'Organization',
      name: 'MetlifeDM',
      sameAs: SITE_URL,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: d.location?.city || 'Remote',
        addressRegion: d.location?.state,
        addressCountry: d.location?.country || 'US',
      },
    },
    ...(d.salary && {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: d.salary.currency || 'USD',
        value: {
          '@type': 'QuantitativeValue',
          minValue: d.salary.min,
          maxValue: d.salary.max,
          unitText: d.salary.unitText || 'YEAR',
        },
      },
    }),
  }),
};

export default function StructuredData({ type, data = {}, custom }) {
  const payload = custom || (BUILDERS[type] ? BUILDERS[type](data) : null);
  if (!payload) return null;

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(payload)}</script>
    </Helmet>
  );
}
