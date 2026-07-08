<div align="center">

# MetlifeDM LLC

**Enterprise digital marketing agency platform for USA businesses.**

Three-project MERN stack: a Node.js API, a React 19 public site, and a React 19 admin console — sharing one MongoDB database, one Stripe account, and one editorial design language.

[![Node](https://img.shields.io/badge/Node-20+-1547FF?style=flat-square)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-1547FF?style=flat-square)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-128260?style=flat-square)](https://www.mongodb.com)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-7D3AC1?style=flat-square)](https://stripe.com)
[![License](https://img.shields.io/badge/license-Proprietary-0A1730?style=flat-square)](#license)

</div>

---

## Table of contents

- [What this is](#what-this-is)
- [Project layout](#project-layout)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Design system](#design-system)
- [Documentation](#documentation)
- [Deployment](#deployment)
- [License](#license)

---

## What this is

MetlifeDM LLC is a full-service digital marketing agency platform. The platform runs three distinct applications:

| Application | Port (dev) | Purpose |
| :--- | :--- | :--- |
| **Backend API** | `5000` | Node/Express REST API. Auth, content, commerce, tickets, analytics. |
| **Public frontend** | `3000` | Marketing site + customer portal. Services, blog, checkout, dashboard. |
| **Admin console** | `3100` | Staff-only operator UI. CMS, orders, tickets, users, analytics. |

All three deploy independently, all three read from the same MongoDB Atlas database, and all three use the same Stripe account and Cloudinary media library.

---

## Project layout

```
metlifedm-llc/
├── backend/                    # Node.js 20 + Express + Mongoose 8
│   ├── src/
│   │   ├── config/             # DB, redis, logger, env
│   │   ├── controllers/        # Route handlers (auth, service, blog, order…)
│   │   ├── middleware/         # auth, validation, upload, rate-limit
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # Express routers
│   │   ├── services/           # Stripe, email, cloudinary, redis, socket
│   │   ├── sockets/            # Socket.io handlers (tickets, chat)
│   │   ├── jobs/               # node-cron scheduled jobs
│   │   ├── templates/emails/   # Handlebars email templates
│   │   ├── utils/              # ApiResponse, ApiError, pagination
│   │   └── validators/         # Zod schemas
│   ├── uploads/                # Local upload buffer (cleared on Cloudinary sync)
│   └── logs/                   # Winston daily-rotate log files
│
├── frontend/                   # Public marketing site + customer portal
│   ├── public/                 # Static assets, robots.txt, favicon
│   └── src/
│       ├── api/                # Axios client + endpoint modules
│       ├── components/         # UI, layout, sections, forms, seo
│       ├── hooks/              # useAuth, useDebounce, useMediaQuery…
│       ├── pages/              # Route components (marketing + app)
│       ├── providers/          # QueryProvider, ThemeProvider
│       ├── store/              # Redux slices (auth + UI)
│       └── utils/              # format, constants, animations
│
└── admin/                      # Staff-only operator console
    ├── public/
    └── src/                    # Same shape as frontend/ but data-density UI
```

Each of the three projects has its own `package.json`, `node_modules`, `.env`, and README.

---

## Tech stack

### Backend

| Layer | Technology |
| :--- | :--- |
| Runtime | Node.js 20 LTS |
| Framework | Express 4 (ES Modules only) |
| Database | MongoDB Atlas + Mongoose 8 |
| Cache & queues | Redis (ioredis) |
| Auth | JWT (access + refresh rotation), bcrypt, 2FA (speakeasy TOTP) |
| Payments | Stripe (Payment Intents + webhooks) |
| Media | Cloudinary (auto-WebP, transformations) |
| Email | Brevo SMTP via Nodemailer + Handlebars |
| Realtime | Socket.io (tickets, chat, notifications) |
| AI | OpenAI (`gpt-4o-mini`) — chat, content suggestions |
| Validation | Zod |
| Logging | Winston + daily-rotate-file |
| Security | Helmet, CORS, express-mongo-sanitize, xss, hpp, express-rate-limit |
| Docs | Swagger UI (`/api/docs`) |
| Scheduling | node-cron |

### Frontend & Admin

| Layer | Technology |
| :--- | :--- |
| Framework | React 19 + Vite 6 |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) |
| Routing | React Router v7 |
| State | Redux Toolkit + TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion + GSAP + Lenis |
| Charts (admin) | Recharts |
| Rich text (admin) | TipTap 2 |
| Icons | Lucide React |
| Meta / SEO | React Helmet Async |
| Notifications | react-hot-toast |

---

## Quick start

### Prerequisites

- **Node.js 20+** — verify with `node --version`
- **MongoDB Atlas cluster** — or local MongoDB
- **Redis instance** — Upstash, Redis Cloud, or local
- **Stripe account** with test keys + a webhook signing secret
- **Cloudinary account** with an unsigned upload preset
- **Brevo (or any SMTP) account** for transactional email

### First run

Clone the repo, then install and run each project in a separate terminal:

```bash
# Terminal 1 — backend API
cd backend
cp .env.example .env      # fill in secrets (see below)
npm install
npm run dev               # http://localhost:5000

# Terminal 2 — public frontend
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:3000

# Terminal 3 — admin console
cd admin
cp .env.example .env
npm install
npm run dev               # http://localhost:3100
```

Create your first admin user with a small seed script (see `docs/DEPLOYMENT.md`) or by hitting `POST /api/v1/auth/register` and manually flipping `role` to `super_admin` in Mongo.

---

## Environment variables

Each project has its own `.env.example` — the highlights:

### `backend/.env`

```bash
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
ADMIN_URL=http://localhost:3100

# DB & cache
MONGO_URI=mongodb+srv://...
REDIS_URL=redis://localhost:6379

# Auth
JWT_ACCESS_SECRET=<64-char random>
JWT_REFRESH_SECRET=<64-char random, different from access>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_UPLOAD_PRESET=metlifedm

# Email (Brevo)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM="MetlifeDM <team@metlifedm.com>"

# OpenAI (optional)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### `frontend/.env`

```bash
VITE_API_URL=/api/v1
VITE_API_URL_PROXY=http://localhost:5000
VITE_SITE_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_CLOUDINARY_CLOUD_NAME=...
```

### `admin/.env`

```bash
VITE_API_URL=/api/v1
VITE_API_URL_PROXY=http://localhost:5000
VITE_ADMIN_URL=http://localhost:3100
VITE_PUBLIC_SITE_URL=http://localhost:3000
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=metlifedm_admin
VITE_ENABLE_REALTIME=true
```

Full variable reference lives in each project's `.env.example`.

---

## Available scripts

Each project supports:

```bash
npm run dev        # start dev server (nodemon / vite)
npm run build      # production build
npm run start      # run production build (backend only)
npm run preview    # preview built frontend/admin
npm run lint       # eslint
npm run format     # prettier
```

Backend additionally:

```bash
npm run seed       # seed database (admin user, services, etc.)
npm run docs       # regenerate Swagger docs
```

---

## Design system

The public site and admin console share the **Editorial Analytics / Editorial Operator** design DNA:

| Token | Value | Usage |
| :--- | :--- | :--- |
| Canvas | `#F5F1E8` (warm ivory) | Page background |
| Surface | `#FFFFFF` | Admin cards, tables, inputs |
| Ink | `#0A1730` (deep navy) | Primary text, sidebar, dark panels |
| Ultra | `#1547FF` (electric ultramarine) | CTAs, links, accents |
| Sand | `#EAE4D4` | Subtle borders, hover states |
| Slate | `#727D96` | Secondary text |

**Typography:**
- **Fraunces** (variable serif) — display, hero, italic accent words
- **Inter** — body copy
- **JetBrains Mono** — labels, metrics, IDs, timestamps

**Signature devices:**
- Numbered pillars: `01/02/03` at the start of section titles
- `text-italic-fraunces` for the accent word in headings
- `text-eyebrow`: mono uppercase tracked 0.14em, used above every title
- `num-plate`: tabular-nums for KPIs, order numbers, dates

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full design token reference.

---

## Documentation

| Doc | Purpose |
| :--- | :--- |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System diagram, data flow, design tokens |
| [`docs/API.md`](docs/API.md) | REST API reference by module (auth, content, commerce…) |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Production deployment: Vercel/Railway/AWS + Stripe webhooks |
| [`docs/SEO.md`](docs/SEO.md) | SEO configuration: meta tags, structured data, Search Console |
| [`docs/SITEMAP.md`](docs/SITEMAP.md) | Sitemap structure, dynamic generation, submission |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Coding conventions, branch strategy, commit format |

Each sub-project also has its own README:

- [`backend/README.md`](backend/README.md)
- [`frontend/README.md`](frontend/README.md)
- [`admin/README.md`](admin/README.md)

Swagger API docs are served at `http://localhost:5000/api/docs` when the backend is running.

---

## Deployment

TL;DR — three separate deployments talking to the same MongoDB + Stripe + Cloudinary:

| Component | Recommended host | Notes |
| :--- | :--- | :--- |
| Backend API | Railway, Fly.io, Render, or AWS EC2 | Long-running Node process, needs Redis and outbound to Stripe |
| Public frontend | Vercel, Netlify, or Cloudflare Pages | Static build, edge cache-friendly |
| Admin console | Same host, separate subdomain (e.g. `admin.metlifedm.com`) | Same static build model |
| Stripe webhook | Points to `https://api.metlifedm.com/api/v1/webhooks/stripe` | Requires the webhook signing secret |

Full step-by-step in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## License

Proprietary. © MetlifeDM LLC. All rights reserved.
