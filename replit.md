# TeammatesLongLast Discord Bot

A Discord bot for the TeammatesLongLast Minecraft server community — moderation commands, live Minecraft server status, reaction roles, join number roles, polls, and announcements.

## Run & Operate

- `pnpm --filter @workspace/discord-bot run dev` — run the bot in watch mode (workflow: "Discord Bot")
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- discord.js v14
- minecraft-server-util (MC server ping)
- tsx for dev, tsc for production build
- Minimal HTTP server for Render health checks

## Where things live

- `artifacts/discord-bot/src/index.ts` — bot entry point, all event handlers
- `artifacts/discord-bot/src/commands/` — slash and prefix commands
- `artifacts/discord-bot/src/lib/` — shared utilities (logger, reaction roles, join roles, health server)
- `artifacts/discord-bot/src/deploy-commands.ts` — registers slash commands globally with Discord
- `render.yaml` — Render Blueprint config (repo root, consumed by Render on deploy)

## Architecture decisions

- **Health check HTTP server** — a tiny Node `http.createServer` binds to `PORT` so Render's web service type can health-check the bot and keep it alive 24/7.
- **File-based persistence for reaction roles** — `reaction-roles.json` is written locally; on Render this resets on redeploy. Should be migrated to a database if persistence across deploys is needed.
- **ESM throughout** — `"type": "module"` with `module: NodeNext` / `moduleResolution: NodeNext` for full native ESM.
- **No monorepo deps at runtime** — `artifacts/discord-bot/package.json` uses pinned versions (no `catalog:` refs) so it can be deployed standalone to Render.
- **Global slash command registration** — commands are registered globally (not per-guild) via `deploy-commands.ts`.

## Product

- 16 slash commands: ban, kick, unban, timeout, warn, clear, lock, unlock, slowmode, userinfo, announce, adminhelp, poll, reactionrole, joinnumber, mcstatus
- 2 prefix commands: `!ping`, `!help`
- Live MC status posts to channel `1504826233085628497` every 10 seconds, showing player count and avatar heads
- Auto join-number role assignment on member join
- Reaction roles: react to a message to gain/lose a role

## User preferences

- Minecraft server: `TeammatesLongLast.aternos.me:58338`
- MC status channel ID: `1504826233085628497`
- Bot deployed to Render as a Web Service using `render.yaml` at repo root

## Gotchas

- Run `npm run deploy-commands` (from `artifacts/discord-bot/`) once after first deploy to register slash commands with Discord.
- `reaction-roles.json` is in `.gitignore` — it is runtime state, not source code.
- Render's free tier sleeps after inactivity; use UptimeRobot to ping `/health` every 5 min.
- Do not run `pnpm dev` at workspace root — use the workflow or `--filter`.

## Pointers

- See `artifacts/discord-bot/README.md` for full feature list and deploy instructions
- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
