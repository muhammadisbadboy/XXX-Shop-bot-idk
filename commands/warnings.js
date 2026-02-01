// commands/warnings.js
const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");

// Path to your warnings JSON file
const warningsFile = path.join(__dirname, "../data/warnings.json");

// Load warnings safely
function loadWarnings() {
    if (!fs.existsSync(warningsFile)) return {};
    return JSON.parse(fs.readFileSync(warningsFile, "utf8"));
}

module.exports = {
    name: "warnings",
    aliases: ["warns"],
    description: "Check all warnings of a member in the server.",
    async execute(client, message, args) {

        const errorEmbed = (description) => new EmbedBuilder()
            .setColor("Purple")
            .setTitle(":warning: Action Failed")
            .setDescription(description)
            .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
            .setTimestamp();

        // :one: Permissions check
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.channel.send({ embeds: [errorEmbed("You don’t have permission to view warnings!")] });
        }

        // :two: Target member
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            return message.channel.send({ embeds: [errorEmbed("Please mention a member to check warnings.\nExample: `.warnings @username`")] });
        }

        // :three: Load warnings
        const warnings = loadWarnings();
        const memberWarnings = warnings[member.id] || [];

        if (memberWarnings.length === 0) {
            return message.channel.send({ embeds: [errorEmbed("This member has no warnings.")] });
        }

        // :four: Build embed panel
        const embed = new EmbedBuilder()
            .setColor("Purple")
            .setTitle(":pencil: Member Warnings")
            .setDescription(`Showing all warnings for **${member.user.tag}**`)
            .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
            .setTimestamp();

        // Add each warning as a field
        memberWarnings.forEach((warn, index) => {
            embed.addFields({
                name: `Warning ${index + 1}`,
                value: `**Reason:** ${warn.reason}\n**Warned By:** <@${warn.by}>\n**Date:** <t:${Math.floor(new Date(warn.date).getTime() / 1000)}:f>`
            });
        });

        message.channel.send({ embeds: [embed] });
    }
};