import { Client, GatewayIntentBits, Collection, Events, TextChannel } from "discord.js";
import { status as mcStatus } from "minecraft-server-util";
import { command as ban } from "./commands/moderation/ban.js";
import { command as kick } from "./commands/moderation/kick.js";
import { command as timeout } from "./commands/moderation/timeout.js";
import { command as warn } from "./commands/moderation/warn.js";
import { command as clear } from "./commands/moderation/clear.js";
import { command as userinfo } from "./commands/moderation/userinfo.js";
import { command as mcstatus } from "./commands/minecraft/mcstatus.js";
import { command as ping } from "./commands/prefix/ping.js";
import { command as help } from "./commands/prefix/help.js";
import { registerPrefixCommand, handlePrefixMessage } from "./lib/prefixHandler.js";
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

registerPrefixCommand(ping);
registerPrefixCommand(help);

const MC_HOST = "TeammatesLongLast.aternos.me";
const MC_PORT = 58338;
const STATUS_CHANNEL_ID = "1504826233085628497";

async function getLiveStatus(): Promise<string> {
  try {
    const res = await mcStatus(MC_HOST, MC_PORT, { timeout: 5000 });
    return `🟢 **Online** | ${res.players.online}/${res.players.max} players`;
  } catch {
    return "🔴 **Offline**";
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  logger.info(`Logged in as ${readyClient.user.tag}`);
  logger.info(`Serving ${readyClient.guilds.cache.size} guild(s)`);
  logger.info(`Commands loaded: ${client.commands.map((_, k) => k).join(", ")}`);

  const channel = readyClient.channels.cache.get(STATUS_CHANNEL_ID);
  if (!(channel instanceof TextChannel)) {
    logger.warn(`Status channel ${STATUS_CHANNEL_ID} not found or is not a text channel`);
    return;
  }

  const buildMessage = (statusText: string) =>
    `**Minecraft Server Status** — \`${MC_HOST}:${MC_PORT}\`\n${statusText}\n-# Last updated: <t:${Math.floor(Date.now() / 1000)}:R>`;

  const initialStatus = await getLiveStatus();
  const statusMessage = await channel.send({
    content: `@here\n\n${buildMessage(initialStatus)}`,
    allowedMentions: { parse: ["everyone"] },
  });
  logger.info(`Live MC status message posted in #${channel.name}`);

  setInterval(async () => {
    const statusText = await getLiveStatus();
    await statusMessage.edit(buildMessage(statusText))
      .catch((err) => logger.error("Failed to update status message:", err));
  }, 10000);
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

client.on(Events.MessageCreate, handlePrefixMessage);

client.login(token);
