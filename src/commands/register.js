const TOKEN = process.env.DISCORD_TOKEN;
  const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

  if (!TOKEN || !CLIENT_ID) {
    console.error("DISCORD_TOKEN und DISCORD_CLIENT_ID muessen gesetzt sein");
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
          description: "Schliesze das aktuelle Ticket",
        },
        {
          name: "add",
          type: 1,
          description: "Fuege einen Nutzer zum Ticket hinzu",
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
      name: "category",
      description: "Ticket-Kategorien verwalten",
      options: [
        {
          name: "add",
          type: 1,
          description: "Neue Kategorie erstellen",
          options: [
            { name: "name", type: 3, description: "Name der Kategorie", required: true },
            { name: "description", type: 3, description: "Beschreibung", required: false },
            { name: "color", type: 3, description: "Hex-Farbe (z.B. #4f8cff)", required: false },
          ],
        },
        {
          name: "list",
          type: 1,
          description: "Alle Kategorien anzeigen",
        },
        {
          name: "remove",
          type: 1,
          description: "Kategorie entfernen",
          options: [{ name: "id", type: 4, description: "Kategorie ID", required: true }],
        },
      ],
    },
    {
      name: "faq",
      description: "FAQ-Eintraege verwalten",
      options: [
        {
          name: "add",
          type: 1,
          description: "FAQ-Eintrag hinzufuegen",
          options: [
            { name: "question", type: 3, description: "Frage", required: true },
            { name: "answer", type: 3, description: "Antwort", required: true },
          ],
        },
        {
          name: "list",
          type: 1,
          description: "FAQ-Eintraege anzeigen",
        },
      ],
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
  console.log(`${data.length} Slash-Commands erfolgreich registriert:`);
  data.forEach(cmd => console.log(`  /${cmd.name} -- ${cmd.description}`));
  