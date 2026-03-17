const { MessageAttachment, MessageEmbed } = require('discord.js');
const Canvas = require('@napi-rs/canvas');

module.exports = {
    name: 'avatar',
    aliases: ['av', 'pfp'],
    description: 'Display a user\'s avatar in a creative 4K panel',
    usage: '[user]',
    async execute(message, args) {
        try {
            // User mention or default to message author
            const user = message.mentions.users.first() || message.author;

            // 4K Canvas
            const canvas = Canvas.createCanvas(3840, 2160);
            const ctx = canvas.getContext('2d');

            // Gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#6a11cb');
            gradient.addColorStop(1, '#2575fc');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Shadow & glow effect
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 50;

            // Draw avatar circle
            const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: 'png', size: 4096 }));
            const size = 800;
            const x = canvas.width / 2;
            const y = canvas.height / 2;
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, x - size / 2, y - size / 2, size, size);

            // Overlay glow circle
            ctx.strokeStyle = '#ffffff88';
            ctx.lineWidth = 20;
            ctx.beginPath();
            ctx.arc(x, y, size / 2 + 10, 0, Math.PI * 2);
            ctx.stroke();

            // Export attachment
            const attachment = new MessageAttachment(await canvas.encode('png'), 'avatar.png');

            // Embed
            const embed = new MessageEmbed()
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