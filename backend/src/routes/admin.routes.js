/**
 * admin.routes.js
 *
 * The comprehensive `/admin/*` router used by the separate admin panel React app.
 *
 * Strategy: delegate to the existing feature controllers where possible, and
 * only implement admin-panel-specific endpoints in adminPanel.controller.js
 * (dashboard splits, analytics, email templates, CSV export, etc.).
 *
 * Accepts both PUT and PATCH for updates so admin-panel PUTs work against
 * controllers that were built for PATCH.
 */
import { Router } from 'express';

// ————— existing controllers —————
import * as legacyAdmin from '../controllers/admin.controller.js';
import * as serviceCtrl from '../controllers/service.controller.js';
import { industry as industryCtrl, portfolio as portfolioCtrl, caseStudy as caseStudyCtrl } from '../controllers/content.controller.js';
import * as blogCtrl from '../controllers/blog.controller.js';
import { testimonial as testimonialCtrl, faq as faqCtrl } from '../controllers/engagement.controller.js';
import { contact as contactCtrl, consultation as consultationCtrl, newsletter as newsletterCtrl, career as careerCtrl } from '../controllers/leadCapture.controller.js';
import * as orderCtrl from '../controllers/order.controller.js';
import * as paymentCtrl from '../controllers/payment.controller.js';
import * as couponCtrl from '../controllers/coupon.controller.js';
import * as ticketCtrl from '../controllers/ticket.controller.js';
import * as userCtrl from '../controllers/user.controller.js';
import * as mediaCtrl from '../controllers/media.controller.js';
import * as settingsCtrl from '../controllers/settings.controller.js';
import * as pageCtrl from '../controllers/page.controller.js';
import * as notificationCtrl from '../controllers/notification.controller.js';

// ————— admin-panel-specific controller —————
import * as adminPanel from '../controllers/adminPanel.controller.js';

// ————— middleware —————
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { imageUpload } from '../middleware/upload.middleware.js';

const router = Router();

// Every /admin/* route requires auth + admin role
router.use(requireAuth, requireAdmin);

/* ═══════════════════════════════════════════════════════════
 * DASHBOARD
 * ═══════════════════════════════════════════════════════════ */
router.get('/dashboard', legacyAdmin.dashboard);
router.get('/dashboard/overview', adminPanel.dashboardOverview);
router.get('/dashboard/revenue', adminPanel.dashboardRevenue);
router.get('/dashboard/orders-by-status', adminPanel.dashboardOrdersByStatus);
router.get('/dashboard/leads', adminPanel.dashboardLeads);
router.get('/dashboard/top-services', adminPanel.dashboardTopServices);
router.get('/dashboard/recent-activity', adminPanel.dashboardRecentActivity);

router.get('/charts', legacyAdmin.charts);
router.get('/recent-activity', legacyAdmin.recentActivity);
router.get('/audit-logs', legacyAdmin.auditLogs);

/* ═══════════════════════════════════════════════════════════
 * ANALYTICS
 * ═══════════════════════════════════════════════════════════ */
router.get('/analytics/overview', adminPanel.analyticsOverview);
router.get('/analytics/revenue', adminPanel.analyticsRevenue);
router.get('/analytics/traffic', adminPanel.analyticsTraffic);
router.get('/analytics/conversions', adminPanel.analyticsConversions);
router.get('/analytics/services', adminPanel.analyticsServices);

/* ═══════════════════════════════════════════════════════════
 * SERVICES
 * ═══════════════════════════════════════════════════════════ */
router.get('/services', serviceCtrl.listAllAdmin);
router.post('/services/reorder', serviceCtrl.reorder);
router.get('/services/:id', serviceCtrl.getById);
router.post('/services', serviceCtrl.createService);
router.put('/services/:id', serviceCtrl.updateService);
router.patch('/services/:id', serviceCtrl.updateService);
router.delete('/services/:id', serviceCtrl.deleteService);

/* ═══════════════════════════════════════════════════════════
 * PORTFOLIO / CASE STUDIES / INDUSTRIES
 * ═══════════════════════════════════════════════════════════ */
