// commands/util/embed.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'embed',
  aliases: ['panel'],
  description: 'Create a custom multi-line embed with title and text',
  async execute(message, args) {
    // Only allow the specific user
    if (message.author.id !== '1482041529299112080') return;

    if (!args.length) {
      return message.reply('❌ You must provide a title and text, separated by a comma.');
    }

    const input = args.join(' ');

    // Split at the first comma
    const splitIndex = input.indexOf(',');
    if (splitIndex === -1) {
      return message.reply('❌ Please separate the title and text with a comma.');
    }

    const title = input.slice(0, splitIndex).trim();
    let description = input.slice(splitIndex + 1).trim();

    if (!title || !description) {
      return message.reply('❌ Both title and text must be provided.');
    }

    // Replace | with line breaks for multi-line panels
    description = description.split('|').map(line => line.trim()).join('\n');

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor('#8B5CF6') // Purple theme
      .setFooter({ text: 'Valix HUB :3' })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
};