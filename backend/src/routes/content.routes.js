import { Router } from 'express';
import { industry, portfolio, portfolioCategory, caseStudy, caseStudyCategory } from '../controllers/content.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const build = (ctrl, categoryCtrl) => {
  const r = Router();
  // Category routes are registered before the generic `/:id` ones below so
  // "categories" is never swallowed as an `:id` param value.
  if (categoryCtrl) {
    r.get('/categories', categoryCtrl.list);
    r.post('/categories', requireAuth, requireAdmin, categoryCtrl.create);
    r.patch('/categories/:id', requireAuth, requireAdmin, categoryCtrl.update);
    r.delete('/categories/:id', requireAuth, requireAdmin, categoryCtrl.remove);
  }
  r.get('/', ctrl.list);
  r.get('/slug/:slug', ctrl.bySlug);
  r.get('/admin/:id', requireAuth, requireAdmin, ctrl.getById);
  r.post('/', requireAuth, requireAdmin, ctrl.create);
  r.patch('/:id', requireAuth, requireAdmin, ctrl.update);
  r.delete('/:id', requireAuth, requireAdmin, ctrl.remove);
  return r;
};

export const industryRoutes = build(industry);
export const portfolioRoutes = build(portfolio, portfolioCategory);
export const caseStudyRoutes = build(caseStudy, caseStudyCategory);

// Customer-facing PDF download — distinct segment from `/slug/:slug` so it
// can't be shadowed by (or shadow) the generic bySlug route.
caseStudyRoutes.get('/slug/:slug/pdf', caseStudy.downloadPdf);
