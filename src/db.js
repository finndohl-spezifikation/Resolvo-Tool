import Database from "better-sqlite3";
import { mkdirSync } from "fs";

mkdirSync("/app/data", { recursive: true });

const db = new Database("/app/data/resolvo.db");
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS guilds (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      is_premium INTEGER NOT NULL DEFAULT 0,
      premium_since TEXT,
      premium_user_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      is_premium INTEGER NOT NULL DEFAULT 0,
      premium_since TEXT,
      stripe_customer_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ticket_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      emoji TEXT DEFAULT '🎫',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      channel_id TEXT NOT NULL,
      assigned_to TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'medium',
      subject TEXT,
      sentiment_score REAL,
      closed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS staff_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log("✅ Datenbank bereit:", "/app/data/resolvo.db");
}

// ── Guilds ────────────────────────────────────────────────────────────────────

export function upsertGuild(id, name) {
  db.prepare(`
    INSERT INTO guilds (id, name) VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, updated_at = datetime('now')
  `).run(id, name);
}

export function getGuild(id) {
  return db.prepare("SELECT * FROM guilds WHERE id = ?").get(id);
}

export function setGuildPremium(id, userId) {
  db.prepare(`
    UPDATE guilds SET is_premium = 1, premium_since = datetime('now'), premium_user_id = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(userId, id);
}

// ── Users ─────────────────────────────────────────────────────────────────────

export function upsertUser(id, username) {
  db.prepare(`
    INSERT INTO users (id, username) VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET username = excluded.username, updated_at = datetime('now')
  `).run(id, username);
}

export function setUserPremium(id) {
  db.prepare(`
    UPDATE users SET is_premium = 1, premium_since = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(id);
}

// ── Tickets ───────────────────────────────────────────────────────────────────

export function createTicket(guildId, userId, channelId, priority = "medium") {
  const result = db.prepare(`
    INSERT INTO tickets (guild_id, user_id, channel_id, status, priority)
    VALUES (?, ?, ?, 'open', ?)
  `).run(guildId, userId, channelId, priority);
  return db.prepare("SELECT * FROM tickets WHERE id = ?").get(result.lastInsertRowid);
}

export function getTicket(id) {
  return db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);
}

export function getTicketByChannel(channelId) {
  return db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(channelId);
}

export function getOpenTicketByUser(guildId, userId) {
  return db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? AND status = 'open'").get(guildId, userId);
}

export function getTickets(guildId, status, limit = 50, offset = 0) {
  if (status) {
    return db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?").all(guildId, status, limit, offset);
  }
  return db.prepare("SELECT * FROM tickets WHERE guild_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?").all(guildId, limit, offset);
}

export function closeTicket(id) {
  db.prepare(`
    UPDATE tickets SET status = 'closed', closed_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(id);
}

export function updateTicket(id, fields) {
  const sets = [];
  const vals = [];
  if (fields.status !== undefined) { sets.push("status = ?"); vals.push(fields.status); }
  if (fields.priority !== undefined) { sets.push("priority = ?"); vals.push(fields.priority); }
  if (fields.assignedTo !== undefined) { sets.push("assigned_to = ?"); vals.push(fields.assignedTo); }
  sets.push("updated_at = datetime('now')");
  vals.push(id);
  db.prepare(`UPDATE tickets SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  return db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);
}

// ── Messages ──────────────────────────────────────────────────────────────────

export function addMessage(ticketId, authorId, authorName, content) {
  db.prepare(`
    INSERT INTO ticket_messages (ticket_id, author_id, author_name, content)
    VALUES (?, ?, ?, ?)
  `).run(ticketId, authorId, authorName, content);
}

export function getMessages(ticketId) {
  return db.prepare("SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC").all(ticketId);
}

// ── Ratings ───────────────────────────────────────────────────────────────────

export function addRating(ticketId, rating, comment) {
  db.prepare("INSERT INTO staff_ratings (ticket_id, rating, comment) VALUES (?, ?, ?)").run(ticketId, rating, comment ?? null);
}

export function getRating(ticketId) {
  return db.prepare("SELECT * FROM staff_ratings WHERE ticket_id = ?").get(ticketId);
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function getStats(guildId) {
  const open = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE guild_id = ? AND status = 'open'").get(guildId).count;
  const closed = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE guild_id = ? AND status = 'closed'").get(guildId).count;
  const avgRating = db.prepare(`
    SELECT AVG(r.rating) as avg FROM staff_ratings r
    JOIN tickets t ON r.ticket_id = t.id WHERE t.guild_id = ?
  `).get(guildId).avg;
  const thisMonth = db.prepare(`
    SELECT COUNT(*) as count FROM tickets
    WHERE guild_id = ? AND created_at >= datetime('now', '-30 days')
  `).get(guildId).count;
  const recent = db.prepare("SELECT * FROM tickets WHERE guild_id = ? ORDER BY created_at DESC LIMIT 5").all(guildId);
  return { open, closed, total: open + closed, avgRating: avgRating ? Number(avgRating).toFixed(1) : null, thisMonth, recentTickets: recent };
}
