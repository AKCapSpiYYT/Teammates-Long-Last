import { Message, Collection } from "discord.js";
import { logger } from "./logger.js";

export interface PrefixCommand {
  name: string;
  description: string;
  aliases?: string[];
  execute: (message: Message, args: string[]) => Promise<void> | void;
}

export const PREFIX = "!";

export const prefixCommands = new Collection<string, PrefixCommand>();

export function registerPrefixCommand(cmd: PrefixCommand) {
  prefixCommands.set(cmd.name, cmd);
  if (cmd.aliases) {
    for (const alias of cmd.aliases) {
      prefixCommands.set(alias, cmd);
    }
  }
}

export async function handlePrefixMessage(message: Message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const command = prefixCommands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args);
    logger.info(`Prefix command !${commandName} used by ${message.author.tag}`);
  } catch (error) {
    logger.error(`Error executing !${commandName}:`, error);
    message.reply("An error occurred while running that command.").catch(() => null);
  }
}
