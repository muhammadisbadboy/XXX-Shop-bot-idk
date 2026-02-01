// commands/unban.js
const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "unban",
    aliases: ["ub"],
    description: "Unban a member from the server with a professional panel.",
    async execute(client, message, args) {

        // Reusable embed for errors
        const errorEmbed = (description) => new EmbedBuilder()
            .setColor("Green")
            .setTitle(":warning: Action Failed")
            .setDescription(description)
            .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
            .setTimestamp();

        // :one: Permissions check
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.channel.send({ embeds: [errorEmbed("You don’t have permission to unban members!")] });
        }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.channel.send({ embeds: [errorEmbed("I don’t have permission to unban members!")] });
        }

        // :two: Check for user ID
        const userId = args[0];
        if (!userId) {
            return message.channel.send({ embeds: [errorEmbed("Please provide a user ID to unban.\nExample: `.unban 123456789012345678`")] });
        }

        try {
            // Fetch ban list
            const bans = await message.guild.bans.fetch();
            const bannedUser = bans.get(userId);

            if (!bannedUser) {
                return message.channel.send({ embeds: [errorEmbed("This user is not banned or the ID is invalid.")] });
            }

            // Unban
            await message.guild.members.unban(userId);

            // :three: Success embed panel
            const embed = new EmbedBuilder()
                .setColor("Green")
                .setTitle(":white_check_mark: Member Unbanned")
                .setDescription(`A member has been **unbanned** from the server.`)
                .addFields(
                    { name: ":bust_in_silhouette: Member", value: `${bannedUser.user.tag} (\`${bannedUser.user.id}\`)`, inline: true },
                    { name: ":shield: Unbanned By", value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true },
                )
                .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
                .setTimestamp();

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            message.channel.send({ embeds: [errorEmbed("Failed to unban the member. Make sure the ID is correct and I have permission.")] });
        }
    }
};