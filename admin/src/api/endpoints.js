/**
 * Backend endpoint map for the admin panel.
 * All routes live under /api/v1 (base is set in the client).
 */
export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    logoutAll: '/auth/logout-all',
    me: '/auth/me',
    changePassword: '/auth/change-password',
    setup2FA: '/auth/2fa/setup',
    enable2FA: '/auth/2fa/enable',
    disable2FA: '/auth/2fa/disable',
  },

  /* ————— Admin dashboards ————— */
  dashboard: {
    overview: '/admin/dashboard/overview',
    revenue: '/admin/dashboard/revenue',
    ordersByStatus: '/admin/dashboard/orders-by-status',
    leads: '/admin/dashboard/leads',
    topServices: '/admin/dashboard/top-services',
    recentActivity: '/admin/dashboard/recent-activity',
  },

  /* ————— Content ————— */
  services: {
    list: '/admin/services',
    detail: (id) => `/admin/services/${id}`,
    create: '/admin/services',
    update: (id) => `/admin/services/${id}`,
    delete: (id) => `/admin/services/${id}`,
    reorder: '/admin/services/reorder',
  },
  portfolio: {
    list: '/admin/portfolio',
    detail: (id) => `/admin/portfolio/${id}`,
    create: '/admin/portfolio',
    update: (id) => `/admin/portfolio/${id}`,
    delete: (id) => `/admin/portfolio/${id}`,
  },
  caseStudies: {
    list: '/admin/case-studies',
    detail: (id) => `/admin/case-studies/${id}`,
    create: '/admin/case-studies',
    update: (id) => `/admin/case-studies/${id}`,
    delete: (id) => `/admin/case-studies/${id}`,
  },
  industries: {
    list: '/admin/industries',
    detail: (id) => `/admin/industries/${id}`,
    create: '/admin/industries',
    update: (id) => `/admin/industries/${id}`,
    delete: (id) => `/admin/industries/${id}`,
  },
  blog: {
    posts: '/admin/blog/posts',
    post: (id) => `/admin/blog/posts/${id}`,
    createPost: '/admin/blog/posts',
    updatePost: (id) => `/admin/blog/posts/${id}`,
    deletePost: (id) => `/admin/blog/posts/${id}`,
    publishPost: (id) => `/admin/blog/posts/${id}/publish`,
    categories: '/admin/blog/categories',
    category: (id) => `/admin/blog/categories/${id}`,
    comments: '/admin/blog/comments',
    approveComment: (id) => `/admin/blog/comments/${id}/approve`,
    deleteComment: (id) => `/admin/blog/comments/${id}`,
  },
  testimonials: {
    list: '/admin/testimonials',
    detail: (id) => `/admin/testimonials/${id}`,
    create: '/admin/testimonials',
    update: (id) => `/admin/testimonials/${id}`,
    delete: (id) => `/admin/testimonials/${id}`,
  },
  faqs: {
    list: '/admin/faqs',
    detail: (id) => `/admin/faqs/${id}`,
    create: '/admin/faqs',
    update: (id) => `/admin/faqs/${id}`,
    delete: (id) => `/admin/faqs/${id}`,
  },
  pages: {
    list: '/admin/pages',
    detail: (id) => `/admin/pages/${id}`,
    create: '/admin/pages',
    update: (id) => `/admin/pages/${id}`,
    delete: (id) => `/admin/pages/${id}`,
  },

  /* ————— Careers ————— */
  careers: {
    jobs: '/admin/careers/jobs',
    job: (id) => `/admin/careers/jobs/${id}`,
    createJob: '/admin/careers/jobs',
    updateJob: (id) => `/admin/careers/jobs/${id}`,
    deleteJob: (id) => `/admin/careers/jobs/${id}`,
    applications: '/admin/careers/applications',
    application: (id) => `/admin/careers/applications/${id}`,
    updateApplication: (id) => `/admin/careers/applications/${id}`,
  },

  /* ————— Leads ————— */
  leads: {
    contacts: '/admin/leads/contacts',
    contact: (id) => `/admin/leads/contacts/${id}`,
    updateContact: (id) => `/admin/leads/contacts/${id}`,
    deleteContact: (id) => `/admin/leads/contacts/${id}`,
    consultations: '/admin/leads/consultations',
    consultation: (id) => `/admin/leads/consultations/${id}`,
    updateConsultation: (id) => `/admin/leads/consultations/${id}`,
    deleteConsultation: (id) => `/admin/leads/consultations/${id}`,
    subscribers: '/admin/leads/subscribers',
    subscriber: (id) => `/admin/leads/subscribers/${id}`,
    exportSubscribers: '/admin/leads/subscribers/export',
  },

  /* ————— Commerce ————— */
  orders: {
    list: '/admin/orders',
    detail: (id) => `/admin/orders/${id}`,
    update: (id) => `/admin/orders/${id}`,
    updateStatus: (id) => `/admin/orders/${id}/status`,
    refund: (id) => `/admin/orders/${id}/refund`,
  },
  payments: {
    list: '/admin/payments',
    detail: (id) => `/admin/payments/${id}`,
  },
  coupons: {
    list: '/admin/coupons',
    detail: (id) => `/admin/coupons/${id}`,
    create: '/admin/coupons',
    update: (id) => `/admin/coupons/${id}`,
    delete: (id) => `/admin/coupons/${id}`,
  },

  /* ————— Support ————— */
  tickets: {
    list: '/admin/tickets',
    detail: (id) => `/admin/tickets/${id}`,
    reply: (id) => `/admin/tickets/${id}/reply`,
    updateStatus: (id) => `/admin/tickets/${id}/status`,
    assign: (id) => `/admin/tickets/${id}/assign`,
    note: (id) => `/admin/tickets/${id}/note`,
  },

  /* ————— Users ————— */
  users: {
    list: '/admin/users',
    detail: (id) => `/admin/users/${id}`,
    create: '/admin/users',
    update: (id) => `/admin/users/${id}`,
    updateRole: (id) => `/admin/users/${id}/role`,
    delete: (id) => `/admin/users/${id}`,
    suspend: (id) => `/admin/users/${id}/suspend`,
    activate: (id) => `/admin/users/${id}/activate`,
  },

  /* ————— Media ————— */
  media: {
    list: '/admin/media',
    detail: (id) => `/admin/media/${id}`,
    upload: '/admin/media/upload',
    delete: (id) => `/admin/media/${id}`,
    folders: '/admin/media/folders',
  },

  /* ————— Analytics ————— */
  analytics: {
    overview: '/admin/analytics/overview',
    revenue: '/admin/analytics/revenue',
    traffic: '/admin/analytics/traffic',
    conversions: '/admin/analytics/conversions',
    services: '/admin/analytics/services',
  },

  /* ————— Settings ————— */
  settings: {
    get: '/admin/settings',
    update: '/admin/settings',
    emailTemplates: '/admin/settings/email-templates',
    emailTemplate: (id) => `/admin/settings/email-templates/${id}`,
    updateEmailTemplate: (id) => `/admin/settings/email-templates/${id}`,
    testEmail: '/admin/settings/test-email',
  },

  /* ————— Notifications (staff) ————— */
  notifications: {
    list: '/notifications',
    unreadCount: '/notifications/unread-count',
    unreadCountByType: '/notifications/unread-count-by-type',
    markRead: (id) => `/notifications/${id}/read`,
    markReadByType: '/notifications/read-by-type',
    markAllRead: '/notifications/read-all',
    remove: (id) => `/notifications/${id}`,
    clearAll: '/notifications/clear-all',
  },
};

export default ENDPOINTS;
