// commands/tradecmds/settrust.js
const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'settrust',
  description: 'Set the trust score of a middleman (OWNER only)',
  async execute(message, args) {

    const OWNER_ID = process.env.OWNER_ID;
    const CLAIM_ROLE_ID = '1465699111931215903'; // role('1465699111931215903')
    const LEADERBOARD_CHANNEL_ID = '1479031321429807246'; // channel('1479031321429807246')

    if (message.author.id !== OWNER_ID) return; // Only OWNER can execute

    if (!args[0] || !args[1]) {
      return message.channel.send('❌ Usage: .settrust @user <trustScore>');
    }

    const userInput = args[0];
    const trustScore = parseInt(args[1]);
    if (isNaN(trustScore)) return message.channel.send('❌ Trust score must be a number.');

    // Resolve member by mention / ID / username
    let member;
    const mentionMatch = userInput.match(/<@!?(\d+)>/);
    if (mentionMatch) {
      member = await message.guild.members.fetch(mentionMatch[1]).catch(() => null);
    } else if (!isNaN(userInput)) {
      member = await message.guild.members.fetch(userInput).catch(() => null);
    } else {
      member = message.guild.members.cache.find(
        m => m.user.username.toLowerCase() === userInput.toLowerCase() ||
             (m.nickname && m.nickname.toLowerCase() === userInput.toLowerCase())
      );
    }

    if (!member) return message.channel.send('❌ User not found.');

    // Load existing JSON data
    const vouchPath = './db/mmVouches.json';
    const trustPath = './db/mmTrust.json';
    const statusPath = './db/mmStatus.json';

    const vouchData = fs.existsSync(vouchPath) ? JSON.parse(fs.readFileSync(vouchPath)) : {};
    const trustData = fs.existsSync(trustPath) ? JSON.parse(fs.readFileSync(trustPath)) : {};
    const statusData = fs.existsSync(statusPath) ? JSON.parse(fs.readFileSync(statusPath)) : {};

    // Update trust
    trustData[member.id] = trustScore;
    fs.writeFileSync(trustPath, JSON.stringify(trustData, null, 2));

    // Confirmation embed
    const embed = new EmbedBuilder()
      .setTitle('✅ Trust Score Updated')
      .setColor('#FFD700')
      .setDescription(`<@${member.id}>'s trust score has been set to **${trustScore}**`)
      .addFields(
        { name: 'Updated By', value: `<@${message.author.id}>`, inline: true },
        { name: 'Middleman', value: `<@${member.id}>`, inline: true }
      )
      .setFooter({ text: 'Kai Kingdom MM System' })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] }).catch(() => {});

    // -----------------------------
    // Auto-update the mmlist embed
    // -----------------------------
    const lbChannel = await message.guild.channels.fetch(LEADERBOARD_CHANNEL_ID).catch(() => null);
    if (!lbChannel) return;

    const messages = await lbChannel.messages.fetch({ limit: 50 });
    const lastEmbedMsg = messages.find(m => m.embeds.length && m.embeds[0].title?.includes('Middleman Leaderboard'));
    if (!lastEmbedMsg) return;

    // Build new embed
    const mmMembers = message.guild.members.cache.filter(m => m.roles.cache.has(CLAIM_ROLE_ID));
    const lines = mmMembers.map(m => {
      const vouches = vouchData[m.id] || 0;
      const trust = trustData[m.id] || 0;
      const active = statusData[m.id] || 'Inactive';
      return `**• ${m.user.username}**\n> 🛡 Trust Score: ${trust}\n> ✨ Vouches: ${vouches}\n> 🔹 Status: ${active}`;
    });

    const newEmbed = new EmbedBuilder()
      .setTitle('🏆 Middleman Leaderboard')
      .setColor('#00BFFF')
      .setDescription(lines.join('\n\n'))
      .setFooter({ text: 'Kai Kingdom MM System' })
      .setTimestamp();

    await lastEmbedMsg.edit({ embeds: [newEmbed] }).catch(() => {});
  },
};