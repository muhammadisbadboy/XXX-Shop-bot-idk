module.exports = {
  name: 'avatar',
  aliases: ['av', 'pfp'],
  async execute(message, args) {
    try {
      const user = message.mentions.users.first() || message.author;
      await message.channel.send({
        embeds: [{
          title: `${user.tag}'s Avatar`,
          color: 'RANDOM',
          image: { url: user.displayAvatarURL({ dynamic: true, size: 4096 }) },
          footer: { text: `Requested by ${message.author.tag}`, icon_url: message.author.displayAvatarURL({ dynamic: true }) }
        }]
      });
    } catch {
      message.channel.send('⚠️ Could not fetch avatar. Make sure the user exists!');
    }
  }
};