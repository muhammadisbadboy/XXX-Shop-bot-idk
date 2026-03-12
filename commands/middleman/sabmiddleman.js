const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

const CLAIM_ROLE = process.env.CLAIM_ID;

module.exports = {
    name: 'sabmiddleman',
    description: 'Shows the Middleman Trade Procedure',

    async execute(message) {

        // Only CLAIM_ROLE can run
        if (!message.member.roles.cache.has(CLAIM_ROLE)) return;

        const procedureText = `
**1. Middleman Setup**
> The MM will use **two separate accounts**, one for each trader involved in the deal. Both parties must add the MM on their respective accounts before the trade begins.

**2. Item Collection Process**
> The MM will collect each party's items **one at a time**, following a clear and agreed order to ensure accountability and prevent confusion.

**3. Trade Distribution**
> After all items are secured, the MM will rejoin the **same server using the alternate account** and distribute the items back to each party **in the exact order they were collected**.

**4. Security & Fairness**
> This structured process ensures the trade remains **fair, transparent, and secure** for all parties involved.

**5. Optional Tip**
> The **final recipient** of the trade may optionally provide a tip to the MM as a courtesy. Tips are **not required** and may include Roblox items or real currency.

**⚠️ Both parties must confirm their agreement to this procedure before the trade begins.**
`;

        const embed = new EmbedBuilder()
            .setTitle('🛡 Middleman Trade Procedure')
            .setDescription(procedureText)
            .setColor('#8000FF') // Purple color
            .setFooter({ text: 'Middleman Trade Guide' })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};