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
    .setName("slowmode")
    .setDescription("Set or disable slowmode in a channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((option) =>
      option
        .setName("seconds")
        .setDescription("Slowmode delay in seconds (0 = disable, max 21600)")
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to set slowmode on (defaults to current channel)")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const seconds = interaction.options.getInteger("seconds", true);
    const target = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel | null;

    if (!interaction.guild || !(target instanceof TextChannel)) {
      await interaction.reply({ content: "This command can only be used in a text channel.", ephemeral: true });
      return;
    }

    try {
      await target.setRateLimitPerUser(seconds, `Slowmode set by ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setColor(seconds === 0 ? 0x2ecc71 : 0x3498db)
        .setTitle(seconds === 0 ? "✅ Slowmode Disabled" : "🐌 Slowmode Enabled")
        .addFields(
          { name: "Channel", value: `${target}`, inline: true },
          { name: "Delay", value: seconds === 0 ? "Off" : `${seconds}s`, inline: true },
          { name: "Set by", value: interaction.user.tag, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: "Failed to set slowmode. Check my permissions.", ephemeral: true });
    }
  },
};
