# 🤖 AI-Powered Discord Bot (Groq API)

## ✨ Features Overview

### 🧠 **AI Core**
- Every message with bot mention or `/ask` sends to Groq API
- Conversation history per user (last 10 messages remembered)
- Custom bot personality configured in CONFIG block
- Smart rate limiting (10 AI calls per minute per user)
- Fallback responses if Groq API fails

### 🤖 **AI Slash Commands (13 commands)**
| Command | Description | Example |
|---------|-------------|---------|
| `/ask` | Ask the AI anything | `/ask how do I learn Python?` |
| `/roast` | Get roasted by AI | `/roast @User` |
| `/compliment` | Get AI compliment | `/compliment @User` |
| `/advice` | Get life/gaming/study advice | `/advice I'm struggling with motivation` |
| `/translate` | Translate text | `/translate hello language:Spanish` |
| `/explain` | AI explains topics simply | `/explain quantum physics` |
| `/story` | AI generates short story | `/story a dragon and a knight` |
| `/summarize` | AI summarizes last 50 messages | `/summarize` |
| `/poll` | AI creates fun poll | `/poll best pizza topping` |
| `/trivia` | AI generates trivia question | `/trivia` |
| `/debate` | AI debates both sides | `/debate should school start later` |
| `/wordoftheday` | Cool word + definition | `/wordoftheday` |
| `/giveaway` | AI hypes giveaway | `/giveaway $100 Steam Card` |

### 🔄 **Auto-Response Features**
- ✅ 20% chance to answer questions (ends with `?`)
- ✅ Instant response when bot is mentioned
- ✅ Emoji reactions based on message sentiment (😊, 😢)
- ✅ Conversation history tracked per user

### 🔨 **AI Moderation**
- ✅ Real-time toxicity detection (Groq-powered)
- ✅ Auto-delete toxic messages
- ✅ AI-generated warning reasons
- ✅ All mod actions logged to #mod-logs
- ✅ 70% toxicity threshold (customizable)

### 👋 **AI Welcome System**
- ✅ AI generates personalized welcome message on join
- ✅ DM new members with server rules
- ✅ Auto-assign Member role on join
- ✅ Unique greeting each time based on username

### 📢 **AI Daily Automation**
- ✅ 9 AM: AI generates unique daily message
- ✅ Monday: AI writes weekly recap + hype
- ✅ Sunday: AI posts motivational message
- ✅ All messages unique (not templated)

### 📊 **Leveling & Rewards**
- ✅ XP per message (15 + random 0-10)
- ✅ `/rank` shows level, XP, progress bar
- ✅ `/leaderboard` top 10 members
- ✅ Auto role assignment at levels 5, 10, 20, 50
- ✅ Persistent database (SQLite)

### 🎭 **Role System**
- ✅ `/rolepanel` - Button-based self-role assignment
- ✅ Customize self-roles with emojis

### 🔧 **Admin Commands (11 commands)**
| Command | Permission | Effect |
|---------|-----------|--------|
| `/ban <user> [reason]` | Ban Members | Permanent ban with log |
| `/kick <user> [reason]` | Kick Members | Kick with log |
| `/mute <user> [duration]` | Moderate Members | Role-based mute |
| `/warn <user> <reason>` | Moderate Members | Add warning + log |
| `/warnings <user>` | Any member | View user's warnings |
| `/purge <amount>` | Manage Messages | Bulk delete 1-100 msgs |
| `/slowmode <seconds>` | Manage Channels | Set channel slowmode |
| `/lock` | Manage Channels | Lock channel |
| `/unlock` | Manage Channels | Unlock channel |
| `/serverinfo` | Any member | Server stats |
| `/userinfo [user]` | Any member | User profile |

---

## 🚀 Setup Instructions

### 1. **Get Groq API Key (FREE)**

