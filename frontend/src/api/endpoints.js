/**
 * All backend endpoints in one place.
 * Keep in sync with backend routes.
 */
export const ENDPOINTS = {
  // Auth
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    logoutAll: '/auth/logout-all',
    verifyEmail: '/auth/verify-email',
    resendVerification: '/auth/resend-verification',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    changePassword: '/auth/change-password',
    me: '/auth/me',
    setup2FA: '/auth/2fa/setup',
    enable2FA: '/auth/2fa/enable',
    disable2FA: '/auth/2fa/disable',
  },

  // Users
  users: {
    me: '/users/me',
    avatar: '/users/me/avatar',
    wishlist: '/users/me/wishlist',
  },

  // Content
  services: {
    list: '/services',
    categories: '/services/categories',
    bySlug: (slug) => `/services/slug/${slug}`,
  },
  industries: {
    list: '/industries',
    bySlug: (slug) => `/industries/slug/${slug}`,
  },
  portfolio: {
    list: '/portfolio',
    bySlug: (slug) => `/portfolio/slug/${slug}`,
  },
  caseStudies: {
    list: '/case-studies',
    bySlug: (slug) => `/case-studies/slug/${slug}`,
  },
  blog: {
    list: '/blog',
    categories: '/blog/categories',
    bySlug: (slug) => `/blog/slug/${slug}`,
    like: (id) => `/blog/${id}/like`,
    comment: (id) => `/blog/${id}/comment`,
  },
  testimonials: '/testimonials',
  faqs: '/faqs',
  reviews: {
    byService: (id) => `/reviews/service/${id}`,
    create: '/reviews',
  },
  pages: {
    list: '/pages',
    bySlug: (slug) => `/pages/slug/${slug}`,
  },

  // Lead capture
  contact: '/contact',
  consultations: '/consultations',
  newsletter: {
    subscribe: '/newsletter/subscribe',
    unsubscribe: '/newsletter/unsubscribe',
  },
  careers: {
    list: '/careers',
    bySlug: (slug) => `/careers/slug/${slug}`,
    apply: (id) => `/careers/${id}/apply`,
  },

  // Commerce
  orders: {
    create: '/orders',
    mine: '/orders/mine',
    byId: (id) => `/orders/${id}`,
    confirmPayment: (id) => `/orders/${id}/confirm-payment`,
    cancel: (id) => `/orders/${id}/cancel`,
  },
  payments: {
    mine: '/payments/mine',
    byId: (id) => `/payments/${id}`,
    invoice: (id) => `/payments/${id}/invoice`,
  },
  coupons: {
    validate: '/coupons/validate',
  },

  // Chat + tickets
  chat: {
    start: '/chat/start',
    messages: (id) => `/chat/${id}/messages`,
    mine: '/chat/mine',
    rate: (id) => `/chat/${id}/rate`,
  },
  tickets: {
    list: '/tickets/mine',
    byId: (id) => `/tickets/${id}`,
    reply: (id) => `/tickets/${id}/reply`,
    create: '/tickets',
  },

  // Notifications
  notifications: {
    list: '/notifications',
    unread: '/notifications/unread-count',
    markRead: (id) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
  },

  // Settings
  settings: {
    public: '/settings/public',
  },
};
