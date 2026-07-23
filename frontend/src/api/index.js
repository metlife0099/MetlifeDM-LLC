import apiClient, { unwrap, unwrapMeta } from './client.js';
import { ENDPOINTS as E } from './endpoints.js';

/* ===================== AUTH ===================== */
export const authApi = {
  register: (data) => apiClient.post(E.auth.register, data).then(unwrap),
  login: (data) => apiClient.post(E.auth.login, data).then(unwrap),
  refresh: () => apiClient.post(E.auth.refresh).then(unwrap),
  logout: () => apiClient.post(E.auth.logout).then(unwrap),
  logoutAll: () => apiClient.post(E.auth.logoutAll).then(unwrap),
  verifyEmail: (token) => apiClient.post(E.auth.verifyEmail, { token }).then(unwrap),
  resendVerification: (email) => apiClient.post(E.auth.resendVerification, { email }).then(unwrap),
  forgotPassword: (email) => apiClient.post(E.auth.forgotPassword, { email }).then(unwrap),
  resetPassword: (token, password) => apiClient.post(E.auth.resetPassword, { token, password }).then(unwrap),
  changePassword: (data) => apiClient.post(E.auth.changePassword, data).then(unwrap),
  me: () => apiClient.get(E.auth.me).then(unwrap),
  setup2FA: () => apiClient.post(E.auth.setup2FA).then(unwrap),
  enable2FA: (data) => apiClient.post(E.auth.enable2FA, data).then(unwrap),
  disable2FA: (data) => apiClient.post(E.auth.disable2FA, data).then(unwrap),
};

/* ===================== USERS ===================== */
export const userApi = {
  updateProfile: (data) => apiClient.patch(E.users.me, data).then(unwrap),
  uploadAvatar: (formData) =>
    apiClient.post(E.users.avatar, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap),
  getWishlist: () => apiClient.get(E.users.wishlist).then(unwrap),
  addToWishlist: (serviceId) => apiClient.post(E.users.wishlist, { serviceId }).then(unwrap),
  removeFromWishlist: (serviceId) => apiClient.delete(`${E.users.wishlist}/${serviceId}`).then(unwrap),
};

/* ===================== CONTENT ===================== */
export const contentApi = {
  // Services
  listServices: (params) => apiClient.get(E.services.list, { params }).then(unwrapMeta),
  getServiceCategories: () => apiClient.get(E.services.categories).then(unwrap),
  getServiceBySlug: (slug) => apiClient.get(E.services.bySlug(slug)).then(unwrap),

  // Industries
  listIndustries: (params) => apiClient.get(E.industries.list, { params }).then(unwrapMeta),
  getIndustryBySlug: (slug) => apiClient.get(E.industries.bySlug(slug)).then(unwrap),

  // Portfolio
  listPortfolio: (params) => apiClient.get(E.portfolio.list, { params }).then(unwrapMeta),
  getPortfolioBySlug: (slug) => apiClient.get(E.portfolio.bySlug(slug)).then(unwrap),
  getPortfolioCategories: () => apiClient.get(E.portfolio.categories).then(unwrap),

  // Case studies
  listCaseStudies: (params) => apiClient.get(E.caseStudies.list, { params }).then(unwrapMeta),
  getCaseStudyBySlug: (slug) => apiClient.get(E.caseStudies.bySlug(slug)).then(unwrap),
  getCaseStudyCategories: () => apiClient.get(E.caseStudies.categories).then(unwrap),
  downloadCaseStudyPdf: (slug) => apiClient.get(E.caseStudies.pdf(slug), { responseType: 'blob' }),

  // Blog
  listPosts: (params) => apiClient.get(E.blog.list, { params }).then(unwrapMeta),
  getPostBySlug: (slug) => apiClient.get(E.blog.bySlug(slug)).then(unwrap),
  getBlogCategories: () => apiClient.get(E.blog.categories).then(unwrap),
  likePost: (id) => apiClient.post(E.blog.like(id)).then(unwrap),
  commentOnPost: (id, data) => apiClient.post(E.blog.comment(id), data).then(unwrap),
  likeComment: (postId, commentId) => apiClient.post(E.blog.likeComment(postId, commentId)).then(unwrap),

  // Testimonials, FAQs, Reviews
  listTestimonials: (params) => apiClient.get(E.testimonials, { params }).then(unwrapMeta),
  listFaqs: (params) => apiClient.get(E.faqs, { params }).then(unwrap),
  listReviews: (serviceId, params) => apiClient.get(E.reviews.byService(serviceId), { params }).then(unwrapMeta),

  // Pages
  listPages: () => apiClient.get(E.pages.list).then(unwrap),
  getPageBySlug: (slug) => apiClient.get(E.pages.bySlug(slug)).then(unwrap),
};

