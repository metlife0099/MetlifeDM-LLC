import { Router } from 'express';
import * as c from '../controllers/order.controller.js';
import * as v from '../validators/order.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

// Self
router.post('/', validate(v.createOrderSchema), c.createOrder);
router.get('/mine', c.listMyOrders);
router.get('/:id', c.getOrder);
router.post('/:id/payment-intent', c.resumePayment);
router.post('/:id/confirm-payment', c.confirmPayment);
router.post('/:id/subscription/cancel', c.cancelSubscription);
router.post('/:id/subscription/resume', c.resumeSubscription);
router.post('/:id/cancel', c.cancelOrder);

// Admin
router.get('/', requireAdmin, c.listOrders);
router.patch('/:id/status', requireAdmin, validate(v.updateOrderStatusSchema), c.updateStatus);
router.patch('/:id/assign', requireAdmin, c.assignOrder);
router.patch(
  '/:id/subscription',
  requireAdmin,
  validate(v.manageSubscriptionSchema),
  c.adminManageSubscription
);

export default router;
