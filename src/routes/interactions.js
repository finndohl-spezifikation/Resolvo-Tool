import { Router } from "express";
import {
  verifyDiscordRequest, InteractionType, InteractionResponseType,
  ephemeralReply, embedReply, ticketEmbed, closeButton, ratingButtons,
  openTicketButton, analyzeSentiment, createChannel, deleteChannel, sendMessage,
} from "../discord.js";
import { db, guildsTable, usersTable, ticketsTable, ratingsTable } from "../db.js";
import { eq, and } from "drizzle-orm";

const router = Router();

router.post("/interactions", async (req, res) => {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) { res.status(500).json({ error: "DISCORD_PUBLIC_KEY fehlt" }); return; }

  const signature = req.headers["x-signature-ed25519"];
  const timestamp = req.headers["x-signature-timestamp"];
  if (!signature || !timestamp) { res.status(401).json({ error: "Fehlende Signatur-Header" }); return; }

  const rawBody = JSON.stringify(req.body);
  if (!verifyDiscordRequest(publicKey, signature, timestamp, rawBody)) {
    res.status(401).json({ error: "Ungültige Signatur" });
    return;
  }

  const interaction = req.body;

  if (interaction.type === InteractionType.PING) {
    res.json({ type: InteractionResponseType.PONG });
    return;
  }

  try {
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      await handleCommand(interaction, res);
    } else if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
      await handleComponent(interaction, res);
    } else {
      res.json(ephemeralReply("❌ Unbekannter Interaktionstyp."));
    }
  } catch (err) {
    console.error("Fehler bei Interaction:", err);
    res.json(ephemeralReply("❌ Ein Fehler ist aufgetreten. Bitte versuche es erneut."));
  }
});

async function handleCommand(interaction, res) {
  const { name } = interaction.data;
  const guildId = interaction.guild_id;
  const userId = interaction.member?.user?.id || interaction.user?.id;
  const username = interaction.member?.user?.username || interaction.user?.username;

  await ensureGuild(guildId, interaction.guild?.name || "Unbekannt");
  await ensureUser(userId, username);

  switch (name) {
    case "ticket": {
      const sub = interaction.data.options?.[0]?.name;
      if (sub === "create") {
        await handleCreateTicket(interaction, res, guildId, userId, username);
      } else if (sub === "close") {
        await handleCloseTicket(interaction, res, guildId, userId);
      } else if (sub === "add") {
        const targetId = interaction.data.options?.[0]?.options?.[0]?.value;
        res.json(ephemeralReply(`✅ <@${targetId}> wurde zum Ticket hinzugefügt.`));
      } else if (sub === "remove") {
        const targetId = interaction.data.options?.[0]?.options?.[0]?.value;
        res.json(ephemeralReply(`✅ <@${targetId}> wurde aus dem Ticket entfernt.`));
      } else {
        res.json(ephemeralReply("❌ Unbekannter Unterbefehl."));
      }
      break;
    }

    case "panel": {
      const title = interaction.data.options?.find(o => o.name === "title")?.value || "🎫 Support";
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
      const guild = await db.select().from(guildsTable).where(eq(guildsTable.id, guildId)).then(r => r[0]);
      res.json(embedReply({
        title: "⚙️ Resolvo Tool Setup",
        description: `Server **${guild?.name || "Unbekannt"}** ist eingerichtet!\n\nVerwende \`/panel\` um ein Ticket-Panel zu erstellen.`,
        color: 0x57f287,
        fields: [
          { name: "Premium", value: guild?.isPremium ? "✅ Aktiv" : "❌ Inaktiv", inline: true },
          { name: "Tickets", value: "Bereit", inline: true },
        ],
        footer: { text: "Resolvo Tool" },
      }, true));
      break;
    }

    case "stats": {
      const open = await db.select().from(ticketsTable).where(and(eq(ticketsTable.guildId, guildId), eq(ticketsTable.status, "open")));
      const closed = await db.select().from(ticketsTable).where(and(eq(ticketsTable.guildId, guildId), eq(ticketsTable.status, "closed")));
      res.json(embedReply({
        title: "📊 Server Statistiken",
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
        title: "⭐ Resolvo Tool Premium",
        description: `Schalte alle Premium-Features frei!\n\n**Was bekommst du:**\n• 🤖 KI-Antwortvorschläge\n• 📊 Erweiterte Statistiken\n• 🏷️ Unbegrenzte Ticket-Kategorien\n• 🏆 Staff-Leaderboard\n\n**Preis:** Einmalig **5,99€** — dauerhafter Zugang!\n\n[✨ Jetzt upgraden](${checkoutUrl})`,
        color: 0xffd700,
        footer: { text: "Resolvo Tool Premium" },
      }, true));
      break;
    }

    default:
      res.json(ephemeralReply("❌ Unbekannter Befehl."));
  }
}

