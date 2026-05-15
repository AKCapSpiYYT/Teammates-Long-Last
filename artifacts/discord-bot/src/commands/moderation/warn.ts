import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { Command } from "../../lib/types.js";

const warnings = new Map<string, { userId: string; reason: string; moderator: string; timestamp: Date }[]>();

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member or view warnings")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Warn a member")
        .addUserOption((o) => o.setName("user").setDescription("The user to warn").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason for the warning").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("List warnings for a member")
        .addUserOption((o) => o.setName("user").setDescription("The user to check").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("clear")
        .setDescription("Clear all warnings for a member")
        .addUserOption((o) => o.setName("user").setDescription("The user to clear").setRequired(true))
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser("user", true);
    const key = `${interaction.guild.id}:${target.id}`;

    if (sub === "add") {
      const reason = interaction.options.getString("reason", true);
      const list = warnings.get(key) ?? [];
      list.push({ userId: target.id, reason, moderator: interaction.user.tag, timestamp: new Date() });
      warnings.set(key, list);

      const embed = new EmbedBuilder()
        .setColor(0xf39c12)
        .setTitle("⚠️ Member Warned")
        .addFields(
          { name: "User", value: `${target.tag} (${target.id})`, inline: true },
          { name: "Moderator", value: interaction.user.tag, inline: true },
          { name: "Total Warnings", value: String(list.length), inline: true },
          { name: "Reason", value: reason }
        )
        .setThumbnail(target.displayAvatarURL())
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else if (sub === "list") {
      const list = warnings.get(key) ?? [];
      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle(`⚠️ Warnings for ${target.tag}`)
        .setThumbnail(target.displayAvatarURL())
        .setTimestamp();

      if (list.length === 0) {
        embed.setDescription("This user has no warnings.");
      } else {
        embed.setDescription(
          list
            .map((w, i) => `**${i + 1}.** ${w.reason}\n> By ${w.moderator} on <t:${Math.floor(w.timestamp.getTime() / 1000)}:d>`)
            .join("\n\n")
        );
      }

      await interaction.reply({ embeds: [embed] });
    } else if (sub === "clear") {
      warnings.delete(key);
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("✅ Warnings Cleared")
        .setDescription(`All warnings for ${target.tag} have been cleared.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};
