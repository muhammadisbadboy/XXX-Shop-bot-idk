const fs = require("fs");

module.exports = (client) => {
    const eventFiles = fs.readdirSync(__dirname).filter(file => file.endsWith(".js") && file !== "handler.js");

    for (const file of eventFiles) {
        const event = require(`./${file}`);
        if (event.name && typeof event.execute === "function") {
            if (file.includes("Delete") || file.includes("Update")) {
                client.on(event.name, (...args) => event.execute(...args));
            } else {
                client.once(event.name, (...args) => event.execute(...args));
            }
        }
    }
};