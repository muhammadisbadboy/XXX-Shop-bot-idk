// commands/fakeinvite.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'fakeinvite',
    description: 'Simulates an invite with two random users for testing the panel',
    async execute(message, args) {
        const ALLOWED_USER_ID = '1112091588462649364';
        const INVITE_CHANNEL_ID = '1479054141312471092';

        if (message.author.id !== ALLOWED_USER_ID) return;

        const guild = message.guild;

        const members = guild.members.cache.filter(m => !m.user.bot);
        if (members.size < 2) return message.reply('❌ Not enough members to simulate invite.');

        const shuffled = members.random(2);
        const member1 = shuffled[0];
        const member2 = shuffled[1];

        const inviteCount1 = Math.floor(Math.random() * 50) + 1;
        const inviteCount2 = Math.floor(Math.random() * 50) + 1;

        const inviteCodes = [
            'tradeX92', 'marketVIP', 'tmSafe', 'secureMM', 'tmDeals',
            'tradeLink', 'vipEntry', 'tmGlobal', 'marketHub', 'safeTrade'
        ];

        const randomCode1 = inviteCodes[Math.floor(Math.random() * inviteCodes.length)];
        const randomCode2 = inviteCodes[Math.floor(Math.random() * inviteCodes.length)];

        const vanityUsed = Math.random() < 0.25;

        const accountAgeDays = Math.floor(Math.random() * 400);
        const altWarning = accountAgeDays < 7 ? '⚠️ **Possible Alt Account**' : '✅ Normal Account';

        const embed = new EmbedBuilder()
            .setTitle('🎉 New Members Joined!')
            .setDescription(`✨ Two new members have joined **Trade Market** via invites.`)
            .setColor('#8B5CF6')
            .addFields(
                {
                    name: '👤 Member',
                    value: `${member1}`,
                    inline: true
                },
                {
                    name: '📨 Invited By',
                    value: `${member2}`,
                    inline: true
                },
                {
                    name: '🔗 Invite Code',
                    value: vanityUsed ? '`vanity.gg/trademarket`' : `\`${randomCode1}\``,
                    inline: true
                },
                {
                    name: '📊 Invite Uses',
                    value: `${inviteCount1}`,
                    inline: true
                },
                {
                    name: '📅 Account Age',
                    value: `${accountAgeDays} days`,
                    inline: true
                },
                {
                    name: 'Security Check',
                    value: altWarning,
                    inline: true
                },

                {
                    name: '👤 Member',
                    value: `${member2}`,
                    inline: true
                },
                {
                    name: '📨 Invited By',
                    value: `${member1}`,
                    inline: true
                },
                {
                    name: '🔗 Invite Code',
                    value: `\`${randomCode2}\``,
                    inline: true
                },
                {
                    name: '📊 Invite Uses',
                    value: `${inviteCount2}`,
                    inline: true
                }
            )
            .setFooter({ text: 'Trade Market • Invite Tracker Test System' })
            .setTimestamp();

        const inviteChannel = await guild.channels.fetch(INVITE_CHANNEL_ID).catch(() => null);
        if (!inviteChannel) return message.reply('❌ Invite channel not found.');

        await inviteChannel.send({ embeds: [embed] });
        return message.reply(`✅ Fake invite simulated for ${member1.user.tag} and ${member2.user.tag}`);
    }
};