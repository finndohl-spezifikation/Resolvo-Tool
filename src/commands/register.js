const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("DISCORD_TOKEN und DISCORD_CLIENT_ID müssen gesetzt sein");
  process.exit(1);
}

const commands = [
  {
    name: "ticket",
    description: "Ticket-System verwalten",
    options: [
      {
        name: "create",
        type: 1,
        description: "Erstelle ein neues Support-Ticket",
      },
      {
        name: "close",
        type: 1,
        description: "Schließe das aktuelle Ticket",
      },
      {
        name: "add",
        type: 1,
        description: "Füge einen Nutzer zum Ticket hinzu",
        options: [{ name: "user", type: 6, description: "Der Nutzer", required: true }],
      },
      {
        name: "remove",
        type: 1,
        description: "Entferne einen Nutzer aus dem Ticket",
        options: [{ name: "user", type: 6, description: "Der Nutzer", required: true }],
      },
    ],
  },
  {
    name: "panel",
    description: "Erstelle ein Ticket-Panel in diesem Kanal",
    options: [
      { name: "title", type: 3, description: "Titel des Panels", required: false },
      { name: "description", type: 3, description: "Beschreibung des Panels", required: false },
    ],
  },
  {
    name: "setup",
    description: "Zeigt den Setup-Status von Resolvo Tool",
  },
  {
    name: "stats",
    description: "Zeigt die Ticket-Statistiken dieses Servers",
  },
  {
    name: "premium",
    description: "Informationen und Kauf von Resolvo Tool Premium",
  },
];

const res = await fetch(`https://discord.com/api/v10/applications/${CLIENT_ID}/commands`, {
  method: "PUT",
  headers: {
    Authorization: `Bot ${TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(commands),
});

if (!res.ok) {
  const text = await res.text();
  console.error("Fehler beim Registrieren:", res.status, text);
  process.exit(1);
}

const data = await res.json();
console.log(`✅ ${data.length} Slash-Commands erfolgreich registriert:`);
data.forEach(cmd => console.log(`  /${cmd.name} — ${cmd.description}`));
