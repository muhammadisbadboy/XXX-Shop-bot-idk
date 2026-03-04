const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'galalo',
  description: 'Offer panel: only CLAIM_ID can use, only mentioned user can click buttons',
  async execute(message, args, client) {

    // ✅ Only user with CLAIM_ID role can use
    const CLAIM_ROLE_ID = '1465699111931215903';
    const ACCEPT_ROLE_ID = '1465699224061743156';
    const DECLINE_ROLE_ID = '1470527278432784416';

    if (!message.member.roles.cache.has(CLAIM_ROLE_ID)) {
      return; // silently fail if user doesn't have CLAIM_ID
    }

    // ✅ Must mention a user
    const targetUser = message.mentions.members.first();
    if (!targetUser) return; // silently fail if no mention

    // Optional: heading & description
    const heading = args[1] ? args[1] : '✨ Special Offer ✨';
    const description = args[2] ? args[2] : `<@${targetUser.id}>, you have received an offer. Please choose wisely.`;

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle(heading)
      .setDescription(description)
      .setColor('#00FFAA')
      .setFooter({ text: 'Only the mentioned user can click the buttons.' })
      .setTimestamp();

    // Build buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('acceptOffer')
        .setLabel('✅ Accept')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('declineOffer')
        .setLabel('❌ Decline')
        .setStyle(ButtonStyle.Danger)
    );

    // Send panel
    const panelMessage = await message.channel.send({ embeds: [embed], components: [row] });

    // Collector (3 min)
    const collector = panelMessage.createMessageComponentCollector({ time: 180000 });

    collector.on('collect', async interaction => {
      // ✅ Only the mentioned user can click
      if (interaction.user.id !== targetUser.id) {
        return interaction.reply({ content: '⚠️ Only the mentioned user can interact.', ephemeral: true });
      }

      await interaction.deferUpdate();

      if (interaction.customId === 'acceptOffer') {
        try {
          await targetUser.roles.add(ACCEPT_ROLE_ID);
          const acceptedEmbed = new EmbedBuilder()
            .setTitle('🎉 Offer Accepted 🎉')
            .setDescription(`<@${targetUser.id}> accepted the offer.\n✅ Granted role!`)
            .setColor('#00FF00')
            .setFooter({ text: 'Good choice!' })
            .setTimestamp();

          await panelMessage.edit({ embeds: [acceptedEmbed], components: [] });
        } catch {
          await panelMessage.edit({ content: '❌ Failed to assign role.', embeds: [], components: [] });
        }
      }

      if (interaction.customId === 'declineOffer') {
        try {
          await targetUser.roles.add(DECLINE_ROLE_ID);
          const declinedEmbed = new EmbedBuilder()
            .setTitle('❌ Offer Declined ❌')
            .setDescription(`<@${targetUser.id}> declined the offer.\n❌ Assigned role.`)
            .setColor('#FF0000')
            .setFooter({ text: 'Better luck next time!' })
            .setTimestamp();

          await panelMessage.edit({ embeds: [declinedEmbed], components: [] });
        } catch {
          await panelMessage.edit({ content: '❌ Failed to assign role.', embeds: [], components: [] });
        }
      }

      collector.stop();
    });

    collector.on('end', collected => {
      if (!collected.size) {
        panelMessage.edit({ content: '⏱ Panel expired without response.', embeds: [], components: [] });
      }
    });
  }
};