module.exports = {
  name: 'avatar',
  aliases: ['av', 'w'],
  description: 'Shows a user avatar',
  async execute(message, args) {
    const target =
      message.mentions.users.first() ||
      (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : message.author);

    if (!target)
      return message.reply('⚠️ Could not fetch avatar. Make sure the user exists!');

    return message.channel.send({
      content: `${target.tag}'s avatar:`,
      embeds: [
        {
          image: { url: target.displayAvatarURL({ dynamic: true, size: 1024 }) },
          color: '#00FF00'
        }
      ]
    });
  }
};