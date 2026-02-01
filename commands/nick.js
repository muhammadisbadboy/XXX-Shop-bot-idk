// commands/nick.js
const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "nick",
    aliases: ["nickname", "setnick"],
    description: "Change or reset a member's nickname.",
    async execute(client, message, args) {

        const errorEmbed = (description) => new EmbedBuilder()
            .setColor("Red")
            .setTitle(":warning: Action Failed")
            .setDescription(description)
            .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
            .setTimestamp();

        // Permission check
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
            return message.channel.send({
                embeds: [errorEmbed("You don’t have permission to change nicknames.")]
            });
        }

        // Target member
        const member =
            message.mentions.members.first() ||
            message.guild.members.cache.get(args[0]);

        if (!member) {
            return message.channel.send({
                embeds: [errorEmbed(
                    "Please mention a member or provide their ID.\nExample: `.nick @user NewNickname`"
                )]
            });
        }

        if (member.id === client.user.id) {
            return message.channel.send({
                embeds: [errorEmbed("I can’t change my own nickname.")]
            });
        }

        // Role hierarchy
        if (member.roles.highest.position >= message.member.roles.highest.position) {
            return message.channel.send({
                embeds: [errorEmbed(
                    "You cannot change this member’s nickname because their role is equal or higher than yours."
                )]
            });
        }

        // New nickname
        const newNick = args.slice(1).join(" ");

        try {
            if (!newNick) {
                // Reset nickname
                await member.setNickname(null);

                const embed = new EmbedBuilder()
                    .setColor("Green")
                    .setTitle(":pencil2: Nickname Reset")
                    .addFields(
                        { name: ":bust_in_silhouette: Member", value: `${member.user.tag}`, inline: true },
                        { name: ":shield: Actioned By", value: `${message.author.tag}`, inline: true }
                    )
                    .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
                    .setTimestamp();

                return message.channel.send({ embeds: [embed] });
            }

            // Change nickname
            await member.setNickname(newNick);

            const embed = new EmbedBuilder()
                .setColor("Blue")
                .setTitle(":pencil2: Nickname Changed")
                .addFields(
                    { name: ":bust_in_silhouette: Member", value: `${member.user.tag}`, inline: true },
                    { name: ":pencil2: New Nickname", value: newNick, inline: true },
                    { name: ":shield: Actioned By", value: `${message.author.tag}`, inline: true }
                )
                .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
                .setTimestamp();

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            message.channel.send({
                embeds: [errorEmbed(
                    "Failed to change nickname. Make sure I have permission and my role is higher."
                )]
            });
        }
    }
};