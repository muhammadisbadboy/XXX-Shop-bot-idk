// commands/unlock.js
const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "unlock",
    aliases: ["unlockdown"],
    description: "Unlock the current channel.",
    async execute(client, message) {

        const errorEmbed = (description) => new EmbedBuilder()
            .setColor("Red")
            .setTitle(":warning: Action Failed")
            .setDescription(description)
            .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
            .setTimestamp();

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.channel.send({
                embeds: [errorEmbed("You don’t have permission to unlock channels.")]
            });
        }

        const everyoneRole = message.guild.roles.everyone;

        try {
            await message.channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: null
            });

            const embed = new EmbedBuilder()
                .setColor("Green")
                .setTitle(":unlock: Channel Unlocked")
                .setDescription("This channel has been unlocked. Members can send messages again.")
                .addFields(
                    { name: ":pushpin: Channel", value: `${message.channel}`, inline: true },
                    { name: ":shield: Actioned By", value: `${message.author.tag}`, inline: true }
                )
                .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
                .setTimestamp();

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            message.channel.send({
                embeds: [errorEmbed("Failed to unlock this channel. Check my permissions.")]
            });
        }
    }
};