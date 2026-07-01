import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis } from '../config/redis.js';
import { config } from '../config/index.js';
import ApiError from '../utils/ApiError.js';

const buildStore = () => {
  const client = getRedis();
  if (!client) return undefined;
  return new RedisStore({
    sendCommand: (...args) => client.call(...args),
    prefix: 'rl:',
  });
};

const handler = (req, res, next) =>
  next(ApiError.tooMany('Too many requests, please try again later'));

/**
 * Global limiter — applied to all /api routes.
 */
export const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  store: buildStore(),
});

/**
 * Stricter limiter for auth endpoints (login, register, forgot-password).
 */
export const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skipSuccessfulRequests: false,
  store: buildStore(),
});

/**
 * Very strict limiter for password reset / OTP verification.
 */
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  store: buildStore(),
});

/**
 * Chat / message limiter to prevent spam.
 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  store: buildStore(),
});
