const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'helpall',
    description: 'Shows a list of all available commands',

    async execute(message) {

        const embed = new EmbedBuilder()
            .setTitle('📚 Bot Commands')
            .setColor('#2b2d31')
            .setDescription('Here is a complete list of all available commands:')
            .addFields(
                {
                    name: '💰 Economy',
                    value: '`addmoney`, `balance`, `blackjack`, `buyhouse`, `coinflip`, `crypto`, `daily`, `deposit`, `dih`, `divorce`, `duel`, `gamble`, `heist`, `leaderboard`, `marry`, `profile`, `race`, `rob`, `setdihsize`, `shop`, `slots`, `withdraw`, `work`'
                },
                {
                    name: '🎭 Fun',
                    value: '`aura`, `expose`, `iq`, `testpanel`'
                },
                {
                    name: '🛡 Moderation',
                    value: '`ban`, `kick`, `timeout`, `untimeout`, `warn`, `warnings`, `unwarn`, `unban`, `purge`, `demote`, `promote`, `restore`, `stick(Owner only)`'
                },
                {
                    name: '⚙ Admin / Utility',
                    value: '`botstatus`, `dm`, `embed`, `fakeboost`, `fakeinvite`, `galalo`, `ping`, `say`, `setnick`, `shutdown`'
                },
                {
                    name: '🎟 Tickets',
                    value: '`add`, `claim`, `close`, `remove`, `unclaim`'
                },
                {
                    name: '📈 Trading',
                    value: '`log`, `mmlist`, `status`, `vouch`, `vouches`'
                }
            )
            .setFooter({ text: 'all the cmds here mud' })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};