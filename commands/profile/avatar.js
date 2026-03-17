const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'avatar',
  aliases: ['av', 'pfp', 'icon'],
  description: 'Shows a professional avatar panel for a user.',
  usage: '.av [@user|userID]',
  async execute(message, args) {
    try {
      // Fetch user by mention or ID
      let user;
      if (args[0]) {
        user = await message.guild.members.fetch(args[0]).catch(() => null);
        if (user) user = user.user;
      }
      if (!user) user = message.mentions.users.first() || message.author;

      const member = message.guild.members.cache.get(user.id);
      const isBot = user.bot;
      const presenceStatus = member?.presence?.status || 'offline';

      // Status color mapping
      const statusColor = {
        online: '#43B581',
        idle: '#FAA61A',
        dnd: '#F04747',
        offline: '#747F8D',
      };

      // Fetch flags (badges)
      const flags = (await user.fetchFlags())?.toArray() || [];

      const embed = new EmbedBuilder()
        .setColor(statusColor[presenceStatus] || 'Random')
        .setAuthor({ name: `${user.tag} ${isBot ? '🤖' : ''}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
        .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          { name: '🆔 ID', value: user.id, inline: true },
          { name: '👤 Username', value: user.username, inline: true },
          { name: '📛 Nickname', value: member?.nickname || 'None', inline: true },
          { name: '🟢 Status', value: presenceStatus, inline: true },
          { name: '💠 Badges', value: flags.length ? flags.join(', ') : 'None', inline: true },
          ...(isBot ? [{ name: '🤖 Bot Info', value: 'This is a bot account.' }] : [])
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