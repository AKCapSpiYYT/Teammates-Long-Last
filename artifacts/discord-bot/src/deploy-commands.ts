import { REST, Routes } from "discord.js";
import { command as ban } from "./commands/moderation/ban.js";
import { command as kick } from "./commands/moderation/kick.js";
import { command as timeout } from "./commands/moderation/timeout.js";
import { command as warn } from "./commands/moderation/warn.js";
import { command as clear } from "./commands/moderation/clear.js";
import { command as userinfo } from "./commands/moderation/userinfo.js";
import { command as mcstatus } from "./commands/minecraft/mcstatus.js";
import { logger } from "./lib/logger.js";
import type { Command } from "./lib/types.js";

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token || !clientId) {
  logger.error("Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID environment variables");
  process.exit(1);
}

const commands: Command[] = [ban, kick, timeout, warn, clear, userinfo, mcstatus];
const commandData = commands.map((c) => c.data.toJSON());

const rest = new REST().setToken(token);

logger.info(`Registering ${commandData.length} application commands globally...`);

try {
  await rest.put(Routes.applicationCommands(clientId), { body: commandData });
  logger.info("Successfully registered all application commands.");
  logger.info("Commands: " + commands.map((c) => `/${c.data.name}`).join(", "));
} catch (error) {
  logger.error("Failed to register commands:", error);
  process.exit(1);
}
