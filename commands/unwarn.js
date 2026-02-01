// commands/unwarn.js
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
    name: "unwarn",
    aliases: ["uw"],
    description: "Remove a warning from a member in the server with a professional panel.",
    async execute(client, message, args) {

        const errorEmbed = (description) => new EmbedBuilder()
            .setColor("Blue")
            .setTitle(":warning: Action Failed")
            .setDescription(description)
            .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
            .setTimestamp();

        // Permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.channel.send({ embeds: [errorEmbed("You don’t have permission to unwarn members!")] });
        }

        // Target member
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            return message.channel.send({ embeds: [errorEmbed("Please mention a member to remove the warning from.\nExample: `.unwarn @username`")] });
        }

        if (member.id === message.author.id) return message.channel.send({ embeds: [errorEmbed("You cannot unwarn yourself!")] });
        if (member.id === client.user.id) return message.channel.send({ embeds: [errorEmbed("I cannot unwarn myself!")] });

        // Role hierarchy
        if (member.roles.highest.position >= message.member.roles.highest.position) {
            return message.channel.send({ embeds: [errorEmbed("You cannot unwarn this member because their role is equal or higher than yours!")] });
        }

        try {
            let warnings = loadWarnings();
            if (!warnings[member.id] || warnings[member.id].length === 0) {
                return message.channel.send({ embeds: [errorEmbed("This member has no warnings to remove.")] });
            }

            // Remove last warning
            warnings[member.id].pop();
            if (warnings[member.id].length === 0) delete warnings[member.id]; // clean up
            saveWarnings(warnings);

            // Success embed
            const embed = new EmbedBuilder()
                .setColor("Blue")
                .setTitle(":white_check_mark: Warning Removed")
                .setDescription(`A warning has been **removed** from a member in the server.`)
                .addFields(
                    { name: ":bust_in_silhouette: Member", value: `${member.user.tag} (\`${member.id}\`)`, inline: true },
                    { name: ":shield: Actioned By", value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
                    { name: ":information_source: Remaining Warnings", value: `${warnings[member.id] ? warnings[member.id].length : 0}`, inline: true }
                )
                .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
                .setTimestamp();

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            message.channel.send({ embeds: [errorEmbed("Failed to remove the warning.")] });
        }
    }
};