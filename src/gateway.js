import {
  Client, GatewayIntentBits, ActivityType, Events,
  REST, Routes,
  SlashCommandBuilder, PermissionFlagsBits,
  ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder,
  StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
  ChannelType, ButtonStyle,
} from "discord.js";
import {
  createChannel, deleteChannel, sendMessage,
  ticketEmbed, panelEmbed, setupEmbed, closeButton, ratingButtons,
  openTicketButton, colorButtons, colorMap,
} from "./discord.js";
import {
  upsertGuild, upsertUser, getGuild, getPanelConfig, getPanel, getPanels,
  setPanelChannel, setTicketCategory, setTranscriptChannel,
  setSupportRole, setPanelAppearance,
  getOpenTicketByUser, createTicket, getTicketByChannel, closeTicket,
  addRating, getTickets,
} from "./db.js";

let client = null;

export function getClient() {
  return client;
}

// ── Commands ───────────────────────────────────────────────────────────────────

export const commands = [
  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Konfiguriere das Ticket-Panel f\u00fcr diesen Server")
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
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Lists all available commands (English)"),
  new SlashCommandBuilder()
    .setName("dashboard")
    .setDescription("Get the link to the Resolvo Tool web dashboard"),
];

// ── Gateway Startup ────────────────────────────────────────────────────────────────

export async function startGatewayBot() {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.warn("DISCORD_TOKEN nicht gesetzt \u2013 Gateway-Bot wird nicht gestartet.");
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
      } else if (interaction.isChannelSelectMenu()) {
        await handleChannelSelect(interaction);
      } else if (interaction.isRoleSelectMenu()) {
        await handleRoleSelect(interaction);
      } else if (interaction.isStringSelectMenu()) {
        await handleStringSelect(interaction);
      } else if (interaction.isModalSubmit()) {
        await handleModalSubmit(interaction);
      }
    } catch (err) {
      console.error("Interaction Fehler:", err);
      const msg = { content: "Fehler aufgetreten.", flags: 64 };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg).catch(() => {});
      } else {
        await interaction.reply(msg).catch(() => {});
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
      activities: [{ name: "/panel | Resolvo Tool", type: ActivityType.Playing }],
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
    console.error("Fehler beim Registrieren:", err.message);
  }
}

// ── Slash Commands ─────────────────────────────────────────────────────────────────

