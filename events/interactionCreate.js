const fs = require("fs");
const {
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder
} = require("discord.js");

const eco = require("../systems/economySystem");
const ui = require("../systems/uiBuilder");
const ticketManager = require("../utils/ticketManager");

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction, client) {
    if (!interaction.guild) return;

    const guild = interaction.guild;
    const claimRoleId = "1465699111931215903";
    const allowedUsers = [process.env.OWNER_ID, process.env.SERVER_OWNER];

    // ===============================
    // SAFE REPLY SYSTEM
    // ===============================
    const reply = async (data, ephemeral = false) => {
      try {
        if (interaction.replied || interaction.deferred) {
          return interaction.followUp({ ...data, ephemeral });
        }
        return interaction.reply({ ...data, ephemeral });
      } catch {}
    };

    const defer = async (ephemeral = false) => {
      try {
        if (!interaction.deferred && !interaction.replied) {
          await interaction.deferReply({ ephemeral });
        }
      } catch {}
    };

    const edit = async (data) => {
      try {
        if (interaction.deferred) {
          return interaction.editReply(data);
        }
      } catch {}
    };

    // ===============================
    // SLASH COMMANDS
    // ===============================
    if (interaction.isChatInputCommand()) {
      const command = client.slashCommands.get(interaction.commandName);
      if (!command) return;

      try {
        await defer(false);
        await command.execute(interaction, client);
      } catch (err) {
        console.error(`Slash Error: ${interaction.commandName}`, err);
        return reply({ content: "❌ Command failed." }, true);
      }
      return;
    }

    // ===============================
    // BUTTONS
    // ===============================
    if (interaction.isButton()) {
      const id = interaction.customId;

      await defer(false);

      let userData;
      try {
        userData = await eco.getUser(interaction.user.id);
      } catch {
        userData = { money: 0, lastWork: 0, lastDaily: 0 };
      }

      const now = Date.now();

      // ---------- ECONOMY ----------
      if (id.startsWith("eco_")) {
        // WORK
        if (id === "eco_work") {
          const cooldown = 5 * 60 * 1000;

          if (now - (userData.lastWork || 0) < cooldown) {
            return edit({ content: "⏳ Wait before working again.", components: [] });
          }

          const amount = Math.floor(Math.random() * 400) + 100;

          await eco.addMoney(interaction.user.id, amount);
          await eco.setCooldown(interaction.user.id, "lastWork");

          const updated = await eco.getUser(interaction.user.id);

          const embed = ui.mainPanel(interaction.user, updated)
            .setDescription(`💼 You earned **$${amount}**`);

          return edit({ embeds: [embed], components: ui.mainButtons() });
        }

        // DAILY
        if (id === "eco_daily") {
          const cooldown = 86400000;

          if (now - (userData.lastDaily || 0) < cooldown) {
            return edit({ content: "⏳ Already claimed.", components: [] });
          }

          await eco.addMoney(interaction.user.id, 1000);
          await eco.setCooldown(interaction.user.id, "lastDaily");

          const updated = await eco.getUser(interaction.user.id);

          const embed = ui.mainPanel(interaction.user, updated)
            .setDescription(`🎁 You got **$1000**`);

          return edit({ embeds: [embed], components: ui.mainButtons() });
        }
      }

      // ---------- ROLE RESTORE ----------
      if (id.startsWith("restore_roles_")) {
        if (!allowedUsers.includes(interaction.user.id)) {
          return reply({ content: "❌ Not allowed." }, true);
        }

        const guildID = id.split("_")[2];
        const file = `./backups/${guildID}_roles.json`;

        if (!fs.existsSync(file)) {
          return edit({ content: "❌ Backup not found." });
        }

        const backup = JSON.parse(fs.readFileSync(file, "utf8"));
        const targetGuild = client.guilds.cache.get(guildID);

        if (!targetGuild) return edit({ content: "❌ Guild missing." });

        const createdRoles = {};

        for (const role of backup.roles) {
          try {
            const r = await targetGuild.roles.create({
              name: role.name,
              color: role.color,
              permissions: BigInt(role.permissions)
            });
            createdRoles[role.name] = r;
          } catch {}
        }

        for (const id in backup.members) {
          const member = await targetGuild.members.fetch(id).catch(() => null);
          if (!member) continue;

          for (const roleName of backup.members[id]) {
            if (createdRoles[roleName]) {
              await member.roles.add(createdRoles[roleName]).catch(() => {});
            }
          }
        }

        return edit({ content: "✅ Roles restored." });
      }

      if (id.startsWith("ignore_restore_")) {
        return reply({ content: "Ignored.", ephemeral: true });
      }

      // ---------- TICKETS ----------
      if (interaction.channel?.name?.startsWith("ticket-")) {
        if (!interaction.member.roles.cache.has(claimRoleId)) {
          return reply({ content: "❌ No permission." }, true);
        }

        if (id === "ticket-claim") {
          return reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Green")
                .setTitle("Claimed")
                .setDescription(`<@${interaction.user.id}> claimed`)
            ]
          });
        }

        if (id === "ticket-unclaim") {
          return reply({
            embeds: [
              new EmbedBuilder()
                .setColor("Yellow")
                .setTitle("Unclaimed")
            ]
          });
        }

        if (id === "ticket-close") {
          return ticketManager.closeTicket(interaction.channel, guild);
        }
      }
    }

    // ===============================
    // SELECT MENU
    // ===============================
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId !== "ticketCategorySelect") return;

      const category = interaction.values[0];

      const modal = new ModalBuilder()
        .setCustomId(`mmForm-${category}`)
        .setTitle(`🎫 ${category}`);

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("trader").setLabel("Trader").setStyle(TextInputStyle.Short)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("trade").setLabel("Trade").setStyle(TextInputStyle.Paragraph)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("extra").setLabel("Extra").setStyle(TextInputStyle.Paragraph).setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("contact").setLabel("Contact").setStyle(TextInputStyle.Short)
        )
      );

      return interaction.showModal(modal);
    }

    // ===============================
    // MODAL SUBMIT
    // ===============================
    if (interaction.isModalSubmit()) {
      if (!interaction.customId.startsWith("mmForm-")) return;

      await defer(true);

      const category = interaction.customId.split("-")[1];

      const trader = interaction.fields.getTextInputValue("trader");
      const trade = interaction.fields.getTextInputValue("trade");
      const extra = interaction.fields.getTextInputValue("extra") || "None";
      const contact = interaction.fields.getTextInputValue("contact");

      const channel = await ticketManager.createTicket(
        client,
        guild,
        `ticket-${interaction.user.username}`,
        interaction.user.id
      );

      const embed = new EmbedBuilder()
        .setTitle(`🎫 ${category}`)
        .setDescription(`User: <@${interaction.user.id}>`)
        .addFields({
          name: "Info",
          value: `Trader: ${trader}\nTrade: ${trade}\nExtra: ${extra}\nContact: ${contact}`
        })
        .setColor("#1F2937");

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket-claim").setLabel("Claim").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("ticket-close").setLabel("Close").setStyle(ButtonStyle.Danger)
      );

      await channel.send({
        embeds: [embed],
        components: [buttons]
      });

      return edit({ content: `✅ Created: <#${channel.id}>` });
    }
  }
};