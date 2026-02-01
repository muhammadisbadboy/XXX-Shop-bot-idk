require("dotenv").config();
const fs = require("fs");
const path = require("path");
const {
    Client,
    Collection,
    GatewayIntentBits,
    Partials,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Events
} = require("discord.js");

// =========================
// CLIENT
// =========================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildBans
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// =========================
// FILE PATHS
// =========================
const banLogPath = path.join(__dirname, "banlog.json");
const logChannelPath = path.join(__dirname, "logChannel.json");
const ticketsPath = path.join(__dirname, "tickets.json");

// Ensure tickets.json exists
if (!fs.existsSync(ticketsPath)) fs.writeFileSync(ticketsPath, JSON.stringify({}), "utf8");

// =========================
// LOG FUNCTION
// =========================
function log(message) {
    const logPath = path.join(__dirname, "botlog.txt");
    const timestamp = new Date().toISOString();
    const text = `[${timestamp}] ${message}\n`;
    console.log(text.trim());
    fs.appendFileSync(logPath, text, "utf8");
}

// =========================
// COMMAND HANDLER
// =========================
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.existsSync(commandsPath) ? fs.readdirSync(commandsPath).filter(file => file.endsWith(".js")) : [];
for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.name) client.commands.set(command.name, command);
}

// =========================
// SERVER LOG HELPER
// =========================
const serverLog = async (guild, embed) => {
    if (!fs.existsSync(logChannelPath)) return;
    const data = JSON.parse(fs.readFileSync(logChannelPath, "utf8"));
    const channelId = data[guild.id];
    if (!channelId) return;
    const logChannel = guild.channels.cache.get(channelId);
    if (!logChannel) return;
    logChannel.send({ embeds: [embed] });
};

// =========================
// READY EVENT
// =========================
client.once("ready", () => {
    log(`Bot started successfully as ${client.user.tag}`);
});

// =========================
// MESSAGE HANDLER
// =========================
client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;

    const prefixes = process.env.PREFIXES ? process.env.PREFIXES.split(",") : [".", "?", "$"];
    const prefix = prefixes.find(p => message.content.startsWith(p));
    if (!prefix) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    const command =
        client.commands.get(cmdName) ||
        client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(cmdName));

    if (!command) return;

    try {
        await command.execute(client, message, args);
        log(`Command executed: ${cmdName} by ${message.author.tag}`);
    } catch (err) {
        log(`Error executing command ${cmdName}: ${err}`);
        message.reply(":warning: An error occurred while executing this command.");
    }
});

// =========================
// BAN LOG SYSTEM
// =========================
client.on("guildBanAdd", async (ban) => {
    const guild = ban.guild;
    let data = {};
    if (fs.existsSync(banLogPath)) data = JSON.parse(fs.readFileSync(banLogPath, "utf8"));
    const channelId = data[guild.id];
    if (!channelId) return;
    const logChannel = guild.channels.cache.get(channelId);
    if (!logChannel) return;

    try {
        const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: 22 });
        const banLog = fetchedLogs.entries.first();

        let executor = "Unknown";
        let reason = "No reason provided";
        let bannedBy = "Unknown";

        if (banLog) {
            executor = banLog.executor.tag;
            bannedBy = banLog.executor.bot ? `🤖 Bot: ${banLog.executor.tag}` : `👤 User: ${banLog.executor.tag}`;
            reason = banLog.reason || "No reason provided";
        }

        const logEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("🚨 User Banned")
            .addFields(
                { name: "👤 User", value: `${ban.user.tag} (${ban.user.id})`, inline: false },
                { name: "🔨 Banned By", value: bannedBy, inline: false },
                { name: "🧠 Executor", value: executor, inline: false },
                { name: "📝 Reason", value: reason, inline: false }
            )
            .setTimestamp(new Date());

        serverLog(guild, logEmbed);
    } catch (err) {
        log(`Ban log error: ${err}`);
    }
});

// =========================
// MEMBER LOGS
// =========================
client.on("guildMemberAdd", member => {
    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("✅ Member Joined")
        .setDescription(`${member.user.tag} (${member.id})`)
        .setTimestamp();
    serverLog(member.guild, embed);
});

client.on("guildMemberRemove", member => {
    const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle("⚠️ Member Left")
        .setDescription(`${member.user.tag} (${member.id})`)
        .setTimestamp();
    serverLog(member.guild, embed);
});

client.on("messageDelete", message => {
    if (!message.guild) return;
    const embed = new EmbedBuilder()
        .setColor(0xff4500)
        .setTitle("🗑️ Message Deleted")
        .setDescription(`Author: ${message.author.tag} (${message.author.id})\nContent: ${message.content || "Empty"}`)
        .setTimestamp();
    serverLog(message.guild, embed);
});

// =========================
// TICKET SYSTEM
// =========================
let tickets = {};
if (fs.existsSync(ticketsPath)) tickets = JSON.parse(fs.readFileSync(ticketsPath, "utf8"));
const saveTickets = () => fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2));

const categoryId = "1467206516082868357"; // Ticket category
const roleId = "1467121469266989169"; // Role who can claim
const overviewId = "1112091588462649364"; // Admin overview
const transcriptChannelId = "1467220014162776076"; // Transcript logs

