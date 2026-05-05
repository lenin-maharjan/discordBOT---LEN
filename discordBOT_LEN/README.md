# Discord Bot

A Discord bot built with `discord.js` for moderation, AI features, leveling, music, and server automation.

## Project Layout

- `src/index.js` - bot entry point
- `src/config.js` - environment and default configuration
- `src/events/` - event handlers
- `src/commands/` - slash command definitions
- `src/services/` - database, AI, music, mod log, and scheduler helpers

## Requirements

- Node.js 18 or newer
- A Discord bot token
- A Discord application client ID
- Optional: Groq API key for AI features

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in this folder with at least:

   ```env
   TOKEN=your_discord_bot_token
   CLIENT_ID=your_discord_application_client_id
   GROQ_API_KEY=your_groq_api_key
   ```

3. Add any server-specific channel, role, or feature settings you want to override.

## Run

Start the bot from this folder:

```bash
npm start
```

## Notes

- The bot creates its database file as `bot.db` in this folder.
- Keep `.env`, `bot.db`, and `node_modules` out of version control.
- Slash commands are registered when the bot starts successfully.