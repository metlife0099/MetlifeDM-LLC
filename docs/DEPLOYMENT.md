# Deployment

Three separate deployments talking to one shared backing store.

## Recommended topology

| Component | Recommended host | Why |
| :--- | :--- | :--- |
| Backend API | **Railway** or **Fly.io** | Long-running Node process, easy Redis addon, cheap eastern-US regions close to Atlas |
| Public frontend | **Vercel** or **Cloudflare Pages** | Static build, edge cache, free tier fine |
| Admin console | Same host as frontend, separate subdomain (`admin.metlifedm.com`) | Same static model |
| MongoDB | **MongoDB Atlas** M10+ | Region-local to backend; use dedicated cluster, not free tier |
| Redis | **Upstash Redis** or **Railway** addon | Serverless option keeps costs down; TLS required in prod |
| Media | **Cloudinary Free/Plus** | Auto-WebP, transformations, CDN built in |
| Email | **Brevo** or **Postmark** | Transactional, high deliverability |
| Payments | **Stripe** | Standard integration |

DNS suggestion:

```
metlifedm.com         → public frontend
www.metlifedm.com     → 301 redirect to apex
admin.metlifedm.com   → admin console
api.metlifedm.com     → backend API
```

---

## Prerequisites checklist

Before deploying, confirm you have:

