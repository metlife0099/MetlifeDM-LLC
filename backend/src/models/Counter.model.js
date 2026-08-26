import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Generic atomic sequence generator. One document per `key` (e.g. "EXP-2026").
 * Used for gapless, race-condition-safe sequential numbering — the nanoid-based
 * generators in utils/helpers.js are NOT sequential and must not be used where
 * a strictly ordered number (like a certificate number) is required.
 */
const counterSchema = new Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

counterSchema.statics.getNextSeq = async function (key) {
  const doc = await this.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return doc.seq;
};

const Counter = mongoose.model('Counter', counterSchema);
export default Counter;
