module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const prefixes = ['.']; // you can add more like ['.', '?']
    const prefix = prefixes.find(p => message.content.startsWith(p));
    if (!prefix) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    // -----------------------
    // GET TARGET USER SAFELY
    // -----------------------
    let target =
      message.mentions.users.first() ||
      (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null) ||
      message.author;

    // -----------------------
    // AVATAR COMMAND
    // -----------------------
    if (cmd === 'av' || cmd === 'avatar') {
      if (!target) {
        return message.reply('⚠️ Could not fetch avatar.');
      }

      return message.channel.send({
        content: `${target.tag}'s avatar`,
        embeds: [
          {
            image: {
              url: target.displayAvatarURL({ dynamic: true, size: 1024 })
            },
            color: 0x00ff00
          }
        ]
      });
    }

    // -----------------------
    // WHOIS COMMAND
    // -----------------------
    if (cmd === 'w' || cmd === 'whois') {
      if (!target) {
        return message.reply('⚠️ Could not fetch user info.');
      }

      let member = null;
      try {
        member = await message.guild.members.fetch(target.id);
      } catch {}

      return message.channel.send({
        embeds: [
          {
            title: `${target.tag}`,
            thumbnail: {
              url: target.displayAvatarURL({ dynamic: true })
            },
            fields: [
              { name: 'ID', value: target.id, inline: true },
              { name: 'Bot', value: target.bot ? 'Yes' : 'No', inline: true },
              {
                name: 'Joined Server',
                value: member?.joinedAt
                  ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
                  : 'Unknown',
                inline: true
              },
              {
                name: 'Account Created',
                value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
                inline: true
              }
            ],
            color: 0x3498db
          }
        ]
      });
    }
  });
};