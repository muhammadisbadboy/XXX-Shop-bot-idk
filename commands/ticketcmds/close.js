const { EmbedBuilder } = require('discord.js');
const ticketManager = require('../../utils/ticketManager');

module.exports = {
  name: 'close',
  description: 'Close the ticket',
  async execute(message) {
    const userId = message.author.id;
    const CLAIM_ID = process.env.CLAIM_ID;
    const OWNER_ID = process.env.OWNER_ID;

    if (![OWNER_ID, CLAIM_ID].includes(userId)) {
      return message.channel.send('❌ You are not authorized to close this ticket.');
    }

    const ticketChannel = message.channel;
    if (!ticketChannel.name.startsWith('ticket-')) {
      return message.channel.send('❌ This is not a ticket channel.');
    }

    const closingEmbed = new EmbedBuilder()
      .setTitle('🛑 Closing Ticket...')
      .setColor('#FF0000')
      .setDescription('Please wait while the ticket is being closed and transcript generated.')
      .addFields({ name: 'Action By', value: `<@${userId}>`, inline: true });

    const msg = await ticketChannel.send({ embeds: [closingEmbed] }).catch(() => null);

    // Animate progress
    if (msg) {
      for (let i = 10; i <= 100; i += 10) {
        await new Promise(res => setTimeout(res, 300));
        closingEmbed.data.fields[0].value = `<@${userId}> | Progress: ${i}%`;
        await msg.edit({ embeds: [closingEmbed] }).catch(() => {});
      }
    }

    // Remove all users and delete ticket
    await ticketManager.closeTicket(ticketChannel).catch(() => {});

    const finalEmbed = new EmbedBuilder()
      .setTitle('✅ Ticket Closed')
      .setColor('#00FF00')
      .setDescription(`Ticket ${ticketChannel.name} has been closed successfully.`)
      .addFields(
        { name: 'Closed By', value: `<@${userId}>`, inline: true },
        { name: 'Channel Name', value: ticketChannel.name, inline: true },
        { name: 'Status', value: 'Ticket archive generated. Ticket deleted.', inline: false }
      )
      .setFooter({ text: 'Kai Kingdom MM Ticket System' })
      .setTimestamp();

    await ticketChannel.send({ embeds: [finalEmbed] }).catch(() => {});
    await ticketChannel.delete().catch(() => {});
  },
};