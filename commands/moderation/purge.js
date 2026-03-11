const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Set privileged IDs directly
const OWNER_IDS = ['1112091588462649364', '1135999619541774386']; // OWNER_ID + SERVER_OWNER
const WHITELIST = process.env.WHITELIST?.split(',') || [];
const PURGE_PERM = process.env.PURGE_PERM;
const PURGE_CHANNELS = process.env.PURGE_CHANNELS?.split(',') || [];

module.exports = {
    name: 'purge',
    description: 'Bulk delete messages with MMPANEL confirmation and mod logs.',
    async execute(message, args, client) {
        const authorId = message.author.id;
        const channelId = message.channel.id;

        // Permissions + channel restriction
        const isPrivileged = OWNER_IDS.includes(authorId) || WHITELIST.includes(authorId);
        const hasRole = message.member.roles.cache.some(r => r.name === PURGE_PERM);
        const isAllowedChannel = PURGE_CHANNELS.includes(channelId);

        if (!isPrivileged && (!hasRole || !isAllowedChannel)) return;

        // Amount
        const amount = parseInt(args[0], 10);
        if (!amount || amount < 1 || amount > 100) {
            return message.channel.send({
                embeds: [new EmbedBuilder().setColor('#e67e22').setDescription('❌ Provide a number between 1-100.')]
            });
        }

        // If privileged, do it instantly
        if (OWNER_IDS.includes(authorId)) {
            try {
                const deleted = await message.channel.bulkDelete(amount, true);

                // Mod-log
                const modLog = await client.getModLogChannel(message.guild);
                if (modLog) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('Messages Purged')
                        .setColor('#f39c12')
                        .addFields(
                            { name: 'Channel', value: `<#${channelId}>`, inline: false },
                            { name: 'Moderator', value: message.author.tag, inline: false },
                            { name: 'Amount', value: `${deleted.size}`, inline: false }
                        )
                        .setTimestamp();
                    modLog.send({ embeds: [logEmbed] });
                }

                return message.channel.send({
                    embeds: [new EmbedBuilder().setColor('#27ae60').setDescription(`✅ Deleted ${deleted.size} messages.`)]
                });
            } catch (err) {
                console.error(err);
                return message.channel.send({
                    embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ Failed to purge messages.')]
                });
            }
        }

        // ----------------------
        // Normal user: show panel
        // ----------------------
        const embed = new EmbedBuilder()
            .setTitle('Moderation Panel: Purge Messages')
            .setColor('#f39c12')
            .setDescription(`You are about to delete **${amount} messages** from this channel.\nClick confirm to proceed.`)
            .addFields(
                { name: 'Channel', value: `<#${channelId}>`, inline: true },
                { name: 'Moderator', value: `<@${authorId}>`, inline: true },
                { name: 'Status', value: 'Awaiting confirmation...', inline: false }
            )
            .setFooter({ text: 'MMPANEL • Click Confirm to execute' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('purge_confirm').setLabel('Confirm Purge').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('purge_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
            );

        const panel = await message.channel.send({ embeds: [embed], components: [row] });

        const collector = panel.createMessageComponentCollector({ time: 30000 });

        collector.on('collect', async interaction => {
            if (interaction.user.id !== authorId)
                return interaction.reply({ content: 'Only the command executor can click!', flags: 64 });

            await interaction.deferUpdate();

            if (interaction.customId === 'purge_confirm') {
                try {
                    const deleted = await message.channel.bulkDelete(amount, true);

                    const updated = EmbedBuilder.from(embed)
                        .setColor('#27ae60')
                        .spliceFields(2, 1, { name: 'Status', value: `✅ Deleted ${deleted.size} messages.` });

                    if (panel) await panel.edit({ embeds: [updated], components: [] });

                    const modLog = await client.getModLogChannel(message.guild);
                    if (modLog) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('Messages Purged')
                            .setColor('#f39c12')
                            .addFields(
                                { name: 'Channel', value: `<#${channelId}>`, inline: false },
                                { name: 'Moderator', value: message.author.tag, inline: false },
                                { name: 'Amount', value: `${deleted.size}`, inline: false }
                            )
                            .setTimestamp();
                        modLog.send({ embeds: [logEmbed] });
                    }

                } catch (err) {
                    console.error(err);
                    const failed = EmbedBuilder.from(embed)
                        .setColor('#e74c3c')
                        .spliceFields(2, 1, { name: 'Status', value: '❌ Failed to purge messages.' });
                    if (panel) await panel.edit({ embeds: [failed], components: [] });
                }

                collector.stop();
            }

            if (interaction.customId === 'purge_cancel') {
                const cancelled = EmbedBuilder.from(embed)
                    .setColor('#7f8c8d')
                    .spliceFields(2, 1, { name: 'Status', value: 'Action cancelled.' });
                if (panel) await panel.edit({ embeds: [cancelled], components: [] });
                collector.stop();
            }
        });

        collector.on('end', collected => {
            if (!collected.size) {
                const timeout = EmbedBuilder.from(embed)
                    .setColor('#95a5a6')
                    .spliceFields(2, 1, { name: 'Status', value: '⏱ Confirmation timed out.' });
                if (panel) panel.edit({ embeds: [timeout], components: [] }).catch(() => {});
            }
        });
    }
};