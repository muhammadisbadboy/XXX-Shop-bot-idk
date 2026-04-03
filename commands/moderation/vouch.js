const { PermissionsBitField } = require("discord.js");

const cooldown = new Map();

module.exports = {
  name: "vouch",
  description: "Send a vouch via webhook",

  async execute(message, args) {
    const channelId = process.env.SHOP_VOUCH_CHANNEL;
    if (!channelId) return message.reply("❌ Vouch channel not set.");

    const now = Date.now();
    const userId = message.author.id;

    // 5 min cooldown
    if (cooldown.has(userId)) {
      const expiration = cooldown.get(userId) + 5 * 60 * 1000;
      if (now < expiration) {
        const timeLeft = ((expiration - now) / 1000).toFixed(0);
        return message.reply(`⏳ Wait ${timeLeft}s before sending another vouch.`);
      }
    }
    cooldown.set(userId, now);
    setTimeout(() => cooldown.delete(userId), 5 * 60 * 1000);

    // Validate args
    if (args.length < 2) {
      return message.reply("❌ Usage: `.vouch +rep username message`");
    }

    const rep = args[0];
    const targetUser = args[1];
    const content = args.slice(2).join(" ");

    const channel = message.guild.channels.cache.get(channelId);
    if (!channel) return message.reply("❌ Vouch channel not found.");

    if (!channel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.ManageWebhooks)) {
      return message.reply("❌ I need Manage Webhooks permission in that channel.");
    }

    try {
      // Create webhook
      const webhook = await channel.createWebhook({
        name: message.author.username,
        avatar: message.author.displayAvatarURL(),
      });

      // Send vouch
      await webhook.send(`🌟 ${rep} ${targetUser}\n💬 ${content}\n— ${message.author.username}`);

      // Delete webhook
      await webhook.delete();

      message.reply("✅ Vouch sent!");
    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to send vouch.");
    }
  },
};