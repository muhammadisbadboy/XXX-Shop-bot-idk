const fs = require("fs");
const path = require("path");

module.exports = {
    name: "setlogchannel",
    description: "Sets the channel for all audit logs",
    execute: async (client, message, args) => {
        // Only the allowed user can run this
        if (message.author.id !== "1112091588462649364") {
            return message.reply(":x: You are not allowed to use this command.");
        }

        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
        if (!channel) return message.reply(":x: You must mention a channel or provide its ID.");

        const filePath = path.join(__dirname, "..", "logChannel.json");
        let data = {};
        if (fs.existsSync(filePath)) {
            data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        }

        data[message.guild.id] = channel.id;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
        message.reply(`✅ Log channel has been set to ${channel.name}`);
    }
};