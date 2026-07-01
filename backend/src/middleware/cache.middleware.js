import { cache } from '../config/redis.js';
import { config } from '../config/index.js';
import logger from '../config/logger.js';

/**
 * cacheMiddleware(keyBuilder, ttl)
 * @param {(req) => string} keyBuilder - function returning cache key from request
 * @param {number} ttl - seconds
 */
export const cacheMiddleware = (keyBuilder, ttl = 300) => async (req, res, next) => {
  if (!config.features.redisCache) return next();
  if (req.method !== 'GET') return next();

  const key = typeof keyBuilder === 'function' ? keyBuilder(req) : keyBuilder;
  if (!key) return next();

  try {
    const cached = await cache.get(key);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, body, ttl).catch((e) => logger.warn(`Cache write failed: ${e.message}`));
      }
      return originalJson(body);
    };
    next();
  } catch (err) {
    logger.warn(`Cache middleware error: ${err.message}`);
    next();
  }
};

/**
 * Invalidate a cache key/pattern (call from write endpoints).
 */
export const invalidateCache = (pattern) => cache.del(pattern);
