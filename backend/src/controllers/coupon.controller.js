import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Coupon } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';
import { prepareCoupon } from '../services/coupon.service.js';
import { buildOrderItems, getOrderPaymentMode } from '../services/orderPricing.service.js';

/* --- Public --- */

export const validateCoupon = asyncHandler(async (req, res) => {
  const { items, subtotal } = await buildOrderItems(req.body.items);
  const paymentMode = getOrderPaymentMode(items);
  const { coupon, payload } = await prepareCoupon({
    code: req.body.code,
    items,
    subtotal,
    userId: req.user?._id,
    recurring: paymentMode === 'subscription',
  });
  const discount = payload.appliedDiscount;
  return ApiResponse.ok(
    res,
    {
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      discount,
      appliedDiscount: discount,
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
  else if (req.query.active === 'false') filter.isActive = false;
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
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  Object.assign(coupon, req.body);
  await coupon.save();
  return ApiResponse.ok(res, { coupon }, 'Coupon updated');
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  coupon.isActive = false;
  coupon.deletedAt = new Date();
  await coupon.save({ validateBeforeSave: false });
  return ApiResponse.ok(res, null, 'Coupon deactivated');
});
