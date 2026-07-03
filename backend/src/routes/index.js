import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

import ApiResponse from '../utils/ApiResponse.js';
import swaggerSpec from '../config/swagger.js';

import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import notificationRoutes from './notification.routes.js';
import serviceRoutes from './service.routes.js';
import { industryRoutes, portfolioRoutes, caseStudyRoutes } from './content.routes.js';
import blogRoutes from './blog.routes.js';
import { testimonialRoutes, reviewRoutes, faqRoutes } from './engagement.routes.js';
import { contactRoutes, consultationRoutes, newsletterRoutes, careerRoutes } from './leadCapture.routes.js';
import orderRoutes from './order.routes.js';
import paymentRoutes from './payment.routes.js';
import couponRoutes from './coupon.routes.js';
import chatRoutes from './chat.routes.js';
import ticketRoutes from './ticket.routes.js';
import mediaRoutes from './media.routes.js';
import settingsRoutes from './settings.routes.js';
import pageRoutes from './page.routes.js';
import seoRoutes from './seo.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

// Root
router.get('/', (req, res) =>
  ApiResponse.ok(res, {
    name: 'MetlifeDM LLC API',
    version: 'v1',
    docs: '/api/v1/docs',
  }, 'Welcome to MetlifeDM API')
);

// Swagger docs
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'MetlifeDM API Docs',
  customCss: '.swagger-ui .topbar { display:none }',
}));

// Auth & users
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);

// Content
router.use('/services', serviceRoutes);
router.use('/industries', industryRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/case-studies', caseStudyRoutes);
router.use('/blog', blogRoutes);
router.use('/testimonials', testimonialRoutes);
router.use('/reviews', reviewRoutes);
router.use('/faqs', faqRoutes);
router.use('/pages', pageRoutes);

// Lead capture
router.use('/contact', contactRoutes);
router.use('/consultations', consultationRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/careers', careerRoutes);

// Commerce
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/coupons', couponRoutes);

// Realtime & support
router.use('/chat', chatRoutes);
router.use('/tickets', ticketRoutes);

// Admin & infra
router.use('/media', mediaRoutes);
router.use('/settings', settingsRoutes);
router.use('/seo', seoRoutes);
router.use('/admin', adminRoutes);

export default router;
