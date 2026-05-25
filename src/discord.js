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

export const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  MODAL_SUBMIT: 5,
};

export const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
};

export function ephemeralReply(content) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content, flags: 64 },
  };
}

export function embedReply(embed, ephemeral = false) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
      ...(ephemeral ? { flags: 64 } : {}),
    },
  };
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

export function ticketEmbed(ticketId, userId) {
  return {
    title: `🎫 Ticket #${ticketId}`,
    description: "Bitte beschreibe dein Anliegen. Unser Support-Team meldet sich so schnell wie möglich.",
    color: 0x5865f2,
    fields: [
      { name: "Erstellt von", value: `<@${userId}>`, inline: true },
      { name: "Status", value: "🟢 Offen", inline: true },
    ],
    footer: { text: "Resolvo Tool • Support System" },
    timestamp: new Date().toISOString(),
  };
}

export function closeButton() {
  return [
    {
      type: 1,
      components: [
        { type: 2, style: 4, label: "🔒 Ticket schließen", custom_id: "close_ticket" },
        { type: 2, style: 1, label: "⭐ Bewerten", custom_id: "rate_ticket" },
      ],
    },
  ];
}

export function ratingButtons() {
  return [
    {
      type: 1,
      components: [1, 2, 3, 4, 5].map((n) => ({
        type: 2,
        style: n <= 2 ? 4 : n === 3 ? 2 : 3,
        label: "⭐".repeat(n),
        custom_id: `rate_${n}`,
      })),
    },
  ];
}

export function openTicketButton() {
  return [
    {
      type: 1,
      components: [
        { type: 2, style: 1, label: "🎫 Ticket erstellen", custom_id: "create_ticket" },
      ],
    },
  ];
}

export function analyzeSentiment(text) {
  const negative = ["hilfe", "problem", "fehler", "kaputt", "dringend", "nie", "nicht", "bug", "error", "urgent", "help"];
  const positive = ["danke", "super", "toll", "gut", "thanks", "great", "perfect", "awesome"];
  const lower = text.toLowerCase();
  let score = 0;
  for (const w of negative) if (lower.includes(w)) score -= 0.15;
  for (const w of positive) if (lower.includes(w)) score += 0.1;
  return Math.max(-1, Math.min(1, score));
}
