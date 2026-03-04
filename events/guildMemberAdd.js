const { EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        try {
            // 1️⃣ Check if 'welcome' channel exists
            let channel = member.guild.channels.cache.find(
                c => c.name === 'welcome' && c.type === ChannelType.GuildText
            );

            // 2️⃣ If not, create it
            if (!channel) {
                channel = await member.guild.channels.create({
                    name: 'welcome',
                    type: ChannelType.GuildText,
                    reason: 'Auto-created welcome channel',
                });
            }

            // 3️⃣ Generate random professional-style welcome messages
            const welcomes = [
                `🛡️ Attention! ${member} has joined our secure realm.`,
                `🔐 New recruit detected: ${member}, proceed with caution.`,
                `⚡ ${member} entered the MM domain — stay sharp.`,
                `👑 ${member} is now part of the trusted circle.`,
                `💥 ${member}, welcome to the most elite MM server.`
            ];
            const randomMsg = welcomes[Math.floor(Math.random() * welcomes.length)];

            // 4️⃣ Professional MM-style panel design
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

            // 5️⃣ Send the embed
            channel.send({ content: `<@${member.id}>`, embeds: [embed] });
        } catch (err) {
            console.error('Error in guildMemberAdd event:', err);
        }
    },
};