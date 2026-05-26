import app from "./app.js";
import { runMigrations } from "./db.js";
import { startGatewayBot, stopGatewayBot } from "./gateway.js";

if (!process.env.DISCORD_TOKEN) {
  console.error("❌ FEHLER: DISCORD_TOKEN ist nicht gesetzt!"); process.exit(1);
}
if (!process.env.DISCORD_PUBLIC_KEY) {
  console.error("❌ FEHLER: DISCORD_PUBLIC_KEY ist nicht gesetzt!"); process.exit(1);
}

const port = Number(process.env.PORT || 8080);

try {
  runMigrations();
  app.listen(port, () => {
    console.log(`🚀 Resolvo Tool läuft auf Port ${port}`);
    console.log(`📁 Daten gespeichert in: /app/data/resolvo.db`);
  });

  // Starte Gateway-Bot für sichtbaren Online-Status und Presence
  startGatewayBot();
} catch (err) {
  console.error("❌ Startfehler:", err.message);
  process.exit(1);
}

process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM empfangen – Gateway trennen...");
  await stopGatewayBot();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT empfangen – Gateway trennen...");
  await stopGatewayBot();
  process.exit(0);
});
