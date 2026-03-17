const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'av',
  description: 'Show a user’s avatar.',
  async execute(message, args, client) {
    try {
      let user;

      // Try mention
      if (message.mentions.users.size) {
        user = message.mentions.users.first();
      } 
      // Try ID
      else if (args[0]) {
        user = await client.users.fetch(args[0]).catch(() => null);
      } 
      // Default to message author
      else {
        user = message.author;
      }

      if (!user) {
        return message.reply('❌ Could not find that user.');
      }

      const avatarURL = user.displayAvatarURL({ dynamic: true, size: 1024 });

      const embed = new MessageEmbed()
        .setTitle(`${user.username}'s Avatar`)
        .setImage(avatarURL)
        .setColor('RANDOM')
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('Avatar Command Error:', err);
      message.reply('⚠️ Something went wrong fetching the avatar.');
    }
  },
};