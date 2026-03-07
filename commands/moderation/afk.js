const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const AFK_FILE = path.join(__dirname, 'afk.json');

// Load persistent AFK data
let afkUsers = {};
if (fs.existsSync(AFK_FILE)) {
    afkUsers = JSON.parse(fs.readFileSync(AFK_FILE, 'utf-8'));
}

module.exports = {
    name: 'afk',
    description: 'Set yourself as AFK with an optional reason',
    async execute(message, args, client) {
        // Internal listener for messages
        if (!client.afkListenerAdded) {
            client.on('messageCreate', async (msg) => {
                if (msg.author.bot) return;
                const userId = msg.author.id;

                // Remove AFK if user sends a message
                if (afkUsers[userId]) {
                    const afkData = afkUsers[userId];
                    const duration = Date.now() - afkData.timestamp;

                    delete afkUsers[userId];
                    fs.writeFileSync(AFK_FILE, JSON.stringify(afkUsers, null, 2));

                    const embed = new EmbedBuilder()
                        .setTitle('✅ Welcome back!')
                        .setDescription(`You were AFK for ${msToTime(duration)}`)
                        .setColor('#2ecc71')
                        .setFooter({ text: 'AFK removed' })
                        .setTimestamp();

                    await msg.channel.send({ content: `<@${userId}>`, embeds: [embed] });
                }

                // Notify if mentioned users are AFK
                if (msg.mentions.members.size > 0) {
                    msg.mentions.members.forEach(mention => {
                        if (afkUsers[mention.id]) {
                            const afkData = afkUsers[mention.id];
                            const duration = Date.now() - afkData.timestamp;

                            const embed = new EmbedBuilder()
                                .setTitle('💤 User is AFK')
                                .setDescription(`${mention.user.tag} is currently AFK: **${afkData.reason}**`)
                                .addFields({ name: 'AFK for', value: msToTime(duration), inline: true })
                                .setColor('#f1c40f')
                                .setTimestamp();

                            msg.channel.send({ embeds: [embed] });
                        }
                    });
                }
            });
            client.afkListenerAdded = true; // only add listener once
        }

        // Set AFK
        const reason = args.join(' ') || 'AFK';
        const userId = message.author.id;

        afkUsers[userId] = {
            reason,
            timestamp: Date.now()
        };

        fs.writeFileSync(AFK_FILE, JSON.stringify(afkUsers, null, 2));

        const embed = new EmbedBuilder()
            .setTitle('💤 You are now AFK')
            .setDescription(reason)
            .setColor('#9b59b6')
            .setFooter({ text: 'AFK activated' })
            .setTimestamp();

        return message.channel.send({ embeds: [embed] });
    }
};

// Helper function
function msToTime(duration) {
    let seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24),
        days = Math.floor(duration / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (seconds) parts.push(`${seconds}s`);
    return parts.join(' ') || '0s';
}