async function handleSlashCommand(interaction) {
  const { commandName } = interaction;
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  upsertGuild(guildId, interaction.guild?.name || "Unbekannt");
  upsertUser(userId, interaction.user.username);

  switch (commandName) {
    case "panel": {
      const config = getPanelConfig(guildId);
      const guild = getGuild(guildId);
      await interaction.reply({
        embeds: [setupEmbed(config, guild)],
        components: setupButtons(),
        flags: 64,
      });
      break;
    }

    case "setup": {
      const config = getPanelConfig(guildId);
      const guild = getGuild(guildId);
      const isSetup = config?.panel_channel_id && config?.ticket_category_id;
      await interaction.reply({
        embeds: [{
          title: "Resolvo Tool Setup",
          description: isSetup
            ? `Server **${guild?.name || "Unbekannt"}** ist vollst\u00e4ndig eingerichtet!\n\nVerwende \`/panel\` um die Konfiguration anzupassen.`
            : `Server **${guild?.name || "Unbekannt"}** ist teilweise eingerichtet.\n\nVerwende \`/panel\` um die Einrichtung abzuschlie\u00dfen.`,
          color: isSetup ? 0x57f287 : 0xfaa61a,
          fields: [
            { name: "Premium", value: guild?.is_premium ? "Aktiv" : "Inaktiv", inline: true },
            { name: "Panel", value: config?.panel_channel_id ? "Konfiguriert" : "Nicht gesetzt", inline: true },
            { name: "Kategorie", value: config?.ticket_category_id ? "Gesetzt" : "Nicht gesetzt", inline: true },
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
          title: "Server Statistiken",
          color: 0x5865f2,
          fields: [
            { name: "Offene Tickets", value: String(open.length), inline: true },
            { name: "Geschlossene Tickets", value: String(closed.length), inline: true },
            { name: "Gesamt", value: String(open.length + closed.length), inline: true },
          ],
          footer: { text: "Resolvo Tool \u2022 Live Stats" },
          timestamp: new Date().toISOString(),
        }],
      });
      break;
    }

    case "category": {
        const catSub = interaction.options.getSubcommand();
        if (catSub === "add") {
          const name = interaction.options.getString("name");
          const color = interaction.options.getString("color") || "#4f8cff";
          const description = interaction.options.getString("description") || "";
          const id = addTicketCategory(guildId, name, color, description, null);
          await interaction.reply({ content: `Kategorie "${name}" hinzugefügt (ID: ${id}).`, flags: 64 });
        } else if (catSub === "list") {
          const cats = getTicketCategories(guildId);
          const lines = cats.map(c => `ID ${c.id}: ${c.name} (${c.color})`).join("\n") || "Keine Kategorien vorhanden.";
          await interaction.reply({ content: `**Ticket-Kategorien:**\n${lines}`, flags: 64 });
        } else if (catSub === "remove") {
          const id = interaction.options.getInteger("id");
          deleteTicketCategory(id);
          await interaction.reply({ content: `Kategorie ID ${id} entfernt.`, flags: 64 });
        }
        break;
      }

      case "faq": {
        const faqSub = interaction.options.getSubcommand();
        if (faqSub === "add") {
          const question = interaction.options.getString("question");
          const answer = interaction.options.getString("answer");
          const trigger = interaction.options.getString("trigger") || "";
          const id = addFaqEntry(guildId, question, answer, trigger);
          await interaction.reply({ content: `FAQ-Eintrag hinzugefügt (ID: ${id}).`, flags: 64 });
        } else if (faqSub === "list") {
          const faqs = getFaqEntries(guildId);
          const lines = faqs.map(f => `ID ${f.id}: ${f.question}`).join("\n") || "Keine FAQ-Einträge vorhanden.";
          await interaction.reply({ content: `**Smart FAQ:**\n${lines}`, flags: 64 });
        }
        break;
      }

      case "premium": {
      const baseUrl = process.env.DASHBOARD_URL || `https://${process.env.RAILWAY_PUBLIC_DOMAIN || "localhost"}`;
      const checkoutUrl = `${baseUrl}/premium`;
      // User will see instructions on the premium page to use /premium in their server
      await interaction.reply({
        embeds: [{
          title: "Resolvo Tool Premium",
          description: `Schalte alle Premium-Features frei!\n\n**Was bekommst du:**\n\u2022 Erweiterte Statistiken\n\u2022 Unbegrenzte Ticket-Kategorien\n\u2022 Staff-Leaderboard\n\n**Preis:** Einmalig **5,99\u20ac** \u2014 dauerhafter Zugang!\n\n[Jetzt upgraden](${checkoutUrl})`,
          color: 0xffd700,
          footer: { text: "Resolvo Tool Premium" },
        }],
        flags: 64,
      });
      break;
    }
    case "help": {
      await interaction.reply({
        embeds: [{
          title: "Resolvo Tool - Command Help",
          description: "Here are all available commands:",
          color: 0x4f8cff,
          fields: [
            { name: "/ticket create", value: "Create a new support ticket", inline: true },
            { name: "/ticket close", value: "Close the current ticket", inline: true },
            { name: "/ticket add @user", value: "Add a user to the ticket", inline: true },
            { name: "/ticket remove @user", value: "Remove a user from the ticket", inline: true },
            { name: "/panel", value: "Configure the ticket panel (Admin)", inline: true },
            { name: "/setup", value: "Show setup status", inline: true },
            { name: "/stats", value: "Show server ticket statistics", inline: true },
            { name: "/category add/list/remove", value: "Manage ticket categories", inline: true },
            { name: "/faq add/list", value: "Manage FAQ entries", inline: true },
            { name: "/premium", value: "Premium information and purchase", inline: true },
            { name: "/help", value: "Show this help message", inline: true },
            { name: "/dashboard", value: "Get the web dashboard link", inline: true },
          ],
          footer: { text: "Resolvo Tool - Use /dashboard for the web panel" },
        }],
        flags: 64,
      });
      break;
    }

    case "dashboard": {
      const dashUrl = process.env.DASHBOARD_URL || "https://resolvo-tool-production.up.railway.app";
      await interaction.reply({
        embeds: [{
          title: "Resolvo Tool Dashboard",
          description: `Manage your server settings, view statistics, and configure the ticket panel here:\n\n**-> [Open Dashboard](${dashUrl})**`,
          color: 0x5865f2,
          footer: { text: "Resolvo Tool - resolvo-tool-production.up.railway.app" },
        }],
        flags: 64,
      });
      break;
    }
  }
}

// ── Button Handler (Setup Wizard) ───────────────────────────────────────────────────

async function handleButton(interaction) {
  const customId = interaction.customId;
  const guildId = interaction.guildId;

  // Panel Setup Buttons
  if (customId === "cfg_panel_ch") {
    const row = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("sel_panel_ch")
        .setPlaceholder("W\u00e4hle einen Text-Kanal f\u00fcr das Panel")
        .setChannelTypes(ChannelType.GuildText)
        .setMaxValues(1),
    );
    await interaction.reply({ content: "W\u00e4hle den Kanal f\u00fcr das Ticket-Panel:", components: [row], flags: 64 });
    return;
  }

  if (customId === "cfg_cat") {
    const row = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("sel_cat")
        .setPlaceholder("W\u00e4hle eine Kategorie f\u00fcr Tickets")
        .setChannelTypes(ChannelType.GuildCategory)
        .setMaxValues(1),
    );
    await interaction.reply({ content: "W\u00e4hle die Kategorie, in der Tickets erstellt werden:", components: [row], flags: 64 });
    return;
  }

  if (customId === "cfg_transcript") {
    const row = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("sel_transcript")
        .setPlaceholder("W\u00e4hle einen Kanal f\u00fcr Transkripte")
        .setChannelTypes(ChannelType.GuildText)
        .setMaxValues(1),
    );
    await interaction.reply({ content: "W\u00e4hle den Kanal f\u00fcr Ticket-Transkripte:", components: [row], flags: 64 });
    return;
  }

  if (customId === "cfg_role") {
    const row = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId("sel_role")
        .setPlaceholder("W\u00e4hle die Support-Rolle")
        .setMaxValues(1),
    );
    await interaction.reply({ content: "W\u00e4hle die Rolle, die Tickets bearbeiten darf:", components: [row], flags: 64 });
    return;
  }

  if (customId === "cfg_btn_text") {
    const modal = new ModalBuilder()
      .setCustomId("modal_btn_text")
      .setTitle("Button-Text festlegen");
    const input = new TextInputBuilder()
      .setCustomId("btn_text_input")
      .setLabel("Text auf dem Ticket-Button")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("z.B. \u00d6ffne ein Ticket")
      .setMaxLength(80)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
    return;
  }

  if (customId === "cfg_btn_color") {
    await interaction.reply({ content: "W\u00e4hle die Button-Farbe:", components: colorButtons(), flags: 64 });
    return;
  }

  if (customId === "cfg_embed_color") {
    await interaction.reply({ content: "W\u00e4hle die Embed-Farbe:", components: colorButtons(), flags: 64 });
    return;
  }

  // Color picker buttons
  if (customId.startsWith("color_")) {
    const color = colorMap[customId];
    if (!color) return;

    // Determine if this was for button or embed color
    // We can check the message content
    const msgContent = interaction.message?.content || "";
    const isEmbedColor = msgContent.includes("Embed");

    if (isEmbedColor) {
      setPanelAppearance(guildId, { embedColor: color.value });
      await interaction.reply({ content: `Embed-Farbe auf **${color.name}** gesetzt.`, flags: 64 });
    } else {
      setPanelAppearance(guildId, { buttonColor: color.style });
      await interaction.reply({ content: `Button-Farbe auf **${color.name}** gesetzt.`, flags: 64 });
    }
    await refreshSetupMessage(interaction);
    return;
  }

  if (customId === "cfg_publish") {
    await publishPanel(interaction, guildId);
    return;
  }

  if (customId === "cfg_cancel") {
    await interaction.update({ content: "Setup abgebrochen.", embeds: [], components: [] });
    return;
  }

  // ── Confirm-Close Dialog ─────────────────────────────────────────────────────
  if (customId === "confirm_close_prompt") {
    const cTicket = getTicketByChannel(interaction.channelId);
    const cPanel  = cTicket?.panel_id ? (() => { try { return getPanel(cTicket.panel_id, guildId); } catch(_) { return null; } })() : null;
    const confirmTxt = cPanel?.confirm_close_text  || "Ja, schließen";
    const cancelTxt  = cPanel?.confirm_cancel_text || "Abbrechen";
    await interaction.reply({
      content: "Bist du sicher, dass du dieses Ticket schließen möchtest?",
      components: [{ type: 1, components: [
        { type: 2, style: 4, label: confirmTxt, custom_id: "close_ticket" },
        { type: 2, style: 2, label: cancelTxt,  custom_id: "cancel_close"  },
      ]}],
      flags: 64,
    });
    return;
  }
  if (customId === "cancel_close") {
    await interaction.reply({ content: "Schließung abgebrochen.", flags: 64 });
    return;
  }
  // ── Ticket Buttons ─────────────────────────────────────────────────────────
  if (customId === "create_ticket" || customId.startsWith("create_ticket:")) {
    const panelId = customId.includes(":") ? parseInt(customId.split(":")[1]) : null;
    await handleCreateTicket(interaction, guildId, interaction.user.id, interaction.user.username, panelId);
    return;
  }
  if (customId === "close_ticket") {
    await handleCloseTicket(interaction, guildId, interaction.user.id);
    return;
  }
  if (customId === "rate_ticket") {
    const rt = getTicketByChannel(interaction.channelId);
    const rp = rt?.panel_id ? (() => { try { return getPanel(rt.panel_id, guildId); } catch(_) { return null; } })() : null;
    const cfg2 = getPanelConfig(guildId);
    const maxS = rp?.rating_max_stars || cfg2?.rating_max_stars || 5;
    const q = rp?.rating_question || cfg2?.rating_question || "Wie würdest du den Support bewerten?";
    await interaction.reply({ content: `⭐ ${q}`, components: ratingButtons(maxS), flags: 64 });
    return;
  }
  if (customId.startsWith("rate_")) {
    const rating = parseInt(customId.split("_")[1]);
    const ticket = getTicketByChannel(interaction.channelId);
    if (ticket) addRating(ticket.id, rating, null);
    await interaction.reply({ content: `Danke für deine Bewertung von **${rating}** ⭐`, flags: 64 });
    return;
  }
}

  if (customId.startsWith("rate_")) {
    const rating = parseInt(customId.split("_")[1]);
    const ticket = getTicketByChannel(interaction.channelId);
    if (ticket) addRating(ticket.id, rating, null);
    await interaction.reply({ content: `Danke f\u00fcr deine Bewertung von **${rating}/5** \u2b50`, flags: 64 });
    return;
  }
}

