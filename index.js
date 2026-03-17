require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  Events,
  REST,
  Routes
} = require('discord.js');

// -------------------------
// CLIENT
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
// SETUP
// -------------------------
client.commands = new Collection();
client.slashCommands = new Collection();
client.prefixes = process.env.PREFIXES
  ? process.env.PREFIXES.split(',').map(p => p.trim())
  : ['.'];

client.isMaintenance = false;

// -------------------------
// LOAD PREFIX COMMANDS
// -------------------------
function loadCommands(dir) {
  if (!fs.existsSync(dir)) return [];

  const loaded = [];

  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      loaded.push(...loadCommands(full));
    } else if (file.endsWith('.js')) {
      const cmd = require(full);
      if (cmd?.name && typeof cmd.execute === 'function') {
        client.commands.set(cmd.name, cmd);
        loaded.push(cmd.name);
      }
    }
  }

  return loaded;
}

const prefixLoaded = loadCommands(path.join(__dirname, 'commands'));

// -------------------------
// LOAD SLASH COMMANDS
// -------------------------
function loadSlash(dir) {
  if (!fs.existsSync(dir)) return { loaded: [], array: [] };

  const loaded = [];
  const arr = [];

  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      const sub = loadSlash(full);
      loaded.push(...sub.loaded);
      arr.push(...sub.array);
    } else if (file.endsWith('.js')) {
      const cmd = require(full);
      if (cmd?.data && typeof cmd.execute === 'function') {
        client.slashCommands.set(cmd.data.name, cmd);
        loaded.push(cmd.data.name);
        arr.push(cmd.data.toJSON());
      }
    }
  }

  return { loaded, array: arr };
}

const { loaded: slashLoaded, array: slashArray } = loadSlash(
  path.join(__dirname, 'slashCommands')
);

// -------------------------
// LOG LOADED
// -------------------------
console.log('Commands:', prefixLoaded.join(', ') || 'None');
console.log('Slash Commands:', slashLoaded.join(', ') || 'None');

// -------------------------
// REGISTER SLASH
// -------------------------
async function registerSlash() {
  if (!process.env.CLIENT_ID || !process.env.GUILD_ID || !slashArray.length) return;

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: slashArray }
    );
    console.log(`✅ Registered ${slashArray.length} slash commands`);
  } catch (err) {
    console.error('Slash register error:', err);
  }
}

// -------------------------
// LOAD EVENTS (ONLY ONCE)
// -------------------------
const eventsPath = path.join(__dirname, 'events');

if (fs.existsSync(eventsPath)) {
  for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
    const event = require(path.join(eventsPath, file));

    if (!event?.name || !event.execute) continue;

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

// -------------------------
// READY
// -------------------------
client.once(Events.ClientReady, async () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);
  await registerSlash();
});

// -------------------------
// LOGIN
// -------------------------
client.login(process.env.TOKEN).catch(console.error);