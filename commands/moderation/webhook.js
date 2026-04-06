const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'webhook',
    description: 'Send message via webhook (admin only, preserves formatting)',
    async execute(message) {

        // 🔒 Admin only
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ You need Administrator to use this.');
        }

        // Get RAW message content (keeps line breaks, spacing, etc.)
        const prefix = '.'; // change if your prefix is different
        const content = message.content.slice(prefix.length + this.name.length).trim();

        if (!content) {
            return message.reply('❌ Provide a message to send.');
        }

        // Delete original message
        try { await message.delete(); } catch {}

        try {
            const webhook = await message.channel.createWebhook({
                name: message.member.displayName,
                avatar: message.author.displayAvatarURL()
            });

            // 📏 Split while preserving formatting (including new lines)
            const chunks = content.match(/[\s\S]{1,2000}/g);

            for (const chunk of chunks) {
                await webhook.send({
                    content: chunk,
                    allowedMentions: { parse: ['everyone'] }
                });
            }

            await webhook.delete();

        } catch (err) {
            console.error(err);
            return message.channel.send('❌ Failed to send webhook message.');
        }
    },
};