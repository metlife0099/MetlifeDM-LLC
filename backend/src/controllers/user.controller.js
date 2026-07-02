import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { User, Service } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';
import { deleteFromCloudinary, uploadToCloudinary } from '../config/cloudinary.js';

/* ---------------- Self ---------------- */

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlistServices', 'title slug icon startingPrice heroImage');
  return ApiResponse.ok(res, { user }, 'Profile');
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
    runValidators: true,
  });
  return ApiResponse.ok(res, { user }, 'Profile updated');
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file provided');
  const user = await User.findById(req.user._id);

  if (user.avatar?.publicId) {
    await deleteFromCloudinary(user.avatar.publicId).catch(() => {});
  }

  const result = await uploadToCloudinary(req.file.buffer || req.file.path, {
    folder: `metlifedm/avatars`,
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  });

  user.avatar = { url: result.secure_url, publicId: result.public_id };
  await user.save({ validateBeforeSave: false });

  return ApiResponse.ok(res, { avatar: user.avatar }, 'Avatar updated');
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.status = 'deleted';
  user.deletedAt = new Date();
  user.email = `deleted_${user._id}@metlifedm.com`;
  await user.save({ validateBeforeSave: false });
  return ApiResponse.ok(res, null, 'Account deleted');
});

/* ---------------- Wishlist ---------------- */

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    'wishlistServices',
    'title slug icon shortDescription startingPrice heroImage category'
  );
  return ApiResponse.ok(res, { items: user.wishlistServices || [] }, 'Wishlist');
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.body.serviceId);
  if (!service) throw ApiError.notFound('Service not found');
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { wishlistServices: service._id } });
  return ApiResponse.ok(res, null, 'Added to wishlist');
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $pull: { wishlistServices: req.params.serviceId } });
  return ApiResponse.ok(res, null, 'Removed from wishlist');
});

/* ---------------- Admin ---------------- */

export const listUsers = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  if (opts.search) {
    filter.$or = [
      { firstName: { $regex: opts.search, $options: 'i' } },
      { lastName: { $regex: opts.search, $options: 'i' } },
      { email: { $regex: opts.search, $options: 'i' } },
    ];
  }
  const { items, meta } = await paginate(User, filter, opts, {
    select: '-password -refreshTokens -twoFactor',
  });
  return ApiResponse.ok(res, items, 'Users', meta);
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('wishlistServices', 'title slug');
  if (!user) throw ApiError.notFound('User not found');
  return ApiResponse.ok(res, { user }, 'User');
});

export const adminUpdateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) throw ApiError.notFound('User not found');
  return ApiResponse.ok(res, { user }, 'User updated');
});

export const adminDeleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: 'deleted', deletedAt: new Date() },
    { new: true }
  );
  if (!user) throw ApiError.notFound('User not found');
  return ApiResponse.ok(res, null, 'User soft-deleted');
});
