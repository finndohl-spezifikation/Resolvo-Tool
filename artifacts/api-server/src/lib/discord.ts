import nacl from "tweetnacl";

export function verifyDiscordRequest(
  publicKey: string,
  signature: string,
  timestamp: string,
  body: string,
): boolean {
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
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
} as const;

export const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
  MODAL: 9,
} as const;

export const MessageFlags = {
  EPHEMERAL: 64,
} as const;

export function ephemeralReply(content: string) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
      flags: MessageFlags.EPHEMERAL,
    },
  };
}

export function publicReply(content: string, components?: unknown[]) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
      ...(components ? { components } : {}),
    },
  };
}

export function embedReply(embed: Record<string, unknown>, ephemeral = false) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
      ...(ephemeral ? { flags: MessageFlags.EPHEMERAL } : {}),
    },
  };
}

export async function discordRequest(
  endpoint: string,
  method: string,
  body?: unknown,
) {
  const token = process.env["DISCORD_TOKEN"];
  if (!token) throw new Error("DISCORD_TOKEN not set");

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
    throw new Error(`Discord API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function createChannel(
  guildId: string,
  name: string,
  parentId?: string,
  permissionOverwrites?: unknown[],
) {
  return discordRequest(`guilds/${guildId}/channels`, "POST", {
    name,
    type: 0,
    ...(parentId ? { parent_id: parentId } : {}),
    ...(permissionOverwrites ? { permission_overwrites: permissionOverwrites } : {}),
  });
}

export async function deleteChannel(channelId: string) {
  return discordRequest(`channels/${channelId}`, "DELETE");
}

export async function sendMessage(channelId: string, content: string, components?: unknown[], embeds?: unknown[]) {
  return discordRequest(`channels/${channelId}/messages`, "POST", {
    content,
    ...(components ? { components } : {}),
    ...(embeds ? { embeds } : {}),
  });
}

export function ticketEmbed(ticketId: number, username: string, subject?: string) {
  return {
    title: `🎫 Ticket #${ticketId}`,
    description: subject || "Bitte beschreibe dein Anliegen. Unser Support-Team wird sich so schnell wie möglich melden.",
    color: 0x5865f2,
    fields: [
      { name: "Erstellt von", value: `<@${username}>`, inline: true },
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
        {
          type: 2,
          style: 4,
          label: "🔒 Ticket schließen",
          custom_id: "close_ticket",
        },
        {
          type: 2,
          style: 1,
          label: "⭐ Bewerten",
          custom_id: "rate_ticket",
        },
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
        label: `${"⭐".repeat(n)}`,
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
        {
          type: 2,
          style: 1,
          label: "🎫 Ticket erstellen",
          custom_id: "create_ticket",
        },
      ],
    },
  ];
}

export function analyzeSentiment(text: string): number {
  const negativeWords = ["hilfe", "problem", "fehler", "kaputt", "funktioniert nicht", "dringend", "sofort", "nie", "nicht", "bug", "error", "broken", "urgent", "help", "issue", "broken", "fail"];
  const positiveWords = ["danke", "super", "toll", "gut", "prima", "okay", "thanks", "great", "good", "nice", "perfect", "awesome"];

  const lower = text.toLowerCase();
  let score = 0;
  for (const word of negativeWords) {
    if (lower.includes(word)) score -= 0.15;
  }
  for (const word of positiveWords) {
    if (lower.includes(word)) score += 0.1;
  }

  return Math.max(-1, Math.min(1, score));
}
