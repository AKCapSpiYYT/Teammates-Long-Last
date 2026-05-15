import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { status, statusBedrock } from "minecraft-server-util";
import { Command } from "../../lib/types.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("mcstatus")
    .setDescription("Check the status of a Minecraft server")
    .addStringOption((option) =>
      option
        .setName("host")
        .setDescription("Server IP address or hostname (e.g. play.example.com)")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("port")
        .setDescription("Server port (default: 25565)")
        .setMinValue(1)
        .setMaxValue(65535)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("edition")
        .setDescription("Java or Bedrock edition (default: Java)")
        .setRequired(false)
        .addChoices(
          { name: "Java Edition", value: "java" },
          { name: "Bedrock Edition", value: "bedrock" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const host = interaction.options.getString("host", true).trim();
    const edition = interaction.options.getString("edition") ?? "java";
    const defaultPort = edition === "bedrock" ? 19132 : 25565;
    const port = interaction.options.getInteger("port") ?? defaultPort;

    await interaction.deferReply();

    try {
      if (edition === "bedrock") {
        const result = await statusBedrock(host, port, { timeout: 5000 });

        const embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("🟢 Server Online")
          .setDescription(`**${host}:${port}** (Bedrock)`)
          .addFields(
            { name: "Players", value: `${result.players.online}/${result.players.max}`, inline: true },
            { name: "Version", value: result.version.name, inline: true },
            { name: "MOTD", value: result.motd.clean || "None" }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } else {
        const result = await status(host, port, { timeout: 5000 });

        const motd = typeof result.motd === "object" && "clean" in result.motd
          ? (result.motd as { clean: string }).clean
          : String(result.motd ?? "None");

        const versionName = typeof result.version === "object" && result.version !== null && "name" in result.version
          ? (result.version as { name: string }).name
          : String(result.version ?? "Unknown");

        const playersOnline = result.players?.online ?? 0;
        const playersMax = result.players?.max ?? 0;

        const playerList = Array.isArray(result.players?.sample) && result.players!.sample!.length > 0
          ? result.players!.sample!.map((p: { name: string }) => `\`${p.name}\``).slice(0, 10).join(", ")
          : null;

        const embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("🟢 Server Online")
          .setDescription(`**${host}:${port}** (Java)`)
          .addFields(
            { name: "Players", value: `${playersOnline}/${playersMax}`, inline: true },
            { name: "Version", value: versionName, inline: true },
            { name: "Ping", value: `${result.roundTripLatency}ms`, inline: true },
            { name: "MOTD", value: motd || "None" },
            ...(playerList ? [{ name: "Online Players", value: playerList }] : [])
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }
    } catch {
      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle("🔴 Server Offline or Unreachable")
        .setDescription(`Could not connect to **${host}:${port}**`)
        .addFields({ name: "Edition", value: edition === "bedrock" ? "Bedrock" : "Java", inline: true })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
