import { Router } from 'express';
import { verifyDocument } from '../controllers/document.controller.js';
import { verifyLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Public — no auth. Accepts either a verificationToken or a documentNumber.
router.get('/:identifier', verifyLimiter, verifyDocument);

export default router;
