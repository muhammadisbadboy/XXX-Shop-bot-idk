const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Updated fixed IDs
const OWNER_ID = '1112091588462649364';
const SERVER_OWNER = '1135999619541774386';
const WARN_ROLE_ID = process.env.WARN_PERM; 
const WHITELIST = process.env.WHITELIST?.split(',') || [];

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const warnFile = path.join(dataDir, 'warns.json');
if (!fs.existsSync(warnFile)) fs.writeFileSync(warnFile, '{}');

function loadJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf-8')); }

module.exports = {
    name: 'warnings',
    description: 'Show warnings of a member',
    async execute(message, args) {
        const authorId = message.author.id;

        // Permission check: OWNER, SERVER_OWNER, WHITELIST, or has role
        const isOwner = authorId === OWNER_ID || authorId === SERVER_OWNER;
        const isWhitelisted = WHITELIST.includes(authorId);
        const hasRole = message.member.roles.cache.has(WARN_ROLE_ID);

        if (!isOwner && !isWhitelisted && !hasRole) return;

        const targetArg = args[0] || message.author.id;
        let target = message.mentions.members.first() 
                    || await message.guild.members.fetch(targetArg).catch(() => null)
                    || message.guild.members.cache.find(m => m.user.username.toLowerCase() === targetArg.toLowerCase());
        if (!target) return message.channel.send({ embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ Member not found.')] });

        const warnsData = loadJSON(warnFile);
        const userWarns = warnsData[message.guild.id]?.[target.id] || [];

        const embed = new EmbedBuilder()
            .setTitle(`⚠️ Warnings for ${target.user.tag}`)
            .setColor('#f39c12')
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setDescription(userWarns.length ? userWarns.map((w,i)=>`#${i+1}: ${w.reason} (${new Date(w.date).toLocaleDateString()})`).join('\n') : 'No warnings')
            .setFooter({ text: 'MMPANEL • Warnings List' })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};