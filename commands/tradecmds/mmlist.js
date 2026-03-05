const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'mmlist',
  description: 'Shows all middlemen with vouches and highest role (paginated)',
  async execute(message, args) {

    const CLAIM_ROLE_ID = '1465699111931215903'; // Middleman role
    const mmVouchesPath = path.join(__dirname, '../../db/mmVouches.json');
    const vouchData  = fs.existsSync(mmVouchesPath) ? JSON.parse(fs.readFileSync(mmVouchesPath)) : {};

    // Fetch all members to ensure cache is updated
    await message.guild.members.fetch();

    // Get all members with the role
    const members = message.guild.members.cache.filter(m => m.roles.cache.has(CLAIM_ROLE_ID));

    if (!members.size) return message.channel.send('⚠️ No middlemen found in the server.');

    // Map member info: displayName, highest role ping, and vouches
    const memberList = members.map(m => {
      const vouches = vouchData[m.id] || 0;
      const highestRole = m.roles.highest.id !== message.guild.id
        ? `<@&${m.roles.highest.id}>`
        : 'No special role';
      return { display: `**${m.displayName}** • ${highestRole}\n**Vouches:** ${vouches}`, vouches };
    });

    // Sort by vouches descending
    memberList.sort((a, b) => b.vouches - a.vouches);

    // Pagination setup
    const pageSize = 10;
    let page = 0;
    const totalPages = Math.ceil(memberList.length / pageSize);

    const generateEmbed = (pageIndex) => {
      const start = pageIndex * pageSize;
      const end = start + pageSize;
      const currentMembers = memberList.slice(start, end);

      // Elegant numbering
      const formattedMembers = currentMembers
        .map((m, i) => `\`•\` **${i + 1 + pageIndex*pageSize}.** ${m.display}`)
        .join('\n\n');

      return new EmbedBuilder()
        .setTitle('🏛️ Eldorado.gg • Trusted Middlemen')
        .setColor('#FFD700') // Yellow theme
        .setDescription(formattedMembers)
        .setFooter({ text: `Page ${pageIndex + 1} of ${totalPages} • Eldorado.gg MM System` })
        .setTimestamp()
        .setThumbnail(message.guild.iconURL({ dynamic: true }))
        .setAuthor({ name: 'Middlemen Leaderboard', iconURL: message.guild.iconURL({ dynamic: true }) });
    };

    // Pagination buttons
    const prevButton = new ButtonBuilder()
      .setCustomId('prevPage')
      .setLabel('⬅️ Previous')
      .setStyle(ButtonStyle.Secondary);

    const nextButton = new ButtonBuilder()
      .setCustomId('nextPage')
      .setLabel('Next ➡️')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(prevButton, nextButton);

    const msg = await message.channel.send({ embeds: [generateEmbed(page)], components: [row] });

    const collector = msg.createMessageComponentCollector({ time: 5 * 60 * 1000 });

    collector.on('collect', i => {
      if (i.user.id !== message.author.id) 
        return i.reply({ content: '❌ Only the command user can navigate.', ephemeral: true });

      if (i.customId === 'nextPage') page = (page + 1) % totalPages;
      else if (i.customId === 'prevPage') page = (page - 1 + totalPages) % totalPages;

      i.update({ embeds: [generateEmbed(page)], components: [row] });
    });

    collector.on('end', () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  }
};