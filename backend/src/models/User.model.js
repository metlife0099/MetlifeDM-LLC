import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import { USER_ROLES, USER_STATUS, REGEX } from '../utils/constants.js';

const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    line1: String,
    line2: String,
    city: String,
    state: String,
    zip: String,
    country: { type: String, default: 'US' },
  },
  { _id: false }
);

const loginHistorySchema = new Schema(
  {
    ip: String,
    userAgent: String,
    location: String,
    at: { type: Date, default: Date.now },
    success: { type: Boolean, default: true },
  },
  { _id: false }
);

const refreshTokenSchema = new Schema(
  {
    token: { type: String, required: true },
    ip: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
  },
  { _id: true }
);

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [REGEX.EMAIL, 'Invalid email'],
      index: true,
    },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false, minlength: 8 },

    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CUSTOMER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.PENDING,
      index: true,
    },

    avatar: {
      url: String,
      publicId: String,
    },

    company: {
      name: String,
      website: String,
      size: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'] },
      industry: String,
    },

    address: addressSchema,

    // Email verification
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: Date,

    // Two-factor
    twoFactor: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, select: false },
      backupCodes: { type: [String], select: false, default: [] },
    },

    // Auth
    refreshTokens: { type: [refreshTokenSchema], select: false, default: [] },
    passwordChangedAt: Date,
    lastLoginAt: Date,
    loginHistory: { type: [loginHistorySchema], select: false, default: [] },
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, select: false },

    // Marketing
    newsletterSubscribed: { type: Boolean, default: false },

    // Wishlist
    wishlistServices: [{ type: Schema.Types.ObjectId, ref: 'Service' }],

    // Preferences
    preferences: {
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'America/New_York' },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
    },

    // Soft delete
    deletedAt: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.twoFactor;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.virtual('isLocked').get(function () {
  return this.lockedUntil && this.lockedUntil > Date.now();
});

// Indexes
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

// Hash password on save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, config.bcrypt.saltRounds);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// Methods
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.wasPasswordChangedAfter = function (jwtIat) {
  if (!this.passwordChangedAt) return false;
  return this.passwordChangedAt.getTime() / 1000 > jwtIat;
};

userSchema.methods.incFailedAttempts = async function () {
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  if (this.failedLoginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.resetFailedAttempts = async function () {
  this.failedLoginAttempts = 0;
  this.lockedUntil = undefined;
  return this.save({ validateBeforeSave: false });
};

const User = mongoose.model('User', userSchema);
export default User;
