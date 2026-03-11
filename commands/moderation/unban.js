const {    
    EmbedBuilder,    
    ActionRowBuilder,    
    ButtonBuilder,    
    ButtonStyle    
} = require('discord.js');    
const fs = require('fs').promises;    
const path = require('path');    

// Owner IDs    
const OWNER_IDS = ['1135999619541774386', '1112091588462649364', '1365013388106666055'];    

// Role IDs that can use the unban command (supports multiple IDs)
const UNBAN_PERM = process.env.BAN_PERM ? process.env.BAN_PERM.split(',').map(id => id.trim()) : [];

// Whitelisted users that bypass cooldown (supports multiple IDs)
const WHITELIST = process.env.WHITELIST ? process.env.WHITELIST.split(',').map(id => id.trim()) : [];

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes    

const cooldowns = new Map();    

module.exports = {    
    name: 'unban',    
    description: 'Unban a member with full MMPANEL confirmation, DM, and case logging.',    
    async execute(message, args, client) {    
        const authorId = message.author.id;    

        // ----------------------      
        // Permission check      
        // ----------------------      
        if (
            !OWNER_IDS.includes(authorId) &&
            !message.member.roles.cache.some(role => UNBAN_PERM.includes(role.id))
        ) {      
            return message.channel.send({ embeds: [new EmbedBuilder().setColor('#2b2d31').setDescription('❌ You do not have permission to use this command.')] });      
        }      

        // ----------------------      
        // Cooldown check      
        // ----------------------      
        if (!OWNER_IDS.includes(authorId) && !WHITELIST.includes(authorId)) {      
            const lastUnban = cooldowns.get(authorId) || 0;      
            const now = Date.now();      
            if (now - lastUnban < COOLDOWN_MS) {      
                const remaining = Math.ceil((COOLDOWN_MS - (now - lastUnban)) / 60000);      
                return message.channel.send({ embeds: [new EmbedBuilder().setColor('#e67e22').setDescription(`⏱ You are on cooldown. Wait **${remaining} minute(s)**.`)] });      
            }      
        }      

        // ----------------------      
        // Input validation      
        // ----------------------      
        if (!args[0]) return message.channel.send({ embeds: [new EmbedBuilder().setColor('#2b2d31').setDescription('❌ Provide a user ID to unban.')] });      

        const reason = args.slice(1).join(' ') || 'No reason provided';      
        const banId = args[0]; // target ID for unban

        // ----------------------      
        // DM embed      
        // ----------------------      
        const dmEmbed = new EmbedBuilder()      
            .setTitle(`⚠️ You have been unbanned from ${message.guild.name}`)      
            .setColor('#2ecc71')      
            .setDescription(`You were unbanned by **${message.author.tag}**`)      
            .addFields(      
                { name: 'Reason', value: reason, inline: false },      
                { name: 'Moderator', value: message.author.tag, inline: true }      
            )      
            .setFooter({ text: 'MMPANEL • Automated moderation' })      
            .setTimestamp();      

        // ----------------------      
        // Data folder + files      
        // ----------------------      
        const dataDir = path.join(__dirname, 'data');      
        await fs.mkdir(dataDir, { recursive: true });      
        const caseFile = path.join(dataDir, 'cases.json');      
        const warnFile = path.join(dataDir, 'warns.json');      
        await Promise.all([      
            fs.writeFile(caseFile, '{}').catch(() => {}),      
            fs.writeFile(warnFile, '{}').catch(() => {})      
        ]);      

        const casesData = JSON.parse(await fs.readFile(caseFile, 'utf-8').catch(() => '{}'));      
        const guildCases = casesData[message.guild.id] || [];      
        const caseNumber = guildCases.length + 1;      

        // ----------------------      
        // OWNER bypass      
        // ----------------------      
        if (OWNER_IDS.includes(authorId)) {      
            try {      
                await message.guild.members.unban(banId, reason);      
                await client.users.fetch(banId).then(u => u.send({ embeds: [dmEmbed] })).catch(() => {});      

                guildCases.push({ case: caseNumber, user: banId, moderator: authorId, reason, action: 'unban', date: new Date() });      
                casesData[message.guild.id] = guildCases;      
                await fs.writeFile(caseFile, JSON.stringify(casesData, null, 4));      

                const modLog = await client.getModLogChannel(message.guild);      
                if (modLog) {      
                    const logEmbed = new EmbedBuilder()      
                        .setTitle('✅ Member Unbanned')      
                        .setColor('#2ecc71')      
                        .addFields(      
                            { name: 'User', value: `<@${banId}>`, inline: false },      
                            { name: 'Moderator', value: message.author.tag, inline: false },      
                            { name: 'Reason', value: reason, inline: false },      
                            { name: 'Case Number', value: `#${caseNumber}`, inline: false }      
                        )      
                        .setTimestamp();      
                    modLog.send({ embeds: [logEmbed] });      
                }      

                return message.channel.send({ embeds: [new EmbedBuilder().setColor('#27ae60').setDescription(`✅ <@${banId}> unbanned successfully.`)] });      
            } catch (err) {      
                console.error(err);      
                return message.channel.send({ embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ Failed to unban. Check ID or permissions.') ] });      
            }      
        }      

        // ----------------------      
        // Normal user: show MMPANEL      
        // ----------------------      
        const embed = new EmbedBuilder()      
            .setTitle('Moderation Panel: Unban Member')      
            .setColor('#2ecc71')      
            .setDescription(`You are about to **unban** <@${banId}>\nPlease confirm below.`)      
            .addFields(      
                { name: 'Target', value: `<@${banId}>`, inline: true },      
                { name: 'Moderator', value: `<@${authorId}>`, inline: true },      
                { name: 'Reason', value: reason, inline: false },      
                { name: 'Status', value: '⏳ Awaiting confirmation...', inline: false },      
                { name: 'Case Number', value: `#${caseNumber}`, inline: true }      
            )      
            .setFooter({ text: 'MMPANEL • Click Confirm to execute' })      
            .setTimestamp();      

        const row = new ActionRowBuilder()      
            .addComponents(      
                new ButtonBuilder().setCustomId('unban_confirm').setLabel('✅ Confirm Unban').setStyle(ButtonStyle.Success),      
                new ButtonBuilder().setCustomId('unban_cancel').setLabel('❌ Cancel').setStyle(ButtonStyle.Secondary)      
            );      

        const panel = await message.channel.send({ embeds: [embed], components: [row] });      

        const collector = panel.createMessageComponentCollector({ time: 30000 });      

        collector.on('collect', async interaction => {      
            if (interaction.user.id !== authorId) return interaction.reply({ content: 'Only the command executor can click!', flags: 64 });      
            await interaction.deferUpdate();      

            if (interaction.customId === 'unban_confirm') {      
                try {      
                    await message.guild.members.unban(banId, reason);      
                    await client.users.fetch(banId).then(u => u.send({ embeds: [dmEmbed] })).catch(() => {});      

                    if (!WHITELIST.includes(authorId)) cooldowns.set(authorId, Date.now());      

                    guildCases.push({ case: caseNumber, user: banId, moderator: authorId, reason, action: 'unban', date: new Date() });      
                    casesData[message.guild.id] = guildCases;      
                    await fs.writeFile(caseFile, JSON.stringify(casesData, null, 4));      

                    const modLog = await client.getModLogChannel(message.guild);      
                    if (modLog) {      
                        const logEmbed = new EmbedBuilder()      
                            .setTitle('✅ Member Unbanned')      
                            .setColor('#2ecc71')      
                            .addFields(      
                                { name: 'User', value: `<@${banId}>`, inline: false },      
                                { name: 'Moderator', value: message.author.tag, inline: false },      
                                { name: 'Reason', value: reason, inline: false },      
                                { name: 'Case Number', value: `#${caseNumber}`, inline: false }      
                            )      
                            .setTimestamp();      
                        await modLog.send({ embeds: [logEmbed] });      
                    }      

                    const updated = EmbedBuilder.from(embed).setColor('#27ae60').spliceFields(3, 1, { name: 'Status', value: '✅ Member successfully unbanned' });      
                    await panel.edit({ embeds: [updated], components: [] });      

                } catch (err) {      
                    console.error(err);      
                    const failed = EmbedBuilder.from(embed).setColor('#e74c3c').spliceFields(3, 1, { name: 'Status', value: '❌ Failed to unban. Check ID or permissions.' });      
                    await panel.edit({ embeds: [failed], components: [] });      
                }      

                collector.stop();      
            }      

            if (interaction.customId === 'unban_cancel') {      
                const cancelled = EmbedBuilder.from(embed).setColor('#7f8c8d').spliceFields(3, 1, { name: 'Status', value: '⚠️ Unban cancelled.' });      
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