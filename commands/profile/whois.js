const { MessageAttachment, MessageEmbed } = require('discord.js');
const Canvas = require('@napi-rs/canvas');

module.exports = {
    name: 'whois',
    aliases: ['w'],
    description: 'Get detailed user info in a creative 4K panel',
    usage: '[user]',
    async execute(message, args) {
        try {
            const member = message.mentions.members.first() || message.member;

            // 4K Canvas
            const canvas = Canvas.createCanvas(3840, 2160);
            const ctx = canvas.getContext('2d');

            // Background gradient
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#ff7e5f');
            gradient.addColorStop(1, '#feb47b');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Shadow/glow
            ctx.shadowColor = '#00000088';
            ctx.shadowBlur = 50;

            // Avatar circle
            const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ format: 'png', size: 4096 }));
            const size = 800;
            const x = canvas.width / 2;
            const y = 800;
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, x - size / 2, y - size / 2, size, size);

            // Draw username above avatar
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 150px Sans';
            ctx.textAlign = 'center';
            ctx.fillText(member.user.tag, canvas.width / 2, 300);

            // Draw roles as badges below avatar
            const roles = member.roles.cache
                .filter(r => r.name !== '@everyone')
                .map(r => r.name);
            ctx.font = 'bold 80px Sans';
            roles.forEach((role, i) => {
                ctx.fillStyle = '#ffffffcc';
                ctx.fillText(role, canvas.width / 2, y + size / 2 + 100 + i * 90);
            });

            // Export attachment
            const attachment = new MessageAttachment(await canvas.encode('png'), 'whois.png');

            // Embed
            const embed = new MessageEmbed()
                .setTitle(`User Info: ${member.user.username}`)
                .setColor('#ffb700')
                .setDescription(
                    `**ID:** ${member.id}\n` +
                    `**Status:** ${member.presence?.status || 'offline'}\n` +
                    `**Joined Server:** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>\n` +
                    `**Account Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`
                )
                .setImage('attachment://whois.png')
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            await message.channel.send({ embeds: [embed], files: [attachment] });

        } catch (err) {
            console.error(err);
            message.channel.send('⚠️ Could not fetch user info. Make sure the user exists!');
        }
    },
};