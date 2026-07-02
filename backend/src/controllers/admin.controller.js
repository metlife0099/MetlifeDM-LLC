import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User, Order, Payment, Service, Contact, Consultation, Chat, Ticket, Blog, AuditLog } from '../models/index.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../utils/constants.js';

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return startOfDay(d); };

/* GET /admin/dashboard */
export const dashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const today = startOfDay(now);
  const weekAgo = daysAgo(7);
  const monthAgo = daysAgo(30);

  const [
    totalCustomers,
    newCustomersWeek,
    revenueAgg,
    revenueMonthAgg,
    ordersToday,
    ordersWeek,
    ordersMonth,
    pendingOrders,
    activeChats,
    openTickets,
    newContacts,
    upcomingConsultations,
    publishedPosts,
  ] = await Promise.all([
    User.countDocuments({ role: 'customer', status: 'active' }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: weekAgo } }),
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.SUCCEEDED } },
      { $group: { _id: null, total: { $sum: '$amount' }, refunded: { $sum: '$amountRefunded' } } },
    ]),
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.SUCCEEDED, paidAt: { $gte: monthAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.countDocuments({ createdAt: { $gte: weekAgo } }),
    Order.countDocuments({ createdAt: { $gte: monthAgo } }),
    Order.countDocuments({ status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING] } }),
    Chat.countDocuments({ status: { $in: ['bot', 'queued', 'active'] } }),
    Ticket.countDocuments({ status: { $in: ['open', 'in_progress', 'waiting_customer'] } }),
    Contact.countDocuments({ status: 'new', createdAt: { $gte: weekAgo } }),
    Consultation.countDocuments({ preferredDate: { $gte: now }, status: { $in: ['pending', 'confirmed'] } }),
    Blog.countDocuments({ status: 'published' }),
  ]);

  return ApiResponse.ok(
    res,
    {
      revenue: {
        total: revenueAgg[0]?.total || 0,
        refunded: revenueAgg[0]?.refunded || 0,
        net: (revenueAgg[0]?.total || 0) - (revenueAgg[0]?.refunded || 0),
        month: revenueMonthAgg[0]?.total || 0,
      },
      customers: { total: totalCustomers, newThisWeek: newCustomersWeek },
      orders: { today: ordersToday, week: ordersWeek, month: ordersMonth, pending: pendingOrders },
      engagement: { activeChats, openTickets, newContacts, upcomingConsultations },
      content: { publishedPosts },
    },
    'Dashboard'
  );
});

/* GET /admin/charts */
export const charts = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const from = daysAgo(days);

  const [revenueByDay, ordersByStatus, servicesByCategory, topServices] = await Promise.all([
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.SUCCEEDED, paidAt: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Service.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Order.aggregate([
      { $match: { status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.COMPLETED] } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.service',
          serviceName: { $first: '$items.serviceName' },
          orders: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return ApiResponse.ok(res, { revenueByDay, ordersByStatus, servicesByCategory, topServices }, 'Charts');
});

/* GET /admin/recent-activity */
export const recentActivity = asyncHandler(async (req, res) => {
  const [orders, contacts, chats, applications] = await Promise.all([
    Order.find().sort({ createdAt: -1 }).limit(5).populate('customer', 'firstName lastName email').select('orderNumber total status createdAt customer'),
    Contact.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email subject createdAt'),
    Chat.find({ status: { $ne: 'resolved' } }).sort({ lastMessageAt: -1 }).limit(5).select('subject lastMessagePreview status lastMessageAt'),
    AuditLog.find().sort({ createdAt: -1 }).limit(10).populate('actor', 'firstName lastName'),
  ]);
  return ApiResponse.ok(res, { orders, contacts, chats, activity: applications }, 'Activity');
});

/* GET /admin/audit-logs */
export const auditLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200).populate('actor', 'firstName lastName email');
  return ApiResponse.ok(res, logs, 'Audit logs');
});
