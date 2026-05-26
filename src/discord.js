import nacl from "tweetnacl";

export function verifyDiscordRequest(publicKey, signature, timestamp, body) {
  try {
    return nacl.sign.detached.verify(
      Buffer.from(timestamp + body),
      Buffer.from(signature, "hex"),
      Buffer.from(publicKey, "hex"),
    );
  } catch {
    return false;
  }
}

export async function discordRequest(endpoint, method, body) {
  const token = process.env.DISCORD_TOKEN;
  if (!token) throw new Error("DISCORD_TOKEN nicht gesetzt");

  const res = await fetch(`https://discord.com/api/v10/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord API Fehler ${res.status}: ${text}`);
  }
  return res.json();
}

export function createChannel(guildId, name, parentId, permissionOverwrites) {
  return discordRequest(`guilds/${guildId}/channels`, "POST", {
    name,
    type: 0,
    ...(parentId ? { parent_id: parentId } : {}),
    ...(permissionOverwrites ? { permission_overwrites: permissionOverwrites } : {}),
  });
}

export function deleteChannel(channelId) {
  return discordRequest(`channels/${channelId}`, "DELETE");
}

export function sendMessage(channelId, content, components, embeds) {
  return discordRequest(`channels/${channelId}/messages`, "POST", {
    content,
    ...(components ? { components } : {}),
    ...(embeds ? { embeds } : {}),
  });
}

// ── Embeds ───────────────────────────────────────────────────────────────────

export function ticketEmbed(ticketId, userId, config) {
  const color = config?.embed_color ?? 3447003;
  return {
    title: `Ticket #${ticketId}`,
    description: "Bitte beschreibe dein Anliegen. Unser Support-Team meldet sich so schnell wie m\u00f6glich.",
    color: Number(color),
    fields: [
      { name: "Erstellt von", value: `<@${userId}>`, inline: true },
      { name: "Status", value: "Offen", inline: true },
    ],
    footer: { text: "Resolvo Tool \u2022 Support System" },
    timestamp: new Date().toISOString(),
  };
}

export function panelEmbed(config) {
  const color = config?.embed_color ?? 3447003;
  return {
    title: config?.embed_title || "Support",
    description: config?.embed_description || "Klicke auf den Button um ein Ticket zu erstellen.",
    color: Number(color),
    footer: { text: "Resolvo Tool \u2022 Klicke unten" },
  };
}

export function setupEmbed(config, guild) {
  const fields = [
    { name: "Panel-Channel", value: config?.panel_channel_id ? `<#${config.panel_channel_id}>` : "Nicht gesetzt", inline: true },
    { name: "Ticket-Kategorie", value: config?.ticket_category_id ? `<#${config.ticket_category_id}>` : "Nicht gesetzt", inline: true },
    { name: "Transkript-Channel", value: config?.transcript_channel_id ? `<#${config.transcript_channel_id}>` : "Nicht gesetzt", inline: true },
    { name: "Support-Rolle", value: config?.support_role_id ? `<@&${config.support_role_id}>` : "Nicht gesetzt", inline: true },
    { name: "Button-Text", value: config?.button_text || "Ticket erstellen", inline: true },
    { name: "Farbe", value: config?.embed_color ? `#${Number(config.embed_color).toString(16).padStart(6,"0")}` : "#5865F2", inline: true },
  ];

  return {
    title: "\u2699\ufe0f Panel-Konfiguration",
    description: `Passe das Ticket-System f\u00fcr **${guild?.name || "diesen Server"}** an.`,
    color: 0x57f287,
    fields,
    footer: { text: "Click a button to configure" },
  };
}

// ── Buttons & Components ──────────────────────────────────────────────────────

export function closeButton() {
  return [{
    type: 1,
    components: [
      { type: 2, style: 4, label: "\ud83d\udd12 Ticket schlie\u00dfen", custom_id: "close_ticket" },
      { type: 2, style: 1, label: "\u2b50 Bewerten", custom_id: "rate_ticket" },
    ],
  }];
}