/* ===================== LEADS ===================== */
export const leadsApi = {
  submitContact: (data) => apiClient.post(E.contact, data).then(unwrap),
  bookConsultation: (data) => apiClient.post(E.consultations, data).then(unwrap),
  subscribeNewsletter: (data) => apiClient.post(E.newsletter.subscribe, data).then(unwrap),
  listCareers: (params) => apiClient.get(E.careers.list, { params }).then(unwrapMeta),
  getCareerBySlug: (slug) => apiClient.get(E.careers.bySlug(slug)).then(unwrap),
  applyToJob: (id, formData) =>
    apiClient.post(E.careers.apply(id), formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap),
};

/* ===================== COMMERCE ===================== */
export const commerceApi = {
  createOrder: (data) => apiClient.post(E.orders.create, data).then(unwrap),
  listMyOrders: (params) => apiClient.get(E.orders.mine, { params }).then(unwrapMeta),
  getOrder: (id) => apiClient.get(E.orders.byId(id)).then(unwrap),
  confirmPayment: (id) => apiClient.post(E.orders.confirmPayment(id)).then(unwrap),
  cancelOrder: (id) => apiClient.post(E.orders.cancel(id)).then(unwrap),
  listMyPayments: (params) => apiClient.get(E.payments.mine, { params }).then(unwrapMeta),
  getPayment: (id) => apiClient.get(E.payments.byId(id)).then(unwrap),
  downloadInvoice: (id) => apiClient.get(E.payments.invoice(id), { responseType: 'blob' }),
  validateCoupon: (code, subtotal) => apiClient.post(E.coupons.validate, { code, subtotal }).then(unwrap),
};

/* ===================== CHAT + TICKETS ===================== */
export const chatApi = {
  start: (data) => apiClient.post(E.chat.start, data).then(unwrap),
  sendMessage: (id, data) => apiClient.post(E.chat.messages(id), data).then(unwrap),
  getMessages: (id, params) => apiClient.get(E.chat.messages(id), { params }).then(unwrapMeta),
  requestHuman: (id, data) => apiClient.post(E.chat.requestHuman(id), data).then(unwrap),
  requestAI: (id, data) => apiClient.post(E.chat.requestAI(id), data).then(unwrap),
  getStatus: (id, params) => apiClient.get(E.chat.status(id), { params }).then(unwrap),
  listMine: () => apiClient.get(E.chat.mine).then(unwrapMeta),
  rate: (id, data) => apiClient.post(E.chat.rate(id), data).then(unwrap),
};

export const ticketApi = {
  create: (data) => apiClient.post(E.tickets.create, data).then(unwrap),
  listMine: () => apiClient.get(E.tickets.list).then(unwrapMeta),
  get: (id) => apiClient.get(E.tickets.byId(id)).then(unwrap),
  reply: (id, data) => apiClient.post(E.tickets.reply(id), data).then(unwrap),
};

/* ===================== NOTIFICATIONS + SETTINGS ===================== */
export const notificationApi = {
  list: (params) => apiClient.get(E.notifications.list, { params }).then(unwrapMeta),
  unreadCount: () => apiClient.get(E.notifications.unread).then(unwrap),
  markRead: (id) => apiClient.patch(E.notifications.markRead(id)).then(unwrap),
  markAllRead: () => apiClient.patch(E.notifications.markAllRead).then(unwrap),
};

export const settingsApi = {
  getPublic: () => apiClient.get(E.settings.public).then(unwrap),
};
