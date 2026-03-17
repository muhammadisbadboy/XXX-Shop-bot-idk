const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'whois',
  aliases: ['profile', 'userinfo', 'ui'],
  description: 'Displays a professional Dyno-style profile panel.',
  usage: '.whois [@user|userID]',
  async execute(message, args) {
    try {
      let member;
      if (args[0]) {
        member = await message.guild.members.fetch(args[0]).catch(() => null);
      }
      if (!member) member = message.mentions.members.first() || message.member;

      const user = member.user;
      const isBot = user.bot;

      // Status mapping
      const statusMap = {
        online: '🟢 Online',
        idle: '🌙 Idle',
        dnd: '⛔ DND',
        offline: '⚫ Offline',
      };
      const presenceStatus = member.presence?.status || 'offline';
      const statusEmoji = statusMap[presenceStatus];

      // Embed color: use highest role color or default
      const embedColor = member.roles.highest?.color || 0x5865F2;

      // Roles (exclude @everyone)
      const roles = member.roles.cache.filter(r => r.id !== message.guild.id).map(r => r.toString()).join(', ') || 'None';

      // Badges / flags
      const flags = (await user.fetchFlags())?.toArray() || [];
      const badges = flags.length ? flags.join(', ') : 'None';

      // Nitro icon if boosted (placeholder if premium)
      const nitro = user.premiumSince ? '💎 Nitro Boosted' : '';

      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setAuthor({ name: `${user.tag} ${isBot ? '🤖' : ''}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
        .addFields(
          { name: '🆔 User ID', value: user.id, inline: true },
          { name: '👤 Username', value: user.username, inline: true },
          { name: '📛 Nickname', value: member.nickname || 'None', inline: true },
          { name: '🟢 Status', value: statusEmoji, inline: true },
          { name: '🎉 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
          { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '💠 Badges', value: badges, inline: true },
          { name: '💎 Nitro', value: nitro || 'None', inline: true },
          { name: '👥 Roles', value: roles, inline: false },
          ...(isBot ? [{ name: '🤖 Bot Info', value: 'This user is a bot account.' }] : [])
        )
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('WhoIs Command Error:', err);
      message.channel.send('❌ Unable to fetch user info. Make sure the ID or mention is valid.');
    }
  },
};