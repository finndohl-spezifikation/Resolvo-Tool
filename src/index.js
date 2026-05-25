import app from "./app.js";
import { runMigrations } from "./db.js";

const port = Number(process.env.PORT || 8080);

runMigrations()
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 Resolvo Tool API läuft auf Port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Migration fehlgeschlagen, Server startet nicht:", err);
    process.exit(1);
  });
