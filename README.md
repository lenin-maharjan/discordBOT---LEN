# 🤖 Discord Full Automation Bot

## Features
- ✅ Welcome new members with embed + DM
- ✅ XP Leveling system with level-up roles
- ✅ !rank and !leaderboard commands
- ✅ Button-based role assignment panel
- ✅ Daily auto-posts (rotates every day)

---

## ⚡ Setup in 5 Steps

### 1. Install Node.js
Download from https://nodejs.org (LTS version)

### 2. Install dependencies
Open a terminal in this folder and run:
```
npm install
```

### 3. Configure the bot
Open `src/index.js` and fill in your values in the CONFIG section at the top:

- `TOKEN` — your bot token from Discord Developer Portal
- `WELCOME_CHANNEL_ID` — right-click your #welcome channel → Copy ID
- `DAILY_POST_CHANNEL_ID` — channel for daily posts
- `LOG_CHANNEL_ID` — channel for logs
- `VERIFIED_ROLE_ID` — role given after joining
- Role IDs under `ROLES` — for the self-assign panel
- Role IDs under `LEVEL_ROLES` — roles awarded at each level

> To get IDs: go to Discord Settings → Advanced → Enable Developer Mode
> Then right-click any channel/role → Copy ID

### 4. Run the bot
```
npm start
```

### 5. Set up the role panel
In your Discord server, type:
```
!rolepanel
```
in the channel where you want the role buttons to appear.

---

## 📋 Commands
| Command        | Description                        |
|----------------|------------------------------------|
| `!rank`        | Shows your current level & XP      |
| `!leaderboard` | Top 10 most active members         |
| `!rolepanel`   | Posts the role assignment buttons (admin only) |

---

## 🌐 Keep it Online 24/7 (Free Options)
- **Railway.app** — free tier, easy deploy
- **Render.com** — free background workers
- **Oracle Cloud** — always-free VPS

---

## 💡 Tips
- For persistent XP data across restarts, add a SQLite database (ask Claude for help!)
- Edit the daily message logic in `src/services/scheduler.js` to customize your daily posts
- Add more level roles by inserting entries in `LEVEL_ROLES`
