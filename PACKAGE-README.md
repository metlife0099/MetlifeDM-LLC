# MetlifeDM · Documentation & SEO package

Comprehensive docs, SEO components, and static assets for the MetlifeDM platform.

## What's in this package

```
metlifedm-docs-seo/
├── README.md                              # Main project README (the big one — root of repo)
├── docs/
│   ├── ARCHITECTURE.md                    # System diagram, data flow, design tokens
│   ├── API.md                             # Full REST API reference by module
│   ├── DEPLOYMENT.md                      # Production deployment (Vercel + Railway + Atlas)
│   ├── SEO.md                             # Complete SEO guide — meta, schemas, Search Console
│   ├── SITEMAP.md                         # Sitemap structure + submission workflow
│   └── CONTRIBUTING.md                    # Branch strategy, commit format, code conventions
├── frontend/
│   ├── public/
│   │   ├── robots.txt                     # Static robots.txt fallback
│   │   ├── sitemap.xml                    # Sitemap-index pointing to dynamic backend sitemap
│   │   ├── site.webmanifest               # PWA manifest for home-screen install
│   │   ├── humans.txt                     # Team credits
│   │   └── .well-known/
│   │       └── security.txt               # Responsible-disclosure contact (RFC 9116)
│   └── src/
│       └── components/seo/
│           ├── SEO.jsx                    # Enhanced Helmet SEO component (OG + Twitter + verification)
│           └── StructuredData.jsx         # JSON-LD helper: Organization, Article, Product, FAQ, etc.
└── config/
    └── admin-settings-guide.md            # Recommended Settings values to paste into admin panel
```

## How to apply

### 1. Documentation
Drop the top-level `README.md` at the root of your monorepo. Drop `docs/*` into a `docs/` folder at the root.

```
metlifedm-llc/
├── README.md                # ← from this package
├── docs/
│   ├── ARCHITECTURE.md      # ← from this package
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── SEO.md
│   ├── SITEMAP.md
│   └── CONTRIBUTING.md
├── backend/
├── frontend/
└── admin/
```

### 2. Frontend files
Copy `frontend/public/*` and `frontend/src/components/seo/*` into your existing frontend project.

The `SEO.jsx` in this package **replaces** the existing `frontend/src/components/seo/Seo.jsx` (note the case difference — this one is properly capitalized). Update any imports from `import Seo from '.../Seo'` to `import SEO from '.../SEO'`.

`StructuredData.jsx` is a new file — no existing version to replace.

### 3. Admin settings
Login to the admin panel and follow `config/admin-settings-guide.md` — copy-paste values into Settings.

## What's already in place (no changes needed)

- **Backend `/sitemap.xml` endpoint** — already dynamic, already pulls from the DB. Just make sure `/sitemap.xml` on the frontend proxies to it (see `docs/DEPLOYMENT.md`).
- **Backend `/robots.txt` endpoint** — editable from admin → Settings → SEO.
- **Backend `/admin/redirects` CRUD** — for managing 301/302 redirects.

## Usage examples

### Home page

```jsx
import SEO from '@/components/seo/SEO';
import StructuredData from '@/components/seo/StructuredData';

export default function HomePage() {
  return (
    <>
      <SEO
        title="Digital marketing built for USA businesses"
        description="Independent agency. SEO, PPC, content, and web — measurable results for growing USA businesses."
        canonical="/"
        ogImage="/og/home.jpg"
      />
      <StructuredData
        type="Organization"
        data={{
          name: 'MetlifeDM LLC',
          url: 'https://metlifedm.com',
          logo: 'https://metlifedm.com/logo.png',
          sameAs: [
            'https://linkedin.com/company/metlifedm',
            'https://twitter.com/metlifedm',
          ],
        }}
      />
      <StructuredData type="WebSite" data={{ searchAction: true }} />
      {/* page content */}
    </>
  );
}
```

### Blog post

```jsx
export default function PostDetailPage({ post }) {
  return (
    <>
      <SEO
        title={post.seo?.title || post.title}
        description={post.seo?.description || post.excerpt}
        canonical={`/blog/${post.slug}`}
        ogImage={post.coverImage?.url}
        ogType="article"
        publishedTime={post.publishedAt}
        modifiedTime={post.updatedAt}
        article={{
          section: post.categories?.[0]?.name,
          tag: post.tags,
          author: `${post.author.firstName} ${post.author.lastName}`,
        }}
      />
      <StructuredData
        type="Article"
        data={{
          headline: post.title,
          image: post.coverImage?.url,
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          author: { name: `${post.author.firstName} ${post.author.lastName}` },
          mainEntityOfPage: `https://metlifedm.com/blog/${post.slug}`,
        }}
      />
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: [
            { name: 'Home', url: '/' },
            { name: 'Blog', url: '/blog' },
            { name: post.title, url: `/blog/${post.slug}` },
          ],
        }}
      />
      {/* post content */}
    </>
  );
}
```

### Service page

```jsx
<SEO
  title={service.seo?.title || service.title}
  description={service.seo?.description || service.shortDescription}
  canonical={`/services/${service.slug}`}
  ogImage={service.coverImage?.url}
/>
<StructuredData
  type="Service"
  data={{
    name: service.title,
    description: service.shortDescription,
    image: service.coverImage?.url,
    serviceType: service.category,
    areaServed: 'United States',
    offers: service.plans?.map(p => ({ price: p.price })),
  }}
/>
```

### FAQ page

```jsx
<StructuredData
  type="FAQPage"
  data={{
    questions: faqs.map(f => ({ q: f.question, a: f.answer })),
  }}
/>
```

## What this doesn't include

- Component tests — none exist yet
- Sentry / Datadog setup — you'll need to `npm install` the SDKs and initialize in `main.jsx`
- Actual OG images — you'll need to design the fallback 1200×630 images
- Actual favicons — replace `favicon.svg`, `apple-touch-icon.png`, and the icon-192/512 PNGs
- Real Analytics ID or GTM ID — put yours in admin → Settings

See `docs/DEPLOYMENT.md` for the pre-launch checklist and `docs/SEO.md` for the SEO launch checklist.