// ── Select Menu Handlers ──────────────────────────────────────────────────────────

async function handleChannelSelect(interaction) {
  const customId = interaction.customId;
  const guildId = interaction.guildId;
  const value = interaction.values[0];

  if (customId === "sel_panel_ch") {
    setPanelChannel(guildId, value);
    await interaction.reply({ content: `Panel-Channel auf <#${value}> gesetzt.`, flags: 64 });
  } else if (customId === "sel_cat") {
    setTicketCategory(guildId, value);
    await interaction.reply({ content: `Ticket-Kategorie auf <#${value}> gesetzt.`, flags: 64 });
  } else if (customId === "sel_transcript") {
    setTranscriptChannel(guildId, value);
    await interaction.reply({ content: `Transkript-Channel auf <#${value}> gesetzt.`, flags: 64 });
  }

  await refreshSetupMessage(interaction);
}

async function handleRoleSelect(interaction) {
  const guildId = interaction.guildId;
  const value = interaction.values[0];

  setSupportRole(guildId, value);
  await interaction.reply({ content: `Support-Rolle auf <@&${value}> gesetzt.`, flags: 64 });
  await refreshSetupMessage(interaction);
}

async function handleStringSelect(interaction) {
  // Reserved for future string selects
  await interaction.reply({ content: "Auswahl gespeichert.", flags: 64 });
}

