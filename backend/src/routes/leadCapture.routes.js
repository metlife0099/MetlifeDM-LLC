import { Router } from 'express';
import { contact, consultation, newsletter, career, partnerInquiry } from '../controllers/leadCapture.controller.js';
import * as v from '../validators/leadCapture.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { leadLimiter } from '../middleware/rateLimit.middleware.js';
import { resumeUpload } from '../middleware/upload.middleware.js';

/* Contact */
export const contactRoutes = Router();
contactRoutes.post('/', leadLimiter, validate(v.contactSchema), contact.submit);
contactRoutes.get('/', requireAuth, requireAdmin, contact.list);
contactRoutes.patch('/:id', requireAuth, requireAdmin, contact.update);
contactRoutes.delete('/:id', requireAuth, requireAdmin, contact.remove);

/* Partner inquiry (white-label delivery partner applications) */
export const partnerInquiryRoutes = Router();
partnerInquiryRoutes.post('/', leadLimiter, validate(v.partnerInquirySchema), partnerInquiry.submit);
partnerInquiryRoutes.get('/', requireAuth, requireAdmin, partnerInquiry.list);
partnerInquiryRoutes.get('/:id', requireAuth, requireAdmin, partnerInquiry.getById);
partnerInquiryRoutes.patch('/:id', requireAuth, requireAdmin, partnerInquiry.update);
partnerInquiryRoutes.delete('/:id', requireAuth, requireAdmin, partnerInquiry.remove);

/* Consultation */
export const consultationRoutes = Router();
consultationRoutes.post('/', leadLimiter, validate(v.consultationSchema), consultation.book);
consultationRoutes.get('/', requireAuth, requireAdmin, consultation.list);
consultationRoutes.patch('/:id/confirm', requireAuth, requireAdmin, consultation.confirm);
consultationRoutes.patch('/:id', requireAuth, requireAdmin, consultation.update);

/* Newsletter */
export const newsletterRoutes = Router();
newsletterRoutes.post('/subscribe', leadLimiter, validate(v.newsletterSchema), newsletter.subscribe);
newsletterRoutes.get('/unsubscribe', newsletter.unsubscribe);
newsletterRoutes.get('/', requireAuth, requireAdmin, newsletter.list);
newsletterRoutes.delete('/:id', requireAuth, requireAdmin, newsletter.remove);

/* Careers */
export const careerRoutes = Router();
careerRoutes.get('/', career.list);
careerRoutes.get('/slug/:slug', career.bySlug);
careerRoutes.post('/:id/apply', leadLimiter, resumeUpload.single('resume'), validate(v.applicationSchema), career.apply);
careerRoutes.post('/', requireAuth, requireAdmin, validate(v.careerSchema), career.create);
careerRoutes.patch('/:id', requireAuth, requireAdmin, career.update);
careerRoutes.delete('/:id', requireAuth, requireAdmin, career.remove);
careerRoutes.get('/applications', requireAuth, requireAdmin, career.listApplications);
careerRoutes.get('/:jobId/applications', requireAuth, requireAdmin, career.listApplications);
careerRoutes.patch('/applications/:appId', requireAuth, requireAdmin, career.updateApplication);
