const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'claim',
  description: 'Claim the ticket',
  async execute(message) {
    const userId = message.author.id;
    const CLAIM_ID = process.env.CLAIM_ID;
    const OWNER_ID = process.env.OWNER_ID;

    if (![OWNER_ID, CLAIM_ID].includes(userId)) {
      return message.channel.send('❌ You are not authorized to claim this ticket.');
    }

    const ticketChannel = message.channel;
    if (!ticketChannel.name.startsWith('ticket-')) {
      return message.channel.send('❌ This is not a ticket channel.');
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Ticket Claimed')
      .setColor('#32CD32')
      .setDescription(`<@${userId}> has claimed this ticket.`)
      .addFields(
        { name: 'Ticket Channel', value: ticketChannel.name, inline: true },
        { name: 'Claimer', value: `<@${userId}>`, inline: true },
        { name: 'Status', value: '🟢 Staff will now manage this ticket.', inline: false }
      )
      .setFooter({ text: 'Kai Kingdom MM Ticket System' })
      .setTimestamp();

    await ticketChannel.send({ embeds: [embed] }).catch(() => {});
  },
};