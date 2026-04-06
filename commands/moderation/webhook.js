const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'webhook',
    description: 'Send message via webhook with optional ping + custom identity',
    async execute(message, args) {

        // 🔒 Permission check
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        if (args.length < 2) {
            return message.reply('❌ Usage: .webhook <text> <true/false> [name] [avatarURL]');
        }

        // Last arg = true/false
        const pingToggle = args[args.length - 1].toLowerCase();
        if (pingToggle !== 'true' && pingToggle !== 'false') {
            return message.reply('❌ Last argument must be true or false.');
        }

        // Extract optional name & avatar
        let name = message.member.displayName;
        let avatar = message.author.displayAvatarURL();

        // Check if user added custom name/avatar
        if (args.length >= 4) {
            name = args[args.length - 3];
            avatar = args[args.length - 2];
            args = args.slice(0, -3);
        } else {
            args = args.slice(0, -1);
        }

        let text = args.join(' ');

        // 🧠 Handle ping logic
        if (pingToggle === 'true') {
            // Allow real pings
        } else {
            // Block pings
            text = text
                .replace(/@everyone/g, '[everyone]')
                .replace(/@here/g, '[here]');
        }

        // Delete original message
        try { await message.delete(); } catch {}

        try {
            const webhook = await message.channel.createWebhook({
                name: name,
                avatar: avatar
            });

            await webhook.send({
                content: text
            });

            await webhook.delete();

        } catch (err) {
            console.error(err);
            return message.channel.send('❌ Failed to send webhook message.');
        }
    },
};