const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'mmlist',
  description: 'Shows a list of all middlemen with vouches and status',
  async execute(message, args) {

    // Use direct role ID instead of environment variable
    const CLAIM_ROLE_ID = '1465699111931215903';

    const mmVouchesPath = path.join(__dirname, '../../db/mmVouches.json');
    const mmStatusPath  = path.join(__dirname, '../../db/mmStatus.json');

    const vouchData  = fs.existsSync(mmVouchesPath) ? JSON.parse(fs.readFileSync(mmVouchesPath)) : {};
    const statusData = fs.existsSync(mmStatusPath)  ? JSON.parse(fs.readFileSync(mmStatusPath)) : {};

    // Filter members with the middleman role
    const members = message.guild.members.cache.filter(m => m.roles.cache.has(CLAIM_ROLE_ID));

    if (!members.size) return; // silently fail if no MMs

    const lines = members.map(m => {
      const vouches = vouchData[m.id] || 0;
      const active  = statusData[m.id] || 'Inactive';

      return `**• ${m.user.username}**\n> ✨ Vouches: ${vouches}\n> 🔹 Status: ${active}`;
    });

    const embed = new EmbedBuilder()
      .setTitle('🎯 Middleman Leaderboard')
      .setColor('#FFD700') // Yellow theme
      .setDescription(lines.join('\n\n'))
      .setFooter({ text: 'Eldorado.gg MM System • Security Bot' })
      .setTimestamp()
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setAuthor({ name: 'Trusted Middlemen', iconURL: message.guild.iconURL({ dynamic: true }) });

    await message.channel.send({ embeds: [embed] }).catch(() => {});
  }
};