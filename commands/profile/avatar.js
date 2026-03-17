const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'avatar',
    aliases: ['av', 'pfp'],
    description: 'Display a user\'s avatar',
    usage: '[user]',
    async execute(message, args) {
        try {
            const user = message.mentions.users.first() || message.author;

            const embed = new MessageEmbed()
                .setTitle(`${user.tag}'s Avatar`)
                .setColor('RANDOM')
                .setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }))
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            message.channel.send('⚠️ Could not fetch avatar. Make sure the user exists!');
        }
    },
};