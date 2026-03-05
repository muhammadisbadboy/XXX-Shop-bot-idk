const { EmbedBuilder } = require('discord.js');

let stickyMessages = {};

module.exports = {
  name: 'stick',
  description: 'Sticky system: .stick <message> | .stickembed <text> | .unstick',

  async execute(message, args) {
    const REQUIRED_ROLE_ID = '1465697938155110411';
    const member = message.member;
    const requiredRole = message.guild.roles.cache.get(REQUIRED_ROLE_ID);
    if (!requiredRole) return;

    const hasPermission = member.roles.cache.some(r => r.position >= requiredRole.position);
    if (!hasPermission) return message.reply('❌ You do not have permission to use this command.');

    const commandType = args[0]?.toLowerCase();

    // ----------- UNSTICK -----------
    if (commandType === 'unstick') {
      const data = stickyMessages[message.channel.id];
      if (!data) return message.reply('❌ No sticky message in this channel.');

      try {
        const prev = await message.channel.messages.fetch(data.lastId).catch(() => null);
        if (prev) await prev.delete().catch(() => {});
      } catch {}

      delete stickyMessages[message.channel.id];
      return message.reply('✅ Sticky message removed.').then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    // ----------- STICK EMBED -----------
    if (commandType === 'stickembed') {
      const embedContent = args.slice(1).join(' ');
      if (!embedContent) return message.reply('❌ Provide embed description to stick.');

      const embed = new EmbedBuilder()
        .setDescription(embedContent)
        .setColor(0x5865f2)
        .setFooter({ text: 'Eldorado.gg Sticky Message' });

      const sent = await message.channel.send({ embeds: [embed] });
      stickyMessages[message.channel.id] = {
        type: 'embed',
        messageData: embed.toJSON(), // store raw data for re-send
        lastId: sent.id
      };

      return message.delete().catch(() => {});
    }

    // ----------- STICK TEXT -----------
    const content = args.join(' ');
    if (!content) return message.reply('❌ Provide a message to stick.');

    const sent = await message.channel.send({
      content: content,
      allowedMentions: { parse: [] }
    });

    stickyMessages[message.channel.id] = {
      type: 'text',
      messageData: content,
      lastId: sent.id
    };

    message.delete().catch(() => {});
  }
};

// ----------- STICKY LISTENER -----------
module.exports.stickyListener = async (message) => {
  if (message.author.bot) return;

  const data = stickyMessages[message.channel.id];
  if (!data) return;

  // delete previous sticky message
  try {
    const prev = await message.channel.messages.fetch(data.lastId).catch(() => null);
    if (prev) await prev.delete().catch(() => {});
  } catch {}

  let newMsg;
  if (data.type === 'embed') {
    const embed = EmbedBuilder.from(data.messageData); // create fresh EmbedBuilder
    newMsg = await message.channel.send({ embeds: [embed] });
  } else {
    newMsg = await message.channel.send({
      content: data.messageData,
      allowedMentions: { parse: [] }
    });
  }

  data.lastId = newMsg.id;
};