import { Router } from 'express';
import * as c from '../controllers/seo.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Public
router.get('/sitemap.xml', c.sitemap);
router.get('/robots.txt', c.robots);
router.get('/redirects/check', c.redirects.check);

// Admin
router.get('/redirects', requireAuth, requireAdmin, c.redirects.list);
router.post('/redirects', requireAuth, requireAdmin, c.redirects.create);
router.patch('/redirects/:id', requireAuth, requireAdmin, c.redirects.update);
router.delete('/redirects/:id', requireAuth, requireAdmin, c.redirects.remove);

export default router;
