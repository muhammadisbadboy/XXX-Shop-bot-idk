const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'av',
  description: 'Displays a user\'s avatar in a professional panel.',
  usage: '.av [@user|userID]',
  async execute(message, args) {
    try {
      // Fetch user from mention or ID, default to author
      let user;
      if (args[0]) {
        user = await message.guild.members.fetch(args[0]).catch(() => null);
        if (user) user = user.user;
      }
      if (!user) user = message.mentions.users.first() || message.author;

      const isBot = user.bot;

      const embed = new EmbedBuilder()
        .setColor('Random')
        .setTitle(`${user.tag} ${isBot ? '🤖' : ''}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
        .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          { name: '🆔 User ID', value: user.id, inline: true },
          { name: '👤 Username', value: user.username, inline: true },
          { name: '📛 Nickname', value: message.guild.members.cache.get(user.id)?.nickname || 'None', inline: true },
          { name: '🟢 Status', value: message.guild.members.cache.get(user.id)?.presence?.status || 'Offline', inline: true },
          { name: '🎉 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '💠 Badges', value: user.flags?.toArray().join(', ') || 'None', inline: true },
          ...(isBot ? [{ name: '🤖 Bot Info', value: 'This user is a bot account.' }] : [])
        )
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('Avatar Command Error:', err);
      message.channel.send('❌ Unable to fetch avatar. Make sure the ID or mention is valid.');
    }
  },
};