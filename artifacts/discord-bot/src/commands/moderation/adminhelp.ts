import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { Command } from "../../lib/types.js";

const ADMIN_COMMANDS = [
  {
    name: "/ban",
    usage: "/ban user: @user [reason] [delete_days]",
    description: "Permanently ban a member. Optionally delete their recent messages (0–7 days).",
  },
  {
    name: "/unban",
    usage: "/unban user_id: 123456789 [reason]",
    description: "Unban a user by their ID. Find the ID in Server Settings → Bans.",
  },
  {
    name: "/kick",
    usage: "/kick user: @user [reason]",
    description: "Kick a member from the server. They can rejoin with an invite.",
  },
  {
    name: "/timeout",
    usage: "/timeout user: @user duration: 1h [reason]",
    description: "Temporarily mute a member (60s / 5m / 10m / 1h / 1d / 1 week).",
  },
  {
    name: "/warn add",
    usage: "/warn add user: @user reason: Breaking rules",
    description: "Issue a warning to a member. Warnings are stored per server.",
  },
  {
    name: "/warn list",
    usage: "/warn list user: @user",
    description: "View all warnings for a member.",
  },
  {
    name: "/warn clear",
    usage: "/warn clear user: @user",
    description: "Clear all warnings for a member.",
  },
  {
    name: "/clear",
    usage: "/clear amount: 50 [user: @user]",
    description: "Bulk delete up to 100 messages. Optionally filter by user. Messages older than 14 days cannot be deleted.",
  },
  {
    name: "/slowmode",
    usage: "/slowmode seconds: 10 [channel: #general]",
    description: "Set a slowmode delay on a channel. Use 0 to disable.",
  },
  {
    name: "/userinfo",
    usage: "/userinfo [user: @user]",
    description: "View account details, roles, join date, and more for any member.",
  },
  {
    name: "/mcstatus",
    usage: "/mcstatus host: play.example.com [port] [edition]",
    description: "Check the status of any Java or Bedrock Minecraft server.",
  },
];

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("adminhelp")
    .setDescription("View all admin and moderation commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("🛡️ Admin Command Reference")
      .setDescription("All moderation commands available to staff. Arguments in `[brackets]` are optional.")
      .setFooter({ text: `${ADMIN_COMMANDS.length} commands • Only visible to staff` })
      .setTimestamp();

    for (const cmd of ADMIN_COMMANDS) {
      embed.addFields({
        name: cmd.name,
        value: `\`\`\`${cmd.usage}\`\`\`${cmd.description}`,
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
