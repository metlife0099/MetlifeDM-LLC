import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

/**
 * <SEO />
 *
 * Reusable meta-tag component. Renders <head> content for a page, including:
 *   - <title>, <meta description>, canonical
 *   - Open Graph (Facebook, LinkedIn, Slack previews)
 *   - Twitter Cards
 *   - robots directive
 *   - optional per-page structured data via `jsonLd` prop
 *
 * All props are optional. Anything you don't pass falls back to the site
 * defaults defined below. In production those defaults should come from
 * global Settings — pull them via a QueryProvider hook or a context.
 *
 * Usage:
 *   <SEO
 *     title="About us"
 *     description="Independent digital marketing agency for USA businesses."
 *     canonical="/about"
 *     ogImage="/og/about.jpg"
 *     type="website"
 *   />
 */

// ————— Fallback defaults —————
const DEFAULTS = {
  siteName: 'MetlifeDM',
  siteUrl: import.meta.env.VITE_SITE_URL || 'https://metlifedm.com',
  defaultTitle: 'MetlifeDM · Digital marketing built for USA businesses',
  titleTemplate: '%s · MetlifeDM',
  defaultDescription:
    'Independent digital marketing agency. SEO, PPC, content, and web — measurable results for growing USA businesses.',
  defaultOgImage: '/og/default.jpg',
  twitterHandle: '@metlifedm',
  locale: 'en_US',
  themeColor: '#0A1730',
  keywords: 'digital marketing, SEO agency, PPC, content marketing, USA',
};

export default function SEO({
  title,
  description = DEFAULTS.defaultDescription,
  canonical,
  ogImage,
  ogType = 'website',
  keywords,
  noindex = false,
  nofollow = false,
  author = DEFAULTS.siteName,
  publishedTime,
  modifiedTime,
  article,       // { section, tag[], author }
  jsonLd,        // JSON object or array — one or more schema.org entries
  verification,  // { google, bing, yandex, pinterest } — set once site-wide
  children,
}) {
  const location = useLocation();
  const path = location.pathname + location.search;
  const canonicalUrl = `${DEFAULTS.siteUrl}${canonical || location.pathname}`;

  const finalTitle = title
    ? DEFAULTS.titleTemplate.replace('%s', title)
    : DEFAULTS.defaultTitle;

  const finalOgImage = ogImage
    ? (ogImage.startsWith('http') ? ogImage : `${DEFAULTS.siteUrl}${ogImage}`)
    : `${DEFAULTS.siteUrl}${DEFAULTS.defaultOgImage}`;

  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow',
    'max-image-preview:large',
    'max-snippet:-1',
    'max-video-preview:-1',
  ].join(', ');

  return (
    <Helmet>
      {/* ————— Standard ————— */}
      <html lang="en" />
      <title>{finalTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {!keywords && <meta name="keywords" content={DEFAULTS.keywords} />}
      <meta name="author" content={author} />
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />

      {/* ————— Theme & viewport ————— */}
      <meta name="theme-color" content={DEFAULTS.themeColor} />
      <meta name="format-detection" content="telephone=no" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

      {/* ————— Open Graph ————— */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title || DEFAULTS.defaultTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={DEFAULTS.siteName} />
      <meta property="og:locale" content={DEFAULTS.locale} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || DEFAULTS.defaultTitle} />

      {/* ————— Article-specific OG (blog posts) ————— */}
      {ogType === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {ogType === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {ogType === 'article' && article?.section && (
        <meta property="article:section" content={article.section} />
      )}
      {ogType === 'article' && article?.author && (
        <meta property="article:author" content={article.author} />
      )}
      {ogType === 'article' && Array.isArray(article?.tag) &&
        article.tag.map((t) => <meta key={t} property="article:tag" content={t} />)}

      {/* ————— Twitter Cards ————— */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={DEFAULTS.twitterHandle} />
      <meta name="twitter:creator" content={DEFAULTS.twitterHandle} />
      <meta name="twitter:title" content={title || DEFAULTS.defaultTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={finalOgImage} />
      <meta name="twitter:image:alt" content={title || DEFAULTS.defaultTitle} />

      {/* ————— Search engine verification ————— */}
      {verification?.google && (
        <meta name="google-site-verification" content={verification.google} />
      )}
      {verification?.bing && (
        <meta name="msvalidate.01" content={verification.bing} />
      )}
      {verification?.yandex && (
        <meta name="yandex-verification" content={verification.yandex} />
      )}
      {verification?.pinterest && (
        <meta name="p:domain_verify" content={verification.pinterest} />
      )}

      {/* ————— JSON-LD (optional) ————— */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd])}
        </script>
      )}

      {/* Allow escape hatch for arbitrary <head> content */}
      {children}
    </Helmet>
  );
}
