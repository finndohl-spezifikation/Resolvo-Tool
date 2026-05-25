import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, text, boolean, timestamp, jsonb, serial, integer, real } from "drizzle-orm/pg-core";

const { Pool } = pg;

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

// ── Schema ────────────────────────────────────────────────────────────────────

export const guildsTable = pgTable("guilds", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
  isPremium: boolean("is_premium").notNull().default(false),
  premiumSince: timestamp("premium_since"),
  premiumUserId: text("premium_user_id"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  discriminator: text("discriminator"),
  avatar: text("avatar"),
  isPremium: boolean("is_premium").notNull().default(false),
  premiumSince: timestamp("premium_since"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const categoriesTable = pgTable("ticket_categories", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull().references(() => guildsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  emoji: text("emoji").default("🎫"),
  supportRoleId: text("support_role_id"),
  logChannelId: text("log_channel_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ticketsTable = pgTable("tickets", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull().references(() => guildsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  channelId: text("channel_id").notNull(),
  categoryId: integer("category_id").references(() => categoriesTable.id),
  assignedTo: text("assigned_to"),
  status: text("status").notNull().default("open"),
  priority: text("priority").notNull().default("medium"),
  subject: text("subject"),
  sentimentScore: real("sentiment_score"),
  firstResponseAt: timestamp("first_response_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ticketMessagesTable = pgTable("ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => ticketsTable.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  discordMessageId: text("discord_message_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ratingsTable = pgTable("staff_ratings", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => ticketsTable.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Migrations ────────────────────────────────────────────────────────────────

export async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS guilds (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        is_premium BOOLEAN NOT NULL DEFAULT FALSE,
        premium_since TIMESTAMP,
        premium_user_id TEXT,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        discriminator TEXT,
        avatar TEXT,
        is_premium BOOLEAN NOT NULL DEFAULT FALSE,
        premium_since TIMESTAMP,
        stripe_customer_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ticket_categories (
        id SERIAL PRIMARY KEY,
        guild_id TEXT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        emoji TEXT DEFAULT '🎫',
        support_role_id TEXT,
        log_channel_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        guild_id TEXT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        channel_id TEXT NOT NULL,
        category_id INTEGER REFERENCES ticket_categories(id),
        assigned_to TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        priority TEXT NOT NULL DEFAULT 'medium',
        subject TEXT,
        sentiment_score REAL,
        first_response_at TIMESTAMP,
        closed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ticket_messages (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        author_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        content TEXT NOT NULL,
        discord_message_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS staff_ratings (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅ Migrations abgeschlossen");
  } finally {
    client.release();
  }
}
