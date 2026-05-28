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

      CREATE TABLE IF NOT EXISTS panel_configs (
        guild_id TEXT PRIMARY KEY REFERENCES guilds(id) ON DELETE CASCADE,
        panel_channel_id TEXT,
        ticket_category_id TEXT,
        transcript_channel_id TEXT,
        support_role_id TEXT,
        button_color INTEGER DEFAULT 1,
        button_text TEXT DEFAULT 'Ticket erstellen',
        embed_color INTEGER DEFAULT 3447003,
        embed_title TEXT DEFAULT 'Support',
        embed_description TEXT DEFAULT 'Klicke auf den Button um ein Ticket zu erstellen.',
        rating_enabled INTEGER DEFAULT 1,
        ai_enabled INTEGER DEFAULT 0,
        escalation_hours INTEGER DEFAULT 24,
        faq_enabled INTEGER DEFAULT 1,
        forms_enabled INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS ticket_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#4f8cff',
        description TEXT,
        form_fields TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );


        CREATE TABLE IF NOT EXISTS panels (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guild_id TEXT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
          name TEXT NOT NULL DEFAULT 'Panel',
          channel_id TEXT,
          embed_title TEXT DEFAULT 'Support',
          embed_description TEXT DEFAULT 'Klicke auf den Button um ein Ticket zu erstellen.',
          embed_color INTEGER DEFAULT 3447003,
          button_text TEXT DEFAULT 'Ticket erstellen',
          button_color INTEGER DEFAULT 1,
          ticket_category_id TEXT,
          sort_order INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1,
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
        category_id INTEGER REFERENCES ticket_categories(id),
        tags TEXT,
        sentiment_score REAL,
        escalated INTEGER DEFAULT 0,
        escalated_at TEXT,
        closed_at TEXT,
        transcript TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS ticket_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        author_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        content TEXT NOT NULL,
        is_ai_reply INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS staff_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS faq_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        trigger_words TEXT,
        use_count INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    console.log("[DB] Database ready:", "/app/data/resolvo.db");
  }

  // ── Guilds ──────────────────────────────────────────────────────────────────


    // ── Schema migrations (safe ALTER TABLE) ────────────────────────────────────
    const _addCol = (col, def) => {
      try { db.prepare(`ALTER TABLE panel_configs ADD COLUMN ${col} ${def}`).run(); } catch (_) {}
    };
    _addCol("support_role_ids", "TEXT DEFAULT '[]'");
    _addCol("rating_question", "TEXT DEFAULT 'Wie zufrieden bist du mit der Bearbeitung?'");
    _addCol("rating_max_stars", "INTEGER DEFAULT 5");
    _addCol("rating_dm_message", "TEXT DEFAULT ''");
    _addCol("rating_show_in_channel", "INTEGER DEFAULT 0");
  
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

  // ── Users ────────────────────────────────────────────────────────────────────

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

  // ── Panel Config ─────────────────────────────────────────────────────────────

  export function getPanelConfig(guildId) {
    return db.prepare("SELECT * FROM panel_configs WHERE guild_id = ?").get(guildId);
  }

  export function upsertPanelConfig(guildId, fields) {
    const cols = Object.keys(fields);
    const placeholders = cols.map(() => "?").join(", ");
    const colsStr = cols.join(", ");
    const values = Object.values(fields);

    db.prepare(`
      INSERT INTO panel_configs (guild_id, ${colsStr}, updated_at)
      VALUES (?, ${placeholders}, datetime('now'))
      ON CONFLICT(guild_id) DO UPDATE SET
        ${cols.map(c => `${c} = excluded.${c}`).join(", ")},
        updated_at = datetime('now')
    `).run(guildId, ...values);
  }


  // ── Panels (multi-panel per guild) ──────────────────────────────────────────

  export function getPanels(guildId) {
    return db.prepare("SELECT * FROM panels WHERE guild_id = ? AND is_active = 1 ORDER BY sort_order, id").all(guildId);
  }

  export function createPanel(guildId, fields) {
    const cols = Object.keys(fields);
    const placeholders = cols.map(() => "?").join(", ");
    const res = db.prepare(`INSERT INTO panels (guild_id, ${cols.join(", ")}) VALUES (?, ${placeholders})`).run(guildId, ...Object.values(fields));
    return res.lastInsertRowid;
  }

  export function updatePanel(id, guildId, fields) {
    const cols = Object.keys(fields);
    db.prepare(`UPDATE panels SET ${cols.map(c => `${c} = ?`).join(", ")} WHERE id = ? AND guild_id = ?`).run(...Object.values(fields), id, guildId);
  }

  export function deletePanel(id, guildId) {
    db.prepare("UPDATE panels SET is_active = 0 WHERE id = ? AND guild_id = ?").run(id, guildId);
  }
  
  // ── Ticket Categories (Tags) ─────────────────────────────────────────────────

  export function addTicketCategory(guildId, name, color, description, formFields) {
    const result = db.prepare(`
      INSERT INTO ticket_categories (guild_id, name, color, description, form_fields)
      VALUES (?, ?, ?, ?, ?)
    `).run(guildId, name, color || '#4f8cff', description || null, formFields ? JSON.stringify(formFields) : null);
    return result.lastInsertRowid;
  }

  export function getTicketCategories(guildId) {
    return db.prepare("SELECT * FROM ticket_categories WHERE guild_id = ? AND is_active = 1").all(guildId);
  }

  export function getTicketCategory(id) {
    return db.prepare("SELECT * FROM ticket_categories WHERE id = ?").get(id);
  }

  export function deleteTicketCategory(id) {
    db.prepare("UPDATE ticket_categories SET is_active = 0 WHERE id = ?").run(id);
  }

  
  // ── Legacy wrappers (used by gateway.js) ─────────────────────────────────────

  export function setSupportRole(guildId, roleId) {
    upsertPanelConfig(guildId, { support_role_id: roleId });
  }

  export function setPanelAppearance(guildId, { buttonColor, buttonText, embedColor, embedTitle, embedDescription }) {
    upsertPanelConfig(guildId, {
      button_color: buttonColor,
      button_text: buttonText,
      embed_color: embedColor,
      embed_title: embedTitle,
      embed_description: embedDescription,
    });
  }

  
  export function setPanelChannel(guildId, channelId) {
    upsertPanelConfig(guildId, { panel_channel_id: channelId });
  }

  export function setTicketCategory(guildId, categoryId) {
    upsertPanelConfig(guildId, { ticket_category_id: categoryId });
  }

  export function setTranscriptChannel(guildId, channelId) {
    upsertPanelConfig(guildId, { transcript_channel_id: channelId });
  }

  // ── Tickets ───────────────────────────────────────────────────────────────────

  export function createTicket(guildId, userId, channelId, priority = "medium", categoryId = null, subject = null) {
    const result = db.prepare(`
      INSERT INTO tickets (guild_id, user_id, channel_id, status, priority, category_id, subject)
      VALUES (?, ?, ?, 'open', ?, ?, ?)
    `).run(guildId, userId, channelId, priority, categoryId, subject);
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

  export function getEscalatableTickets(hours) {
    return db.prepare(`
      SELECT * FROM tickets 
      WHERE status = 'open' AND escalated = 0 
      AND datetime(created_at, '+${hours} hours') <= datetime('now')
    `).all();
  }

  export function setTicketEscalated(id) {
    db.prepare("UPDATE tickets SET escalated = 1, escalated_at = datetime('now') WHERE id = ?").run(id);
  }

  export function setTicketTags(id, tags) {
    db.prepare("UPDATE tickets SET tags = ? WHERE id = ?").run(JSON.stringify(tags), id);
  }

  export function closeTicket(id, transcript = null) {
    db.prepare(`
      UPDATE tickets SET status = 'closed', closed_at = datetime('now'), transcript = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(transcript, id);
  }

  export function updateTicket(id, fields) {
    const sets = [];
    const vals = [];
    if (fields.status !== undefined) { sets.push("status = ?"); vals.push(fields.status); }
    if (fields.priority !== undefined) { sets.push("priority = ?"); vals.push(fields.priority); }
    if (fields.assignedTo !== undefined) { sets.push("assigned_to = ?"); vals.push(fields.assignedTo); }
    if (fields.tags !== undefined) { sets.push("tags = ?"); vals.push(JSON.stringify(fields.tags)); }
    if (fields.escalated !== undefined) { sets.push("escalated = ?"); vals.push(fields.escalated); }
    sets.push("updated_at = datetime('now')");
    vals.push(id);
    db.prepare(`UPDATE tickets SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
    return db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);
  }

  // ── Messages ──────────────────────────────────────────────────────────────────

  export function addMessage(ticketId, authorId, authorName, content, isAiReply = false) {
    db.prepare(`
      INSERT INTO ticket_messages (ticket_id, author_id, author_name, content, is_ai_reply)
      VALUES (?, ?, ?, ?, ?)
    `).run(ticketId, authorId, authorName, content, isAiReply ? 1 : 0);
  }

  export function getMessages(ticketId) {
    return db.prepare("SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC").all(ticketId);
  }

  // ── Ratings ────────────────────────────────────────────────────────────────────

  export function addRating(ticketId, rating, comment) {
    db.prepare("INSERT INTO staff_ratings (ticket_id, rating, comment) VALUES (?, ?, ?)").run(ticketId, rating, comment ?? null);
  }

  export function getRating(ticketId) {
    return db.prepare("SELECT * FROM staff_ratings WHERE ticket_id = ?").get(ticketId);
  }

  // ── FAQ ──────────────────────────────────────────────────────────────────────

  export function addFaqEntry(guildId, question, answer, triggerWords) {
    const result = db.prepare(`
      INSERT INTO faq_entries (guild_id, question, answer, trigger_words)
      VALUES (?, ?, ?, ?)
    `).run(guildId, question, answer, triggerWords || null);
    return result.lastInsertRowid;
  }

  export function getFaqEntries(guildId) {
    return db.prepare("SELECT * FROM faq_entries WHERE guild_id = ? AND is_active = 1").all(guildId);
  }

  export function incrementFaqUse(id) {
    db.prepare("UPDATE faq_entries SET use_count = use_count + 1 WHERE id = ?").run(id);
  }

  export function deleteFaqEntry(id) {
    db.prepare("UPDATE faq_entries SET is_active = 0 WHERE id = ?").run(id);
  }

  // ── Stats ──────────────────────────────────────────────────────────────────────

    export function getGlobalTicketCount() {
      try {
        return db.prepare("SELECT COUNT(*) as count FROM tickets").get().count;
      } catch (_) { return 0; }
    }
  

  export function getStats(guildId) {
    const open = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE guild_id = ? AND status = 'open'").get(guildId).count;
    const closed = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE guild_id = ? AND status = 'closed'").get(guildId).count;
    let escalated = 0;
    try { escalated = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE guild_id = ? AND escalated = 1").get(guildId).count; } catch (_) {}
    const avgRating = db.prepare(`
      SELECT AVG(r.rating) as avg FROM staff_ratings r
      JOIN tickets t ON r.ticket_id = t.id WHERE t.guild_id = ?
    `).get(guildId).avg;
    const thisMonth = db.prepare(`
      SELECT COUNT(*) as count FROM tickets
      WHERE guild_id = ? AND created_at >= datetime('now', '-30 days')
    `).get(guildId).count;
    const categories = db.prepare("SELECT COUNT(*) as count FROM ticket_categories WHERE guild_id = ? AND is_active = 1").get(guildId).count;
    return { open, closed, escalated, total: open + closed, avgRating: avgRating ? Number(avgRating).toFixed(1) : null, thisMonth, categories };
  }
  