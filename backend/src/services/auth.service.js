import crypto from 'node:crypto';
import speakeasy from 'speakeasy';
import bcrypt from 'bcryptjs';
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
import { parseDuration } from '../utils/cookies.js';
import emailService from './email.service.js';
import logger from '../config/logger.js';

const STAFF_ROLES = new Set(['super_admin', 'admin', 'manager']);
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const isBackupHash = (value) => /^\$2[aby]\$/.test(value);
export const isTwoFactorEnabled = () => config.features.twoFactorAuth;

export const getRefreshSessionDuration = (role) =>
  STAFF_ROLES.has(role)
    ? config.jwt.refresh.adminExpiresIn
    : config.jwt.refresh.expiresIn;

/** Issue access + refresh tokens and persist the refresh hash. */
export const issueTokens = async (user, req, rememberMe = Boolean(req?.body?.rememberMe)) => {
  const payload = {
    sub: user._id.toString(),
    role: user.role,
    email: user.email,
    ver: user.tokenVersion || 0,
  };
  const sessionExpiresIn = getRefreshSessionDuration(user.role);
  const sessionMaxAge = parseDuration(sessionExpiresIn);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({
    sub: user._id.toString(),
    ver: user.tokenVersion || 0,
    jti: crypto.randomUUID(),
  }, sessionExpiresIn);

  await User.findByIdAndUpdate(user._id, {
    $push: {
      refreshTokens: {
        token: hashToken(refreshToken),
        ip: req?.ip,
        userAgent: req?.headers?.['user-agent'],
        rememberMe,
        expiresAt: new Date(Date.now() + sessionMaxAge),
      },
    },
    $set: { lastLoginAt: new Date() },
  });
  return { accessToken, refreshToken, rememberMe, sessionExpiresIn, sessionMaxAge };
};

/** Atomically consume the old refresh token before issuing its replacement. */
export const rotateRefreshToken = async (oldToken, req) => {
  let payload;
  try {
    payload = verifyRefreshToken(oldToken);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const oldHash = hashToken(oldToken);
  const now = new Date();
  const user = await User.findOneAndUpdate(
    {
      _id: payload.sub,
      status: USER_STATUS.ACTIVE,
      refreshTokens: {
        $elemMatch: {
          token: oldHash,
          expiresAt: { $gt: now },
          $or: [{ revokedAt: null }, { revokedAt: { $exists: false } }],
        },
      },
    },
    { $set: { 'refreshTokens.$.revokedAt': now } },
    { new: true }
  ).select('+refreshTokens +tokenVersion');

  if (!user) {
    const possibleRace = await User.findOne({
      _id: payload.sub,
      refreshTokens: {
        $elemMatch: {
          token: oldHash,
          revokedAt: { $gt: new Date(Date.now() - 10_000) },
        },
      },
    }).select('_id');
    if (possibleRace) {
      throw ApiError.unauthorized('Refresh already completed; retry with the latest session cookie');
    }
    await revokeAllTokens(payload.sub);
    logger.warn(`Refresh token replay detected for user ${payload.sub}`);
    throw ApiError.unauthorized('Session revoked. Please sign in again.');
  }
  if ((payload.ver || 0) !== (user.tokenVersion || 0)) {
    throw ApiError.unauthorized('Session has been revoked');
  }
  const consumed = user.refreshTokens.find((refreshToken) => refreshToken.token === oldHash);
  return issueTokens(user, req, Boolean(consumed?.rememberMe));
};

export const revokeAllTokens = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $set: { 'refreshTokens.$[].revokedAt': new Date() },
    $inc: { tokenVersion: 1 },
  });
};

export const revokeToken = async (userId, refreshToken) => {
  const hash = hashToken(refreshToken);
  await User.updateOne(
    { _id: userId, 'refreshTokens.token': hash },
    { $set: { 'refreshTokens.$.revokedAt': new Date() } }
  );
};

export const revokePresentedRefreshToken = async (refreshToken) => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return false;
  }
  await revokeToken(payload.sub, refreshToken);
  return true;
};

export const sendVerificationEmail = async (user) => {
  const token = signEmailVerifyToken({ sub: user._id.toString(), email: user.email });
  await emailService.emailVerification(user, token);
  return token;
};

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

/** Create a single-use reset token bound to the current password version. */
export const sendPasswordResetEmail = async (email) => {
  const user = await User.findOne({ email });
  if (!user) return;

  const jti = crypto.randomUUID();
  user.passwordResetTokenHash = hashToken(jti);
  user.passwordResetRequestedAt = new Date();
  await user.save({ validateBeforeSave: false });
  const token = signPasswordResetToken({
    sub: user._id.toString(),
    jti,
    passwordVersion: user.passwordChangedAt
      ? Math.floor(user.passwordChangedAt.getTime() / 1000)
      : 0,
  });
  await emailService.passwordReset(user, token);
};

