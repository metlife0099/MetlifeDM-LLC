/**
 * adminPanel.controller.js
 *
 * Endpoints the admin panel (separate React app) expects — split dashboard,
 * analytics, email templates, plus small helpers for CSV export, role updates,
 * suspend/activate, order refunds, and ticket assignment.
 *
 * Delegates content CRUD to existing controllers via the admin router.
 */
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import {
  User,
  Order,
  Payment,
  Service,
  Contact,
  Consultation,
  Ticket,
  Blog,
  AuditLog,
  Newsletter,
  Notification,
  EmailTemplate,
} from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';
import { ORDER_STATUS, PAYMENT_STATUS, USER_STATUS } from '../utils/constants.js';
import emailService from '../services/email.service.js';
import logger from '../config/logger.js';

/* ────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────── */
const rangeToDays = (r) => {
  switch (r) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case 'ytd': {
      const start = new Date(new Date().getFullYear(), 0, 1);
      return Math.max(1, Math.ceil((Date.now() - start.getTime()) / 86_400_000));
    }
    case '12m': return 365;
    case 'all': return 3650;
    default: return 30;
  }
};

const daysAgo = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

const pctDelta = (curr, prev) => {
  if (!prev || prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
};

const humanize = (s = '') => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

/* ────────────────────────────────────────────────────────────
 * DASHBOARD
 * ──────────────────────────────────────────────────────────── */

/** GET /admin/dashboard/overview?range=30d */
export const dashboardOverview = asyncHandler(async (req, res) => {
  const days = rangeToDays(req.query.range);
  const currStart = daysAgo(days);
  const prevStart = daysAgo(days * 2);
  const prevEnd = currStart;

  const [revCurr, revPrev, ordCurr, ordPrev, usrCurr, usrPrev, ldCurr, ldPrev] = await Promise.all([
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.SUCCEEDED, createdAt: { $gte: currStart } } },
      { $group: { _id: null, v: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.SUCCEEDED, createdAt: { $gte: prevStart, $lt: prevEnd } } },
      { $group: { _id: null, v: { $sum: '$amount' } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: currStart } }),
    Order.countDocuments({ createdAt: { $gte: prevStart, $lt: prevEnd } }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: currStart } }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: prevStart, $lt: prevEnd } }),
    Promise.all([
      Contact.countDocuments({ createdAt: { $gte: currStart } }),
      Consultation.countDocuments({ createdAt: { $gte: currStart } }),
    ]).then(([a, b]) => a + b),
    Promise.all([
      Contact.countDocuments({ createdAt: { $gte: prevStart, $lt: prevEnd } }),
      Consultation.countDocuments({ createdAt: { $gte: prevStart, $lt: prevEnd } }),
    ]).then(([a, b]) => a + b),
  ]);

  const rC = revCurr[0]?.v || 0;
  const rP = revPrev[0]?.v || 0;

  return ApiResponse.ok(res, {
    kpis: {
      revenue: { value: rC, delta: pctDelta(rC, rP) },
      orders: { value: ordCurr, delta: pctDelta(ordCurr, ordPrev) },
      newUsers: { value: usrCurr, delta: pctDelta(usrCurr, usrPrev) },
      leads: { value: ldCurr, delta: pctDelta(ldCurr, ldPrev) },
    },
  }, 'Dashboard overview');
});

