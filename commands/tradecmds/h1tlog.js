const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const CLAIM_ROLE = process.env.CLAIM_ID;
const LOG_CHANNEL = process.env.hiters_LOG_CHANNEL;

const dataPath = path.join(__dirname, '../../data/tradelogs.json');

function ensureDataFile() {
    if (!fs.existsSync(path.dirname(dataPath))) {
        fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    }

    if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, JSON.stringify({
            hitersrs: {},
            global: {
                totalProfit: 0,
                totalhiterss: 0
            }
        }, null, 2));
    }
}

function parseProfit(input) {
    if (!input) return null;

    let cleaned = input
        .toLowerCase()
        .replace(/\$/g, '')
        .replace(/,/g, '')
        .trim();

    if (cleaned.endsWith('k')) {
        return parseFloat(cleaned.replace('k', '')) * 1000;
    }

    return Number(cleaned);
}

module.exports = {
    name: 'log',

    async execute(message, args) {

        if (!message.member.roles.cache.has(CLAIM_ROLE)) {
            return message.reply('❌ You do not have permission to log hiterss.');
        }

        if (!args.length) {

            const guide = new EmbedBuilder()
                .setTitle('📊 hiters Log Command Guide')
                .setColor('#2b2d31')
                .setDescription(`
**Usage**
\`$log <hitersr> <profit> <split>\`

**Example**
\`$log @hitersr 1200 70/30\`

**Arguments**

**hitersr**
Mention or user ID of the hitersr.

**Profit**
Total profit from the hiters.
Examples:
\`1200\`
\`1,200\`
\`1200$\`
\`1.2k\`

**Split**
Profit split between hitersr and host.

Examples:
\`50/50\`
\`60/40\`
\`70/30\`

**Attachments**
You can attach screenshots or proof of the hiters when sending the command.

Example:
\`$log @User 1500 70/30\`
                `);

            return message.channel.send({ embeds: [guide] });
        }

        const hitersrArg = args[0];
        const profitArg = args[1];
        const splitArg = args[2];

        if (!hitersrArg || !profitArg || !splitArg) {
            return message.reply('❌ Invalid usage. Run `$log` to see the guide.');
        }

        const hitersr =
            message.mentions.users.first() ||
            await message.client.users.fetch(hitersrArg).catch(() => null);

        if (!hitersr) {
            return message.reply('❌ hitersr not found.');
        }

        const profit = parseProfit(profitArg);

        if (!profit || isNaN(profit)) {
            return message.reply('❌ Invalid profit amount.');
        }

        if (!splitArg.includes('/')) {
            return message.reply('❌ Invalid split format. Example: 70/30');
        }

        const splitParts = splitArg.split('/');
        const hitersrPercent = Number(splitParts[0]);
        const hostPercent = Number(splitParts[1]);

        if (isNaN(hitersrPercent) || isNaN(hostPercent)) {
            return message.reply('❌ Invalid split numbers.');
        }

        const hitersrShare = Math.floor((profit * hitersrPercent) / 100);
        const hostShare = Math.floor((profit * hostPercent) / 100);

        ensureDataFile();

        const data = JSON.parse(fs.readFileSync(dataPath));

        if (!data.hitersrs[hitersr.id]) {
            data.hitersrs[hitersr.id] = {
                totalProfit: 0,
                hitersrShare: 0,
                hostShare: 0,
                hiterss: 0
            };
        }

        data.hitersrs[hitersr.id].totalProfit += profit;
        data.hitersrs[hitersr.id].hitersrShare += hitersrShare;
        data.hitersrs[hitersr.id].hostShare += hostShare;
        data.hitersrs[hitersr.id].hiterss += 1;

        data.global.totalProfit += profit;
        data.global.totalhiterss += 1;

        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

        const attachments = message.attachments.map(a => a.url);

        const embed = new EmbedBuilder()
            .setTitle('💰 hiters Logged')
            .setColor('#2b2d31')
            .addFields(
                { name: 'hitersr', value: `<@${hitersr.id}>`, inline: true },
                { name: 'Logged By', value: `<@${message.author.id}>`, inline: true },
                { name: 'Profit', value: `$${profit.toLocaleString()}`, inline: true },
                { name: 'Split', value: splitArg, inline: true },
                { name: 'hitersr Earned', value: `$${hitersrShare.toLocaleString()}`, inline: true },
                { name: 'Host Earned', value: `$${hostShare.toLocaleString()}`, inline: true },
                { name: 'hitersr Total hiterss', value: `${data.hitersrs[hitersr.id].hiterss}`, inline: true },
                { name: 'hitersr Total Profit', value: `$${data.hitersrs[hitersr.id].totalProfit.toLocaleString()}`, inline: true },
                { name: 'Server Total Profit', value: `$${data.global.totalProfit.toLocaleString()}`, inline: true }
            )
            .setTimestamp();

        if (attachments.length) {
            embed.setImage(attachments[0]);
        }

        const logChannel = message.guild.channels.cache.get(LOG_CHANNEL);

        if (!logChannel) {
            return message.reply('❌ Log channel not found.');
        }

        logChannel.send({
            embeds: [embed],
            files: attachments.slice(1)
        });

        message.reply('✅ hiters successfully logged.');
    }
};