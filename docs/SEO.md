# SEO configuration

Everything you need to make MetlifeDM discoverable — from meta tags to Search Console verification.

## What's already built in

The backend and frontend ship with production-ready SEO infrastructure:

| Feature | Where | Notes |
| :--- | :--- | :--- |
| **Dynamic `/sitemap.xml`** | `backend/src/controllers/seo.controller.js` | Pulls services, blog posts, portfolio, case studies, industries, and CMS pages from the DB |
| **Dynamic `/robots.txt`** | Same controller | Customizable via admin → Settings |
| **Reusable `<SEO />` component** | `frontend/src/components/seo/SEO.jsx` | Wraps Helmet; sets title, description, canonical, OG, Twitter Cards |
| **Structured data helper** | `frontend/src/components/seo/StructuredData.jsx` | JSON-LD schemas: Organization, WebSite, Article, Product, BreadcrumbList |
| **Managed redirects** | Admin → Settings → Redirects | 301/302 tracked in DB, served by the API |
| **Per-page SEO fields** | Every content model has `seo.title`, `seo.description`, `seo.keywords`, `seo.ogImage` | Set in the admin panel for each entity |

The rest of this doc is about **using** it well.

---

## Setup steps

Do these once, right after deployment:

### 1. Verify domain ownership

- **Google Search Console:** [search.google.com/search-console](https://search.google.com/search-console) → Add property → verify via DNS TXT record or by uploading an HTML file to `frontend/public/`
- **Bing Webmaster:** [bing.com/webmasters](https://bing.com/webmasters) → same flow
- **Yandex Webmaster** (optional): if targeting Eastern Europe

Take the verification meta tag from Google and paste it into admin → Settings → General → SEO defaults → Verification meta. The `<SEO />` component will render it site-wide.

### 2. Submit sitemap

Once your domain is verified:

- Google Search Console → Sitemaps → Add: `https://metlifedm.com/sitemap.xml`
- Bing Webmaster → Sitemaps → Add: same URL

Sitemap regenerates on every request from the DB, so newly published content appears within minutes. No need to re-submit after adding content.

### 3. Google Analytics / GTM

In admin → Settings → Integrations:

- **Google Analytics ID** — paste your `G-XXXXXXX`
- **Google Tag Manager ID** — paste your `GTM-XXXXXXX` if using GTM instead

The frontend reads these on load and injects the GA/GTM scripts. They only fire in production (`import.meta.env.PROD`).

### 4. Open Graph image

Every page needs a fallback OG image (used by Facebook, LinkedIn, Slack, etc. when no per-page image is set). Requirements:

- 1200 × 630 px
- < 300 KB
- PNG or JPG
- Text-safe zone: keep important elements at least 100 px from the edges

Upload via admin → Media library, copy the URL, paste into Settings → SEO defaults → OG image URL.

### 5. Favicons + PWA manifest

The frontend already ships with:

- `public/favicon.svg` — modern browsers
- `public/site.webmanifest` — PWA + Android home-screen install
- `public/apple-touch-icon.png` — iOS home screen (fallback)

If you rebrand, replace those three files. Recommended sizes:

- `favicon.svg` — vector, any size
- `apple-touch-icon.png` — 180 × 180
- `icon-192.png`, `icon-512.png` — referenced by the manifest

Use [realfavicongenerator.net](https://realfavicongenerator.net) to generate the whole set from one source.

---

## Per-page SEO

### For content edited in the admin

Every content entity (services, portfolio, case studies, blog posts, pages, industries) has a **SEO** card in the edit form:

- **Meta title** — overrides the default title tag for that page. Keep under 60 characters.
- **Meta description** — under 155 characters. Punchy and includes the primary keyword.
- **Keywords** — comma-separated. Not weighted by Google but still read by some engines.
- **OG image** — page-specific social share image. Falls back to the site default if empty.

The `<SEO />` component pulls these fields via the API and injects them into `<head>` at render time.

### For pages coded in the frontend

Any React page can override its SEO by rendering the `<SEO />` component:

```jsx
import SEO from '@/components/seo/SEO';

export default function AboutPage() {
  return (
    <>
      <SEO
        title="About MetlifeDM"
        description="Independent digital marketing agency for USA businesses."
        canonical="/about"
        ogImage="/og/about.jpg"
        keywords="digital marketing, SEO agency, USA"
      />
      {/* page content */}
    </>
  );
}
```

Props all optional — omitted values fall back to the site defaults from `Settings.seo`.

### Structured data (JSON-LD)

Use `<StructuredData />` for schema.org markup that helps Google understand your content. The most useful ones:

**Organization** — put in the root layout, once site-wide:

```jsx
<StructuredData
  type="Organization"
  data={{
    name: 'MetlifeDM LLC',
    url: 'https://metlifedm.com',
    logo: 'https://metlifedm.com/logo.png',
    contactPoint: {
      telephone: '+1-555-...',
      email: 'team@metlifedm.com',
    },
    sameAs: [
      'https://linkedin.com/company/metlifedm',
      'https://twitter.com/metlifedm',
    ],
  }}
/>
```

**Article** — on every blog post detail page:

```jsx
<StructuredData
  type="Article"
  data={{
    headline: post.title,
    image: post.coverImage?.url,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { name: post.author.firstName + ' ' + post.author.lastName },
  }}
/>
```

**Product** — on service detail pages:

```jsx
<StructuredData
  type="Product"
  data={{
    name: service.title,
    description: service.shortDescription,
    image: service.coverImage?.url,
    offers: service.plans?.map(p => ({
      price: p.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    })),
  }}
/>
```

**BreadcrumbList** — on any nested page:

```jsx
<StructuredData
  type="BreadcrumbList"
  data={{
    items: [
      { name: 'Home', url: '/' },
      { name: 'Services', url: '/services' },
      { name: service.title, url: `/services/${service.slug}` },
    ],
  }}
/>
```

Test any schema with [Google's Rich Results Test](https://search.google.com/test/rich-results).

---

## Sitemap details

### Dynamic generation

`GET /sitemap.xml` on the backend queries every published content collection and emits a valid XML sitemap. Included:

| URL type | Priority | Change frequency |
| :--- | :--- | :--- |
| Homepage `/` | 1.0 | daily |
| `/services` and `/blog` | 0.9 | daily |
| Service detail pages | 0.8 | weekly |
| Case study detail pages | 0.7 | monthly |
| Blog post detail pages | 0.7 | weekly |
| Industry detail pages | 0.6 | monthly |
| Portfolio detail pages | 0.6 | monthly |
| `/about`, `/contact`, `/consultation` | 0.7 | monthly |
| CMS pages (privacy, terms, cookies) | 0.5 | monthly |
| `/careers` | 0.5 | weekly |

Each URL includes a `<lastmod>` from the DB's `updatedAt`. Only entities where `isPublished: true` (or `status: 'published'` for blog posts) appear.

### Static fallback

`frontend/public/sitemap.xml` exists as a static fallback for edge caches. In production, ensure your hosting redirects `/sitemap.xml` to the backend URL, OR replace the static file's content with a `<sitemapindex>` pointing to the dynamic one:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://api.metlifedm.com/api/v1/sitemap.xml</loc>
    <lastmod>2026-07-04T00:00:00.000Z</lastmod>
  </sitemap>
</sitemapindex>
```

That way Google fetches the static file at your apex, sees the sitemap-index, and follows through to the dynamic one.

---

## robots.txt

The backend serves `/robots.txt` from `Settings.seo.robotsTxt` with a `Sitemap:` line appended. Default content:

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /account
Disallow: /checkout
Disallow: /dashboard
Disallow: /orders

Sitemap: https://metlifedm.com/sitemap.xml
```

Adjust in admin → Settings → SEO → robots.txt. Take care not to block essential paths.

**Never** put `Disallow: /` accidentally — that de-indexes the entire site. If you're staging a new build, use a `x-robots-tag: noindex` header on the staging domain instead.

---

## Meta tag conventions

The `<SEO />` component builds the following tags for every page:

```html
<!-- Standard -->
<title>Page Title · MetlifeDM</title>
<meta name="description" content="Under 155 characters." />
<meta name="keywords" content="comma, separated, keywords" />
<meta name="author" content="MetlifeDM LLC" />
<link rel="canonical" href="https://metlifedm.com/current-path" />

<!-- Robots -->
<meta name="robots" content="index, follow, max-image-preview:large" />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:title" content="Page Title" />
<meta property="og:description" content="..." />
<meta property="og:url" content="https://metlifedm.com/current-path" />
<meta property="og:image" content="https://metlifedm.com/og/page.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="MetlifeDM" />
<meta property="og:locale" content="en_US" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@metlifedm" />
<meta name="twitter:title" content="Page Title" />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="..." />

<!-- Verification -->
<meta name="google-site-verification" content="..." />
```

You almost never need to touch these directly — set them via admin → Settings → SEO defaults, then override per-page via the entity's SEO card.

---

## Content best practices

Guidelines the team should follow when creating content:

### Titles

- Keep under 60 characters (Google truncates around 60 in SERPs)
- Front-load the primary keyword
- Include brand at the end: `Primary Keyword · MetlifeDM`
- Never use ALL CAPS — Google may penalize

### Descriptions

- Under 155 characters
- Include the primary keyword naturally in the first half
- End with a soft CTA when it fits: "Get a free strategy audit."
- Write for humans, not robots

### URL slugs

- Lowercase, hyphens between words, no underscores
- 3–5 words max
- No stop words unless meaningful ("the", "and", "of")
- No dates in blog slugs (breaks link equity when you update the post)

### Images

- Every uploaded image needs `alt` text (admin → Media library → click image → Details)
- Cover images 1200 × 630 minimum
- Compress before uploading (TinyPNG for JPG/PNG, Squoosh for WebP)
- Cloudinary auto-serves WebP + AVIF when supported

### Internal linking

- Every article should link to at least 2 related services or case studies
- Every service page should link to relevant industries and blog posts
- Use descriptive anchor text — never "click here"

---

## Common issues

### "Page not indexed" in Search Console

Check in order:

1. **robots.txt not blocking** — visit `/robots.txt` and search for the path
2. **Canonical points to itself** — inspect the `<link rel="canonical">` on the page
3. **No `noindex` meta** — inspect `<meta name="robots">` on the page
4. **Sitemap includes the URL** — visit `/sitemap.xml` and search for the slug
5. **Content is unique** — Google skips near-duplicate pages
6. **Discoverable via internal links** — orphan pages take longer to index

Then in Search Console: URL Inspection → Request indexing. Google usually re-crawls within a week.

### Duplicate title tags across pages

Every page's `<SEO />` should get a unique title. Common bug: a shared list page (like `/blog` or `/services`) rendering the same title for every filter combination. Fix by including the filter in the title:

```jsx
<SEO title={category ? `${category} · Blog · MetlifeDM` : 'Blog · MetlifeDM'} />
```

### Social share preview shows wrong image

Facebook and LinkedIn cache OG data aggressively. Force a refresh:

- Facebook: [developers.facebook.com/tools/debug/](https://developers.facebook.com/tools/debug/)
- LinkedIn: [linkedin.com/post-inspector](https://www.linkedin.com/post-inspector/)
- Twitter: preview updates automatically on next crawl

### Sitemap 404s

Two possibilities:

1. **Backend not routing `/sitemap.xml`** — check that `seo.routes.js` is mounted in `routes/index.js` at the root, not under `/api/v1`.
2. **Frontend host not proxying** — the sitemap must be accessible at `metlifedm.com/sitemap.xml`, not just at `api.metlifedm.com/sitemap.xml`. Add a rewrite in `frontend/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/sitemap.xml", "destination": "https://api.metlifedm.com/sitemap.xml" },
    { "source": "/robots.txt", "destination": "https://api.metlifedm.com/robots.txt" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## SEO checklist for launch

Before flipping to production:

- [ ] Every service has meta title, description, and OG image set
- [ ] Every published blog post has meta title, description, cover image
- [ ] Homepage title + description + OG image set in Settings
- [ ] `robots.txt` doesn't block anything you want indexed
- [ ] `sitemap.xml` returns 200 and includes all expected URLs
- [ ] Google Search Console verified + sitemap submitted
- [ ] Bing Webmaster verified + sitemap submitted
- [ ] Google Analytics or GTM ID set in admin settings
- [ ] Structured data on homepage (Organization) validated with Rich Results Test
- [ ] Structured data on a sample blog post (Article) validated
- [ ] Every image in Media library has alt text
- [ ] Internal linking present (audit with a tool like Screaming Frog)
- [ ] Mobile PageSpeed score > 80 on homepage and top service page
- [ ] No mixed-content warnings (all resources over HTTPS)
- [ ] Canonical URL correct on every page (self-referential)
- [ ] 404 page returns actual 404 status + user-friendly message
- [ ] 301 redirects from old URLs (if migrating an existing site) set in admin → Redirects
