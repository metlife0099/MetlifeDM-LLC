import Stripe from 'stripe';
import { config } from './index.js';
import logger from './logger.js';

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2024-12-18.acacia',
  typescript: false,
  telemetry: false,
  maxNetworkRetries: 3,
  timeout: 30000,
  appInfo: {
    name: 'MetlifeDM LLC',
    version: '1.0.0',
    url: config.urls.server,
  },
});

logger.info('✅  Stripe SDK initialized');

export default stripe;
