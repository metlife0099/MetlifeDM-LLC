import { Chat, ChatMessage } from '../models/index.js';
import { CHAT_STATUS } from '../utils/constants.js';
import { generateBotReply } from '../services/chatbot.service.js';
import logger from '../config/logger.js';

/**
 * Register all chat-related socket event handlers on a connected socket.
 * Wired from src/sockets/index.js
 */
export const setupChatHandlers = (socket, io) => {
  const isAdmin = socket.user && ['admin', 'super_admin', 'manager'].includes(socket.user.role);

  // Admins auto-join the admins room
  if (isAdmin) socket.join('admins');
  // Authed users join their personal room for notifications
  if (socket.user?.sub) socket.join(`user:${socket.user.sub}`);

  // Join a chat room
  socket.on('chat:join', async ({ chatId }) => {
    if (!chatId) return;
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return socket.emit('chat:error', { message: 'Chat not found' });

      const canJoin =
        isAdmin ||
        (socket.user && chat.user?.toString() === socket.user.sub) ||
        (!socket.user && chat.guestSessionId === socket.guestSessionId);

      if (!canJoin) return socket.emit('chat:error', { message: 'Not authorized' });

      socket.join(`chat:${chatId}`);
      socket.emit('chat:joined', { chatId });
    } catch (err) {
      logger.warn(`chat:join error: ${err.message}`);
    }
  });

  socket.on('chat:leave', ({ chatId }) => {
    if (chatId) socket.leave(`chat:${chatId}`);
  });

  // Real-time message send
  socket.on('message:send', async ({ chatId, content, attachments }, ack) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return ack?.({ error: 'Chat not found' });

      const senderType = isAdmin ? 'agent' : socket.user ? 'user' : 'guest';
      const msg = await ChatMessage.create({
        chat: chat._id,
        senderType,
        sender: socket.user?.sub,
        senderName: socket.user?.email || 'Guest',
        content,
        attachments,
      });

      chat.lastMessageAt = new Date();
      chat.lastMessagePreview = content.slice(0, 120);
      if (senderType === 'user' || senderType === 'guest') chat.unreadForAgent += 1;
      else chat.unreadForUser += 1;
      await chat.save();

      io.to(`chat:${chatId}`).emit('message:new', msg);
      if (senderType !== 'agent') io.to('admins').emit('chat:new-message', { chatId, message: msg });

      // AI reply if still in bot mode and message came from customer
      if (chat.status === CHAT_STATUS.BOT && senderType !== 'agent') {
        const history = await ChatMessage.find({ chat: chat._id }).sort({ createdAt: 1 }).lean();
        const ai = await generateBotReply({ history, userMessage: content });

        const botMsg = await ChatMessage.create({
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
        if (ai.needsHandoff) {
          chat.status = CHAT_STATUS.QUEUED;
          chat.handoffAt = new Date();
          chat.handoffReason = 'AI confidence below threshold';
          io.to('admins').emit('chat:handoff', { chat, message: botMsg });
        }
        await chat.save();

        io.to(`chat:${chatId}`).emit('message:new', botMsg);
      }

      ack?.({ ok: true, message: msg });
    } catch (err) {
      logger.error(`message:send error: ${err.message}`);
      ack?.({ error: err.message });
    }
  });

  // Typing indicator
  socket.on('typing:start', ({ chatId }) => {
    socket.to(`chat:${chatId}`).emit('typing:start', { userId: socket.user?.sub || 'guest' });
  });
  socket.on('typing:stop', ({ chatId }) => {
    socket.to(`chat:${chatId}`).emit('typing:stop', { userId: socket.user?.sub || 'guest' });
  });

  // Read receipts
  socket.on('message:read', async ({ chatId, messageId }) => {
    try {
      await ChatMessage.updateOne({ _id: messageId }, { $addToSet: { readBy: { user: socket.user?.sub, at: new Date() } } });
      io.to(`chat:${chatId}`).emit('message:read', { messageId, by: socket.user?.sub });
    } catch (err) {
      logger.warn(`message:read error: ${err.message}`);
    }
  });
};
