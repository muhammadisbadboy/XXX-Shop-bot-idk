const { PermissionsBitField, ChannelType } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    async execute(interaction, client) {
        if (!interaction.isButton()) return;

        if (interaction.customId === "create_ticket") {
            const guild = interaction.guild;
            const member = interaction.member;

            const ticketChannel = await guild.channels.create({
                name: `ticket-${member.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: member.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                    }
                ],
            });

            await ticketChannel.send(`Hello ${member}, welcome to your ticket!`);
            await interaction.reply({ content: `Ticket created: ${ticketChannel}`, ephemeral: true });
        }
    },
};