const DISCORD_TOKEN = process.env["DISCORD_TOKEN"];
const DISCORD_CLIENT_ID = process.env["DISCORD_CLIENT_ID"];

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  console.error("❌ DISCORD_TOKEN and DISCORD_CLIENT_ID must be set");
  process.exit(1);
}

const commands = [
  {
    name: "ticket",
    description: "Ticket-Verwaltung",
    options: [
      {
        type: 1,
        name: "create",
        description: "Erstelle ein neues Support-Ticket",
      },
      {
        type: 1,
        name: "close",
        description: "Schließe das aktuelle Ticket",
      },
      {
        type: 1,
        name: "add",
        description: "Füge einen Nutzer zum Ticket hinzu",
        options: [
          {
            type: 6,
            name: "user",
            description: "Der Nutzer der hinzugefügt werden soll",
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: "remove",
        description: "Entferne einen Nutzer aus dem Ticket",
        options: [
          {
            type: 6,
            name: "user",
            description: "Der Nutzer der entfernt werden soll",
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: "panel",
    description: "Erstelle ein Ticket-Panel in diesem Kanal",
    options: [
      {
        type: 3,
        name: "title",
        description: "Titel des Panels",
        required: false,
      },
      {
        type: 3,
        name: "description",
        description: "Beschreibung des Panels",
        required: false,
      },
    ],
  },
  {
    name: "setup",
    description: "Richte Resolvo Tool auf diesem Server ein",
  },
  {
    name: "stats",
    description: "Zeige Support-Statistiken des Servers",
  },
  {
    name: "premium",
    description: "Informationen über und Upgrade auf Resolvo Tool Premium",
  },
];

async function registerCommands() {
  console.log("🚀 Registering slash commands...");

  const res = await fetch(
    `https://discord.com/api/v10/applications/${DISCORD_CLIENT_ID}/commands`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${DISCORD_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
    },
  );

  if (!res.ok) {
    const error = await res.text();
    console.error(`❌ Failed to register commands: ${error}`);
    process.exit(1);
  }

  const data = await res.json();
  console.log(`✅ Successfully registered ${(data as any[]).length} commands!`);
  for (const cmd of data as any[]) {
    console.log(`  /${cmd.name}`);
  }
}

registerCommands().catch(console.error);
