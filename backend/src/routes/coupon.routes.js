import { Router } from 'express';
import * as c from '../controllers/coupon.controller.js';
import * as v from '../validators/coupon.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public
router.post('/validate', optionalAuth, validate(v.validateCouponSchema), c.validateCoupon);

// Admin
router.get('/', requireAuth, requireAdmin, c.listCoupons);
router.post('/', requireAuth, requireAdmin, validate(v.createCouponSchema), c.createCoupon);
router.get('/:id', requireAuth, requireAdmin, c.getCoupon);
router.patch('/:id', requireAuth, requireAdmin, c.updateCoupon);
router.delete('/:id', requireAuth, requireAdmin, c.deleteCoupon);

export default router;
