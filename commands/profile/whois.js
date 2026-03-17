const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'whois',
    aliases: ['w'],
    description: 'Get information about a user',
    usage: '[user]',
    async execute(message, args) {
        try {
            const member = message.mentions.members.first() || message.member;
            const user = member.user;

            const embed = new MessageEmbed()
                .setTitle(`User Info: ${user.tag}`)
                .setColor('RANDOM')
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 4096 }))
                .addFields(
                    { name: 'ID', value: user.id, inline: true },
                    { name: 'Status', value: member.presence?.status || 'offline', inline: true },
                    { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                    { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: 'Roles', value: member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.name).join(', ') || 'None' }
                )
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            message.channel.send('⚠️ Could not fetch user info. Make sure the user exists!');
        }
    },
};