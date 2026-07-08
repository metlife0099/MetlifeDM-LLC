# Sitemap structure

Two things share the name "sitemap" in this project — the visual site map (which URLs exist) and the XML sitemap (what search engines fetch). Both here.

## Visual site map — every URL in the platform

### Public frontend (metlifedm.com)

```
/                                # Homepage
├── /about                       # Team, mission, story
├── /services                    # All services list
│   ├── /services/:slug          # Individual service detail
│   └── /services/categories     # Category filter
├── /industries
│   └── /industries/:slug        # Industry vertical page
├── /portfolio                   # Project showcase
│   └── /portfolio/:slug         # Project case brief
├── /case-studies                # Long-form case studies
│   └── /case-studies/:slug      # Individual case study
├── /blog                        # Blog listing
│   ├── /blog/:slug              # Post detail
│   ├── /blog/category/:slug     # Posts filtered by category
│   └── /blog/tag/:slug          # Posts filtered by tag
├── /testimonials                # Client testimonials
├── /pricing                     # Pricing plans
├── /contact                     # Contact form
├── /consultation                # Book a free consultation
├── /careers                     # Open positions
│   └── /careers/:slug           # Job detail + application
├── /privacy                     # CMS page — privacy policy
├── /terms                       # CMS page — terms of service
├── /cookies                     # CMS page — cookie policy
├── /faq                         # FAQ page
│
├── /login                       # Customer login
├── /register                    # Customer signup
├── /forgot-password
├── /reset-password
├── /verify-email
├── /2fa                         # 2FA challenge
│
└── /account                     # Customer portal (auth required)
    ├── /account/dashboard
    ├── /account/orders
    ├── /account/orders/:id
    ├── /account/tickets
    ├── /account/tickets/:id
    ├── /account/wishlist
    ├── /account/settings
    └── /account/security
```

### Admin console (admin.metlifedm.com)

```
/dashboard                       # KPIs + charts

/content
├── /content/services            # Service CRUD
│   └── /content/services/:id
├── /content/portfolio
│   └── /content/portfolio/:id
├── /content/case-studies
│   └── /content/case-studies/:id
├── /content/industries
│   └── /content/industries/:id
├── /content/blog                # Post listing
│   ├── /content/blog/:id        # New = "new", edit = post id
│   ├── /content/blog/categories
│   └── /content/blog/comments   # Moderation
├── /content/testimonials
├── /content/faqs
└── /content/pages
    └── /content/pages/:id

/careers
├── /careers/jobs
│   └── /careers/jobs/:id
└── /careers/applications

/leads
├── /leads/contacts
├── /leads/consultations
└── /leads/subscribers

/commerce
├── /commerce/orders
│   └── /commerce/orders/:id
├── /commerce/payments
└── /commerce/coupons

/support
└── /support/tickets
    └── /support/tickets/:id

/users
└── /users/:id

/media                           # Cloudinary library browser

/analytics                       # Deeper KPIs + funnel

/settings
├── /settings                    # General
└── /settings/email-templates
```

### Backend API (api.metlifedm.com)

See [`docs/API.md`](API.md) for the full endpoint list.

---

## XML sitemap — what search engines fetch

### Endpoint

`GET https://metlifedm.com/sitemap.xml`

Dynamically generated from the DB — no manual regeneration needed. Newly published content appears within one HTTP request.

### Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static marketing pages -->
  <url>
    <loc>https://metlifedm.com/</loc>
    <lastmod>2026-07-04T00:00:00.000Z</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- ...about, services, blog, etc. -->

  <!-- Dynamic content (published only) -->
  <url>
    <loc>https://metlifedm.com/services/seo-audit</loc>
    <lastmod>2026-06-15T10:30:00.000Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- ...all published services, blog posts, portfolio, etc. -->
</urlset>
```

### Priority table

| URL type | Priority | Change frequency |
| :--- | :--- | :--- |
| `/` | 1.0 | daily |
| `/services`, `/blog` | 0.9 | daily |
| Service detail | 0.8 | weekly |
| `/case-studies` (index) | 0.8 | weekly |
| Case study detail | 0.7 | monthly |
| Blog post detail | 0.7 | weekly |
| `/about`, `/contact`, `/consultation` | 0.7 | monthly |
| `/industries`, `/portfolio` (indices) | 0.7 | weekly |
| Industry detail, Portfolio detail | 0.6 | monthly |
| CMS pages (privacy, terms, etc.) | 0.5 | monthly |
| `/careers` | 0.5 | weekly |

Priority is relative — Google uses it only to compare pages **within** the same site.

### What's excluded

The sitemap does NOT list:

- `/login`, `/register`, `/forgot-password`, and other auth flow pages
- Anything under `/account/*`, `/checkout/*`, `/dashboard/*`
- `/admin/*` (the admin console lives on a separate subdomain anyway)
- Blog posts with `status !== 'published'`
- Any content entity with `isPublished: false`
- Query-parameter URLs (e.g. `/blog?category=seo`) — these are `noindex`'d client-side

### Filter and pagination URLs

For pages like `/blog?category=seo` or `/services?category=ppc`, the frontend uses `<link rel="canonical" href="/blog" />` to point back to the un-filtered version. This tells Google not to index each filter combination separately, avoiding duplicate content penalties.

If a filter is important enough to be indexed on its own, it becomes a real URL (e.g. `/blog/category/seo`) and gets a sitemap entry.

---

## Sitemap index (optional, for large sites)

Once you exceed ~50k URLs (unlikely for a marketing site but common for e-commerce), split into multiple sitemaps referenced by an index:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://metlifedm.com/sitemap-static.xml</loc>
    <lastmod>2026-07-04</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://metlifedm.com/sitemap-blog.xml</loc>
    <lastmod>2026-07-04</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://metlifedm.com/sitemap-services.xml</loc>
    <lastmod>2026-07-04</lastmod>
  </sitemap>
</sitemapindex>
```

To enable this, update `seo.controller.js` — split `sitemap()` into `sitemapIndex()`, `sitemapStatic()`, `sitemapBlog()`, etc. Each individual sitemap has a 50k URL / 50 MB uncompressed limit.

---

## Submitting the sitemap

### Google

1. [Search Console](https://search.google.com/search-console) → your property → Sitemaps → Add: `sitemap.xml`
2. Wait 24–48 hours for the first crawl
3. Check the "Discovered" count — should equal or exceed the number of `<url>` entries

### Bing

1. [Bing Webmaster Tools](https://www.bing.com/webmasters) → Sitemaps → Submit sitemap → `https://metlifedm.com/sitemap.xml`

### IndexNow

For faster indexing on Bing, Yandex, and Seznam, ping IndexNow when you publish new content. Add to your publish flow:

```js
// backend — after publishing a blog post
await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    host: 'metlifedm.com',
    key: process.env.INDEXNOW_KEY,
    urlList: [`https://metlifedm.com/blog/${post.slug}`],
  }),
});
```

Generate a key at [indexnow.org](https://www.indexnow.org) and drop the verification file into `frontend/public/`.

---

## Ongoing maintenance

- **Weekly:** Search Console → Coverage → Errors. Fix anything under "Excluded" that shouldn't be.
- **Monthly:** compare Search Console impressions and clicks to previous month. Investigate drops > 20%.
- **On any URL restructure:** add a 301 redirect in admin → Settings → Redirects for the old URL. Never let a URL 404 if it had inbound links.
- **On new content type:** update `seo.controller.js` to include it in the sitemap query.
