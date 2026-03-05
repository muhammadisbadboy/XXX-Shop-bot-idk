require('dotenv').config();
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  name: 'mmpanel',
  async execute(message, args, client) {
    // Only OWNER_ID can run
    if (message.author.id !== process.env.OWNER_ID) return;

    // -----------------------------
    // Trade categories with detailed descriptions
    // -----------------------------
    const categories = [
      { label: 'Crypto', value: 'Crypto', emoji: '💸', desc: '💰 **Secure crypto trades** — BTC, ETH, tokens, verified txs' },
      { label: 'Game Items', value: 'InGame', emoji: '🕹️', desc: '🎮 **Trade in-game items safely** — skins, lootboxes, accounts' },
      { label: 'NFTs', value: 'NFT', emoji: '🖼️', desc: '🖌️ **Verified NFT trades** — art, collectibles, digital assets' },
      { label: 'Services', value: 'Services', emoji: '🛠️', desc: '🔧 **Offer or request services** — coding, guides, designs' },
      { label: 'Trading', value: 'Trading', emoji: '📊', desc: '📈 **Secure trading deals** — P2P, stocks, market exchanges' },
      { label: 'Accounts', value: 'Accounts', emoji: '🔑', desc: '🔒 **Account exchanges** — game/social accounts, safe transfer' },
      { label: 'Other', value: 'Other', emoji: '📌', desc: '⚡ **Other trades** — fully secure & monitored' },
    ];

    // -----------------------------
    // Enhanced yellow-themed embed panel
    // -----------------------------
    const embed = new EmbedBuilder()
      .setTitle('🔒 Eldorado.gg • Official Middleman Service')
      .setDescription(
        `Welcome to **_Eldorado.gg Secure Middleman System_** — your trades are **safe, verified, and professional**.\n\n` +
        `✨ **Verified Middlemen Ensure:**\n` +
        `• 🛡️ **Safe Transactions** — all assets protected\n` +
        `• ❌ **Zero Scam Tolerance** — strict rules enforced\n` +
        `• 🔍 **Transparent Deal Handling** — full visibility\n` +
        `• 💰 **Secure Asset Holding** — until deal completion\n\n` +
        `📜 **Middleman Rules:**\n` +
        `• ✍️ Both traders must **confirm terms clearly**\n` +
        `• 🔒 Terms cannot be **changed once MM holds assets**\n` +
        `• ⚠️ Fake proof = **instant blacklist**\n` +
        `• 🚫 Impersonation = **permanent ban**\n` +
        `• 💸 Crypto trades require **valid transaction proof**\n` +
        `• ✅ All payments must be **verified before release**\n` +
        `• 🏛️ **Middleman decisions are final**\n\n` +
        `🛡️ **Security Notice:**\n` +
        `• ⚠️ Only trust tickets from this **official panel**\n` +
        `• 💬 Staff will **never DM first**\n` +
        `• 🟢 Check role color & join date before trusting\n` +
        `• 📚 All tickets are **logged & archived**\n\n` +
        `\u200B\n📌 **Select your trade category below to begin**\n🎯 Make your trade **fast, safe, and professional!**`
      )
      .setColor('#FFD700') // bright yellow/gold
      .setFooter({ text: 'Eldorado.gg MM Panel', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    // -----------------------------
    // Dropdown menu with tooltip-style descriptions
    // -----------------------------
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ticketCategorySelect')
      .setPlaceholder('➤ Select your trade category')
      .addOptions(
        categories.map(c => ({
          label: `【${c.emoji}】 ${c.label}`,
          value: c.value,
          description: c.desc, // acts like tooltip
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    // -----------------------------
    // Send the panel
    // -----------------------------
    await message.channel.send({ embeds: [embed], components: [row] });
  }
};