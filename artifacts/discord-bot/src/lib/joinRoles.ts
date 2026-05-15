import { Guild, GuildMember } from "discord.js";
import { logger } from "./logger.js";

export async function getNextJoinNumber(guild: Guild): Promise<number> {
  const members = await guild.members.fetch();
  const nonBots = members.filter((m) => !m.user.bot);

  let max = 0;
  for (const member of nonBots.values()) {
    const role = member.roles.cache.find((r) => /^Member #\d+$/.test(r.name));
    if (role) {
      const num = parseInt(role.name.replace("Member #", ""), 10);
      if (num > max) max = num;
    }
  }
  return max + 1;
}

export async function assignJoinRole(
  guild: Guild,
  member: GuildMember,
  number: number
): Promise<boolean> {
  try {
    const roleName = `Member #${number}`;

    let role = guild.roles.cache.find((r) => r.name === roleName);
    if (!role) {
      role = await guild.roles.create({
        name: roleName,
        reason: "Auto-created join number role",
      });
    }

    const existing = member.roles.cache.find((r) => /^Member #\d+$/.test(r.name));
    if (existing) {
      await member.roles.remove(existing).catch(() => null);
    }

    await member.roles.add(role);
    return true;
  } catch (err) {
    logger.error(`Failed to assign join role to ${member.user.tag}:`, err);
    return false;
  }
}
