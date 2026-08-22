import { Router } from 'express';
import { testimonial, review, faq } from '../controllers/engagement.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import * as reviewValidators from '../validators/engagement.validator.js';

/* Testimonials */
export const testimonialRoutes = Router();
testimonialRoutes.get('/', testimonial.list);
testimonialRoutes.post('/', requireAuth, requireAdmin, testimonial.create);
testimonialRoutes.patch('/:id', requireAuth, requireAdmin, testimonial.update);
testimonialRoutes.delete('/:id', requireAuth, requireAdmin, testimonial.remove);

/* Reviews */
export const reviewRoutes = Router();
reviewRoutes.get('/service/:serviceId', review.listByService);
reviewRoutes.post('/', requireAuth, validate(reviewValidators.createReviewSchema), review.create);
reviewRoutes.get('/admin', requireAuth, requireAdmin, review.listAdmin);
reviewRoutes.patch('/:id/moderate', requireAuth, requireAdmin, validate(reviewValidators.moderateReviewSchema), review.moderate);
reviewRoutes.post('/:id/reply', requireAuth, requireAdmin, validate(reviewValidators.replyReviewSchema), review.reply);
reviewRoutes.delete('/:id', requireAuth, requireAdmin, review.remove);

/* FAQs */
export const faqRoutes = Router();
faqRoutes.get('/', faq.list);
faqRoutes.post('/:id/helpful', faq.helpful);
faqRoutes.post('/', requireAuth, requireAdmin, faq.create);
faqRoutes.patch('/:id', requireAuth, requireAdmin, faq.update);
faqRoutes.delete('/:id', requireAuth, requireAdmin, faq.remove);
