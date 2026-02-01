module.exports = {
    name: "ban",
    aliases: ["b"],
    description: "Ban a user by mention or ID (even if not in server)",

    async execute(client, message, args) {
        if (!message.member.permissions.has("BanMembers")) {
            return message.reply(":x: You do not have permission to ban members.");
        }

        if (!message.guild.members.me.permissions.has("BanMembers")) {
            return message.reply(":x: I do not have permission to ban members.");
        }

        if (!args[0]) {
            return message.reply(":warning: Please mention a user or provide a user ID to ban.");
        }

        // Get target ID (mention or raw ID)
        let targetId =
            message.mentions.users.first()?.id ||
            args[0];

        // Validate ID format
        if (!/^\d+$/.test(targetId)) {
            return message.reply(":x: Invalid user ID.");
        }

        // Ban reason
        let reason = args.slice(1).join(" ") || "No reason provided";

        try {
            // Attempt to ban (WORKS EVEN IF USER NOT IN SERVER)
            await message.guild.bans.create(targetId, {
                reason: `${reason} | Banned by: ${message.author.tag}`
            });

            message.channel.send(
                `🔨 **User Banned Successfully**\n\n` +
                `👤 **User ID:** ${targetId}\n` +
                `🛡 **Banned By:** ${message.author.tag}\n` +
                `📝 **Reason:** ${reason}`
            );

        } catch (err) {
            console.error(err);

            return message.reply(
                ":x: Failed to ban this user.\n" +
                "Possible reasons:\n" +
                "- User is higher than me\n" +
                "- Invalid ID\n" +
                "- Missing permissions"
            );
        }
    }
};