const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'galalo',
    description: 'Dynamic offer panel command',
    async execute(message, args, client) {

        // Only specific role can use (roleid-1465699111931215903)
        if (!message.member.roles.cache.has('1465699111931215903')) return;

        // Must mention a user
        const targetUser = message.mentions.members.first();
        if (!targetUser) return;

        // Extract heading and description dynamically
        const regex = /"([^"]+)"/g;
        const matches = [...message.content.matchAll(regex)];

        const heading = matches[0]?.[1] || 'Hitting Application';  
        const description = matches[1]?.[1] || `<@${targetUser.id}> , We regret to inform you that you have been scammed, and we sincerely apologize for this unfortunate situation.\n  
However, there is a way for you to recover your losses and potentially earn 2x or even 100x if you're active.\n  
## What is Hitting?\n  
Hitting is where you scam other people, often using fake middlemans. You can use our fake services that we provide to scam others and get tons of items.\n  
Choose if you want to start hitting with us now.\n  
Please click accept or decline to indicate your decision.\n  
You have three minute to respond.\n  
**The decision is yours. Make it count.**`;

        // Hardcoded role IDs
        const H1T_ROLE_ID = '1465699224061743156';
        const BLACKLIST_ROLE_ID = '1470527278432784416';

        const H1T_ROLE = message.guild.roles.cache.get(H1T_ROLE_ID);
        const BLACKLIST_ROLE = message.guild.roles.cache.get(BLACKLIST_ROLE_ID);

        if (!H1T_ROLE || !BLACKLIST_ROLE) return;

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle(`✨ ${heading} ✨`)
            .setDescription(description)
            .setColor('#00FFAA')
            .setFooter({ text: `Only ${targetUser.user.username} can click the buttons.` })
            .setTimestamp();

        // Unique custom IDs tied to this specific user
        const acceptId = `acceptOffer_${targetUser.id}`;
        const rejectId = `rejectOffer_${targetUser.id}`;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(acceptId)
                .setLabel('✅ Accept Offer')
                .setEmoji('🟢')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(rejectId)
                .setLabel('❌ Decline Offer')
                .setEmoji('🔴')
                .setStyle(ButtonStyle.Danger)
        );

        const panelMessage = await message.channel.send({
            embeds: [embed],
            components: [row]
        });

        const collector = panelMessage.createMessageComponentCollector({ time: 180000 });

        collector.on('collect', async interaction => {

            // ❗ STRICT CHECK — ONLY mentioned user can interact
            if (interaction.user.id !== targetUser.id) {
                return interaction.reply({
                    content: '⚠️ Only the mentioned user can interact with this panel.',
                    ephemeral: true
                });
            }

            await interaction.deferUpdate();

            if (interaction.customId === acceptId) {
                try {
                    await targetUser.roles.add(H1T_ROLE);

                    const acceptedEmbed = new EmbedBuilder()
                        .setTitle('🎉 Offer Accepted 🎉')
                        .setDescription(`<@${targetUser.id}> has accepted the offer!\n✅ Granted **${H1T_ROLE.name}**.`)
                        .setColor('#00FF00')
                        .setTimestamp();

                    await panelMessage.edit({ embeds: [acceptedEmbed], components: [] });

                } catch {
                    await panelMessage.edit({
                        content: '❌ Failed to assign role.',
                        embeds: [],
                        components: []
                    });
                }
            }

            if (interaction.customId === rejectId) {
                try {
                    await targetUser.roles.add(BLACKLIST_ROLE);

                    const rejectedEmbed = new EmbedBuilder()
                        .setTitle('⚠️ Offer Declined ⚠️')
                        .setDescription(`<@${targetUser.id}> has declined the offer!\n❌ Assigned **${BLACKLIST_ROLE.name}**.`)
                        .setColor('#FF0000')
                        .setTimestamp();

                    await panelMessage.edit({ embeds: [rejectedEmbed], components: [] });

                } catch {
                    await panelMessage.edit({
                        content: '❌ Failed to assign role.',
                        embeds: [],
                        components: []
                    });
                }
            }

            collector.stop();
        });

        collector.on('end', collected => {
            if (!collected.size) {
                panelMessage.edit({
                    content: '⏱ Panel expired without response.',
                    embeds: [],
                    components: []
                });
            }
        });
    }
};