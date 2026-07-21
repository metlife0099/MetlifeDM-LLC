import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Blog, BlogCategory } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';
import { BLOG_STATUS, NOTIFICATION_TYPES } from '../utils/constants.js';
import { notifyAdmins } from './notification.controller.js';

/* ========== POSTS ========== */

export const list = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const filter = { status: BLOG_STATUS.PUBLISHED };
  if (req.query.category) {
    const cat = await BlogCategory.findOne({ slug: req.query.category });
    if (cat) filter.category = cat._id;
  }
  if (req.query.tag) filter.tags = req.query.tag.toLowerCase();
  if (req.query.featured === 'true') filter.isFeatured = true;
  if (opts.search) filter.$text = { $search: opts.search };
  const { items, meta } = await paginate(Blog, filter, opts, {
    select: 'title slug excerpt coverImage author category tags publishedAt readingTime views likes',
    populate: [
      { path: 'author', select: 'firstName lastName avatar' },
      { path: 'category', select: 'name slug color' },
    ],
  });
  return ApiResponse.ok(res, items, 'Blog posts', meta);
});

export const bySlug = asyncHandler(async (req, res) => {
  const post = await Blog.findOne({ slug: req.params.slug, status: BLOG_STATUS.PUBLISHED })
    .populate('author', 'firstName lastName avatar')
    .populate('category', 'name slug color')
    .populate('relatedPosts', 'title slug excerpt coverImage publishedAt')
    .populate('comments.author', 'firstName lastName avatar')
    .lean();
  if (!post) throw ApiError.notFound('Post not found');

  Blog.updateOne({ _id: post._id }, { $inc: { views: 1 } }).catch(() => {});

  // Public response: only approved, non-spam comments. Never expose the raw
  // guestEmail or the full likedBy user-id list — reduce each comment to a
  // like count plus whether *this* viewer has liked it.
  const viewerId = req.user?._id?.toString();
  post.comments = (post.comments || [])
    .filter((c) => c.isApproved && !c.isSpam)
    .map(({ guestEmail, likedBy, ...c }) => ({
      ...c,
      likesCount: likedBy?.length || 0,
      likedByMe: viewerId ? (likedBy || []).some((id) => id.toString() === viewerId) : false,
    }));

  return ApiResponse.ok(res, { post }, 'Post');
});

export const like = asyncHandler(async (req, res) => {
  await Blog.updateOne({ _id: req.params.id }, { $inc: { likes: 1 } });
  return ApiResponse.ok(res, null, 'Liked');
});

export const likeComment = asyncHandler(async (req, res) => {
  const post = await Blog.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');
  const comment = post.comments.id(req.params.commentId);
  if (!comment) throw ApiError.notFound('Comment not found');

  const userId = req.user._id.toString();
  const idx = comment.likedBy.findIndex((id) => id.toString() === userId);
  const liked = idx === -1;
  if (liked) comment.likedBy.push(req.user._id);
  else comment.likedBy.splice(idx, 1);
  await post.save();

  return ApiResponse.ok(res, { liked, likesCount: comment.likedBy.length }, liked ? 'Liked' : 'Unliked');
});

export const addComment = asyncHandler(async (req, res) => {
  const post = await Blog.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');
  if (!post.commentsEnabled) throw ApiError.forbidden('Comments disabled');

  if (req.body.parent) {
    const parent = post.comments.id(req.body.parent);
    if (!parent) throw ApiError.badRequest('The comment you are replying to no longer exists');
  }

  const comment = {
    author: req.user._id,
    content: req.body.content,
    parent: req.body.parent || undefined,
    isApproved: false, // moderated
  };
  post.comments.push(comment);
  await post.save();

  const created = post.comments[post.comments.length - 1];
  notifyAdmins({
    type: NOTIFICATION_TYPES.COMMENT,
    title: req.body.parent ? 'New reply awaiting review' : 'New comment awaiting review',
    message: `${req.user.firstName} commented on "${post.title}"`,
    resourceType: 'comment',
    resourceId: created._id,
    actionUrl: '/content/blog/comments',
  }).catch(() => {});

  return ApiResponse.created(res, null, 'Comment submitted for review');
});

/* Admin */
export const create = asyncHandler(async (req, res) => {
  const post = await Blog.create({ ...req.body, author: req.user._id });
  return ApiResponse.created(res, { post }, 'Post created');
});
export const update = asyncHandler(async (req, res) => {
  const post = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!post) throw ApiError.notFound('Post not found');
  return ApiResponse.ok(res, { post }, 'Updated');
});
export const remove = asyncHandler(async (req, res) => {
  const post = await Blog.findByIdAndDelete(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');
  return ApiResponse.ok(res, null, 'Deleted');
});
export const listAdmin = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  const { items, meta } = await paginate(Blog, filter, opts, {
    select: 'title slug status coverImage category isFeatured publishedAt readingTime views author',
    populate: [
      { path: 'author', select: 'firstName lastName' },
      { path: 'category', select: 'name slug color' },
    ],
  });
  return ApiResponse.ok(res, items, 'Posts', meta);
});
export const getById = asyncHandler(async (req, res) => {
  const post = await Blog.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');
  return ApiResponse.ok(res, { post }, 'Post');
});
export const moderateComment = asyncHandler(async (req, res) => {
  const post = await Blog.findById(req.params.id);
  if (!post) throw ApiError.notFound('Post not found');
  const comment = post.comments.id(req.params.commentId);
  if (!comment) throw ApiError.notFound('Comment not found');
  if (req.body.action === 'approve') comment.isApproved = true;
  if (req.body.action === 'spam') comment.isSpam = true;
  if (req.body.action === 'delete') comment.deleteOne();
  await post.save();
  return ApiResponse.ok(res, null, 'Comment moderated');
});

/* ========== CATEGORIES ========== */
export const category = {
  list: asyncHandler(async (req, res) => {
    const items = await BlogCategory.find().sort({ order: 1, name: 1 });
    return ApiResponse.ok(res, items, 'Categories');
  }),
  create: asyncHandler(async (req, res) => {
    const c = await BlogCategory.create(req.body);
    return ApiResponse.created(res, { category: c }, 'Category created');
  }),
  update: asyncHandler(async (req, res) => {
    const c = await BlogCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!c) throw ApiError.notFound('Category not found');
    return ApiResponse.ok(res, { category: c }, 'Updated');
  }),
  remove: asyncHandler(async (req, res) => {
    const c = await BlogCategory.findByIdAndDelete(req.params.id);
    if (!c) throw ApiError.notFound('Category not found');
    return ApiResponse.ok(res, null, 'Deleted');
  }),
};
