const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'vouches',
  description: 'Shows the vouches of a user',
  async execute(message, args) {
    // Path to vouch database
    const mmVouchesPath = path.join(__dirname, '../../db/mmVouches.json');
    const vouchData = fs.existsSync(mmVouchesPath) ? JSON.parse(fs.readFileSync(mmVouchesPath)) : {};

    // Hardcoded roles & channels
    const CLAIM_ROLE_ID = '1465699111931215903';        // Staff / Claim role
    const SET_VOUCHES_ROLE_ID = '1465698795164532933'; // Role allowed to set vouches
    const LEADERBOARD_CHANNEL_ID = '1479031321429807246'; // Leaderboard channel
    const OWNER_ID = 'YOUR_OWNER_ID_HERE';             // Owner ID (keep as is)

    let member;

    if (args[0]) {
      const input = args.join(' ');

      // Mention format
      const mention = input.match(/<@!?(\d+)>/);
      if (mention) member = await message.guild.members.fetch(mention[1]).catch(() => null);

      // ID number
      else if (!isNaN(input)) member = await message.guild.members.fetch(input).catch(() => null);

      // Username/nickname search
      else member = message.guild.members.cache.find(
        m =>
          m.user.username.toLowerCase() === input.toLowerCase() ||
          (m.nickname && m.nickname.toLowerCase() === input.toLowerCase())
      );

      if (!member) return; // silently fail if not found
    } else {
      member = message.member; // self if no args
    }

    const userVouches = vouchData[member.id] || 0;

    const embed = new EmbedBuilder()
      .setTitle(`📝 Vouches • ${member.user.tag}`)
      .setColor('#00BFFF')
      .setDescription(`This shows the current vouches for <@${member.id}>.`)
      .addFields(
        { name: 'Vouches', value: `${userVouches}`, inline: true },
        { name: 'Middleman Status', value: '✅ Trusted', inline: true },
        { name: 'Pro Tip', value: 'More vouches = more credibility in the MM system!' }
      )
      .setFooter({ text: 'Kai Kingdom MM System • Security Bot' })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] }).catch(() => {});
  }
};