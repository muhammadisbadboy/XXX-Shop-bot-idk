const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const fs = require('fs');
const path = require('path');

// Config from .env
const OWNER_ID = '1112091588462649364';
const SERVER_OWNER = '1135999619541774386';
const KICK_PERM = process.env.KICK_PERM; 
const WHITELIST = process.env.WHITELIST?.split(',') || [];
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

// Cooldowns tracker
const cooldowns = new Map();

module.exports = {
    name: 'kick',
    description: 'Kick a member with full MMPANEL confirmation, DM, and case logging.',
    async execute(message, args, client) {
        const authorId = message.author.id;

        // ----------------------
        // Permission Check
        // ----------------------
        if (authorId !== OWNER_ID && authorId !== SERVER_OWNER && !message.member.roles.cache.some(r => r.name === KICK_PERM)) {
            return message.channel.send({
                embeds: [new EmbedBuilder().setColor('#2b2d31').setDescription('❌ You do not have permission to use this command.')]
            });
        }

        // ----------------------
        // Cooldown Check
        // ----------------------
        if (authorId !== OWNER_ID && authorId !== SERVER_OWNER && !WHITELIST.includes(authorId)) {
            const lastKick = cooldowns.get(authorId) || 0;
            const now = Date.now();
            if (now - lastKick < COOLDOWN_MS) {
                const remaining = Math.ceil((COOLDOWN_MS - (now - lastKick)) / 60000);
                return message.channel.send({
                    embeds: [new EmbedBuilder().setColor('#e67e22').setDescription(`⏱ You are on cooldown. Please wait **${remaining} minute(s)** before kicking again.`)]
                });
            }
        }

        // ----------------------
        // Input Validation
        // ----------------------
        if (!args[0]) {
            return message.channel.send({
                embeds: [new EmbedBuilder().setColor('#2b2d31').setDescription('❌ Please provide a mention, username, or user ID to kick.')]
            });
        }

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
        // DM Embed
        // ----------------------
        const dmEmbed = new EmbedBuilder()
            .setTitle(`⚠️ You have been kicked from ${message.guild.name}`)
            .setColor('#c0392b')
            .setDescription(`You were kicked by **${message.author.tag}**`)
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
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

        const caseFile = path.join(dataDir, 'cases.json');
        if (!fs.existsSync(caseFile)) fs.writeFileSync(caseFile, '{}');
        const casesData = JSON.parse(fs.readFileSync(caseFile, 'utf-8'));
        const guildCases = casesData[message.guild.id] || [];
        const caseNumber = guildCases.length + 1;

        // ----------------------
        // Warn history
        // ----------------------
        const warnFile = path.join(dataDir, 'warns.json');
        if (!fs.existsSync(warnFile)) fs.writeFileSync(warnFile, '{}');
        const warnsData = JSON.parse(fs.readFileSync(warnFile, 'utf-8'));
        let warnHistory = 'No previous warns';
        const userWarns = warnsData[message.guild.id]?.[targetId] || [];
        if (userWarns.length) {
            warnHistory = userWarns.map((w, i) => `#${i+1}: ${w.reason} (${w.date})`).join('\n');
        }

        // ----------------------
        // OWNER / SERVER OWNER bypass panel
        // ----------------------
        try {
            if (target) await target.kick(reason);
            await client.users.fetch(targetId).then(u => u.send({ embeds: [dmEmbed] })).catch(() => {});

            guildCases.push({ case: caseNumber, user: targetId, moderator: authorId, reason, action: 'kick', date: new Date() });
            casesData[message.guild.id] = guildCases;
            fs.writeFileSync(caseFile, JSON.stringify(casesData, null, 4));

            const modLog = await client.getModLogChannel(message.guild);
            if (modLog) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Member Kicked')
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

            // Update cooldown
            if (authorId !== OWNER_ID && authorId !== SERVER_OWNER && !WHITELIST.includes(authorId)) {
                cooldowns.set(authorId, Date.now());
            }

            return message.channel.send({ embeds: [new EmbedBuilder().setColor('#27ae60').setDescription(`✅ ${targetTag} kicked successfully.`)] });
        } catch (err) {
            console.error(err);
            return message.channel.send({ embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ Failed to kick.') ] });
        }
    }
};