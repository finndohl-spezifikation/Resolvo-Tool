import app from "./app.js";
import { runMigrations } from "./db.js";

if (!process.env.DATABASE_URL) {
  console.error("❌ FEHLER: DATABASE_URL ist nicht gesetzt!");
  console.error("   Füge in Railway eine PostgreSQL-Datenbank hinzu und verknüpfe sie mit diesem Service.");
  process.exit(1);
}

if (!process.env.DISCORD_TOKEN) {
  console.error("❌ FEHLER: DISCORD_TOKEN ist nicht gesetzt!");
  process.exit(1);
}

if (!process.env.DISCORD_PUBLIC_KEY) {
  console.error("❌ FEHLER: DISCORD_PUBLIC_KEY ist nicht gesetzt!");
  process.exit(1);
}

const port = Number(process.env.PORT || 8080);

runMigrations()
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 Resolvo Tool API läuft auf Port ${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ Migration fehlgeschlagen:", err.message);
    console.error("   Prüfe ob DATABASE_URL korrekt gesetzt ist.");
    process.exit(1);
  });
