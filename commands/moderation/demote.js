const { EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;

// ENV
const OWNER_ID = process.env.OWNER_ID;
const WHITELIST = process.env.WHITELIST?.split(',') || [];
const PROMOTE_PERM = process.env.PROMOTE_PERM?.split(',').map(id => id.trim()) || [];
const COOLDOWN_MS = 20 * 60 * 1000;

// Roles from ENV
const roleList = [];
for (let i = 1; i <= 12; i++) {
    if (process.env[`ROLE${i}`]) roleList.push(process.env[`ROLE${i}`]);
}

// Cooldown & Anti-mass
const cooldowns = new Map();
const demotionTracker = new Map();
const MASS_LIMIT = 3;
const MASS_TIME = 2 * 60 * 1000; // 2 minutes

// Helper: check if member has permission
function hasPromotePerm(member) {
    return member.roles.cache.some(role => PROMOTE_PERM.includes(role.id));
}

module.exports = {
    name: 'demote',
    description: 'Demote a user by removing roles, with DM and OWNER notification.',
    async execute(message, args, client) {

        const executorId = message.author.id;

        // ----------------------
        // Permission check
        // ----------------------
        if (executorId !== OWNER_ID && !hasPromotePerm(message.member) && !WHITELIST.includes(executorId)) {
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
        // Anti-mass demotion protection
        // ----------------------
        if (executorId !== OWNER_ID) {
            const now = Date.now();
            const history = demotionTracker.get(executorId) || [];
            const recent = history.filter(t => now - t < MASS_TIME);

            if (recent.length >= MASS_LIMIT) {
                return message.channel.send({
                    embeds: [
                        new EmbedBuilder()
                        .setColor('#e74c3c')
                        .setTitle('🚨 Anti-Raid Protection')
                        .setDescription('Too many demotions detected. Demotions temporarily blocked.')
                    ]
                });
            }

            recent.push(now);
            demotionTracker.set(executorId, recent);
        }

        // ----------------------
        // Usage
        // ----------------------
        if (!args[0] || !args[1]) {
            return message.channel.send({
                embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ Usage: .demote @user <role/roleid>')]
            });
        }

        // ----------------------
        // Resolve target
        // ----------------------
        let target = message.mentions.members.first();
        if (!target) target = await message.guild.members.fetch(args[0]).catch(() => null);
        if (!target) {
            return message.channel.send({
                embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ Could not find that user.')]
            });
        }

        // ----------------------
        // Resolve role
        // ----------------------
        let roleId = args[1];
        if (!roleList.includes(roleId)) {
            const roleObj = message.guild.roles.cache.get(roleId) || message.guild.roles.cache.find(r => r.name.toLowerCase() === args[1].toLowerCase());
            if (!roleObj) return message.channel.send({ embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ Could not find that role.')] });
            roleId = roleObj.id;
        }

        const roleIndex = roleList.indexOf(roleId);
        if (roleIndex === -1) return message.channel.send({ embeds: [new EmbedBuilder().setColor('#e74c3c').setDescription('❌ Role not in configured role list.')] });

        // ----------------------
        // Progress Panel
        // ----------------------
        const progressEmbed = new EmbedBuilder()
            .setTitle('Demotion Progress')
            .setColor('#e74c3c')
            .setDescription(`Starting demotion of **${target.user.tag}**...`)
            .setTimestamp();

        const panel = await message.channel.send({ embeds: [progressEmbed] });

        // ----------------------
        // Demotion logic
        // ----------------------
        const rolesToRemove = roleList.slice(roleIndex, roleList.length).map(id => message.guild.roles.cache.get(id)).filter(Boolean);
        const rolesRemoved = [];

        for (let i = 0; i < rolesToRemove.length; i++) {
            const role = rolesToRemove[i];

            try {
                await target.roles.remove(role);
                rolesRemoved.push(role.name);

                const embed = new EmbedBuilder()
                    .setTitle('Demotion Progress')
                    .setColor('#e74c3c')
                    .setDescription(`Demoting **${target.user.tag}**`)
                    .addFields({ name: 'Roles Removed', value: rolesRemoved.join(', ') || 'None' })
                    .setTimestamp();

                await panel.edit({ embeds: [embed] }).catch(() => {});
            } catch (err) {
                console.error(err);
            }
        }

        // ----------------------
        // DM demoted user
        // ----------------------
        const userEmbed = new EmbedBuilder()
            .setTitle('⚠️ You have been demoted')
            .setColor('#c0392b')
            .setDescription(`The following roles were removed:\n**${rolesRemoved.join(', ')}**`)
            .setFooter({ text: `Demoted by ${message.member.user.tag}` })
            .setTimestamp();

        target.send({ embeds: [userEmbed] }).catch(() => {});

        // ----------------------
        // DM OWNER
        // ----------------------
        if (OWNER_ID) {
            const owner = await client.users.fetch(OWNER_ID).catch(() => null);
            if (owner) {
                const deltaEmbed = new EmbedBuilder()
                    .setTitle(`Demotion Info: ${target.user.tag}`)
                    .setColor('#e74c3c')
                    .addFields({ name: 'Roles Removed', value: rolesRemoved.join(', ') })
                    .setTimestamp();
                owner.send({ embeds: [deltaEmbed] }).catch(() => {});
            }
        }

        // ----------------------
        // Finalize
        // ----------------------
        const finalEmbed = new EmbedBuilder()
            .setTitle('Demotion Complete')
            .setColor('#c0392b')
            .setDescription(`✅ ${target.user.tag} has been demoted successfully!`)
            .addFields({ name: 'Roles Removed', value: rolesRemoved.join(', ') });

        await panel.edit({ embeds: [finalEmbed], components: [] }).catch(() => {});

        // Apply cooldown
        if (executorId !== OWNER_ID && !WHITELIST.includes(executorId)) cooldowns.set(executorId, Date.now());
    }
};