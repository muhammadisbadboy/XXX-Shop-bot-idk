require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  ChannelType,
  Events,
  REST,
  Routes
} = require('discord.js');

// -------------------------
// Create Client
// -------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,     // ✅ Required for member info
    GatewayIntentBits.GuildPresences    // ✅ Required for status
  ],
  partials: [Partials.Channel, Partials.GuildMember]
});

// -------------------------
// Collections & Prefixes
// -------------------------
client.commands = new Collection();
client.slashCommands = new Collection();
client.prefixes = process.env.PREFIXES
  ? process.env.PREFIXES.split(',').map(p => p.trim())
  : ['.'];
client.isMaintenance = false;

// -------------------------
// Load Prefix Commands
// -------------------------
function loadPrefixCommands(dir) {
  if (!fs.existsSync(dir)) return [];
  const loaded = [];
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) loaded.push(...loadPrefixCommands(fullPath));
    else if (file.endsWith('.js')) {
      const cmd = require(fullPath);
      if (cmd?.name && typeof cmd.execute === 'function') {
        client.commands.set(cmd.name, cmd);
        loaded.push(cmd.name);
      }
    }
  }
  return loaded;
}
const loadedPrefixCommands = loadPrefixCommands(path.join(__dirname, 'commands'));

// -------------------------
// Load Slash Commands
// -------------------------
function loadSlashCommands(dir) {
  if (!fs.existsSync(dir)) return { loaded: [], array: [] };
  const loaded = [];
  const arrayForREST = [];
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const { loaded: nested, array: nestedArray } = loadSlashCommands(fullPath);
      loaded.push(...nested);
      arrayForREST.push(...nestedArray);
    } else if (file.endsWith('.js')) {
      const cmd = require(fullPath);
      if (cmd?.data && typeof cmd.execute === 'function') {
        client.slashCommands.set(cmd.data.name, cmd);
        loaded.push(cmd.data.name);
        arrayForREST.push(cmd.data.toJSON());
      }
    }
  }
  return { loaded, array: arrayForREST };
}
const { loaded: loadedSlashCommands, array: slashCommandsArray } = loadSlashCommands(
  path.join(__dirname, 'slashCommands')
);

console.log('Prefix commands:', loadedPrefixCommands.join(', '));
console.log('Slash commands:', loadedSlashCommands.join(', '));

// -------------------------
// Register Slash Commands
// -------------------------
async function registerSlashCommands() {
  if (!process.env.CLIENT_ID || !process.env.GUILD_ID || slashCommandsArray.length === 0) return;
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: slashCommandsArray }
    );
    console.log(`🚀 Registered ${slashCommandsArray.length} slash commands`);
  } catch (err) {
    console.error('❌ Failed to register slash commands:', err);
  }
}

// -------------------------
// Load Events
// -------------------------
const eventPath = path.join(__dirname, 'events');
if (fs.existsSync(eventPath)) {
  for (const file of fs.readdirSync(eventPath).filter(f => f.endsWith('.js'))) {
    const event = require(path.join(eventPath, file));
    if (!event?.name || typeof event.execute !== 'function') continue;
    if (event.once) client.once(event.name, (...args) => event.execute(...args));
    else client.on(event.name, (...args) => event.execute(...args));
  }
}

// -------------------------
// Ready Event
// -------------------------
client.once(Events.ClientReady, async () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);
  await registerSlashCommands();
});

// -------------------------
// Login
// -------------------------
client.login(process.env.TOKEN).catch(err => console.error('Failed to login:', err));