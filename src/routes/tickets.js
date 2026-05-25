import { Router } from "express";
import { getTickets, getTicket, getMessages, getRating, updateTicket } from "../db.js";

const router = Router();

router.get("/guilds/:guildId/tickets", (req, res) => {
  const { guildId } = req.params;
  const { status, limit = "50", offset = "0" } = req.query;
  const tickets = getTickets(guildId, status || null, Number(limit), Number(offset));
  res.json({ tickets });
});

router.get("/guilds/:guildId/tickets/:id", (req, res) => {
  const { guildId, id } = req.params;
  const ticket = getTicket(Number(id));
  if (!ticket || ticket.guild_id !== guildId) { res.status(404).json({ error: "Ticket nicht gefunden" }); return; }
  const messages = getMessages(ticket.id);
  const rating = getRating(ticket.id);
  res.json({ ticket, messages, rating });
});

router.patch("/guilds/:guildId/tickets/:id", (req, res) => {
  const { guildId, id } = req.params;
  const { status, priority, assignedTo } = req.body;
  const ticket = updateTicket(Number(id), { status, priority, assignedTo });
  res.json({ ticket });
});

export default router;
