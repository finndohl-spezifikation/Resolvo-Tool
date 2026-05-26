import { Router } from "express";
import {
  verifyDiscordRequest, InteractionType, InteractionResponseType,
  ephemeralReply, embedReply, ticketEmbed, closeButton, ratingButtons,
  openTicketButton, createChannel, deleteChannel, sendMessage,
} from "../discord.js";
import {
  upsertGuild, upsertUser, getGuild,
  getOpenTicketByUser, createTicket, getTicketByChannel, closeTicket,
  addRating, getTickets,
} from "../db.js";

const router = Router();

router.post("/interactions", async (req, res) => {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) { res.status(500).json({ error: "DISCORD_PUBLIC_KEY fehlt" }); return; }

  const signature = req.headers["x-signature-ed25519"];
  const timestamp = req.headers["x-signature-timestamp"];
  if (!signature || !timestamp) { res.status(401).json({ error: "Fehlende Signatur-Header" }); return; }

  if (!verifyDiscordRequest(publicKey, signature, timestamp, JSON.stringify(req.body))) {
    res.status(401).json({ error: "Ungültige Signatur" }); return;
  }

  const interaction = req.body;

  if (interaction.type === InteractionType.PING) {
    res.json({ type: InteractionResponseType.PONG }); return;
  }

  try {
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      await handleCommand(interaction, res);
    } else if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
      await handleComponent(interaction, res);
    } else {
      res.json(ephemeralReply("Error: Unbekannter Interaktionstyp."));
    }
  } catch (err) {
    console.error("Fehler bei Interaction:", err);
    res.json(ephemeralReply("Error: Ein Fehler ist aufgetreten. Bitte versuche es erneut."));
  }
});

async function handleCommand(interaction, res) {
  const { name } = interaction.data;
  const guildId = interaction.guild_id;
  const userId = interaction.member?.user?.id || interaction.user?.id;
  const username = interaction.member?.user?.username || interaction.user?.username;

  upsertGuild(guildId, interaction.guild?.name || "Unbekannt");
  upsertUser(userId, username);

  switch (name) {
    case "ticket": {
      const sub = interaction.data.options?.[0]?.name;
      if (sub === "create") {
        await handleCreateTicket(interaction, res, guildId, userId, username);
      } else if (sub === "close") {
        await handleCloseTicket(interaction, res, guildId, userId);
      } else if (sub === "add") {
        const targetId = interaction.data.options?.[0]?.options?.[0]?.value;
        res.json(ephemeralReply(`OK: <@${targetId}> wurde zum Ticket hinzugefügt.`));
      } else if (sub === "remove") {
        const targetId = interaction.data.options?.[0]?.options?.[0]?.value;
        res.json(ephemeralReply(`OK: <@${targetId}> wurde aus dem Ticket entfernt.`));
      } else {
        res.json(ephemeralReply("Error: Unbekannter Unterbefehl."));
      }
      break;
    }

    case "panel": {
      const title = interaction.data.options?.find(o => o.name === "title")?.value || " Support";
      const description = interaction.data.options?.find(o => o.name === "description")?.value || "Klicke auf den Button um ein Ticket zu erstellen.";
      res.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [{ title, description, color: 0x5865f2, footer: { text: "Resolvo Tool • Support System" } }],
          components: openTicketButton(),
        },
      });
      break;
    }

    case "setup": {
      const guild = getGuild(guildId);
      res.json(embedReply({
        title: "[Config] Resolvo Tool Setup",
        description: `Server **${guild?.name || "Unbekannt"}** ist eingerichtet!\n\nVerwende \`/panel\` um ein Ticket-Panel zu erstellen.`,
        color: 0x57f287,
        fields: [
          { name: "Premium", value: guild?.is_premium ? "OK: Aktiv" : "Error: Inaktiv", inline: true },
          { name: "Tickets", value: "Bereit", inline: true },
        ],
        footer: { text: "Resolvo Tool" },
      }, true));
      break;
    }

    case "stats": {
      const open = getTickets(guildId, "open");
      const closed = getTickets(guildId, "closed");
      res.json(embedReply({
        title: " Server Statistiken",
        color: 0x5865f2,
        fields: [
          { name: "🟢 Offene Tickets", value: String(open.length), inline: true },
          { name: "🔒 Geschlossene Tickets", value: String(closed.length), inline: true },
          { name: "📈 Gesamt", value: String(open.length + closed.length), inline: true },
        ],
        footer: { text: "Resolvo Tool • Live Stats" },
        timestamp: new Date().toISOString(),
      }));
      break;
    }

    case "premium": {
      const baseUrl = process.env.DASHBOARD_URL || `https://${process.env.RAILWAY_PUBLIC_DOMAIN || "localhost"}`;
      const checkoutUrl = `${baseUrl}/api/premium/checkout?user=${userId}&guild=${guildId}`;
      res.json(embedReply({
        title: "* Resolvo Tool Premium",
        description: `Schalte alle Premium-Features frei!\n\n**Was bekommst du:**\n•  Erweiterte Statistiken\n• 🏷️ Unbegrenzte Ticket-Kategorien\n• 🏆 Staff-Leaderboard\n\n**Preis:** Einmalig **5,99€** — dauerhafter Zugang!\n\n[ Jetzt upgraden](${checkoutUrl})`,
        color: 0xffd700,
        footer: { text: "Resolvo Tool Premium" },
      }, true));
      break;
    }

    default:
      res.json(ephemeralReply("Error: Unbekannter Befehl."));
  }
}

