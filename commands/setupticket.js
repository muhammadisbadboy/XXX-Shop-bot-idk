const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "setupticket",
    description: "Setup ticket panel",
    async execute(client, message, args) {
        const adminId = "1112091588462649364";
        if (message.author.id !== adminId) {
            return message.reply(":x: Only the bot owner can use this command.");
        }

        const embed = new EmbedBuilder()
            .setTitle(":tickets: Trade Ticket System")
            .setDescription(
                "**Need a middleman or support?**\n\n" +
                "Click the button below to open a trade ticket.\n" +
                "You will be asked a few questions before the ticket is created."
            )
            .setColor("#2f3136")
            .setFooter({ text: "Secure Trading System" });

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("open_ticket")
                .setLabel("Create Ticket")
                .setStyle(ButtonStyle.Success)
        );

        await message.channel.send({
            embeds: [embed],
            components: [button]
        });

        await message.reply(":white_check_mark: Ticket panel has been successfully set up in this channel.");
    }
};