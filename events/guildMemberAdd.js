const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        try {
            // 1️⃣ Get the fixed welcome channel by ID
            const channelId = '1478783015017648259';
            const channel = await member.guild.channels.fetch(channelId).catch(() => null);
            if (!channel) return; // If channel not found, exit silently

            // 2️⃣ Generate random professional-style welcome messages
            const welcomes = [
                `🛡️ Attention! ${member} has joined our secure realm.`,
                `🔐 New recruit detected: ${member}, proceed with caution.`,
                `⚡ ${member} entered the MM domain — stay sharp.`,
                `👑 ${member} is now part of the trusted circle.`,
                `💥 ${member}, welcome to the most elite MM server.`
            ];
            const randomMsg = welcomes[Math.floor(Math.random() * welcomes.length)];

            // 3️⃣ Professional MM-style embed
            const embed = new EmbedBuilder()
                .setTitle('🛡️ Welcome to the MM Server')
                .setDescription(randomMsg)
                .setColor('#1F1F2E') // dark professional tone
                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Server', value: member.guild.name, inline: true },
                    { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true },
                    { name: 'Trust Level', value: '🔹 Pending Verification', inline: true }
                )
                .setFooter({ text: 'Prepare yourself — MM operations await.' })
                .setTimestamp();

            // 4️⃣ Send the embed in the fixed channel
            channel.send({ content: `<@${member.id}>`, embeds: [embed] });
        } catch (err) {
            console.error('Error in guildMemberAdd event:', err);
        }
    },
};