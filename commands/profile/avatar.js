const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'avatar',
  aliases: ['av', 'pfp', 'icon'],
  description: 'Displays a user avatar with professional panel.',
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

      // Determine if server avatar differs from global avatar
      const mainAvatar = user.displayAvatarURL({ dynamic: true, size: 1024 });
      const serverAvatar = member?.avatar
        ? member.avatarURL({ dynamic: true, size: 1024 })
        : null;

      const avatarType = serverAvatar && serverAvatar !== mainAvatar ? 'Server Avatar' : 'Main Avatar';

      // Badges
      const flags = (await user.fetchFlags())?.toArray() || [];
      const badges = flags.length ? flags.join(', ') : 'None';

      const embed = new EmbedBuilder()
        .setColor('#5865F2') // Discord blurple as clean professional color
        .setAuthor({ name: `${user.tag} ${user.bot ? '🤖' : ''}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(mainAvatar)
        .setImage(serverAvatar || mainAvatar)
        .addFields(
          { name: '🆔 User ID', value: user.id, inline: true },
          { name: '📌 Avatar Type', value: avatarType, inline: true },
          { name: '💠 Badges', value: badges, inline: true }
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