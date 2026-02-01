// commands/promote.js
const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "promote",
    description: "Promote a member by adding a role.",
    async execute(client, message, args) {

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return;

        const member = message.mentions.members.first();
        const role = message.mentions.roles.first();

        if (!member || !role) {
            return message.channel.send(":warning: Usage: `.promote @user @role`");
        }

        if (role.position >= message.member.roles.highest.position) {
            return message.channel.send(":warning: You cannot promote to a role higher than yours.");
        }

        await member.roles.add(role);

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle(":chart_with_upwards_trend: Member Promoted")
            .addFields(
                { name: ":bust_in_silhouette: Member", value: member.user.tag, inline: true },
                { name: ":military_medal: New Role", value: role.toString(), inline: true },
                { name: ":shield: By", value: message.author.tag, inline: true }
            )
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};