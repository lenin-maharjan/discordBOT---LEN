const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

    const equalsIndex = trimmedLine.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmedLine.slice(0, equalsIndex).trim();
    const value = trimmedLine.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, '');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const toBoolean = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  return value.toLowerCase() === 'true';
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toList = (value, fallback) => {
  if (!value) return fallback;
  return value.split('|').map(item => item.trim()).filter(Boolean);
};

const CONFIG = {
  TOKEN: process.env.TOKEN || 'YOUR_DISCORD_TOKEN_HERE',
  CLIENT_ID: process.env.CLIENT_ID || 'YOUR_CLIENT_ID_HERE',

  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  GROQ_ENDPOINT: process.env.GROQ_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions',

  SERVER_NAME: process.env.SERVER_NAME || 'Your Server Name',
  SERVER_PURPOSE: process.env.SERVER_PURPOSE || 'A fun community server for gaming and hanging out',
  SERVER_RULES: toList(process.env.SERVER_RULES, [
    'Be respectful to everyone',
    'No spam or self-promotion',
    'Keep conversations appropriate',
    'Use roles to stay organized',
    'Have fun and make friends!',
  ]),

  BOT_NAME: process.env.BOT_NAME || 'AI Assistant',
  BOT_PERSONALITY:
    process.env.BOT_PERSONALITY ||
    "You are a friendly, helpful, and funny Discord server assistant. You're like a cool friend in the group who cares about everyone and helps them out. You use emojis, make jokes, and keep conversations fun. You're also knowledgeable and can explain things clearly.",

  WELCOME_CHANNEL_ID: process.env.WELCOME_CHANNEL_ID || '1500086375482134548',
  DAILY_POST_CHANNEL_ID: process.env.DAILY_POST_CHANNEL_ID || '1500086952697794653',
  MOD_LOG_CHANNEL_ID: process.env.MOD_LOG_CHANNEL_ID || '1500082922642997261',

  MEMBER_ROLE_ID: process.env.MEMBER_ROLE_ID || '1500082922642997261',
  MUTED_ROLE_ID: process.env.MUTED_ROLE_ID || '1500082922642997261',

  XP_PER_MESSAGE: toNumber(process.env.XP_PER_MESSAGE, 15),
  XP_COOLDOWN_MS: toNumber(process.env.XP_COOLDOWN_MS, 60_000),
  LEVEL_ROLES: [
    { level: 5, roleId: process.env.LEVEL_ROLE_5 || '1500082922642997261', label: 'Active' },
    { level: 10, roleId: process.env.LEVEL_ROLE_10 || '1500082922642997261', label: 'Regular' },
    { level: 20, roleId: process.env.LEVEL_ROLE_20 || '1500082922642997261', label: 'Veteran' },
    { level: 50, roleId: process.env.LEVEL_ROLE_50 || '1500082922642997261', label: 'Legend' },
  ],

  SELF_ROLES: {
    GAMING: { label: 'Gamer', emoji: '🎮', roleId: process.env.SELF_ROLE_GAMING || '1500082922642997261' },
    STUDY: { label: 'Student', emoji: '📚', roleId: process.env.SELF_ROLE_STUDY || '1500082922642997261' },
    MUSIC: { label: 'Music', emoji: '🎵', roleId: process.env.SELF_ROLE_MUSIC || '1500082922642997261' },
    MOVIES: { label: 'Movies', emoji: '🎬', roleId: process.env.SELF_ROLE_MOVIES || '1500082922642997261' },
  },

  AI_RATE_LIMIT: toNumber(process.env.AI_RATE_LIMIT, 10),
  HISTORY_LENGTH: toNumber(process.env.HISTORY_LENGTH, 10),
  AUTO_RESPONSE_CHANCE: Number.isFinite(Number(process.env.AUTO_RESPONSE_CHANCE))
    ? Number(process.env.AUTO_RESPONSE_CHANCE)
    : 0.2,
  TOXICITY_CHECK: toBoolean(process.env.TOXICITY_CHECK, true),
  TOXIC_THRESHOLD: Number.isFinite(Number(process.env.TOXIC_THRESHOLD))
    ? Number(process.env.TOXIC_THRESHOLD)
    : 0.7,

  DAILY_POST_HOUR: toNumber(process.env.DAILY_POST_HOUR, 9),
  DAILY_POST_MINUTE: toNumber(process.env.DAILY_POST_MINUTE, 0),
};

module.exports = CONFIG;
