import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { Command } from "../../lib/types.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to kick").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for the kick").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    if (!interaction.guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    if (target.id === interaction.user.id) {
      await interaction.reply({ content: "You cannot kick yourself.", ephemeral: true });
      return;
    }

    if (target.id === interaction.client.user.id) {
      await interaction.reply({ content: "I cannot kick myself.", ephemeral: true });
      return;
    }

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      await interaction.reply({ content: "That user is not in this server.", ephemeral: true });
      return;
    }

    if (!member.kickable) {
      await interaction.reply({ content: "I don't have permission to kick this user.", ephemeral: true });
      return;
    }

    const executorMember = await interaction.guild.members.fetch(interaction.user.id);
    if (member.roles.highest.position >= executorMember.roles.highest.position) {
      await interaction.reply({ content: "You cannot kick someone with an equal or higher role.", ephemeral: true });
      return;
    }

    try {
      await member.kick(`${reason} — by ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setColor(0xe67e22)
        .setTitle("👢 Member Kicked")
        .addFields(
          { name: "User", value: `${target.tag} (${target.id})`, inline: true },
          { name: "Moderator", value: interaction.user.tag, inline: true },
          { name: "Reason", value: reason }
        )
        .setThumbnail(target.displayAvatarURL())
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: "Failed to kick the user. Check my permissions.", ephemeral: true });
    }
  },
};
