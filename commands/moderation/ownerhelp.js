const { EmbedBuilder } = require('discord.js');

const ALLOWED_IDS = [
    '1112091588462649364', // OWNER_ID
    '1135999619541774386'  // SERVER_OWNER
];

module.exports = {
    name: 'help',
    description: 'Shows a list of owner/admin commands (OWNER or SERVER_OWNER only)',
    async execute(message, args, client) {
        // Only OWNER_ID or SERVER_OWNER can use this
        if (!ALLOWED_IDS.includes(message.author.id)) {
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#e74c3c')
                        .setDescription('❌ You are not allowed to use this command.')
                ]
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Owner/Admin Command Help')
            .setDescription('Here is a list of commands that only **OWNER** and **SERVER_OWNER** can use. Use them wisely! :sparkles:')
            .setColor('#1abc9c')
            .addFields(
                { name: '💬 DM', value: '`dm <@user> <message>` — Send a direct message to a user', inline: false },
                { name: '👢 Kick', value: '`kick <@user> [reason]` — Kick a user from the server', inline: false },
                { name: '⏱️ Timeout', value: '`timeout <@user> <duration>` — Timeout a user', inline: false },
                { name: '🔓 Unban', value: '`unban <userID>` — Unban a user', inline: false },
                { name: '⏲️ Untimeout', value: '`untimeout <@user>` — Remove a timeout from a user', inline: false },
                { name: '⚠️ Warn', value: '`warn <@user> [reason]` — Warn a user', inline: false },
                { name: '📋 Warnings', value: '`warnings <@user>` — Check user warnings', inline: false },
                { name: '❌ Unwarn', value: '`unwarn <@user> [warnID]` — Remove a specific warning from a user', inline: false },
                { name: '🎭 Role', value: '`role add/remove <@user> <role>` — Add or remove a role', inline: false }
            )
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.channel.send({ embeds: [embed] });
    }
};