import { Server } from 'socket.io';
import { config } from '../config/index.js';
import logger from '../config/logger.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { setupChatHandlers } from './chat.socket.js';

let io = null;

/**
 * Initialize Socket.io on the HTTP server.
 * Chat handlers (join room, send message, typing indicator, admin handoff)
 * are attached in Step 2 from src/sockets/chat.socket.js.
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.cors.origins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT auth middleware (optional — guests allowed)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const payload = verifyAccessToken(token);
        socket.user = payload;
      } catch {
        // ignore — treat as guest
      }
    }
    // Guest session id (from cookie or handshake)
    socket.guestSessionId = socket.handshake.auth?.guestSessionId;
    next();
  });

  io.on('connection', (socket) => {
    const identity = socket.user?.sub || socket.guestSessionId || socket.id;
    logger.info(`🔌  Socket connected: ${socket.id} (${identity})`);

    // Attach all chat handlers
    setupChatHandlers(socket, io);

    socket.on('disconnect', (reason) => {
      logger.info(`🔌  Socket disconnected: ${socket.id} — ${reason}`);
    });
  });

  logger.info('✅  Socket.io initialized');
  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

/**
 * Emit to a specific user by their id.
 */
export const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};

/**
 * Emit to all admins.
 */
export const emitToAdmins = (event, payload) => {
  if (!io) return;
  io.to('admins').emit(event, payload);
};

/**
 * Emit to a specific chat room.
 */
export const emitToChat = (chatId, event, payload) => {
  if (!io) return;
  io.to(`chat:${chatId}`).emit(event, payload);
};
