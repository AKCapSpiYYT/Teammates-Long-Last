import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { Command } from "../../lib/types.js";

const NUMBER_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Create a poll for members to vote on")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) =>
      o.setName("question").setDescription("The poll question").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("option1").setDescription("Option 1").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("option2").setDescription("Option 2").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("option3").setDescription("Option 3 (optional)").setRequired(false)
    )
    .addStringOption((o) =>
      o.setName("option4").setDescription("Option 4 (optional)").setRequired(false)
    )
    .addStringOption((o) =>
      o.setName("option5").setDescription("Option 5 (optional)").setRequired(false)
    )
    .addChannelOption((o) =>
      o.setName("channel").setDescription("Channel to post the poll in (defaults to current)").setRequired(false)
    )
    .addStringOption((o) =>
      o
        .setName("ping")
        .setDescription("Who to ping with the poll")
        .setRequired(false)
        .addChoices(
          { name: "@everyone", value: "everyone" },
          { name: "@here", value: "here" },
          { name: "No ping", value: "none" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const question = interaction.options.getString("question", true);
    const target = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel | null;
    const ping = interaction.options.getString("ping") ?? "none";

    const options: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const val = interaction.options.getString(`option${i}`);
      if (val) options.push(val);
    }

    if (!(target instanceof TextChannel)) {
      await interaction.reply({ content: "Please select a text channel.", ephemeral: true });
      return;
    }

    const optionLines = options
      .map((opt, i) => `${NUMBER_EMOJIS[i]} ${opt}`)
      .join("\n");

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 ${question}`)
      .setDescription(optionLines)
      .setFooter({
        text: `Poll by ${interaction.user.tag} • React to vote`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    const pingText = ping === "everyone" ? "@everyone" : ping === "here" ? "@here" : undefined;

    const msg = await target.send({
      content: pingText,
      embeds: [embed],
      allowedMentions: { parse: ping !== "none" ? ["everyone"] : [] },
    });

    for (let i = 0; i < options.length; i++) {
      await msg.react(NUMBER_EMOJIS[i]);
    }

    await interaction.reply({ content: `✅ Poll posted in ${target}.`, ephemeral: true });
  },
};
