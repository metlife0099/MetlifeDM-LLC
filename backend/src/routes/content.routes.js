import { Router } from 'express';
import { industry, portfolio, caseStudy } from '../controllers/content.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const build = (ctrl) => {
  const r = Router();
  r.get('/', ctrl.list);
  r.get('/slug/:slug', ctrl.bySlug);
  r.get('/admin/:id', requireAuth, requireAdmin, ctrl.getById);
  r.post('/', requireAuth, requireAdmin, ctrl.create);
  r.patch('/:id', requireAuth, requireAdmin, ctrl.update);
  r.delete('/:id', requireAuth, requireAdmin, ctrl.remove);
  return r;
};

export const industryRoutes = build(industry);
export const portfolioRoutes = build(portfolio);
export const caseStudyRoutes = build(caseStudy);
