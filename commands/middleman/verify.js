// commands/util/verify.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'verifypanel',
    description: 'Creates a Trade Market verification panel with interactive button',
    async execute(message, args, client) {
        // -------------------------
        // Only owner can run
        // -------------------------
        const ALLOWED_USER_ID = '1112091588462649364';
        if (message.author.id !== ALLOWED_USER_ID) return;

        // -------------------------
        // Build verification embed
        // -------------------------
        const embed = new EmbedBuilder()
            .setTitle('🛡️ Trade Market Verification')
            .setDescription('Click the button below to verify yourself!\n\n⚠️ **Note:** Feature is under maintenance, click will show info.')
            .setColor('#8B5CF6') // Purple theme
            .setFooter({ text: 'Trade Market • Verification System' })
            .setTimestamp();

        // -------------------------
        // Build button
        // -------------------------
        const button = new ButtonBuilder()
            .setCustomId('verify_click')
            .setLabel('✅ Verify Me')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        // -------------------------
        // Send panel
        // -------------------------
        const panel = await message.channel.send({ embeds: [embed], components: [row] });

        // -------------------------
        // Collector for button clicks
        // -------------------------
        const collector = panel.createMessageComponentCollector({ time: 0 }); // permanent until bot restarts

        collector.on('collect', async interaction => {
            if (interaction.customId === 'verify_click') {
                // Respond to user with ephemeral message
                await interaction.reply({ 
                    content: '⚠️ This feature is not working atm. Please contact staff.', 
                    ephemeral: true 
                }).catch(() => {});
            }
        });
    }
};