// INTERACTIONS
client.on("interactionCreate", async (interaction) => {
    try {
        if (interaction.isButton()) {
            const { customId, channel, guild, user } = interaction;

            // OPEN TICKET MODAL
            if (customId === "open_ticket") {
                const modal = new ModalBuilder()
                    .setCustomId(`ticket_modal_${user.id}`)
                    .setTitle("Create Trade Ticket");

                const traderInput = new TextInputBuilder()
                    .setCustomId("trader_id")
                    .setLabel("Other Trader (ID or @mention)")
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder("Ex: 2728377337388383 or @trader123")
                    .setRequired(true);

                const valueInput = new TextInputBuilder()
                    .setCustomId("trade_value")
                    .setLabel("Trade Value")
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder("Ex: 2$ or 0")
                    .setRequired(true);

                const detailsInput = new TextInputBuilder()
                    .setCustomId("trade_details")
                    .setLabel("Trade Details")
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder("Describe the trade")
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(traderInput),
                    new ActionRowBuilder().addComponents(valueInput),
                    new ActionRowBuilder().addComponents(detailsInput)
                );

                await interaction.showModal(modal);
            }

            // CLAIM / UNCLAIM / CLOSE
            const ticket = tickets[channel.id];
            if (!ticket) return;

            if (customId === "claim_ticket") {
                if (!interaction.member.roles.cache.has(roleId)) return interaction.reply({ content: "❌ You cannot claim this ticket.", ephemeral: true });

                ticket.claimedBy = user.id;
                saveTickets();

                await channel.permissionOverwrites.set([
                    { id: guild.roles.everyone, deny: ["ViewChannel"] },
                    { id: roleId, deny: ["ViewChannel"] },
                    { id: ticket.creator, allow: ["ViewChannel", "SendMessages"] },
                    { id: user.id, allow: ["ViewChannel", "SendMessages"] },
                    { id: overviewId, allow: ["ViewChannel", "SendMessages"] }
                ]);

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`unclaim_ticket_${channel.id}`).setLabel("Unclaim Ticket").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId("close_ticket").setLabel("Close Ticket").setStyle(ButtonStyle.Danger)
                );

                await interaction.update({ content: `✅ Ticket claimed by <@${user.id}>`, components: [row] });
            } else if (customId.startsWith("unclaim_ticket_")) {
                ticket.claimedBy = null;
                saveTickets();

                await channel.permissionOverwrites.set([
                    { id: guild.roles.everyone, deny: ["ViewChannel"] },
                    { id: roleId, allow: ["ViewChannel", "SendMessages"] },
                    { id: ticket.creator, allow: ["ViewChannel", "SendMessages"] },
                    { id: overviewId, allow: ["ViewChannel", "SendMessages"] }
                ]);

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("claim_ticket").setLabel("Claim Ticket").setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId("close_ticket").setLabel("Close Ticket").setStyle(ButtonStyle.Danger)
                );

                await interaction.update({ content: "✅ Ticket unclaimed.", components: [row] });
            } else if (customId === "close_ticket") {
                const transcriptChannel = guild.channels.cache.get(transcriptChannelId);

                const embed = new EmbedBuilder()
                    .setTitle(`🎫 Ticket Transcript - ${channel.name}`)
                    .setDescription(`**Creator:** <@${ticket.creator}>\n**Trader:** ${ticket.trader}\n**Value:** ${ticket.value}\n**Details:** ${ticket.details}\n**Claimed By:** ${ticket.claimedBy ? `<@${ticket.claimedBy}>` : "None"}`)
                    .setTimestamp();

                if (transcriptChannel) transcriptChannel.send({ embeds: [embed] });

                delete tickets[channel.id];
                saveTickets();

                await channel.delete();
            }
        }

        // MODAL SUBMIT
        if (interaction.isModalSubmit() && interaction.customId.startsWith("ticket_modal_")) {
            const traderId = interaction.fields.getTextInputValue("trader_id");
            const value = interaction.fields.getTextInputValue("trade_value");
            const details = interaction.fields.getTextInputValue("trade_details");

            const channel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: 0,
                parent: categoryId,
                permissionOverwrites: [
                    { id: interaction.guild.roles.everyone, deny: ["ViewChannel"] },
                    { id: roleId, allow: ["ViewChannel", "SendMessages"] },
                    { id: interaction.user.id, allow: ["ViewChannel", "SendMessages"] },
                    { id: overviewId, allow: ["ViewChannel", "SendMessages"] }
                ]
            });

            tickets[channel.id] = {
                creator: interaction.user.id,
                trader: traderId,
                value,
                details,
                claimedBy: null,
                createdAt: Date.now()
            };
            saveTickets();

            const embed = new EmbedBuilder()
                .setTitle("🎫 Ticket Created")
                .setDescription(`**Trader:** ${traderId}\n**Value:** ${value}\n**Details:** ${details}`)
                .setColor("#2f3136");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("claim_ticket").setLabel("Claim Ticket").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("close_ticket").setLabel("Close Ticket").setStyle(ButtonStyle.Danger)
            );

            await channel.send({ content: `<@${roleId}>`, embeds: [embed], components: [row] });
            await interaction.reply({ content: `✅ Your ticket has been created: ${channel}`, ephemeral: true });
        }
    } catch (err) {
        log(`Ticket interaction error: ${err}`);
    }
});

// =========================
// GLOBAL ERROR HANDLING
// =========================
process.on("unhandledRejection", err => log(`Unhandled Rejection: ${err}`));
process.on("uncaughtException", err => log(`Uncaught Exception: ${err}`));

// =========================
// LOGIN
// =========================
log("Bot is starting...");
client.login(process.env.TOKEN).catch(err => log(`Login failed: ${err}`));