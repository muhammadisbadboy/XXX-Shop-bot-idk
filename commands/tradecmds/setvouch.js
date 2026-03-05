const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'setvouch',
  description: 'Set vouches for a middleman (OWNER_ID / SET_VOUCHES role only)',
  async execute(message, args) {
    // Hardcoded roles / IDs
    const SET_VOUCHES_ROLE_ID = '1465698795164532933';
    const OWNER_ID = 'your-owner-id-here'; // keep OWNER_ID as before

    // Permission check
    if (![OWNER_ID, message.author.id].includes(message.author.id) && !message.member.roles.cache.has(SET_VOUCHES_ROLE_ID)) {
      return; // silently fail if not authorized
    }

    if (!args[0] || !args[1]) return; // silently fail if missing arguments

    const input = args[0];
    const vouches = parseInt(args[1]);
    if (isNaN(vouches)) return; // silently fail if vouches is not a number

    // Resolve member
    let member;
    const mention = input.match(/<@!?(\d+)>/);
    if (mention) member = await message.guild.members.fetch(mention[1]).catch(() => null);
    else if (!isNaN(input)) member = await message.guild.members.fetch(input).catch(() => null);
    else member = message.guild.members.cache.find(m =>
      m.user.username.toLowerCase() === input.toLowerCase() ||
      (m.nickname && m.nickname.toLowerCase() === input.toLowerCase())
    );

    if (!member) return; // silently fail if member not found

    // Load / save vouch data
    const vouchPath = path.join(__dirname, '../../db/mmVouches.json');
    const vouchesData = fs.existsSync(vouchPath) ? JSON.parse(fs.readFileSync(vouchPath)) : {};
    vouchesData[member.id] = vouches;
    fs.writeFileSync(vouchPath, JSON.stringify(vouchesData, null, 2));

    // Confirmation embed
    const embed = new EmbedBuilder()
      .setTitle(`✅ Vouches Updated • ${member.user.tag}`)
      .setColor('#00BFFF')
      .addFields(
        { name: 'New Vouches', value: vouches.toString(), inline: true },
        { name: 'Updated By', value: `<@${message.author.id}>`, inline: true },
        { name: 'Status', value: 'Updated successfully', inline: true }
      )
      .setFooter({ text: 'Kai Kingdom MM System • Security Bot' })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] }).catch(() => {});
  }
};