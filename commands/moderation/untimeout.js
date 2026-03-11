const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Config from .env
const OWNER_ID = '1112091588462649364'; // Owner
const SERVER_OWNER = '1135999619541774386'; // Server owner
const TIMEOUT_PERM = process.env.TIMEOUT_PERM;

module.exports = {
    name: 'untimeout',
    description: 'Remove timeout from a member with full MMPANEL confirmation, DM, and case logging.',
    async execute(message, args, client) {
        const authorId = message.author.id;

        // ----------------------
        // Permission Check
        // ----------------------
        if (authorId !== OWNER_ID && authorId !== SERVER_OWNER && !message.member.roles.cache.some(r => r.name === TIMEOUT_PERM)) {
            return message.channel.send({
                embeds: [new EmbedBuilder().setColor('#2b2d31').setDescription('❌ You do not have permission to use this command.')]
            });
        }

        // ----------------------
        // Input Validation
        // ----------------------
        if (!args[0]) {
            return message.channel.send({
                embeds: [new EmbedBuilder().setColor('#2b2d31').setDescription('❌ Provide a mention, username, or user ID to remove timeout.')]
            });
        }

        const targetIdentifier = args[0];
        const reason = args.slice(1).join(' ') || 'No reason provided';

        // ----------------------
        // Resolve Target
        // ----------------------
        let target;
        if (message.mentions.members.first()) {
            target = message.mentions.members.first();
        } else {
            target = await message.guild.members.fetch(args[0]).catch(() => null);
            if (!target) target = message.guild.members.cache.find(m => m.user.username.toLowerCase() === args[0].toLowerCase());
        }
        const targetId = target ? target.id : args[0];
        const targetTag = target?.user?.tag || args[0];

        // ----------------------
        // Data folder + files
        // ----------------------
        const dataDir = path.join(__dirname, 'data');
        await fs.mkdir(dataDir, { recursive: true });

        const caseFile = path.join(dataDir, 'cases.json');
        await fs.writeFile(caseFile, '{}').catch(() => {});
        const casesData = JSON.parse(await fs.readFile(caseFile, 'utf-8').catch(() => '{}'));
        const guildCases = casesData[message.guild.id] || [];
        const caseNumber = guildCases.length + 1;

        // ----------------------
        // DM Embed
        // ----------------------
        const dmEmbed = new EmbedBuilder()
            .setTitle(`⏱ Your timeout has been removed in ${message.guild.name}`)
            .setColor('#27ae60')
            .setDescription(`You were un-timed out by **${message.author.tag}**`)
            .addFields(
                { name: 'Reason', value: reason, inline: false },
                { name: 'Moderator', value: message.author.tag, inline: true }
            )
            .setFooter({ text: 'MMPANEL • Automated moderation' })
            .setTimestamp();

        // ----------------------
        // OWNER_ID or SERVER_OWNER bypass
        // ----------------------
        if (authorId === OWNER_ID || authorId === SERVER_OWNER) {
            try {
                if (target) await target.timeout(null, reason);
                await client.users.fetch(targetId).then(u => u.send({ embeds: [dmEmbed] })).catch(() => {});

                // Save case
                guildCases.push({ case: caseNumber, user: targetId, moderator: authorId, reason, action: 'untimeout', date: new Date() });
                casesData[message.guild.id] = guildCases;
                await fs.writeFile(caseFile, JSON.stringify(casesData, null, 4));

                // Mod-log
                const modLog = await client.getModLogChannel(message.guild);
                if (modLog) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('⏱ Timeout Removed')
                        .setColor('#27ae60')
                        .addFields(
                            { name: 'User', value: targetTag, inline: false },
                            { name: 'Moderator', value: message.author.tag, inline: false },
                            { name: 'Reason', value: reason, inline: false },
                            { name: 'Case Number', value: `#${caseNumber}`, inline: false }
                        )
                        .setTimestamp();
                    modLog.send({ embeds: [logEmbed] });
                }

                return message.channel.send({ embeds: [new EmbedBuilder().setColor('#27ae60').setDescription(`✅ ${targetTag} timeout successfully removed.`)] });
            } catch (err) {
                console.error(err);
                return message.channel.send({ embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ Failed to remove timeout.') ] });
            }
        }

        // ----------------------
        // Normal user: show panel
        // ----------------------
        const embed = new EmbedBuilder()
            .setTitle('Moderation Panel: Remove Timeout')
            .setColor('#27ae60')
            .setThumbnail(target?.user.displayAvatarURL({ dynamic: true }) || 'https://i.imgur.com/Uw1fJ3K.png')
            .setDescription(`You are about to **remove timeout** for ${target ? `<@${targetId}>` : targetId}\nPlease confirm below.`)
            .addFields(
                { name: 'Target', value: targetId, inline: true },
                { name: 'Moderator', value: `<@${authorId}>`, inline: true },
                { name: 'Reason', value: reason, inline: false },
                { name: 'Status', value: '⏳ Awaiting confirmation...', inline: false },
                { name: 'Case Number', value: `#${caseNumber}`, inline: true }
            )
            .setFooter({ text: 'MMPANEL • Click Confirm to execute' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('untimeout_confirm').setLabel('✅ Confirm Remove Timeout').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('untimeout_cancel').setLabel('❌ Cancel').setStyle(ButtonStyle.Secondary)
            );

        const panel = await message.channel.send({ embeds: [embed], components: [row] });

        // ----------------------
        // Collector
        // ----------------------
        const collector = panel.createMessageComponentCollector({ time: 30000 });

        collector.on('collect', async interaction => {
            if (interaction.user.id !== authorId) return interaction.reply({ content: 'Only the command executor can click!', flags: 64 });

            await interaction.deferUpdate();

            if (interaction.customId === 'untimeout_confirm') {
                try {
                    const tasks = [];
                    if (target) tasks.push(target.timeout(null, reason));
                    tasks.push(client.users.fetch(targetId).then(u => u.send({ embeds: [dmEmbed] })).catch(() => {}));

                    // Save case
                    guildCases.push({ case: caseNumber, user: targetId, moderator: authorId, reason, action: 'untimeout', date: new Date() });
                    casesData[message.guild.id] = guildCases;
                    tasks.push(fs.writeFile(caseFile, JSON.stringify(casesData, null, 4)));

                    // Mod-log
                    const modLog = await client.getModLogChannel(message.guild);
                    if (modLog) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('⏱ Timeout Removed')
                            .setColor('#27ae60')
                            .addFields(
                                { name: 'User', value: targetTag, inline: false },
                                { name: 'Moderator', value: message.author.tag, inline: false },
                                { name: 'Reason', value: reason, inline: false },
                                { name: 'Case Number', value: `#${caseNumber}`, inline: false }
                            )
                            .setTimestamp();
                        tasks.push(modLog.send({ embeds: [logEmbed] }));
                    }

                    await Promise.all(tasks);

                    const updated = EmbedBuilder.from(embed).setColor('#27ae60').spliceFields(3, 1, { name: 'Status', value: '✅ Timeout successfully removed' });
                    await panel.edit({ embeds: [updated], components: [] });

                } catch (err) {
                    console.error(err);
                    const failed = EmbedBuilder.from(embed).setColor('#e74c3c').spliceFields(3, 1, { name: 'Status', value: '❌ Failed to remove timeout. Check ID or permissions.' });
                    await panel.edit({ embeds: [failed], components: [] });
                }

                collector.stop();
            }

            if (interaction.customId === 'untimeout_cancel') {
                const cancelled = EmbedBuilder.from(embed).setColor('#7f8c8d').spliceFields(3, 1, { name: 'Status', value: '⚠️ Action cancelled.' });
                await panel.edit({ embeds: [cancelled], components: [] });
                collector.stop();
            }
        });

        collector.on('end', collected => {
            if (!collected.size) {
                const timeout = EmbedBuilder.from(embed).setColor('#95a5a6').spliceFields(3, 1, { name: 'Status', value: '⏱ Confirmation timed out.' });
                panel.edit({ embeds: [timeout], components: [] }).catch(() => {});
            }
        });
    }
};