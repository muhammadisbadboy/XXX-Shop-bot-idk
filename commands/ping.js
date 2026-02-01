module.exports = {
    name: "ping",
    aliases: [],
    async execute(client, message, args) {
        message.reply(":ping_pong: Pong!");
    }
};