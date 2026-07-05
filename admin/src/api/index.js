import { apiClient, unwrap, unwrapMeta } from './client.js';
import E from './endpoints.js';

/* ————— AUTH ————— */
export const authApi = {
  login: (data) => apiClient.post(E.auth.login, data).then(unwrap),
  logout: () => apiClient.post(E.auth.logout).then(unwrap),
  logoutAll: () => apiClient.post(E.auth.logoutAll).then(unwrap),
  refresh: () => apiClient.post(E.auth.refresh).then(unwrap),
  me: () => apiClient.get(E.auth.me).then(unwrap),
  changePassword: (data) => apiClient.post(E.auth.changePassword, data).then(unwrap),
  setup2FA: () => apiClient.post(E.auth.setup2FA).then(unwrap),
  enable2FA: (data) => apiClient.post(E.auth.enable2FA, data).then(unwrap),
  disable2FA: (data) => apiClient.post(E.auth.disable2FA, data).then(unwrap),
};

/* ————— DASHBOARD ————— */
export const dashboardApi = {
  overview: (params) => apiClient.get(E.dashboard.overview, { params }).then(unwrap),
  revenue: (params) => apiClient.get(E.dashboard.revenue, { params }).then(unwrap),
  ordersByStatus: () => apiClient.get(E.dashboard.ordersByStatus).then(unwrap),
  leads: (params) => apiClient.get(E.dashboard.leads, { params }).then(unwrap),
  topServices: (params) => apiClient.get(E.dashboard.topServices, { params }).then(unwrap),
  recentActivity: (params) => apiClient.get(E.dashboard.recentActivity, { params }).then(unwrap),
};

/* ————— CONTENT: shared CRUD factory ————— */
const crud = (endpoints) => ({
  list: (params) => apiClient.get(endpoints.list, { params }).then(unwrapMeta),
  get: (id) => apiClient.get(endpoints.detail(id)).then(unwrap),
  create: (data) => apiClient.post(endpoints.create, data).then(unwrap),
  update: (id, data) => apiClient.put(endpoints.update(id), data).then(unwrap),
  remove: (id) => apiClient.delete(endpoints.delete(id)).then(unwrap),
});

export const servicesApi = {
  ...crud(E.services),
  reorder: (ids) => apiClient.post(E.services.reorder, { ids }).then(unwrap),
};

export const portfolioApi = crud(E.portfolio);
export const caseStudiesApi = crud(E.caseStudies);
export const industriesApi = crud(E.industries);
export const testimonialsApi = crud(E.testimonials);
export const faqsApi = crud(E.faqs);
export const pagesApi = crud(E.pages);
export const couponsApi = crud(E.coupons);

/* ————— BLOG ————— */
export const blogApi = {
  listPosts: (params) => apiClient.get(E.blog.posts, { params }).then(unwrapMeta),
  getPost: (id) => apiClient.get(E.blog.post(id)).then(unwrap),
  createPost: (data) => apiClient.post(E.blog.createPost, data).then(unwrap),
  updatePost: (id, data) => apiClient.put(E.blog.updatePost(id), data).then(unwrap),
  deletePost: (id) => apiClient.delete(E.blog.deletePost(id)).then(unwrap),
  publishPost: (id) => apiClient.post(E.blog.publishPost(id)).then(unwrap),
  listCategories: (params) => apiClient.get(E.blog.categories, { params }).then(unwrap),
  createCategory: (data) => apiClient.post(E.blog.categories, data).then(unwrap),
  updateCategory: (id, data) => apiClient.put(E.blog.category(id), data).then(unwrap),
  deleteCategory: (id) => apiClient.delete(E.blog.category(id)).then(unwrap),
  listComments: (params) => apiClient.get(E.blog.comments, { params }).then(unwrapMeta),
  approveComment: (id) => apiClient.post(E.blog.approveComment(id)).then(unwrap),
  deleteComment: (id) => apiClient.delete(E.blog.deleteComment(id)).then(unwrap),
};

