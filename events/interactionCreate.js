const {
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const ticketManager = require('../utils/ticketManager');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    // Hardcoded role & channel IDs
    const claimRoleId = '1465699111931215903';
    const transcriptsChannelId = '1478762582994059305';

    // Helper to resolve member from mention, ID, username, or nickname
    async function resolveMember(guild, input) {
      if (!input) return null;

      const mentionMatch = input.match(/<@!?(\d+)>/);
      if (mentionMatch) return await guild.members.fetch(mentionMatch[1]).catch(() => null);

      if (!isNaN(input)) return await guild.members.fetch(input).catch(() => null);

      const cached = guild.members.cache.find(
        m =>
          m.user.username.toLowerCase() === input.toLowerCase() ||
          (m.nickname && m.nickname.toLowerCase() === input.toLowerCase())
      );
      if (cached) return cached;

      return await guild.members.fetch().then(list =>
        list.find(
          m =>
            m.user.username.toLowerCase() === input.toLowerCase() ||
            (m.nickname && m.nickname.toLowerCase() === input.toLowerCase())
        )
      ).catch(() => null);
    }

    async function safeDeferReply() {
      if (!interaction.replied && !interaction.deferred) {
        try { await interaction.deferReply({ ephemeral: true }); } catch {}
      }
    }

    // -----------------------------
    // Handle ticket category select
    // -----------------------------
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticketCategorySelect') {
      const category = interaction.values[0];

      const modal = new ModalBuilder()
        .setCustomId(`mmForm-${category}`)
        .setTitle(`🎫 ${category} Trade Form`);

      const traderInput = new TextInputBuilder()
        .setCustomId('trader')
        .setLabel('Trader Name / Username')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const tradeDetails = new TextInputBuilder()
        .setCustomId('trade')
        .setLabel('Trade Details')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const extraInfo = new TextInputBuilder()
        .setCustomId('extra')
        .setLabel('Extra Info')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

      const contactMethod = new TextInputBuilder()
        .setCustomId('contact')
        .setLabel('Contact Method')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(traderInput),
        new ActionRowBuilder().addComponents(tradeDetails),
        new ActionRowBuilder().addComponents(extraInfo),
        new ActionRowBuilder().addComponents(contactMethod)
      );

      try {
        return await interaction.showModal(modal);
      } catch (err) {
        console.error('Failed to show modal:', err);
      }
    }

    // -----------------------------
    // Handle modal submission (ticket creation)
    // -----------------------------
    if (interaction.isModalSubmit() && interaction.customId.startsWith('mmForm-')) {
      await safeDeferReply();

      const category = interaction.customId.split('-')[1];
      const traderInput = interaction.fields.getTextInputValue('trader');
      const tradeDetails = interaction.fields.getTextInputValue('trade');
      const extraInfo = interaction.fields.getTextInputValue('extra') || 'None';
      const contactMethod = interaction.fields.getTextInputValue('contact');

      const guild = interaction.guild;
      const ticketName = `ticket-${interaction.user.username}`.toLowerCase();

      const otherUser = await resolveMember(guild, traderInput);

      const ticketChannel = await ticketManager.createTicket(
        client,
        guild,
        ticketName,
        interaction.user.id,
        claimRoleId,
        otherUser ? otherUser.id : null
      );

      const ticketEmbed = new EmbedBuilder()
        .setTitle(`🎫 ${category} Ticket`)
        .setDescription(
          `Welcome <@${interaction.user.id}>! Our **middleman staff** will assist you shortly.\n**Pinged Staff Role:** <@&${claimRoleId}>`
        )
        .addFields(
          { name: '📌 Trade Info', value: `• Trader Name: ${traderInput}\n• Details: ${tradeDetails}\n• Extra Info: ${extraInfo}\n• Contact Method: ${contactMethod}` },
          { name: '💠 Selected Trade Type', value: `\`${category}\``, inline: true },
          { name: '🔥 Status', value: 'Awaiting claim', inline: true },
          { name: '👤 Ticket Creator', value: `<@${interaction.user.id}>`, inline: true },
          { name: '💡 Tips', value: '• Be honest & clear\n• Do not attempt chargebacks\n• Wait for staff to claim' }
        )
        .setColor('#1F2937')
        .setFooter({ text: 'Kai Kingdom MM Ticket System' })
        .setTimestamp();

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket-add').setLabel('Add').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('ticket-claim').setLabel('Claim').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('ticket-unclaim').setLabel('Unclaim').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ticket-remove').setLabel('Remove').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ticket-close').setLabel('Close').setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({
        content: `<@&${claimRoleId}> <@${interaction.user.id}>`,
        embeds: [ticketEmbed],
        components: [buttons],
      }).catch(() => {});

      return await interaction.editReply({ content: `✅ Ticket created: <#${ticketChannel.id}>` }).catch(() => {});
    }

    // -----------------------------
    // Handle ticket buttons
    // -----------------------------
    if (interaction.isButton() && interaction.channel.name.startsWith('ticket-')) {
      const ticketChannel = interaction.channel;

      if (!interaction.member.roles.cache.has(claimRoleId)) {
        return interaction.reply({ content: '❌ You are not authorized to use these buttons.', ephemeral: true }).catch(() => {});
      }

      switch (interaction.customId) {
        case 'ticket-add': {
          const modal = new ModalBuilder().setCustomId('addUserModal').setTitle('➕ Add User');
          const input = new TextInputBuilder()
            .setCustomId('userIdInput')
            .setLabel('Enter username, nickname, mention, or ID')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          return await interaction.showModal(modal).catch(() => {});
        }

        case 'ticket-remove': {
          const members = Array.from(ticketChannel.members.values()).filter(
            m => !m.user.bot && m.id !== interaction.user.id && !m.roles.cache.has(claimRoleId)
          );

          if (!members.length)
            return interaction.reply({ content: '❌ No members to remove.', ephemeral: true }).catch(() => {});

          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('removeUserSelect')
            .setPlaceholder('Select a member to remove')
            .addOptions(
              members.map(m => ({ label: m.user.username, value: m.id }))
            );

          const row = new ActionRowBuilder().addComponents(selectMenu);
          return interaction.reply({ content: 'Select a member to remove:', components: [row], ephemeral: true }).catch(() => {});
        }

        case 'ticket-claim':
        case 'ticket-unclaim': {
          const claimed = interaction.customId === 'ticket-claim';
          const embed = new EmbedBuilder()
            .setTitle(claimed ? '✅ Ticket Claimed' : '⚠️ Ticket Unclaimed')
            .setDescription(claimed ? `<@${interaction.user.id}> has claimed this ticket.` : `This ticket is now unclaimed.`)
            .setColor(claimed ? '#00FF00' : '#FFFF00');
          return interaction.reply({ embeds: [embed], ephemeral: false }).catch(() => {});
        }

        case 'ticket-close': {
          const closingEmbed = new EmbedBuilder()
            .setTitle('🛑 Closing Ticket...')
            .setDescription('Please wait while the ticket is being closed.')
            .setColor('#FF0000')
            .addFields({ name: 'Progress', value: '0%' });
          const msg = await ticketChannel.send({ embeds: [closingEmbed] }).catch(() => null);

          if (msg) {
            for (let i = 10; i <= 100; i += 10) {
              await new Promise(res => setTimeout(res, 300));
              closingEmbed.data.fields[0].value = `${i}%`;
              await msg.edit({ embeds: [closingEmbed] }).catch(() => {});
            }
          }

          const messages = await ticketChannel.messages.fetch({ limit: 100 });
          const transcriptLines = messages
            .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
            .map(m => {
              const color = m.member?.displayHexColor || '#FFFFFF';
              const embedsHTML = m.embeds.length
                ? m.embeds.map(e => `<div style="border:1px solid ${color};padding:5px;margin:2px;"><strong>Embed:</strong> ${e.title || ''} - ${e.description || ''}</div>`).join('')
                : '';
              return `<li style="color:${color}"><strong>${m.author.tag}</strong> [${m.createdAt.toLocaleString()}]: ${m.content}${embedsHTML}</li>`;
            }).join('\n');

          const htmlTranscript = `
            <html>
            <head><title>Ticket Transcript - ${ticketChannel.name}</title></head>
            <body style="font-family:Arial, sans-serif;background:#1E1E1E;color:#FFF;">
              <h2 style="color:#FFD700;">Transcript for #${ticketChannel.name}</h2>
              <ul>${transcriptLines}</ul>
            </body>
            </html>
          `;

          const transcriptChannel = await interaction.guild.channels.fetch(transcriptsChannelId).catch(() => null);
          if (transcriptChannel) {
            await transcriptChannel.send({
              content: `**Transcript for #${ticketChannel.name}**`,
              files: [{ attachment: Buffer.from(htmlTranscript, 'utf-8'), name: `${ticketChannel.name}.html` }],
            }).catch(() => {});
          }

          const closedEmbed = new EmbedBuilder()
            .setTitle('✅ Ticket Closed')
            .setDescription(`Ticket ${ticketChannel.name} has been successfully closed.`)
            .setColor('#00FF00');

          await ticketChannel.send({ embeds: [closedEmbed] }).catch(() => {});
          return ticketChannel.delete().catch(() => {});
        }
      }
    }

    // -----------------------------
    // Handle Add/Remove modal submissions
    // -----------------------------
    if (interaction.isModalSubmit()) {
      await safeDeferReply();
      const ticketChannel = interaction.channel;

      if (interaction.customId === 'addUserModal') {
        const input = interaction.fields.getTextInputValue('userIdInput');
        const member = await resolveMember(interaction.guild, input);
        if (!member) return interaction.editReply({ content: '❌ User not found.' }).catch(() => {});

        await ticketManager.addUser(ticketChannel, member);
        const embed = new EmbedBuilder()
          .setTitle('➕ User Added')
          .setDescription(`<@${member.id}> has been added to this ticket.`)
          .setColor('#00BFFF')
          .addFields({ name: 'Action by', value: `<@${interaction.user.id}>`, inline: true })
          .setTimestamp();
        return interaction.editReply({ embeds: [embed] }).catch(() => {});
      }

      if (interaction.customId === 'removeUserSelect') {
        const userId = interaction.values[0];
        const member = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!member) return interaction.update({ content: '❌ User not found.', components: [] }).catch(() => {});
        await ticketManager.removeUser(ticketChannel, member);
        return interaction.update({ content: `<@${member.id}> removed from the ticket.`, components: [] }).catch(() => {});
      }
    }
  },
};