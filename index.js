require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials, ChannelType, Events, REST, Routes } = require('discord.js');

// -------------------------
// Create Client
// -------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// -------------------------
// Collections & Prefixes
// -------------------------
client.commands = new Collection();
client.prefixes = process.env.PREFIXES
  ? process.env.PREFIXES.split(',').map(p => p.trim())
  : ['.']; // default prefix
client.isMaintenance = false; // maintenance mode flag

// -------------------------
// Mod-Log System
// -------------------------
client.modLogChannels = new Map();

client.getModLogChannel = async function (guild) {
  if (client.modLogChannels.has(guild.id)) return client.modLogChannels.get(guild.id);

  let channel = guild.channels.cache.find(
    c => c.name === 'mod-logs' && c.type === ChannelType.GuildText
  );

  if (!channel) {
    channel = await guild.channels.create({
      name: 'mod-logs',
      type: ChannelType.GuildText,
      reason: 'Auto-created moderation log channel'
    }).catch(console.error);
  }

  if (channel) client.modLogChannels.set(guild.id, channel);
  return channel;
};

client.logMod = async function (guild, embed) {
  const channel = await client.getModLogChannel(guild);
  if (!channel) return;
  return channel.send({ embeds: [embed] }).catch(console.error);
};

// -------------------------
// Load Commands Recursively
// -------------------------
function loadCommands(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      loadCommands(fullPath);
    } else if (file.endsWith('.js')) {
      const command = require(fullPath);
      if (command?.name && typeof command.execute === 'function') {
        client.commands.set(command.name, command);
      }
    }
  }
}
loadCommands(path.join(__dirname, 'commands'));
console.log(`✅ Loaded commands: ${[...client.commands.keys()].join(', ')}`);

// -------------------------
// Register Ticket Commands (for testing)
const ticketCmdsDir = path.join(__dirname, 'commands', 'ticketcmds');
if (fs.existsSync(ticketCmdsDir)) {
  const commandsArray = [];
  for (const file of fs.readdirSync(ticketCmdsDir).filter(f => f.endsWith('.js'))) {
    const command = require(path.join(ticketCmdsDir, file));
    client.commands.set(command.data?.name || command.name, command);
    if (command.data) commandsArray.push(command.data.toJSON());
  }

  // Register with Discord (guild commands)
  if (process.env.CLIENT_ID && process.env.GUILD_ID && commandsArray.length) {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    (async () => {
      try {
        console.log('🔹 Registering ticket commands...');
        await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
          { body: commandsArray }
        );
        console.log('✅ Ticket commands registered.');
      } catch (err) {
        console.error(err);
      }
    })();
  }
}

// -------------------------
// Load Events (except messageCreate)
const eventPath = path.join(__dirname, 'events');
if (fs.existsSync(eventPath)) {
  const eventFiles = fs.readdirSync(eventPath).filter(f => f.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(path.join(eventPath, file));
    if (!event?.name || typeof event.execute !== 'function') continue;

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else if (event.name !== 'messageCreate') {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

// -------------------------
// Handle Messages (Prefix Commands)
client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot) return;

  if (client.isMaintenance && message.author.id !== process.env.OWNER_ID) {
    const embed = {
      color: 0xe67e22,
      title: '⚠️ Bot Under Maintenance',
      description: `The bot is currently under maintenance.\nDM <@${process.env.OWNER_ID}> for more info.`
    };
    return message.channel.send({ embeds: [embed] }).catch(() => {});
  }

  const prefix = client.prefixes.find(p => message.content.startsWith(p));
  if (!prefix) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, client);
  } catch (err) {
    console.error(err);
    message.reply({ content: '❌ There was an error executing that command.' }).catch(() => {});
  }
});

// -------------------------
// Ready Event
client.once(Events.ClientReady, () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);
});

// -------------------------
// Login
client.login(process.env.TOKEN).catch(err => console.error('Failed to login:', err));