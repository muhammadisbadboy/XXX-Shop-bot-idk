const { PermissionsBitField } = require("discord.js");

const cooldown = new Map();

module.exports = {
  name: "vouch",
  description: "Send a vouch via webhook",

  async execute(message, args) {
    const channelId = process.env.SHOP_VOUCH_CHANNEL;
    if (!channelId) return message.reply("❌ Vouch channel not configured. Contact an admin.");

    const now = Date.now();
    const userId = message.author.id;

    // 5 minute cooldown
    if (cooldown.has(userId)) {
      const expiration = cooldown.get(userId) + 5 * 60 * 1000;
      if (now < expiration) {
        const timeLeft = ((expiration - now) / 1000).toFixed(0);
        return message.reply(`⏳ Please wait ${timeLeft}s before sending another vouch.`);
      }
    }
    cooldown.set(userId, now);
    setTimeout(() => cooldown.delete(userId), 5 * 60 * 1000);

    // Validate args
    if (args.length < 2) {
      return message.reply("❌ Usage: `.vouch +rep username message` — make sure to include both the vouch type and username.");
    }

    const rep = args[0];                  // +rep / -rep
    const targetUser = args[1];           // plain text username
    const content = args.slice(2).join(" "); // message content

    const channel = message.guild.channels.cache.get(channelId);
    if (!channel) return message.reply("❌ Vouch channel not found. Check setup.");

    if (!channel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.ManageWebhooks)) {
      return message.reply("❌ I require **Manage Webhooks** permission in the vouch channel.");
    }

    try {
      // Create webhook
      const webhook = await channel.createWebhook({
        name: message.author.username,
        avatar: message.author.displayAvatarURL(),
      });

      // Send vouch
      await webhook.send(
        `🌟 **VOUCH RECEIVED** 🌟\n` +
        `📝 Type: ${rep}\n` +
        `👤 User: ${targetUser}\n` +
        `💬 Message: ${content}\n` +
        `✅ Submitted by: ${message.author.username}`
      );

      // Delete webhook
      await webhook.delete();

      message.reply("✅ Vouch successfully sent!");
    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to send vouch. Contact an admin.");
    }
  },
};