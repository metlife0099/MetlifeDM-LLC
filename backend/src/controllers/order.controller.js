import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Order, Service, Coupon, User } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';
import {
  createPaymentIntent,
  confirmAndSyncPayment,
  resumeOrderPayment,
  cancelOrderPayment,
  manageSubscription as manageStripeSubscription,
} from '../services/stripe.service.js';
import {
  COUPON_RESERVATION_TTL_MS,
  prepareCoupon,
  reserveCoupon,
  releaseCouponReservation,
} from '../services/coupon.service.js';
import { ORDER_STATUS, LEGAL_VERSIONS } from '../utils/constants.js';
import { notifyAdmins } from '../controllers/notification.controller.js';
import { buildOrderItems, getOrderPaymentMode } from '../services/orderPricing.service.js';

const money = (value) => Math.round(value * 100) / 100;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REPLAY_TERMINAL_STATUSES = new Set([
  ORDER_STATUS.PAID,
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REFUNDED,
]);
export const ORDER_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.FAILED]: [ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PAID]: [ORDER_STATUS.IN_PROGRESS],
  [ORDER_STATUS.IN_PROGRESS]: [ORDER_STATUS.COMPLETED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.REFUNDED]: [],
});

export const isAllowedOrderTransition = (currentStatus, nextStatus) =>
  currentStatus === nextStatus || (ORDER_TRANSITIONS[currentStatus] || []).includes(nextStatus);

const prepareCheckoutForResume = async (order, user) => {
  if (REPLAY_TERMINAL_STATUSES.has(order.status)) return order;
  const expired = order.paymentExpiresAt && order.paymentExpiresAt <= new Date();
  if (expired) {
    await cancelOrderPayment(order);
    await releaseCouponReservation(order);

    if (order.coupon?.code) {
      const prepared = await prepareCoupon({
        code: order.coupon.code,
        items: order.items,
        subtotal: order.subtotal,
        userId: user._id,
        recurring: order.paymentMode === 'subscription',
        orderId: order._id,
      });
      await reserveCoupon({
        couponId: prepared.coupon._id,
        userId: user._id,
        orderId: order._id,
      });
      order.coupon = {
        ...prepared.payload,
        couponId: prepared.coupon._id,
        reservedAt: new Date(),
      };
      order.discount = money(prepared.payload.appliedDiscount);
      order.total = money(Math.max(0, order.subtotal - order.discount + order.tax));
      if (order.total > 0 && order.total < 0.5) {
        throw ApiError.badRequest('Order total must be at least $0.50');
      }
    }
    order.paymentExpiresAt = new Date(Date.now() + COUPON_RESERVATION_TTL_MS);
    await order.save();
  } else if (order.coupon?.code) {
    const hasReservation = await Coupon.exists({
      ...(order.coupon.couponId
        ? { _id: order.coupon.couponId }
        : { code: order.coupon.code }),
      'reservations.order': order._id,
    });
    if (!hasReservation) {
      const prepared = await prepareCoupon({
        code: order.coupon.code,
        items: order.items,
        subtotal: order.subtotal,
        userId: user._id,
        recurring: order.paymentMode === 'subscription',
        orderId: order._id,
      });
      await reserveCoupon({
        couponId: prepared.coupon._id,
        userId: user._id,
        orderId: order._id,
      });
    }
  }
  return Order.findById(order._id);
};

const replayCheckout = async (res, order, user) => {
  if (REPLAY_TERMINAL_STATUSES.has(order.status)) {
    const currentOrder = await Order.findById(order._id).populate('payment');
    return ApiResponse.ok(
      res,
      { order: currentOrder, clientSecret: null, paymentIntentId: order.stripePaymentIntentId || null },
      'Checkout already processed'
    );
  }
  const resumableOrder = await prepareCheckoutForResume(order, user);
  const paymentDetails = await resumeOrderPayment(resumableOrder, user);
  const currentOrder = await Order.findById(order._id).populate('payment');
  return ApiResponse.ok(res, { order: currentOrder, ...paymentDetails }, 'Existing checkout resumed');
};

