import { Router } from "express";
  import {
    verifyDiscordRequest, InteractionType, InteractionResponseType,
    ephemeralReply, embedReply, ticketEmbed, closeButton, ratingButtons,
    openTicketButton, createChannel, deleteChannel, sendMessage,
    categoryButtons, formFieldButton, panelEmbed,
  } from "../discord.js";
  import {
    upsertGuild, upsertUser, getGuild, getPanelConfig,
    getOpenTicketByUser, createTicket, getTicketByChannel, closeTicket,
    addRating, getTickets, getTicketCategories, addMessage,
    setTicketTags, updateTicket, getMessages,
  } from "../db.js";
  import { classifyPriority, suggestTags, faqAnswer } from "../ai.js";

  const router = Router();

  router.post("/interactions", async (req, res) => {
    const publicKey = process.env.DISCORD_PUBLIC_KEY;
    if (!publicKey) { res.status(500).json({ error: "DISCORD_PUBLIC_KEY fehlt" }); return; }

    const signature = req.headers["x-signature-ed25519"];
    const timestamp = req.headers["x-signature-timestamp"];
    if (!signature || !timestamp) { res.status(401).json({ error: "Fehlende Signatur-Header" }); return; }

    if (!verifyDiscordRequest(publicKey, signature, timestamp, JSON.stringify(req.body))) {
      res.status(401).json({ error: "Ungueltige Signatur" }); return;
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
          res.json(ephemeralReply(`OK: <@${targetId}> wurde zum Ticket hinzugefuegt.`));
        } else if (sub === "remove") {
          const targetId = interaction.data.options?.[0]?.options?.[0]?.value;
          res.json(ephemeralReply(`OK: <@${targetId}> wurde aus dem Ticket entfernt.`));
        } else {
          res.json(ephemeralReply("Error: Unbekannter Unterbefehl."));
        }
        break;
      }

      case "panel": {
        const config = getPanelConfig(guildId);
        const categories = getTicketCategories(guildId);
        const title = interaction.data.options?.find(o => o.name === "title")?.value || config?.embed_title || "Support";
        const description = interaction.data.options?.find(o => o.name === "description")?.value || config?.embed_description || "Klicke auf den Button um ein Ticket zu erstellen.";
        
        const components = categories.length > 0
          ? [...categoryButtons(categories), ...openTicketButton(config)]
          : openTicketButton(config);

        res.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            embeds: [panelEmbed({ ...config, embed_title: title, embed_description: description }, categories)],
            components,
          },
        });
        break;
      }

      case "setup": {
        const guild = getGuild(guildId);
        res.json(embedReply({
          title: "Resolvo Tool Setup",
          description: `Server **${guild?.name || "Unbekannt"}** ist eingerichtet!\n\nVerwende `/panel` um ein Ticket-Panel zu erstellen.`,
          color: 0x57f287,
          fields: [
            { name: "Premium", value: guild?.is_premium ? "Aktiv" : "Inaktiv", inline: true },
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
          title: "Server Statistiken",
          color: 0x5865f2,
          fields: [
            { name: "Offene Tickets", value: String(open.length), inline: true },
            { name: "Geschlossene Tickets", value: String(closed.length), inline: true },
            { name: "Gesamt", value: String(open.length + closed.length), inline: true },
          ],
          footer: { text: "Resolvo Tool - Live Stats" },
          timestamp: new Date().toISOString(),
        }));
        break;
      }

      case "category": {
        const sub = interaction.data.options?.[0]?.name;
        if (sub === "add") {
          const catName = interaction.data.options?.[0]?.options?.find(o => o.name === "name")?.value;
          const catDesc = interaction.data.options?.[0]?.options?.find(o => o.name === "description")?.value;
          const catColor = interaction.data.options?.[0]?.options?.find(o => o.name === "color")?.value || "#4f8cff";
          if (catName) {
            const { addTicketCategory } = await import("../db.js");
            const id = addTicketCategory(guildId, catName, catColor, catDesc);
            res.json(ephemeralReply(`OK: Kategorie "${catName}" erstellt (ID: ${id}).`));
          } else {
            res.json(ephemeralReply("Error: Name fehlt."));
          }
        } else if (sub === "list") {
          const { getTicketCategories } = await import("../db.js");
          const cats = getTicketCategories(guildId);
          if (cats.length === 0) {
            res.json(ephemeralReply("Keine Kategorien vorhanden. Nutze /category add."));
          } else {
            const fields = cats.map(c => ({ name: c.name, value: c.description || "-", inline: true }));
            res.json(embedReply({ title: "Ticket-Kategorien", color: 0x5865f2, fields, footer: { text: "Resolvo Tool" } }));
          }
        } else if (sub === "remove") {
          const catId = interaction.data.options?.[0]?.options?.find(o => o.name === "id")?.value;
          if (catId) {
            const { deleteTicketCategory } = await import("../db.js");
            deleteTicketCategory(catId);
            res.json(ephemeralReply(`OK: Kategorie ${catId} entfernt.`));
          }
        }
        break;
      }

      case "premium": {
        const baseUrl = process.env.DASHBOARD_URL || `https://${process.env.RAILWAY_PUBLIC_DOMAIN || "localhost"}`;
        const checkoutUrl = `${baseUrl}/api/premium/checkout?user=${userId}&guild=${guildId}`;
        res.json(embedReply({
          title: "Resolvo Tool Premium",
          description: `Schalte alle Premium-Features frei!\n\n**Was bekommst du:**\n- Erweiterte Statistiken\n- Ticket-Kategorien mit Tags\n- Staff-Leaderboard\n- Auto-Eskalation\n- Smart FAQ\n- Formular-Tickets\n\n**Preis:** Einmalig **5,99 EUR** -- dauerhafter Zugang!\n\n[Jetzt upgraden](${checkoutUrl})`,
          color: 0xffd700,
          footer: { text: "Resolvo Tool Premium" },
        }, true));
        break;
      }

      case "faq": {
        const sub = interaction.data.options?.[0]?.name;
        if (sub === "add") {
          const q = interaction.data.options?.[0]?.options?.find(o => o.name === "question")?.value;
          const a = interaction.data.options?.[0]?.options?.find(o => o.name === "answer")?.value;
          if (q && a) {
            const { addFaqEntry } = await import("../db.js");
            addFaqEntry(guildId, q, a);
            res.json(ephemeralReply("OK: FAQ-Eintrag hinzugefuegt."));
          } else {
            res.json(ephemeralReply("Error: Frage und Antwort benoetigt."));
          }
        } else if (sub === "list") {
          const { getFaqEntries } = await import("../db.js");
          const faqs = getFaqEntries(guildId);
          if (faqs.length === 0) {
            res.json(ephemeralReply("Keine FAQ-Eintraege vorhanden."));
          } else {
            const fields = faqs.slice(0, 10).map(f => ({ name: f.question.substring(0, 100), value: f.answer.substring(0, 100), inline: false }));
            res.json(embedReply({ title: "FAQ-Eintraege", color: 0x5865f2, fields, footer: { text: `${faqs.length} Eintraege` } }));
          }
        }
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

    // Category selection
    if (customId.startsWith("cat_")) {
      const categoryId = parseInt(customId.split("_")[1]);
      await handleCreateTicket(interaction, res, guildId, userId, username, { categoryId });
      return;
    }

    if (customId === "create_ticket") {
      const categories = getTicketCategories(guildId);
      if (categories.length > 0) {
        res.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "Waehle eine Kategorie fuer dein Ticket:",
            components: categoryButtons(categories),
            flags: 64,
          },
        });
      } else {
        await handleCreateTicket(interaction, res, guildId, userId, username);
      }
      return;
    }

    if (customId === "close_ticket") {
      await handleCloseTicket(interaction, res, guildId, userId);
      return;
    }

    if (customId === "rate_ticket") {
      res.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: "Wie wuerdest du den Support bewerten?", components: ratingButtons(), flags: 64 },
      });
      return;
    }

    if (customId.startsWith("rate_")) {
      const rating = parseInt(customId.split("_")[1]);
      const ticket = getTicketByChannel(channelId);
      if (ticket) addRating(ticket.id, rating, null);
      res.json(ephemeralReply(`OK: Danke fuer deine Bewertung von **${rating}/5**`));
      return;
    }

    res.json(ephemeralReply("Error: Unbekannte Aktion."));
  }

  async function handleCreateTicket(interaction, res, guildId, userId, username, options = {}) {
    upsertGuild(guildId, interaction.guild?.name || "Server");

    const existing = getOpenTicketByUser(guildId, userId);
    if (existing) {
      res.json(ephemeralReply(`Error: Du hast bereits ein offenes Ticket: <#${existing.channel_id}>`));
      return;
    }

    res.json({ type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: { content: "Erstelle dein Ticket...", flags: 64 } });

    try {
      const config = getPanelConfig(guildId);
      
      // AI Priority Classification
      let priority = "medium";
      let tags = [];
      if (config?.ai_enabled) {
        try {
          priority = await classifyPriority(options.subject || username, "");
          tags = await suggestTags(options.subject || username, "");
        } catch (aiErr) {
          console.error("[AI] Classification failed:", aiErr.message);
        }
      }

      const channel = await createChannel(guildId, `ticket-${username.toLowerCase().replace(/[^a-z0-9]/g, "")}`, undefined, [
        { id: guildId, deny: ["1024"] },
        { id: userId, allow: ["1024", "2048", "65536"] },
      ]);

      const ticket = createTicket(guildId, userId, channel.id, priority, options.categoryId || null, options.subject || null);
      
      if (tags.length > 0) {
        setTicketTags(ticket.id, tags);
      }

      await sendMessage(channel.id, `<@${userId}>`, closeButton(), [ticketEmbed(ticket.id, userId, config, tags)]);
      console.log(`[Ticket] #${ticket.id} erstellt fuer ${userId} (Prio: ${priority}, Tags: ${tags.join(", ")})`);

      // Smart FAQ check
      if (config?.faq_enabled && options.subject) {
        try {
          const faqReply = await faqAnswer(options.subject);
          if (faqReply) {
            setTimeout(async () => {
              await sendMessage(channel.id, `[Smart FAQ] ${faqReply}`);
              addMessage(ticket.id, "system", "Smart FAQ", faqReply, true);
            }, 2000);
          }
        } catch (faqErr) {
          console.error("[FAQ] Check failed:", faqErr.message);
        }
      }
    } catch (err) {
      console.error("Fehler beim Erstellen des Ticket-Kanals:", err);
    }
  }

  async function handleCloseTicket(interaction, res, guildId, userId) {
    const channelId = interaction.channel_id;
    const ticket = getTicketByChannel(channelId);

    if (!ticket) { res.json(ephemeralReply("Error: Kein Ticket in diesem Kanal gefunden.")); return; }
    if (ticket.status === "closed") { res.json(ephemeralReply("Error: Dieses Ticket ist bereits geschlossen.")); return; }

    // Generate transcript
    const messages = getMessages(ticket.id);
    const transcript = messages.map(m => `[${m.created_at}] ${m.author_name}: ${m.content}`).join("\n");
    closeTicket(ticket.id, transcript);

    res.json(embedReply({
      title: "Ticket geschlossen",
      description: `Ticket #${ticket.id} wurde von <@${userId}> geschlossen.\n\nDer Kanal wird in **5 Sekunden** geloescht.`,
      color: 0xed4245,
      footer: { text: "Resolvo Tool" },
      timestamp: new Date().toISOString(),
    }));

    setTimeout(async () => {
      try { await deleteChannel(channelId); } catch (err) { console.error("Kanal loeschen fehlgeschlagen:", err); }
    }, 5000);
  }

  export default router;
  