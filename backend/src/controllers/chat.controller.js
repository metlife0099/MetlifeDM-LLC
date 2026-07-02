import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Chat, ChatMessage, Ticket, User } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';
import { generateBotReply, categorizeChat, suggestAdminReplies } from '../services/chatbot.service.js';
import { CHAT_STATUS } from '../utils/constants.js';
import { emitToChat, emitToAdmins, emitToUser } from '../sockets/index.js';
import emailService from '../services/email.service.js';
import { notify } from './notification.controller.js';

/* POST /chat/start — create a new conversation (guest or authed) */
export const startChat = asyncHandler(async (req, res) => {
  const chat = await Chat.create({
    user: req.user?._id,
    guestSessionId: req.user ? undefined : req.body.guestSessionId,
    guestName: req.body.guestName,
    guestEmail: req.body.guestEmail,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    referrer: req.headers.referer,
    status: CHAT_STATUS.BOT,
  });
  return ApiResponse.created(res, { chat }, 'Chat started');
});

/* POST /chat/:id/messages — send message (customer) */
export const sendMessage = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat) throw ApiError.notFound('Chat not found');

  const isOwner =
    (req.user && chat.user?.toString() === req.user._id.toString()) ||
    (!req.user && chat.guestSessionId === req.body.guestSessionId);
  if (!isOwner && !['admin', 'super_admin', 'manager'].includes(req.user?.role)) {
    throw ApiError.forbidden();
  }

  const senderType = req.user
    ? ['admin', 'super_admin', 'manager'].includes(req.user.role) ? 'agent' : 'user'
    : 'guest';

  const userMsg = await ChatMessage.create({
    chat: chat._id,
    senderType,
    sender: req.user?._id,
    senderName: req.user ? `${req.user.firstName} ${req.user.lastName}` : chat.guestName,
    content: req.body.content,
    attachments: req.body.attachments,
  });

  chat.lastMessageAt = new Date();
  chat.lastMessagePreview = req.body.content.slice(0, 120);
  if (senderType === 'user' || senderType === 'guest') chat.unreadForAgent += 1;
  else chat.unreadForUser += 1;
  await chat.save();

  emitToChat(chat._id.toString(), 'message:new', userMsg);
  if (senderType === 'user' || senderType === 'guest') emitToAdmins('chat:new-message', { chat, message: userMsg });

  let botReply = null;
  // If chat is still in BOT mode and customer sent a message, run AI
  if (chat.status === CHAT_STATUS.BOT && (senderType === 'user' || senderType === 'guest')) {
    const history = await ChatMessage.find({ chat: chat._id }).sort({ createdAt: 1 }).lean();
    const ai = await generateBotReply({ history, userMessage: req.body.content });

    botReply = await ChatMessage.create({
      chat: chat._id,
      senderType: 'bot',
      senderName: 'MetlifeDM AI',
      content: ai.content,
      aiMeta: {
        model: ai.model,
        confidence: ai.confidence,
        tokensUsed: ai.tokensUsed,
        finishReason: ai.finishReason,
        needsHandoff: ai.needsHandoff,
      },
    });
    chat.lastMessageAt = new Date();
    chat.lastMessagePreview = ai.content.slice(0, 120);

    // Handoff → create ticket, notify admins
    if (ai.needsHandoff) {
      const meta = await categorizeChat([...history, userMsg, botReply]);
      chat.status = CHAT_STATUS.QUEUED;
      chat.handoffAt = new Date();
      chat.handoffReason = 'AI confidence below threshold';
      chat.category = meta.category;
      chat.sentiment = meta.sentiment;
      chat.subject = meta.subject;

      const email = chat.guestEmail || (chat.user ? (await User.findById(chat.user).select('email')).email : null);
      if (email) {
        const ticket = await Ticket.create({
          subject: meta.subject || 'Chat conversation escalated',
          description: userMsg.content,
          customer: chat.user,
          customerEmail: email,
          customerName: chat.guestName || 'Guest',
          chat: chat._id,
          category: meta.category === 'billing' ? 'billing' : 'general',
        });
        chat.ticket = ticket._id;
      }

      emitToAdmins('chat:handoff', { chat, message: botReply });
    }
    await chat.save();

    emitToChat(chat._id.toString(), 'message:new', botReply);
  }

  return ApiResponse.created(res, { message: userMsg, botReply }, 'Message sent');
});

/* GET /chat/:id/messages */
export const listMessages = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions({ ...req.query, limit: 100, sortBy: 'createdAt', sortOrder: 'asc' });
  const { items, meta } = await paginate(ChatMessage, { chat: req.params.id, isInternalNote: false }, opts);
  return ApiResponse.ok(res, items, 'Messages', meta);
});

/* GET /chat/mine — user's own chats */
export const listMyChats = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const { items, meta } = await paginate(
    Chat,
    { user: req.user._id },
    opts
  );
  return ApiResponse.ok(res, items, 'My chats', meta);
});

/* Admin: list all chats */
export const listChatsAdmin = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.assignedToMe === 'true') filter.assignedAgent = req.user._id;
  const { items, meta } = await paginate(Chat, filter, opts, {
    populate: [{ path: 'user', select: 'firstName lastName email' }, { path: 'assignedAgent', select: 'firstName lastName' }],
  });
  return ApiResponse.ok(res, items, 'Chats', meta);
});

/* Admin: take over */
export const assignChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findByIdAndUpdate(
    req.params.id,
    { assignedAgent: req.user._id, status: CHAT_STATUS.ACTIVE },
    { new: true }
  );
  if (!chat) throw ApiError.notFound('Chat not found');
  emitToChat(chat._id.toString(), 'chat:assigned', { agent: req.user });
  return ApiResponse.ok(res, { chat }, 'Chat assigned');
});

/* Admin: resolve */
export const resolveChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findByIdAndUpdate(
    req.params.id,
    { status: CHAT_STATUS.RESOLVED, resolvedAt: new Date() },
    { new: true }
  );
  if (!chat) throw ApiError.notFound('Chat not found');
  return ApiResponse.ok(res, { chat }, 'Chat resolved');
});

/* Admin: get AI reply suggestions */
export const getSuggestions = asyncHandler(async (req, res) => {
  const history = await ChatMessage.find({ chat: req.params.id }).sort({ createdAt: 1 }).lean();
  const suggestions = await suggestAdminReplies({ history });
  return ApiResponse.ok(res, { suggestions }, 'AI suggestions');
});

/* Rate a chat */
export const rateChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findByIdAndUpdate(
    req.params.id,
    { rating: req.body.rating, feedback: req.body.feedback },
    { new: true }
  );
  if (!chat) throw ApiError.notFound('Chat not found');
  return ApiResponse.ok(res, null, 'Thanks for your feedback!');
});