async function handleComponent(interaction, res) {
  const customId = interaction.data.custom_id;
  const guildId = interaction.guild_id;
  const userId = interaction.member?.user?.id || interaction.user?.id;
  const username = interaction.member?.user?.username || interaction.user?.username;
  const channelId = interaction.channel_id;

  upsertUser(userId, username);

  if (customId === "create_ticket") {
    await handleCreateTicket(interaction, res, guildId, userId, username);
    return;
  }

  if (customId === "close_ticket") {
    await handleCloseTicket(interaction, res, guildId, userId);
    return;
  }

  if (customId === "rate_ticket") {
    res.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "* Wie würdest du den Support bewerten?", components: ratingButtons(), flags: 64 },
    });
    return;
  }

  if (customId.startsWith("rate_")) {
    const rating = parseInt(customId.split("_")[1]);
    const ticket = getTicketByChannel(channelId);
    if (ticket) addRating(ticket.id, rating, null);
    res.json(ephemeralReply(`OK: Danke für deine Bewertung von **${rating}/5** *`));
    return;
  }

  res.json(ephemeralReply("Error: Unbekannte Aktion."));
}

async function handleCreateTicket(interaction, res, guildId, userId, username) {
  upsertGuild(guildId, interaction.guild?.name || "Server");

  const existing = getOpenTicketByUser(guildId, userId);
  if (existing) {
    res.json(ephemeralReply(`Error: Du hast bereits ein offenes Ticket: <#${existing.channel_id}>`));
    return;
  }

  res.json({ type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: { content: "⏳ Erstelle dein Ticket...", flags: 64 } });

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

async function handleCloseTicket(interaction, res, guildId, userId) {
  const channelId = interaction.channel_id;
  const ticket = getTicketByChannel(channelId);

  if (!ticket) { res.json(ephemeralReply("Error: Kein Ticket in diesem Kanal gefunden.")); return; }
  if (ticket.status === "closed") { res.json(ephemeralReply("Error: Dieses Ticket ist bereits geschlossen.")); return; }

  closeTicket(ticket.id);

  res.json(embedReply({
    title: "🔒 Ticket geschlossen",
    description: `Ticket #${ticket.id} wurde von <@${userId}> geschlossen.\n\nDer Kanal wird in **5 Sekunden** gelöscht.`,
    color: 0xed4245,
    footer: { text: "Resolvo Tool" },
    timestamp: new Date().toISOString(),
  }));

  setTimeout(async () => {
    try { await deleteChannel(channelId); } catch (err) { console.error("Kanal löschen fehlgeschlagen:", err); }
  }, 5000);
}

export default router;
