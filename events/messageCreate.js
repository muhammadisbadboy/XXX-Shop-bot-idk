const { Events } = require('discord.js');

module.exports = {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (!message.guild || message.author.bot) return;

    const prefixes = client.prefixes || ['.'];
    const prefixUsed = prefixes.find(p => message.content.startsWith(p));
    if (!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
      await command.execute(message, args, client);
    } catch (err) {
      console.error(`Error running command ${commandName}:`, err);
      message.reply('❌ Error executing that command.');
    }
  }
};