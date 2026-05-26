import { Client, GatewayIntentBits, ActivityType, Events, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
  import {
    createChannel, deleteChannel, sendMessage,
    ticketEmbed, closeButton, ratingButtons, openTicketButton,
  } from "./discord.js";
  import {
    upsertGuild, upsertUser, getGuild,
    getOpenTicketByUser, createTicket, getTicketByChannel, closeTicket,
    addRating, getTickets,
  } from "./db.js";

  let client = null;

  export function getClient() {
    return client;
  }

  export const commands = [
    new SlashCommandBuilder()
      .setName("ticket")
      .setDescription("Ticket-System verwalten")
      .addSubcommand(sub =>
        sub.setName("create").setDescription("Erstelle ein neues Support-Ticket"))
      .addSubcommand(sub =>
        sub.setName("close").setDescription("Schließe das aktuelle Ticket"))
      .addSubcommand(sub =>
        sub.setName("add")
          .setDescription("Füge einen Nutzer zum Ticket hinzu")
          .addUserOption(opt =>
            opt.setName("user").setDescription("Der Nutzer").setRequired(true)))
      .addSubcommand(sub =>
        sub.setName("remove")
          .setDescription("Entferne einen Nutzer aus dem Ticket")
          .addUserOption(opt =>
            opt.setName("user").setDescription("Der Nutzer").setRequired(true))),
    new SlashCommandBuilder()
      .setName("panel")
      .setDescription("Erstelle ein Ticket-Panel in diesem Kanal")
      .addStringOption(opt =>
        opt.setName("title").setDescription("Titel des Panels").setRequired(false))
      .addStringOption(opt =>
        opt.setName("description").setDescription("Beschreibung des Panels").setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    new SlashCommandBuilder()
      .setName("setup")
      .setDescription("Zeigt den Setup-Status von Resolvo Tool"),
    new SlashCommandBuilder()
      .setName("stats")
      .setDescription("Zeigt die Ticket-Statistiken dieses Servers"),
    new SlashCommandBuilder()
      .setName("premium")
      .setDescription("Informationen und Kauf von Resolvo Tool Premium"),
  ];

  export async function startGatewayBot() {
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      console.warn("DISCORD_TOKEN nicht gesetzt – Gateway-Bot wird nicht gestartet.");
      return;
    }

    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    client.once(Events.ClientReady, async () => {
      console.log(`Gateway verbunden als ${client.user.tag}`);
      await registerCommands();
    });

    client.on(Events.InteractionCreate, async (interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          await handleSlashCommand(interaction);
        } else if (interaction.isButton()) {
          await handleButton(interaction);
        }
      } catch (err) {
        console.error("Fehler bei Interaction:", err);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: "Fehler aufgetreten.", flags: 64 }).catch(() => {});
        } else {
          await interaction.reply({ content: "Fehler aufgetreten.", flags: 64 }).catch(() => {});
        }
      }
    });

    client.on(Events.Error, (err) => {
      console.error("Gateway Fehler:", err.message);
    });

    try {
      await client.login(token);
      await client.user.setPresence({
        status: "online",
        activities: [{ name: "/ticket | Resolvo Tool", type: ActivityType.Playing }],
      });
    } catch (err) {
      console.error("Gateway Login fehlgeschlagen:", err.message);
    }
  }

  async function registerCommands() {
    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
    try {
      console.log("Registriere Slash-Commands...");
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands.map(c => c.toJSON()) },
      );
      console.log(`${commands.length} Slash-Commands registriert.`);
    } catch (err) {
      console.error("Fehler beim Registrieren der Commands:", err.message);
    }
  }

  async function handleSlashCommand(interaction) {
    const { commandName } = interaction;
    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    const username = interaction.user.username;

    upsertGuild(guildId, interaction.guild?.name || "Unbekannt");
    upsertUser(userId, username);

    switch (commandName) {
      case "ticket": {
        const sub = interaction.options.getSubcommand();
        if (sub === "create") {
          await handleCreateTicket(interaction, guildId, userId, username);
        } else if (sub === "close") {
          await handleCloseTicket(interaction, guildId, userId);
        } else if (sub === "add") {
          const target = interaction.options.getUser("user");
          await interaction.reply({ content: `${target} wurde zum Ticket hinzugefügt.`, flags: 64 });
        } else if (sub === "remove") {
          const target = interaction.options.getUser("user");
          await interaction.reply({ content: `${target} wurde aus dem Ticket entfernt.`, flags: 64 });
        }
        break;
      }

      case "panel": {
        const title = interaction.options.getString("title") || "🎫 Support";
        const description = interaction.options.getString("description") || "Klicke auf den Button um ein Ticket zu erstellen.";
        await interaction.reply({
          embeds: [{ title, description, color: 0x5865f2, footer: { text: "Resolvo Tool • Support System" } }],
          components: openTicketButton(),
        });
        break;
      }

      case "setup": {
        const guild = getGuild(guildId);
        await interaction.reply({
          embeds: [{
            title: "⚙ï¸ Resolvo Tool Setup",
            description: `Server **${guild?.name || "Unbekannt"}** ist eingerichtet!\n\nVerwende `/panel` um ein Ticket-Panel zu erstellen.`,
            color: 0x57f287,
            fields: [
              { name: "Premium", value: guild?.is_premium ? "Aktiv" : "Inaktiv", inline: true },
              { name: "Tickets", value: "Bereit", inline: true },
            ],
            footer: { text: "Resolvo Tool" },
          }],
          flags: 64,
        });
        break;
      }

      case "stats": {
        const open = getTickets(guildId, "open");
        const closed = getTickets(guildId, "closed");
        await interaction.reply({
          embeds: [{
            title: "📊 Server Statistiken",
            color: 0x5865f2,
            fields: [
              { name: "🟢 Offene Tickets", value: String(open.length), inline: true },
              { name: "🔒 Geschlossene Tickets", value: String(closed.length), inline: true },
              { name: "📈 Gesamt", value: String(open.length + closed.length), inline: true },
            ],
            footer: { text: "Resolvo Tool • Live Stats" },
            timestamp: new Date().toISOString(),
          }],
        });
        break;
      }

      case "premium": {
        const baseUrl = process.env.DASHBOARD_URL || `https://${process.env.RAILWAY_PUBLIC_DOMAIN || "localhost"}`;
        const checkoutUrl = `${baseUrl}/api/premium/checkout?user=${userId}&guild=${guildId}`;
        await interaction.reply({
          embeds: [{
            title: "⭐ Resolvo Tool Premium",
            description: `Schalte alle Premium-Features frei!\n\n**Was bekommst du:**\n• 📊 Erweiterte Statistiken\n• 🏷️ Unbegrenzte Ticket-Kategorien\n• 🏆 Staff-Leaderboard\n\n**Preis:** Einmalig **5,99€** — dauerhafter Zugang!\n\n[Jetzt upgraden](${checkoutUrl})`,
            color: 0xffd700,
            footer: { text: "Resolvo Tool Premium" },
          }],
          flags: 64,
        });
        break;
      }

      default:
        await interaction.reply({ content: "Unbekannter Befehl.", flags: 64 });
    }
  }

  async function handleButton(interaction) {
    const customId = interaction.customId;
    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    const username = interaction.user.username;
    const channelId = interaction.channelId;

    upsertUser(userId, username);

    if (customId === "create_ticket") {
      await handleCreateTicket(interaction, guildId, userId, username);
      return;
    }

    if (customId === "close_ticket") {
      await handleCloseTicket(interaction, guildId, userId);
      return;
    }

    if (customId === "rate_ticket") {
      await interaction.reply({
        content: "⭐ Wie würdest du den Support bewerten?",
        components: ratingButtons(),
        flags: 64,
      });
      return;
    }

    if (customId.startsWith("rate_")) {
      const rating = parseInt(customId.split("_")[1]);
      const ticket = getTicketByChannel(channelId);
      if (ticket) addRating(ticket.id, rating, null);
      await interaction.reply({ content: `Danke für deine Bewertung von **${rating}/5** ⭐`, flags: 64 });
      return;
    }

    await interaction.reply({ content: "Unbekannte Aktion.", flags: 64 });
  }

  async function handleCreateTicket(interaction, guildId, userId, username) {
    upsertGuild(guildId, interaction.guild?.name || "Server");

    const existing = getOpenTicketByUser(guildId, userId);
    if (existing) {
      const reply = { content: `Du hast bereits ein offenes Ticket: <#${existing.channel_id}>`, flags: 64 };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
      return;
    }

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "Erstelle dein Ticket...", flags: 64 });
    }

    try {
      const channel = await createChannel(guildId, `ticket-${username.toLowerCase().replace(/[^a-z0-9]/g, "")}`, undefined, [
        { id: guildId, deny: ["1024"] },
        { id: userId, allow: ["1024", "2048", "65536"] },
      ]);

      const ticket = createTicket(guildId, userId, channel.id);
      await sendMessage(channel.id, `<@${userId}>`, closeButton(), [ticketEmbed(ticket.id, userId)]);
      console.log(`Ticket #${ticket.id} erstellt für ${userId}`);
    } catch (err) {
      console.error("Fehler beim Erstellen des Ticket-Kanals:", err);
    }
  }

  async function handleCloseTicket(interaction, guildId, userId) {
    const channelId = interaction.channelId;
    const ticket = getTicketByChannel(channelId);

    if (!ticket) {
      await interaction.reply({ content: "Kein Ticket in diesem Kanal gefunden.", flags: 64 });
      return;
    }
    if (ticket.status === "closed") {
      await interaction.reply({ content: "Dieses Ticket ist bereits geschlossen.", flags: 64 });
      return;
    }

    closeTicket(ticket.id);

    await interaction.reply({
      embeds: [{
        title: "🔒 Ticket geschlossen",
        description: `Ticket #${ticket.id} wurde von <@${userId}> geschlossen.\n\nDer Kanal wird in **5 Sekunden** gelöscht.`,
        color: 0xed4245,
        footer: { text: "Resolvo Tool" },
        timestamp: new Date().toISOString(),
      }],
    });

    setTimeout(async () => {
      try { await deleteChannel(channelId); } catch (err) { console.error("Kanal löschen fehlgeschlagen:", err); }
    }, 5000);
  }

  export async function stopGatewayBot() {
    if (client) {
      await client.destroy();
      client = null;
      console.log("Gateway getrennt");
    }
  }
  