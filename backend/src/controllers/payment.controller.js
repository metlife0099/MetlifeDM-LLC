import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Payment } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';
import { refundPayment } from '../services/stripe.service.js';

export const listMyPayments = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const { items, meta } = await paginate(
    Payment,
    { customer: req.user._id },
    opts,
    { populate: [{ path: 'order', select: 'orderNumber items total' }] }
  );
  return ApiResponse.ok(res, items, 'Payments', meta);
});

export const getPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate('order').populate('customer', 'firstName lastName email');
  if (!payment) throw ApiError.notFound('Payment not found');
  const isOwner = payment.customer._id.toString() === req.user._id.toString();
  const isAdmin = ['admin', 'super_admin', 'manager'].includes(req.user.role);
  if (!isOwner && !isAdmin) throw ApiError.forbidden();
  return ApiResponse.ok(res, { payment }, 'Payment');
});

/* Admin */
export const listPayments = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (opts.search) filter.invoiceNumber = { $regex: opts.search, $options: 'i' };
  const { items, meta } = await paginate(Payment, filter, opts, {
    populate: [{ path: 'customer', select: 'firstName lastName email' }, { path: 'order', select: 'orderNumber' }],
  });
  return ApiResponse.ok(res, items, 'Payments', meta);
});

export const refund = asyncHandler(async (req, res) => {
  const { payment, refund: r } = await refundPayment({
    paymentId: req.params.id,
    amount: req.body.amount,
    reason: req.body.reason,
    actor: req.user._id,
  });
  return ApiResponse.ok(res, { payment, refund: r }, 'Refund processed');
});
