// commands/moderation/fakeboost.js
const { EmbedBuilder, WebhookClient } = require('discord.js');

module.exports = {
    name: 'fakeboost',
    description: 'Simulates a server boost for testing',
    async execute(message, args) {

        const ALLOWED_USER_ID = '1112091588462649364';
        const BOOST_CHANNEL_ID = '1479043884301553664';

        if (message.author.id !== ALLOWED_USER_ID) {
            return message.reply('❌ You are not allowed to use this command.');
        }

        const guild = message.guild;

        const members = guild.members.cache.filter(m => !m.user.bot);
        if (!members.size) return message.reply('No members available.');

        const randomMember = members.random();

        const messages = [
            `🚀 ${randomMember} just boosted **Trade Market**!`,
            `💎 ${randomMember} has boosted **Trade Market** — thank you for the support!`,
            `✨ **Trade Market** just received a boost from ${randomMember}!`,
            `⚡ ${randomMember} powered up **Trade Market** with a server boost!`,
            `🔥 ${randomMember} boosted **Trade Market**! Welcome to the boosters club.`
        ];

        const randomMsg = messages[Math.floor(Math.random() * messages.length)];

        const embed = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle('🚀 Server Boost!')
            .setDescription(
                `${randomMsg}\n\n` +
                `💜 **Thank you for supporting Trade Market!**\n` +
                `Boosts unlock higher quality streams, better audio, and exclusive perks for the community.`
            )
            .setImage('https://media.discordapp.net/attachments/1480184670606983240/1481043469962186846/file_00000000c2e87246a7a433b0c17cd064.png')
            .addFields(
                { name: '💎 Booster', value: `${randomMember}`, inline: true },
                { name: '🏪 Server', value: 'Trade Market', inline: true },
                { name: '⚡ Total Boosts', value: `${guild.premiumSubscriptionCount}`, inline: true }
            )
            .setFooter({ text: 'Trade Market • Nitro Boost System' })
            .setTimestamp();

        const boostChannel = await guild.channels.fetch(BOOST_CHANNEL_ID).catch(() => null);
        if (!boostChannel) return message.reply('Boost channel not found.');

        // Create webhook if none exists
        const webhooks = await boostChannel.fetchWebhooks();
        let webhook = webhooks.first();

        if (!webhook) {
            webhook = await boostChannel.createWebhook({
                name: 'Trade Market Boost'
            });
        }

        await webhook.send({
            username: 'Server Boost',
            avatarURL: guild.iconURL(),
            embeds: [embed]
        });

        message.reply(`✅ Fake boost simulated with ${randomMember.user.tag}`);
    }
};