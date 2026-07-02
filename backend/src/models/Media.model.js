import mongoose from 'mongoose';

const { Schema } = mongoose;

const mediaSchema = new Schema(
  {
    name: { type: String, required: true },
    originalName: String,
    url: { type: String, required: true },
    publicId: { type: String, required: true, unique: true },
    thumbnailUrl: String,

    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'other'],
      required: true,
      index: true,
    },
    mimeType: String,
    extension: String,
    size: Number, // bytes
    width: Number,
    height: Number,
    duration: Number, // seconds for video/audio

    folder: { type: String, default: 'general', index: true },
    tags: [String],
    altText: String,
    caption: String,
    description: String,

    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    usedIn: [
      {
        model: String,
        id: Schema.Types.ObjectId,
        at: { type: Date, default: Date.now },
      },
    ],

    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

mediaSchema.index({ folder: 1, type: 1, createdAt: -1 });
mediaSchema.index({ name: 'text', altText: 'text', tags: 'text' });

const Media = mongoose.model('Media', mediaSchema);
export default Media;