async function handleComponent(interaction, res) {
  const customId = interaction.data.custom_id;
  const guildId = interaction.guild_id;
  const userId = interaction.member?.user?.id || interaction.user?.id;
  const username = interaction.member?.user?.username || interaction.user?.username;
  const channelId = interaction.channel_id;

  await ensureUser(userId, username);

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
      data: { content: "⭐ Wie würdest du den Support bewerten?", components: ratingButtons(), flags: 64 },
    });
    return;
  }

  if (customId.startsWith("rate_")) {
    const rating = parseInt(customId.split("_")[1]);
    const ticket = await db.select().from(ticketsTable).where(eq(ticketsTable.channelId, channelId)).then(r => r[0]);
    if (ticket) {
      await db.insert(ratingsTable).values({ ticketId: ticket.id, rating });
    }
    res.json(ephemeralReply(`✅ Danke für deine Bewertung von **${rating}/5** ⭐`));
    return;
  }

  res.json(ephemeralReply("❌ Unbekannte Aktion."));
}

async function handleCreateTicket(interaction, res, guildId, userId, username) {
  await ensureGuild(guildId, interaction.guild?.name || "Server");

  const existingOpen = await db.select().from(ticketsTable)
    .where(and(eq(ticketsTable.guildId, guildId), eq(ticketsTable.userId, userId), eq(ticketsTable.status, "open")));

  if (existingOpen.length > 0) {
    res.json(ephemeralReply(`❌ Du hast bereits ein offenes Ticket: <#${existingOpen[0].channelId}>`));
    return;
  }

  res.json({ type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: { content: "⏳ Erstelle dein Ticket...", flags: 64 } });

  try {
    const channel = await createChannel(guildId, `ticket-${username.toLowerCase().replace(/[^a-z0-9]/g, "")}`, undefined, [
      { id: guildId, deny: ["1024"] },
      { id: userId, allow: ["1024", "2048", "65536"] },
    ]);

    const [ticket] = await db.insert(ticketsTable).values({
      guildId, userId, channelId: channel.id, status: "open", priority: "medium",
    }).returning();

    const embed = ticketEmbed(ticket.id, userId);
    await sendMessage(channel.id, `<@${userId}>`, closeButton(), [embed]);
    console.log(`Ticket #${ticket.id} erstellt für ${userId} in ${guildId}`);
  } catch (err) {
    console.error("Fehler beim Erstellen des Ticket-Kanals:", err);
  }
}

async function handleCloseTicket(interaction, res, guildId, userId) {
  const channelId = interaction.channel_id;

  const ticket = await db.select().from(ticketsTable)
    .where(and(eq(ticketsTable.channelId, channelId), eq(ticketsTable.guildId, guildId)))
    .then(r => r[0]);

  if (!ticket) { res.json(ephemeralReply("❌ Kein Ticket in diesem Kanal gefunden.")); return; }
  if (ticket.status === "closed") { res.json(ephemeralReply("❌ Dieses Ticket ist bereits geschlossen.")); return; }

  await db.update(ticketsTable)
    .set({ status: "closed", closedAt: new Date(), updatedAt: new Date() })
    .where(eq(ticketsTable.id, ticket.id));

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

async function ensureGuild(guildId, name) {
  await db.insert(guildsTable).values({ id: guildId, name })
    .onConflictDoUpdate({ target: guildsTable.id, set: { name, updatedAt: new Date() } });
}

async function ensureUser(userId, username) {
  await db.insert(usersTable).values({ id: userId, username })
    .onConflictDoUpdate({ target: usersTable.id, set: { username, updatedAt: new Date() } });
}

export default router;