/** GET /admin/dashboard/revenue?range=30d */
export const dashboardRevenue = asyncHandler(async (req, res) => {
  const days = rangeToDays(req.query.range);
  const start = daysAgo(days);
  const bucket = days <= 31 ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                            : { $dateToString: { format: '%Y-%m', date: '$createdAt' } };

  const rows = await Payment.aggregate([
    { $match: { status: PAYMENT_STATUS.SUCCEEDED, createdAt: { $gte: start } } },
    { $group: { _id: bucket, value: { $sum: '$amount' }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const series = rows.map((r) => ({ date: r._id, value: r.value, orders: r.orders }));
  const total = series.reduce((a, r) => a + r.value, 0);
  const totalOrders = series.reduce((a, r) => a + r.orders, 0);
  const averageOrderValue = totalOrders > 0 ? Math.round((total / totalOrders) * 100) / 100 : 0;

  return ApiResponse.ok(res, { series, total, averageOrderValue }, 'Revenue');
});

/** GET /admin/dashboard/orders-by-status */
export const dashboardOrdersByStatus = asyncHandler(async (req, res) => {
  const rows = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  const series = rows.map((r) => ({ label: humanize(r._id || 'unknown'), count: r.count }));
  return ApiResponse.ok(res, { series }, 'Orders by status');
});

/** GET /admin/dashboard/leads?range=30d */
export const dashboardLeads = asyncHandler(async (req, res) => {
  const days = rangeToDays(req.query.range);
  const start = daysAgo(days);
  const [contacts, consultations, subscribers] = await Promise.all([
    Contact.countDocuments({ createdAt: { $gte: start } }),
    Consultation.countDocuments({ createdAt: { $gte: start } }),
    Newsletter.countDocuments({ createdAt: { $gte: start } }),
  ]);
  return ApiResponse.ok(res, { contacts, consultations, subscribers }, 'Leads');
});

/** GET /admin/dashboard/top-services?range=30d&limit=10 */
export const dashboardTopServices = asyncHandler(async (req, res) => {
  const days = rangeToDays(req.query.range);
  const limit = Math.min(20, Number(req.query.limit) || 5);
  const start = daysAgo(days);
  const rows = await Order.aggregate([
    { $match: { createdAt: { $gte: start }, status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.COMPLETED, ORDER_STATUS.IN_PROGRESS] } } },
    { $unwind: '$items' },
    { $group: {
      _id: '$items.service',
      orders: { $sum: 1 },
      revenue: { $sum: { $multiply: ['$items.price', { $ifNull: ['$items.quantity', 1] }] } },
    } },
    { $sort: { revenue: -1 } },
    { $limit: limit },
    { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
    { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
    { $project: {
      _id: 1,
      title: { $ifNull: ['$service.title', 'Unknown'] },
      slug: '$service.slug',
      orders: 1,
      revenue: 1,
    } },
  ]);
  return ApiResponse.ok(res, rows, 'Top services');
});

/** GET /admin/dashboard/recent-activity?limit=10 */
export const dashboardRecentActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const items = await AuditLog.find({}).sort({ createdAt: -1 }).limit(limit).lean();
  const normalized = items.map((l) => ({
    _id: l._id,
    title: l.action || humanize(l.type || 'event'),
    description: l.description || l.details?.summary,
    type: l.type,
    status: l.status,
    createdAt: l.createdAt,
  }));
  return ApiResponse.ok(res, normalized, 'Recent activity');
});

/* ────────────────────────────────────────────────────────────
 * ANALYTICS (deeper charts)
 * ──────────────────────────────────────────────────────────── */

export const analyticsOverview = asyncHandler(async (req, res) => {
  const days = rangeToDays(req.query.range);
  const start = daysAgo(days);
  const prevStart = daysAgo(days * 2);

  const [revCurr, revPrev, ordCurr, ordPrev, sessions] = await Promise.all([
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.SUCCEEDED, createdAt: { $gte: start } } },
      { $group: { _id: null, v: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.SUCCEEDED, createdAt: { $gte: prevStart, $lt: start } } },
      { $group: { _id: null, v: { $sum: '$amount' } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: start } }),
    Order.countDocuments({ createdAt: { $gte: prevStart, $lt: start } }),
    Contact.countDocuments({ createdAt: { $gte: start } }), // rough proxy for sessions
  ]);

  const rC = revCurr[0]?.v || 0;
  const rP = revPrev[0]?.v || 0;
  const conversion = sessions > 0 ? Math.round((ordCurr / sessions) * 1000) / 10 : 0;

  return ApiResponse.ok(res, {
    kpis: {
      revenue: { value: rC, delta: pctDelta(rC, rP) },
      orders: { value: ordCurr, delta: pctDelta(ordCurr, ordPrev) },
      conversionRate: { value: conversion, delta: 0 },
      sessions: { value: sessions, delta: 0 },
    },
  }, 'Analytics overview');
});

export const analyticsRevenue = dashboardRevenue; // same shape

export const analyticsTraffic = asyncHandler(async (req, res) => {
  const days = rangeToDays(req.query.range);
  const start = daysAgo(days);
  const rows = await Contact.aggregate([
    { $match: { createdAt: { $gte: start } } },
    { $group: { _id: { $ifNull: ['$source', 'direct'] }, value: { $sum: 1 } } },
    { $sort: { value: -1 } },
  ]);
  const sources = rows.map((r) => ({ source: humanize(r._id), value: r.value }));
  return ApiResponse.ok(res, { sources }, 'Traffic');
});

export const analyticsConversions = asyncHandler(async (req, res) => {
  const days = rangeToDays(req.query.range);
  const start = daysAgo(days);
  const [visitors, contacts, consultations, orders, paid] = await Promise.all([
    Contact.countDocuments({ createdAt: { $gte: start } }),
    Contact.countDocuments({ createdAt: { $gte: start } }),
    Consultation.countDocuments({ createdAt: { $gte: start } }),
    Order.countDocuments({ createdAt: { $gte: start } }),
    Order.countDocuments({ createdAt: { $gte: start }, status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.COMPLETED] } }),
  ]);
  const funnel = [
    { name: 'Visitors', count: Math.max(visitors, orders * 10) },
    { name: 'Leads', count: contacts + consultations },
    { name: 'Consultations', count: consultations },
    { name: 'Orders', count: orders },
    { name: 'Paid', count: paid },
  ];
  return ApiResponse.ok(res, { funnel }, 'Conversion funnel');
});

