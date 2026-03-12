const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const CLAIM_ROLE = process.env.CLAIM_ID;
const LOG_CHANNEL = process.env.TRADE_LOG_CHANNEL;

const dataPath = path.join(__dirname, '../../data/tradelogs.json');

function ensureDataFile() {
    if (!fs.existsSync(path.dirname(dataPath))) {
        fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    }

    if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, JSON.stringify({
            traders: {}
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
            return message.reply('❌ You do not have permission to log trades.');
        }

        if (!args.length) {

            const guide = new EmbedBuilder()
                .setTitle('Hit Log Command')
                .setColor('#2b2d31')
                .setDescription(`
**Usage**
\`$log <hit> <hitter> <profit> <split>\`

**Example**
\`$log 5 dragons @alexx_gng 120$ Gave him 2 dragons\`

**Arguments**

**hit**
Describe the hit.

**hitter**
Mention the user performing the hit.

**Profit**
Total profit from the hit.

Examples:
\`1200\`
\`1,200\`
\`1200$\`
\`1.2k\`

**Split**
Describe the split.

Example:
\`70/30\`
\`host keeps all\`
\`50/50\`

**Attachments**
You can attach screenshots or proof when sending the command.
                `);

            return message.channel.send({ embeds: [guide] });
        }

        const trader = message.mentions.users.first();

        if (!trader) {
            return message.reply('❌ You must mention the hitter.');
        }

        const traderIndex = args.findIndex(arg => arg.includes(`<@${trader.id}>`) || arg.includes(`<@!${trader.id}>`));

        const h1t = args.slice(0, traderIndex).join(' ');
        const profitArg = args[traderIndex + 1];
        const splitArg = args.slice(traderIndex + 2).join(' ');

        if (!h1t || !profitArg || !splitArg) {
            return message.reply('❌ Invalid usage. Run `$log` to see the guide.');
        }

        const profit = parseProfit(profitArg);

        if (!profit || isNaN(profit)) {
            return message.reply('❌ Invalid profit amount.');
        }

        ensureDataFile();

        const data = JSON.parse(fs.readFileSync(dataPath));

        if (!data.traders) data.traders = {};

        if (!data.traders[trader.id]) {
            data.traders[trader.id] = {
                totalProfit: 0,
                trades: 0
            };
        }

        data.traders[trader.id].totalProfit += profit;
        data.traders[trader.id].trades += 1;

        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

        const attachments = message.attachments.map(a => a.url);

        const embed = new EmbedBuilder()
            .setTitle('💰 Hit Logged')
            .setColor('#2b2d31')
            .addFields(
                { name: 'Hit', value: h1t, inline: true },
                { name: 'Hitter', value: `<@${trader.id}>`, inline: true },
                { name: 'Logged By', value: `<@${message.author.id}>`, inline: true },
                { name: 'Profit', value: `$${profit.toLocaleString()}`, inline: true },
                { name: 'Split', value: splitArg, inline: true },
                { name: 'Total Hits', value: `${data.traders[trader.id].trades}`, inline: true },
                { name: 'Total Profit', value: `$${data.traders[trader.id].totalProfit.toLocaleString()}`, inline: true }
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

        message.reply('✅ Hit successfully logged.');
    }
};