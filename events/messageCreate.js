const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
  name: Events.MessageCreate,

  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const prefixes = message.client.prefixes || ['.'];
    const prefix = prefixes.find(p => message.content.startsWith(p));
    if (!prefix) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    const command =
      message.client.commands.get(cmdName) ||
      message.client.commands.find(c => c.aliases?.includes(cmdName));

    if (!command) return;

    try {
      return await command.execute(message, args);
    } catch (err) {
      console.error('CMD ERROR:', err);
      return message.reply('⚠️ Error executing that command.');
    }
  }
};