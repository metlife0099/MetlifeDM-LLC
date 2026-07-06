import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Order, Service, Coupon, User } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';
import { createPaymentIntent, confirmAndSyncPayment } from '../services/stripe.service.js';
import { ORDER_STATUS } from '../utils/constants.js';
import { notifyAdmins } from '../controllers/notification.controller.js';

const buildItems = async (rawItems) => {
  const built = [];
  let subtotal = 0;
  for (const it of rawItems) {
    const svc = await Service.findById(it.service);
    if (!svc || !svc.isPublished) throw ApiError.badRequest(`Service not available`);
    let unitPrice = svc.startingPrice || 0;
    let planName = 'Custom';
    let planId;
    if (it.planId) {
      const plan = svc.pricingPlans.id(it.planId);
      if (!plan) throw ApiError.badRequest('Pricing plan not found');
      unitPrice = plan.price;
      planName = plan.name;
      planId = plan._id;
    }
    const line = {
      service: svc._id,
      serviceName: svc.title,
      planId,
      planName,
      billingCycle: it.planId ? svc.pricingPlans.id(it.planId).billingCycle : undefined,
      quantity: it.quantity,
      unitPrice,
      subtotal: unitPrice * it.quantity,
    };
    subtotal += line.subtotal;
    built.push(line);
  }
  return { items: built, subtotal };
};

/* POST /orders */
export const createOrder = asyncHandler(async (req, res) => {
  const {
    couponCode, billingAddress, notes,
    customerName, customerEmail, customerPhone, customerWebsite,
  } = req.body;
  const { items, subtotal } = await buildItems(req.body.items);

  // Coupon
  let discount = 0;
  let couponPayload;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) throw ApiError.badRequest('Invalid coupon');
    const v = coupon.isValid();
    if (!v.valid) throw ApiError.badRequest(v.reason);
    if (coupon.minPurchase && subtotal < coupon.minPurchase) throw ApiError.badRequest(`Minimum $${coupon.minPurchase} required`);
    discount = coupon.calculateDiscount(subtotal);
    couponPayload = { code: coupon.code, type: coupon.type, value: coupon.value, appliedDiscount: discount };
  }

  // Tax (simple 0% by default — extend for state-based tax later)
  const tax = 0;
  const total = Math.max(0, subtotal - discount + tax);

  const order = await Order.create({
    customer: req.user._id,
    customerEmail: customerEmail || req.user.email,
    customerName: customerName || `${req.user.firstName} ${req.user.lastName}`,
    customerPhone,
    customerWebsite,
    items,
    subtotal,
    discount,
    tax,
    total,
    coupon: couponPayload,
    billingAddress,
    notes,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    source: 'web',
    statusHistory: [{ status: ORDER_STATUS.PENDING, note: 'Order created' }],
  });

  // Mirror the reusable contact details back onto the customer's profile so
  // they're prefilled automatically next time they check out.
  const profileUpdates = {};
  if (billingAddress) profileUpdates.address = billingAddress;
  if (customerPhone) profileUpdates.phone = customerPhone;
  if (customerWebsite) profileUpdates['company.website'] = customerWebsite;
  if (Object.keys(profileUpdates).length) {
    await User.findByIdAndUpdate(req.user._id, profileUpdates).catch(() => {});
  }

  const user = await User.findById(req.user._id);
  const intent = await createPaymentIntent(order, user);

  // Increment service purchase attempt stats
  await Service.updateMany(
    { _id: { $in: items.map((i) => i.service) } },
    { $inc: { 'stats.inquiries': 1 } }
  );

  notifyAdmins({
    type: 'order',
    title: 'New order pending payment',
    message: `${order.orderNumber} — $${order.total.toFixed(2)}`,
    resourceType: 'order',
    resourceId: order._id,
    actionUrl: `/orders/${order._id}`,
  }).catch(() => {});

  return ApiResponse.created(res, { order, ...intent }, 'Order created — complete payment');
});

/* GET /orders (self) */
export const listMyOrders = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const filter = { customer: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const { items, meta } = await paginate(Order, filter, opts, {
    populate: [{ path: 'payment', select: 'invoiceNumber invoiceUrl status paidAt' }],
  });
  return ApiResponse.ok(res, items, 'My orders', meta);
});

/* POST /orders/:id/confirm-payment — synchronous fallback to the webhook.
 * Called right after the client confirms payment in the browser, so the
 * order shows "paid" immediately instead of waiting on (or depending
 * entirely on) the webhook having a valid, correctly-configured secret. */
export const confirmPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.customer.toString() !== req.user._id.toString()) throw ApiError.forbidden();

  const updated = await confirmAndSyncPayment(order);
  return ApiResponse.ok(res, { order: updated }, 'Payment status synced');
});

/* GET /orders/:id (self or admin) */
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('items.service', 'title slug icon')
    .populate('payment')
    .populate('customer', 'firstName lastName email phone');
  if (!order) throw ApiError.notFound('Order not found');

  const isOwner = order.customer._id.toString() === req.user._id.toString();
  const isAdmin = ['admin', 'super_admin', 'manager'].includes(req.user.role);
  if (!isOwner && !isAdmin) throw ApiError.forbidden();

  return ApiResponse.ok(res, { order }, 'Order');
});

/* Admin: list all */
export const listOrders = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.customerId) filter.customer = req.query.customerId;
  if (opts.search) filter.orderNumber = { $regex: opts.search, $options: 'i' };
  const { items, meta } = await paginate(Order, filter, opts, {
    populate: [{ path: 'customer', select: 'firstName lastName email' }],
  });
  return ApiResponse.ok(res, items, 'Orders', meta);
});

/* Admin: update status */
export const updateStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  order.pushStatus(req.body.status, req.body.note, req.user._id);
  await order.save();
  return ApiResponse.ok(res, { order }, 'Status updated');
});

/* Admin: assign team */
export const assignOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { assignedTo: req.body.assignedTo, kickoffDate: req.body.kickoffDate, expectedDeliveryDate: req.body.expectedDeliveryDate },
    { new: true }
  );
  if (!order) throw ApiError.notFound('Order not found');
  return ApiResponse.ok(res, { order }, 'Order assigned');
});

/* Cancel (customer, only if pending) */
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  if (![ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING].includes(order.status)) {
    throw ApiError.badRequest('Order cannot be cancelled at this stage');
  }
  order.pushStatus(ORDER_STATUS.CANCELLED, 'Cancelled by customer', req.user._id);
  await order.save();
  return ApiResponse.ok(res, { order }, 'Order cancelled');
});
