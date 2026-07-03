import { Router } from 'express';
import * as c from '../controllers/user.controller.js';
import * as v from '../validators/user.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { memoryUpload } from '../middleware/upload.middleware.js';

const router = Router();

// Self
router.get('/me', requireAuth, c.getProfile);
router.patch('/me', requireAuth, validate(v.updateProfileSchema), c.updateProfile);
router.post('/me/avatar', requireAuth, memoryUpload.single('avatar'), c.uploadAvatar);
router.delete('/me', requireAuth, c.deleteAccount);

// Wishlist
router.get('/me/wishlist', requireAuth, c.getWishlist);
router.post('/me/wishlist', requireAuth, validate(v.wishlistSchema), c.addToWishlist);
router.delete('/me/wishlist/:serviceId', requireAuth, c.removeFromWishlist);

// Admin
router.get('/', requireAuth, requireAdmin, c.listUsers);
router.get('/:id', requireAuth, requireAdmin, c.getUserById);
router.patch('/:id', requireAuth, requireAdmin, validate(v.adminUpdateUserSchema), c.adminUpdateUser);
router.delete('/:id', requireAuth, requireAdmin, c.adminDeleteUser);

export default router;
