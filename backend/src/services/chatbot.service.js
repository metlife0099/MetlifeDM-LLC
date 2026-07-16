import { getGeminiModel, isGeminiAvailable } from '../config/gemini.js';
import { config } from '../config/index.js';
import { Settings, Service, FAQ, Industry } from '../models/index.js';
import logger from '../config/logger.js';

const BASE_SYSTEM_PROMPT = `You are the friendly, knowledgeable AI assistant for MetlifeDM LLC — a USA-based digital marketing agency founded in 2024, headquartered in Miami, FL. Our tagline: "Digital marketing excellence for USA businesses."

We specialize in: SEO, PPC / Google Ads, Social Media Marketing, Local SEO, Content Marketing, Email Marketing, Web Development, Branding, Video Marketing, Analytics, and AI-powered marketing solutions — for US business owners of all sizes.

Key pages on our site you can point people to:
- /services — full service catalog with pricing
- /industries — industries we specialize in
- /case-studies and /portfolio — real client results and work samples
- /pricing — plan and pricing overview
- /blog — marketing insights and guides
- /about — our story and team
- /contact — general inquiries
- /consultation — book a FREE 30-minute strategy call (our #1 conversion action)
- /careers — open positions

GUIDELINES:
- Be warm, concise, and conversion-focused. Aim for 2-4 short paragraphs.
- Emphasize measurable ROI, transparent pricing, and US-based expertise.
- Recommend booking the FREE 30-min consultation at /consultation whenever the user shows buying intent or asks "how do I get started."
- If asked about specific pricing, share our starting price ranges but recommend a custom quote via consultation.
- Use the CURRENT SERVICES and FAQ knowledge below as your source of truth — don't invent services, prices, or policies that aren't listed there.
- If a question is out of scope (technical account issues, refund requests, complex legal, or specific project/contract details), acknowledge it and hand off to a human specialist.

HANDOFF TRIGGERS (respond with just "HANDOFF: [reason]" prefix in your reply, nothing else):
- User explicitly asks to speak to a human, agent, sales, or specialist
- Refund / billing / dispute issues
- Cancel account / delete data
- Angry, upset, or complaint tone
- Very specific ongoing project or contract questions
- Legal or compliance questions

FORMAT: Return plain conversational text. No markdown headers. Short paragraphs work best in chat.`;

/* ---------------------------------------------------------------
 * Live knowledge injection — pulls current published services and
 * FAQs into the prompt so the bot answers from what's actually on
 * the site today, not a stale hardcoded description. Cached briefly
 * since this runs on every customer message.
 * ------------------------------------------------------------- */
let knowledgeCache = { text: '', expiresAt: 0 };
const KNOWLEDGE_TTL_MS = 10 * 60 * 1000;

const buildKnowledge = async () => {
  if (Date.now() < knowledgeCache.expiresAt) return knowledgeCache.text;

  const [services, faqs, industries] = await Promise.all([
    Service.find({ isPublished: true })
      .select('title category shortDescription startingPrice')
      .limit(30)
      .lean(),
    FAQ.find({ isPublished: true }).select('question answer').limit(25).lean(),
    Industry.find({ isPublished: true }).select('name').limit(20).lean(),
  ]);

  const parts = [];

  if (services.length) {
    parts.push(
      'CURRENT SERVICES:\n' +
        services
          .map((s) => `- ${s.title}${s.category ? ` (${s.category})` : ''}: ${s.shortDescription || ''}${s.startingPrice ? ` — starting at $${s.startingPrice}` : ''}`)
          .join('\n')
    );
  }

  if (industries.length) {
    parts.push('INDUSTRIES WE SERVE:\n' + industries.map((i) => `- ${i.name}`).join(', '));
  }

  if (faqs.length) {
    parts.push('FREQUENTLY ASKED QUESTIONS:\n' + faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n'));
  }

  knowledgeCache = { text: parts.join('\n\n'), expiresAt: Date.now() + KNOWLEDGE_TTL_MS };
  return knowledgeCache.text;
};

/**
 * Convert our chat history into Gemini's { role, parts } turn format.
 * Gemini requires: only 'user'/'model' roles, strict alternation, and
 * the first turn must be 'user' — so we merge consecutive same-role
 * messages and trim any leading non-user turns defensively.
 */
const toGeminiHistory = (history) => {
  const turns = [];
  for (const m of history) {
    const text = (m.content || '').trim();
    if (!text) continue;
    const role = m.senderType === 'user' || m.senderType === 'guest' ? 'user' : 'model';
    const last = turns[turns.length - 1];
    if (last && last.role === role) {
      last.parts[0].text += `\n${text}`;
    } else {
      turns.push({ role, parts: [{ text }] });
    }
  }
  while (turns.length && turns[0].role !== 'user') turns.shift();
  return turns;
};

/**
 * Generate an AI response for a chat.
 */
export const generateBotReply = async ({ history = [], userMessage }) => {
  if (!isGeminiAvailable()) {
    return {
      content:
        "I'd love to help but our AI assistant is offline right now. Let me connect you with a specialist — could you share your email so we can follow up?",
      confidence: 0,
      needsHandoff: true,
    };
  }

  try {
    const settings = await Settings.getGlobal();
    const knowledge = await buildKnowledge();
    const systemPrompt = `${settings.chatbot?.systemPrompt || BASE_SYSTEM_PROMPT}\n\n${knowledge}`;

    const model = getGeminiModel(systemPrompt);
    const chat = model.startChat({ history: toGeminiHistory(history.slice(-10)) });
    const result = await chat.sendMessage(userMessage);
    const response = result.response;

    const raw = (response.text() || '').trim();
    const needsHandoffFlag = /^HANDOFF:/i.test(raw);
    const content =
      raw.replace(/^HANDOFF:\s*/i, '').trim() ||
      "Let me connect you with one of our specialists. What's the best email to reach you?";

    const finishReason = response.candidates?.[0]?.finishReason || 'STOP';

    // Simple confidence heuristic
    let confidence = 0.9;
    if (needsHandoffFlag) confidence = 0.3;
    if (finishReason !== 'STOP') confidence -= 0.2;
    if (content.length < 40) confidence -= 0.2;

    return {
      content,
      confidence,
      needsHandoff: needsHandoffFlag || confidence < config.gemini.confidenceThreshold,
      tokensUsed: response.usageMetadata?.totalTokenCount,
      finishReason,
      model: config.gemini.model,
    };
  } catch (err) {
    logger.error(`Gemini error: ${err.message}`);
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
  if (!isGeminiAvailable()) return [];
  try {
    const model = getGeminiModel(
      `You are helping a support agent at MetlifeDM (a US digital marketing agency) reply to customers. Read the conversation and suggest ${count} short, distinct reply options — each a single friendly, professional message under 60 words. Return only a JSON array of strings, nothing else.`
    );
    const prompt = `Conversation:\n${history
      .slice(-8)
      .map((m) => `${m.senderType}: ${m.content}`)
      .join('\n')}\n\nReturn: ["reply1","reply2","reply3"]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
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
  if (!isGeminiAvailable() || !messages.length) return { category: 'general', sentiment: 'neutral' };
  try {
    const model = getGeminiModel(
      'Classify this conversation. Return only JSON, nothing else: {"category":"general|sales|support|billing|technical|partnership|other","sentiment":"positive|neutral|negative","subject":"short subject line"}'
    );
    const prompt = messages.slice(-6).map((m) => `${m.senderType}: ${m.content}`).join('\n');
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { category: 'general', sentiment: 'neutral' };
  } catch {
    return { category: 'general', sentiment: 'neutral' };
  }
};
