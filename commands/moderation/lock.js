const { PermissionsBitField, EmbedBuilder } = require("discord.js");

const OWNER_ID = process.env.OWNER_ID;

// temp storage for restores
const activeLocks = new Map();

module.exports = {
  name: "lock",
  description: "Lock channel",

  async execute(message, args, client) {
    const member = message.member;

    // =========================
    // PERMISSION CHECK
    // =========================
    if (
      message.author.id !== OWNER_ID &&
      !member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      return message.reply("❌ You need Administrator to use this.");
    }

    // =========================
    // HELP COMMAND
    // =========================
    if (message.content.startsWith(".lockhelp")) {
      const embed = new EmbedBuilder()
        .setTitle("🔒 Lock Command Help")
        .setColor("#2b2d31")
        .setDescription(`
**Usage:**
.lock → lock channel
.lock @user
.lock @role
.lock everyone
.lock all
.lock 10m (temporary)

.unlock → restore

**What it does:**
✔ View Channel
✔ Read Message History
❌ Everything else disabled
        `);
      return message.reply({ embeds: [embed] });
    }

    // =========================
    // UNLOCK
    // =========================
    if (message.content.startsWith(".unlock")) {
      const saved = activeLocks.get(message.channel.id);
      if (!saved) return message.reply("❌ No lock data found.");

      for (const [id, perms] of saved) {
        await message.channel.permissionOverwrites.edit(id, perms).catch(() => {});
      }

      activeLocks.delete(message.channel.id);
      return message.reply("🔓 Channel unlocked.");
    }

    // =========================
    // LOCK LOGIC
    // =========================
    const channel = message.channel;
    const target = message.mentions.members.first() || message.mentions.roles.first();

    let overwriteTarget;

    if (!args[0]) {
      overwriteTarget = channel.guild.roles.everyone;
    } else if (args[0] === "everyone" || args[0] === "all") {
      overwriteTarget = channel.guild.roles.everyone;
    } else if (target) {
      overwriteTarget = target;
    } else {
      overwriteTarget = channel.guild.roles.everyone;
    }

    // =========================
    // SAVE OLD PERMS
    // =========================
    if (!activeLocks.has(channel.id)) {
      activeLocks.set(channel.id, new Map());
    }

    const channelMap = activeLocks.get(channel.id);
    const existing = channel.permissionOverwrites.cache.get(overwriteTarget.id);

    channelMap.set(overwriteTarget.id, {
      allow: existing?.allow?.bitfield || 0n,
      deny: existing?.deny?.bitfield || 0n
    });

    // =========================
    // NEW PERMISSIONS
    // =========================
    await channel.permissionOverwrites.edit(overwriteTarget, {
      ViewChannel: true,
      ReadMessageHistory: true,

      SendMessages: false,
      AddReactions: false,
      SendMessagesInThreads: false,
      CreatePublicThreads: false,
      CreatePrivateThreads: false,
      EmbedLinks: false,
      AttachFiles: false,
      UseExternalEmojis: false,
      UseApplicationCommands: false,
      MentionEveryone: false,
      ManageMessages: false,
      ManageThreads: false,
      SendTTSMessages: false
    });

    // =========================
    // TEMP LOCK
    // =========================
    const timeArg = args.find(a => a.match(/\d+[smhd]/));
    if (timeArg) {
      const time = parseTime(timeArg);

      setTimeout(async () => {
        const saved = activeLocks.get(channel.id);
        if (!saved) return;

        for (const [id, perms] of saved) {
          await channel.permissionOverwrites.edit(id, perms).catch(() => {});
        }

        activeLocks.delete(channel.id);
      }, time);
    }

    return message.reply(`🔒 Channel locked for ${overwriteTarget.name || overwriteTarget.user?.username}`);
  }
};

// =========================
// TIME PARSER
// =========================
function parseTime(str) {
  const num = parseInt(str);
  if (str.endsWith("s")) return num * 1000;
  if (str.endsWith("m")) return num * 60 * 1000;
  if (str.endsWith("h")) return num * 60 * 60 * 1000;
  if (str.endsWith("d")) return num * 24 * 60 * 60 * 1000;
  return 0;
}