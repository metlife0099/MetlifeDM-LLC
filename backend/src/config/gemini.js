import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './index.js';
import logger from './logger.js';

let client = null;

if (config.gemini.apiKey) {
  client = new GoogleGenerativeAI(config.gemini.apiKey);
  logger.info(`✅  Gemini initialized with model: ${config.gemini.model}`);
} else {
  logger.warn('⚠️  Gemini API key not set — chatbot will fall back to human handoff only');
}

export const isGeminiAvailable = () => Boolean(client);

/**
 * Get a configured GenerativeModel instance for a single call.
 * systemInstruction is passed per-model since it can vary by use case
 * (customer-facing bot vs. internal agent-suggestion/categorization prompts).
 */
export const getGeminiModel = (systemInstruction) =>
  client.getGenerativeModel({
    model: config.gemini.model,
    systemInstruction,
    generationConfig: {
      maxOutputTokens: config.gemini.maxTokens,
      temperature: config.gemini.temperature,
    },
  });

export default client;
