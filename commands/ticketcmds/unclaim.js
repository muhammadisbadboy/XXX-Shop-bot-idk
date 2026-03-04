const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'unclaim',
  description: 'Unclaim the ticket',
  async execute(message) {
    const userId = message.author.id;
    const CLAIM_ID = process.env.CLAIM_ID;
    const OWNER_ID = process.env.OWNER_ID;

    if (![OWNER_ID, CLAIM_ID].includes(userId)) {
      return message.channel.send('❌ You are not authorized to unclaim this ticket.');
    }

    const ticketChannel = message.channel;
    if (!ticketChannel.name.startsWith('ticket-')) {
      return message.channel.send('❌ This is not a ticket channel.');
    }

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Ticket Unclaimed')
      .setColor('#FFD700')
      .setDescription(`Ticket is now unclaimed by <@${userId}>.`)
      .addFields(
        { name: 'Ticket Channel', value: ticketChannel.name, inline: true },
        { name: 'Staff', value: `<@${userId}>`, inline: true },
        { name: 'Status', value: '🟡 The ticket is open for claim again.', inline: false }
      )
      .setFooter({ text: 'Kai Kingdom MM Ticket System' })
      .setTimestamp();

    await ticketChannel.send({ embeds: [embed] }).catch(() => {});
  },
};