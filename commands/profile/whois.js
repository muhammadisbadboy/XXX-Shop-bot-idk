const { MessageEmbed } = require('discord.js');

// Simple cooldown tracker (can be replaced with DB later)
const cooldowns = new Map();

module.exports = {
  name: 'work',
  description: 'Work to earn money.',
  cooldown: 60 * 5, // 5 minutes in seconds
  minReward: 50,
  maxReward: 300,
  async execute(message, args, client, economy) {
    try {
      const userId = message.author.id;
      const now = Date.now();

      // Check cooldown
      if (cooldowns.has(userId)) {
        const expiration = cooldowns.get(userId) + this.cooldown * 1000;
        if (now < expiration) {
          const remaining = Math.ceil((expiration - now) / 1000);
          return message.reply(`⏳ You need to wait ${remaining}s before working again.`);
        }
      }

      // Fetch user balance from your economy system
      const balance = await economy.getUserBalance(userId);
      if (balance === null) return message.reply('❌ You don’t have an economy account yet.');

      // Generate random reward
      const reward = Math.floor(Math.random() * (this.maxReward - this.minReward + 1)) + this.minReward;

      // Update balance
      await economy.addUserBalance(userId, reward);

      // Set cooldown
      cooldowns.set(userId, now);

      const embed = new MessageEmbed()
        .setTitle('💼 Work Complete!')
        .setDescription(`You worked hard and earned **$${reward}**!`)
        .addField('Current Balance', `$${balance + reward}`, true)
        .setColor('GREEN')
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('Work Command Error:', err);
      message.reply('⚠️ Something went wrong while working.');
    }
  },
};