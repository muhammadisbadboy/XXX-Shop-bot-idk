const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'mmlist',
  description: 'Shows a list of all middlemen with vouches, trust, and status',
  async execute(message, args) {

    // Use direct role ID instead of environment variable
    const CLAIM_ROLE_ID = '1465699111931215903';

    const mmVouchesPath = path.join(__dirname, '../../db/mmVouches.json');
    const mmStatusPath  = path.join(__dirname, '../../db/mmStatus.json');
    const mmTrustPath   = path.join(__dirname, '../../db/mmTrust.json');

    const vouchData  = fs.existsSync(mmVouchesPath) ? JSON.parse(fs.readFileSync(mmVouchesPath)) : {};
    const statusData = fs.existsSync(mmStatusPath)  ? JSON.parse(fs.readFileSync(mmStatusPath)) : {};
    const trustData  = fs.existsSync(mmTrustPath)   ? JSON.parse(fs.readFileSync(mmTrustPath)) : {};

    // Filter members with the middleman role
    const members = message.guild.members.cache.filter(m => m.roles.cache.has(CLAIM_ROLE_ID));

    if (!members.size) return; // silently fail if no MMs

    const lines = members.map(m => {
      const vouches = vouchData[m.id] || 0;
      const trust   = trustData[m.id] || 0;
      const active  = statusData[m.id] || 'Inactive';

      return `**• ${m.user.username}**\n> 🛡 Trust Score: ${trust}\n> ✨ Vouches: ${vouches}\n> 🔹 Status: ${active}`;
    });

    const embed = new EmbedBuilder()
      .setTitle('🎯 Middleman Leaderboard')
      .setColor('#00FFAA')
      .setDescription(lines.join('\n\n'))
      .setFooter({ text: 'Kai Kingdom MM System • Security Bot' })
      .setTimestamp()
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setAuthor({ name: 'Trusted Middlemen', iconURL: message.guild.iconURL({ dynamic: true }) });

    await message.channel.send({ embeds: [embed] }).catch(() => {});
  }
};