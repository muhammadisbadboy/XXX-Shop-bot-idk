// commands/mute.js
const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "mute",
    aliases: ["timeout"],
    description: "Mute (timeout) a member in the server. Use duration like `10m`, `1h`, `1d`.",
    async execute(client, message, args) {

        const errorEmbed = (description) => new EmbedBuilder()
            .setColor("Red")
            .setTitle(":warning: Action Failed")
            .setDescription(description)
            .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
            .setTimestamp();

        // :one: Permission check
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.channel.send({ embeds: [errorEmbed("You don’t have permission to mute members!")] });
        }

        // :two: Target member
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            return message.channel.send({ embeds: [errorEmbed("Please mention a member to mute.\nExample: `.mute @user 10m [reason]`")] });
        }

        if (member.id === message.author.id) return message.channel.send({ embeds: [errorEmbed("You cannot mute yourself!")] });
        if (member.id === client.user.id) return message.channel.send({ embeds: [errorEmbed("I cannot mute myself!")] });

        // Role hierarchy check
        if (member.roles.highest.position >= message.member.roles.highest.position) {
            return message.channel.send({ embeds: [errorEmbed("You cannot mute this member because their role is equal or higher than yours!")] });
        }

        // :three: Duration and reason
        if (!args[1]) {
            return message.channel.send({ embeds: [errorEmbed("Please specify a duration.\nExample: `.mute @user 10m [reason]`")] });
        }

        const ms = require("ms"); // npm i ms if you haven’t
        const duration = ms(args[1]);
        if (!duration || duration < 1000) {
            return message.channel.send({ embeds: [errorEmbed("Invalid duration. Use format like `10m`, `1h`, `1d`.")] });
        }

        const reason = args.slice(2).join(" ") || "No reason provided";

        try {
            // :four: Apply timeout
            await member.timeout(duration, reason);

            // :five: Success embed
            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle(":mute: Member Muted / Timed Out")
                .addFields(
                    { name: ":bust_in_silhouette: Member", value: `${member.user.tag} (\`${member.id}\`)`, inline: true },
                    { name: ":shield: Actioned By", value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
                    { name: "⏱ Duration", value: `${args[1]}`, inline: true },
                    { name: ":page_facing_up: Reason", value: reason, inline: false }
                )
                .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
                .setTimestamp();

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            return message.channel.send({ embeds: [errorEmbed("Failed to mute this member. Make sure I have permission and the member is not higher than me.")] });
        }
    }
};