import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Coupon, Order } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';

/* --- Public --- */

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const coupon = await Coupon.findOne({ code });
  if (!coupon) throw ApiError.notFound('Coupon not found');

  const check = coupon.isValid();
  if (!check.valid) throw ApiError.badRequest(check.reason);

  if (coupon.minPurchase && subtotal < coupon.minPurchase) {
    throw ApiError.badRequest(`Minimum order of $${coupon.minPurchase} required`);
  }

  // Per-user limit
  if (req.user && coupon.usageLimitPerUser) {
    const used = coupon.usedBy.filter((u) => u.user?.toString() === req.user._id.toString()).length;
    if (used >= coupon.usageLimitPerUser) throw ApiError.badRequest('You have already used this coupon');
  }

  // First order check
  if (coupon.firstOrderOnly && req.user) {
    const previousOrder = await Order.exists({ customer: req.user._id, status: { $in: ['paid', 'completed'] } });
    if (previousOrder) throw ApiError.badRequest('Coupon valid only on your first order');
  }

  const discount = coupon.calculateDiscount(subtotal);
  return ApiResponse.ok(
    res,
    {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
      subtotal,
      total: Math.max(0, subtotal - discount),
    },
    'Coupon applied'
  );
});

/* --- Admin --- */

export const listCoupons = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const filter = {};
  if (req.query.active === 'true') filter.isActive = true;
  if (opts.search) filter.code = { $regex: opts.search, $options: 'i' };
  const { items, meta } = await paginate(Coupon, filter, opts);
  return ApiResponse.ok(res, items, 'Coupons', meta);
});

export const getCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return ApiResponse.ok(res, { coupon }, 'Coupon');
});

export const createCoupon = asyncHandler(async (req, res) => {
  const exists = await Coupon.findOne({ code: req.body.code });
  if (exists) throw ApiError.conflict('Coupon code already exists');
  const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
  return ApiResponse.created(res, { coupon }, 'Coupon created');
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return ApiResponse.ok(res, { coupon }, 'Coupon updated');
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return ApiResponse.ok(res, null, 'Coupon deleted');
});
