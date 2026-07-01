import Redis from 'ioredis';
import { config } from './index.js';
import logger from './logger.js';

let redisClient = null;
let subscriberClient = null;
let publisherClient = null;

const createClient = (label) => {
  const client = new Redis(config.redis.url, {
    password: config.redis.password || undefined,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times) => {
      const delay = Math.min(times * 200, 3000);
      return delay;
    },
  });

  client.on('connect', () => logger.info(`✅  Redis ${label} connected`));
  client.on('ready', () => logger.info(`✅  Redis ${label} ready`));
  client.on('error', (err) => logger.error(`❌  Redis ${label} error: ${err.message}`));
  client.on('close', () => logger.warn(`⚠️  Redis ${label} closed`));
  client.on('reconnecting', () => logger.info(`🔄  Redis ${label} reconnecting`));

  return client;
};

export const connectRedis = async () => {
  if (!config.features.redisCache) {
    logger.warn('⚠️  Redis caching disabled by feature flag');
    return null;
  }

  try {
    redisClient = createClient('main');
    subscriberClient = createClient('subscriber');
    publisherClient = createClient('publisher');

    await Promise.all([redisClient.connect(), subscriberClient.connect(), publisherClient.connect()]);

    return redisClient;
  } catch (err) {
    logger.error(`❌  Redis connection failed: ${err.message} — continuing without cache`);
    return null;
  }
};

export const getRedis = () => redisClient;
export const getSubscriber = () => subscriberClient;
export const getPublisher = () => publisherClient;

export const disconnectRedis = async () => {
  const closes = [];
  if (redisClient) closes.push(redisClient.quit());
  if (subscriberClient) closes.push(subscriberClient.quit());
  if (publisherClient) closes.push(publisherClient.quit());
  await Promise.allSettled(closes);
  logger.info('🔌  Redis disconnected');
};

/**
 * Simple cache helper with JSON serialization.
 */
export const cache = {
  async get(key) {
    if (!redisClient) return null;
    try {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : null;
    } catch (err) {
      logger.warn(`Redis GET failed for ${key}: ${err.message}`);
      return null;
    }
  },
  async set(key, value, ttl = config.redis.ttl) {
    if (!redisClient) return false;
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttl);
      return true;
    } catch (err) {
      logger.warn(`Redis SET failed for ${key}: ${err.message}`);
      return false;
    }
  },
  async del(pattern) {
    if (!redisClient) return 0;
    try {
      if (pattern.includes('*')) {
        const keys = await redisClient.keys(pattern);
        if (keys.length === 0) return 0;
        return redisClient.del(...keys);
      }
      return redisClient.del(pattern);
    } catch (err) {
      logger.warn(`Redis DEL failed for ${pattern}: ${err.message}`);
      return 0;
    }
  },
};

export default connectRedis;
