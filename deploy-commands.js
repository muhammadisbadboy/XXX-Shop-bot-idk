require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");

const commands = [];
const commandFiles = fs.readdirSync("./slashCommands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./slashCommands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("Registering slash commands...");
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log(":white_check_mark: Slash commands registered");
    } catch (err) {
        console.error(err);
    }
})();