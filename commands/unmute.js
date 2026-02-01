// commands/unmute.js
const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "unmute",
    aliases: ["uto", "rto", "removetimeout"],
    description: "Remove timeout (unmute) from a member with a professional moderation panel.",
    async execute(client, message, args) {

        const errorEmbed = (description) => new EmbedBuilder()
            .setColor("Red")
            .setTitle(":warning: Action Failed")
            .setDescription(description)
            .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
            .setTimestamp();

        // :one: Permission check
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.channel.send({
                embeds: [errorEmbed("You don’t have permission to unmute members!")]
            });
        }

        // :two: Target member
        const member =
            message.mentions.members.first() ||
            message.guild.members.cache.get(args[0]);

        if (!member) {
            return message.channel.send({
                embeds: [errorEmbed(
                    "Please mention a member to unmute.\nExample: `.uto @username`"
                )]
            });
        }

        if (member.id === message.author.id)
            return message.channel.send({
                embeds: [errorEmbed("You cannot unmute yourself!")]
            });

        if (member.id === client.user.id)
            return message.channel.send({
                embeds: [errorEmbed("I cannot unmute myself!")]
            });

        // Role hierarchy check
        if (member.roles.highest.position >= message.member.roles.highest.position) {
            return message.channel.send({
                embeds: [errorEmbed(
                    "You cannot unmute this member because their role is equal or higher than yours!"
                )]
            });
        }

        // :three: Check if member is actually muted
        if (!member.isCommunicationDisabled()) {
            return message.channel.send({
                embeds: [errorEmbed("This member is not currently muted.")]
            });
        }

        try {
            // :four: Remove timeout
            await member.timeout(null);

            // :five: Success panel
            const embed = new EmbedBuilder()
                .setColor("Green")
                .setTitle(":loud_sound: Member Unmuted")
                .addFields(
                    {
                        name: ":bust_in_silhouette: Member",
                        value: `${member.user.tag} (\`${member.id}\`)`,
                        inline: true
                    },
                    {
                        name: ":shield: Actioned By",
                        value: `${message.author.tag} (\`${message.author.id}\`)`,
                        inline: true
                    }
                )
                .setFooter({
                    text: `Server: ${message.guild.name} | Moderation Panel`
                })
                .setTimestamp();

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            message.channel.send({
                embeds: [errorEmbed(
                    "Failed to remove timeout. Make sure I have proper permissions."
                )]
            });
        }
    }
};