const mountContent = (path, ctrl) => {
  router.get(path, ctrl.listAdmin);
  router.get(`${path}/:id`, ctrl.getById);
  router.post(path, ctrl.create);
  router.put(`${path}/:id`, ctrl.update);
  router.patch(`${path}/:id`, ctrl.update);
  router.delete(`${path}/:id`, ctrl.remove);
};

mountContent('/portfolio', portfolioCtrl);
mountContent('/case-studies', caseStudyCtrl);
mountContent('/industries', industryCtrl);

/* ═══════════════════════════════════════════════════════════
 * BLOG · posts / categories / comments
 * ═══════════════════════════════════════════════════════════ */
router.get('/blog/posts', blogCtrl.listAdmin);
router.get('/blog/posts/:id', blogCtrl.getById);
router.post('/blog/posts', blogCtrl.create);
router.put('/blog/posts/:id', blogCtrl.update);
router.patch('/blog/posts/:id', blogCtrl.update);
router.delete('/blog/posts/:id', blogCtrl.remove);
router.post('/blog/posts/:id/publish', adminPanel.blogPublish);

router.get('/blog/categories', blogCtrl.category.list);
router.post('/blog/categories', blogCtrl.category.create);
router.put('/blog/categories/:id', blogCtrl.category.update);
router.patch('/blog/categories/:id', blogCtrl.category.update);
router.delete('/blog/categories/:id', blogCtrl.category.remove);

router.get('/blog/comments', adminPanel.blogListComments);
router.post('/blog/comments/:id/approve', adminPanel.blogApproveComment);
router.delete('/blog/comments/:id', adminPanel.blogDeleteComment);

/* ═══════════════════════════════════════════════════════════
 * TESTIMONIALS / FAQS
 * ═══════════════════════════════════════════════════════════ */
router.get('/testimonials', testimonialCtrl.listAdmin);
router.post('/testimonials', testimonialCtrl.create);
router.put('/testimonials/:id', testimonialCtrl.update);
router.patch('/testimonials/:id', testimonialCtrl.update);
router.delete('/testimonials/:id', testimonialCtrl.remove);

router.get('/faqs', faqCtrl.listAdmin);
router.post('/faqs', faqCtrl.create);
router.put('/faqs/:id', faqCtrl.update);
router.patch('/faqs/:id', faqCtrl.update);
router.delete('/faqs/:id', faqCtrl.remove);

/* ═══════════════════════════════════════════════════════════
 * PAGES (CMS)
 * ═══════════════════════════════════════════════════════════ */
router.get('/pages', pageCtrl.listAdmin);
router.get('/pages/:id', pageCtrl.getById);
router.post('/pages', pageCtrl.create);
router.put('/pages/:id', pageCtrl.update);
router.patch('/pages/:id', pageCtrl.update);
router.delete('/pages/:id', pageCtrl.remove);

/* ═══════════════════════════════════════════════════════════
 * CAREERS · jobs + applications
 * ═══════════════════════════════════════════════════════════ */
router.get('/careers/jobs', careerCtrl.list);
router.get('/careers/jobs/:id', careerCtrl.bySlug);  // fallback lookup by id-or-slug
router.post('/careers/jobs', careerCtrl.create);
router.put('/careers/jobs/:id', careerCtrl.update);
router.patch('/careers/jobs/:id', careerCtrl.update);
router.delete('/careers/jobs/:id', careerCtrl.remove);

router.get('/careers/applications', careerCtrl.listApplications);
router.get('/careers/applications/:id', careerCtrl.listApplications);  // reuses list, filtered
router.put('/careers/applications/:id', careerCtrl.updateApplication);
router.patch('/careers/applications/:id', careerCtrl.updateApplication);

/* ═══════════════════════════════════════════════════════════
 * LEADS · contacts / consultations / subscribers
 * ═══════════════════════════════════════════════════════════ */
router.get('/leads/contacts', contactCtrl.list);
router.put('/leads/contacts/:id', contactCtrl.update);
router.patch('/leads/contacts/:id', contactCtrl.update);
router.delete('/leads/contacts/:id', contactCtrl.remove);

