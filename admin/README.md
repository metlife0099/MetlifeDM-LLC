# MetlifeDM · Admin Panel

The staff-facing operator console for **MetlifeDM LLC**. A completely separate React application (own deployment, own domain, own auth storage) that talks to the same backend as the public site.

**Design language:** Editorial Operator — the same warm-ivory / navy / electric-ultramarine DNA as the public site, tuned for data density with a white surface layer for cards and additional semantic tokens for status, charts, and success/warn/danger states.

---

## Stack

| Layer | Tech |
| :--- | :--- |
| Framework | React 19 · Vite 6 |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) |
| State | Redux Toolkit (auth + UI) · TanStack Query v5 (server state) |
| Routing | React Router v7 with lazy-loaded route modules |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Rich text | TipTap 2 (`starter-kit`, `link`, `image`, `placeholder`) |
| Animation | Framer Motion |
| Notifications | react-hot-toast (dark editorial theme) |
| HTTP | Axios (silent refresh · admin-scoped storage keys) |

---

## Project layout

```
admin/
├── index.html                        # noindex, admin title
├── vite.config.js                    # port 3100, API proxy, manual chunks
├── package.json                      # React 19 + Vite 6 + all deps
├── eslint.config.js                  # flat config
├── .env.example                      # every VITE_* var
├── public/
│   └── favicon.svg                   # dark navy admin favicon
└── src/
    ├── index.css                     # Tailwind v4 + admin @theme
    ├── main.jsx                      # provider stack + toast
    ├── App.jsx                       # every route, lazy-loaded
    ├── api/
    │   ├── client.js                 # axios instance, refresh, storage
    │   ├── endpoints.js              # every backend endpoint constant
    │   └── index.js                  # all API modules
    ├── store/
    │   └── index.js                  # Redux (auth + UI)
    ├── hooks/
    │   ├── index.js                  # useDebounce, useMediaQuery, etc.
    │   └── useAuth.js                # login, logout, hydrate, hasRole
    ├── utils/
    │   ├── format.js                 # money, dates, strings, cn()
    │   └── constants.js              # nav, roles, status options
    ├── providers/
    │   └── QueryProvider.jsx         # TanStack Query + DevTools
    ├── components/
    │   ├── auth/
    │   │   └── ProtectedAdminRoute.jsx
    │   ├── layout/
    │   │   ├── Sidebar.jsx           # grouped nav sections
    │   │   ├── Topbar.jsx            # search + notifications + user menu
    │   │   └── AdminLayout.jsx       # shell + mobile drawer
    │   ├── ui/
    │   │   ├── Button.jsx            # primary/ultra/ghost/outline/danger
    │   │   ├── DataTable.jsx         # sortable, paginated, selectable
    │   │   ├── Modal.jsx             # Modal, Drawer, ConfirmDialog
    │   │   ├── PageHeader.jsx        # PageHeader, Breadcrumbs, Tabs, FilterBar
    │   │   ├── RichEditor.jsx        # TipTap editor with toolbar
    │   │   ├── ErrorBoundary.jsx     # class-based boundary
    │   │   └── index.jsx             # Card, Badge, StatusPill, Kpi, Spinner, EmptyState
    │   └── form/
    │       └── index.jsx             # Input, Textarea, Select, Switch, MultiSelect, FileUpload, ImageUpload, SearchInput
    └── pages/
        ├── auth/LoginPage.jsx        # split-screen editorial login (+ 2FA)
        ├── dashboard/DashboardPage.jsx # KPIs + Recharts revenue + orders by status
        ├── content/
        │   ├── services/             # list + edit
        │   ├── portfolio/            # list + edit
        │   ├── case-studies/         # combined module
        │   ├── industries/           # combined module
        │   ├── blog/                 # posts (list+edit) + categories + comments
        │   ├── testimonials/         # inline modal CRUD
        │   ├── faqs/                 # inline modal CRUD
        │   └── pages/                # CMS page editor
        ├── careers/                  # jobs (list+edit) + applications review
        ├── leads/                    # contacts + consultations + subscribers
        ├── commerce/                 # orders (list+details) + payments + coupons
        ├── support/TicketsPage.jsx   # list + threaded conversation view
        ├── users/UsersPage.jsx       # list + profile with order history
        ├── media/MediaLibraryPage.jsx # grid upload + details drawer
        ├── analytics/AnalyticsPage.jsx # deeper KPIs + funnel + traffic
        ├── settings/                 # general settings + email templates
        ├── NotFoundPage.jsx
        └── ForbiddenPage.jsx
```

