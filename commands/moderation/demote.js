const { EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// ENV
const OWNER_ID = process.env.OWNER_ID;
const WHITELIST = process.env.WHITELIST?.split(',') || [];
const PROMOTE_PERM = process.env.PROMOTE_PERM;
const PREFIXES = process.env.PREFIXES?.split(',') || [];
const COOLDOWN_MS = 20 * 60 * 1000;

// Roles from ENV
const roleList = [];
for (let i = 1; i <= 12; i++) {
    if (process.env[`ROLE${i}`]) roleList.push(process.env[`ROLE${i}`]);
}

// Example key permissions to track
const KEY_PERMISSIONS = ['Administrator', 'ManageGuild', 'ManageRoles', 'KickMembers', 'BanMembers'];

// Cooldown tracker
const cooldowns = new Map();

// Anti-mass promotion tracker
const promotionTracker = new Map();
const MASS_LIMIT = 3;
const MASS_TIME = 2 * 60 * 1000; // 2 minutes

module.exports = {
name: 'promote',
description: 'Promote a user with role progression, DM, and OWNER notification.',
async execute(message, args, client) {

const executorId = message.author.id;

// ----------------------
// Permission check
// ----------------------
if (executorId !== OWNER_ID && !message.member.roles.cache.some(r => r.name === PROMOTE_PERM) && !WHITELIST.includes(executorId)) {
return message.channel.send({
embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ You do not have permission.')]
});
}

// ----------------------
// Cooldown check
// ----------------------
if (executorId !== OWNER_ID && !WHITELIST.includes(executorId)) {
const lastUse = cooldowns.get(executorId) || 0;
const now = Date.now();
if (now - lastUse < COOLDOWN_MS) {
const remaining = Math.ceil((COOLDOWN_MS - (now - lastUse)) / 60000);
return message.channel.send({
embeds: [new EmbedBuilder().setColor('#e67e22').setDescription(`⏱ You are on cooldown. Wait **${remaining} minute(s)**.`)]
});
}
}

// ----------------------
// Anti-Mass Promotion Protection
// ----------------------
if (executorId !== OWNER_ID) {

const now = Date.now();
const history = promotionTracker.get(executorId) || [];

const recent = history.filter(t => now - t < MASS_TIME);

if (recent.length >= MASS_LIMIT) {

return message.channel.send({
embeds: [
new EmbedBuilder()
.setColor('#e74c3c')
.setTitle('🚨 Anti-Raid Protection')
.setDescription('Too many promotions detected. Promotions temporarily blocked.')
]
});
}

recent.push(now);
promotionTracker.set(executorId, recent);
}

// ----------------------
// Usage
// ----------------------
if (!args[0] || !args[1]) {
return message.channel.send({
embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ Usage: .promote @user <role/roleid>')]
});
}

// Resolve target
let target = message.mentions.members.first();
if (!target) target = await message.guild.members.fetch(args[0]).catch(() => null);

if (!target) {
return message.channel.send({
embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ Could not find that user.')]
});
}

// Resolve role
let roleId = args[1];
if (!roleList.includes(roleId)) {
const roleObj = message.guild.roles.cache.get(roleId) || message.guild.roles.cache.find(r => r.name.toLowerCase() === args[1].toLowerCase());
if (!roleObj) return message.channel.send({ embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ Could not find that role.')] });
roleId = roleObj.id;
}

const roleIndex = roleList.indexOf(roleId);

if (roleIndex === -1) {
return message.channel.send({
embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ Role not in configured role list.')]
});
}

// OWNER protection for ROLE12
if (roleIndex === 11 && executorId !== OWNER_ID) {
return message.channel.send({
embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ Only OWNER can give that role.')]
});
}

// ----------------------
// Progress Panel
// ----------------------
const progressEmbed = new EmbedBuilder()
.setTitle('Promotion Progress')
.setColor('#3498db')
.setDescription(`Starting promotion of **${target.user.tag}**...`)
.setTimestamp();

const panel = await message.channel.send({ embeds: [progressEmbed] });

// ----------------------
// Promotion logic
// ----------------------
const rolesToGive = roleList.slice(0, roleIndex + 1).map(id => message.guild.roles.cache.get(id)).filter(Boolean);

const prevPerms = target.permissions.toArray();
const rolesAssigned = [];

for (let i = 0; i < rolesToGive.length; i++) {

const role = rolesToGive[i];

try {
await target.roles.add(role);
rolesAssigned.push(role.name);

const embed = new EmbedBuilder()
.setTitle('Promotion Progress')
.setColor('#3498db')
.setDescription(`Promoting **${target.user.tag}**`)
.addFields({
name: 'Roles Assigned',
value: rolesAssigned.join(', ') || 'None'
})
.setTimestamp();

await panel.edit({ embeds: [embed] }).catch(()=>{});

} catch(err){
console.error(err);
}
}

// ----------------------
// DM promoted user
// ----------------------
const userEmbed = new EmbedBuilder()
.setTitle('🎉 Congratulations!')
.setColor('#2ecc71')
.setDescription(`You have been promoted to the following roles:\n**${rolesAssigned.join(', ')}**`)
.setFooter({ text: `Promoted by ${message.member.user.tag}` })
.setTimestamp();

target.send({ embeds: [userEmbed] }).catch(()=>{});

// ----------------------
// DM OWNER_ID
// ----------------------
if (OWNER_ID) {

const owner = await client.users.fetch(OWNER_ID).catch(()=>null);

if (owner) {

const newPerms = target.permissions.toArray();

const granted = newPerms.filter(p => !prevPerms.includes(p) && KEY_PERMISSIONS.includes(p));
const removed = prevPerms.filter(p => !newPerms.includes(p) && KEY_PERMISSIONS.includes(p));

const deltaEmbed = new EmbedBuilder()
.setTitle(`Promotion Info: ${target.user.tag}`)
.setColor('#3498db')
.addFields(
{ name: 'Roles Given', value: rolesAssigned.join(', ') },
{ name: 'New Key Permissions', value: granted.length ? granted.join(', ') : 'None' },
{ name: 'Removed Key Permissions', value: removed.length ? removed.join(', ') : 'None' }
)
.setTimestamp();

owner.send({ embeds: [deltaEmbed] }).catch(()=>{});
}
}

// ----------------------
// Finalize
// ----------------------
const finalEmbed = new EmbedBuilder()
.setTitle('Promotion Complete')
.setColor('#2ecc71')
.setDescription(`✅ ${target.user.tag} has been promoted successfully!`)
.addFields({ name: 'Roles Assigned', value: rolesAssigned.join(', ') });

await panel.edit({ embeds: [finalEmbed], components: [] }).catch(()=>{});

// Apply cooldown
if (executorId !== OWNER_ID && !WHITELIST.includes(executorId)) cooldowns.set(executorId, Date.now());

}
};