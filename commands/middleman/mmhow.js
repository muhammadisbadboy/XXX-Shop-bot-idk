const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

const CLAIM_ROLE = process.env.CLAIM_ID;

module.exports = {
    name: 'mmhow',
    description: 'Shows how a Middleman (MM) works',

    async execute(message) {

        // Only CLAIM_ROLE can run
        if (!message.member.roles.cache.has(CLAIM_ROLE)) return;

        const embed = new EmbedBuilder()
            .setTitle('📜 Middleman Info')
            .setDescription('**A Middleman (MM)** is a trusted staff member who ensures trades are safe and fair.')
            .setColor('#8000FF') // Purple embed
            .addFields(
                {
                    name: '📌 MM Rules',
                    value: '• Once a ticket is created, the MM who claims it **must finish it**.\n• The MM cannot be switched during the trade.\n• After the trade finishes, both parties must **vouch**.'
                },
                {
                    name: '🔧 How Does a MM Work?',
                    value: '1️⃣ **Seller** gives item(s) to the MM.\n2️⃣ **Buyer** sends payment/item(s) to seller.\n3️⃣ **MM** confirms both sides and delivers the items to the buyer.'
                }
            )
            .setImage('https://media.discordapp.net/attachments/1480184670606983240/1481663299371143199/image.webp?ex=69b421fa&is=69b2d07a&hm=0bf433885965e340bedff048f5f2fddca8bea6693334708a0232bc1b38d2bb50&=&format=webp')
            .setFooter({ text: 'Middleman Trade Guide • Only for authorized MMs' })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};