import { Client, GatewayIntentBits, Collection, Events } from "discord.js";
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
if (!token) {
  logger.error("Missing DISCORD_BOT_TOKEN environment variable");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
}) as Client & { commands: Collection<string, Command> };

client.commands = new Collection<string, Command>();

const commands: Command[] = [ban, kick, timeout, warn, clear, userinfo, mcstatus];
for (const cmd of commands) {
  client.commands.set(cmd.data.name, cmd);
}

client.once(Events.ClientReady, (readyClient) => {
  logger.info(`Logged in as ${readyClient.user.tag}`);
  logger.info(`Serving ${readyClient.guilds.cache.size} guild(s)`);
  logger.info(`Commands loaded: ${client.commands.map((_, k) => k).join(", ")}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    logger.warn(`Unknown command received: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
    logger.info(`Command /${interaction.commandName} used by ${interaction.user.tag} in ${interaction.guild?.name ?? "DM"}`);
  } catch (error) {
    logger.error(`Error executing /${interaction.commandName}:`, error);
    const message = { content: "An error occurred while running this command.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(message).catch(() => null);
    } else {
      await interaction.reply(message).catch(() => null);
    }
  }
});

client.login(token);
