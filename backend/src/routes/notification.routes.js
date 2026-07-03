import { Router } from 'express';
import * as c from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', c.list);
router.get('/unread-count', c.unreadCount);
router.patch('/read-all', c.markAllRead);
router.patch('/:id/read', c.markRead);
router.delete('/:id', c.remove);

export default router;
