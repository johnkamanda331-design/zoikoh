import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const achievementsTable = pgTable("achievements", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

export type Achievement = typeof achievementsTable.$inferSelect;
export type InsertAchievement = typeof achievementsTable.$inferInsert;
