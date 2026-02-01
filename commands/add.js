const fs = require("fs");
const path = require("path");
const ticketsPath = path.join(__dirname, "../tickets.json");

module.exports = {
    name: "add",
    description: "Add a user to the ticket",
    async execute(client, message, args) {
        if (!message.guild) return;
        const tickets = JSON.parse(fs.readFileSync(ticketsPath, "utf8"));
        const ticket = tickets[message.channel.id];
        if (!ticket) return message.reply(":x: This is not a ticket channel.");
        const roleId = "1467121469266989169";

        if (!message.member.roles.cache.has(roleId) && message.author.id !== ticket.claimedBy)
            return message.reply(":x: You cannot add users to this ticket.");

        const user = message.mentions.users.first() || await client.users.fetch(args[0]);
        if (!user) return message.reply(":x: User not found.");

        await message.channel.permissionOverwrites.edit(user.id, {
            ViewChannel: true,
            SendMessages: true
        });

        message.reply(`✅ <@${user.id}> has been added to this ticket.`);
    }
};