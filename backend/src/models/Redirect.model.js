import mongoose from 'mongoose';

const { Schema } = mongoose;

const redirectSchema = new Schema(
  {
    from: { type: String, required: true, unique: true, trim: true, index: true },
    to: { type: String, required: true, trim: true },
    statusCode: { type: Number, enum: [301, 302, 307, 308], default: 301 },
    isActive: { type: Boolean, default: true },
    hitCount: { type: Number, default: 0 },
    lastHitAt: Date,
    note: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Redirect = mongoose.model('Redirect', redirectSchema);
export default Redirect;
