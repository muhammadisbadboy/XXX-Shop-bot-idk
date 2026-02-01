// commands/kick.js
const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "kick",
    aliases: ["k"],
    description: "Kick a member from the server with a detailed panel.",
    async execute(client, message, args) {
        // Reusable embed for errors/warnings
        const errorEmbed = (description) => new EmbedBuilder()
            .setColor("Orange")
            .setTitle(":warning: Action Failed")
            .setDescription(description)
            .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
            .setTimestamp();

        // :one: Permissions check
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.channel.send({ embeds: [errorEmbed("You don’t have permission to kick members!")] });
        }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.channel.send({ embeds: [errorEmbed("I don’t have permission to kick members!")] });
        }

        // :two: Target member
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            return message.channel.send({ embeds: [errorEmbed("Please mention a member to kick.\nExample: `.kick @username [reason]`")] });
        }

        // Prevent kicking self or bot
        if (member.id === message.author.id) return message.channel.send({ embeds: [errorEmbed("You cannot kick yourself!")] });
        if (member.id === client.user.id) return message.channel.send({ embeds: [errorEmbed("I cannot kick myself!")] });

        // Role hierarchy check
        if (member.roles.highest.position >= message.member.roles.highest.position) {
            return message.channel.send({ embeds: [errorEmbed("You cannot kick this member because their role is equal or higher than yours!")] });
        }

        // Kick reason
        const reason = args.slice(1).join(" ") || "No reason provided";

        try {
            await member.kick(reason);

            // :three: Success embed panel
            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle(":boot: Member Kicked")
                .setDescription(`A member has been **kicked** from the server.`)
                .addFields(
                    { name: ":bust_in_silhouette: Member", value: `${member.user.tag} (\`${member.id}\`)`, inline: true },
                    { name: ":shield: Kicked By", value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
                    { name: ":page_facing_up: Reason", value: reason, inline: false }
                )
                .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
                .setTimestamp();

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            message.channel.send({ embeds: [errorEmbed("Failed to kick the member. Make sure my role is higher than theirs.")] });
        }
    }
};