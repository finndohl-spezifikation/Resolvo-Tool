import { Client, GatewayIntentBits, ActivityType } from "discord.js";

  let client = null;

  export function getClient() {
    return client;
  }

  export async function startGatewayBot() {
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      console.warn("DISCORD_TOKEN nicht gesetzt – Gateway-Bot wird nicht gestartet.");
      return;
    }

    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    client.once("ready", () => {
      console.log(`Gateway verbunden als ${client.user.tag}`);
      console.log(`Bot-Status: ${client.presence?.status || "online"}`);
    });

    client.on("messageCreate", async (message) => {
      if (message.author.bot) return;
    });

    client.on("error", (err) => {
      console.error("Gateway Fehler:", err.message);
    });

    try {
      await client.login(token);
      await client.user.setPresence({
        status: "online",
        activities: [{ name: "/ticket | Resolvo Tool", type: ActivityType.Playing }],
      });
    } catch (err) {
      console.error("Gateway Login fehlgeschlagen:", err.message);
    }
  }

  export async function stopGatewayBot() {
    if (client) {
      await client.destroy();
      client = null;
      console.log("Gateway getrennt");
    }
  }
  