import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { ROLE_HIERARCHY, USER_STATUS } from '../utils/constants.js';
import User from '../models/User.model.js';

/**
 * Extract Bearer token from Authorization header.
 */
const extractToken = (req) => {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  if (req.cookies?.access_token) return req.cookies.access_token;
  return null;
};

/**
 * Require a valid JWT and attach user to req.
 */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Authentication required');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized(err.name === 'TokenExpiredError' ? 'Session expired' : 'Invalid token');
  }

  const user = await User.findById(payload.sub).select('+status +role').lean();
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (user.status !== USER_STATUS.ACTIVE) throw ApiError.forbidden(`Account is ${user.status}`);

  req.user = user;
  req.token = token;
  next();
});

/**
 * Optional auth — attaches user if token is present, otherwise continues.
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).lean();
    if (user && user.status === USER_STATUS.ACTIVE) {
      req.user = user;
      req.token = token;
    }
  } catch {
    // silently ignore
  }
  next();
});

/**
 * Restrict to specific roles. Usage: requireRole('admin', 'super_admin')
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden('Insufficient permissions'));
  }
  next();
};

/**
 * Require role >= given rank in hierarchy.
 * requireMinRole('manager') → allows manager, admin, super_admin.
 */
export const requireMinRole = (minRole) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  const userRank = ROLE_HIERARCHY[req.user.role] || 0;
  const minRank = ROLE_HIERARCHY[minRole] || 0;
  if (userRank < minRank) return next(ApiError.forbidden('Insufficient permissions'));
  next();
};

/**
 * Admin-only shortcut.
 */
export const requireAdmin = requireMinRole('admin');
export const requireSuperAdmin = requireRole('super_admin');