1. Go to [console.groq.com](https://console.groq.com/keys)
2. Sign up (free)
3. Create API key
4. Copy the key

### 2. **Configure the Bot**

Edit `src/index.js` and fill in the CONFIG block:

```javascript
const CONFIG = {
  // Discord Bot
  TOKEN: 'YOUR_DISCORD_TOKEN_HERE',              // From Discord Developer Portal
  CLIENT_ID: 'YOUR_CLIENT_ID_HERE',              // Application ID

  // Groq API ⭐ IMPORTANT
  GROQ_API_KEY: 'gsk_xxxxxxxxxxxxx',             // Your Groq API key
  GROQ_MODEL: 'llama-3.3-70b-versatile',         // Don't change
  GROQ_ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions',

  // Server Info (customize for your server)
  SERVER_NAME: 'Your Server Name',
  SERVER_PURPOSE: 'A fun community server...',
  SERVER_RULES: [
    '✅ Be respectful to everyone',
    '✅ No spam or self-promotion',
    // ... add more rules
  ],

  // Bot Personality (this defines how AI responds)
  BOT_NAME: 'AI Assistant',
  BOT_PERSONALITY: 'You are a friendly, helpful, and funny Discord server assistant...',

  // Channel IDs
  WELCOME_CHANNEL_ID:    '1234567890',           // Where to welcome members
  DAILY_POST_CHANNEL_ID: '1234567890',           // Where daily AI posts go
  MOD_LOG_CHANNEL_ID:    '1234567890',           // Where mod actions logged

  // Role IDs
  MEMBER_ROLE_ID: '1234567890',                  // Auto-assigned on join
  MUTED_ROLE_ID:  '1234567890',                  // Used for muting

  // AI Settings
  AI_RATE_LIMIT: 10,                             // Max AI calls per minute
  HISTORY_LENGTH: 10,                            // Remember last 10 messages
  AUTO_RESPONSE_CHANCE: 0.20,                    // 20% chance to answer ?
  TOXICITY_CHECK: true,                          // Enable AI moderation
  TOXIC_THRESHOLD: 0.7,                          // 70%+ = action taken
};
```

### 3. **Find Your IDs**

**Discord Token:**
- Go to [Discord Developer Portal](https://discord.com/developers/applications)
- Select your app → **Bot** → Copy token

**Client ID:**
- Applications → Your app → Copy Application ID

**Channel/Role IDs:**
- Enable Developer Mode (User Settings → Advanced)
- Right-click channel/role → Copy ID
- Replace placeholders in CONFIG

**Groq API Key:**
- Go to [console.groq.com/keys](https://console.groq.com/keys)
- Click **Create API Key**
- Copy and paste

### 4. **Install & Run**

```bash
# Install dependencies
npm install

# Make sure `src/index.js` is configured
# Then start the bot
npm start

# You should see:
# ✅ Logged in as YourBot#0000
# 📝 Registering slash commands...
# ✅ Commands registered!
```

---

## 📝 Example Usage

### User sends a message with a question
```
User: "Hey @Bot, what's the best programming language?"
Bot: "That depends on what you're building! Python is great for beginners and AI... 🐍"
```

### Using slash commands
```
/ask What's machine learning?
→ Bot thinks about it and responds with Groq AI

/roast @John
→ Bot generates a funny roast
→ "John's so helpful, he debugs code he didn't write! 😄"

/advice I'm procrastinating on my project
→ Bot gives AI-generated advice
```

### Daily automation
```
9 AM every day:
→ AI generates a unique morning message

Monday:
→ AI writes weekly recap

Sunday:
→ AI posts motivational message
```

---

## 🧠 AI Customization

### Change Bot Personality

Edit the `BOT_PERSONALITY` in CONFIG:

```javascript
BOT_PERSONALITY: 'You are a sarcastic, witty gaming bot...' // Game-focused
BOT_PERSONALITY: 'You are a helpful study buddy...'         // Study-focused
BOT_PERSONALITY: 'You are a professional business bot...'    // Professional
```

### Change Server Rules

Edit `SERVER_RULES` array - these are sent in DMs to new members:

```javascript
SERVER_RULES: [
  '✅ Be respectful',
  '✅ No spam',
  '✅ Have fun!',
],
```

### Adjust Rate Limiting

```javascript
AI_RATE_LIMIT: 10,  // Change to 5 for stricter, 20 for looser
```

### Toxicity Threshold

```javascript
TOXICITY_CHECK: true,      // Set to false to disable
TOXIC_THRESHOLD: 0.7,      // Change from 0-1 (higher = stricter)
```

---

## ⚠️ Troubleshooting

### Bot doesn't respond to /ask
- ✅ Check `GROQ_API_KEY` is configured
- ✅ Check API key is valid (test at console.groq.com)
- ✅ Verify bot has message permissions
- ✅ Check rate limit (max 10/min per user)

### AI responses are delayed
- ✅ Normal - Groq API takes 1-3 seconds
- ✅ This is free tier, not instantaneous

### Bot goes offline
- ✅ Check `TOKEN` is correct
- ✅ Check bot is invited to server
- ✅ Check discord.js is installed: `npm install discord.js@14`

### Commands don't show up
- ✅ Restart bot (Ctrl+C, then `npm start`)
- ✅ Verify `CLIENT_ID` is correct
- ✅ Wait 1-2 minutes for Discord to sync

### Toxicity detection isn't working
- ✅ Check `TOXICITY_CHECK: true`
- ✅ Verify `GROQ_API_KEY` works
- ✅ Check `MOD_LOG_CHANNEL_ID` exists

### Getting rate limited
- ✅ Wait 1 minute between AI calls
- ✅ Share the bot with fewer users
- ✅ Increase `AI_RATE_LIMIT` value

---

## 📊 Database

The bot uses **SQLite** for persistence:

**File:** `bot.db` (created automatically)

**Tables:**
- `users` - User XP, level, username
- `warnings` - Warning history
- `mutes` - Active mutes + end times
- `userHistory` - Conversation history
- `rateLimits` - AI rate limit tracking

To reset all data:
```bash
rm bot.db  # Linux/Mac
del bot.db # Windows
```

Then restart the bot.

---

## 🔒 Security Notes

- ✅ **Never share your API keys** in code/GitHub
- ✅ Keep `GROQ_API_KEY` private
- ✅ Keep `TOKEN` private
- ✅ Use environment variables in production (`.env` file)
- ✅ Don't commit `bot.db` to version control if it has sensitive data

---

## 💡 Tips

1. **Test the AI** - Try `/ask` before deploying
2. **Customize personality** - Change `BOT_PERSONALITY` to match your server vibe
3. **Monitor logs** - Check #mod-logs for all AI actions
4. **Rate limiting** - Each user gets 10 AI calls per minute (configurable)
5. **Groq is free** - No credit card needed for 30 requests/minute (plenty!)
6. **Memory works** - Bot remembers last 10 messages per user for context

---

## 📞 Support

- **Groq Issues?** → [console.groq.com](https://console.groq.com)
- **Discord.js Help?** → [discord.js guide](https://discordjs.guide/)
- **API Documentation?** → [Groq API Docs](https://console.groq.com/docs)

---

## 🎉 Your AI Bot is Ready!

You now have a fully AI-powered Discord bot with:
- ✅ 13+ AI slash commands
- ✅ Auto-response with Groq
- ✅ AI moderation
- ✅ Personalized welcome messages
- ✅ Daily AI automation
- ✅ Conversation memory
- ✅ Leveling system
- ✅ Admin moderation tools

Enjoy! 🚀
