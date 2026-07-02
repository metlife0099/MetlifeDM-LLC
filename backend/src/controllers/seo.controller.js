import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Service, Blog, Portfolio, CaseStudy, Industry, Page, Redirect, Settings } from '../models/index.js';
import { config } from '../config/index.js';

const escapeXml = (s = '') =>
  String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

const urlEntry = (loc, lastmod, changefreq = 'weekly', priority = 0.8) => `
  <url>
    <loc>${escapeXml(loc)}</loc>
    ${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

/* GET /sitemap.xml */
export const sitemap = asyncHandler(async (req, res) => {
  const base = config.urls.client;
  const staticUrls = [
    { path: '/', priority: 1.0, changefreq: 'daily' },
    { path: '/about', priority: 0.7 },
    { path: '/services', priority: 0.9, changefreq: 'daily' },
    { path: '/industries', priority: 0.7 },
    { path: '/portfolio', priority: 0.7 },
    { path: '/case-studies', priority: 0.8 },
    { path: '/blog', priority: 0.9, changefreq: 'daily' },
    { path: '/pricing', priority: 0.8 },
    { path: '/contact', priority: 0.7 },
    { path: '/consultation', priority: 0.7 },
    { path: '/careers', priority: 0.5 },
  ];

  const [services, blogs, portfolios, caseStudies, industries, pages] = await Promise.all([
    Service.find({ isPublished: true }).select('slug updatedAt').lean(),
    Blog.find({ status: 'published' }).select('slug updatedAt').lean(),
    Portfolio.find({ isPublished: true }).select('slug updatedAt').lean(),
    CaseStudy.find({ isPublished: true }).select('slug updatedAt').lean(),
    Industry.find({ isPublished: true }).select('slug updatedAt').lean(),
    Page.find({ isPublished: true }).select('slug updatedAt').lean(),
  ]);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.map((u) => urlEntry(`${base}${u.path}`, new Date(), u.changefreq || 'weekly', u.priority)).join('')}
${services.map((s) => urlEntry(`${base}/services/${s.slug}`, s.updatedAt, 'weekly', 0.8)).join('')}
${blogs.map((b) => urlEntry(`${base}/blog/${b.slug}`, b.updatedAt, 'weekly', 0.7)).join('')}
${portfolios.map((p) => urlEntry(`${base}/portfolio/${p.slug}`, p.updatedAt, 'monthly', 0.6)).join('')}
${caseStudies.map((c) => urlEntry(`${base}/case-studies/${c.slug}`, c.updatedAt, 'monthly', 0.7)).join('')}
${industries.map((i) => urlEntry(`${base}/industries/${i.slug}`, i.updatedAt, 'monthly', 0.6)).join('')}
${pages.map((p) => urlEntry(`${base}/${p.slug}`, p.updatedAt, 'monthly', 0.5)).join('')}
</urlset>`;

  res.header('Content-Type', 'application/xml').send(xml.trim());
});

/* GET /robots.txt */
export const robots = asyncHandler(async (req, res) => {
  const settings = await Settings.getGlobal();
  const custom = settings.seo?.robotsTxt || `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api`;
  const withSitemap = `${custom}\n\nSitemap: ${config.urls.client}/sitemap.xml`;
  res.header('Content-Type', 'text/plain').send(withSitemap);
});

/* Redirects */
export const redirects = {
  list: asyncHandler(async (req, res) => {
    const items = await Redirect.find().sort({ createdAt: -1 });
    return ApiResponse.ok(res, items, 'Redirects');
  }),
  create: asyncHandler(async (req, res) => {
    const r = await Redirect.create({ ...req.body, createdBy: req.user._id });
    return ApiResponse.created(res, { redirect: r }, 'Redirect created');
  }),
  update: asyncHandler(async (req, res) => {
    const r = await Redirect.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!r) throw ApiError.notFound('Redirect not found');
    return ApiResponse.ok(res, { redirect: r }, 'Updated');
  }),
  remove: asyncHandler(async (req, res) => {
    const r = await Redirect.findByIdAndDelete(req.params.id);
    if (!r) throw ApiError.notFound('Redirect not found');
    return ApiResponse.ok(res, null, 'Deleted');
  }),
  check: asyncHandler(async (req, res) => {
    const r = await Redirect.findOne({ from: req.query.path, isActive: true });
    if (!r) return ApiResponse.ok(res, null, 'No redirect');
    Redirect.updateOne({ _id: r._id }, { $inc: { hitCount: 1 }, lastHitAt: new Date() }).catch(() => {});
    return ApiResponse.ok(res, { to: r.to, statusCode: r.statusCode }, 'Redirect');
  }),
};
