const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

const OWNER_ID = '1112091588462649364';
const SERVER_OWNER = '1135999619541774386';
const WHITELIST = process.env.WHITELIST?.split(',') || [];
const DM_LOG_CHANNEL = process.env.DM_LOG_CHANNEL; // Logging channel from .env
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const cooldowns = new Map();

const dataDir = path.join(__dirname, 'data');
const progressFile = path.join(dataDir, 'dm_progress.json');

module.exports = {
    name: 'dm',
    description: 'Send DM to user(s) or ping role(s) with optional embed',
    async execute(message, args, client) {
        const authorId = message.author.id;

        if (authorId !== OWNER_ID && authorId !== SERVER_OWNER && !WHITELIST.includes(authorId))
            return message.channel.send('❌ You do not have permission.');

        if (!args[0]) return message.channel.send('❌ Provide a user or role (mention, ID, or name).');
        if (!args[1]) return message.channel.send('❌ Provide a message to send.');

        const text = args.slice(1).join(' ');
        const isEmbed = message.content.startsWith('.dmembed');

        // Cooldown for non-owners
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

        // ----------------------
        // Resolve targets
        // ----------------------
        let usersToDM = [];
        let rolesToPing = [];
        const targetArg = args[0];

        // Role mention
        const roleMentionMatch = targetArg.match(/^<@&(\d+)>$/);
        if (roleMentionMatch) {
            const role = message.guild.roles.cache.get(roleMentionMatch[1]);
            if (role) rolesToPing.push(role);
        } 
        // Role ID
        else if (!isNaN(targetArg) && message.guild.roles.cache.has(targetArg)) {
            rolesToPing.push(message.guild.roles.cache.get(targetArg));
        } 
        // Role name
        else {
            const roleByName = message.guild.roles.cache.find(r => r.name.toLowerCase() === targetArg.toLowerCase());
            if (roleByName) rolesToPing.push(roleByName);
        }

        // User mention
        const userMentionMatch = targetArg.match(/^<@!?(\d+)>$/);
        if (userMentionMatch) {
            const user = await client.users.fetch(userMentionMatch[1]).catch(() => null);
            if (user) usersToDM.push(user);
        } 
        // User ID
        else if (!isNaN(targetArg)) {
            const user = await client.users.fetch(targetArg).catch(() => null);
            if (user) usersToDM.push(user);
        } 
        // Username / nickname
        else {
            const member = message.guild.members.cache.find(
                m => m.user.username.toLowerCase() === targetArg.toLowerCase() ||
                     (m.nickname && m.nickname.toLowerCase() === targetArg.toLowerCase())
            );
            if (member) usersToDM.push(member.user);
        }

        if (!usersToDM.length && !rolesToPing.length)
            return message.channel.send('❌ No valid user(s) or role(s) found.');

        // ----------------------
        // Confirmation embed
        // ----------------------
        const confirmEmbed = new EmbedBuilder()
            .setTitle('📨 DM Confirmation')
            .setColor('#3498db')
            .setDescription(`You are about to send a DM`)
            .addFields(
                { name: 'Roles to Ping', value: rolesToPing.length ? rolesToPing.map(r => `<@&${r.id}>`).join(', ') : 'None', inline: false },
                { name: 'Users to DM', value: usersToDM.length.toString(), inline: false },
                { name: 'Message Preview', value: text.length > 1024 ? text.slice(0, 1020) + '...' : text, inline: false }
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
                await sendDMs(usersToDM, text, isEmbed, message, client, rolesToPing);
                await panel.edit({ embeds: [EmbedBuilder.from(confirmEmbed).setColor('#2ecc71').setDescription('✅ DMs sending started!')], components: [] });
                collector.stop();
            }

            if (i.customId === 'dm_cancel') {
                await panel.edit({ embeds: [EmbedBuilder.from(confirmEmbed).setColor('#e74c3c').setDescription('❌ DM cancelled.')], components: [] });
                collector.stop();
            }
        });

        collector.on('end', collected => {
            if (!collected.size) {
                panel.edit({ embeds: [EmbedBuilder.from(confirmEmbed).setColor('#95a5a6').setDescription('⏱ Confirmation timed out.')], components: [] }).catch(() => {});
            }
        });
    }
};

// ----------------------
// DM sender
// ----------------------
async function sendDMs(users, text, isEmbed, message, client, rolesToPing) {
    const progressEmbed = new EmbedBuilder()
        .setTitle('📨 Sending DMs...')
        .setDescription(`0 / ${users.length} sent`)
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

    // Batch DM sending
    const batchSize = 5; // small batch for large servers
    for (let i = 0; i < users.length; i += batchSize) {
        if (stopped) break;
        const batch = users.slice(i, i + batchSize);
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
            } catch {
                failed++;
            }
        }));

        // Update progress
        const barLength = 20;
        const progress = Math.floor((sent / users.length) * barLength);
        const bar = '█'.repeat(progress) + '—'.repeat(barLength - progress);
        const updatedEmbed = EmbedBuilder.from(progressEmbed)
            .setDescription(`Progress: [${bar}]\n✅ Sent: ${sent}\n❌ Failed: ${failed}\n📨 Total: ${users.length}`);
        await progressMessage.edit({ embeds: [updatedEmbed] });

        await new Promise(res => setTimeout(res, 500)); // slow for stability
    }

    // Final summary
    const summaryEmbed = new EmbedBuilder()
        .setTitle(stopped ? '🛑 DM Sending Stopped' : '📬 DM Sending Complete')
        .setColor(stopped ? '#e74c3c' : '#2ecc71')
        .setDescription(`✅ Sent: ${sent}\n❌ Failed: ${failed}\n📨 Total Users: ${users.length}`)
        .addFields(
            { name: 'Roles Pinged', value: rolesToPing.length ? rolesToPing.map(r => `<@&${r.id}>`).join(', ') : 'None', inline: false }
        );
    await progressMessage.edit({ embeds: [summaryEmbed], components: [] });

    // Optional: log in DM_LOG_CHANNEL
    if (DM_LOG_CHANNEL) {
        const logChannel = await message.guild.channels.fetch(DM_LOG_CHANNEL).catch(() => null);
        if (logChannel) {
            const logEmbed = EmbedBuilder.from(summaryEmbed).setTitle('📬 DM Log');
            await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
        }
    }
}