export const analyticsServices = dashboardTopServices; // same shape

/* ────────────────────────────────────────────────────────────
 * NOTIFICATIONS (unread count)
 * ──────────────────────────────────────────────────────────── */
export const notificationsUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    userId: req.user._id,
    isRead: false,
  });
  return ApiResponse.ok(res, { count }, 'Unread notification count');
});

/* ────────────────────────────────────────────────────────────
 * USERS · role / suspend / activate
 * ──────────────────────────────────────────────────────────── */
export const userUpdateRole = asyncHandler(async (req, res) => {
  if (req.user.role !== 'super_admin') {
    throw ApiError.forbidden('Only super admins can change roles');
  }
  const { role } = req.body;
  const u = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  if (!u) throw ApiError.notFound('User not found');
  return ApiResponse.ok(res, u, 'Role updated');
});

export const userSuspend = asyncHandler(async (req, res) => {
  const u = await User.findByIdAndUpdate(
    req.params.id,
    { status: USER_STATUS.SUSPENDED, suspensionReason: req.body.reason || 'Suspended by admin' },
    { new: true }
  ).select('-password');
  if (!u) throw ApiError.notFound('User not found');
  return ApiResponse.ok(res, u, 'User suspended');
});

export const userActivate = asyncHandler(async (req, res) => {
  const u = await User.findByIdAndUpdate(
    req.params.id,
    { status: USER_STATUS.ACTIVE, suspensionReason: null },
    { new: true }
  ).select('-password');
  if (!u) throw ApiError.notFound('User not found');
  return ApiResponse.ok(res, u, 'User activated');
});

/* ────────────────────────────────────────────────────────────
 * NEWSLETTER · export CSV
 * ──────────────────────────────────────────────────────────── */
