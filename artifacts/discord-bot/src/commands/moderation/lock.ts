import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  TextChannel,
  PermissionOverwrites,
} from "discord.js";
import { Command } from "../../lib/types.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock a channel so members cannot send messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to lock (defaults to current channel)")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for locking the channel")
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
        SendMessages: false,
      }, { reason: `Locked by ${interaction.user.tag}: ${reason}` });

      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle("🔒 Channel Locked")
        .addFields(
          { name: "Channel", value: `${target}`, inline: true },
          { name: "Moderator", value: interaction.user.tag, inline: true },
          { name: "Reason", value: reason }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      await target.send({ embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setDescription(`🔒 This channel has been locked by a moderator.`)
      ]}).catch(() => null);
    } catch {
      await interaction.reply({ content: "Failed to lock the channel. Check my permissions.", ephemeral: true });
    }
  },
};
