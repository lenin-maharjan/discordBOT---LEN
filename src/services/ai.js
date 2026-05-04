const CONFIG = require('../config');

const conversationHistory = new Map();
const userRateLimits = new Map();

async function callGroqAPI(messages, systemPrompt) {
  try {
    if (!CONFIG.GROQ_API_KEY || CONFIG.GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
      console.error('GROQ_API_KEY not configured');
      return null;
    }

    const response = await fetch(CONFIG.GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CONFIG.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CONFIG.GROQ_MODEL,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.9,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Groq API Error:', error);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('Groq API Exception:', error);
    return null;
  }
}

function getSystemPrompt(context = '') {
  return `You are ${CONFIG.BOT_NAME}, ${CONFIG.BOT_PERSONALITY}

Server: ${CONFIG.SERVER_NAME}
Purpose: ${CONFIG.SERVER_PURPOSE}

Keep responses concise (1-2 sentences usually), friendly, and use Discord formatting.
${context}`;
}

function addToHistory(userId, role, content) {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, []);
  }

  const history = conversationHistory.get(userId);
  history.push({ role, content });

  if (history.length > CONFIG.HISTORY_LENGTH) {
    history.shift();
  }
}

function getHistory(userId) {
  return conversationHistory.get(userId) || [];
}

function checkRateLimit(userId) {
  const now = Date.now();

  if (!userRateLimits.has(userId)) {
    userRateLimits.set(userId, { count: 1, resetTime: now + 60000 });
    return true;
  }

  const limit = userRateLimits.get(userId);

  if (now > limit.resetTime) {
    userRateLimits.set(userId, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (limit.count >= CONFIG.AI_RATE_LIMIT) {
    return false;
  }

  limit.count++;
  return true;
}

module.exports = {
  callGroqAPI,
  getSystemPrompt,
  addToHistory,
  getHistory,
  checkRateLimit,
  conversationHistory,
  userRateLimits,
};
