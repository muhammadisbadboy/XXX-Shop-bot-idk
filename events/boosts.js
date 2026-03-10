const { EmbedBuilder, Events } = require('discord.js');

module.exports = {
    name: Events.GuildBoost,
    async execute(guild, booster) {
        try {
            // 1️⃣ Fetch the fixed boosts channel
            const channelId = '1479043884301553664';
            const channel = await guild.channels.fetch(channelId).catch(() => null);
            if (!channel) return; // Exit if channel not found

            // 2️⃣ Generate a professional boost message
            const messages = [
                `🚀 ${booster} just boosted the server! We appreciate your support.`,
                `💎 ${booster} has enhanced our realm with a boost — thank you!`,
                `✨ Server power increased! ${booster} contributed a boost. Stay legendary.`,
                `⚡ ${booster} is now officially powering up the MM server!`,
                `🔥 ${booster}, your boost has been recognized. Welcome to the elite circle!`
            ];
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];

            // 3️⃣ Build the professional embed
            const embed = new EmbedBuilder()
                .setTitle('🚀 Server Boost Alert!')
                .setDescription(randomMsg)
                .setColor('#FFD700') // golden boost theme
                .setImage('https://media.discordapp.net/attachments/1480184670606983240/1481043469962186846/file_00000000c2e87246a7a433b0c17cd064.png?ex=69b1e0b7&is=69b08f37&hm=ec9f33fd0ccfb6cf59ca892d689d1802270eb68208ccc066e905987fd2ef7132&=&format=webp&quality=lossless&width=1197&height=798')
                .addFields(
                    { name: 'Booster', value: `${booster}`, inline: true },
                    { name: 'Server', value: guild.name, inline: true },
                    { name: 'Total Boosts', value: `${guild.premiumSubscriptionCount}`, inline: true }
                )
                .setFooter({ text: 'Thank you for supporting Trade Market !' })
                .setTimestamp();

            // 4️⃣ Send the embed in the fixed boosts channel
            channel.send({ embeds: [embed] });

        } catch (err) {
            console.error('Error in guildBoost event:', err);
        }
    },
};