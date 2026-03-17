const { MessageAttachment, EmbedBuilder } = require('discord.js');
const Canvas = require('@napi-rs/canvas');

module.exports = {
    name: 'avatar',
    aliases: ['av', 'pfp'],
    description: 'Show a user\'s avatar in a creative 4K panel',
    usage: '[user]',
    async execute(message, args) {
        try {
            const user = message.mentions.users.first() || message.author;

            // Ensure avatar URL is PNG and 4096
            const avatarURL = user.displayAvatarURL({ format: 'png', size: 4096 });

            // Create 4K canvas
            const canvas = Canvas.createCanvas(3840, 2160);
            const ctx = canvas.getContext('2d');

            // Background gradient
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#6a11cb');
            gradient.addColorStop(1, '#2575fc');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Load avatar image
            const avatar = await Canvas.loadImage(avatarURL);

            // Draw circle avatar
            const size = 800;
            const x = canvas.width / 2;
            const y = canvas.height / 2;
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, x - size / 2, y - size / 2, size, size);

            // Glow outline
            ctx.strokeStyle = '#ffffff88';
            ctx.lineWidth = 20;
            ctx.beginPath();
            ctx.arc(x, y, size / 2 + 10, 0, Math.PI * 2);
            ctx.stroke();

            // Export image
            const attachment = new MessageAttachment(await canvas.encode('png'), 'avatar.png');

            // Embed
            const embed = new EmbedBuilder()
                .setTitle(`${user.tag}'s Avatar`)
                .setColor('#00ffea')
                .setImage('attachment://avatar.png')
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            await message.channel.send({ embeds: [embed], files: [attachment] });

        } catch (err) {
            console.error(err);
            message.channel.send('⚠️ Could not generate avatar. Make sure the user exists and has a valid avatar!');
        }
    },
};