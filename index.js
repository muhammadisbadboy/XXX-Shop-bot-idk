// index.js
require('dotenv').config();
const { Client, Collection, GatewayIntentBits, Partials, ChannelType, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

// -------------------------
// Debug Environment Variables
// -------------------------
if (!process.env.TOKEN) {
  console.error('❌ BOT TOKEN is missing! Make sure TOKEN is set in Railway Environment Variables or .env locally.');
  process.exit(1);
} else {
  console.log('✅ BOT TOKEN detected (length):', process.env.TOKEN.length);
}

if (!process.env.OWNER_ID) {
  console.warn('⚠️ OWNER_ID is missing! Maintenance commands may not work.');
}

if (!process.env.PREFIXES) {
  console.log('ℹ️ PREFIXES not set, using default "."');
}

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
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

// -------------------------
// Collections & Prefixes
// -------------------------
client.commands = new Collection();
client.prefixes = process.env.PREFIXES
  ? process.env.PREFIXES.split(',').map(p => p.trim())
  : ['.'];
client.isMaintenance = false;

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
    try {
      channel = await guild.channels.create({
        name: 'mod-logs',
        type: ChannelType.GuildText,
        reason: 'Auto-created moderation log channel'
      });
    } catch (err) {
      console.error('Failed to create mod-log channel:', err);
      return null;
    }
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
// Load Events
// -------------------------
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
// -------------------------
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
// Ready
// -------------------------
client.once(Events.ClientReady, () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);
});

// -------------------------
// Login
// -------------------------
client.login(process.env.TOKEN).catch(err => {
  console.error('❌ Failed to login. Check TOKEN again!', err);
  process.exit(1);
});