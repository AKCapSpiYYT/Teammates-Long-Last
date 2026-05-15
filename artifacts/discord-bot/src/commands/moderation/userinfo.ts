import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
} from "discord.js";
import { Command } from "../../lib/types.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Show information about a user")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to look up (defaults to yourself)").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user") ?? interaction.user;

    if (!interaction.guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    await interaction.deferReply();

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    const createdAt = Math.floor(target.createdTimestamp / 1000);
    const joinedAt = member?.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;

    const roles = member?.roles.cache
      .filter((r) => r.id !== interaction.guild!.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => r.toString())
      .slice(0, 10) ?? [];

    const embed = new EmbedBuilder()
      .setColor(member?.displayColor ?? 0x5865f2)
      .setTitle(`${target.tag}`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "User ID", value: target.id, inline: true },
        { name: "Bot", value: target.bot ? "Yes" : "No", inline: true },
        { name: "Account Created", value: `<t:${createdAt}:F> (<t:${createdAt}:R>)` },
        ...(joinedAt ? [{ name: "Joined Server", value: `<t:${joinedAt}:F> (<t:${joinedAt}:R>)` }] : []),
        ...(member?.nickname ? [{ name: "Nickname", value: member.nickname, inline: true }] : []),
        ...(roles.length > 0 ? [{ name: `Roles (${member!.roles.cache.size - 1})`, value: roles.join(" ") }] : [])
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    if (member instanceof GuildMember && member.premiumSince) {
      embed.addFields({ name: "Boosting Since", value: `<t:${Math.floor(member.premiumSinceTimestamp! / 1000)}:R>`, inline: true });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
