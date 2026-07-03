import { Router } from 'express';
import * as c from '../controllers/settings.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';
import { CACHE_KEYS, CACHE_TTL } from '../utils/constants.js';

const router = Router();

router.get('/public', cacheMiddleware(() => `${CACHE_KEYS.SETTINGS}:public`, CACHE_TTL.LONG), c.getPublic);
router.get('/', requireAuth, requireAdmin, c.getAdmin);
router.patch('/', requireAuth, requireAdmin, c.update);

export default router;
