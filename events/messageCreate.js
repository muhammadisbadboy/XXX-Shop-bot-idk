module.exports = {
    name: "messageCreate",
    async execute(message, client) {
        if (message.author.bot) return;
        if (!message.content.startsWith(process.env.PREFIX)) return;

        const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName);
        if (!command) return;

        try {
            await command.execute(message, args, client);
        } catch (err) {
            console.error("Error executing command:", err);
            message.reply("Something went wrong!");
        }
    },
};