const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

const OWNER_ID = '1112091588462649364';
const SERVER_OWNER = '1135999619541774386';
const WHITELIST = process.env.WHITELIST?.split(',') || [];
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

const cooldowns = new Map();
const dataDir = path.join(__dirname, 'data');
const progressFile = path.join(dataDir, 'dm_progress.json');

module.exports = {
    name: 'dm',
    description: 'Send DM to user(s) or role. Use .dmembed for embed messages.',
    async execute(message, args, client) {
        const authorId = message.author.id;

        if (authorId !== OWNER_ID && authorId !== SERVER_OWNER && !WHITELIST.includes(authorId)) {
            return message.channel.send('❌ You do not have permission.');
        }

        if (!args[0]) return message.channel.send('❌ Provide a user/role mention or ID.');
        if (!args[1]) return message.channel.send('❌ Provide a message to send.');

        const text = args.slice(1).join(' ');
        const isEmbed = message.content.startsWith('.dmembed');

        // Cooldown for non-owner
        if (authorId !== OWNER_ID && authorId !== SERVER_OWNER && !WHITELIST.includes(authorId)) {
            const last = cooldowns.get(authorId) || 0;
            const now = Date.now();
            if (now - last < COOLDOWN_MS) {
                const remaining = Math.ceil((COOLDOWN_MS - last) / 1000);
                return message.channel.send(`⏱ Wait **${remaining}s** before sending again.`);
            }
        }

        await fs.mkdir(dataDir, { recursive: true });
        const progressData = JSON.parse(await fs.readFile(progressFile, 'utf-8').catch(() => '{}'));

        // Resolve targets
        let targets = [];
        if (message.mentions.users.size) targets.push(...message.mentions.users.map(u => u));
        else if (!isNaN(args[0])) {
            try { targets.push(await client.users.fetch(args[0])); } catch {
                const role = message.guild.roles.cache.get(args[0]);
                if (role) targets.push(...role.members.map(m => m.user));
            }
        } else {
            const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === args[0].toLowerCase());
            if (role) targets.push(...role.members.map(m => m.user));
        }

        if (!targets.length) return message.channel.send('❌ No valid users found.');

        const key = `${message.guild.id}_${authorId}_${isEmbed ? 'embed' : 'text'}`;
        const sentList = progressData[key] || [];
        targets = targets.filter(u => !sentList.includes(u.id));
        if (!targets.length) return message.channel.send('✅ All users have already received this DM.');

        // Owner bypass
        if (authorId === OWNER_ID || authorId === SERVER_OWNER || WHITELIST.includes(authorId)) {
            return sendDMs(targets, text, isEmbed, message, client, key, progressData);
        }

        const confirmEmbed = new EmbedBuilder()
            .setTitle('📨 DM Confirmation')
            .setColor('#3498db')
            .setDescription(`You are about to DM **${targets.length} user(s)**`)
            .addFields({ name: 'Message', value: text.length > 1024 ? text.slice(0, 1020) + '...' : text })
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
                await sendDMs(targets, text, isEmbed, message, client, key, progressData);
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

// Optimized DM sender with batch + resume
async function sendDMs(targets, text, isEmbed, message, client, key, progressData) {
    const progressEmbed = new EmbedBuilder()
        .setTitle('📨 Sending DMs...')
        .setDescription(`0 / ${targets.length} sent`)
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

    const batchSize = 5;
    for (let i = 0; i < targets.length; i += batchSize) {
        if (stopped) break;
        const batch = targets.slice(i, i + batchSize);
        await Promise.all(batch.map(async user => {
            try {
                if (isEmbed) {
                    const dmEmbed = new EmbedBuilder().setColor('#3498db').setTitle('📩 Message from Staff').setDescription(text).setFooter({ text: `Sent by ${message.author.tag}` }).setTimestamp();
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

        await fs.writeFile(progressFile, JSON.stringify(progressData, null, 4));

        const barLength = 20;
        const progress = Math.floor((sent / targets.length) * barLength);
        const bar = '█'.repeat(progress) + '—'.repeat(barLength - progress);
        const updatedEmbed = EmbedBuilder.from(progressEmbed)
            .setDescription(`Progress: [${bar}]\n✅ Sent: ${sent}\n❌ Failed: ${failed}\n📨 Total: ${targets.length}`);
        await progressMessage.edit({ embeds: [updatedEmbed] });

        await new Promise(res => setTimeout(res, 500));
    }

    const finalEmbed = EmbedBuilder.from(progressEmbed)
        .setTitle(stopped ? '🛑 DM Sending Stopped' : '📬 DM Sending Complete')
        .setColor(stopped ? '#e74c3c' : '#2ecc71')
        .setDescription(`✅ Sent: ${sent}\n❌ Failed: ${failed}\n📨 Total: ${targets.length}`);
    await progressMessage.edit({ embeds: [finalEmbed], components: [] });

    if (!stopped) {
        delete progressData[key];
        await fs.writeFile(progressFile, JSON.stringify(progressData, null, 4));
    }
}