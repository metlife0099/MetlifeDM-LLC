import { Router } from 'express';
import * as c from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', c.list);
router.get('/unread-count', c.unreadCount);
router.patch('/read-all', c.markAllRead);
router.post('/read-all', c.markAllRead); // admin panel uses POST
router.patch('/:id/read', c.markRead);
router.post('/:id/read', c.markRead);   // admin panel uses POST
router.delete('/:id', c.remove);

export default router;
