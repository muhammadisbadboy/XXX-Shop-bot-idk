const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'mmlist',
  description: 'Shows a list of all middlemen with their vouches and highest role',
  async execute(message, args) {

    const CLAIM_ROLE_ID = '1465699111931215903'; // Middleman role

    const mmVouchesPath = path.join(__dirname, '../../db/mmVouches.json');
    const vouchData  = fs.existsSync(mmVouchesPath) ? JSON.parse(fs.readFileSync(mmVouchesPath)) : {};

    // Get all members with the middleman role
    const members = message.guild.members.cache.filter(m => m.roles.cache.has(CLAIM_ROLE_ID));

    if (!members.size) {
      return message.channel.send('⚠️ No middlemen found in the server.');
    }

    // Sort members by number of vouches descending
    const sortedMembers = members.sort((a, b) => (vouchData[b.id] || 0) - (vouchData[a.id] || 0));

    // Map member info
    const lines = sortedMembers.map(m => {
      const vouches = vouchData[m.id] || 0;
      const highestRole = m.roles.highest.name !== '@everyone' ? m.roles.highest.name : 'No special role';
      return `**• ${m.displayName}** [${highestRole}]\n> ✨ Vouches: **${vouches}**`;
    });

    const embed = new EmbedBuilder()
      .setTitle('🎯 Eldorado.gg Trusted Middlemen')
      .setColor('#FFD700') // Yellow theme
      .setDescription(lines.join('\n\n'))
      .setFooter({ text: 'Eldorado.gg MM System • Security Bot' })
      .setTimestamp()
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setAuthor({ name: 'Middlemen List', iconURL: message.guild.iconURL({ dynamic: true }) });

    await message.channel.send({ embeds: [embed] }).catch(() => {});
  }
};