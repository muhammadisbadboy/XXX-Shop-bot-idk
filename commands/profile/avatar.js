module.exports = {
  name: 'avatar',
  aliases: ['av'],

  async execute(message, args) {
    const target =
      message.mentions.users.first() ||
      (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null) ||
      message.author;

    if (!target) return message.reply('⚠️ Could not fetch avatar.');

    return message.channel.send({
      embeds: [
        {
          title: `${target.tag}'s Avatar`,
          image: {
            url: target.displayAvatarURL({ dynamic: true, size: 1024 })
          },
          color: 0x00ff00
        }
      ]
    });
  }
};