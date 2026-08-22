import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { User } from '../models/index.js';
import { USER_STATUS, LEGAL_VERSIONS } from '../utils/constants.js';
import { refreshCookieOptions, clearCookieOptions, REFRESH_COOKIE_NAME } from '../utils/cookies.js';
import * as auth from '../services/auth.service.js';
import emailService from '../services/email.service.js';
import logger from '../config/logger.js';
import { notifyAdmins } from './notification.controller.js';

const setRefreshCookie = (res, token, sessionMaxAge) => {
  const options = { ...refreshCookieOptions, maxAge: sessionMaxAge };
  return res.cookie(REFRESH_COOKIE_NAME, token, options);
};
const clearRefreshCookie = (res) => res.clearCookie(REFRESH_COOKIE_NAME, clearCookieOptions);

const sanitizeUser = (user) => {
  const u = user.toObject ? user.toObject() : user;
  delete u.password;
  delete u.refreshTokens;
  delete u.twoFactor;
  delete u.failedLoginAttempts;
  delete u.lockedUntil;
  return u;
};

/* POST /auth/register */
export const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone, company, newsletterSubscribed } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('Email already registered');

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    company: company ? { name: company } : undefined,
    newsletterSubscribed: !!newsletterSubscribed,
    status: USER_STATUS.PENDING,
    legalAcceptance: {
      acceptedAt: new Date(),
      termsVersion: LEGAL_VERSIONS.TERMS,
      privacyVersion: LEGAL_VERSIONS.PRIVACY,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  auth.sendVerificationEmail(user).catch((error) =>
    logger.error(`Verification email delivery failed for ${user._id}: ${error.message}`)
  );
  emailService.welcome(user).catch((e) => logger.warn(`Welcome email failed: ${e.message}`));
  notifyAdmins({
    type: 'user',
    title: 'New customer registered',
    message: `${user.firstName} ${user.lastName} — ${user.email}`,
    resourceType: 'user',
    resourceId: user._id,
    actionUrl: `/users/${user._id}`,
  }).catch(() => {});

  return ApiResponse.created(
    res,
    { user: sanitizeUser(user) },
    'Registration successful. Check your email to verify your account.'
  );
});

/* POST /auth/login */
export const login = asyncHandler(async (req, res) => {
  const { email, password, twoFactorCode, rememberMe } = req.body;

  const user = await User.findOne({ email })
    .select('+password +failedLoginAttempts +lockedUntil +twoFactor +tokenVersion');
  if (!user) throw ApiError.unauthorized('Invalid credentials');

  if (user.lockedUntil && user.lockedUntil > Date.now()) {
    throw ApiError.forbidden('Account locked due to failed attempts. Try again in 15 minutes.');
  }

  if (user.status === USER_STATUS.SUSPENDED) throw ApiError.forbidden('Account suspended');
  if (user.status === USER_STATUS.DELETED) throw ApiError.forbidden('Account no longer exists');

  const match = await user.comparePassword(password);
  if (!match) {
    await user.incFailedAttempts();
    throw ApiError.unauthorized('Invalid credentials');
  }

  // 2FA check
  if (user.twoFactor?.enabled) {
    if (!twoFactorCode) {
      return ApiResponse.ok(res, { requires2FA: true }, '2FA required');
    }
    const valid = await auth.verifySecondFactor(user, twoFactorCode);
    if (!valid) {
      await user.incFailedAttempts();
      throw ApiError.unauthorized('Invalid 2FA code');
    }
  }

  if (!user.emailVerified && user.status === USER_STATUS.PENDING) {
    throw ApiError.forbidden('Please verify your email before signing in');
  }

  await user.resetFailedAttempts();

  const { accessToken, refreshToken, sessionMaxAge } =
    await auth.issueTokens(user, req, Boolean(rememberMe));
  setRefreshCookie(res, refreshToken, sessionMaxAge);

  return ApiResponse.ok(
    res,
    { user: sanitizeUser(user), accessToken },
    'Logged in successfully'
  );
});

/* POST /auth/refresh */
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw ApiError.unauthorized('No refresh token provided');

  const { accessToken, refreshToken, sessionMaxAge } = await auth.rotateRefreshToken(token, req);
  setRefreshCookie(res, refreshToken, sessionMaxAge);

  return ApiResponse.ok(res, { accessToken }, 'Token refreshed');
});

/* GET /auth/session
 * A non-mutating session probe lets browser apps distinguish a signed-out
 * visitor from a session that needs refresh without generating an expected
 * 401 on every anonymous page load. It never exposes or validates the token.
 */
