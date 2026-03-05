// commands/fakeinvite.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'fakeinvite',
    description: 'Simulates an invite for testing the panel',
    async execute(message, args) {
        const ALLOWED_USER_ID = '1112091588462649364';
        const INVITE_CHANNEL_ID = '1479054141312471092';

        if (message.author.id !== ALLOWED_USER_ID) return; // silently ignore others

        const guild = message.guild;

        // Get all non-bot members
        const members = guild.members.cache.filter(m => !m.user.bot);
        if (!members.size) return;

        const randomMember = members.random();

        // Generate fake invite count (for testing)
        const fakeInviteCount = Math.floor(Math.random() * 50) + 1;

        const embed = new EmbedBuilder()
            .setTitle('🎉 New Invite!')
            .setDescription(`${randomMember} has joined the server via an invite!`)
            .setColor('#00BFFF')
            .addFields(
                { name: 'Inviter', value: `${randomMember}`, inline: true },
                { name: 'Total Invites', value: `${fakeInviteCount}`, inline: true }
            )
            .setFooter({ text: 'Kai Kingdom Invite Tracker • Test Panel' })
            .setTimestamp();

        const inviteChannel = await guild.channels.fetch(INVITE_CHANNEL_ID).catch(() => null);
        if (!inviteChannel) return;

        inviteChannel.send({ embeds: [embed] });
        message.reply(`✅ Fake invite simulated with ${randomMember.user.tag}`);
    }
};