router.get('/leads/consultations', consultationCtrl.list);
router.put('/leads/consultations/:id', consultationCtrl.update);
router.patch('/leads/consultations/:id', consultationCtrl.update);

router.get('/leads/subscribers', newsletterCtrl.list);
router.delete('/leads/subscribers/:id', newsletterCtrl.remove);
router.get('/leads/subscribers/export', adminPanel.subscribersExport);

/* ═══════════════════════════════════════════════════════════
 * ORDERS
 * ═══════════════════════════════════════════════════════════ */
router.get('/orders', orderCtrl.listOrders);
router.get('/orders/:id', orderCtrl.getOrder);
router.put('/orders/:id', orderCtrl.updateStatus);
router.patch('/orders/:id/status', orderCtrl.updateStatus);
router.post('/orders/:id/refund', adminPanel.orderRefund);

/* ═══════════════════════════════════════════════════════════
 * PAYMENTS
 * ═══════════════════════════════════════════════════════════ */
router.get('/payments', paymentCtrl.listPayments);
router.get('/payments/:id', paymentCtrl.getPayment);

/* ═══════════════════════════════════════════════════════════
 * COUPONS
 * ═══════════════════════════════════════════════════════════ */
router.get('/coupons', couponCtrl.listCoupons);
router.get('/coupons/:id', couponCtrl.getCoupon);
router.post('/coupons', couponCtrl.createCoupon);
router.put('/coupons/:id', couponCtrl.updateCoupon);
router.patch('/coupons/:id', couponCtrl.updateCoupon);
router.delete('/coupons/:id', couponCtrl.deleteCoupon);

/* ═══════════════════════════════════════════════════════════
 * TICKETS
 * ═══════════════════════════════════════════════════════════ */
router.get('/tickets', ticketCtrl.listAll);
router.get('/tickets/:id', ticketCtrl.get);
router.post('/tickets/:id/reply', adminPanel.ticketReply);
router.patch('/tickets/:id/status', adminPanel.ticketUpdateStatus);
router.patch('/tickets/:id/assign', adminPanel.ticketAssign);
router.post('/tickets/:id/note', adminPanel.ticketAddNote);

/* ═══════════════════════════════════════════════════════════
 * USERS
 * ═══════════════════════════════════════════════════════════ */
router.get('/users', userCtrl.listUsers);
router.get('/users/:id', userCtrl.getUserById);
router.put('/users/:id', userCtrl.adminUpdateUser);
router.patch('/users/:id', userCtrl.adminUpdateUser);
router.delete('/users/:id', userCtrl.adminDeleteUser);
router.patch('/users/:id/role', adminPanel.userUpdateRole);
router.post('/users/:id/suspend', adminPanel.userSuspend);
router.post('/users/:id/activate', adminPanel.userActivate);

/* ═══════════════════════════════════════════════════════════
 * MEDIA
 * ═══════════════════════════════════════════════════════════ */
router.get('/media', mediaCtrl.list);
router.get('/media/folders', adminPanel.mediaFolders);
router.post('/media/upload', imageUpload.array('file', 10), mediaCtrl.upload);
router.patch('/media/:id', mediaCtrl.updateMetadata);
router.put('/media/:id', mediaCtrl.updateMetadata);
router.delete('/media/:id', mediaCtrl.remove);

/* ═══════════════════════════════════════════════════════════
 * SETTINGS · general + email templates
 * ═══════════════════════════════════════════════════════════ */
router.get('/settings', settingsCtrl.getAdmin);
router.put('/settings', settingsCtrl.update);
router.patch('/settings', settingsCtrl.update);

router.get('/settings/email-templates', adminPanel.listEmailTemplates);
router.get('/settings/email-templates/:id', adminPanel.getEmailTemplate);
router.put('/settings/email-templates/:id', adminPanel.updateEmailTemplate);
router.patch('/settings/email-templates/:id', adminPanel.updateEmailTemplate);
router.post('/settings/test-email', adminPanel.testEmail);

export default router;
