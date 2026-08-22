import { Coupon, Order, User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { ORDER_STATUS } from '../utils/constants.js';
import logger from '../config/logger.js';

export const COUPON_RESERVATION_TTL_MS = 30 * 60 * 1000;

const sameId = (left, right) => left?.toString() === right?.toString();

/**
 * Return the portion of the cart to which a coupon applies. When both service
 * and category lists are configured, matching either list makes a line
 * eligible. An unrestricted coupon applies to the entire cart.
 */
export const getCouponEligibleSubtotal = (coupon, items) => {
  const serviceIds = coupon.applicableServices || [];
  const categories = coupon.applicableCategories || [];
  const restricted = serviceIds.length > 0 || categories.length > 0;

  return items.reduce((total, item) => {
    const serviceMatch = serviceIds.some((id) => sameId(id, item.service));
    const categoryMatch = categories.includes(item.serviceCategory);
    return !restricted || serviceMatch || categoryMatch ? total + item.subtotal : total;
  }, 0);
};

export const calculateCouponDiscount = (coupon, eligibleSubtotal) => {
  let discount = coupon.type === 'percent'
    ? (eligibleSubtotal * coupon.value) / 100
    : coupon.value;
  if (coupon.maxDiscount !== null && coupon.maxDiscount !== undefined) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  return Math.max(0, Math.min(discount, eligibleSubtotal));
};

/** Validate all non-concurrent restrictions and return the checkout snapshot. */
export const prepareCoupon = async ({ code, items, subtotal, userId, recurring, orderId }) => {
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!coupon) throw ApiError.badRequest('Invalid coupon');

  const validity = coupon.isValid();
  if (!validity.valid) throw ApiError.badRequest(validity.reason);
  if (coupon.minPurchase && subtotal < coupon.minPurchase) {
    throw ApiError.badRequest(`Minimum $${coupon.minPurchase} required`);
  }

  const eligibleSubtotal = getCouponEligibleSubtotal(coupon, items);
  if (eligibleSubtotal <= 0) {
    throw ApiError.badRequest('Coupon does not apply to the selected services');
  }

  const priorUseCount = coupon.usedBy.filter((entry) => sameId(entry.user, userId)).length;
  const reservationCount = coupon.reservations
    ? coupon.reservations.filter((entry) => !sameId(entry.order, orderId)).length
    : 0;
  const userReservationCount = userId
    ? coupon.reservations.filter((entry) => sameId(entry.user, userId) && !sameId(entry.order, orderId)).length
    : 0;
  if (coupon.usageLimit !== null && coupon.usageLimit !== undefined &&
      coupon.usedCount + reservationCount >= coupon.usageLimit) {
    throw ApiError.badRequest('Coupon usage limit reached');
  }
  if (!userId && (
    coupon.usageLimitPerUser !== null || coupon.firstOrderOnly || coupon.newCustomerOnly
  )) {
    throw ApiError.unauthorized('Sign in to validate this coupon');
  }
  if (
    coupon.usageLimitPerUser !== null &&
    coupon.usageLimitPerUser !== undefined &&
    priorUseCount + userReservationCount >= coupon.usageLimitPerUser
  ) {
    throw ApiError.badRequest('Coupon usage limit reached for this account');
  }

  if (coupon.firstOrderOnly || coupon.newCustomerOnly) {
    const previousOrder = await Order.exists({
      customer: userId,
      ...(orderId ? { _id: { $ne: orderId } } : {}),
      $and: [
        {
          $or: [
            { 'coupon.couponId': { $exists: true } },
            { 'coupon.code': { $exists: true } },
          ],
        },
        {
          $or: [
            {
              status: {
                $in: [
                  ORDER_STATUS.PENDING,
                  ORDER_STATUS.PROCESSING,
                  ORDER_STATUS.PAID,
                  ORDER_STATUS.IN_PROGRESS,
                  ORDER_STATUS.COMPLETED,
                  ORDER_STATUS.REFUNDED,
                ],
              },
            },
            { status: ORDER_STATUS.FAILED, paymentExpiresAt: { $exists: true } },
          ],
        },
      ],
    });
    if (previousOrder) {
      throw ApiError.badRequest(
        coupon.firstOrderOnly ? 'Coupon is valid for the first order only' : 'Coupon is valid for new customers only'
      );
    }
  }

  if (recurring && !coupon.stripeCouponId && !coupon.stripePromoCodeId) {
    throw ApiError.badRequest('This coupon is not configured for recurring billing');
  }

  return {
    coupon,
    payload: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      appliedDiscount: calculateCouponDiscount(coupon, eligibleSubtotal),
    },
  };
};

/**
 * Atomically reserve one use. This prevents concurrent checkouts from passing
 * the same global/per-user limit before either payment webhook arrives.
 */