- [ ] MongoDB Atlas connection string (with a user that has readWrite on the database)
- [ ] Redis URL (with password if enabled)
- [ ] Two random 64-char secrets — one for JWT access, one for JWT refresh (never the same)
- [ ] Stripe secret key (`sk_live_...`) and webhook signing secret (`whsec_...`)
- [ ] Cloudinary cloud name + API key + secret + a signed upload preset
- [ ] SMTP credentials (Brevo host + port + user + pass)
- [ ] OpenAI API key if using AI chat features
- [ ] Domain names configured in DNS (A / CNAME records ready)
- [ ] SSL certificates (host will handle if using Vercel/Railway; Let's Encrypt if self-hosted)

---

## Backend deployment — Railway

1. **Create project.** Push the `backend/` directory to a Git repo (or the whole monorepo with `backend/` as the source directory).
2. **Add services.** In Railway: New Project → Deploy from GitHub. Add a Redis instance from the marketplace.
3. **Configure environment variables** — copy every var from `.env.example` and fill with production values. Reference the Redis service's `REDIS_URL` from the environment.
4. **Set start command.** Railway auto-detects `npm start`. Ensure `package.json` has:
   ```json
   "scripts": { "start": "node src/server.js" }
   ```
5. **Deploy.** Railway builds automatically. Health check hits `GET /health`.
6. **Configure Stripe webhook.** In Stripe Dashboard → Developers → Webhooks:
   - Endpoint URL: `https://api.metlifedm.com/api/v1/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `invoice.paid`, `customer.subscription.updated`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy.
7. **Attach custom domain.** In Railway settings → Networking → add `api.metlifedm.com`. Set CNAME in your DNS provider.

**Health check.** Once live, `GET https://api.metlifedm.com/api/v1/health` should return:
```json
{ "success": true, "data": { "status": "ok", "uptime": 42 } }
```

---

## Frontend deployment — Vercel

1. **Import project.** Vercel Dashboard → Import → select the repo, set root directory to `frontend/`.
2. **Framework preset.** Vite.
3. **Environment variables:**
   ```
   VITE_API_URL=https://api.metlifedm.com/api/v1
   VITE_SITE_URL=https://metlifedm.com
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   VITE_CLOUDINARY_CLOUD_NAME=...
   ```
   Do NOT set `VITE_API_URL_PROXY` in production — that's a dev-only Vite proxy target.
4. **Build command:** `npm run build` (default).
5. **Output directory:** `dist` (default).
6. **Deploy.**
7. **Custom domain.** Add `metlifedm.com` and `www.metlifedm.com`. Vercel handles SSL + www → apex redirect.

**Rewrites** — add `vercel.json` to `frontend/` for SPA routing:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Admin deployment — Vercel

Same steps as frontend but:

- Root directory: `admin/`
- Environment:
  ```
  VITE_API_URL=https://api.metlifedm.com/api/v1
  VITE_ADMIN_URL=https://admin.metlifedm.com
  VITE_PUBLIC_SITE_URL=https://metlifedm.com
  VITE_CLOUDINARY_CLOUD_NAME=...
  VITE_CLOUDINARY_UPLOAD_PRESET=metlifedm_admin
  VITE_ENABLE_REALTIME=true
  ```
- Custom domain: `admin.metlifedm.com`
- `vercel.json` (SPA rewrites, same as frontend)

**Important:** In production, backend `CORS` must allow both frontend and admin origins. Backend `.env`:

```bash
CLIENT_URL=https://metlifedm.com
ADMIN_URL=https://admin.metlifedm.com
```

The CORS middleware in `backend/src/config/index.js` reads both and adds them to the allowlist. Also allow `http://localhost:*` in dev only.

---

## Cookies in production

The refresh token cookie is `httpOnly`, `Secure`, and `SameSite=Strict` in production. Because the frontend/admin and backend live on different subdomains, you must configure the cookie with a leading dot on the parent domain:

```js
// backend/src/config/index.js
cookieOptions: {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',        // 'strict' breaks cross-subdomain redirects
  domain: process.env.NODE_ENV === 'production' ? '.metlifedm.com' : undefined,
  maxAge: 30 * 24 * 60 * 60 * 1000,
}
```

Without the `domain: '.metlifedm.com'`, the cookie set by `api.metlifedm.com` won't be sent by the browser when the frontend at `metlifedm.com` calls back to the API. This is the #1 cause of "refresh token missing" errors after deployment.

---

## MongoDB Atlas setup

1. Create an M10 cluster (dedicated, not shared) in the same region as your backend host.
2. Create a database user with a strong password. Note it for `MONGO_URI`.
3. Whitelist IPs. Options:
   - Allow all (`0.0.0.0/0`) — easiest, secure via strong auth.
   - Whitelist Railway/Fly egress ranges (they publish them).
   - Use Atlas Private Endpoint if you need extra hardening.
4. Enable backups — daily snapshots, 7-day retention minimum.
5. Enable Performance Advisor and turn on query profiling for the first few weeks.

---

## Seed data

Create your first super admin. From the backend directory:

```bash
node scripts/seed-admin.js --email=you@example.com --password=<strong-password>
```

Or manually: register via `POST /auth/register`, then in Atlas → your DB → `users` collection, find your document and change `role` from `"customer"` to `"super_admin"`. Save.

Then log into `https://admin.metlifedm.com/login` with that email.

---

## Post-launch checklist

Once everything is up:

- [ ] `https://metlifedm.com/sitemap.xml` returns 200 with URL entries
- [ ] `https://metlifedm.com/robots.txt` returns 200 with `Sitemap:` line
- [ ] Submit sitemap to [Google Search Console](https://search.google.com/search-console) and [Bing Webmaster](https://www.bing.com/webmasters)
- [ ] Verify Stripe webhook events flowing (Stripe Dashboard → Webhooks → your endpoint → recent deliveries)
- [ ] Send a test email from admin → Settings → Email templates → Test send
- [ ] Trigger a real order end-to-end in Stripe test mode. Confirm order appears in admin.
- [ ] Configure Google Analytics 4 / GTM in admin → Settings → Integrations
- [ ] Set up an uptime monitor (BetterUptime, Pingdom) hitting `/api/v1/health`
- [ ] Set up Sentry or LogTail for error tracking
- [ ] Configure daily MongoDB backups
- [ ] Enable Cloudflare in front of the frontend for DDoS protection

---

## Rollback

Vercel keeps every previous deployment. From the dashboard: Deployments → click the last known good one → Promote to production.

Railway: Deployments → old build → Redeploy.

Database rollback requires a snapshot restore — Atlas → Backups → Restore. **Always take a manual snapshot before running a migration.**

---

## Monitoring

Recommended stack:

- **Uptime:** BetterUptime hitting `/api/v1/health` every minute
- **Errors:** Sentry (Node SDK for backend, browser SDK for both frontends)
- **Logs:** LogTail or Papertrail — Winston already writes JSON, easy to ingest
- **APM:** Datadog if traffic warrants
- **Business metrics:** admin dashboard already shows revenue, orders, conversions — plug into Slack via `/admin/notifications` webhook for daily digests

---

## Cost estimate (early production)

Rough monthly for a low-traffic launch:

| Item | Cost |
| :--- | :--- |
| Railway backend | $10–20 |
| Upstash Redis | $0 (free tier) |
| MongoDB Atlas M10 | $57 |
| Vercel (2 sites) | $0 (hobby) or $20/mo Pro if needed |
| Cloudinary | $0 (free 25 credits) |
| Brevo | $0 (free 300/day) |
| Stripe | 2.9% + $0.30 per transaction |
| Domain + Cloudflare | $12/yr + $0 |
| **Total** | **~$70–100/month** before Stripe fees |

Scale hits when traffic grows — Atlas is the biggest lever.
