import mongoose from 'mongoose';

const { Schema } = mongoose;

const reactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    emoji: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const attachmentSchema = new Schema(
  {
    url: String,
    publicId: String,
    name: String,
    type: String,       // image | file
    mimeType: String,
    size: Number,
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },

    senderType: {
      type: String,
      enum: ['user', 'guest', 'bot', 'agent', 'system'],
      required: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: 'User' }, // null for bot/guest/system
    senderName: String,

    content: { type: String, required: true, maxlength: 5000 },
    attachments: [attachmentSchema],

    // AI metadata
    aiMeta: {
      model: String,
      confidence: Number,
      tokensUsed: Number,
      finishReason: String,
      needsHandoff: { type: Boolean, default: false },
    },

    reactions: [reactionSchema],

    isRead: { type: Boolean, default: false },
    readAt: Date,
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    isEdited: { type: Boolean, default: false },
    editedAt: Date,
    isDeleted: { type: Boolean, default: false },

    // For internal admin notes (not shown to customer)
    isInternalNote: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ chat: 1, createdAt: 1 });

const ChatMessage = mongoose.model('ChatMessage', messageSchema);
export default ChatMessage;
