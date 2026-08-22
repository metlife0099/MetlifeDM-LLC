# SEO rendering and routing

`npm run build` runs Vite and then `scripts/generate-static-pages.mjs`. The
second step emits raw HTML for every fixed public route, with a route-specific
title, description, canonical URL, Open Graph metadata, Twitter metadata, and
robots directive. It also emits noindex HTML for fixed account/transaction
routes and a real `404.html` document.

The Netlify `_redirects` and Vercel `routes` configurations serve generated
files first and return HTTP 404 for unknown top-level paths. Only these route
families retain an SPA fallback because their final segment comes from the API:

- `/services/:slug`
- `/portfolio/:slug`
- `/case-studies/:slug`
- `/industries/:slug`
- `/blog/:slug`
- `/careers/:slug`
- `/dashboard/*` (authenticated, noindex)

The six public CMS detail families still depend on client-side Helmet for their
record-specific metadata. A nonexistent slug in one of those families can
therefore still receive the SPA document with HTTP 200 before the API returns a
not-found result. Do not describe dynamic detail SEO or soft-404 handling as
fully solved until deployment adds one of the following:

1. fetch all published slugs during CI and emit one HTML file per record, while
   failing or invalidating the build when the catalog cannot be fetched; or
2. route those families through server/edge rendering that fetches the record,
   renders metadata, and returns HTTP 404 when it does not exist.

The current build deliberately does not fetch production CMS data. This keeps
deployments deterministic and avoids silently publishing stale or placeholder
metadata when the API is unavailable.
