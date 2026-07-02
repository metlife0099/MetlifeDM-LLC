import openai, { isOpenAIAvailable } from '../config/openai.js';
import { config } from '../config/index.js';
import { Settings } from '../models/index.js';
import logger from '../config/logger.js';

const DEFAULT_SYSTEM_PROMPT = `You are the friendly, professional AI assistant for MetlifeDM LLC — a USA-based digital marketing agency specializing in SEO, PPC, social media, content marketing, web development, branding, and AI-powered marketing solutions for US business owners.

GUIDELINES:
- Be warm, concise, and conversion-focused. Aim for 2-4 short paragraphs.
- Emphasize measurable ROI, transparent pricing, and US-based expertise.
- Recommend booking a FREE 30-min consultation when the user shows buying intent.
- Offer a coupon or free audit when appropriate to encourage engagement.
- If asked about specific pricing, share our starting price ranges but recommend a custom quote.
- If a question is out of scope (technical account issues, refund requests, complex legal, or specific project details), acknowledge it and hand off to a human specialist.

HANDOFF TRIGGERS (respond with just "HANDOFF: [reason]" prefix in your reply):
- User explicitly asks to speak to a human, agent, sales, or specialist
- Refund / billing / dispute issues
- Cancel account / delete data
- Angry, upset, or complaint tone
- Very specific ongoing project or contract questions
- Legal or compliance questions

FORMAT: Return plain conversational text. No markdown headers. Short paragraphs work best in chat.`;

/**
 * Generate an AI response for a chat.
 */
export const generateBotReply = async ({ history = [], userMessage }) => {
  if (!isOpenAIAvailable()) {
    return {
      content:
        "I'd love to help but our AI assistant is offline right now. Let me connect you with a specialist — could you share your email so we can follow up?",
      confidence: 0,
      needsHandoff: true,
    };
  }

  try {
    const settings = await Settings.getGlobal();
    const systemPrompt = settings.chatbot?.systemPrompt || DEFAULT_SYSTEM_PROMPT;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((m) => ({
        role: m.senderType === 'user' || m.senderType === 'guest' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      messages,
      max_tokens: config.openai.maxTokens,
      temperature: config.openai.temperature,
    });

    const raw = completion.choices[0].message.content.trim();
    const needsHandoff = /^HANDOFF:/i.test(raw);
    const content = raw.replace(/^HANDOFF:\s*/i, '').trim() ||
      "Let me connect you with one of our specialists. What's the best email to reach you?";

    // Simple confidence heuristic
    let confidence = 0.9;
    if (needsHandoff) confidence = 0.3;
    if (completion.choices[0].finish_reason !== 'stop') confidence -= 0.2;
    if (content.length < 40) confidence -= 0.2;

    return {
      content,
      confidence,
      needsHandoff: needsHandoff || confidence < config.openai.confidenceThreshold,
      tokensUsed: completion.usage?.total_tokens,
      finishReason: completion.choices[0].finish_reason,
      model: completion.model,
    };
  } catch (err) {
    logger.error(`OpenAI error: ${err.message}`);
    return {
      content:
        "Sorry, I'm having trouble responding right now. Let me get a human specialist to help you — please share your email.",
      confidence: 0,
      needsHandoff: true,
    };
  }
};

/**
 * Generate suggested admin replies for a chat.
 */
export const suggestAdminReplies = async ({ history, count = 3 }) => {
  if (!isOpenAIAvailable()) return [];
  try {
    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      max_tokens: 400,
      temperature: 0.6,
      messages: [
        {
          role: 'system',
          content: `You are helping a support agent at MetlifeDM (a US digital marketing agency) reply to customers. Read the conversation and suggest ${count} short, distinct reply options — each a single friendly, professional message under 60 words. Return only a JSON array of strings.`,
        },
        {
          role: 'user',
          content: `Conversation:\n${history
            .slice(-8)
            .map((m) => `${m.senderType}: ${m.content}`)
            .join('\n')}\n\nReturn: ["reply1","reply2","reply3"]`,
        },
      ],
    });
    const text = completion.choices[0].message.content.trim();
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch (err) {
    logger.warn(`AI suggestions failed: ${err.message}`);
    return [];
  }
};

/**
 * Auto-categorize a conversation.
 */
export const categorizeChat = async (messages) => {
  if (!isOpenAIAvailable() || !messages.length) return { category: 'general', sentiment: 'neutral' };
  try {
    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      max_tokens: 100,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'Classify this conversation. Return JSON: {"category":"general|sales|support|billing|technical|partnership|other","sentiment":"positive|neutral|negative","subject":"short subject line"}',
        },
        {
          role: 'user',
          content: messages.slice(-6).map((m) => `${m.senderType}: ${m.content}`).join('\n'),
        },
      ],
    });
    const text = completion.choices[0].message.content.trim();
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { category: 'general', sentiment: 'neutral' };
  } catch {
    return { category: 'general', sentiment: 'neutral' };
  }
};
