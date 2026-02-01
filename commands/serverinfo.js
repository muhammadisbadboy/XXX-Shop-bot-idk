const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "serverinfo",
    aliases: ["si"],
    description: "Shows detailed info about the server",

    async execute(client, message, args) {
        const guild = message.guild;

        // Count emojis
        const emojiCount = guild.emojis.cache.size;

        // Count channels
        const channels = {
            text: guild.channels.cache.filter(c => c.type === 0).size,  // Text channels
            voice: guild.channels.cache.filter(c => c.type === 2).size  // Voice channels
        };

        // Roles count
        const rolesCount = guild.roles.cache.size;

        // Boost info
        const boosts = guild.premiumSubscriptionCount;
        const boostLevel = guild.premiumTier ? `Level ${guild.premiumTier}` : "None";

        // Key perms check for server owner
        const owner = await guild.fetchOwner();

        const embed = new EmbedBuilder()
            .setTitle(`Server Info - ${guild.name}`)
            .setColor("Gold")
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: ":id: Server ID", value: `\`${guild.id}\``, inline: true },
                { name: ":crown: Owner", value: `${owner.user.tag}`, inline: true },
                { name: ":date: Created On", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false },
                { name: ":busts_in_silhouette: Members", value: `Total: ${guild.memberCount}`, inline: true },
                { name: ":art: Roles", value: `${rolesCount}`, inline: true },
                { name: ":abc: Emojis", value: `${emojiCount}`, inline: true },
                { name: ":speech_balloon: Channels", value: `Text: ${channels.text} | Voice: ${channels.voice}`, inline: false },
                { name: ":gem: Boosts", value: `Count: ${boosts} | Tier: ${boostLevel}`, inline: true },
                { name: ":key: Key Owner Permissions", value: owner.permissions.has(PermissionsBitField.Flags.Administrator) ? ":white_check_mark: Administrator" : "No Admin", inline: true }
            )
            .setFooter({ text: `Requested by ${message.author.tag}` })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};