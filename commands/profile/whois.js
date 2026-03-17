module.exports = {
  name: 'whois',
  aliases: ['w'],
  async execute(message, args) {
    try {
      const member = message.mentions.members.first() || await message.guild.members.fetch(message.author.id);
      const user = member.user;

      await message.channel.send({
        embeds: [{
          title: `User Info: ${user.tag}`,
          color: 'RANDOM',
          thumbnail: { url: user.displayAvatarURL({ dynamic: true, size: 4096 }) },
          fields: [
            { name: 'ID', value: user.id, inline: true },
            { name: 'Status', value: member.presence?.status || 'offline', inline: true },
            { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp/1000)}:R>`, inline: true },
            { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp/1000)}:R>`, inline: true },
            { name: 'Roles', value: member.roles.cache.filter(r => r.name!=='@everyone').map(r=>r.name).join(', ') || 'None' }
          ],
          footer: { text: `Requested by ${message.author.tag}`, icon_url: message.author.displayAvatarURL({ dynamic: true }) }
        }]
      });
    } catch (err) {
      console.error(err);
      message.channel.send('⚠️ Could not fetch user info. Make sure the user exists!');
    }
  }
};