export const reserveCoupon = async ({ couponId, userId, orderId }) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + COUPON_RESERVATION_TTL_MS);

  const existing = await Coupon.findOne({ _id: couponId, 'reservations.order': orderId });

  const claimFirstOrderMarker = async (coupon, markerExpiresAt) => {
    if (!coupon.firstOrderOnly && !coupon.newCustomerOnly) return;
    const userClaim = await User.findOneAndUpdate(
      {
        _id: userId,
        firstOrderDiscountUsedAt: { $exists: false },
        $or: [
          { 'firstOrderDiscountReservation.order': orderId },
          { firstOrderDiscountReservation: { $exists: false } },
        ],
      },
      {
        $set: {
          firstOrderDiscountReservation: {
            order: orderId,
            coupon: couponId,
            expiresAt: markerExpiresAt,
          },
        },
      },
      { new: true }
    );
    if (!userClaim) throw ApiError.conflict('Another first-order discount checkout is already active');
  };

  if (existing) {
    const reservation = existing.reservations.find((entry) => sameId(entry.order, orderId));
    await claimFirstOrderMarker(existing, reservation?.expiresAt || expiresAt);
    return existing;
  }

  // Expired reservations still count until the cleanup worker has cancelled
  // the corresponding Stripe object. Otherwise an old, still-payable intent
  // could exceed the coupon's limit after its slot was reallocated.
  const reservationCount = { $size: { $ifNull: ['$reservations', []] } };
  const userReservationCount = {
    $size: {
      $filter: {
        input: { $ifNull: ['$reservations', []] },
        as: 'reservation',
        cond: { $eq: ['$$reservation.user', userId] },
      },
    },
  };
  const priorUserUses = {
    $size: {
      $filter: {
        input: { $ifNull: ['$usedBy', []] },
        as: 'use',
        cond: { $eq: ['$$use.user', userId] },
      },
    },
  };

  const coupon = await Coupon.findOneAndUpdate(
    {
      _id: couponId,
      isActive: true,
      'reservations.order': { $ne: orderId },
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
        {
          $expr: {
            $and: [
              {
                $or: [
                  { $eq: [{ $ifNull: ['$usageLimit', null] }, null] },
                  {
                    $lt: [
                      { $add: [{ $ifNull: ['$usedCount', 0] }, reservationCount] },
                      '$usageLimit',
                    ],
                  },
                ],
              },
              {
                $or: [
                  { $eq: [{ $ifNull: ['$usageLimitPerUser', null] }, null] },
                  {
                    $lt: [
                      { $add: [priorUserUses, userReservationCount] },
                      '$usageLimitPerUser',
                    ],
                  },
                ],
              },
            ],
          },
        },
      ],
    },
    { $push: { reservations: { user: userId, order: orderId, expiresAt, createdAt: now } } },
    { new: true }
  );

  if (!coupon) {
    throw ApiError.conflict('Coupon usage limit reached or coupon is no longer available');
  }

  if (coupon.firstOrderOnly || coupon.newCustomerOnly) {
    try {
      await claimFirstOrderMarker(coupon, expiresAt);
    } catch (error) {
      await Coupon.updateOne({ _id: couponId }, { $pull: { reservations: { order: orderId } } });
      throw error;
    }
  }
  return coupon;
};

export const finalizeCouponUsage = async (order) => {
  if (!order.coupon?.code) return false;
  const couponFilter = order.coupon.couponId
    ? { _id: order.coupon.couponId }
    : { code: order.coupon.code };
  const alreadyUsed = await Coupon.exists({ ...couponFilter, 'usedBy.order': order._id });
  if (alreadyUsed) return false;

  let coupon = await Coupon.findOneAndUpdate(
    {
      ...couponFilter,
      'reservations.order': order._id,
      'usedBy.order': { $ne: order._id },
    },
    {
      $pull: { reservations: { order: order._id } },
      $inc: { usedCount: 1 },
      $push: { usedBy: { user: order.customer._id || order.customer, order: order._id, at: new Date() } },
    },
    { new: true }
  );

  // Backward-compatible path for orders created before reservations existed.
  if (!coupon) {
    coupon = await Coupon.findOneAndUpdate(
      { ...couponFilter, 'usedBy.order': { $ne: order._id } },
      {
        $inc: { usedCount: 1 },
        $push: { usedBy: { user: order.customer._id || order.customer, order: order._id, at: new Date() } },
      },
      { new: true }
    );
  }

  if (!coupon) {
    logger.warn(`Could not finalize coupon ${order.coupon.code} for order ${order._id}`);
    return false;
  }
  await Order.updateOne({ _id: order._id }, { $set: { 'coupon.finalizedAt': new Date() } });
  if (coupon.firstOrderOnly || coupon.newCustomerOnly) {
    await User.updateOne(
      { _id: order.customer._id || order.customer, 'firstOrderDiscountReservation.order': order._id },
      {
        $set: { firstOrderDiscountUsedAt: new Date(), firstOrderDiscountOrder: order._id },
        $unset: { firstOrderDiscountReservation: 1 },
      }
    );
  }
  return true;
};

export const releaseCouponReservation = async (order) => {
  if (!order.coupon?.code) return false;
  const couponFilter = order.coupon.couponId
    ? { _id: order.coupon.couponId }
    : { code: order.coupon.code };
  const result = await Coupon.updateOne(
    couponFilter,
    { $pull: { reservations: { order: order._id } } }
  );
  await User.updateOne(
    { _id: order.customer._id || order.customer, 'firstOrderDiscountReservation.order': order._id },
    { $unset: { firstOrderDiscountReservation: 1 } }
  );
  return result.modifiedCount > 0;
};
