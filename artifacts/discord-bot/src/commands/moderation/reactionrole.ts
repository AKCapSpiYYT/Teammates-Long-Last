import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { Command } from "../../lib/types.js";
import {
  addEntry,
  addPair,
  removePair,
  removeEntry,
  getEntry,
} from "../../lib/reactionRoles.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("reactionrole")
    .setDescription("Manage reaction roles")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Create a new reaction role message")
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Channel to post the message in").setRequired(true)
        )
        .addStringOption((o) =>
          o.setName("title").setDescription("Title of the reaction role embed").setRequired(true)
        )
        .addStringOption((o) =>
          o.setName("description").setDescription("Description shown in the embed").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add an emoji → role pair to a reaction role message")
        .addStringOption((o) =>
          o.setName("message_id").setDescription("ID of the reaction role message").setRequired(true)
        )
        .addStringOption((o) =>
          o.setName("emoji").setDescription("The emoji to react with").setRequired(true)
        )
        .addRoleOption((o) =>
          o.setName("role").setDescription("The role to assign").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove an emoji → role pair from a reaction role message")
        .addStringOption((o) =>
          o.setName("message_id").setDescription("ID of the reaction role message").setRequired(true)
        )
        .addStringOption((o) =>
          o.setName("emoji").setDescription("The emoji to remove").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete an entire reaction role message")
        .addStringOption((o) =>
          o.setName("message_id").setDescription("ID of the reaction role message to delete").setRequired(true)
        )
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "create") {
      const channel = interaction.options.getChannel("channel", true) as TextChannel;
      const title = interaction.options.getString("title", true);
      const description = interaction.options.getString("description", true);

      if (!(channel instanceof TextChannel)) {
        await interaction.reply({ content: "Please select a text channel.", ephemeral: true });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: "React below to get a role • Remove reaction to remove role" })
        .setTimestamp();

      const msg = await channel.send({ embeds: [embed] });

      addEntry({
        guildId: interaction.guild.id,
        channelId: channel.id,
        messageId: msg.id,
        pairs: [],
      });

      const confirmEmbed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("✅ Reaction Role Message Created")
        .setDescription(`Message posted in ${channel}.\nUse \`/reactionrole add message_id: ${msg.id}\` to add emoji → role pairs.`)
        .addFields({ name: "Message ID", value: `\`${msg.id}\`` })
        .setTimestamp();

      await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });

    } else if (sub === "add") {
      const messageId = interaction.options.getString("message_id", true).trim();
      const emoji = interaction.options.getString("emoji", true).trim();
      const role = interaction.options.getRole("role", true);

      const entry = getEntry(messageId);
      if (!entry) {
        await interaction.reply({ content: `No reaction role message found with ID \`${messageId}\`.`, ephemeral: true });
        return;
      }

      const channel = await interaction.guild.channels.fetch(entry.channelId).catch(() => null) as TextChannel | null;
      const msg = await channel?.messages.fetch(messageId).catch(() => null);
      if (!msg) {
        await interaction.reply({ content: "Could not find that message. It may have been deleted.", ephemeral: true });
        return;
      }

      const added = addPair(messageId, { emoji, roleId: role.id });
      if (!added) {
        await interaction.reply({ content: `That emoji is already assigned to a role on this message.`, ephemeral: true });
        return;
      }

      await msg.react(emoji).catch(() => null);

      const updatedEntry = getEntry(messageId)!;
      const pairList = updatedEntry.pairs.map((p) => `${p.emoji} → <@&${p.roleId}>`).join("\n");

      const updatedEmbed = EmbedBuilder.from(msg.embeds[0])
        .setFields()
        .setDescription(`${msg.embeds[0].description}\n\n${pairList}`);

      await msg.edit({ embeds: [updatedEmbed] });

      await interaction.reply({ content: `✅ Added ${emoji} → ${role} to the reaction role message.`, ephemeral: true });

    } else if (sub === "remove") {
      const messageId = interaction.options.getString("message_id", true).trim();
      const emoji = interaction.options.getString("emoji", true).trim();

      const entry = getEntry(messageId);
      if (!entry) {
        await interaction.reply({ content: `No reaction role message found with ID \`${messageId}\`.`, ephemeral: true });
        return;
      }

      const removed = removePair(messageId, emoji);
      if (!removed) {
        await interaction.reply({ content: `That emoji was not found on this message.`, ephemeral: true });
        return;
      }

      const channel = await interaction.guild.channels.fetch(entry.channelId).catch(() => null) as TextChannel | null;
      const msg = await channel?.messages.fetch(messageId).catch(() => null);
      if (msg) {
        const updatedEntry = getEntry(messageId)!;
        const pairList = updatedEntry.pairs.map((p) => `${p.emoji} → <@&${p.roleId}>`).join("\n");
        const baseDesc = msg.embeds[0]?.description?.split("\n\n")[0] ?? "";
        const updatedEmbed = EmbedBuilder.from(msg.embeds[0])
          .setDescription(pairList ? `${baseDesc}\n\n${pairList}` : baseDesc);
        await msg.edit({ embeds: [updatedEmbed] }).catch(() => null);
        await msg.reactions.cache.find((r) => r.emoji.name === emoji || r.emoji.toString() === emoji)?.remove().catch(() => null);
      }

      await interaction.reply({ content: `✅ Removed ${emoji} from the reaction role message.`, ephemeral: true });

    } else if (sub === "delete") {
      const messageId = interaction.options.getString("message_id", true).trim();

      const entry = getEntry(messageId);
      if (!entry) {
        await interaction.reply({ content: `No reaction role message found with ID \`${messageId}\`.`, ephemeral: true });
        return;
      }

      const channel = await interaction.guild.channels.fetch(entry.channelId).catch(() => null) as TextChannel | null;
      const msg = await channel?.messages.fetch(messageId).catch(() => null);
      await msg?.delete().catch(() => null);

      removeEntry(messageId);

      await interaction.reply({ content: "✅ Reaction role message deleted.", ephemeral: true });
    }
  },
};