// ── Modal Handlers ────────────────────────────────────────────────────────────────────

async function handleModalSubmit(interaction) {
  const customId = interaction.customId;
  const guildId = interaction.guildId;

  if (customId === "modal_btn_text") {
    const text = interaction.fields.getTextInputValue("btn_text_input");
    setPanelAppearance(guildId, { buttonText: text });
    await interaction.reply({ content: `Button-Text auf "${text}" gesetzt.`, flags: 64 });
    await refreshSetupMessage(interaction);
  }
}

// ── Setup UI Helpers ────────────────────────────────────────────────────────

async function refreshSetupMessage(interaction) {
  try {
    const guildId = interaction.guildId;
    const config = getPanelConfig(guildId);
    const guild = getGuild(guildId);

    // Try to update the original panel setup message
    const original = await interaction.channel.messages.fetch({ limit: 10 });
    const setupMsg = original.find(m =>
      m.author.id === client.user.id &&
      m.embeds?.[0]?.title?.includes("Panel-Konfiguration")
    );

    if (setupMsg) {
      await setupMsg.edit({ embeds: [setupEmbed(config, guild)], components: setupButtons() });
    }
  } catch (e) {
    // Silently fail if we can't find the setup message
  }
}

async function publishPanel(interaction, guildId, panelId) {
  let panel = null;
  try { if (panelId) panel = getPanel(panelId, guildId); } catch(_) {}
  const config = getPanelConfig(guildId);
  const channelId = panel?.channel_id || config?.panel_channel_id;
  if (!channelId) { await interaction.reply({ content: "Fehler: Kein Panel-Channel konfiguriert.", flags: 64 }); return; }
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) { await interaction.reply({ content: "Fehler: Der Panel-Channel existiert nicht.", flags: 64 }); return; }
    await channel.send({ embeds: [panelEmbed(panel || config)], components: openTicketButton(panel || config, panelId) });
    await interaction.reply({ content: `Panel wurde in <#${channelId}> veröffentlicht!`, flags: 64 });
  } catch (err) {
    console.error("Panel veröffentlichen fehlgeschlagen:", err);
    await interaction.reply({ content: `Fehler: ${err.message}`, flags: 64 });
  }
}

function setupButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("cfg_panel_ch").setLabel("Panel-Channel").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("cfg_cat").setLabel("Kategorie").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("cfg_transcript").setLabel("Transkript").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("cfg_role").setLabel("Support-Rolle").setStyle(ButtonStyle.Primary),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("cfg_btn_text").setLabel("Button-Text").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("cfg_btn_color").setLabel("Button-Farbe").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("cfg_embed_color").setLabel("Embed-Farbe").setStyle(ButtonStyle.Secondary),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("cfg_publish").setLabel("Panel ver\u00f6ffentlichen").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("cfg_cancel").setLabel("Abbrechen").setStyle(ButtonStyle.Danger),
    ),
  ];
}

// ── Ticket Logic ───────────────────────────────────────────────────────────────────

async function handleCreateTicket(interaction, guildId, userId, username, panelId) {
  upsertGuild(guildId, interaction.guild?.name || "Server");
  let panel = null;
  try { if (panelId) panel = getPanel(panelId, guildId); } catch(_) {}
  const config = getPanelConfig(guildId);
  const existing = getOpenTicketByUser(guildId, userId);
  if (existing) {
    await interaction.reply({ content: `Du hast bereits ein offenes Ticket: <#${existing.channel_id}>`, flags: 64 });
    return;
  }
  await interaction.reply({ content: "Erstelle dein Ticket...", flags: 64 });
  try {
    const supportRoleIds = (() => { try { return JSON.parse(config?.support_role_ids || "[]"); } catch(_) { return config?.support_role_id ? [config.support_role_id] : []; } })();
    const ticketRoles   = (() => { try { return JSON.parse(panel?.ticket_roles || "[]"); } catch(_) { return []; } })();
    const allRoles = [...new Set([...supportRoleIds, ...ticketRoles])];
    const perms = [
      { id: guildId, deny: ["1024"] },
      { id: userId, allow: ["1024", "2048", "65536"] },
      ...allRoles.map(id => ({ id, allow: ["1024", "2048", "65536", "16"] })),
    ];
    const categoryId = panel?.ticket_category_id || config?.ticket_category_id;
    const channel = await createChannel(
      guildId,
      `ticket-${username.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      categoryId || undefined,
      perms,
    );
    const ticket = createTicket(guildId, userId, channel.id);
    const openMsg = (panel?.open_message || "").trim();
    const mentionLine = `<@${userId}>${openMsg ? " " + openMsg : ""}`;
    await sendMessage(channel.id, mentionLine, closeButton(panel), [ticketEmbed(ticket.id, userId, panel || config)]);
    console.log(`Ticket #${ticket.id} erstellt für ${userId}`);
  } catch (err) {
    console.error("Fehler beim Erstellen des Ticket-Kanals:", err);
  }
}
  async function handleCloseTicket(interaction, guildId, userId) {
    const channelId = interaction.channelId;
    const ticket = getTicketByChannel(channelId);
    if (!ticket) { await interaction.reply({ content: "Kein Ticket gefunden.", flags: 64 }); return; }
    if (ticket.status === "closed") { await interaction.reply({ content: "Ticket ist bereits geschlossen.", flags: 64 }); return; }

    let panel = null;
    try { if (ticket.panel_id) panel = getPanel(ticket.panel_id, guildId); } catch(_) {}
    const config = getPanelConfig(guildId);

    // who_can_close: "all" | "support" | "owner"
    const whoCanClose = panel?.who_can_close || "all";
    if (whoCanClose === "owner" && userId !== ticket.user_id) {
      await interaction.reply({ content: "Nur der Ticket-Ersteller darf dieses Ticket schließen.", flags: 64 }); return;
    }
    if (whoCanClose === "support" && userId !== ticket.user_id) {
      const supportRoleIds = (() => { try { return JSON.parse(config?.support_role_ids || "[]"); } catch(_) { return config?.support_role_id ? [config.support_role_id] : []; } })();
      const ticketRoles   = (() => { try { return JSON.parse(panel?.ticket_roles   || "[]"); } catch(_) { return []; } })();
      const allStaff = [...new Set([...supportRoleIds, ...ticketRoles])];
      const hasRole = allStaff.length === 0 || allStaff.some(rid => interaction.member?.roles?.cache?.has(rid));
      if (!hasRole) { await interaction.reply({ content: "Du hast keine Berechtigung, dieses Ticket zu schließen.", flags: 64 }); return; }
    }

    const messages = getMessages(ticket.id);
    const transcriptText = messages.map(m =>
      `[${new Date(m.created_at).toLocaleString("de-DE")}] ${m.author_name}: ${m.content}`
    ).join("\n");

    const transcriptChannelId = panel?.transcript_channel_id || config?.transcript_channel_id;
    if (transcriptChannelId && transcriptText) {
      try {
        await sendMessage(transcriptChannelId, `📋 **Transkript** — Ticket #${ticket.id} von <@${ticket.user_id}>`, [], [{
          title: `Ticket #${ticket.id} — Transkript`,
          description: transcriptText.length > 4000 ? transcriptText.substring(0, 4000) + "\n\n... (gekürzt)" : transcriptText || "Keine Nachrichten.",
          color: Number(panel?.embed_color || config?.embed_color || 3447003),
          fields: [
            { name: "Erstellt von", value: `<@${ticket.user_id}>`, inline: true },
            { name: "Geschlossen von", value: `<@${userId}>`, inline: true },
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "Resolvo Tool • Transkript" },
        }]);
      } catch (e) { console.error("Transkript senden fehlgeschlagen:", e.message); }
    }

    closeTicket(ticket.id, transcriptText);

    const closeMsg = (panel?.close_message || `Ticket #${ticket.id} wurde von <@${userId}> geschlossen.`).trim();
    await interaction.reply({
      embeds: [{
        title: "Ticket geschlossen",
        description: `${closeMsg}\n\nDer Kanal wird in **5 Sekunden** gelöscht.`,
        color: 0xed4245,
        footer: { text: "Resolvo Tool" },
        timestamp: new Date().toISOString(),
      }],
    });

    // Rating request if enabled
    const ratingEnabled = panel?.rating_enabled !== undefined ? panel.rating_enabled : (config?.rating_enabled ?? 1);
    if (ratingEnabled) {
      const maxStars = panel?.rating_max_stars || config?.rating_max_stars || 5;
      const question = panel?.rating_question  || config?.rating_question  || "Wie zufrieden bist du mit dem Support?";
      try { await sendMessage(channelId, `⭐ ${question}`, ratingButtons(maxStars), []); } catch(_) {}
    }

    setTimeout(async () => {
      try { await deleteChannel(channelId); } catch (err) { console.error("Kanal löschen:", err); }
    }, 5000);
  }

  export async function stopGatewayBot() {
    if (client) {
      await client.destroy();
      client = null;
      console.log("Gateway getrennt");
    }
  }
  