import { Router } from 'express';
import * as c from '../controllers/admin.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/dashboard', c.dashboard);
router.get('/charts', c.charts);
router.get('/recent-activity', c.recentActivity);
router.get('/audit-logs', c.auditLogs);

export default router;
