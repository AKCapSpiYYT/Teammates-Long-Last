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
    .setName("clear")
    .setDescription("Delete a number of messages from a channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete (1–100)")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addUserOption((option) =>
      option.setName("user").setDescription("Only delete messages from this user").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger("amount", true);
    const filterUser = interaction.options.getUser("user");

    if (!interaction.guild || !(interaction.channel instanceof TextChannel)) {
      await interaction.reply({ content: "This command can only be used in a text channel.", ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      let toDelete = [...messages.values()];

      if (filterUser) {
        toDelete = toDelete.filter((m) => m.author.id === filterUser.id);
      }

      toDelete = toDelete.slice(0, amount);

      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      toDelete = toDelete.filter((m) => m.createdTimestamp > twoWeeksAgo);

      if (toDelete.length === 0) {
        await interaction.editReply("No messages found to delete (messages older than 14 days cannot be bulk-deleted).");
        return;
      }

      const deleted = await interaction.channel.bulkDelete(toDelete, true);

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("🗑️ Messages Cleared")
        .addFields(
          { name: "Deleted", value: `${deleted.size} message${deleted.size !== 1 ? "s" : ""}`, inline: true },
          { name: "Moderator", value: interaction.user.tag, inline: true },
          ...(filterUser ? [{ name: "Filtered User", value: filterUser.tag, inline: true }] : [])
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply("Failed to delete messages. Check my permissions.");
    }
  },
};
