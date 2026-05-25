import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

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

export const insertGuildSchema = createInsertSchema(guildsTable).omit({ createdAt: true, updatedAt: true });
export type InsertGuild = z.infer<typeof insertGuildSchema>;
export type Guild = typeof guildsTable.$inferSelect;
