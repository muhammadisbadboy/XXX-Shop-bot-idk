// commands/role.js
const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "role",
    aliases: ["roles"],
    description: "Add or remove a role from a member.",
    async execute(client, message, args) {

        const error = (d) => new EmbedBuilder()
            .setColor("Red")
            .setTitle(":warning: Action Failed")
            .setDescription(d)
            .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
            .setTimestamp();

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.channel.send({ embeds: [error("You don’t have permission to manage roles.")] });
        }

        const action = args[0]?.toLowerCase();
        if (!["add", "remove"].includes(action)) {
            return message.channel.send({
                embeds: [error("Invalid action.\nUsage: `.role add @user @role`\nUsage: `.role remove @user @role`")]
            });
        }

        const member = message.mentions.members.first();
        const role = message.mentions.roles.first();

        if (!member || !role) {
            return message.channel.send({
                embeds: [error("Please mention both a member and a role.")]
            });
        }

        if (role.position >= message.member.roles.highest.position) {
            return message.channel.send({
                embeds: [error("You cannot manage a role equal or higher than your highest role.")]
            });
        }

        if (role.position >= message.guild.members.me.roles.highest.position) {
            return message.channel.send({
                embeds: [error("I cannot manage this role because it is higher than mine.")]
            });
        }

        try {
            if (action === "add") {
                if (member.roles.cache.has(role.id)) {
                    return message.channel.send({ embeds: [error("This member already has this role.")] });
                }

                await member.roles.add(role);

                const embed = new EmbedBuilder()
                    .setColor("Green")
                    .setTitle(":heavy_plus_sign: Role Added")
                    .addFields(
                        { name: ":bust_in_silhouette: Member", value: member.user.tag, inline: true },
                        { name: ":performing_arts: Role", value: role.toString(), inline: true },
                        { name: ":shield: Actioned By", value: message.author.tag, inline: true }
                    )
                    .setTimestamp();

                message.channel.send({ embeds: [embed] });

            } else {
                if (!member.roles.cache.has(role.id)) {
                    return message.channel.send({ embeds: [error("This member does not have this role.")] });
                }

                await member.roles.remove(role);

                const embed = new EmbedBuilder()
                    .setColor("Orange")
                    .setTitle(":heavy_minus_sign: Role Removed")
                    .addFields(
                        { name: ":bust_in_silhouette: Member", value: member.user.tag, inline: true },
                        { name: ":performing_arts: Role", value: role.toString(), inline: true },
                        { name: ":shield: Actioned By", value: message.author.tag, inline: true }
                    )
                    .setTimestamp();

                message.channel.send({ embeds: [embed] });
            }
        } catch (err) {
            console.error(err);
            message.channel.send({ embeds: [error("Failed to modify role. Check permissions.")] });
        }
    }
};