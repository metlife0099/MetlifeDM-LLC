import OpenAI from 'openai';
import { config } from './index.js';
import logger from './logger.js';

let openai = null;

if (config.openai.apiKey) {
  openai = new OpenAI({
    apiKey: config.openai.apiKey,
    maxRetries: 2,
    timeout: 30000,
  });
  logger.info(`✅  OpenAI initialized with model: ${config.openai.model}`);
} else {
  logger.warn('⚠️  OpenAI API key not set — chatbot will fall back to human handoff only');
}

export const isOpenAIAvailable = () => Boolean(openai);
export default openai;
