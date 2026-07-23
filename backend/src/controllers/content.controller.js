import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Industry, Portfolio, PortfolioCategory, CaseStudy, CaseStudyCategory } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';

const buildCategoryCrud = (Model, label) => ({
  list: asyncHandler(async (req, res) => {
    const items = await Model.find().sort({ order: 1, name: 1 });
    return ApiResponse.ok(res, items, `${label} categories`);
  }),
  create: asyncHandler(async (req, res) => {
    const c = await Model.create(req.body);
    return ApiResponse.created(res, { category: c }, 'Category created');
  }),
  update: asyncHandler(async (req, res) => {
    const c = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!c) throw ApiError.notFound('Category not found');
    return ApiResponse.ok(res, { category: c }, 'Updated');
  }),
  remove: asyncHandler(async (req, res) => {
    const c = await Model.findByIdAndDelete(req.params.id);
    if (!c) throw ApiError.notFound('Category not found');
    return ApiResponse.ok(res, null, 'Deleted');
  }),
});

export const portfolioCategory = buildCategoryCrud(PortfolioCategory, 'Portfolio');
export const caseStudyCategory = buildCategoryCrud(CaseStudyCategory, 'Case study');

// Admin forms submit '' for an unset "No category" <select> — Mongoose can't
// cast an empty string to ObjectId, so treat it the same as "not provided".
const withOptionalRef = (body, field) =>
  body[field] === '' ? { ...body, [field]: undefined } : body;

/* --------------- INDUSTRIES --------------- */
export const industry = {
  list: asyncHandler(async (req, res) => {
    const opts = getPaginationOptions(req.query);
    // Default to manual `order` (ascending), same convention as Services —
    // admins control display sequence via the "Display order" field.
    if (!req.query.sortBy) opts.sort = { order: 1, createdAt: -1 };
    const filter = { isPublished: true };
    if (req.query.featured === 'true') filter.isFeatured = true;
    const { items, meta } = await paginate(Industry, filter, opts, {
      select: 'name slug shortDescription icon heroImage order',
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
    if (req.query.status) filter.isPublished = req.query.status === 'published';
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
    if (req.query.category) filter.category = req.query.category;
    if (req.query.featured === 'true') filter.isFeatured = true;
    if (opts.search) filter.$text = { $search: opts.search };
    const { items, meta } = await paginate(Portfolio, filter, opts, {
      populate: [{ path: 'services', select: 'title slug' }, { path: 'category', select: 'name slug color' }],
    });
    return ApiResponse.ok(res, items, 'Portfolio', meta);
  }),
  bySlug: asyncHandler(async (req, res) => {
    const p = await Portfolio.findOne({ slug: req.params.slug, isPublished: true })
      .populate('services', 'title slug icon')
      .populate('caseStudy', 'title slug')
      .populate('category', 'name slug color');
    if (!p) throw ApiError.notFound('Project not found');
    return ApiResponse.ok(res, { portfolio: p }, 'Project');
  }),
  listAdmin: asyncHandler(async (req, res) => {
    const opts = getPaginationOptions(req.query);
    const filter = {};
    if (req.query.industry) filter.industry = req.query.industry;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.featured === 'true') filter.isFeatured = true;
    if (req.query.status) filter.isPublished = req.query.status === 'published';
    if (opts.search) filter.$text = { $search: opts.search };
    const { items, meta } = await paginate(Portfolio, filter, opts, {
      populate: [{ path: 'services', select: 'title slug' }, { path: 'category', select: 'name slug color' }],
    });
    return ApiResponse.ok(res, items, 'Portfolio (admin)', meta);
  }),
  create: asyncHandler(async (req, res) => {
    const p = await Portfolio.create(withOptionalRef(req.body, 'category'));
    return ApiResponse.created(res, { portfolio: p }, 'Project created');
  }),
  update: asyncHandler(async (req, res) => {
    const p = await Portfolio.findByIdAndUpdate(req.params.id, withOptionalRef(req.body, 'category'), { new: true });
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
    if (req.query.category) filter.category = req.query.category;
    const { items, meta } = await paginate(CaseStudy, filter, opts, {
      select: 'title slug tagline heroImage industry category kpis year',
      populate: [{ path: 'category', select: 'name slug color' }],
    });
    return ApiResponse.ok(res, items, 'Case studies', meta);
  }),
  bySlug: asyncHandler(async (req, res) => {
    const cs = await CaseStudy.findOne({ slug: req.params.slug, isPublished: true })
      .populate('services', 'title slug')
      .populate('portfolio', 'title slug coverImage')
      .populate('category', 'name slug color');
    if (!cs) throw ApiError.notFound('Case study not found');
    return ApiResponse.ok(res, { caseStudy: cs }, 'Case study');
  }),
  listAdmin: asyncHandler(async (req, res) => {
    const opts = getPaginationOptions(req.query);
    const filter = {};
    if (req.query.featured === 'true') filter.isFeatured = true;
    if (req.query.industry) filter.industry = req.query.industry;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.isPublished = req.query.status === 'published';
    if (opts.search) filter.title = { $regex: opts.search, $options: 'i' };
    const { items, meta } = await paginate(CaseStudy, filter, opts, {
      populate: [{ path: 'category', select: 'name slug color' }],
    });
    return ApiResponse.ok(res, items, 'Case studies (admin)', meta);
  }),
  create: asyncHandler(async (req, res) => {
    const cs = await CaseStudy.create(withOptionalRef(req.body, 'category'));
    return ApiResponse.created(res, { caseStudy: cs }, 'Case study created');
  }),
  update: asyncHandler(async (req, res) => {
    const cs = await CaseStudy.findByIdAndUpdate(req.params.id, withOptionalRef(req.body, 'category'), { new: true });
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
