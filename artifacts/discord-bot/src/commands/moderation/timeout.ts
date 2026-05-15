import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { Command } from "../../lib/types.js";

const DURATION_CHOICES = [
  { name: "60 seconds", value: 60 },
  { name: "5 minutes", value: 300 },
  { name: "10 minutes", value: 600 },
  { name: "1 hour", value: 3600 },
  { name: "1 day", value: 86400 },
  { name: "1 week", value: 604800 },
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  if (seconds < 3600) return `${seconds / 60} minute${seconds / 60 !== 1 ? "s" : ""}`;
  if (seconds < 86400) return `${seconds / 3600} hour${seconds / 3600 !== 1 ? "s" : ""}`;
  if (seconds < 604800) return `${seconds / 86400} day${seconds / 86400 !== 1 ? "s" : ""}`;
  return `${seconds / 604800} week${seconds / 604800 !== 1 ? "s" : ""}`;
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout (mute) a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to timeout").setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription("How long to timeout the user")
        .setRequired(true)
        .addChoices(...DURATION_CHOICES)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for the timeout").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const durationSeconds = interaction.options.getInteger("duration", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    if (!interaction.guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    if (target.id === interaction.user.id) {
      await interaction.reply({ content: "You cannot timeout yourself.", ephemeral: true });
      return;
    }

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      await interaction.reply({ content: "That user is not in this server.", ephemeral: true });
      return;
    }

    if (!member.moderatable) {
      await interaction.reply({ content: "I don't have permission to timeout this user.", ephemeral: true });
      return;
    }

    const executorMember = await interaction.guild.members.fetch(interaction.user.id);
    if (member.roles.highest.position >= executorMember.roles.highest.position) {
      await interaction.reply({ content: "You cannot timeout someone with an equal or higher role.", ephemeral: true });
      return;
    }

    try {
      await member.timeout(durationSeconds * 1000, `${reason} — by ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle("⏱️ Member Timed Out")
        .addFields(
          { name: "User", value: `${target.tag} (${target.id})`, inline: true },
          { name: "Moderator", value: interaction.user.tag, inline: true },
          { name: "Duration", value: formatDuration(durationSeconds), inline: true },
          { name: "Reason", value: reason }
        )
        .setThumbnail(target.displayAvatarURL())
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: "Failed to timeout the user. Check my permissions.", ephemeral: true });
    }
  },
};
