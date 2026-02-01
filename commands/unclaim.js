const fs = require("fs");
const path = require("path");
const ticketsPath = path.join(__dirname, "../tickets.json");

module.exports = {
    name: "unclaim",
    description: "Unclaim a ticket",
    async execute(client, message, args) {
        if (!message.channel || !message.guild) return;
        const tickets = JSON.parse(fs.readFileSync(ticketsPath, "utf8"));
        const ticket = tickets[message.channel.id];
        if (!ticket) return message.reply(":x: This is not a ticket channel.");

        const roleId = "1467121469266989169"; // Role allowed to claim
        const overviewId = "1112091588462649364";

        if (!message.member.roles.cache.has(roleId))
            return message.reply(":x: You cannot unclaim this ticket.");

        ticket.claimedBy = null;
        fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2));

        await message.channel.permissionOverwrites.set([
            { id: message.guild.roles.everyone, deny: ["ViewChannel"] },
            { id: roleId, allow: ["ViewChannel", "SendMessages"] },
            { id: ticket.creator, allow: ["ViewChannel", "SendMessages"] },
            { id: overviewId, allow: ["ViewChannel", "SendMessages"] }
        ]);

        message.reply(":white_check_mark: Ticket has been unclaimed. Others can now claim it.");
    }
};