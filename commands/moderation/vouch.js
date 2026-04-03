const { PermissionsBitField } = require("discord.js");

const cooldown = new Map();

module.exports = {
  name: "vouch",
  description: "Send a vouch via webhook",

  async execute(message, args) {
    const channelId = process.env.SHOP_VOUCH_CHANNEL;
    if (!channelId) return message.reply("❌ Vouch channel not set. Fix it, bro.");

    const now = Date.now();
    const userId = message.author.id;

    // 5 min cooldown
    if (cooldown.has(userId)) {
      const expiration = cooldown.get(userId) + 5 * 60 * 1000;
      if (now < expiration) {
        const timeLeft = ((expiration - now) / 1000).toFixed(0);
        return message.reply(`⏳ Chill for ${timeLeft}s before spamming another vouch.`);
      }
    }
    cooldown.set(userId, now);
    setTimeout(() => cooldown.delete(userId), 5 * 60 * 1000);

    // Validate args
    if (args.length < 2) {
      return message.reply("❌ Usage: `.vouch +rep @user message` — don’t skip steps, bro.");
    }

    const mention = message.mentions.users.first();
    if (!mention) {
      return message.reply("❌ Bro, you tryna vouch? Tag a user or stfu.");
    }

    const rep = args[0];
    const content = args.slice(1).join(" ");

    const channel = message.guild.channels.cache.get(channelId);
    if (!channel) return message.reply("❌ Vouch channel missing. Fix your setup.");

    if (!channel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.ManageWebhooks)) {
      return message.reply("❌ I need MANAGE WEBHOOKS perms in that channel. Give it.");
    }

    try {
      // Create webhook
      const webhook = await channel.createWebhook({
        name: message.author.username,
        avatar: message.author.displayAvatarURL(),
      });

      // Send vouch text
      await webhook.send(`🌟 **VOUCH**\n${rep} ${mention}\n💬 ${content}\n— from ${message.author}`);

      // Delete webhook immediately
      await webhook.delete();

      message.reply("✅ Vouch sent. Don’t waste my time next one.");
    } catch (err) {
      console.error(err);
      message.reply("❌ Something broke. Tell the dev or deal with it.");
    }
  },
};