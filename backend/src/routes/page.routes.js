import { Router } from 'express';
import * as c from '../controllers/page.controller.js';
import * as v from '../validators/page.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', c.list);
router.get('/slug/:slug', c.bySlug);
router.get('/admin', requireAuth, requireAdmin, c.listAdmin);
router.get('/admin/:id', requireAuth, requireAdmin, c.getById);
router.post('/', requireAuth, requireAdmin, validate(v.pageCreateSchema), c.create);
router.patch('/:id', requireAuth, requireAdmin, validate(v.pageUpdateSchema), c.update);
router.delete('/:id', requireAuth, requireAdmin, c.remove);

export default router;
