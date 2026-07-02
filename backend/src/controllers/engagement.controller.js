import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Testimonial, Review, FAQ, Order } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';

/* ========== TESTIMONIALS ========== */
export const testimonial = {
  list: asyncHandler(async (req, res) => {
    const opts = getPaginationOptions(req.query);
    const filter = { isPublished: true };
    if (req.query.featured === 'true') filter.isFeatured = true;
    const { items, meta } = await paginate(Testimonial, filter, opts);
    return ApiResponse.ok(res, items, 'Testimonials', meta);
  }),
  create: asyncHandler(async (req, res) => {
    const t = await Testimonial.create(req.body);
    return ApiResponse.created(res, { testimonial: t }, 'Testimonial created');
  }),
  update: asyncHandler(async (req, res) => {
    const t = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!t) throw ApiError.notFound('Testimonial not found');
    return ApiResponse.ok(res, { testimonial: t }, 'Updated');
  }),
  remove: asyncHandler(async (req, res) => {
    const t = await Testimonial.findByIdAndDelete(req.params.id);
    if (!t) throw ApiError.notFound('Testimonial not found');
    return ApiResponse.ok(res, null, 'Deleted');
  }),
};

/* ========== REVIEWS ========== */
export const review = {
  listByService: asyncHandler(async (req, res) => {
    const opts = getPaginationOptions(req.query);
    const filter = { service: req.params.serviceId, isPublished: true };
    const { items, meta } = await paginate(Review, filter, opts, {
      populate: [{ path: 'customer', select: 'firstName lastName avatar' }],
    });
    return ApiResponse.ok(res, items, 'Reviews', meta);
  }),
  create: asyncHandler(async (req, res) => {
    // Verify purchase
    const purchased = await Order.exists({
      customer: req.user._id,
      status: { $in: ['paid', 'completed', 'in_progress'] },
      'items.service': req.body.service,
    });
    const existing = await Review.findOne({ customer: req.user._id, service: req.body.service });
    if (existing) throw ApiError.conflict('You already reviewed this service');

    const r = await Review.create({
      ...req.body,
      customer: req.user._id,
      isVerifiedPurchase: !!purchased,
    });
    return ApiResponse.created(res, { review: r }, 'Review submitted for approval');
  }),
  moderate: asyncHandler(async (req, res) => {
    const r = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: req.body.isApproved, isPublished: req.body.isPublished, isFeatured: req.body.isFeatured },
      { new: true }
    );
    if (!r) throw ApiError.notFound('Review not found');
    return ApiResponse.ok(res, { review: r }, 'Review moderated');
  }),
  reply: asyncHandler(async (req, res) => {
    const r = await Review.findByIdAndUpdate(
      req.params.id,
      { adminReply: { content: req.body.content, author: req.user._id, at: new Date() } },
      { new: true }
    );
    if (!r) throw ApiError.notFound('Review not found');
    return ApiResponse.ok(res, { review: r }, 'Reply posted');
  }),
  listAdmin: asyncHandler(async (req, res) => {
    const opts = getPaginationOptions(req.query);
    const filter = {};
    if (req.query.approved === 'false') filter.isApproved = false;
    const { items, meta } = await paginate(Review, filter, opts, {
      populate: [{ path: 'customer', select: 'firstName lastName email' }, { path: 'service', select: 'title slug' }],
    });
    return ApiResponse.ok(res, items, 'Reviews', meta);
  }),
  remove: asyncHandler(async (req, res) => {
    const r = await Review.findByIdAndDelete(req.params.id);
    if (!r) throw ApiError.notFound('Review not found');
    return ApiResponse.ok(res, null, 'Deleted');
  }),
};

/* ========== FAQS ========== */
export const faq = {
  list: asyncHandler(async (req, res) => {
    const filter = { isPublished: true };
    if (req.query.category) filter.category = req.query.category;
    const items = await FAQ.find(filter).sort({ order: 1, createdAt: -1 });
    return ApiResponse.ok(res, items, 'FAQs');
  }),
  helpful: asyncHandler(async (req, res) => {
    const inc = req.body.helpful ? { helpful: 1 } : { notHelpful: 1 };
    await FAQ.updateOne({ _id: req.params.id }, { $inc: inc });
    return ApiResponse.ok(res, null, 'Feedback recorded');
  }),
  create: asyncHandler(async (req, res) => {
    const f = await FAQ.create(req.body);
    return ApiResponse.created(res, { faq: f }, 'FAQ created');
  }),
  update: asyncHandler(async (req, res) => {
    const f = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!f) throw ApiError.notFound('FAQ not found');
    return ApiResponse.ok(res, { faq: f }, 'Updated');
  }),
  remove: asyncHandler(async (req, res) => {
    const f = await FAQ.findByIdAndDelete(req.params.id);
    if (!f) throw ApiError.notFound('FAQ not found');
    return ApiResponse.ok(res, null, 'Deleted');
  }),
};
