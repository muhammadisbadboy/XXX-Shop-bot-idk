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

    if (!interaction.guild) return;

    const claimRoleId = '1465699111931215903';
    const transcriptsChannelId = '1478762582994059305';

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
    // Ticket category select
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

      return interaction.showModal(modal);
    }

    // -----------------------------
    // Ticket creation
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
        otherUser ? otherUser.id : null
      );

      const ticketEmbed = new EmbedBuilder()
        .setTitle(`🎫 ${category} Ticket`)
        .setDescription(
          `Welcome <@${interaction.user.id}>! Our **middleman staff** will assist you shortly.\nPinged Staff Role: <@&${claimRoleId}>`
        )
        .addFields(
          { name: '📌 Trade Info', value: `• Trader Name: ${traderInput}\n• Details: ${tradeDetails}\n• Extra Info: ${extraInfo}\n• Contact Method: ${contactMethod}` },
          { name: '💠 Selected Trade Type', value: `\`${category}\``, inline: true },
          { name: '🔥 Status', value: 'Awaiting claim', inline: true },
          { name: '👤 Ticket Creator', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setColor('#1F2937')
        .setFooter({ text: 'Eldorado MM Ticket System' })
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
      });

      return interaction.editReply({
        content: `✅ Ticket created: <#${ticketChannel.id}>`
      });
    }

    // -----------------------------
    // Ticket Buttons
    // -----------------------------
    if (
      interaction.isButton() &&
      interaction.channel.name.startsWith('ticket-') &&
      !interaction.customId.startsWith('acceptOffer_') &&
      !interaction.customId.startsWith('rejectOffer_')
    ) {

      const ticketChannel = interaction.channel;

      if (!interaction.member.roles.cache.has(claimRoleId)) {
        return interaction.reply({
          content: '❌ You are not authorized to use these buttons.',
          ephemeral: true
        });
      }

      switch (interaction.customId) {

        case 'ticket-claim': {

          const creator = ticketChannel.permissionOverwrites.cache.find(
            o => o.type === 'member' && o.allow.has('ViewChannel')
          );

          const addedUser = ticketChannel.permissionOverwrites.cache
            .filter(o => o.type === 'member' && o.allow.has('ViewChannel'))
            .find(o => o.id !== creator?.id);

          const overwrites = [
            {
              id: interaction.guild.roles.everyone,
              deny: ['ViewChannel']
            },
            {
              id: interaction.user.id,
              allow: ['ViewChannel','SendMessages','ReadMessageHistory']
            }
          ];

          if (creator) overwrites.push({
            id: creator.id,
            allow: ['ViewChannel','SendMessages','ReadMessageHistory']
          });

          if (addedUser && addedUser.id !== interaction.user.id) overwrites.push({
            id: addedUser.id,
            allow: ['ViewChannel','SendMessages','ReadMessageHistory']
          });

          await ticketChannel.permissionOverwrites.set(overwrites);

          const embed = new EmbedBuilder()
            .setTitle('✅ Ticket Claimed')
            .setDescription(`<@${interaction.user.id}> has claimed this ticket.`)
            .setColor('#00FF00');

          return interaction.reply({ embeds: [embed] });
        }

        case 'ticket-unclaim': {
          const embed = new EmbedBuilder()
            .setTitle('⚠️ Ticket Unclaimed')
            .setDescription(`This ticket is now unclaimed.`)
            .setColor('#FFFF00');

          return interaction.reply({ embeds: [embed] });
        }

        case 'ticket-close': {
          return ticketManager.closeTicket(ticketChannel, interaction.guild);
        }

      }
    }
  },
};