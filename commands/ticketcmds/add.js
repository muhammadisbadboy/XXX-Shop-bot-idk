const { EmbedBuilder } = require('discord.js');
const ticketManager = require('../../utils/ticketManager');

module.exports = {
  name: 'add',
  description: 'Add a user to the ticket by mention, username, or ID',
  async execute(message, args) {
    const userId = message.author.id;

    const OWNER_ID = '1112091588462649364';
    const CLAIM_ID = '1465699111931215903';

    if (
      userId !== OWNER_ID &&
      !message.member.roles.cache.has(CLAIM_ID)
    ) {
      return message.channel.send('❌ You are not authorized to use this command.');
    }

    const ticketChannel = message.channel;
    if (!ticketChannel.name.startsWith('ticket-')) {
      return message.channel.send('❌ This is not a ticket channel.');
    }

    if (!args[0]) return message.channel.send('❌ Please provide a user to add.');

    // Resolve user by mention / ID / username
    let member;
    const input = args.join(' ');
    const mentionMatch = input.match(/<@!?(\d+)>/);

    if (mentionMatch) {
      member = await message.guild.members.fetch(mentionMatch[1]).catch(() => null);
    } else if (!isNaN(input)) {
      member = await message.guild.members.fetch(input).catch(() => null);
    } else {
      member = message.guild.members.cache.find(
        m =>
          m.user.username.toLowerCase() === input.toLowerCase() ||
          (m.nickname && m.nickname.toLowerCase() === input.toLowerCase())
      );
    }

    if (!member) return message.channel.send('❌ User not found.');

    await ticketManager.addUser(ticketChannel, member);

    const embed = new EmbedBuilder()
      .setTitle('➕ User Added')
      .setColor('#00BFFF')
      .setDescription(`Successfully added <@${member.id}> to this ticket.`)
      .addFields(
        { name: 'Added By', value: `<@${userId}>`, inline: true },
        { name: 'Ticket Channel', value: ticketChannel.name, inline: true },
        { name: 'Member Tag', value: member.user.tag, inline: true },
        { name: 'Member ID', value: member.id, inline: true },
        { name: 'Status', value: '✅ User can now view and interact with this ticket.', inline: false }
      )
      .setFooter({ text: 'Kai Kingdom MM Ticket System' })
      .setTimestamp();

    await ticketChannel.send({ embeds: [embed] }).catch(() => {});
  },
};