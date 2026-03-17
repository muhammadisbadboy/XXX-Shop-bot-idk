module.exports = {
  name: 'whois',
  aliases: ['w'],

  async execute(message, args) {
    const target =
      message.mentions.users.first() ||
      (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null) ||
      message.author;

    if (!target) return message.reply('⚠️ Could not fetch user info.');

    const member = await message.guild.members.fetch(target.id).catch(() => null);

    return message.channel.send({
      embeds: [
        {
          title: target.tag,
          thumbnail: { url: target.displayAvatarURL({ dynamic: true }) },
          fields: [
            { name: 'ID', value: target.id, inline: true },
            { name: 'Bot', value: target.bot ? 'Yes' : 'No', inline: true },
            {
              name: 'Created',
              value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
              inline: true
            },
            {
              name: 'Joined',
              value: member
                ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
                : 'Unknown',
              inline: true
            }
          ],
          color: 0x3498db
        }
      ]
    });
  }
};