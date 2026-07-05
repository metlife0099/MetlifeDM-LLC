import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Notification, User } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';
import { emitToUser, emitToAdmins } from '../sockets/index.js';

const STAFF_ROLES = ['super_admin', 'admin', 'manager'];

/**
 * Programmatic creators used across the app.
 */
export const notify = async ({ recipient, type, title, message, resourceType, resourceId, actionUrl, priority = 'normal', data }) => {
  const notif = await Notification.create({
    recipient,
    type,
    title,
    message,
    resourceType,
    resourceId,
    actionUrl,
    priority,
    data,
  });
  emitToUser(recipient.toString(), 'notification:new', notif);
  return notif;
};

export const notifyAdmins = async (payload) => {
  let recipients = payload.recipients;
  if (!recipients?.length) {
    const staff = await User.find({ role: { $in: STAFF_ROLES }, status: 'active' }, '_id');
    recipients = staff.map((u) => u._id);
  }
  if (!recipients.length) return [];

  const { recipients: _omit, ...rest } = payload;
  const notifications = await Notification.insertMany(
    recipients.map((r) => ({ ...rest, recipient: r }))
  );
  emitToAdmins('notification:new', rest);
  return notifications;
};

/* ---------------- Controllers ---------------- */

export const list = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const filter = { recipient: req.user._id };
  if (req.query.unreadOnly === 'true') filter.isRead = false;
  if (req.query.type) filter.type = req.query.type;
  const { items, meta } = await paginate(Notification, filter, opts);
  return ApiResponse.ok(res, items, 'Notifications', meta);
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  return ApiResponse.ok(res, { count }, 'Unread count');
});

export const unreadCountByType = asyncHandler(async (req, res) => {
  const rows = await Notification.aggregate([
    { $match: { recipient: req.user._id, isRead: false } },
    { $group: { _id: '$resourceType', count: { $sum: 1 } } },
  ]);
  const byType = {};
  rows.forEach((r) => { byType[r._id || 'system'] = r.count; });
  return ApiResponse.ok(res, { byType }, 'Unread count by type');
});

export const markReadByType = asyncHandler(async (req, res) => {
  const { resourceType } = req.body;
  if (!resourceType) throw ApiError.badRequest('resourceType required');
  await Notification.updateMany(
    { recipient: req.user._id, resourceType, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return ApiResponse.ok(res, null, 'Marked as read');
});

export const markRead = asyncHandler(async (req, res) => {
  await Notification.updateOne(
    { _id: req.params.id, recipient: req.user._id },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return ApiResponse.ok(res, null, 'Marked as read');
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return ApiResponse.ok(res, null, 'All notifications marked as read');
});

export const remove = asyncHandler(async (req, res) => {
  await Notification.deleteOne({ _id: req.params.id, recipient: req.user._id });
  return ApiResponse.ok(res, null, 'Notification deleted');
});