---

## Getting started

### Prerequisites

- Node.js 20+
- The **backend** (from Step 1+2) running at `http://localhost:5000`

### Setup

```bash
cd admin
cp .env.example .env
# edit .env — set VITE_API_URL_PROXY to your backend
npm install
npm run dev
```

The admin will be available at **http://localhost:3100**.

### Environment variables

```bash
VITE_API_URL=/api/v1                    # via Vite proxy
VITE_API_URL_PROXY=http://localhost:5000  # backend origin
VITE_ADMIN_URL=http://localhost:3100
VITE_PUBLIC_SITE_URL=http://localhost:3000
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=metlifedm_admin
VITE_ENABLE_REALTIME=true
```

---

## Auth & storage

**Important:** the admin panel uses *separate* localStorage keys from the public site so both can be logged in simultaneously on the same origin:

| Key | Purpose |
| :--- | :--- |
| `mdm_admin_access_token` | Admin JWT access token |
| `mdm_admin_user` | Cached user object |
| `mdm_admin_sidebar_collapsed` | UI preference |

The API client dispatches an `admin:logout` event on 401 refresh failure — the `useAuth` hook listens and redirects to `/login`. This is intentionally different from the public site's `auth:logout` event.

Only users with role `super_admin`, `admin`, `staff`, `editor`, or `support` can access the panel. `customer` role is rejected at both hydration and route level with a redirect to `/403`.

---

## Scripts

```bash
npm run dev       # start dev server on :3100
npm run build     # production build → dist/
npm run preview   # preview production build
npm run lint      # eslint flat config
npm run format    # prettier
```

---

## Design system

The admin extends the public "Editorial Analytics" system with these additions:

- **Surface layer** (`--color-surface: #FFFFFF`) — cards, tables, inputs sit on white against the ivory canvas
- **Graphite** (`--color-graphite: #2A3452`) — slightly softer ink for secondary text on dark surfaces
- **Semantic tokens** — `success/warn/danger/info` each with a `-soft` background variant
- **Chart palette** — 6 tuned colors used across all Recharts visualizations
- **Editorial devices maintained** — numbered pillars (`01/02/03`), `text-italic-fraunces` for accent words in titles, `num-plate` for KPIs and IDs, `text-eyebrow` for section labels

Signature patterns you'll see everywhere:
- Every list page: `PageHeader + FilterBar + DataTable + ConfirmDialog`
- Every edit page: `Breadcrumbs + PageHeader (with save action) + form sections in Card`
- All mutations: TanStack Query `useMutation` + `react-hot-toast` + `getErrorMessage(err)`

---

## What's implemented

Every module in the backend has a fully functional admin surface:

- ✅ **Dashboard** — KPI band + revenue chart + orders by status + top services + recent activity
- ✅ **Services** — full CRUD with pricing plans, process steps, features array
- ✅ **Portfolio** — CRUD with cover images, results metrics, services array
- ✅ **Case studies** — long-form editor with challenge/strategy/execution/outcome
- ✅ **Industries** — CRUD with challenges & solutions
- ✅ **Blog** — posts (rich editor + scheduling + publish), categories, comment moderation
- ✅ **Testimonials & FAQs** — modal-based inline CRUD
- ✅ **CMS Pages** — privacy/terms/cookies editor with TipTap
- ✅ **Jobs & Applications** — job posting + candidate review pipeline
- ✅ **Leads** — contact forms, consultation bookings, newsletter subscribers (CSV export)
- ✅ **Orders** — list + full detail view with items breakdown, timeline, refunds
- ✅ **Payments & Coupons** — Stripe transaction browser + promo code management
- ✅ **Support Tickets** — threaded conversation view with reply/notes/assignment
- ✅ **Users** — role management (super_admin only), suspend/activate, order history
- ✅ **Media Library** — grid + upload + Cloudinary URL copy
- ✅ **Analytics** — deeper charts, conversion funnel, traffic sources
- ✅ **Settings & Email Templates** — general config + TipTap-editable transactional emails

---

## Related projects

- `../backend/` — Node.js 20 + Express + Mongoose (delivered in Steps 1–2)
- `../frontend/` — React 19 public site (delivered in Steps 3–4)

Each is a separate deployment. All three talk to the same MongoDB Atlas database and Stripe account.