/* ————— CAREERS ————— */
export const careersApi = {
  listJobs: (params) => apiClient.get(E.careers.jobs, { params }).then(unwrapMeta),
  getJob: (id) => apiClient.get(E.careers.job(id)).then(unwrap),
  createJob: (data) => apiClient.post(E.careers.createJob, data).then(unwrap),
  updateJob: (id, data) => apiClient.put(E.careers.updateJob(id), data).then(unwrap),
  deleteJob: (id) => apiClient.delete(E.careers.deleteJob(id)).then(unwrap),
  listApplications: (params) => apiClient.get(E.careers.applications, { params }).then(unwrapMeta),
  getApplication: (id) => apiClient.get(E.careers.application(id)).then(unwrap),
  updateApplication: (id, data) => apiClient.put(E.careers.updateApplication(id), data).then(unwrap),
};

/* ————— LEADS ————— */
export const leadsApi = {
  listContacts: (params) => apiClient.get(E.leads.contacts, { params }).then(unwrapMeta),
  getContact: (id) => apiClient.get(E.leads.contact(id)).then(unwrap),
  updateContact: (id, data) => apiClient.put(E.leads.updateContact(id), data).then(unwrap),
  deleteContact: (id) => apiClient.delete(E.leads.deleteContact(id)).then(unwrap),
  listConsultations: (params) => apiClient.get(E.leads.consultations, { params }).then(unwrapMeta),
  getConsultation: (id) => apiClient.get(E.leads.consultation(id)).then(unwrap),
  updateConsultation: (id, data) => apiClient.put(E.leads.updateConsultation(id), data).then(unwrap),
  deleteConsultation: (id) => apiClient.delete(E.leads.deleteConsultation(id)).then(unwrap),
  listSubscribers: (params) => apiClient.get(E.leads.subscribers, { params }).then(unwrapMeta),
  createSubscriber: (data) => apiClient.post(E.leads.subscribers, data).then(unwrap),
  createSubscribersBulk: (subscribers) => apiClient.post(E.leads.subscribersBulk, { subscribers }).then(unwrap),
  importSubscribers: (formData) =>
    apiClient
      .post(E.leads.subscribersImport, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(unwrap),
  deleteSubscriber: (id) => apiClient.delete(E.leads.subscriber(id)).then(unwrap),
  exportSubscribers: () => apiClient.get(E.leads.exportSubscribers, { responseType: 'blob' }),
};

/* ————— COMMERCE ————— */
export const ordersApi = {
  list: (params) => apiClient.get(E.orders.list, { params }).then(unwrapMeta),
  get: (id) => apiClient.get(E.orders.detail(id)).then(unwrap),
  update: (id, data) => apiClient.put(E.orders.update(id), data).then(unwrap),
  updateStatus: (id, status, note) =>
    apiClient.patch(E.orders.updateStatus(id), { status, note }).then(unwrap),
  refund: (id, data) => apiClient.post(E.orders.refund(id), data).then(unwrap),
};

export const paymentsApi = {
  list: (params) => apiClient.get(E.payments.list, { params }).then(unwrapMeta),
  get: (id) => apiClient.get(E.payments.detail(id)).then(unwrap),
};

/* ————— SUPPORT ————— */
export const ticketsApi = {
  list: (params) => apiClient.get(E.tickets.list, { params }).then(unwrapMeta),
  get: (id) => apiClient.get(E.tickets.detail(id)).then(unwrap),
  reply: (id, data) => apiClient.post(E.tickets.reply(id), data).then(unwrap),
  updateStatus: (id, status) =>
    apiClient.patch(E.tickets.updateStatus(id), { status }).then(unwrap),
  assign: (id, assigneeId) =>
    apiClient.patch(E.tickets.assign(id), { assigneeId }).then(unwrap),
  addNote: (id, note) => apiClient.post(E.tickets.note(id), { note }).then(unwrap),
};

/* ————— LIVE CHAT ————— */
export const chatApi = {
  list: (params) => apiClient.get(E.chat.listAdmin, { params }).then(unwrapMeta),
  get: (id) => apiClient.get(E.chat.detail(id)).then(unwrap),
  messages: (id) => apiClient.get(E.chat.messages(id)).then(unwrapMeta),
  send: (id, content) => apiClient.post(E.chat.send(id), { content }).then(unwrap),
  assign: (id) => apiClient.post(E.chat.assign(id)).then(unwrap),
  resolve: (id) => apiClient.post(E.chat.resolve(id)).then(unwrap),
  suggestions: (id) => apiClient.get(E.chat.suggestions(id)).then(unwrap),
};

/* ————— USERS ————— */
export const usersApi = {
  list: (params) => apiClient.get(E.users.list, { params }).then(unwrapMeta),
  get: (id) => apiClient.get(E.users.detail(id)).then(unwrap),
  create: (data) => apiClient.post(E.users.create, data).then(unwrap),
  update: (id, data) => apiClient.put(E.users.update(id), data).then(unwrap),
  updateRole: (id, role) => apiClient.patch(E.users.updateRole(id), { role }).then(unwrap),
  delete: (id) => apiClient.delete(E.users.delete(id)).then(unwrap),
  suspend: (id, reason) => apiClient.post(E.users.suspend(id), { reason }).then(unwrap),
  activate: (id) => apiClient.post(E.users.activate(id)).then(unwrap),
};

/* ————— MEDIA ————— */
export const mediaApi = {
  list: (params) => apiClient.get(E.media.list, { params }).then(unwrapMeta),
  get: (id) => apiClient.get(E.media.detail(id)).then(unwrap),
  upload: (formData) =>
    apiClient
      .post(E.media.upload, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(unwrap),
  delete: (id) => apiClient.delete(E.media.delete(id)).then(unwrap),
  listFolders: () => apiClient.get(E.media.folders).then(unwrap),
};

/* ————— ANALYTICS ————— */
export const analyticsApi = {
  overview: (params) => apiClient.get(E.analytics.overview, { params }).then(unwrap),
  revenue: (params) => apiClient.get(E.analytics.revenue, { params }).then(unwrap),
  traffic: (params) => apiClient.get(E.analytics.traffic, { params }).then(unwrap),
  conversions: (params) => apiClient.get(E.analytics.conversions, { params }).then(unwrap),
  services: (params) => apiClient.get(E.analytics.services, { params }).then(unwrap),
};

/* ————— SETTINGS ————— */
export const settingsApi = {
  get: () => apiClient.get(E.settings.get).then(unwrap),
  update: (data) => apiClient.put(E.settings.update, data).then(unwrap),
  listEmailTemplates: () => apiClient.get(E.settings.emailTemplates).then(unwrap),
  getEmailTemplate: (id) => apiClient.get(E.settings.emailTemplate(id)).then(unwrap),
  updateEmailTemplate: (id, data) => apiClient.put(E.settings.updateEmailTemplate(id), data).then(unwrap),
  testEmail: (data) => apiClient.post(E.settings.testEmail, data).then(unwrap),
};

/* ————— NOTIFICATIONS ————— */
export const notificationsApi = {
  list: (params) => apiClient.get(E.notifications.list, { params }).then(unwrapMeta),
  unreadCount: () => apiClient.get(E.notifications.unreadCount).then(unwrap),
  unreadCountByType: () => apiClient.get(E.notifications.unreadCountByType).then(unwrap),
  markRead: (id) => apiClient.post(E.notifications.markRead(id)).then(unwrap),
  markReadByType: (resourceType) => apiClient.post(E.notifications.markReadByType, { resourceType }).then(unwrap),
  markAllRead: () => apiClient.post(E.notifications.markAllRead).then(unwrap),
  remove: (id) => apiClient.delete(E.notifications.remove(id)).then(unwrap),
  clearAll: () => apiClient.delete(E.notifications.clearAll).then(unwrap),
};
