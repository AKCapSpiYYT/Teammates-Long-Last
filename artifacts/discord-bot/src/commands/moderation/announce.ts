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
    .setName("announce")
    .setDescription("Send a formatted announcement to a channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option.setName("message").setDescription("The announcement message").setRequired(true)
    )
    .addChannelOption((option) =>
      option.setName("channel").setDescription("Channel to send the announcement to (defaults to current)").setRequired(false)
    )
    .addStringOption((option) =>
      option.setName("title").setDescription("Title for the announcement embed").setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("ping")
        .setDescription("Who to ping with the announcement")
        .setRequired(false)
        .addChoices(
          { name: "@everyone", value: "everyone" },
          { name: "@here", value: "here" },
          { name: "No ping", value: "none" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("color")
        .setDescription("Embed color")
        .setRequired(false)
        .addChoices(
          { name: "Blue (default)", value: "blue" },
          { name: "Green", value: "green" },
          { name: "Red", value: "red" },
          { name: "Yellow", value: "yellow" },
          { name: "Purple", value: "purple" },
          { name: "Gold", value: "gold" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString("message", true);
    const target = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel | null;
    const title = interaction.options.getString("title") ?? "📢 Announcement";
    const ping = interaction.options.getString("ping") ?? "none";
    const colorChoice = interaction.options.getString("color") ?? "blue";

    if (!interaction.guild || !(target instanceof TextChannel)) {
      await interaction.reply({ content: "Target must be a text channel.", ephemeral: true });
      return;
    }

    const colorMap: Record<string, number> = {
      blue: 0x3498db,
      green: 0x2ecc71,
      red: 0xe74c3c,
      yellow: 0xf1c40f,
      purple: 0x9b59b6,
      gold: 0xf39c12,
    };

    const embed = new EmbedBuilder()
      .setColor(colorMap[colorChoice] ?? 0x3498db)
      .setTitle(title)
      .setDescription(message)
      .setFooter({ text: `Announced by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    const pingText = ping === "everyone" ? "@everyone" : ping === "here" ? "@here" : null;

    try {
      await target.send({
        content: pingText ?? undefined,
        embeds: [embed],
        allowedMentions: { parse: ping !== "none" ? ["everyone"] : [] },
      });

      await interaction.reply({
        content: `✅ Announcement sent to ${target}.`,
        ephemeral: true,
      });
    } catch {
      await interaction.reply({ content: "Failed to send the announcement. Check my permissions.", ephemeral: true });
    }
  },
};
