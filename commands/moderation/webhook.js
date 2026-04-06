const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'webhook',
    description: 'Send message via webhook (admin only, clean, supports long text)',
    async execute(message, args) {

        // 🔒 Admin only
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ You need Administrator to use this.');
        }

        if (!args.length) {
            return message.reply('❌ Provide a message to send.');
        }

        let text = args.join(' ');

        // Delete original message
        try { await message.delete(); } catch {}

        try {
            // Create webhook
            const webhook = await message.channel.createWebhook({
                name: message.member.displayName,
                avatar: message.author.displayAvatarURL()
            });

            // 📏 Discord limit = 2000 chars → split if needed
            const chunks = text.match(/[\s\S]{1,2000}/g);

            for (const chunk of chunks) {
                await webhook.send({
                    content: chunk,
                    allowedMentions: { parse: ['everyone'] } // allows @everyone/@here cleanly
                });
            }

            // Delete webhook after sending
            await webhook.delete();

        } catch (err) {
            console.error(err);
            return message.channel.send('❌ Failed to send webhook message.');
        }
    },
};