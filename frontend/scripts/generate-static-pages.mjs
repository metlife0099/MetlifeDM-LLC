import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SITE_URL = (process.env.VITE_SITE_URL || 'https://metlifedm.com').replace(/\/$/, '');
const DIST_DIR = path.resolve('dist');
const DEFAULT_IMAGE = `${SITE_URL}/og/default.jpg`;

const routes = {
  '/': ['Digital marketing built for USA businesses', 'MetlifeDM provides SEO, paid media, social growth, websites, and customer operations for growing US businesses.'],
  '/about': ['About MetlifeDM', 'Learn how MetlifeDM approaches practical, measurable digital marketing for growing businesses.'],
  '/services': ['Digital marketing services', 'Explore MetlifeDM services across SEO, paid media, social growth, websites, content, and customer operations.'],
  '/pricing': ['Digital marketing plans and pricing', 'Compare current MetlifeDM service plans. Prices and billing terms are verified against the live service catalog before checkout.'],
  '/growth-solutions': ['Growth solutions', 'Explore coordinated marketing, website, and customer-operation solutions built around your business goals.'],
  '/diagnostic': ['Digital growth diagnostic', 'Request a structured review of your visibility, positioning, website, conversion path, and growth priorities.'],
  '/pasco': ['PASCO growth framework', 'Explore MetlifeDM\'s practical framework for diagnosing, planning, activating, and improving digital growth.'],
  '/control': ['Marketing control and visibility', 'Build clearer oversight of your campaigns, customer journeys, reporting, and next actions.'],
  '/customer-service': ['Customer service operations', 'Scope a customer-service operation for enquiries, follow-up, booking, reviews, retention, and CRM workflows.'],
  '/projects': ['Digital projects', 'Discuss scoped website, landing-page, branding, campaign, integration, and marketing-system projects.'],
  '/seo': ['SEO plans', 'Review current search-growth plans and a structured SEO diagnostic from MetlifeDM.'],
  '/google-ads': ['Google Ads management plans', 'Review current paid-growth management plans, suggested media budgets, and diagnostic options.'],
  '/social-growth': ['Social growth plans', 'Review current social strategy and management plans from MetlifeDM.'],
  '/portfolio': ['Portfolio', 'Browse selected MetlifeDM work and client-approved project context.'],
  '/case-studies': ['Case studies', 'Explore client-approved examples of MetlifeDM strategy, execution, and reported outcomes.'],
  '/industries': ['Industries', 'Explore how MetlifeDM adapts digital strategy to different industries and customer journeys.'],
  '/partners': ['Partners', 'Explore referral, delivery, and strategic partnership opportunities with MetlifeDM.'],
  '/blog': ['Digital marketing insights', 'Read practical articles about SEO, paid media, social growth, websites, and customer operations.'],
  '/testimonials': ['Client testimonials', 'Read approved client feedback about working with MetlifeDM.'],
  '/faq': ['Frequently asked questions', 'Find answers about MetlifeDM services, proposals, billing, timelines, support, and working arrangements.'],
  '/careers': ['Careers', 'View current opportunities to work with MetlifeDM.'],
  '/contact': ['Contact MetlifeDM', 'Send MetlifeDM a question about services, an existing engagement, or a potential project.'],
  '/consultation': ['Request a consultation', 'Share preferred dates and project context for a consultation request. Availability is confirmed separately.'],
  '/privacy': ['Privacy Policy', 'Read how MetlifeDM collects, uses, stores, and protects personal information.'],
  '/terms': ['Terms and Conditions', 'Read the terms that apply to MetlifeDM website use, purchases, subscriptions, cancellations, and refunds.'],
  '/cookies': ['Cookie Policy', 'Read how MetlifeDM uses essential, analytics, and marketing cookies and how to update your preferences.'],
};

const privateRoutes = {
  '/cart': ['Cart', 'Review services saved in your cart.'],
  '/checkout': ['Checkout', 'Complete your MetlifeDM order securely.'],
  '/order-success': ['Order status', 'Review the current status of your MetlifeDM order.'],
  '/login': ['Log in', 'Log in to your MetlifeDM account.'],
  '/register': ['Create account', 'Create a MetlifeDM customer account.'],
  '/verify-email': ['Verify email', 'Verify your MetlifeDM account email address.'],
  '/forgot-password': ['Forgot password', 'Request a secure password reset.'],
  '/reset-password': ['Reset password', 'Set a new password for your MetlifeDM account.'],
  '/403': ['Access forbidden', 'You do not have permission to view this page.'],
};

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const replaceMeta = (html, attribute, key, value) => {
  const matcher = new RegExp(`<meta\\s+${attribute}=["']${key}["'][^>]*>`, 'i');
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`;
  return matcher.test(html) ? html.replace(matcher, tag) : html.replace('</head>', `  ${tag}\n</head>`);
};

const render = (template, route, title, description, noindex = false) => {
  const canonical = `${SITE_URL}${route === '/' ? '/' : route}`;
  const fullTitle = `${title} | MetlifeDM`;
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(fullTitle)}</title>`)
    .replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${canonical}" />`);

  html = replaceMeta(html, 'name', 'description', description);
  html = replaceMeta(html, 'property', 'og:title', title);
  html = replaceMeta(html, 'property', 'og:description', description);
  html = replaceMeta(html, 'property', 'og:url', canonical);
  html = replaceMeta(html, 'property', 'og:image', DEFAULT_IMAGE);
  html = replaceMeta(html, 'name', 'twitter:title', title);
  html = replaceMeta(html, 'name', 'twitter:description', description);
  html = replaceMeta(html, 'name', 'twitter:image', DEFAULT_IMAGE);
  html = replaceMeta(
    html,
    'name',
    'robots',
    noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  );
  html = replaceMeta(
    html,
    'name',
    'googlebot',
    noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  );

  const fallback = `<div id="root" data-static-shell><main style="max-width:72rem;margin:0 auto;padding:4rem 1.5rem;font-family:system-ui,sans-serif"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></main></div>`;
  return html.replace('<div id="root"></div>', fallback);
};

const writeRoute = async (route, html) => {
  if (route === '/') {
    await writeFile(path.join(DIST_DIR, 'index.html'), html);
    return;
  }
  const relative = route.slice(1);
  const directory = path.join(DIST_DIR, relative);
  await mkdir(directory, { recursive: true });
  await Promise.all([
    writeFile(path.join(directory, 'index.html'), html),
    writeFile(path.join(DIST_DIR, `${relative}.html`), html),
  ]);
};

const template = await readFile(path.join(DIST_DIR, 'index.html'), 'utf8');

for (const [route, [title, description]] of Object.entries(routes)) {
  await writeRoute(route, render(template, route, title, description));
}

for (const [route, [title, description]] of Object.entries(privateRoutes)) {
  await writeRoute(route, render(template, route, title, description, true));
}

const notFound = render(
  template,
  '/404',
  'Page not found',
  'The requested page does not exist. Return to the MetlifeDM home page or browse current services.',
  true
);
await writeFile(path.join(DIST_DIR, '404.html'), notFound);

process.stdout.write(`Generated raw HTML metadata for ${Object.keys(routes).length} public routes and ${Object.keys(privateRoutes).length} noindex routes.\n`);
