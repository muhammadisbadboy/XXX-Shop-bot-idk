const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'claim',
  description: 'Claim the ticket',
  async execute(message) {
    const userId = message.author.id;

    const OWNER_ID = '1112091588462649364';
    const CLAIM_ROLE_ID = '1465699111931215903';

    if (userId !== OWNER_ID && !message.member.roles.cache.has(CLAIM_ROLE_ID)) {
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