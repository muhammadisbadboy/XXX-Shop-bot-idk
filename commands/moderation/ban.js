const {    
EmbedBuilder    
} = require('discord.js');    
const fs = require('fs').promises;    
const path = require('path');    

// Owner IDs    
const OWNER_IDS = ['1135999619541774386', '1482041529299112080', '1365013388106666055','1112091588462649364'];    

// Role IDs that can use the ban command
const BAN_PERM = process.env.BAN_PERM ? process.env.BAN_PERM.split(',').map(id => id.trim()) : [];

// Whitelisted users that bypass cooldown
const WHITELIST = process.env.WHITELIST ? process.env.WHITELIST.split(',').map(id => id.trim()) : [];

const COOLDOWN_MS = 30 * 60 * 1000;

const cooldowns = new Map();

module.exports = {
name: 'ban',
description: 'Ban a member with logging and DM.',
async execute(message, args, client) {

const authorId = message.author.id;

// Permission check
if (
!OWNER_IDS.includes(authorId) &&
!message.member.roles.cache.some(role => BAN_PERM.includes(role.id))
) {
return message.channel.send({
embeds: [
new EmbedBuilder()
.setColor('#2b2d31')
.setDescription('❌ You do not have permission to use this command.')
]
});
}

// Cooldown check
if (!OWNER_IDS.includes(authorId) && !WHITELIST.includes(authorId)) {
const lastBan = cooldowns.get(authorId) || 0;
const now = Date.now();

if (now - lastBan < COOLDOWN_MS) {
const remaining = Math.ceil((COOLDOWN_MS - (now - lastBan)) / 60000);

return message.channel.send({
embeds: [
new EmbedBuilder()
.setColor('#e67e22')
.setDescription(`⏱ You are on cooldown. Wait **${remaining} minute(s)**.`)
]
});
}
}

// Input validation
if (!args[0]) {
return message.channel.send({
embeds: [
new EmbedBuilder()
.setColor('#2b2d31')
.setDescription('❌ Provide a mention, username, or ID to ban.')
]
});
}

const reason = args.slice(1).join(' ') || 'No reason provided';

// Resolve target
let target = message.mentions.members.first();

if (!target) {
target = await message.guild.members.fetch(args[0]).catch(() => null);
if (!target) {
target = message.guild.members.cache.find(
m => m.user.username.toLowerCase() === args[0].toLowerCase()
);
}
}

const banId = target ? target.id : args[0];
const targetTag = target?.user?.tag || banId;

// ID validation
if (!/^\d{17,20}$/.test(banId)) {
return message.channel.send({
embeds: [
new EmbedBuilder()
.setColor('#e74c3c')
.setDescription('❌ Invalid user ID.')
]
});
}

// Self ban protection
if (banId === authorId) {
return message.channel.send({
embeds: [
new EmbedBuilder()
.setColor('#e74c3c')
.setDescription('Omfg u cant ban urself dumbfuck')
]
});
}

// Hierarchy protection
if (target && !OWNER_IDS.includes(authorId)) {
const executorRolePos = message.member.roles.highest.position;
const targetRolePos = target.roles.highest.position;

if (targetRolePos >= executorRolePos) {
return message.channel.send({
embeds: [
new EmbedBuilder()
.setColor('#e74c3c')
.setDescription('❌ You cannot ban a member with equal or higher role than you.')
]
});
}
}

// DM embed
const dmEmbed = new EmbedBuilder()
.setTitle(`⚠️ You have been banned from ${message.guild.name}`)
.setColor('#c0392b')
.setDescription(`You were banned by **${message.author.tag}**`)
.addFields(
{ name: 'Reason', value: reason },
{ name: 'Moderator', value: message.author.tag }
)
.setFooter({ text: 'MMPANEL • Automated moderation' })
.setTimestamp();

// Data files
const dataDir = path.join(__dirname, 'data');
await fs.mkdir(dataDir, { recursive: true });

const caseFile = path.join(dataDir, 'cases.json');
const warnFile = path.join(dataDir, 'warns.json');

await Promise.all([
fs.writeFile(caseFile, '{}').catch(() => {}),
fs.writeFile(warnFile, '{}').catch(() => {})
]);

const casesData = JSON.parse(await fs.readFile(caseFile, 'utf8').catch(() => '{}'));
const guildCases = casesData[message.guild.id] || [];
const caseNumber = guildCases.length + 1;

const warnsData = JSON.parse(await fs.readFile(warnFile, 'utf8').catch(() => '{}'));
const userWarns = warnsData[message.guild.id]?.[banId] || [];

const warnHistory = userWarns.length
? userWarns.map((w,i) => `#${i+1}: ${w.reason} (${w.date})`).join('\n')
: 'No previous warns';

try {

// Ban user (works even if not in server)
await message.guild.bans.create(banId, { reason });

// DM user
await client.users.fetch(banId).then(u => {
u.send({ embeds: [dmEmbed] }).catch(() => {});
}).catch(() => {});

// cooldown
if (!WHITELIST.includes(authorId)) cooldowns.set(authorId, Date.now());

// save case
guildCases.push({
case: caseNumber,
user: banId,
moderator: authorId,
reason,
action: 'ban',
date: new Date()
});

casesData[message.guild.id] = guildCases;

await fs.writeFile(caseFile, JSON.stringify(casesData, null, 4));

// mod log
const modLog = await client.getModLogChannel(message.guild);

if (modLog) {
const logEmbed = new EmbedBuilder()
.setTitle('⚠️ BANNED, ez')
.setColor('#c0392b')
.addFields(
{ name: 'User', value: targetTag },
{ name: 'Moderator', value: message.author.tag },
{ name: 'Reason', value: reason },
{ name: 'Case Number', value: `#${caseNumber}` },
{ name: 'Warn History', value: warnHistory }
)
.setTimestamp();

modLog.send({ embeds: [logEmbed] });
}

return message.channel.send({
embeds: [
new EmbedBuilder()
.setColor('#27ae60')
.setDescription(`✅ **${targetTag}** has been banned.`)
]
});

} catch (err) {

console.error(err);

return message.channel.send({
embeds: [
new EmbedBuilder()
.setColor('#e74c3c')
.setDescription('❌ Failed to ban. Check permissions or ID.')
]
});

}

}
};