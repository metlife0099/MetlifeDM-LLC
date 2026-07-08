# Recommended admin settings

The exact values to enter in the **Admin → Settings → General** and **SEO defaults** cards for a production launch. Copy-paste ready.

Login to the admin panel → sidebar → System → Settings.

---

## 01 · Site info

| Field | Value |
| :--- | :--- |
| Site name | `MetlifeDM` |
| Tagline | `Digital marketing built for USA businesses.` |
| Site description | `Independent digital marketing agency. SEO, PPC, content, and web — measurable results for growing USA businesses.` |

---

## 02 · Contact

| Field | Value |
| :--- | :--- |
| Contact email | `team@metlifedm.com` |
| Contact phone | `+1 (555) 000-0000` (your real number) |
| Address | Street address, one line |
| City | e.g. `Austin` |
| State | e.g. `TX` |

---

## 03 · Social links

Fill in the ones you actually use. Leave the rest blank — the site hides icons for empty URLs.

| Field | Example value |
| :--- | :--- |
| LinkedIn URL | `https://www.linkedin.com/company/metlifedm` |
| Twitter / X URL | `https://twitter.com/metlifedm` |
| Instagram URL | `https://www.instagram.com/metlifedm` |
| Facebook URL | `https://www.facebook.com/metlifedm` |
| YouTube URL | `https://www.youtube.com/@metlifedm` |

---

## 04 · SEO defaults

These are the fallbacks used for any page that doesn't have per-entity SEO fields filled in.

| Field | Recommended value |
| :--- | :--- |
| Default meta title | `MetlifeDM · Digital marketing built for USA businesses` |
| Default meta description | `Independent digital marketing agency. SEO, PPC, content, and web — measurable results for growing USA businesses.` |
| Default meta keywords | `digital marketing, SEO agency, PPC management, content marketing, web development, USA` |
| OG image URL | Upload a 1200×630 image via Media library, paste URL here |

### robots.txt

Paste this in the Robots.txt editor (Admin → Settings → SEO → Robots):

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /account
Disallow: /account/*
Disallow: /checkout
Disallow: /checkout/*
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /verify-email
Disallow: /*?utm_
Disallow: /*?ref=
Disallow: /*?search=

User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: GPTBot
Allow: /blog
Allow: /case-studies
Disallow: /account

User-agent: Google-Extended
Allow: /
```

The backend automatically appends `Sitemap: https://metlifedm.com/sitemap.xml` at the end — don't add it yourself.

---

## 05 · Integrations

You'll usually leave the integration keys blank in dev. In production:

| Field | Where to get it |
| :--- | :--- |
| Google Analytics ID | GA4 → Admin → Property → Data streams → Web → paste `G-XXXXXXXX` |
| Google Tag Manager ID | GTM → Container → paste `GTM-XXXXXXX` (only if using GTM instead of GA direct) |
| Meta Pixel ID | Facebook Business → Events Manager → paste pixel ID |
| Intercom App ID | Intercom → Workspace → Settings → API keys |
| Hotjar Site ID | Hotjar → Sites → paste the numeric ID |
| Sentry DSN (public) | Sentry → Project → Client Keys → paste the DSN URL |

**Sensitive keys** (Stripe secret, SMTP password, Cloudinary secret, OpenAI key) go in the **backend `.env`** — never in these fields, which are client-visible.

---

## 06 · Search engine verification

The `<SEO />` component supports verification metas for each engine. In `Settings → SEO → Verification`:

| Engine | Where to get code | What to paste |
| :--- | :--- | :--- |
| Google Search Console | Property → Settings → Ownership → HTML tag method | Just the `content=""` value |
| Bing Webmaster | Site → Verify Ownership → HTML meta option | The content value |
| Yandex Webmaster | Site → Rights → Meta tag method | The content value |
| Pinterest | Business → Settings → Claim → HTML tag | The content value |

Only paste each one **once** — they get injected site-wide via the SEO component.

---

## 07 · Email templates

Populate every template with your brand voice. The starter set (Admin → System → Email templates):

- `welcome` — sent after registration
- `email-verification` — verify link
- `password-reset` — reset link
- `order-confirmation` — after successful payment
- `order-shipped` / `service-started` — status changes
- `ticket-created` — customer confirmation
- `ticket-replied` — new reply notification
- `consultation-confirmed` — meeting details
- `newsletter-digest` — weekly (if using digest job)

Every template supports `{{firstName}}`, `{{orderNumber}}`, `{{siteName}}`, `{{unsubscribeUrl}}` and template-specific variables shown at the bottom of the edit drawer.

Send a test email to yourself before going live — the "Send test" button is in every template's edit drawer.

---

## 08 · First-time setup order

Recommended order to fill things in:

1. Site info + contact (needed by every page footer)
2. Social links (footer + Organization schema)
3. SEO defaults + OG image (needed before you announce the site)
4. Verification meta tags (paste + verify each engine)
5. Google Analytics ID
6. Email templates — paste your brand copy, send test to yourself
7. Payment methods in Stripe (production keys go in backend .env, not here)
8. Seed a few Services, a Portfolio project, and an initial Blog post

Only then flip DNS to production.
