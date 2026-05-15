import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { Command } from "../../lib/types.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock a channel so members can send messages again")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to unlock (defaults to current channel)")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for unlocking the channel")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel | null;
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    if (!interaction.guild || !(target instanceof TextChannel)) {
      await interaction.reply({ content: "This command can only be used in a text channel.", ephemeral: true });
      return;
    }

    try {
      await target.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: null,
      }, { reason: `Unlocked by ${interaction.user.tag}: ${reason}` });

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("🔓 Channel Unlocked")
        .addFields(
          { name: "Channel", value: `${target}`, inline: true },
          { name: "Moderator", value: interaction.user.tag, inline: true },
          { name: "Reason", value: reason }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      await target.send({ embeds: [
        new EmbedBuilder()
          .setColor(0x2ecc71)
          .setDescription(`🔓 This channel has been unlocked.`)
      ]}).catch(() => null);
    } catch {
      await interaction.reply({ content: "Failed to unlock the channel. Check my permissions.", ephemeral: true });
    }
  },
};
