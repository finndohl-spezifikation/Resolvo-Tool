import { Router } from "express";
import { getStats, getGuild } from "../db.js";

const router = Router();

router.get("/guilds/:guildId/stats", (req, res) => {
  const { guildId } = req.params;
  res.json(getStats(guildId));
});

router.get("/stats/public/:guildId", (req, res) => {
  const { guildId } = req.params;
  const guild = getGuild(guildId);
  if (!guild) { res.status(404).json({ error: "Server nicht gefunden" }); return; }
  const stats = getStats(guildId);
  res.json({
    guildName: guild.name,
    guildIcon: guild.icon,
    totalTickets: stats.total,
    closedTickets: stats.closed,
    resolutionRate: stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0,
    avgRating: stats.avgRating,
    isPremium: !!guild.is_premium,
  });
});

export default router;
