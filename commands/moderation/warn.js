const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

// IDs for command access
const OWNER_ID = '1112091588462649364';
const SERVER_OWNER = '1135999619541774386';
const WARN_ROLE_ID = process.env.WARN_PERM; 
const WHITELIST = process.env.WHITELIST?.split(',') || [];

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const warnFile = path.join(dataDir, 'warns.json');
const caseFile = path.join(dataDir, 'cases.json');
if (!fs.existsSync(warnFile)) fs.writeFileSync(warnFile, '{}');
if (!fs.existsSync(caseFile)) fs.writeFileSync(caseFile, '{}');

const cooldowns = new Map();

function loadJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf-8')); }
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 4)); }

module.exports = {
    name: 'warn',
    description: 'Warn a member',
    async execute(message, args, client) {
        const authorId = message.author.id;
        const isOwner = authorId === OWNER_ID || authorId === SERVER_OWNER; // <-- Updated line
        const isWhitelisted = WHITELIST.includes(authorId);
        const hasRole = message.member.roles.cache.has(WARN_ROLE_ID);

        if (!isOwner && !isWhitelisted && !hasRole) return;

        const targetArg = args[0];
        if (!targetArg) return message.channel.send({ embeds: [new EmbedBuilder().setColor('#2c2f33').setDescription('❌ Please mention a user to warn.')] });

        let target = message.mentions.members.first() 
                    || await message.guild.members.fetch(targetArg).catch(() => null)
                    || message.guild.members.cache.find(m => m.user.username.toLowerCase() === targetArg.toLowerCase());
        if (!target) return message.channel.send({ embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ Member not found.')] });
        if (target.id === authorId) return;

        // Cooldown for normal mods
        if (!isOwner && !isWhitelisted) {
            const cd = cooldowns.get(authorId);
            if (cd && (Date.now() - cd) < 10*60*1000) return message.channel.send({ embeds: [new EmbedBuilder().setColor('#e67e22').setDescription('⏱ Wait 10 minutes between warns.')] });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';
        const warnsData = loadJSON(warnFile);
        const casesData = loadJSON(caseFile);
        const guildId = message.guild.id;
        if (!warnsData[guildId]) warnsData[guildId] = {};
        if (!warnsData[guildId][target.id]) warnsData[guildId][target.id] = [];
        const caseNumber = (casesData[guildId]?.length || 0) + 1;

        const dmEmbed = new EmbedBuilder()
            .setTitle(`⚠️ You have been warned in ${message.guild.name}`)
            .setColor('#f39c12')
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Moderator', value: message.author.tag, inline: true },
                { name: 'Reason', value: reason, inline: true }
            )
            .setFooter({ text: 'MMPANEL • Automated Moderation' })
            .setTimestamp();

        // OWNER/WHITELIST bypass
        if (isOwner || isWhitelisted) {
            await target.send({ embeds: [dmEmbed] }).catch(()=>{});
            warnsData[guildId][target.id].push({ reason, moderator: authorId, date: new Date() });
            saveJSON(warnFile, warnsData);

            const guildCases = casesData[guildId] || [];
            guildCases.push({ case: caseNumber, user: target.id, moderator: authorId, reason, action: 'warn', date: new Date() });
            casesData[guildId] = guildCases;
            saveJSON(caseFile, casesData);

            const modLog = await client.getModLogChannel(message.guild);
            if (modLog) modLog.send({ embeds: [new EmbedBuilder()
                .setTitle('Member Warned')
                .setColor('#f39c12')
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'User', value: target.user.tag, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true },
                    { name: 'Reason', value: reason },
                    { name: 'Case #', value: `#${caseNumber}` }
                )
                .setFooter({ text: 'MMPANEL • Moderation Log' })
                .setTimestamp()
            ]});

            return message.channel.send({ embeds: [new EmbedBuilder().setColor('#27ae60').setDescription(`✅ **${target.user.tag}** warned successfully.`)] });
        }

        // Normal mod: MMPANEL panel
        const userWarns = warnsData[guildId][target.id];
        const warnHistory = userWarns.length ? userWarns.map((w,i)=>`#${i+1}: ${w.reason} (${new Date(w.date).toLocaleDateString()})`).join('\n') : 'No previous warns';

        const embed = new EmbedBuilder()
            .setTitle('⚠️ Warn Confirmation Panel')
            .setColor('#f39c12')
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setDescription(`You are about to **warn <@${target.id}>**\nPlease confirm below.`)
            .addFields(
                { name: 'Target', value: `<@${target.id}>`, inline: true },
                { name: 'Moderator', value: `<@${authorId}>`, inline: true },
                { name: 'Reason', value: reason },
                { name: 'Warn History', value: warnHistory },
                { name: 'Status', value: 'Awaiting confirmation...' },
                { name: 'Case #', value: `#${caseNumber}`, inline: true }
            )
            .setFooter({ text: 'MMPANEL • Confirm to warn' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('warn_confirm').setLabel('Confirm Warn').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('warn_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
            );

        const panel = await message.channel.send({ embeds: [embed], components: [row] });

        const collector = panel.createMessageComponentCollector({ time: 600000 });
        let warned = false;

        collector.on('collect', async interaction => {
            if (interaction.user.id !== authorId) return interaction.reply({ content: 'Only executor can click!', flags: 64 });
            await interaction.deferUpdate();

            if (interaction.customId === 'warn_confirm' && !warned) {
                await target.send({ embeds: [dmEmbed] }).catch(()=>{});
                warnsData[guildId][target.id].push({ reason, moderator: authorId, date: new Date() });
                saveJSON(warnFile, warnsData);

                const guildCases = casesData[guildId] || [];
                guildCases.push({ case: caseNumber, user: target.id, moderator: authorId, reason, action: 'warn', date: new Date() });
                casesData[guildId] = guildCases;
                saveJSON(caseFile, casesData);

                const updated = EmbedBuilder.from(embed).setColor('#27ae60').spliceFields(4,1,{ name:'Status', value:'✅ Member warned' });
                panel.edit({ embeds: [updated], components: [] });

                const modLog = await client.getModLogChannel(message.guild);
                if (modLog) modLog.send({ embeds: [new EmbedBuilder()
                    .setTitle('Member Warned')
                    .setColor('#f39c12')
                    .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: 'User', value: target.user.tag, inline: true },
                        { name: 'Moderator', value: message.author.tag, inline: true },
                        { name: 'Reason', value: reason },
                        { name: 'Case #', value: `#${caseNumber}` }
                    )
                    .setFooter({ text: 'MMPANEL • Moderation Log' })
                    .setTimestamp()
                ]});

                cooldowns.set(authorId, Date.now());
                warned = true;
                collector.stop();
            }

            if (interaction.customId === 'warn_cancel') {
                const cancelled = EmbedBuilder.from(embed).setColor('#7f8c8d').spliceFields(4,1,{ name:'Status', value:'❌ Warn cancelled' });
                panel.edit({ embeds:[cancelled], components:[] }).catch(()=>{});
                collector.stop();
            }
        });

        collector.on('end', collected => {
            if (!collected.size && !warned) {
                const timeout = EmbedBuilder.from(embed).setColor('#95a5a6').spliceFields(4,1,{ name:'Status', value:'⏱ Confirmation timed out.' });
                panel.edit({ embeds:[timeout], components:[] }).catch(()=>{});
            }
        });
    }
};