import { PrefixCommand } from "../../lib/prefixHandler.js";

export const command: PrefixCommand = {
  name: "ping",
  description: "Replies with pong and shows bot latency",
  aliases: ["p"],
  async execute(message) {
    const sent = await message.reply("Pinging...");
    const latency = sent.createdTimestamp - message.createdTimestamp;
    const wsLatency = message.client.ws.ping;
    await sent.edit(`pong 🏓 | Message: **${latency}ms** | WebSocket: **${wsLatency}ms**`);
  },
};
