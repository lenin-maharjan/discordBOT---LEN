# Android Phone Setup for 24/7 Discord Bot Hosting

This guide shows how to run the Discord bot on an old Android phone using Termux so it can stay online without needing a cloud VM or a credit card.

## What you need

- An old Android phone
- A charger and stable Wi-Fi
- A Discord bot token
- A Discord application client ID
- Your bot source code in a Git repository, or a copy you can copy onto the phone

## Why Android

An old Android phone can stay plugged in and online all the time. It is not as reliable as a real server, but it is a practical no-card option for a small Discord bot.

## Step 1: Install Termux

1. On the Android phone, install Termux from F-Droid: https://f-droid.org/packages/com.termux/
2. Do not use the old Play Store version if you can avoid it.
3. Open Termux after installation.

## Step 2: Update Termux

Run these commands in Termux:

```bash
pkg update -y
pkg upgrade -y
```

## Step 3: Install the tools the bot needs

Install Node.js, git, and a text editor:

```bash
pkg install -y nodejs-lts git nano
```

If your bot uses music features, install ffmpeg too:

```bash
pkg install -y ffmpeg
```

Check that Node.js works:

```bash
node -v
npm -v
```

## Step 4: Get the bot code onto the phone

If your bot is in GitHub, clone it:

```bash
git clone YOUR_REPO_URL
cd discord_bot
```

If you copied the project files onto the phone manually, open the project folder in Termux and move into it.

## Step 5: Create the `.env` file

Your bot reads settings from `.env` in the project root. Create it like this:

```bash
nano .env
```

Use this template and fill in your real values:

```env
TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_app_client_id
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
SERVER_NAME=Your Server Name
SERVER_PURPOSE=A fun community server
WELCOME_CHANNEL_ID=your_channel_id
DAILY_POST_CHANNEL_ID=your_channel_id
MOD_LOG_CHANNEL_ID=your_channel_id
MEMBER_ROLE_ID=your_role_id
MUTED_ROLE_ID=your_role_id
LEVEL_ROLE_5=your_role_id
LEVEL_ROLE_10=your_role_id
LEVEL_ROLE_20=your_role_id
LEVEL_ROLE_50=your_role_id
SELF_ROLE_GAMING=your_role_id
SELF_ROLE_STUDY=your_role_id
SELF_ROLE_MUSIC=your_role_id
SELF_ROLE_MOVIES=your_role_id
```

Save and exit:
- `Ctrl + O` to save
- `Enter` to confirm
- `Ctrl + X` to exit

## Step 6: Install dependencies

From the project folder, run:

```bash
npm install
```

## Step 7: Test the bot once

Run it manually first so you can catch any config problems:

```bash
npm start
```

If it logs in successfully, stop it with `Ctrl + C` and continue.

## Step 8: Keep the phone awake

To reduce the chance of Android killing the bot:

- Keep the phone plugged in.
- Turn off battery optimization for Termux.
- Disable battery saver modes.
- Keep the phone from sleeping if your Android version allows it.

## Step 9: Keep it running with PM2

Install PM2 globally:

```bash
npm install -g pm2
```

Start the bot with PM2:

```bash
pm2 start src/index.js --name discord-bot
```

Save the process list:

```bash
pm2 save
```

On Android, automatic start after reboot is limited. If you want that, install Termux:Boot and add a startup script later.

## Step 10: Check that it is running

Use:

```bash
pm2 status
pm2 logs discord-bot
```

## Step 11: Make it easier to restart after reboot

If the phone reboots, open Termux again, go to the project folder, and start the bot with `pm2 resurrect` or `pm2 start src/index.js --name discord-bot`.

## Updating the bot later

When you push changes to GitHub, update the phone like this:

```bash
cd discord_bot
git pull
npm install
pm2 restart discord-bot
```

## Phone tips

- Keep the phone plugged in.
- Use a stable charger and cable.
- Do not use the phone for heavy apps while the bot is running.
- Make sure your Discord bot token stays private.

## Common problems

### Bot does not start
- Check `pm2 logs discord-bot`
- Make sure `.env` exists
- Make sure `TOKEN` and `CLIENT_ID` are correct

### Termux keeps closing the bot
- Disable battery optimization for Termux
- Keep the phone charged
- Try again after rebooting the phone

### `npm install` fails
- Run `pkg update -y`
- Run `pkg upgrade -y`
- Make sure Node.js installed correctly

## Quick summary

1. Install Termux on an old Android phone.
2. Install Node.js, git, and PM2.
3. Clone your bot.
4. Add your `.env` file.
5. Run `npm install`.
6. Start the bot with `npm start` or PM2.
7. Keep the phone charged and battery optimization turned off.
