import { Router } from 'express';
import * as c from '../controllers/payment.controller.js';
import * as v from '../validators/order.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/mine', c.listMyPayments);
router.get('/:id', c.getPayment);
router.get('/:id/invoice', c.downloadInvoice);

router.get('/', requireAdmin, c.listPayments);
router.post('/:id/refund', requireAdmin, validate(v.refundSchema), c.refund);

export default router;
