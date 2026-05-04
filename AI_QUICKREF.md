# ⚡ AI Bot Quick Reference

## 🚀 Quick Setup (5 minutes)

```bash
# 1. Get free API key from https://console.groq.com/keys
# 2. Edit src/index.js CONFIG block with:
#    - GROQ_API_KEY
#    - TOKEN (from Discord Developer Portal)
#    - CLIENT_ID
#    - Channel IDs (right-click to copy)

# 3. Install & run
npm install
npm start
```

## 📋 All Commands

### 🧠 AI Commands
| Command | Usage |
|---------|-------|
| `/ask` | `/ask what's machine learning?` |
| `/roast` | `/roast @User` |
| `/compliment` | `/compliment @User` |
| `/advice` | `/advice I'm procrastinating` |
| `/translate` | `/translate hello language:Spanish` |
| `/explain` | `/explain quantum physics` |
| `/story` | `/story a knight and dragon` |
| `/summarize` | `/summarize` (last 50 msgs) |
| `/poll` | `/poll best programming language` |
| `/trivia` | `/trivia` |
| `/debate` | `/debate should school start later` |
| `/wordoftheday` | `/wordoftheday` |
| `/giveaway` | `/giveaway $100 gift card` |

### 📊 Leveling
| Command | Usage |
|---------|-------|
| `/rank` | `/rank` or `/rank @User` |
| `/leaderboard` | `/leaderboard` |
| `/rolepanel` | `/rolepanel` (create role buttons) |

### 🔨 Moderation
| Command | Requires | Usage |
|---------|----------|-------|
| `/ban` | Ban Members | `/ban @User spam` |
| `/kick` | Kick Members | `/kick @User` |
| `/mute` | Moderate Members | `/mute @User 3600` |
| `/warn` | Moderate Members | `/warn @User toxicity` |
| `/warnings` | - | `/warnings @User` |
| `/purge` | Manage Messages | `/purge 50` |
| `/slowmode` | Manage Channels | `/slowmode 10` |
| `/lock` | Manage Channels | `/lock` |
| `/unlock` | Manage Channels | `/unlock` |
| `/serverinfo` | - | `/serverinfo` |
| `/userinfo` | - | `/userinfo @User` |

## 🔧 CONFIG Block (in src/index.js)

```javascript
TOKEN: 'YOUR_DISCORD_TOKEN',              // Discord bot token
CLIENT_ID: 'YOUR_CLIENT_ID',              // Discord Application ID
GROQ_API_KEY: 'gsk_xxxxx',                // FREE from console.groq.com
GROQ_MODEL: 'llama-3.3-70b-versatile',    // Don't change

SERVER_NAME: 'Your Server',               // For context
BOT_NAME: 'AI Assistant',                 // How bot introduces itself
BOT_PERSONALITY: 'friendly, helpful...',  // How it acts

WELCOME_CHANNEL_ID: '1234...',            // Where new members welcomed
DAILY_POST_CHANNEL_ID: '1234...',         // Where daily AI posts go
MOD_LOG_CHANNEL_ID: '1234...',            // Where mod actions logged

MEMBER_ROLE_ID: '1234...',                // Given on join
MUTED_ROLE_ID: '1234...',                 // For mutes

AI_RATE_LIMIT: 10,                        // Max AI calls/minute
TOXICITY_CHECK: true,                     // Enable AI moderation
TOXIC_THRESHOLD: 0.7,                     // 70%+ = warn
AUTO_RESPONSE_CHANCE: 0.20,               // 20% chance to answer ?
```

## 🧠 How AI Works

1. **User sends message with bot mention or `?`**
   - Bot calls Groq API with message + history
   - Groq (llama 3.3 70b) thinks about it
   - Bot responds 1-3 seconds later

2. **`/ask` command**
   - User input → Groq → Response
   - Remembers last 10 messages per user
   - Max 10 AI calls per minute per user

3. **Auto-moderation**
   - Every message scored 0-1 for toxicity
   - If > 70%: message deleted + warning
   - AI explains WHY it was toxic

4. **Daily automation**
   - 9 AM: AI writes unique daily message
   - Monday: Weekly recap by AI
   - Sunday: Motivational message by AI

## 🎯 Examples

### Auto-response (happens automatically)
```
User: "Does anyone know how to code?"
Bot: [20% chance to respond]
→ "Sure! What language are you interested in? Python, JavaScript, and C++ are popular starts..."
```

### Command usage
```
/roast @John
→ "John's so chill, he debugs code while sleeping! 😂"

/advice I'm struggling with motivation
→ "Break your goals into tiny wins. Each small victory builds momentum. You've got this! 💪"

/translate hello language:Spanish
→ "¡Hola!"
```

## ⚠️ Important Notes

- **Groq is free** - 30 requests/minute (way more than needed)
- **Rate limited** - 10 AI calls per minute per user (configurable)
- **Memory works** - Bot remembers user conversation history
- **No moderation needed** - AI automatically checks toxicity
- **Responses take 1-3 seconds** - This is normal for Groq

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| Bot offline | Restart: Ctrl+C → `npm start` |
| No commands showing | Wait 2 mins, restart bot |
| `/ask` not working | Check GROQ_API_KEY, verify connection |
| Rate limit hit | Wait 1 minute, try again |
| No AI responses | Check MOD_LOG_CHANNEL_ID is valid |
| Toxicity not working | Enable TOXICITY_CHECK: true |

## 📞 Resources

- **Groq Console**: https://console.groq.com/
- **Get API Key**: https://console.groq.com/keys
- **Discord Token**: https://discord.com/developers/applications
- **Discord.js Docs**: https://discord.js.org/

---

**That's it! Your AI Discord bot is ready to go! 🤖**
