import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  Guild,
  GuildMember,
} from "discord.js";
import { Command } from "../../lib/types.js";
import { assignJoinRole } from "../../lib/joinRoles.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("joinnumber")
    .setDescription("Manage join number roles")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Assign join number roles to all existing members (run once)")
    )
    .addSubcommand((sub) =>
      sub
        .setName("check")
        .setDescription("Check a member's join number")
        .addUserOption((o) => o.setName("user").setDescription("Member to check").setRequired(false))
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "setup") {
      await interaction.deferReply();

      const members = await interaction.guild.members.fetch();
      const sorted = [...members.values()]
        .filter((m) => !m.user.bot)
        .sort((a, b) => (a.joinedTimestamp ?? 0) - (b.joinedTimestamp ?? 0));

      let success = 0;
      let failed = 0;

      for (let i = 0; i < sorted.length; i++) {
        const result = await assignJoinRole(interaction.guild, sorted[i], i + 1);
        if (result) success++; else failed++;
      }

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("✅ Join Number Roles Assigned")
        .addFields(
          { name: "Assigned", value: `${success}`, inline: true },
          { name: "Failed", value: `${failed}`, inline: true },
          { name: "Total Members", value: `${sorted.length}`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else if (sub === "check") {
      const target = interaction.options.getUser("user") ?? interaction.user;
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);

      if (!member) {
        await interaction.reply({ content: "That user is not in this server.", ephemeral: true });
        return;
      }

      const numberRole = member.roles.cache.find((r) => /^Member #\d+$/.test(r.name));

      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle("🔢 Join Number")
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: "User", value: `${target.tag}`, inline: true },
          { name: "Join Number", value: numberRole ? numberRole.name : "Not assigned yet", inline: true },
          ...(member.joinedAt ? [{ name: "Joined", value: `<t:${Math.floor(member.joinedTimestamp! / 1000)}:F>` }] : [])
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};
