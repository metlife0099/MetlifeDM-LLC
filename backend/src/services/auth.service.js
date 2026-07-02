import crypto from 'node:crypto';
import speakeasy from 'speakeasy';
import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signEmailVerifyToken,
  signPasswordResetToken,
  verifyEmailVerifyToken,
  verifyPasswordResetToken,
} from '../utils/jwt.js';
import { config } from '../config/index.js';
import { USER_STATUS } from '../utils/constants.js';
import emailService from './email.service.js';
import logger from '../config/logger.js';

const REFRESH_MS = 7 * 24 * 60 * 60 * 1000; // 7d default

/**
 * Issue access + refresh, persist refresh in user document (rotation).
 */
export const issueTokens = async (user, req) => {
  const payload = { sub: user._id.toString(), role: user.role, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: user._id.toString() });

  const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await User.findByIdAndUpdate(user._id, {
    $push: {
      refreshTokens: {
        token: hash,
        ip: req?.ip,
        userAgent: req?.headers?.['user-agent'],
        expiresAt: new Date(Date.now() + REFRESH_MS),
      },
    },
    lastLoginAt: new Date(),
  });

  return { accessToken, refreshToken };
};

/**
 * Rotate refresh: revoke old, issue new.
 */
export const rotateRefreshToken = async (oldToken, req) => {
  let payload;
  try {
    payload = verifyRefreshToken(oldToken);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const user = await User.findById(payload.sub).select('+refreshTokens');
  if (!user || user.status !== USER_STATUS.ACTIVE) throw ApiError.unauthorized('Session invalid');

  const oldHash = crypto.createHash('sha256').update(oldToken).digest('hex');
  const stored = user.refreshTokens.find(
    (t) => t.token === oldHash && !t.revokedAt && t.expiresAt > new Date()
  );
  if (!stored) {
    // Possible replay — revoke all
    user.refreshTokens.forEach((t) => (t.revokedAt = new Date()));
    await user.save({ validateBeforeSave: false });
    logger.warn(`⚠️  Refresh token replay detected for user ${user._id}`);
    throw ApiError.unauthorized('Session revoked. Please sign in again.');
  }

  stored.revokedAt = new Date();
  await user.save({ validateBeforeSave: false });

  return issueTokens(user, req);
};

export const revokeAllTokens = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $set: { 'refreshTokens.$[].revokedAt': new Date() },
  });
};

export const revokeToken = async (userId, refreshToken) => {
  const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await User.updateOne(
    { _id: userId, 'refreshTokens.token': hash },
    { $set: { 'refreshTokens.$.revokedAt': new Date() } }
  );
};

/**
 * Send email verification link.
 */
export const sendVerificationEmail = async (user) => {
  const token = signEmailVerifyToken({ sub: user._id.toString(), email: user.email });
  await emailService.emailVerification(user, token);
  return token;
};

/**
 * Confirm verification token.
 */
export const confirmEmail = async (token) => {
  let payload;
  try {
    payload = verifyEmailVerifyToken(token);
  } catch {
    throw ApiError.badRequest('Verification link invalid or expired');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.notFound('User not found');
  if (user.emailVerified) return user;

  user.emailVerified = true;
  user.emailVerifiedAt = new Date();
  if (user.status === USER_STATUS.PENDING) user.status = USER_STATUS.ACTIVE;
  await user.save({ validateBeforeSave: false });
  return user;
};

/**
 * Send password reset link.
 */
export const sendPasswordResetEmail = async (email) => {
  const user = await User.findOne({ email });
  // Always return silently to prevent user enumeration
  if (!user) return;
  const token = signPasswordResetToken({ sub: user._id.toString() });
  await emailService.passwordReset(user, token);
};

/**
 * Reset password using token.
 */
export const resetPasswordWithToken = async (token, newPassword) => {
  let payload;
  try {
    payload = verifyPasswordResetToken(token);
  } catch {
    throw ApiError.badRequest('Reset link invalid or expired');
  }
  const user = await User.findById(payload.sub).select('+password +refreshTokens');
  if (!user) throw ApiError.notFound('User not found');

  user.password = newPassword;
  user.refreshTokens.forEach((t) => (t.revokedAt = new Date()));
  await user.save();
  return user;
};

/* --------------------------------------------------------------
 * Two-factor authentication
 * ------------------------------------------------------------ */

export const generate2FASecret = (user) => {
  const secret = speakeasy.generateSecret({
    name: `MetlifeDM (${user.email})`,
    issuer: 'MetlifeDM LLC',
    length: 20,
  });
  return {
    base32: secret.base32,
    otpauthUrl: secret.otpauth_url,
  };
};

export const verify2FAToken = (secret, code) =>
  speakeasy.totp.verify({ secret, encoding: 'base32', token: code, window: 1 });

export const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 8; i += 1) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
};
