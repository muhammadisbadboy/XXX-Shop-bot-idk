// commands/moderation/fakeboost.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'fakeboost',
    description: 'Simulates a server boost for testing the panel',
    async execute(message, args) {
        const ALLOWED_USER_ID = '1112091588462649364';
        const BOOST_CHANNEL_ID = '1479043884301553664';

        if (message.author.id !== ALLOWED_USER_ID) {
            return message.reply('❌ You are not allowed to use this command.');
        }

        const guild = message.guild;

        // Get all non-bot members
        const members = guild.members.cache.filter(m => !m.user.bot);
        if (!members.size) return message.reply('No members available to fake boost.');

        // Pick random member
        const randomMember = members.random();

        // Generate embed like real boost
        const messages = [
            `🚀 ${randomMember} just boosted the server! We appreciate your support.`,
            `💎 ${randomMember} has enhanced our realm with a boost — thank you!`,
            `✨ Server power increased! ${randomMember} contributed a boost. Stay legendary.`,
            `⚡ ${randomMember} is now officially powering up the MM server!`,
            `🔥 ${randomMember}, your boost has been recognized. Welcome to the elite circle!`
        ];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];

        const embed = new EmbedBuilder()
            .setTitle('🚀 Server Boost Alert!')
            .setDescription(randomMsg)
            .setColor('#FFD700')
            .setImage('https://cdn.discordapp.com/attachments/1465701908780945521/1479046250501378118/IMG-20260305-WA0004.jpg?ex=69aa9ca9&is=69a94b29&hm=aee4780f2bbd23c9c7fac73d694d3757a274e6b760884dedb676f2b32e9812df&')
            .addFields(
                { name: 'Booster', value: `${randomMember}`, inline: true },
                { name: 'Server', value: guild.name, inline: true },
                { name: 'Total Boosts', value: `${guild.premiumSubscriptionCount}`, inline: true }
            )
            .setFooter({ text: 'Testing MM Boost Panel • Kai Kingdom' })
            .setTimestamp();

        const boostChannel = await guild.channels.fetch(BOOST_CHANNEL_ID).catch(() => null);
        if (!boostChannel) return message.reply('Boost channel not found.');

        boostChannel.send({ embeds: [embed] });
        message.reply(`✅ Fake boost simulated with ${randomMember.user.tag}`);
    }
};