/* POST /orders */
export const createOrder = asyncHandler(async (req, res) => {
  const checkoutIdempotencyKey = req.get('Idempotency-Key');
  if (!checkoutIdempotencyKey || !UUID_PATTERN.test(checkoutIdempotencyKey)) {
    throw ApiError.badRequest('A valid UUID Idempotency-Key header is required');
  }
  const existingCheckout = await Order.findOne({ checkoutIdempotencyKey });
  if (existingCheckout) {
    if (existingCheckout.customer.toString() !== req.user._id.toString()) {
      throw ApiError.conflict('Idempotency key is already in use');
    }
    return replayCheckout(res, existingCheckout, req.user);
  }

  const {
    couponCode,
    billingAddress,
    notes,
    customerName,
    customerEmail,
    customerPhone,
    customerWebsite,
  } = req.body;
  const { items, subtotal, currency } = await buildOrderItems(req.body.items);
  const paymentMode = getOrderPaymentMode(items);

  let coupon;
  let couponPayload;
  if (couponCode) {
    const prepared = await prepareCoupon({
      code: couponCode,
      items,
      subtotal,
      userId: req.user._id,
      recurring: paymentMode === 'subscription',
    });
    coupon = prepared.coupon;
    couponPayload = prepared.payload;
  }

  const discount = money(couponPayload?.appliedDiscount || 0);
  const tax = 0;
  const total = money(Math.max(0, subtotal - discount + tax));
  if (total > 0 && total < 0.5) {
    throw ApiError.badRequest('Order total must be at least $0.50');
  }
  if (total > 999999.99) {
    throw ApiError.badRequest('Order total exceeds the supported payment limit');
  }
  const paymentExpiresAt = new Date(Date.now() + COUPON_RESERVATION_TTL_MS);
  let order;
  try {
    order = await Order.create({
      customer: req.user._id,
      checkoutIdempotencyKey,
      customerEmail: customerEmail || req.user.email,
      customerName: customerName || `${req.user.firstName} ${req.user.lastName}`,
      customerPhone,
      customerWebsite,
      items,
      subtotal,
      discount,
      tax,
      total,
      currency,
      coupon: couponPayload
        ? { ...couponPayload, couponId: coupon._id, reservedAt: new Date() }
        : undefined,
      billingAddress,
      notes,
      agreement: {
        acceptedAt: new Date(),
        termsVersion: LEGAL_VERSIONS.TERMS,
        privacyVersion: LEGAL_VERSIONS.PRIVACY,
      },
      paymentMode,
      paymentExpiresAt,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      source: 'web',
      statusHistory: [{ status: ORDER_STATUS.PENDING, note: 'Order created' }],
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    const racedOrder = await Order.findOne({ checkoutIdempotencyKey });
    if (!racedOrder || racedOrder.customer.toString() !== req.user._id.toString()) throw error;
    return replayCheckout(res, racedOrder, req.user);
  }

  if (coupon) {
    try {
      await reserveCoupon({ couponId: coupon._id, userId: req.user._id, orderId: order._id });
    } catch (error) {
      // This order has no provider object or external references yet, so this
      // is a safe rollback of the failed atomic coupon claim.
      await Order.deleteOne({ _id: order._id, stripePaymentIntentId: { $exists: false } });
      throw error;
    }
  }

  const profileUpdates = {};
  if (billingAddress) profileUpdates.address = billingAddress;
  if (customerPhone) profileUpdates.phone = customerPhone;
  if (customerWebsite) profileUpdates['company.website'] = customerWebsite;
  if (Object.keys(profileUpdates).length) {
    await User.findByIdAndUpdate(req.user._id, profileUpdates, { runValidators: true }).catch(() => {});
  }

  const user = await User.findById(req.user._id);
  let paymentDetails;
  try {
    paymentDetails = await createPaymentIntent(order, user);
  } catch (error) {
    order.pushStatus(ORDER_STATUS.FAILED, 'Payment setup failed; retry is available');
    await order.save();
    if (!error.checkoutCleanupUnsafe) await releaseCouponReservation(order);
    error.errors = [
      ...(Array.isArray(error.errors) ? error.errors : []),
      {
        field: 'orderId',
        message: 'Retry this checkout with the same Idempotency-Key',
        orderId: order._id.toString(),
        retryEndpoint: `/orders/${order._id}/payment-intent`,
      },
    ];
    throw error;
  }

  await Service.updateMany(
    { _id: { $in: items.map((item) => item.service) } },
    { $inc: { 'stats.inquiries': 1 } }
  );
  notifyAdmins({
    type: 'order',
    title: 'New order pending payment',
    message: `${order.orderNumber} - $${order.total.toFixed(2)}`,
    resourceType: 'order',
    resourceId: order._id,
    actionUrl: `/orders/${order._id}`,
  }).catch(() => {});

  const currentOrder = await Order.findById(order._id).populate('payment');
  return ApiResponse.created(
    res,
    { order: currentOrder, ...paymentDetails },
    'Order created - complete payment'
  );
});

/* GET /orders (self) */
export const listMyOrders = asyncHandler(async (req, res) => {
  const options = getPaginationOptions(req.query);
  const filter = { customer: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const { items, meta } = await paginate(Order, filter, options, {
    populate: [{ path: 'payment', select: 'invoiceNumber invoiceUrl status paidAt' }],
  });
  return ApiResponse.ok(res, items, 'My orders', meta);
});

/* POST /orders/:id/confirm-payment */
export const confirmPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.customer.toString() !== req.user._id.toString()) throw ApiError.forbidden();

  const updated = await confirmAndSyncPayment(order);
  return ApiResponse.ok(res, { order: updated }, 'Payment status synced');
});