export function ratingButtons() {
  return [{
    type: 1,
    components: [1, 2, 3, 4, 5].map((n) => ({
      type: 2,
      style: n <= 2 ? 4 : n === 3 ? 2 : 3,
      label: "\u2b50".repeat(n),
      custom_id: `rate_${n}`,
    })),
  }];
}

export function openTicketButton(config) {
  const style = config?.button_color ?? 1;
  const label = config?.button_text || "\ud83c\udfab Ticket erstellen";
  return [{
    type: 1,
    components: [{
      type: 2,
      style: Number(style),
      label,
      custom_id: "create_ticket",
      emoji: { name: "\ud83c\udfab" },
    }],
  }];
}

export function setupButtons() {
  return [
    {
      type: 1,
      components: [
        { type: 2, style: 1, label: "Panel-Channel", custom_id: "cfg_panel_ch", emoji: { name: "\ud83d\udccc" } },
        { type: 2, style: 1, label: "Kategorie", custom_id: "cfg_cat", emoji: { name: "\ud83d\udcc1" } },
        { type: 2, style: 1, label: "Transkript", custom_id: "cfg_transcript", emoji: { name: "\ud83d\udccb" } },
        { type: 2, style: 1, label: "Support-Rolle", custom_id: "cfg_role", emoji: { name: "\ud83d\udc65" } },
      ],
    },
    {
      type: 1,
      components: [
        { type: 2, style: 2, label: "Button-Text", custom_id: "cfg_btn_text", emoji: { name: "\u270f\ufe0f" } },
        { type: 2, style: 2, label: "Button-Farbe", custom_id: "cfg_btn_color", emoji: { name: "\ud83c\udfa8" } },
        { type: 2, style: 2, label: "Embed-Farbe", custom_id: "cfg_embed_color", emoji: { name: "\ud83c\udfa8" } },
      ],
    },
    {
      type: 1,
      components: [
        { type: 2, style: 3, label: "Panel ver\u00f6ffentlichen", custom_id: "cfg_publish", emoji: { name: "\ud83d\ude80" } },
        { type: 2, style: 4, label: "Abbrechen", custom_id: "cfg_cancel", emoji: { name: "\u274c" } },
      ],
    },
  ];
}

export function colorButtons() {
  return [
    {
      type: 1,
      components: [
        { type: 2, style: 1, label: "Blau", custom_id: "color_blue" },
        { type: 2, style: 3, label: "Gr\u00fcn", custom_id: "color_green" },
        { type: 2, style: 4, label: "Rot", custom_id: "color_red" },
      ],
    },
    {
      type: 1,
      components: [
        { type: 2, style: 2, label: "Grau", custom_id: "color_grey" },
        { type: 2, style: 3, label: "Gold", custom_id: "color_gold" },
        { type: 2, style: 4, label: "Lila", custom_id: "color_purple" },
      ],
    },
  ];
}

// ── Utilities ──────────────────────────────────────────────────────────────────────

export function analyzeSentiment(text) {
  const negative = ["hilfe", "problem", "fehler", "kaputt", "dringend", "nie", "nicht", "bug", "error", "urgent", "help"];
  const positive = ["danke", "super", "toll", "gut", "thanks", "great", "perfect", "awesome"];
  const lower = text.toLowerCase();
  let score = 0;
  for (const w of negative) if (lower.includes(w)) score -= 0.15;
  for (const w of positive) if (lower.includes(w)) score += 0.1;
  return Math.max(-1, Math.min(1, score));
}

export const colorMap = {
  color_blue: { name: "Blau", value: 3447003, style: 1 },
  color_green: { name: "Gr\u00fcn", value: 5763719, style: 3 },
  color_red: { name: "Rot", value: 15548997, style: 4 },
  color_grey: { name: "Grau", value: 9807270, style: 2 },
  color_gold: { name: "Gold", value: 16766720, style: 3 },
  color_purple: { name: "Lila", value: 10181046, style: 4 },
};
