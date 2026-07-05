import { Router } from 'express';
import * as c from '../controllers/chat.controller.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.middleware.js';
import { chatLimiter } from '../middleware/rateLimit.middleware.js';
import { chatAttachmentUpload } from '../middleware/upload.middleware.js';

const router = Router();

// Start conversation (guest OK)
router.post('/start', chatLimiter, optionalAuth, c.startChat);

// Send message — guests or authed users
router.post('/:id/messages', chatLimiter, optionalAuth, c.sendMessage);

// Attach file to chat (authed)
router.post('/:id/attachments', requireAuth, chatAttachmentUpload.single('file'), (req, res) =>
  res.json({ url: req.file.path, publicId: req.file.filename, name: req.file.originalname })
);

// Message history
router.get('/:id/messages', optionalAuth, c.listMessages);

// User's own chats
router.get('/mine', requireAuth, c.listMyChats);

// Rate a chat
router.post('/:id/rate', c.rateChat);

// Admin
router.get('/admin', requireAuth, requireAdmin, c.listChatsAdmin);
router.get('/:id', requireAuth, requireAdmin, c.getChatAdmin);
router.post('/:id/assign', requireAuth, requireAdmin, c.assignChat);
router.post('/:id/resolve', requireAuth, requireAdmin, c.resolveChat);
router.get('/:id/suggestions', requireAuth, requireAdmin, c.getSuggestions);

export default router;
