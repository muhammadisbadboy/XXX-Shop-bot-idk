// commands/purge.js
const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "purge",
    aliases: ["clear"],
    description: "Delete multiple messages from a channel.",
    async execute(client, message, args) {

        const errorEmbed = (description) => new EmbedBuilder()
            .setColor("Red")
            .setTitle(":warning: Action Failed")
            .setDescription(description)
            .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
            .setTimestamp();

        // Permission check
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.channel.send({
                embeds: [errorEmbed("You don’t have permission to delete messages.")]
            });
        }

        const amount = parseInt(args[0]);

        if (!amount || isNaN(amount)) {
            return message.channel.send({
                embeds: [errorEmbed(
                    "Please specify how many messages to delete.\nExample: `.purge 20`"
                )]
            });
        }

        if (amount < 1 || amount > 100) {
            return message.channel.send({
                embeds: [errorEmbed(
                    "You can only delete between **1 and 100** messages at once."
                )]
            });
        }

        try {
            // Delete the command message
            await message.delete().catch(() => {});

            const deleted = await message.channel.bulkDelete(amount, true);

            const embed = new EmbedBuilder()
                .setColor("Green")
                .setTitle(":broom: Messages Purged")
                .addFields(
                    { name: ":pushpin: Channel", value: `${message.channel}`, inline: true },
                    { name: ":wastebasket: Deleted", value: `${deleted.size} messages`, inline: true },
                    { name: ":shield: Actioned By", value: `${message.author.tag}`, inline: true }
                )
                .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
                .setTimestamp();

            message.channel.send({ embeds: [embed] }).then(msg => {
                setTimeout(() => msg.delete().catch(() => {}), 5000);
            });

        } catch (err) {
            console.error(err);
            message.channel.send({
                embeds: [errorEmbed(
                    "Failed to delete messages. Messages older than **14 days** cannot be deleted."
                )]
            });
        }
    }
};