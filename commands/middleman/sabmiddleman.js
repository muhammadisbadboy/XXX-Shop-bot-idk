const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

const CLAIM_ROLE = process.env.CLAIM_ID;

module.exports = {
    name: 'sabmiddleman',
    description: 'Shows the Middleman Trade Procedure',

    async execute(message) {

        if (!message.member.roles.cache.has(CLAIM_ROLE)) return;

        const embed = new EmbedBuilder()
            .setTitle('🛡 Middleman Trade Procedure')
            .setColor('#2b2d31')
            .setDescription('Follow these steps to ensure a fair and secure middleman trade:')
            .addFields(
                {
                    name: '1️⃣ Middleman Setup',
                    value: 'The MM will use **two separate accounts**, one for each trader involved in the deal. Both parties must add the MM on their respective accounts before the trade begins.'
                },
                {
                    name: '2️⃣ Item Collection Process',
                    value: 'The MM will collect each party\'s items **one at a time**, following a clear and agreed order to ensure accountability and prevent confusion.'
                },
                {
                    name: '3️⃣ Trade Distribution',
                    value: 'After all items are secured, the MM will rejoin the **same server using the alternate account** and distribute the items back to each party **in the exact order they were collected**.'
                },
                {
                    name: '4️⃣ Security & Fairness',
                    value: 'This structured process ensures the trade remains **fair, transparent, and secure** for all parties involved.'
                },
                {
                    name: '5️⃣ Optional Tip',
                    value: 'The **final recipient** of the trade may optionally provide a tip to the MM as a courtesy. Tips are **not required** and may include Roblox items or real currency.'
                },
                {
                    name: '⚠️ Confirmation',
                    value: 'Both parties must confirm their agreement to this procedure before the trade begins.'
                }
            )
            .setFooter({ text: 'Middleman Trade Guide' })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};