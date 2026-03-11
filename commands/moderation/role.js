const { EmbedBuilder } = require('discord.js');

const ALLOWED_IDS = [
    '1112091588462649364', // OWNER_ID
    '1135999619541774386'  // SERVER_OWNER
];

module.exports = {
    name: 'role',
    description: 'Add or remove roles (OWNER or SERVER_OWNER only)',
    async execute(message, args, client) {
        // Only OWNER_ID or SERVER_OWNER can use this
        if (!ALLOWED_IDS.includes(message.author.id)) return message.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor('#e74c3c')
                    .setDescription('❌ You are not allowed to use this command.')
            ]
        });

        if (!args[0] || !['add', 'remove'].includes(args[0].toLowerCase())) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#e67e22')
                        .setDescription('❌ Usage: `.role add/remove @user <role>`')
                ]
            });
        }

        const action = args[0].toLowerCase();
        const target = message.mentions.members.first() || await message.guild.members.fetch(args[1]).catch(() => null);
        if (!target) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#e74c3c')
                        .setDescription('❌ Could not find the user.')
                ]
            });
        }

        const roleArg = args[2];
        if (!roleArg) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#e67e22')
                        .setDescription('❌ Please specify a role (ID or mention).')
                ]
            });
        }

        // Resolve role
        let role = message.guild.roles.cache.get(roleArg.replace(/[<@&>]/g, '')) 
                   || message.guild.roles.cache.find(r => r.name.toLowerCase() === roleArg.toLowerCase());
        if (!role) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#e74c3c')
                        .setDescription('❌ Role not found.')
                ]
            });
        }

        // Check bot can manage role
        if (role.position >= message.guild.members.me.roles.highest.position) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#e74c3c')
                        .setDescription('❌ I cannot manage this role, it is higher than my highest role.')
                ]
            });
        }

        try {
            if (action === 'add') {
                await target.roles.add(role);
            } else {
                await target.roles.remove(role);
            }

            const embed = new EmbedBuilder()
                .setColor(action === 'add' ? '#27ae60' : '#e74c3c')
                .setTitle(`Role ${action === 'add' ? 'Added' : 'Removed'}`)
                .setDescription(`${action === 'add' ? 'Gave' : 'Removed'} **${role.name}** ${action === 'add' ? 'to' : 'from'} <@${target.id}>`)
                .addFields(
                    { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
                    { name: 'Role', value: role.name, inline: true },
                    { name: 'Moderator', value: message.author.tag, inline: true }
                )
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });

            // DM target
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle(`Role ${action === 'add' ? 'Added' : 'Removed'}`)
                    .setDescription(`A role has been ${action === 'add' ? 'added to' : 'removed from'} your account.`)
                    .addFields({ name: 'Role', value: role.name, inline: true })
                    .setColor(action === 'add' ? '#27ae60' : '#e74c3c')
                    .setTimestamp();
                await target.send({ embeds: [dmEmbed] });
            } catch {}

        } catch (err) {
            console.error(err);
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#e74c3c')
                        .setDescription('❌ Failed to add/remove the role. Check my permissions.')
                ]
            });
        }
    }
};