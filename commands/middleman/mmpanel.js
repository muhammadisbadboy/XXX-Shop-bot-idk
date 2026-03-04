require('dotenv').config();
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const ticketManager = require('../../utils/ticketManager');

module.exports = {
  name: 'mmpanel',
  async execute(message, args, client) {
    // Only OWNER_ID can run
    if (message.author.id !== process.env.OWNER_ID) return;

    const categories = [
      { label: 'Crypto', value: 'Crypto', emoji: '💸' },
      { label: 'Game Items', value: 'InGame', emoji: '🕹️' },
      { label: 'NFTs', value: 'NFT', emoji: '🖼️' },
      { label: 'Services', value: 'Services', emoji: '🛠️' },
      { label: 'Trading', value: 'Trading', emoji: '📊' },
      { label: 'Accounts', value: 'Accounts', emoji: '🔑' },
      { label: 'Other', value: 'Other', emoji: '📌' },
    ];

    const embed = new EmbedBuilder()
      .setTitle('🔒 Trade Market • Official Middleman Service ')
      .setDescription(`Welcome to **Kai Kingdom Secure Middleman System** — where your trades are safe, transparent, and protected.\n\u200B
✨ Verified middlemen ensure:
• 🛡️ Safe Transactions – your assets are secure
• ❌ Zero Scam Tolerance – strict rules enforced
• 🔍 Transparent Deal Handling – full visibility
• 💰 Secure Asset Holding – until deal completion
━━━━━━━━━━━━━━━━━━━━━━
📜 🛡️ Middleman Rules
• ✍️ Both traders must confirm deal terms clearly
• 🔒 Terms cannot be changed after MM holds assets
• ⚠️ Fake proof = instant blacklist
• 🚫 Impersonation = permanent ban
• 💸 Crypto trades require valid TX proof
• ✅ All payments must be verified before release
• 🏛️ Middleman decision is final
━━━━━━━━━━━━━━━━━━━━━━
🛡️ Security Notice
• ⚠️ Only trust tickets created via this official panel
• 💬 Staff will never DM you first
• 🟢 Check role color & join date before trusting anyone
• 📚 All tickets are logged & archived
━━━━━━━━━━━━━━━━━━━━━━
📌 Select your trade category below to begin
🎯 Make your trade safe, fast, and professional!`)
      .setColor('#1F2937')
      .setFooter({ text: 'Kai Kingdom MM Panel', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    // Dropdown menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ticketCategorySelect')
      .setPlaceholder('➤ Select trade category')
      .addOptions(categories.map(c => ({
        label: `【${c.emoji}】 ${c.label}`,
        value: c.value,
        description: `Start a ${c.label} trade ticket`,
      })));

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await message.channel.send({ embeds: [embed], components: [row] });
  }
};