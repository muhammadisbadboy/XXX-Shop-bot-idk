const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Replace process.env with fixed IDs
const OWNER_ID = '1112091588462649364';       // Bot Owner
const SERVER_OWNER_ID = '1135999619541774386'; // Server Owner
const WARN_ROLE_ID = process.env.WARN_PERM;
const WHITELIST = process.env.WHITELIST?.split(',') || [];

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const warnFile = path.join(dataDir, 'warns.json');
if (!fs.existsSync(warnFile)) fs.writeFileSync(warnFile, '{}');

function loadJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf-8')); }
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 4)); }

module.exports = {
    name: 'unwarn',
    description: 'Remove a warning from a member',
    async execute(message, args, client) {
        const authorId = message.author.id;
        const isOwner = authorId === OWNER_ID || authorId === SERVER_OWNER_ID; // <-- updated
        const isWhitelisted = WHITELIST.includes(authorId);
        const hasRole = message.member.roles.cache.has(WARN_ROLE_ID);

        if (!isOwner && !isWhitelisted && !hasRole) return;

        const targetArg = args[0];
        if (!targetArg) return message.channel.send({ embeds: [new EmbedBuilder().setColor('#2c2f33').setDescription('❌ Please mention a user to unwarn.')] });

        let target = message.mentions.members.first()
            || await message.guild.members.fetch(targetArg).catch(() => null)
            || message.guild.members.cache.find(m => m.user.username.toLowerCase() === targetArg.toLowerCase());

        if (!target) return message.channel.send({ embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ Member not found.')] });
        if (target.id === authorId) return;

        const warnsData = loadJSON(warnFile);
        const guildId = message.guild.id;
        const userWarns = warnsData[guildId]?.[target.id] || [];

        if (!userWarns.length) return message.channel.send({ embeds: [new EmbedBuilder().setColor('#95a5a6').setDescription('ℹ️ This user has no warnings.')] });

        // OWNER/WHITELIST bypass: remove last warning instantly
        if (isOwner || isWhitelisted) {
            const removed = userWarns.pop();
            warnsData[guildId][target.id] = userWarns;
            saveJSON(warnFile, warnsData);

            const modLog = await client.getModLogChannel(message.guild);
            if (modLog) modLog.send({ embeds: [new EmbedBuilder()
                .setTitle('Member Unwarned')
                .setColor('#2ecc71')
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'User', value: target.user.tag, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true },
                    { name: 'Removed Reason', value: removed.reason }
                )
                .setFooter({ text: 'MMPANEL • Moderation Log' })
                .setTimestamp()
            ]});

            return message.channel.send({ embeds: [new EmbedBuilder().setColor('#27ae60').setDescription(`✅ Removed last warning: **${removed.reason}** from ${target.user.tag}`)] });
        }

        // Dropdown menu for user warnings
        const options = userWarns.map((w, i) => ({ label: `#${i+1}: ${w.reason}`, value: String(i) })).slice(0, 25);
        const selectMenu = new StringSelectMenuBuilder().setCustomId('unwarn_select').setPlaceholder('Select warning to remove').addOptions(options);
        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
            .setTitle(`⚠️ Unwarn Confirmation Panel`)
            .setColor('#f39c12')
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setDescription(`Select a warning to remove from <@${target.id}>`)
            .setFooter({ text: 'MMPANEL • Confirm removal' })
            .setTimestamp();

        const panel = await message.channel.send({ embeds: [embed], components: [row] });

        const collector = panel.createMessageComponentCollector({ time: 600000 });
        collector.on('collect', async interaction => {
            if (interaction.user.id !== authorId) return interaction.reply({ content: 'Only executor can select!', flags: 64 });
            await interaction.deferUpdate();

            const index = parseInt(interaction.values[0]);
            if (isNaN(index) || !userWarns[index]) return;

            const removed = userWarns.splice(index, 1)[0];
            warnsData[guildId][target.id] = userWarns;
            saveJSON(warnFile, warnsData);

            const updated = EmbedBuilder.from(embed).setColor('#27ae60').setDescription(`✅ Removed warning **${removed.reason}** from <@${target.id}>`);
            panel.edit({ embeds: [updated], components: [] });

            const modLog = await client.getModLogChannel(message.guild);
            if (modLog) modLog.send({ embeds: [new EmbedBuilder()
                .setTitle('Member Unwarned')
                .setColor('#2ecc71')
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'User', value: target.user.tag, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true },
                    { name: 'Removed Reason', value: removed.reason }
                )
                .setFooter({ text: 'MMPANEL • Moderation Log' })
                .setTimestamp()
            ]});
        });

        collector.on('end', collected => {
            if (!collected.size) {
                const timeout = EmbedBuilder.from(embed).setColor('#95a5a6').setDescription('⏱ Confirmation timed out.');
                panel.edit({ embeds: [timeout], components: [] }).catch(() => { });
            }
        });
    }
};