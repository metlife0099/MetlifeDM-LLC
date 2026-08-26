import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { DocumentTemplate } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';

export const list = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const filter = {};
  if (req.query.documentType) filter.documentType = req.query.documentType;
  if (opts.search) filter.name = { $regex: opts.search, $options: 'i' };
  const { items, meta } = await paginate(DocumentTemplate, filter, opts);
  return ApiResponse.ok(res, items, 'Document templates', meta);
});

export const get = asyncHandler(async (req, res) => {
  const template = await DocumentTemplate.findById(req.params.id);
  if (!template) throw ApiError.notFound('Template not found');
  return ApiResponse.ok(res, { template }, 'Document template');
});

export const create = asyncHandler(async (req, res) => {
  const template = await DocumentTemplate.create({
    ...req.body,
    createdBy: req.user._id,
    lastEditedBy: req.user._id,
  });
  return ApiResponse.created(res, { template }, 'Template created');
});

export const update = asyncHandler(async (req, res) => {
  const template = await DocumentTemplate.findById(req.params.id);
  if (!template) throw ApiError.notFound('Template not found');
  Object.assign(template, req.body, { lastEditedBy: req.user._id });
  await template.save();
  return ApiResponse.ok(res, { template }, 'Template updated');
});

export const remove = asyncHandler(async (req, res) => {
  const template = await DocumentTemplate.findById(req.params.id);
  if (!template) throw ApiError.notFound('Template not found');
  template.isActive = false;
  await template.save({ validateBeforeSave: false });
  return ApiResponse.ok(res, null, 'Template deactivated');
});
