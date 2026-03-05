// utils/ticketManager.js
const { ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  /**
   * Creates a ticket channel
   * All overwrites are safe-checked
   */
  async createTicket(client, guild, ticketName, creatorId, otherUserInput) {

    const CLAIM_ROLE_ID = '1465699111931215903';
    const CATEGORY_ID = '1466889112652087539';

    const claimRole = await guild.roles.fetch(CLAIM_ROLE_ID).catch(() => null);
    if (!claimRole) throw new Error('Claim role not found! Hardcoded role ID is invalid');

    const overwrites = [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: claimRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ];

    const creator = await guild.members.fetch(creatorId).catch(() => null);
    if (creator) {
      overwrites.push({
        id: creator.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      });
    }

    if (otherUserInput) {
      const otherUser = await this.resolveMember(guild, otherUserInput);
      if (otherUser) {
        overwrites.push({
          id: otherUser.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        });
      }
    }

    const validOverwrites = overwrites.filter(o => o && o.id);

    const ticketChannel = await guild.channels.create({
      name: ticketName,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID, // Ensure all tickets go in the correct category
      permissionOverwrites: validOverwrites,
    });

    return ticketChannel;
  },

  /**
   * Claim ticket (makes it private to claimer, creator, and added user)
   */
  async claimTicket(ticketChannel, claimerId) {

    const CLAIM_ROLE_ID = '1465699111931215903';

    // Collect current members who should keep access
    const creatorOverwrite = ticketChannel.permissionOverwrites.cache.find(
      o => o.allow.has(PermissionFlagsBits.SendMessages) && o.id !== CLAIM_ROLE_ID && o.id !== claimerId
    );

    const addedUserOverwrite = ticketChannel.permissionOverwrites.cache.find(
      o => o.allow.has(PermissionFlagsBits.SendMessages) && o.id !== CLAIM_ROLE_ID && o.id !== claimerId && o.id !== creatorOverwrite?.id
    );

    const overwrites = [
      {
        id: ticketChannel.guild.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: claimerId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
    ];

    if (creatorOverwrite) {
      overwrites.push({
        id: creatorOverwrite.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      });
    }

    if (addedUserOverwrite) {
      overwrites.push({
        id: addedUserOverwrite.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      });
    }

    await ticketChannel.permissionOverwrites.set(overwrites);
  },

  /**
   * Unclaim ticket (restores staff access)
   */
  async unclaimTicket(ticketChannel) {

    const CLAIM_ROLE_ID = '1465699111931215903';

    await ticketChannel.permissionOverwrites.edit(CLAIM_ROLE_ID, {
      ViewChannel: true,
      SendMessages: true,
    });
  },

  /**
   * Safely add a user to a ticket
   */
  async addUser(ticketChannel, userInput) {
    if (!userInput) return;

    const guild = ticketChannel.guild;
    const member = userInput.id
      ? userInput
      : await this.resolveMember(guild, userInput);

    if (!member) return;

    await ticketChannel.permissionOverwrites.create(member.id, {
      ViewChannel: true,
      SendMessages: true,
    });
  },

  /**
   * Safely remove a user from a ticket
   */
  async removeUser(ticketChannel, userOrId) {
    if (!userOrId) return;

    const userId = userOrId.id ? userOrId.id : userOrId;
    if (!userId) return;

    await ticketChannel.permissionOverwrites.delete(userId).catch(() => null);
  },

  /**
   * Close ticket with animated embed and transcript
   */
  async closeTicket(ticketChannel, guild) {

    const TICKET_TRANSCRIPTS_ID = '1478762582994059305';

    const closingEmbed = {
      title: '🛑 Closing Ticket...',
      description: 'Please wait while the ticket is being closed.',
      color: 0xff0000,
      fields: [{ name: 'Status', value: '0% complete' }],
    };

    const msg = await ticketChannel.send({ embeds: [closingEmbed] });

    for (let i = 10; i <= 100; i += 10) {
      await new Promise(res => setTimeout(res, 300));
      closingEmbed.fields[0].value = `${i}% complete`;
      await msg.edit({ embeds: [closingEmbed] });
    }

    const messages = await ticketChannel.messages.fetch({ limit: 100 });

    const htmlTranscript = `
      <html>
        <head><title>Ticket Transcript - ${ticketChannel.name}</title></head>
        <body>
          <h2>Transcript for #${ticketChannel.name}</h2>
          <ul>
            ${messages
              .map(
                m =>
                  `<li><strong>${m.author.tag}</strong> [${m.createdAt.toLocaleString()}]: ${m.content}</li>`
              )
              .reverse()
              .join('\n')}
          </ul>
        </body>
      </html>
    `;

    const transcriptChannel = await guild.channels.fetch(TICKET_TRANSCRIPTS_ID).catch(() => null);

    if (transcriptChannel) {
      await transcriptChannel.send({
        content: `**Transcript for #${ticketChannel.name}**`,
        files: [{ attachment: Buffer.from(htmlTranscript, 'utf-8'), name: `${ticketChannel.name}.html` }],
      });
    }

    const closedEmbed = {
      title: '✅ Ticket Closed',
      description: `Ticket ${ticketChannel.name} has been successfully closed and transcript saved.`,
      color: 0x00ff00,
    };

    await ticketChannel.send({ embeds: [closedEmbed] });

    await ticketChannel.delete();
  },

  /**
   * Helper: resolve member
   */
  async resolveMember(guild, input) {
    if (!input) return null;

    if (/<@!?(\d+)>/.test(input)) {
      const id = input.match(/<@!?(\d+)>/)[1];
      return await guild.members.fetch(id).catch(() => null);
    }

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
  },
};