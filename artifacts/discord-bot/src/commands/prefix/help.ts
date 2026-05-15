import { EmbedBuilder } from "discord.js";
import { PrefixCommand, prefixCommands, PREFIX } from "../../lib/prefixHandler.js";

export const command: PrefixCommand = {
  name: "help",
  description: "Lists all available prefix commands",
  aliases: ["h", "commands"],
  async execute(message, args) {
    const unique = new Map<string, PrefixCommand>();
    for (const cmd of prefixCommands.values()) {
      if (!unique.has(cmd.name)) unique.set(cmd.name, cmd);
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("📖 Prefix Commands")
      .setDescription(`Use \`${PREFIX}<command>\` to run a command.`)
      .addFields(
        [...unique.values()].map((cmd) => ({
          name: `${PREFIX}${cmd.name}${cmd.aliases ? ` (${cmd.aliases.map((a) => `${PREFIX}${a}`).join(", ")})` : ""}`,
          value: cmd.description,
        }))
      )
      .setFooter({ text: `${unique.size} command${unique.size !== 1 ? "s" : ""} available` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
