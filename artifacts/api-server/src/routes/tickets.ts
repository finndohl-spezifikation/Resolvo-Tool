import { Router } from "express";
import { db } from "@workspace/db";
import { ticketsTable, ticketMessagesTable, ratingsTable } from "@workspace/db";
import { eq, and, desc, count, avg } from "drizzle-orm";

const router = Router();

router.get("/guilds/:guildId/tickets", async (req, res) => {
  const { guildId } = req.params;
  const { status, limit = "50", offset = "0" } = req.query;

  const conditions = [eq(ticketsTable.guildId, guildId)];
  if (status && typeof status === "string") {
    conditions.push(eq(ticketsTable.status, status as any));
  }

  const tickets = await db
    .select()
    .from(ticketsTable)
    .where(and(...conditions))
    .orderBy(desc(ticketsTable.createdAt))
    .limit(Number(limit))
    .offset(Number(offset));

  res.json({ tickets });
});

router.get("/guilds/:guildId/tickets/:id", async (req, res) => {
  const { guildId, id } = req.params;

  const ticket = await db
    .select()
    .from(ticketsTable)
    .where(and(eq(ticketsTable.guildId, guildId), eq(ticketsTable.id, Number(id))))
    .then((r) => r[0]);

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const messages = await db
    .select()
    .from(ticketMessagesTable)
    .where(eq(ticketMessagesTable.ticketId, ticket.id))
    .orderBy(ticketMessagesTable.createdAt);

  const rating = await db
    .select()
    .from(ratingsTable)
    .where(eq(ratingsTable.ticketId, ticket.id))
    .then((r) => r[0]);

  res.json({ ticket, messages, rating });
});

router.patch("/guilds/:guildId/tickets/:id", async (req, res) => {
  const { guildId, id } = req.params;
  const { status, priority, assignedTo } = req.body;

  const updated = await db
    .update(ticketsTable)
    .set({
      ...(status !== undefined ? { status } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(assignedTo !== undefined ? { assignedTo } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(ticketsTable.guildId, guildId), eq(ticketsTable.id, Number(id))))
    .returning();

  res.json({ ticket: updated[0] });
});

export default router;
