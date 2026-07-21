import { Router } from 'express';
import * as c from '../controllers/blog.controller.js';
import * as v from '../validators/blog.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public
router.get('/', c.list);
router.get('/categories', c.category.list);
router.get('/slug/:slug', optionalAuth, c.bySlug);
router.post('/:id/like', c.like);
router.post('/:id/comment', requireAuth, validate(v.commentSchema), c.addComment);
router.post('/:id/comments/:commentId/like', requireAuth, c.likeComment);

// Admin
router.get('/admin', requireAuth, requireAdmin, c.listAdmin);
router.get('/admin/:id', requireAuth, requireAdmin, c.getById);
router.post('/', requireAuth, requireAdmin, validate(v.blogCreateSchema), c.create);
router.patch('/:id', requireAuth, requireAdmin, validate(v.blogUpdateSchema), c.update);
router.delete('/:id', requireAuth, requireAdmin, c.remove);
router.patch('/:id/comments/:commentId', requireAuth, requireAdmin, c.moderateComment);

router.post('/categories', requireAuth, requireAdmin, validate(v.categorySchema), c.category.create);
router.patch('/categories/:id', requireAuth, requireAdmin, c.category.update);
router.delete('/categories/:id', requireAuth, requireAdmin, c.category.remove);

export default router;
