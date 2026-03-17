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
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// -------------------------
// Stick Command
// -------------------------
const stickCmd = require('./commands/moderation/stick');

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
// Load Prefix Commands
// -------------------------
function loadPrefixCommands(dir) {
  if (!fs.existsSync(dir)) return;

  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      loadPrefixCommands(fullPath);
    } else if (file.endsWith('.js')) {
      const command = require(fullPath);
      if (command?.name && typeof command.execute === 'function') {
        client.commands.set(command.name, command);
      }
    }
  }
}

loadPrefixCommands(path.join(__dirname, 'commands'));
console.log(`✅ Loaded prefix commands: ${[...client.commands.keys()].join(', ')}`);

// -------------------------
// Load Slash Commands
// -------------------------
const slashDir = path.join(__dirname, 'slashCommands');
if (fs.existsSync(slashDir)) {
  const commandsArray = [];
  for (const file of fs.readdirSync(slashDir).filter(f => f.endsWith('.js'))) {
    const command = require(path.join(slashDir, file));
    if (command?.data && typeof command.execute === 'function') {
      client.slashCommands.set(command.data.name, command);
      commandsArray.push(command.data.toJSON());
    }
  }

  console.log(`✅ Loaded slash commands: ${[...client.slashCommands.keys()].join(', ')}`);

  // -------------------------
  // Register Slash Commands (Guild)
  // -------------------------
  if (process.env.CLIENT_ID && process.env.GUILD_ID && commandsArray.length) {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    (async () => {
      const start = Date.now();
      try {
        console.log('🔹 Registering slash commands...');

        await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
          { body: commandsArray }
        );

        const duration = Date.now() - start;
        console.log(`✅ Slash commands registered in ${duration}ms.`);
        console.log(
          'Registered commands:',
          commandsArray.map(c => c.name).join(', ')
        );
      } catch (err) {
        const duration = Date.now() - start;
        console.error(`❌ Failed to register slash commands after ${duration}ms:`, err);
      }
    })();
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

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else if (event.name !== Events.MessageCreate) {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

// -------------------------
// Handle Prefix Commands
// -------------------------
client.on(Events.MessageCreate, async (message) => {
  if (!message.guild || message.author.bot) return;

  if (stickCmd.stickyListener) stickCmd.stickyListener(message);

  if (client.isMaintenance && message.author.id !== process.env.OWNER_ID) {
    return message.channel.send({
      embeds: [{
        color: 0xe67e22,
        title: '⚠️ Bot Under Maintenance',
        description: `The bot is currently under maintenance.\nDM <@${process.env.OWNER_ID}> for more info.`
      }]
    }).catch(() => {});
  }

  const prefix = client.prefixes.find(p => message.content.startsWith(p));
  if (!prefix) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);
  if (!command || typeof command.execute !== 'function') return;

  try {
    await command.execute(message, args, client);
  } catch (err) {
    console.error(`Error in command ${commandName}:`, err);
    message.reply('❌ There was an error executing that command.').catch(() => {});
  }
});

// -------------------------
// Handle Slash Commands
// -------------------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(`Error executing slash command ${interaction.commandName}:`, err);
    if (!interaction.replied) {
      await interaction.reply({ content: '❌ There was an error executing this command.', ephemeral: true });
    }
  }
});

// -------------------------
// Ready Event
// -------------------------
client.once(Events.ClientReady, () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);
});

// -------------------------
// Login
// -------------------------
client.login(process.env.TOKEN).catch(err => console.error('Failed to login:', err));