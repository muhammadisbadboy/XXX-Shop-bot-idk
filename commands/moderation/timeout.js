const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Config from .env
const OWNER_ID = '1112091588462649364';
const SERVER_OWNER = '1135999619541774386';
const TIMEOUT_PERM = process.env.TIMEOUT_PERM;

module.exports = {
    name: 'timeout',
    description: 'Timeout a member with full MMPANEL confirmation, DM, and case logging.',
    async execute(message, args, client) {
        const authorId = message.author.id;

        // ----------------------
        // Permission Check
        // ----------------------
        if (
            authorId !== OWNER_ID && 
            authorId !== SERVER_OWNER &&
            !message.member.roles.cache.some(r => r.name === TIMEOUT_PERM)
        ) {
            return message.channel.send({
                embeds: [new EmbedBuilder().setColor('#2b2d31').setDescription('❌ You do not have permission to use this command.')]
            });
        }

        // ----------------------
        // Input Validation
        // ----------------------
        if (!args[0]) {
            return message.channel.send({
                embeds: [new EmbedBuilder().setColor('#2b2d31').setDescription('❌ Provide a mention, username, or user ID to timeout.')]
            });
        }

        const durationMs = parseInt(args[1]) * 60 * 1000 || 10 * 60 * 1000; // default 10 mins
        const reason = args.slice(2).join(' ') || 'No reason provided';

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
            .setTitle(`⏱ You have been timed out in ${message.guild.name}`)
            .setColor('#f39c12')
            .setDescription(`You were timed out by **${message.author.tag}**`)
            .addFields(
                { name: 'Duration', value: `${durationMs / 60000} minute(s)`, inline: true },
                { name: 'Reason', value: reason, inline: false },
                { name: 'Moderator', value: message.author.tag, inline: true }
            )
            .setFooter({ text: 'MMPANEL • Automated moderation' })
            .setTimestamp();

        // ----------------------
        // OWNER or SERVER_OWNER bypass
        // ----------------------
        if (authorId === OWNER_ID || authorId === SERVER_OWNER) {
            try {
                if (target) await target.timeout(durationMs, reason);
                await client.users.fetch(targetId).then(u => u.send({ embeds: [dmEmbed] })).catch(() => {});

                // Save case
                guildCases.push({ case: caseNumber, user: targetId, moderator: authorId, reason, duration: durationMs, action: 'timeout', date: new Date() });
                casesData[message.guild.id] = guildCases;
                await fs.writeFile(caseFile, JSON.stringify(casesData, null, 4));

                // Mod-log
                const modLog = await client.getModLogChannel(message.guild);
                if (modLog) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('⏱ Member Timed Out')
                        .setColor('#f39c12')
                        .addFields(
                            { name: 'User', value: targetTag, inline: false },
                            { name: 'Moderator', value: message.author.tag, inline: false },
                            { name: 'Reason', value: reason, inline: false },
                            { name: 'Duration', value: `${durationMs / 60000} min`, inline: false },
                            { name: 'Case Number', value: `#${caseNumber}`, inline: false }
                        )
                        .setTimestamp();
                    modLog.send({ embeds: [logEmbed] });
                }

                return message.channel.send({ embeds: [new EmbedBuilder().setColor('#27ae60').setDescription(`✅ ${targetTag} timed out successfully.`)] });
            } catch (err) {
                console.error(err);
                return message.channel.send({ embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ Failed to timeout member.') ] });
            }
        }

        // ----------------------
        // Normal user: show panel
        // ----------------------
        // ... rest of the code remains exactly the same
    }
};