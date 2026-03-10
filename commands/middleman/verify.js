// commands/util/verify.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'verify',
    description: 'Creates a professional verification dashboard with interactive buttons',
    async execute(message, args, client) {

        // -----------------------------
        // Only allowed user can deploy
        // -----------------------------
        const ALLOWED_USER_ID = '1112091588462649364';
        if (message.author.id !== ALLOWED_USER_ID) {
            return message.reply('❌ You do not have permission to create a verification panel.');
        }

        // -----------------------------
        // Main verification dashboard embed
        // -----------------------------
        const embed = new EmbedBuilder()
            .setTitle('✨ ✅ Trade Market Verification Dashboard ✨')
            .setDescription(
                'Welcome to **Trade Market** — the safest & most trusted trading community!\n' +
                'Use the buttons below for more info or to attempt verification.\n\n' +
                '─────────────────────────────'
            )
            .setColor('#8B5CF6')
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/190/190411.png')
            .addFields(
                { name: '🔹 Perks', value: '• Access exclusive channels\n• Participate in events & giveaways\n• Priority support\n• Trusted community recognition', inline: true },
                { name: '📜 Rules', value: '• Be respectful to all members\n• No scams/fraud\n• Keep content relevant\n• Follow Discord TOS', inline: true },
                { name: '🛠️ How to Verify', value: '1️⃣ Click the **Verify Me** button\n2️⃣ Wait for staff confirmation if needed\n3️⃣ Gain full access to the server', inline: true }
            )
            .setFooter({ text: 'Trade Market • Verification Panel' })
            .setTimestamp();

        // -----------------------------
        // Interactive buttons
        // -----------------------------
        const verifyButton = new ButtonBuilder()
            .setCustomId('verify_button')
            .setLabel('✅ Verify Me')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔑');

        const perksButton = new ButtonBuilder()
            .setCustomId('perks_button')
            .setLabel('💎 Perks')
            .setStyle(ButtonStyle.Secondary);

        const rulesButton = new ButtonBuilder()
            .setCustomId('rules_button')
            .setLabel('📜 Rules')
            .setStyle(ButtonStyle.Secondary);

        const instructionsButton = new ButtonBuilder()
            .setCustomId('instructions_button')
            .setLabel('🛠️ How to Verify')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder()
            .addComponents(verifyButton, perksButton, rulesButton, instructionsButton);

        // -----------------------------
        // Send the dashboard
        // -----------------------------
        const panel = await message.channel.send({ embeds: [embed], components: [row] });

        // -----------------------------
        // Collector for button clicks
        // -----------------------------
        const collector = panel.createMessageComponentCollector({ time: 0 });

        collector.on('collect', async interaction => {
            if (!['verify_button','perks_button','rules_button','instructions_button'].includes(interaction.customId)) return;

            // -----------------------------
            // Ephemeral messages for each button
            // -----------------------------
            if (interaction.customId === 'verify_button') {
                await interaction.reply({
                    content: '⚠️ Verification is temporarily unavailable. Please contact a staff member for assistance.',
                    ephemeral: true
                });
            }

            if (interaction.customId === 'perks_button') {
                await interaction.reply({
                    content: '💎 **Trade Market Perks:**\n• Exclusive channels\n• Events & giveaways\n• Priority support\n• Trusted community recognition',
                    ephemeral: true
                });
            }

            if (interaction.customId === 'rules_button') {
                await interaction.reply({
                    content: '📜 **Trade Market Rules:**\n• Be respectful\n• No scams/fraud\n• Keep content relevant\n• Follow Discord TOS\n• Staff decisions are final',
                    ephemeral: true
                });
            }

            if (interaction.customId === 'instructions_button') {
                await interaction.reply({
                    content: '🛠️ **How to Verify:**\n1️⃣ Click **Verify Me**\n2️⃣ Wait for staff confirmation\n3️⃣ Gain full access\n🔹 Verification ensures a safe community!',
                    ephemeral: true
                });
            }
        });

        // -----------------------------
        // Log panel creation
        // -----------------------------
        console.log(`✅ Verification dashboard created by ${message.author.tag} with interactive buttons`);
    }
};