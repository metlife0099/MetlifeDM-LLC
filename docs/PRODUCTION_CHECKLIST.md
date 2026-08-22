# Production release checklist

The repository can enforce code quality and safe payment state transitions, but a
production release is not complete until the external services below are configured
and verified in their live dashboards.

## Required release gates

- [ ] All three CI jobs pass from `.github/workflows/ci.yml`.
- [ ] The backend readiness endpoint reports healthy database and Redis connections.
- [ ] `npm run db:indexes` has succeeded against the target MongoDB database before serving traffic; retain its output with the release record.
- [ ] Production secrets are unique, stored in the hosting provider, and absent from Git.
- [ ] `CLIENT_URL`, `ADMIN_URL`, `SERVER_URL`, `CORS_ORIGINS`, and cookie settings match the final HTTPS domains.
- [ ] Database backups and a tested restore procedure are enabled.
- [ ] Centralized logs, error reporting, uptime monitoring, and payment alerts are enabled.

## Stripe

- [ ] Use live-mode publishable and secret keys only in the production environments.
- [ ] Create a Stripe Product and Price for every recurring service plan and store each Price ID on the plan.
- [ ] Configure the webhook endpoint using the exact production API URL and signing secret.
- [ ] Subscribe to every event listed in the deployment guide, including payment, refund, invoice, and subscription lifecycle events.
- [ ] Verify full refund, partial refund, failed payment, retry, cancellation, duplicate webhook delivery, and subscription renewal in Stripe test mode.
- [ ] Confirm that the amount rendered by checkout equals the server-created order and Stripe amount before entering live mode.
- [ ] Enable Stripe fraud controls and review the Radar rules for the expected customer geography.
- [ ] Have an accountant confirm the tax treatment of each service and configure Stripe Tax/tax codes before collecting taxable sales; the application must not assume a universal 0% rate.

## Email, media, and AI

- [ ] Authenticate the sending domain with SPF, DKIM, and DMARC and test every transactional template.
- [ ] Restrict Cloudinary credentials and upload formats; verify deletion and retention behavior.
- [ ] If AI chat is enabled, set a production Gemini key, monitor usage, and verify the human-handoff path.
- [ ] If an optional integration is not configured, explicitly disable its feature flag rather than shipping a broken control.

## Browser applications

- [ ] Deploy the public and admin builds behind HTTPS with the supplied security headers and SPA rewrites.
- [ ] Confirm analytics remains disabled until the visitor grants analytics consent and can be revoked later.
- [ ] Validate sitemap, robots, canonical URLs, social cards, and real HTTP 404 behavior at the edge.
- [ ] Run keyboard-only, screen-reader smoke, mobile-device, and cross-browser checks on login, checkout, refund, and support flows.

## Final smoke test

Use a fresh customer and a separate non-super-admin operator account. Complete a
test-mode purchase, verify the signed webhook updates the order exactly once,
download the invoice, issue a partial refund, issue the remaining refund, and confirm
the customer and admin screens match Stripe after every step. Keep the Stripe event
IDs and application logs with the release record.
