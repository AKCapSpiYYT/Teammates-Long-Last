import { Client, GatewayIntentBits, Collection, Events, TextChannel, EmbedBuilder } from "discord.js";
import { status as mcStatus } from "minecraft-server-util";
import { command as ban } from "./commands/moderation/ban.js";
import { command as kick } from "./commands/moderation/kick.js";
import { command as timeout } from "./commands/moderation/timeout.js";
import { command as warn } from "./commands/moderation/warn.js";
import { command as clear } from "./commands/moderation/clear.js";
import { command as userinfo } from "./commands/moderation/userinfo.js";
import { command as mcstatus } from "./commands/minecraft/mcstatus.js";
import { command as unban } from "./commands/moderation/unban.js";
import { command as slowmode } from "./commands/moderation/slowmode.js";
import { command as adminhelp } from "./commands/moderation/adminhelp.js";
import { command as lock } from "./commands/moderation/lock.js";
import { command as unlock } from "./commands/moderation/unlock.js";
import { command as announce } from "./commands/moderation/announce.js";
import { command as joinnumber } from "./commands/moderation/joinnumber.js";
import { command as reactionrole } from "./commands/moderation/reactionrole.js";
import { assignJoinRole, getNextJoinNumber } from "./lib/joinRoles.js";
import { getEntry } from "./lib/reactionRoles.js";
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
    GatewayIntentBits.GuildMessageReactions,
  ],
}) as Client & { commands: Collection<string, Command> };

client.commands = new Collection<string, Command>();

const commands: Command[] = [ban, kick, timeout, warn, clear, userinfo, mcstatus, unban, slowmode, adminhelp, lock, unlock, announce, joinnumber, reactionrole];
for (const cmd of commands) {
  client.commands.set(cmd.data.name, cmd);
}

registerPrefixCommand(ping);
registerPrefixCommand(help);

const MC_HOST = "TeammatesLongLast.aternos.me";
const MC_PORT = 58338;
const STATUS_CHANNEL_ID = "1504826233085628497";

interface StatusResult {
  online: boolean;
  playerCount?: number;
  maxPlayers?: number;
  playerNames?: string[];
}

async function getLiveStatus(): Promise<StatusResult> {
  try {
    const res = await mcStatus(MC_HOST, MC_PORT, { timeout: 5000 });
    const playerNames = res.players?.sample?.map((p: { name: string }) => p.name) ?? [];
    return {
      online: true,
      playerCount: res.players?.online ?? 0,
      maxPlayers: res.players?.max ?? 0,
      playerNames,
    };
  } catch {
    return { online: false };
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

  const playerFaceUrl = (username: string) =>
    `https://mc-heads.net/avatar/${encodeURIComponent(username)}/64`;

  const buildEmbeds = (result: StatusResult): EmbedBuilder[] => {
    const timestamp = Math.floor(Date.now() / 1000);

    if (!result.online) {
      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle("🔴 Server Offline")
        .setDescription(`\`${MC_HOST}:${MC_PORT}\``)
        .setFooter({ text: `Last updated` })
        .setTimestamp();
      return [embed];
    }

    const hasPlayers = result.playerNames && result.playerNames.length > 0;
    const statusEmbed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🟢 Server Online")
      .setDescription(`\`${MC_HOST}:${MC_PORT}\``)
      .addFields({ name: "Players", value: `${result.playerCount}/${result.maxPlayers}`, inline: true })
      .setFooter({ text: "Last updated" })
      .setTimestamp();

    if (!hasPlayers && result.playerCount! > 0) {
      statusEmbed.addFields({ name: "👥 Online", value: "*(names hidden by server)*", inline: true });
      return [statusEmbed];
    }

    if (!hasPlayers) return [statusEmbed];

    const playerEmbeds = result.playerNames!.slice(0, 9).map((name) =>
      new EmbedBuilder()
        .setColor(0x57f287)
        .setAuthor({ name, iconURL: playerFaceUrl(name) })
        .setThumbnail(playerFaceUrl(name))
    );

    return [statusEmbed, ...playerEmbeds];
  };

  // Delete any leftover status messages from a previous bot session
  const recent = await channel.messages.fetch({ limit: 20 }).catch(() => null);
  if (recent) {
    const old = recent.filter((m) => m.author.id === readyClient.user.id);
    for (const msg of old.values()) {
      await msg.delete().catch(() => null);
    }
    if (old.size > 0) logger.info(`Cleaned up ${old.size} old status message(s)`);
  }

  const initial = await getLiveStatus();
  let wasOnline = initial.online;

  let statusMessage = await channel.send({
    content: `@here`,
    embeds: buildEmbeds(initial),
    allowedMentions: { parse: ["everyone"] },
  });
  logger.info(`Live MC status message posted in #${channel.name}`);

  setInterval(async () => {
    const result = await getLiveStatus();

    if (result.online && !wasOnline) {
      logger.info("MC server came back online — sending alert");
      await channel.send({
        content: `@here\n\n🟢 **The Minecraft server is back online!**\n\`${MC_HOST}:${MC_PORT}\``,
        allowedMentions: { parse: ["everyone"] },
      }).catch((err) => logger.error("Failed to send back-online alert:", err));
    }

    wasOnline = result.online;

    await statusMessage.delete().catch((err) => logger.error("Failed to delete old status message:", err));
    statusMessage = await channel.send({ embeds: buildEmbeds(result) })
      .catch((err) => { logger.error("Failed to send new status message:", err); return statusMessage; });
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

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch().catch(() => null);

  const entry = getEntry(reaction.message.id);
  if (!entry) return;

  const emoji = reaction.emoji.id
    ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
    : (reaction.emoji.name ?? "");

  const pair = entry.pairs.find((p) => p.emoji === emoji || p.emoji === reaction.emoji.name);
  if (!pair) return;

  const guild = reaction.message.guild;
  const member = await guild?.members.fetch(user.id).catch(() => null);
  if (!member) return;

  await member.roles.add(pair.roleId).catch((err) =>
    logger.error(`Failed to add reaction role to ${user.tag}:`, err)
  );
  logger.info(`Gave role ${pair.roleId} to ${user.tag} via reaction`);
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch().catch(() => null);

  const entry = getEntry(reaction.message.id);
  if (!entry) return;

  const emoji = reaction.emoji.id
    ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
    : (reaction.emoji.name ?? "");

  const pair = entry.pairs.find((p) => p.emoji === emoji || p.emoji === reaction.emoji.name);
  if (!pair) return;

  const guild = reaction.message.guild;
  const member = await guild?.members.fetch(user.id).catch(() => null);
  if (!member) return;

  await member.roles.remove(pair.roleId).catch((err) =>
    logger.error(`Failed to remove reaction role from ${user.tag}:`, err)
  );
  logger.info(`Removed role ${pair.roleId} from ${user.tag} via reaction`);
});

client.on(Events.GuildMemberAdd, async (member) => {
  if (member.user.bot) return;
  const number = await getNextJoinNumber(member.guild);
  await assignJoinRole(member.guild, member, number);
  logger.info(`Assigned Member #${number} to ${member.user.tag}`);
});

client.on(Events.MessageCreate, handlePrefixMessage);

client.login(token);
