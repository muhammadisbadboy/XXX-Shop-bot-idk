// commands/demote.js
const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "demote",
    description: "Demote a member by removing a role.",
    async execute(client, message, args) {

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return;

        const member = message.mentions.members.first();
        const role = message.mentions.roles.first();

        if (!member || !role) {
            return message.channel.send(":warning: Usage: `.demote @user @role`");
        }

        if (!member.roles.cache.has(role.id)) {
            return message.channel.send(":warning: This member does not have that role.");
        }

        await member.roles.remove(role);

        const embed = new EmbedBuilder()
            .setColor("Orange")
            .setTitle(":chart_with_downwards_trend: Member Demoted")
            .addFields(
                { name: ":bust_in_silhouette: Member", value: member.user.tag, inline: true },
                { name: ":military_medal: Removed Role", value: role.toString(), inline: true },
                { name: ":shield: By", value: message.author.tag, inline: true }
            )
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};