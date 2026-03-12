const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ss',
    description: 'Display a screenshot or image in an embed.',
    async execute(message, args) {

        // ----------------------
        // Resolve target user
        // ----------------------
        const target = message.mentions.users.first();
        if (!target) {
            return message.channel.send('❌ Please mention a user!');
        }

        // ----------------------
        // Dynamic display text
        // ----------------------
        const displayText = ` **${message.author} fucked ${target}** for the **1st time**`; 
        // <-- Highlight this for text; @user1 = message.author, @user2 = target

        // ----------------------
        // INSERT IMAGE LINK HERE
        // ----------------------
        const imageLink = 'https://media.discordapp.net/attachments/1480184670606983240/1481755017307357395/fuck10.gif?ex=69b47765&is=69b325e5&hm=a7383b9f7eeeba43c8d74ffa1782a6a3994b6cab34bb584ba62f5851b8ccc7bf&='; 
        // <-- Highlight this for image

        // ----------------------
        // Create embed
        // ----------------------
        const embed = new EmbedBuilder()
            .setTitle(`Screenshot / Image for ${target.tag}`)
            .setDescription(displayText)
            .setColor('#3498db')
            .setTimestamp()
            .setImage(imageLink) // Big image at the bottom

        // ----------------------
        // Send embed
        // ----------------------
        message.channel.send({ embeds: [embed] });
    }
};