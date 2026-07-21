export const USER_ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  CUSTOMER: 'customer',
});

export const ROLE_HIERARCHY = Object.freeze({
  super_admin: 4,
  admin: 3,
  manager: 2,
  customer: 1,
});

export const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
  PENDING: 'pending',
});

export const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  PAID: 'paid',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  FAILED: 'failed',
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
});

export const PAYMENT_METHOD = Object.freeze({
  CARD: 'card',
  ACH: 'ach_debit',
  BANK_TRANSFER: 'bank_transfer',
  WALLET: 'wallet',
});

export const BILLING_CYCLE = Object.freeze({
  ONE_TIME: 'one_time',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  CUSTOM: 'custom',
});

export const CHAT_STATUS = Object.freeze({
  BOT: 'bot',
  QUEUED: 'queued',
  ACTIVE: 'active',
  RESOLVED: 'resolved',
  ARCHIVED: 'archived',
});

export const TICKET_STATUS = Object.freeze({
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING_CUSTOMER: 'waiting_customer',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
});

export const TICKET_PRIORITY = Object.freeze({
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
});

export const NOTIFICATION_TYPES = Object.freeze({
  ORDER: 'order',
  PAYMENT: 'payment',
  CHAT: 'chat',
  TICKET: 'ticket',
  SYSTEM: 'system',
  MARKETING: 'marketing',
  CONSULTATION: 'consultation',
  CONTACT: 'contact',
  APPLICATION: 'application',
  USER: 'user',
  SUBSCRIBER: 'subscriber',
  COMMENT: 'comment',
});

export const BLOG_STATUS = Object.freeze({
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
});

export const CONSULTATION_STATUS = Object.freeze({
  REQUESTED: 'requested',
  CONFIRMED: 'confirmed',
  RESCHEDULED: 'rescheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
});

export const CAREER_STATUS = Object.freeze({
  OPEN: 'open',
  PAUSED: 'paused',
  CLOSED: 'closed',
});

export const APPLICATION_STATUS = Object.freeze({
  SUBMITTED: 'submitted',
  REVIEWING: 'reviewing',
  SHORTLISTED: 'shortlisted',
  INTERVIEWING: 'interviewing',
  OFFERED: 'offered',
  HIRED: 'hired',
  REJECTED: 'rejected',
});

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
});

export const CACHE_KEYS = Object.freeze({
  SERVICES_LIST: 'services:list',
  BLOG_LIST: 'blog:list',
  PORTFOLIO_LIST: 'portfolio:list',
  TESTIMONIALS: 'testimonials:list',
  FAQS: 'faqs:list',
  SETTINGS: 'settings:global',
  SITEMAP: 'seo:sitemap',
});

export const CACHE_TTL = Object.freeze({
  SHORT: 60,           // 1 min
  MEDIUM: 60 * 15,     // 15 min
  LONG: 60 * 60,       // 1 hr
  DAY: 60 * 60 * 24,   // 24 hr
});

export const REGEX = Object.freeze({
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_US: /^\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
});
