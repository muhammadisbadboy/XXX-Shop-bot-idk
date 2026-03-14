const { EmbedBuilder } = require('discord.js');

module.exports = {
    // ----------------------
    // CHANGE THIS TO RENAME THE COMMAND
    // ----------------------
    name: 'hi', // <-- You can change this to anything like 'screenshot' or 'image'
    description: 'Display a screenshot or image in an embed.',

    async execute(message, args) {

        // ----------------------
        // Get the mentioned user
        // ----------------------
        const target = message.mentions.users.first();
        if (!target) return message.channel.send('❌ Mention the bud u wanna !');

        // ----------------------
        // DISPLAY TEXT (editable)
        // ----------------------
        const displayText = ` **${message.author}  ${target}** for the **1st time**. It was hard icl`;
        // <-- Edit this line to change the text format

        // ----------------------
        // IMAGE LINK (editable)
        // ----------------------
        const imageLink = 'https://cdn.discordapp.com/attachments/1482399653021356093/1482402868429586452/fuck2.gif?ex=69b6d2c1&is=69b58141&hm=c0b2cdaec84122c32b62a7e6a6619ade6438e545c9137f8e758dd5ad4ae12cee&'

        // ----------------------
        // Create the embed
        // ----------------------
        const embed = new EmbedBuilder()
            .setTitle(`${message.author}`)
            .setDescription(displayText)
            .setColor('#3498db')
            .setTimestamp()
            .setImage(imageLink); // Big image at the bottom

        // ----------------------
        // Send the embed
        // ----------------------
        message.channel.send({ embeds: [embed] });
    }
};