/* POST /orders/:id/payment-intent - safely resume an owned checkout. */
export const resumePayment = asyncHandler(async (req, res) => {
  let order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  order = await prepareCheckoutForResume(order, req.user);
  const paymentDetails = await resumeOrderPayment(order, req.user);
  const currentOrder = await Order.findById(order._id).populate('payment');
  return ApiResponse.ok(res, { order: currentOrder, ...paymentDetails }, 'Payment ready');
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  const updated = await manageStripeSubscription({ order, cancelAtPeriodEnd: true });
  return ApiResponse.ok(res, { order: updated }, 'Subscription will cancel at period end');
});

export const resumeSubscription = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  const updated = await manageStripeSubscription({ order, cancelAtPeriodEnd: false });
  return ApiResponse.ok(res, { order: updated }, 'Subscription resumed');
});

export const adminManageSubscription = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  const resume = req.body.action === 'resume';
  const updated = await manageStripeSubscription({
    order,
    cancelAtPeriodEnd: resume ? false : req.body.atPeriodEnd,
    immediate: !resume && !req.body.atPeriodEnd,
  });
  return ApiResponse.ok(res, { order: updated }, resume ? 'Subscription resumed' : 'Subscription cancelled');
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
  const options = getPaginationOptions(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.customerId) filter.customer = req.query.customerId;
  if (options.search) filter.orderNumber = { $regex: options.search, $options: 'i' };
  const { items, meta } = await paginate(Order, filter, options, {
    populate: [{ path: 'customer', select: 'firstName lastName email' }],
  });
  return ApiResponse.ok(res, items, 'Orders', meta);
});

/* Admin: update status */
export const updateStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (!isAllowedOrderTransition(order.status, req.body.status)) {
    throw ApiError.conflict(`Order cannot transition from ${order.status} to ${req.body.status}`);
  }
  if (order.status === req.body.status) {
    return ApiResponse.ok(res, { order }, 'Status unchanged');
  }
  if (req.body.status === ORDER_STATUS.CANCELLED) {
    await cancelOrderPayment(order);
    await releaseCouponReservation(order);
    order.paymentExpiresAt = undefined;
    order.paymentSetupLock = undefined;
  }
  order.pushStatus(req.body.status, req.body.note, req.user._id);
  await order.save();
  return ApiResponse.ok(res, { order }, 'Status updated');
});

/* Admin: assign team */
export const assignOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      assignedTo: req.body.assignedTo,
      kickoffDate: req.body.kickoffDate,
      expectedDeliveryDate: req.body.expectedDeliveryDate,
    },
    { new: true, runValidators: true }
  );
  if (!order) throw ApiError.notFound('Order not found');
  return ApiResponse.ok(res, { order }, 'Order assigned');
});

/* Cancel an unpaid order. */
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  if (![ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING, ORDER_STATUS.FAILED].includes(order.status)) {
    throw ApiError.badRequest('Order cannot be cancelled at this stage');
  }
  await cancelOrderPayment(order);
  await releaseCouponReservation(order);
  order.pushStatus(ORDER_STATUS.CANCELLED, 'Cancelled by customer', req.user._id);
  order.paymentExpiresAt = undefined;
  order.paymentSetupLock = undefined;
  await order.save();
  return ApiResponse.ok(res, { order }, 'Order cancelled');
});
