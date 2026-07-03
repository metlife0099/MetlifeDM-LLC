import { Router } from 'express';
import * as c from '../controllers/service.controller.js';
import * as v from '../validators/service.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';
import { CACHE_KEYS, CACHE_TTL } from '../utils/constants.js';

const router = Router();

// Public
router.get(
  '/',
  cacheMiddleware((req) => `${CACHE_KEYS.SERVICES_LIST}:${JSON.stringify(req.query)}`, CACHE_TTL.MEDIUM),
  c.listServices
);
router.get('/categories', c.listCategories);
router.get('/slug/:slug', c.getServiceBySlug);

// Admin
router.get('/admin', requireAuth, requireAdmin, c.listAllAdmin);
router.get('/admin/:id', requireAuth, requireAdmin, c.getById);
router.post('/', requireAuth, requireAdmin, validate(v.serviceCreateSchema), c.createService);
router.patch('/:id', requireAuth, requireAdmin, validate(v.serviceUpdateSchema), c.updateService);
router.delete('/:id', requireAuth, requireAdmin, c.deleteService);

export default router;
