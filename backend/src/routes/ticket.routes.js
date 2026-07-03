import { Router } from 'express';
import * as c from '../controllers/ticket.controller.js';
import * as v from '../validators/ticket.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth);

// Self
router.post('/', validate(v.createTicketSchema), c.create);
router.get('/mine', c.listMine);
router.get('/:id', c.get);
router.post('/:id/reply', validate(v.replyTicketSchema), c.reply);

// Admin
router.get('/', requireAdmin, c.listAll);
router.patch('/:id', requireAdmin, validate(v.updateTicketSchema), c.update);

export default router;
