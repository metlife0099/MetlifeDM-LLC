# Architecture

## System diagram

```
┌────────────────────┐         ┌────────────────────┐
│ Public frontend    │         │ Admin console      │
│ metlifedm.com      │         │ admin.metlifedm.com│
│ React 19 · Vite 6  │         │ React 19 · Vite 6  │
└──────────┬─────────┘         └──────────┬─────────┘
           │                              │
           │ HTTPS + JWT (Bearer)         │ HTTPS + JWT (Bearer)
           │ cookie-based refresh         │ cookie-based refresh
           │                              │
           └──────────────┬───────────────┘
                          ▼
             ┌─────────────────────────┐
             │ Backend API             │
             │ api.metlifedm.com       │
             │ Node 20 · Express 4     │
             │ Socket.io on same port  │
             └────┬────────┬────────┬──┘
                  │        │        │
      ┌───────────┘        │        └───────────┐
      ▼                    ▼                    ▼
┌───────────┐      ┌───────────┐      ┌─────────────────┐
│ MongoDB   │      │ Redis     │      │ External APIs   │
│ Atlas     │      │ (cache,   │      │ Stripe          │
│           │      │  sessions,│      │ Cloudinary      │
│           │      │  rate     │      │ Brevo SMTP      │
│           │      │  limits)  │      │ OpenAI          │
└───────────┘      └───────────┘      └─────────────────┘
```

**Sockets:** Socket.io shares the Express HTTP server. Ticket updates, chat messages, and admin notifications broadcast on authenticated rooms.

**Webhooks in:** Stripe → `/api/v1/webhooks/stripe`. Raw body required, verified via `STRIPE_WEBHOOK_SECRET`.

**Webhooks out:** Cloudinary uses direct signed uploads from the frontend; no webhook needed.

---

## Request lifecycle (typical read)

```
Browser
  └─▶ Vite dev proxy (/api → :5000)  ─── dev only
       └─▶ Express router (/api/v1)
            └─▶ security middleware  (helmet, cors, xss, mongo-sanitize, hpp)
                 └─▶ rate limiter    (per-route buckets in Redis)
                      └─▶ auth middleware  (JWT verify from Bearer or cookie)
                           └─▶ Zod validator  (params + query + body)
                                └─▶ controller
                                     └─▶ Mongoose query (with lean + populate)
                                          └─▶ ApiResponse envelope
```

Read paths hit Redis first for public endpoints (services list, published blog posts, sitemap). Writes always invalidate cache keys via `redis.service.js`.

---

## Response envelope

