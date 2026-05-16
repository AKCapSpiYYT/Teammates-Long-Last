# TeammatesLongLast Discord Bot

A Discord bot for the TeammatesLongLast Minecraft server community. Built with discord.js v14 and TypeScript.

## Features

### Moderation
| Command | Description |
|---|---|
| `/ban` | Ban a member with a reason |
| `/kick` | Kick a member with a reason |
| `/unban` | Unban a user by ID |
| `/timeout` | Timeout a member for a duration |
| `/warn` | Warn a member (logged per-user) |
| `/clear` | Bulk-delete messages in a channel |
| `/lock` | Lock a channel so members can't send messages |
| `/unlock` | Unlock a previously locked channel |
| `/slowmode` | Set slowmode delay on a channel |
| `/userinfo` | Display info about a server member |
| `/announce` | Send a formatted announcement embed |
| `/adminhelp` | List all available admin commands |

### Community
| Command | Description |
|---|---|
| `/poll` | Create a 🟢/🔴 poll embed |
| `/reactionrole` | Assign a role when a member reacts with an emoji |
| `/joinnumber` | Show which member number someone is |

### Minecraft
| Command | Description |
|---|---|
| `/mcstatus` | Check live status of TeammatesLongLast.aternos.me |

### Prefix commands (`!`)
| Command | Description |
|---|---|
| `!ping` | Latency check |
| `!help` | List prefix commands |

### Auto-features
- **Live MC status** — posts server status every 10 seconds in a dedicated channel, showing online players with their Minecraft avatar
- **Join number roles** — automatically assigns a numbered role to each new member (Member #1, #2, …)
- **Reaction roles** — members gain/lose roles by reacting to pinned messages

---

## Setup

### Prerequisites
- Node.js 20+
- A Discord application with a bot token ([Discord Developer Portal](https://discord.com/developers/applications))

### Local development

```bash
# Install dependencies
npm install

# Copy env template
cp .env.example .env
# Fill in DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID in .env

# Register slash commands (run once, or after adding new commands)
npm run deploy-commands

# Start in watch mode
npm run dev
```

### Environment variables

| Variable | Description |
|---|---|
| `DISCORD_BOT_TOKEN` | Bot token from the Discord Developer Portal |
| `DISCORD_CLIENT_ID` | Application ID from the Discord Developer Portal |
| `PORT` | HTTP health check port (default: 3000) |
| `NODE_ENV` | Set to `production` on Render |

---

## Deploy to Render

This repo includes a `render.yaml` at the project root for one-click deployment.

1. Push this repository to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect your GitHub repo — Render reads `render.yaml` automatically
4. Add `DISCORD_BOT_TOKEN` and `DISCORD_CLIENT_ID` as secret environment variables
5. Click **Apply** — Render builds and starts the bot

**Health check:** `GET /health` returns `{"status":"ok","uptime":<seconds>}`

**Keep alive (free tier):** Add a monitor at [uptimerobot.com](https://uptimerobot.com) pointing to `https://your-app.onrender.com/health` every 5 minutes to prevent the free service from sleeping.

### Build & start commands
```
Build:  npm install && npm run build
Start:  npm start
```

---

## Project structure

```
src/
├── commands/
│   ├── minecraft/     # /mcstatus
│   ├── moderation/    # ban, kick, timeout, warn, clear, lock, unlock, …
│   └── prefix/        # !ping, !help
├── lib/
│   ├── healthServer.ts   # HTTP health check endpoint
│   ├── joinRoles.ts      # Auto join-number role assignment
│   ├── logger.ts         # Structured logger
│   ├── prefixHandler.ts  # Prefix command dispatcher
│   ├── reactionRoles.ts  # Reaction role persistence
│   └── types.ts          # Shared Command interface
└── index.ts              # Bot entry point + event handlers
```
