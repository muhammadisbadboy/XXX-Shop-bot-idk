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

// Role IDs that can use the ban command (supports multiple IDs)
const BAN_PERM = process.env.BAN_PERM ? process.env.BAN_PERM.split(',').map(id => id.trim()) : [];

// Whitelisted users that bypass cooldown (supports multiple IDs)
const WHITELIST = process.env.WHITELIST ? process.env.WHITELIST.split(',').map(id => id.trim()) : [];

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes    

const cooldowns = new Map();    

module.exports = {    
name: 'ban',    
description: 'Ban a member with full MMPANEL confirmation, DM, and case logging.',    
async execute(message, args, client) {    
const authorId = message.author.id;    

// ----------------------      
// Permission check      
// ----------------------      
if (
    !OWNER_IDS.includes(authorId) &&
    !message.member.roles.cache.some(role => BAN_PERM.includes(role.id))
) {      
    return message.channel.send({ embeds: [new EmbedBuilder().setColor('#2b2d31').setDescription('❌ You do not have permission to use this command.')] });      
}      

// ----------------------      
// Cooldown check      
// ----------------------      
if (!OWNER_IDS.includes(authorId) && !WHITELIST.includes(authorId)) {      
    const lastBan = cooldowns.get(authorId) || 0;      
    const now = Date.now();      
    if (now - lastBan < COOLDOWN_MS) {      
        const remaining = Math.ceil((COOLDOWN_MS - (now - lastBan)) / 60000);      
        return message.channel.send({ embeds: [new EmbedBuilder().setColor('#e67e22').setDescription(`⏱ You are on cooldown. Wait **${remaining} minute(s)**.`)] });      
    }      
}      

// ----------------------      
// Input validation      
// ----------------------      
if (!args[0]) return message.channel.send({ embeds: [new EmbedBuilder().setColor('#2b2d31').setDescription('❌ Provide a mention, username, or ID to ban.')] });      

const reason = args.slice(1).join(' ') || 'No reason provided';      

// ----------------------      
// Resolve target      
// ----------------------      
let target = message.mentions.members.first();      
if (!target) {      
    target = await message.guild.members.fetch(args[0]).catch(() => null);      
    if (!target) target = message.guild.members.cache.find(m => m.user.username.toLowerCase() === args[0].toLowerCase());      
}      
const banId = target ? target.id : args[0];      
const targetTag = target?.user?.tag || args[0];      

// ----------------------
// Self-ban protection
// ----------------------
if (banId === authorId) {
    return message.channel.send({ embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('Omfg u cant ban urself, dumbfuck')] });
}

// ----------------------
// Hierarchy protection
// ----------------------
if (target && !OWNER_IDS.includes(authorId)) {
    const executorRolePos = message.member.roles.highest.position;
    const targetRolePos = target.roles.highest.position;
    if (targetRolePos >= executorRolePos) {
        return message.channel.send({ embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ You cannot ban a member with equal or higher role than you.')] });
    }
}

// ----------------------      
// DM embed      
// ----------------------      
const dmEmbed = new EmbedBuilder()      
    .setTitle(`⚠️ You have been banned from ${message.guild.name}`)      
    .setColor('#c0392b')      
    .setDescription(`You were banned by **${message.author.tag}**`)      
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

const warnsData = JSON.parse(await fs.readFile(warnFile, 'utf-8').catch(() => '{}'));      
const userWarns = warnsData[message.guild.id]?.[banId] || [];      
const warnHistory = userWarns.length ? userWarns.map((w,i) => `#${i+1}: ${w.reason} (${w.date})`).join('\n') : 'No previous warns';      

// ----------------------      
// OWNER bypass      
// ----------------------      
if (OWNER_IDS.includes(authorId)) {      
    try {      
        if (target) await target.ban({ reason });      
        await client.users.fetch(banId).then(u => u.send({ embeds: [dmEmbed] })).catch(() => {});      

        guildCases.push({ case: caseNumber, user: banId, moderator: authorId, reason, action: 'ban', date: new Date() });      
        casesData[message.guild.id] = guildCases;      
        await fs.writeFile(caseFile, JSON.stringify(casesData, null, 4));      

        const modLog = await client.getModLogChannel(message.guild);      
        if (modLog) {      
            const logEmbed = new EmbedBuilder()      
                .setTitle('⚠️ Member Banned')      
                .setColor('#c0392b')      
                .addFields(      
                    { name: 'User', value: targetTag, inline: false },      
                    { name: 'Moderator', value: message.author.tag, inline: false },      
                    { name: 'Reason', value: reason, inline: false },      
                    { name: 'Case Number', value: `#${caseNumber}`, inline: false }      
                )      
                .setTimestamp();      
            modLog.send({ embeds: [logEmbed] });      
        }      

        return message.channel.send({ embeds: [new EmbedBuilder().setColor('#27ae60').setDescription(`✅ ${targetTag} banned successfully.`)] });      
    } catch (err) {      
        console.error(err);      
        return message.channel.send({ embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ Failed to ban.') ] });      
    }      
}      

// ----------------------      
// Normal user: show MMPANEL      
// ----------------------      
const embed = new EmbedBuilder()      
    .setTitle('Moderation Panel: Ban Member')      
    .setColor('#c0392b')      
    .setThumbnail(target?.user.displayAvatarURL({ dynamic: true }) || 'https://i.imgur.com/Uw1fJ3K.png')      
    .setDescription(`You are about to **ban** ${target ? `<@${banId}>` : banId}\nPlease confirm below.`)      
    .addFields(      
        { name: 'Target', value: target ? `<@${banId}>` : banId, inline: true },      
        { name: 'Moderator', value: `<@${authorId}>`, inline: true },      
        { name: 'Reason', value: reason, inline: false },      
        { name: 'Warn History', value: warnHistory, inline: false },      
        { name: 'Status', value: '⏳ Awaiting confirmation...', inline: false },      
        { name: 'Case Number', value: `#${caseNumber}`, inline: true }      
    )      
    .setFooter({ text: 'MMPANEL • Click Confirm to execute' })      
    .setTimestamp();      

const row = new ActionRowBuilder()      
    .addComponents(      
        new ButtonBuilder().setCustomId('ban_confirm').setLabel('✅ Confirm Ban').setStyle(ButtonStyle.Danger),      
        new ButtonBuilder().setCustomId('ban_cancel').setLabel('❌ Cancel').setStyle(ButtonStyle.Secondary)      
    );      

const panel = await message.channel.send({ embeds: [embed], components: [row] });      

const collector = panel.createMessageComponentCollector({ time: 30000 });      

collector.on('collect', async interaction => {      
    if (interaction.user.id !== authorId) return interaction.reply({ content: 'Only the command executor can click!', flags: 64 });      
    await interaction.deferUpdate();      

    if (interaction.customId === 'ban_confirm') {      
        try {      
            const tasks = [];      
            tasks.push(message.guild.members.ban(banId, { reason }));      
            tasks.push(client.users.fetch(banId).then(u => u.send({ embeds: [dmEmbed] })).catch(() => {}));      

            if (!WHITELIST.includes(authorId)) cooldowns.set(authorId, Date.now());      

            guildCases.push({ case: caseNumber, user: banId, moderator: authorId, reason, action: 'ban', date: new Date() });      
            casesData[message.guild.id] = guildCases;      
            tasks.push(fs.writeFile(caseFile, JSON.stringify(casesData, null, 4)));      

            const modLog = await client.getModLogChannel(message.guild);      
            if (modLog) {      
                const logEmbed = new EmbedBuilder()      
                    .setTitle('⚠️ Member Banned')      
                    .setColor('#c0392b')      
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

            const updated = EmbedBuilder.from(embed).setColor('#27ae60').spliceFields(4, 1, { name: 'Status', value: '✅ Member successfully banned' });      
            await panel.edit({ embeds: [updated], components: [] });      

        } catch (err) {      
            console.error(err);      
            const failed = EmbedBuilder.from(embed).setColor('#e74c3c').spliceFields(4, 1, { name: 'Status', value: '❌ Failed to ban. Check ID or permissions.' });      
            await panel.edit({ embeds: [failed], components: [] });      
        }      

        collector.stop();      
    }      

    if (interaction.customId === 'ban_cancel') {      
        const cancelled = EmbedBuilder.from(embed).setColor('#7f8c8d').spliceFields(4, 1, { name: 'Status', value: '⚠️ Ban cancelled.' });      
        await panel.edit({ embeds: [cancelled], components: [] });      
        collector.stop();      
    }      
});      

collector.on('end', collected => {      
    if (!collected.size) {      
        const timeout = EmbedBuilder.from(embed).setColor('#95a5a6').spliceFields(4, 1, { name: 'Status', value: '⏱ Confirmation timed out.' });      
        panel.edit({ embeds: [timeout], components: [] }).catch(() => {});      
    }      
});      
}    
};