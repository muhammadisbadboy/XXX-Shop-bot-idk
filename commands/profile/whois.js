const { EmbedBuilder, userFlags } = require('discord.js');

module.exports = {
  name: 'whois',
  description: 'Shows a professional Dyno-style user profile panel.',
  usage: '.whois [@user|userID]',
  async execute(message, args) {
    try {
      // Fetch member by mention or ID
      let member;
      if (args[0]) {
        member = await message.guild.members.fetch(args[0]).catch(() => null);
      }
      if (!member) member = message.mentions.members.first() || message.member;

      const user = member.user;
      const isBot = user.bot;

      // Fetch flags (badges)
      const flags = (await user.fetchFlags())?.toArray() || [];

      // Status with emoji
      const statusMap = {
        online: '🟢 Online',
        idle: '🌙 Idle',
        dnd: '⛔ Do Not Disturb',
        offline: '⚫ Offline',
      };
      const status = member.presence?.status ? statusMap[member.presence.status] : '⚫ Offline';

      // Roles excluding @everyone
      const roles = member.roles.cache.filter(r => r.id !== message.guild.id).map(r => r.toString()).join(', ') || 'None';

      const embed = new EmbedBuilder()
        .setColor('Random')
        .setAuthor({ name: `${user.tag} ${isBot ? '🤖' : ''}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
        .addFields(
          { name: '🆔 User ID', value: user.id, inline: true },
          { name: '👤 Username', value: user.username, inline: true },
          { name: '📛 Nickname', value: member.nickname || 'None', inline: true },
          { name: '🟢 Status', value: status, inline: true },
          { name: '🎉 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
          { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '💠 Badges', value: flags.length ? flags.join(', ') : 'None', inline: true },
          { name: '👥 Roles', value: roles, inline: false },
          ...(isBot ? [{ name: '🤖 Bot Info', value: 'This user is a bot account with no further personal info.' }] : [])
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