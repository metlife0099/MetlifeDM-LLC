import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { usePublicSettings } from '@/providers/PublicSettingsProvider.jsx';

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

export default function SEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  keywords,
  noindex = false,
  nofollow = false,
  author,
  publishedTime,
  modifiedTime,
  article,       // { section, tag[], author }
  jsonLd,        // JSON object or array — one or more schema.org entries
  verification,  // { google, bing, yandex, pinterest } — overrides the env-driven site defaults below
  children,
}) {
  const settings = usePublicSettings();
  const siteUrl = (import.meta.env.VITE_SITE_URL || 'https://metlifedm.com').replace(/\/$/, '');
  const finalDescription = description || settings.seo.defaultMetaDescription;
  const finalAuthor = author || settings.site.name;
  const finalVerification = {
    google: import.meta.env.VITE_GOOGLE_SITE_VERIFICATION || undefined,
    bing: import.meta.env.VITE_BING_SITE_VERIFICATION || undefined,
    ...verification,
  };
  const location = useLocation();
  const canonicalPath = canonical || location.pathname;
  const canonicalUrl = canonicalPath.startsWith('http')
    ? canonicalPath
    : `${siteUrl}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}`;

  const finalTitle = title
    ? `${title} · ${settings.site.name}`
    : settings.seo.defaultMetaTitle;

  const finalOgImage = ogImage
    ? (ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`)
    : (settings.seo.defaultOgImage.startsWith('http')
        ? settings.seo.defaultOgImage
        : `${siteUrl}${settings.seo.defaultOgImage.startsWith('/') ? '' : '/'}${settings.seo.defaultOgImage}`);

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
      <meta name="description" content={finalDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      {!keywords && settings.seo.defaultKeywords.length > 0 && (
        <meta name="keywords" content={settings.seo.defaultKeywords.join(', ')} />
      )}
      <meta name="author" content={finalAuthor} />
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />

      {/* ————— Theme & viewport ————— */}
      <meta name="theme-color" content="#0A1730" />
      <meta name="format-detection" content="telephone=no" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

      {/* ————— Open Graph ————— */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={settings.site.name} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || settings.seo.defaultMetaTitle} />

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
      <meta name="twitter:site" content={settings.seo.twitterHandle} />
      <meta name="twitter:creator" content={settings.seo.twitterHandle} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalOgImage} />
      <meta name="twitter:image:alt" content={title || settings.seo.defaultMetaTitle} />

      {/* ————— Search engine verification ————— */}
      {finalVerification.google && (
        <meta name="google-site-verification" content={finalVerification.google} />
      )}
      {finalVerification.bing && (
        <meta name="msvalidate.01" content={finalVerification.bing} />
      )}
      {finalVerification.yandex && (
        <meta name="yandex-verification" content={finalVerification.yandex} />
      )}
      {finalVerification.pinterest && (
        <meta name="p:domain_verify" content={finalVerification.pinterest} />
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
