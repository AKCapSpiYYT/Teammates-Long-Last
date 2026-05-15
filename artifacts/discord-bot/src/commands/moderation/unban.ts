import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { Command } from "../../lib/types.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user from the server by their ID")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((option) =>
      option
        .setName("user_id")
        .setDescription("The ID of the user to unban")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the unban")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getString("user_id", true).trim();
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    if (!interaction.guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    if (!/^\d{17,20}$/.test(userId)) {
      await interaction.reply({ content: "That doesn't look like a valid user ID. IDs are 17–20 digit numbers.", ephemeral: true });
      return;
    }

    await interaction.deferReply();

    const bans = await interaction.guild.bans.fetch().catch(() => null);
    if (!bans) {
      await interaction.editReply("Failed to fetch the ban list. Check my permissions.");
      return;
    }

    const ban = bans.get(userId);
    if (!ban) {
      await interaction.editReply(`No ban found for user ID \`${userId}\`.`);
      return;
    }

    try {
      await interaction.guild.members.unban(userId, `${reason} — by ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("✅ Member Unbanned")
        .addFields(
          { name: "User", value: `${ban.user.tag} (${ban.user.id})`, inline: true },
          { name: "Moderator", value: interaction.user.tag, inline: true },
          { name: "Reason", value: reason },
          ...(ban.reason ? [{ name: "Original Ban Reason", value: ban.reason }] : [])
        )
        .setThumbnail(ban.user.displayAvatarURL())
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply("Failed to unban the user. Check my permissions.");
    }
  },
};
