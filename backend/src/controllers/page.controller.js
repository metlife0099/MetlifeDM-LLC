import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Page } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';

export const list = asyncHandler(async (req, res) => {
  const filter = { isPublished: true };
  const items = await Page.find(filter).select('title slug template publishedAt').sort({ title: 1 });
  return ApiResponse.ok(res, items, 'Pages');
});

export const bySlug = asyncHandler(async (req, res) => {
  const page = await Page.findOne({ slug: req.params.slug, isPublished: true });
  if (!page) throw ApiError.notFound('Page not found');
  return ApiResponse.ok(res, { page }, 'Page');
});

export const listAdmin = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const filter = {};
  if (opts.search) filter.title = { $regex: opts.search, $options: 'i' };
  const { items, meta } = await paginate(Page, filter, opts);
  return ApiResponse.ok(res, items, 'Pages', meta);
});

export const getById = asyncHandler(async (req, res) => {
  const page = await Page.findById(req.params.id);
  if (!page) throw ApiError.notFound('Page not found');
  return ApiResponse.ok(res, { page }, 'Page');
});

export const create = asyncHandler(async (req, res) => {
  const page = await Page.create({ ...req.body, author: req.user._id });
  return ApiResponse.created(res, { page }, 'Page created');
});

export const update = asyncHandler(async (req, res) => {
  const page = await Page.findByIdAndUpdate(
    req.params.id,
    { ...req.body, lastEditedBy: req.user._id },
    { new: true }
  );
  if (!page) throw ApiError.notFound('Page not found');
  return ApiResponse.ok(res, { page }, 'Updated');
});

export const remove = asyncHandler(async (req, res) => {
  const page = await Page.findById(req.params.id);
  if (!page) throw ApiError.notFound('Page not found');
  if (page.isSystem) throw ApiError.forbidden('System pages cannot be deleted');
  await page.deleteOne();
  return ApiResponse.ok(res, null, 'Deleted');
});
