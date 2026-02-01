// commands/lock.js
const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "lock",
    aliases: ["lockdown"],
    description: "Lock the current channel.",
    async execute(client, message) {

        const errorEmbed = (description) => new EmbedBuilder()
            .setColor("Red")
            .setTitle(":warning: Action Failed")
            .setDescription(description)
            .setFooter({ text: `Server: ${message.guild.name} | Moderation Panel` })
            .setTimestamp();

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.channel.send({
                embeds: [errorEmbed("You don’t have permission to lock channels.")]
            });
        }

        const everyoneRole = message.guild.roles.everyone;

        try {
            await message.channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false
            });

            const embed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle(":lock: Channel Locked")
                .setDescription("This channel has been locked. Members can no longer send messages.")
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
                embeds: [errorEmbed("Failed to lock this channel. Check my permissions.")]
            });
        }
    }
};