export const resetPasswordWithToken = async (token, newPassword) => {
  let payload;
  try {
    payload = verifyPasswordResetToken(token);
  } catch {
    throw ApiError.badRequest('Reset link invalid or expired');
  }
  const user = await User.findById(payload.sub)
    .select('+password +refreshTokens +tokenVersion +passwordResetTokenHash +passwordResetRequestedAt');
  if (!user) throw ApiError.notFound('User not found');

  const expectedHash = payload.jti ? hashToken(payload.jti) : '';
  const storedHash = user.passwordResetTokenHash || '';
  const hashesMatch = expectedHash.length > 0 &&
    expectedHash.length === storedHash.length &&
    crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(storedHash));
  const currentVersion = user.passwordChangedAt
    ? Math.floor(user.passwordChangedAt.getTime() / 1000)
    : 0;
  if (!hashesMatch || payload.passwordVersion !== currentVersion) {
    throw ApiError.badRequest('Reset link has already been used or is no longer valid');
  }

  user.password = newPassword;
  user.refreshTokens.forEach((refreshToken) => {
    refreshToken.revokedAt = new Date();
  });
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  user.passwordResetTokenHash = undefined;
  user.passwordResetRequestedAt = undefined;
  await user.save();
  return user;
};

/* Two-factor authentication */
export const generate2FASecret = (user) => {
  const secret = speakeasy.generateSecret({
    name: `MetlifeDM (${user.email})`,
    issuer: 'MetlifeDM LLC',
    length: 20,
  });
  return { base32: secret.base32, otpauthUrl: secret.otpauth_url };
};

export const verify2FAToken = (secret, code) =>
  speakeasy.totp.verify({ secret: decryptTwoFactorSecret(secret), encoding: 'base32', token: code, window: 1 });

const getTwoFactorKey = () => crypto
  .createHash('sha256')
  .update(config.security.twoFactorEncryptionKey)
  .digest();

export const encryptTwoFactorSecret = (secret) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getTwoFactorKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
};

export const decryptTwoFactorSecret = (secret) => {
  if (!secret?.startsWith('enc:v1:')) return secret;
  const [, , iv, tag, ciphertext] = secret.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getTwoFactorKey(),
    Buffer.from(iv, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
};

export const generateBackupCodes = () =>
  Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());

export const hashBackupCodes = (codes) =>
  Promise.all(codes.map((code) => bcrypt.hash(code.toUpperCase(), config.bcrypt.saltRounds)));

export const upgradeBackupCodeHashes = async (user) => {
  const codes = user.twoFactor?.backupCodes || [];
  if (!codes.some((code) => !isBackupHash(code))) return false;
  user.twoFactor.backupCodes = await Promise.all(
    codes.map((code) => (isBackupHash(code) ? code : bcrypt.hash(code, config.bcrypt.saltRounds)))
  );
  await user.save({ validateBeforeSave: false });
  return true;
};

export const verifyAndConsumeBackupCode = async (user, code) => {
  const normalized = code.toUpperCase();
  const codes = user.twoFactor?.backupCodes || [];
  let matchedIndex = -1;
  for (let index = 0; index < codes.length; index += 1) {
    const stored = codes[index];
    let matches = false;
    if (isBackupHash(stored)) {
      matches = await bcrypt.compare(normalized, stored);
    } else if (stored.length === normalized.length) {
      matches = crypto.timingSafeEqual(Buffer.from(normalized), Buffer.from(stored.toUpperCase()));
    }
    if (matches) {
      matchedIndex = index;
      break;
    }
  }
  if (matchedIndex < 0) return false;

  const matchedCode = codes[matchedIndex];
  const consumed = await User.updateOne(
    { _id: user._id, 'twoFactor.backupCodes': matchedCode },
    { $pull: { 'twoFactor.backupCodes': matchedCode } }
  );
  if (consumed.modifiedCount !== 1) return false;
  const refreshed = await User.findById(user._id).select('+twoFactor');
  if (refreshed) await upgradeBackupCodeHashes(refreshed);
  return true;
};

export const verifySecondFactor = async (user, code) => {
  if (/^\d{6}$/.test(code) && verify2FAToken(user.twoFactor.secret, code)) {
    await upgradeBackupCodeHashes(user);
    return true;
  }
  if (/^[A-Fa-f0-9]{8}$/.test(code)) return verifyAndConsumeBackupCode(user, code);
  return false;
};