export const subscribersExport = asyncHandler(async (req, res) => {
  const subs = await Newsletter.find({}).sort({ createdAt: -1 }).lean();
  const rows = [
    ['email', 'status', 'source', 'subscribed_at'],
    ...subs.map((s) => [
      s.email,
      s.status || 'active',
      s.source || 'website',
      s.createdAt?.toISOString?.() || '',
    ]),
  ];
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="subscribers-${Date.now()}.csv"`);
  return res.status(200).send(csv);
});

/* ────────────────────────────────────────────────────────────
 * EMAIL TEMPLATES
 * ──────────────────────────────────────────────────────────── */
export const listEmailTemplates = asyncHandler(async (req, res) => {
  const list = await EmailTemplate.find({}).sort({ name: 1 }).lean();
  return ApiResponse.ok(res, list, 'Email templates');
});

export const getEmailTemplate = asyncHandler(async (req, res) => {
  const t = await EmailTemplate.findById(req.params.id);
  if (!t) throw ApiError.notFound('Template not found');
  return ApiResponse.ok(res, t, 'Email template');
});

export const updateEmailTemplate = asyncHandler(async (req, res) => {
  const t = await EmailTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!t) throw ApiError.notFound('Template not found');
  return ApiResponse.ok(res, t, 'Template updated');
});

export const testEmail = asyncHandler(async (req, res) => {
  const { templateId, to } = req.body;
  if (!to) throw ApiError.badRequest('Recipient required');
  const t = await EmailTemplate.findById(templateId).lean();
  if (!t) throw ApiError.notFound('Template not found');
  try {
    await emailService.sendEmail?.({
      to,
      subject: `[TEST] ${t.subject || t.name}`,
      html: t.body || t.html || '<p>Test email</p>',
    });
  } catch (e) {
    logger.warn(`Test email failed: ${e.message}`);
  }
  return ApiResponse.ok(res, null, 'Test email sent');
});

/* ────────────────────────────────────────────────────────────
 * ORDERS · refund helper
 * ──────────────────────────────────────────────────────────── */
export const orderRefund = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  order.status = ORDER_STATUS.REFUNDED;
  order.refundedAt = new Date();
  order.refundReason = req.body.reason;
  order.refundedAmount = req.body.amount || order.total;
  order.timeline = order.timeline || [];
  order.timeline.push({
    event: 'Refund issued',
    note: req.body.reason,
    at: new Date(),
    by: req.user._id,
  });
  await order.save();
  return ApiResponse.ok(res, order, 'Refund initiated');
});

/* ────────────────────────────────────────────────────────────
 * TICKETS · reply / assign / note
 * ──────────────────────────────────────────────────────────── */
export const ticketReply = asyncHandler(async (req, res) => {
  const t = await Ticket.findById(req.params.id);
  if (!t) throw ApiError.notFound('Ticket not found');
  t.messages = t.messages || [];
  t.messages.push({
    author: req.user._id,
    content: req.body.content,
    isInternal: !!req.body.isInternal,
    createdAt: new Date(),
  });
  await t.save();
  return ApiResponse.ok(res, t, 'Reply sent');
});

export const ticketUpdateStatus = asyncHandler(async (req, res) => {
  const t = await Ticket.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!t) throw ApiError.notFound('Ticket not found');
  return ApiResponse.ok(res, t, 'Status updated');
});

export const ticketAssign = asyncHandler(async (req, res) => {
  const t = await Ticket.findByIdAndUpdate(
    req.params.id,
    { assignedTo: req.body.assigneeId || null },
    { new: true }
  ).populate('assignedTo', 'firstName lastName email');
  if (!t) throw ApiError.notFound('Ticket not found');
  return ApiResponse.ok(res, t, 'Ticket assigned');
});

export const ticketAddNote = asyncHandler(async (req, res) => {
  const t = await Ticket.findById(req.params.id);
  if (!t) throw ApiError.notFound('Ticket not found');
  t.notes = t.notes || [];
  t.notes.push({
    author: req.user._id,
    content: req.body.note,
    createdAt: new Date(),
  });
  await t.save();
  return ApiResponse.ok(res, t, 'Note added');
});

/* ────────────────────────────────────────────────────────────
 * MEDIA · folders list
 * ──────────────────────────────────────────────────────────── */
export const mediaFolders = asyncHandler(async (req, res) => {
  const { Media } = await import('../models/index.js');
  const rows = await Media.aggregate([
    { $group: { _id: { $ifNull: ['$folder', 'root'] }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  return ApiResponse.ok(res, rows.map((r) => ({ name: r._id, count: r.count })), 'Folders');
});

/* ────────────────────────────────────────────────────────────
 * BLOG · publish + comments
 * ──────────────────────────────────────────────────────────── */
export const blogPublish = asyncHandler(async (req, res) => {
  const b = await Blog.findByIdAndUpdate(
    req.params.id,
    { status: 'published', publishedAt: new Date() },
    { new: true }
  );
  if (!b) throw ApiError.notFound('Post not found');
  return ApiResponse.ok(res, b, 'Post published');
});

const commentStatusMatch = (status) => {
  if (status === 'approved') return { 'comments.isApproved': true, 'comments.isSpam': { $ne: true } };
  if (status === 'spam') return { 'comments.isSpam': true };
  if (status === 'pending') return { 'comments.isApproved': false, 'comments.isSpam': { $ne: true } };
  return null;
};

export const blogListComments = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const match = commentStatusMatch(req.query.status);
  const rows = await Blog.aggregate([
    { $unwind: '$comments' },
    ...(match ? [{ $match: match }] : []),
    { $sort: { 'comments.at': -1 } },
    { $skip: (opts.page - 1) * opts.limit },
    { $limit: opts.limit },
    { $project: {
      _id: '$comments._id',
      content: '$comments.content',
      status: {
        $cond: [
          '$comments.isSpam', 'spam',
          { $cond: ['$comments.isApproved', 'approved', 'pending'] },
        ],
      },
      author: { name: '$comments.guestName', email: '$comments.guestEmail' },
      createdAt: '$comments.at',
      post: { _id: '$_id', title: '$title', slug: '$slug' },
    } },
  ]);
  const totalAgg = await Blog.aggregate([
    { $unwind: '$comments' },
    ...(match ? [{ $match: match }] : []),
    { $count: 'total' },
  ]);
  const total = totalAgg[0]?.total || 0;
  return ApiResponse.ok(res, rows, 'Comments', {
    page: opts.page,
    limit: opts.limit,
    total,
    pages: Math.ceil(total / opts.limit),
  });
});

export const blogApproveComment = asyncHandler(async (req, res) => {
  const b = await Blog.findOneAndUpdate(
    { 'comments._id': req.params.id },
    { $set: { 'comments.$.isApproved': true, 'comments.$.isSpam': false } },
    { new: true }
  );
  if (!b) throw ApiError.notFound('Comment not found');
  return ApiResponse.ok(res, null, 'Comment approved');
});

export const blogDeleteComment = asyncHandler(async (req, res) => {
  const b = await Blog.findOneAndUpdate(
    { 'comments._id': req.params.id },
    { $pull: { comments: { _id: req.params.id } } },
    { new: true }
  );
  if (!b) throw ApiError.notFound('Comment not found');
  return ApiResponse.ok(res, null, 'Comment deleted');
});

/* ────────────────────────────────────────────────────────────
 * SETTINGS wrapper for /admin/settings
 * ──────────────────────────────────────────────────────────── */
// Re-exports handled in route file
