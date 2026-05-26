import "dotenv/config";
  import app from "./app.js";
  import { runMigrations, getEscalatableTickets, setTicketEscalated, getGuild } from "./db.js";
  import { getClient } from "./gateway.js";
  import { sendMessage } from "./discord.js";

  const PORT = process.env.PORT || 8080;

  runMigrations();

  // Escalation Cron - check every 5 minutes
  setInterval(async () => {
    try {
      const tickets = getEscalatableTickets(24);
      for (const ticket of tickets) {
        const guild = getGuild(ticket.guild_id);
        if (!guild) continue;
        
        setTicketEscalated(ticket.id);
        
        try {
          await sendMessage(ticket.channel_id, 
            `[AUTO-ESCALATION] Dieses Ticket ist seit ueber 24 Stunden offen und wurde automatisch eskaliert. Bitte ein Support-Mitglied uebernehmen.`
          );
          console.log(`[Escalation] Ticket #${ticket.id} escalated`);
        } catch (err) {
          console.error(`[Escalation] Failed to notify ticket #${ticket.id}:`, err.message);
        }
      }
    } catch (err) {
      console.error("[Escalation Cron] Error:", err);
    }
  }, 5 * 60 * 1000);

  const server = app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("[Server] SIGTERM received, shutting down...");
    server.close(() => process.exit(0));
  });
  