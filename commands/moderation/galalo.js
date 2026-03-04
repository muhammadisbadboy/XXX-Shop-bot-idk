const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');  

module.exports = {  
    name: 'galalo',  
    description: 'Dynamic offer panel command',  
    async execute(message, args, client) {  

        // Only specific role can use (roleid-1465699111931215903)  
        if (!message.member.roles.cache.has('1465699111931215903')) return;  

        // Must mention a user  
        const targetUser = message.mentions.members.first();  
        if (!targetUser) return; // Do nothing if no mention  

        // Extract heading and description dynamically  
        // Format: .galalo @user "Heading Here" "Description Here"  
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

        // Roles as hardcoded IDs  
        const H1T_ROLE = message.guild.roles.cache.get('1465699224061743156'); // Accept role  
        const BLACKLIST_ROLE = message.guild.roles.cache.get('1470527278432784416'); // Decline role  
        if (!H1T_ROLE || !BLACKLIST_ROLE) return; // silently fail if roles missing  

        // Build embed  
        const embed = new EmbedBuilder()  
            .setTitle(`✨ ${heading} ✨`)  
            .setDescription(description)  
            .setColor('#00FFAA')  
            .setFooter({ text: 'Only the mentioned user can click the buttons.' })  
            .setTimestamp();  

        // Build buttons  
        const row = new ActionRowBuilder().addComponents(  
            new ButtonBuilder()  
                .setCustomId('acceptOffer')  
                .setLabel('✅ Accept Offer')  
                .setEmoji('🟢')  
                .setStyle(ButtonStyle.Success),  
            new ButtonBuilder()  
                .setCustomId('rejectOffer')  
                .setLabel('❌ Decline Offer')  
                .setEmoji('🔴')  
                .setStyle(ButtonStyle.Danger)  
        );  

        // Send panel  
        const panelMessage = await message.channel.send({ embeds: [embed], components: [row] });  

        // Collector  
        const collector = panelMessage.createMessageComponentCollector({ time: 180000 });  

        collector.on('collect', async interaction => {  
            if (interaction.user.id !== targetUser.id) {  
                return interaction.reply({ content: '⚠️ Only the mentioned user can interact with this panel.', ephemeral: true });  
            }  

            await interaction.deferUpdate();  

            if (interaction.customId === 'acceptOffer') {  
                try {  
                    await targetUser.roles.add(H1T_ROLE);  
                    const acceptedEmbed = new EmbedBuilder()  
                        .setTitle('🎉 Offer Accepted 🎉')  
                        .setDescription(`<@${targetUser.id}> has accepted the offer!\n✅ Granted **${H1T_ROLE.name}**.`)  
                        .setColor('#00FF00')  
                        .setFooter({ text: 'Good choice!' })  
                        .setTimestamp();  

                    await panelMessage.edit({ embeds: [acceptedEmbed], components: [] });  
                } catch {  
                    await panelMessage.edit({ content: '❌ Failed to assign H1T role.', embeds: [], components: [] });  
                }  
            }  

            if (interaction.customId === 'rejectOffer') {  
                try {  
                    await targetUser.roles.add(BLACKLIST_ROLE);  
                    const rejectedEmbed = new EmbedBuilder()  
                        .setTitle('⚠️ Offer Declined ⚠️')  
                        .setDescription(`<@${targetUser.id}> has declined the offer!\n❌ Assigned **${BLACKLIST_ROLE.name}**.`)  
                        .setColor('#FF0000')  
                        .setFooter({ text: 'Bad choice!' })  
                        .setTimestamp();  

                    await panelMessage.edit({ embeds: [rejectedEmbed], components: [] });  
                } catch {  
                    await panelMessage.edit({ content: '❌ Failed to assign BLACKLIST role.', embeds: [], components: [] });  
                }  
            }  

            collector.stop();  
        });  

        collector.on('end', collected => {  
            if (!collected.size)  
                panelMessage.edit({ content: '⏱ Panel expired without response.', embeds: [], components: [] });  
        });  
    }  
};