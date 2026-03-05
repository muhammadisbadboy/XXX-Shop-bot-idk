// commands/fakeinvite.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'fakeinvite',
    description: 'Simulates an invite with two random users for testing the panel',
    async execute(message, args) {
        const ALLOWED_USER_ID = '1112091588462649364';
        const INVITE_CHANNEL_ID = '1479054141312471092';

        // Only allowed user can run
        if (message.author.id !== ALLOWED_USER_ID) return;

        const guild = message.guild;

        // Get all non-bot members
        const members = guild.members.cache.filter(m => !m.user.bot);
        if (members.size < 2) return message.reply('❌ Not enough members to simulate invite.');

        // Pick two completely random members
        const shuffled = members.random(2);
        const member1 = shuffled[0];
        const member2 = shuffled[1];

        // Generate random fake invite counts
        const inviteCount1 = Math.floor(Math.random() * 50) + 1;
        const inviteCount2 = Math.floor(Math.random() * 50) + 1;

        const embed = new EmbedBuilder()
            .setTitle('🎉 New Invites!')
            .setDescription(`Two new members have joined the server via invites!`)
            .setColor('#00BFFF')
            .addFields(
                { name: 'Invited Member 1', value: `${member1}`, inline: true },
                { name: 'Total Invites', value: `${inviteCount1}`, inline: true },
                { name: 'Invited Member 2', value: `${member2}`, inline: true },
                { name: 'Total Invites', value: `${inviteCount2}`, inline: true }
            )
            .setFooter({ text: 'Kai Kingdom Invite Tracker • Test Panel' })
            .setTimestamp();

        // Fetch the fixed invite channel
        const inviteChannel = await guild.channels.fetch(INVITE_CHANNEL_ID).catch(() => null);
        if (!inviteChannel) return message.reply('❌ Invite channel not found.');

        await inviteChannel.send({ embeds: [embed] });
        return message.reply(`✅ Fake invite simulated for ${member1.user.tag} and ${member2.user.tag}`);
    }
};