export const session = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  return ApiResponse.ok(
    res,
    { hasSession: Boolean(req.cookies?.[REFRESH_COOKIE_NAME]) },
    'Session state'
  );
});

/* POST /auth/logout */
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (token) await auth.revokePresentedRefreshToken(token);
  clearRefreshCookie(res);
  return ApiResponse.ok(res, null, 'Logged out');
});

/* POST /auth/logout-all */
export const logoutAll = asyncHandler(async (req, res) => {
  await auth.revokeAllTokens(req.user._id);
  clearRefreshCookie(res);
  return ApiResponse.ok(res, null, 'Signed out on all devices');
});

/* POST /auth/verify-email */
export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await auth.confirmEmail(req.body.token);
  return ApiResponse.ok(res, { user: sanitizeUser(user) }, 'Email verified');
});

/* POST /auth/resend-verification */
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user && !user.emailVerified) {
    await auth.sendVerificationEmail(user).catch((error) =>
      logger.error(`Verification email resend failed for ${user._id}: ${error.message}`)
    );
  }
  return ApiResponse.ok(res, null, 'If an account exists, a verification email has been sent.');
});

/* POST /auth/forgot-password */
export const forgotPassword = asyncHandler(async (req, res) => {
  await auth.sendPasswordResetEmail(req.body.email).catch((error) =>
    logger.error(`Password reset email delivery failed: ${error.message}`)
  );
  return ApiResponse.ok(res, null, 'If an account exists, a reset link has been sent.');
});

/* POST /auth/reset-password */
export const resetPassword = asyncHandler(async (req, res) => {
  await auth.resetPasswordWithToken(req.body.token, req.body.password);
  clearRefreshCookie(res);
  return ApiResponse.ok(res, null, 'Password reset. Please sign in.');
});

/* POST /auth/change-password (authenticated) */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password +refreshTokens +tokenVersion');
  const match = await user.comparePassword(currentPassword);
  if (!match) throw ApiError.unauthorized('Current password is incorrect');
  user.password = newPassword;
  user.refreshTokens.forEach((refreshToken) => {
    refreshToken.revokedAt = new Date();
  });
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  clearRefreshCookie(res);
  return ApiResponse.ok(res, null, 'Password changed');
});

/* GET /auth/me */
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlistServices', 'title slug icon startingPrice');
  return ApiResponse.ok(res, { user: sanitizeUser(user) }, 'Current user');
});

/* --------- 2FA --------- */

/* POST /auth/2fa/setup */
export const setup2FA = asyncHandler(async (req, res) => {
  if (!auth.isTwoFactorEnabled()) throw ApiError.notFound('Two-factor authentication is disabled');
  const user = await User.findById(req.user._id).select('+twoFactor');
  if (user.twoFactor?.enabled) throw ApiError.badRequest('2FA already enabled');
  const secret = auth.generate2FASecret(user);
  // store the pending secret (not enabled yet)
  user.twoFactor.secret = auth.encryptTwoFactorSecret(secret.base32);
  await user.save({ validateBeforeSave: false });
  return ApiResponse.ok(
    res,
    { otpauthUrl: secret.otpauthUrl, secret: secret.base32 },
    'Scan the QR code in your authenticator app, then confirm.'
  );
});

/* POST /auth/2fa/enable */
export const enable2FA = asyncHandler(async (req, res) => {
  if (!auth.isTwoFactorEnabled()) throw ApiError.notFound('Two-factor authentication is disabled');
  const user = await User.findById(req.user._id).select('+twoFactor');
  if (!user.twoFactor?.secret) throw ApiError.badRequest('Run setup first');

  const valid = auth.verify2FAToken(user.twoFactor.secret, req.body.code);
  if (!valid) throw ApiError.badRequest('Invalid code');

  const backupCodes = auth.generateBackupCodes();
  user.twoFactor.enabled = true;
  user.twoFactor.backupCodes = await auth.hashBackupCodes(backupCodes);
  await user.save({ validateBeforeSave: false });

  return ApiResponse.ok(res, { backupCodes }, '2FA enabled — save your backup codes securely.');
});

/* POST /auth/2fa/disable */
export const disable2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+twoFactor');
  if (!user.twoFactor?.enabled) throw ApiError.badRequest('2FA not enabled');

  const valid = await auth.verifySecondFactor(user, req.body.code);
  if (!valid) throw ApiError.badRequest('Invalid code');

  user.twoFactor.enabled = false;
  user.twoFactor.secret = undefined;
  user.twoFactor.backupCodes = [];
  await user.save({ validateBeforeSave: false });
  return ApiResponse.ok(res, null, '2FA disabled');
});
