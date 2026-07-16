import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Service, Review } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';
import { invalidateCache } from '../middleware/cache.middleware.js';
import { CACHE_KEYS } from '../utils/constants.js';

const bust = () => invalidateCache(`${CACHE_KEYS.SERVICES_LIST}*`);

/* Public list */
export const listServices = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  // Services default to manual `order` (ascending) rather than newest-first —
  // admins control display sequence via the "Display order" field. Callers
  // that explicitly request a different sort (e.g. admin column clicks) win.
  if (!req.query.sortBy) opts.sort = { order: 1, createdAt: -1 };
  const filter = { isPublished: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.featured === 'true') filter.isFeatured = true;
  if (req.query.industry) filter.industries = req.query.industry;
  if (req.query.hasPricing === 'true') filter['pricingPlans.0'] = { $exists: true };
  if (opts.search) filter.$text = { $search: opts.search };
  const { items, meta } = await paginate(Service, filter, opts, {
    select: 'title slug shortDescription icon heroImage category startingPrice isFeatured stats pricingPlans',
  });
  return ApiResponse.ok(res, items, 'Services', meta);
});

export const getServiceBySlug = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ slug: req.params.slug, isPublished: true }).populate(
    'relatedServices',
    'title slug icon startingPrice heroImage shortDescription'
  );
  if (!service) throw ApiError.notFound('Service not found');

  // Fetch reviews aggregate
  const [reviewStats] = await Review.aggregate([
    { $match: { service: service._id, isPublished: true } },
    { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$rating' } } },
  ]);

  // Increment views (fire & forget)
  Service.updateOne({ _id: service._id }, { $inc: { 'stats.views': 1 } }).catch(() => {});

  return ApiResponse.ok(
    res,
    { service, reviews: { count: reviewStats?.count || 0, average: reviewStats?.avg?.toFixed(1) || null } },
    'Service'
  );
});

export const listCategories = asyncHandler(async (req, res) => {
  const grouped = await Service.aggregate([
    { $match: { isPublished: true } },
    { $group: { _id: '$category', count: { $sum: 1 }, minPrice: { $min: '$startingPrice' } } },
    { $sort: { count: -1 } },
  ]);
  return ApiResponse.ok(res, grouped, 'Categories');
});

/* Admin CRUD */
export const createService = asyncHandler(async (req, res) => {
  const service = await Service.create(req.body);
  await bust();
  return ApiResponse.created(res, { service }, 'Service created');
});

export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!service) throw ApiError.notFound('Service not found');
  await bust();
  return ApiResponse.ok(res, { service }, 'Service updated');
});

export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) throw ApiError.notFound('Service not found');
  await bust();
  return ApiResponse.ok(res, null, 'Service deleted');
});

export const listAllAdmin = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  if (!req.query.sortBy) opts.sort = { order: 1, createdAt: -1 };
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status) filter.isPublished = req.query.status === 'published';
  if (opts.search) filter.title = { $regex: opts.search, $options: 'i' };
  const { items, meta } = await paginate(Service, filter, opts);
  return ApiResponse.ok(res, items, 'Services (admin)', meta);
});

export const getById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw ApiError.notFound('Service not found');
  return ApiResponse.ok(res, { service }, 'Service');
});

export const reorder = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) throw ApiError.badRequest('ids array required');
  await Promise.all(ids.map((id, order) => Service.updateOne({ _id: id }, { order })));
  await bust();
  return ApiResponse.ok(res, null, 'Order updated');
});
