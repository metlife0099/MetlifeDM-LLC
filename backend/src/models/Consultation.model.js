import mongoose from 'mongoose';
import { CONSULTATION_STATUS, REGEX } from '../utils/constants.js';

const { Schema } = mongoose;

const consultationSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [REGEX.EMAIL, 'Invalid email'],
    },
    phone: { type: String, required: true },
    company: String,
    website: String,
    role: String,

    // Scheduling
    preferredDate: { type: Date, required: true },
    preferredTimeSlot: { type: String, required: true }, // "09:00", "14:30"
    timezone: { type: String, default: 'America/New_York' },
    durationMinutes: { type: Number, default: 30 },

    meetingType: {
      type: String,
      enum: ['google_meet', 'zoom', 'phone', 'in_person'],
      default: 'google_meet',
    },
    meetingLink: String,

    // What they need
    servicesInterested: [String],
    projectGoals: String,
    budget: {
      type: String,
      enum: ['<5k', '5k-10k', '10k-25k', '25k-50k', '50k-100k', '100k+', 'undecided'],
    },
    urgency: { type: String, enum: ['immediate', '1-3_months', '3-6_months', 'exploring'] },
    additionalNotes: String,

    status: {
      type: String,
      enum: Object.values(CONSULTATION_STATUS),
      default: CONSULTATION_STATUS.REQUESTED,
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },

    confirmedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    rescheduleCount: { type: Number, default: 0 },

    // Outcome
    outcome: {
      notes: String,
      nextSteps: String,
      quotedAmount: Number,
      convertedToOrder: { type: Schema.Types.ObjectId, ref: 'Order' },
    },

    // Reminders
    remindersSent: [{ type: Date }],

    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

consultationSchema.index({ status: 1, preferredDate: 1 });
consultationSchema.index({ email: 1, createdAt: -1 });

const Consultation = mongoose.model('Consultation', consultationSchema);
export default Consultation;
