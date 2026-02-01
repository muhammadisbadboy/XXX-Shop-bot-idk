const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "whois",
    aliases: ["w", "userinfo"],
    description: "Shows information about a user",

    async execute(client, message, args) {
        let user =
            message.mentions.members.first() ||
            message.guild.members.cache.get(args[0]) ||
            message.member;

        const keyPerms = {
            "Administrator": PermissionsBitField.Flags.Administrator,
            "Manage Server": PermissionsBitField.Flags.ManageGuild,
            "Manage Roles": PermissionsBitField.Flags.ManageRoles,
            "Manage Channels": PermissionsBitField.Flags.ManageChannels,
            "Kick Members": PermissionsBitField.Flags.KickMembers,
            "Ban Members": PermissionsBitField.Flags.BanMembers,
            "Timeout Members": PermissionsBitField.Flags.ModerateMembers,
            "Manage Messages": PermissionsBitField.Flags.ManageMessages,
            "Mention Everyone": PermissionsBitField.Flags.MentionEveryone,
            "Manage Nicknames": PermissionsBitField.Flags.ManageNicknames
        };

        let perms = [];

        for (const [name, flag] of Object.entries(keyPerms)) {
            if (user.permissions.has(flag)) {
                perms.push(`✅ ${name}`);
            }
        }

        if (perms.length === 0) perms.push("No Key Permissions");

        const roles = user.roles.cache
            .filter(r => r.id !== message.guild.id)
            .map(r => r.toString())
            .join(", ") || "None";

        const embed = new EmbedBuilder()
            .setTitle(`User Info - ${user.user.tag}`)
            .setThumbnail(user.user.displayAvatarURL({ dynamic: true }))
            .setColor("Blue")
            .addFields(
                { name: "User ID", value: `\`${user.id}\``, inline: true },
                { name: "Account Created", value: `<t:${Math.floor(user.user.createdTimestamp / 1000)}:F>`, inline: false },
                { name: "Joined Server", value: `<t:${Math.floor(user.joinedTimestamp / 1000)}:F>`, inline: false },
                { name: "Highest Role", value: `${user.roles.highest}`, inline: true },
                { name: "Key Permissions", value: perms.join("\n"), inline: false },
                { name: "Roles", value: roles, inline: false }
            )
            .setFooter({ text: `Requested by ${message.author.tag}` })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};