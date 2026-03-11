const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

const OWNER_ID = '1112091588462649364';
const SERVER_OWNER = '1135999619541774386';
const WHITELIST = process.env.WHITELIST?.split(',') || [];
const DM_LOG_CHANNEL = process.env.DM_LOG_CHANNEL;
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 5;

const cooldowns = new Map();
const dataDir = path.join(__dirname, 'data');
const progressFile = path.join(dataDir, 'dm_progress.json');

module.exports = {
  name: 'dm',
  description: 'Send DMs to users or roles. Use .dmembed for embeds.',
  async execute(message, args, client) {
    const authorId = message.author.id;

    if (![OWNER_ID, SERVER_OWNER].includes(authorId) && !WHITELIST.includes(authorId)) {
      return message.channel.send('❌ You do not have permission.');
    }

    if (!args[0]) return message.channel.send('❌ Provide a user/role mention, ID, or name.');
    if (!args[1]) return message.channel.send('❌ Provide a message to send.');

    const text = args.slice(1).join(' ');
    const isEmbed = message.content.startsWith('.dmembed');

    // Cooldown check
    if (![OWNER_ID, SERVER_OWNER].includes(authorId) && !WHITELIST.includes(authorId)) {
      const last = cooldowns.get(authorId) || 0;
      const now = Date.now();
      if (now - last < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - last) / 1000);
        return message.channel.send(`⏱ Wait **${remaining}s** before sending again.`);
      }
    }

    await fs.mkdir(dataDir, { recursive: true });
    const progressData = JSON.parse(await fs.readFile(progressFile, 'utf-8').catch(() => '{}'));

    const usersToDM = [];
    const rolesToPing = [];

    const targetInput = args[0];

    // Resolve mentions
    const userMention = targetInput.match(/<@!?(\d+)>/);
    const roleMention = targetInput.match(/<@&(\d+)>/);

    if (userMention) {
      const user = await client.users.fetch(userMention[1]).catch(() => null);
      if (user) usersToDM.push(user);
    } else if (roleMention) {
      const role = message.guild.roles.cache.get(roleMention[1]);
      if (role) rolesToPing.push(role);
    } else if (!isNaN(targetInput)) {
      // numeric ID
      const user = await client.users.fetch(targetInput).catch(() => null);
      if (user) usersToDM.push(user);
      else {
        const role = message.guild.roles.cache.get(targetInput);
        if (role) rolesToPing.push(role);
      }
    } else {
      // try role by name first
      const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === targetInput.toLowerCase());
      if (role) rolesToPing.push(role);
      else {
        // username/nickname search
        const member = message.guild.members.cache.find(
          m =>
            m.user.username.toLowerCase() === targetInput.toLowerCase() ||
            (m.nickname && m.nickname.toLowerCase() === targetInput.toLowerCase())
        );
        if (member) usersToDM.push(member.user);
      }
    }

    if (!usersToDM.length && !rolesToPing.length)
      return message.channel.send('❌ No valid users or roles found.');

    const key = `${message.guild.id}_${authorId}_${isEmbed ? 'embed' : 'text'}`;
    const sentList = progressData[key] || [];
    const filteredUsers = usersToDM.filter(u => !sentList.includes(u.id));

    const totalUsersToSend = filteredUsers.length;

    if (!totalUsersToSend && !rolesToPing.length)
      return message.channel.send('✅ All users have already received this DM.');

    // Confirmation panel
    let targetFieldValue = [
      ...rolesToPing.map(r => `Role: <@&${r.id}>`),
      ...filteredUsers.slice(0, 10).map(u => `User: <@${u.id}>`)
    ].join('\n');

    if (filteredUsers.length > 10) targetFieldValue += `\n...and ${filteredUsers.length - 10} more users`;

    const confirmEmbed = new EmbedBuilder()
      .setTitle('📨 DM Confirmation')
      .setColor('#3498db')
      .setDescription(`You are about to send a DM to ${totalUsersToSend} user(s)`)
      .addFields(
        { name: 'Targets', value: targetFieldValue },
        { name: 'Message', value: text.length > 1024 ? text.slice(0, 1020) + '...' : text }
      )
      .setFooter({ text: `Requested by ${message.author.tag}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('dm_confirm').setLabel('✅ Confirm').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('dm_cancel').setLabel('❌ Cancel').setStyle(ButtonStyle.Danger)
    );

    const panel = await message.channel.send({ embeds: [confirmEmbed], components: [row] });

    const collector = panel.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async i => {
      if (i.user.id !== authorId) return i.reply({ content: 'Only the command executor can click!', ephemeral: true });
      await i.deferUpdate();

      if (i.customId === 'dm_confirm') {
        cooldowns.set(authorId, Date.now());
        await sendDMs(filteredUsers, text, isEmbed, message, client, key, progressData, rolesToPing);
        await panel.edit({
          embeds: [EmbedBuilder.from(confirmEmbed).setColor('#2ecc71').setDescription('✅ DM sending started!')],
          components: []
        });
        collector.stop();
      }

      if (i.customId === 'dm_cancel') {
        await panel.edit({
          embeds: [EmbedBuilder.from(confirmEmbed).setColor('#e74c3c').setDescription('❌ DM cancelled.')],
          components: []
        });
        collector.stop();
      }
    });

    collector.on('end', collected => {
      if (!collected.size) {
        panel.edit({
          embeds: [EmbedBuilder.from(confirmEmbed).setColor('#95a5a6').setDescription('⏱ Confirmation timed out.')],
          components: []
        }).catch(() => {});
      }
    });
  }
};

// Send DMs smoothly with batch + resume support
async function sendDMs(users, text, isEmbed, message, client, key, progressData, rolesToPing) {
  const progressEmbed = new EmbedBuilder()
    .setTitle('📨 Sending DMs...')
    .setDescription(`0 / ${users.length} sent\nRoles pinged: ${rolesToPing.map(r => `<@&${r.id}>`).join(', ') || 'None'}`)
    .setColor('#3498db')
    .setFooter({ text: `Initiated by ${message.author.tag}` })
    .setTimestamp();

  const cancelButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('dm_stop').setLabel('⏹ Stop Sending').setStyle(ButtonStyle.Danger)
  );

  const progressMessage = await message.channel.send({ embeds: [progressEmbed], components: [cancelButton] });

  let sent = 0, failed = 0, stopped = false;

  const collector = progressMessage.createMessageComponentCollector({ time: 0 });
  collector.on('collect', async i => {
    if (i.user.id !== message.author.id) return i.reply({ content: 'Only the command executor can stop this.', ephemeral: true });
    if (i.customId === 'dm_stop') stopped = true;
    await i.deferUpdate();
  });

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    if (stopped) break;
    const batch = users.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async user => {
      try {
        if (isEmbed) {
          const dmEmbed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('📩 Message from Staff')
            .setDescription(text)
            .setFooter({ text: `Sent by ${message.author.tag}` })
            .setTimestamp();
          await user.send({ embeds: [dmEmbed] });
        } else {
          await user.send(text);
        }
        sent++;
        progressData[key] = progressData[key] || [];
        progressData[key].push(user.id);
      } catch {
        failed++;
      }
    }));

    // Update progress message
    const barLength = 20;
    const bar = '█'.repeat(Math.floor((sent / users.length) * barLength)) + '—'.repeat(barLength - Math.floor((sent / users.length) * barLength));
    const updatedEmbed = EmbedBuilder.from(progressEmbed)
      .setDescription(`Progress: [${bar}]\n✅ Sent: ${sent}\n❌ Failed: ${failed}\n📨 Total: ${users.length}\nRoles pinged: ${rolesToPing.map(r => `<@&${r.id}>`).join(', ') || 'None'}`);
    await progressMessage.edit({ embeds: [updatedEmbed] });

    await new Promise(res => setTimeout(res, 500));
  }

  const finalEmbed = EmbedBuilder.from(progressEmbed)
    .setTitle(stopped ? '🛑 DM Sending Stopped' : '📬 DM Sending Complete')
    .setColor(stopped ? '#e74c3c' : '#2ecc71')
    .setDescription(`✅ Sent: ${sent}\n❌ Failed: ${failed}\n📨 Total: ${users.length}\nRoles pinged: ${rolesToPing.map(r => `<@&${r.id}>`).join(', ') || 'None'}`);
  await progressMessage.edit({ embeds: [finalEmbed], components: [] });

  // DM Log
  const logChannel = message.guild.channels.cache.get(DM_LOG_CHANNEL);
  if (logChannel) {
    const logEmbed = new EmbedBuilder()
      .setTitle('📩 DM Log')
      .setColor('#3498db')
      .setDescription(`Sent by: <@${message.author.id}>\nRoles pinged: ${rolesToPing.map(r => `<@&${r.id}>`).join(', ') || 'None'}\nUsers DM'ed: ${users.length}`)
      .addFields({ name: 'Message', value: text.length > 1024 ? text.slice(0, 1020) + '...' : text })
      .setTimestamp();
    await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
  }

  delete progressData[key];
  await fs.writeFile(progressFile, JSON.stringify(progressData, null, 4));
}