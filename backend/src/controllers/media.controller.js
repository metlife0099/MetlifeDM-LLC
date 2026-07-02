import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Media } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';
import path from 'node:path';

const detectType = (mime = '') => {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf' || mime.includes('document') || mime.includes('sheet')) return 'document';
  return 'other';
};

export const list = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const filter = {};
  if (req.query.folder) filter.folder = req.query.folder;
  if (req.query.type) filter.type = req.query.type;
  if (opts.search) filter.$or = [
    { name: { $regex: opts.search, $options: 'i' } },
    { altText: { $regex: opts.search, $options: 'i' } },
    { tags: { $in: [opts.search.toLowerCase()] } },
  ];
  const { items, meta } = await paginate(Media, filter, opts);
  return ApiResponse.ok(res, items, 'Media', meta);
});

export const upload = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) throw ApiError.badRequest('No files provided');

  const folder = req.body.folder || 'general';
  const tags = req.body.tags ? req.body.tags.split(',').map((t) => t.trim().toLowerCase()) : [];

  const uploaded = [];
  for (const file of files) {
    const doc = await Media.create({
      name: file.originalname,
      originalName: file.originalname,
      url: file.path,
      publicId: file.filename,
      type: detectType(file.mimetype),
      mimeType: file.mimetype,
      extension: path.extname(file.originalname).slice(1),
      size: file.size,
      width: file.width,
      height: file.height,
      folder,
      tags,
      altText: req.body.altText,
      uploadedBy: req.user._id,
    });
    uploaded.push(doc);
  }
  return ApiResponse.created(res, { media: uploaded }, `${uploaded.length} file(s) uploaded`);
});

export const remove = asyncHandler(async (req, res) => {
  const m = await Media.findById(req.params.id);
  if (!m) throw ApiError.notFound('Media not found');
  await deleteFromCloudinary(m.publicId, m.type === 'video' ? 'video' : 'image').catch(() => {});
  await m.deleteOne();
  return ApiResponse.ok(res, null, 'Deleted');
});

export const updateMetadata = asyncHandler(async (req, res) => {
  const m = await Media.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      altText: req.body.altText,
      caption: req.body.caption,
      description: req.body.description,
      tags: req.body.tags,
      folder: req.body.folder,
    },
    { new: true }
  );
  if (!m) throw ApiError.notFound('Media not found');
  return ApiResponse.ok(res, { media: m }, 'Updated');
});
