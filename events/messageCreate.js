const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const prefixes = Array.isArray(message.client.prefixes) ? message.client.prefixes : ['.'];
    const prefix = prefixes.find(p => message.content.startsWith(p));
    if (!prefix) return;

    // Maintenance mode
    if (message.client.isMaintenance && message.author.id !== process.env.OWNER_ID) {
      const maintenanceEmbed = new EmbedBuilder()
        .setTitle('⚠️ Bot Under Maintenance')
        .setColor('#e67e22')
        .setDescription(`The bot is currently under maintenance.\nPlease DM <@${process.env.OWNER_ID}> to report issues or get updates.`)
        .setFooter({ text: 'MMPANEL • Maintenance Mode' })
        .setTimestamp();

      return message.channel.send({ embeds: [maintenanceEmbed] }).catch(() => {});
    }

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command =
      message.client.commands.get(commandName) ||
      message.client.commands.find(cmd => Array.isArray(cmd.aliases) && cmd.aliases.includes(commandName));

    if (!command) return;

    try {
      await command.execute(message, args);
    } catch (err) {
      console.error(err);
      message.reply('⚠️ Error executing that command.');
    }
  }
};