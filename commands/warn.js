// commands/warn.js
const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");

// Path to warnings JSON
const warningsFile = path.join(__dirname, "../data/warnings.json");

// Load and save functions
function loadWarnings() {
    if (!fs.existsSync(warningsFile)) return {};
    return JSON.parse(fs.readFileSync(warningsFile, "utf8"));
}
function saveWarnings(warnings) {
    fs.writeFileSync(warningsFile, JSON.stringify(warnings, null, 2));
}

module.exports = {
    name: "warn",
    aliases: ["w"],
    description: "Warn a member in the server with a professional panel.",
    async execute(client, message, args) {

        const errorEmbed = (description) => new EmbedBuilder()
            .setColor("Yellow")
            .setTitle(":warning: Action Failed")
            .setDescription(description)
            .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
            .setTimestamp();

        // Permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.channel.send({ embeds: [errorEmbed("You don’t have permission to warn members!")] });
        }

        // Target member
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            return message.channel.send({ embeds: [errorEmbed("Please mention a member to warn.\nExample: `.warn @username [reason]`")] });
        }

        if (member.id === message.author.id) return message.channel.send({ embeds: [errorEmbed("You cannot warn yourself!")] });
        if (member.id === client.user.id) return message.channel.send({ embeds: [errorEmbed("I cannot warn myself!")] });

        // Role hierarchy
        if (member.roles.highest.position >= message.member.roles.highest.position) {
            return message.channel.send({ embeds: [errorEmbed("You cannot warn this member because their role is equal or higher than yours!")] });
        }

        const reason = args.slice(1).join(" ") || "No reason provided";

        try {
            // Save warning
            let warnings = loadWarnings();
            if (!warnings[member.id]) warnings[member.id] = [];
            warnings[member.id].push({
                reason: reason,
                by: message.author.id,
                date: new Date()
            });
            saveWarnings(warnings);

            // Success embed
            const embed = new EmbedBuilder()
                .setColor("Yellow")
                .setTitle(":warning: Member Warned")
                .setDescription(`A member has been **warned** in the server.`)
                .addFields(
                    { name: ":bust_in_silhouette: Member", value: `${member.user.tag} (\`${member.id}\`)`, inline: true },
                    { name: ":shield: Warned By", value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
                    { name: ":page_facing_up: Reason", value: reason, inline: false },
                    { name: ":information_source: Total Warnings", value: `${warnings[member.id].length}`, inline: true }
                )
                .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
                .setTimestamp();

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            message.channel.send({ embeds: [errorEmbed("Failed to warn the member.")] });
        }
    }
};