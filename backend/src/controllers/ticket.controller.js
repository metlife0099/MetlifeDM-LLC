import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Ticket, User } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';
import { TICKET_STATUS } from '../utils/constants.js';
import emailService from '../services/email.service.js';
import { notify, notifyAdmins } from './notification.controller.js';

export const create = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const ticket = await Ticket.create({
    ...req.body,
    customer: req.user._id,
    customerEmail: user.email,
    customerName: `${user.firstName} ${user.lastName}`,
  });
  emailService.ticketCreated(user, ticket).catch(() => {});
  notifyAdmins({
    type: 'ticket',
    title: `New ticket ${ticket.ticketNumber}`,
    message: ticket.subject,
    resourceType: 'ticket',
    resourceId: ticket._id,
    actionUrl: `/support/tickets/${ticket._id}`,
  }).catch(() => {});
  return ApiResponse.created(res, { ticket }, `Ticket ${ticket.ticketNumber} opened`);
});

export const listMine = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const { items, meta } = await paginate(Ticket, { customer: req.user._id }, opts);
  return ApiResponse.ok(res, items, 'My tickets', meta);
});

export const listAll = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.assignedToMe === 'true') filter.assignedTo = req.user._id;
  if (opts.search) filter.$or = [{ ticketNumber: { $regex: opts.search, $options: 'i' } }, { subject: { $regex: opts.search, $options: 'i' } }];
  const { items, meta } = await paginate(Ticket, filter, opts, {
    populate: [{ path: 'customer', select: 'firstName lastName email' }, { path: 'assignedTo', select: 'firstName lastName' }],
  });
  return ApiResponse.ok(res, items, 'Tickets', meta);
});

export const get = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('customer', 'firstName lastName email avatar')
    .populate('assignedTo', 'firstName lastName email')
    .populate('replies.author', 'firstName lastName avatar role');
  if (!ticket) throw ApiError.notFound('Ticket not found');
  const isOwner = ticket.customer?._id.toString() === req.user._id.toString();
  const isAdmin = ['admin', 'super_admin', 'manager'].includes(req.user.role);
  if (!isOwner && !isAdmin) throw ApiError.forbidden();
  return ApiResponse.ok(res, { ticket }, 'Ticket');
});

export const reply = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  const isOwner = ticket.customer?.toString() === req.user._id.toString();
  const isAdmin = ['admin', 'super_admin', 'manager'].includes(req.user.role);
  if (!isOwner && !isAdmin) throw ApiError.forbidden();

  ticket.replies.push({
    author: req.user._id,
    authorType: isAdmin ? 'agent' : 'customer',
    content: req.body.content,
    isInternal: !!req.body.isInternal && isAdmin,
  });
  if (isAdmin && ticket.status === TICKET_STATUS.OPEN) ticket.status = TICKET_STATUS.IN_PROGRESS;
  if (!ticket.firstResponseAt && isAdmin) ticket.firstResponseAt = new Date();
  await ticket.save();

  if (isAdmin && ticket.customer) {
    notify({
      recipient: ticket.customer,
      type: 'ticket',
      title: `New reply on ${ticket.ticketNumber}`,
      message: req.body.content.slice(0, 200),
      resourceType: 'ticket',
      resourceId: ticket._id,
      actionUrl: `/dashboard/tickets/${ticket._id}`,
    }).catch(() => {});
  }
  return ApiResponse.ok(res, { ticket }, 'Reply added');
});

export const update = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!ticket) throw ApiError.notFound('Ticket not found');
  if (req.body.status === TICKET_STATUS.RESOLVED && !ticket.resolvedAt) {
    ticket.resolvedAt = new Date();
    await ticket.save();
  }
  return ApiResponse.ok(res, { ticket }, 'Ticket updated');
});
