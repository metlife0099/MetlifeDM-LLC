import { Router } from 'express';
import * as c from '../controllers/auth.controller.js';
import * as v from '../validators/auth.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/register', authLimiter, validate(v.registerSchema), c.register);
router.post('/login', authLimiter, validate(v.loginSchema), c.login);
router.post('/refresh', validate(v.refreshSchema), c.refresh);
router.post('/logout', requireAuth, c.logout);
router.post('/logout-all', requireAuth, c.logoutAll);

router.post('/verify-email', validate(v.verifyEmailSchema), c.verifyEmail);
router.post('/resend-verification', otpLimiter, c.resendVerification);

router.post('/forgot-password', otpLimiter, validate(v.forgotPasswordSchema), c.forgotPassword);
router.post('/reset-password', otpLimiter, validate(v.resetPasswordSchema), c.resetPassword);
router.post('/change-password', requireAuth, validate(v.changePasswordSchema), c.changePassword);

router.get('/me', requireAuth, c.me);

// 2FA
router.post('/2fa/setup', requireAuth, c.setup2FA);
router.post('/2fa/enable', requireAuth, validate(v.enable2FASchema), c.enable2FA);
router.post('/2fa/disable', requireAuth, validate(v.verify2FASchema), c.disable2FA);

export default router;
