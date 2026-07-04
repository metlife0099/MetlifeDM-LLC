import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Industry, Portfolio, CaseStudy } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';

/* --------------- INDUSTRIES --------------- */
export const industry = {
  list: asyncHandler(async (req, res) => {
    const opts = getPaginationOptions(req.query);
    const filter = { isPublished: true };
    if (req.query.featured === 'true') filter.isFeatured = true;
    const { items, meta } = await paginate(Industry, filter, opts, {
      select: 'name slug shortDescription icon heroImage',
    });
    return ApiResponse.ok(res, items, 'Industries', meta);
  }),
  bySlug: asyncHandler(async (req, res) => {
    const ind = await Industry.findOne({ slug: req.params.slug, isPublished: true })
      .populate('recommendedServices', 'title slug icon startingPrice')
      .populate('caseStudies', 'title slug heroImage tagline');
    if (!ind) throw ApiError.notFound('Industry not found');
    return ApiResponse.ok(res, { industry: ind }, 'Industry');
  }),
  listAdmin: asyncHandler(async (req, res) => {
    const opts = getPaginationOptions(req.query);
    const filter = {};
    if (req.query.featured === 'true') filter.isFeatured = true;
    if (opts.search) filter.name = { $regex: opts.search, $options: 'i' };
    const { items, meta } = await paginate(Industry, filter, opts);
    return ApiResponse.ok(res, items, 'Industries (admin)', meta);
  }),
  create: asyncHandler(async (req, res) => {
    const ind = await Industry.create(req.body);
    return ApiResponse.created(res, { industry: ind }, 'Industry created');
  }),
  update: asyncHandler(async (req, res) => {
    const ind = await Industry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ind) throw ApiError.notFound('Industry not found');
    return ApiResponse.ok(res, { industry: ind }, 'Updated');
  }),
  remove: asyncHandler(async (req, res) => {
    const ind = await Industry.findByIdAndDelete(req.params.id);
    if (!ind) throw ApiError.notFound('Industry not found');
    return ApiResponse.ok(res, null, 'Deleted');
  }),
  getById: asyncHandler(async (req, res) => {
    const ind = await Industry.findById(req.params.id);
    if (!ind) throw ApiError.notFound('Industry not found');
    return ApiResponse.ok(res, { industry: ind }, 'Industry');
  }),
};

/* --------------- PORTFOLIO --------------- */
export const portfolio = {
  list: asyncHandler(async (req, res) => {
    const opts = getPaginationOptions(req.query);
    const filter = { isPublished: true };
    if (req.query.industry) filter.industry = req.query.industry;
    if (req.query.featured === 'true') filter.isFeatured = true;
    if (opts.search) filter.$text = { $search: opts.search };
    const { items, meta } = await paginate(Portfolio, filter, opts, {
      populate: [{ path: 'services', select: 'title slug' }],
    });
    return ApiResponse.ok(res, items, 'Portfolio', meta);
  }),
  bySlug: asyncHandler(async (req, res) => {
    const p = await Portfolio.findOne({ slug: req.params.slug, isPublished: true })
      .populate('services', 'title slug icon')
      .populate('caseStudy', 'title slug');
    if (!p) throw ApiError.notFound('Project not found');
    return ApiResponse.ok(res, { portfolio: p }, 'Project');
  }),
  listAdmin: asyncHandler(async (req, res) => {
    const opts = getPaginationOptions(req.query);
    const filter = {};
    if (req.query.industry) filter.industry = req.query.industry;
    if (req.query.featured === 'true') filter.isFeatured = true;
    if (opts.search) filter.$text = { $search: opts.search };
    const { items, meta } = await paginate(Portfolio, filter, opts, {
      populate: [{ path: 'services', select: 'title slug' }],
    });
    return ApiResponse.ok(res, items, 'Portfolio (admin)', meta);
  }),
  create: asyncHandler(async (req, res) => {
    const p = await Portfolio.create(req.body);
    return ApiResponse.created(res, { portfolio: p }, 'Project created');
  }),
  update: asyncHandler(async (req, res) => {
    const p = await Portfolio.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!p) throw ApiError.notFound('Project not found');
    return ApiResponse.ok(res, { portfolio: p }, 'Updated');
  }),
  remove: asyncHandler(async (req, res) => {
    const p = await Portfolio.findByIdAndDelete(req.params.id);
    if (!p) throw ApiError.notFound('Project not found');
    return ApiResponse.ok(res, null, 'Deleted');
  }),
  getById: asyncHandler(async (req, res) => {
    const p = await Portfolio.findById(req.params.id);
    if (!p) throw ApiError.notFound('Project not found');
    return ApiResponse.ok(res, { portfolio: p }, 'Project');
  }),
};

/* --------------- CASE STUDIES --------------- */
export const caseStudy = {
  list: asyncHandler(async (req, res) => {
    const opts = getPaginationOptions(req.query);
    const filter = { isPublished: true };
    if (req.query.featured === 'true') filter.isFeatured = true;
    if (req.query.industry) filter.industry = req.query.industry;
    const { items, meta } = await paginate(CaseStudy, filter, opts, {
      select: 'title slug tagline heroImage industry kpis year',
    });
    return ApiResponse.ok(res, items, 'Case studies', meta);
  }),
  bySlug: asyncHandler(async (req, res) => {
    const cs = await CaseStudy.findOne({ slug: req.params.slug, isPublished: true })
      .populate('services', 'title slug')
      .populate('portfolio', 'title slug coverImage');
    if (!cs) throw ApiError.notFound('Case study not found');
    return ApiResponse.ok(res, { caseStudy: cs }, 'Case study');
  }),
  listAdmin: asyncHandler(async (req, res) => {
    const opts = getPaginationOptions(req.query);
    const filter = {};
    if (req.query.featured === 'true') filter.isFeatured = true;
    if (req.query.industry) filter.industry = req.query.industry;
    if (opts.search) filter.title = { $regex: opts.search, $options: 'i' };
    const { items, meta } = await paginate(CaseStudy, filter, opts);
    return ApiResponse.ok(res, items, 'Case studies (admin)', meta);
  }),
  create: asyncHandler(async (req, res) => {
    const cs = await CaseStudy.create(req.body);
    return ApiResponse.created(res, { caseStudy: cs }, 'Case study created');
  }),
  update: asyncHandler(async (req, res) => {
    const cs = await CaseStudy.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cs) throw ApiError.notFound('Case study not found');
    return ApiResponse.ok(res, { caseStudy: cs }, 'Updated');
  }),
  remove: asyncHandler(async (req, res) => {
    const cs = await CaseStudy.findByIdAndDelete(req.params.id);
    if (!cs) throw ApiError.notFound('Case study not found');
    return ApiResponse.ok(res, null, 'Deleted');
  }),
  getById: asyncHandler(async (req, res) => {
    const cs = await CaseStudy.findById(req.params.id);
    if (!cs) throw ApiError.notFound('Case study not found');
    return ApiResponse.ok(res, { caseStudy: cs }, 'Case study');
  }),
};