Every backend response follows the same shape:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Services",
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 47, "pages": 3 },
  "timestamp": "2026-07-04T09:30:00.000Z"
}
```

- `data` is an array for list endpoints, an object for single entities.
- `meta` is only present on paginated lists.
- Errors follow the same envelope with `success: false` and an `error: { code, message, details? }` field.

Frontends unwrap `r.data.data` via `unwrap(r)` and `{ data: r.data.data, meta: r.data.meta }` via `unwrapMeta(r)`.

---

## Authentication

Two-token JWT with rotation:

- **Access token** — 15 min TTL, sent in `Authorization: Bearer <token>`, stored in `localStorage` on client.
- **Refresh token** — 30 day TTL, stored in `httpOnly` cookie (`SameSite=Strict`, `Secure` in prod). Rotates on every refresh. Old refresh tokens are added to a Redis-backed denylist.

**Silent refresh:** the axios response interceptor catches 401 and retries after hitting `/auth/refresh`. If refresh fails, dispatches a global logout event (`auth:logout` on public, `admin:logout` on admin — separate so both apps can be signed in on the same origin without conflict).

**2FA:** TOTP via speakeasy. When enabled, login returns `{ requires2FA: true }` and the client shows a 6-digit code prompt. Backup codes accepted for recovery.

---

## Data model overview

Models live in `backend/src/models/`:

| Model | Purpose |
| :--- | :--- |
| `User` | Customers + staff. `role`, `status`, `twoFactor`, `refreshTokens[]` |
| `Service` | Offerings sold on the public site with pricing plans |
| `Order` | Line items, subtotal/discount/tax/total, status timeline |
| `Payment` | Stripe Payment Intent mirror + receipts |
| `Coupon` | Promo codes with type/value/usage limits |
| `Blog` | Posts + inline `comments[]` for moderation |
| `Category` | Blog categories |
| `Portfolio` | Client project case briefs |
| `CaseStudy` | Long-form challenge/strategy/outcome |
| `Industry` | Vertical positioning pages |
| `Testimonial`, `Faq`, `Page` | CMS |
| `Job`, `JobApplication` | Careers pipeline |
| `Contact`, `Consultation`, `Newsletter` | Lead capture |
| `Ticket` | Support with threaded `messages[]` and `notes[]` |
| `Media` | Cloudinary asset mirror with folder taxonomy |
| `Notification` | Per-user in-app notifications |
| `EmailTemplate` | Editable transactional email bodies |
| `Settings` | Global site settings (singleton) |
| `Redirect` | Managed 301/302 redirects |
| `AuditLog` | Admin action history |

---

## Design tokens

Both frontend and admin use the same Tailwind v4 `@theme` block:

```css
@theme {
  /* Brand palette */
  --color-ivory: #F5F1E8;      /* canvas */
  --color-surface: #FFFFFF;    /* admin cards */
  --color-ink: #0A1730;        /* primary text */
  --color-graphite: #2A3452;   /* secondary ink */
  --color-ultra: #1547FF;      /* accent */
  --color-ultra-hover: #1236CC;
  --color-ultra-soft: #6B85FF;
  --color-ultra-tint: #E8ECFF;
  --color-sand: #EAE4D4;
  --color-slate: #727D96;
  --color-hairline: #E8E3D2;

  /* Semantic */
  --color-success: #128260;
  --color-warn: #C87A1F;
  --color-danger: #B4351B;
  --color-info: #1547FF;

  /* Fonts */
  --font-display: 'Fraunces', ui-serif, Georgia, serif;
  --font-body: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

Custom utilities live in `src/index.css` under `@utility`:

- `text-display-hero`, `text-display-lg`, `text-display-md`, `text-display-sm` — headline scale
- `text-italic-fraunces` — accent italic in headlines
- `text-eyebrow` — mono uppercase tracked labels
- `text-mono`, `num-plate` — tabular-nums for metrics
- `border-hairline`, `divide-editorial` — subtle borders
- `link-underline` — animated underline for text links
- `sidebar-link`, `sidebar-link-active` — admin nav item states

---

## Folder conventions

**Backend controllers** are the boundary. Business logic lives in `services/`. Controllers do request-shape work, call services, return `ApiResponse.ok(...)`.

**Backend routers** import controllers, register routes, mount middleware. No business logic in routers.

**Backend models** contain schema, indexes, virtuals, and instance methods only. No route/request logic.

**Frontend components** are split into:
- `ui/` — presentational primitives (Button, Card, Modal, DataTable)
- `layout/` — Navbar, Footer, AdminLayout, Sidebar, Topbar
- `sections/` — page-composed sections (Hero, ServicesGrid, TestimonialsRow)
- `forms/` — form primitives with hook-form + Zod
- `seo/` — Helmet-based `<SEO />` and `<StructuredData />` components

**Frontend pages** are route components under `pages/`. Deep nesting mirrors URL structure: `pages/content/blog/PostsPage.jsx` renders `/content/blog`.

**Frontend hooks** live in `hooks/` — one hook per file, plus a barrel `index.js` for common ones.

---

## Real-time (Socket.io)

Namespaces:

- `/` — logged-in customers (order updates, ticket replies on their tickets)
- `/staff` — admin/staff (new tickets, high-priority alerts, new orders)

Auth is by JWT passed in `auth.token` on `connect`. Server verifies and joins rooms:

- `user:{userId}` — direct to a user
- `role:staff` — all staff broadcast
- `ticket:{ticketId}` — everyone watching a ticket

Client uses `socket.io-client` — see `frontend/src/hooks/useSocket.js`.

---

## Scheduled jobs

`backend/src/jobs/` — cron jobs registered on server boot:

| Job | Cadence | Purpose |
| :--- | :--- | :--- |
| `cleanupRefreshTokens` | daily 03:00 | Remove expired refresh tokens from users |
| `publishScheduledPosts` | every 5 min | Publish blog posts with `publishedAt <= now` |
| `sendDigestEmails` | Mondays 09:00 | Weekly digest to subscribers |
| `expireCoupons` | daily 00:15 | Deactivate coupons past their expiry |
| `syncCloudinary` | daily 02:00 | Reconcile Media collection with Cloudinary API |
| `pruneAuditLogs` | monthly | Keep 90 days of audit logs |

Uses `node-cron`. Idempotent — safe to run twice.
