import { Router } from "express";
import { db } from "@workspace/db";
import { ticketsTable, ratingsTable, guildsTable } from "@workspace/db";
import { eq, and, count, avg, gte, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/guilds/:guildId/stats", async (req, res) => {
  const { guildId } = req.params;

  const [openCount] = await db
    .select({ count: count() })
    .from(ticketsTable)
    .where(and(eq(ticketsTable.guildId, guildId), eq(ticketsTable.status, "open")));

  const [closedCount] = await db
    .select({ count: count() })
    .from(ticketsTable)
    .where(and(eq(ticketsTable.guildId, guildId), eq(ticketsTable.status, "closed")));

  const [avgRating] = await db
    .select({ avg: avg(ratingsTable.rating) })
    .from(ratingsTable)
    .innerJoin(ticketsTable, eq(ratingsTable.ticketId, ticketsTable.id))
    .where(eq(ticketsTable.guildId, guildId));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [monthCount] = await db
    .select({ count: count() })
    .from(ticketsTable)
    .where(and(eq(ticketsTable.guildId, guildId), gte(ticketsTable.createdAt, thirtyDaysAgo)));

  const recentTickets = await db
    .select()
    .from(ticketsTable)
    .where(eq(ticketsTable.guildId, guildId))
    .orderBy(desc(ticketsTable.createdAt))
    .limit(5);

  res.json({
    open: openCount?.count ?? 0,
    closed: closedCount?.count ?? 0,
    total: (openCount?.count ?? 0) + (closedCount?.count ?? 0),
    avgRating: avgRating?.avg ? parseFloat(String(avgRating.avg)).toFixed(1) : null,
    thisMonth: monthCount?.count ?? 0,
    recentTickets,
  });
});

router.get("/stats/public/:guildId", async (req, res) => {
  const { guildId } = req.params;

  const guild = await db
    .select()
    .from(guildsTable)
    .where(eq(guildsTable.id, guildId))
    .then((r) => r[0]);

  if (!guild) {
    res.status(404).json({ error: "Server not found" });
    return;
  }

  const [totalCount] = await db
    .select({ count: count() })
    .from(ticketsTable)
    .where(eq(ticketsTable.guildId, guildId));

  const [closedCount] = await db
    .select({ count: count() })
    .from(ticketsTable)
    .where(and(eq(ticketsTable.guildId, guildId), eq(ticketsTable.status, "closed")));

  const [avgRating] = await db
    .select({ avg: avg(ratingsTable.rating) })
    .from(ratingsTable)
    .innerJoin(ticketsTable, eq(ratingsTable.ticketId, ticketsTable.id))
    .where(eq(ticketsTable.guildId, guildId));

  const resolutionRate =
    totalCount?.count && totalCount.count > 0
      ? Math.round((Number(closedCount?.count ?? 0) / Number(totalCount.count)) * 100)
      : 0;

  res.json({
    guildName: guild.name,
    guildIcon: guild.icon,
    totalTickets: totalCount?.count ?? 0,
    closedTickets: closedCount?.count ?? 0,
    resolutionRate,
    avgRating: avgRating?.avg ? parseFloat(String(avgRating.avg)).toFixed(1) : null,
    isPremium: guild.isPremium,
  });
});

export default router;
