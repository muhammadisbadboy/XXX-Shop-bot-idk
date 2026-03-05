// commands/moderation/fakeboost.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'fakeboost',
  description: 'Simulates a boost for testing the panel (OWNER only)',
  async execute(message, args) {
    try {
      const OWNER_ID = 'YOUR_OWNER_ID_HERE'; // Replace with your actual owner ID

      // ✅ Only owner can use
      if (message.author.id !== OWNER_ID) {
        return message.reply('❌ You are not authorized to use this command.');
      }

      const guild = message.guild;

      // 1️⃣ Pick a random member (excluding bots)
      const members = guild.members.cache.filter(m => !m.user.bot);
      if (!members.size) return message.reply('❌ No valid members found in this server.');
      const randomMember = members.random();

      // 2️⃣ Fixed boost channel
      const channelId = '1479043884301553664';
      const channel = await guild.channels.fetch(channelId).catch(() => null);
      if (!channel) return message.reply('❌ Boost channel not found.');

      // 3️⃣ Randomized boost message
      const messages = [
        `🚀 ${randomMember} just boosted the server! We appreciate your support.`,
        `💎 ${randomMember} has enhanced our realm with a boost — thank you!`,
        `✨ Server power increased! ${randomMember} contributed a boost. Stay legendary.`,
        `⚡ ${randomMember} is now officially powering up the MM server!`,
        `🔥 ${randomMember}, your boost has been recognized. Welcome to the elite circle!`
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];

      // 4️⃣ Embed styling
      const embed = new EmbedBuilder()
        .setTitle('🚀 Server Boost Alert! [TEST]')
        .setDescription(randomMsg)
        .setColor('#FFD700')
        .setImage('https://cdn.discordapp.com/attachments/1465701908780945521/1479046250501378118/IMG-20260305-WA0004.jpg?ex=69aa9ca9&is=69a94b29&hm=aee4780f2bbd23c9c7fac73d694d3757a274e6b760884dedb676f2b32e9812df&')
        .addFields(
          { name: 'Booster', value: `${randomMember}`, inline: true },
          { name: 'Server', value: guild.name, inline: true },
          { name: 'Total Boosts', value: `${guild.premiumSubscriptionCount}`, inline: true }
        )
        .setFooter({ text: 'Test boost — Kai Kingdom MM Server' })
        .setTimestamp();

      // 5️⃣ Send embed
      await channel.send({ embeds: [embed] });
      message.reply('✅ Fake boost sent successfully.');
    } catch (err) {
      console.error('Error in fakeboost command:', err);
      message.reply('❌ Failed to send fake boost.');
    }
  }
};