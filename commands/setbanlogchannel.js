const fs = require("fs");
const path = require("path");

const allowedUserID = "1112091588462649364"; // Only this user can set the channel

module.exports = {
    name: "setbanlogchannel",
    description: "Sets the channel where all bans will be logged",
    async execute(client, message, args) {
        if (message.author.id !== allowedUserID)
            return message.reply(":x: You are not allowed to use this command.");

        const channel = message.mentions.channels.first();
        if (!channel)
            return message.reply(":x: Please mention a channel to set as ban log.");

        // Save to JSON
        const filePath = path.join(__dirname, "..", "banlog.json");
        const data = { channelID: channel.id };
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));

        message.channel.send(`✅ Ban log channel has been set to ${channel}`);
    }
};