// events/guildInvite.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        try {
            const INVITE_CHANNEL_ID = '1479054141312471092';
            const inviteChannel = await member.guild.channels.fetch(INVITE_CHANNEL_ID).catch(() => null);
            if (!inviteChannel) return;

            // Professional invite panel
            const embed = new EmbedBuilder()
                .setTitle('🎉 New Member Invited!')
                .setDescription(`${member} has joined the server via an invite!`)
                .setColor('#1F2937') // dark professional tone
                .addFields(
                    { name: 'Member', value: `${member}`, inline: true },
                    { name: 'Server', value: member.guild.name, inline: true },
                    { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true }
                )
                .setFooter({ text: 'Kai Kingdom Invite Tracker • Security Bot' })
                .setTimestamp();

            inviteChannel.send({ embeds: [embed] });

        } catch (err) {
            console.error('Error in guildInvite event:', err);
        }
    }
};