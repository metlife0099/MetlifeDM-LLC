import mongoose from 'mongoose';
import { APPLICATION_STATUS, REGEX } from '../utils/constants.js';

const { Schema } = mongoose;

const jobApplicationSchema = new Schema(
  {
    career: { type: Schema.Types.ObjectId, ref: 'Career', required: true, index: true },
    jobTitle: String,

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [REGEX.EMAIL, 'Invalid email'],
    },
    phone: String,
    location: String,

    resume: {
      url: { type: String, required: true },
      publicId: String,
      name: String,
    },
    coverLetter: { type: String, maxlength: 5000 },
    portfolioUrl: String,
    linkedinUrl: String,
    githubUrl: String,
    website: String,

    yearsOfExperience: Number,
    currentCompany: String,
    currentRole: String,
    expectedSalary: Number,
    noticePeriod: String,
    workAuthorization: {
      type: String,
      enum: ['us_citizen', 'green_card', 'h1b', 'opt', 'other'],
    },
    willingToRelocate: { type: Boolean, default: false },

    answers: [{ question: String, answer: String }],

    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.SUBMITTED,
      index: true,
    },
    rating: { type: Number, min: 1, max: 5 },
    internalNotes: String,
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    interviewSchedule: [
      {
        round: String,
        date: Date,
        interviewer: { type: Schema.Types.ObjectId, ref: 'User' },
        feedback: String,
        score: Number,
      },
    ],

    source: String,
    ipAddress: String,
  },
  { timestamps: true }
);

jobApplicationSchema.index({ career: 1, status: 1 });
jobApplicationSchema.index({ email: 1, career: 1 }, { unique: true });

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
export default JobApplication;
