# Deployment

Three separate deployments talking to one shared backing store.

## Recommended topology

| Component | Recommended host | Why |
| :--- | :--- | :--- |
| Backend API | **Railway** or **Fly.io** | Long-running Node process, easy Redis addon, cheap eastern-US regions close to Atlas |
| Public frontend | **Vercel Pro** or **Cloudflare Pages** | Static build, edge cache, commercial production plan |
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
- [ ] Google Gemini API key if using AI chat features
- [ ] Domain names configured in DNS (A / CNAME records ready)
- [ ] SSL certificates (host will handle if using Vercel/Railway; Let's Encrypt if self-hosted)

---

## Backend deployment — Railway

1. **Create project.** Push the `backend/` directory to a Git repo (or the whole monorepo with `backend/` as the source directory).
2. **Add services.** In Railway: New Project → Deploy from GitHub. Add a Redis instance from the marketplace.
3. **Configure environment variables** — copy every var from `.env.example` and fill with production values. Reference the Redis service's `REDIS_URL` from the environment.
4. **Configure the pre-deploy migration.** Run `npm run db:indexes` against the target database before each application rollout. The deployment must stop if this command detects duplicates or cannot create a declared index; checkout idempotency depends on these unique indexes.
5. **Set start command.** Railway auto-detects `npm start`. Ensure `package.json` has:
   ```json
   "scripts": { "start": "node src/server.js" }
   ```
6. **Deploy.** Railway builds automatically. Configure its liveness check to hit `GET /health` and its readiness check to hit `GET /ready`.
7. **Configure Stripe webhook.** In Stripe Dashboard → Developers → Webhooks:
   - Endpoint URL: `https://api.metlifedm.com/api/v1/webhooks/stripe`
   - Select every payment, invoice, refund, dispute, and subscription lifecycle event listed in the production release checklist. Keep this list synchronized with the webhook handler when it changes.
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy.
8. **Attach custom domain.** In Railway settings → Networking → add `api.metlifedm.com`. Set CNAME in your DNS provider.

**Liveness check.** Once live, `GET https://api.metlifedm.com/health` should return HTTP 200 while the process is running. `GET https://api.metlifedm.com/ready` must return HTTP 200 only when required backing services are ready. Do not send normal traffic to an instance whose readiness check fails.
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
   ```
   Do NOT set `VITE_API_URL_PROXY` in production — that's a dev-only Vite proxy target.
4. **Build command:** `npm run build` (default).
5. **Output directory:** `dist` (default).
6. **Deploy.**
7. **Custom domain.** Add `metlifedm.com` and `www.metlifedm.com`. Vercel handles SSL + www → apex redirect.

**Rewrites and headers:**
Deploy the checked-in `frontend/vercel.json`. It contains the SPA fallback and production security headers; do not replace it with a bare catch-all rewrite.

---

## Admin deployment — Vercel

Same steps as frontend but:

- Root directory: `admin/`
- Environment:
  ```
  VITE_API_URL=https://api.metlifedm.com/api/v1
  VITE_PUBLIC_SITE_URL=https://metlifedm.com
  VITE_SOCKET_URL=https://api.metlifedm.com
  VITE_ENABLE_REALTIME=true
  ```
- Custom domain: `admin.metlifedm.com`
- Deploy the checked-in `admin/vercel.json` (admin-specific headers and SPA rewrite).

**Important:** In production, backend `CORS` must allow both frontend and admin origins. Backend `.env`:

```bash
CLIENT_URL=https://metlifedm.com
ADMIN_URL=https://admin.metlifedm.com
```

Set the explicit allowlist as well; the middleware reads `CORS_ORIGINS` and does not infer it from the URL variables:

```bash
CORS_ORIGINS=https://metlifedm.com,https://admin.metlifedm.com
```

Never include wildcard origins with credentialed requests. Add localhost origins only in development.

---

## Cookies in production

The refresh token cookie is `httpOnly`, `Secure`, and `SameSite=Lax` in production. Leave `COOKIE_DOMAIN` blank so it remains host-only to `api.metlifedm.com`; the browser will still send it on credentialed requests to that API host. Setting `.metlifedm.com` unnecessarily exposes the cookie to every sibling subdomain. Both browser apps must use credentialed API requests, and the API must return the exact requesting origin with `Access-Control-Allow-Credentials: true`.

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

Create your first super admin with the repository seed job after setting the seed environment variables:

```bash
npm run seed
```

Run it once from a secured operator environment, rotate/remove the seed password afterward, and verify the account is protected with 2FA. Do not promote users by editing MongoDB manually; that bypasses application validation and audit logging.

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
- [ ] Set up liveness monitoring on `/health` and readiness monitoring on `/ready`
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

- **Uptime:** monitor `/health` for process liveness and `/ready` for dependency readiness
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
| Vercel (2 sites in one team) | Pro plan plus any metered overage; confirm current pricing before launch |
| Cloudinary | $0 (free 25 credits) |
| Brevo | $0 (free 300/day) |
| Stripe | 2.9% + $0.30 per transaction |
| Domain + Cloudflare | $12/yr + $0 |
| **Total** | **~$70–100/month** before Stripe fees |

Scale hits when traffic grows — Atlas is the biggest lever.
