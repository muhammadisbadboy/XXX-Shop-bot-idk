// utils/ticketManager.js
const { ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  /**
   * Creates a ticket channel
   * All overwrites are safe-checked
   */
  async createTicket(client, guild, ticketName, creatorId, claimRoleId, otherUserInput) {
    // Fetch claim role from API to prevent cache issues
    const claimRole = await guild.roles.fetch(claimRoleId).catch(() => null);
    if (!claimRole) throw new Error('Claim role not found! Check CLAIM_ID in .env');

    // Permission overwrites array
    const overwrites = [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }, // hide from everyone
      { id: claimRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }, // CLAIM_ID role
    ];

    // Add ticket creator safely
    const creator = await guild.members.fetch(creatorId).catch(() => null);
    if (creator) {
      overwrites.push({
        id: creator.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      });
    }

    // Add "Other Trader" robustly
    if (otherUserInput) {
      const otherUser = await this.resolveMember(guild, otherUserInput);
      if (otherUser) {
        overwrites.push({
          id: otherUser.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        });
      }
    }

    // Filter out any undefined/null overwrites (prevents InvalidType)
    const validOverwrites = overwrites.filter(o => o && o.id);

    // Create the ticket channel
    const ticketChannel = await guild.channels.create({
      name: ticketName,
      type: ChannelType.GuildText,
      permissionOverwrites: validOverwrites,
    });

    return ticketChannel;
  },

  /**
   * Safely add a user to a ticket
   * Accepts either a GuildMember/User object, a raw ID string, or a username/nickname
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
   * Accepts either a GuildMember/User object or a raw ID string
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
async closeTicket(ticketChannel, guild, transcriptsChannelId) {
  // Cool closing animation embed
  const closingEmbed = {
    title: '🛑 Closing Ticket...',
    description: 'Please wait while the ticket is being closed.',
    color: 0xff0000,
    fields: [{ name: 'Status', value: '0% complete' }],
  };

  const msg = await ticketChannel.send({ embeds: [closingEmbed] });

  // Animation simulation (progress 0 → 100%)
  for (let i = 10; i <= 100; i += 10) {
    await new Promise(res => setTimeout(res, 300)); // 300ms delay
    closingEmbed.fields[0].value = `${i}% complete`;
    await msg.edit({ embeds: [closingEmbed] });
  }

  // Fetch last 100 messages
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

  // Send transcript to the transcripts channel
  const transcriptChannel = await guild.channels.fetch(transcriptsChannelId).catch(() => null);
  if (transcriptChannel) {
    await transcriptChannel.send({
      content: `**Transcript for #${ticketChannel.name}**`,
      files: [{ attachment: Buffer.from(htmlTranscript, 'utf-8'), name: `${ticketChannel.name}.html` }],
    });
  }

  // Final closing embed
  const closedEmbed = {
    title: '✅ Ticket Closed',
    description: `Ticket ${ticketChannel.name} has been successfully closed and transcript saved.`,
    color: 0x00ff00,
  };
  await ticketChannel.send({ embeds: [closedEmbed] });

  // Delete the ticket channel
  await ticketChannel.delete();
},

  /**
   * Helper: resolve member from mention, ID, username, or nickname
   */
  async resolveMember(guild, input) {
    if (!input) return null;

    // Mention format
    if (/<@!?(\d+)>/.test(input)) {
      const id = input.match(/<@!?(\d+)>/)[1];
      return await guild.members.fetch(id).catch(() => null);
    }

    // ID number
    if (!isNaN(input)) return await guild.members.fetch(input).catch(() => null);

    // Search by username/nickname in cache first
    const cached = guild.members.cache.find(
      m =>
        m.user.username.toLowerCase() === input.toLowerCase() ||
        (m.nickname && m.nickname.toLowerCase() === input.toLowerCase())
    );
    if (cached) return cached;

    // Fetch all members and search
    return await guild.members.fetch().then(list =>
      list.find(
        m =>
          m.user.username.toLowerCase() === input.toLowerCase() ||
          (m.nickname && m.nickname.toLowerCase() === input.toLowerCase())
      )
    ).catch(() => null);
  },
};