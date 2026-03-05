const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'status',
  description: 'Set a middleman as active or inactive (OWNER_ID only)',
  async execute(message, args) {

    const OWNER_ID = process.env.OWNER_ID;

    // Only OWNER_ID can use
    if (message.author.id !== OWNER_ID) return; // silently fail

    if (!args[0] || !args[1]) return; // require user + status

    const input = args[0];
    const statusInput = args[1].toLowerCase();
    if (!['active', 'inactive'].includes(statusInput)) return; // invalid status

    // Resolve member
    let member;
    const mention = input.match(/<@!?(\d+)>/);
    if (mention) member = await message.guild.members.fetch(mention[1]).catch(() => null);
    else if (!isNaN(input)) member = await message.guild.members.fetch(input).catch(() => null);
    else member = message.guild.members.cache.find(m =>
      m.user.username.toLowerCase() === input.toLowerCase() ||
      (m.nickname && m.nickname.toLowerCase() === input.toLowerCase())
    );

    if (!member) return; // silently fail

    // Load / save data
    const statusPath = path.join(__dirname, '../../db/mmStatus.json');
    const statusData = fs.existsSync(statusPath) ? JSON.parse(fs.readFileSync(statusPath)) : {};
    statusData[member.id] = statusInput.charAt(0).toUpperCase() + statusInput.slice(1);
    fs.writeFileSync(statusPath, JSON.stringify(statusData, null, 2));

    // Embed confirmation
    const embed = new EmbedBuilder()
      .setTitle(`⚡ MM Status Updated • ${member.user.tag}`)
      .setColor(statusInput === 'active' ? '#00FF00' : '#FF0000')
      .addFields(
        { name: 'New Status', value: statusData[member.id], inline: true },
        { name: 'Updated By', value: `<@${message.author.id}>`, inline: true },
        { name: 'User ID', value: member.id, inline: true },
        { name: 'Role (Active MM)', value: `<@&1465699111931215903>`, inline: true },
        { name: 'Role (Vouches)', value: `<@&1465698795164532933>`, inline: true },
        { name: 'Status Channel', value: `<#1479031321429807246>`, inline: true }
      )
      .setFooter({ text: 'Kai Kingdom MM System • Security Bot' })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] }).catch(() => {});
  }
};